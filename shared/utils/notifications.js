/**
 * Centralized Notification Utility (Email, SMS & WhatsApp) for SCOMS
 *
 * Each channel follows the same real pattern:
 * 1. If a per-institution credit wallet has been provisioned (Super Admin → Communication →
 *    [Channel] → Allocate Credits), the send is blocked once that institution's balance hits
 *    zero — a real business constraint, not cosmetic. Institutions never allocated a wallet
 *    remain unrestricted, so this never breaks a tenant that predates the wallet feature.
 * 2. Every attempt (sent, failed, or simulated) is logged to the channel's Log table, which
 *    powers the Super Admin usage dashboards — no hardcoded stats.
 * 3. If the real provider isn't configured (no API key / placeholder creds), the send is
 *    simulated (logged, not actually dispatched) rather than silently failing.
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');
const prisma = require('../database/client');

// ============================================================
// Generic per-channel wallet + logging helpers
// ============================================================

/** Decrements an institution's wallet balance by 1, if a wallet exists for it. */
const consumeInstitutionCredit = async (walletModel, institutionId, channelLabel) => {
  if (!institutionId) return { allowed: true };

  const wallet = await walletModel.findUnique({ where: { institutionId } });
  if (!wallet) return { allowed: true }; // no wallet provisioned — unrestricted

  const result = await walletModel.updateMany({
    where: { institutionId, balance: { gt: 0 } },
    data: { balance: { decrement: 1 }, totalUsed: { increment: 1 } },
  });

  if (result.count === 0) {
    return { allowed: false, reason: `Institution ${channelLabel} credit balance exhausted` };
  }
  return { allowed: true };
};

// ============================================================
// Email
// ============================================================

const logEmail = async ({ to, subject, provider, status, institutionId, purpose }) => {
  try {
    await prisma.emailLog.create({
      data: {
        recipientEmail: to || 'unknown',
        subject: subject || '',
        provider,
        status,
        institutionId: institutionId || null,
        purpose: purpose || null,
      },
    });
  } catch (err) {
    logger.error('❌ Failed to write EmailLog record:', err);
  }
};

/**
 * Sends an email notification.
 * Falls back to logging the email to console in development or if SMTP is unconfigured.
 * `institutionId`/`purpose` are optional context used for usage logging/reporting and,
 * when a wallet has been provisioned for that institution, for credit enforcement.
 */
const sendEmailNotification = async ({ to, subject, text, html, institutionId, purpose }) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  const credit = await consumeInstitutionCredit(prisma.institutionEmailWallet, institutionId, 'email');
  if (!credit.allowed) {
    logger.info(`✉️ [EMAIL BLOCKED — ${credit.reason}] To: ${to}`);
    await logEmail({ to, subject, provider: 'Simulated SMTP', status: 'FAILED', institutionId, purpose });
    return false;
  }

  // Check if SMTP is unconfigured or using placeholders
  const isMockMode = !host || !user || !pass || pass === 'your-app-password' || user.includes('example.com') || user.includes('scoms.in');

  if (isMockMode) {
    logger.info(`✉️ [SIMULATED EMAIL SENT]
    To:      ${to}
    Subject: ${subject}
    Message: ${text}
    ---------------------------------------------`);
    await logEmail({ to, subject, provider: 'Simulated SMTP', status: 'SIMULATED', institutionId, purpose });
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"SCOMS Notifications" <${user}>`,
      to,
      subject,
      text,
      html,
    });

    logger.info(`✉️ Email successfully sent to ${to}: MessageId: ${info.messageId}`);
    await logEmail({ to, subject, provider: host, status: 'SENT', institutionId, purpose });
    return true;
  } catch (err) {
    logger.error(`❌ Failed to send email to ${to}:`, err);
    // Graceful fallback to console output so the flow doesn't crash in dev
    logger.info(`✉️ [FALLBACK SIMULATED EMAIL]
    To:      ${to}
    Subject: ${subject}
    Message: ${text}
    ---------------------------------------------`);
    await logEmail({ to, subject, provider: host, status: 'FAILED', institutionId, purpose });
    return false;
  }
};

// ============================================================
// SMS
// ============================================================

const logSms = async ({ to, message, provider, status, institutionId, purpose, sentByStaffId }) => {
  try {
    await prisma.smsLog.create({
      data: {
        recipientPhone: to || 'unknown',
        message,
        provider,
        status,
        institutionId: institutionId || null,
        purpose: purpose || null,
        sentByStaffId: sentByStaffId || null,
      },
    });
  } catch (err) {
    logger.error('❌ Failed to write SmsLog record:', err);
  }
};

/**
 * Sends an SMS notification.
 * Falls back to logging the SMS to console in development or if Gateway is unconfigured.
 * `institutionId`/`purpose` are optional context used for usage logging/reporting and,
 * when a wallet has been provisioned for that institution, for credit enforcement.
 * `sentByStaffId` (optional) attributes a staff-initiated broadcast so that staff member
 * can see it in their own Message History.
 */
const sendSMSNotification = async ({ to, message, institutionId, purpose, sentByStaffId }) => {
  const apiKey = process.env.SMS_API_KEY;

  const credit = await consumeInstitutionCredit(prisma.institutionSmsWallet, institutionId, 'SMS');
  if (!credit.allowed) {
    logger.info(`📱 [SMS BLOCKED — ${credit.reason}] To: ${to}`);
    await logSms({ to, message, provider: 'Simulated Gateway', status: 'FAILED', institutionId, purpose, sentByStaffId });
    return false;
  }

  const isMockMode = !apiKey || apiKey === 'your-sms-api-key' || !to;

  if (isMockMode) {
    logger.info(`📱 [SIMULATED SMS SENT]
    To:      ${to}
    Message: ${message}
    ---------------------------------------------`);
    await logSms({ to, message, provider: 'Simulated Gateway', status: 'SIMULATED', institutionId, purpose, sentByStaffId });
    return true;
  }

  try {
    // Attempting sending SMS via a generic provider (e.g. Fast2SMS API example)
    const response = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=q&message=${encodeURIComponent(message)}&flash=0&numbers=${to}`, {
      method: 'GET',
      headers: {
        'cache-control': 'no-cache'
      }
    });

    const result = await response.json();
    if (response.ok && result.return === true) {
      logger.info(`📱 SMS successfully sent to ${to}`);
      await logSms({ to, message, provider: 'Fast2SMS', status: 'SENT', institutionId, purpose, sentByStaffId });
      return true;
    } else {
      throw new Error(result.message || 'SMS Gateway returned failure');
    }
  } catch (err) {
    logger.error(`❌ Failed to send SMS to ${to}:`, err);
    // Graceful fallback to console output
    logger.info(`📱 [FALLBACK SIMULATED SMS]
    To:      ${to}
    Message: ${message}
    ---------------------------------------------`);
    await logSms({ to, message, provider: 'Fast2SMS', status: 'FAILED', institutionId, purpose, sentByStaffId });
    return false;
  }
};

// ============================================================
// WhatsApp (Meta WhatsApp Business Cloud API)
// ============================================================

const logWhatsapp = async ({ to, message, provider, status, institutionId, purpose }) => {
  try {
    await prisma.whatsappLog.create({
      data: {
        recipientPhone: to || 'unknown',
        message,
        provider,
        status,
        institutionId: institutionId || null,
        purpose: purpose || null,
      },
    });
  } catch (err) {
    logger.error('❌ Failed to write WhatsappLog record:', err);
  }
};

/**
 * Sends a WhatsApp notification via the Meta WhatsApp Business Cloud API.
 * Falls back to logging to console if the Cloud API isn't configured.
 * `institutionId`/`purpose` are optional context used for usage logging/reporting and,
 * when a wallet has been provisioned for that institution, for credit enforcement.
 */
const sendWhatsAppNotification = async ({ to, message, institutionId, purpose }) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const credit = await consumeInstitutionCredit(prisma.institutionWhatsappWallet, institutionId, 'WhatsApp');
  if (!credit.allowed) {
    logger.info(`💬 [WHATSAPP BLOCKED — ${credit.reason}] To: ${to}`);
    await logWhatsapp({ to, message, provider: 'Simulated WABA', status: 'FAILED', institutionId, purpose });
    return false;
  }

  const isMockMode = !accessToken || !phoneNumberId || accessToken === 'your-whatsapp-access-token' || !to;

  if (isMockMode) {
    logger.info(`💬 [SIMULATED WHATSAPP SENT]
    To:      ${to}
    Message: ${message}
    ---------------------------------------------`);
    await logWhatsapp({ to, message, provider: 'Simulated WABA', status: 'SIMULATED', institutionId, purpose });
    return true;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    });

    const result = await response.json();
    if (response.ok && result.messages) {
      logger.info(`💬 WhatsApp message successfully sent to ${to}`);
      await logWhatsapp({ to, message, provider: 'Meta WABA', status: 'SENT', institutionId, purpose });
      return true;
    } else {
      throw new Error(result.error?.message || 'WhatsApp Cloud API returned failure');
    }
  } catch (err) {
    logger.error(`❌ Failed to send WhatsApp message to ${to}:`, err);
    logger.info(`💬 [FALLBACK SIMULATED WHATSAPP]
    To:      ${to}
    Message: ${message}
    ---------------------------------------------`);
    await logWhatsapp({ to, message, provider: 'Meta WABA', status: 'FAILED', institutionId, purpose });
    return false;
  }
};

module.exports = {
  sendEmailNotification,
  sendSMSNotification,
  sendWhatsAppNotification,
};

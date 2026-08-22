/**
 * Centralized Notification Utility (Email & SMS) for SCOMS
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Sends an email notification.
 * Falls back to logging the email to console in development or if SMTP is unconfigured.
 */
const sendEmailNotification = async ({ to, subject, text, html }) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // Check if SMTP is unconfigured or using placeholders
  const isMockMode = !host || !user || !pass || pass === 'your-app-password' || user.includes('example.com') || user.includes('scoms.in');

  if (isMockMode) {
    logger.info(`✉️ [SIMULATED EMAIL SENT]
    To:      ${to}
    Subject: ${subject}
    Message: ${text}
    ---------------------------------------------`);
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
    return true;
  } catch (err) {
    logger.error(`❌ Failed to send email to ${to}:`, err);
    // Graceful fallback to console output so the flow doesn't crash in dev
    logger.info(`✉️ [FALLBACK SIMULATED EMAIL]
    To:      ${to}
    Subject: ${subject}
    Message: ${text}
    ---------------------------------------------`);
    return false;
  }
};

/**
 * Sends an SMS notification.
 * Falls back to logging the SMS to console in development or if Gateway is unconfigured.
 */
const sendSMSNotification = async ({ to, message }) => {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'SCOMSM';

  const isMockMode = !apiKey || apiKey === 'your-sms-api-key' || !to;

  if (isMockMode) {
    logger.info(`📱 [SIMULATED SMS SENT]
    To:      ${to}
    Message: ${message}
    ---------------------------------------------`);
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
    return false;
  }
};

module.exports = {
  sendEmailNotification,
  sendSMSNotification,
};

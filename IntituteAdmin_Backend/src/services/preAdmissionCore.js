/**
 * Pre-Admission core — shared by the public website API (publicPreAdmissionController) and
 * the Institute Admin's manual entry (preAdmissionController).
 *
 * Application numbers: CODE/PADM/YEAR/NNNNN. The next one is the highest number already used
 * this year + 1 (not "count + 1", which re-issued an existing number as soon as any
 * application was deleted, and made every later submission fail).
 *
 * Each create runs in a short transaction holding a per-institution lock, so two submissions
 * arriving together are handled one after the other: the second sees the first — it can't
 * take the same number, and an identical resend is recognised as a duplicate. If a clash
 * still happens (a writer outside this code), the whole step is simply retried.
 *
 * Duplicates — the existing application is returned instead of a new one when:
 *   - the same referenceNumber (the school's own id for the applicant) was sent before, or
 *   - the same student name + parent phone arrived within the last DUPLICATE_WINDOW_MIN
 *     minutes (a double-click, a browser resend, a website retrying after a timeout).
 */
const { prisma, generatePreAdmissionNumber } = require('../../../shared');

const MAX_ATTEMPTS = 5;
const DUPLICATE_WINDOW_MIN = 10;

/** "CODE/PADM/2026/" for this institution and year. */
const numberPrefix = (code) => {
  const sample = generatePreAdmissionNumber(code || 'SCOMS', 1);
  return sample.slice(0, sample.lastIndexOf('/') + 1);
};

const nextApplicationNumber = async (db, institutionId, code) => {
  const prefix = numberPrefix(code);
  const latest = await db.preAdmissionApplication.findFirst({
    where: { institutionId, applicationNumber: { startsWith: prefix } },
    orderBy: { applicationNumber: 'desc' },
    select: { applicationNumber: true },
  });
  const last = latest ? parseInt(latest.applicationNumber.slice(prefix.length), 10) || 0 : 0;
  return generatePreAdmissionNumber(code || 'SCOMS', last + 1);
};

const isNumberClash = (err) => err?.code === 'P2002' && String(err?.meta?.target || '').includes('applicationNumber');

/** An earlier application this submission repeats, or null. */
const findDuplicate = async (db, institutionId, data) => {
  if (data.referenceNumber) {
    const byRef = await db.preAdmissionApplication.findFirst({
      where: { institutionId, referenceNumber: data.referenceNumber },
      orderBy: { createdAt: 'asc' },
    });
    if (byRef) return byRef;
  }
  return db.preAdmissionApplication.findFirst({
    where: {
      institutionId,
      parentPhone: data.parentPhone,
      studentFirstName: { equals: data.studentFirstName, mode: 'insensitive' },
      studentLastName: data.studentLastName ? { equals: data.studentLastName, mode: 'insensitive' } : null,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MIN * 60 * 1000) },
    },
    orderBy: { createdAt: 'asc' },
  });
};

/**
 * Creates an application with the next free number; `data` is everything except the number.
 * Returns { application, duplicate } — duplicate: true means an earlier matching application
 * was returned and nothing new was stored.
 */
const createApplicationWithNumber = async ({ institutionId, code, data }) => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        // one submission at a time per institution (released when this transaction ends)
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pre-admission:${institutionId}`}))`;
        const existing = await findDuplicate(tx, institutionId, data);
        if (existing) return { application: existing, duplicate: true };
        const applicationNumber = await nextApplicationNumber(tx, institutionId, code);
        const application = await tx.preAdmissionApplication.create({ data: { ...data, institutionId, applicationNumber } });
        return { application, duplicate: false };
      }, { maxWait: 10000, timeout: 15000 });
    } catch (err) {
      if (!isNumberClash(err) || attempt === MAX_ATTEMPTS) throw err;
      await new Promise((r) => setTimeout(r, 5 + Math.floor(Math.random() * 20)));
    }
  }
  return null;
};

module.exports = { createApplicationWithNumber, nextApplicationNumber, numberPrefix, DUPLICATE_WINDOW_MIN };

/**
 * Institute Admin — Biometric / device attendance import (CSV or Excel export from the
 * attendance machine). Each row is one student's punch for one day; rows are matched by
 * admission number and written as that class's daily attendance (periodNumber 0, no
 * subject — the same session the class teacher records in the Staff portal).
 *
 *   mode=preview (default) -> parse + validate only, nothing is written
 *   mode=commit            -> write; existing daily sessions are updated, not duplicated
 *   markAbsent=true        -> students of an imported class/date with no row are marked ABSENT
 */
const { prisma, sendSuccess, ValidationError, BusinessRuleError, attendanceRules } = require('../../../shared');
const ExcelJS = require('exceljs');

const DAILY_PERIOD = 0;
const STATUS_ALIASES = {
  P: 'PRESENT', PRESENT: 'PRESENT', IN: 'PRESENT',
  A: 'ABSENT', AB: 'ABSENT', ABSENT: 'ABSENT',
  LATE: 'LATE', LT: 'LATE',
  LEAVE: 'LEAVE', LV: 'LEAVE',
  HD: 'HALF_DAY', HALF_DAY: 'HALF_DAY', 'HALF DAY': 'HALF_DAY',
  OD: 'ON_DUTY', ON_DUTY: 'ON_DUTY', 'ON DUTY': 'ON_DUTY',
};

/** Minimal CSV reader (quoted fields, commas inside quotes). Kept local so CSV dates stay
 * plain text — ExcelJS's CSV reader converts them to Date objects in server-local time. */
const parseCsv = (text) =>
  text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const cells = [];
      let cur = '';
      let quoted = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (quoted) {
          if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; } else if (ch === '"') quoted = false;
          else cur += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === ',') { cells.push(cur); cur = ''; } else cur += ch;
      }
      cells.push(cur);
      return cells.map((c) => c.trim());
    });

const readRows = async (file) => {
  if (file.originalname.toLowerCase().endsWith('.csv')) return parseCsv(file.buffer.toString('utf8'));
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ValidationError('The uploaded file has no readable sheet');
  const rows = [];
  sheet.eachRow((row) => {
    // Array.from — row.values is sparse with index 0 always empty
    const values = Array.from(row.values).slice(1).map((v) => (v && typeof v === 'object' && !(v instanceof Date) ? v.text ?? v.result ?? '' : v));
    rows.push(values);
  });
  return rows;
};

/** -> 'YYYY-MM-DD' or null. Accepts Excel dates, ISO (2026-11-05) and Indian DD-MM-YYYY / DD/MM/YYYY. */
const toDateKey = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const s = String(value ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  let y; let mo; let d;
  if (m) [, y, mo, d] = m;
  else {
    m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (!m) return null;
    [, d, mo, y] = m;
  }
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  if (date.getUTCMonth() !== Number(mo) - 1 || date.getUTCDate() !== Number(d)) return null;
  return date.toISOString().slice(0, 10);
};

/** Attendance sessions are recorded under a Staff profile. Onboarding gives every institute
 * admin one (designation "Institute Admin"); an older/seeded admin without it gets the same
 * profile created here on first import. */
const resolveAdminStaffId = async (req) => {
  if (req.user.staffId) return req.user.staffId;
  const staff = await prisma.staff.findFirst({ where: { userId: req.user.id, institutionId: req.institutionId }, select: { id: true } });
  if (staff) return staff.id;
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, userCode: true, institutionId: true } });
  if (!user || user.institutionId !== req.institutionId) throw new BusinessRuleError('Attendance can only be imported by a user of this institution');
  const created = await prisma.staff.create({
    data: { userId: user.id, institutionId: req.institutionId, employeeCode: user.userCode || `ADM-${user.id.slice(0, 8).toUpperCase()}`, designation: 'Institute Admin' },
    select: { id: true },
  });
  return created.id;
};

const importBiometric = async (req, res, next) => {
  try {
    if (!req.file) throw new ValidationError('Upload the CSV or Excel file exported from the attendance device');
    const commit = (req.body.mode || req.query.mode) === 'commit';
    const markAbsent = String(req.body.markAbsent ?? req.query.markAbsent) === 'true';

    const table = await readRows(req.file);
    if (table.length < 2) throw new ValidationError('The file has no data rows');
    const header = table[0].map((h) => String(h ?? '').trim().toLowerCase());
    const admCol = header.findIndex((h) => h.includes('admission') || h === 'adm no' || h === 'emp id' || h === 'user id' || h === 'id');
    const dateCol = header.findIndex((h) => h.includes('date'));
    const statusCol = header.findIndex((h) => h.includes('status'));
    const inCol = header.findIndex((h) => h.includes('in time') || h === 'in' || h.includes('punch'));
    if (admCol === -1 || dateCol === -1) {
      throw new ValidationError('The file must have "Admission Number" and "Date" columns ("Status" and "In Time" are optional)');
    }

    const students = await prisma.student.findMany({
      where: { institutionId: req.institutionId, status: 'ACTIVE', deletedAt: null, sectionId: { not: null } },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true, sectionId: true },
    });
    const byAdmission = new Map(students.map((s) => [String(s.admissionNumber).trim().toLowerCase(), s]));

    const errors = [];
    const entries = new Map(); // `${sectionId}|${date}` -> Map(studentId -> { status, remarks })
    let valid = 0;
    table.slice(1).forEach((row, i) => {
      const line = i + 2;
      const adm = String(row[admCol] ?? '').trim();
      if (!adm) return;
      const student = byAdmission.get(adm.toLowerCase());
      if (!student) { errors.push({ row: line, admissionNumber: adm, error: 'No active student with this admission number (or not placed in a class)' }); return; }
      const date = toDateKey(row[dateCol]);
      if (!date) { errors.push({ row: line, admissionNumber: adm, error: `Unreadable date "${row[dateCol] ?? ''}" — use YYYY-MM-DD or DD-MM-YYYY` }); return; }
      let status = 'PRESENT'; // a punch on the device means the student was in
      if (statusCol !== -1 && String(row[statusCol] ?? '').trim()) {
        status = STATUS_ALIASES[String(row[statusCol]).trim().toUpperCase()];
        if (!status) { errors.push({ row: line, admissionNumber: adm, error: `Unknown status "${row[statusCol]}" — use P, A, LATE, LEAVE, HD or OD` }); return; }
      }
      const inTime = inCol !== -1 ? String(row[inCol] ?? '').trim() : '';
      const key = `${student.sectionId}|${date}`;
      if (!entries.has(key)) entries.set(key, new Map());
      entries.get(key).set(student.id, { status, remarks: inTime ? `Biometric in: ${inTime}` : 'Biometric import' });
      valid += 1;
    });

    // Lock check per date, and absentees for the imported class/days
    const lockDays = await attendanceRules.getLockDays(req.institutionId);
    const sessions = [];
    for (const [key, records] of entries) {
      const [sectionId, date] = key.split('|');
      if (attendanceRules.isDateLocked(new Date(date), lockDays)) {
        errors.push({ row: null, admissionNumber: null, error: `${date}: attendance older than ${lockDays} day(s) is locked — skipped` });
        continue;
      }
      if (markAbsent) {
        students.filter((s) => s.sectionId === sectionId && !records.has(s.id))
          .forEach((s) => records.set(s.id, { status: 'ABSENT', remarks: 'No biometric punch' }));
      }
      sessions.push({ sectionId, date, records });
    }

    const sectionIds = [...new Set(sessions.map((s) => s.sectionId))];
    const sections = await prisma.section.findMany({
      where: { id: { in: sectionIds } },
      select: { id: true, name: true, semester: { select: { course: { select: { name: true } } } } },
    });
    const sectionName = Object.fromEntries(sections.map((s) => [s.id, `${s.semester?.course?.name || ''} ${s.name}`.trim()]));
    const summary = sessions
      .map((s) => {
        const statuses = [...s.records.values()].map((r) => r.status);
        return {
          sectionId: s.sectionId, className: sectionName[s.sectionId], date: s.date,
          present: statuses.filter((st) => attendanceRules.isAttended(st)).length,
          absent: statuses.filter((st) => st === 'ABSENT').length,
          other: statuses.filter((st) => !attendanceRules.isAttended(st) && st !== 'ABSENT').length,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.className).localeCompare(String(b.className)));

    if (!commit) {
      return sendSuccess(res, { committed: false, validRows: valid, sessions: summary, errors }, 'Preview ready — nothing has been saved yet');
    }
    if (!sessions.length) throw new ValidationError('Nothing to import — fix the errors listed and upload again');

    const takenById = await resolveAdminStaffId(req);
    let created = 0;
    let updated = 0;
    for (const s of sessions) {
      const date = new Date(s.date);
      const existing = await prisma.attendanceSession.findFirst({
        where: { institutionId: req.institutionId, sectionId: s.sectionId, date, periodNumber: DAILY_PERIOD },
        select: { id: true },
      });
      const session = existing || await prisma.attendanceSession.create({
        data: { institutionId: req.institutionId, sectionId: s.sectionId, subjectId: null, takenById, date, periodNumber: DAILY_PERIOD },
        select: { id: true },
      });
      if (existing) updated += 1; else created += 1;
      await prisma.$transaction(
        [...s.records].map(([studentId, r]) =>
          prisma.attendanceRecord.upsert({
            where: { sessionId_studentId: { sessionId: session.id, studentId } },
            create: { sessionId: session.id, studentId, status: r.status, remarks: r.remarks },
            update: { status: r.status, remarks: r.remarks },
          })
        )
      );
    }
    return sendSuccess(
      res,
      { committed: true, validRows: valid, sessionsCreated: created, sessionsUpdated: updated, sessions: summary, errors },
      `Imported ${valid} punch(es) into ${created + updated} class-day attendance sheet(s)`
    );
  } catch (err) {
    next(err);
  }
};

/** Sample file the admin can hand to whoever exports from the device. */
const getTemplate = async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const csv = ['Admission Number,Date,In Time,Status', `ADM001,${today},08:52,P`, `ADM002,${today},09:20,LATE`, `ADM003,${today},,A`].join('\r\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="biometric_import_template.csv"');
  res.send(csv);
};

module.exports = { importBiometric, getTemplate, toDateKey, parseCsv };

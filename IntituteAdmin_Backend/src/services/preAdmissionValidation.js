/**
 * Pre-Admission input checks — shared by the public website API and the Institute Admin's
 * manual entry, so an application is stored the same clean way whichever door it came in by.
 *
 * Every problem is collected (not just the first) and returned together as one 400, with an
 * `errors: [{ field, message }]` list a school website can show next to each input.
 *
 * Custom fields: only APPROVED ones are accepted, each checked by its type —
 *   TEXT / TEXTAREA  text, length-limited
 *   NUMBER           a number (stored as a number)
 *   DATE             a real date (stored as YYYY-MM-DD)
 *   EMAIL / PHONE    same rules as the standard email / phone
 *   SELECT           one of the field's options (matched ignoring case, stored as the option)
 *   CHECKBOX         yes/no (true, "on", "yes", "1" …); a required checkbox must be ticked
 * Any field added later works automatically — the rules come from its type.
 */
const { ValidationError } = require('../../../shared');

const MAX_TEXT = 200;
const MAX_LONG_TEXT = 2000;
const MAX_CUSTOM_TEXT = 500;
const MAX_CUSTOM_TEXTAREA = 5000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** "+91 98765-43210" → "+919876543210"; null when not a phone number (10–15 digits). */
const normalizePhone = (v) => {
  const s = String(v).trim().replace(/[\s\-().]/g, '');
  return /^\+?\d{10,15}$/.test(s) ? s : null;
};

const normalizeEmail = (v) => {
  const s = String(v).trim().toLowerCase();
  return s.length <= 254 && EMAIL_RE.test(s) ? s : null;
};

/** A real calendar date → Date at UTC midnight; rejects "2026-02-31", "abc", etc. */
const parseDate = (v) => {
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : null;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const GENDERS = { male: 'MALE', m: 'MALE', boy: 'MALE', female: 'FEMALE', f: 'FEMALE', girl: 'FEMALE', other: 'OTHER', o: 'OTHER' };

const TRUE_WORDS = ['true', 'on', 'yes', 'y', '1', 'checked'];
const FALSE_WORDS = ['false', 'off', 'no', 'n', '0', ''];

/** Is this custom field shown, given what else was filled in? (visibilityCondition) */
const isVisible = (field, valuesByKey) => {
  const c = field.visibilityCondition;
  if (!c || !c.dependsOnFieldKey) return true;
  const other = valuesByKey(c.dependsOnFieldKey);
  const equal = String(other ?? '').toLowerCase() === String(c.value ?? '').toLowerCase();
  return c.operator === 'not_equals' ? !equal : equal;
};

/**
 * Checks + cleans the standard fields of a submission.
 * Returns { data, errors } — data holds only the standard columns, ready for Prisma.
 */
const checkStandardFields = (body) => {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const text = (key, max = MAX_TEXT) => {
    const v = body[key];
    if (isBlank(v)) return null;
    if (typeof v !== 'string' && typeof v !== 'number') { add(key, `${key} must be text`); return null; }
    const s = String(v).trim();
    if (s.length > max) { add(key, `${key} is too long (max ${max} characters)`); return null; }
    return s;
  };

  const data = {
    referenceNumber: text('referenceNumber', 100),
    studentFirstName: text('studentFirstName'),
    studentLastName: text('studentLastName'),
    dob: null,
    gender: null,
    classAppliedFor: text('classAppliedFor', 100),
    courseApplied: text('courseApplied', 100),
    academicYear: text('academicYear', 20),
    parentName: text('parentName'),
    parentPhone: null,
    parentEmail: null,
    address: text('address', MAX_LONG_TEXT),
    city: text('city', 100),
    state: text('state', 100),
    pincode: text('pincode', 10),
    previousSchool: text('previousSchool'),
    previousClass: text('previousClass', 100),
  };

  if (!data.studentFirstName && !errors.some((e) => e.field === 'studentFirstName')) add('studentFirstName', 'studentFirstName is required');

  if (isBlank(body.parentPhone)) add('parentPhone', 'parentPhone is required');
  else {
    data.parentPhone = normalizePhone(body.parentPhone);
    if (!data.parentPhone) add('parentPhone', 'parentPhone must be a valid phone number (10–15 digits)');
  }

  if (!isBlank(body.parentEmail)) {
    data.parentEmail = normalizeEmail(body.parentEmail);
    if (!data.parentEmail) add('parentEmail', 'parentEmail must be a valid email address');
  }

  if (!isBlank(body.dob)) {
    const d = parseDate(body.dob);
    const now = new Date();
    if (!d) add('dob', 'dob must be a valid date (YYYY-MM-DD)');
    else if (d > now) add('dob', 'dob cannot be in the future');
    else if (now.getFullYear() - d.getFullYear() > 100) add('dob', 'dob is not a realistic date of birth');
    else data.dob = d;
  }

  if (!isBlank(body.gender)) {
    data.gender = GENDERS[String(body.gender).trim().toLowerCase()] || null;
    if (!data.gender) add('gender', 'gender must be MALE, FEMALE or OTHER');
  }

  if (data.pincode && !/^[A-Za-z0-9 -]{3,10}$/.test(data.pincode)) add('pincode', 'pincode must be a valid postal code');

  return { data, errors };
};

/** One custom field value → its clean stored form, or { error }. */
const cleanCustomValue = (field, raw) => {
  const label = field.label || field.fieldKey;
  const scalar = Array.isArray(raw) ? raw[raw.length - 1] : raw; // a form may repeat a key
  if (typeof scalar === 'object' && scalar !== null) return { error: `${label} has an invalid value` };
  const s = String(scalar).trim();
  switch (field.fieldType) {
    case 'NUMBER': {
      const n = Number(s);
      return s !== '' && Number.isFinite(n) ? { value: n } : { error: `${label} must be a number` };
    }
    case 'DATE': {
      const d = parseDate(s);
      return d ? { value: d.toISOString().slice(0, 10) } : { error: `${label} must be a valid date (YYYY-MM-DD)` };
    }
    case 'EMAIL': {
      const e = normalizeEmail(s);
      return e ? { value: e } : { error: `${label} must be a valid email address` };
    }
    case 'PHONE': {
      const p = normalizePhone(s);
      return p ? { value: p } : { error: `${label} must be a valid phone number (10–15 digits)` };
    }
    case 'SELECT': {
      const options = Array.isArray(field.options) ? field.options.map(String) : [];
      const match = options.find((o) => o.toLowerCase() === s.toLowerCase());
      if (match !== undefined) return { value: match };
      return { error: `${label} must be one of: ${options.join(', ')}` };
    }
    case 'CHECKBOX': {
      const w = s.toLowerCase();
      if (scalar === true || TRUE_WORDS.includes(w)) return { value: true };
      if (scalar === false || FALSE_WORDS.includes(w)) return { value: false };
      return { error: `${label} must be yes or no` };
    }
    case 'TEXTAREA':
      return s.length <= MAX_CUSTOM_TEXTAREA ? { value: s } : { error: `${label} is too long (max ${MAX_CUSTOM_TEXTAREA} characters)` };
    default: // TEXT and any future plain-text type
      return s.length <= MAX_CUSTOM_TEXT ? { value: s } : { error: `${label} is too long (max ${MAX_CUSTOM_TEXT} characters)` };
  }
};

/**
 * Checks + cleans custom field values against the institution's APPROVED fields.
 * `getValue(key)` reads a field's raw value however it was sent. Unknown keys are ignored.
 * `enforceRequired` — the website form must fill required fields; staff logging a walk-in
 * enquiry may leave them for later (values given are still type-checked).
 */
const checkCustomFields = (approvedFields, getValue, { enforceRequired = true } = {}) => {
  const errors = [];
  const values = {};
  for (const f of approvedFields) {
    const raw = getValue(f.fieldKey);
    const blank = isBlank(raw) || (Array.isArray(raw) && raw.length === 0);
    const required = enforceRequired && f.required && !f.hidden && isVisible(f, getValue);
    if (blank) {
      if (required) errors.push({ field: f.fieldKey, message: `${f.label} is required` });
      continue;
    }
    const { value, error } = cleanCustomValue(f, raw);
    if (error) { errors.push({ field: f.fieldKey, message: error }); continue; }
    if (f.fieldType === 'CHECKBOX' && required && value !== true) {
      errors.push({ field: f.fieldKey, message: `${f.label} must be ticked` });
      continue;
    }
    values[f.fieldKey] = value;
  }
  return { values, errors };
};

/** Throws one ValidationError listing every problem; the message names the first one. */
const throwIfErrors = (errors) => {
  if (errors.length === 0) return;
  const more = errors.length > 1 ? ` (and ${errors.length - 1} more)` : '';
  throw new ValidationError(`${errors[0].message}${more}`, errors);
};

/** Fields the custom-field checks need, for a Prisma select. */
const CUSTOM_FIELD_SELECT = { fieldKey: true, label: true, fieldType: true, options: true, required: true, hidden: true, visibilityCondition: true };

module.exports = { checkStandardFields, checkCustomFields, throwIfErrors, normalizePhone, CUSTOM_FIELD_SELECT };

/**
 * Formatted Unique Identifier Generators for Indian Schools & Colleges
 */

/** Every generated ID embeds the institution's own code so it's traceable to that
 * institution on sight, never just a generic sequence indistinguishable across tenants. */
const generateAdmissionNumber = (instCode = 'SCOMS', count = 1) => {
  const year = new Date().getFullYear();
  const seq = String(count).padStart(6, '0');
  return `${instCode}/STU/${year}/${seq}`;
};

const generateEmployeeCode = (instCode = 'SCOMS', count = 1) => {
  const year = new Date().getFullYear();
  const seq = String(count).padStart(4, '0');
  return `${instCode}/EMP/${year}/${seq}`;
};

const generateReceiptNumber = (instCode = 'SCOMS', count = 1) => {
  const year = new Date().getFullYear();
  const seq = String(count).padStart(6, '0');
  return `${instCode}/${year}/${seq}`;
};

const generateChallanNumber = (instCode = 'SCOMS', count = 1) => {
  const year = new Date().getFullYear();
  const seq = String(count).padStart(6, '0');
  return `CHL/${instCode}/${year}/${seq}`;
};

const generateCertificateNumber = (certType = 'TC', count = 1) => {
  const year = new Date().getFullYear();
  const seq = String(count).padStart(5, '0');
  return `CERT/${certType}/${year}/${seq}`;
};

const generateGatePassNumber = (count = 1) => {
  const seq = String(count).padStart(5, '0');
  return `GP-${seq}`;
};

/** Short, human-readable code per platform role — used only inside generateUserCode. */
const USER_ROLE_CODE = {
  SUPER_ADMIN: 'SA',
  PLATFORM_ADMIN: 'PA',
  INSTITUTE_ADMIN: 'ADM',
  PRINCIPAL: 'PRN',
  VICE_PRINCIPAL: 'VPR',
  HOD: 'STF',
  TEACHER: 'STF',
  STAFF: 'STF',
  ACCOUNTANT: 'ACC',
  LIBRARIAN: 'LIB',
  TRANSPORT_MANAGER: 'TRN',
  HOSTEL_WARDEN: 'HST',
  EXAM_ADMIN: 'EXM',
  PLACEMENT_OFFICER: 'PLC',
  STUDENT: 'STU',
  PARENT: 'PAR',
};

/** A professional, human-readable identity for every platform user — {SCOPE}-{ROLE}-{seq}.
 * SCOPE is the institution's own code for tenant-scoped roles, or "SCOMS" for platform-level
 * roles with no institution (Super Admin, Platform Admin). Student/Staff already generate
 * their own version of this (admissionNumber / employeeCode) — callers reuse that value
 * directly rather than calling this a second time, so one person never carries two IDs. */
const generateUserCode = (instCode, role, count = 1) => {
  const roleCode = USER_ROLE_CODE[role] || 'USR';
  const scope = instCode || 'SCOMS';
  const seq = String(count).padStart(5, '0');
  return `${scope}-${roleCode}-${seq}`;
};

module.exports = {
  generateAdmissionNumber,
  generateEmployeeCode,
  generateReceiptNumber,
  generateChallanNumber,
  generateCertificateNumber,
  generateGatePassNumber,
  generateUserCode,
};

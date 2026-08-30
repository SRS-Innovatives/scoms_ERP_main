/**
 * Formatted Unique Identifier Generators for Indian Schools & Colleges
 */

const generateAdmissionNumber = (prefix = 'ADM', count = 1) => {
  const year = new Date().getFullYear();
  const seq = String(count).padStart(5, '0');
  return `${prefix}/${year}/${seq}`;
};

const generateEmployeeCode = (prefix = 'EMP', count = 1) => {
  const year = new Date().getFullYear();
  const seq = String(count).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
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

module.exports = {
  generateAdmissionNumber,
  generateEmployeeCode,
  generateReceiptNumber,
  generateChallanNumber,
  generateCertificateNumber,
  generateGatePassNumber,
};

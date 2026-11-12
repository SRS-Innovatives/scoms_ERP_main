/**
 * Certificate Generator Engine — same three-layer shape as the Report Engine.
 *
 * Loads a certificate template's definition (Layer 1 catalog + Layer 2 institution
 * customization — wording, header, signatory, branding toggles), resolves real student/
 * parent/institution data plus any manually-collected fields into the wording's
 * {{placeholders}}, and issues a real Certificate ledger row with the rendered text
 * snapshotted (so a later template edit never rewrites history).
 */
const prisma = require('../database/client');
const { NotFoundError, ValidationError, AuthorizationError } = require('../errors/customErrors');
const { generateCertificateNumber } = require('../utils/idGenerators');
const { renderTemplate } = require('./placeholderRenderer');
const { localizeAcademicLabels } = require('../academic/institutionAcademic');

/** Loads a certificate template's full definition, merged with this institution's own
 * customization — never exposes a template the institution doesn't have access to. */
const getTemplateDefinition = async (code, institutionId) => {
  const template = await prisma.certificateTemplate.findUnique({
    where: { code },
    include: { fields: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!template || template.status === 'ARCHIVED') throw new NotFoundError('Certificate template not found');

  const config = await prisma.institutionCertificateTemplate.findUnique({
    where: { institutionId_templateId: { institutionId, templateId: template.id } },
  });

  const enabled = template.visibility === 'SYSTEM' ? (config ? config.enabled : true) : !!config?.enabled;
  if (!enabled) throw new AuthorizationError('This certificate type is not enabled for your institution');

  // Seeded field labels are generic ("Course") — shown in the institution's own terms
  const fields = await localizeAcademicLabels(template.fields, institutionId);

  return {
    code: template.code,
    name: template.name,
    description: template.description,
    category: template.category,
    icon: template.icon,
    headerTitle: config?.customHeaderTitle || template.headerTitle,
    bodyTemplate: config?.customBodyTemplate || template.bodyTemplate,
    footerNote: config?.customFooterNote ?? template.footerNote,
    showLogo: config?.showLogo ?? true,
    showSeal: config?.showSeal ?? true,
    showSignature: config?.showSignature ?? true,
    signatoryName: config?.signatoryName || null,
    signatoryDesignation: config?.signatoryDesignation || null,
    issuePlace: config?.issuePlace || null,
    fields: fields.map((f) => ({
      fieldKey: f.fieldKey,
      label: f.label,
      source: f.source,
      inputType: f.inputType,
      required: f.required,
      options: f.options,
      defaultValue: f.defaultValue,
    })),
    manualFields: fields
      .filter((f) => f.source === 'MANUAL')
      .map((f) => ({ fieldKey: f.fieldKey, label: f.label, inputType: f.inputType, required: f.required, options: f.options, defaultValue: f.defaultValue })),
    _internal: { templateId: template.id },
  };
};

/** CertificateRequest.type (what a student asks for) → CertificateTemplate.code / Certificate.type. */
const REQUEST_TYPE_TO_TEMPLATE_CODE = {
  BONAFIDE: 'BONAFIDE',
  TRANSFER: 'TC',
  CONDUCT: 'CONDUCT',
  COURSE_COMPLETION: 'COMPLETION',
};

/** The certificate types a student of this institution can actually request right now —
 * only templates that exist, aren't archived and are enabled for the institution (same
 * rule as getTemplateDefinition), named the way the platform/institution names them. */
const getRequestableCertificateTypes = async (institutionId) => {
  const templates = await prisma.certificateTemplate.findMany({
    where: { code: { in: Object.values(REQUEST_TYPE_TO_TEMPLATE_CODE) }, status: { not: 'ARCHIVED' } },
    select: { id: true, code: true, name: true, description: true, visibility: true },
  });
  const configs = await prisma.institutionCertificateTemplate.findMany({
    where: { institutionId, templateId: { in: templates.map((t) => t.id) } },
    select: { templateId: true, enabled: true },
  });
  const configByTemplate = new Map(configs.map((c) => [c.templateId, c]));

  return Object.entries(REQUEST_TYPE_TO_TEMPLATE_CODE)
    .map(([requestType, code]) => {
      const template = templates.find((t) => t.code === code);
      if (!template) return null;
      const config = configByTemplate.get(template.id);
      const enabled = template.visibility === 'SYSTEM' ? (config ? config.enabled : true) : !!config?.enabled;
      return enabled ? { value: requestType, label: template.name, description: template.description || null } : null;
    })
    .filter(Boolean);
};

/** Resolves every non-MANUAL placeholder from real student/parent/institution records. */
const buildContext = ({ student, institution, manualFields, certificateNo }) => {
  const parentLink = student.parents?.[0]?.parent;
  const now = new Date();

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    rollNo: student.rollNumber || '—',
    regNo: student.registerNumber || student.admissionNumber,
    admissionNumber: student.admissionNumber,
    fatherName: parentLink?.fatherName || '—',
    motherName: parentLink?.motherName || '—',
    course: student.course?.name || '—',
    department: student.department?.name || '—',
    section: student.section?.name || '—',
    academicYear: student.section?.semester?.academicYear?.yearName || '—',
    yearSem: student.section?.semester?.name || '—',
    dob: student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '—',
    dateOfAdmission: student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB') : '—',
    issueDate: now.toLocaleDateString('en-GB'),
    certificateNo,
    institutionName: institution?.name || 'SCOMS',
    ...manualFields,
  };
};

/** Runs a certificate end-to-end: definition → validate manual fields → resolve real data →
 * render wording → issue the ledger row. */
const renderCertificate = async ({ code, institutionId, studentId, manualFields = {} }) => {
  const definition = await getTemplateDefinition(code, institutionId);

  const missing = definition.manualFields.filter((f) => f.required && !manualFields[f.fieldKey]);
  if (missing.length > 0) {
    throw new ValidationError(`${missing.map((f) => f.label).join(', ')} ${missing.length > 1 ? 'are' : 'is'} required`);
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, institutionId },
    include: {
      course: { select: { name: true } },
      department: { select: { name: true } },
      section: { select: { name: true, semester: { select: { name: true, academicYear: { select: { yearName: true } } } } } },
      parents: { include: { parent: true } },
    },
  });
  if (!student) throw new NotFoundError('Student not found or access denied');

  const institution = await prisma.institution.findUnique({ where: { id: institutionId }, select: { name: true, code: true } });

  const count = await prisma.certificate.count({ where: { institutionId } });
  const certificateNo = generateCertificateNumber(code, count + 1);

  const context = buildContext({ student, institution, manualFields, certificateNo });
  const renderedBody = renderTemplate(definition.bodyTemplate, context);

  const certificate = await prisma.certificate.create({
    data: {
      institutionId,
      studentId,
      templateId: definition._internal.templateId,
      type: code,
      certificateNo,
      title: definition.headerTitle,
      issuedToName: context.studentName,
      details: manualFields,
      renderedBody,
    },
  });

  return {
    certificate,
    headerTitle: definition.headerTitle,
    footerNote: definition.footerNote,
    renderedBody,
    showLogo: definition.showLogo,
    showSeal: definition.showSeal,
    showSignature: definition.showSignature,
    signatoryName: definition.signatoryName,
    signatoryDesignation: definition.signatoryDesignation,
    issuePlace: definition.issuePlace,
    context,
  };
};

module.exports = { getTemplateDefinition, renderCertificate, REQUEST_TYPE_TO_TEMPLATE_CODE, getRequestableCertificateTypes };

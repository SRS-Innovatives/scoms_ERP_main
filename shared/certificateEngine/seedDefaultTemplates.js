/**
 * Seeds the 5 default SCOMS certificate templates (Layer 1 catalog + their fields), then
 * makes sure every existing institution has a Layer 2 InstitutionCertificateTemplate
 * configuration row for each — enabled by default. Fully idempotent: safe to re-run.
 *
 * Run directly:  node shared/certificateEngine/seedDefaultTemplates.js
 */
const prisma = require('../database/client');

const DEFAULT_TEMPLATES = [
  {
    code: 'BONAFIDE',
    name: 'Bonafide Certificate',
    description: 'Confirms a student is a genuine, currently-enrolled student of the institution.',
    category: 'Academic',
    icon: 'FileCheck',
    headerTitle: 'BONAFIDE CERTIFICATE',
    footerNote: 'This certificate is issued on request for official / passport / education loan / employment purposes.',
    bodyTemplate:
      'This is to certify that Mr. / Ms. {{studentName}} (Register No: {{regNo}}), Son / Daughter of Shri {{fatherName}}, is a bona fide student of this institution, currently studying in {{yearSem}} of {{course}} during the academic year {{academicYear}}.',
    fields: [
      { fieldKey: 'studentName', label: 'Student Name', source: 'STUDENT', sortOrder: 1 },
      { fieldKey: 'regNo', label: 'Register Number', source: 'STUDENT', sortOrder: 2 },
      { fieldKey: 'fatherName', label: "Father's Name", source: 'PARENT', sortOrder: 3 },
      { fieldKey: 'yearSem', label: 'Year / Semester', source: 'STUDENT', sortOrder: 4 },
      { fieldKey: 'course', label: 'Course', source: 'STUDENT', sortOrder: 5 },
      { fieldKey: 'academicYear', label: 'Academic Year', source: 'STUDENT', sortOrder: 6 },
    ],
  },
  {
    code: 'TC',
    name: 'Transfer & Conduct Certificate',
    description: 'Issued when a student formally leaves the institution — admission, leaving date, reason and conduct.',
    category: 'Administrative',
    icon: 'FileOutput',
    headerTitle: 'TRANSFER & CONDUCT CERTIFICATE',
    footerNote: 'This certificate is issued on request for official / passport / education loan / employment purposes.',
    bodyTemplate:
      'This is to certify that {{studentName}} (Register / Roll No: {{regNo}}), Son / Daughter of {{fatherName}}, born on {{dob}}, was admitted to this institution on {{dateOfAdmission}} for the course {{course}}. He / She left this institution on {{dateOfLeaving}} due to {{reasonForLeaving}}. His / Her character and conduct during the entire period of study were {{conduct}}. All fee dues to the institution have been cleared in full.',
    fields: [
      { fieldKey: 'studentName', label: 'Student Name', source: 'STUDENT', sortOrder: 1 },
      { fieldKey: 'regNo', label: 'Register / Roll Number', source: 'STUDENT', sortOrder: 2 },
      { fieldKey: 'fatherName', label: "Father's / Guardian's Name", source: 'PARENT', sortOrder: 3 },
      { fieldKey: 'dob', label: 'Date of Birth', source: 'STUDENT', sortOrder: 4 },
      { fieldKey: 'dateOfAdmission', label: 'Date of Admission', source: 'STUDENT', sortOrder: 5 },
      { fieldKey: 'course', label: 'Course & Branch', source: 'STUDENT', sortOrder: 6 },
      { fieldKey: 'dateOfLeaving', label: 'Date of Leaving', source: 'MANUAL', inputType: 'DATE', required: true, sortOrder: 7 },
      { fieldKey: 'reasonForLeaving', label: 'Reason for Leaving', source: 'MANUAL', inputType: 'TEXT', required: true, sortOrder: 8 },
      { fieldKey: 'conduct', label: 'Character & Conduct', source: 'MANUAL', inputType: 'SELECT', required: true, defaultValue: 'GOOD', options: ['EXCELLENT', 'GOOD', 'SATISFACTORY'], sortOrder: 9 },
    ],
  },
  {
    code: 'CONDUCT',
    name: 'Conduct Certificate',
    description: "Attests to a student's character and conduct during their period of study.",
    category: 'Administrative',
    icon: 'ShieldCheck',
    headerTitle: 'CONDUCT CERTIFICATE',
    footerNote: 'This certificate is issued on request for official / passport / education loan / employment purposes.',
    bodyTemplate:
      'This is to certify that {{studentName}} (Register No: {{regNo}}) has been a student of {{course}} at this institution. His / Her character and conduct during the entire period of study in this institution have been {{conduct}}.',
    fields: [
      { fieldKey: 'studentName', label: 'Student Name', source: 'STUDENT', sortOrder: 1 },
      { fieldKey: 'regNo', label: 'Register Number', source: 'STUDENT', sortOrder: 2 },
      { fieldKey: 'course', label: 'Course', source: 'STUDENT', sortOrder: 3 },
      { fieldKey: 'conduct', label: 'Character & Conduct', source: 'MANUAL', inputType: 'SELECT', required: true, defaultValue: 'EXCELLENT', options: ['EXCELLENT', 'GOOD', 'SATISFACTORY'], sortOrder: 4 },
    ],
  },
  {
    code: 'COMPLETION',
    name: 'Course Completion Certificate',
    description: 'Confirms a student has successfully completed their course of study.',
    category: 'Academic',
    icon: 'GraduationCap',
    headerTitle: 'COURSE COMPLETION CERTIFICATE',
    footerNote: 'This certificate is issued on request for official / passport / education loan / employment purposes.',
    bodyTemplate:
      'This is to certify that {{studentName}} (Register No: {{regNo}}) has successfully completed the course {{course}} during the academic year {{academicYear}} at this institution.',
    fields: [
      { fieldKey: 'studentName', label: 'Student Name', source: 'STUDENT', sortOrder: 1 },
      { fieldKey: 'regNo', label: 'Register Number', source: 'STUDENT', sortOrder: 2 },
      { fieldKey: 'course', label: 'Course', source: 'STUDENT', sortOrder: 3 },
      { fieldKey: 'academicYear', label: 'Academic Year', source: 'STUDENT', sortOrder: 4 },
    ],
  },
  {
    code: 'FEEPAID',
    name: 'Fee Paid Certificate',
    description: 'Confirms a student has paid all prescribed fees with no outstanding dues.',
    category: 'Finance',
    icon: 'Receipt',
    headerTitle: 'FEE PAID CERTIFICATE',
    footerNote: 'This certificate is issued on request for official / passport / education loan / employment purposes.',
    bodyTemplate:
      'This is to certify that {{studentName}} (Roll No: {{rollNo}}) studying in {{course}} has paid all prescribed Tuition, Special Lab and Examination Fees for the academic year {{academicYear}}. There are no outstanding fee dues against his / her name as on {{issueDate}}.',
    fields: [
      { fieldKey: 'studentName', label: 'Student Name', source: 'STUDENT', sortOrder: 1 },
      { fieldKey: 'rollNo', label: 'Roll Number', source: 'STUDENT', sortOrder: 2 },
      { fieldKey: 'course', label: 'Course', source: 'STUDENT', sortOrder: 3 },
      { fieldKey: 'academicYear', label: 'Academic Year', source: 'STUDENT', sortOrder: 4 },
      { fieldKey: 'issueDate', label: 'Issue Date', source: 'SYSTEM', sortOrder: 5 },
    ],
  },
];

const seedDefaultTemplates = async () => {
  const templateIds = [];

  for (const def of DEFAULT_TEMPLATES) {
    const template = await prisma.certificateTemplate.upsert({
      where: { code: def.code },
      update: {
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        headerTitle: def.headerTitle,
        bodyTemplate: def.bodyTemplate,
        footerNote: def.footerNote,
        visibility: 'SYSTEM',
        status: 'ACTIVE',
      },
      create: {
        code: def.code,
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        headerTitle: def.headerTitle,
        bodyTemplate: def.bodyTemplate,
        footerNote: def.footerNote,
        visibility: 'SYSTEM',
        status: 'ACTIVE',
      },
    });

    // Deterministic reseed: replace this template's field list each run.
    await prisma.certificateField.deleteMany({ where: { templateId: template.id } });
    if (def.fields.length > 0) {
      await prisma.certificateField.createMany({
        data: def.fields.map((f) => ({
          templateId: template.id,
          fieldKey: f.fieldKey,
          label: f.label,
          source: f.source,
          inputType: f.inputType || 'TEXT',
          required: !!f.required,
          defaultValue: f.defaultValue || null,
          options: f.options || null,
          sortOrder: f.sortOrder || 0,
        })),
      });
    }

    templateIds.push(template.id);
  }

  const institutions = await prisma.institution.findMany({ select: { id: true } });
  for (const institution of institutions) {
    for (const templateId of templateIds) {
      await prisma.institutionCertificateTemplate.upsert({
        where: { institutionId_templateId: { institutionId: institution.id, templateId } },
        update: {},
        create: { institutionId: institution.id, templateId, enabled: true },
      });
    }
  }

  return { templatesSeeded: templateIds.length, institutionsConfigured: institutions.length };
};

module.exports = { seedDefaultTemplates, DEFAULT_TEMPLATES };

if (require.main === module) {
  seedDefaultTemplates()
    .then((result) => {
      console.log(`✅ Seeded ${result.templatesSeeded} default certificate templates across ${result.institutionsConfigured} institution(s).`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Failed to seed default certificate templates:', err);
      process.exit(1);
    });
}

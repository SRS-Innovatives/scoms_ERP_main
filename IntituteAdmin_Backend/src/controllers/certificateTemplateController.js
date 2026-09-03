/**
 * Institute Admin — Dynamic Certificate Engine Controller
 *
 * Thin HTTP layer over shared/certificateEngine. Catalog/definition/rendering logic lives
 * in the engine (shared across every backend that needs certificates) — this file only:
 *   1. Confirms the institution context from the authenticated request.
 *   2. Lets the institution customize a template's wording/header/signatory/branding.
 *   3. Calls the engine to actually render and issue a certificate.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, certificateEngine } = require('../../../shared');
const { getTemplateDefinition, renderCertificate } = certificateEngine;

/** Every certificate template visible to this institution, for the format customization
 * screen and the generation picker. Never a hardcoded list. */
const getCatalog = async (req, res, next) => {
  try {
    const templates = await prisma.certificateTemplate.findMany({
      where: { status: 'ACTIVE' },
      include: { institutionTemplates: { where: { institutionId: req.institutionId } } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const visible = templates
      .filter((t) => {
        const config = t.institutionTemplates[0];
        return t.visibility === 'SYSTEM' ? (config ? config.enabled : true) : !!config?.enabled;
      })
      .map((t) => {
        const config = t.institutionTemplates[0];
        return {
          code: t.code,
          name: t.name,
          description: t.description,
          category: t.category,
          icon: t.icon,
          visibility: t.visibility,
          isCustomized: !!(config?.customBodyTemplate || config?.customHeaderTitle),
        };
      });

    return sendSuccess(res, visible, 'Certificate catalog retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Full merged definition (default template + this institution's own customization). */
const getDefinition = async (req, res, next) => {
  try {
    const definition = await getTemplateDefinition(req.params.code, req.institutionId);
    return sendSuccess(res, { ...definition, _internal: undefined }, 'Certificate definition retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** The raw, uncustomized default (base wording/header/footer) alongside whatever this
 * institution has already overridden — the format-editor screen shows both. */
const getFormatSettings = async (req, res, next) => {
  try {
    const template = await prisma.certificateTemplate.findUnique({ where: { code: req.params.code } });
    if (!template) throw new NotFoundError('Certificate template not found');

    const config = await prisma.institutionCertificateTemplate.findFirst({
      where: { institutionId: req.institutionId, templateId: template.id },
    });

    return sendSuccess(res, {
      code: template.code,
      name: template.name,
      defaultHeaderTitle: template.headerTitle,
      defaultBodyTemplate: template.bodyTemplate,
      defaultFooterNote: template.footerNote,
      enabled: config ? config.enabled : template.visibility === 'SYSTEM',
      customHeaderTitle: config?.customHeaderTitle || '',
      customBodyTemplate: config?.customBodyTemplate || '',
      customFooterNote: config?.customFooterNote || '',
      showLogo: config?.showLogo ?? true,
      showSeal: config?.showSeal ?? true,
      showSignature: config?.showSignature ?? true,
      signatoryName: config?.signatoryName || '',
      signatoryDesignation: config?.signatoryDesignation || '',
      issuePlace: config?.issuePlace || '',
    }, 'Certificate format settings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Saves this institution's own wording/header/signatory/branding customization for one
 * certificate template — the whole point of "customize the certificate format". */
const updateFormatSettings = async (req, res, next) => {
  try {
    const template = await prisma.certificateTemplate.findUnique({ where: { code: req.params.code } });
    if (!template) throw new NotFoundError('Certificate template not found');

    const {
      enabled, customHeaderTitle, customBodyTemplate, customFooterNote,
      showLogo, showSeal, showSignature, signatoryName, signatoryDesignation, issuePlace,
    } = req.body;

    const updated = await prisma.institutionCertificateTemplate.upsert({
      where: { institutionId_templateId: { institutionId: req.institutionId, templateId: template.id } },
      update: {
        ...(enabled !== undefined && { enabled }),
        customHeaderTitle: customHeaderTitle || null,
        customBodyTemplate: customBodyTemplate || null,
        customFooterNote: customFooterNote || null,
        ...(showLogo !== undefined && { showLogo }),
        ...(showSeal !== undefined && { showSeal }),
        ...(showSignature !== undefined && { showSignature }),
        signatoryName: signatoryName || null,
        signatoryDesignation: signatoryDesignation || null,
        issuePlace: issuePlace || null,
      },
      create: {
        institutionId: req.institutionId,
        templateId: template.id,
        enabled: enabled ?? true,
        customHeaderTitle: customHeaderTitle || null,
        customBodyTemplate: customBodyTemplate || null,
        customFooterNote: customFooterNote || null,
        showLogo: showLogo ?? true,
        showSeal: showSeal ?? true,
        showSignature: showSignature ?? true,
        signatoryName: signatoryName || null,
        signatoryDesignation: signatoryDesignation || null,
        issuePlace: issuePlace || null,
      },
    });

    return sendSuccess(res, updated, 'Certificate format updated successfully');
  } catch (err) {
    next(err);
  }
};

/** Restores this institution's format back to the system default for one template. */
const resetFormatSettings = async (req, res, next) => {
  try {
    const template = await prisma.certificateTemplate.findUnique({ where: { code: req.params.code } });
    if (!template) throw new NotFoundError('Certificate template not found');

    const updated = await prisma.institutionCertificateTemplate.upsert({
      where: { institutionId_templateId: { institutionId: req.institutionId, templateId: template.id } },
      update: { customHeaderTitle: null, customBodyTemplate: null, customFooterNote: null },
      create: { institutionId: req.institutionId, templateId: template.id, enabled: true },
    });

    return sendSuccess(res, updated, 'Certificate format reset to default');
  } catch (err) {
    next(err);
  }
};

/** Renders and issues a real certificate via the engine — replaces the old fixed-type
 * generateCertificate endpoint for the dynamic UI (that endpoint still works unchanged
 * for any existing caller). */
const generateFromTemplate = async (req, res, next) => {
  try {
    const { studentId, manualFields } = req.body;
    if (!studentId) throw new ValidationError('studentId is required');

    const result = await renderCertificate({
      code: req.params.code,
      institutionId: req.institutionId,
      studentId,
      manualFields: manualFields || {},
    });

    return sendSuccess(res, result, 'Certificate generated successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCatalog,
  getDefinition,
  getFormatSettings,
  updateFormatSettings,
  resetFormatSettings,
  generateFromTemplate,
};

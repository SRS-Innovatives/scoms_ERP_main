const { getTemplateDefinition, renderCertificate, REQUEST_TYPE_TO_TEMPLATE_CODE, getRequestableCertificateTypes } = require('./engine');
const { renderTemplate } = require('./placeholderRenderer');

module.exports = {
  getTemplateDefinition,
  renderCertificate,
  renderTemplate,
  REQUEST_TYPE_TO_TEMPLATE_CODE,
  getRequestableCertificateTypes,
};

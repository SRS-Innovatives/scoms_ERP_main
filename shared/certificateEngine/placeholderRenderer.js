/** Substitutes {{fieldKey}} placeholders in a certificate wording template with real
 * context values. A key with no resolved value renders as [fieldKey] rather than silently
 * disappearing — makes a misconfigured/missing field obvious on the printed certificate
 * instead of quietly wrong. */
const renderTemplate = (template, context) => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = context[key];
    return value !== undefined && value !== null && value !== '' ? String(value) : `[${key}]`;
  });
};

module.exports = { renderTemplate };

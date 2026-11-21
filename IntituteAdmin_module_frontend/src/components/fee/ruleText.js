// Plain-words descriptions of fee rules (mirrors shared/fees/feeRules.js describe)
export const ord = (n) => `${n}${n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

/** Plain words for a condition (mirrors shared/fees/feeRules.js describe). */
export const describeCondition = (c, options = {}) => {
  if (!c) return '';
  const parts = [];
  if (c.quota) parts.push(`${c.quota.join('/')} quota`);
  if (c.category) parts.push(`${c.category.join('/')} category`);
  if (c.gender) parts.push(c.gender.join('/').toLowerCase());
  if (c.newAdmission !== undefined) parts.push(c.newAdmission ? 'new admission' : 'existing student');
  if (c.hostel !== undefined) parts.push(c.hostel ? 'hosteller' : 'day scholar');
  if (c.transport !== undefined) parts.push(c.transport ? 'bus user' : 'no bus');
  if (c.routeIds) parts.push(`route ${c.routeIds.map((id) => options.routes?.find((r) => r.id === id)?.routeName || '?').join('/')}`);
  if (c.hostelIds) parts.push(`hostel ${c.hostelIds.map((id) => options.hostels?.find((h) => h.id === id)?.name || '?').join('/')}`);
  if (c.siblingOrderMin) parts.push(`${ord(c.siblingOrderMin)} child or later`);
  if (c.custom) Object.entries(c.custom).forEach(([k, v]) => parts.push(`${options.customFields?.find((f) => f.fieldKey === k)?.label || k}: ${v.join('/')}`));
  return parts.join(', ');
};

/** One line describing an item's rule, for the builder and the structure preview. */
export const describeRule = (rule, options = {}) => {
  if (!rule) return '';
  const bits = [];
  if (rule.when) bits.push(`only for ${describeCondition(rule.when, options)}`);
  if (rule.amountFrom === 'TRANSPORT_ROUTE') bits.push(`bus route fare × ${rule.months || 1} months`);
  if (rule.amountFrom === 'HOSTEL_BED') bits.push(`hostel bed fee × ${rule.months || 1} months`);
  (rule.amounts || []).forEach((a) => bits.push(`₹${Number(a.amount).toLocaleString('en-IN')} for ${describeCondition(a.when, options)}`));
  return bits.join(' · ');
};

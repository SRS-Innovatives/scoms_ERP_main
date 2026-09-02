/**
 * Single source of truth for the "class" display label used to target an Assignment
 * at a course+section (Assignment.className is a plain string, not a real FK — this
 * keeps the label staff generate when creating an assignment and the label students
 * match against identical, so they never silently drift apart).
 */
const formatClassLabel = (courseName, sectionName) => `${courseName} - ${sectionName}`;

module.exports = { formatClassLabel };

const allowedRoles = new Set(['admin', 'teacher', 'student']);
const normalizeRole = value => {
  if (!value) {
    return 'student';
  }

  const normalized = String(value).trim().toLowerCase();
  return allowedRoles.has(normalized) ? normalized : 'student';
};
const allowedStatuses = new Set(['active', 'suspended', 'banned']);
const getEffectiveStatus = user => user?.status || 'active';
const getEffectiveViolationCount = user => (user?.role === 'admin' ? 0 : user?.violationCount || 0);
const isStudentRole = role => role === 'student';

module.exports = {
  normalizeRole,
  allowedStatuses,
  getEffectiveStatus,
  getEffectiveViolationCount,
  isStudentRole
};

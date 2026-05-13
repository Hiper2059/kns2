const allowedRoles = new Set(['admin', 'teacher', 'student', 'user']);
const normalizeRole = value => {
  if (!value) {
    return 'student';
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'user') {
    return 'student';
  }

  return allowedRoles.has(normalized) ? normalized : 'student';
};
const allowedStatuses = new Set(['active', 'suspended', 'banned']);
const getEffectiveStatus = user => user?.status || 'active';
const getEffectiveViolationCount = user => (user?.role === 'admin' ? 0 : user?.violationCount || 0);
const isStudentRole = role => role === 'student' || role === 'user';

module.exports = {
  normalizeRole,
  allowedStatuses,
  getEffectiveStatus,
  getEffectiveViolationCount,
  isStudentRole
};

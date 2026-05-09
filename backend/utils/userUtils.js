const normalizeRole = value => (value === 'admin' ? 'admin' : 'user');
const allowedStatuses = new Set(['active', 'suspended', 'banned']);
const getEffectiveStatus = user => user?.status || 'active';
const getEffectiveViolationCount = user => (user?.role === 'admin' ? 0 : user?.violationCount || 0);

module.exports = {
  normalizeRole,
  allowedStatuses,
  getEffectiveStatus,
  getEffectiveViolationCount
};

const shouldUseConfiguredAdminAuthentication = (username, adminUsername, loginAs) => (
  loginAs === 'admin' || String(username || '').trim() === adminUsername
);

module.exports = { shouldUseConfiguredAdminAuthentication };

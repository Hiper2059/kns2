const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { shouldUseConfiguredAdminAuthentication } = require('../domain/adminAuthentication');

test('tai khoan admin cau hinh luon dung nhanh xac thuc admin', () => {
  assert.equal(shouldUseConfiguredAdminAuthentication('admin', 'admin'), true);
  assert.equal(shouldUseConfiguredAdminAuthentication(' admin ', 'admin'), true);
  assert.equal(shouldUseConfiguredAdminAuthentication('student01', 'admin'), false);
  assert.equal(shouldUseConfiguredAdminAuthentication('student01', 'admin', 'admin'), true);
});

test('controller khong de admin roi xuong xac thuc MongoDB', () => {
  const controller = fs.readFileSync(
    path.join(__dirname, '../controllers/authController.js'),
    'utf8'
  );

  assert.match(
    controller,
    /if \(shouldUseConfiguredAdminAuthentication\(username, config\.adminUsername, loginAs\)\)/
  );
  assert.doesNotMatch(controller, /if \(loginAs === 'admin'\)/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.join(__dirname, '..');
const workspaceRoot = path.join(backendRoot, '..');
const readBackend = relativePath => fs.readFileSync(path.join(backendRoot, relativePath), 'utf8');
const readFrontend = relativePath => fs.readFileSync(path.join(workspaceRoot, 'frontend', 'src', relativePath), 'utf8');

test('không còn endpoint health dành cho bảo trì', () => {
  assert.equal(fs.existsSync(path.join(backendRoot, 'routes', 'healthRoutes.js')), false);
  assert.equal(fs.existsSync(path.join(backendRoot, 'controllers', 'healthController.js')), false);
  const app = readBackend('app.js');
  assert.doesNotMatch(app, /healthRoutes|\/api\/health/);
});

test('không còn tracking LessonView và API analytics', () => {
  assert.equal(fs.existsSync(path.join(backendRoot, 'models', 'LessonView.js')), false);
  assert.equal(fs.existsSync(path.join(backendRoot, 'controllers', 'analyticsController.js')), false);
  assert.equal(fs.existsSync(path.join(backendRoot, 'routes', 'analyticsRoutes.js')), false);

  for (const file of [
    'app.js',
    'controllers/lessonController.js',
    'controllers/courseController.js',
    'services/userDeletionService.js'
  ]) {
    assert.doesNotMatch(readBackend(file), /LessonView|analyticsRoutes/);
  }
});

test('admin frontend không còn analytics và upload utility độc lập', () => {
  assert.equal(fs.existsSync(path.join(workspaceRoot, 'frontend', 'src', 'routes', 'AppRoutes.jsx')), false);
  for (const file of ['App.jsx', 'components/ManageView.jsx']) {
    const source = readFrontend(file);
    assert.doesNotMatch(source, /adminAnalytics|isLoadingAnalytics|fetchAdminAnalytics/);
    assert.doesNotMatch(source, /adminUploadUrl|isAdminUploadLoading|AdminUploadVideo/);
  }
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.join(__dirname, '..');
const frontendRoot = path.join(backendRoot, '..', 'frontend', 'src');
const read = filePath => fs.readFileSync(filePath, 'utf8');

test('trang chủ không còn section video hướng dẫn tiêu biểu', () => {
  const homeView = read(path.join(frontendRoot, 'components', 'HomeView.jsx'));
  assert.doesNotMatch(homeView, /Video hướng dẫn tiêu biểu|categoryVideos|onDeleteVideo/);
});

test('frontend không còn state, fallback và API featured video', () => {
  const app = read(path.join(frontendRoot, 'App.jsx'));
  const skills = read(path.join(frontendRoot, 'data', 'skills.js'));
  const appUtils = read(path.join(frontendRoot, 'utils', 'appUtils.js'));
  for (const source of [app, skills, appUtils]) {
    assert.doesNotMatch(source, /defaultCategoryVideos|groupVideosByCategory|categoryVideos|fetchVideos|\/api\/videos/);
  }
});

test('backend không còn API, model và seed VideoLink', () => {
  assert.equal(fs.existsSync(path.join(backendRoot, 'models', 'VideoLink.js')), false);
  assert.equal(fs.existsSync(path.join(backendRoot, 'routes', 'videoRoutes.js')), false);
  assert.equal(fs.existsSync(path.join(backendRoot, 'controllers', 'videoController.js')), false);

  for (const relativePath of ['app.js', 'server.js', 'services/seedService.js', 'services/userDeletionService.js']) {
    assert.doesNotMatch(read(path.join(backendRoot, relativePath)), /VideoLink|videoRoutes|seedDefaultVideoLinks|\/api\/videos/);
  }
});

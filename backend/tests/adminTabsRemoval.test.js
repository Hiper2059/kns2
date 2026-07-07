const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.join(__dirname, '..');
const frontendRoot = path.join(backendRoot, '..', 'frontend', 'src');
const read = filePath => fs.readFileSync(filePath, 'utf8');

test('admin không còn hai tab Bình luận và Nội dung', () => {
  const manageView = read(path.join(frontendRoot, 'components', 'ManageView.jsx'));
  assert.doesNotMatch(manageView, /id: 'comments'|id: 'content'/);
  assert.doesNotMatch(manageView, /activeSection === 'comments'|activeSection === 'content'/);
  assert.doesNotMatch(manageView, /Quản lý bình luận diễn đàn|Bài viết Diễn đàn chung/);
});

test('frontend không còn tải riêng danh sách bình luận cho admin', () => {
  const app = read(path.join(frontendRoot, 'App.jsx'));
  assert.doesNotMatch(app, /adminForumComments|setAdminForumComments|isLoadingForumComments|fetchAdminForumComments|\/api\/forum\/admin\/comments/);
});

test('backend không còn API list comment admin nhưng vẫn giữ API phạt', () => {
  const routes = read(path.join(backendRoot, 'routes', 'forumRoutes.js'));
  const controller = read(path.join(backendRoot, 'controllers', 'forumController.js'));
  assert.doesNotMatch(routes, /\/admin\/comments|listAllCommentsForAdmin/);
  assert.doesNotMatch(controller, /listAllCommentsForAdmin/);
  assert.match(routes, /\/comments\/:id\/punish/);
  assert.match(controller, /punishCommentAuthor/);
});

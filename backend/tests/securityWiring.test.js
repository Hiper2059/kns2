const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = relativePath => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

test('API bài học và khóa học áp dụng rule quyền truy cập mới', () => {
  const lessonController = read('controllers/lessonController.js');
  const courseController = read('controllers/courseController.js');
  assert.match(lessonController, /canReadLesson\(\{/);
  assert.match(courseController, /filter\.status = \{ \$ne: 'draft' \}/);
});

test('API quiz luôn ẩn đáp án và kiểm tra hạn nộp', () => {
  const assignmentController = read('controllers/assignmentController.js');
  assert.match(assignmentController, /isStudent \? hideQuizAnswers\(assignment\)/);
  assert.match(assignmentController, /canSubmitAssignment\(assignment\.dueAt\)/);
});

test('chat yêu cầu đăng nhập và có rate limit thật', () => {
  const chatRoutes = read('routes/chatRoutes.js');
  const rateLimiters = read('middleware/securityRateLimiters.js');
  assert.match(chatRoutes, /requireActiveUser, chatRateLimiter, sendChat/);
  assert.match(rateLimiters, /rateLimit\(\{/);
  assert.doesNotMatch(rateLimiters, /next\(\)/);
});

test('public profile loại thông tin liên hệ và hồ sơ riêng của học viên', () => {
  const userController = read('controllers/userController.js');
  assert.match(userController, /delete publicTeacherProfile\.phone/);
  assert.match(userController, /includePrivate \? fullProfile : toPublicProfile/);
});

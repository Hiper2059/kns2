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

test('API xác thực và chat không còn rate limiter', () => {
  const app = read('app.js');
  const authRoutes = read('routes/authRoutes.js');
  const chatRoutes = read('routes/chatRoutes.js');

  assert.match(authRoutes, /router\.post\('\/register', validate\(registerSchema\), register\)/);
  assert.match(authRoutes, /router\.post\('\/login', validate\(loginSchema\), login\)/);
  assert.match(chatRoutes, /router\.post\('\/', requireActiveUser, sendChat\)/);
  assert.match(app, /app\.post\('\/api\/login', validate\(loginSchema\), login\)/);
  assert.match(app, /app\.post\('\/api\/register', validate\(registerSchema\), register\)/);
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'middleware', 'securityRateLimiters.js')), false);

  for (const source of [app, authRoutes, chatRoutes]) {
    assert.doesNotMatch(source, /RateLimiter|securityRateLimiters/);
  }
});

test('public profile loại thông tin liên hệ và hồ sơ riêng của học viên', () => {
  const userController = read('controllers/userController.js');
  assert.match(userController, /delete publicTeacherProfile\.phone/);
  assert.match(userController, /includePrivate \? fullProfile : toPublicProfile/);
});

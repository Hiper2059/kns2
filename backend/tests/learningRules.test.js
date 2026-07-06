const test = require('node:test');
const assert = require('node:assert/strict');

const {
  canReadLesson,
  canPublishCourseToUser,
  canSubmitAssignment,
  getEnrollmentStateAfterLessonRemoval,
  hideQuizAnswers
} = require('../domain/learningRules');

test('teacher chỉ đọc được nội dung lớp mình sở hữu', () => {
  assert.equal(canReadLesson({ role: 'teacher', userId: 'teacher-a', teacherId: 'teacher-a' }), true);
  assert.equal(canReadLesson({ role: 'teacher', userId: 'teacher-b', teacherId: 'teacher-a' }), false);
  assert.equal(canReadLesson({ role: 'admin', userId: 'admin', teacherId: 'teacher-a' }), true);
});

test('học viên và khách chỉ nhìn thấy khóa học published', () => {
  assert.equal(canPublishCourseToUser({ status: 'published', role: null }), true);
  assert.equal(canPublishCourseToUser({ status: undefined, role: null }), true);
  assert.equal(canPublishCourseToUser({ status: 'draft', role: null }), false);
  assert.equal(canPublishCourseToUser({ status: 'draft', role: 'student' }), false);
  assert.equal(canPublishCourseToUser({ status: 'draft', role: 'admin' }), true);
});

test('không cho nộp bài sau hạn', () => {
  const now = new Date('2026-07-05T12:00:00.000Z');
  assert.equal(canSubmitAssignment(null, now), true);
  assert.equal(canSubmitAssignment('2026-07-05T12:00:01.000Z', now), true);
  assert.equal(canSubmitAssignment('2026-07-05T11:59:59.000Z', now), false);
});

test('xóa bài học phải hạ trạng thái completed khi tiến độ không còn 100%', () => {
  assert.deepEqual(getEnrollmentStateAfterLessonRemoval(2, 3), {
    progressPercent: 67,
    status: 'enrolled'
  });
  assert.deepEqual(getEnrollmentStateAfterLessonRemoval(3, 3), {
    progressPercent: 100,
    status: 'completed'
  });
});

test('không bao giờ trả đáp án quiz cho học viên, kể cả đã nộp', () => {
  const assignment = {
    type: 'quiz',
    questions: [{ question: 'Q', options: ['A', 'B'], correctOptionIndex: 1 }]
  };
  const safe = hideQuizAnswers(assignment);

  assert.deepEqual(safe.questions, [{ question: 'Q', options: ['A', 'B'] }]);
  assert.equal(assignment.questions[0].correctOptionIndex, 1);
});

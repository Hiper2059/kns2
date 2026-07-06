const sameId = (left, right) => String(left || '') === String(right || '');

const canReadLesson = ({ role, userId, teacherId, isEnrolled = false }) => {
  if (role === 'admin') return true;
  if (role === 'teacher') return sameId(userId, teacherId);
  if (role === 'student') return isEnrolled;
  return false;
};

const canPublishCourseToUser = ({ status, role, userId, teacherId }) => {
  if (status !== 'draft') return true;
  if (role === 'admin') return true;
  return role === 'teacher' && sameId(userId, teacherId);
};

const canSubmitAssignment = (dueAt, now = new Date()) => {
  if (!dueAt) return true;
  const deadline = new Date(dueAt);
  return !Number.isNaN(deadline.getTime()) && now.getTime() <= deadline.getTime();
};

const getEnrollmentStateAfterLessonRemoval = (completedCount, totalLessons) => {
  const progressPercent = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;
  return {
    progressPercent,
    status: totalLessons > 0 && completedCount >= totalLessons ? 'completed' : 'enrolled'
  };
};

const hideQuizAnswers = assignment => {
  if (assignment?.type !== 'quiz' || !Array.isArray(assignment.questions)) {
    return assignment;
  }
  return {
    ...assignment,
    questions: assignment.questions.map(item => ({
      question: item.question,
      options: item.options || []
    }))
  };
};

module.exports = {
  canReadLesson,
  canPublishCourseToUser,
  canSubmitAssignment,
  getEnrollmentStateAfterLessonRemoval,
  hideQuizAnswers
};

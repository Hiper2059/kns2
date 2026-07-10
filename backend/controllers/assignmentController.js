const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const { isStudentRole } = require('../utils/userUtils');
const { getPaginationParams, buildPagination } = require('../utils/pagination');
const catchAsync = require('../utils/catchAsync');
const { canSubmitAssignment, hideQuizAnswers } = require('../domain/learningRules');

const ensureCourseAccess = async (req, res, courseId) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    res.status(400).json({ message: 'courseId khong hop le.' });
    return null;
  }

  const course = await Course.findById(courseId).lean();
  if (!course) {
    res.status(404).json({ message: 'Khong tim thay lop hoc.' });
    return null;
  }

  if (isStudentRole(req.currentUser.role)) {
    const enrolled = await Enrollment.findOne({
      course: courseId,
      student: req.currentUser._id
    }).lean();

    if (!enrolled) {
      res.status(403).json({ message: 'Cau can tham gia lop truoc khi xem bai tap.' });
      return null;
    }
  }

  if (req.currentUser.role === 'teacher' && String(course.teacher) !== String(req.currentUser._id)) {
    res.status(403).json({ message: 'Ban khong co quyen quan ly lop nay.' });
    return null;
  }

  return course;
};

const normalizeQuestions = questions => {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map(item => {
      const options = Array.isArray(item?.options)
        ? item.options.map(option => String(option || '').trim()).filter(Boolean)
        : [];
      return {
        question: String(item?.question || '').trim(),
        options: options.slice(0, 6),
        correctOptionIndex: Math.max(0, Math.min(Number(item?.correctOptionIndex) || 0, Math.max(options.length - 1, 0)))
      };
    })
    .filter(item => item.question && item.options.length >= 2);
};

const listAssignments = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const course = await ensureCourseAccess(req, res, courseId);
  if (!course) {
    return;
  }

  const filter = { course: course._id };
  const { page, limit, skip } = getPaginationParams(req.query);
  const [assignments, totalItems] = await Promise.all([
    Assignment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Assignment.countDocuments(filter)
  ]);

  const assignmentIds = assignments.map(item => item._id);
  const isStudent = isStudentRole(req.currentUser.role);

  let mySubmissions = [];
  let submissionCounts = {};

  if (isStudent && assignmentIds.length) {
    mySubmissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: req.currentUser._id
    }).lean();
  }

  if (!isStudent && assignmentIds.length) {
    const grouped = await Submission.aggregate([
      { $match: { assignment: { $in: assignmentIds } } },
      { $group: { _id: '$assignment', total: { $sum: 1 } } }
    ]);
    submissionCounts = grouped.reduce((acc, item) => {
      acc[String(item._id)] = item.total;
      return acc;
    }, {});
  }

  const submissionByAssignment = mySubmissions.reduce((acc, submission) => {
    acc[String(submission.assignment)] = submission;
    return acc;
  }, {});

  const enriched = assignments.map(assignment => {
    const mySubmission = submissionByAssignment[String(assignment._id)] || null;
    const safeAssignment = isStudent ? hideQuizAnswers(assignment) : assignment;
    return {
      ...safeAssignment,
      submissionCount: submissionCounts[String(assignment._id)] || 0,
      mySubmission
    };
  });

  res.json({
    data: enriched,
    assignments: enriched,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const createAssignment = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { title, description, dueAt, type, questions, lessonId, duration } = req.body || {};
  const trimmedTitle = String(title || '').trim();
  const assignmentType = type === 'quiz' ? 'quiz' : 'text';
  const normalizedQuestions = normalizeQuestions(questions);
  const normalizedDueAt = dueAt ? new Date(dueAt) : null;

  if (!trimmedTitle) {
    return res.status(400).json({ message: 'Thieu tieu de bai tap.' });
  }

  if (assignmentType === 'quiz' && !normalizedQuestions.length) {
    return res.status(400).json({ message: 'Bai trac nghiem can it nhat 1 cau hoi va moi cau co toi thieu 2 dap an.' });
  }
  if (normalizedDueAt && Number.isNaN(normalizedDueAt.getTime())) {
    return res.status(400).json({ message: 'Han nop bai khong hop le.' });
  }

  const course = await ensureCourseAccess(req, res, courseId);
  if (!course) {
    return;
  }
  if (lessonId) {
    const lessonExists = mongoose.Types.ObjectId.isValid(lessonId)
      && await Lesson.exists({ _id: lessonId, course: course._id });
    if (!lessonExists) {
      return res.status(400).json({ message: 'Bai hoc khong thuoc lop nay.' });
    }
  }

  const created = await Assignment.create({
    course: course._id,
    lesson: lessonId || null,
    title: trimmedTitle,
    description: String(description || '').trim(),
    type: assignmentType,
    questions: assignmentType === 'quiz' ? normalizedQuestions : [],
    dueAt: normalizedDueAt,
    createdBy: req.currentUser._id,
    createdByName: req.currentUser.username,
    duration: Number(duration) || 0
  });

  res.status(201).json({ message: 'Da tao bai tap.', assignment: created });
});

const updateAssignment = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;
  const { title, description, dueAt, type, questions, lessonId, duration } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    return res.status(400).json({ message: 'assignmentId khong hop le.' });
  }

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: 'Khong tim thay bai tap.' });
  }

  const course = await ensureCourseAccess(req, res, assignment.course);
  if (!course) {
    return;
  }
  if (lessonId) {
    const lessonExists = mongoose.Types.ObjectId.isValid(lessonId)
      && await Lesson.exists({ _id: lessonId, course: course._id });
    if (!lessonExists) {
      return res.status(400).json({ message: 'Bai hoc khong thuoc lop nay.' });
    }
  }

  if (title !== undefined) {
    const trimmedTitle = String(title || '').trim();
    if (!trimmedTitle) {
      return res.status(400).json({ message: 'Tieu de bai tap khong duoc rong.' });
    }
    assignment.title = trimmedTitle;
  }
  if (lessonId !== undefined) assignment.lesson = lessonId || null;
  if (description !== undefined) assignment.description = String(description || '').trim();
  if (type !== undefined) assignment.type = type === 'quiz' ? 'quiz' : 'text';
  if (questions !== undefined) {
    const normalizedQuestions = normalizeQuestions(questions);
    if ((type === 'quiz' || assignment.type === 'quiz') && !normalizedQuestions.length) {
      return res.status(400).json({ message: 'Bai trac nghiem can it nhat 1 cau hoi va moi cau co toi thieu 2 dap an.' });
    }
    assignment.questions = assignment.type === 'quiz' ? normalizedQuestions : [];
  }
  if (type !== undefined && questions === undefined) {
    if (assignment.type === 'quiz' && !assignment.questions.length) {
      return res.status(400).json({ message: 'Bai trac nghiem can it nhat 1 cau hoi.' });
    }
    if (assignment.type === 'text') assignment.questions = [];
  }
  if (dueAt !== undefined) {
    const normalizedDueAt = dueAt ? new Date(dueAt) : null;
    if (normalizedDueAt && Number.isNaN(normalizedDueAt.getTime())) {
      return res.status(400).json({ message: 'Han nop bai khong hop le.' });
    }
    assignment.dueAt = normalizedDueAt;
  }
  if (duration !== undefined) {
    assignment.duration = Number(duration) || 0;
  }

  await assignment.save();
  res.json({ message: 'Da cap nhat bai tap.', assignment });
});

const deleteAssignment = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    return res.status(400).json({ message: 'assignmentId khong hop le.' });
  }

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: 'Khong tim thay bai tap.' });
  }

  const course = await ensureCourseAccess(req, res, assignment.course);
  if (!course) {
    return;
  }

  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();

  res.json({ message: 'Da xoa bai tap.' });
});

const upsertSubmission = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;
  const { content, fileUrl, answers } = req.body || {};
  console.log('[upsertSubmission] req.body:', JSON.stringify(req.body));
  const trimmedContent = String(content || '').trim();

  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    return res.status(400).json({ message: 'assignmentId khong hop le.' });
  }

  if (!isStudentRole(req.currentUser.role)) {
    return res.status(403).json({ message: 'Chi hoc vien moi co the nop bai.' });
  }

  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) {
    return res.status(404).json({ message: 'Khong tim thay bai tap.' });
  }
  if (!canSubmitAssignment(assignment.dueAt)) {
    return res.status(409).json({ message: 'Da qua han nop bai.' });
  }

  const enrolled = await Enrollment.findOne({
    course: assignment.course,
    student: req.currentUser._id
  }).lean();

  if (!enrolled) {
    return res.status(403).json({ message: 'Cau can tham gia lop truoc khi nop bai.' });
  }

  let submissionPayload;

  if (assignment.type === 'quiz') {
    const normalizedAnswers = Array.isArray(answers)
      ? answers.map(item => Number(item))
      : [];
    const questions = Array.isArray(assignment.questions) ? assignment.questions : [];

    if (!questions.length) {
      return res.status(400).json({ message: 'Bai trac nghiem chua co cau hoi.' });
    }

    const hasMissingAnswer = questions.some((question, index) => {
      const answer = normalizedAnswers[index];
      return !Number.isInteger(answer) || answer < 0 || answer >= (question.options || []).length;
    });

    if (hasMissingAnswer) {
      return res.status(400).json({ message: 'Cau can tra loi tat ca cau hoi truoc khi nop.' });
    }

    const correctCount = questions.reduce((total, question, index) => {
      return total + (normalizedAnswers[index] === Number(question.correctOptionIndex) ? 1 : 0);
    }, 0);
    const score = Math.round((correctCount / questions.length) * 100);

    submissionPayload = {
      course: assignment.course,
      studentName: req.currentUser.username,
      content: `Đã nộp trắc nghiệm (${correctCount}/${questions.length} câu đúng).`,
      fileUrl: '',
      answers: normalizedAnswers.slice(0, questions.length),
      autoScore: score,
      status: 'graded',
      score,
      feedback: `${correctCount}/${questions.length} câu đúng`,
      submittedAt: new Date(),
      gradedAt: new Date()
    };
  } else {
    if (!trimmedContent) {
      return res.status(400).json({ message: 'Noi dung bai nop khong duoc rong.' });
    }

    submissionPayload = {
      course: assignment.course,
      studentName: req.currentUser.username,
      content: trimmedContent,
      fileUrl: String(fileUrl || '').trim(),
      answers: [],
      autoScore: null,
      status: 'submitted',
      score: null,
      feedback: '',
      submittedAt: new Date()
    };
  }

  let pointsToAward = 0;
  if (assignment.type === 'quiz') {
    const existingSubmission = await Submission.findOne({ assignment: assignment._id, student: req.currentUser._id });
    const totalQuestions = assignment.questions?.length || 0;
    const currentCorrect = submissionPayload.score != null ? Math.round((submissionPayload.score * totalQuestions) / 100) : 0;
    const existingCorrect = (existingSubmission && existingSubmission.score != null) ? Math.round((existingSubmission.score * totalQuestions) / 100) : 0;
    
    if (currentCorrect > existingCorrect) {
      pointsToAward = (currentCorrect - existingCorrect) * 10;
    }
  }

  const submission = await Submission.findOneAndUpdate(
    { assignment: assignment._id, student: req.currentUser._id },
    {
      $set: submissionPayload,
      ...(assignment.type === 'quiz' ? {} : { $unset: { gradedAt: '' } })
    },
    { new: true, upsert: true }
  );

  if (pointsToAward > 0) {
    await Enrollment.findOneAndUpdate(
      { course: assignment.course, student: req.currentUser._id },
      { $inc: { points: pointsToAward } }
    );
    await User.findByIdAndUpdate(req.currentUser._id, { $inc: { points: pointsToAward } });
  }

  res.json({ message: 'Da nop bai.', submission, pointsEarned: pointsToAward });
});

const listSubmissions = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    return res.status(400).json({ message: 'assignmentId khong hop le.' });
  }

  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) {
    return res.status(404).json({ message: 'Khong tim thay bai tap.' });
  }

  const course = await ensureCourseAccess(req, res, assignment.course);
  if (!course) {
    return;
  }

  const filter = { assignment: assignment._id };
  const { page, limit, skip } = getPaginationParams(req.query);
  const [submissions, totalItems] = await Promise.all([
    Submission.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Submission.countDocuments(filter)
  ]);

  res.json({
    data: submissions,
    submissions,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const gradeSubmission = catchAsync(async (req, res) => {
  const { submissionId } = req.params;
  const { score, feedback } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    return res.status(400).json({ message: 'submissionId khong hop le.' });
  }

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    return res.status(404).json({ message: 'Khong tim thay bai nop.' });
  }

  const course = await ensureCourseAccess(req, res, submission.course);
  if (!course) {
    return;
  }

  if (score === '' || score === null) {
    submission.score = null;
  } else if (score !== undefined) {
    const normalizedScore = Number(score);
    if (!Number.isFinite(normalizedScore) || normalizedScore < 0 || normalizedScore > 100) {
      return res.status(400).json({ message: 'Diem phai nam trong khoang 0 den 100.' });
    }
    submission.score = normalizedScore;
  }
  if (feedback !== undefined) {
    submission.feedback = String(feedback).trim();
  }
  submission.status = 'graded';
  submission.gradedAt = new Date();

  await submission.save();

  res.json({ message: 'Da cham bai.', submission });
});

module.exports = {
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  upsertSubmission,
  listSubmissions,
  gradeSubmission
};

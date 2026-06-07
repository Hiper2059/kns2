const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { isStudentRole } = require('../utils/userUtils');

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

const sanitizeAssignmentForStudent = assignment => {
  if (assignment.type !== 'quiz' || !Array.isArray(assignment.questions)) {
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

const listAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await ensureCourseAccess(req, res, courseId);
    if (!course) {
      return;
    }

    const assignments = await Assignment.find({ course: course._id })
      .sort({ createdAt: -1 })
      .lean();

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
      const safeAssignment = isStudent ? sanitizeAssignmentForStudent(assignment) : assignment;
      return {
        ...safeAssignment,
        submissionCount: submissionCounts[String(assignment._id)] || 0,
        mySubmission: submissionByAssignment[String(assignment._id)] || null
      };
    });

    res.json({ assignments: enriched });
  } catch (error) {
    console.error('Loi lay bai tap:', error);
    res.status(500).json({ message: 'Khong tai duoc bai tap.' });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, dueAt, type, questions } = req.body || {};
    const trimmedTitle = String(title || '').trim();
    const assignmentType = type === 'quiz' ? 'quiz' : 'text';
    const normalizedQuestions = normalizeQuestions(questions);

    if (!trimmedTitle) {
      return res.status(400).json({ message: 'Thieu tieu de bai tap.' });
    }

    if (assignmentType === 'quiz' && !normalizedQuestions.length) {
      return res.status(400).json({ message: 'Bai trac nghiem can it nhat 1 cau hoi va moi cau co toi thieu 2 dap an.' });
    }

    const course = await ensureCourseAccess(req, res, courseId);
    if (!course) {
      return;
    }

    const created = await Assignment.create({
      course: course._id,
      title: trimmedTitle,
      description: String(description || '').trim(),
      type: assignmentType,
      questions: assignmentType === 'quiz' ? normalizedQuestions : [],
      dueAt: dueAt ? new Date(dueAt) : null,
      createdBy: req.currentUser._id,
      createdByName: req.currentUser.username
    });

    res.status(201).json({ message: 'Da tao bai tap.', assignment: created });
  } catch (error) {
    console.error('Loi tao bai tap:', error);
    res.status(500).json({ message: 'Khong tao duoc bai tap.' });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, dueAt, type, questions } = req.body || {};

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

    if (title !== undefined) {
      const trimmedTitle = String(title || '').trim();
      if (!trimmedTitle) {
        return res.status(400).json({ message: 'Tieu de bai tap khong duoc rong.' });
      }
      assignment.title = trimmedTitle;
    }
    if (description !== undefined) assignment.description = String(description || '').trim();
    if (type !== undefined) assignment.type = type === 'quiz' ? 'quiz' : 'text';
    if (questions !== undefined) {
      const normalizedQuestions = normalizeQuestions(questions);
      if ((type === 'quiz' || assignment.type === 'quiz') && !normalizedQuestions.length) {
        return res.status(400).json({ message: 'Bai trac nghiem can it nhat 1 cau hoi va moi cau co toi thieu 2 dap an.' });
      }
      assignment.questions = assignment.type === 'quiz' ? normalizedQuestions : [];
    }
    if (dueAt !== undefined) assignment.dueAt = dueAt ? new Date(dueAt) : null;

    await assignment.save();
    res.json({ message: 'Da cap nhat bai tap.', assignment });
  } catch (error) {
    console.error('Loi cap nhat bai tap:', error);
    res.status(500).json({ message: 'Khong cap nhat duoc bai tap.' });
  }
};

const deleteAssignment = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Loi xoa bai tap:', error);
    res.status(500).json({ message: 'Khong xoa duoc bai tap.' });
  }
};

const upsertSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content, fileUrl, answers } = req.body || {};
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
        content: `Da nop trac nghiem (${correctCount}/${questions.length} cau dung).`,
        fileUrl: '',
        answers: normalizedAnswers.slice(0, questions.length),
        autoScore: score,
        status: 'graded',
        score,
        feedback: `${correctCount}/${questions.length} cau dung`,
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

    const submission = await Submission.findOneAndUpdate(
      { assignment: assignment._id, student: req.currentUser._id },
      {
        $set: submissionPayload,
        ...(assignment.type === 'quiz' ? {} : { $unset: { gradedAt: '' } })
      },
      { new: true, upsert: true }
    );

    res.json({ message: 'Da nop bai.', submission });
  } catch (error) {
    console.error('Loi nop bai:', error);
    res.status(500).json({ message: 'Khong nop duoc bai.' });
  }
};

const listSubmissions = async (req, res) => {
  try {
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

    const submissions = await Submission.find({ assignment: assignment._id })
      .sort({ submittedAt: -1 })
      .lean();

    res.json({ submissions });
  } catch (error) {
    console.error('Loi lay danh sach nop bai:', error);
    res.status(500).json({ message: 'Khong tai duoc danh sach bai nop.' });
  }
};

const gradeSubmission = async (req, res) => {
  try {
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
    } else if (score !== undefined && !Number.isNaN(Number(score))) {
      submission.score = Number(score);
    }
    if (feedback !== undefined) {
      submission.feedback = String(feedback).trim();
    }
    submission.status = 'graded';
    submission.gradedAt = new Date();

    await submission.save();

    res.json({ message: 'Da cham bai.', submission });
  } catch (error) {
    console.error('Loi cham bai:', error);
    res.status(500).json({ message: 'Khong cham duoc bai.' });
  }
};

module.exports = {
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  upsertSubmission,
  listSubmissions,
  gradeSubmission
};

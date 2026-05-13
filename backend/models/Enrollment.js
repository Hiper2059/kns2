const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      default: null
    },
    note: {
      type: String,
      default: ''
    },
    updatedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    courseTitle: {
      type: String,
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teacherName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['enrolled', 'completed'],
      default: 'enrolled'
    },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    progressPercent: {
      type: Number,
      default: 0
    },
    evaluation: {
      type: evaluationSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);

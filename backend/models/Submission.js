const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: false,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    studentName: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    fileUrl: {
      type: String,
      default: ''
    },
    videoUrl: {
      type: String,
      default: ''
    },
    answers: {
      type: [Number],
      default: []
    },
    autoScore: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'revision_requested'],
      default: 'submitted'
    },
    score: {
      type: Number,
      default: null
    },
    feedback: {
      type: String,
      default: ''
    },
    submittedAt: {
      type: Date,
      default: null
    },
    gradedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);

const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: false,
      index: true
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: false,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['text', 'quiz', 'practical', 'final_exam'],
      default: 'text'
    },
    isFinal: {
      type: Boolean,
      default: false
    },
    questions: {
      type: [
        {
          question: { type: String, default: '' },
          options: { type: [String], default: [] },
          correctOptionIndex: { type: Number, default: 0 }
        }
      ],
      default: []
    },
    dueAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByName: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);

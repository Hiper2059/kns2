const mongoose = require('mongoose');

const lessonViewSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    userRole: {
      type: String,
      default: ''
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

lessonViewSchema.index({ lesson: 1, viewedAt: -1 });
lessonViewSchema.index({ user: 1, lesson: 1, viewedAt: -1 });
lessonViewSchema.index({ course: 1, viewedAt: -1 });

module.exports = mongoose.model('LessonView', lessonViewSchema);

const mongoose = require('mongoose');

const lessonCommentSchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    authorName: { type: String, default: '' },
    content: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

lessonCommentSchema.index({ lesson: 1, createdAt: 1 });

module.exports = mongoose.model('LessonComment', lessonCommentSchema);

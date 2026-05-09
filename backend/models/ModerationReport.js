const mongoose = require('mongoose');

const moderationReportSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['post', 'comment'],
      required: true
    },
    targetId: {
      type: String,
      required: true,
      trim: true
    },
    targetAuthor: {
      type: String,
      trim: true,
      default: ''
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    reporter: {
      type: String,
      required: true,
      trim: true
    },
    decision: {
      type: String,
      enum: ['keep', 'delete'],
      required: true
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    },
    confidence: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ModerationReport', moderationReportSchema);

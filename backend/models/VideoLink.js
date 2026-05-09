const mongoose = require('mongoose');

const videoLinkSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    addedBy: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('VideoLink', videoLinkSchema);

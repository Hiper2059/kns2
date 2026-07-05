const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            default: ''
        },
        videoUrl: {
            type: String,
            default: ''
        },
        imageUrl: {
            type: String,
            default: ''
        },
        attachmentUrl: {
            type: String,
            default: ''
        },
        attachmentName: {
            type: String,
            default: ''
        },
        slug: {
            type: String,
            default: ''
        },
        order: {
            type: Number,
            default: 1
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdByName: {
            type: String,
            default: ''
        },
        heartUserIds: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Lesson', lessonSchema);

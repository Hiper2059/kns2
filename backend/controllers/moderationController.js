const mongoose = require('mongoose');
const ModerationReport = require('../models/ModerationReport');
const ForumPost = require('../models/ForumPost');
const ForumComment = require('../models/ForumComment');
const User = require('../models/User');
const { evaluateModeration } = require('../services/moderationService');

const createReport = async (req, res) => {
  try {
    const { targetType, targetId, targetAuthor, content } = req.body;
    const reporter = req.currentUser?.username || '';

    if (!targetType || !targetId || !content || !reporter) {
      return res.status(400).json({ message: 'Thiếu dữ liệu report.' });
    }

    if (!['post', 'comment'].includes(targetType)) {
      return res.status(400).json({ message: 'targetType không hợp lệ.' });
    }

    const moderation = await evaluateModeration(content.trim());
    const report = await ModerationReport.create({
      targetType,
      targetId: String(targetId),
      targetAuthor: targetAuthor ? String(targetAuthor).trim() : '',
      content: content.trim(),
      reporter: String(reporter).trim(),
      decision: moderation.decision,
      reason: moderation.reason,
      confidence: moderation.confidence
    });

    if (moderation.decision === 'delete') {
      const hasValidObjectId = mongoose.Types.ObjectId.isValid(targetId);
      if (targetType === 'post') {
        if (hasValidObjectId) {
          const deletedAt = new Date();
          await ForumComment.updateMany(
            { postId: targetId, isDeleted: false },
            {
              $set: {
                isDeleted: true,
                deletedAt,
                deletedBy: 'ai_moderation',
                deletionReason: 'ai_moderation'
              }
            }
          );
          await ForumPost.updateOne(
            { _id: targetId },
            {
              $set: {
                isDeleted: true,
                deletedAt,
                deletedBy: 'ai_moderation',
                deletionReason: 'ai_moderation'
              }
            }
          );
        }
      } else {
        if (hasValidObjectId) {
          await ForumComment.updateOne(
            { _id: targetId },
            {
              $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: 'ai_moderation',
                deletionReason: 'ai_moderation'
              }
            }
          );
        }
      }
    }

    let accountStatus = null;
    let violationCount = 0;

    if (moderation.decision === 'delete' && targetAuthor) {
      const violatingUser = await User.findOne({ username: String(targetAuthor).trim() });
      if (violatingUser) {
        if (violatingUser.role === 'admin') {
          if (violatingUser.status !== 'active') {
            violatingUser.status = 'active';
          }
          if ((violatingUser.violationCount || 0) !== 0) {
            violatingUser.violationCount = 0;
          }
          if (violatingUser.lastViolationAt) {
            violatingUser.lastViolationAt = null;
          }
          await violatingUser.save();
          accountStatus = 'active';
          violationCount = 0;
        } else {
          violatingUser.violationCount = (violatingUser.violationCount || 0) + 1;
          violatingUser.lastViolationAt = new Date();

          if (violatingUser.violationCount >= 3 && violatingUser.status === 'active') {
            violatingUser.status = 'suspended';
          }

          await violatingUser.save();
          accountStatus = violatingUser.status;
          violationCount = violatingUser.violationCount;
        }
      }
    }

    res.json({
      message: moderation.decision === 'delete' ? 'Nội dung vi phạm đã bị gỡ.' : 'Nội dung không vi phạm, giữ lại.',
      shouldDelete: moderation.decision === 'delete',
      reason: moderation.reason,
      confidence: moderation.confidence,
      reportId: report._id,
      accountStatus,
      violationCount
    });
  } catch (error) {
    console.error('Loi moderation report:', error);
    res.status(500).json({ message: 'Không xử lý được báo cáo nội dung.' });
  }
};

const listReports = async (req, res) => {
  try {
    const reports = await ModerationReport.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ reports });
  } catch (error) {
    console.error('Loi lay moderation reports:', error);
    res.status(500).json({ message: 'Không tải được lịch sử kiểm duyệt.' });
  }
};

const deleteReport = async (req, res) => {
  try {
    const deleted = await ModerationReport.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy report để xóa.' });
    }

    res.json({ message: 'Đã xóa report kiểm duyệt.' });
  } catch (error) {
    console.error('Loi xoa moderation report:', error);
    res.status(500).json({ message: 'Không xóa được report kiểm duyệt.' });
  }
};

const clearReports = async (req, res) => {
  try {
    const result = await ModerationReport.deleteMany({});
    res.json({
      message: `Đã xóa ${result.deletedCount || 0} report kiểm duyệt.`,
      deletedCount: result.deletedCount || 0
    });
  } catch (error) {
    console.error('Loi xoa tat ca moderation reports:', error);
    res.status(500).json({ message: 'Không xóa được toàn bộ report kiểm duyệt.' });
  }
};

module.exports = {
  createReport,
  listReports,
  deleteReport,
  clearReports
};

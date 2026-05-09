const mongoose = require('mongoose');
const ForumPost = require('../models/ForumPost');
const ForumComment = require('../models/ForumComment');

const getPosts = async (req, res) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const category = req.query.category ? String(req.query.category).trim() : '';
    const pageRaw = Number(req.query.page);
    const limitRaw = Number(req.query.limit);

    const filter = { isDeleted: false };

    if (category) {
      filter.category = category;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: regex }, { content: regex }, { category: regex }, { author: regex }];
    }

    const usePaging = Number.isFinite(pageRaw) || Number.isFinite(limitRaw);

    if (!usePaging) {
      const posts = await ForumPost.find(filter).sort({ createdAt: -1 }).lean();
      return res.json({ posts });
    }

    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 50) : 10;
    const skip = (page - 1) * limit;

    const [posts, totalItems] = await Promise.all([
      ForumPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ForumPost.countDocuments(filter)
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    res.json({
      posts,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Loi lay forum posts:', error);
    res.status(500).json({ message: 'Không tải được bài viết diễn đàn.' });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Thiếu title, content hoặc category.' });
    }

    const created = await ForumPost.create({
      author: req.currentUser.username,
      title: title.trim(),
      content: content.trim(),
      category: category.trim()
    });

    res.status(201).json({ post: created });
  } catch (error) {
    console.error('Loi tao forum post:', error);
    res.status(500).json({ message: 'Không tạo được bài viết.' });
  }
};

const getComments = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    if (req.query.postId) {
      filter.postId = req.query.postId;
    }

    const comments = await ForumComment.find(filter).sort({ createdAt: 1 }).lean();
    res.json({ comments });
  } catch (error) {
    console.error('Loi lay forum comments:', error);
    res.status(500).json({ message: 'Không tải được bình luận.' });
  }
};

const createComment = async (req, res) => {
  try {
    const { postId, text } = req.body;

    if (!postId || !text) {
      return res.status(400).json({ message: 'Thiếu postId hoặc text.' });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'postId không hợp lệ.' });
    }

    const postExists = await ForumPost.exists({ _id: postId });
    if (!postExists) {
      return res.status(404).json({ message: 'Bài viết không tồn tại.' });
    }

    const created = await ForumComment.create({
      postId,
      author: req.currentUser.username,
      text: text.trim()
    });

    res.status(201).json({ comment: created });
  } catch (error) {
    console.error('Loi tao forum comment:', error);
    res.status(500).json({ message: 'Không tạo được bình luận.' });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
    }

    const isOwner = post.author === req.currentUser.username;
    const isAdmin = req.currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này.' });
    }

    const deletedAt = new Date();
    await ForumComment.updateMany(
      { postId: post._id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt,
          deletedBy: req.currentUser.username,
          deletionReason: 'post_deleted'
        }
      }
    );
    await ForumPost.updateOne(
      { _id: post._id },
      {
        $set: {
          isDeleted: true,
          deletedAt,
          deletedBy: req.currentUser.username,
          deletionReason: 'manual_delete'
        }
      }
    );

    res.json({ message: 'Đã xóa bài viết thành công.' });
  } catch (error) {
    console.error('Loi xoa forum post:', error);
    res.status(500).json({ message: 'Không xóa được bài viết.' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Không tìm thấy bình luận.' });
    }

    const isOwner = comment.author === req.currentUser.username;
    const isAdmin = req.currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này.' });
    }

    await ForumComment.updateOne(
      { _id: comment._id },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.currentUser.username,
          deletionReason: 'manual_delete'
        }
      }
    );
    res.json({ message: 'Đã xóa bình luận thành công.' });
  } catch (error) {
    console.error('Loi xoa forum comment:', error);
    res.status(500).json({ message: 'Không xóa được bình luận.' });
  }
};

const getDeletedPosts = async (req, res) => {
  try {
    const reason = req.query.reason ? String(req.query.reason).trim() : '';
    const filter = { isDeleted: true };

    if (reason && reason !== 'all') {
      filter.deletionReason = reason;
    }

    const posts = await ForumPost.find(filter).sort({ deletedAt: -1 }).limit(100).lean();
    res.json({ posts });
  } catch (error) {
    console.error('Loi lay deleted posts:', error);
    res.status(500).json({ message: 'Không tải được danh sách bài đã xóa.' });
  }
};

const getDeletedComments = async (req, res) => {
  try {
    const reason = req.query.reason ? String(req.query.reason).trim() : '';
    const filter = { isDeleted: true };

    if (reason && reason !== 'all') {
      filter.deletionReason = reason;
    }

    const comments = await ForumComment.find(filter).sort({ deletedAt: -1 }).limit(200).lean();
    res.json({ comments });
  } catch (error) {
    console.error('Loi lay deleted comments:', error);
    res.status(500).json({ message: 'Không tải được danh sách bình luận đã xóa.' });
  }
};

const deleteDeletedPost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
    }

    if (!post.isDeleted) {
      return res.status(400).json({ message: 'Bài viết này chưa ở trạng thái đã ẩn.' });
    }

    await ForumComment.deleteMany({ postId: post._id });
    await ForumPost.deleteOne({ _id: post._id });

    res.json({ message: 'Đã xóa vĩnh viễn bài viết và bình luận liên quan.' });
  } catch (error) {
    console.error('Loi xoa vinh vien post:', error);
    res.status(500).json({ message: 'Không xóa vĩnh viễn được bài viết.' });
  }
};

const deleteDeletedComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Không tìm thấy bình luận.' });
    }

    if (!comment.isDeleted) {
      return res.status(400).json({ message: 'Bình luận này chưa ở trạng thái đã ẩn.' });
    }

    await ForumComment.deleteOne({ _id: comment._id });

    res.json({ message: 'Đã xóa vĩnh viễn bình luận.' });
  } catch (error) {
    console.error('Loi xoa vinh vien comment:', error);
    res.status(500).json({ message: 'Không xóa vĩnh viễn được bình luận.' });
  }
};

const restorePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
    }

    post.isDeleted = false;
    post.deletedAt = null;
    post.deletedBy = null;
    post.deletionReason = null;
    await post.save();

    await ForumComment.updateMany(
      { postId: post._id, deletionReason: 'post_deleted' },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          deletionReason: null
        }
      }
    );

    res.json({ message: 'Đã khôi phục bài viết.' });
  } catch (error) {
    console.error('Loi restore post:', error);
    res.status(500).json({ message: 'Không khôi phục được bài viết.' });
  }
};

const restoreComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Không tìm thấy bình luận.' });
    }

    comment.isDeleted = false;
    comment.deletedAt = null;
    comment.deletedBy = null;
    comment.deletionReason = null;
    await comment.save();

    res.json({ message: 'Đã khôi phục bình luận.' });
  } catch (error) {
    console.error('Loi restore comment:', error);
    res.status(500).json({ message: 'Không khôi phục được bình luận.' });
  }
};

module.exports = {
  getPosts,
  createPost,
  getComments,
  createComment,
  deletePost,
  deleteComment,
  getDeletedPosts,
  getDeletedComments,
  deleteDeletedPost,
  deleteDeletedComment,
  restorePost,
  restoreComment
};

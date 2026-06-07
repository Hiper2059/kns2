const mongoose = require('mongoose');
const ForumPost = require('../models/ForumPost');
const ForumComment = require('../models/ForumComment');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { isStudentRole } = require('../utils/userUtils');

const normalizeScope = value => (value === 'course' ? 'course' : 'general');
const generalForumPostCondition = () => ({ $or: [{ scope: { $exists: false } }, { scope: 'general' }] });
const impossibleObjectId = () => new mongoose.Types.ObjectId();

const ensureCourseForumAccess = async (req, res, courseId, actionLabel = 'truy cap dien dan lop') => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    res.status(400).json({ message: 'courseId khong hop le.' });
    return null;
  }

  const course = await Course.findById(courseId).lean();
  if (!course) {
    res.status(404).json({ message: 'Khong tim thay lop hoc.' });
    return null;
  }

  if (!req.currentUser) {
    res.status(401).json({ message: `Can dang nhap de ${actionLabel}.` });
    return null;
  }

  if (req.currentUser.role === 'admin') {
    return course;
  }

  if (req.currentUser.role === 'teacher') {
    if (String(course.teacher) === String(req.currentUser._id)) {
      return course;
    }

    res.status(403).json({ message: 'Ban khong co quyen truy cap dien dan lop nay.' });
    return null;
  }

  if (isStudentRole(req.currentUser.role)) {
    const enrolled = await Enrollment.findOne({
      course: course._id,
      student: req.currentUser._id
    }).lean();

    if (enrolled) {
      return course;
    }

    res.status(403).json({ message: 'Cau can tham gia lop truoc khi vao dien dan lop.' });
    return null;
  }

  res.status(403).json({ message: 'Ban khong co quyen truy cap dien dan lop nay.' });
  return null;
};

const ensurePostForumAccess = async (req, res, post, actionLabel = 'truy cap dien dan lop') => {
  if (!post || post.isDeleted) {
    res.status(404).json({ message: 'Khong tim thay bai viet.' });
    return null;
  }

  if ((post.scope || 'general') !== 'course') {
    return { post, course: null };
  }

  const course = await ensureCourseForumAccess(req, res, post.course, actionLabel);
  if (!course) {
    return null;
  }

  return { post, course };
};

const formatPostForUser = (post, userKey) => ({
  ...post,
  heartCount: (post.heartUserIds || []).length,
  isHearted: userKey ? (post.heartUserIds || []).some(item => String(item) === userKey) : false
});

const getPosts = async (req, res) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const category = req.query.category ? String(req.query.category).trim() : '';
    const scope = normalizeScope(String(req.query.scope || '').trim());
    const courseId = req.query.courseId ? String(req.query.courseId).trim() : '';
    const pageRaw = Number(req.query.page);
    const limitRaw = Number(req.query.limit);

    const andConditions = [{ isDeleted: false }];

    if (scope === 'course') {
      const course = await ensureCourseForumAccess(req, res, courseId, 'xem dien dan lop');
      if (!course) {
        return;
      }
      andConditions.push({ scope: 'course', course: course._id });
    } else {
      andConditions.push(generalForumPostCondition());
    }

    if (category) {
      andConditions.push({ category });
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      andConditions.push({ $or: [{ title: regex }, { content: regex }, { category: regex }, { author: regex }] });
    }

    const filter = { $and: andConditions };
    const usePaging = Number.isFinite(pageRaw) || Number.isFinite(limitRaw);
    const userKey = req.currentUser?._id ? String(req.currentUser._id) : '';

    if (!usePaging) {
      const posts = await ForumPost.find(filter).sort({ createdAt: -1 }).lean();
      return res.json({ posts: posts.map(post => formatPostForUser(post, userKey)) });
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
      posts: posts.map(post => formatPostForUser(post, userKey)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Loi lay forum posts:', error);
    res.status(500).json({ message: 'Khong tai duoc bai viet dien dan.' });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, content, category, scope: scopeRaw, courseId } = req.body || {};
    const scope = normalizeScope(String(scopeRaw || '').trim());
    const trimmedTitle = String(title || '').trim();
    const trimmedContent = String(content || '').trim();
    const trimmedCategory = String(category || '').trim();

    if (!trimmedTitle || !trimmedContent || !trimmedCategory) {
      return res.status(400).json({ message: 'Thieu title, content hoac category.' });
    }

    let course = null;
    if (scope === 'course') {
      course = await ensureCourseForumAccess(req, res, courseId, 'dang bai trong dien dan lop');
      if (!course) {
        return;
      }
    }

    const created = await ForumPost.create({
      author: req.currentUser.username,
      title: trimmedTitle,
      content: trimmedContent,
      category: trimmedCategory,
      scope,
      course: scope === 'course' ? course._id : null
    });

    const payload = created.toObject();
    payload.heartCount = (payload.heartUserIds || []).length;
    payload.isHearted = false;

    res.status(201).json({ post: payload });
  } catch (error) {
    console.error('Loi tao forum post:', error);
    res.status(500).json({ message: 'Khong tao duoc bai viet.' });
  }
};

const getPostIdsForCommentQuery = async (req, res) => {
  if (req.query.postId) {
    const postId = String(req.query.postId).trim();
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: 'postId khong hop le.' });
      return null;
    }

    const post = await ForumPost.findById(postId).lean();
    const access = await ensurePostForumAccess(req, res, post, 'xem binh luan lop');
    return access ? [post._id] : null;
  }

  if (req.query.postIds) {
    const ids = String(req.query.postIds)
      .split(',')
      .map(item => item.trim())
      .filter(item => mongoose.Types.ObjectId.isValid(item));

    if (!ids.length) {
      return [impossibleObjectId()];
    }

    const posts = await ForumPost.find({ _id: { $in: ids }, isDeleted: false }).lean();
    for (const post of posts) {
      const access = await ensurePostForumAccess(req, res, post, 'xem binh luan lop');
      if (!access) {
        return null;
      }
    }

    return posts.length ? posts.map(post => post._id) : [impossibleObjectId()];
  }

  const scope = normalizeScope(String(req.query.scope || '').trim());
  const postFilter = { isDeleted: false };

  if (scope === 'course') {
    const courseId = req.query.courseId ? String(req.query.courseId).trim() : '';
    const course = await ensureCourseForumAccess(req, res, courseId, 'xem binh luan lop');
    if (!course) {
      return null;
    }

    postFilter.scope = 'course';
    postFilter.course = course._id;
  } else {
    Object.assign(postFilter, generalForumPostCondition());
  }

  const posts = await ForumPost.find(postFilter, { _id: 1 }).lean();
  return posts.length ? posts.map(item => item._id) : [impossibleObjectId()];
};

const getComments = async (req, res) => {
  try {
    const postIds = await getPostIdsForCommentQuery(req, res);
    if (!postIds) {
      return;
    }

    const comments = await ForumComment.find({
      isDeleted: false,
      postId: { $in: postIds }
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ comments });
  } catch (error) {
    console.error('Loi lay forum comments:', error);
    res.status(500).json({ message: 'Khong tai duoc binh luan.' });
  }
};

const createComment = async (req, res) => {
  try {
    const { postId, text } = req.body || {};
    const trimmedText = String(text || '').trim();

    if (!postId || !trimmedText) {
      return res.status(400).json({ message: 'Thieu postId hoac text.' });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'postId khong hop le.' });
    }

    const post = await ForumPost.findById(postId).lean();
    const access = await ensurePostForumAccess(req, res, post, 'binh luan trong dien dan lop');
    if (!access) {
      return;
    }

    const created = await ForumComment.create({
      postId: post._id,
      author: req.currentUser.username,
      text: trimmedText
    });

    res.status(201).json({ comment: created });
  } catch (error) {
    console.error('Loi tao forum comment:', error);
    res.status(500).json({ message: 'Khong tao duoc binh luan.' });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Khong tim thay bai viet.' });
    }

    const isOwner = post.author === req.currentUser.username;
    const isAdmin = req.currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Ban khong co quyen xoa bai viet nay.' });
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

    res.json({ message: 'Da xoa bai viet thanh cong.' });
  } catch (error) {
    console.error('Loi xoa forum post:', error);
    res.status(500).json({ message: 'Khong xoa duoc bai viet.' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Khong tim thay binh luan.' });
    }

    const isOwner = comment.author === req.currentUser.username;
    const isAdmin = req.currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Ban khong co quyen xoa binh luan nay.' });
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
    res.json({ message: 'Da xoa binh luan thanh cong.' });
  } catch (error) {
    console.error('Loi xoa forum comment:', error);
    res.status(500).json({ message: 'Khong xoa duoc binh luan.' });
  }
};

const listAllCommentsForAdmin = async (req, res) => {
  try {
    const comments = await ForumComment.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    const postIds = [...new Set(comments.map(comment => String(comment.postId)).filter(Boolean))];
    const posts = postIds.length
      ? await ForumPost.find({ _id: { $in: postIds } }, { title: 1, scope: 1, course: 1, category: 1 }).lean()
      : [];
    const postById = posts.reduce((acc, post) => {
      acc[String(post._id)] = post;
      return acc;
    }, {});

    const courseIds = [...new Set(posts.map(post => String(post.course || '')).filter(Boolean))];
    const courses = courseIds.length
      ? await Course.find({ _id: { $in: courseIds } }, { title: 1 }).lean()
      : [];
    const courseById = courses.reduce((acc, course) => {
      acc[String(course._id)] = course;
      return acc;
    }, {});

    res.json({
      comments: comments.map(comment => {
        const post = postById[String(comment.postId)] || null;
        const course = post?.course ? courseById[String(post.course)] || null : null;
        return {
          ...comment,
          postTitle: post?.title || '',
          postScope: post?.scope || 'general',
          postCategory: post?.category || '',
          courseTitle: course?.title || ''
        };
      })
    });
  } catch (error) {
    console.error('Loi lay tat ca binh luan forum:', error);
    res.status(500).json({ message: 'Khong tai duoc danh sach binh luan dien dan.' });
  }
};

const punishCommentAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { penalty = 'warn', reason = '' } = req.body || {};
    const comment = await ForumComment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Khong tim thay binh luan.' });
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.deletedBy = req.currentUser.username;
    comment.deletionReason = reason ? `admin_${penalty}_${reason}` : `admin_${penalty}`;
    await comment.save();

    let accountStatus = null;
    let violationCount = null;
    const targetUser = await User.findOne({ username: comment.author });
    if (targetUser && targetUser.role !== 'admin') {
      targetUser.violationCount = (targetUser.violationCount || 0) + 1;
      targetUser.lastViolationAt = new Date();

      if (penalty === 'ban') {
        targetUser.status = 'banned';
      } else if (penalty === 'suspend' || targetUser.violationCount >= 3) {
        targetUser.status = 'suspended';
      }

      await targetUser.save();
      accountStatus = targetUser.status;
      violationCount = targetUser.violationCount;
    }

    res.json({
      message: 'Da xoa binh luan va cap nhat vi pham tai khoan.',
      accountStatus,
      violationCount
    });
  } catch (error) {
    console.error('Loi phat tac gia binh luan:', error);
    res.status(500).json({ message: 'Khong phat duoc tac gia binh luan.' });
  }
};

const togglePostReaction = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    const access = await ensurePostForumAccess(req, res, post, 'tha tim bai viet lop');
    if (!access) {
      return;
    }

    const userKey = req.currentUser?._id ? String(req.currentUser._id) : '';
    if (!userKey) {
      return res.status(401).json({ message: 'Can dang nhap de tha tim.' });
    }

    const existingIndex = (post.heartUserIds || []).findIndex(item => String(item) === userKey);
    if (existingIndex >= 0) {
      post.heartUserIds.splice(existingIndex, 1);
    } else {
      post.heartUserIds.push(userKey);
    }

    await post.save();

    const heartCount = post.heartUserIds.length;
    const isHearted = post.heartUserIds.some(item => String(item) === userKey);
    res.json({ heartCount, isHearted });
  } catch (error) {
    console.error('Loi tha tim forum post:', error);
    res.status(500).json({ message: 'Khong tha tim duoc.' });
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
    res.status(500).json({ message: 'Khong tai duoc danh sach bai da xoa.' });
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
    res.status(500).json({ message: 'Khong tai duoc danh sach binh luan da xoa.' });
  }
};

const deleteDeletedPost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Khong tim thay bai viet.' });
    }

    if (!post.isDeleted) {
      return res.status(400).json({ message: 'Bai viet nay chua o trang thai da an.' });
    }

    await ForumComment.deleteMany({ postId: post._id });
    await ForumPost.deleteOne({ _id: post._id });

    res.json({ message: 'Da xoa vinh vien bai viet va binh luan lien quan.' });
  } catch (error) {
    console.error('Loi xoa vinh vien post:', error);
    res.status(500).json({ message: 'Khong xoa vinh vien duoc bai viet.' });
  }
};

const deleteDeletedComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Khong tim thay binh luan.' });
    }

    if (!comment.isDeleted) {
      return res.status(400).json({ message: 'Binh luan nay chua o trang thai da an.' });
    }

    await ForumComment.deleteOne({ _id: comment._id });

    res.json({ message: 'Da xoa vinh vien binh luan.' });
  } catch (error) {
    console.error('Loi xoa vinh vien comment:', error);
    res.status(500).json({ message: 'Khong xoa vinh vien duoc binh luan.' });
  }
};

const restorePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Khong tim thay bai viet.' });
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

    res.json({ message: 'Da khoi phuc bai viet.' });
  } catch (error) {
    console.error('Loi restore post:', error);
    res.status(500).json({ message: 'Khong khoi phuc duoc bai viet.' });
  }
};

const restoreComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Khong tim thay binh luan.' });
    }

    comment.isDeleted = false;
    comment.deletedAt = null;
    comment.deletedBy = null;
    comment.deletionReason = null;
    await comment.save();

    res.json({ message: 'Da khoi phuc binh luan.' });
  } catch (error) {
    console.error('Loi restore comment:', error);
    res.status(500).json({ message: 'Khong khoi phuc duoc binh luan.' });
  }
};

module.exports = {
  getPosts,
  createPost,
  getComments,
  createComment,
  deletePost,
  deleteComment,
  listAllCommentsForAdmin,
  punishCommentAuthor,
  togglePostReaction,
  getDeletedPosts,
  getDeletedComments,
  deleteDeletedPost,
  deleteDeletedComment,
  restorePost,
  restoreComment
};

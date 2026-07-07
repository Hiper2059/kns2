const mongoose = require('mongoose');
const ForumPost = require('../models/ForumPost');
const ForumComment = require('../models/ForumComment');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { isStudentRole } = require('../utils/userUtils');
const { getPaginationParams, buildPagination } = require('../utils/pagination');
const catchAsync = require('../utils/catchAsync');
const { getDisplayNameMapByUsernames, getProfileForUser } = require('../services/userProfileService');

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

const getPosts = catchAsync(async (req, res) => {
  const search = req.query.search ? String(req.query.search).trim() : '';
  const category = req.query.category ? String(req.query.category).trim() : '';
  const scope = normalizeScope(String(req.query.scope || '').trim());
  const courseId = req.query.courseId ? String(req.query.courseId).trim() : '';
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
  const userKey = req.currentUser?._id ? String(req.currentUser._id) : '';
  const { page, limit, skip } = getPaginationParams(req.query);

  const [posts, totalItems] = await Promise.all([
    ForumPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ForumPost.countDocuments(filter)
  ]);

  const authorUsernames = [...new Set(posts.map(p => p.author))];
  const authorMap = await getDisplayNameMapByUsernames(authorUsernames);

  const formattedPosts = posts.map(post => {
    const formatted = formatPostForUser(post, userKey);
    formatted.authorDisplayName = authorMap[post.author] || post.author;
    return formatted;
  });
  
  res.json({
    data: formattedPosts,
    posts: formattedPosts,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const createPost = catchAsync(async (req, res) => {
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
  const currentProfile = await getProfileForUser(req.currentUser);
  payload.authorDisplayName = currentProfile.displayName || req.currentUser?.username || created.author;

  res.status(201).json({ post: payload });
});

const updatePost = catchAsync(async (req, res) => {
  const { title, content, category } = req.body || {};
  const trimmedTitle = String(title || '').trim();
  const trimmedContent = String(content || '').trim();
  const trimmedCategory = String(category || '').trim();

  if (!trimmedTitle || !trimmedContent || !trimmedCategory) {
    return res.status(400).json({ message: 'Thieu title, content hoac category.' });
  }

  const post = await ForumPost.findById(req.params.id);
  const access = await ensurePostForumAccess(req, res, post, 'sua bai viet lop');
  if (!access) {
    return;
  }

  const isOwner = post.author === req.currentUser.username;
  const isAdmin = req.currentUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Ban khong co quyen sua bai viet nay.' });
  }

  post.title = trimmedTitle;
  post.content = trimmedContent;
  post.category = trimmedCategory;
  await post.save();

  const payload = post.toObject();
  payload.heartCount = (payload.heartUserIds || []).length;
  payload.isHearted = req.currentUser?._id
    ? (payload.heartUserIds || []).some(item => String(item) === String(req.currentUser._id))
    : false;
  const authorMap = await getDisplayNameMapByUsernames([post.author]);
  payload.authorDisplayName = authorMap[post.author] || post.author;

  res.json({ post: payload, message: 'Da cap nhat bai viet thanh cong.' });
});

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

const getComments = catchAsync(async (req, res) => {
  const postIds = await getPostIdsForCommentQuery(req, res);
  if (!postIds) {
    return;
  }

  const filter = {
    isDeleted: false,
    postId: { $in: postIds }
  };
  const { page, limit, skip } = getPaginationParams(req.query);
  const [comments, totalItems] = await Promise.all([
    ForumComment.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ForumComment.countDocuments(filter)
  ]);

  const authorUsernames = [...new Set(comments.map(c => c.author))];
  const authorMap = await getDisplayNameMapByUsernames(authorUsernames);

  const formattedComments = comments.map(comment => {
    return { ...comment, authorDisplayName: authorMap[comment.author] || comment.author };
  });

  res.json({
    data: formattedComments,
    comments: formattedComments,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const createComment = catchAsync(async (req, res) => {
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

  const payload = created.toObject();
  const currentProfile = await getProfileForUser(req.currentUser);
  payload.authorDisplayName = currentProfile.displayName || req.currentUser?.username || created.author;

  res.status(201).json({ comment: payload });
});

const deletePost = catchAsync(async (req, res) => {
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
});

const deleteComment = catchAsync(async (req, res) => {
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
});

const punishCommentAuthor = catchAsync(async (req, res) => {
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
});

const togglePostReaction = catchAsync(async (req, res) => {
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
});

const getDeletedPosts = catchAsync(async (req, res) => {
  const reason = req.query.reason ? String(req.query.reason).trim() : '';
  const filter = { isDeleted: true };

  if (reason && reason !== 'all') {
    filter.deletionReason = reason;
  }

  const { page, limit, skip } = getPaginationParams(req.query);
  const [posts, totalItems] = await Promise.all([
    ForumPost.find(filter)
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ForumPost.countDocuments(filter)
  ]);

  res.json({
    data: posts,
    posts,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const getDeletedComments = catchAsync(async (req, res) => {
  const reason = req.query.reason ? String(req.query.reason).trim() : '';
  const filter = { isDeleted: true };

  if (reason && reason !== 'all') {
    filter.deletionReason = reason;
  }

  const { page, limit, skip } = getPaginationParams(req.query);
  const [comments, totalItems] = await Promise.all([
    ForumComment.find(filter)
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ForumComment.countDocuments(filter)
  ]);

  res.json({
    data: comments,
    comments,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const deleteDeletedPost = catchAsync(async (req, res) => {
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
});

const deleteDeletedComment = catchAsync(async (req, res) => {
  const comment = await ForumComment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({ message: 'Khong tim thay binh luan.' });
  }

  if (!comment.isDeleted) {
    return res.status(400).json({ message: 'Binh luan nay chua o trang thai da an.' });
  }

  await ForumComment.deleteOne({ _id: comment._id });

  res.json({ message: 'Da xoa vinh vien binh luan.' });
});

const restorePost = catchAsync(async (req, res) => {
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
});

const restoreComment = catchAsync(async (req, res) => {
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
});

module.exports = {
  getPosts,
  createPost,
  updatePost,
  getComments,
  createComment,
  deletePost,
  deleteComment,
  punishCommentAuthor,
  togglePostReaction,
  getDeletedPosts,
  getDeletedComments,
  deleteDeletedPost,
  deleteDeletedComment,
  restorePost,
  restoreComment
};

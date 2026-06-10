const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');
const { extractBearerToken } = require('../utils/token');
const { getEffectiveStatus } = require('../utils/userUtils');

const getUserFromRequest = async req => {
  const token = extractBearerToken(req);
  if (!token) {
    return { error: { status: 401, message: 'Thiếu access token.' } };
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.accessSecret);
  } catch {
    return { error: { status: 401, message: 'Access token không hợp lệ hoặc đã hết hạn.' } };
  }

  if (payload.sub === 'admin' && payload.role === 'admin' && payload.username === config.adminUsername) {
    return {
      user: {
        _id: 'admin',
        username: config.adminUsername,
        role: 'admin',
        status: 'active',
        violationCount: 0
      }
    };
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    return { error: { status: 401, message: 'Access token không hợp lệ.' } };
  }

  const user = await User.findById(payload.sub).lean();
  if (!user) {
    return { error: { status: 401, message: 'Người dùng không tồn tại.' } };
  }

  if (getEffectiveStatus(user) !== 'active') {
    return { error: { status: 403, message: 'Tài khoản không ở trạng thái active.' } };
  }

  return { user };
};

const requireActiveUser = async (req, res, next) => {
  try {
    const { user, error } = await getUserFromRequest(req);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    req.currentUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireRoles = allowedRoles => async (req, res, next) => {
  try {
    const { user, error } = await getUserFromRequest(req);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập.' });
    }

    req.currentUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAdmin = requireRoles(['admin']);
const requireTeacherOrAdmin = requireRoles(['teacher', 'admin']);

const optionalAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return next();
    }

    const { user } = await getUserFromRequest(req);
    if (user) {
      req.currentUser = user;
    }

    return next();
  } catch {
    return next();
  }
};

module.exports = { requireActiveUser, requireAdmin, requireTeacherOrAdmin, optionalAuth };

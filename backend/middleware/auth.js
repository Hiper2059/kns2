const jwt = require('jsonwebtoken');
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
    next();
  } catch (error) {
    console.error('Loi xac thuc user:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi xác thực user.' });
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
    next();
  } catch (error) {
    console.error('Loi kiem tra quyen:', error);
    res.status(500).json({ message: 'Loi he thong khi kiem tra quyen.' });
  }
};

const requireAdmin = requireRoles(['admin']);
const requireTeacherOrAdmin = requireRoles(['teacher', 'admin']);

module.exports = { requireActiveUser, requireAdmin, requireTeacherOrAdmin };

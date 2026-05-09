const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { extractBearerToken } = require('../utils/token');
const { getEffectiveStatus } = require('../utils/userUtils');

const requireActiveUser = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Thiếu access token.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwt.accessSecret);
    } catch {
      return res.status(401).json({ message: 'Access token không hợp lệ hoặc đã hết hạn.' });
    }

    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại.' });
    }

    if (getEffectiveStatus(user) !== 'active') {
      return res.status(403).json({ message: 'Tài khoản không ở trạng thái active.' });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Loi xac thuc user:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi xác thực user.' });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Thiếu access token.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwt.accessSecret);
    } catch {
      return res.status(401).json({ message: 'Access token không hợp lệ hoặc đã hết hạn.' });
    }

    const admin = await User.findById(payload.sub).lean();
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền quản trị.' });
    }

    if (getEffectiveStatus(admin) !== 'active') {
      return res.status(403).json({ message: 'Tài khoản không ở trạng thái active.' });
    }

    req.currentUser = admin;
    next();
  } catch (error) {
    console.error('Loi xac thuc admin:', error);
    res.status(500).json({ message: 'Loi he thong khi kiem tra quyen.' });
  }
};

module.exports = { requireActiveUser, requireAdmin };

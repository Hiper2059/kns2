const jwt = require('jsonwebtoken');
const config = require('../config/env');
const roles = require('../config/roles');
const User = require('../models/User');
const { createAuthTokens, createAuthTokensForPayload } = require('../utils/token');
const { comparePassword, hashPassword } = require('../utils/password');
const { getEffectiveStatus, getEffectiveViolationCount } = require('../utils/userUtils');

const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc mật khẩu.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu cần từ 6 ký tự trở lên.' });
    }

    const normalizedUsername = username.trim();
    const userExists = await User.findOne({ username: normalizedUsername });

    if (userExists) {
      return res.status(400).json({ message: 'Tài khoản đã tồn tại rồi cậu ơi!' });
    }

    const passwordHash = await hashPassword(password);
    await User.create({ username: normalizedUsername, passwordHash, role: roles.STUDENT });
    res.json({ message: 'Đăng ký thành công mỹ mãn!' });
  } catch (error) {
    console.error('Loi dang ky:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký.' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password, loginAs } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc mật khẩu.' });
    }

    if (loginAs === 'admin') {
      const adminUsername = config.adminUsername;
      const adminPassword = config.adminPassword;

      if (username.trim() !== adminUsername || password !== adminPassword) {
        return res.status(401).json({ message: 'Sai tên hoặc mật khẩu rồi, kiểm tra lại nhé!' });
      }

      const tokens = createAuthTokensForPayload({
        sub: 'admin',
        username: adminUsername,
        role: 'admin'
      });

      return res.json({
        message: 'Chào mừng cậu trở lại!',
        username: adminUsername,
        role: 'admin',
        status: 'active',
        violationCount: 0,
        ...tokens
      });
    }

    const normalizedUsername = username.trim();
    const user = await User.findOne({ username: normalizedUsername });

    if (!user) {
      return res.status(401).json({ message: 'Sai tên hoặc mật khẩu rồi, kiểm tra lại nhé!' });
    }

    if (loginAs === 'teacher' && user.role !== roles.TEACHER) {
      return res.status(403).json({ message: 'Tai khoan khong thuoc vai tro giang vien.' });
    }

    if (loginAs === 'student' && user.role !== roles.STUDENT) {
      return res.status(403).json({ message: 'Tai khoan khong thuoc vai tro hoc sinh.' });
    }

    if (!loginAs && user.role !== roles.STUDENT) {
      return res.status(403).json({ message: 'Vui long dang nhap dung duong dan theo vai tro.' });
    }

    let passwordValid = false;

    if (user.passwordHash) {
      passwordValid = await comparePassword(password, user.passwordHash);
    } else if (user.password) {
      passwordValid = user.password === password;
      if (passwordValid) {
        user.passwordHash = await hashPassword(password);
        user.password = undefined;
      }
    }

    if (!passwordValid) {
      return res.status(401).json({ message: 'Sai tên hoặc mật khẩu rồi, kiểm tra lại nhé!' });
    }

    const userStatus = getEffectiveStatus(user);

    if (userStatus !== 'active') {
      return res.status(403).json({
        message: `Tai khoan dang o trang thai ${userStatus}. Vui long lien he admin.`
      });
    }

    const tokens = createAuthTokens(user);
    user.refreshTokenHash = await hashPassword(tokens.refreshToken);
    user.signatureTokenHash = await hashPassword(tokens.signatureToken);
    await user.save();

    res.json({
      message: 'Chào mừng cậu trở lại!',
      username: user.username,
      role: user.role,
      status: userStatus,
      violationCount: getEffectiveViolationCount(user),
      ...tokens
    });
  } catch (error) {
    console.error('Loi dang nhap:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi đăng nhập.' });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Thiếu refresh token.' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch {
      return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn.' });
    }

    if (payload.sub === 'admin') {
      const tokens = createAuthTokensForPayload({
        sub: 'admin',
        username: config.adminUsername,
        role: 'admin'
      });
      return res.json(tokens);
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: 'Refresh token không hợp lệ.' });
    }

    const matches = await comparePassword(refreshToken, user.refreshTokenHash);
    if (!matches) {
      return res.status(401).json({ message: 'Refresh token không hợp lệ.' });
    }

    if (getEffectiveStatus(user) !== 'active') {
      return res.status(403).json({ message: 'Tài khoản không ở trạng thái active.' });
    }

    const tokens = createAuthTokens(user);
    user.refreshTokenHash = await hashPassword(tokens.refreshToken);
    user.signatureTokenHash = await hashPassword(tokens.signatureToken);
    await user.save();

    res.json(tokens);
  } catch (error) {
    console.error('Loi refresh token:', error);
    res.status(500).json({ message: 'Không thể làm mới phiên đăng nhập.' });
  }
};

module.exports = { register, login, refresh };

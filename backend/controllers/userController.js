const User = require('../models/User');
const { normalizeRole, allowedStatuses } = require('../utils/userUtils');

const listUsers = async (req, res) => {
  try {
    const safeUsers = await User.find(
      {},
      { username: 1, role: 1, status: 1, violationCount: 1, createdAt: 1, updatedAt: 1, _id: 0 }
    )
      .sort({ createdAt: -1 })
      .lean();
    res.json({ users: safeUsers });
  } catch (error) {
    console.error('Loi lay danh sach user:', error);
    res.status(500).json({ message: 'Không tải được danh sách user.' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { username, role } = req.body;

    if (!username || !role) {
      return res.status(400).json({ message: 'Thiếu username hoặc role.' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    user.role = normalizeRole(role);
    await user.save();
    res.json({ message: 'Cập nhật vai trò thành công.' });
  } catch (error) {
    console.error('Loi cap nhat role:', error);
    res.status(500).json({ message: 'Không cập nhật được vai trò user.' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { username, status } = req.body;

    if (!username || !status) {
      return res.status(400).json({ message: 'Thiếu username hoặc status.' });
    }

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ message: 'Status không hợp lệ.' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    user.status = status;
    await user.save();
    res.json({ message: 'Cập nhật trạng thái tài khoản thành công.' });
  } catch (error) {
    console.error('Loi cap nhat status:', error);
    res.status(500).json({ message: 'Không cập nhật được trạng thái tài khoản.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const username = req.params.username?.trim();
    const adminUsername = req.currentUser?.username;

    if (!username) {
      return res.status(400).json({ message: 'Thiếu username cần xóa.' });
    }

    if (username === adminUsername) {
      return res.status(400).json({ message: 'Không thể tự xóa tài khoản admin đang đăng nhập.' });
    }

    const deleted = await User.findOneAndDelete({ username });
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    res.json({ message: `Đã xóa tài khoản ${username}.` });
  } catch (error) {
    console.error('Loi xoa user:', error);
    res.status(500).json({ message: 'Không xóa được tài khoản.' });
  }
};

module.exports = {
  listUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser
};

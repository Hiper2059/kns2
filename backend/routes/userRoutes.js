const express = require('express');
const {
	createUser,
	listUsers,
	updateUserRole,
	updateUserStatus,
	deleteUser,
	getPublicProfile,
	getMyProfile,
	updateMyProfile
} = require('../controllers/userController');
const { requireAdmin, requireActiveUser } = require('../middleware/auth');

const router = express.Router();

router.get('/users', requireAdmin, listUsers);
router.post('/users', requireAdmin, createUser);
router.patch('/users/role', requireAdmin, updateUserRole);
router.patch('/users/status', requireAdmin, updateUserStatus);
router.delete('/users/:username', requireAdmin, deleteUser);

router.get('/users/me/profile', requireActiveUser, getMyProfile);
router.patch('/users/me/profile', requireActiveUser, updateMyProfile);
router.get('/users/:userId/profile', getPublicProfile);

module.exports = router;

const express = require('express');
const {
	createUser,
	listUsers,
	updateUserRole,
	updateUserStatus,
	updateUserDetails,
	deleteUser,
	getPublicProfile,
	getMyProfile,
	updateMyProfile
} = require('../controllers/userController');
const { requireAdmin, requireActiveUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, listUsers);
router.post('/', requireAdmin, createUser);
router.patch('/role', requireAdmin, updateUserRole);
router.patch('/status', requireAdmin, updateUserStatus);
router.delete('/:username', requireAdmin, deleteUser);
router.patch('/:username', requireAdmin, updateUserDetails);

router.get('/me/profile', requireActiveUser, getMyProfile);
router.patch('/me/profile', requireActiveUser, updateMyProfile);
router.get('/:userId/profile', getPublicProfile);

module.exports = router;

const express = require('express');
const { createUser, listUsers, updateUserRole, updateUserStatus, deleteUser } = require('../controllers/userController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/users', requireAdmin, listUsers);
router.post('/users', requireAdmin, createUser);
router.patch('/users/role', requireAdmin, updateUserRole);
router.patch('/users/status', requireAdmin, updateUserStatus);
router.delete('/users/:username', requireAdmin, deleteUser);

module.exports = router;

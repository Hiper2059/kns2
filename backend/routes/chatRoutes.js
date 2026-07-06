const express = require('express');
const { sendChat } = require('../controllers/chatController');
const { requireActiveUser } = require('../middleware/auth');
const { chatRateLimiter } = require('../middleware/securityRateLimiters');

const router = express.Router();

router.post('/', requireActiveUser, chatRateLimiter, sendChat);

module.exports = router;

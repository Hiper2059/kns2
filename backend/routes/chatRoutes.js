const express = require('express');
const { sendChat } = require('../controllers/chatController');
const { requireActiveUser } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireActiveUser, sendChat);

module.exports = router;

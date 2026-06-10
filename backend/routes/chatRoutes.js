const express = require('express');
const { sendChat } = require('../controllers/chatController');

const router = express.Router();

router.post('/', sendChat);

module.exports = router;

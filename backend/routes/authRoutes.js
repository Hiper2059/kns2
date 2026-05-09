const express = require('express');
const { register, login, refresh } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/auth/refresh', refresh);

module.exports = router;

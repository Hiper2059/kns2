const express = require('express');
const { register, login, refresh, logout } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema } = require('../validations/authValidation');

const router = express.Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;

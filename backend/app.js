const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const corsOptions = require('./config/cors');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const forumRoutes = require('./routes/forumRoutes');
const userRoutes = require('./routes/userRoutes');
const videoRoutes = require('./routes/videoRoutes');
const moderationRoutes = require('./routes/moderationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const lessonCommentsRoutes = require('./routes/lessonCommentsRoutes');
const commentRoutes = require('./routes/commentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const { login, register } = require('./controllers/authController');
const { friendlyMessages } = require('./middleware/friendlyMessages');
const errorHandler = require('./middleware/errorHandler');
const validate = require('./middleware/validate');
const { authRateLimiter } = require('./middleware/rateLimiter');
const { registerSchema, loginSchema } = require('./validations/authValidation');

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(friendlyMessages);

app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Z-Mate API</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #f4f7fb;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
    }
    main {
      width: min(560px, calc(100vw - 32px));
      padding: 28px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
    }
    h1 { margin: 0; font-size: 28px; line-height: 1.1; }
    p { margin: 10px 0 0; color: #64748b; font-size: 14px; line-height: 1.6; }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 18px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #ecfdf5;
      color: #047857;
      font-weight: 800;
      font-size: 13px;
    }
    .dot { width: 8px; height: 8px; border-radius: 999px; background: #10b981; }
    a {
      display: inline-flex;
      margin-top: 20px;
      color: #2563eb;
      font-weight: 800;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <main>
    <h1>Z-Mate API</h1>
    <p>Backend đang chạy. Trang này chỉ là màn kiểm tra nhanh, frontend chạy ở Vite.</p>
    <div class="status"><span class="dot"></span> OK</div>
    <br />
    <a href="/api/health">Kiểm tra /api/health</a>
  </main>
</body>
</html>`);
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/lessons', lessonCommentsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/categories', categoryRoutes);

// Temporary backward-compatible aliases while the frontend migrates to /api/auth/*.
app.post('/api/login', authRateLimiter, validate(loginSchema), login);
app.post('/api/register', authRateLimiter, validate(registerSchema), register);

app.use(errorHandler);

module.exports = app;

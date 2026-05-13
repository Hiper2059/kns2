const express = require('express');
const cors = require('cors');
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
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', forumRoutes);
app.use('/api', userRoutes);
app.use('/api', videoRoutes);
app.use('/api', moderationRoutes);
app.use('/api', chatRoutes);
app.use('/api', courseRoutes);
app.use('/api', lessonRoutes);
app.use('/api', enrollmentRoutes);
app.use('/api', uploadRoutes);

module.exports = app;

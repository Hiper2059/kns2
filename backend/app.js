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

module.exports = app;

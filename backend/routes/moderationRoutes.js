const express = require('express');
const { createReport, listReports, deleteReport, clearReports } = require('../controllers/moderationController');
const { requireActiveUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/moderation/report', requireActiveUser, createReport);
router.get('/moderation/reports', requireAdmin, listReports);
router.delete('/moderation/reports/:id', requireAdmin, deleteReport);
router.delete('/moderation/reports', requireAdmin, clearReports);

module.exports = router;

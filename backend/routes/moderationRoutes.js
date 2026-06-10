const express = require('express');
const { createReport, listReports, deleteReport, clearReports } = require('../controllers/moderationController');
const { requireActiveUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/report', requireActiveUser, createReport);
router.get('/reports', requireAdmin, listReports);
router.delete('/reports/:id', requireAdmin, deleteReport);
router.delete('/reports', requireAdmin, clearReports);

module.exports = router;

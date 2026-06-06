const express = require('express');
const {
  listCategories,
  createCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', listCategories);
router.post('/categories', requireAdmin, createCategory);
router.delete('/categories/:name', requireAdmin, deleteCategory);

module.exports = router;

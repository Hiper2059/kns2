const express = require('express');
const {
  listCategories,
  createCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', listCategories);
router.post('/', requireAdmin, createCategory);
router.delete('/:name', requireAdmin, deleteCategory);

module.exports = router;

const Category = require('../models/Category');
const Course = require('../models/Course');

const normalizeCategoryName = value => String(value || '').trim();

const listCategories = async (req, res) => {
  try {
    const [storedCategories, courseCategories] = await Promise.all([
      Category.find({}, { name: 1, _id: 0 }).sort({ name: 1 }).lean(),
      Course.distinct('category')
    ]);

    const names = Array.from(
      new Set([
        ...storedCategories.map(item => normalizeCategoryName(item.name)),
        ...courseCategories.map(normalizeCategoryName)
      ].filter(Boolean))
    );

    res.json({
      categories: names,
      customCategories: storedCategories.map(item => normalizeCategoryName(item.name)).filter(Boolean)
    });
  } catch (error) {
    console.error('Loi lay danh muc:', error);
    res.status(500).json({ message: 'Khong tai duoc danh muc.' });
  }
};

const createCategory = async (req, res) => {
  try {
    const name = normalizeCategoryName(req.body?.name);
    if (!name) {
      return res.status(400).json({ message: 'Thieu ten danh muc.' });
    }

    const exists = await Category.findOne({ name }).lean();
    if (exists) {
      return res.status(409).json({ message: 'Danh muc nay da ton tai.' });
    }

    const created = await Category.create({
      name,
      createdBy: req.currentUser?.username || ''
    });

    res.status(201).json({ message: 'Da them danh muc.', category: created.name });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Danh muc nay da ton tai.' });
    }

    console.error('Loi tao danh muc:', error);
    res.status(500).json({ message: 'Khong them duoc danh muc.' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const name = normalizeCategoryName(decodeURIComponent(req.params.name || ''));
    if (!name) {
      return res.status(400).json({ message: 'Ten danh muc khong hop le.' });
    }

    await Category.deleteOne({ name });

    res.json({ message: 'Da xoa danh muc tuy chinh.' });
  } catch (error) {
    console.error('Loi xoa danh muc:', error);
    res.status(500).json({ message: 'Khong xoa duoc danh muc.' });
  }
};

module.exports = {
  listCategories,
  createCategory,
  deleteCategory
};

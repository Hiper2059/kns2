const VideoLink = require('../models/VideoLink');
const { isValidYouTubeUrl, toEmbedUrl } = require('../utils/youtube');
const { getPaginationParams, buildPagination } = require('../utils/pagination');
const catchAsync = require('../utils/catchAsync');

const listVideos = catchAsync(async (req, res) => {
  const filter = {};
  const projection = { category: 1, url: 1, addedBy: 1, createdAt: 1 };
  const { page, limit, skip } = getPaginationParams(req.query);
  const [videos, totalItems] = await Promise.all([
    VideoLink.find(filter, projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VideoLink.countDocuments(filter)
  ]);

  res.json({
    data: videos,
    videos,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const createVideo = catchAsync(async (req, res) => {
  const { category, url } = req.body;
  const adminUsername = req.currentUser?.username;

  if (!category || !url) {
    return res.status(400).json({ message: 'Thiếu category hoặc url.' });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ message: 'Link YouTube không hợp lệ.' });
  }

  const embedUrl = toEmbedUrl(url);

  const existingVideo = await VideoLink.findOne({ url: embedUrl }).lean();
  if (existingVideo) {
    return res.status(400).json({ message: 'Video đã tồn tại trong hệ thống.' });
  }

  const created = await VideoLink.create({
    category: category.trim(),
    url: embedUrl,
    addedBy: adminUsername || 'admin'
  });

  res.status(201).json({
    message: 'Đã thêm video YouTube thành công.',
    video: {
      _id: created._id,
      category: created.category,
      url: created.url,
      addedBy: created.addedBy,
      createdAt: created.createdAt
    }
  });
});

const deleteVideo = catchAsync(async (req, res) => {
  const deleted = await VideoLink.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Không tìm thấy video để xóa.' });
  }
  res.json({ message: 'Đã xóa video thành công.' });
});

module.exports = {
  listVideos,
  createVideo,
  deleteVideo
};

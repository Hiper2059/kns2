const VideoLink = require('../models/VideoLink');
const { isValidYouTubeUrl, toEmbedUrl } = require('../utils/youtube');

const listVideos = async (req, res) => {
  try {
    const videos = await VideoLink.find({}, { category: 1, url: 1, addedBy: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ videos });
  } catch (error) {
    console.error('Loi lay videos:', error);
    res.status(500).json({ message: 'Không tải được danh sách video.' });
  }
};

const createVideo = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Loi them video:', error);
    res.status(500).json({ message: 'Không thêm được video.' });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const deleted = await VideoLink.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy video để xóa.' });
    }
    res.json({ message: 'Đã xóa video thành công.' });
  } catch (error) {
    console.error('Loi xoa video:', error);
    res.status(500).json({ message: 'Không xóa được video.' });
  }
};

module.exports = {
  listVideos,
  createVideo,
  deleteVideo
};

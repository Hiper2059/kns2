const MOJIBAKE_PATTERN = /[ÃÂÄÆ]|áº|á»|â[\u0080-\u009f]/;

const repairMojibake = value => {
  const message = String(value || '');
  if (!MOJIBAKE_PATTERN.test(message)) {
    return message;
  }

  try {
    const bytes = Array.from(message, char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`);
    return decodeURIComponent(bytes.join(''));
  } catch {
    return message;
  }
};

const stripAccents = value =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, match => (match === 'Đ' ? 'D' : 'd'));

const normalizeMessage = value =>
  stripAccents(repairMojibake(value))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '')
    .trim();

const successMessages = new Map([
  ['dang ky thanh cong my man', 'Đăng ký thành công. Bạn có thể đăng nhập ngay.'],
  ['chao mung cau tro lai', 'Đăng nhập thành công.'],
  ['da tao tai khoan thanh cong', 'Đã tạo tài khoản.'],
  ['cap nhat vai tro thanh cong', 'Đã cập nhật vai trò.'],
  ['cap nhat trang thai tai khoan thanh cong', 'Đã cập nhật trạng thái tài khoản.'],
  ['da cap nhat ho so', 'Đã cập nhật hồ sơ.'],
  ['da them video youtube thanh cong', 'Đã thêm video YouTube.'],
  ['da xoa video thanh cong', 'Đã xóa video.'],
  ['da tao lop hoc', 'Đã tạo lớp học.'],
  ['da cap nhat lop hoc', 'Đã cập nhật lớp học.'],
  ['da xoa lop hoc', 'Đã xóa lớp học.'],
  ['da tham gia lop hoc', 'Đã tham gia lớp học.'],
  ['da cap nhat tien do', 'Đã cập nhật tiến độ.'],
  ['da cap nhat danh gia', 'Đã cập nhật đánh giá.'],
  ['da them bai hoc', 'Đã thêm bài học.'],
  ['da cap nhat bai hoc', 'Đã cập nhật bài học.'],
  ['da xoa bai hoc', 'Đã xóa bài học.'],
  ['da tao bai tap', 'Đã tạo bài tập.'],
  ['da cap nhat bai tap', 'Đã cập nhật bài tập.'],
  ['da xoa bai tap', 'Đã xóa bài tập.'],
  ['da nop bai', 'Đã nộp bài.'],
  ['da cham bai', 'Đã chấm bài.'],
  ['da them binh luan', 'Đã thêm bình luận.'],
  ['da xoa binh luan', 'Đã xóa bình luận.'],
  ['da xoa bai viet thanh cong', 'Đã xóa bài viết.'],
  ['da xoa binh luan thanh cong', 'Đã xóa bình luận.'],
  ['da khoi phuc bai viet', 'Đã khôi phục bài viết.'],
  ['da khoi phuc binh luan', 'Đã khôi phục bình luận.'],
  ['da xoa vinh vien bai viet va binh luan lien quan', 'Đã xóa vĩnh viễn bài viết.'],
  ['da xoa vinh vien binh luan', 'Đã xóa vĩnh viễn bình luận.'],
  ['da xoa report kiem duyet', 'Đã xóa report kiểm duyệt.'],
  ['da xoa toan bo lich su kiem duyet', 'Đã xóa toàn bộ lịch sử kiểm duyệt.']
]);

const friendlyFromText = (message, status = 200) => {
  const repaired = repairMojibake(message).trim();
  const normalized = normalizeMessage(repaired);

  if (!normalized) {
    return '';
  }

  if (status < 400 && successMessages.has(normalized)) {
    return successMessages.get(normalized);
  }

  if (status < 400) {
    const deletedReportMatch = normalized.match(/^da xoa (\d+) report kiem duyet$/);
    if (deletedReportMatch) {
      return `Đã xóa ${deletedReportMatch[1]} report kiểm duyệt.`;
    }

    if (normalized.startsWith('da xoa ') && normalized.includes('report kiem duyet')) {
      return repaired.replace(/^Da/i, 'Đã');
    }
    return repaired;
  }

  if (normalized.includes('sai ten') || normalized.includes('sai mat khau')) {
    return 'Tên đăng nhập hoặc mật khẩu chưa đúng.';
  }

  if (normalized.includes('refresh token') || normalized.includes('access token') || normalized.includes('jwt') || normalized.includes('token')) {
    return status === 401
      ? 'Phiên đăng nhập đã hết hạn, bạn vui lòng đăng nhập lại.'
      : 'Phiên đăng nhập chưa hợp lệ, bạn vui lòng đăng nhập lại.';
  }

  if (normalized.includes('can dang nhap') || normalized.includes('thieu dang nhap')) {
    return 'Bạn cần đăng nhập để tiếp tục.';
  }

  if (normalized.includes('ten dang nhap') && normalized.includes('mat khau')) {
    return 'Bạn nhập tên đăng nhập và mật khẩu nhé.';
  }

  if (normalized.includes('mat khau can tu 6') || normalized.includes('mat khau can')) {
    return 'Mật khẩu cần có ít nhất 6 ký tự.';
  }

  if (normalized.includes('tai khoan da ton tai')) {
    return 'Tài khoản này đã tồn tại.';
  }

  if (normalized.includes('tai khoan khong thuoc vai tro giang vien')) {
    return 'Tài khoản này không phải tài khoản giảng viên.';
  }

  if (normalized.includes('tai khoan khong thuoc vai tro hoc sinh') || normalized.includes('tai khoan khong thuoc vai tro hoc vien')) {
    return 'Tài khoản này không phải tài khoản học viên.';
  }

  if (normalized.includes('dang nhap dung duong dan') || normalized.includes('dang nhap dung khu vuc')) {
    return 'Vui lòng chọn đúng khu vực đăng nhập cho vai trò của bạn.';
  }

  if (normalized.includes('tai khoan dang o trang thai') || normalized.includes('khong o trang thai active')) {
    return 'Tài khoản đang bị hạn chế. Vui lòng liên hệ quản trị viên.';
  }

  if (normalized.includes('khong co quyen') || normalized.includes('ban khong co quyen')) {
    return 'Bạn chưa có quyền thực hiện thao tác này.';
  }

  if (normalized.includes('can tham gia lop') || normalized.includes('can tham gia khoa') || normalized.includes('cau can tham gia lop')) {
    return 'Bạn cần tham gia lớp trước khi tiếp tục.';
  }

  if (normalized.includes('chi hoc vien moi') || normalized.includes('chi giang vien')) {
    return 'Vai trò hiện tại chưa thể thực hiện thao tác này.';
  }

  if (normalized.includes('cloudinary')) {
    return 'Chưa thể upload file lúc này. Bạn vui lòng thử lại sau.';
  }

  if (normalized.includes('chua co file anh')) {
    return 'Bạn chọn ảnh trước khi upload nhé.';
  }

  if (normalized.includes('chua co file video')) {
    return 'Bạn chọn video trước khi upload nhé.';
  }

  if (normalized.includes('chi ho tro anh')) {
    return 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.';
  }

  if (normalized.includes('chi ho tro video')) {
    return 'Chỉ hỗ trợ video MP4, WebM, OGG hoặc MOV.';
  }

  if (normalized.includes('file too large') || normalized.includes('limit_file_size') || normalized.includes('qua lon')) {
    return 'File quá lớn. Bạn chọn file nhỏ hơn rồi thử lại nhé.';
  }

  if (normalized.includes('upload')) {
    return 'Không upload được file. Bạn thử lại sau nhé.';
  }

  if (
    normalized.includes('khong hop le') &&
    ['courseid', 'lessonid', 'postid', 'commentid', 'assignmentid', 'submissionid', 'targettype', 'parentcommentid'].some(key =>
      normalized.includes(key)
    )
  ) {
    return 'Dữ liệu không hợp lệ. Bạn thử tải lại trang rồi thao tác lại.';
  }

  if (normalized.includes('khong tim thay lop hoc')) return 'Không tìm thấy lớp học.';
  if (normalized.includes('khong tim thay bai hoc')) return 'Không tìm thấy bài học.';
  if (normalized.includes('khong tim thay bai viet')) return 'Không tìm thấy bài viết.';
  if (normalized.includes('khong tim thay binh luan')) return 'Không tìm thấy bình luận.';
  if (normalized.includes('khong tim thay bai tap')) return 'Không tìm thấy bài tập.';
  if (normalized.includes('khong tim thay bai nop')) return 'Không tìm thấy bài nộp.';
  if (normalized.includes('khong tim thay nguoi dung')) return 'Không tìm thấy người dùng.';
  if (normalized.includes('khong tim thay video')) return 'Không tìm thấy video.';

  if (normalized.includes('noi dung') && (normalized.includes('rong') || normalized.includes('trong'))) {
    return 'Nội dung không được để trống.';
  }

  if (normalized.includes('thieu title') || normalized.includes('thieu tieu de') || normalized.includes('tieu de') && normalized.includes('rong')) {
    return 'Bạn nhập tiêu đề trước nhé.';
  }

  if (normalized.includes('thieu category') || normalized.includes('thieu danh muc')) {
    return 'Bạn chọn danh mục trước nhé.';
  }

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn, bạn vui lòng đăng nhập lại.';
  }

  if (status === 403) {
    return 'Bạn chưa có quyền thực hiện thao tác này.';
  }

  if (status >= 500 || normalized.includes('loi he thong')) {
    return 'Hệ thống đang bận. Bạn thử lại sau nhé.';
  }

  return repaired;
};

const friendlyMessages = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = body => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return originalJson(body);
    }

    const nextBody = { ...body };
    if (typeof nextBody.message === 'string') {
      nextBody.message = friendlyFromText(nextBody.message, res.statusCode);
    }
    if (typeof nextBody.error === 'string') {
      nextBody.error = friendlyFromText(nextBody.error, res.statusCode);
    }

    return originalJson(nextBody);
  };

  next();
};

module.exports = {
  friendlyFromText,
  friendlyMessages
};

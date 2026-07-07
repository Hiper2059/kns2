export const categories = ['Võ thuật', 'Giao tiếp', 'Quản lý thời gian', 'Tài chính', 'Tư duy']

export const defaultForumPosts = [
  {
    id: 1,
    author: 'Hải Đăng',
    category: 'Tài chính',
    title: 'Cách quản lý chi tiêu cho sinh viên năm nhất?',
    content: 'Tháng nào mình cũng nhẵn túi, xin cao nhân chỉ giáo...'
  },
  {
    id: 2,
    author: 'Minh Anh',
    category: 'Giao tiếp',
    title: 'Làm sao để bớt run khi thuyết trình?',
    content: 'Mỗi lần lên bục là tim mình đập loạn nhịp...'
  }
]

export const quizBank = {
  'Võ thuật': {
    id: 'vo-thuat-1',
    question: 'Trong lúc tranh luận nóng, điều đầu tiên cần làm để giữ bình tĩnh là gì?',
    options: ['Nói to hơn để lấn át', 'Hít sâu 3 nhịp và chậm lại', 'Rời nhóm chat ngay lập tức'],
    answer: 'Hít sâu 3 nhịp và chậm lại'
  },
  'Giao tiếp': {
    id: 'giao-tiep-1',
    question: 'Muốn người khác lắng nghe, kỹ thuật mở đầu tốt nhất là gì?',
    options: ['Bắt đầu bằng phán xét', 'Đặt câu hỏi mở', 'Kể thật dài về bản thân'],
    answer: 'Đặt câu hỏi mở'
  },
  'Quản lý thời gian': {
    id: 'thoi-gian-1',
    question: 'Nguyên tắc nào giúp tập trung làm việc sâu trong thời gian ngắn?',
    options: ['Pomodoro 25-5', 'Mở nhiều tab cùng lúc', 'Không lập kế hoạch'],
    answer: 'Pomodoro 25-5'
  },
  'Tài chính': {
    id: 'tai-chinh-1',
    question: 'Quy tắc cơ bản để tránh chi quá tay hàng tháng?',
    options: ['Chi trước tính sau', 'Theo dõi thu chi và đặt hạn mức', 'Vay bạn bè khi thiếu'],
    answer: 'Theo dõi thu chi và đặt hạn mức'
  },
  'Tư duy': {
    id: 'tu-duy-1',
    question: 'Tư duy phản biện bắt đầu bằng bước nào?',
    options: ['Tin ngay thông tin đầu tiên', 'Đặt câu hỏi và kiểm chứng nguồn', 'Tranh luận để thắng'],
    answer: 'Đặt câu hỏi và kiểm chứng nguồn'
  }
}

export const rankTiers = [
  { name: 'Mầm non kỹ năng', min: 0 },
  { name: 'Người luyện tập', min: 30 },
  { name: 'Thủ lĩnh học tập', min: 80 },
  { name: 'Mentor cộng đồng', min: 150 },
  { name: 'Huyền thoại Z-Mate', min: 260 }
]

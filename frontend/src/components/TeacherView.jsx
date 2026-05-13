import { useMemo, useState } from 'react'
import './TeacherView.css'

const TeacherView = ({
  courses,
  lessons,
  enrollments,
  selectedCourseId,
  onSelectCourseId,
  newCourseData,
  onNewCourseDataChange,
  onCreateCourse,
  newLessonData,
  onNewLessonDataChange,
  onCreateLesson,
  onLoadEnrollments,
  onEvaluateEnrollment
}) => {
  const [evaluationDrafts, setEvaluationDrafts] = useState({})

  const selectedCourse = useMemo(
    () => courses.find(course => course._id === selectedCourseId) || null,
    [courses, selectedCourseId]
  )

  const handleEvaluationChange = (enrollmentId, field, value) => {
    setEvaluationDrafts(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [field]: value
      }
    }))
  }

  const handleSubmitEvaluation = enrollmentId => {
    const draft = evaluationDrafts[enrollmentId] || {}
    onEvaluateEnrollment(enrollmentId, {
      score: draft.score,
      note: draft.note,
      progressPercent: draft.progressPercent
    })
  }

  return (
    <div className="teacher-view">
      <div className="teacher-panel">
        <h2>Quản lý lớp học giảng viên</h2>

        <div className="teacher-card">
          <h3>Tạo lớp học mới</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Tên lớp học"
              value={newCourseData.title}
              onChange={e => onNewCourseDataChange({ ...newCourseData, title: e.target.value })}
            />
            <input
              type="text"
              placeholder="Danh mục"
              value={newCourseData.category}
              onChange={e => onNewCourseDataChange({ ...newCourseData, category: e.target.value })}
            />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={e =>
                onNewCourseDataChange({
                  ...newCourseData,
                  imageFile: e.target.files?.[0] || null
                })
              }
            />
            <input
              type="text"
              placeholder="Anh dai dien (URL - tuy chon)"
              value={newCourseData.imageUrl}
              onChange={e => onNewCourseDataChange({ ...newCourseData, imageUrl: e.target.value })}
            />
            <textarea
              rows="3"
              placeholder="Mô tả lớp học"
              value={newCourseData.description}
              onChange={e => onNewCourseDataChange({ ...newCourseData, description: e.target.value })}
            ></textarea>
          </div>
          <button className="btn-post" onClick={onCreateCourse}>Tạo lớp</button>
        </div>

        <div className="teacher-card">
          <h3>Thêm bài học cho lớp</h3>
          <select value={selectedCourseId || ''} onChange={e => onSelectCourseId(e.target.value)}>
            <option value="">Chọn lớp học</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.title}</option>
            ))}
          </select>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Tiêu đề bài học"
              value={newLessonData.title}
              onChange={e => onNewLessonDataChange({ ...newLessonData, title: e.target.value })}
            />
            <input
              type="text"
              placeholder="Video URL"
              value={newLessonData.videoUrl}
              onChange={e => onNewLessonDataChange({ ...newLessonData, videoUrl: e.target.value })}
            />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={e =>
                onNewLessonDataChange({
                  ...newLessonData,
                  imageFile: e.target.files?.[0] || null
                })
              }
            />
            <input
              type="text"
              placeholder="Anh minh hoa (URL - tuy chon)"
              value={newLessonData.imageUrl}
              onChange={e => onNewLessonDataChange({ ...newLessonData, imageUrl: e.target.value })}
            />
            <input
              type="number"
              placeholder="Thứ tự bài"
              value={newLessonData.order}
              onChange={e => onNewLessonDataChange({ ...newLessonData, order: e.target.value })}
            />
            <textarea
              rows="3"
              placeholder="Nội dung bài học"
              value={newLessonData.content}
              onChange={e => onNewLessonDataChange({ ...newLessonData, content: e.target.value })}
            ></textarea>
          </div>
          <button className="btn-post" onClick={onCreateLesson} disabled={!selectedCourseId}>
            Thêm bài học
          </button>
        </div>
      </div>

      <div className="teacher-panel">
        <div className="teacher-card">
          <div className="panel-header">
            <h3>Danh sách lớp của tôi</h3>
            <button className="btn-post" onClick={() => selectedCourseId && onLoadEnrollments(selectedCourseId)}>
              Tải danh sách học viên
            </button>
          </div>
          {courses.length ? (
            <div className="teacher-course-list">
              {courses.map(course => (
                <button
                  key={course._id}
                  className={selectedCourseId === course._id ? 'course-pill active' : 'course-pill'}
                  onClick={() => onSelectCourseId(course._id)}
                >
                  {course.title}
                </button>
              ))}
            </div>
          ) : (
            <p>Chưa có lớp nào.</p>
          )}
          {selectedCourse && (
            <div className="teacher-course-detail">
              <div className="teacher-course-info">
                <h4>{selectedCourse.title}</h4>
                <p>{selectedCourse.description || 'Chưa có mô tả lớp học.'}</p>
                <div className="teacher-course-meta">
                  <span>Danh mục: {selectedCourse.category}</span>
                  <span>Bài học: {lessons.length}</span>
                  <span>Học viên: {enrollments.length}</span>
                </div>
              </div>
              {selectedCourse.imageUrl ? (
                <img src={selectedCourse.imageUrl} alt={selectedCourse.title} />
              ) : (
                <div className="teacher-course-placeholder">Ảnh lớp</div>
              )}
            </div>
          )}
        </div>

        <div className="teacher-card">
          <h3>Bài học của lớp</h3>
          {selectedCourse && lessons.length ? (
            lessons.map(lesson => (
              <div key={lesson._id} className="lesson-row">
                <div className="lesson-meta">
                  <strong>{lesson.order}. {lesson.title}</strong>
                  <span>{lesson.videoUrl ? 'Có video' : 'Chưa có video'}</span>
                  {lesson.content && <p>{lesson.content}</p>}
                </div>
                <div className="lesson-media">
                  {lesson.imageUrl ? (
                    <img src={lesson.imageUrl} alt={lesson.title} />
                  ) : (
                    <div className="lesson-media-placeholder">Ảnh bài học</div>
                  )}
                  {lesson.videoUrl && (
                    <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                      Xem video
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>Chọn lớp để xem bài học.</p>
          )}
        </div>

        <div className="teacher-card">
          <h3>Đánh giá học viên</h3>
          {enrollments.length ? (
            enrollments.map(enrollment => (
              <div key={enrollment._id} className="enrollment-row">
                <div>
                  <strong>{enrollment.studentName}</strong>
                  <p>Tiến độ: {enrollment.progressPercent || 0}%</p>
                  <p>Ghi chú: {enrollment.evaluation?.note || 'Chưa có'}</p>
                </div>
                <div className="evaluation-form">
                  <input
                    type="number"
                    placeholder="Điểm"
                    value={evaluationDrafts[enrollment._id]?.score || ''}
                    onChange={e => handleEvaluationChange(enrollment._id, 'score', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Tiến độ %"
                    value={evaluationDrafts[enrollment._id]?.progressPercent || ''}
                    onChange={e => handleEvaluationChange(enrollment._id, 'progressPercent', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Nhận xét"
                    value={evaluationDrafts[enrollment._id]?.note || ''}
                    onChange={e => handleEvaluationChange(enrollment._id, 'note', e.target.value)}
                  />
                  <button className="btn-post" onClick={() => handleSubmitEvaluation(enrollment._id)}>
                    Lưu đánh giá
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>Chưa có học viên nào.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeacherView

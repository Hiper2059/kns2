import { useMemo } from 'react'
import './LmsView.css'

const LmsView = ({
  categories,
  selectedCategory,
  onSelectCategory,
  courses,
  selectedCourse,
  onSelectCourse,
  lessons,
  enrollmentByCourse,
  onEnroll,
  currentRole,
  currentUser,
  onOpenProfile,
  onOpenLesson
}) => {
  const visibleCourses = selectedCategory
    ? courses.filter(course => course.category === selectedCategory)
    : courses

  const enrollment = selectedCourse ? enrollmentByCourse[selectedCourse._id] : null
  const canEnroll = currentUser && (currentRole === 'student' || currentRole === 'user')
  const isEnrolled = Boolean(enrollment)
  const sortedLessons = [...lessons].sort((a, b) => (a.order || 1) - (b.order || 1))
  const completedLessonIds = useMemo(() => {
    return new Set((enrollment?.completedLessons || []).map(item => String(item)))
  }, [enrollment])

  const getProgressLabel = value => {
    const percent = Number(value) || 0
    if (percent <= 30) return 'Tan binh'
    if (percent < 80) return 'Hieu biet'
    return 'Biet tuot'
  }


  return (
    <div className="lms-view">
      <div className="lms-sidebar">
        <h3>Danh mục lớp học</h3>
        <ul>
          {categories.map(category => (
            <li
              key={category}
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => onSelectCategory(category)}
              role="button"
              tabIndex={0}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectCategory(category)
                }
              }}
            >
              {category}
            </li>
          ))}
        </ul>
      </div>

      <div className="lms-content">
        <div className="lms-course-list">
          {visibleCourses.length ? (
            visibleCourses.map(course => (
              <button
                key={course._id}
                className={selectedCourse && selectedCourse._id === course._id ? 'course-card active' : 'course-card'}
                onClick={() => onSelectCourse(course)}
              >
                <div className="course-thumb">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} />
                  ) : (
                    <div className="course-placeholder">Ảnh lớp</div>
                  )}
                </div>
                <div className="course-info">
                  <h4>{course.title}</h4>
                  <span>
                    Giảng viên:{' '}
                    <button
                      className="profile-link"
                      onClick={event => {
                        event.stopPropagation()
                        onOpenProfile?.(course.teacher)
                      }}
                    >
                      {course.teacherName}
                    </button>
                  </span>
                  {selectedCourse && selectedCourse._id === course._id && (
                    <div
                      className="course-preview rich-text"
                      dangerouslySetInnerHTML={{
                        __html: course.description || 'Chưa có mô tả lớp học.'
                      }}
                    ></div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="empty-state">Chưa có lớp học nào trong danh mục này.</div>
          )}
        </div>

        <div className="lms-course-detail">
          {selectedCourse ? (
            <>
              <div className="course-header">
                <div>
                  <h2>{selectedCourse.title}</h2>
                  <div
                    className="rich-text"
                    dangerouslySetInnerHTML={{
                      __html: selectedCourse.description || 'Chưa có mô tả chi tiết.'
                    }}
                  ></div>
                  <span>Danh mục: {selectedCourse.category}</span>
                  {enrollment && (
                    <div className="progress-block">
                      <div className="progress-text">
                        Tiến độ: {enrollment.progressPercent || 0}% ·
                        {` ${getProgressLabel(enrollment.progressPercent)}`} ·
                        {enrollment.evaluation?.score !== null && enrollment.evaluation?.score !== undefined
                          ? ` Điểm: ${enrollment.evaluation.score}`
                          : ' Chưa có điểm'}
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(100, enrollment.progressPercent || 0)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {enrollment?.evaluation?.note && <p>Nhận xét: {enrollment.evaluation.note}</p>}
                </div>
                <div className="course-actions">
                  {!currentUser && <span>Đăng nhập để tham gia lớp.</span>}
                  {canEnroll && !isEnrolled && (
                    <button className="btn-post" onClick={() => onEnroll(selectedCourse._id)}>
                      Tham gia học
                    </button>
                  )}
                  {isEnrolled && <span className="enrolled-pill">Đã tham gia</span>}
                </div>
              </div>

              <div className="syllabus-panel">
                <div className="syllabus-header">
                  <h3>Danh sach bai hoc</h3>
                </div>

                {sortedLessons.length ? (
                  <div className="lesson-list-grid">
                    {sortedLessons.map(lesson => (
                      <button
                        key={lesson._id}
                        className="lesson-row"
                        onClick={() => onOpenLesson?.(lesson)}
                      >
                        <span>{lesson.order}. {lesson.title}</span>
                        <span
                          className={`lesson-chip ${
                            completedLessonIds.has(String(lesson._id)) ? 'done' : 'todo'
                          }`}
                        >
                          {completedLessonIds.has(String(lesson._id)) ? 'Da hoan thanh' : 'Chua hoan thanh'}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>Chưa có bài học nào.</p>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">Chọn một lớp để xem chi tiết.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LmsView

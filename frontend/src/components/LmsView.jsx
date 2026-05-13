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
  onCompleteLesson,
  currentRole,
  currentUser
}) => {
  const visibleCourses = selectedCategory
    ? courses.filter(course => course.category === selectedCategory)
    : courses

  const enrollment = selectedCourse ? enrollmentByCourse[selectedCourse._id] : null
  const canEnroll = currentUser && (currentRole === 'student' || currentRole === 'user')
  const isEnrolled = Boolean(enrollment)
  const completedLessonIds = new Set((enrollment?.completedLessons || []).map(item => String(item)))

  return (
    <div className="lms-view">
      <div className="lms-sidebar">
        <h3>Danh mục lớp học</h3>
        <ul>
          <li
            className={!selectedCategory ? 'active' : ''}
            onClick={() => onSelectCategory(null)}
          >
            Tất cả lớp
          </li>
          {categories.map(category => (
            <li
              key={category}
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => onSelectCategory(category)}
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
                  <p>{course.description || 'Chưa có mô tả lớp học.'}</p>
                  <span>Giảng viên: {course.teacherName}</span>
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
                  <p>{selectedCourse.description || 'Chưa có mô tả chi tiết.'}</p>
                  <span>Danh mục: {selectedCourse.category}</span>
                  {enrollment && (
                    <div className="progress-block">
                      <div className="progress-text">
                        Tiến độ: {enrollment.progressPercent || 0}% ·
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

              <div className="lesson-list">
                <h3>Danh sách bài học</h3>
                {lessons.length ? (
                  lessons.map(lesson => (
                    <div key={lesson._id} className="lesson-card">
                      <div>
                        <div className="lesson-title">
                          <strong>{lesson.order}. {lesson.title}</strong>
                          {completedLessonIds.has(String(lesson._id)) && (
                            <span className="lesson-pill">Đã hoàn thành</span>
                          )}
                        </div>
                        <p>{lesson.content || 'Không có mô tả.'}</p>
                        {lesson.imageUrl && (
                          <div className="lesson-thumb">
                            <img src={lesson.imageUrl} alt={lesson.title} />
                          </div>
                        )}
                        {lesson.videoUrl && (
                          <a className="lesson-link" href={lesson.videoUrl} target="_blank" rel="noreferrer">
                            Xem video bài học
                          </a>
                        )}
                      </div>
                      {isEnrolled && canEnroll && (
                        <button
                          className="btn-post"
                          onClick={() => onCompleteLesson(lesson._id)}
                          disabled={completedLessonIds.has(String(lesson._id))}
                        >
                          {completedLessonIds.has(String(lesson._id)) ? 'Đã xong' : 'Đã hoàn thành'}
                        </button>
                      )}
                    </div>
                  ))
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

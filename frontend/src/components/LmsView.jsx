import './LmsView.css'

const LmsView = ({
  categories,
  selectedCategory,
  onSelectCategory,
  courses,
  selectedCourse,
  onSelectCourse,
  lessons,
  selectedLessonId,
  onSelectLesson,
  viewMode,
  onChangeViewMode,
  enrollmentByCourse,
  onEnroll,
  onCompleteLesson,
  currentRole,
  currentUser,
  onOpenProfile
}) => {
  const visibleCourses = selectedCategory
    ? courses.filter(course => course.category === selectedCategory)
    : courses

  const enrollment = selectedCourse ? enrollmentByCourse[selectedCourse._id] : null
  const canEnroll = currentUser && (currentRole === 'student' || currentRole === 'user')
  const isEnrolled = Boolean(enrollment)
  const completedLessonIds = new Set((enrollment?.completedLessons || []).map(item => String(item)))
  const selectedLesson =
    lessons.find(lesson => String(lesson._id) === String(selectedLessonId)) || lessons[0] || null

  const sortedLessons = [...lessons].sort((a, b) => (a.order || 1) - (b.order || 1))

  const getProgressLabel = value => {
    const percent = Number(value) || 0
    if (percent <= 30) return 'Tan binh'
    if (percent < 80) return 'Hieu biet'
    return 'Biet tuot'
  }

  const getVideoEmbedUrl = url => {
    if (!url) return ''
    if (url.includes('embed/')) return url
    if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0]
      return id ? `https://www.youtube.com/embed/${id}` : url
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0]
      return id ? `https://www.youtube.com/embed/${id}` : url
    }
    return url
  }

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

              {viewMode === 'list' && (
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
                          onClick={() => {
                            onSelectLesson(lesson._id)
                            onChangeViewMode('lesson')
                          }}
                        >
                          <span>{lesson.order}. {lesson.title}</span>
                          {lesson.videoUrl ? <span className="lesson-chip">Video</span> : null}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p>Chưa có bài học nào.</p>
                  )}
                </div>
              )}

              {viewMode === 'lesson' && (
                <div className="lesson-page">
                  <div className="lesson-page-header">
                    <button className="btn-ghost" onClick={() => onChangeViewMode('list')}>
                      Quay lai giao trinh
                    </button>
                    {selectedLesson && (
                      <div className="lesson-page-title">
                        <strong>{selectedLesson.title}</strong>
                      </div>
                    )}
                  </div>

                  <div className="lesson-page-grid">
                    <div className="lesson-page-syllabus">
                      {sortedLessons.map(lesson => (
                        <button
                          key={lesson._id}
                          className={
                            String(selectedLesson?._id) === String(lesson._id)
                              ? 'lesson-row active'
                              : 'lesson-row'
                          }
                          onClick={() => onSelectLesson(lesson._id)}
                        >
                          <span>{lesson.order}. {lesson.title}</span>
                          {completedLessonIds.has(String(lesson._id)) && (
                            <span className="lesson-chip">Da hoc</span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="lesson-detail">
                      {selectedLesson ? (
                        <>
                          {selectedLesson.videoUrl ? (
                            <div className="lesson-video">
                              <iframe
                                src={getVideoEmbedUrl(selectedLesson.videoUrl)}
                                title={selectedLesson.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          ) : (
                            <p>Chưa có video cho bài học này.</p>
                          )}
                          {isEnrolled && canEnroll && (
                            <button
                              className="btn-post"
                              onClick={() => onCompleteLesson(selectedLesson._id)}
                              disabled={completedLessonIds.has(String(selectedLesson._id))}
                            >
                              {completedLessonIds.has(String(selectedLesson._id)) ? 'Da xong' : 'Da hoan thanh'}
                            </button>
                          )}
                        </>
                      ) : (
                        <p>Chon mot bai hoc de xem video.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
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

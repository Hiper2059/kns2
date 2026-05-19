import './LessonFullPage.css'

const LessonFullPage = ({
  lesson,
  course,
  lessons,
  courses,
  categories,
  onClose,
  onOpenLesson,
  onSelectCourse,
  onSelectCategory,
  isLoading,
  onCompleteLesson,
  canComplete,
  isCompleted
}) => {
  const sortedLessons = [...lessons].sort((a, b) => (a.order || 1) - (b.order || 1))
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
    <div className="lesson-full-page">
      <aside className="lesson-sidebar">
        <div className="sidebar-section">
          <h4>Danh muc ky nang</h4>
          <ul>
            {categories.map(category => (
              <li key={category}>
                <button className="sidebar-link" onClick={() => onSelectCategory?.(category)}>
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-section">
          <h4>Lop hoc</h4>
          <ul>
            {courses.map(item => (
              <li key={item._id}>
                <button className="sidebar-link" onClick={() => onSelectCourse?.(item)}>
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-section">
          <h4>Bai hoc</h4>
          <ul>
            {sortedLessons.map(item => (
              <li key={item._id}>
                <button
                  className={String(item._id) === String(lesson?._id) ? 'sidebar-link active' : 'sidebar-link'}
                  onClick={() => onOpenLesson?.(item)}
                >
                  {item.order}. {item.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="lesson-body">
        <div className="lesson-topbar">
          <div>
            <h2>{course?.title || 'Bai hoc'}</h2>
            <p>{course?.description || ''}</p>
          </div>
          <button className="btn-ghost" onClick={onClose}>Quay lai lop hoc</button>
        </div>

        {isLoading && <p>Dang tai bai hoc...</p>}

        {!isLoading && lesson && (
          <div className="lesson-content">
            {lesson.videoUrl ? (
              <div className="lesson-video">
                <iframe
                  src={getVideoEmbedUrl(lesson.videoUrl)}
                  title={lesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <p>Chua co video cho bai hoc nay.</p>
            )}

            <h3>{lesson.title}</h3>

            <div className="lesson-text">{lesson.content || ''}</div>

            {canComplete && (
              <button
                className="btn-post"
                onClick={() => onCompleteLesson?.(lesson._id)}
                disabled={isCompleted}
              >
                {isCompleted ? 'Da hoan thanh' : 'Danh dau hoan thanh'}
              </button>
            )}
          </div>
        )}

        {!isLoading && !lesson && <p>Khong tim thay bai hoc.</p>}
      </section>
    </div>
  )
}

export default LessonFullPage

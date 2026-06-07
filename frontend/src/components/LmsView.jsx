import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Layers3,
  MessageCircle,
  PlayCircle,
  Sparkles,
  Users
} from 'lucide-react'
import './LmsView.css'

const answerLabel = index => String.fromCharCode(65 + index)

const LmsView = ({
  categories,
  selectedCategory,
  onSelectCategory,
  courses,
  teacherCourses,
  selectedCourse,
  onSelectCourse,
  lessons,
  assignments,
  assignmentDrafts,
  onAssignmentDraftChange,
  onSubmitAssignment,
  onSubmitQuizAssignment,
  enrollmentByCourse,
  teacherEnrollments,
  onEnroll,
  currentRole,
  currentUser,
  onOpenProfile,
  onOpenLesson,
  onOpenCourseForum,
  onLoadEnrollments,
  onDeleteLesson
}) => {
  const [quizDrafts, setQuizDrafts] = useState({})
  const isTeacher = currentRole === 'teacher'
  const isAdmin = currentRole === 'admin'
  const canManageLearning = isTeacher || isAdmin
  const coursePool = isTeacher ? teacherCourses : courses
  const visibleCourses = useMemo(() => {
    return selectedCategory
      ? coursePool.filter(course => course.category === selectedCategory)
      : coursePool
  }, [coursePool, selectedCategory])

  const categoryStats = useMemo(() => {
    const counts = coursePool.reduce((acc, course) => {
      const key = course.category || ''
      acc.set(key, (acc.get(key) || 0) + 1)
      return acc
    }, new Map())

    return categories.map(category => ({
      name: category,
      count: counts.get(category) || 0
    }))
  }, [categories, coursePool])

  const enrollment = selectedCourse ? enrollmentByCourse[selectedCourse._id] : null
  const canEnroll = currentUser && (currentRole === 'student' || currentRole === 'user')
  const isEnrolled = Boolean(enrollment)
  const needsEnrollmentToViewLessons = selectedCourse && !canManageLearning && currentUser && !isEnrolled
  const needsLoginToViewLessons = selectedCourse && !canManageLearning && !currentUser
  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => (a.order || 1) - (b.order || 1)),
    [lessons]
  )
  const visibleAssignments = Array.isArray(assignments) ? assignments : []
  const containerRef = useRef(null)

  const completedLessonIds = useMemo(() => {
    return new Set((enrollment?.completedLessons || []).map(item => String(item)))
  }, [enrollment])

  const stripHtml = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  useEffect(() => {
    const scope = containerRef.current
    if (!scope || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray('.gsap-animate')
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.025,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform'
        }
      )
    }, scope)

    return () => {
      const items = gsap.utils.toArray('.gsap-animate', scope)
      gsap.killTweensOf(items)
      gsap.set(items, { clearProps: 'opacity,visibility,transform' })
      ctx.revert()
    }
  }, [selectedCourse?._id, selectedCategory])

  useEffect(() => {
    if (!canManageLearning || !selectedCourse?._id) {
      return
    }
    onLoadEnrollments?.(selectedCourse._id)
  }, [canManageLearning, onLoadEnrollments, selectedCourse?._id])

  const getProgressLabel = value => {
    const percent = Number(value) || 0
    if (percent <= 30) return 'Tân binh'
    if (percent < 80) return 'Hiểu biết'
    return 'Biết tuốt'
  }

  const handleQuizAnswer = (assignmentId, questionIndex, optionIndex) => {
    setQuizDrafts(prev => {
      const nextAnswers = [...(prev[assignmentId] || [])]
      nextAnswers[questionIndex] = optionIndex
      return { ...prev, [assignmentId]: nextAnswers }
    })
  }

  const handleSubmitQuiz = async assignment => {
    const answers = quizDrafts[assignment._id] || []
    const questions = Array.isArray(assignment.questions) ? assignment.questions : []
    const hasMissingAnswer = questions.some((question, index) => {
      const answer = answers[index]
      return !Number.isInteger(answer) || answer < 0 || answer >= (question.options || []).length
    })

    if (hasMissingAnswer) {
      alert('Cậu trả lời hết các câu trước khi nộp nhé.')
      return
    }

    const ok = await onSubmitQuizAssignment?.(assignment._id, answers)
    if (ok) {
      setQuizDrafts(prev => {
        const next = { ...prev }
        delete next[assignment._id]
        return next
      })
    }
  }

  const renderAssignmentBody = assignment => {
    const isQuiz = assignment.type === 'quiz'
    const questions = Array.isArray(assignment.questions) ? assignment.questions : []
    const draftAnswers = quizDrafts[assignment._id] || []

    if (!isQuiz || !questions.length) {
      return null
    }

    return (
      <div className="lms-quiz-preview">
        {questions.map((question, index) => (
          <div key={`${assignment._id}-question-${index}`} className="lms-quiz-question">
            <strong>Câu {index + 1}: {question.question}</strong>
            {currentUser && !canManageLearning && !assignment.mySubmission ? (
              <div className="lms-quiz-options">
                {(question.options || []).map((option, optionIndex) => (
                  <label key={`${assignment._id}-option-${index}-${optionIndex}`} className="lms-quiz-option">
                    <input
                      type="radio"
                      name={`${assignment._id}-${index}`}
                      checked={draftAnswers[index] === optionIndex}
                      onChange={() => handleQuizAnswer(assignment._id, index, optionIndex)}
                    />
                    <span>{answerLabel(optionIndex)}. {option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                {(question.options || []).map((option, optionIndex) => (
                  <span key={`${assignment._id}-option-${index}-${optionIndex}`}>
                    {answerLabel(optionIndex)}. {option}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="lms-learning-surface">
      <nav className="gsap-animate lms-catalog-rail" aria-label="Mục lục lớp học">
        {categoryStats.map(category => (
          <button
            key={category.name}
            className={selectedCategory === category.name ? 'lms-catalog-pill active' : 'lms-catalog-pill'}
            onClick={() => onSelectCategory(category.name)}
          >
            <span>{category.name}</span>
            <strong>{category.count}</strong>
          </button>
        ))}
      </nav>

      <div className="lms-workspace">
        <section className="lms-course-gallery" aria-label="Danh sách lớp học">
          <div className="gsap-animate lms-section-heading">
            <div>
              <span className="lms-eyebrow"><Layers3 size={16} /> {selectedCategory || 'Tất cả lớp'}</span>
              <h2>Lớp học phù hợp</h2>
            </div>
            <span className="lms-count">{visibleCourses.length} lớp</span>
          </div>

          <div className="lms-course-grid">
            {visibleCourses.length ? (
              visibleCourses.map(course => (
                <button
                  key={course._id}
                  className={selectedCourse?._id === course._id ? 'gsap-animate lms-course-tile active' : 'gsap-animate lms-course-tile'}
                  onClick={() => onSelectCourse(course)}
                >
                  <div className="lms-course-thumb">
                    {course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.title} loading="lazy" />
                    ) : (
                      <div className="lms-course-placeholder"><BookOpen size={28} /> Ảnh lớp</div>
                    )}
                  </div>
                  <div className="lms-course-copy">
                    <span className="lms-course-category">{course.category}</span>
                    <h3>{course.title}</h3>
                    <p>{stripHtml(course.description) || 'Chưa có mô tả lớp học.'}</p>
                    <div className="lms-course-meta">
                      <span><Users size={15} /> {course.studentCount || 0} học viên</span>
                      <span
                        className="lms-teacher-link"
                        onClick={event => {
                          event.stopPropagation()
                          onOpenProfile?.(course.teacher)
                        }}
                      >
                        {course.teacherName || 'Giảng viên'}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="gsap-animate lms-empty">Chưa có lớp học nào.</div>
            )}
          </div>
        </section>

        <section className="lms-course-detail-shell" aria-label="Chi tiết lớp học">
          <div className="gsap-animate lms-course-detail-modern">
            {selectedCourse ? (
              <div className="lms-detail-stack">
                <div className="lms-detail-hero">
                  <div className="lms-detail-copy">
                    <span className="lms-eyebrow"><Sparkles size={16} /> {selectedCourse.category}</span>
                    <h1>{selectedCourse.title}</h1>
                    <div
                      className="rich-text lms-detail-description"
                      dangerouslySetInnerHTML={{ __html: selectedCourse.description || 'Chưa có mô tả chi tiết.' }}
                    />
                    <div className="lms-detail-meta">
                      <button className="lms-profile-chip" onClick={() => onOpenProfile?.(selectedCourse.teacher)}>
                        {selectedCourse.teacherName || 'Giảng viên'}
                      </button>
                      <span><BookOpen size={16} /> {sortedLessons.length} bài học</span>
                      <span><Users size={16} /> {selectedCourse.studentCount || 0} học viên</span>
                    </div>

                    {enrollment && (
                      <div className="lms-progress-panel">
                        <div className="lms-progress-head">
                          <span>Tiến độ của bạn</span>
                          <strong>{enrollment.progressPercent || 0}% - {getProgressLabel(enrollment.progressPercent)}</strong>
                        </div>
                        <div className="lms-progress-track">
                          <div
                            className="lms-progress-fill"
                            style={{ width: `${Math.min(100, enrollment.progressPercent || 0)}%` }}
                          />
                        </div>
                        <div className="lms-progress-note">
                          {enrollment.evaluation?.score != null ? `Điểm đánh giá: ${enrollment.evaluation.score}` : 'Chưa có điểm đánh giá'}
                        </div>
                        {enrollment?.evaluation?.note && <p>{enrollment.evaluation.note}</p>}
                      </div>
                    )}
                  </div>

                  <div className="lms-detail-actions">
                    {!currentUser && !canManageLearning && <div className="lms-login-note">Đăng nhập để tham gia</div>}

                    {canEnroll && !isEnrolled && (
                      <button className="lms-primary-action" onClick={() => onEnroll(selectedCourse._id)}>
                        Tham gia lớp học
                      </button>
                    )}

                    {isEnrolled && <div className="lms-enrolled"><CheckCircle2 size={18} /> Đã tham gia</div>}

                    <button className="lms-secondary-action" onClick={() => onOpenCourseForum?.(selectedCourse)}>
                      <MessageCircle size={18} /> Diễn đàn lớp
                    </button>
                  </div>
                </div>

                {canManageLearning && (
                  <div className="gsap-animate lms-detail-section">
                    <h3><span><Users size={18} /></span> Học viên tham gia</h3>
                    <div className="lms-student-list">
                      {teacherEnrollments?.length ? (
                        teacherEnrollments.map(enItem => (
                          <div key={enItem._id} className="lms-student-row">
                            <span>{enItem.studentName}</span>
                            <strong>{enItem.progressPercent || 0}% hoàn thành</strong>
                          </div>
                        ))
                      ) : (
                        <div className="lms-empty compact">Chưa có học viên.</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="gsap-animate lms-detail-section">
                  <h3><span><PlayCircle size={18} /></span> Nội dung bài học</h3>
                  <div className="lms-lesson-list">
                    {sortedLessons.length ? (
                      sortedLessons.map(lesson => (
                        <div
                          key={lesson._id}
                          className="lms-lesson-row"
                          onClick={() => onOpenLesson?.(lesson)}
                        >
                          <div className="lms-lesson-title">
                            <div>{lesson.order}</div>
                            <span>{lesson.title}</span>
                          </div>

                          <div className="lms-lesson-actions">
                            <span className={completedLessonIds.has(String(lesson._id)) ? 'lms-status done' : 'lms-status'}>
                              {completedLessonIds.has(String(lesson._id)) ? 'Đã xong' : 'Chưa học'}
                            </span>

                            {canManageLearning && (
                              <button
                                className="lms-delete-lesson"
                                onClick={event => {
                                  event.stopPropagation()
                                  onDeleteLesson?.(lesson._id)
                                }}
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="lms-empty">
                        {needsLoginToViewLessons
                          ? 'Đăng nhập và tham gia lớp để xem bài học.'
                          : needsEnrollmentToViewLessons
                            ? 'Tham gia lớp để xem bài học.'
                            : 'Lớp học chưa có bài học nào.'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="gsap-animate lms-detail-section">
                  <h3><span><ClipboardList size={18} /></span> Bài tập thực hành</h3>
                  <div className="lms-assignment-list">
                    {visibleAssignments.length ? (
                      visibleAssignments.map(assignment => {
                        const isQuiz = assignment.type === 'quiz'
                        return (
                          <div key={assignment._id} className="lms-assignment-card">
                            <div className="lms-assignment-meta">
                              <h4>{assignment.title}</h4>
                              <p>{assignment.description || 'Không có mô tả.'}</p>
                              {renderAssignmentBody(assignment)}
                              {assignment.dueAt && (
                                <div className="lms-due-date">Hạn nộp: {new Date(assignment.dueAt).toLocaleString()}</div>
                              )}
                            </div>

                            {assignment.mySubmission && (
                              <div className="lms-submission-box">
                                <div className="lms-submission-head">
                                  <span>Trạng thái bài làm:</span>
                                  <strong className={assignment.mySubmission.status === 'graded' ? 'graded' : ''}>
                                    {assignment.mySubmission.status === 'graded'
                                      ? `Đã chấm - ${assignment.mySubmission.score} điểm`
                                      : 'Đang chờ chấm'}
                                  </strong>
                                </div>
                                {assignment.mySubmission.content && (
                                  <div className="lms-submitted-content">{assignment.mySubmission.content}</div>
                                )}
                                {assignment.mySubmission.status === 'graded' && assignment.mySubmission.feedback && (
                                  <div className="lms-feedback">Kết quả: {assignment.mySubmission.feedback}</div>
                                )}
                              </div>
                            )}

                            {currentUser && !canManageLearning && !isQuiz && (
                              <div className="lms-submit-box">
                                <textarea
                                  value={assignmentDrafts?.[assignment._id] || ''}
                                  onChange={event => onAssignmentDraftChange?.(assignment._id, event.target.value)}
                                  placeholder="Nhập nội dung bài làm của bạn..."
                                />
                                <button
                                  className="lms-secondary-action dark"
                                  onClick={() => onSubmitAssignment?.(assignment._id)}
                                >
                                  {assignment.mySubmission ? 'Nộp lại bài' : 'Gửi bài nộp'}
                                </button>
                              </div>
                            )}

                            {currentUser && !canManageLearning && isQuiz && !assignment.mySubmission && (
                              <div className="lms-submit-box">
                                <button
                                  className="lms-secondary-action dark"
                                  onClick={() => handleSubmitQuiz(assignment)}
                                >
                                  Nộp trắc nghiệm
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="lms-empty compact">Chưa có bài tập nào.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="lms-pick-empty">
                <BookOpen size={56} />
                <p>Chọn một lớp học để xem chi tiết.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default LmsView

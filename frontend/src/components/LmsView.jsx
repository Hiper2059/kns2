import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useUI } from '../context/UIContext'
import { transformHtmlVideoUrls } from '../utils/cloudinaryVideo'
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Layers3,
  MessageCircle,
  PlayCircle,
  Search,
  Sparkles,
  Users,
  Trophy,
  PlusCircle,
  Pencil,
  Trash2,
  Image as ImageIcon,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import LessonVideoUploadButton from './LessonVideoUploadButton'

const baseInputClass = "h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
const baseFileInputClass = "block w-full text-[14px] text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[14px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors file:cursor-pointer"
const baseButtonClass = "inline-flex cursor-pointer items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all disabled:opacity-50"
const ghostButtonClass = "inline-flex cursor-pointer items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
const dangerButtonClass = "inline-flex cursor-pointer items-center justify-center gap-2 h-11 px-6 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all"

const FormField = ({ label, hint, children, className = '', as = 'label' }) => {
  const FieldTag = as
  return (
    <FieldTag className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[14px] font-bold text-slate-700">{label}</span>
      {hint && <span className="text-[12px] font-medium text-slate-500">{hint}</span>}
      {children}
    </FieldTag>
  )
}

const CreatePanel = ({ title, eyebrow, description, isOpen, onToggle, children }) => (
  <section className={`bg-white border border-slate-200 rounded-[24px] shadow-sm mb-6 overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-blue-100' : ''}`}>
    <button type="button" className="w-full flex items-center justify-between p-6 md:p-8 text-left bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={onToggle} aria-expanded={isOpen}>
      <div>
        <span className="block text-[13px] font-black uppercase text-blue-600 mb-2 tracking-wide">{eyebrow}</span>
        <strong className="block text-xl md:text-2xl font-black text-slate-900 mb-1">{title}</strong>
        <small className="block text-[14px] text-slate-500 font-medium">{description}</small>
      </div>
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700">
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </span>
    </button>
    {isOpen && <div className="p-6 md:p-8 border-t border-slate-200 bg-white">{children}</div>}
  </section>
)

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
  newAssignmentData,
  onNewAssignmentDataChange,
  onCreateAssignment,
  editAssignmentId,
  editAssignmentData,
  onEditAssignmentStart,
  onEditAssignmentChange,
  onEditAssignmentCancel,
  onUpdateAssignment,
  onDeleteAssignment,
  courseLeaderboard,
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
  onDeleteLesson,
  newLessonData,
  onNewLessonDataChange,
  onCreateLesson,
  editLessonId,
  editLessonData,
  onEditLessonStart,
  onEditLessonChange,
  onEditLessonCancel,
  onUpdateLesson,
  onUploadLessonVideoFile,
  onUploadLessonEditorVideo,
  onUploadEditLessonEditorVideo
}) => {
  const { showWarning } = useUI()
  const [quizDrafts, setQuizDrafts] = useState({})
  const [courseSearch, setCourseSearch] = useState('')
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false)
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false)
  const [isNewLessonVideoUploading, setIsNewLessonVideoUploading] = useState(false)
  const [isEditLessonVideoUploading, setIsEditLessonVideoUploading] = useState(false)
  const isTeacher = currentRole === 'teacher'
  const isAdmin = currentRole === 'admin'
  const canManageLearning = isTeacher || isAdmin
  const coursePool = isTeacher ? teacherCourses : courses

  const handleCreateLessonSubmit = async event => {
    event.preventDefault()
    if (isNewLessonVideoUploading) {
      showWarning('Video đang được tải lên, cậu chờ hoàn tất nhé.')
      return
    }

    const created = await onCreateLesson?.()
    if (created) setIsCreateLessonOpen(false)
  }

  const getNewQuizQuestions = () => {
    if (!Array.isArray(newAssignmentData?.questions) || newAssignmentData.questions.length === 0) {
      return [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
    }
    return newAssignmentData.questions
  }

  const updateNewQuizQuestion = (index, newQuestion) => {
    const qs = getNewQuizQuestions()
    qs[index] = newQuestion
    onNewAssignmentDataChange?.({ ...newAssignmentData, questions: qs })
  }

  const addNewQuizQuestion = () => {
    const qs = getNewQuizQuestions()
    onNewAssignmentDataChange?.({ ...newAssignmentData, questions: [...qs, { question: '', options: ['', '', '', ''], correctOptionIndex: 0 }] })
  }

  const removeNewQuizQuestion = index => {
    const qs = getNewQuizQuestions()
    qs.splice(index, 1)
    onNewAssignmentDataChange?.({ ...newAssignmentData, questions: qs })
  }

  const handleCreateAssignmentSubmit = async () => {
    await onCreateAssignment?.({ lessonId: null })
    setIsCreateAssignmentOpen(false)
  }

  const handleUpdateLessonSubmit = async event => {
    event.preventDefault()
    if (isEditLessonVideoUploading) {
      showWarning('Video đang được tải lên, cậu chờ hoàn tất nhé.')
      return
    }

    await onUpdateLesson?.(editLessonId)
  }

  function stripHtml(value) {
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const visibleCourses = useMemo(() => {
    const keyword = courseSearch.trim().toLowerCase()
    const byCategory = selectedCategory
      ? coursePool.filter(course => course.category === selectedCategory)
      : coursePool
    if (!keyword) {
      return byCategory
    }
    return byCategory.filter(course => {
      const haystack = `${course.title || ''} ${course.category || ''} ${course.teacherName || ''} ${stripHtml(course.description)}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }, [coursePool, courseSearch, selectedCategory])

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
  const visibleAssignments = useMemo(() => {
    return Array.isArray(assignments) ? assignments.filter(a => !a.lesson && !a.lessonId) : []
  }, [assignments])
  const containerRef = useRef(null)

  const completedLessonIds = useMemo(() => {
    return new Set((enrollment?.completedLessons || []).map(item => String(item)))
  }, [enrollment])

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
      showWarning('Cậu trả lời hết các câu trước khi nộp nhé.')
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
    const myAnswers = assignment.mySubmission?.answers || []

    if (!isQuiz || !questions.length) {
      return null
    }

    return (
      <div className="flex flex-col gap-6 mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl">
        {questions.map((question, index) => (
          <div key={`${assignment._id}-question-${index}`}>
            <strong className="block text-[15px] font-bold text-slate-800 mb-3">Câu {index + 1}: {question.question}</strong>
            {currentUser && !canManageLearning && !assignment.mySubmission ? (
              <div className="flex flex-col gap-2.5">
                {(question.options || []).map((option, optionIndex) => (
                  <label key={`${assignment._id}-option-${index}-${optionIndex}`} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500"
                      name={`${assignment._id}-${index}`}
                      checked={draftAnswers[index] === optionIndex}
                      onChange={() => handleQuizAnswer(assignment._id, index, optionIndex)}
                    />
                    <span className="text-[14px] text-slate-700 font-medium">{answerLabel(optionIndex)}. {option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {(question.options || []).map((option, optionIndex) => {
                  const isCorrectAnswer = question.correctOptionIndex === optionIndex
                  const studentPickedThis = myAnswers[index] === optionIndex
                  const hasSubmission = Boolean(assignment.mySubmission)

                  let optionClass = 'bg-white border-slate-200 text-slate-600'
                  let badge = null

                  if (hasSubmission && isCorrectAnswer) {
                    optionClass = 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    badge = <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[12px] font-black">✓ Đáp án đúng</span>
                  } else if (hasSubmission && studentPickedThis && !isCorrectAnswer) {
                    optionClass = 'bg-red-50 border-red-300 text-red-700'
                    badge = <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[12px] font-black">✗ Bạn chọn sai</span>
                  }

                  return (
                    <span key={`${assignment._id}-option-${index}-${optionIndex}`} className={`flex items-center text-[14px] font-medium p-3 rounded-lg border transition-colors ${optionClass}`}>
                      <span>{answerLabel(optionIndex)}. {option}</span>
                      {badge}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="mx-auto mt-10 w-[min(1176px,calc(100vw-48px))] rounded-[14px] border border-slate-200 bg-white px-12 py-12 shadow-[0_18px_46px_rgba(15,23,42,0.08)] max-md:mt-5 max-md:w-[calc(100vw-24px)] max-md:px-4 max-md:py-6">
      <div className="gsap-animate rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_432px]">
          <div>
            <div className="flex items-center gap-2 text-[14px] font-black uppercase text-slate-500">
              <Layers3 size={16} />
              Bộ lọc khóa học
            </div>
            <div className="mt-2 text-[30px] font-black uppercase leading-none tracking-normal text-slate-950 max-md:text-[24px]">
              Khám phá khóa học
            </div>
          </div>
          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-slate-400">
            <Search size={17} />
            <input
              type="search"
              value={courseSearch}
              onChange={event => setCourseSearch(event.target.value)}
              placeholder="Tìm khóa học, giáo viên, danh mục..."
              className="h-full w-full min-w-0 border-0 bg-transparent text-[14px] font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>
      </div>

      <nav className="gsap-animate mt-7 flex gap-2 overflow-x-auto border-b border-slate-100 pb-2" aria-label="Mục lục khóa học">
        {categoryStats.map((category, index) => {
          const isActive = selectedCategory === category.name
          return (
            <button
              key={category.name || `category-${index}`}
              type="button"
              className={`flex h-11 shrink-0 cursor-pointer items-center gap-3 border-b-2 px-5 text-[15px] font-black transition ${
                isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => onSelectCategory(category.name)}
            >
              <span>{category.name}</span>
              <span className={`grid min-w-6 place-items-center rounded-md px-2 py-0.5 text-[12px] font-bold ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                {category.count}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="mt-10">
        <section aria-label="Danh sách khóa học">
          <div className="gsap-animate flex items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-[14px] font-black uppercase text-slate-500">
                <Layers3 size={16} />
                {selectedCategory || 'Tất cả khóa học'}
              </div>
              <div className="mt-2 text-[28px] font-black uppercase leading-tight tracking-normal text-slate-950">
                Khóa học phù hợp
              </div>
            </div>
            <div className="rounded-full bg-orange-50 px-4 py-2 text-[13px] font-black text-orange-700">
              {visibleCourses.length} khóa học
            </div>
          </div>

          <div className="mt-6 flex overflow-x-auto gap-6 pb-6 snap-x hide-scrollbar">
            {visibleCourses.length ? (
              visibleCourses.map((course, index) => (
                <button
                  key={course._id || course.id || `${course.title || 'course'}-${index}`}
                  type="button"
                  className={`gsap-animate shrink-0 w-[280px] snap-start flex flex-col cursor-pointer min-h-[230px] rounded-2xl border bg-white p-5 text-left shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_18px_38px_rgba(37,99,235,0.12)] ${
                    selectedCourse?._id === course._id ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-200'
                  }`}
                  onClick={() => onSelectCourse(course)}
                >
                  <div className="flex flex-col h-full">
                    {course.imageUrl && (
                      <div className="mb-4 h-36 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        <img src={course.imageUrl} alt={course.title} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="mb-4 inline-flex w-fit rounded-md bg-emerald-50 px-3 py-1 text-[12px] font-black text-emerald-700">
                      {course.category}
                    </div>
                    <div className="min-h-[46px] text-[18px] font-black leading-snug tracking-normal text-slate-950">
                      {course.title}
                    </div>
                    <div className="mt-6 line-clamp-3 min-h-[62px] text-[14px] font-semibold leading-6 text-slate-500">
                      {stripHtml(course.description) || 'Chưa có mô tả khóa học.'}
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-[13px] font-black text-slate-500 w-full">
                    <span className="inline-flex items-center gap-1.5"><BookOpen size={15} /> {course.lessonCount || course.lessonsCount || 0} bài</span>
                    <span className="inline-flex items-center gap-1.5"><Users size={15} /> {course.studentCount || 0}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="gsap-animate col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-[15px] font-bold text-slate-500">
                Chưa có khóa học nào.
              </div>
            )}
          </div>
        </section>

        <section className="mt-12 pt-12 border-t border-slate-200" aria-label="Chi tiết khóa học">
          <div className="gsap-animate rounded-[24px] overflow-hidden">
            {selectedCourse ? (
              <div className="flex flex-col gap-8">
                <div className="relative p-8 md:p-10 bg-slate-50 border border-slate-200 rounded-[24px] shadow-sm flex flex-col md:flex-row gap-8">
                  <div className="flex-1 flex flex-col gap-4 min-w-0">
                    {selectedCourse.imageUrl && (
                      <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden mb-2 bg-slate-100">
                        <img src={selectedCourse.imageUrl} alt={selectedCourse.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[12px] font-black uppercase tracking-wide w-fit">
                      <Sparkles size={14} /> {selectedCourse.category}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{selectedCourse.title}</h1>
                    <div
                      className="prose prose-slate max-w-none text-[15px] leading-relaxed text-slate-600 mt-2"
                      dangerouslySetInnerHTML={{ __html: transformHtmlVideoUrls(selectedCourse.description) || 'Chưa có mô tả chi tiết.' }}
                    />
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-[14px] font-bold text-slate-500">
                      <button className="inline-flex cursor-pointer items-center px-3 py-1.5 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors" onClick={() => onOpenProfile?.(selectedCourse.teacher)}>
                        {selectedCourse.teacherName || 'Giảng viên'}
                      </button>
                      <span className="inline-flex items-center gap-1.5"><BookOpen size={16} /> {sortedLessons.length} bài học</span>
                      <span className="inline-flex items-center gap-1.5"><Users size={16} /> {selectedCourse.studentCount || 0} học viên</span>
                    </div>

                    {enrollment && (
                      <div className="mt-6 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between text-[14px] font-bold mb-3">
                          <span className="text-slate-600">Tiến độ của bạn</span>
                          <strong className="text-emerald-600">{enrollment.progressPercent || 0}% - {getProgressLabel(enrollment.progressPercent)}</strong>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, enrollment.progressPercent || 0)}%` }}
                          />
                        </div>
                        <div className="mt-3 text-[13px] font-bold text-slate-500">
                          {enrollment.evaluation?.score != null ? `Điểm đánh giá: ${enrollment.evaluation.score}` : 'Chưa có điểm đánh giá'}
                        </div>
                        {enrollment?.evaluation?.note && <p className="mt-1 text-[14px] text-slate-600">{enrollment.evaluation.note}</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 md:w-64 flex-shrink-0">
                    {!currentUser && !canManageLearning && (
                      <div className="text-[13px] font-bold text-amber-600 bg-amber-50 p-3 rounded-xl text-center border border-amber-200">
                        Đăng nhập để tham gia
                      </div>
                    )}

                    {canEnroll && !isEnrolled && (
                      <button className="inline-flex cursor-pointer items-center justify-center h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-[0_4px_14px_0_rgb(37,99,235,0.39)]" onClick={() => onEnroll(selectedCourse._id)}>
                        Tham gia khóa học
                      </button>
                    )}

                    {isEnrolled && (
                      <div className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-200">
                        <CheckCircle2 size={18} /> Đã tham gia
                      </div>
                    )}

                    <button className="inline-flex cursor-pointer items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-all" onClick={() => onOpenCourseForum?.(selectedCourse)}>
                      <MessageCircle size={18} /> Diễn đàn khóa học
                    </button>
                  </div>
                </div>

                {canManageLearning && (
                  <div className="gsap-animate p-6 md:p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm">
                    <h3 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 pb-4 border-b border-slate-100">
                      <span className="grid place-items-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600"><Users size={18} /></span>
                      Học viên tham gia
                    </h3>
                    <div className="flex flex-col gap-4">
                      {teacherEnrollments?.length ? (
                        teacherEnrollments.map((enItem, index) => (
                          <div key={enItem._id || enItem.student || `${enItem.studentName || 'student'}-${index}`} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="text-[15px] font-bold text-slate-800">{enItem.studentName}</span>
                            <strong className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[13px] font-bold">{enItem.progressPercent || 0}% hoàn thành</strong>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-[15px] font-medium text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                          Chưa có học viên.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="gsap-animate p-6 md:p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm">
                  <h3 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 pb-4 border-b border-slate-100">
                    <span className="grid place-items-center w-10 h-10 rounded-xl bg-orange-50 text-orange-500"><Trophy size={18} /></span>
                    Top 10 Khóa học Học
                  </h3>
                  <div className="flex flex-col gap-3">
                    {courseLeaderboard?.length ? (
                      courseLeaderboard.map((user, idx) => (
                        <div key={user.studentId || user.username || `leaderboard-${idx}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                            idx === 1 ? 'bg-slate-200 text-slate-600' :
                            idx === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <img
                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer"
                            onClick={() => onOpenProfile?.(user.studentId)}
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-bold text-[15px] text-slate-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => onOpenProfile?.(user.studentId)}
                            >
                              {user.displayName}
                            </div>
                            <div className="text-[13px] text-slate-500 font-medium">@{user.username}</div>
                          </div>
                          <div className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg shrink-0">
                            {user.coursePoints}đ
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-[15px] font-medium text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        Chưa có học viên nào đạt điểm.
                      </div>
                    )}
                  </div>
                </div>

                {canManageLearning && (
                  <div className="gsap-animate mb-6">
                    {editLessonId ? (
                      <CreatePanel
                        title="Chỉnh sửa bài học"
                        eyebrow="Quản lý"
                        description="Sửa thông tin bài học."
                        isOpen={true}
                        onToggle={onEditLessonCancel}
                      >
                        <form className="flex flex-col gap-6" onSubmit={handleUpdateLessonSubmit}>
                          <FormField label="Tiêu đề bài học" hint="Ví dụ: Bài 1: Giới thiệu">
                            <input required type="text" className={baseInputClass} value={editLessonData?.title || ''} onChange={event => onEditLessonChange({ ...editLessonData, title: event.target.value })} />
                          </FormField>
                          <FormField label="Số thứ tự (Order)" hint="Thứ tự hiển thị của bài học">
                            <input required type="number" min="1" className={baseInputClass} value={editLessonData?.order || 1} onChange={event => onEditLessonChange({ ...editLessonData, order: Number(event.target.value) })} />
                          </FormField>
                          <FormField label="Video chính (Tùy chọn)" hint="Dán link hoặc tải file lên Cloudinary; video này hiển thị trong khung lớn phía trên." as="div">
                            <div className="flex gap-2">
                              <input type="url" className={`${baseInputClass} flex-1`} value={editLessonData?.videoUrl || ''} onChange={event => onEditLessonChange({ ...editLessonData, videoUrl: event.target.value })} />
                              <LessonVideoUploadButton
                                className={ghostButtonClass}
                                onUpload={onUploadLessonVideoFile}
                                onUploaded={videoUrl => onEditLessonChange(prev => ({ ...prev, videoUrl, videoFile: null }))}
                                onUploadingChange={setIsEditLessonVideoUploading}
                              />
                            </div>
                          </FormField>
                          <FormField as="div" label="URL Ảnh nền (Tùy chọn)" hint="Link ảnh bìa của bài học">
                            <div className="flex gap-2">
                              <input type="url" className={`${baseInputClass} flex-1`} value={editLessonData?.imageUrl || ''} onChange={event => onEditLessonChange({ ...editLessonData, imageUrl: event.target.value })} />
                              <label className={ghostButtonClass}>
                                <ImageIcon size={18} />
                                <span>Tải ảnh lên</span>
                                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; if (file) onEditLessonChange({ ...editLessonData, imageFile: file }); }} />
                              </label>
                            </div>
                            {editLessonData?.imageFile && <div className="text-[13px] text-blue-600 font-medium">Đã chọn file: {editLessonData.imageFile.name}</div>}
                          </FormField>
                          <FormField label="Nội dung bài học" hint="Nút video trong trình soạn thảo chỉ chèn video vào nội dung, không thay video chính phía trên." as="div">
                            <div className="rounded-xl border border-slate-200 overflow-hidden">
                              <RichTextEditor toolbarId="lms-edit-lesson-editor" value={editLessonData?.content || ''} onChange={content => onEditLessonChange({ ...editLessonData, content })} onUploadVideo={onUploadEditLessonEditorVideo} />
                            </div>
                          </FormField>
                          <div className="flex items-center gap-3 justify-end mt-4 pt-6 border-t border-slate-100">
                            <button type="button" className={ghostButtonClass} onClick={onEditLessonCancel}>Hủy</button>
                            <button type="submit" className={baseButtonClass} disabled={isEditLessonVideoUploading}><CheckCircle2 size={18} /> Cập nhật</button>
                          </div>
                        </form>
                      </CreatePanel>
                    ) : (
                      <CreatePanel
                        title="Thêm bài học mới"
                        eyebrow="Tạo mới"
                        description="Thêm bài học mới vào khóa học này."
                        isOpen={isCreateLessonOpen}
                        onToggle={() => setIsCreateLessonOpen(prev => !prev)}
                      >
                        <form className="flex flex-col gap-6" onSubmit={handleCreateLessonSubmit}>
                          <FormField label="Tiêu đề bài học" hint="Ví dụ: Bài 1: Giới thiệu">
                            <input required type="text" className={baseInputClass} value={newLessonData?.title || ''} onChange={event => onNewLessonDataChange({ ...newLessonData, title: event.target.value })} />
                          </FormField>
                          <FormField label="Số thứ tự (Order)" hint="Thứ tự hiển thị của bài học">
                            <input required type="number" min="1" className={baseInputClass} value={newLessonData?.order || 1} onChange={event => onNewLessonDataChange({ ...newLessonData, order: Number(event.target.value) })} />
                          </FormField>
                          <FormField label="Video chính (Tùy chọn)" hint="Dán link hoặc tải file lên Cloudinary; video này hiển thị trong khung lớn phía trên." as="div">
                            <div className="flex gap-2">
                              <input type="url" className={`${baseInputClass} flex-1`} value={newLessonData?.videoUrl || ''} onChange={event => onNewLessonDataChange({ ...newLessonData, videoUrl: event.target.value })} />
                              <LessonVideoUploadButton
                                className={ghostButtonClass}
                                onUpload={onUploadLessonVideoFile}
                                onUploaded={videoUrl => onNewLessonDataChange(prev => ({ ...prev, videoUrl, videoFile: null }))}
                                onUploadingChange={setIsNewLessonVideoUploading}
                              />
                            </div>
                          </FormField>
                          <FormField as="div" label="URL Ảnh nền (Tùy chọn)" hint="Link ảnh bìa của bài học">
                            <div className="flex gap-2">
                              <input type="url" className={`${baseInputClass} flex-1`} value={newLessonData?.imageUrl || ''} onChange={event => onNewLessonDataChange({ ...newLessonData, imageUrl: event.target.value })} />
                              <label className={ghostButtonClass}>
                                <ImageIcon size={18} />
                                <span>Tải ảnh lên</span>
                                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; if (file) onNewLessonDataChange({ ...newLessonData, imageFile: file }); }} />
                              </label>
                            </div>
                            {newLessonData?.imageFile && <div className="text-[13px] text-blue-600 font-medium">Đã chọn file: {newLessonData.imageFile.name}</div>}
                          </FormField>
                          <FormField label="Nội dung bài học" hint="Nút video trong trình soạn thảo chỉ chèn video vào nội dung, không thay video chính phía trên." as="div">
                            <div className="rounded-xl border border-slate-200 overflow-hidden">
                              <RichTextEditor toolbarId="lms-new-lesson-editor" value={newLessonData?.content || ''} onChange={content => onNewLessonDataChange({ ...newLessonData, content })} onUploadVideo={onUploadLessonEditorVideo} />
                            </div>
                          </FormField>
                          <div className="flex justify-end mt-4 pt-6 border-t border-slate-100">
                            <button type="submit" className={baseButtonClass} disabled={isNewLessonVideoUploading}><PlusCircle size={18} /> Tạo bài học</button>
                          </div>
                        </form>
                      </CreatePanel>
                    )}
                  </div>
                )}

                <div className="gsap-animate p-6 md:p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm">
                  <h3 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 pb-4 border-b border-slate-100">
                    <span className="grid place-items-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600"><PlayCircle size={18} /></span>
                    Danh sách bài học
                  </h3>
                  <div className="flex flex-col gap-4">
                    {sortedLessons.length ? (
                      sortedLessons.map((lesson, index) => (
                        <div
                          key={lesson._id || lesson.id || `${lesson.title || 'lesson'}-${index}`}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all gap-4"
                          onClick={() => onOpenLesson?.(lesson)}
                        >
                          <div className="flex items-center gap-4">
                            {lesson.imageUrl ? (
                              <img src={lesson.imageUrl} alt={lesson.title} className="w-14 h-10 rounded-lg object-cover bg-slate-200 shrink-0" />
                            ) : (
                              <div className="grid place-items-center w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-[15px] shrink-0">{lesson.order}</div>
                            )}
                            <span className="text-[16px] font-bold text-slate-800 line-clamp-2">{lesson.title}</span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1.5 rounded-full text-[13px] font-bold ${completedLessonIds.has(String(lesson._id)) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                              {completedLessonIds.has(String(lesson._id)) ? 'Đã xong' : 'Chưa học'}
                            </span>

                            {canManageLearning && (
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[13px] font-bold transition-colors"
                                  onClick={event => {
                                    event.stopPropagation()
                                    onEditLessonStart?.(lesson)
                                  }}
                                >
                                  Sửa
                                </button>
                                <button
                                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[13px] font-bold transition-colors"
                                  onClick={event => {
                                    event.stopPropagation()
                                    onDeleteLesson?.(lesson._id)
                                  }}
                                >
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-[15px] font-medium text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        Khóa học chưa có bài học nào.
                      </div>
                    )}
                  </div>
                </div>

                <div className="gsap-animate p-6 md:p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm mt-8">
                  <h3 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 pb-4 border-b border-slate-100">
                    <span className="grid place-items-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600"><ClipboardList size={18} /></span>
                    Tạo bài kiểm tra
                  </h3>

                  {canManageLearning && (
                    <div className="mb-8">
                      <CreatePanel
                        title="Thêm bài kiểm tra"
                        eyebrow="Tạo mới"
                        description="Tạo bài trắc nghiệm, tự luận hoặc kiểm tra cuối khóa."
                        isOpen={isCreateAssignmentOpen}
                        onToggle={() => setIsCreateAssignmentOpen(!isCreateAssignmentOpen)}
                      >
                        <div className="flex flex-col gap-4 mt-4">
                          <FormField label="Loại bài kiểm tra" as="div">
                            <select
                              className={baseInputClass}
                              value={newAssignmentData?.type || 'quiz'}
                              onChange={e => onNewAssignmentDataChange?.({ ...newAssignmentData, type: e.target.value })}
                            >
                              <option value="quiz">Trắc nghiệm</option>
                              <option value="text">Tự luận</option>
                              <option value="practical">Báo cáo / Thực hành (Video)</option>

                            </select>
                          </FormField>
                          <FormField label="Tiêu đề" as="div">
                            <input
                              type="text"
                              className={baseInputClass}
                              placeholder="Tiêu đề bài kiểm tra"
                              value={newAssignmentData?.title || ''}
                              onChange={e => onNewAssignmentDataChange?.({ ...newAssignmentData, title: e.target.value })}
                            />
                          </FormField>
                          <FormField label="Hạn nộp bài (Date & Time)" as="div">
                            <input
                              type="datetime-local"
                              className={baseInputClass}
                              value={newAssignmentData?.dueAt || ''}
                              onChange={e => onNewAssignmentDataChange?.({ ...newAssignmentData, dueAt: e.target.value })}
                            />
                          </FormField>
                          {(newAssignmentData?.type || 'quiz') !== 'quiz' && (
                            <FormField label="Mô tả / Yêu cầu đề bài (Tùy chọn)" as="div">
                              <textarea
                                className={baseInputClass}
                                rows={3}
                                value={newAssignmentData?.description || ''}
                                onChange={e => onNewAssignmentDataChange?.({ ...newAssignmentData, description: e.target.value })}
                              />
                            </FormField>
                          )}
                          {(newAssignmentData?.type || 'quiz') === 'quiz' && getNewQuizQuestions().map((question, questionIndex) => (
                            <div key={`new-quiz-question-${questionIndex}`} className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-white p-4">
                              <div className="flex items-center justify-between gap-3">
                                <strong className="text-[14px] font-black text-slate-800">Câu {questionIndex + 1}</strong>
                                {getNewQuizQuestions().length > 1 && (
                                  <button type="button" className={dangerButtonClass} onClick={() => removeNewQuizQuestion(questionIndex)}>
                                    Xóa câu
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                className={baseInputClass}
                                placeholder="Nội dung câu hỏi"
                                value={question.question}
                                onChange={e => updateNewQuizQuestion(questionIndex, { ...question, question: e.target.value })}
                              />
                              <div className="grid gap-3 md:grid-cols-2">
                                {question.options.map((option, optionIndex) => (
                                  <label key={`new-quiz-option-${questionIndex}-${optionIndex}`} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`new-quiz-correct-${questionIndex}`}
                                      checked={question.correctOptionIndex === optionIndex}
                                      onChange={() => updateNewQuizQuestion(questionIndex, { ...question, correctOptionIndex: optionIndex })}
                                    />
                                    <input
                                      type="text"
                                      className={baseInputClass}
                                      placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)}`}
                                      value={option}
                                      onChange={e => {
                                        const options = [...question.options]
                                        options[optionIndex] = e.target.value
                                        updateNewQuizQuestion(questionIndex, { ...question, options })
                                      }}
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                          {(newAssignmentData?.type || 'quiz') === 'quiz' && (
                            <button type="button" className={ghostButtonClass} onClick={addNewQuizQuestion}>
                              Thêm câu hỏi
                            </button>
                          )}
                          <div className="flex justify-end mt-4 pt-6 border-t border-slate-100">
                            <button className={baseButtonClass} onClick={handleCreateAssignmentSubmit}>
                              Tạo bài kiểm tra
                            </button>
                          </div>
                        </div>
                      </CreatePanel>
                    </div>
                  )}

                  <div className="flex flex-col gap-6">
                    {visibleAssignments.length ? (
                      visibleAssignments.map((assignment, index) => {
                        const isQuiz = assignment.type === 'quiz'
                        return (
                          <div key={assignment._id || assignment.id || `${assignment.title || 'assignment'}-${index}`} className="flex flex-col gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <div>
                              <h4 className="text-xl font-black text-slate-900 mb-2">{assignment.title}</h4>
                              {assignment.dueAt && (
                                <p className="text-[13px] font-bold text-red-600 mb-2">Hạn nộp: {new Date(assignment.dueAt).toLocaleString('vi-VN')}</p>
                              )}
                              <p className="text-[15px] text-slate-600">{assignment.description || 'Không có mô tả.'}</p>
                              {renderAssignmentBody(assignment)}
                            </div>

                            {assignment.mySubmission && (
                              <div className="mt-2 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex items-center justify-between text-[14px] mb-3">
                                  <span className="font-bold text-slate-600">Trạng thái bài làm:</span>
                                  <strong className={`px-3 py-1 rounded-lg font-bold ${assignment.mySubmission.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {assignment.mySubmission.status === 'graded'
                                      ? `Đã chấm - ${assignment.mySubmission.score}${assignment.type === 'quiz' ? '%' : ' điểm'}`
                                      : assignment.mySubmission.status === 'submitted' ? 'Đã nộp - Đang chờ chấm' : 'Đang chờ chấm'}
                                  </strong>
                                </div>
                                {assignment.mySubmission.content && (
                                  <div className="p-4 bg-white border border-slate-200 rounded-lg text-[14px] font-medium text-slate-700 mt-3">{assignment.mySubmission.content}</div>
                                )}
                                {assignment.mySubmission.status === 'graded' && assignment.mySubmission.feedback && (
                                  <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-[14px] font-bold text-blue-800">
                                    Kết quả: {assignment.mySubmission.feedback}
                                  </div>
                                )}
                              </div>
                            )}

                            {currentUser && !canManageLearning && !isQuiz && (
                              <div className="mt-4 flex flex-col gap-4">
                                <textarea
                                  className="w-full min-h-[120px] p-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-y"
                                  value={assignmentDrafts?.[assignment._id] || ''}
                                  onChange={event => onAssignmentDraftChange?.(assignment._id, event.target.value)}
                                  placeholder="Nhập nội dung bài làm của bạn..."
                                />
                                <button
                                  className="inline-flex cursor-pointer self-start items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all"
                                  onClick={() => onSubmitAssignment?.(assignment._id)}
                                >
                                  {assignment.mySubmission ? 'Nộp lại bài' : 'Gửi bài nộp'}
                                </button>
                              </div>
                            )}

                            {currentUser && !canManageLearning && isQuiz && !assignment.mySubmission && (
                              <div className="mt-4 flex flex-col gap-3">
                                <button
                                  className="inline-flex cursor-pointer self-start items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all"
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
                      <div className="py-10 text-center text-[15px] font-medium text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        Chưa có bài tập nào.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 px-4 text-center bg-slate-50 border border-dashed border-slate-300 rounded-[24px] text-slate-400">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                  <BookOpen size={40} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa chọn khóa học</h3>
                <p className="text-[15px] text-slate-500">Hãy chọn một khóa học ở danh sách bên trên để xem chi tiết.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default LmsView

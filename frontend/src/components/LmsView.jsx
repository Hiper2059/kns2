import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useUI } from '../context/UIContext'
import SafeRichHtml from './ui/SafeRichHtml'
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
  Film,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import { paginateCourses } from '../utils/coursePagination'

const baseInputClass = "h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
const baseButtonClass = "inline-flex cursor-pointer items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all disabled:opacity-50"
const ghostButtonClass = "inline-flex cursor-pointer items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"

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
  onUploadLessonEditorVideo,
  onUploadEditLessonEditorVideo,
  newAssignmentData,
  onNewAssignmentDataChange,
  onCreateAssignment,
  editAssignmentId,
  editAssignmentData,
  onEditAssignmentStart,
  onEditAssignmentChange,
  onEditAssignmentCancel,
  onUpdateAssignment,
  onDeleteAssignment
}) => {
  const { showWarning } = useUI()
  const [quizDrafts, setQuizDrafts] = useState({})
  const [activeTestTimes, setActiveTestTimes] = useState({})

  const startTest = (assignmentId, durationMinutes) => {
    const startTime = Date.now()
    localStorage.setItem(`test_start_${assignmentId}`, startTime)
    setActiveTestTimes(prev => ({
      ...prev,
      [assignmentId]: durationMinutes * 60
    }))
  }

  // Ticks running timers
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestTimes(prev => {
        const next = { ...prev }
        let updated = false
        Object.keys(next).forEach(id => {
          const startStr = localStorage.getItem(`test_start_${id}`)
          if (!startStr) {
            delete next[id]
            updated = true
            return
          }
          const startTime = Number(startStr)
          const assignment = assignments.find(a => String(a._id) === id)
          if (!assignment) {
            delete next[id]
            updated = true
            return
          }
          const durationSeconds = (assignment.duration || 0) * 60
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
          const remaining = durationSeconds - elapsedSeconds
          if (remaining <= 0) {
            delete next[id]
            localStorage.removeItem(`test_start_${id}`)
            updated = true
            
            // Auto submit
            if (assignment.type === 'quiz') {
              const answers = quizDrafts[id] || []
              const questions = Array.isArray(assignment.questions) ? assignment.questions : []
              // If student hasn't selected answers, default to 0
              const finalAnswers = questions.map((q, idx) => Number.isInteger(answers[idx]) ? answers[idx] : 0)
              onSubmitQuizAssignment?.(id, finalAnswers)
            } else {
              onSubmitAssignment?.(id)
            }
          } else {
            if (next[id] !== remaining) {
              next[id] = remaining
              updated = true
            }
          }
        })
        return updated ? next : prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [assignments, quizDrafts, onSubmitAssignment, onSubmitQuizAssignment])

  // Populate active test times on mount/update
  useEffect(() => {
    const times = {}
    assignments.forEach(assignment => {
      if (assignment.duration > 0 && !assignment.mySubmission) {
        const startStr = localStorage.getItem(`test_start_${assignment._id}`)
        if (startStr) {
          const startTime = Number(startStr)
          const durationSeconds = assignment.duration * 60
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
          const remaining = durationSeconds - elapsedSeconds
          if (remaining > 0) {
            times[assignment._id] = remaining
          } else {
            localStorage.removeItem(`test_start_${assignment._id}`)
            if (assignment.type === 'quiz') {
              const answers = quizDrafts[assignment._id] || []
              const questions = Array.isArray(assignment.questions) ? assignment.questions : []
              const finalAnswers = questions.map((q, idx) => Number.isInteger(answers[idx]) ? answers[idx] : 0)
              onSubmitQuizAssignment?.(assignment._id, finalAnswers)
            } else {
              onSubmitAssignment?.(assignment._id)
            }
          }
        }
      }
    })
    setActiveTestTimes(times)
  }, [assignments])

  const handleTextSubmit = async (assignmentId) => {
    await onSubmitAssignment?.(assignmentId)
    localStorage.removeItem(`test_start_${assignmentId}`)
    setActiveTestTimes(prev => {
      const next = { ...prev }
      delete next[assignmentId]
      return next
    })
  }

  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false)

  const getNewQuizQuestions = () => {
    const questions = Array.isArray(newAssignmentData?.questions) && newAssignmentData.questions.length
      ? newAssignmentData.questions
      : [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
    return questions.map(question => ({
      question: question.question || '',
      options: [...(question.options || []), '', '', '', ''].slice(0, 4),
      correctOptionIndex: Number(question.correctOptionIndex) || 0
    }))
  }

  const updateNewQuizQuestion = (questionIndex, nextQuestion) => {
    const questions = getNewQuizQuestions()
    questions[questionIndex] = nextQuestion
    onNewAssignmentDataChange?.({ ...newAssignmentData, questions })
  }

  const addNewQuizQuestion = () => {
    onNewAssignmentDataChange?.({
      ...newAssignmentData,
      questions: [...getNewQuizQuestions(), { question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
    })
  }

  const removeNewQuizQuestion = questionIndex => {
    const questions = getNewQuizQuestions().filter((_, index) => index !== questionIndex)
    onNewAssignmentDataChange?.({
      ...newAssignmentData,
      questions: questions.length ? questions : [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
    })
  }

  const getEditQuizQuestions = () => {
    const questions = Array.isArray(editAssignmentData?.questions) && editAssignmentData.questions.length
      ? editAssignmentData.questions
      : [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
    return questions.map(question => ({
      question: question.question || '',
      options: [...(question.options || []), '', '', '', ''].slice(0, 4),
      correctOptionIndex: Number(question.correctOptionIndex) || 0
    }))
  }

  const updateEditQuizQuestion = (questionIndex, nextQuestion) => {
    const questions = getEditQuizQuestions()
    questions[questionIndex] = nextQuestion
    onEditAssignmentChange?.({ ...editAssignmentData, questions })
  }

  const addEditQuizQuestion = () => {
    onEditAssignmentChange?.({
      ...editAssignmentData,
      questions: [...getEditQuizQuestions(), { question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
    })
  }

  const removeEditQuizQuestion = questionIndex => {
    const questions = getEditQuizQuestions().filter((_, index) => index !== questionIndex)
    onEditAssignmentChange?.({
      ...editAssignmentData,
      questions: questions.length ? questions : [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
    })
  }

  const handleCreateAssignmentClick = () => {
    const title = String(newAssignmentData?.title || '').trim()
    if (!title) {
      showWarning('Nhập tiêu đề bài tập nhé!')
      return
    }
    
    const questions = newAssignmentData.type === 'quiz' ? getNewQuizQuestions()
      .map(item => {
        const options = (item.options || []).map(option => String(option || '').trim()).filter(Boolean)
        return {
          question: String(item.question || '').trim(),
          options,
          correctOptionIndex: Math.min(Number(item.correctOptionIndex) || 0, Math.max(options.length - 1, 0))
        }
      })
      .filter(item => item.question && item.options.length >= 2) : []

    if (newAssignmentData.type === 'quiz' && !questions.length) {
      showWarning('Quiz cần ít nhất 1 câu hỏi và mỗi câu có tối thiểu 2 đáp án.')
      return
    }

    onCreateAssignment?.({
      courseId: selectedCourse?._id,
      lessonId: newAssignmentData.lessonId || null,
      title,
      description: newAssignmentData.description || '',
      type: newAssignmentData.type || 'quiz',
      duration: Number(newAssignmentData.duration) || 0,
      questions
    })
    
    setIsCreateAssignmentOpen(false)
  }

  const handleUpdateAssignmentClick = () => {
    const title = String(editAssignmentData?.title || '').trim()
    if (!title) {
      showWarning('Nhập tiêu đề bài tập nhé!')
      return
    }

    const questions = editAssignmentData.type === 'quiz' ? getEditQuizQuestions()
      .map(item => {
        const options = (item.options || []).map(option => String(option || '').trim()).filter(Boolean)
        return {
          question: String(item.question || '').trim(),
          options,
          correctOptionIndex: Math.min(Number(item.correctOptionIndex) || 0, Math.max(options.length - 1, 0))
        }
      })
      .filter(item => item.question && item.options.length >= 2) : []

    if (editAssignmentData.type === 'quiz' && !questions.length) {
      showWarning('Quiz cần ít nhất 1 câu hỏi và mỗi câu có tối thiểu 2 đáp án.')
      return
    }

    onUpdateAssignment?.(editAssignmentId, {
      title,
      description: editAssignmentData.description || '',
      type: editAssignmentData.type || 'quiz',
      duration: Number(editAssignmentData.duration) || 0,
      lessonId: editAssignmentData.lessonId || null,
      questions
    })
  }
  const [courseSearch, setCourseSearch] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [coursePagination, setCoursePagination] = useState({ page: 1, filterKey: '' })
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false)
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false)
  const isTeacher = currentRole === 'teacher'
  const isAdmin = currentRole === 'admin'
  const canManageLearning = isTeacher || isAdmin
  const coursePool = isTeacher ? teacherCourses : courses
  function stripHtml(value) {
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const teacherOptions = useMemo(() => {
    const map = new Map();
    const relevantCourses = selectedCategory ? coursePool.filter(c => c.category === selectedCategory) : coursePool;
    relevantCourses.forEach(course => {
      if (course.teacherName || course.teacher) {
        const username = course.teacher?.username || course.teacherName;
        if (username && !map.has(username)) {
          let displayName = course.teacher?.profile?.displayName || course.teacher?.profile?.stageName || course.teacherName || username;
          if (!displayName || displayName.trim() === '') {
            displayName = username;
          }
          map.set(username, {
            username,
            displayName,
            avatarUrl: course.teacher?.profile?.avatarUrl
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [coursePool, selectedCategory])

  const visibleCourses = useMemo(() => {
    const keyword = courseSearch.trim().toLowerCase()
    const byCategory = selectedCategory
      ? coursePool.filter(course => course.category === selectedCategory)
      : coursePool
    const byTeacher = selectedTeacher
      ? byCategory.filter(course => (course.teacher?.username || course.teacherName) === selectedTeacher)
      : byCategory
    if (!keyword) {
      return byTeacher
    }
    return byTeacher.filter(course => {
      const haystack = `${course.title || ''} ${course.category || ''} ${course.teacherName || ''} ${stripHtml(course.description)}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }, [coursePool, courseSearch, selectedCategory, selectedTeacher])

  const courseFilterKey = JSON.stringify([courseSearch, selectedCategory, selectedTeacher])
  const requestedCoursePage = coursePagination.filterKey === courseFilterKey
    ? coursePagination.page
    : 1
  const {
    courses: paginatedCourses,
    currentPage: currentCoursePage,
    totalPages: courseTotalPages
  } = useMemo(
    () => paginateCourses(visibleCourses, requestedCoursePage),
    [visibleCourses, requestedCoursePage]
  )

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
  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => (a.order || 1) - (b.order || 1)),
    [lessons]
  )
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    const isExpired = d.getTime() < Date.now()
    const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const datePart = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return {
      text: `${timePart} - ${datePart}`,
      isExpired
    }
  }
  const visibleAssignments = (Array.isArray(assignments) ? assignments : []).filter(assignment => {
    console.log("Assignment:", assignment.title, "lesson:", assignment.lesson, "lessonId:", assignment.lessonId)
    return !assignment.lesson && !assignment.lessonId
  })
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
      localStorage.removeItem(`test_start_${assignment._id}`)
      setActiveTestTimes(prev => {
        const next = { ...prev }
        delete next[assignment._id]
        return next
      })
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
              Khám phá lớp học
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-slate-400 w-full md:w-[280px]">
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
      </div>

      <nav className="gsap-animate mt-7 flex gap-2 overflow-x-auto border-b border-slate-100 pb-2" aria-label="Mục lục lớp học">
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
          <div className="gsap-animate flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 text-[14px] font-black uppercase text-slate-500">
                <Layers3 size={16} />
                {selectedCategory || 'Tất cả lớp'}
              </div>
              <div className="mt-2 text-[28px] font-black uppercase leading-tight tracking-normal text-slate-950 flex items-center gap-3">
                Khóa học phù hợp
                <div className="rounded-full bg-orange-50 px-3 py-1 text-[13px] font-black text-orange-700 flex items-center">
                  {visibleCourses.length} khóa học
                </div>
              </div>
            </div>

            {teacherOptions.length > 0 && (
              <div className="relative w-full md:w-[260px] z-20 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsTeacherDropdownOpen(false), 200)}
                  className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-700 outline-none hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm"
                >
                  {selectedTeacher ? (
                    <div className="flex items-center gap-2 truncate">
                      {(() => {
                        const t = teacherOptions.find(opt => opt.username === selectedTeacher);
                        if (!t) return <span>Lọc theo giáo viên</span>;
                        return (
                          <>
                            <img src={t.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.displayName)}&background=random`} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                            <span className="truncate">{t.displayName}</span>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <span>Lọc theo giáo viên</span>
                  )}
                  <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isTeacherDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTeacherDropdownOpen && (
                  <div className="absolute top-full right-0 z-30 mt-1.5 w-full md:w-[280px] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl">
                    <div className="max-h-[300px] overflow-y-auto overscroll-contain py-1">
                      <button
                        type="button"
                        className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 ${!selectedTeacher ? 'bg-blue-50/50' : ''}`}
                        onMouseDown={() => {
                          setSelectedTeacher('')
                          setIsTeacherDropdownOpen(false)
                        }}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <Users size={16} />
                        </div>
                        <span className={`text-[14px] font-bold ${!selectedTeacher ? 'text-blue-700' : 'text-slate-700'}`}>Tất cả giáo viên</span>
                      </button>
                      {teacherOptions.map(teacher => {
                        const isActive = selectedTeacher === teacher.username;
                        return (
                          <button
                            key={teacher.username}
                            type="button"
                            className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 ${isActive ? 'bg-blue-50/50' : ''}`}
                            onMouseDown={() => {
                              setSelectedTeacher(teacher.username)
                              setIsTeacherDropdownOpen(false)
                            }}
                          >
                            <img src={teacher.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.displayName)}&background=random`} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm" />
                            <div className="flex flex-col overflow-hidden">
                              <span className={`truncate text-[14px] font-bold ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>{teacher.displayName}</span>
                              <span className="truncate text-[12px] font-medium text-slate-500">@{teacher.username}</span>
                            </div>
                            {isActive && <CheckCircle2 size={16} className="ml-auto shrink-0 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 pb-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.length ? (
              paginatedCourses.map((course, index) => (
                <button
                  key={course._id || course.id || `${course.title || 'course'}-${index}`}
                  type="button"
                  className={`gsap-animate flex min-h-[230px] w-full cursor-pointer flex-col rounded-2xl border bg-white p-5 text-left shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_18px_38px_rgba(37,99,235,0.12)] ${
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
                      {stripHtml(course.description) || 'Chưa có mô tả lớp học.'}
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
                Chưa có lớp học nào.
              </div>
            )}
          </div>
          {courseTotalPages > 1 && (
            <nav className="mt-1 flex items-center justify-center gap-3" aria-label="Phân trang khóa học">
              <button
                type="button"
                className="inline-flex h-10 cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setCoursePagination({
                  page: Math.max(1, currentCoursePage - 1),
                  filterKey: courseFilterKey
                })}
                disabled={currentCoursePage <= 1}
              >
                <ChevronLeft size={18} /> Trước
              </button>
              <span className="min-w-24 text-center text-[14px] font-bold text-slate-700">
                Trang {currentCoursePage} / {courseTotalPages}
              </span>
              <button
                type="button"
                className="inline-flex h-10 cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setCoursePagination({
                  page: Math.min(courseTotalPages, currentCoursePage + 1),
                  filterKey: courseFilterKey
                })}
                disabled={currentCoursePage >= courseTotalPages}
              >
                Sau <ChevronRight size={18} />
              </button>
            </nav>
          )}
        </section>

        <section className="mt-12 pt-12 border-t border-slate-200" aria-label="Chi tiết lớp học">
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
                    <SafeRichHtml
                      className="prose prose-slate max-w-none text-[15px] leading-relaxed text-slate-600 mt-2"
                      html={selectedCourse.description || 'Chưa có mô tả chi tiết.'}
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
                        Tham gia lớp học
                      </button>
                    )}

                    {isEnrolled && (
                      <div className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-200">
                        <CheckCircle2 size={18} /> Đã tham gia
                      </div>
                    )}

                    <button className="inline-flex cursor-pointer items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-all" onClick={() => onOpenCourseForum?.(selectedCourse)}>
                      <MessageCircle size={18} /> Diễn đàn lớp
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
                    Top 10 Lớp Học
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
                        <form className="flex flex-col gap-6" onSubmit={event => { event.preventDefault(); onUpdateLesson(editLessonId); }}>
                          <FormField label="Tiêu đề bài học" hint="Ví dụ: Bài 1: Giới thiệu">
                            <input required type="text" className={baseInputClass} value={editLessonData?.title || ''} onChange={event => onEditLessonChange({ ...editLessonData, title: event.target.value })} />
                          </FormField>
                          <FormField label="Số thứ tự (Order)" hint="Thứ tự hiển thị của bài học">
                            <input required type="number" min="1" className={baseInputClass} value={editLessonData?.order || 1} onChange={event => onEditLessonChange({ ...editLessonData, order: Number(event.target.value) })} />
                          </FormField>
                          <FormField label="URL Video (Tùy chọn)" hint="Link video YouTube hoặc Vimeo">
                            <div className="flex gap-2">
                              <input type="url" className={`${baseInputClass} flex-1`} value={editLessonData?.videoUrl || ''} onChange={event => onEditLessonChange({ ...editLessonData, videoUrl: event.target.value })} />
                              <label className={ghostButtonClass}>
                                <Film size={18} />
                                <span>Tải video lên</span>
                                <input type="file" className="hidden" accept="video/mp4,video/webm" onChange={event => { const file = event.target.files?.[0]; if (file) onEditLessonChange({ ...editLessonData, videoFile: file }); }} />
                              </label>
                            </div>
                            {editLessonData?.videoFile && <div className="text-[13px] text-blue-600 font-medium">Đã chọn file: {editLessonData.videoFile.name}</div>}
                          </FormField>
                          <FormField label="URL Ảnh nền (Tùy chọn)" hint="Link ảnh bìa của bài học">
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
                          <FormField label="Nội dung bài học">
                            <div className="rounded-xl border border-slate-200 overflow-hidden">
                              <RichTextEditor toolbarId="lms-edit-lesson-editor" value={editLessonData?.content || ''} onChange={content => onEditLessonChange({ ...editLessonData, content })} onUploadVideo={onUploadEditLessonEditorVideo} />
                            </div>
                          </FormField>
                          <div className="flex items-center gap-3 justify-end mt-4 pt-6 border-t border-slate-100">
                            <button type="button" className={ghostButtonClass} onClick={onEditLessonCancel}>Hủy</button>
                            <button type="submit" className={baseButtonClass}><CheckCircle2 size={18} /> Cập nhật</button>
                          </div>
                        </form>
                      </CreatePanel>
                    ) : (
                      <CreatePanel
                        title="Thêm bài học mới"
                        eyebrow="Tạo mới"
                        description="Thêm bài học mới vào lớp này."
                        isOpen={isCreateLessonOpen}
                        onToggle={() => setIsCreateLessonOpen(prev => !prev)}
                      >
                        <form className="flex flex-col gap-6" onSubmit={event => { event.preventDefault(); onCreateLesson(); setIsCreateLessonOpen(false); }}>
                          <FormField label="Tiêu đề bài học" hint="Ví dụ: Bài 1: Giới thiệu">
                            <input required type="text" className={baseInputClass} value={newLessonData?.title || ''} onChange={event => onNewLessonDataChange({ ...newLessonData, title: event.target.value })} />
                          </FormField>
                          <FormField label="Số thứ tự (Order)" hint="Thứ tự hiển thị của bài học">
                            <input required type="number" min="1" className={baseInputClass} value={newLessonData?.order || 1} onChange={event => onNewLessonDataChange({ ...newLessonData, order: Number(event.target.value) })} />
                          </FormField>
                          <FormField label="URL Video (Tùy chọn)" hint="Link video YouTube hoặc Vimeo">
                            <div className="flex gap-2">
                              <input type="url" className={`${baseInputClass} flex-1`} value={newLessonData?.videoUrl || ''} onChange={event => onNewLessonDataChange({ ...newLessonData, videoUrl: event.target.value })} />
                              <label className={ghostButtonClass}>
                                <Film size={18} />
                                <span>Tải video lên</span>
                                <input type="file" className="hidden" accept="video/mp4,video/webm" onChange={event => { const file = event.target.files?.[0]; if (file) onNewLessonDataChange({ ...newLessonData, videoFile: file }); }} />
                              </label>
                            </div>
                            {newLessonData?.videoFile && <div className="text-[13px] text-blue-600 font-medium">Đã chọn file: {newLessonData.videoFile.name}</div>}
                          </FormField>
                          <FormField label="URL Ảnh nền (Tùy chọn)" hint="Link ảnh bìa của bài học">
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
                          <FormField label="Nội dung bài học">
                            <div className="rounded-xl border border-slate-200 overflow-hidden">
                              <RichTextEditor toolbarId="lms-new-lesson-editor" value={newLessonData?.content || ''} onChange={content => onNewLessonDataChange({ ...newLessonData, content })} onUploadVideo={onUploadLessonEditorVideo} />
                            </div>
                          </FormField>
                          <div className="flex justify-end mt-4 pt-6 border-t border-slate-100">
                            <button type="submit" className={baseButtonClass}><PlusCircle size={18} /> Tạo bài học</button>
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
                        Lớp học chưa có bài học nào.
                      </div>
                    )}
                  </div>
                </div>

                {canManageLearning && (
                  <div className="gsap-animate mb-6">
                    {editAssignmentId ? (
                      <CreatePanel
                        title="Chỉnh sửa bài kiểm tra / bài tập"
                        eyebrow="Quản lý"
                        description="Sửa thông tin bài kiểm tra hoặc bài tập thực hành."
                        isOpen={true}
                        onToggle={onEditAssignmentCancel}
                      >
                        <form className="flex flex-col gap-6" onSubmit={event => { event.preventDefault(); handleUpdateAssignmentClick(); }}>
                          <FormField label="Tiêu đề bài kiểm tra / bài tập">
                            <input required type="text" className={baseInputClass} value={editAssignmentData?.title || ''} onChange={event => onEditAssignmentChange({ ...editAssignmentData, title: event.target.value })} />
                          </FormField>
                          <FormField label="Mô tả bài tập">
                            <textarea className="w-full min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-y" value={editAssignmentData?.description || ''} onChange={event => onEditAssignmentChange({ ...editAssignmentData, description: event.target.value })} />
                          </FormField>
                          <FormField label="Liên kết bài học (Không bắt buộc)">
                            <select className={baseInputClass} value={editAssignmentData?.lessonId || ''} onChange={event => onEditAssignmentChange({ ...editAssignmentData, lessonId: event.target.value || null })}>
                              <option value="">Không liên kết (Kiểm tra tổng hợp lớp học)</option>
                              {sortedLessons.map(l => (
                                <option key={l._id} value={l._id}>{l.title}</option>
                              ))}
                            </select>
                          </FormField>
                          <div className="grid gap-6 md:grid-cols-2">
                            <FormField label="Loại bài tập">
                              <select className={baseInputClass} value={editAssignmentData?.type || 'quiz'} onChange={event => onEditAssignmentChange({ ...editAssignmentData, type: event.target.value })}>
                                <option value="quiz">Trắc nghiệm (Quiz)</option>
                                <option value="text">Tự luận / Thực hành lại</option>
                              </select>
                            </FormField>
                            <FormField label="Giới hạn thời gian (Phút)">
                              <input type="number" min="0" className={baseInputClass} value={editAssignmentData?.duration || 0} onChange={event => onEditAssignmentChange({ ...editAssignmentData, duration: Number(event.target.value) || 0 })} />
                            </FormField>
                          </div>
                          <FormField label="Ngày hết hạn (Hạn chót)">
                            <input type="datetime-local" className={baseInputClass} value={editAssignmentData?.dueAt || ''} onChange={event => onEditAssignmentChange({ ...editAssignmentData, dueAt: event.target.value })} />
                          </FormField>
                          
                          {editAssignmentData?.type === 'quiz' && (
                            <div className="flex flex-col gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                              <h5 className="font-bold text-slate-800">Các câu hỏi trắc nghiệm</h5>
                              {getEditQuizQuestions().map((question, questionIndex) => (
                                <div key={`edit-quiz-question-${questionIndex}`} className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-white p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <strong className="text-[14px] font-black text-slate-800">Câu {questionIndex + 1}</strong>
                                    {getEditQuizQuestions().length > 1 && (
                                      <button type="button" className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all cursor-pointer text-[12px]" onClick={() => removeEditQuizQuestion(questionIndex)}>
                                        Xóa câu
                                      </button>
                                    )}
                                  </div>
                                  <input required type="text" className={baseInputClass} placeholder="Nội dung câu hỏi" value={question.question} onChange={e => updateEditQuizQuestion(questionIndex, { ...question, question: e.target.value })} />
                                  <div className="grid gap-3 md:grid-cols-2">
                                    {question.options.map((option, optionIndex) => (
                                      <label key={`edit-quiz-option-${questionIndex}-${optionIndex}`} className="flex items-center gap-2">
                                        <input type="radio" name={`edit-quiz-correct-${questionIndex}`} checked={question.correctOptionIndex === optionIndex} onChange={() => updateEditQuizQuestion(questionIndex, { ...question, correctOptionIndex: optionIndex })} />
                                        <input required type="text" className={baseInputClass} placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)}`} value={option} onChange={e => { const options = [...question.options]; options[optionIndex] = e.target.value; updateEditQuizQuestion(questionIndex, { ...question, options }); }} />
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              <button type="button" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer text-[13px]" onClick={addEditQuizQuestion}>Thêm câu hỏi</button>
                            </div>
                          )}

                          <div className="flex items-center gap-3 justify-end mt-4 pt-6 border-t border-slate-100">
                            <button type="button" className={ghostButtonClass} onClick={onEditAssignmentCancel}>Hủy</button>
                            <button type="submit" className={baseButtonClass}><CheckCircle2 size={18} /> Cập nhật bài tập</button>
                          </div>
                        </form>
                      </CreatePanel>
                    ) : (
                      <CreatePanel
                        title="Thêm bài kiểm tra / bài tập mới"
                        eyebrow="Tạo bài tập"
                        description="Tạo một bài kiểm tra trắc nghiệm có thời gian hoặc bài tập tự luận."
                        isOpen={isCreateAssignmentOpen}
                        onToggle={() => setIsCreateAssignmentOpen(prev => !prev)}
                      >
                        <form className="flex flex-col gap-6" onSubmit={event => { event.preventDefault(); handleCreateAssignmentClick(); }}>
                          <FormField label="Tiêu đề bài kiểm tra / bài tập">
                            <input required type="text" className={baseInputClass} value={newAssignmentData?.title || ''} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, title: event.target.value })} />
                          </FormField>
                          <FormField label="Mô tả bài tập">
                            <textarea className="w-full min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-y" value={newAssignmentData?.description || ''} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, description: event.target.value })} />
                          </FormField>
                          <FormField label="Liên kết bài học (Không bắt buộc)">
                            <select className={baseInputClass} value={newAssignmentData?.lessonId || ''} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, lessonId: event.target.value || null })}>
                              <option value="">Không liên kết (Kiểm tra tổng hợp lớp học)</option>
                              {sortedLessons.map(l => (
                                <option key={l._id} value={l._id}>{l.title}</option>
                              ))}
                            </select>
                          </FormField>
                          <div className="grid gap-6 md:grid-cols-2">
                            <FormField label="Loại bài tập">
                              <select className={baseInputClass} value={newAssignmentData?.type || 'quiz'} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, type: event.target.value })}>
                                <option value="quiz">Trắc nghiệm (Quiz)</option>
                                <option value="text">Tự luận / Thực hành lại</option>
                              </select>
                            </FormField>
                            <FormField label="Giới hạn thời gian (Phút)">
                              <input type="number" min="0" className={baseInputClass} value={newAssignmentData?.duration || 0} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, duration: Number(event.target.value) || 0 })} />
                            </FormField>
                          </div>
                          <FormField label="Ngày hết hạn (Hạn chót)">
                            <input type="datetime-local" className={baseInputClass} value={newAssignmentData?.dueAt || ''} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, dueAt: event.target.value })} />
                          </FormField>

                          {newAssignmentData?.type === 'quiz' && (
                            <div className="flex flex-col gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                              <h5 className="font-bold text-slate-800">Các câu hỏi trắc nghiệm</h5>
                              {getNewQuizQuestions().map((question, questionIndex) => (
                                <div key={`new-quiz-question-${questionIndex}`} className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-white p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <strong className="text-[14px] font-black text-slate-800">Câu {questionIndex + 1}</strong>
                                    {getNewQuizQuestions().length > 1 && (
                                      <button type="button" className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all cursor-pointer text-[12px]" onClick={() => removeNewQuizQuestion(questionIndex)}>
                                        Xóa câu
                                      </button>
                                    )}
                                  </div>
                                  <input required type="text" className={baseInputClass} placeholder="Nội dung câu hỏi" value={question.question} onChange={e => updateNewQuizQuestion(questionIndex, { ...question, question: e.target.value })} />
                                  <div className="grid gap-3 md:grid-cols-2">
                                    {question.options.map((option, optionIndex) => (
                                      <label key={`new-quiz-option-${questionIndex}-${optionIndex}`} className="flex items-center gap-2">
                                        <input type="radio" name={`new-quiz-correct-${questionIndex}`} checked={question.correctOptionIndex === optionIndex} onChange={() => updateNewQuizQuestion(questionIndex, { ...question, correctOptionIndex: optionIndex })} />
                                        <input required type="text" className={baseInputClass} placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)}`} value={option} onChange={e => { const options = [...question.options]; options[optionIndex] = e.target.value; updateNewQuizQuestion(questionIndex, { ...question, options }); }} />
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              <button type="button" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer text-[13px]" onClick={addNewQuizQuestion}>Thêm câu hỏi</button>
                            </div>
                          )}

                          <div className="flex justify-end mt-4 pt-6 border-t border-slate-100">
                            <button type="submit" className={baseButtonClass}><PlusCircle size={18} /> Tạo bài tập</button>
                          </div>
                        </form>
                      </CreatePanel>
                    )}
                  </div>
                )}

                <div className="gsap-animate p-6 md:p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm">
                  <h3 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 pb-4 border-b border-slate-100 justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid place-items-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600"><ClipboardList size={18} /></span>
                      Bài tập & Kiểm tra kĩ năng
                    </div>
                    {canManageLearning && (
                      <button
                        className="inline-flex cursor-pointer items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] transition-all"
                        onClick={() => setIsCreateAssignmentOpen(true)}
                      >
                        <PlusCircle size={15} /> Thêm bài mới
                      </button>
                    )}
                  </h3>
                  <div className="flex flex-col gap-6">
                    {visibleAssignments.length ? (
                      visibleAssignments.map((assignment, index) => {
                        const isQuiz = assignment.type === 'quiz'
                        const associatedLesson = lessons.find(l => String(l._id) === String(assignment.lesson))
                        const isTestStarted = activeTestTimes[assignment._id] !== undefined
                        const hasSubmitted = Boolean(assignment.mySubmission)
                        const isTimed = assignment.duration > 0

                        return (
                          <div key={assignment._id || assignment.id || `${assignment.title || 'assignment'}-${index}`} className="flex flex-col gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <div>
                              <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                                <h4 className="text-xl font-black text-slate-900">{assignment.title}</h4>
                                {canManageLearning && (
                                  <div className="flex gap-2">
                                    <button className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[13px] font-bold transition-colors cursor-pointer" onClick={() => onEditAssignmentStart?.(assignment)}>Sửa</button>
                                    <button className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[13px] font-bold transition-colors cursor-pointer" onClick={() => onDeleteAssignment?.(assignment._id)}>Xóa</button>
                                  </div>
                                )}
                              </div>
                              {associatedLesson && (
                                <div className="text-[13px] font-bold text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-md self-start mb-3 inline-block">
                                  Bài kiểm tra kĩ năng bài: {associatedLesson.title}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-bold ${isTimed ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                                  ⏱️ {isTimed ? `Thời gian: ${assignment.duration} phút` : 'Không giới hạn thời gian'}
                                </span>
                                {(() => {
                                  const dueInfo = formatDueDate(assignment.dueAt)
                                  if (!dueInfo) return null
                                  return (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-bold ${dueInfo.isExpired ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600'}`}>
                                      📅 {dueInfo.isExpired ? `Đã hết hạn (${dueInfo.text})` : `Hạn chót: ${dueInfo.text}`}
                                    </span>
                                  )
                                })()}
                              </div>
                              <p className="text-[15px] text-slate-600 mb-4">{assignment.description || 'Không có mô tả.'}</p>

                              {(() => {
                                const dueInfo = formatDueDate(assignment.dueAt)
                                const isExpired = dueInfo?.isExpired

                                if (currentUser && !canManageLearning && isExpired && !hasSubmitted) {
                                  return (
                                    <div className="p-4 bg-red-50 border border-red-100 text-red-700 font-bold rounded-xl text-[14px]">
                                      🔴 Bài kiểm tra này đã quá hạn nộp bài. Bạn không thể thực hiện bài làm.
                                    </div>
                                  )
                                }

                                if (currentUser && !canManageLearning && isTimed && !isTestStarted && !hasSubmitted) {
                                  return (
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-3 mt-3">
                                      <ClipboardList size={32} className="text-amber-500" />
                                      <h5 className="font-bold text-slate-800 text-[16px]">Bài kiểm tra kĩ năng định hướng thời gian</h5>
                                      <p className="text-[14px] text-slate-500 max-w-md font-medium">
                                        Bài kiểm tra này có thời gian làm bài giới hạn trong <strong>{assignment.duration} phút</strong>. Đồng hồ sẽ đếm ngược ngay sau khi bạn bắt đầu và tự động nộp bài khi hết giờ.
                                      </p>
                                      <button
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md mt-2"
                                        onClick={() => startTest(assignment._id, assignment.duration)}
                                      >
                                        Bắt đầu làm bài
                                      </button>
                                    </div>
                                  )
                                }

                                return (
                                  <>
                                    {isTestStarted && (
                                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded-xl flex items-center justify-between text-[14px]">
                                        <span className="flex items-center gap-1.5">⚠️ Đang trong thời gian làm bài:</span>
                                        <span className="text-[16px] text-red-600 bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-sm font-black font-mono">
                                          {Math.floor(activeTestTimes[assignment._id] / 60)}:
                                          {String(activeTestTimes[assignment._id] % 60).padStart(2, '0')}
                                        </span>
                                      </div>
                                    )}
                                    {renderAssignmentBody(assignment)}
                                  </>
                                )
                              })()}
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

                            {currentUser && !canManageLearning && !isQuiz && (!isTimed || isTestStarted) && !assignment.mySubmission && (
                              <div className="mt-4 flex flex-col gap-4">
                                <textarea
                                  className="w-full min-h-[120px] p-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-y"
                                  value={assignmentDrafts?.[assignment._id] || ''}
                                  onChange={event => onAssignmentDraftChange?.(assignment._id, event.target.value)}
                                  placeholder="Nhập nội dung bài làm của bạn..."
                                />
                                <button
                                  className="inline-flex cursor-pointer self-start items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all"
                                  onClick={() => handleTextSubmit(assignment._id)}
                                >
                                  Gửi bài nộp
                                </button>
                              </div>
                            )}

                            {currentUser && !canManageLearning && isQuiz && !assignment.mySubmission && (!isTimed || isTestStarted) && (
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
                <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa chọn lớp học</h3>
                <p className="text-[15px] text-slate-500">Hãy chọn một lớp học ở danh sách bên trên để xem chi tiết.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default LmsView

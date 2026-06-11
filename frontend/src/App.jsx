import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { clearTokens, createApiClient, setTokens } from './api/apiClient'
import AppShell from './components/AppShell'
import { useAuth } from './context/AuthContext'
import { useUI } from './context/UIContext'
import ChatWidget from './components/ChatWidget'
import Navbar from './components/Navbar'
import PageFallback from './components/PageFallback'
import {
  categories,
  defaultCategoryVideos,
  defaultForumPosts,
  rankTiers
} from './data/skills'
import { getApiErrorMessage, getApiSuccessMessage } from './utils/apiMessages'
import { getRankInfo, groupVideosByCategory, normalizeText } from './utils/appUtils'
import './App.css'

const ForumView = lazy(() => import('./components/ForumView'))
const HomeView = lazy(() => import('./components/HomeView'))
const LessonFullPage = lazy(() => import('./components/LessonFullPage'))
const LmsView = lazy(() => import('./components/LmsView'))
const ManageView = lazy(() => import('./components/ManageView'))
const ProfilePage = lazy(() => import('./components/ProfilePage'))
const TeacherView = lazy(() => import('./components/TeacherView'))
const AuthPage = lazy(() => import('./pages/AuthPage'))

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://kns-1.onrender.com')

const api = createApiClient(API_BASE_URL)

const FORUM_PAGE_SIZE = 6

const normalizeClientRole = role => {
  if (!role) {
    return 'student'
  }
  return role === 'user' ? 'student' : role
}


const isCoursePath = pathname => pathname === '/courses' || pathname === '/lms' || pathname.startsWith('/courses/')

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth()
  const location = useLocation()

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function App() {
  const { showToast, showError, showSuccess, showWarning, showInfo } = useUI()
  const navigate = useNavigate()
  const location = useLocation()

  const { currentUser, currentRole, logout } = useAuth()

  const getInitialTab = () => {
    if (window.location.pathname === '/admin') {
      return 'manage'
    }
    if (window.location.pathname === '/teacher') {
      return 'teacher'
    }
    if (window.location.pathname === '/profile') {
      return 'profile'
    }
    if (isCoursePath(window.location.pathname)) {
      return 'lms'
    }
    return 'home'
  }
  const [activeTab, setActiveTab] = useState(getInitialTab)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [forumPage, setForumPage] = useState(1)


  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text:
        'Chào cậu! Mình là Z-Mate. Kỹ năng hiện có: Võ thuật, Giao tiếp, Quản lý thời gian, Tài chính, Tư duy. Cậu cứ hỏi, mình sẽ hiện nút để bấm trực tiếp.'
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

  const [forumPosts, setForumPosts] = useState([])
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Võ thuật' })
  const [commentsByPost, setCommentsByPost] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [forumScope, setForumScope] = useState('general')
  const [forumCourseId, setForumCourseId] = useState('')
  const [forumCourse, setForumCourse] = useState(null)

  const [managedUsers, setManagedUsers] = useState([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [categoryVideos, setCategoryVideos] = useState(defaultCategoryVideos)
  const [newVideoData, setNewVideoData] = useState({ category: categories[0], url: '' })
  const [moderationReports, setModerationReports] = useState([])
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [deletedPosts, setDeletedPosts] = useState([])
  const [isLoadingDeletedPosts, setIsLoadingDeletedPosts] = useState(false)
  const [deletedComments, setDeletedComments] = useState([])
  const [isLoadingDeletedComments, setIsLoadingDeletedComments] = useState(false)
  const [adminForumComments, setAdminForumComments] = useState([])
  const [isLoadingForumComments, setIsLoadingForumComments] = useState(false)
  const [adminAnalytics, setAdminAnalytics] = useState({
    totalLessonViews: 0,
    uniqueLessonViewers: 0,
    topLessons: [],
    totalLast30Days: 0,
    viewsLast30Days: []
  })
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [deletedReasonFilter, setDeletedReasonFilter] = useState('all')
  const [lmsCategory, setLmsCategory] = useState(categories[0])
  const [courses, setCourses] = useState([])
  const [customCategories, setCustomCategories] = useState(() => {
    const saved = localStorage.getItem('zmate_custom_categories')
    if (!saved) {
      return []
    }

    try {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return []
    }
  })
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseLessons, setCourseLessons] = useState([])
  const [courseAssignments, setCourseAssignments] = useState([])
  const [courseLeaderboard, setCourseLeaderboard] = useState([])
  const [assignmentDrafts, setAssignmentDrafts] = useState({})
  const [myEnrollments, setMyEnrollments] = useState([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [teacherCourses, setTeacherCourses] = useState([])
  const [teacherEnrollments, setTeacherEnrollments] = useState([])
  const [selectedTeacherCourseId, setSelectedTeacherCourseId] = useState('')
  const [newCourseData, setNewCourseData] = useState({
    title: '',
    category: categories[0],
    description: '',
    imageUrl: '',
    imageFile: null
  })
  const [newLessonData, setNewLessonData] = useState({
    title: '',
    content: '',
    videoUrl: '',
    videoFile: null,
    imageUrl: '',
    order: 1,
    imageFile: null
  })
  const [newAssignmentData, setNewAssignmentData] = useState({
    courseId: '',
    title: '',
    description: '',
    dueAt: '',
    type: 'quiz',
    questions: [
      { question: '', options: ['', '', '', ''], correctOptionIndex: 0 }
    ]
  })
  const [editAssignmentId, setEditAssignmentId] = useState(null)
  const [editAssignmentData, setEditAssignmentData] = useState({
    title: '',
    description: '',
    dueAt: '',
    type: 'quiz',
    questions: [
      { question: '', options: ['', '', '', ''], correctOptionIndex: 0 }
    ]
  })
  const [assignmentSubmissions, setAssignmentSubmissions] = useState({})
  const [editLessonId, setEditLessonId] = useState(null)
  const [editLessonData, setEditLessonData] = useState({
    title: '',
    content: '',
    videoUrl: '',
    videoFile: null,
    imageUrl: '',
    order: 1,
    imageFile: null
  })
  const [lessonRouteSlug, setLessonRouteSlug] = useState(null)
  const [lessonRouteLesson, setLessonRouteLesson] = useState(null)
  const [lessonRouteCourse, setLessonRouteCourse] = useState(null)
  const [lessonRouteLessons, setLessonRouteLessons] = useState([])
  const [lessonRouteLoading, setLessonRouteLoading] = useState(false)
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    displayName: '',
    role: 'student'
  })
  const [adminUploadUrl, setAdminUploadUrl] = useState('')
  const [isAdminUploadLoading, setIsAdminUploadLoading] = useState(false)
  const [profileMode, setProfileMode] = useState('view')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileUser, setProfileUser] = useState(null)
  const [myProfile, setMyProfile] = useState(null)
  const [myProfileLoading, setMyProfileLoading] = useState(false)
  const [profileDraft, setProfileDraft] = useState({
    displayName: '',
    stageName: '',
    avatarUrl: '',
    bio: '',
    teacher: {
      mainSubject: '',
      certificates: '',
      degree: '',
      personalRecords: '',
      teachingYears: '',
      teachingClubs: '',
      studentAchievements: '',
      philosophy: '',
      phone: '',
      email: '',
      fanpage: '',
      address: ''
    },
    student: {
      dob: '',
      className: '',
      strengths: '',
      goalsShort: '',
      goalsLong: '',
      teacherNote: ''
    }
  })

  const allCategories = useMemo(() => {
    const courseCategories = courses
      .map(course => String(course.category || '').trim())
      .filter(Boolean)

    return Array.from(new Set([...categories, ...customCategories, ...courseCategories]))
  }, [courses, customCategories])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/api/categories')
      const loadedCategories = Array.isArray(response.data?.categories)
        ? response.data.categories.map(category => String(category || '').trim()).filter(Boolean)
        : []
      const removableCategories = Array.isArray(response.data?.customCategories)
        ? response.data.customCategories.map(category => String(category || '').trim()).filter(Boolean)
        : loadedCategories.filter(category => !categories.includes(category))
      setCustomCategories(removableCategories)
    } catch {
      // Keep local fallback categories when the backend is unavailable.
    }
  }, [])

  const updatePathForTab = tab => {
    if (tab === 'manage') {
      navigate('/admin')
      return
    }

    if (tab === 'teacher') {
      navigate('/teacher')
      return
    }

    if (tab === 'profile') {
      navigate('/profile')
      return
    }

    if (['/admin', '/teacher', '/student'].includes(location.pathname)) {
      navigate('/')
      return
    }

    if (location.pathname === '/profile') {
      navigate('/')
    }
  }

  const resetLessonRoute = useCallback(() => {
    setLessonRouteSlug(null)
    setLessonRouteLesson(null)
    setLessonRouteCourse(null)
    setLessonRouteLessons([])
  }, [])

  const handleTabChange = tab => {
    // Always close lesson route when changing tabs, except when already on that tab
    if (lessonRouteSlug && activeTab !== tab) {
      resetLessonRoute()
      if (tab !== 'lms') {
        navigate('/')
      }
    }

    setActiveTab(tab)

    // Update path after setting tab
    if (tab === 'manage') {
      navigate('/admin')
    } else if (tab === 'teacher') {
      navigate('/teacher')
    } else if (tab === 'lms') {
      navigate('/courses')
    } else if (tab === 'forum') {
      setForumScope('general')
      setForumCourseId('')
      setForumCourse(null)
      setForumPage(1)
      navigate('/forum')
    } else {
      if (location.pathname !== '/') {
        navigate('/')
      }
    }
  }

  useEffect(() => {
    if (activeTab === 'lms' || !lessonRouteSlug) {
      return
    }
    resetLessonRoute()
    if (location.pathname.startsWith('/lesson/')) {
      navigate('/')
    }
  }, [activeTab, lessonRouteSlug, location.pathname, navigate, resetLessonRoute])



  useEffect(() => {
    localStorage.setItem('zmate_custom_categories', JSON.stringify(customCategories))
  }, [customCategories])

  useEffect(() => {
    if (!allCategories.length || allCategories.includes(lmsCategory)) {
      return
    }
    setLmsCategory(allCategories[0])
  }, [allCategories, lmsCategory])


  useEffect(() => {
    setForumPage(1)
  }, [searchTerm])


  const filteredForumPosts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) {
      return forumPosts
    }

    return forumPosts.filter(
      post =>
        post.title.toLowerCase().includes(keyword) ||
        post.content.toLowerCase().includes(keyword) ||
        post.category.toLowerCase().includes(keyword)
    )
  }, [forumPosts, searchTerm])

  const forumTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredForumPosts.length / FORUM_PAGE_SIZE))
  }, [filteredForumPosts.length])

  const paginatedForumPosts = useMemo(() => {
    const start = (forumPage - 1) * FORUM_PAGE_SIZE
    return filteredForumPosts.slice(start, start + FORUM_PAGE_SIZE)
  }, [filteredForumPosts, forumPage])

  useEffect(() => {
    if (forumPage > forumTotalPages) {
      setForumPage(forumTotalPages)
    }
  }, [forumPage, forumTotalPages])

  const fetchForumData = useCallback(async () => {
    if (forumScope === 'course' && !forumCourseId) {
      setForumPosts([])
      setCommentsByPost({})
      return
    }

    try {
      const params = {}
      if (forumScope) {
        params.scope = forumScope
      }
      if (forumScope === 'course' && forumCourseId) {
        params.courseId = forumCourseId
      }

      const [postsResponse, commentsResponse] = await Promise.all([
        api.get('/api/forum/posts', { params }),
        api.get('/api/forum/comments', { params })
      ])

      const normalizedPosts = (postsResponse.data.posts || []).map(post => ({
        id: post._id,
        author: post.author,
        category: post.category,
        title: post.title,
        content: post.content,
        scope: post.scope || 'general',
        courseId: post.course || null,
        heartCount: post.heartCount || 0,
        isHearted: Boolean(post.isHearted),
        authorDisplayName: post.authorDisplayName
      }))

      const groupedComments = (commentsResponse.data.comments || []).reduce((acc, comment) => {
        const postId = String(comment.postId)
        if (!acc[postId]) {
          acc[postId] = []
        }
        acc[postId].push({
          id: comment._id,
          author: comment.author,
          authorDisplayName: comment.authorDisplayName,
          text: comment.text
        })
        return acc
      }, {})

      setForumPosts(normalizedPosts)
      setCommentsByPost(groupedComments)
    } catch {
      setForumPosts(forumScope === 'general' ? defaultForumPosts : [])
      setCommentsByPost({})
    }
  }, [forumCourseId, forumScope])

  const getChatActionSuggestions = userText => {
    const normalizedInput = normalizeText(userText)
    const suggestions = []
    const skillKeywordMap = {
      'Võ thuật': ['vo thuat', 'vo', 'martial'],
      'Giao tiếp': ['giao tiep', 'giao tiep ung xu', 'communication'],
      'Quản lý thời gian': ['quan ly thoi gian', 'thoi gian', 'time management', 'pomodoro'],
      'Tài chính': ['tai chinh', 'tien bac', 'chi tieu', 'money', 'finance'],
      'Tư duy': ['tu duy', 'phan bien', 'critical thinking', 'mindset']
    }

    const addSuggestion = action => {
      if (!suggestions.find(item => item.id === action.id)) {
        suggestions.push(action)
      }
    }

    if (
      normalizedInput.includes('dang nhap') ||
      normalizedInput.includes('login') ||
      normalizedInput.includes('tai khoan')
    ) {
      addSuggestion({ id: 'login', label: 'Đăng nhập' })
      addSuggestion({ id: 'register', label: 'Đăng ký' })
    }

    if (
      normalizedInput.includes('dien dan') ||
      normalizedInput.includes('forum') ||
      normalizedInput.includes('thao luan') ||
      normalizedInput.includes('dang bai') ||
      normalizedInput.includes('binh luan')
    ) {
      addSuggestion({ id: 'go-forum', label: 'Mở Diễn đàn' })
    }

    if (
      normalizedInput.includes('trang chu') ||
      normalizedInput.includes('tong quan') ||
      normalizedInput.includes('xep hang') ||
      normalizedInput.includes('rank')
    ) {
      addSuggestion({ id: 'go-home', label: 'Về Trang chủ' })
      addSuggestion({ id: 'go-overview', label: 'Mở Tổng quan' })
    }

    if (
      normalizedInput.includes('video') ||
      normalizedInput.includes('bai giang') ||
      normalizedInput.includes('hoc') ||
      normalizedInput.includes('ky nang') ||
      normalizedInput.includes('co nhung ky nang nao') ||
      normalizedInput.includes('co gi de hoc')
    ) {
      addSuggestion({ id: 'go-lms', label: 'Xem lớp học' })
      allCategories.forEach(category => {
        addSuggestion({ id: `open-category:${category}`, label: `Học ${category}` })
      })
    }

    if (
      normalizedInput.includes('lop') ||
      normalizedInput.includes('khoa hoc') ||
      normalizedInput.includes('giang vien')
    ) {
      addSuggestion({ id: 'go-lms', label: 'Mở lớp học' })
    }

    Object.entries(skillKeywordMap).forEach(([category, keywords]) => {
      if (keywords.some(keyword => normalizedInput.includes(keyword))) {
        addSuggestion({ id: `open-category:${category}`, label: `Mở ${category}` })
      }
    })

    if (!suggestions.length) {
      addSuggestion({ id: 'go-home', label: 'Trang chủ' })
      addSuggestion({ id: 'go-forum', label: 'Diễn đàn' })
      addSuggestion({ id: 'login', label: 'Đăng nhập' })
      allCategories.forEach(category => {
        addSuggestion({ id: `open-category:${category}`, label: `Học ${category}` })
      })
    }

    return suggestions.slice(0, 10)
  }

  const handleChatAction = actionId => {
    if (actionId === 'go-home') {
      handleTabChange('home')
      return
    }

    if (actionId === 'go-overview') {
      handleTabChange('home')
      return
    }

    if (actionId === 'go-forum') {
      handleTabChange('forum')
      return
    }

    if (actionId === 'go-lms') {
      handleTabChange('lms')
      handleSelectLmsCategory(allCategories[0] || categories[0])
      return
    }

    if (actionId === 'login') {
      navigate('/login')
      return
    }

    if (actionId === 'register') {
      navigate('/register')
      return
    }

    if (actionId.startsWith('open-category:')) {
      const category = actionId.split(':')[1]
      if (category && allCategories.includes(category)) {
        handleTabChange('lms')
        handleSelectLmsCategory(category)
      }
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const userText = input.trim()
    const newMessages = [...messages, { sender: 'user', text: userText }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    const actionSuggestions = getChatActionSuggestions(userText)

    try {
      const response = await api.post('/api/chat', { message: userText })
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: `${response.data.reply}\n\nCậu có thể bấm nhanh các chức năng bên dưới:`,
          actions: actionSuggestions
        }
      ])
    } catch {
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: 'Z-Mate buồn ngủ rồi, kết nối bị lỗi nha! Mình vẫn để sẵn nút chức năng để cậu thao tác nhanh nè:',
          actions: actionSuggestions
        }
      ])
    }
    setIsLoading(false)
  }

  const ensureAuthenticated = (actionLabel = 'thực hiện thao tác này') => {
    if (currentUser) {
      return true
    }

    showWarning(`Cậu cần đăng nhập để ${actionLabel}.`)
    navigate('/login')
    return false
  }

  const openGeneralForum = () => {
    setForumScope('general')
    setForumCourseId('')
    setForumCourse(null)
    setForumPage(1)
    navigate('/forum')
  }

  const handleOpenCourseForum = course => {
    if (!course?._id) {
      return
    }
    setForumScope('course')
    setForumCourseId(course._id)
    setForumCourse(course)
    setForumPage(1)
    navigate('/forum')
  }


  const handlePostSubmit = async (options = {}) => {
    if (!ensureAuthenticated('đăng bài')) {
      return
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      showWarning('Cậu điền đủ tiêu đề và nội dung nhé!')
      return
    }

    const postScope = options.scope || forumScope
    const postCourseId = options.courseId || forumCourseId

    if (postScope === 'course' && !postCourseId) {
      showWarning('Cậu chọn lớp trước khi đăng bài nhé!')
      return
    }

    const postCategory =
      options.category ||
      (postScope === 'course' ? forumCourse?.title || 'Lớp học' : newPost.category)

    try {
      const response = await api.post('/api/forum/posts', {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        category: postCategory,
        scope: postScope,
        courseId: postScope === 'course' ? postCourseId : null
      })

      const createdPost = response.data.post
      setForumPosts(prevPosts => [
        {
          id: createdPost._id,
          author: createdPost.author,
          title: createdPost.title,
          content: createdPost.content,
          category: createdPost.category,
          scope: createdPost.scope || postScope,
          courseId: createdPost.course || postCourseId || null,
          heartCount: createdPost.heartCount || 0,
          isHearted: Boolean(createdPost.isHearted),
          authorDisplayName: createdPost.authorDisplayName || myProfile?.profile?.displayName || newPost.author
        },
        ...prevPosts
      ])
      setNewPost({ title: '', content: '', category: allCategories[0] || categories[0] })
    } catch (error) {
      showError(error.response?.data?.message || 'Không đăng được bài viết.')
    }
  }

  const handleTogglePostReaction = async post => {
    if (!ensureAuthenticated('thả tim')) {
      return
    }

    try {
      const response = await api.patch(`/api/forum/posts/${post.id}/reaction`)
      const nextHeartCount = response.data?.heartCount ?? post.heartCount
      const nextIsHearted = Boolean(response.data?.isHearted)
      setForumPosts(prev =>
        prev.map(item =>
          String(item.id) === String(post.id)
            ? { ...item, heartCount: nextHeartCount, isHearted: nextIsHearted }
            : item
        )
      )
    } catch (error) {
      showError(error.response?.data?.message || 'Không thả tim được.')
    }
  }

  const handleAddComment = async postId => {
    if (!ensureAuthenticated('bình luận')) {
      return
    }

    const draft = (commentDrafts[postId] || '').trim()
    if (!draft) {
      showWarning('Cậu nhập nội dung bình luận trước nhé!')
      return
    }

    try {
      const response = await api.post('/api/forum/comments', {
        postId,
        text: draft
      })

      const createdComment = response.data.comment

      setCommentsByPost(prev => ({
        ...prev,
        [postId]: [
          ...(prev[postId] || []),
          {
            id: createdComment._id,
            author: createdComment.author,
            text: createdComment.text
          }
        ]
      }))

      setCommentDrafts(prev => ({
        ...prev,
        [postId]: ''
      }))
    } catch (error) {
      showError(error.response?.data?.message || 'Không gửi được bình luận.')
    }
  }


  const fetchManagedUsers = useCallback(async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    setIsLoadingUsers(true)
    try {
      const response = await api.get('/api/users')
      setManagedUsers(response.data.users || [])
    } catch (error) {
      showError(error.response?.data?.message || 'Không tải được danh sách user.')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [currentRole, currentUser])

  const fetchVideos = useCallback(async () => {
    try {
      const response = await api.get('/api/videos')
      setCategoryVideos(groupVideosByCategory(response.data.videos || []))
    } catch {
      setCategoryVideos(defaultCategoryVideos)
    }
  }, [])

  const fetchModerationReports = useCallback(async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    setIsLoadingReports(true)
    try {
      const response = await api.get('/api/moderation/reports')
      setModerationReports(response.data.reports || [])
    } catch (error) {
      showError(error.response?.data?.message || 'Không tải được lịch sử kiểm duyệt.')
    } finally {
      setIsLoadingReports(false)
    }
  }, [currentRole, currentUser])

  const fetchDeletedPosts = useCallback(async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    setIsLoadingDeletedPosts(true)
    try {
      const response = await api.get('/api/forum/deleted/posts', {
        params: {
          reason: deletedReasonFilter
        }
      })
      setDeletedPosts(response.data.posts || [])
    } catch (error) {
      showError(error.response?.data?.message || 'Không tải được danh sách bài đã ẩn.')
    } finally {
      setIsLoadingDeletedPosts(false)
    }
  }, [currentRole, currentUser, deletedReasonFilter])

  const fetchDeletedComments = useCallback(async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    setIsLoadingDeletedComments(true)
    try {
      const response = await api.get('/api/forum/deleted/comments', {
        params: {
          reason: deletedReasonFilter
        }
      })
      setDeletedComments(response.data.comments || [])
    } catch (error) {
      showError(error.response?.data?.message || 'Không tải được danh sách bình luận đã ẩn.')
    } finally {
      setIsLoadingDeletedComments(false)
    }
  }, [currentRole, currentUser, deletedReasonFilter])

  const fetchAdminForumComments = useCallback(async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    setIsLoadingForumComments(true)
    try {
      const response = await api.get('/api/forum/admin/comments')
      setAdminForumComments(response.data.comments || [])
    } catch (error) {
      showError(error.response?.data?.message || 'Không tải được bình luận diễn đàn.')
    } finally {
      setIsLoadingForumComments(false)
    }
  }, [currentRole, currentUser])

  const fetchAdminAnalytics = useCallback(async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    setIsLoadingAnalytics(true)
    try {
      const response = await api.get('/api/analytics/lessons/overview')
      setAdminAnalytics(response.data || {})
    } catch (error) {
      showError(error.response?.data?.message || 'Không tải được thống kê bài học.')
      setAdminAnalytics({
        totalLessonViews: 0,
        uniqueLessonViewers: 0,
        topLessons: [],
        totalLast30Days: 0,
        viewsLast30Days: []
      })
    } finally {
      setIsLoadingAnalytics(false)
    }
  }, [currentRole, currentUser])

  const handleRoleChange = async (username, role) => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    try {
      const response = await api.patch('/api/users/role', { username, role })
      showSuccess(getApiSuccessMessage(response))
      fetchManagedUsers()
    } catch (error) {
      showError(error.response?.data?.message || 'Không cập nhật được vai trò user.')
    }
  }

  const handleStatusChange = async (username, status) => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    try {
      const response = await api.patch('/api/users/status', { username, status })
      showSuccess(getApiSuccessMessage(response))
      fetchManagedUsers()
    } catch (error) {
      showError(error.response?.data?.message || 'Không cập nhật được trạng thái tài khoản.')
    }
  }

  const handleDeleteUser = async username => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    if (!window.confirm(`Cậu có chắc muốn xóa tài khoản ${username}?`)) {
      return
    }

    try {
      const response = await api.delete(`/api/users/${encodeURIComponent(username)}`)
      showSuccess(getApiSuccessMessage(response))
      fetchManagedUsers()
    } catch (error) {
      showError(error.response?.data?.message || 'Không xóa được tài khoản.')
    }
  }

  const handleUpdateUserDetails = async (username, displayName, password) => {
    if (!currentUser || currentRole !== 'admin') return

    try {
      const response = await api.patch(`/api/users/${encodeURIComponent(username)}`, { displayName, password })
      showSuccess(getApiSuccessMessage(response))
      fetchManagedUsers()
    } catch (error) {
      showError(error.response?.data?.message || 'Không cập nhật được thông tin tài khoản.')
    }
  }

  const handleAddVideo = async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    if (!newVideoData.url.trim()) {
      showWarning('Cậu nhập link YouTube trước nhé.')
      return
    }

    try {
      const response = await api.post('/api/videos', {
        category: newVideoData.category,
        url: newVideoData.url.trim()
      })
      showSuccess(getApiSuccessMessage(response))
      setNewVideoData({ category: newVideoData.category, url: '' })
      fetchVideos()
    } catch (error) {
      showError(error.response?.data?.message || 'Không thêm được video.')
    }
  }

  const handleDeleteVideo = async videoId => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    if (!window.confirm('Cậu có chắc muốn xóa video này?')) {
      return
    }

    try {
      const response = await api.delete(`/api/videos/${videoId}`)
      showSuccess(getApiSuccessMessage(response))
      fetchVideos()
    } catch (error) {
      showError(error.response?.data?.message || 'Không xóa được video.')
    }
  }

  const handleCreateUser = async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    if (!newUserData.username.trim() || !newUserData.password.trim() || !newUserData.displayName.trim()) {
      showWarning('Cậu nhập đủ username, tên hiển thị và mật khẩu nhé.')
      return
    }

    try {
      const response = await api.post('/api/users', {
        username: newUserData.username.trim(),
        password: newUserData.password.trim(),
        displayName: newUserData.displayName.trim(),
        role: newUserData.role
      })
      showSuccess(getApiSuccessMessage(response))
      setNewUserData({ username: '', password: '', displayName: '', role: newUserData.role || 'student' })
      fetchManagedUsers()
    } catch (error) {
      showError(error.response?.data?.message || 'Không tạo được tài khoản.')
    }
  }

  const fetchCourses = useCallback(async () => {
    try {
      const response = await api.get('/api/courses')
      setCourses(response.data.courses || [])
    } catch {
      setCourses([])
    }
  }, [])

  const fetchCourseLessons = useCallback(async courseId => {
    if (!courseId) {
      setCourseLessons([])
      return
    }

    try {
      const response = await api.get(`/api/courses/${courseId}/lessons`)
      setCourseLessons(response.data.lessons || [])
    } catch {
      setCourseLessons([])
    }
  }, [])

  const fetchCourseLeaderboard = useCallback(
    async courseId => {
      if (!courseId) {
        setCourseLeaderboard([])
        return
      }

      try {
        const response = await api.get(`/api/courses/${courseId}/leaderboard`)
        setCourseLeaderboard(response.data.leaderboard || [])
      } catch {
        setCourseLeaderboard([])
      }
    },
    []
  )

  const fetchCourseAssignments = useCallback(
    async courseId => {
      if (!courseId || !currentUser) {
        setCourseAssignments([])
        return
      }

      try {
        const response = await api.get(`/api/courses/${courseId}/assignments`)
        setCourseAssignments(response.data.assignments || [])
      } catch {
        setCourseAssignments([])
      }
    },
    [currentUser]
  )

  const fetchMyEnrollments = useCallback(async () => {
    if (!currentUser || (currentRole !== 'student' && currentRole !== 'user')) {
      setMyEnrollments([])
      return
    }

    try {
      const response = await api.get('/api/enrollments/me')
      setMyEnrollments(response.data.enrollments || [])
    } catch {
      setMyEnrollments([])
    }
  }, [currentRole, currentUser])

  const fetchTeacherCourses = useCallback(async () => {
    if (!currentUser || currentRole !== 'teacher') {
      setTeacherCourses([])
      return
    }

    try {
      const response = await api.get('/api/courses/mine')
      setTeacherCourses(response.data.courses || [])
    } catch {
      setTeacherCourses([])
    }
  }, [currentRole, currentUser])

  const fetchTeacherEnrollments = useCallback(
    async courseId => {
      if (!courseId) {
        setTeacherEnrollments([])
        return
      }

      try {
        const response = await api.get(`/api/courses/${courseId}/enrollments`)
        setTeacherEnrollments(response.data.enrollments || [])
      } catch (error) {
        setTeacherEnrollments([])
        showError(error.response?.data?.message || 'Không tải được danh sách học viên.')
      }
    },
    []
  )

  const loadLearningSurfaceData = useCallback(async () => {
    await Promise.all([
      fetchCourses(),
      fetchMyEnrollments(),
      currentRole === 'teacher'
        ? fetchTeacherCourses()
        : Promise.resolve()
    ])
  }, [currentRole, fetchCourses, fetchMyEnrollments, fetchTeacherCourses])

  const loadSelectedCourseContent = useCallback(async courseId => {
    if (!courseId) {
      setCourseLessons([])
      setCourseAssignments([])
      return
    }

    await Promise.all([
      fetchCourseLessons(courseId),
      fetchCourseAssignments(courseId),
      fetchCourseLeaderboard(courseId)
    ])
  }, [fetchCourseAssignments, fetchCourseLessons, fetchCourseLeaderboard])

  const loadAdminDashboard = useCallback(async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    await Promise.all([
      fetchManagedUsers(),
      fetchModerationReports(),
      fetchDeletedPosts(),
      fetchDeletedComments(),
      fetchAdminForumComments(),
      fetchAdminAnalytics()
    ])
  }, [
    currentRole,
    currentUser,
    fetchManagedUsers,
    fetchModerationReports,
    fetchDeletedPosts,
    fetchDeletedComments,
    fetchAdminForumComments,
    fetchAdminAnalytics
  ])

  const handleSelectCourse = course => {
    setSelectedCourse(course)
    loadSelectedCourseContent(course?._id)
  }

  const handleSelectLmsCourse = course => {
    handleSelectCourse(course)
    if (course?._id) {
      navigate(`/courses/${course._id}`)
    }
  }

  const handleSelectLmsCategory = category => {
    setLmsCategory(category)
    if (selectedCourse && category && selectedCourse.category !== category) {
      setSelectedCourse(null)
      setCourseLessons([])
      setCourseAssignments([])
      if (isCoursePath(location.pathname)) {
        navigate('/courses')
      }
    }
  }

  const handleAddCategory = async categoryName => {
    if (currentRole !== 'admin') {
      return
    }

    const normalized = String(categoryName || '').trim()
    if (!normalized) {
      showWarning('Nhập tên danh mục trước nhé.')
      return
    }

    if (allCategories.some(category => category.toLowerCase() === normalized.toLowerCase())) {
      showError('Danh mục này đã tồn tại.')
      return
    }

    try {
      await api.post('/api/categories', { name: normalized })
      setCustomCategories(prev => [...prev, normalized])
      setLmsCategory(normalized)
      setNewCourseData(prev => ({ ...prev, category: normalized }))
      setNewVideoData(prev => ({ ...prev, category: normalized }))
    } catch (error) {
      showError(error.response?.data?.message || 'Khong them duoc danh muc.')
    }
  }

  const handleRemoveCategory = async categoryName => {
    if (currentRole !== 'admin') {
      return
    }

    const category = String(categoryName || '').trim()
    if (!category || !customCategories.includes(category)) {
      return
    }

    try {
      await api.delete(`/api/categories/${encodeURIComponent(category)}`)
      setCustomCategories(prev => prev.filter(item => item !== category))
      if (lmsCategory === category) {
        setLmsCategory(categories[0])
      }
      setNewCourseData(prev => ({
        ...prev,
        category: prev.category === category ? categories[0] : prev.category
      }))
      setNewVideoData(prev => ({
        ...prev,
        category: prev.category === category ? categories[0] : prev.category
      }))
      fetchCategories()
    } catch (error) {
      showError(error.response?.data?.message || 'Khong xoa duoc danh muc.')
    }
  }

  const handleSelectTeacherCourse = courseId => {
    setSelectedTeacherCourseId(courseId)
    loadSelectedCourseContent(courseId)
  }

  const handleAssignmentDraftChange = (assignmentId, value) => {
    setAssignmentDrafts(prev => ({ ...prev, [assignmentId]: value }))
  }

  const handleSubmitAssignment = async assignmentId => {
    if (!ensureAuthenticated('nộp bài')) {
      return
    }

    const content = (assignmentDrafts[assignmentId] || '').trim()
    if (!content) {
      showWarning('Cậu nhập nội dung bài nộp trước nhé!')
      return
    }

    try {
      const response = await api.post(`/api/assignments/${assignmentId}/submissions`, { content })
      const submission = response.data?.submission

      setCourseAssignments(prev =>
        prev.map(item =>
          String(item._id) === String(assignmentId)
            ? { ...item, mySubmission: submission }
            : item
        )
      )
      setAssignmentDrafts(prev => ({ ...prev, [assignmentId]: '' }))
    } catch (error) {
      showError(error.response?.data?.message || 'Không nộp được bài.')
    }
  }

  const handleSubmitQuizAssignment = async (assignmentId, answers) => {
    if (!ensureAuthenticated('nộp trắc nghiệm')) {
      return false
    }

    try {
      const response = await api.post(`/api/assignments/${assignmentId}/submissions`, { answers })
      const submission = response.data?.submission
      const pointsEarned = response.data?.pointsEarned || 0

      setCourseAssignments(prev =>
        prev.map(item =>
          String(item._id) === String(assignmentId)
            ? { ...item, mySubmission: submission }
            : item
        )
      )
      
      if (pointsEarned > 0) {
        showSuccess(`Tuyệt vời! Cậu đạt 100% và nhận được ${pointsEarned} điểm.`)
        if (currentUser) {
          fetchMyProfile()
        }
      }
      return true
    } catch (error) {
      showError(error.response?.data?.message || 'Không nộp được trắc nghiệm.')
      return false
    }
  }

  const handleCreateAssignment = async () => {
    if (!currentUser || (currentRole !== 'teacher' && currentRole !== 'admin')) {
      return
    }

    if (!newAssignmentData.courseId || !newAssignmentData.title.trim()) {
      showWarning('Cậu chọn lớp và nhập tiêu đề bài tập nhé.')
      return
    }

    try {
      const response = await api.post(`/api/courses/${newAssignmentData.courseId}/assignments`, {
        title: newAssignmentData.title.trim(),
        description: newAssignmentData.description,
        dueAt: newAssignmentData.dueAt || null,
        type: newAssignmentData.type || 'quiz',
        questions: newAssignmentData.questions || []
      })

      const created = response.data?.assignment
      if (String(newAssignmentData.courseId) === String(selectedTeacherCourseId)) {
        setCourseAssignments(prev => [created, ...prev])
      }

      setNewAssignmentData({
        courseId: newAssignmentData.courseId,
        title: '',
        description: '',
        dueAt: '',
        type: 'quiz',
        questions: [
          { question: '', options: ['', '', '', ''], correctOptionIndex: 0 }
        ]
      })
    } catch (error) {
      showError(error.response?.data?.message || 'Không tạo được bài tập.')
    }
  }

  const handleEditAssignmentStart = assignment => {
    setEditAssignmentId(assignment._id)
    setEditAssignmentData({
      title: assignment.title || '',
      description: assignment.description || '',
      dueAt: assignment.dueAt ? new Date(assignment.dueAt).toISOString().slice(0, 16) : '',
      type: assignment.type || 'quiz',
      questions: Array.isArray(assignment.questions) && assignment.questions.length
        ? assignment.questions.map(item => ({
            question: item.question || '',
            options: [...(item.options || []), '', '', '', ''].slice(0, 4),
            correctOptionIndex: item.correctOptionIndex || 0
          }))
        : [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
    })
  }

  const handleEditAssignmentCancel = () => {
    setEditAssignmentId(null)
    setEditAssignmentData({
      title: '',
      description: '',
      dueAt: '',
      type: 'quiz',
      questions: [{ question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
    })
  }

  const handleUpdateAssignment = async assignmentId => {
    if (!assignmentId) {
      return
    }

    try {
      const response = await api.patch(`/api/assignments/${assignmentId}`, {
        title: editAssignmentData.title,
        description: editAssignmentData.description,
        dueAt: editAssignmentData.dueAt || null,
        type: editAssignmentData.type || 'quiz',
        questions: editAssignmentData.questions || []
      })

      const updated = response.data?.assignment
      setCourseAssignments(prev =>
        prev.map(item => (String(item._id) === String(assignmentId) ? updated : item))
      )
      handleEditAssignmentCancel()
    } catch (error) {
      showError(error.response?.data?.message || 'Không cập nhật được bài tập.')
    }
  }

  const handleDeleteAssignment = async assignmentId => {
    if (!assignmentId) {
      return
    }

    if (!window.confirm('Xóa bài tập này?')) {
      return
    }

    try {
      await api.delete(`/api/assignments/${assignmentId}`)
      setCourseAssignments(prev => prev.filter(item => String(item._id) !== String(assignmentId)))
      setAssignmentSubmissions(prev => {
        const next = { ...prev }
        delete next[String(assignmentId)]
        return next
      })
    } catch (error) {
      showError(error.response?.data?.message || 'Không xóa được bài tập.')
    }
  }

  const handleLoadAssignmentSubmissions = async assignmentId => {
    if (!assignmentId) {
      return
    }

    try {
      const response = await api.get(`/api/assignments/${assignmentId}/submissions`)
      setAssignmentSubmissions(prev => ({
        ...prev,
        [assignmentId]: response.data?.submissions || []
      }))
    } catch (error) {
      showError(error.response?.data?.message || 'Không tải được bài nộp.')
    }
  }

  const handleGradeSubmission = async (submissionId, payload) => {
    if (!submissionId) {
      return
    }

    try {
      const response = await api.patch(`/api/submissions/${submissionId}/grade`, payload)
      const updated = response.data?.submission

      setAssignmentSubmissions(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(assignmentId => {
          next[assignmentId] = (next[assignmentId] || []).map(item =>
            String(item._id) === String(submissionId) ? updated : item
          )
        })
        return next
      })
    } catch (error) {
      showError(error.response?.data?.message || 'Không chấm được bài.')
    }
  }

  const fetchLessonRoute = useCallback(
    async slug => {
      if (!slug) {
        return
      }

      setLessonRouteLoading(true)
      try {
        const response = await api.get(`/api/lessons/slug/${encodeURIComponent(slug)}`)
        const lesson = response.data?.lesson || null
        const course = response.data?.course || null

        if (!lesson) {
          showError('Không tìm thấy bài học này.')
          setLessonRouteSlug(null)
          setLessonRouteLesson(null)
          setLessonRouteCourse(null)
          return
        }

        setLessonRouteLesson(lesson)
        setLessonRouteCourse(course)
        if (course?._id) {
          setSelectedCourse(course)
          await fetchCourseLessons(course._id)
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Không tải được bài học.'
        showError(message)
        setLessonRouteLesson(null)
        setLessonRouteCourse(null)
        navigate('/courses')
      } finally {
        setLessonRouteLoading(false)
      }
    },
    [fetchCourseLessons]
  )

  useEffect(() => {
    const pathname = location.pathname
    if (pathname.startsWith('/lesson/')) {
      const slug = decodeURIComponent(pathname.replace('/lesson/', ''))
      setActiveTab('lms')
      if (lessonRouteSlug !== slug) {
        setLessonRouteSlug(slug)
        fetchLessonRoute(slug)
      }
      return
    }

    if (lessonRouteSlug) {
      resetLessonRoute()
    }


    if (isCoursePath(pathname)) {
      setActiveTab('lms')
      return
    }

    if (pathname === '/forum') {
      setActiveTab('forum')
      return
    }

    if (pathname === '/admin') {
      setActiveTab('manage')
      return
    }

    if (pathname === '/teacher') {
      setActiveTab('teacher')
      return
    }

    if (pathname === '/profile') {
      setActiveTab('profile')
      return
    }

    if (pathname.startsWith('/profile/')) {
      setActiveTab('profile')
      return
    }

    setActiveTab('home')
  }, [fetchLessonRoute, lessonRouteSlug, location.pathname, resetLessonRoute])

  const openLessonRoute = lesson => {
    if (!lesson) {
      return
    }
    const slug = lesson.slug || lesson._id
    const fallbackCoursePath = selectedCourse?._id ? `/courses/${selectedCourse._id}` : '/courses'
    const from = location.pathname.startsWith('/lesson/')
      ? location.state?.from || fallbackCoursePath
      : location.pathname || fallbackCoursePath
    navigate(`/lesson/${encodeURIComponent(slug)}`, { state: { from } })
  }

  const closeLessonRoute = () => {
    const fallbackCoursePath = lessonRouteCourse?._id ? `/courses/${lessonRouteCourse._id}` : '/courses'
    const from = location.state?.from || fallbackCoursePath
    resetLessonRoute()
    navigate(from)
    setActiveTab('lms')
  }

  const applyProfileToDraft = user => {
    const profile = user?.profile || {}
    setProfileDraft({
      displayName: profile.displayName || '',
      stageName: profile.stageName || '',
      avatarUrl: profile.avatarUrl || '',
      bio: profile.bio || '',
      teacher: {
        mainSubject: profile.teacher?.mainSubject || '',
        certificates: profile.teacher?.certificates || '',
        degree: profile.teacher?.degree || '',
        personalRecords: profile.teacher?.personalRecords || '',
        teachingYears: profile.teacher?.teachingYears || '',
        teachingClubs: profile.teacher?.teachingClubs || '',
        studentAchievements: profile.teacher?.studentAchievements || '',
        philosophy: profile.teacher?.philosophy || '',
        phone: profile.teacher?.phone || '',
        email: profile.teacher?.email || '',
        fanpage: profile.teacher?.fanpage || '',
        address: profile.teacher?.address || ''
      },
      student: {
        dob: profile.student?.dob || '',
        className: profile.student?.className || '',
        strengths: profile.student?.strengths || '',
        goalsShort: profile.student?.goalsShort || '',
        goalsLong: profile.student?.goalsLong || '',
        teacherNote: profile.student?.teacherNote || ''
      }
    })
  }

  const fetchProfileById = useCallback(async userId => {
    if (!userId) {
      return
    }

    setProfileLoading(true)
    try {
      const response = await api.get(`/api/users/${userId}/profile`)
      setProfileUser(response.data?.user || null)
    } catch (error) {
      showError(error.response?.data?.message || 'Không tải được hồ sơ.')
      setProfileUser(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!location.pathname.startsWith('/profile/')) {
      return
    }

    const userId = decodeURIComponent(location.pathname.replace('/profile/', ''))
    setProfileMode('view')
    fetchProfileById(userId)
  }, [fetchProfileById, location.pathname])

  const fetchMyProfile = useCallback(async () => {
    setMyProfileLoading(true)
    try {
      const response = await api.get('/api/users/me/profile')
      const user = response.data?.user || null
      setMyProfile(user)
      applyProfileToDraft(user)
    } catch (error) {
      showError(error.response?.data?.message || 'Không tải được hồ sơ cá nhân.')
      setMyProfile(null)
    } finally {
      setMyProfileLoading(false)
    }
  }, [])

  const handleOpenProfile = userId => {
    if (!userId) {
      return
    }
    setProfileMode('view')
    setProfileUser(null)
    navigate(`/profile/${encodeURIComponent(userId)}`)
    setActiveTab('profile')
  }

  const handleOpenMyProfile = () => {
    if (!currentUser) {
      showWarning('Bạn phải đăng nhập để xem hồ sơ.')
      navigate('/login')
      return
    }
    setProfileMode('view')
    setActiveTab('profile')
    updatePathForTab('profile')
    fetchMyProfile()
  }

  const handleProfileAvatarChange = event => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const avatarUrl = String(reader.result || '')
      setProfileDraft(current => ({
        ...current,
        avatarUrl
      }))
      setMyProfile(current => {
        if (!current) {
          return current
        }

        return {
          ...current,
          profile: {
            ...(current.profile || {}),
            avatarUrl
          }
        }
      })
      setProfileMode('edit')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleSaveProfile = async () => {
    if (!ensureAuthenticated('cập nhật hồ sơ')) {
      return
    }

    try {
      const response = await api.patch('/api/users/me/profile', profileDraft)
      const user = response.data?.user || null
      setMyProfile(user)
      applyProfileToDraft(user)
      showSuccess(response.data?.message || 'Đã cập nhật hồ sơ.')
      setProfileMode('view')
    } catch (error) {
      showError(error.response?.data?.message || 'Không cập nhật được hồ sơ.')
    }
  }

  const validateImageFile = file => {
    if (!file) {
      return ''
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Chỉ hỗ trợ ảnh JPG, PNG, WebP.'
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return 'Ảnh vượt quá 2MB.'
    }

    return ''
  }

  const validateVideoFile = file => {
    if (!file) return ''
    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!allowed.includes(file.type)) return 'Chỉ hỗ trợ video MP4, WebM, OGG, MOV.'
    const maxSize = 200 * 1024 * 1024
    if (file.size > maxSize) return 'Video vượt quá 200MB.'
    return ''
  }

  const uploadVideoFile = async file => {
    const formData = new FormData()
    formData.append('video', file)
    const response = await api.post('/api/uploads/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data?.url || ''
  }

  const handleAdminUploadVideo = async file => {
    if (!file) {
      return
    }
    const videoError = validateVideoFile(file)
    if (videoError) {
      showError(videoError)
      return
    }
    setIsAdminUploadLoading(true)
    try {
      const url = await uploadVideoFile(file)
      setAdminUploadUrl(url || '')
    } catch {
      showError('Không upload được video.')
    } finally {
      setIsAdminUploadLoading(false)
    }
  }

  const uploadImageFile = async file => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await api.post('/api/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data?.url || ''
  }

  const handleCreateCourse = async () => {
    if (!currentUser || (currentRole !== 'teacher' && currentRole !== 'admin')) {
      showError('Chỉ giảng viên hoặc admin mới tạo được lớp học.')
      return
    }

    if (!newCourseData.title.trim() || !newCourseData.category.trim()) {
      showWarning('Cậu điền tên lớp và danh mục trước nhé.')
      return
    }

    try {
      let imageUrl = newCourseData.imageUrl.trim()
      if (newCourseData.imageFile) {
        const errorMessage = validateImageFile(newCourseData.imageFile)
        if (errorMessage) {
          showError(errorMessage)
          return
        }
        imageUrl = await uploadImageFile(newCourseData.imageFile)
      }

      const response = await api.post('/api/courses', {
        title: newCourseData.title.trim(),
        category: newCourseData.category.trim(),
        description: newCourseData.description.trim(),
        imageUrl
      })
      showSuccess(response.data.message || 'Đã tạo lớp học.')
      setNewCourseData({ title: '', category: allCategories[0] || categories[0], description: '', imageUrl: '', imageFile: null })
      if (currentRole === 'teacher') {
        fetchTeacherCourses()
      }
      fetchCourses()
    } catch (error) {
      showError(error.response?.data?.message || 'Không tạo được lớp học.')
    }
  }

  const handleCreateLesson = async () => {
    if (!selectedTeacherCourseId) {
      showWarning('Cậu chọn lớp trước nhé.')
      return
    }

    if (!newLessonData.title.trim()) {
      showWarning('Cậu điền tiêu đề bài học trước nhé.')
      return
    }

    try {
      let imageUrl = newLessonData.imageUrl.trim()
      if (newLessonData.imageFile) {
        const errorMessage = validateImageFile(newLessonData.imageFile)
        if (errorMessage) {
          showError(errorMessage)
          return
        }
        imageUrl = await uploadImageFile(newLessonData.imageFile)
      }

      let videoUrl = newLessonData.videoUrl.trim()
      if (newLessonData.videoFile) {
        const videoError = validateVideoFile(newLessonData.videoFile)
        if (videoError) {
          showError(videoError)
          return
        }
        videoUrl = await uploadVideoFile(newLessonData.videoFile)
      }

      const response = await api.post(`/api/courses/${selectedTeacherCourseId}/lessons`, {
        title: newLessonData.title.trim(),
        content: newLessonData.content.trim(),
        videoUrl,
        imageUrl,
        order: newLessonData.order
      })
      showSuccess(response.data.message || 'Đã thêm bài học.')
      setNewLessonData({
        title: '',
        content: '',
        videoUrl: '',
        videoFile: null,
        imageUrl: '',
        order: 1,
        imageFile: null
      })
      fetchCourseLessons(selectedTeacherCourseId)
    } catch (error) {
      showError(error.response?.data?.message || 'Không thêm được bài học.')
    }
  }

  const handleStartEditLesson = lesson => {
    if (!lesson) {
      return
    }
    setEditLessonId(lesson._id)
    setEditLessonData({
      title: lesson.title || '',
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      videoFile: null,
      imageUrl: lesson.imageUrl || '',
      order: lesson.order || 1,
      imageFile: null
    })
  }

  const handleCancelEditLesson = () => {
    setEditLessonId(null)
    setEditLessonData({
      title: '',
      content: '',
      videoUrl: '',
      videoFile: null,
      imageUrl: '',
      order: 1,
      imageFile: null
    })
  }

  const handleUpdateLesson = async lessonId => {
    if (!lessonId) {
      return
    }

    if (!editLessonData.title.trim()) {
      showWarning('Cậu điền tiêu đề bài học trước nhé.')
      return
    }

    try {
      let imageUrl = editLessonData.imageUrl.trim()
      if (editLessonData.imageFile) {
        const errorMessage = validateImageFile(editLessonData.imageFile)
        if (errorMessage) {
          showError(errorMessage)
          return
        }
        imageUrl = await uploadImageFile(editLessonData.imageFile)
      }

      let videoUrl = editLessonData.videoUrl.trim()
      if (editLessonData.videoFile) {
        const videoError = validateVideoFile(editLessonData.videoFile)
        if (videoError) {
          showError(videoError)
          return
        }
        videoUrl = await uploadVideoFile(editLessonData.videoFile)
      }

      const response = await api.patch(`/api/lessons/${lessonId}`, {
        title: editLessonData.title.trim(),
        content: editLessonData.content.trim(),
        videoUrl,
        imageUrl,
        order: editLessonData.order
      })
      showSuccess(response.data.message || 'Đã cập nhật bài học.')
      handleCancelEditLesson()
      if (selectedTeacherCourseId) {
        fetchCourseLessons(selectedTeacherCourseId)
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Không cập nhật được bài học.')
    }
  }

  const handleDeleteLesson = async lessonId => {
    if (!lessonId) {
      return
    }

    if (!window.confirm('Xóa bài học này?')) {
      return
    }

    try {
      const response = await api.delete(`/api/lessons/${lessonId}`)
      showSuccess(response.data.message || 'Đã xóa bài học.')

      if (lessonRouteLesson && String(lessonRouteLesson._id) === String(lessonId)) {
        closeLessonRoute()
      }

      const refreshCourseId =
        selectedTeacherCourseId || selectedCourse?._id || lessonRouteCourse?._id || null
      if (refreshCourseId) {
        fetchCourseLessons(refreshCourseId)
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Không xóa được bài học.')
    }
  }

  const handleLessonUpdated = updatedLesson => {
    if (!updatedLesson) {
      return
    }

    if (lessonRouteLesson && String(lessonRouteLesson._id) === String(updatedLesson._id)) {
      setLessonRouteLesson(updatedLesson)
    }

    setLessonRouteLessons(prev =>
      prev.map(item => (String(item._id) === String(updatedLesson._id) ? updatedLesson : item))
    )
    setCourseLessons(prev =>
      prev.map(item => (String(item._id) === String(updatedLesson._id) ? updatedLesson : item))
    )
  }

  const handleUploadCourseEditorVideo = async file => {
    if (!file) return
    const err = validateVideoFile(file)
    if (err) {
      showError(getApiErrorMessage(err, 'File không hợp lệ.'))
      return
    }
    try {
      const url = await uploadVideoFile(file)
      setNewCourseData(prev => ({
        ...prev,
        description: `${prev.description || ''}<p><video controls src="${url}" style="max-width:100%"></video></p>`
      }))
    } catch {
      showError('Không upload được video.')
    }
  }

  const handleUploadLessonEditorVideo = async file => {
    if (!file) return
    const err = validateVideoFile(file)
    if (err) {
      showError(getApiErrorMessage(err, 'File không hợp lệ.'))
      return
    }
    try {
      const url = await uploadVideoFile(file)
      setNewLessonData(prev => ({
        ...prev,
        content: `${prev.content || ''}<p><video controls src="${url}" style="max-width:100%"></video></p>`
      }))
    } catch {
      showError('Không upload được video.')
    }
  }

  const handleUploadEditLessonEditorVideo = async file => {
    if (!file) return
    const err = validateVideoFile(file)
    if (err) {
      showError(getApiErrorMessage(err, 'File không hợp lệ.'))
      return
    }
    try {
      const url = await uploadVideoFile(file)
      setEditLessonData(prev => ({
        ...prev,
        content: `${prev.content || ''}<p><video controls src="${url}" style="max-width:100%"></video></p>`
      }))
    } catch {
      showError('Không upload được video.')
    }
  }

  const handleEnroll = async courseId => {
    if (!ensureAuthenticated('tham gia lớp học')) {
      return
    }

    try {
      const response = await api.post(`/api/courses/${courseId}/enroll`)
      showSuccess(response.data.message || 'Đã tham gia lớp học.')
      await Promise.all([
        fetchMyEnrollments(),
        fetchCourseLessons(courseId),
        fetchCourseAssignments(courseId)
      ])
    } catch (error) {
      showError(error.response?.data?.message || 'Không tham gia được lớp học.')
    }
  }

  const handleCompleteLesson = async lessonId => {
    if (!ensureAuthenticated('đánh dấu hoàn thành bài học')) {
      return
    }

    try {
      const response = await api.post(`/api/lessons/${lessonId}/complete`)
      showSuccess(response.data.message || 'Đã cập nhật tiến độ.')
      fetchMyEnrollments()
      if (currentUser) {
        fetchMyProfile()
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Không cập nhật được tiến độ.')
    }
  }

  const handleAdminDeletePost = async post => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    if (!window.confirm(`Xóa bài viết "${post.title}" của ${post.author}?`)) {
      return
    }

    try {
      const response = await api.delete(`/api/forum/posts/${post.id}`)

      showSuccess(response.data.message || 'Đã xóa bài viết.')
      setForumPosts(prev => prev.filter(item => String(item.id) !== String(post.id)))
      setCommentsByPost(prev => {
        const next = { ...prev }
        delete next[String(post.id)]
        return next
      })
      fetchDeletedPosts()
      fetchDeletedComments()
    } catch (error) {
      showError(error.response?.data?.message || 'Không xóa được bài viết.')
    }
  }

  const handlePunishForumComment = async (comment, penalty = 'warn') => {
    if (!currentUser || currentRole !== 'admin' || !comment?._id) {
      return
    }

    const label = penalty === 'ban' ? 'xóa bình luận và ban tài khoản' : penalty === 'suspend' ? 'xóa bình luận và tạm khóa tài khoản' : 'xóa bình luận và ghi nhận vi phạm'
    if (!window.confirm(`${label} của ${comment.author}?`)) {
      return
    }

    try {
      const response = await api.patch(`/api/forum/comments/${comment._id}/punish`, {
        penalty,
        reason: 'manual_admin_review'
      })
      showSuccess(response.data?.message || 'Đã xử lý bình luận.')
      setAdminForumComments(prev => prev.filter(item => String(item._id) !== String(comment._id)))
      fetchDeletedComments()
      fetchManagedUsers()
      fetchForumData()
    } catch (error) {
      showError(error.response?.data?.message || 'Không xử lý được bình luận.')
    }
  }

  const handleRestorePost = async postId => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    try {
      const response = await api.patch(`/api/forum/posts/${postId}/restore`, {})

      showSuccess(response.data.message || 'Đã khôi phục bài viết.')
      fetchDeletedPosts()
      fetchDeletedComments()
      fetchForumData()
    } catch (error) {
      showError(error.response?.data?.message || 'Không khôi phục được bài viết.')
    }
  }

  const handleRestoreComment = async commentId => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    try {
      const response = await api.patch(`/api/forum/comments/${commentId}/restore`, {})

      showSuccess(response.data.message || 'Đã khôi phục bình luận.')
      fetchDeletedComments()
      fetchForumData()
    } catch (error) {
      showError(error.response?.data?.message || 'Không khôi phục được bình luận.')
    }
  }

  const handlePermanentDeletePost = async postId => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    if (!window.confirm('Xóa vĩnh viễn bài viết này? Dữ liệu sẽ không thể khôi phục.')) {
      return
    }

    try {
      const response = await api.delete(`/api/forum/deleted/posts/${postId}`)

      showSuccess(response.data.message || 'Đã xóa vĩnh viễn bài viết.')
      fetchDeletedPosts()
      fetchDeletedComments()
      fetchForumData()
    } catch (error) {
      showError(error.response?.data?.message || 'Không xóa vĩnh viễn được bài viết.')
    }
  }

  const handlePermanentDeleteComment = async commentId => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    if (!window.confirm('Xóa vĩnh viễn bình luận này? Dữ liệu sẽ không thể khôi phục.')) {
      return
    }

    try {
      const response = await api.delete(`/api/forum/deleted/comments/${commentId}`)

      showSuccess(response.data.message || 'Đã xóa vĩnh viễn bình luận.')
      fetchDeletedComments()
      fetchForumData()
    } catch (error) {
      showError(error.response?.data?.message || 'Không xóa vĩnh viễn được bình luận.')
    }
  }

  const handleDeleteModerationReport = async reportId => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    if (!window.confirm('Xóa report kiểm duyệt AI này?')) {
      return
    }

    try {
      const response = await api.delete(`/api/moderation/reports/${reportId}`)

      showSuccess(response.data.message || 'Đã xóa report kiểm duyệt.')
      setModerationReports(prev => prev.filter(report => String(report._id) !== String(reportId)))
    } catch (error) {
      showError(error.response?.data?.message || 'Không xóa được report kiểm duyệt.')
    }
  }

  const handleClearModerationReports = async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    if (!window.confirm('Xóa toàn bộ lịch sử kiểm duyệt AI?')) {
      return
    }

    try {
      const response = await api.delete('/api/moderation/reports')

      showSuccess(response.data.message || 'Đã xóa toàn bộ lịch sử kiểm duyệt.')
      setModerationReports([])
    } catch (error) {
      showError(error.response?.data?.message || 'Không xóa được toàn bộ lịch sử kiểm duyệt.')
    }
  }

  const handleReportContent = async ({ targetType, targetId, targetAuthor, content }) => {
    if (!ensureAuthenticated('báo cáo nội dung')) {
      return
    }

    try {
      const response = await api.post('/api/moderation/report', {
        targetType,
        targetId: String(targetId),
        targetAuthor,
        content,
        reporter: currentUser
      })

      const payload = response.data || {}

      if (payload.shouldDelete) {
        if (targetType === 'post') {
          setForumPosts(prev => prev.filter(post => String(post.id) !== String(targetId)))
          setCommentsByPost(prev => {
            const clone = { ...prev }
            delete clone[String(targetId)]
            return clone
          })
        } else {
          setCommentsByPost(prev => {
            const next = { ...prev }
            Object.keys(next).forEach(postId => {
              next[postId] = (next[postId] || []).filter(comment => String(comment.id) !== String(targetId))
            })
            return next
          })
        }
      }

      const moderationText = payload.reason ? `Lý do: ${payload.reason}` : 'Đã xử lý báo cáo.'
      const accountText =
        payload.accountStatus && targetAuthor
          ? ` Tài khoản ${targetAuthor}: ${payload.accountStatus} (${payload.violationCount || 0} lỗi).`
          : ''
      showSuccess(`${payload.message || 'Đã gửi report.'} ${moderationText}${accountText}`)

      if (currentRole === 'admin' && activeTab === 'manage') {
        fetchManagedUsers()
        fetchModerationReports()
        fetchDeletedPosts()
        fetchDeletedComments()
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Không gửi được report.')
    }
  }

  const handleLogout = () => {
    const isInsideLesson = location.pathname.startsWith('/lesson/')
    if (logout) logout()
    setMyProfile(null)
    setProfileUser(null)
    setProfileMode('view')
    if (isInsideLesson) {
      showWarning('Bạn phải đăng nhập để tiếp tục học bài.')
    }
    handleTabChange('home')
  }

  const handleBrandClick = () => {
    handleTabChange('home')
    window.location.reload()
  }

  const forumCourses = useMemo(() => {
    if (!currentUser) {
      return []
    }

    if (currentRole === 'admin') {
      return courses
    }

    if (currentRole === 'teacher') {
      return teacherCourses
    }

    if (currentRole === 'student' || currentRole === 'user') {
      const enrolledCourseIds = new Set(myEnrollments.map(enrollment => String(enrollment.course)))
      return courses.filter(course => enrolledCourseIds.has(String(course._id)))
    }

    return []
  }, [courses, currentRole, currentUser, myEnrollments, teacherCourses])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  useEffect(() => {
    fetchForumData()
  }, [fetchForumData])

  useEffect(() => {
    if (!forumCourseId) {
      setForumCourse(null)
      return
    }
    const match = forumCourses.find(course => String(course._id) === String(forumCourseId))
    if (match) {
      setForumCourse(match)
      return
    }
    setForumCourse(null)
    setForumCourseId('')
  }, [forumCourseId, forumCourses])

  useEffect(() => {
    if (activeTab === 'lms' || activeTab === 'forum') {
      loadLearningSurfaceData()
    }
  }, [activeTab, loadLearningSurfaceData])

  useEffect(() => {
    if (!location.pathname.startsWith('/courses/')) {
      return
    }

    const courseId = decodeURIComponent(location.pathname.replace('/courses/', ''))
    if (!courseId) {
      return
    }

    const coursePool = currentRole === 'teacher' ? teacherCourses : courses
    const routeCourse = coursePool.find(course => String(course._id) === String(courseId))
    if (!routeCourse) {
      return
    }

    setActiveTab('lms')
    if (routeCourse.category && lmsCategory !== routeCourse.category) {
      setLmsCategory(routeCourse.category)
    }
    if (String(selectedCourse?._id) !== String(routeCourse._id)) {
      setSelectedCourse(routeCourse)
      loadSelectedCourseContent(routeCourse._id)
    }
  }, [courses, currentRole, teacherCourses, location.pathname, lmsCategory, selectedCourse?._id, loadSelectedCourseContent])

  useEffect(() => {
    if (lessonRouteSlug && !courses.length) {
      fetchCourses()
    }
  }, [lessonRouteSlug, courses.length, fetchCourses])

  useEffect(() => {
    if (activeTab === 'teacher') {
      fetchTeacherCourses()
    }
  }, [activeTab, fetchTeacherCourses])

  useEffect(() => {
    if (activeTab === 'manage' && currentRole === 'admin') {
      loadAdminDashboard()
    }
  }, [activeTab, currentRole, loadAdminDashboard])

  useEffect(() => {
    if (currentUser && !myProfile && !myProfileLoading) {
      fetchMyProfile()
    }
  }, [currentUser, fetchMyProfile, myProfile, myProfileLoading])

  useEffect(() => {
    if (lessonRouteSlug) {
      setLessonRouteLessons(courseLessons)
      return
    }

    return
  }, [courseLessons, lessonRouteSlug])

  const enrollmentByCourse = useMemo(() => {
    return myEnrollments.reduce((acc, enrollment) => {
      acc[String(enrollment.course)] = enrollment
      return acc
    }, {})
  }, [myEnrollments])

  const lessonRouteEnrollment = useMemo(() => {
    if (!lessonRouteCourse?._id) {
      return null
    }
    return enrollmentByCourse[String(lessonRouteCourse._id)] || null
  }, [enrollmentByCourse, lessonRouteCourse])

  const lessonRouteCompletedIds = useMemo(() => {
    return new Set((lessonRouteEnrollment?.completedLessons || []).map(item => String(item)))
  }, [lessonRouteEnrollment])

  const currentUserPoints = currentUser ? (myProfile?.points || 0) : 0
  const { currentRank, nextRank, pointsToNext } = useMemo(
    () => getRankInfo(currentUserPoints, rankTiers),
    [currentUserPoints]
  )

  const rankLeaderboard = useMemo(() => {
    return []
  }, [])

  const canCompleteLesson = Boolean(currentUser) && (currentRole === 'student' || currentRole === 'user')
  const isLessonCompleted = lessonRouteLesson
    ? lessonRouteCompletedIds.has(String(lessonRouteLesson._id || lessonRouteLesson.id))
    : false

  const handleOpenAuth = mode => {
    navigate(mode === 'register' ? '/register' : '/login')
  }

  const handleCommentDraftChange = (postId, value) => {
    setCommentDrafts(prev => ({
      ...prev,
      [postId]: value
    }))
  }

  useEffect(() => {
    if (location.pathname === '/admin' && activeTab !== 'manage') {
      setActiveTab('manage')
    } else if (location.pathname === '/teacher' && activeTab !== 'teacher') {
      setActiveTab('teacher')
    } else if ((location.pathname === '/courses' || location.pathname.startsWith('/courses/')) && activeTab !== 'lms') {
      setActiveTab('lms')
    } else if (location.pathname === '/forum' && activeTab !== 'forum') {
      setActiveTab('forum')
    } else if (location.pathname === '/profile' && activeTab !== 'profile') {
      setActiveTab('profile')
    } else if (location.pathname === '/' && activeTab !== 'home') {
      setActiveTab('home')
    }
  }, [location.pathname, activeTab])

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path='/login' element={<AuthPage />} />
        <Route path='/register' element={<AuthPage />} />
        <Route path='/*' element={
          <ProtectedRoute>
            <AppShell
            sidebarCollapsed={sidebarCollapsed}
            pageKey={`${activeTab}:${lessonRouteSlug || 'index'}`}
            fullWidth={activeTab === 'manage'}
            navigation={
              <>
            <Navbar
              currentRole={currentRole}
              currentUser={currentUser}
              currentUserLabel={myProfile?.profile?.displayName || currentUser}
              currentUserAvatar={myProfile?.profile?.avatarUrl || ''}
              currentRank={currentRank}
              currentUserPoints={currentUserPoints}
              onLogout={handleLogout}
              onOpenAuth={handleOpenAuth}
              onBrandClick={handleBrandClick}
              onOpenForum={openGeneralForum}
              onOpenProfile={handleOpenMyProfile}
              sidebarCollapsed={sidebarCollapsed}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 900) {
                  setSidebarOpen(v => !v)
                } else {
                  setSidebarCollapsed(v => !v)
                }
              }}
              onCloseSidebar={() => setSidebarOpen(false)}
            />

            {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
              </>
            }
          >
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path='/' element={
                  <HomeView
                    categories={allCategories}
                    currentUser={currentUser}
                    currentRank={currentRank}
                    currentUserPoints={currentUserPoints}
                    nextRank={nextRank}
                    pointsToNext={pointsToNext}
                    rankLeaderboard={rankLeaderboard}
                    categoryVideos={categoryVideos}
                    currentRole={currentRole}
                    onDeleteVideo={handleDeleteVideo}
                  />
                } />

                <Route path='/courses' element={
                  <LmsView
                    categories={allCategories}
                    selectedCategory={lmsCategory}
                    onSelectCategory={handleSelectLmsCategory}
                    courses={courses}
                    teacherCourses={teacherCourses}
                    selectedCourse={selectedCourse}
                    onSelectCourse={handleSelectLmsCourse}
                    lessons={courseLessons}
                    assignments={courseAssignments}
                    courseLeaderboard={courseLeaderboard}
                    assignmentDrafts={assignmentDrafts}
                    onAssignmentDraftChange={handleAssignmentDraftChange}
                    onSubmitAssignment={handleSubmitAssignment}
                    onSubmitQuizAssignment={handleSubmitQuizAssignment}
                    enrollmentByCourse={enrollmentByCourse}
                    teacherEnrollments={teacherEnrollments}
                    onEnroll={handleEnroll}
                    currentRole={currentRole}
                    currentUser={currentUser}
                    onOpenProfile={handleOpenProfile}
                    onOpenLesson={openLessonRoute}
                    onOpenCourseForum={handleOpenCourseForum}
                    onLoadEnrollments={fetchTeacherEnrollments}
                    onDeleteLesson={handleDeleteLesson}
                  />
                } />

                <Route path='/courses/:courseId' element={
                  <LmsView
                    categories={allCategories}
                    selectedCategory={lmsCategory}
                    onSelectCategory={handleSelectLmsCategory}
                    courses={courses}
                    teacherCourses={teacherCourses}
                    selectedCourse={selectedCourse}
                    onSelectCourse={handleSelectLmsCourse}
                    lessons={courseLessons}
                    assignments={courseAssignments}
                    courseLeaderboard={courseLeaderboard}
                    assignmentDrafts={assignmentDrafts}
                    onAssignmentDraftChange={handleAssignmentDraftChange}
                    onSubmitAssignment={handleSubmitAssignment}
                    onSubmitQuizAssignment={handleSubmitQuizAssignment}
                    enrollmentByCourse={enrollmentByCourse}
                    teacherEnrollments={teacherEnrollments}
                    onEnroll={handleEnroll}
                    currentRole={currentRole}
                    currentUser={currentUser}
                    onOpenProfile={handleOpenProfile}
                    onOpenLesson={openLessonRoute}
                    onOpenCourseForum={handleOpenCourseForum}
                    onLoadEnrollments={fetchTeacherEnrollments}
                    onDeleteLesson={handleDeleteLesson}
                  />
                } />

                <Route path='/forum' element={
                  <ForumView
                    newPost={newPost}
                    onNewPostChange={setNewPost}
                    categories={allCategories}
                    onPostSubmit={handlePostSubmit}
                    paginatedForumPosts={paginatedForumPosts}
                    commentsByPost={commentsByPost}
                    commentDrafts={commentDrafts}
                    onCommentDraftChange={handleCommentDraftChange}
                    onAddComment={handleAddComment}
                    onReportContent={handleReportContent}
                    onTogglePostReaction={handleTogglePostReaction}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    forumPage={forumPage}
                    forumTotalPages={forumTotalPages}
                    onPageChange={setForumPage}
                    filteredForumPosts={filteredForumPosts}
                    forumScope={forumScope}
                    forumCourse={forumCourse}
                    onOpenProfile={handleOpenProfile}
                    currentRole={currentRole}
                    onAdminDeletePost={handleAdminDeletePost}
                    onAdminPunishComment={handlePunishForumComment}
                  />
                } />

                <Route path='/teacher' element={
                  currentRole === 'teacher' ? (
                    <TeacherView
                      categories={allCategories}
                      courses={teacherCourses}
                      lessons={courseLessons}
                      selectedCourseId={selectedTeacherCourseId}
                      onSelectCourseId={handleSelectTeacherCourse}
                      newCourseData={newCourseData}
                      onNewCourseDataChange={setNewCourseData}
                      onCreateCourse={handleCreateCourse}
                      newLessonData={newLessonData}
                      onNewLessonDataChange={setNewLessonData}
                      onCreateLesson={handleCreateLesson}
                      assignments={courseAssignments}
                      newAssignmentData={newAssignmentData}
                      onNewAssignmentDataChange={setNewAssignmentData}
                      onCreateAssignment={handleCreateAssignment}
                      editAssignmentId={editAssignmentId}
                      editAssignmentData={editAssignmentData}
                      onEditAssignmentStart={handleEditAssignmentStart}
                      onEditAssignmentChange={setEditAssignmentData}
                      onEditAssignmentCancel={handleEditAssignmentCancel}
                      onUpdateAssignment={handleUpdateAssignment}
                      onDeleteAssignment={handleDeleteAssignment}
                      assignmentSubmissions={assignmentSubmissions}
                      onLoadAssignmentSubmissions={handleLoadAssignmentSubmissions}
                      onGradeSubmission={handleGradeSubmission}
                      editLessonId={editLessonId}
                      editLessonData={editLessonData}
                      onEditLessonStart={handleStartEditLesson}
                      onEditLessonChange={setEditLessonData}
                      onEditLessonCancel={handleCancelEditLesson}
                      onUpdateLesson={handleUpdateLesson}
                      onDeleteLesson={handleDeleteLesson}
                      onUploadCourseEditorVideo={handleUploadCourseEditorVideo}
                      onUploadLessonEditorVideo={handleUploadLessonEditorVideo}
                      onUploadEditLessonEditorVideo={handleUploadEditLessonEditorVideo}
                    />
                  ) : (
                    <Navigate to="/login" replace state={{ from: location }} />
                  )
                } />

                <Route path='/admin' element={
                  currentRole === 'admin' ? (
                    <ManageView
                      isLoadingUsers={isLoadingUsers}
                      isLoadingReports={isLoadingReports}
                      isLoadingDeletedPosts={isLoadingDeletedPosts}
                      isLoadingDeletedComments={isLoadingDeletedComments}
                      isLoadingAnalytics={isLoadingAnalytics}
                      courses={courses}
                      selectedCourse={selectedCourse}
                      onSelectCourse={handleSelectCourse}
                      courseLessons={courseLessons}
                      onOpenLesson={openLessonRoute}
                      onDeleteLesson={handleDeleteLesson}
                      onFetchUsers={fetchManagedUsers}
                      onFetchReports={fetchModerationReports}
                      onFetchDeletedPosts={fetchDeletedPosts}
                      onFetchDeletedComments={fetchDeletedComments}
                      onFetchForumComments={fetchAdminForumComments}
                      isLoadingForumComments={isLoadingForumComments}
                      deletedReasonFilter={deletedReasonFilter}
                      onReasonChange={setDeletedReasonFilter}
                      newUserData={newUserData}
                      onNewUserDataChange={setNewUserData}
                      onCreateUser={handleCreateUser}
                      newVideoData={newVideoData}
                      onVideoDataChange={setNewVideoData}
                      onAddVideo={handleAddVideo}
                      categories={allCategories}
                      customCategories={customCategories}
                      onAddCategory={handleAddCategory}
                      onRemoveCategory={handleRemoveCategory}
                      managedUsers={managedUsers}
                      currentUser={currentUser}
                      onRoleChange={handleRoleChange}
                      onStatusChange={handleStatusChange}
                      onDeleteUser={handleDeleteUser}
                      onUpdateUserDetails={handleUpdateUserDetails}
                      moderationReports={moderationReports}
                      onDeleteModerationReport={handleDeleteModerationReport}
                      onClearModerationReports={handleClearModerationReports}
                      forumPosts={forumPosts}
                      forumComments={adminForumComments}
                      onAdminDeletePost={handleAdminDeletePost}
                      onPunishForumComment={handlePunishForumComment}
                      deletedPosts={deletedPosts}
                      onRestorePost={handleRestorePost}
                      onPermanentDeletePost={handlePermanentDeletePost}
                      deletedComments={deletedComments}
                      onRestoreComment={handleRestoreComment}
                      onPermanentDeleteComment={handlePermanentDeleteComment}
                      analytics={adminAnalytics}
                      adminUploadUrl={adminUploadUrl}
                      isAdminUploadLoading={isAdminUploadLoading}
                      onAdminUploadVideo={handleAdminUploadVideo}
                      onClearAdminUploadUrl={() => setAdminUploadUrl('')}
                      onOpenProfile={handleOpenProfile}
                      api={api}
                    />
                  ) : (
                    <Navigate to="/login" replace state={{ from: location }} />
                  )
                } />

                <Route path='/profile' element={
                  currentUser ? (
                    <ProfilePage
                      profileUser={myProfile}
                      profileDraft={profileDraft}
                      isLoading={myProfileLoading}
                      mode={profileMode}
                      currentUser={currentUser}
                      isOwnProfile
                      onClose={() => {
                        navigate('/')
                        setActiveTab('home')
                      }}
                      onEdit={() => {
                        setProfileMode('edit')
                        fetchMyProfile()
                      }}
                      onSave={handleSaveProfile}
                      onChange={setProfileDraft}
                      onAvatarChange={handleProfileAvatarChange}
                    />
                  ) : (
                    <Navigate to="/login" replace state={{ from: location }} />
                  )
                } />

                <Route path='/profile/:userId' element={
                  <ProfilePage
                    profileUser={profileUser}
                    profileDraft={profileUser?.profile || {}}
                    isLoading={profileLoading}
                    mode="view"
                    currentUser={currentUser}
                    isOwnProfile={profileUser?.username === currentUser}
                    onClose={() => {
                      navigate(-1)
                    }}
                    onEdit={handleOpenMyProfile}
                    onSave={handleSaveProfile}
                    onChange={setProfileDraft}
                    onAvatarChange={handleProfileAvatarChange}
                  />
                } />

                <Route path='/lesson/:slug' element={
                  <LessonFullPage
                    lesson={lessonRouteLesson}
                    course={lessonRouteCourse}
                    lessons={lessonRouteLessons}
                    courses={courses}
                    isLoading={lessonRouteLoading}
                    onClose={closeLessonRoute}
                    onOpenLesson={openLessonRoute}
                    onSelectCourse={handleSelectLmsCourse}
                    onCompleteLesson={handleCompleteLesson}
                    canComplete={canCompleteLesson}
                    isCompleted={isLessonCompleted}
                    onLessonUpdated={handleLessonUpdated}
                    api={api}
                    currentUser={currentUser}
                    onOpenProfile={handleOpenProfile}
                    currentRole={currentRole}
                    onReportContent={handleReportContent}
                  />
                } />
              </Routes>
            </Suspense>

            <ChatWidget
              isOpen={isChatOpen}
              messages={messages}
              isLoading={isLoading}
              input={input}
              onInputChange={setInput}
              onSend={sendMessage}
              onToggle={() => setIsChatOpen(!isChatOpen)}
              onClose={() => setIsChatOpen(false)}
              onActionClick={handleChatAction}
            />

            </AppShell>
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  )
}

export default App

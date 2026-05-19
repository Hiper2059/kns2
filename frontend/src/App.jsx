import { useCallback, useEffect, useMemo, useState } from 'react'
import { clearTokens, createApiClient, setTokens } from './api/apiClient'
import AuthModal from './components/AuthModal'
import ChatWidget from './components/ChatWidget'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import ForumView from './components/ForumView'
import HomeView from './components/HomeView'
import ManageView from './components/ManageView'
import LmsView from './components/LmsView'
import TeacherView from './components/TeacherView'
import ProfileModal from './components/ProfileModal'
import LessonFullPage from './components/LessonFullPage'
import {
  categories,
  defaultCategoryVideos,
  defaultForumPosts,
  rankTiers
} from './data/skills'
import { getRankInfo, groupVideosByCategory, normalizeText } from './utils/appUtils'
import './App.css'

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

const getAuthGateFromPath = pathname => {
  if (pathname === '/admin') {
    return { role: 'admin', label: 'Admin' }
  }
  if (pathname === '/teacher') {
    return { role: 'teacher', label: 'Giang vien' }
  }
  if (pathname === '/student') {
    return { role: 'student', label: 'Hoc sinh' }
  }
  return null
}


function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('zmate_current_user')
    return storedUser || null
  })
  const [currentRole, setCurrentRole] = useState(() =>
    normalizeClientRole(localStorage.getItem('zmate_current_role') || 'student')
  )
  const [authData, setAuthData] = useState({ username: '', password: '' })
  const getInitialTab = () => {
    if (window.location.pathname === '/admin') {
      return 'manage'
    }
    if (window.location.pathname === '/teacher') {
      return 'teacher'
    }
    return 'home'
  }
  const [activeTab, setActiveTab] = useState(getInitialTab)
  const [authGate, setAuthGate] = useState(() => getAuthGateFromPath(window.location.pathname))
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [forumPage, setForumPage] = useState(1)
  const [isAuthLoading, setIsAuthLoading] = useState(false)

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
  const [pointsByUser, setPointsByUser] = useState(() => {
    const savedPoints = localStorage.getItem('zmate_points_by_user')
    return savedPoints ? JSON.parse(savedPoints) : {}
  })
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
  const [deletedReasonFilter, setDeletedReasonFilter] = useState('all')
  const [lmsCategory, setLmsCategory] = useState(null)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseLessons, setCourseLessons] = useState([])
  const [myEnrollments, setMyEnrollments] = useState([])
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
    imageUrl: '',
    order: 1,
    imageFile: null
  })
  const [editLessonId, setEditLessonId] = useState(null)
  const [editLessonData, setEditLessonData] = useState({
    title: '',
    content: '',
    videoUrl: '',
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
    role: 'teacher'
  })
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileMode, setProfileMode] = useState('view')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileUser, setProfileUser] = useState(null)
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

  const updatePathForTab = tab => {
    if (tab === 'manage') {
      window.history.pushState({}, '', '/admin')
      setAuthGate(getAuthGateFromPath('/admin'))
      return
    }

    if (tab === 'teacher') {
      window.history.pushState({}, '', '/teacher')
      setAuthGate(getAuthGateFromPath('/teacher'))
      return
    }

    if (['/admin', '/teacher', '/student'].includes(window.location.pathname)) {
      window.history.pushState({}, '', '/')
      setAuthGate(null)
    }
  }

  const handleTabChange = tab => {
    setActiveTab(tab)
    updatePathForTab(tab)
  }

  useEffect(() => {
    localStorage.setItem('zmate_points_by_user', JSON.stringify(pointsByUser))
  }, [pointsByUser])


  useEffect(() => {
    setForumPage(1)
  }, [searchTerm])

  useEffect(() => {
    if (!authGate) {
      return
    }

    if (!currentUser || currentRole !== authGate.role) {
      setAuthMode('login')
      setIsAuthOpen(true)
    }
  }, [authGate, currentUser, currentRole])

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

  const handleAuth = async () => {
    if (!authData.username.trim() || !authData.password.trim()) {
      alert('Cậu điền đầy đủ tên đăng nhập và mật khẩu nhé!')
      return
    }

    if (authGate && authMode === 'register') {
      alert('Trang nay chi ho tro dang nhap theo vai tro.')
      return
    }

    const endpoint = authMode === 'login' ? '/api/login' : '/api/register'
    setIsAuthLoading(true)
    try {
      const payload = {
        username: authData.username.trim(),
        password: authData.password.trim()
      }

      if (authMode === 'login' && authGate?.role) {
        payload.loginAs = authGate.role
      }

      const res = await api.post(endpoint, payload)

      alert(res.data.message)
      if (authMode === 'login') {
        setCurrentUser(res.data.username)
        const normalizedRole = normalizeClientRole(res.data.role || 'student')
        if (authGate && normalizedRole !== authGate.role) {
          clearTokens()
          localStorage.removeItem('zmate_current_user')
          localStorage.removeItem('zmate_current_role')
          setCurrentUser(null)
          setCurrentRole('student')
          alert(`Tai khoan khong thuoc vai tro ${authGate.label}.`)
          return
        }

        if (!authGate && window.location.pathname === '/' && normalizedRole === 'admin') {
          clearTokens()
          localStorage.removeItem('zmate_current_user')
          localStorage.removeItem('zmate_current_role')
          setCurrentUser(null)
          setCurrentRole('student')
          alert('Admin phai dang nhap tai duong dan /admin.')
          return
        }

        if (!authGate && window.location.pathname === '/' && normalizedRole === 'teacher') {
          clearTokens()
          localStorage.removeItem('zmate_current_user')
          localStorage.removeItem('zmate_current_role')
          setCurrentUser(null)
          setCurrentRole('student')
          alert('Giang vien phai dang nhap tai duong dan /teacher.')
          return
        }


        setCurrentRole(normalizedRole)
        setTokens({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          signatureToken: res.data.signatureToken
        })
        localStorage.setItem('zmate_current_user', res.data.username)
        localStorage.setItem('zmate_current_role', normalizedRole)

        if (authGate?.role === 'admin') {
          setActiveTab('manage')
          updatePathForTab('manage')
        } else if (authGate?.role === 'teacher') {
          setActiveTab('teacher')
          updatePathForTab('teacher')
        } else if (authGate?.role === 'student') {
          setActiveTab('home')
        }

        setIsAuthOpen(false)
        setAuthData({ username: '', password: '' })
      } else {
        setAuthMode('login')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra!')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const fetchForumData = useCallback(async () => {
    try {
      const [postsResponse, commentsResponse] = await Promise.all([
        api.get('/api/forum/posts'),
        api.get('/api/forum/comments')
      ])

      const normalizedPosts = (postsResponse.data.posts || []).map(post => ({
        id: post._id,
        author: post.author,
        category: post.category,
        title: post.title,
        content: post.content
      }))

      const groupedComments = (commentsResponse.data.comments || []).reduce((acc, comment) => {
        const postId = String(comment.postId)
        if (!acc[postId]) {
          acc[postId] = []
        }
        acc[postId].push({
          id: comment._id,
          author: comment.author,
          text: comment.text
        })
        return acc
      }, {})

      setForumPosts(normalizedPosts)
      setCommentsByPost(groupedComments)
    } catch {
      setForumPosts(defaultForumPosts)
      setCommentsByPost({})
    }
  }, [])

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
      categories.forEach(category => {
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
      categories.forEach(category => {
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
      setLmsCategory(null)
      return
    }

    if (actionId === 'login') {
      setIsAuthOpen(true)
      setAuthMode('login')
      return
    }

    if (actionId === 'register') {
      setIsAuthOpen(true)
      setAuthMode('register')
      return
    }

    if (actionId.startsWith('open-category:')) {
      const category = actionId.split(':')[1]
      if (category && categories.includes(category)) {
        handleTabChange('lms')
        setLmsCategory(category)
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

    alert(`Cậu cần đăng nhập để ${actionLabel}.`)
    setIsAuthOpen(true)
    setAuthMode('login')
    return false
  }


  const handlePostSubmit = async (overrideCategory = null) => {
    if (!ensureAuthenticated('đăng bài')) {
      return
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Cậu điền đủ tiêu đề và nội dung nhé!')
      return
    }

    const postCategory = overrideCategory || newPost.category

    try {
      const response = await api.post('/api/forum/posts', {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        category: postCategory
      })

      const createdPost = response.data.post
      setForumPosts(prevPosts => [
        {
          id: createdPost._id,
          author: createdPost.author,
          title: createdPost.title,
          content: createdPost.content,
          category: createdPost.category
        },
        ...prevPosts
      ])
      setNewPost({ title: '', content: '', category: categories[0] })
    } catch (error) {
      alert(error.response?.data?.message || 'Không đăng được bài viết.')
    }
  }

  const handleAddComment = async postId => {
    if (!ensureAuthenticated('bình luận')) {
      return
    }

    const draft = (commentDrafts[postId] || '').trim()
    if (!draft) {
      alert('Cậu nhập nội dung bình luận trước nhé!')
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
      alert(error.response?.data?.message || 'Không gửi được bình luận.')
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
      alert(error.response?.data?.message || 'Không tải được danh sách user.')
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
      alert(error.response?.data?.message || 'Không tải được lịch sử kiểm duyệt.')
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
      alert(error.response?.data?.message || 'Không tải được danh sách bài đã ẩn.')
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
      alert(error.response?.data?.message || 'Không tải được danh sách bình luận đã ẩn.')
    } finally {
      setIsLoadingDeletedComments(false)
    }
  }, [currentRole, currentUser, deletedReasonFilter])

  const handleRoleChange = async (username, role) => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    try {
      const response = await api.patch('/api/users/role', { username, role })
      alert(response.data.message)
      fetchManagedUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Không cập nhật được vai trò user.')
    }
  }

  const handleStatusChange = async (username, status) => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    try {
      const response = await api.patch('/api/users/status', { username, status })
      alert(response.data.message)
      fetchManagedUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Không cập nhật được trạng thái tài khoản.')
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
      alert(response.data.message)
      fetchManagedUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Không xóa được tài khoản.')
    }
  }

  const handleAddVideo = async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    if (!newVideoData.url.trim()) {
      alert('Cậu nhập link YouTube trước nhé.')
      return
    }

    try {
      const response = await api.post('/api/videos', {
        category: newVideoData.category,
        url: newVideoData.url.trim()
      })
      alert(response.data.message)
      setNewVideoData({ category: newVideoData.category, url: '' })
      fetchVideos()
    } catch (error) {
      alert(error.response?.data?.message || 'Không thêm được video.')
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
      alert(response.data.message)
      fetchVideos()
    } catch (error) {
      alert(error.response?.data?.message || 'Không xóa được video.')
    }
  }

  const handleCreateUser = async () => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    if (!newUserData.username.trim() || !newUserData.password.trim()) {
      alert('Cậu nhập đủ username và mật khẩu nhé.')
      return
    }

    try {
      const response = await api.post('/api/users', {
        username: newUserData.username.trim(),
        password: newUserData.password.trim(),
        role: newUserData.role
      })
      alert(response.data.message)
      setNewUserData({ username: '', password: '', role: newUserData.role })
      fetchManagedUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Không tạo được tài khoản.')
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
    } catch (error) {
      setCourseLessons([])
      if (error?.response?.status === 401) {
        alert('Cậu cần đăng nhập để xem bài học.')
      } else if (error?.response?.status === 403) {
        alert(error.response?.data?.message || 'Cần tham gia lớp trước khi xem bài học.')
      }
    }
  }, [])

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
    if (!currentUser || (currentRole !== 'teacher' && currentRole !== 'admin')) {
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
        alert(error.response?.data?.message || 'Không tải được danh sách học viên.')
      }
    },
    []
  )

  const handleSelectCourse = course => {
    setSelectedCourse(course)
    if (course?._id) {
      fetchCourseLessons(course._id)
    } else {
      setCourseLessons([])
    }
  }

  const handleSelectTeacherCourse = courseId => {
    setSelectedTeacherCourseId(courseId)
    if (courseId) {
      fetchCourseLessons(courseId)
    } else {
      setCourseLessons([])
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
        setLessonRouteLesson(lesson)
        setLessonRouteCourse(course)
        if (course?._id) {
          setSelectedCourse(course)
          await fetchCourseLessons(course._id)
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Khong tai duoc bai hoc.')
        setLessonRouteLesson(null)
        setLessonRouteCourse(null)
      } finally {
        setLessonRouteLoading(false)
      }
    },
    [fetchCourseLessons]
  )

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname
      if (pathname.startsWith('/lesson/')) {
        const slug = decodeURIComponent(pathname.replace('/lesson/', ''))
        setLessonRouteSlug(slug)
        setActiveTab('lms')
        fetchLessonRoute(slug)
        return
      }

      if (lessonRouteSlug) {
        setLessonRouteSlug(null)
        setLessonRouteLesson(null)
        setLessonRouteCourse(null)
        setLessonRouteLessons([])
      }
      setAuthGate(getAuthGateFromPath(pathname))
      if (pathname === '/admin') {
        setActiveTab('manage')
        return
      }
      if (pathname === '/teacher') {
        setActiveTab('teacher')
        return
      }
      setActiveTab('home')
    }

    window.addEventListener('popstate', handlePopState)
    handlePopState()
    return () => window.removeEventListener('popstate', handlePopState)
  }, [fetchLessonRoute, lessonRouteSlug])

  const openLessonRoute = lesson => {
    if (!lesson) {
      return
    }
    const slug = lesson.slug || lesson._id
    setLessonRouteSlug(slug)
    setActiveTab('lms')
    window.history.pushState({}, '', `/lesson/${slug}`)
    fetchLessonRoute(slug)
  }

  const closeLessonRoute = () => {
    setLessonRouteSlug(null)
    setLessonRouteLesson(null)
    setLessonRouteCourse(null)
    setLessonRouteLessons([])
    window.history.pushState({}, '', '/')
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
      alert(error.response?.data?.message || 'Không tải được hồ sơ.')
      setProfileUser(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const fetchMyProfile = useCallback(async () => {
    setProfileLoading(true)
    try {
      const response = await api.get('/api/users/me/profile')
      const user = response.data?.user || null
      setProfileUser(user)
      applyProfileToDraft(user)
    } catch (error) {
      alert(error.response?.data?.message || 'Không tải được hồ sơ cá nhân.')
      setProfileUser(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const handleOpenProfile = userId => {
    setProfileMode('view')
    setProfileModalOpen(true)
    fetchProfileById(userId)
  }

  const handleOpenMyProfile = () => {
    if (!ensureAuthenticated('cap nhat ho so')) {
      return
    }
    setProfileMode('edit')
    setProfileModalOpen(true)
    fetchMyProfile()
  }

  const handleSaveProfile = async () => {
    if (!ensureAuthenticated('cap nhat ho so')) {
      return
    }

    try {
      const response = await api.patch('/api/users/me/profile', profileDraft)
      const user = response.data?.user || null
      setProfileUser(user)
      applyProfileToDraft(user)
      alert(response.data?.message || 'Da cap nhat ho so.')
      setProfileMode('view')
    } catch (error) {
      alert(error.response?.data?.message || 'Khong cap nhat duoc ho so.')
    }
  }

  const validateImageFile = file => {
    if (!file) {
      return ''
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Chi ho tro anh JPG, PNG, WebP.'
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return 'Anh vuot qua 2MB.'
    }

    return ''
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
      alert('Chỉ giảng viên hoặc admin mới tạo được lớp học.')
      return
    }

    if (!newCourseData.title.trim() || !newCourseData.category.trim()) {
      alert('Cậu điền tên lớp và danh mục trước nhé.')
      return
    }

    try {
      let imageUrl = newCourseData.imageUrl.trim()
      if (newCourseData.imageFile) {
        const errorMessage = validateImageFile(newCourseData.imageFile)
        if (errorMessage) {
          alert(errorMessage)
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
      alert(response.data.message || 'Đã tạo lớp học.')
      setNewCourseData({ title: '', category: categories[0], description: '', imageUrl: '', imageFile: null })
      fetchTeacherCourses()
      fetchCourses()
    } catch (error) {
      alert(error.response?.data?.message || 'Không tạo được lớp học.')
    }
  }

  const handleCreateLesson = async () => {
    if (!selectedTeacherCourseId) {
      alert('Cậu chọn lớp trước nhé.')
      return
    }

    if (!newLessonData.title.trim()) {
      alert('Cậu điền tiêu đề bài học trước nhé.')
      return
    }

    try {
      let imageUrl = newLessonData.imageUrl.trim()
      if (newLessonData.imageFile) {
        const errorMessage = validateImageFile(newLessonData.imageFile)
        if (errorMessage) {
          alert(errorMessage)
          return
        }
        imageUrl = await uploadImageFile(newLessonData.imageFile)
      }

      const response = await api.post(`/api/courses/${selectedTeacherCourseId}/lessons`, {
        title: newLessonData.title.trim(),
        content: newLessonData.content.trim(),
        videoUrl: newLessonData.videoUrl.trim(),
        imageUrl,
        order: newLessonData.order
      })
      alert(response.data.message || 'Đã thêm bài học.')
      setNewLessonData({
        title: '',
        content: '',
        videoUrl: '',
        imageUrl: '',
        order: 1,
        imageFile: null
      })
      fetchCourseLessons(selectedTeacherCourseId)
    } catch (error) {
      alert(error.response?.data?.message || 'Không thêm được bài học.')
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
      alert('Cậu điền tiêu đề bài học trước nhé.')
      return
    }

    try {
      let imageUrl = editLessonData.imageUrl.trim()
      if (editLessonData.imageFile) {
        const errorMessage = validateImageFile(editLessonData.imageFile)
        if (errorMessage) {
          alert(errorMessage)
          return
        }
        imageUrl = await uploadImageFile(editLessonData.imageFile)
      }

      const response = await api.patch(`/api/lessons/${lessonId}`, {
        title: editLessonData.title.trim(),
        content: editLessonData.content.trim(),
        videoUrl: editLessonData.videoUrl.trim(),
        imageUrl,
        order: editLessonData.order
      })
      alert(response.data.message || 'Đã cập nhật bài học.')
      handleCancelEditLesson()
      if (selectedTeacherCourseId) {
        fetchCourseLessons(selectedTeacherCourseId)
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không cập nhật được bài học.')
    }
  }

  const handleEnroll = async courseId => {
    if (!ensureAuthenticated('tham gia lớp học')) {
      return
    }

    try {
      const response = await api.post(`/api/courses/${courseId}/enroll`)
      alert(response.data.message || 'Đã tham gia lớp học.')
      fetchMyEnrollments()
      fetchCourseLessons(courseId)
    } catch (error) {
      alert(error.response?.data?.message || 'Không tham gia được lớp học.')
    }
  }

  const handleCompleteLesson = async lessonId => {
    if (!ensureAuthenticated('đánh dấu hoàn thành bài học')) {
      return
    }

    try {
      const response = await api.post(`/api/lessons/${lessonId}/complete`)
      alert(response.data.message || 'Đã cập nhật tiến độ.')
      fetchMyEnrollments()
      if (currentUser) {
        setPointsByUser(prev => ({
          ...prev,
          [currentUser]: (prev[currentUser] || 0) + 10
        }))
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không cập nhật được tiến độ.')
    }
  }

  const handleEvaluateEnrollment = async (enrollmentId, payload) => {
    try {
      const response = await api.patch(`/api/enrollments/${enrollmentId}/evaluate`, payload)
      alert(response.data.message || 'Đã lưu đánh giá.')
      fetchTeacherEnrollments(selectedTeacherCourseId)
    } catch (error) {
      alert(error.response?.data?.message || 'Không lưu được đánh giá.')
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

      alert(response.data.message || 'Đã xóa bài viết.')
      setForumPosts(prev => prev.filter(item => String(item.id) !== String(post.id)))
      setCommentsByPost(prev => {
        const next = { ...prev }
        delete next[String(post.id)]
        return next
      })
      fetchDeletedPosts()
      fetchDeletedComments()
    } catch (error) {
      alert(error.response?.data?.message || 'Không xóa được bài viết.')
    }
  }

  const handleRestorePost = async postId => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    try {
      const response = await api.patch(`/api/forum/posts/${postId}/restore`, {})

      alert(response.data.message || 'Đã khôi phục bài viết.')
      fetchDeletedPosts()
      fetchDeletedComments()
      fetchForumData()
    } catch (error) {
      alert(error.response?.data?.message || 'Không khôi phục được bài viết.')
    }
  }

  const handleRestoreComment = async commentId => {
    if (!currentUser || currentRole !== 'admin') {
      return
    }

    try {
      const response = await api.patch(`/api/forum/comments/${commentId}/restore`, {})

      alert(response.data.message || 'Đã khôi phục bình luận.')
      fetchDeletedComments()
      fetchForumData()
    } catch (error) {
      alert(error.response?.data?.message || 'Không khôi phục được bình luận.')
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

      alert(response.data.message || 'Đã xóa vĩnh viễn bài viết.')
      fetchDeletedPosts()
      fetchDeletedComments()
      fetchForumData()
    } catch (error) {
      alert(error.response?.data?.message || 'Không xóa vĩnh viễn được bài viết.')
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

      alert(response.data.message || 'Đã xóa vĩnh viễn bình luận.')
      fetchDeletedComments()
      fetchForumData()
    } catch (error) {
      alert(error.response?.data?.message || 'Không xóa vĩnh viễn được bình luận.')
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

      alert(response.data.message || 'Đã xóa report kiểm duyệt.')
      setModerationReports(prev => prev.filter(report => String(report._id) !== String(reportId)))
    } catch (error) {
      alert(error.response?.data?.message || 'Không xóa được report kiểm duyệt.')
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

      alert(response.data.message || 'Đã xóa toàn bộ lịch sử kiểm duyệt.')
      setModerationReports([])
    } catch (error) {
      alert(error.response?.data?.message || 'Không xóa được toàn bộ lịch sử kiểm duyệt.')
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
      alert(`${payload.message || 'Đã gửi report.'} ${moderationText}${accountText}`)

      if (currentRole === 'admin' && activeTab === 'manage') {
        fetchManagedUsers()
        fetchModerationReports()
        fetchDeletedPosts()
        fetchDeletedComments()
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không gửi được report.')
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentRole('student')
    clearTokens()
    localStorage.removeItem('zmate_current_user')
    localStorage.removeItem('zmate_current_role')
    handleTabChange('home')
  }

  const handleBrandClick = () => {
    handleTabChange('home')
    window.location.reload()
  }

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  useEffect(() => {
    fetchForumData()
  }, [fetchForumData])

  useEffect(() => {
    if (activeTab === 'lms') {
      fetchCourses()
      fetchMyEnrollments()
    }
  }, [activeTab, fetchCourses, fetchMyEnrollments])

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
      fetchManagedUsers()
      fetchModerationReports()
      fetchDeletedPosts()
      fetchDeletedComments()
    }
  }, [
    activeTab,
    currentRole,
    fetchManagedUsers,
    fetchModerationReports,
    fetchDeletedPosts,
    fetchDeletedComments
  ])

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

  const currentUserPoints = currentUser ? pointsByUser[currentUser] || 0 : 0
  const { currentRank, nextRank, pointsToNext } = useMemo(
    () => getRankInfo(currentUserPoints, rankTiers),
    [currentUserPoints]
  )

  const rankLeaderboard = useMemo(() => {
    return Object.entries(pointsByUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [pointsByUser])

  const goToForumTab = () => {
    handleTabChange('forum')
  }

  const handleOpenAuth = mode => {
    if (authGate) {
      setAuthMode('login')
      setIsAuthOpen(true)
      return
    }

    setIsAuthOpen(true)
    setAuthMode(mode)
  }

  const handleCommentDraftChange = (postId, value) => {
    setCommentDrafts(prev => ({
      ...prev,
      [postId]: value
    }))
  }

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentRole={currentRole}
        currentUser={currentUser}
        currentRank={currentRank}
        currentUserPoints={currentUserPoints}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
        onBrandClick={handleBrandClick}
        onForumClick={goToForumTab}
        onOpenProfile={handleOpenMyProfile}
      />

      <AuthModal
        isOpen={isAuthOpen}
        authMode={authMode}
        authData={authData}
        isAuthLoading={isAuthLoading}
        title={authGate ? `Dang nhap ${authGate.label}` : undefined}
        disableRegister={Boolean(authGate)}
        onClose={() => setIsAuthOpen(false)}
        onAuth={handleAuth}
        onSwitchMode={() => {
          if (authGate) {
            return
          }
          setAuthMode(authMode === 'login' ? 'register' : 'login')
        }}
        onChange={setAuthData}
      />

      <main className="main-content">
        {lessonRouteSlug && (
          <LessonFullPage
            lesson={lessonRouteLesson}
            course={lessonRouteCourse}
            lessons={lessonRouteLessons}
            courses={courses}
            categories={categories}
            onClose={closeLessonRoute}
            onOpenLesson={openLessonRoute}
            onSelectCourse={course => {
              closeLessonRoute()
              handleSelectCourse(course)
            }}
            onSelectCategory={category => {
              closeLessonRoute()
              setLmsCategory(category)
              handleTabChange('lms')
            }}
            onCompleteLesson={handleCompleteLesson}
            canComplete={Boolean(lessonRouteEnrollment)}
            isCompleted={lessonRouteCompletedIds.has(String(lessonRouteLesson?._id))}
            isLoading={lessonRouteLoading}
          />
        )}

        {!lessonRouteSlug && activeTab === 'home' && (
          <HomeView
            categories={categories}
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
        )}

        {!lessonRouteSlug && activeTab === 'forum' && (
          <ForumView
            newPost={newPost}
            onNewPostChange={setNewPost}
            categories={categories}
            onPostSubmit={handlePostSubmit}
            paginatedForumPosts={paginatedForumPosts}
            commentsByPost={commentsByPost}
            commentDrafts={commentDrafts}
            onCommentDraftChange={handleCommentDraftChange}
            onAddComment={handleAddComment}
            onReportContent={handleReportContent}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            forumPage={forumPage}
            forumTotalPages={forumTotalPages}
            onPageChange={setForumPage}
            filteredForumPosts={filteredForumPosts}
          />
        )}

        {!lessonRouteSlug && activeTab === 'lms' && (
          <LmsView
            categories={categories}
            selectedCategory={lmsCategory}
            onSelectCategory={setLmsCategory}
            courses={courses}
            selectedCourse={selectedCourse}
            onSelectCourse={handleSelectCourse}
            lessons={courseLessons}
            enrollmentByCourse={enrollmentByCourse}
            onEnroll={handleEnroll}
            currentRole={currentRole}
            currentUser={currentUser}
            onOpenProfile={handleOpenProfile}
            onOpenLesson={openLessonRoute}
          />
        )}

        {!lessonRouteSlug && activeTab === 'teacher' && (currentRole === 'teacher' || currentRole === 'admin') && (
          <TeacherView
            categories={categories}
            courses={teacherCourses}
            lessons={courseLessons}
            enrollments={teacherEnrollments}
            selectedCourseId={selectedTeacherCourseId}
            onSelectCourseId={handleSelectTeacherCourse}
            newCourseData={newCourseData}
            onNewCourseDataChange={setNewCourseData}
            onCreateCourse={handleCreateCourse}
            newLessonData={newLessonData}
            onNewLessonDataChange={setNewLessonData}
            onCreateLesson={handleCreateLesson}
            editLessonId={editLessonId}
            editLessonData={editLessonData}
            onEditLessonStart={handleStartEditLesson}
            onEditLessonChange={setEditLessonData}
            onEditLessonCancel={handleCancelEditLesson}
            onUpdateLesson={handleUpdateLesson}
            onLoadEnrollments={fetchTeacherEnrollments}
            onEvaluateEnrollment={handleEvaluateEnrollment}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {!lessonRouteSlug && activeTab === 'teacher' && currentRole !== 'teacher' && currentRole !== 'admin' && (
          <div className="empty-state">Cậu cần đăng nhập bằng tài khoản giảng viên để vào khu vực này.</div>
        )}

        {!lessonRouteSlug && activeTab === 'manage' && currentRole === 'admin' && (
          <ManageView
            isLoadingUsers={isLoadingUsers}
            isLoadingReports={isLoadingReports}
            isLoadingDeletedPosts={isLoadingDeletedPosts}
            isLoadingDeletedComments={isLoadingDeletedComments}
            onFetchUsers={fetchManagedUsers}
            onFetchReports={fetchModerationReports}
            onFetchDeletedPosts={fetchDeletedPosts}
            onFetchDeletedComments={fetchDeletedComments}
            deletedReasonFilter={deletedReasonFilter}
            onReasonChange={setDeletedReasonFilter}
            newUserData={newUserData}
            onNewUserDataChange={setNewUserData}
            onCreateUser={handleCreateUser}
            newVideoData={newVideoData}
            onVideoDataChange={setNewVideoData}
            onAddVideo={handleAddVideo}
            categories={categories}
            managedUsers={managedUsers}
            currentUser={currentUser}
            onRoleChange={handleRoleChange}
            onStatusChange={handleStatusChange}
            onDeleteUser={handleDeleteUser}
            moderationReports={moderationReports}
            onDeleteModerationReport={handleDeleteModerationReport}
            onClearModerationReports={handleClearModerationReports}
            forumPosts={forumPosts}
            onAdminDeletePost={handleAdminDeletePost}
            deletedPosts={deletedPosts}
            onRestorePost={handleRestorePost}
            onPermanentDeletePost={handlePermanentDeletePost}
            deletedComments={deletedComments}
            onRestoreComment={handleRestoreComment}
            onPermanentDeleteComment={handlePermanentDeleteComment}
          />
        )}

        {!lessonRouteSlug && activeTab === 'manage' && currentRole !== 'admin' && (
          <div className="empty-state">Cậu cần đăng nhập bằng tài khoản admin để vào trang /admin.</div>
        )}
      </main>

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

      <ProfileModal
        isOpen={profileModalOpen}
        mode={profileMode}
        profileUser={profileUser}
        profileDraft={profileDraft}
        isLoading={profileLoading}
        onClose={() => setProfileModalOpen(false)}
        onEdit={() => {
          setProfileMode('edit')
          fetchMyProfile()
        }}
        onSave={handleSaveProfile}
        onChange={setProfileDraft}
        isOwnProfile={profileUser?.username === currentUser}
      />

      <Footer />
    </div>
  )
}

export default App

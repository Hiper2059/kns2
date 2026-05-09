import { useCallback, useEffect, useMemo, useState } from 'react'
import { clearTokens, createApiClient, setTokens } from './api/apiClient'
import AuthModal from './components/AuthModal'
import ChatWidget from './components/ChatWidget'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import ForumView from './components/ForumView'
import HomeView from './components/HomeView'
import ManageView from './components/ManageView'
import {
  categories,
  defaultCategoryVideos,
  defaultForumPosts,
  quizBank,
  rankTiers
} from './data/skills'
import { getRankInfo, groupVideosByCategory, normalizeText } from './utils/appUtils'
import './App.css'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://kns-1.onrender.com')

const api = createApiClient(API_BASE_URL)

const FORUM_PAGE_SIZE = 6

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('zmate_current_user')
    return storedUser || null
  })
  const [currentRole, setCurrentRole] = useState(() => localStorage.getItem('zmate_current_role') || 'user')
  const [authData, setAuthData] = useState({ username: '', password: '' })
  const [activeTab, setActiveTab] = useState('home')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
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
  const [watchedVideosByUser, setWatchedVideosByUser] = useState(() => {
    const savedWatched = localStorage.getItem('zmate_watched_videos')
    return savedWatched ? JSON.parse(savedWatched) : {}
  })
  const [completedQuizByUser, setCompletedQuizByUser] = useState(() => {
    const savedQuiz = localStorage.getItem('zmate_completed_quiz')
    return savedQuiz ? JSON.parse(savedQuiz) : {}
  })
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState('')
  const [quizFeedback, setQuizFeedback] = useState('')
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

  useEffect(() => {
    localStorage.setItem('zmate_points_by_user', JSON.stringify(pointsByUser))
  }, [pointsByUser])

  useEffect(() => {
    localStorage.setItem('zmate_watched_videos', JSON.stringify(watchedVideosByUser))
  }, [watchedVideosByUser])

  useEffect(() => {
    localStorage.setItem('zmate_completed_quiz', JSON.stringify(completedQuizByUser))
  }, [completedQuizByUser])

  useEffect(() => {
    setSelectedQuizAnswer('')
    setQuizFeedback('')
  }, [selectedCategory])

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

  const handleAuth = async () => {
    if (!authData.username.trim() || !authData.password.trim()) {
      alert('Cậu điền đầy đủ tên đăng nhập và mật khẩu nhé!')
      return
    }

    const endpoint = authMode === 'login' ? '/api/login' : '/api/register'
    setIsAuthLoading(true)
    try {
      const res = await api.post(endpoint, {
        username: authData.username.trim(),
        password: authData.password.trim()
      })

      alert(res.data.message)
      if (authMode === 'login') {
        setCurrentUser(res.data.username)
        setCurrentRole(res.data.role || 'user')
        setTokens({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          signatureToken: res.data.signatureToken
        })
        localStorage.setItem('zmate_current_user', res.data.username)
        localStorage.setItem('zmate_current_role', res.data.role || 'user')
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
      categories.forEach(category => {
        addSuggestion({ id: `open-category:${category}`, label: `Học ${category}` })
      })
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
      setActiveTab('home')
      return
    }

    if (actionId === 'go-overview') {
      setActiveTab('home')
      setSelectedCategory(null)
      return
    }

    if (actionId === 'go-forum') {
      setActiveTab('forum')
      setSelectedCategory(null)
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
        setActiveTab('home')
        setSelectedCategory(category)
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

  const awardPoints = (amount, reason) => {
    if (!currentUser) {
      return
    }

    setPointsByUser(prev => ({
      ...prev,
      [currentUser]: (prev[currentUser] || 0) + amount
    }))
    alert(`+${amount} điểm: ${reason}`)
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

  const handleVideoEnded = (category, url, index) => {
    if (!ensureAuthenticated('xem video để nhận điểm')) {
      return
    }

    const videoKey = `${category}-${index}-${url}`
    const watchedByCurrentUser = watchedVideosByUser[currentUser] || {}

    if (watchedByCurrentUser[videoKey]) {
      alert('Video này cậu đã nhận điểm rồi nha.')
      return
    }

    setWatchedVideosByUser(prev => ({
      ...prev,
      [currentUser]: {
        ...(prev[currentUser] || {}),
        [videoKey]: true
      }
    }))

    awardPoints(10, 'Hoàn thành một video học tập')
  }

  const handleSubmitQuiz = () => {
    if (!selectedCategory || !quizBank[selectedCategory]) {
      return
    }

    if (!ensureAuthenticated('trả lời câu hỏi')) {
      return
    }

    if (!selectedQuizAnswer) {
      setQuizFeedback('Cậu chọn đáp án trước rồi gửi nhé.')
      return
    }

    const quiz = quizBank[selectedCategory]
    const quizKey = `${selectedCategory}-${quiz.id}`
    const completedByCurrentUser = completedQuizByUser[currentUser] || {}

    if (completedByCurrentUser[quizKey]) {
      setQuizFeedback('Câu hỏi này cậu đã hoàn thành và nhận điểm rồi.')
      return
    }

    if (selectedQuizAnswer === quiz.answer) {
      setCompletedQuizByUser(prev => ({
        ...prev,
        [currentUser]: {
          ...(prev[currentUser] || {}),
          [quizKey]: true
        }
      }))
      setQuizFeedback('Chính xác! Cậu vừa nhận thêm 15 điểm.')
      awardPoints(15, 'Trả lời đúng câu hỏi kỹ năng')
      return
    }

    setQuizFeedback('Chưa đúng rồi, cậu thử lại nhé.')
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
    setCurrentRole('user')
    clearTokens()
    localStorage.removeItem('zmate_current_user')
    localStorage.removeItem('zmate_current_role')
  }

  const handleBrandClick = () => {
    setActiveTab('home')
    setSelectedCategory(null)
    window.location.reload()
  }

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  useEffect(() => {
    fetchForumData()
  }, [fetchForumData])

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

  const postsBySelectedCategory = useMemo(() => {
    if (!selectedCategory) {
      return []
    }
    return filteredForumPosts.filter(post => post.category === selectedCategory)
  }, [filteredForumPosts, selectedCategory])

  const totalPosts = forumPosts.length
  const totalCategories = categories.length
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

  const currentQuiz = selectedCategory ? quizBank[selectedCategory] : null
  const currentQuizKey = currentQuiz && selectedCategory ? `${selectedCategory}-${currentQuiz.id}` : null
  const isCurrentQuizDone =
    currentUser && currentQuizKey ? Boolean(completedQuizByUser[currentUser]?.[currentQuizKey]) : false

  const topContributors = useMemo(() => {
    const score = forumPosts.reduce((acc, post) => {
      acc[post.author] = (acc[post.author] || 0) + 1
      return acc
    }, {})

    return Object.entries(score)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }, [forumPosts])

  const goToForumTab = () => {
    setActiveTab('forum')
    setSelectedCategory(null)
  }

  const handleOpenAuth = mode => {
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
        onTabChange={setActiveTab}
        currentRole={currentRole}
        currentUser={currentUser}
        currentRank={currentRank}
        currentUserPoints={currentUserPoints}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
        onBrandClick={handleBrandClick}
        onForumClick={goToForumTab}
      />

      <AuthModal
        isOpen={isAuthOpen}
        authMode={authMode}
        authData={authData}
        isAuthLoading={isAuthLoading}
        onClose={() => setIsAuthOpen(false)}
        onAuth={handleAuth}
        onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        onChange={setAuthData}
      />

      <main className="main-content">
        {activeTab === 'home' && (
          <HomeView
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            totalPosts={totalPosts}
            totalCategories={totalCategories}
            topContributors={topContributors}
            currentUser={currentUser}
            currentRank={currentRank}
            currentUserPoints={currentUserPoints}
            nextRank={nextRank}
            pointsToNext={pointsToNext}
            rankLeaderboard={rankLeaderboard}
            categoryVideos={categoryVideos}
            currentRole={currentRole}
            onDeleteVideo={handleDeleteVideo}
            watchedVideosByUser={watchedVideosByUser}
            onVideoEnded={handleVideoEnded}
            currentQuiz={currentQuiz}
            selectedQuizAnswer={selectedQuizAnswer}
            onSelectQuizAnswer={setSelectedQuizAnswer}
            isCurrentQuizDone={isCurrentQuizDone}
            onSubmitQuiz={handleSubmitQuiz}
            quizFeedback={quizFeedback}
            newPost={newPost}
            onNewPostChange={setNewPost}
            onPostSubmit={handlePostSubmit}
            postsBySelectedCategory={postsBySelectedCategory}
            onGoForumTab={goToForumTab}
          />
        )}

        {activeTab === 'forum' && (
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

        {activeTab === 'manage' && currentRole === 'admin' && (
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

      <Footer />
    </div>
  )
}

export default App

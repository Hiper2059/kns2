import React, { useEffect, useState } from 'react'
import { AlertTriangle, LogIn, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createApiClient } from '../api/apiClient'
import { useAuth } from '../context/AuthContext'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://kns-1.onrender.com')
const api = createApiClient(API_BASE_URL)

const baseInputClass = "w-full h-12 px-5 bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-xl text-[15px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all"
const baseButtonClass = "inline-flex items-center justify-center gap-2 w-full h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold transition-all shadow-[0_4px_20px_0_rgba(37,99,235,0.4)] hover:shadow-[0_6px_25px_0_rgba(37,99,235,0.5)] hover:-translate-y-0.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-[15px]"

const AuthPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, currentUser } = useAuth()
  const isLoginPage = location.pathname === '/login'

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAuthSuccess = (role) => {
    let dest = location.state?.from?.pathname || '/'
    if (dest === '/' || dest === '/login' || dest === '/register') {
      if (role === 'admin') dest = '/admin'
      else if (role === 'teacher') dest = '/teacher'
      else dest = '/'
    }
    navigate(dest, { replace: true })
  }

  useEffect(() => {
    if (currentUser) {
      const role = localStorage.getItem('zmate_current_role') || 'student'
      handleAuthSuccess(role)
    }
  }, [currentUser, location, navigate])

  const handleChange = event => {
    setFormData(prev => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const loginWithCredentials = async () => {
    const response = await api.post('/api/login', {
      username: formData.username,
      password: formData.password
    })
    const { username, role, accessToken, refreshToken, signatureToken } = response.data
    login(username, role, { accessToken, refreshToken, signatureToken })
    handleAuthSuccess(role)
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isLoginPage) {
        await loginWithCredentials()
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.')
        return
      }

      await api.post('/api/register', {
        username: formData.username,
        password: formData.password
      })
      await loginWithCredentials()
    } catch (err) {
      setError(err.response?.data?.message || 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans bg-slate-50">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply"></div>
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[80%] rounded-full bg-indigo-400/20 blur-[120px] mix-blend-multiply"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-400/20 blur-[100px] mix-blend-multiply"></div>
      </div>

      <div className="w-full max-w-5xl bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/50 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[600px]">
        
        {/* Left Side: Visual / Info Panel */}
        <div className="w-full md:w-[45%] lg:w-[50%] relative hidden md:flex flex-col justify-between p-10 lg:p-12 text-white overflow-hidden">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-indigo-900/90 to-slate-900/95"></div>
          
          <div className="relative z-10 flex flex-col items-start">
            <Link to="/" className="inline-flex items-center gap-3 mb-16 text-white hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 font-black text-2xl shadow-lg">
                Z
              </div>
              <span className="text-3xl font-black tracking-tight">Z-Mate</span>
            </Link>
            
            <h1 className="text-4xl lg:text-5xl font-black leading-[1.15] mb-6 tracking-tight">
              Nâng tầm<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">kỹ năng sống</span><br/>
              của bạn.
            </h1>
            <p className="text-lg text-blue-100/90 font-medium leading-relaxed max-w-md">
              Hành trình vạn dặm bắt đầu từ một bước chân. Hãy tham gia ngay để rèn luyện và phát triển bản thân.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 text-blue-300">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="font-bold text-white text-[15px]">Nền tảng uy tín, an toàn</p>
                <p className="text-blue-200/80 text-sm font-medium">Cam kết bảo mật thông tin tuyệt đối</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-[55%] lg:w-[50%] p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white/40 relative">
          
          {/* Mobile Header / Logo */}
          <div className="md:hidden flex items-center gap-2 mb-8 text-blue-600">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              Z
            </div>
            <span className="text-2xl font-black tracking-tight">Z-Mate</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-3 tracking-tight">
              {isLoginPage ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
            </h2>
            <p className="text-slate-500 font-medium text-[15px]">
              {isLoginPage
                ? 'Đăng nhập để tiếp tục hành trình học tập của bạn.'
                : 'Đăng ký ngay để trải nghiệm các tính năng tuyệt vời.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-md">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] uppercase tracking-wider font-bold text-slate-500 ml-1">Tên đăng nhập</label>
              <input
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="VD: haihoan"
                autoComplete="username"
                className={baseInputClass}
              />
            </div>

            {!isLoginPage && (
              <div className="flex flex-col gap-2">
                <label className="text-[12px] uppercase tracking-wider font-bold text-slate-500 ml-1 flex items-center justify-between">
                  Tên hiển thị
                  <span className="text-[11px] text-slate-400 normal-case font-medium">Tùy chọn</span>
                </label>
                <input
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="VD: Trịnh Hải Hoan"
                  autoComplete="name"
                  className={baseInputClass}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[12px] uppercase tracking-wider font-bold text-slate-500 ml-1 flex items-center justify-between">
                Mật khẩu
                {isLoginPage && <a href="#" className="text-[12px] font-bold text-blue-600 hover:text-blue-700 hover:underline normal-case tracking-normal">Quên mật khẩu?</a>}
              </label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete={isLoginPage ? 'current-password' : 'new-password'}
                className={baseInputClass}
              />
            </div>

            {!isLoginPage && (
              <div className="flex flex-col gap-2">
                <label className="text-[12px] uppercase tracking-wider font-bold text-slate-500 ml-1">Xác nhận mật khẩu</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={baseInputClass}
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-xl text-red-600 mt-2 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                <span className="text-[13.5px] font-medium leading-snug">{error}</span>
              </div>
            )}

            <button type="submit" disabled={isLoading} className={`${baseButtonClass} mt-4`}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isLoginPage ? (
                <>Đăng nhập <ArrowRight size={18} /></>
              ) : (
                <>Đăng ký <UserPlus size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-200/60 text-center">
            <p className="text-[14px] font-medium text-slate-500">
              {isLoginPage ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
              <Link 
                to={isLoginPage ? '/register' : '/login'} 
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all ml-1"
              >
                {isLoginPage ? 'Tạo ngay' : 'Đăng nhập'}
              </Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default AuthPage

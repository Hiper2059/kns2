import { useRef } from 'react'
import { ArrowLeft, Edit3, Save, Camera, Shield, Award, BookOpen, Target, Calendar, UserRound } from 'lucide-react'

const baseInputClass = "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
const baseTextAreaClass = "w-full min-h-[100px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-y transition-all"
const baseButtonClass = "inline-flex items-center justify-center h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] cursor-pointer"
const ghostButtonClass = "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer text-[13px]"

const FactItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 text-blue-600">
      <Icon size={18} />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</span>
      <strong className="text-[14px] font-black text-slate-900 break-words">{value || 'Chưa cập nhật'}</strong>
    </div>
  </div>
)

const ProfilePage = ({
  profileUser,
  profileDraft,
  isLoading,
  mode,
  currentUser,
  isOwnProfile = false,
  onClose,
  onEdit,
  onSave,
  onChange,
  onAvatarChange
}) => {
  const avatarInputRef = useRef(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full">
        <div className="text-[15px] font-bold text-blue-600 animate-pulse flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Đang tải hồ sơ...
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-slate-200 rounded-[24px] shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <UserRound size={32} className="text-slate-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Chưa có hồ sơ</h2>
          <p className="text-[15px] text-slate-500 font-medium mb-8">Hãy tạo hoặc cập nhật hồ sơ của cậu trước khi bắt đầu.</p>
          <button className={ghostButtonClass} onClick={onClose}>
            <ArrowLeft size={16} /> Quay lại trang chủ
          </button>
        </div>
      </div>
    )
  }

  const role = profileUser?.role || 'student'
  const displayName = profileDraft.displayName || profileUser.profile?.displayName || profileUser.username || currentUser || 'Tài khoản'
  const avatarUrl = profileDraft.avatarUrl || profileUser.profile?.avatarUrl || ''

  const handleFieldChange = (key, value) => {
    onChange({ ...profileDraft, [key]: value })
  }

  const handleNestedChange = (section, key, value) => {
    onChange({
      ...profileDraft,
      [section]: {
        ...profileDraft[section],
        [key]: value
      }
    })
  }

  const openAvatarPicker = () => {
    if (!isOwnProfile || !isEditing) return
    avatarInputRef.current?.click()
  }

  const isEditing = mode === 'edit'

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-8 min-w-0">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar / Left Rail */}
        <aside className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6">
          <button className="inline-flex items-center gap-2 text-[14px] font-bold text-slate-500 hover:text-slate-800 transition-colors self-start mb-2 cursor-pointer" onClick={onClose}>
            <ArrowLeft size={16} /> Trở về
          </button>

          <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col items-center text-center p-8">
            <div className={`relative mb-6 ${isEditing && isOwnProfile ? 'group cursor-pointer' : ''}`} onClick={openAvatarPicker}>
              <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-slate-300">{displayName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              
              {isOwnProfile && isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white mb-2" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">Đổi ảnh</span>
                </div>
              )}
            </div>
            
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />

            <div className="flex flex-col items-center">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest mb-3 ${role === 'admin' ? 'bg-rose-100 text-rose-700' : role === 'teacher' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                {role}
              </span>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{displayName}</h1>
              <p className="text-[14px] font-bold text-slate-400">@{profileUser.username}</p>
            </div>

            <div className="w-full h-px bg-slate-100 my-6"></div>

            <div className="w-full flex flex-col gap-3 text-left">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-[13px] font-bold text-slate-500">Trạng thái</span>
                <span className={`text-[13px] font-black uppercase ${profileUser.status === 'banned' ? 'text-red-500' : profileUser.status === 'suspended' ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {profileUser.status || 'active'}
                </span>
              </div>
            </div>

            {isOwnProfile && (
              <div className="w-full mt-8">
                {isEditing ? (
                  <button className={`${baseButtonClass} w-full`} onClick={onSave}>
                    <Save size={18} className="mr-2" /> Lưu thay đổi
                  </button>
                ) : (
                  <button className={`${ghostButtonClass} w-full`} onClick={onEdit}>
                    <Edit3 size={16} /> Chỉnh sửa hồ sơ
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 gap-6">
          <header className="p-8 md:p-10 bg-slate-900 rounded-[24px] text-white shadow-[0_20px_50px_rgba(15,23,42,0.5)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative z-10 max-w-lg">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[12px] font-black uppercase tracking-wide mb-4">
                Hồ sơ cá nhân
              </span>
              <h2 className="text-3xl font-black mb-3">{isOwnProfile ? 'Không gian của riêng cậu' : `Hồ sơ của ${displayName}`}</h2>
              <p className="text-[14px] font-medium text-slate-300">
                Thông tin cá nhân, chức danh và các số liệu hoạt động trên hệ thống.
              </p>
            </div>
            <div className="relative z-10 flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col items-center md:items-end justify-center min-w-[160px]">
              <span className="text-[12px] font-bold text-slate-300 uppercase tracking-wide mb-1">Tài khoản</span>
              <strong className="text-xl font-black">{profileUser.username}</strong>
            </div>
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
          </header>

          <div className="flex flex-col gap-6">
            {/* General Info */}
            <section className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-6 md:p-8">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <UserRound size={20} className="text-blue-600" /> Thông tin chung
              </h3>
              
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-slate-700">Tên hiển thị</label>
                    <input type="text" className={baseInputClass} placeholder="Tên hiển thị" value={profileDraft.displayName} onChange={event => handleFieldChange('displayName', event.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-slate-700">Pháp danh / Nghệ danh</label>
                    <input type="text" className={baseInputClass} placeholder="Pháp danh / Nghệ danh" value={profileDraft.stageName} onChange={event => handleFieldChange('stageName', event.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-full">
                    <label className="text-[13px] font-bold text-slate-700">Giới thiệu ngắn</label>
                    <textarea className={baseTextAreaClass} placeholder="Chia sẻ đôi điều về bản thân..." value={profileDraft.bio} onChange={event => handleFieldChange('bio', event.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FactItem icon={UserRound} label="Tên hiển thị" value={profileUser.profile?.displayName} />
                  <FactItem icon={Shield} label="Pháp danh / Nghệ danh" value={profileUser.profile?.stageName} />
                  <div className="col-span-full mt-2">
                    <span className="block text-[13px] font-bold text-slate-500 mb-2">Giới thiệu ngắn</span>
                    <p className="text-[15px] text-slate-800 leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-100">
                      {profileUser.profile?.bio || 'Chưa có thông tin giới thiệu.'}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Teacher Profile */}
            {(role === 'teacher' || role === 'admin') && (
              <section className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-6 md:p-8">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Award size={20} className="text-amber-600" /> Hồ sơ giảng dạy
                </h3>
                
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Môn giảng dạy chính</label>
                      <input type="text" className={baseInputClass} placeholder="Môn giảng dạy chính" value={profileDraft.teacher?.mainSubject || ''} onChange={event => handleNestedChange('teacher', 'mainSubject', event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Chứng chỉ</label>
                      <input type="text" className={baseInputClass} placeholder="Chứng chỉ" value={profileDraft.teacher?.certificates || ''} onChange={event => handleNestedChange('teacher', 'certificates', event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Học vị / Sư thừa</label>
                      <input type="text" className={baseInputClass} placeholder="Học vị / Sư thừa" value={profileDraft.teacher?.degree || ''} onChange={event => handleNestedChange('teacher', 'degree', event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Năm kinh nghiệm</label>
                      <input type="text" className={baseInputClass} placeholder="Năm kinh nghiệm" value={profileDraft.teacher?.teachingYears || ''} onChange={event => handleNestedChange('teacher', 'teachingYears', event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Câu lạc bộ từng giảng dạy</label>
                      <input type="text" className={baseInputClass} placeholder="Câu lạc bộ từng giảng dạy" value={profileDraft.teacher?.teachingClubs || ''} onChange={event => handleNestedChange('teacher', 'teachingClubs', event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Thành tích học trò</label>
                      <input type="text" className={baseInputClass} placeholder="Thành tích học trò" value={profileDraft.teacher?.studentAchievements || ''} onChange={event => handleNestedChange('teacher', 'studentAchievements', event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-full">
                      <label className="text-[13px] font-bold text-slate-700">Triết lý giảng dạy</label>
                      <textarea className={baseTextAreaClass} placeholder="Triết lý giảng dạy" value={profileDraft.teacher?.philosophy || ''} onChange={event => handleNestedChange('teacher', 'philosophy', event.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FactItem icon={BookOpen} label="Môn chính" value={profileUser.profile?.teacher?.mainSubject} />
                    <FactItem icon={Award} label="Chứng chỉ" value={profileUser.profile?.teacher?.certificates} />
                    <FactItem icon={Shield} label="Học vị / Sư thừa" value={profileUser.profile?.teacher?.degree} />
                    <FactItem icon={Calendar} label="Kinh nghiệm" value={profileUser.profile?.teacher?.teachingYears} />
                    
                    {(profileUser.profile?.teacher?.teachingClubs || profileUser.profile?.teacher?.studentAchievements || profileUser.profile?.teacher?.philosophy) && (
                      <div className="col-span-full mt-4 flex flex-col gap-4">
                        {profileUser.profile?.teacher?.teachingClubs && (
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="block text-[13px] font-bold text-slate-500 mb-1">CLB từng giảng dạy</span>
                            <p className="text-[14px] font-bold text-slate-900">{profileUser.profile.teacher.teachingClubs}</p>
                          </div>
                        )}
                        {profileUser.profile?.teacher?.studentAchievements && (
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="block text-[13px] font-bold text-slate-500 mb-1">Thành tích học trò</span>
                            <p className="text-[14px] font-bold text-slate-900">{profileUser.profile.teacher.studentAchievements}</p>
                          </div>
                        )}
                        {profileUser.profile?.teacher?.philosophy && (
                          <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl">
                            <span className="block text-[13px] font-bold text-amber-700 mb-2 uppercase tracking-wide">Triết lý giảng dạy</span>
                            <p className="text-[14px] text-amber-900 font-medium italic">"{profileUser.profile.teacher.philosophy}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Student Profile */}
            {role === 'student' && (
              <section className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-6 md:p-8">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Target size={20} className="text-blue-600" /> Hồ sơ học viên
                </h3>
                
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Ngày sinh</label>
                      <input type="text" className={baseInputClass} placeholder="Ngày sinh" value={profileDraft.student?.dob || ''} onChange={event => handleNestedChange('student', 'dob', event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Lớp đang học</label>
                      <input type="text" className={baseInputClass} placeholder="Lớp đang học" value={profileDraft.student?.className || ''} onChange={event => handleNestedChange('student', 'className', event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Sở trường</label>
                      <input type="text" className={baseInputClass} placeholder="Sở trường" value={profileDraft.student?.strengths || ''} onChange={event => handleNestedChange('student', 'strengths', event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-full">
                      <label className="text-[13px] font-bold text-slate-700">Mục tiêu ngắn hạn</label>
                      <input type="text" className={baseInputClass} placeholder="Mục tiêu ngắn hạn" value={profileDraft.student?.goalsShort || ''} onChange={event => handleNestedChange('student', 'goalsShort', event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-full">
                      <label className="text-[13px] font-bold text-slate-700">Mục tiêu dài hạn</label>
                      <input type="text" className={baseInputClass} placeholder="Mục tiêu dài hạn" value={profileDraft.student?.goalsLong || ''} onChange={event => handleNestedChange('student', 'goalsLong', event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-full">
                      <label className="text-[13px] font-bold text-slate-700">Nhận xét từ giáo viên</label>
                      <textarea className={baseTextAreaClass} placeholder="Nhận xét giáo viên" value={profileDraft.student?.teacherNote || ''} onChange={event => handleNestedChange('student', 'teacherNote', event.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FactItem icon={Calendar} label="Ngày sinh" value={profileUser.profile?.student?.dob} />
                    <FactItem icon={BookOpen} label="Lớp đang học" value={profileUser.profile?.student?.className} />
                    <FactItem icon={Award} label="Sở trường" value={profileUser.profile?.student?.strengths} />
                    
                    <div className="col-span-full mt-4 flex flex-col gap-4">
                      {(profileUser.profile?.student?.goalsShort || profileUser.profile?.student?.goalsLong) && (
                        <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl flex flex-col gap-3">
                          {profileUser.profile?.student?.goalsShort && (
                            <div>
                              <span className="block text-[12px] font-bold text-blue-700 uppercase tracking-wide mb-1">Mục tiêu ngắn hạn</span>
                              <p className="text-[14px] font-bold text-slate-900">{profileUser.profile.student.goalsShort}</p>
                            </div>
                          )}
                          {profileUser.profile?.student?.goalsLong && (
                            <div>
                              <span className="block text-[12px] font-bold text-blue-700 uppercase tracking-wide mb-1">Mục tiêu dài hạn</span>
                              <p className="text-[14px] font-bold text-slate-900">{profileUser.profile.student.goalsLong}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {profileUser.profile?.student?.teacherNote && (
                        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <span className="block text-[12px] font-bold text-emerald-700 uppercase tracking-wide mb-2">Nhận xét từ giáo viên</span>
                          <p className="text-[14px] text-emerald-900 font-medium leading-relaxed italic">"{profileUser.profile.student.teacherNote}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

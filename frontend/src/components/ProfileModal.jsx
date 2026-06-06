import './ProfileModal.css'

const ProfileModal = ({
  isOpen,
  mode,
  profileUser,
  profileDraft,
  isLoading,
  onClose,
  onEdit,
  onSave,
  onChange,
  isOwnProfile
}) => {
  if (!isOpen) {
    return null
  }

  const role = profileUser?.role || 'student'

  const handleFieldChange = (key, value) => {
    onChange({
      ...profileDraft,
      [key]: value
    })
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

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal card-panel" onClick={event => event.stopPropagation()}>
        <div className="profile-modal-header">
          <h3>Hồ sơ {role === 'teacher' ? 'giáo viên' : 'học viên'}</h3>
          <button className="btn-ghost" onClick={onClose}>Đóng</button>
        </div>

        {isLoading && <p>Đang tải hồ sơ...</p>}

        {!isLoading && !profileUser && <p>Chưa có thông tin hồ sơ.</p>}

        {!isLoading && profileUser && mode === 'view' && (
          <div className="profile-view">
            <div className="profile-hero">
              {profileUser.profile?.avatarUrl ? (
                <img src={profileUser.profile.avatarUrl} alt={profileUser.username} />
              ) : (
                <div className="profile-avatar">{profileUser.username?.slice(0, 1) || 'U'}</div>
              )}
              <div>
                <h4>{profileUser.profile?.displayName || profileUser.username}</h4>
                {profileUser.profile?.stageName && <p>Nghệ danh: {profileUser.profile.stageName}</p>}
                {profileUser.profile?.bio && <p>{profileUser.profile.bio}</p>}
              </div>
            </div>

            {role === 'teacher' && (
              <div className="profile-section">
                <h5>Thông tin giảng dạy</h5>
                <p>Môn giảng dạy chính: {profileUser.profile?.teacher?.mainSubject || 'Chưa có'}</p>
                <p>Chứng chỉ: {profileUser.profile?.teacher?.certificates || 'Chưa có'}</p>
                <p>Học vị / Sư thừa: {profileUser.profile?.teacher?.degree || 'Chưa có'}</p>
                <p>Kỷ lục cá nhân: {profileUser.profile?.teacher?.personalRecords || 'Chưa có'}</p>
                <p>Năm kinh nghiệm: {profileUser.profile?.teacher?.teachingYears || 'Chưa có'}</p>
                <p>CLB đã giảng dạy: {profileUser.profile?.teacher?.teachingClubs || 'Chưa có'}</p>
                <p>Thành tích học trò: {profileUser.profile?.teacher?.studentAchievements || 'Chưa có'}</p>
                <p>Triết lý: {profileUser.profile?.teacher?.philosophy || 'Chưa có'}</p>
              </div>
            )}

            {role === 'teacher' && (
              <div className="profile-section">
                <h5>Thông tin liên hệ</h5>
                <p>Số điện thoại: {profileUser.profile?.teacher?.phone || 'Chưa có'}</p>
                <p>Email: {profileUser.profile?.teacher?.email || 'Chưa có'}</p>
                <p>Fanpage: {profileUser.profile?.teacher?.fanpage || 'Chưa có'}</p>
                <p>Địa chỉ: {profileUser.profile?.teacher?.address || 'Chưa có'}</p>
              </div>
            )}

            {role === 'teacher' && profileUser.managedCourses?.length ? (
              <div className="profile-section">
                <h5>Lớp đang quản lý</h5>
                <ul>
                  {profileUser.managedCourses.map(course => (
                    <li key={course._id}>{course.title}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {role !== 'teacher' && (
              <div className="profile-section">
                <h5>Thông tin học viên</h5>
                <p>Ngày sinh: {profileUser.profile?.student?.dob || 'Chưa có'}</p>
                <p>Lớp đang học: {profileUser.profile?.student?.className || 'Chưa có'}</p>
                <p>Sở trường: {profileUser.profile?.student?.strengths || 'Chưa có'}</p>
                <p>Mục tiêu ngắn hạn: {profileUser.profile?.student?.goalsShort || 'Chưa có'}</p>
                <p>Mục tiêu dài hạn: {profileUser.profile?.student?.goalsLong || 'Chưa có'}</p>
                <p>Nhận xét giáo viên: {profileUser.profile?.student?.teacherNote || 'Chưa có'}</p>
              </div>
            )}

            {isOwnProfile && (
              <button className="btn-post" onClick={onEdit}>
                Cập nhật hồ sơ
              </button>
            )}
          </div>
        )}

        {!isLoading && profileUser && mode === 'edit' && (
          <div className="profile-edit">
            <div className="form-grid">
              <input
                type="text"
                placeholder="Họ và tên"
                value={profileDraft.displayName}
                onChange={event => handleFieldChange('displayName', event.target.value)}
              />
              <input
                type="text"
                placeholder="Pháp danh / Nghệ danh"
                value={profileDraft.stageName}
                onChange={event => handleFieldChange('stageName', event.target.value)}
              />
              <input
                type="text"
                placeholder="URL ảnh chân dung"
                value={profileDraft.avatarUrl}
                onChange={event => handleFieldChange('avatarUrl', event.target.value)}
              />
              <textarea
                rows="3"
                placeholder="Giới thiệu ngắn"
                value={profileDraft.bio}
                onChange={event => handleFieldChange('bio', event.target.value)}
              ></textarea>
            </div>

            {role === 'teacher' && (
              <div className="profile-section">
                <h5>Hồ sơ giáo viên</h5>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Môn giảng dạy chính"
                    value={profileDraft.teacher.mainSubject}
                    onChange={event => handleNestedChange('teacher', 'mainSubject', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Chứng chỉ huấn luyện"
                    value={profileDraft.teacher.certificates}
                    onChange={event => handleNestedChange('teacher', 'certificates', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Học vị / Sư thừa"
                    value={profileDraft.teacher.degree}
                    onChange={event => handleNestedChange('teacher', 'degree', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Kỷ lục cá nhân"
                    value={profileDraft.teacher.personalRecords}
                    onChange={event => handleNestedChange('teacher', 'personalRecords', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Năm kinh nghiệm"
                    value={profileDraft.teacher.teachingYears}
                    onChange={event => handleNestedChange('teacher', 'teachingYears', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="CLB đã giảng dạy"
                    value={profileDraft.teacher.teachingClubs}
                    onChange={event => handleNestedChange('teacher', 'teachingClubs', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Thành tích học trò"
                    value={profileDraft.teacher.studentAchievements}
                    onChange={event => handleNestedChange('teacher', 'studentAchievements', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Triết lý giảng dạy"
                    value={profileDraft.teacher.philosophy}
                    onChange={event => handleNestedChange('teacher', 'philosophy', event.target.value)}
                  />
                </div>
              </div>
            )}

            {role === 'teacher' && (
              <div className="profile-section">
                <h5>Liên hệ giáo viên</h5>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={profileDraft.teacher.phone}
                    onChange={event => handleNestedChange('teacher', 'phone', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Email"
                    value={profileDraft.teacher.email}
                    onChange={event => handleNestedChange('teacher', 'email', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Fanpage"
                    value={profileDraft.teacher.fanpage}
                    onChange={event => handleNestedChange('teacher', 'fanpage', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Địa chỉ"
                    value={profileDraft.teacher.address}
                    onChange={event => handleNestedChange('teacher', 'address', event.target.value)}
                  />
                </div>
              </div>
            )}

            {role !== 'teacher' && (
              <div className="profile-section">
                <h5>Hồ sơ học viên</h5>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Ngày sinh"
                    value={profileDraft.student.dob}
                    onChange={event => handleNestedChange('student', 'dob', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Lớp đang học"
                    value={profileDraft.student.className}
                    onChange={event => handleNestedChange('student', 'className', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Sở trường"
                    value={profileDraft.student.strengths}
                    onChange={event => handleNestedChange('student', 'strengths', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Mục tiêu ngắn hạn"
                    value={profileDraft.student.goalsShort}
                    onChange={event => handleNestedChange('student', 'goalsShort', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Mục tiêu dài hạn"
                    value={profileDraft.student.goalsLong}
                    onChange={event => handleNestedChange('student', 'goalsLong', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Nhận xét giáo viên"
                    value={profileDraft.student.teacherNote}
                    onChange={event => handleNestedChange('student', 'teacherNote', event.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="profile-actions">
              <button className="btn-post" onClick={onSave}>Lưu hồ sơ</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileModal

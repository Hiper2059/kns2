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
          <h3>Ho so {role === 'teacher' ? 'giao vien' : 'hoc vien'}</h3>
          <button className="btn-ghost" onClick={onClose}>Dong</button>
        </div>

        {isLoading && <p>Dang tai ho so...</p>}

        {!isLoading && !profileUser && <p>Chua co thong tin ho so.</p>}

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
                {profileUser.profile?.stageName && <p>Nghe danh: {profileUser.profile.stageName}</p>}
                {profileUser.profile?.bio && <p>{profileUser.profile.bio}</p>}
              </div>
            </div>

            {role === 'teacher' && (
              <div className="profile-section">
                <h5>Thong tin giang day</h5>
                <p>Mon giang day chinh: {profileUser.profile?.teacher?.mainSubject || 'Chua co'}</p>
                <p>Chung chi: {profileUser.profile?.teacher?.certificates || 'Chua co'}</p>
                <p>Hoc vi / Su thua: {profileUser.profile?.teacher?.degree || 'Chua co'}</p>
                <p>Ky luc ca nhan: {profileUser.profile?.teacher?.personalRecords || 'Chua co'}</p>
                <p>Nam kinh nghiem: {profileUser.profile?.teacher?.teachingYears || 'Chua co'}</p>
                <p>CLB da giang day: {profileUser.profile?.teacher?.teachingClubs || 'Chua co'}</p>
                <p>Thanh tich hoc tro: {profileUser.profile?.teacher?.studentAchievements || 'Chua co'}</p>
                <p>Triet ly: {profileUser.profile?.teacher?.philosophy || 'Chua co'}</p>
              </div>
            )}

            {role === 'teacher' && (
              <div className="profile-section">
                <h5>Thong tin lien he</h5>
                <p>So dien thoai: {profileUser.profile?.teacher?.phone || 'Chua co'}</p>
                <p>Email: {profileUser.profile?.teacher?.email || 'Chua co'}</p>
                <p>Fanpage: {profileUser.profile?.teacher?.fanpage || 'Chua co'}</p>
                <p>Dia chi: {profileUser.profile?.teacher?.address || 'Chua co'}</p>
              </div>
            )}

            {role === 'teacher' && profileUser.managedCourses?.length ? (
              <div className="profile-section">
                <h5>Lop dang quan ly</h5>
                <ul>
                  {profileUser.managedCourses.map(course => (
                    <li key={course._id}>{course.title}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {role !== 'teacher' && (
              <div className="profile-section">
                <h5>Thong tin hoc vien</h5>
                <p>Ngay sinh: {profileUser.profile?.student?.dob || 'Chua co'}</p>
                <p>Lop dang hoc: {profileUser.profile?.student?.className || 'Chua co'}</p>
                <p>So truong: {profileUser.profile?.student?.strengths || 'Chua co'}</p>
                <p>Muc tieu ngan han: {profileUser.profile?.student?.goalsShort || 'Chua co'}</p>
                <p>Muc tieu dai han: {profileUser.profile?.student?.goalsLong || 'Chua co'}</p>
                <p>Nhan xet giao vien: {profileUser.profile?.student?.teacherNote || 'Chua co'}</p>
              </div>
            )}

            {isOwnProfile && (
              <button className="btn-post" onClick={onEdit}>
                Cap nhat ho so
              </button>
            )}
          </div>
        )}

        {!isLoading && profileUser && mode === 'edit' && (
          <div className="profile-edit">
            <div className="form-grid">
              <input
                type="text"
                placeholder="Ho va ten"
                value={profileDraft.displayName}
                onChange={event => handleFieldChange('displayName', event.target.value)}
              />
              <input
                type="text"
                placeholder="Phap danh / Nghe danh"
                value={profileDraft.stageName}
                onChange={event => handleFieldChange('stageName', event.target.value)}
              />
              <input
                type="text"
                placeholder="URL anh chan dung"
                value={profileDraft.avatarUrl}
                onChange={event => handleFieldChange('avatarUrl', event.target.value)}
              />
              <textarea
                rows="3"
                placeholder="Gioi thieu ngan"
                value={profileDraft.bio}
                onChange={event => handleFieldChange('bio', event.target.value)}
              ></textarea>
            </div>

            {role === 'teacher' && (
              <div className="profile-section">
                <h5>Ho so giao vien</h5>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Mon giang day chinh"
                    value={profileDraft.teacher.mainSubject}
                    onChange={event => handleNestedChange('teacher', 'mainSubject', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Chung chi huan luyen"
                    value={profileDraft.teacher.certificates}
                    onChange={event => handleNestedChange('teacher', 'certificates', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Hoc vi / Su thua"
                    value={profileDraft.teacher.degree}
                    onChange={event => handleNestedChange('teacher', 'degree', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Ky luc ca nhan"
                    value={profileDraft.teacher.personalRecords}
                    onChange={event => handleNestedChange('teacher', 'personalRecords', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Nam kinh nghiem"
                    value={profileDraft.teacher.teachingYears}
                    onChange={event => handleNestedChange('teacher', 'teachingYears', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="CLB da giang day"
                    value={profileDraft.teacher.teachingClubs}
                    onChange={event => handleNestedChange('teacher', 'teachingClubs', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Thanh tich hoc tro"
                    value={profileDraft.teacher.studentAchievements}
                    onChange={event => handleNestedChange('teacher', 'studentAchievements', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Triet ly giang day"
                    value={profileDraft.teacher.philosophy}
                    onChange={event => handleNestedChange('teacher', 'philosophy', event.target.value)}
                  />
                </div>
              </div>
            )}

            {role === 'teacher' && (
              <div className="profile-section">
                <h5>Lien he giao vien</h5>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="So dien thoai"
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
                    placeholder="Dia chi"
                    value={profileDraft.teacher.address}
                    onChange={event => handleNestedChange('teacher', 'address', event.target.value)}
                  />
                </div>
              </div>
            )}

            {role !== 'teacher' && (
              <div className="profile-section">
                <h5>Ho so hoc vien</h5>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Ngay sinh"
                    value={profileDraft.student.dob}
                    onChange={event => handleNestedChange('student', 'dob', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Lop dang hoc"
                    value={profileDraft.student.className}
                    onChange={event => handleNestedChange('student', 'className', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="So truong"
                    value={profileDraft.student.strengths}
                    onChange={event => handleNestedChange('student', 'strengths', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Muc tieu ngan han"
                    value={profileDraft.student.goalsShort}
                    onChange={event => handleNestedChange('student', 'goalsShort', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Muc tieu dai han"
                    value={profileDraft.student.goalsLong}
                    onChange={event => handleNestedChange('student', 'goalsLong', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Nhan xet giao vien"
                    value={profileDraft.student.teacherNote}
                    onChange={event => handleNestedChange('student', 'teacherNote', event.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="profile-actions">
              <button className="btn-post" onClick={onSave}>Luu ho so</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileModal

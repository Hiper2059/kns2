import { useRef } from 'react'
import './ProfilePage.css'

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
      <section className="profile-page card-panel">
        <div className="profile-page__loading">Đang tải hồ sơ cá nhân...</div>
      </section>
    )
  }

  if (!profileUser) {
    return (
      <section className="profile-page card-panel">
        <div className="profile-page__empty">
          <h2>Chưa có hồ sơ</h2>
          <p>Hãy tạo hoặc cập nhật hồ sơ của cậu trước khi bắt đầu.</p>
          <button className="btn-post" onClick={onClose}>
            Quay lại trang chủ
          </button>
        </div>
      </section>
    )
  }

  const role = profileUser?.role || 'student'
  const displayName =
    profileDraft.displayName || profileUser.profile?.displayName || profileUser.username || currentUser || 'Tài khoản'
  const avatarUrl = profileDraft.avatarUrl || profileUser.profile?.avatarUrl || ''

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

  const openAvatarPicker = () => {
    if (!isOwnProfile || !isEditing) {
      return
    }
    avatarInputRef.current?.click()
  }

  const isEditing = mode === 'edit'

  return (
    <section className="profile-page">
      <div className="profile-page__shell">
        <aside className="profile-page__rail card-panel">
          <button className="profile-page__back" onClick={onClose}>
            ← Trở về
          </button>

          <div className={`profile-page__avatar-wrap ${isEditing ? 'is-editing' : ''}`}>
            <button
              className="profile-page__avatar"
              onClick={openAvatarPicker}
              type="button"
              disabled={!isOwnProfile || !isEditing}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} />
              ) : (
                <span>{displayName.slice(0, 1).toUpperCase()}</span>
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="profile-page__file"
              onChange={onAvatarChange}
            />
            {isOwnProfile && isEditing && <p className="profile-page__hint">Bấm vào avatar để đổi ảnh hồ sơ.</p>}
          </div>

          <div className="profile-page__identity">
            <span className="profile-page__role">{role}</span>
            <h1>{displayName}</h1>
            <p>@{profileUser.username}</p>
          </div>

          <div className="profile-page__meta">
            <div>
              <span>Trạng thái</span>
              <strong>{profileUser.status || 'active'}</strong>
            </div>
            <div>
              <span>Vai trò</span>
              <strong>{role}</strong>
            </div>
          </div>

          {isOwnProfile && (
            <div className="profile-page__actions">
              {isEditing ? (
                <button className="btn-post" onClick={onSave}>
                  Lưu hồ sơ
                </button>
              ) : (
                <button className="btn-post" onClick={onEdit}>
                  Chỉnh sửa hồ sơ
                </button>
              )}
            </div>
          )}
        </aside>

        <div className="profile-page__content">
          <div className="profile-page__hero card-panel">
            <div>
              <p className="profile-page__eyebrow">Hồ sơ cá nhân</p>
              <h2>Không gian của riêng cậu</h2>
              <p>
                Một trang hồ sơ tập trung, dễ mở rộng cho ảnh đại diện, thông tin cá nhân và dữ liệu vai trò.
              </p>
            </div>
            <div className="profile-page__hero-card">
              <span>Tài khoản</span>
              <strong>{profileUser.username}</strong>
            </div>
          </div>

          <div className="profile-page__grid">
            <section className="profile-page__card card-panel">
              <h3>Thông tin chung</h3>
              {isEditing ? (
                <div className="profile-page__form-grid">
                  <input
                    type="text"
                    placeholder="Tên hiển thị"
                    value={profileDraft.displayName}
                    onChange={event => handleFieldChange('displayName', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Pháp danh / Nghệ danh"
                    value={profileDraft.stageName}
                    onChange={event => handleFieldChange('stageName', event.target.value)}
                  />
                  <textarea
                    rows="4"
                    placeholder="Giới thiệu ngắn"
                    value={profileDraft.bio}
                    onChange={event => handleFieldChange('bio', event.target.value)}
                  />
                </div>
              ) : (
                <div className="profile-page__facts">
                  <p>
                    <span>Tên hiển thị</span>
                    <strong>{profileUser.profile?.displayName || 'Chưa cập nhật'}</strong>
                  </p>
                  <p>
                    <span>Pháp danh / Nghệ danh</span>
                    <strong>{profileUser.profile?.stageName || 'Chưa cập nhật'}</strong>
                  </p>
                  <p>
                    <span>Giới thiệu</span>
                    <strong>{profileUser.profile?.bio || 'Chưa cập nhật'}</strong>
                  </p>
                </div>
              )}
            </section>

            {(role === 'teacher' || role === 'admin') && (
              <section className="profile-page__card card-panel">
                <h3>Hồ sơ giảng dạy</h3>
                {isEditing ? (
                  <div className="profile-page__form-grid">
                    <input
                      type="text"
                      placeholder="Môn giảng dạy chính"
                      value={profileDraft.teacher.mainSubject}
                      onChange={event => handleNestedChange('teacher', 'mainSubject', event.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Chứng chỉ"
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
                      placeholder="Năm kinh nghiệm"
                      value={profileDraft.teacher.teachingYears}
                      onChange={event => handleNestedChange('teacher', 'teachingYears', event.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Câu lạc bộ từng giảng dạy"
                      value={profileDraft.teacher.teachingClubs}
                      onChange={event => handleNestedChange('teacher', 'teachingClubs', event.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Thành tích học trò"
                      value={profileDraft.teacher.studentAchievements}
                      onChange={event => handleNestedChange('teacher', 'studentAchievements', event.target.value)}
                    />
                    <textarea
                      rows="4"
                      placeholder="Triết lý giảng dạy"
                      value={profileDraft.teacher.philosophy}
                      onChange={event => handleNestedChange('teacher', 'philosophy', event.target.value)}
                    />
                  </div>
                ) : (
                  <div className="profile-page__facts">
                    <p>
                      <span>Môn chính</span>
                      <strong>{profileUser.profile?.teacher?.mainSubject || 'Chưa cập nhật'}</strong>
                    </p>
                    <p>
                      <span>Chứng chỉ</span>
                      <strong>{profileUser.profile?.teacher?.certificates || 'Chưa cập nhật'}</strong>
                    </p>
                    <p>
                      <span>Học vị / Sư thừa</span>
                      <strong>{profileUser.profile?.teacher?.degree || 'Chưa cập nhật'}</strong>
                    </p>
                    <p>
                      <span>Kinh nghiệm</span>
                      <strong>{profileUser.profile?.teacher?.teachingYears || 'Chưa cập nhật'}</strong>
                    </p>
                  </div>
                )}
              </section>
            )}

            {role === 'student' && (
              <section className="profile-page__card card-panel">
                <h3>Hồ sơ học viên</h3>
                {isEditing ? (
                  <div className="profile-page__form-grid">
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
                    <textarea
                      rows="4"
                      placeholder="Nhận xét giáo viên"
                      value={profileDraft.student.teacherNote}
                      onChange={event => handleNestedChange('student', 'teacherNote', event.target.value)}
                    />
                  </div>
                ) : (
                  <div className="profile-page__facts">
                    <p>
                      <span>Ngày sinh</span>
                      <strong>{profileUser.profile?.student?.dob || 'Chưa cập nhật'}</strong>
                    </p>
                    <p>
                      <span>Lớp đang học</span>
                      <strong>{profileUser.profile?.student?.className || 'Chưa cập nhật'}</strong>
                    </p>
                    <p>
                      <span>Sở trường</span>
                      <strong>{profileUser.profile?.student?.strengths || 'Chưa cập nhật'}</strong>
                    </p>
                    <p>
                      <span>Mục tiêu</span>
                      <strong>{profileUser.profile?.student?.goalsShort || 'Chưa cập nhật'}</strong>
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProfilePage

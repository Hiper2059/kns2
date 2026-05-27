import { useMemo, useState } from 'react'
import RichTextEditor from './RichTextEditor'
import './TeacherView.css'

const TeacherView = ({
  categories,
  courses,
  lessons,
  selectedCourseId,
  onSelectCourseId,
  newCourseData,
  onNewCourseDataChange,
  onCreateCourse,
  newLessonData,
  onNewLessonDataChange,
  onCreateLesson,
  editLessonId,
  editLessonData,
  onEditLessonStart,
  onEditLessonChange,
  onEditLessonCancel,
  onUpdateLesson,
  onUploadCourseEditorVideo,
  onUploadLessonEditorVideo,
  onUploadEditLessonEditorVideo
}) => {
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false)
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false)

  const selectedCourse = useMemo(
    () => courses.find(course => String(course._id) === String(selectedCourseId)),
    [courses, selectedCourseId]
  )

  return (
    <div className="teacher-view card-panel">
      <div className="teacher-panel card-panel">
        <h2>Khu vuc giang vien</h2>

        <div className="teacher-card card-panel">
          <button
            className="toggle-section-button"
            onClick={() => setIsCreateCourseOpen(prev => !prev)}
          >
            {isCreateCourseOpen ? 'An tao lop hoc moi' : 'Tao lop hoc moi'}
          </button>
          {isCreateCourseOpen && (
            <div className="form-grid">
              <input
                type="text"
                placeholder="Ten lop hoc"
                value={newCourseData.title}
                onChange={e => onNewCourseDataChange({ ...newCourseData, title: e.target.value })}
              />
              <select
                value={newCourseData.category}
                onChange={e => onNewCourseDataChange({ ...newCourseData, category: e.target.value })}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Anh minh hoa (URL - tuy chon)"
                value={newCourseData.imageUrl}
                onChange={e => onNewCourseDataChange({ ...newCourseData, imageUrl: e.target.value })}
              />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={e =>
                  onNewCourseDataChange({
                    ...newCourseData,
                    imageFile: e.target.files?.[0] || null
                  })
                }
              />
              <RichTextEditor
                toolbarId="course-editor-toolbar"
                value={newCourseData.description}
                onChange={value => onNewCourseDataChange({ ...newCourseData, description: value })}
                placeholder="Mo ta lop hoc"
              />
              <div className="editor-upload">
                <label>Upload video to content:</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={e => onUploadCourseEditorVideo?.(e.target.files?.[0] || null)}
                />
              </div>
              <button className="btn-post" onClick={onCreateCourse}>Tao lop hoc</button>
            </div>
          )}
        </div>

        <div className="teacher-card card-panel">
          <button
            className="toggle-section-button"
            onClick={() => setIsCreateLessonOpen(prev => !prev)}
          >
            {isCreateLessonOpen ? 'An tao bai hoc moi' : 'Tao bai hoc moi'}
          </button>
          {isCreateLessonOpen && (
            <div className="form-grid">
              <select
                value={selectedCourseId || ''}
                onChange={e => onSelectCourseId(e.target.value)}
              >
                <option value="">Chon lop hoc</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>{course.title}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Tieu de bai hoc"
                value={newLessonData.title}
                onChange={e => onNewLessonDataChange({ ...newLessonData, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Video URL"
                value={newLessonData.videoUrl}
                onChange={e => onNewLessonDataChange({ ...newLessonData, videoUrl: e.target.value })}
              />
              <input
                type="file"
                accept="video/*"
                onChange={e => onNewLessonDataChange({ ...newLessonData, videoFile: e.target.files?.[0] || null })}
              />
              <input
                type="text"
                placeholder="Anh minh hoa (URL - tuy chon)"
                value={newLessonData.imageUrl}
                onChange={e => onNewLessonDataChange({ ...newLessonData, imageUrl: e.target.value })}
              />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={e => onNewLessonDataChange({ ...newLessonData, imageFile: e.target.files?.[0] || null })}
              />
              <input
                type="number"
                placeholder="Thu tu bai"
                value={newLessonData.order}
                onChange={e => onNewLessonDataChange({ ...newLessonData, order: e.target.value })}
              />
              <RichTextEditor
                toolbarId="lesson-editor-toolbar"
                value={newLessonData.content}
                onChange={value => onNewLessonDataChange({ ...newLessonData, content: value })}
                placeholder="Noi dung bai hoc"
              />
              <div className="editor-upload">
                <label>Upload video to content:</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={e => onUploadLessonEditorVideo?.(e.target.files?.[0] || null)}
                />
              </div>
              <button className="btn-post" onClick={onCreateLesson}>Tao bai hoc</button>
            </div>
          )}
        </div>

        <div className="teacher-card card-panel">
          <h3>Bai hoc cua lop</h3>
          <div className="lesson-filter">
            <select
              value={selectedCourseId || ''}
              onChange={e => onSelectCourseId(e.target.value)}
            >
              <option value="">Chon lop hoc</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
            {selectedCourse && <span>{selectedCourse.title}</span>}
          </div>

          {selectedCourse && lessons.length ? (
            lessons.map(lesson => (
              <div key={lesson._id} className="lesson-row">
                <div className="lesson-meta">
                  <strong>{lesson.order}. {lesson.title}</strong>
                  <span>{lesson.videoUrl ? 'Co video' : 'Chua co video'}</span>
                  {lesson.content && (
                    <div className="rich-text" dangerouslySetInnerHTML={{ __html: lesson.content }}></div>
                  )}
                  <div className="lesson-actions">
                    <button className="btn-ghost" onClick={() => onEditLessonStart?.(lesson)}>
                      Sua bai
                    </button>
                  </div>
                </div>
                <div className="lesson-media">
                  {lesson.imageUrl ? (
                    <img src={lesson.imageUrl} alt={lesson.title} />
                  ) : (
                    <div className="lesson-media-placeholder">Anh bai hoc</div>
                  )}
                  {lesson.videoUrl && (
                    <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                      Xem video
                    </a>
                  )}
                </div>
                {editLessonId === lesson._id && (
                  <div className="lesson-edit-form">
                    <div className="form-grid">
                      <input
                        type="text"
                        placeholder="Tieu de bai hoc"
                        value={editLessonData.title}
                        onChange={e => onEditLessonChange({ ...editLessonData, title: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Video URL"
                        value={editLessonData.videoUrl}
                        onChange={e => onEditLessonChange({ ...editLessonData, videoUrl: e.target.value })}
                      />
                      <input
                        type="file"
                        accept="video/*"
                        onChange={e => onEditLessonChange({ ...editLessonData, videoFile: e.target.files?.[0] || null })}
                      />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={e =>
                          onEditLessonChange({
                            ...editLessonData,
                            imageFile: e.target.files?.[0] || null
                          })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Anh minh hoa (URL - tuy chon)"
                        value={editLessonData.imageUrl}
                        onChange={e => onEditLessonChange({ ...editLessonData, imageUrl: e.target.value })}
                      />
                      <input
                        type="number"
                        placeholder="Thu tu bai"
                        value={editLessonData.order}
                        onChange={e => onEditLessonChange({ ...editLessonData, order: e.target.value })}
                      />
                      <RichTextEditor
                        toolbarId={`lesson-edit-toolbar-${lesson._id}`}
                        value={editLessonData.content}
                        onChange={value => onEditLessonChange({ ...editLessonData, content: value })}
                        placeholder="Noi dung bai hoc"
                      />
                      <div className="editor-upload">
                        <label>Upload video to content:</label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={e => onUploadEditLessonEditorVideo?.(e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                    <div className="lesson-edit-actions">
                      <button className="btn-post" onClick={() => onUpdateLesson?.(lesson._id)}>
                        Luu cap nhat
                      </button>
                      <button className="btn-ghost" onClick={onEditLessonCancel}>
                        Huy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>Chon lop de xem bai hoc.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeacherView

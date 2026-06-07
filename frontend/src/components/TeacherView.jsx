import { useMemo, useState } from 'react'
import RichTextEditor from './RichTextEditor'
import './TeacherView.css'

const FormField = ({ label, hint, children, className = '', as = 'label' }) => {
  const FieldTag = as
  return (
    <FieldTag className={`form-field${className ? ` ${className}` : ''}`}>
      <span className="form-label">{label}</span>
      {hint && <span className="form-hint">{hint}</span>}
      {children}
    </FieldTag>
  )
}

const CreatePanel = ({ title, eyebrow, description, isOpen, onToggle, children }) => (
  <section className={`teacher-card create-panel${isOpen ? ' is-open' : ''}`}>
    <button type="button" className="toggle-section-button create-panel-toggle" onClick={onToggle} aria-expanded={isOpen}>
      <span>
        <span className="panel-eyebrow">{eyebrow}</span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="panel-toggle-mark">{isOpen ? 'Ẩn' : 'Mở'}</span>
    </button>
    {isOpen && <div className="create-panel-body">{children}</div>}
  </section>
)

const defaultQuestion = () => ({ question: '', options: ['', '', '', ''], correctOptionIndex: 0 })

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
  assignments,
  newAssignmentData,
  onNewAssignmentDataChange,
  onCreateAssignment,
  editAssignmentId,
  editAssignmentData,
  onEditAssignmentStart,
  onEditAssignmentChange,
  onEditAssignmentCancel,
  onUpdateAssignment,
  onDeleteAssignment,
  assignmentSubmissions,
  onLoadAssignmentSubmissions,
  onGradeSubmission,
  editLessonId,
  editLessonData,
  onEditLessonStart,
  onEditLessonChange,
  onEditLessonCancel,
  onUpdateLesson,
  onDeleteLesson,
  onUploadCourseEditorVideo,
  onUploadLessonEditorVideo,
  onUploadEditLessonEditorVideo
}) => {
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false)
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false)
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false)
  const [gradeDrafts, setGradeDrafts] = useState({})

  const selectedCourse = useMemo(
    () => courses.find(course => String(course._id) === String(selectedCourseId)),
    [courses, selectedCourseId]
  )

  const getQuestions = data => (Array.isArray(data.questions) && data.questions.length ? data.questions : [defaultQuestion()])

  const setQuestion = (data, onChange, questionIndex, patch) => {
    const questions = getQuestions(data).map((item, index) => (index === questionIndex ? { ...item, ...patch } : item))
    onChange({ ...data, type: 'quiz', questions })
  }

  const setOption = (data, onChange, questionIndex, optionIndex, value) => {
    const questions = getQuestions(data).map((item, index) => {
      if (index !== questionIndex) return item
      const options = [...(item.options || [])]
      while (options.length < 4) options.push('')
      options[optionIndex] = value
      return { ...item, options: options.slice(0, 4) }
    })
    onChange({ ...data, type: 'quiz', questions })
  }

  const addQuestion = (data, onChange) => {
    onChange({ ...data, type: 'quiz', questions: [...getQuestions(data), defaultQuestion()] })
  }

  const removeQuestion = (data, onChange, questionIndex) => {
    const questions = getQuestions(data).filter((_, index) => index !== questionIndex)
    onChange({ ...data, type: 'quiz', questions: questions.length ? questions : [defaultQuestion()] })
  }

  const renderQuizEditor = (data, onChange) => (
    <div className="quiz-builder">
      {getQuestions(data).map((item, questionIndex) => {
        const options = [...(item.options || [])]
        while (options.length < 4) options.push('')
        return (
          <div key={questionIndex} className="quiz-question-card">
            <div className="quiz-question-head">
              <strong>Câu {questionIndex + 1}</strong>
              <button type="button" className="btn-ghost" onClick={() => removeQuestion(data, onChange, questionIndex)}>
                Xóa câu
              </button>
            </div>
            <FormField label="Nội dung câu hỏi">
              <input
                type="text"
                placeholder="Ví dụ: Khi né đòn thẳng, bước đầu tiên là gì?"
                value={item.question || ''}
                onChange={event => setQuestion(data, onChange, questionIndex, { question: event.target.value })}
              />
            </FormField>
            <div className="quiz-options-grid">
              {options.slice(0, 4).map((option, optionIndex) => (
                <label key={optionIndex} className="quiz-option-field">
                  <span>Đáp án {optionIndex + 1}</span>
                  <input
                    type="text"
                    value={option}
                    onChange={event => setOption(data, onChange, questionIndex, optionIndex, event.target.value)}
                  />
                </label>
              ))}
            </div>
            <FormField label="Đáp án đúng">
              <select
                value={item.correctOptionIndex || 0}
                onChange={event => setQuestion(data, onChange, questionIndex, { correctOptionIndex: Number(event.target.value) })}
              >
                {options.slice(0, 4).map((_, optionIndex) => (
                  <option key={optionIndex} value={optionIndex}>Đáp án {optionIndex + 1}</option>
                ))}
              </select>
            </FormField>
          </div>
        )
      })}
      <button type="button" className="btn-post" onClick={() => addQuestion(data, onChange)}>Thêm câu hỏi</button>
    </div>
  )

  return (
    <div className="teacher-view card-panel">
      <div className="teacher-panel card-panel">
        <header className="teacher-hero">
          <div>
            <span className="teacher-kicker">Studio giảng viên</span>
            <h2>Khu vực giảng viên</h2>
            <p>Tạo lớp, soạn bài giảng và xây bộ câu hỏi trắc nghiệm cho học viên.</p>
          </div>
        </header>

        <CreatePanel
          eyebrow="01"
          title="Tạo lớp học"
          description="Thiết lập tên lớp, chủ đề, ảnh đại diện và mô tả khóa học."
          isOpen={isCreateCourseOpen}
          onToggle={() => setIsCreateCourseOpen(prev => !prev)}
        >
          <div className="form-section">
            <div className="form-grid">
              <FormField label="Tên lớp học">
                <input type="text" value={newCourseData.title} onChange={event => onNewCourseDataChange({ ...newCourseData, title: event.target.value })} />
              </FormField>
              <FormField label="Chủ đề">
                <select value={newCourseData.category} onChange={event => onNewCourseDataChange({ ...newCourseData, category: event.target.value })}>
                  {categories.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </FormField>
              <FormField label="Ảnh URL">
                <input type="text" placeholder="https://..." value={newCourseData.imageUrl} onChange={event => onNewCourseDataChange({ ...newCourseData, imageUrl: event.target.value })} />
              </FormField>
              <FormField label="Upload ảnh">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => onNewCourseDataChange({ ...newCourseData, imageFile: event.target.files?.[0] || null })} />
              </FormField>
            </div>
            <FormField label="Mô tả lớp học" as="div" className="form-field-full">
              <RichTextEditor
                toolbarId="course-editor-toolbar"
                value={newCourseData.description}
                onChange={value => onNewCourseDataChange({ ...newCourseData, description: value })}
                placeholder="Mô tả lớp học"
              />
            </FormField>
            <FormField label="Chèn video vào mô tả" className="editor-upload">
              <input type="file" accept="video/*" onChange={event => onUploadCourseEditorVideo?.(event.target.files?.[0] || null)} />
            </FormField>
          </div>
          <div className="form-actions">
            <span>Kiểm tra lại thông tin trước khi tạo lớp.</span>
            <button type="button" className="btn-post" onClick={onCreateCourse}>Tạo lớp học</button>
          </div>
        </CreatePanel>

        <CreatePanel
          eyebrow="02"
          title="Tạo bài giảng"
          description="Soạn bài học mới cho lớp đã chọn, kèm video và ảnh minh họa."
          isOpen={isCreateLessonOpen}
          onToggle={() => setIsCreateLessonOpen(prev => !prev)}
        >
          <div className="form-section">
            <div className="form-grid form-grid-compact">
              <FormField label="Lớp học">
                <select value={selectedCourseId || ''} onChange={event => onSelectCourseId(event.target.value)}>
                  <option value="">Chọn lớp học</option>
                  {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
                </select>
              </FormField>
              <FormField label="Tiêu đề bài giảng">
                <input type="text" value={newLessonData.title} onChange={event => onNewLessonDataChange({ ...newLessonData, title: event.target.value })} />
              </FormField>
              <FormField label="Thứ tự bài">
                <input type="number" value={newLessonData.order} onChange={event => onNewLessonDataChange({ ...newLessonData, order: event.target.value })} />
              </FormField>
            </div>
            <div className="form-grid">
              <FormField label="Video URL">
                <input type="text" placeholder="https://..." value={newLessonData.videoUrl} onChange={event => onNewLessonDataChange({ ...newLessonData, videoUrl: event.target.value })} />
              </FormField>
              <FormField label="Upload video">
                <input type="file" accept="video/*" onChange={event => onNewLessonDataChange({ ...newLessonData, videoFile: event.target.files?.[0] || null })} />
              </FormField>
              <FormField label="Ảnh URL">
                <input type="text" placeholder="https://..." value={newLessonData.imageUrl} onChange={event => onNewLessonDataChange({ ...newLessonData, imageUrl: event.target.value })} />
              </FormField>
              <FormField label="Upload ảnh">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => onNewLessonDataChange({ ...newLessonData, imageFile: event.target.files?.[0] || null })} />
              </FormField>
            </div>
            <FormField label="Nội dung bài giảng" as="div" className="form-field-full">
              <RichTextEditor
                toolbarId="lesson-editor-toolbar"
                value={newLessonData.content}
                onChange={value => onNewLessonDataChange({ ...newLessonData, content: value })}
                placeholder="Nội dung bài học"
              />
            </FormField>
            <FormField label="Chèn video vào nội dung" className="editor-upload">
              <input type="file" accept="video/*" onChange={event => onUploadLessonEditorVideo?.(event.target.files?.[0] || null)} />
            </FormField>
          </div>
          <div className="form-actions">
            <span>{selectedCourse ? `Đang tạo bài cho lớp ${selectedCourse.title}.` : 'Chọn lớp học trước khi tạo bài.'}</span>
            <button type="button" className="btn-post" onClick={onCreateLesson}>Tạo bài giảng</button>
          </div>
        </CreatePanel>

        <CreatePanel
          eyebrow="03"
          title="Tạo câu hỏi trắc nghiệm"
          description="Tạo nhiều câu hỏi cho một bài kiểm tra trong lớp đã chọn."
          isOpen={isCreateAssignmentOpen}
          onToggle={() => setIsCreateAssignmentOpen(prev => !prev)}
        >
          <div className="form-section">
            <div className="form-grid">
              <FormField label="Lớp học">
                <select value={newAssignmentData.courseId || ''} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, courseId: event.target.value, type: 'quiz' })}>
                  <option value="">Chọn lớp học</option>
                  {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
                </select>
              </FormField>
              <FormField label="Tên bài trắc nghiệm">
                <input type="text" value={newAssignmentData.title} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, title: event.target.value, type: 'quiz' })} />
              </FormField>
              <FormField label="Hạn làm bài">
                <input type="datetime-local" value={newAssignmentData.dueAt} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, dueAt: event.target.value, type: 'quiz' })} />
              </FormField>
            </div>
            <FormField label="Ghi chú cho học viên" className="form-field-full">
              <textarea value={newAssignmentData.description} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, description: event.target.value, type: 'quiz' })} />
            </FormField>
            {renderQuizEditor(newAssignmentData, onNewAssignmentDataChange)}
          </div>
          <div className="form-actions">
            <span>Mỗi câu cần tối thiểu 2 đáp án và chọn 1 đáp án đúng.</span>
            <button type="button" className="btn-post" onClick={onCreateAssignment}>Tạo bài trắc nghiệm</button>
          </div>
        </CreatePanel>

        <section className="teacher-card content-panel">
          <div className="content-panel-head">
            <div>
              <span className="panel-eyebrow">Quản lý nội dung</span>
              <h3>Bài giảng của lớp</h3>
            </div>
            <div className="lesson-filter">
              <select value={selectedCourseId || ''} onChange={event => onSelectCourseId(event.target.value)}>
                <option value="">Chọn lớp học</option>
                {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
              </select>
              {selectedCourse && <span>{selectedCourse.title}</span>}
            </div>
          </div>

          {selectedCourse && lessons.length ? lessons.map(lesson => (
            <div key={lesson._id} className="lesson-row">
              <div className="lesson-meta">
                <strong>{lesson.order}. {lesson.title}</strong>
                <span>{lesson.videoUrl ? 'Có video' : 'Chưa có video'}</span>
                {lesson.content && <div className="rich-text" dangerouslySetInnerHTML={{ __html: lesson.content }} />}
                <div className="lesson-actions">
                  <button className="btn-ghost" onClick={() => onEditLessonStart?.(lesson)}>Sửa bài</button>
                  <button className="btn-danger" onClick={() => onDeleteLesson?.(lesson._id)}>Xóa bài</button>
                </div>
              </div>
              <div className="lesson-media">
                {lesson.imageUrl ? <img src={lesson.imageUrl} alt={lesson.title} /> : <div className="lesson-media-placeholder">Ảnh bài học</div>}
                {lesson.videoUrl && <a href={lesson.videoUrl} target="_blank" rel="noreferrer">Xem video</a>}
              </div>
              {editLessonId === lesson._id && (
                <div className="lesson-edit-form">
                  <div className="form-grid">
                    <FormField label="Tiêu đề bài giảng">
                      <input type="text" value={editLessonData.title} onChange={event => onEditLessonChange({ ...editLessonData, title: event.target.value })} />
                    </FormField>
                    <FormField label="Video URL">
                      <input type="text" value={editLessonData.videoUrl} onChange={event => onEditLessonChange({ ...editLessonData, videoUrl: event.target.value })} />
                    </FormField>
                    <FormField label="Upload video">
                      <input type="file" accept="video/*" onChange={event => onEditLessonChange({ ...editLessonData, videoFile: event.target.files?.[0] || null })} />
                    </FormField>
                    <FormField label="Ảnh URL">
                      <input type="text" value={editLessonData.imageUrl} onChange={event => onEditLessonChange({ ...editLessonData, imageUrl: event.target.value })} />
                    </FormField>
                    <FormField label="Upload ảnh">
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => onEditLessonChange({ ...editLessonData, imageFile: event.target.files?.[0] || null })} />
                    </FormField>
                    <FormField label="Thứ tự bài">
                      <input type="number" value={editLessonData.order} onChange={event => onEditLessonChange({ ...editLessonData, order: event.target.value })} />
                    </FormField>
                    <FormField label="Nội dung bài giảng" as="div" className="form-field-full">
                      <RichTextEditor
                        toolbarId={`lesson-edit-toolbar-${lesson._id}`}
                        value={editLessonData.content}
                        onChange={value => onEditLessonChange({ ...editLessonData, content: value })}
                        placeholder="Nội dung bài học"
                      />
                    </FormField>
                    <FormField label="Chèn video vào nội dung" className="editor-upload">
                      <input type="file" accept="video/*" onChange={event => onUploadEditLessonEditorVideo?.(event.target.files?.[0] || null)} />
                    </FormField>
                  </div>
                  <div className="lesson-edit-actions">
                    <button className="btn-post" onClick={() => onUpdateLesson?.(lesson._id)}>Lưu cập nhật</button>
                    <button className="btn-ghost" onClick={onEditLessonCancel}>Hủy</button>
                  </div>
                </div>
              )}
            </div>
          )) : <p className="teacher-empty">Chọn lớp để xem bài giảng.</p>}
        </section>

        <section className="teacher-card content-panel">
          <div className="content-panel-head">
            <div>
              <span className="panel-eyebrow">Trắc nghiệm</span>
              <h3>Bài trắc nghiệm của lớp</h3>
            </div>
            <div className="lesson-filter">
              <select value={selectedCourseId || ''} onChange={event => onSelectCourseId(event.target.value)}>
                <option value="">Chọn lớp học</option>
                {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
              </select>
              {selectedCourse && <span>{selectedCourse.title}</span>}
            </div>
          </div>

          {selectedCourse && assignments?.length ? assignments.map(assignment => (
            <div key={assignment._id} className="assignment-row">
              <div>
                <strong>{assignment.title}</strong>
                <p>{assignment.description || 'Chưa có ghi chú.'}</p>
                <span className="assignment-due">{assignment.type === 'quiz' ? `${assignment.questions?.length || 0} câu hỏi` : 'Bài tập text'}</span>
                {assignment.dueAt && <span className="assignment-due">Hạn: {new Date(assignment.dueAt).toLocaleString()}</span>}
                <div className="lesson-actions">
                  <button className="btn-ghost" onClick={() => onEditAssignmentStart?.(assignment)}>Sửa trắc nghiệm</button>
                  <button className="btn-danger" onClick={() => onDeleteAssignment?.(assignment._id)}>Xóa</button>
                  <button className="btn-ghost" onClick={() => onLoadAssignmentSubmissions?.(assignment._id)}>Xem bài nộp</button>
                </div>
              </div>

              {editAssignmentId === assignment._id && (
                <div className="assignment-edit-form">
                  <div className="form-grid">
                    <FormField label="Tên bài trắc nghiệm">
                      <input type="text" value={editAssignmentData.title} onChange={event => onEditAssignmentChange({ ...editAssignmentData, title: event.target.value, type: 'quiz' })} />
                    </FormField>
                    <FormField label="Hạn làm bài">
                      <input type="datetime-local" value={editAssignmentData.dueAt} onChange={event => onEditAssignmentChange({ ...editAssignmentData, dueAt: event.target.value, type: 'quiz' })} />
                    </FormField>
                    <FormField label="Ghi chú" className="form-field-full">
                      <textarea value={editAssignmentData.description} onChange={event => onEditAssignmentChange({ ...editAssignmentData, description: event.target.value, type: 'quiz' })} />
                    </FormField>
                  </div>
                  {renderQuizEditor(editAssignmentData, onEditAssignmentChange)}
                  <div className="lesson-edit-actions">
                    <button className="btn-post" onClick={() => onUpdateAssignment?.(assignment._id)}>Lưu cập nhật</button>
                    <button className="btn-ghost" onClick={onEditAssignmentCancel}>Hủy</button>
                  </div>
                </div>
              )}

              {assignmentSubmissions?.[assignment._id]?.length ? (
                <div className="assignment-submissions">
                  {assignmentSubmissions[assignment._id].map(submission => (
                    <div key={submission._id} className="assignment-submission-item">
                      <div>
                        <strong>{submission.studentName || 'Học viên'}</strong>
                        <p>{submission.content || 'Không có nội dung.'}</p>
                        <span className="assignment-status">{submission.status === 'graded' ? `Đã chấm · Điểm ${submission.score ?? '-'}` : 'Chưa chấm'}</span>
                      </div>
                      <div className="assignment-grade">
                        <FormField label="Điểm">
                          <input
                            type="number"
                            value={gradeDrafts[submission._id]?.score ?? submission.score ?? ''}
                            onChange={event => setGradeDrafts(prev => ({
                              ...prev,
                              [submission._id]: {
                                score: event.target.value,
                                feedback: prev[submission._id]?.feedback ?? submission.feedback ?? ''
                              }
                            }))}
                          />
                        </FormField>
                        <FormField label="Nhận xét">
                          <textarea
                            value={gradeDrafts[submission._id]?.feedback ?? submission.feedback ?? ''}
                            onChange={event => setGradeDrafts(prev => ({
                              ...prev,
                              [submission._id]: {
                                score: prev[submission._id]?.score ?? submission.score ?? '',
                                feedback: event.target.value
                              }
                            }))}
                          />
                        </FormField>
                        <button
                          className="btn-post"
                          onClick={() => onGradeSubmission?.(submission._id, {
                            score: gradeDrafts[submission._id]?.score ?? submission.score ?? '',
                            feedback: gradeDrafts[submission._id]?.feedback ?? submission.feedback ?? ''
                          })}
                        >
                          Chấm bài
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )) : <p className="teacher-empty">Chọn lớp để xem bài trắc nghiệm.</p>}
        </section>
      </div>
    </div>
  )
}

export default TeacherView

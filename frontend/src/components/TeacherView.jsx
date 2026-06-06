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
    <button
      type="button"
      className="toggle-section-button create-panel-toggle"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
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

  return (
    <div className="teacher-view card-panel">
      <div className="teacher-panel card-panel">
        <header className="teacher-hero">
          <div>
            <span className="teacher-kicker">Studio giảng viên</span>
            <h2>Khu vực giảng viên</h2>
            <p>Tạo lớp, soạn bài giảng và quản lý bài tập theo một luồng rõ ràng.</p>
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
            <div className="form-section-head">
              <span>Thông tin chính</span>
              <p>Những thông tin học viên nhìn thấy đầu tiên khi chọn lớp.</p>
            </div>
            <div className="form-grid">
              <FormField label="Tên lớp học" hint="Ngắn gọn, dễ nhớ và đúng nội dung lớp.">
                <input
                  type="text"
                  placeholder="Ví dụ: Võ thuật căn bản cho người mới"
                  value={newCourseData.title}
                  onChange={e => onNewCourseDataChange({ ...newCourseData, title: e.target.value })}
                />
              </FormField>
              <FormField label="Chủ đề" hint="Dùng để phân loại lớp trong LMS.">
                <select
                  value={newCourseData.category}
                  onChange={e => onNewCourseDataChange({ ...newCourseData, category: e.target.value })}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-head">
              <span>Ảnh đại diện</span>
              <p>Dùng URL hoặc tải ảnh lên. Nên chọn ảnh ngang, rõ chủ thể.</p>
            </div>
            <div className="form-grid">
              <FormField label="Ảnh minh họa URL" hint="Tùy chọn nếu bạn đã có link ảnh.">
                <input
                  type="text"
                  placeholder="https://..."
                  value={newCourseData.imageUrl}
                  onChange={e => onNewCourseDataChange({ ...newCourseData, imageUrl: e.target.value })}
                />
              </FormField>
              <FormField label="Tải ảnh lên" hint="PNG, JPG hoặc WebP.">
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
              </FormField>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-head">
              <span>Mô tả lớp học</span>
              <p>Viết mục tiêu, nội dung chính và học viên phù hợp.</p>
            </div>
            <FormField label="Nội dung mô tả" hint="Có thể thêm định dạng, ảnh hoặc video trong editor." as="div">
              <RichTextEditor
                toolbarId="course-editor-toolbar"
                value={newCourseData.description}
                onChange={value => onNewCourseDataChange({ ...newCourseData, description: value })}
                placeholder="Mô tả lớp học"
              />
            </FormField>
            <FormField label="Chèn video vào mô tả" hint="Video sẽ được upload và chèn vào nội dung editor." className="editor-upload">
              <input
                type="file"
                accept="video/*"
                onChange={e => onUploadCourseEditorVideo?.(e.target.files?.[0] || null)}
              />
            </FormField>
          </div>

          <div className="form-actions">
            <span>Kiểm tra lại tên lớp, chủ đề và mô tả trước khi tạo.</span>
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
            <div className="form-section-head">
              <span>Lớp và tiêu đề</span>
              <p>Chọn lớp trước để bài giảng nằm đúng chương trình học.</p>
            </div>
            <div className="form-grid form-grid-compact">
              <FormField label="Lớp học" hint="Bài giảng sẽ thuộc lớp này.">
                <select
                  value={selectedCourseId || ''}
                  onChange={e => onSelectCourseId(e.target.value)}
                >
                  <option value="">Chọn lớp học</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>{course.title}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Tiêu đề bài giảng" hint="Rõ nội dung, dễ tìm trong danh sách bài học.">
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 1 - Khởi động và thế đứng"
                  value={newLessonData.title}
                  onChange={e => onNewLessonDataChange({ ...newLessonData, title: e.target.value })}
                />
              </FormField>
              <FormField label="Thứ tự bài" hint="Số nhỏ hiển thị trước trong lớp.">
                <input
                  type="number"
                  placeholder="1"
                  value={newLessonData.order}
                  onChange={e => onNewLessonDataChange({ ...newLessonData, order: e.target.value })}
                />
              </FormField>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-head">
              <span>Video và ảnh</span>
              <p>Dùng link có sẵn hoặc upload file trực tiếp.</p>
            </div>
            <div className="form-grid">
              <FormField label="Video URL" hint="YouTube, Vimeo hoặc link video đã host.">
                <input
                  type="text"
                  placeholder="https://..."
                  value={newLessonData.videoUrl}
                  onChange={e => onNewLessonDataChange({ ...newLessonData, videoUrl: e.target.value })}
                />
              </FormField>
              <FormField label="Upload video" hint="Tùy chọn nếu chưa có URL.">
                <input
                  type="file"
                  accept="video/*"
                  onChange={e => onNewLessonDataChange({ ...newLessonData, videoFile: e.target.files?.[0] || null })}
                />
              </FormField>
              <FormField label="Ảnh minh họa URL" hint="Ảnh hiển thị ở danh sách bài học.">
                <input
                  type="text"
                  placeholder="https://..."
                  value={newLessonData.imageUrl}
                  onChange={e => onNewLessonDataChange({ ...newLessonData, imageUrl: e.target.value })}
                />
              </FormField>
              <FormField label="Upload ảnh" hint="PNG, JPG hoặc WebP.">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={e => onNewLessonDataChange({ ...newLessonData, imageFile: e.target.files?.[0] || null })}
                />
              </FormField>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-head">
              <span>Nội dung bài giảng</span>
              <p>Thêm mục tiêu, bước thực hành, lưu ý kỹ thuật và tài liệu kèm theo.</p>
            </div>
            <FormField label="Nội dung" hint="Editor hỗ trợ định dạng, ảnh, video, link và danh sách." as="div">
              <RichTextEditor
                toolbarId="lesson-editor-toolbar"
                value={newLessonData.content}
                onChange={value => onNewLessonDataChange({ ...newLessonData, content: value })}
                placeholder="Nội dung bài học"
              />
            </FormField>
            <FormField label="Chèn video vào nội dung" hint="Video sẽ được upload và chèn vào editor." className="editor-upload">
              <input
                type="file"
                accept="video/*"
                onChange={e => onUploadLessonEditorVideo?.(e.target.files?.[0] || null)}
              />
            </FormField>
          </div>

          <div className="form-actions">
            <span>{selectedCourse ? `Đang tạo bài cho lớp ${selectedCourse.title}.` : 'Chọn lớp học trước khi tạo bài.'}</span>
            <button type="button" className="btn-post" onClick={onCreateLesson}>Tạo bài giảng</button>
          </div>
        </CreatePanel>

        <CreatePanel
          eyebrow="03"
          title="Tạo bài tập"
          description="Giao bài tập dạng text, đặt hạn nộp và mô tả yêu cầu rõ ràng."
          isOpen={isCreateAssignmentOpen}
          onToggle={() => setIsCreateAssignmentOpen(prev => !prev)}
        >
          <div className="form-section">
            <div className="form-section-head">
              <span>Thông tin bài tập</span>
              <p>Yêu cầu càng rõ thì học viên càng dễ nộp đúng.</p>
            </div>
            <div className="form-grid">
              <FormField label="Lớp học" hint="Bài tập chỉ hiện trong lớp này.">
                <select
                  value={newAssignmentData.courseId || ''}
                  onChange={e => onNewAssignmentDataChange({ ...newAssignmentData, courseId: e.target.value })}
                >
                  <option value="">Chọn lớp học</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>{course.title}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Tiêu đề bài tập" hint="Ví dụ: Nhật ký luyện tập tuần 1.">
                <input
                  type="text"
                  placeholder="Tiêu đề bài tập"
                  value={newAssignmentData.title}
                  onChange={e => onNewAssignmentDataChange({ ...newAssignmentData, title: e.target.value })}
                />
              </FormField>
              <FormField label="Hạn nộp" hint="Có thể để trống nếu chưa cần khóa thời gian.">
                <input
                  type="datetime-local"
                  value={newAssignmentData.dueAt}
                  onChange={e => onNewAssignmentDataChange({ ...newAssignmentData, dueAt: e.target.value })}
                />
              </FormField>
            </div>
            <FormField label="Mô tả yêu cầu" hint="Nêu nội dung cần nộp, tiêu chí chấm và độ dài mong muốn." className="form-field-full">
              <textarea
                placeholder="Mô tả bài tập"
                value={newAssignmentData.description}
                onChange={e => onNewAssignmentDataChange({ ...newAssignmentData, description: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-actions">
            <span>Học viên sẽ nộp bài bằng nội dung text.</span>
            <button type="button" className="btn-post" onClick={onCreateAssignment}>Tạo bài tập</button>
          </div>
        </CreatePanel>

        <section className="teacher-card content-panel">
          <div className="content-panel-head">
            <div>
              <span className="panel-eyebrow">Quản lý nội dung</span>
              <h3>Bài giảng của lớp</h3>
            </div>
            <div className="lesson-filter">
              <select
                value={selectedCourseId || ''}
                onChange={e => onSelectCourseId(e.target.value)}
                aria-label="Chọn lớp để xem bài giảng"
              >
                <option value="">Chọn lớp học</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>{course.title}</option>
                ))}
              </select>
              {selectedCourse && <span>{selectedCourse.title}</span>}
            </div>
          </div>

          {selectedCourse && lessons.length ? (
            lessons.map(lesson => (
              <div key={lesson._id} className="lesson-row">
                <div className="lesson-meta">
                  <strong>{lesson.order}. {lesson.title}</strong>
                  <span>{lesson.videoUrl ? 'Có video' : 'Chưa có video'}</span>
                  {lesson.content && (
                    <div className="rich-text" dangerouslySetInnerHTML={{ __html: lesson.content }}></div>
                  )}
                  <div className="lesson-actions">
                    <button className="btn-ghost" onClick={() => onEditLessonStart?.(lesson)}>
                      Sửa bài
                    </button>
                    <button className="btn-danger" onClick={() => onDeleteLesson?.(lesson._id)}>
                      Xóa bài
                    </button>
                  </div>
                </div>
                <div className="lesson-media">
                  {lesson.imageUrl ? (
                    <img src={lesson.imageUrl} alt={lesson.title} />
                  ) : (
                    <div className="lesson-media-placeholder">Ảnh bài học</div>
                  )}
                  {lesson.videoUrl && (
                    <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                      Xem video
                    </a>
                  )}
                </div>
                {editLessonId === lesson._id && (
                  <div className="lesson-edit-form">
                    <div className="form-section-head">
                      <span>Chỉnh sửa bài giảng</span>
                      <p>Cập nhật thông tin chính, media và nội dung bài học.</p>
                    </div>
                    <div className="form-grid">
                      <FormField label="Tiêu đề bài giảng">
                        <input
                          type="text"
                          placeholder="Tiêu đề bài học"
                          value={editLessonData.title}
                          onChange={e => onEditLessonChange({ ...editLessonData, title: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Video URL">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={editLessonData.videoUrl}
                          onChange={e => onEditLessonChange({ ...editLessonData, videoUrl: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Upload video">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={e => onEditLessonChange({ ...editLessonData, videoFile: e.target.files?.[0] || null })}
                        />
                      </FormField>
                      <FormField label="Upload ảnh">
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
                      </FormField>
                      <FormField label="Ảnh minh họa URL">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={editLessonData.imageUrl}
                          onChange={e => onEditLessonChange({ ...editLessonData, imageUrl: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Thứ tự bài">
                        <input
                          type="number"
                          placeholder="1"
                          value={editLessonData.order}
                          onChange={e => onEditLessonChange({ ...editLessonData, order: e.target.value })}
                        />
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
                        <input
                          type="file"
                          accept="video/*"
                          onChange={e => onUploadEditLessonEditorVideo?.(e.target.files?.[0] || null)}
                        />
                      </FormField>
                    </div>
                    <div className="lesson-edit-actions">
                      <button className="btn-post" onClick={() => onUpdateLesson?.(lesson._id)}>
                        Lưu cập nhật
                      </button>
                      <button className="btn-ghost" onClick={onEditLessonCancel}>
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="teacher-empty">Chọn lớp để xem bài giảng.</p>
          )}
        </section>

        <section className="teacher-card content-panel">
          <div className="content-panel-head">
            <div>
              <span className="panel-eyebrow">Bài tập text</span>
              <h3>Bài tập của lớp</h3>
            </div>
            <div className="lesson-filter">
              <select
                value={selectedCourseId || ''}
                onChange={e => onSelectCourseId(e.target.value)}
                aria-label="Chọn lớp để xem bài tập"
              >
                <option value="">Chọn lớp học</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>{course.title}</option>
                ))}
              </select>
              {selectedCourse && <span>{selectedCourse.title}</span>}
            </div>
          </div>

          {selectedCourse && assignments?.length ? (
            assignments.map(assignment => (
              <div key={assignment._id} className="assignment-row">
                <div>
                  <strong>{assignment.title}</strong>
                  <p>{assignment.description || 'Chưa có mô tả.'}</p>
                  {assignment.dueAt && (
                    <span className="assignment-due">Hạn: {new Date(assignment.dueAt).toLocaleString()}</span>
                  )}
                  <div className="lesson-actions">
                    <button className="btn-ghost" onClick={() => onEditAssignmentStart?.(assignment)}>
                      Sửa bài tập
                    </button>
                    <button className="btn-danger" onClick={() => onDeleteAssignment?.(assignment._id)}>
                      Xóa bài tập
                    </button>
                    <button className="btn-ghost" onClick={() => onLoadAssignmentSubmissions?.(assignment._id)}>
                      Xem bài nộp
                    </button>
                  </div>
                </div>

                {editAssignmentId === assignment._id && (
                  <div className="assignment-edit-form">
                    <div className="form-section-head">
                      <span>Chỉnh sửa bài tập</span>
                      <p>Cập nhật tiêu đề, hạn nộp và mô tả yêu cầu.</p>
                    </div>
                    <div className="form-grid">
                      <FormField label="Tiêu đề bài tập">
                        <input
                          type="text"
                          placeholder="Tiêu đề bài tập"
                          value={editAssignmentData.title}
                          onChange={e => onEditAssignmentChange({ ...editAssignmentData, title: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Hạn nộp">
                        <input
                          type="datetime-local"
                          value={editAssignmentData.dueAt}
                          onChange={e => onEditAssignmentChange({ ...editAssignmentData, dueAt: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Mô tả yêu cầu" className="form-field-full">
                        <textarea
                          placeholder="Mô tả bài tập"
                          value={editAssignmentData.description}
                          onChange={e => onEditAssignmentChange({ ...editAssignmentData, description: e.target.value })}
                        />
                      </FormField>
                    </div>
                    <div className="lesson-edit-actions">
                      <button className="btn-post" onClick={() => onUpdateAssignment?.(assignment._id)}>
                        Lưu cập nhật
                      </button>
                      <button className="btn-ghost" onClick={onEditAssignmentCancel}>
                        Hủy
                      </button>
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
                          {submission.fileUrl && (
                            <a href={submission.fileUrl} target="_blank" rel="noreferrer">
                              Tệp đính kèm
                            </a>
                          )}
                          <span className="assignment-status">
                            {submission.status === 'graded'
                              ? `Đã chấm · Điểm ${submission.score ?? '-'}`
                              : 'Chưa chấm'}
                          </span>
                        </div>
                        <div className="assignment-grade">
                          <FormField label="Điểm">
                            <input
                              type="number"
                              placeholder="Điểm"
                              value={gradeDrafts[submission._id]?.score ?? submission.score ?? ''}
                              onChange={e =>
                                setGradeDrafts(prev => ({
                                  ...prev,
                                  [submission._id]: {
                                    score: e.target.value,
                                    feedback: prev[submission._id]?.feedback ?? submission.feedback ?? ''
                                  }
                                }))
                              }
                            />
                          </FormField>
                          <FormField label="Nhận xét">
                            <textarea
                              placeholder="Nhận xét"
                              value={gradeDrafts[submission._id]?.feedback ?? submission.feedback ?? ''}
                              onChange={e =>
                                setGradeDrafts(prev => ({
                                  ...prev,
                                  [submission._id]: {
                                    score: prev[submission._id]?.score ?? submission.score ?? '',
                                    feedback: e.target.value
                                  }
                                }))
                              }
                            />
                          </FormField>
                          <button
                            className="btn-post"
                            onClick={() =>
                              onGradeSubmission?.(submission._id, {
                                score: gradeDrafts[submission._id]?.score ?? submission.score ?? '',
                                feedback: gradeDrafts[submission._id]?.feedback ?? submission.feedback ?? ''
                              })
                            }
                          >
                            Chấm bài
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="teacher-empty">Chọn lớp để xem bài tập.</p>
          )}
        </section>
      </div>
    </div>
  )
}

export default TeacherView

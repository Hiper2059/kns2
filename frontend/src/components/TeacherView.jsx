import { useMemo, useState } from 'react'
import RichTextEditor from './RichTextEditor'
import { PlusCircle, Pencil, Trash2, ChevronDown, ChevronUp, Image as ImageIcon, Film, FileText, CheckCircle2 } from 'lucide-react'

const FormField = ({ label, hint, children, className = '', as = 'label' }) => {
  const FieldTag = as
  return (
    <FieldTag className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[14px] font-bold text-slate-700">{label}</span>
      {hint && <span className="text-[12px] font-medium text-slate-500">{hint}</span>}
      {children}
    </FieldTag>
  )
}

const CreatePanel = ({ title, eyebrow, description, isOpen, onToggle, children }) => (
  <section className={`bg-white border border-slate-200 rounded-[24px] shadow-sm mb-6 overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-blue-100' : ''}`}>
    <button type="button" className="w-full flex items-center justify-between p-6 md:p-8 text-left bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={onToggle} aria-expanded={isOpen}>
      <div>
        <span className="block text-[13px] font-black uppercase text-blue-600 mb-2 tracking-wide">{eyebrow}</span>
        <strong className="block text-xl md:text-2xl font-black text-slate-900 mb-1">{title}</strong>
        <small className="block text-[14px] text-slate-500 font-medium">{description}</small>
      </div>
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700">
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </span>
    </button>
    {isOpen && <div className="p-6 md:p-8 border-t border-slate-200 bg-white">{children}</div>}
  </section>
)

const defaultQuestion = () => ({ question: '', options: ['', '', '', ''], correctOptionIndex: 0 })

const baseInputClass = "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
const baseFileInputClass = "block w-full text-[13px] text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[13px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
const baseButtonClass = "inline-flex items-center justify-center h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all cursor-pointer shadow-[0_4px_14px_0_rgb(37,99,235,0.39)]"
const ghostButtonClass = "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer text-[13px]"
const dangerButtonClass = "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all cursor-pointer text-[13px]"

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
    <div className="flex flex-col gap-6 mt-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
      {getQuestions(data).map((item, questionIndex) => {
        const options = [...(item.options || [])]
        while (options.length < 4) options.push('')
        return (
          <div key={questionIndex} className="flex flex-col gap-5 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <strong className="text-[15px] font-black text-slate-800">Câu {questionIndex + 1}</strong>
              <button type="button" className={dangerButtonClass} onClick={() => removeQuestion(data, onChange, questionIndex)}>
                <Trash2 size={14} /> Xóa câu
              </button>
            </div>
            <FormField label="Nội dung câu hỏi">
              <input
                type="text"
                placeholder="Ví dụ: Khi né đòn thẳng, bước đầu tiên là gì?"
                className={baseInputClass}
                value={item.question || ''}
                onChange={event => setQuestion(data, onChange, questionIndex, { question: event.target.value })}
              />
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.slice(0, 4).map((option, optionIndex) => (
                <FormField key={optionIndex} label={`Đáp án ${optionIndex + 1}`}>
                  <input
                    type="text"
                    className={baseInputClass}
                    value={option}
                    onChange={event => setOption(data, onChange, questionIndex, optionIndex, event.target.value)}
                  />
                </FormField>
              ))}
            </div>
            <FormField label="Đáp án đúng">
              <select
                className={baseInputClass}
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
      <button type="button" className={baseButtonClass} onClick={() => addQuestion(data, onChange)}>
        <PlusCircle size={16} className="mr-2" /> Thêm câu hỏi
      </button>
    </div>
  )

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 min-w-0">
      <header className="p-8 md:p-10 bg-slate-900 rounded-[24px] text-white shadow-[0_20px_50px_rgba(15,23,42,0.5)] mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[12px] font-black uppercase tracking-wide mb-4">
            Studio giảng viên
          </span>
          <h2 className="text-3xl md:text-4xl font-black mb-3">Khu vực giảng viên</h2>
          <p className="text-[15px] font-medium text-slate-300 max-w-2xl">
            Tạo lớp, soạn bài giảng và xây dựng bộ câu hỏi trắc nghiệm dễ dàng. Quản lý nội dung học thuật với trải nghiệm tuyệt vời.
          </p>
        </div>
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
      </header>

      <CreatePanel
        eyebrow="Bước 01"
        title="Tạo lớp học mới"
        description="Thiết lập thông tin cơ bản: tên lớp, chủ đề, ảnh đại diện và mô tả."
        isOpen={isCreateCourseOpen}
        onToggle={() => setIsCreateCourseOpen(prev => !prev)}
      >
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Tên lớp học">
              <input type="text" className={baseInputClass} placeholder="Nhập tên khóa học..." value={newCourseData.title} onChange={event => onNewCourseDataChange({ ...newCourseData, title: event.target.value })} />
            </FormField>
            <FormField label="Chủ đề">
              <select className={baseInputClass} value={newCourseData.category} onChange={event => onNewCourseDataChange({ ...newCourseData, category: event.target.value })}>
                {categories.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </FormField>
            <FormField label="Ảnh URL">
              <input type="text" className={baseInputClass} placeholder="https://..." value={newCourseData.imageUrl} onChange={event => onNewCourseDataChange({ ...newCourseData, imageUrl: event.target.value })} />
            </FormField>
            <FormField label="Hoặc tải ảnh lên">
              <div className="h-11 flex items-center">
                <input type="file" className={baseFileInputClass} accept="image/png,image/jpeg,image/webp" onChange={event => onNewCourseDataChange({ ...newCourseData, imageFile: event.target.files?.[0] || null })} />
              </div>
            </FormField>
          </div>
          <FormField label="Mô tả lớp học" as="div" className="col-span-full">
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <RichTextEditor
                toolbarId="course-editor-toolbar"
                value={newCourseData.description}
                onChange={value => onNewCourseDataChange({ ...newCourseData, description: value })}
                placeholder="Mô tả chi tiết nội dung lớp học..."
              />
            </div>
          </FormField>
          <FormField label="Chèn video giới thiệu vào mô tả">
            <div className="h-11 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <input type="file" className={baseFileInputClass} accept="video/*" onChange={event => onUploadCourseEditorVideo?.(event.target.files?.[0] || null)} />
            </div>
          </FormField>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
          <span className="text-[14px] text-slate-500 font-medium">Vui lòng kiểm tra kỹ thông tin trước khi tạo lớp.</span>
          <button type="button" className={`${baseButtonClass} w-full md:w-auto`} onClick={onCreateCourse}>
            <PlusCircle size={18} className="mr-2" /> Tạo lớp học
          </button>
        </div>
      </CreatePanel>

      <CreatePanel
        eyebrow="Bước 02"
        title="Tạo bài giảng"
        description="Soạn giáo án chi tiết cho từng buổi học, kèm video và tài liệu."
        isOpen={isCreateLessonOpen}
        onToggle={() => setIsCreateLessonOpen(prev => !prev)}
      >
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="Chọn lớp học">
              <select className={baseInputClass} value={selectedCourseId || ''} onChange={event => onSelectCourseId(event.target.value)}>
                <option value="">-- Chọn lớp học --</option>
                {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
              </select>
            </FormField>
            <FormField label="Tiêu đề bài giảng">
              <input type="text" className={baseInputClass} placeholder="VD: Bài 1: Giới thiệu..." value={newLessonData.title} onChange={event => onNewLessonDataChange({ ...newLessonData, title: event.target.value })} />
            </FormField>
            <FormField label="Thứ tự bài">
              <input type="number" className={baseInputClass} min="1" value={newLessonData.order} onChange={event => onNewLessonDataChange({ ...newLessonData, order: event.target.value })} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Video URL">
              <input type="text" className={baseInputClass} placeholder="https://..." value={newLessonData.videoUrl} onChange={event => onNewLessonDataChange({ ...newLessonData, videoUrl: event.target.value })} />
            </FormField>
            <FormField label="Hoặc tải video lên">
              <div className="h-11 flex items-center">
                <input type="file" className={baseFileInputClass} accept="video/*" onChange={event => onNewLessonDataChange({ ...newLessonData, videoFile: event.target.files?.[0] || null })} />
              </div>
            </FormField>
            <FormField label="Ảnh Thumbnail URL">
              <input type="text" className={baseInputClass} placeholder="https://..." value={newLessonData.imageUrl} onChange={event => onNewLessonDataChange({ ...newLessonData, imageUrl: event.target.value })} />
            </FormField>
            <FormField label="Hoặc tải ảnh Thumbnail">
              <div className="h-11 flex items-center">
                <input type="file" className={baseFileInputClass} accept="image/png,image/jpeg,image/webp" onChange={event => onNewLessonDataChange({ ...newLessonData, imageFile: event.target.files?.[0] || null })} />
              </div>
            </FormField>
          </div>
          <FormField label="Nội dung chi tiết bài giảng" as="div" className="col-span-full">
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <RichTextEditor
                toolbarId="lesson-editor-toolbar"
                value={newLessonData.content}
                onChange={value => onNewLessonDataChange({ ...newLessonData, content: value })}
                placeholder="Trình bày bài giảng của bạn ở đây..."
              />
            </div>
          </FormField>
          <FormField label="Chèn video minh họa vào nội dung">
            <div className="h-11 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <input type="file" className={baseFileInputClass} accept="video/*" onChange={event => onUploadLessonEditorVideo?.(event.target.files?.[0] || null)} />
            </div>
          </FormField>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
          <span className="text-[14px] text-slate-500 font-medium">
            {selectedCourse ? `Sẽ tạo bài giảng cho lớp: ${selectedCourse.title}` : '⚠️ Bạn cần chọn lớp học trước!'}
          </span>
          <button type="button" className={`${baseButtonClass} w-full md:w-auto`} onClick={onCreateLesson} disabled={!selectedCourse}>
            <PlusCircle size={18} className="mr-2" /> Tạo bài giảng
          </button>
        </div>
      </CreatePanel>

      <CreatePanel
        eyebrow="Bước 03"
        title="Tạo bài trắc nghiệm"
        description="Thiết kế bài kiểm tra trắc nghiệm để đánh giá học viên."
        isOpen={isCreateAssignmentOpen}
        onToggle={() => setIsCreateAssignmentOpen(prev => !prev)}
      >
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="Chọn lớp học">
              <select className={baseInputClass} value={newAssignmentData.courseId || ''} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, courseId: event.target.value, type: 'quiz' })}>
                <option value="">-- Chọn lớp học --</option>
                {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
              </select>
            </FormField>
            <FormField label="Tên bài trắc nghiệm">
              <input type="text" className={baseInputClass} placeholder="VD: Kiểm tra giữa khóa..." value={newAssignmentData.title} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, title: event.target.value, type: 'quiz' })} />
            </FormField>
            <FormField label="Hạn làm bài (tùy chọn)">
              <input type="datetime-local" className={baseInputClass} value={newAssignmentData.dueAt} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, dueAt: event.target.value, type: 'quiz' })} />
            </FormField>
          </div>
          <FormField label="Ghi chú thêm cho học viên" className="col-span-full">
            <textarea className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-y transition-all" placeholder="Ghi chú hoặc lời chúc thi tốt..." value={newAssignmentData.description} onChange={event => onNewAssignmentDataChange({ ...newAssignmentData, description: event.target.value, type: 'quiz' })} />
          </FormField>
          {renderQuizEditor(newAssignmentData, onNewAssignmentDataChange)}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
          <span className="text-[14px] text-slate-500 font-medium">Mỗi câu cần có đủ đáp án và chọn đúng đáp án đúng.</span>
          <button type="button" className={`${baseButtonClass} w-full md:w-auto`} onClick={onCreateAssignment}>
            <PlusCircle size={18} className="mr-2" /> Khởi tạo bài kiểm tra
          </button>
        </div>
      </CreatePanel>

      <section className="bg-white border border-slate-200 rounded-[24px] shadow-sm mb-6 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
          <div>
            <span className="block text-[13px] font-black uppercase text-blue-600 mb-2 tracking-wide">Quản lý nội dung</span>
            <h3 className="text-2xl font-black text-slate-900">Danh sách Bài giảng</h3>
          </div>
          <div className="flex flex-col gap-2 min-w-[250px]">
            <span className="text-[13px] font-bold text-slate-500">Lọc theo lớp học:</span>
            <select className={baseInputClass} value={selectedCourseId || ''} onChange={event => onSelectCourseId(event.target.value)}>
              <option value="">-- Chọn lớp học --</option>
              {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {selectedCourse && lessons.length ? lessons.map(lesson => (
            <div key={lesson._id} className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-300 transition-colors">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="grid place-items-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-[14px]">{lesson.order}</span>
                  <strong className="text-lg font-black text-slate-900 truncate">{lesson.title}</strong>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${lesson.videoUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {lesson.videoUrl ? <><Film size={12} /> Có Video</> : 'Không Video'}
                  </span>
                </div>
                {lesson.content && (
                  <div className="prose prose-slate max-w-none text-[14px] leading-relaxed line-clamp-3 text-slate-600 mb-4 bg-white p-4 rounded-xl border border-slate-100" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                )}
                <div className="flex flex-wrap items-center gap-3 mt-auto">
                  <button className={ghostButtonClass} onClick={() => onEditLessonStart?.(lesson)}><Pencil size={14} /> Sửa</button>
                  <button className={dangerButtonClass} onClick={() => onDeleteLesson?.(lesson._id)}><Trash2 size={14} /> Xóa</button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {lesson.imageUrl ? (
                  <img src={lesson.imageUrl} alt={lesson.title} className="w-full aspect-video rounded-xl object-cover border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-full aspect-video bg-white border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2">
                    <ImageIcon size={24} />
                    <span className="text-[12px] font-bold">Chưa có ảnh</span>
                  </div>
                )}
                {lesson.videoUrl && (
                  <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 w-full h-10 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[13px] font-bold transition-colors">
                    <Film size={14} /> Xem lại Video
                  </a>
                )}
              </div>

              {editLessonId === lesson._id && (
                <div className="col-span-full mt-4 p-6 bg-white border border-blue-200 rounded-[20px] shadow-[0_10px_30px_rgba(37,99,235,0.06)]">
                  <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><Pencil size={18} className="text-blue-600" /> Sửa bài giảng</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <FormField label="Tiêu đề bài giảng">
                      <input type="text" className={baseInputClass} value={editLessonData.title} onChange={event => onEditLessonChange({ ...editLessonData, title: event.target.value })} />
                    </FormField>
                    <FormField label="Thứ tự bài">
                      <input type="number" className={baseInputClass} value={editLessonData.order} onChange={event => onEditLessonChange({ ...editLessonData, order: event.target.value })} />
                    </FormField>
                    <FormField label="Video URL">
                      <input type="text" className={baseInputClass} value={editLessonData.videoUrl} onChange={event => onEditLessonChange({ ...editLessonData, videoUrl: event.target.value })} />
                    </FormField>
                    <FormField label="Hoặc tải video">
                      <div className="h-11 flex items-center">
                        <input type="file" className={baseFileInputClass} accept="video/*" onChange={event => onEditLessonChange({ ...editLessonData, videoFile: event.target.files?.[0] || null })} />
                      </div>
                    </FormField>
                    <FormField label="Ảnh URL">
                      <input type="text" className={baseInputClass} value={editLessonData.imageUrl} onChange={event => onEditLessonChange({ ...editLessonData, imageUrl: event.target.value })} />
                    </FormField>
                    <FormField label="Hoặc tải ảnh">
                      <div className="h-11 flex items-center">
                        <input type="file" className={baseFileInputClass} accept="image/png,image/jpeg,image/webp" onChange={event => onEditLessonChange({ ...editLessonData, imageFile: event.target.files?.[0] || null })} />
                      </div>
                    </FormField>
                  </div>
                  <FormField label="Nội dung bài giảng" as="div" className="mb-6">
                    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                      <RichTextEditor
                        toolbarId={`lesson-edit-toolbar-${lesson._id}`}
                        value={editLessonData.content}
                        onChange={value => onEditLessonChange({ ...editLessonData, content: value })}
                      />
                    </div>
                  </FormField>
                  <FormField label="Chèn thêm video vào nội dung" className="mb-6">
                    <div className="h-11 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                      <input type="file" className={baseFileInputClass} accept="video/*" onChange={event => onUploadEditLessonEditorVideo?.(event.target.files?.[0] || null)} />
                    </div>
                  </FormField>
                  <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                    <button className={baseButtonClass} onClick={() => onUpdateLesson?.(lesson._id)}>Lưu thay đổi</button>
                    <button className={ghostButtonClass} onClick={onEditLessonCancel}>Hủy thao tác</button>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 border border-dashed border-slate-300 rounded-[20px]">
              <FileText size={40} className="text-slate-300 mb-4" />
              <p className="text-[15px] font-bold text-slate-500">{selectedCourseId ? 'Lớp này chưa có bài giảng nào.' : 'Vui lòng chọn lớp để xem bài giảng.'}</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-[24px] shadow-sm mb-6 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
          <div>
            <span className="block text-[13px] font-black uppercase text-amber-600 mb-2 tracking-wide">Đánh giá</span>
            <h3 className="text-2xl font-black text-slate-900">Bài Trắc nghiệm & Bài tập</h3>
          </div>
          <div className="flex flex-col gap-2 min-w-[250px]">
            <span className="text-[13px] font-bold text-slate-500">Lọc theo lớp học:</span>
            <select className={baseInputClass} value={selectedCourseId || ''} onChange={event => onSelectCourseId(event.target.value)}>
              <option value="">-- Chọn lớp học --</option>
              {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {selectedCourse && assignments?.length ? assignments.map(assignment => (
            <div key={assignment._id} className="flex flex-col gap-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-amber-300 transition-colors">
              <div>
                <strong className="block text-xl font-black text-slate-900 mb-2">{assignment.title}</strong>
                <p className="text-[15px] text-slate-600 mb-4">{assignment.description || 'Không có ghi chú.'}</p>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-[13px] font-bold">
                    {assignment.type === 'quiz' ? `Trắc nghiệm: ${assignment.questions?.length || 0} câu` : 'Bài tập tự luận'}
                  </span>
                  {assignment.dueAt && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-[13px] font-bold">
                      Hạn: {new Date(assignment.dueAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button className={ghostButtonClass} onClick={() => onEditAssignmentStart?.(assignment)}><Pencil size={14} /> Sửa</button>
                  <button className={dangerButtonClass} onClick={() => onDeleteAssignment?.(assignment._id)}><Trash2 size={14} /> Xóa</button>
                  <button className={ghostButtonClass} onClick={() => onLoadAssignmentSubmissions?.(assignment._id)}>
                    <CheckCircle2 size={14} /> Xem bài nộp
                  </button>
                </div>
              </div>

              {editAssignmentId === assignment._id && (
                <div className="mt-4 p-6 bg-white border border-amber-200 rounded-[20px] shadow-[0_10px_30px_rgba(245,158,11,0.06)]">
                  <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><Pencil size={18} className="text-amber-600" /> Sửa bài trắc nghiệm</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <FormField label="Tên bài trắc nghiệm">
                      <input type="text" className={baseInputClass} value={editAssignmentData.title} onChange={event => onEditAssignmentChange({ ...editAssignmentData, title: event.target.value, type: 'quiz' })} />
                    </FormField>
                    <FormField label="Hạn làm bài">
                      <input type="datetime-local" className={baseInputClass} value={editAssignmentData.dueAt} onChange={event => onEditAssignmentChange({ ...editAssignmentData, dueAt: event.target.value, type: 'quiz' })} />
                    </FormField>
                    <FormField label="Ghi chú" className="col-span-full">
                      <textarea className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-y" value={editAssignmentData.description} onChange={event => onEditAssignmentChange({ ...editAssignmentData, description: event.target.value, type: 'quiz' })} />
                    </FormField>
                  </div>
                  {renderQuizEditor(editAssignmentData, onEditAssignmentChange)}
                  <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
                    <button className={baseButtonClass} onClick={() => onUpdateAssignment?.(assignment._id)}>Lưu thay đổi</button>
                    <button className={ghostButtonClass} onClick={onEditAssignmentCancel}>Hủy thao tác</button>
                  </div>
                </div>
              )}

              {assignmentSubmissions?.[assignment._id]?.length ? (
                <div className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-6">
                  <h4 className="text-[15px] font-black text-slate-800 mb-2">Danh sách bài nộp:</h4>
                  {assignmentSubmissions[assignment._id].map(submission => (
                    <div key={submission._id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <strong className="block text-[15px] font-black text-slate-900 mb-1">{submission.studentName || 'Học viên'}</strong>
                        <p className="text-[14px] text-slate-600 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100">{submission.content || 'Không có nội dung.'}</p>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold ${submission.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {submission.status === 'graded' ? `Đã chấm · Điểm: ${submission.score ?? '-'}` : 'Đang chờ chấm'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-3 md:w-64 flex-shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <FormField label="Điểm số">
                          <input
                            type="number"
                            className={baseInputClass}
                            placeholder="Nhập điểm..."
                            value={gradeDrafts[submission._id]?.score ?? submission.score ?? ''}
                            onChange={event => setGradeDrafts(prev => ({
                              ...prev,
                              [submission._id]: {
                                ...prev[submission._id],
                                score: event.target.value
                              }
                            }))}
                          />
                        </FormField>
                        <FormField label="Nhận xét">
                          <textarea
                            className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-y"
                            placeholder="Nhận xét bài làm..."
                            value={gradeDrafts[submission._id]?.feedback ?? submission.feedback ?? ''}
                            onChange={event => setGradeDrafts(prev => ({
                              ...prev,
                              [submission._id]: {
                                ...prev[submission._id],
                                feedback: event.target.value
                              }
                            }))}
                          />
                        </FormField>
                        <button
                          className="mt-2 w-full inline-flex items-center justify-center h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-[13px]"
                          onClick={() => onGradeSubmission?.(submission._id, {
                            score: gradeDrafts[submission._id]?.score ?? submission.score ?? '',
                            feedback: gradeDrafts[submission._id]?.feedback ?? submission.feedback ?? ''
                          })}
                        >
                          Cập nhật điểm
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 border border-dashed border-slate-300 rounded-[20px]">
              <FileText size={40} className="text-slate-300 mb-4" />
              <p className="text-[15px] font-bold text-slate-500">{selectedCourseId ? 'Lớp này chưa có bài trắc nghiệm nào.' : 'Vui lòng chọn lớp để xem trắc nghiệm.'}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default TeacherView

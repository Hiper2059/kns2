import { useState } from 'react'
import RichTextEditor from './RichTextEditor'
import { PlusCircle, ChevronDown, ChevronUp } from 'lucide-react'

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

const baseInputClass = "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
const baseFileInputClass = "block w-full text-[13px] text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[13px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
const baseButtonClass = "inline-flex items-center justify-center h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all cursor-pointer shadow-[0_4px_14px_0_rgb(37,99,235,0.39)]"

const TeacherView = ({
  categories,
  newCourseData,
  onNewCourseDataChange,
  onCreateCourse,
  onUploadCourseEditorVideo
}) => {
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(true)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 min-w-0">
      <header className="p-8 md:p-10 bg-slate-900 rounded-[24px] text-white shadow-[0_20px_50px_rgba(15,23,42,0.5)] mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[12px] font-black uppercase tracking-wide mb-4">
            Studio giảng viên
          </span>
          <h2 className="text-3xl md:text-4xl font-black mb-3">Khu vực giảng viên</h2>
          <p className="text-[15px] font-medium text-slate-300 max-w-2xl">
            Tạo lớp học mới. Để tạo bài giảng và bài trắc nghiệm, vui lòng truy cập vào chi tiết lớp học trong mục Khóa học.
          </p>
        </div>
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
      </header>

      <CreatePanel
        eyebrow="Tạo Mới"
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
    </div>
  )
}

export default TeacherView

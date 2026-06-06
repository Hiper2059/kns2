import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import './LmsView.css'

const LmsView = ({
  categories,
  selectedCategory,
  onSelectCategory,
  courses,
  teacherCourses,
  selectedCourse,
  onSelectCourse,
  lessons,
  assignments,
  assignmentDrafts,
  onAssignmentDraftChange,
  onSubmitAssignment,
  enrollmentByCourse,
  teacherEnrollments,
  onEnroll,
  currentRole,
  currentUser,
  onOpenProfile,
  onOpenLesson,
  onOpenCourseForum,
  onLoadEnrollments,
  onDeleteLesson
}) => {
  const isTeacherView = currentRole === 'teacher' || currentRole === 'admin'
  const coursePool = isTeacherView ? teacherCourses : courses
  const visibleCourses = selectedCategory
    ? coursePool.filter(course => course.category === selectedCategory)
    : coursePool

  const enrollment = selectedCourse ? enrollmentByCourse[selectedCourse._id] : null
  const canEnroll = currentUser && (currentRole === 'student' || currentRole === 'user')
  const isEnrolled = Boolean(enrollment)
  const sortedLessons = [...lessons].sort((a, b) => (a.order || 1) - (b.order || 1))
  const visibleAssignments = Array.isArray(assignments) ? assignments : []

  const completedLessonIds = useMemo(() => {
    return new Set((enrollment?.completedLessons || []).map(item => String(item)))
  }, [enrollment])

  const containerRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.gsap-animate', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
      })
    }, containerRef)
    return () => ctx.revert()
  }, [selectedCourse, selectedCategory]) // Re-run animation when course or category changes

  const getProgressLabel = value => {
    const percent = Number(value) || 0
    if (percent <= 30) return 'Tân binh'
    if (percent < 80) return 'Hiểu biết'
    return 'Biết tuốt'
  }

  useEffect(() => {
    if (!isTeacherView || !selectedCourse?._id) {
      return
    }
    onLoadEnrollments?.(selectedCourse._id)
  }, [isTeacherView, onLoadEnrollments, selectedCourse?._id])

  return (
    <div ref={containerRef} className="flex flex-col lg:flex-row gap-6 w-full max-w-[1600px] mx-auto pb-10">
      {/* Sidebar - Categories */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <div className="gsap-animate glass-card p-5 sticky top-24 bg-white/80 border border-zinc-200 rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold text-zinc-800 mb-4 px-2">Danh mục</h3>
          <ul className="space-y-2">
            {categories.map(category => (
              <li key={category}>
                <button
                  className={`w-full text-left px-4 py-3 rounded-2xl font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900'
                  }`}
                  onClick={() => onSelectCategory(category)}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col xl:flex-row gap-6">

        {/* Course List */}
        <div className="w-full xl:w-1/3 flex flex-col gap-4">
          <h3 className="gsap-animate text-xl font-bold text-zinc-800 px-1">Lớp học hiện có</h3>
          <div className="flex flex-col gap-4 max-h-[800px] overflow-y-auto pr-2 pb-4 scrollbar-hide">
            {visibleCourses.length ? (
              visibleCourses.map(course => (
                <button
                  key={course._id}
                  className={`gsap-animate group relative flex flex-col gap-3 p-4 rounded-3xl border transition-all duration-300 text-left ${
                    selectedCourse?._id === course._id
                      ? 'bg-white border-teal-500 shadow-lg shadow-teal-500/10 ring-2 ring-teal-500/20'
                      : 'bg-white/60 border-zinc-200 hover:bg-white hover:border-zinc-300 hover:shadow-md'
                  }`}
                  onClick={() => onSelectCourse(course)}
                >
                  <div className="w-full h-40 rounded-2xl overflow-hidden bg-zinc-100 shrink-0">
                    {course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 font-medium bg-zinc-200/50">Ảnh lớp</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <h4 className="font-bold text-lg text-zinc-800 leading-tight line-clamp-2 group-hover:text-teal-700 transition-colors">{course.title}</h4>
                    <p className="text-sm text-zinc-500 font-medium">
                      Giảng viên: <span
                        className="text-orange-600 hover:underline cursor-pointer"
                        onClick={e => { e.stopPropagation(); onOpenProfile?.(course.teacher); }}
                      >{course.teacherName}</span>
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="gsap-animate p-8 text-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-3xl bg-white/50">
                Chưa có lớp học nào.
              </div>
            )}
          </div>
        </div>

        {/* Course Details */}
        <div className="flex-1">
          <div className="gsap-animate glass-card p-6 md:p-8 bg-white/90 border border-zinc-200 rounded-3xl shadow-xl min-h-[600px]">
            {selectedCourse ? (
              <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start border-b border-zinc-100 pb-8">
                  <div className="flex-1">
                    <div className="inline-block px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">{selectedCourse.category}</div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 mb-4 leading-tight">{selectedCourse.title}</h2>
                    <div
                      className="prose prose-zinc max-w-none text-zinc-600 text-sm md:text-base mb-6"
                      dangerouslySetInnerHTML={{ __html: selectedCourse.description || 'Chưa có mô tả chi tiết.' }}
                    />

                    {enrollment && (
                      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 mb-4">
                        <div className="flex justify-between items-end mb-2">
                          <span className="font-bold text-teal-900">Tiến độ của bạn</span>
                          <span className="text-teal-700 font-medium bg-teal-100 px-3 py-1 rounded-full text-sm">
                            {enrollment.progressPercent || 0}% - {getProgressLabel(enrollment.progressPercent)}
                          </span>
                        </div>
                        <div className="w-full bg-teal-200/50 rounded-full h-3 mb-3 overflow-hidden">
                          <div
                            className="bg-teal-500 h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(100, enrollment.progressPercent || 0)}%` }}
                          ></div>
                        </div>
                        <div className="text-sm font-medium text-teal-800">
                          {enrollment.evaluation?.score != null ? `🏆 Điểm đánh giá: ${enrollment.evaluation.score}` : '⏳ Chưa có điểm đánh giá'}
                        </div>
                        {enrollment?.evaluation?.note && <p className="mt-2 text-sm text-teal-700 italic border-l-2 border-teal-300 pl-3">" {enrollment.evaluation.note} "</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
                    {!currentUser && !isTeacherView && <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-xl border border-orange-100 font-medium text-center">Đăng nhập để tham gia</div>}

                    {canEnroll && !isEnrolled && (
                      <button className="w-full py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-colors" onClick={() => onEnroll(selectedCourse._id)}>
                        Tham gia lớp học
                      </button>
                    )}

                    {isEnrolled && <div className="w-full py-2 px-4 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-center border border-zinc-200">✓ Đã tham gia</div>}

                    <button className="w-full py-3 px-6 bg-white hover:bg-zinc-50 text-zinc-700 font-bold rounded-xl border border-zinc-200 shadow-sm transition-colors" onClick={() => onOpenCourseForum?.(selectedCourse)}>
                      💬 Diễn đàn lớp
                    </button>
                  </div>
                </div>

                {/* Teacher view: Students list */}
                {isTeacherView && (
                  <div className="gsap-animate flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                      <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">👥</span> Học viên tham gia
                    </h3>
                    <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-1 overflow-hidden">
                      {teacherEnrollments?.length ? (
                        <div className="flex flex-col divide-y divide-zinc-100">
                          {teacherEnrollments.map(enItem => (
                            <div key={enItem._id} className="flex justify-between items-center p-4 hover:bg-white transition-colors">
                              <span className="font-semibold text-zinc-700">{enItem.studentName}</span>
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full text-sm">
                                {enItem.progressPercent || 0}% hoàn thành
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-zinc-400">Chưa có học viên.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lessons */}
                <div className="gsap-animate flex flex-col gap-4">
                  <h3 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                    <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">📚</span> Nội dung bài học
                  </h3>
                  <div className="flex flex-col gap-3">
                    {sortedLessons.length ? (
                      sortedLessons.map(lesson => (
                        <div
                          key={lesson._id}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200"
                          onClick={() => onOpenLesson?.(lesson)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 text-zinc-500 font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                              {lesson.order}
                            </div>
                            <span className="font-semibold text-zinc-800 text-lg group-hover:text-blue-700 transition-colors">{lesson.title}</span>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              completedLessonIds.has(String(lesson._id))
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                            }`}>
                              {completedLessonIds.has(String(lesson._id)) ? '✓ Đã xong' : 'Chưa học'}
                            </span>

                            {isTeacherView && (
                              <button
                                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors border border-red-200"
                                onClick={e => { e.stopPropagation(); onDeleteLesson?.(lesson._id); }}
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50">
                        Lớp học chưa có bài học nào.
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignments */}
                <div className="gsap-animate flex flex-col gap-4 mt-4">
                  <h3 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                    <span className="p-2 bg-amber-100 text-amber-600 rounded-lg">✍️</span> Bài tập thực hành
                  </h3>
                  <div className="flex flex-col gap-4">
                    {visibleAssignments.length ? (
                      visibleAssignments.map(assignment => (
                        <div key={assignment._id} className="flex flex-col gap-4 p-5 rounded-2xl border border-zinc-200 bg-white">
                          <div className="flex flex-col gap-2">
                            <h4 className="text-lg font-bold text-zinc-800">{assignment.title}</h4>
                            <p className="text-zinc-600 text-sm">{assignment.description || 'Không có mô tả.'}</p>
                            {assignment.dueAt && (
                              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg w-fit mt-1">
                                ⏰ Hạn nộp: {new Date(assignment.dueAt).toLocaleString()}
                              </div>
                            )}
                          </div>

                          {assignment.mySubmission && (
                            <div className="mt-2 p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-zinc-700 text-sm">Trạng thái bài làm:</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  assignment.mySubmission.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {assignment.mySubmission.status === 'graded' ? `✓ Đã chấm - ${assignment.mySubmission.score} điểm` : '⏳ Đang chờ chấm'}
                                </span>
                              </div>
                              {assignment.mySubmission.content && (
                                <div className="text-sm text-zinc-600 bg-white p-3 rounded-lg border border-zinc-100">
                                  {assignment.mySubmission.content}
                                </div>
                              )}
                              {assignment.mySubmission.status === 'graded' && assignment.mySubmission.feedback && (
                                <div className="text-sm font-medium text-amber-800 bg-amber-50/50 p-3 rounded-lg border border-amber-100 border-l-4 border-l-amber-400">
                                  Giáo viên: {assignment.mySubmission.feedback}
                                </div>
                              )}
                            </div>
                          )}

                          {currentUser && !isTeacherView && (
                            <div className="mt-2 flex flex-col gap-3">
                              <textarea
                                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm transition-all min-h-[100px] resize-y"
                                value={assignmentDrafts?.[assignment._id] || ''}
                                onChange={e => onAssignmentDraftChange?.(assignment._id, e.target.value)}
                                placeholder="Nhập nội dung bài làm của bạn..."
                              />
                              <button
                                className="self-end py-2.5 px-6 bg-zinc-800 hover:bg-zinc-900 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
                                onClick={() => onSubmitAssignment?.(assignment._id)}
                              >
                                {assignment.mySubmission ? 'Nộp lại bài' : 'Gửi bài nộp'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-zinc-400 border border-zinc-100 rounded-2xl bg-zinc-50">
                        Chưa có bài tập nào.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-zinc-400 gap-4">
                <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-lg font-medium">Chọn một lớp học bên trái để xem chi tiết.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LmsView

export const COURSE_PAGE_SIZE = 3

export const paginateCourses = (courses, page, pageSize = COURSE_PAGE_SIZE) => {
  const safeCourses = Array.isArray(courses) ? courses : []
  const safePageSize = Math.max(1, Number(pageSize) || COURSE_PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(safeCourses.length / safePageSize))
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages)
  const startIndex = (currentPage - 1) * safePageSize

  return {
    courses: safeCourses.slice(startIndex, startIndex + safePageSize),
    currentPage,
    totalPages
  }
}

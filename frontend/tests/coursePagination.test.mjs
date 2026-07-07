import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { paginateCourses } from '../src/utils/coursePagination.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

test('chia ba khoa hoc moi trang va giu du khoa hoc o trang cuoi', () => {
  const courses = Array.from({ length: 7 }, (_, index) => ({ id: index + 1 }))

  assert.deepEqual(paginateCourses(courses, 1), {
    courses: courses.slice(0, 3),
    currentPage: 1,
    totalPages: 3
  })
  assert.deepEqual(paginateCourses(courses, 3), {
    courses: courses.slice(6),
    currentPage: 3,
    totalPages: 3
  })
})

test('tu dua trang ve pham vi hop le khi danh sach loc ngan hon', () => {
  const courses = [{ id: 1 }, { id: 2 }]

  assert.deepEqual(paginateCourses(courses, 4), {
    courses,
    currentPage: 1,
    totalPages: 1
  })
})

test('LmsView dung grid va chi render khoa hoc cua trang hien tai', () => {
  const source = fs.readFileSync(
    path.join(currentDir, '../src/components/LmsView.jsx'),
    'utf8'
  )

  assert.match(source, /paginatedCourses\.map/)
  assert.match(source, /grid-cols-1/)
  assert.match(source, /Trang \{currentCoursePage\} \/ \{courseTotalPages\}/)
  assert.match(source, /coursePagination\.filterKey === courseFilterKey/)
  assert.doesNotMatch(source, /visibleCourses\.map/)
  assert.doesNotMatch(source, /flex overflow-x-auto gap-6 pb-6 snap-x/)
  assert.doesNotMatch(source, /useEffect\(\(\) => \{\s*setCoursePage\(1\)/)
})

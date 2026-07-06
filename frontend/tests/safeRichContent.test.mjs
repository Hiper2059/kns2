import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = relativePath => fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('các màn hình rich text dùng component SafeRichHtml', () => {
  const lesson = read('../src/components/LessonFullPage.jsx')
  const lms = read('../src/components/LmsView.jsx')

  assert.match(lesson, /<SafeRichHtml html=\{lesson\.content \|\| ''\}/)
  assert.match(lms, /<SafeRichHtml[\s\S]{0,200}html=\{selectedCourse\.description/)
});

test('forum không render HTML do người dùng gửi bằng dangerouslySetInnerHTML', () => {
  const forum = read('../src/components/ForumView.jsx')
  const manage = read('../src/components/ManageView.jsx')

  assert.doesNotMatch(forum, /dangerouslySetInnerHTML/)
  assert.doesNotMatch(manage, /dangerouslySetInnerHTML/)
});

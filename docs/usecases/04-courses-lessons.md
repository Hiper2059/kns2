# Use Case Group: Courses & Lessons

## Overview
Course management and lesson operations grouped together: list, get, create, update, delete, lesson retrieval by slug and lesson completion.

### Actors
- Guest
- User (active)
- Teacher
- Admin

### Use Cases Included
- List Courses, Get Course Details, Create/Update/Delete Course
- List Lessons (per course), Create/Update/Delete Lesson, Get Lesson by Slug
- Complete Lesson (marks progress)

### Preconditions
- Creating/updating/deleting courses or lessons require `requireTeacherOrAdmin`.
- Viewing courses/lessons may require authentication for enrolled content.

### Main Success Scenario (combined)
1. Courses: `GET /courses` lists courses; `GET /courses/:courseId` returns details.
2. Teacher/Admin: `POST /courses`, `PATCH /courses/:courseId`, `DELETE /courses/:courseId` manage courses.
3. Lessons: `GET /courses/:courseId/lessons`, `POST /courses/:courseId/lessons`, `PATCH /lessons/:lessonId`, `DELETE /lessons/:lessonId`, `GET /lessons/slug/:slug`.
4. Complete lesson: `POST /lessons/:lessonId/complete` updates enrollment progress.

### Alternative Flows
- Unauthorized → `403` for teacher/admin endpoints.
- Not found → `404`.

### Implementation References
- Routes: [backend/routes/courseRoutes.js](backend/routes/courseRoutes.js#L1-L40), [backend/routes/lessonRoutes.js](backend/routes/lessonRoutes.js#L1-L40)
- Controllers: `backend/controllers/courseController.js`, `backend/controllers/lessonController.js`

## Server/Database Flow
- Viewing (list/get): Client `GET` -> Server checks authentication/authorization when required -> Server queries database for course/lesson records (may join enrollments or visibility rules) -> Server returns `200` with resources or `404`.
- Mutations (create/update/delete/complete): Client sends `POST`/`PATCH`/`DELETE` -> Server validates payload and verifies role/ownership -> Server updates database (insert/update soft-delete/mark completion) -> Server returns `201`/`200`/`204` or error codes (`400`/`401`/`403`/`404`).
- Server-side controllers and middleware enforce access checks; clients never write directly to the database.

## PlantUML — Usecase Diagram
```plantuml
@startuml
left to right direction
actor "Guest" as Guest
actor "User" as User
actor "Teacher" as Teacher
actor "Admin" as Admin

package "Courses & Lessons" {
	usecase "List Courses" as UC_ListCourses
	usecase "Get Course" as UC_GetCourse
	usecase "Create Course" as UC_CreateCourse
	usecase "Update Course" as UC_UpdateCourse
	usecase "Delete Course" as UC_DeleteCourse

	usecase "List Lessons" as UC_ListLessons
	usecase "Get Lesson by Slug" as UC_GetLessonSlug
	usecase "Create Lesson" as UC_CreateLesson
	usecase "Update Lesson" as UC_UpdateLesson
	usecase "Delete Lesson" as UC_DeleteLesson
	usecase "Complete Lesson" as UC_CompleteLesson
}

Guest --> UC_ListCourses
User --> UC_GetCourse
Teacher --> UC_CreateCourse
Teacher --> UC_CreateLesson
Teacher --> UC_CompleteLesson
Admin --> UC_DeleteCourse

@enduml
```

## Sequence Diagram — Courses & Lessons (PlantUML)

```plantuml
@startuml
title Khóa học và bài học — Sequence Diagram
actor "Người dùng" as User
participant "GD_CoursesLessons" as UI
participant "Ctrl_Course" as CourseCtrl
participant "Ctrl_Lesson" as LessonCtrl
participant "Ent_Course" as CourseDB
participant "Ent_Lesson" as LessonDB
participant "Ent_Enrollment" as EnrollDB

User -> UI: Xem danh sách khóa học
UI -> CourseCtrl: GET /courses
CourseCtrl -> CourseDB: Truy vấn khóa học
CourseDB --> CourseCtrl: Danh sách khóa học
CourseCtrl --> UI: Trả dữ liệu
UI --> User: Hiển thị khóa học

alt Tạo / cập nhật / xóa khóa học
	User -> UI: Gửi thao tác quản trị
	UI -> CourseCtrl: POST/PATCH/DELETE /courses
	CourseCtrl -> CourseCtrl: Kiểm tra quyền teacher/admin
	CourseCtrl -> CourseDB: Ghi thay đổi khóa học
	CourseDB --> CourseCtrl: Ack
	CourseCtrl --> UI: Trả kết quả
	UI --> User: Hiển thị thông báo
end

alt Bài học và hoàn thành bài học
	User -> UI: Mở bài học / đánh dấu hoàn thành
	UI -> LessonCtrl: GET /lessons/slug/:slug hoặc POST /lessons/:lessonId/complete
	LessonCtrl -> LessonDB: Truy vấn / cập nhật bài học
	LessonCtrl -> EnrollDB: Cập nhật tiến độ học tập
	LessonDB --> LessonCtrl: Ack
	EnrollDB --> LessonCtrl: Ack
	LessonCtrl --> UI: Trả kết quả
	UI --> User: Hiển thị trạng thái
end

@enduml
```

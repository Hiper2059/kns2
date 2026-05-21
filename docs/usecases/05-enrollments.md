# Use Case Group: Enrollments

## Overview
Student enrollment workflows: enroll to course, view own enrollments, teacher/admin viewing enrollments, lesson completion and evaluation.

### Actors
- User (student)
- Teacher
- Admin

### Use Cases Included
- Enroll in Course, List My Enrollments, List Course Enrollments, Complete Lesson, Evaluate Enrollment

### Main Success Scenario (combined)
1. Enroll: `POST /courses/:courseId/enroll` (requireActiveUser) → create enrollment.
2. List mine: `GET /enrollments/me` returns user's enrollments.
3. Teacher/Admin: `GET /courses/:courseId/enrollments` returns enrollments for course.
4. Complete lesson: `POST /lessons/:lessonId/complete` marks progress.
5. Evaluate: `PATCH /enrollments/:enrollmentId/evaluate` allows teacher/admin to grade.

### Alternative Flows
- Already enrolled → return existing or conflict.
- Unauthorized → `403`.

### Implementation References
- Routes: [backend/routes/enrollmentRoutes.js](backend/routes/enrollmentRoutes.js#L1-L40)
- Controller: `backend/controllers/enrollmentController.js`

## Server/Database Flow
- Enroll/List/Complete/Evaluate flows: Client sends request -> Server validates authentication and business rules (e.g., already enrolled, course capacity) -> Server creates/updates enrollment records in database or queries them -> Server returns `201`/`200`/`204` or appropriate error codes.
- All enrollment state changes are performed by the server layer; clients only send HTTP requests and receive responses.

## PlantUML — Usecase Diagram + Sequence (Enroll)
Usecase:
```plantuml
@startuml
left to right direction
actor "User" as User
actor "Teacher" as Teacher
actor "Admin" as Admin

package "Enrollments" {
	usecase "Enroll Course" as UC_Enroll
	usecase "List My Enrollments" as UC_ListMyEnrollments
	usecase "List Course Enrollments" as UC_ListCourseEnrollments
	usecase "Evaluate Enrollment" as UC_EvaluateEnrollment
	usecase "Complete Lesson" as UC_CompleteLesson
}

User --> UC_Enroll
User --> UC_ListMyEnrollments
Teacher --> UC_ListCourseEnrollments
Teacher --> UC_EvaluateEnrollment

@enduml
```

Sequence (Enroll):
```plantuml
@startuml
title Enroll in Course — Sequence
actor "Student" as Student
participant "UI" as UI
participant "Ctrl_Enroll" as Ctrl
participant "Ent_Course" as Course
participant "Ent_Enrollment" as EnrollmentDB

Student -> UI: Click Enroll
UI -> Ctrl: POST /courses/:courseId/enroll
Ctrl -> Ctrl: Check auth + already enrolled
Ctrl -> Course: Check course availability
Course --> Ctrl: OK
Ctrl -> EnrollmentDB: Create enrollment record
EnrollmentDB --> Ctrl: Enrollment created
alt Already enrolled
	Ctrl --> UI: Respond 409 Conflict
	UI -> Student: Show "already enrolled"
else Enrollment created
	Ctrl -> UI: Respond 201 Created
	UI -> Student: Show enrollment confirmation
end

@enduml
```

# Bộ sơ đồ PlantUML khổ A4 cho hệ thống KNS

Các file trong thư mục này là PlantUML plaintext, dùng trực tiếp với PlantUML, draw.io hoặc công cụ hỗ trợ cú pháp `@startuml` / `@enduml`.

## Cách dùng với draw.io

1. Mở draw.io.
2. Chọn `Arrange` -> `Insert` -> `Advanced` -> `PlantUML`.
3. Mở một file `.puml`, sao chép toàn bộ nội dung.
4. Dán vào draw.io và bấm `Insert`.
5. Khi đưa sang Word A4, nên export từng sơ đồ thành PNG/SVG riêng.

## Gợi ý in Word A4

- Class diagram và ERD đã được chia nhỏ theo module để dễ đọc.
- Sequence diagram được chia theo từng nghiệp vụ nhỏ, tránh quá nhiều tác nhân.
- Nếu sơ đồ vẫn dài, đặt ảnh ở chế độ ngang trang A4 hoặc giảm margin Word.

## Danh sách file

- `01-class-auth-user.puml`
- `02-class-learning-core.puml`
- `03-class-forum-moderation-media.puml`
- `04-erd-course-structure.puml`
- `05-erd-learning-progress.puml`
- `06-seq-auth-login.puml`
- `07-seq-auth-refresh-logout.puml`
- `08-seq-student-enroll-course.puml`
- `09-seq-student-learn-complete.puml`
- `10-seq-student-submit-assignment.puml`
- `11-seq-teacher-create-course-lesson.puml`
- `12-seq-teacher-create-grade-assignment.puml`
- `13-seq-forum-post-comment.puml`
- `14-seq-moderation-report-admin.puml`
- `15-seq-admin-manage-master-data.puml`
- `16-act-auth-role-routing.puml`
- `17-act-student-learning-flow.puml`
- `18-act-teacher-management-flow.puml`
- `19-act-admin-moderation-flow.puml`
- `20-erd-forum-moderation-media.puml`

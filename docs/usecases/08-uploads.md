# Use Case Group: Uploads

## Overview
File upload flows for images and videos using middleware and controllers.

### Actors
- Teacher
- Admin

### Use Cases Included
- Upload Image, Upload Video

### Main Success Scenario (combined)
1. Image: `POST /uploads/image` with multipart/form-data field `image` → middleware `imageUpload` → controller `uploadImage` saves file to cloud and returns URL.
2. Video: `POST /uploads/video` with field `video` → middleware `videoUpload` → controller `uploadVideo` saves and returns metadata/URL.

### Alternative Flows
- File too large/invalid format → `400` with error message.
- Unauthorized → `403`.

### Implementation References
- Routes: [backend/routes/uploadRoutes.js](backend/routes/uploadRoutes.js#L1-L80)
- Middleware: `backend/middleware/upload.js`
- Controller: `backend/controllers/uploadController.js`

## Server/Database Flow
- Uploads: Client `POST /uploads/...` -> Server middleware validates file and auth -> Server stores file in external storage (cloud) and writes metadata/URL to database -> Server returns `201` with file metadata or `400`/`413` on error.
- Deletions: Client `DELETE` -> Server validates permissions -> Server removes metadata from database and may remove file from storage -> Server returns `200`/`204`.

## PlantUML — Usecase Diagram
```plantuml
@startuml
left to right direction
actor "Teacher" as Teacher
actor "Admin" as Admin

package "Uploads" {
	usecase "Upload Image" as UC_UploadImage
	usecase "Upload Video" as UC_UploadVideo
}

Teacher --> UC_UploadImage
Teacher --> UC_UploadVideo
Admin --> UC_UploadImage
Admin --> UC_UploadVideo

@enduml
```

## Sequence Diagram — Uploads (PlantUML)

```plantuml
@startuml
title Upload file — Sequence Diagram
actor "Người dùng" as User
participant "GD_Upload" as UI
participant "Ctrl_Upload" as Ctrl
participant "Middleware Upload" as MW
participant "Ent_FileMeta" as FileDB
participant "Cloud Storage" as Storage

User -> UI: Chọn file và tải lên
UI -> Ctrl: POST /uploads/image or /uploads/video
Ctrl -> MW: Kiểm tra auth + loại file + dung lượng
alt File không hợp lệ
	MW --> Ctrl: Lỗi xác thực / validate
	Ctrl --> UI: Trả 400/413
	UI --> User: Hiển thị lỗi
else File hợp lệ
	MW -> Storage: Upload file
	Storage --> MW: URL / metadata
	MW -> FileDB: Lưu metadata file
	FileDB --> MW: Ack
	MW --> Ctrl: Thông tin upload
	Ctrl --> UI: Trả 201 Created
	UI --> User: Hiển thị đường dẫn file
end

@enduml
```

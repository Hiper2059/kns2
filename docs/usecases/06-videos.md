# Use Case Group: Videos

## Overview
Video listing and admin video management (create/delete).

### Actors
- Guest
- User
- Admin

### Use Cases Included
- View Videos, Create Video, Delete Video

### Main Success Scenario (combined)
1. View: `GET /videos` returns list of videos.
2. Admin: `POST /videos` to create metadata; `DELETE /videos/:id` to remove.

### Alternative Flows
- Unauthorized → `403` for admin actions.
- Not found → `404`.

### Implementation References
- Routes: [backend/routes/videoRoutes.js](backend/routes/videoRoutes.js#L1-L30)
- Controller: `backend/controllers/videoController.js`

## Server/Database Flow
- View: Client `GET /videos` -> Server queries database or media service for video metadata -> Server returns `200` with list/details.
- Create/Delete: Client `POST`/`DELETE` -> Server validates permissions and input -> Server stores metadata in database and media in cloud if applicable -> Server returns `201`/`200`/`204` or errors.
- Video storage often involves both database records and external media storage (Cloudinary/Youtube); server coordinates both systems.

## PlantUML — Usecase Diagram
```plantuml
@startuml
left to right direction
actor "Guest" as Guest
actor "User" as User
actor "Admin" as Admin

package "Videos" {
	usecase "View Videos" as UC_ViewVideos
	usecase "Create Video" as UC_CreateVideo
	usecase "Delete Video" as UC_DeleteVideo
}

Guest --> UC_ViewVideos
Admin --> UC_CreateVideo
Admin --> UC_DeleteVideo

@enduml
```

## Sequence Diagram — Videos (PlantUML)

```plantuml
@startuml
title Quản lý video — Sequence Diagram
actor "Người dùng" as User
participant "GD_Video" as UI
participant "Ctrl_Video" as Ctrl
participant "Ent_VideoLink" as VideoDB
participant "Cloudinary/Youtube" as Storage

User -> UI: Xem danh sách video
UI -> Ctrl: GET /videos
Ctrl -> VideoDB: Truy vấn metadata video
VideoDB --> Ctrl: Danh sách video
Ctrl --> UI: Trả dữ liệu
UI --> User: Hiển thị video

alt Tạo video
	User -> UI: Nhập URL/metadata và lưu
	UI -> Ctrl: POST /videos
	Ctrl -> Ctrl: Kiểm tra quyền admin
	Ctrl -> Storage: Đăng ký/lấy thông tin video
	Storage --> Ctrl: Video metadata
	Ctrl -> VideoDB: Lưu video
	VideoDB --> Ctrl: Ack
	Ctrl --> UI: Trả 201 Created
	UI --> User: Hiển thị thành công
end

alt Xóa video
	User -> UI: Nhấn xóa video
	UI -> Ctrl: DELETE /videos/:id
	Ctrl -> VideoDB: Xóa metadata video
	VideoDB --> Ctrl: Ack
	Ctrl --> UI: Trả 200/204
	UI --> User: Hiển thị đã xóa
end

@enduml
```

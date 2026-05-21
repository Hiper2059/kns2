# Use Case Group: Forum Comments

## Overview
Actions for comments: view, create, delete (soft), restore and purge.

### Actors
- Guest
- User (active)
- Admin

### Use Cases Included
- View Forum Comments
- Create Forum Comment
- Delete Own Comment (soft)
- Get Deleted Comments (admin)
- Restore Comment
- Permanently Delete Comment

### Main Success Scenario (combined)
1. View: `GET /forum/comments` → return comments.
2. Create: `POST /forum/comments` (requireActiveUser) → validate and save.
3. Delete: `DELETE /forum/comments/:id` (owner) → soft-delete.
4. Admin: `GET /forum/deleted/comments`, `PATCH /forum/comments/:id/restore`, `DELETE /forum/deleted/comments/:id`.

### Alternative Flows
- Not owner → `403`.
- Missing post/comment → `404`.

### Implementation References
- Routes: [backend/routes/forumRoutes.js](backend/routes/forumRoutes.js#L1-L80)
- Controller: `backend/controllers/forumController.js`

## Server/Database Flow
- Read (view comments): Client `GET` -> Server authenticates/authorizes if required -> Server queries database for comments (with filters/pagination) -> Server returns `200` with data or `404`.
- Create/Delete/Restore/Purge: Client sends HTTP request -> Server validates payload and checks ownership/roles -> Server performs DB write (insert/update `deleted` flag/purge) -> Server returns `201`/`200`/`204` or appropriate error codes.
- Mutating workflows always pass through controller/middleware layers on the server; database is updated only by server-side logic.

## PlantUML — Usecase Diagram
```plantuml
@startuml
left to right direction
actor "Guest" as Guest
actor "User" as User
actor "Admin" as Admin

package "Forum Comments" {
	usecase "View Comments" as UC_ViewComments
	usecase "Create Comment" as UC_CreateComment
	usecase "Delete Own Comment" as UC_DeleteComment
	usecase "View Deleted Comments" as UC_ViewDeletedComments
	usecase "Restore Comment" as UC_RestoreComment
	usecase "Purge Comment" as UC_PurgeComment
}

Guest --> UC_ViewComments
User --> UC_CreateComment
User --> UC_DeleteComment
Admin --> UC_ViewDeletedComments
Admin --> UC_RestoreComment
Admin --> UC_PurgeComment

@enduml
```

## Sequence Diagram — Forum Comments (PlantUML)

```plantuml
@startuml
title Quản lý bình luận forum — Sequence Diagram
actor "Người dùng" as User
participant "GD_ForumComment" as UI
participant "Ctrl_ForumComment" as Ctrl
participant "Ent_ForumComment" as CommentDB

User -> UI: Xem bình luận
UI -> Ctrl: GET /forum/comments
Ctrl -> CommentDB: Truy vấn bình luận
CommentDB --> Ctrl: Danh sách bình luận
Ctrl --> UI: Trả dữ liệu
UI --> User: Hiển thị bình luận

alt Tạo bình luận
	User -> UI: Nhập bình luận và gửi
	UI -> Ctrl: POST /forum/comments
	Ctrl -> Ctrl: Kiểm tra đăng nhập + nội dung
	Ctrl -> CommentDB: Lưu bình luận mới
	CommentDB --> Ctrl: Bình luận đã tạo
	Ctrl --> UI: Trả 201 Created
	UI --> User: Hiển thị bình luận mới
end

alt Xóa / khôi phục / purge
	User -> UI: Chọn thao tác quản trị
	UI -> Ctrl: Gửi request phù hợp
	Ctrl -> CommentDB: Cập nhật deleted / xóa vĩnh viễn
	CommentDB --> Ctrl: Ack
	Ctrl --> UI: Trả kết quả
	UI --> User: Hiển thị thông báo
end

@enduml
```

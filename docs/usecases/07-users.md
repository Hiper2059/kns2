# Use Case Group: Users

## Overview
Admin user management and personal profile flows for users.

### Actors
- Admin
- User

### Use Cases Included
- Manage Users (list/create/update role/status/delete)
- Get My Profile, Update My Profile
- Get Public Profile

### Main Success Scenario (combined)
1. Admin endpoints: `GET /users`, `POST /users`, `PATCH /users/role`, `PATCH /users/status`, `DELETE /users/:username`.
2. User endpoints: `GET /users/me/profile`, `PATCH /users/me/profile`, `GET /users/:userId/profile`.

### Alternative Flows
- Unauthorized access → `403`.
- Not found → `404`.

### Implementation References
- Routes: [backend/routes/userRoutes.js](backend/routes/userRoutes.js#L1-L40)
- Controller: `backend/controllers/userController.js`

## Server/Database Flow
- Read (profiles, user lists): Client `GET` -> Server checks auth/roles -> Server queries users collection/table -> Server returns `200` with requested data or `404`.
- Mutations (create user, update profile, change role/status, delete): Client sends `POST`/`PATCH`/`DELETE` -> Server validates payload and authorization (admin checks or ownership) -> Server updates user record in database (create/update/soft-delete) -> Server returns `201`/`200`/`204` or appropriate error codes.
- Sensitive operations (password, role changes) should be handled by server-side controllers and not exposed to direct DB writes.

## Sequence Diagram — Quản lý tài khoản (PlantUML)

Sao chép toàn bộ block dưới đây vào PlantUML để vẽ sơ đồ tuần tự giống mẫu bạn gửi.

```plantuml
@startuml
title Quản lý tài khoản — Sequence Diagram
actor "Người dùng" as User
participant "GD_QuảnLýTàiKhoản" as UI
participant "Ctrl_QuanLyTaiKhoan" as Ctrl
participant "Ent_TaiKhoan" as Ent

User -> UI: Truy cập trang Quản lý tài khoản
UI -> Ctrl: Gửi yêu cầu truy vấn
Ctrl -> Ent: Truy vấn thông tin tài khoản
Ent --> Ctrl: Trả về thông tin tài khoản
Ctrl --> UI: Trả về thông tin tài khoản
UI --> User: Hiển thị thông tin tài khoản

alt Sửa thông tin
	User -> UI: Nhập thông tin cần sửa + Nhấn Lưu
	UI -> Ctrl: Kiểm tra tính hợp lệ
	alt Không hợp lệ
		Ctrl --> UI: Trả lỗi xác thực
		UI --> User: Hiển thị yêu cầu nhập lại
	else Hợp lệ
		Ctrl -> Ent: Yêu cầu cập nhật thông tin
		Ent --> Ctrl: Cập nhật thông tin tài khoản (ack)
		Ctrl --> UI: Gửi thông báo thành công
		UI --> User: Hiển thị thông báo
	end
end

alt Xóa tài khoản
	User -> UI: Nhấn Xóa tài khoản
	UI -> User: Hiển thị modal xác nhận
	User --> UI: Xác nhận xóa
	UI -> Ctrl: Gửi yêu cầu xóa
	Ctrl -> Ent: Yêu cầu xóa (soft-delete)
	Ent --> Ctrl: Xóa tài khoản (ack)
	Ctrl --> UI: Gửi thông báo xóa
	UI --> User: Hiển thị thông báo và kết thúc phiên đăng nhập (sign-out)
end
@enduml
```


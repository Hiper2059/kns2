# Use Case Group: Authentication

## Overview
This group covers authentication flows: Register, Login and Refresh Token.

### Actors
- Guest
- User (client)

### Use Cases Included
- Register (create account)
- Login (authenticate)
- Refresh Token (renew access)

### Preconditions
- For Register: guest has required registration data.
- For Login/Refresh: account exists and client has valid credentials/refresh token.

### Main Scenarios
- Register: `POST /register` → validate input → create user → return success (optionally tokens).
- Login: `POST /login` → verify credentials → issue access and refresh tokens → return tokens + profile.
- Refresh: `POST /auth/refresh` → verify refresh token → issue new access token.

### Alternative Flows
- Invalid input → `400 Bad Request`.
- Duplicate account → `409 Conflict`.
- Wrong credentials → `401 Unauthorized`.
- Expired/invalid refresh → `401 Unauthorized`.

### Implementation References
- Routes: [backend/routes/authRoutes.js](backend/routes/authRoutes.js#L1-L20)
- Controller: `backend/controllers/authController.js`

## Activity Diagram — Đăng ký tài khoản

Sao chép block dưới đây vào PlantUML hoặc công cụ hỗ trợ PlantUML trong StarUML để dựng activity diagram theo đúng luồng của code hiện tại.

```plantuml
@startuml
title Activity Diagram — Đăng ký tài khoản

|Người dùng|
start
:Mở form đăng ký;
:Nhập username, password;
:Nhấn "Đăng ký";

|Hệ thống|
:Nhận dữ liệu từ form;
:Kiểm tra username và password;
if (Thiếu dữ liệu hoặc mật khẩu < 6 ký tự?) then (Có)
	:Trả lỗi 400;
	|Người dùng|
	:Hiển thị thông báo lỗi;
	stop
else (Không)
	:Chuẩn hóa username;
	:Kiểm tra tài khoản đã tồn tại;
	if (Tài khoản đã tồn tại?) then (Có)
		:Trả lỗi 400;
		|Người dùng|
		:Hiển thị thông báo "Tài khoản đã tồn tại";
		stop
	else (Không)
		:Hash mật khẩu;
		:Tạo user mới với role = student;
		:Lưu vào cơ sở dữ liệu;
		:Trả thông báo đăng ký thành công;
		|Người dùng|
		:Chuyển sang form Đăng nhập;
		stop
	endif
endif
@enduml
```

## Server/Database Flow
- Read operations (e.g. token verification): Client -> Server verifies token/credentials -> Server checks token store or database as needed -> Server returns `200` or `401`.
- Mutating operations (Register/Login): Client -> Server validates input -> Server creates or looks up user records in database -> Server issues tokens and returns `201`/`200` or error codes (`400`/`409`/`401`).
- All authentication changes go through the server layer (controllers/middleware) which is responsible for validation, hashing, storing credentials, and issuing tokens; clients never write directly to the database.

## PlantUML — Usecase Diagram
Sao chép block bên dưới vào PlantUML để vẽ sơ đồ usecase cho Authentication.

```plantuml
@startuml
left to right direction
actor "Guest" as Guest
actor "User" as User
actor "Admin" as Admin

package "Authentication" {
	usecase "Register" as UC_Register
	usecase "Login" as UC_Login
	usecase "Refresh Token" as UC_Refresh
}

Guest --> UC_Register
Guest --> UC_Login
User --> UC_Refresh
Admin --> UC_Login

@enduml
```

## Sequence Diagram — Xác thực (PlantUML)

```plantuml
@startuml
title Xác thực tài khoản — Sequence Diagram
actor "Người dùng" as User
participant "GD_XacThuc" as UI
participant "Ctrl_Auth" as Ctrl
participant "Ent_User" as UserDB
participant "Ent_Token" as TokenDB

User -> UI: Mở form đăng ký / đăng nhập

alt Đăng ký
	User -> UI: Nhập thông tin và nhấn Đăng ký
	UI -> Ctrl: Gửi yêu cầu đăng ký
	Ctrl -> Ctrl: Kiểm tra dữ liệu đầu vào
	Ctrl -> UserDB: Kiểm tra tài khoản đã tồn tại
	UserDB --> Ctrl: Kết quả kiểm tra
	alt Tài khoản đã tồn tại
		Ctrl --> UI: Trả lỗi 409 Conflict
		UI --> User: Thông báo tài khoản đã tồn tại
	else Hợp lệ
		Ctrl -> UserDB: Tạo user mới
		UserDB --> Ctrl: User mới
		Ctrl -> TokenDB: Tạo token xác thực
		TokenDB --> Ctrl: Access/Refresh token
		Ctrl --> UI: Trả 201 Created + token
		UI --> User: Hiển thị đăng ký thành công
	end
end

alt Đăng nhập
	User -> UI: Nhập email/password và nhấn Đăng nhập
	UI -> Ctrl: Gửi yêu cầu đăng nhập
	Ctrl -> UserDB: Tìm user theo email
	UserDB --> Ctrl: Thông tin user
	Ctrl -> Ctrl: So khớp mật khẩu
	alt Sai thông tin
		Ctrl --> UI: Trả 401 Unauthorized
		UI --> User: Thông báo sai tài khoản hoặc mật khẩu
	else Đúng thông tin
		Ctrl -> TokenDB: Cấp token mới
		TokenDB --> Ctrl: Token
		Ctrl --> UI: Trả 200 OK + profile
		UI --> User: Chuyển vào hệ thống
	end
end

alt Refresh token
	User -> UI: Gửi refresh token
	UI -> Ctrl: POST /auth/refresh
	Ctrl -> TokenDB: Kiểm tra refresh token
	TokenDB --> Ctrl: Hợp lệ / không hợp lệ
	alt Không hợp lệ
		Ctrl --> UI: Trả 401 Unauthorized
		UI --> User: Yêu cầu đăng nhập lại
	else Hợp lệ
		Ctrl --> UI: Trả access token mới
		UI --> User: Tiếp tục phiên làm việc
	end
end

@enduml
```

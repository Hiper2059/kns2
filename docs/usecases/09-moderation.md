# Use Case Group: Moderation

## Overview
Reporting and report management flows: create report, list/review reports, delete/clear reports.

### Actors
- User
- Admin
- AI Moderator (system)

### Use Cases Included
- Report Content, List/Review Reports, Delete/Clear Reports

### Main Success Scenario (combined)
1. User files report: `POST /moderation/report` → store `ModerationReport`.
2. Admin lists reports: `GET /moderation/reports` → review.
3. Admin deletes single report: `DELETE /moderation/reports/:id` or clears all: `DELETE /moderation/reports`.

### Alternative Flows
- Unauthorized → `403` for admin endpoints.
- Not found → `404`.

### Implementation References
- Routes: [backend/routes/moderationRoutes.js](backend/routes/moderationRoutes.js#L1-L40)
- Controller: `backend/controllers/moderationController.js`

## Server/Database Flow
- Reporting: Client `POST /moderation/report` -> Server validates and stores report record in database -> Server returns `201`.
- Admin review actions: Client `GET`/`PATCH`/`DELETE` -> Server checks admin auth -> Server queries or updates moderation records in database -> Server returns `200`/`204` accordingly.
- Automated moderation (AI) may create or flag reports via server-side services that insert records into the database.

## PlantUML — Usecase Diagram
```plantuml
@startuml
left to right direction
actor "User" as User
actor "Admin" as Admin
actor "AI Moderator" as AI

package "Moderation" {
	usecase "Report Content" as UC_Report
	usecase "List Reports" as UC_ListReports
	usecase "Delete Report" as UC_DeleteReport
	usecase "Clear Reports" as UC_ClearReports
}

User --> UC_Report
Admin --> UC_ListReports
Admin --> UC_DeleteReport
Admin --> UC_ClearReports
AI --> UC_ListReports

@enduml
```

## Sequence Diagram — Moderation (PlantUML)

```plantuml
@startuml
title Báo cáo và kiểm duyệt — Sequence Diagram
actor "Người dùng" as User
actor "Admin" as Admin
participant "GD_Moderation" as UI
participant "Ctrl_Moderation" as Ctrl
participant "Ent_ModerationReport" as ReportDB

User -> UI: Gửi báo cáo nội dung
UI -> Ctrl: POST /moderation/report
Ctrl -> Ctrl: Validate report
Ctrl -> ReportDB: Lưu báo cáo
ReportDB --> Ctrl: Ack
Ctrl --> UI: Trả 201 Created
UI --> User: Hiển thị báo cáo đã gửi

alt Admin duyệt báo cáo
	Admin -> UI: Mở danh sách báo cáo
	UI -> Ctrl: GET /moderation/reports
	Ctrl -> ReportDB: Truy vấn báo cáo
	ReportDB --> Ctrl: Danh sách báo cáo
	Ctrl --> UI: Trả dữ liệu
	UI --> Admin: Hiển thị danh sách
end

alt Admin xóa hoặc xóa toàn bộ
	Admin -> UI: Chọn xóa báo cáo
	UI -> Ctrl: DELETE /moderation/reports/:id or /moderation/reports
	Ctrl -> ReportDB: Xóa hoặc dọn toàn bộ báo cáo
	ReportDB --> Ctrl: Ack
	Ctrl --> UI: Trả 200/204
	UI --> Admin: Hiển thị kết quả
end

@enduml
```

# Use Case: Chat with Z-Mate

## Overview
Chat endpoint for interacting with an AI agent (Z-Mate).

### Actors
- Guest
- User

### Main Scenario
1. Client posts message to `POST /chat`.
2. Server forwards to AI/chat service and returns reply.

### Alternatives
- AI service failure → `503 Service Unavailable`.

### Implementation References
- Routes: [backend/routes/chatRoutes.js](backend/routes/chatRoutes.js#L1-L20)
- Controller: `backend/controllers/chatController.js`

## Server/Database Flow
- Send message: Client `POST /chat` -> Server validates input and may log message -> Server forwards message to AI/chat service and persists chat history to database if configured -> Server returns AI reply (`200`) or `503` on external service failure.
- Chat logs and transcripts are stored by server-side code; clients never write directly to the database or AI service endpoints.

## PlantUML — Usecase Diagram
```plantuml
@startuml
left to right direction
actor "Guest" as Guest
actor "User" as User

package "Chat" {
	usecase "Send Message" as UC_SendMessage
	usecase "Receive Reply" as UC_ReceiveReply
}

Guest --> UC_SendMessage
User --> UC_SendMessage
UC_ReceiveReply <-- UC_SendMessage

@enduml
```

## Sequence Diagram — Chat (PlantUML)

```plantuml
@startuml
title Chat with Z-Mate — Sequence Diagram
actor "Người dùng" as User
participant "GD_Chat" as UI
participant "Ctrl_Chat" as Ctrl
participant "AI Service" as AI
participant "Ent_ChatLog" as ChatDB

User -> UI: Nhập tin nhắn và gửi
UI -> Ctrl: POST /chat
Ctrl -> Ctrl: Kiểm tra nội dung
Ctrl -> ChatDB: Lưu lịch sử chat
ChatDB --> Ctrl: Ack
Ctrl -> AI: Gửi message đến AI
alt AI thất bại
	AI --> Ctrl: Lỗi dịch vụ
	Ctrl --> UI: Trả 503 Service Unavailable
	UI --> User: Hiển thị lỗi
else AI phản hồi
	AI --> Ctrl: Nội dung trả lời
	Ctrl -> ChatDB: Lưu phản hồi AI
	ChatDB --> Ctrl: Ack
	Ctrl --> UI: Trả 200 OK + reply
	UI --> User: Hiển thị câu trả lời
end

@enduml
```

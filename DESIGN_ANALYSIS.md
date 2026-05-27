# Phân tích Thiết kế Kiến trúc Hệ thống KNS - Z-Mate Hub

## I. TỔNG QUAN HỆ THỐNG

### Mô tả dự án
**Tên dự án:** KNS - Z-Mate Hub  
**Mô tả:** Nền tảng học tập kỹ năng sống cho thế hệ trẻ, tích hợp các tính năng quản lý khóa học, diễn đàn, chat, và hệ thống xếp hạng điểm số.

**Công nghệ chủ yếu:**
- Frontend: React 18 + Vite + Axios
- Backend: Node.js + Express
- Database: MongoDB
- Deployment: Render (Backend), Vercel (Frontend)
- API AI: Google Generative AI (Gemini)
- Storage: Cloudinary (quản lý media)

---

## II. PHÂN TÍCH THIẾT KẾ FRONTEND

### 2.1 Kiến trúc Frontend

```
Frontend (React + Vite)
├── Single Page Application (SPA)
├── API Client (Axios)
├── Component-Based Architecture
└── Local Storage + State Management
```

### 2.2 Cấu trúc Components Chính

#### **Navbar Component**
- **Mục đích:** Thanh điều hướng chính
- **Chức năng:**
  - Hiển thị logo "Z-Mate Hub" với tagline "Kỹ năng sống cho thế hệ trẻ"
  - Điều hướng giữa các tab (Trang chủ, Diễn đàn, LMS)
  - Hiển thị thông tin người dùng, rank, điểm số
  - Nút đăng nhập/đăng xuất
  - Nút mở Profile Modal
- **Props:** activeTab, onTabChange, currentRole, currentUser, currentRank, currentUserPoints

#### **AuthModal Component**
- **Mục đích:** Xử lý xác thực người dùng
- **Chức năng:**
  - Form đăng nhập (username, password)
  - Lưu trữ token trong localStorage
  - Hỗ trợ 3 vai trò: Admin, Teacher, Student
  - Quản lý state xác thực

#### **HomeView Component**
- **Mục đích:** Trang chủ chứa danh sách kỹ năng
- **Chức năng:**
  - Hiển thị các kỹ năng có sẵn (Võ thuật, Giao tiếp, Quản lý thời gian, Tài chính, Tư duy)
  - Danh sách video mặc định theo danh mục
  - Tích hợp HLS.js và DASH.js để phát video
  - React YouTube hỗ trợ video YouTube

#### **LmsView Component**
- **Mục đích:** Hệ thống quản lý khóa học
- **Chức năng:**
  - Hiển thị danh sách các khóa học
  - Cho phép đăng ký khóa học (Enrollment)
  - Xem nội dung bài học (Lesson)
  - Tích hợp video lesson

#### **ForumView Component**
- **Mục đích:** Hệ thống diễn đàn cộng đồng
- **Chức năng:**
  - Tạo bài viết mới với Rich Text Editor
  - Xem danh sách bài viết (6 bài/trang - pagination)
  - Bình luận trên bài viết
  - Phân loại bài viết theo danh mục (Võ thuật, Giao tiếp, v.v.)
  - Lưu draft bình luận

#### **TeacherView Component**
- **Mục đích:** Bảng điều khiển giáo viên
- **Chức năng:**
  - Tạo khóa học mới
  - Quản lý bài học
  - Xem danh sách học viên đã đăng ký
  - Quản lý video lesson

#### **ManageView Component**
- **Mục đích:** Bảng điều khiển quản trị (Admin only)
- **Chức năng:**
  - Quản lý người dùng
  - Xem báo cáo vi phạm
  - Kiểm duyệt nội dung
  - Quản lý hệ thống

#### **ChatWidget Component**
- **Mục đích:** Chat widget nổi
- **Chức năng:**
  - Chat thời gian thực với AI (Google Gemini)
  - Hiển thị kỹ năng khả dụng khi hỏi
  - Lưu lịch sử chat
  - Gợi ý kỹ năng theo tìm kiếm

#### **LessonFullPage Component**
- **Mục đích:** Trang xem bài học đầy đủ
- **Chức năng:**
  - Hiển thị nội dung bài học
  - Phát video lesson
  - Kiểm tra bài học

#### **ProfileModal Component**
- **Mục đích:** Modal xem/chỉnh sửa hồ sơ người dùng
- **Chức năng:**
  - Xem thông tin cá nhân
  - Cập nhật avatar, bio, stage name
  - Xem lịch sử điểm số

#### **RichTextEditor Component**
- **Mục đích:** Trình soạn thảo văn bản phong phú
- **Chức năng:**
  - Sử dụng React Quill
  - Hỗ trợ formatting (bold, italic, lists, links)
  - Dùng cho tạo bài viết diễn đàn

#### **Footer Component**
- **Mục đích:** Chân trang
- **Chức năng:** Thông tin copyright, liên kết liên quan

### 2.3 State Management

```javascript
// Cấu trúc State chính
const [currentUser, setCurrentUser]           // Username người dùng
const [currentRole, setCurrentRole]           // Vai trò (admin/teacher/student)
const [authData, setAuthData]                 // Dữ liệu login (username, password)
const [activeTab, setActiveTab]               // Tab hiện tại
const [isChatOpen, setIsChatOpen]             // Chat widget mở/đóng
const [forumPosts, setForumPosts]             // Danh sách bài viết
const [pointsByUser, setPointsByUser]         // Điểm số của mỗi user
const [categoryVideos, setCategoryVideos]     // Video theo danh mục
const [messages, setMessages]                 // Lịch sử chat
```

### 2.4 API Client Setup

```javascript
// API Base URL
API_BASE_URL = 
  - Dev: http://localhost:5000
  - Prod: https://kns-1.onrender.com

// Sử dụng Axios với createApiClient()
// Quản lý token: setTokens(), clearTokens()
```

### 2.5 Build Optimization

**Vite Config:**
- **Chunk size warning limit:** 2500kb
- **Manual chunks:**
  - `editor`: react-quill (Rich Text Editor)
  - `player`: hls.js + dashjs + react-youtube
  - `vendor`: react + react-dom

**Kết quả:** Tối ưu hóa load time bằng cách tách nhỏ các bundle

---

## III. PHÂN TÍCH THIẾT KẾ BACKEND

### 3.1 Kiến trúc Backend

```
Backend (Node.js + Express)
├── app.js (Express App)
├── server.js (Entry point)
├── Controllers (Business logic)
├── Models (MongoDB Schemas)
├── Routes (API endpoints)
├── Middleware (Auth, Upload)
├── Services (Business logic phức tạp)
├── Utils (Helper functions)
└── Config (CORS, Environment, Roles)
```

### 3.2 Danh sách Routes

| Module | Endpoint | Chức năng |
|--------|----------|----------|
| **Health** | `/api/health` | Kiểm tra sức khỏe server |
| **Auth** | `/api/login`, `/api/register` | Xác thực người dùng |
| **Forum** | `/api/forum/*` | CRUD bài viết, bình luận |
| **User** | `/api/users/*` | Quản lý hồ sơ người dùng |
| **Video** | `/api/videos/*` | Quản lý video links |
| **Moderation** | `/api/moderation/*` | Kiểm duyệt, báo cáo vi phạm |
| **Chat** | `/api/chat/*` | Chat API, AI integration |
| **Course** | `/api/courses/*` | Quản lý khóa học |
| **Lesson** | `/api/lessons/*` | Quản lý bài học |
| **Enrollment** | `/api/enrollments/*` | Đăng ký khóa học |
| **Upload** | `/api/upload/*` | Upload file lên Cloudinary |

### 3.3 Models (Database Schema)

#### **User Model**
```
- username (unique)
- password (bcrypt hash)
- role (admin, teacher, student, user)
- status (active, suspended, banned)
- profile
  - displayName
  - stageName
  - avatarUrl
  - bio
- violationCount
- lastViolationAt
```

#### **Course Model**
- Tên khóa học
- Mô tả
- Giáo viên (teacher ID)
- Danh sách bài học
- Ngày tạo

#### **Lesson Model**
- Tên bài học
- Nội dung
- Video URL
- Thứ tự
- Khóa học (course ID)

#### **Enrollment Model**
- Người dùng
- Khóa học
- Ngày đăng ký
- Tiến độ học

#### **ForumPost Model**
- Tiêu đề
- Nội dung
- Tác giả
- Danh mục
- Danh sách bình luận
- Ngày tạo

#### **ForumComment Model**
- Nội dung
- Tác giả
- Bài viết (post ID)
- Ngày tạo

#### **VideoLink Model**
- URL video
- Danh mục
- Tiêu đề

#### **ModerationReport Model**
- Loại báo cáo
- Nội dung
- Người báo cáo
- Mục tiêu báo cáo
- Trạng thái (pending, resolved, dismissed)

### 3.4 Middleware

#### **auth.js**
- Xác thực JWT token
- Kiểm tra quyền truy cập theo role
- Bảo vệ routes

#### **upload.js**
- Multer configuration
- Xử lý file upload
- Validation file

### 3.5 Controllers

Mỗi controller xử lý business logic cho từng module:
- `authController.js`: Login, Register, Token refresh
- `userController.js`: Profile CRUD, User management
- `forumController.js`: Posts & Comments CRUD
- `courseController.js`: Courses CRUD
- `lessonController.js`: Lessons CRUD
- `enrollmentController.js`: Enrollment management
- `videoController.js`: Video links CRUD
- `chatController.js`: Chat & AI integration
- `moderationController.js`: Moderation & Reports
- `uploadController.js`: File upload to Cloudinary
- `healthController.js`: Health check

### 3.6 Services

#### **moderationService.js**
- Xử lý báo cáo vi phạm
- Kiểm duyệt nội dung
- Tính toán violation count

#### **seedService.js**
- Khởi tạo dữ liệu mặc định
- Seeding video links
- Seeding forum posts

### 3.7 Utils

| File | Chức năng |
|------|----------|
| `cloudinary.js` | Kết nối & upload Cloudinary |
| `password.js` | Hash & verify password (bcryptjs) |
| `token.js` | JWT token generation & verification |
| `userUtils.js` | Utility functions cho user |
| `youtube.js` | YouTube API integration |

### 3.8 Configuration

#### **cors.js**
- Cấu hình CORS cho phép frontend
- Cho phép origins từ `FRONTEND_ORIGIN` env var

#### **env.js**
- Quản lý environment variables
- MongoDB URI
- API keys (Gemini, Cloudinary)
- Port (default 5000)
- Admin credentials

#### **roles.js**
- Định nghĩa quyền cho từng role

---

## IV. PHÂN TÍCH THIẾT KẾ SERVER & DEPLOYMENT

### 4.1 Architecture

```
Deployment Infrastructure
├── Frontend
│   ├── Vercel (SPA hosting)
│   └── Vite Build Optimization
├── Backend
│   ├── Render (Node.js server)
│   └── MongoDB Atlas (Database)
└── Storage
    └── Cloudinary (Media hosting)
```

### 4.2 Render.yaml Configuration

```yaml
Service: kns-backend (Web Service)
├── Runtime: Node.js v24
├── Port: 5000
├── Build Command: npm install
├── Start Command: npm start
│
├── Environment Variables
│   ├── NODE_VERSION: 24
│   ├── PORT: 5000
│   ├── MONGODB_URI: [secret]
│   ├── GEMINI_API_KEY: [secret]
│   ├── ADMIN_USERNAME: admin
│   ├── ADMIN_PASSWORD: [secret]
│   └── FRONTEND_ORIGIN: https://your-site.vercel.app,https://*.vercel.app
│
└── Auto-deployment from Git
```

### 4.3 Backend Server Initialization

```javascript
// server.js flow
1. Load app.js (Express setup)
2. Load environment config
3. Connect to MongoDB
4. Seed default data (video links, forum posts)
5. Start Express server on port 5000
```

### 4.4 Database Connection

```javascript
// Mongoose connection
├── Connection String: MONGODB_URI từ .env
├── Auto-reconnect: Có
└── Connection Pool: Mặc định Mongoose
```

### 4.5 Frontend Deployment

**Vercel Configuration:**
- Tự động deploy từ GitHub push
- Build command: `npm run build`
- Output directory: `dist/` (Vite build)

**Frontend URL patterns:**
- Main: `kns2-lidezz7f4-thongminhhieu147-2067s-projects.vercel.app`
- Preview: `https://kns2.vercel.app` (PR previews)

---

## V. FLOW KIẾN TRÚC TOÀN HỆ THỐNG

### 5.1 Authentication Flow

```
Frontend                          Backend                    Database
   |                                |                           |
   |--- POST /api/login --------->  |                           |
   |                                |--- Find User ---------->  |
   |                                |<----------- User -----    |
   |                                |                           |
   |                                |--- Verify Password       |
   |                                |--- Generate JWT        |
   |                                |--- Hash Token          |
   |                                |                           |
   |<--- JWT + Role ------         |                           |
   |                                |                           |
   |--- Save in localStorage        |                           |
   |--- Use in Authorization Header |                           |
```

### 5.2 API Request Flow

```
Frontend (App.jsx)
   |
   |--- API Client (axios)
   |    ├── Create request
   |    ├── Add Authorization header (JWT)
   |    └── Handle response/error
   |
   |--- API_BASE_URL
   |    ├── Dev: http://localhost:5000
   |    └── Prod: https://kns-1.onrender.com
   |
   Backend (Express)
   |--- CORS Middleware
   |--- Body Parser Middleware
   |--- Auth Middleware (verify JWT)
   |--- Route Handler
   |    ├── Validate input
   |    ├── Call Controller
   |    ├── Query Database
   |    └── Return JSON response
   |
   Database (MongoDB)
```

### 5.3 Component Communication

```
App.jsx (Main State)
   |
   ├--- Navbar -------> User Info, Points, Rank
   ├--- AuthModal -----> Login/Register
   ├--- HomeView -------> Skills & Videos
   ├--- ForumView ------> Posts & Comments
   ├--- LmsView --------> Courses & Lessons
   ├--- TeacherView ----> Manage Courses
   ├--- ManageView -----> Admin Dashboard
   ├--- ChatWidget -----> AI Chat
   └--- ProfileModal ---> User Profile
```

---

## VI. DATA FLOW EXAMPLES

### 6.1 Forum Post Creation

```
User Types Post → ForumView Component
   |
   |--- setNewPost() → localStorage
   |--- POST /api/forum/posts
   |    ├── Middleware: Auth verify
   |    ├── Controller: forumController.createPost()
   |    └── Model: ForumPost.create()
   |
Database Insert → Post Created
   |
Return Post ID → ForumView updates state
   |
UI Re-render → New post visible
```

### 6.2 Video Streaming

```
User clicks Video → HomeView/LessonFullPage
   |
   |--- Video URL from Database
   |--- Initialize HLS.js or DASH.js
   |--- Stream video from Cloudinary
   |
Video Plays in Browser
```

### 6.3 Chat with AI

```
User types message → ChatWidget
   |
   |--- POST /api/chat/send
   |    ├── Controller: chatController.sendMessage()
   |    └── Service: Gemini API call
   |
Google Generative AI (Gemini)
   |
Response Generated → Backend
   |
Return to Frontend → ChatWidget displays message
   |
Show skill buttons if suggested
```

---

## VII. SỰ PHÂN TÁCH TRÁCH NHIỆM (Separation of Concerns)

### Frontend
- **UI Rendering:** React Components
- **State Management:** React hooks (useState, useCallback, useEffect)
- **API Communication:** Axios client
- **Local Persistence:** localStorage

### Backend
- **Business Logic:** Controllers & Services
- **Data Validation:** Middleware
- **Database Operations:** Mongoose models
- **Authentication:** JWT tokens
- **Authorization:** Role-based access control

### Database
- **Data Persistence:** MongoDB
- **Data Schema:** Mongoose schemas
- **Data Integrity:** Validations, indexes

---

## VIII. BẢO MẬT (Security)

### Authentication
- JWT tokens (access + refresh)
- Password hashing (bcryptjs)
- Token stored in localStorage

### Authorization
- Role-based access control (RBAC)
- Roles: admin, teacher, student
- Middleware checks user role

### Data Protection
- CORS configured
- HTTPS in production
- Input validation
- SQL injection prevention (MongoDB)

### User Moderation
- Violation tracking
- Account suspension/banning
- Report system
- Content moderation

---

## IX. HIỆU SUẤT (Performance)

### Frontend Optimization
- Code splitting (Vite)
- Component chunking
- Editor, Player, Vendor chunks
- Lazy loading components

### Backend Optimization
- Efficient queries
- Database indexing
- Connection pooling
- Caching (local seeding)

### Caching Strategy
- Frontend: localStorage
- Backend: Seeding default data
- CDN: Cloudinary for media

---

## X. SCALABILITY

### Hiện tại
- Single Node.js process
- MongoDB single instance
- Cloudinary media hosting

### Có thể mở rộng
- Load balancing (multiple Render instances)
- MongoDB replica sets
- Redis caching layer
- WebSocket for real-time chat
- Message queue for async jobs

---

## XI. BẢNG TÓRE TẮT SO SÁNH

| Lớp | Technology | Mục đích | Mô tả |
|-----|-----------|---------|-------|
| **Presentation** | React 18 + Vite | UI/UX | Component-based, SPA |
| **Client-Server** | Axios | HTTP Client | RESTful API calls |
| **Server** | Express.js | Web Framework | Routing, middleware |
| **Business Logic** | Controllers + Services | Logic | CRUD, Validation |
| **Data Access** | Mongoose | ORM | MongoDB queries |
| **Database** | MongoDB | Data Store | Document-based |
| **Storage** | Cloudinary | Media | Image/Video hosting |
| **AI** | Gemini API | Smart Features | Chat, recommendations |
| **Auth** | JWT + bcryptjs | Security | Token-based auth |
| **Deployment** | Render + Vercel | Hosting | Auto CI/CD |

---

## XII. DIAGRAM KIẾN TRÚC TỔNG QUÁT

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React SPA (Vite Built)                      │   │
│  │  ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ │   │
│  │  │ Navbar     │ │ HomeView │ │ForumView  │ │ChatWidget│ │   │
│  │  └────────────┘ └──────────┘ └───────────┘ └──────────┘ │   │
│  │  ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ │   │
│  │  │ LmsView    │ │TeacherView│ │ManageView │ │AuthModal │ │   │
│  │  └────────────┘ └──────────┘ └───────────┘ └──────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│             Axios API Client (JWT tokens)                        │
└─────────────────────────────────────────────────────────────────┘
              │                                   │
              ├──────────────────────────────────┤
              │                                   │
    ┌─────────▼────────────┐         ┌──────────▼──────────┐
    │   Render.com         │         │   Cloudinary       │
    │ (Backend Server)     │         │  (Media Storage)   │
    │                      │         │                    │
    │ ┌──────────────────┐ │         │ ┌────────────────┐ │
    │ │ Express.js App   │ │         │ │Image/Video CDN │ │
    │ │ - Controllers    │ │         │ └────────────────┘ │
    │ │ - Routes         │ │         └────────────────────┘
    │ │ - Middleware     │ │
    │ │ - Services       │ │
    │ └──────────────────┘ │
    │                      │
    │ ┌──────────────────┐ │
    │ │ Mongoose ORM     │ │
    │ │ (Data Models)    │ │
    │ └──────────────────┘ │
    └─────────┬────────────┘
              │
    ┌─────────▼────────────┐
    │  MongoDB Atlas       │
    │ (Cloud Database)     │
    │                      │
    │ ┌────────────────┐   │
    │ │ Collections:   │   │
    │ │ - users        │   │
    │ │ - courses      │   │
    │ │ - lessons      │   │
    │ │ - forum_posts  │   │
    │ │ - comments     │   │
    │ │ - enrollments  │   │
    │ │ - videos       │   │
    │ │ - reports      │   │
    │ └────────────────┘   │
    └──────────────────────┘

    ┌──────────────────────┐
    │  Google Gemini API   │
    │  (AI Chat Service)   │
    └──────────────────────┘
```

---

## XIII. CONCLUSION

Hệ thống KNS - Z-Mate Hub được thiết kế với:

✅ **Architecture rõ ràng:** Frontend (React), Backend (Express), Database (MongoDB)  
✅ **Separation of Concerns:** Mỗi lớp có trách nhiệm riêng  
✅ **Scalability:** Có thể mở rộng theo nhu cầu  
✅ **Security:** JWT auth, RBAC, Password hashing  
✅ **Performance:** Code splitting, lazy loading, caching  
✅ **Maintainability:** Modular structure, clear naming  
✅ **Integration:** AI (Gemini), Media (Cloudinary), Deployment (Render/Vercel)

Thiết kế này phù hợp cho nền tảng học tập cộng đồng với các vai trò khác nhau (admin, teacher, student) và tính năng đa dạng (courses, forum, chat, moderation).


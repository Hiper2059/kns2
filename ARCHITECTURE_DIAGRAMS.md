# Sơ Đồ Kiến Trúc Hệ Thống KNS - Z-Mate Hub

## 1. ARCHITECTURE OVERVIEW (Tổng Quan Kiến Trúc)

```mermaid
graph TB
    User["👤 User Browser"]
    
    subgraph Frontend["🎨 FRONTEND (React + Vite)"]
        App["App.jsx<br/>Main Component"]
        Nav["Navbar"]
        Auth["AuthModal"]
        Home["HomeView"]
        Forum["ForumView"]
        LMS["LmsView"]
        Teacher["TeacherView"]
        Admin["ManageView"]
        Chat["ChatWidget"]
        Profile["ProfileModal"]
        
        App --> Nav
        App --> Auth
        App --> Home
        App --> Forum
        App --> LMS
        App --> Teacher
        App --> Admin
        App --> Chat
        App --> Profile
    end
    
    subgraph Communication["📡 API Communication"]
        APIClient["Axios API Client<br/>JWT Token Management"]
    end
    
    subgraph Backend["🖥️ BACKEND (Node.js + Express)"]
        Server["Express Server<br/>Port: 5000"]
        Routes["Routes Module<br/>13 Route Groups"]
        Controllers["Controllers<br/>Business Logic"]
        Models["Mongoose Models<br/>8 Data Models"]
        Middleware["Middleware<br/>Auth, Upload, CORS"]
        Services["Services<br/>Complex Logic"]
    end
    
    subgraph Storage["💾 DATA & STORAGE"]
        MongoDB["MongoDB Atlas<br/>Cloud Database"]
    end
    
    subgraph External["🔗 External Services"]
        Cloudinary["Cloudinary<br/>Media CDN"]
        Gemini["Google Gemini<br/>AI Chat API"]
    end
    
    subgraph Deployment["🚀 DEPLOYMENT"]
        Vercel["Vercel<br/>Frontend Host"]
        Render["Render<br/>Backend Host"]
    end
    
    User <--> Frontend
    Frontend <--> APIClient
    APIClient <--> Backend
    Backend --> Controllers
    Controllers --> Models
    Backend --> Middleware
    Backend --> Services
    Models <--> MongoDB
    Backend <--> Cloudinary
    Backend <--> Gemini
    Frontend -.-> Vercel
    Backend -.-> Render
```

---

## 2. COMPONENT HIERARCHY (Phân Cấp Components)

```mermaid
graph TD
    App["<b>App.jsx</b><br/>State Manager"]
    
    App -->|activeTab=home| HomeView["<b>HomeView</b><br/>🏠 Trang chủ<br/>- Danh sách kỹ năng<br/>- Video default<br/>- HLS/DASH streaming"]
    
    App -->|activeTab=forum| ForumView["<b>ForumView</b><br/>💬 Diễn đàn<br/>- Tạo bài viết<br/>- Rich Text Editor<br/>- Bình luận<br/>- Phân trang 6 bài"]
    
    App -->|activeTab=lms| LmsView["<b>LmsView</b><br/>📚 Quản lý Khóa học<br/>- Danh sách courses<br/>- Đăng ký khóa học<br/>- Xem lessons<br/>- Video lesson"]
    
    App -->|activeTab=teacher| TeacherView["<b>TeacherView</b><br/>👨‍🏫 Bảng GV<br/>- Tạo khóa học<br/>- Quản lý lesson<br/>- Xem học viên<br/>- Upload video"]
    
    App -->|activeTab=manage| ManageView["<b>ManageView</b><br/>⚙️ Admin Dashboard<br/>- Quản lý users<br/>- Báo cáo vi phạm<br/>- Kiểm duyệt<br/>- System stats"]
    
    App -->|authMode| AuthModal["<b>AuthModal</b><br/>🔐 Xác thực<br/>- Login/Register<br/>- 3 vai trò<br/>- Token mgmt<br/>- localStorage"]
    
    App -->|profile| ProfileModal["<b>ProfileModal</b><br/>👤 Hồ sơ<br/>- Avatar<br/>- Bio<br/>- Stage name<br/>- Lịch sử điểm"]
    
    App -->|Chat| ChatWidget["<b>ChatWidget</b><br/>🤖 AI Chat<br/>- Gemini API<br/>- Kỹ năng gợi ý<br/>- Lịch sử<br/>- Floating widget"]
    
    App -->|Components| Navbar["<b>Navbar</b><br/>- Logo & Tagline<br/>- Nav links<br/>- User info<br/>- Rank & Points"]
    
    App -->|Components| Footer["<b>Footer</b><br/>- Copyright<br/>- Links"]
    
    App -->|Route| LessonFull["<b>LessonFullPage</b><br/>📖 Full Lesson<br/>- Nội dung<br/>- Video phát<br/>- Kiểm tra"]
```

---

## 3. DATA FLOW - AUTHENTICATION (Luồng Xác Thực)

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as 🎨 Frontend
    participant Backend as 🖥️ Backend
    participant DB as 💾 MongoDB
    
    User ->> Frontend: 1. Nhập username/password
    Frontend ->> Backend: 2. POST /api/login
    Backend ->> DB: 3. Find user by username
    DB -->> Backend: 4. User document
    Backend ->> Backend: 5. Verify password (bcrypt)
    Backend ->> Backend: 6. Generate JWT tokens
    Backend -->> Frontend: 7. Return JWT + role
    Frontend ->> Frontend: 8. Save in localStorage
    Frontend ->> Frontend: 9. Set Auth header
    Frontend -->> User: 10. Redirect to dashboard
    Note over Frontend: Authorization: Bearer {JWT}
```

---

## 4. API ROUTES STRUCTURE (Cấu Trúc Routes)

```mermaid
graph LR
    API["🖥️ /api"]
    
    API --> Health["🏥 /health"]
    API --> Auth["🔐 /auth<br/>POST /login<br/>POST /register<br/>POST /refresh"]
    API --> User["👤 /users<br/>GET /profile<br/>PUT /profile<br/>GET /all<br/>DELETE /:id"]
    API --> Forum["💬 /forum<br/>GET /posts<br/>POST /posts<br/>POST /comments<br/>PUT /posts/:id"]
    API --> Video["🎬 /videos<br/>GET /all<br/>POST /add<br/>DELETE /:id"]
    API --> Course["📚 /courses<br/>GET /all<br/>POST /create<br/>PUT /:id"]
    API --> Lesson["📖 /lessons<br/>GET /all<br/>POST /create<br/>DELETE /:id"]
    API --> Enrollment["📝 /enrollments<br/>POST /enroll<br/>GET /student<br/>GET /course"]
    API --> Upload["📤 /upload<br/>POST /image<br/>POST /video"]
    API --> Chat["💭 /chat<br/>POST /send<br/>GET /history"]
    API --> Moderation["⚖️ /moderation<br/>POST /report<br/>GET /reports<br/>PUT /status"]
    
    style Health fill:#e1f5ff
    style Auth fill:#fff3e0
    style User fill:#f3e5f5
    style Forum fill:#e8f5e9
    style Video fill:#fce4ec
    style Course fill:#f1f8e9
    style Lesson fill:#ede7f6
    style Enrollment fill:#e0f2f1
    style Upload fill:#fff9c4
    style Chat fill:#f5f5f5
    style Moderation fill:#ffebee
```

---

## 5. DATABASE SCHEMA (Sơ Đồ Cơ Sở Dữ Liệu)

```mermaid
erDiagram
    USER ||--o{ FORUM_POST : "creates"
    USER ||--o{ FORUM_COMMENT : "writes"
    USER ||--o{ ENROLLMENT : "registers"
    USER ||--o{ MODERATION_REPORT : "files"
    
    COURSE ||--o{ LESSON : "contains"
    COURSE ||--o{ ENROLLMENT : "has"
    COURSE ||--o{ TEACHER : "taught_by"
    
    FORUM_POST ||--o{ FORUM_COMMENT : "has"
    
    VIDEO_LINK }o--o{ COURSE : "associated_with"
    
    USER {
        string username PK
        string passwordHash
        string role "admin|teacher|student"
        string status "active|suspended|banned"
        int violationCount
        object profile
        datetime lastViolationAt
    }
    
    COURSE {
        string _id PK
        string title
        string description
        string teacher_id FK
        array lessons
        datetime createdAt
    }
    
    LESSON {
        string _id PK
        string title
        string content
        string videoUrl
        int order
        string course_id FK
    }
    
    ENROLLMENT {
        string _id PK
        string user_id FK
        string course_id FK
        datetime enrolledAt
        float progress
    }
    
    FORUM_POST {
        string _id PK
        string title
        string content
        string author_id FK
        string category
        array comments
        datetime createdAt
    }
    
    FORUM_COMMENT {
        string _id PK
        string content
        string author_id FK
        string post_id FK
        datetime createdAt
    }
    
    VIDEO_LINK {
        string _id PK
        string url
        string category
        string title
    }
    
    MODERATION_REPORT {
        string _id PK
        string type
        string content
        string reporter_id FK
        string target_id FK
        string status "pending|resolved"
    }
    
    TEACHER {
        string _id PK
        string username FK
    }
```

---

## 6. STATE MANAGEMENT (Quản Lý Trạng Thái)

```mermaid
graph LR
    A["App.jsx<br/>Root State"]
    
    A -->|User Data| B1["currentUser"]
    A -->|User Data| B2["currentRole"]
    A -->|User Data| B3["currentRank"]
    A -->|User Data| B4["currentUserPoints"]
    
    A -->|Auth Data| C1["isAuthOpen"]
    A -->|Auth Data| C2["authMode"]
    A -->|Auth Data| C3["authData"]
    A -->|Auth Data| C4["isAuthLoading"]
    
    A -->|UI State| D1["activeTab"]
    A -->|UI State| D2["authGate"]
    A -->|UI State| D3["isChatOpen"]
    A -->|UI State| D4["searchTerm"]
    
    A -->|Content Data| E1["forumPosts"]
    A -->|Content Data| E2["newPost"]
    A -->|Content Data| E3["commentsByPost"]
    A -->|Content Data| E4["commentDrafts"]
    
    A -->|Course Data| F1["categoryVideos"]
    A -->|Course Data| F2["newVideoData"]
    
    A -->|Points Data| G1["pointsByUser"]
    
    A -->|Admin Data| H1["managedUsers"]
    A -->|Admin Data| H2["isLoadingUsers"]
    
    A -->|Chat Data| I1["messages"]
    A -->|Chat Data| I2["input"]
    A -->|Chat Data| I3["isLoading"]
    
    style B1 fill:#f3e5f5
    style C1 fill:#fff3e0
    style D1 fill:#e1f5ff
    style E1 fill:#e8f5e9
    style F1 fill:#fce4ec
    style G1 fill:#f1f8e9
    style H1 fill:#ede7f6
    style I1 fill:#f5f5f5
```

---

## 7. BACKEND CONTROLLER FLOW (Luồng Xử Lý Backend)

```mermaid
graph TD
    Client["API Request<br/>dari Client"]
    
    Client --> CORS["CORS Middleware<br/>Kiểm tra origin"]
    CORS --> Parser["Body Parser<br/>Parse JSON"]
    Parser --> Auth["Auth Middleware<br/>Verify JWT token"]
    Auth --> Role["Role Check<br/>Check quyền truy cập"]
    Role --> Route["Route Handler"]
    
    Route --> AuthCtrl["authController<br/>Login/Register"]
    Route --> UserCtrl["userController<br/>User Management"]
    Route --> ForumCtrl["forumController<br/>Posts/Comments"]
    Route --> CourseCtrl["courseController<br/>Course CRUD"]
    Route --> LessonCtrl["lessonController<br/>Lesson CRUD"]
    Route --> ChatCtrl["chatController<br/>AI Chat"]
    Route --> ModCtrl["moderationController<br/>Reports"]
    Route --> UploadCtrl["uploadController<br/>Cloudinary"]
    
    AuthCtrl --> Model1["User Model"]
    UserCtrl --> Model1
    ForumCtrl --> Model2["ForumPost/Comment<br/>Models"]
    CourseCtrl --> Model3["Course Model"]
    LessonCtrl --> Model4["Lesson Model"]
    ChatCtrl --> Service1["Gemini API<br/>Service"]
    ModCtrl --> Model5["ModerationReport<br/>Model"]
    UploadCtrl --> Service2["Cloudinary<br/>Service"]
    
    Model1 --> DB["🗄️ MongoDB"]
    Model2 --> DB
    Model3 --> DB
    Model4 --> DB
    Model5 --> DB
    Service1 --> Gemini["🤖 Gemini API"]
    Service2 --> Cloud["☁️ Cloudinary"]
    
    DB --> Response["JSON Response"]
    Gemini --> Response
    Cloud --> Response
    Response --> Client
    
    style CORS fill:#ffe0b2
    style Parser fill:#fff9c4
    style Auth fill:#ffccbc
    style Role fill:#ffab91
    style DB fill:#c8e6c9
    style Gemini fill:#bbdefb
    style Cloud fill:#b2dfdb
```

---

## 8. FORUM POST CREATION FLOW (Luồng Tạo Bài Viết Diễn Đàn)

```mermaid
graph TD
    User["👤 User"]
    UI["ForumView Component"]
    Input["Rich Text Editor<br/>React Quill"]
    
    User -->|1. Type content| Input
    Input -->|2. Update state| UI["newPost = {<br/>title, content,<br/>category<br/>}"]
    UI -->|3. Click Submit| API["POST /api/forum/posts"]
    
    API -->|4. Auth header<br/>+ JWT token| Backend["Express Backend"]
    Backend -->|5. Auth Middleware<br/>Verify JWT| Check{"Token<br/>Valid?"}
    Check -->|No| Error["❌ 401 Unauthorized"]
    Check -->|Yes| Controller["forumController<br/>.createPost()"]
    
    Controller -->|6. Extract data| Extract["- title<br/>- content<br/>- author_id<br/>- category"]
    Extract -->|7. Validate| Validate{"Valid<br/>Data?"}
    Validate -->|No| Error2["❌ 400 Bad Request"]
    Validate -->|Yes| Create["Create ForumPost<br/>Document"]
    
    Create -->|8. Save| DB["MongoDB<br/>forum_posts<br/>collection"]
    DB -->|9. Return<br/>new post| Response["✅ 201 Created<br/>+ postId"]
    Response -->|10. Add to state| UI2["setForumPosts<br/>append new post"]
    UI2 -->|11. Re-render| UI3["Display new post<br/>in list"]
    UI3 -->|12. Clear form| UI4["setNewPost<br/>reset"]
    UI4 -->|13. Show| User
    
    Error -->|Error toast| User
    Error2 -->|Error toast| User
    
    style User fill:#e1f5ff
    style Backend fill:#fff3e0
    style DB fill:#c8e6c9
    style Response fill:#c8e6c9
```

---

## 9. CHAT WITH AI FLOW (Luồng Chat AI)

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant ChatWidget as 💬 ChatWidget
    participant Backend as 🖥️ Backend
    participant Gemini as 🤖 Gemini API
    
    User ->> ChatWidget: 1. Type message
    ChatWidget ->> ChatWidget: 2. Add to local messages
    ChatWidget ->> Backend: 3. POST /api/chat/send<br/>{message, skills}
    
    Backend ->> Backend: 4. Verify JWT
    Backend ->> Backend: 5. Validate input
    Backend ->> Gemini: 6. Send prompt with context<br/>skills, user message
    
    Gemini -->> Backend: 7. AI response
    Backend ->> Backend: 8. Parse response
    Backend ->> Backend: 9. Extract suggested skills
    Backend -->> ChatWidget: 10. Return {<br/>response,<br/>suggestedSkills<br/>}
    
    ChatWidget ->> ChatWidget: 11. Add bot message
    ChatWidget ->> ChatWidget: 12. Display skill buttons
    ChatWidget ->> ChatWidget: 13. Scroll to bottom
    ChatWidget -->> User: 14. Show response
    
    User ->> ChatWidget: 15. Click skill button
    ChatWidget ->> ChatWidget: 16. Navigate to skill
```

---

## 10. VIDEO STREAMING FLOW (Luồng Phát Video)

```mermaid
graph TD
    User["👤 User"]
    Component["HomeView/<br/>LessonFullPage"]
    VideoDB["Get video URL<br/>from Database"]
    VideoURL["Video URL<br/>from Cloudinary"]
    
    User -->|Click Play| Component
    Component -->|Query| VideoDB
    VideoDB -->|Return URL| VideoURL
    
    VideoURL -->|Check format| Format{Format?}
    Format -->|HLS<br/>.m3u8| HLS["📹 Initialize<br/>HLS.js"]
    Format -->|DASH<br/>.mpd| DASH["📹 Initialize<br/>DASH.js"]
    Format -->|YouTube| YT["📺 React-YouTube<br/>Component"]
    
    HLS -->|Stream| CDN["🌐 Cloudinary CDN<br/>Adaptive streaming"]
    DASH -->|Stream| CDN
    YT -->|Embed| YouTube["🎥 YouTube Servers"]
    
    CDN -->|Video chunks| Player["▶️ HTML5 Player"]
    YouTube -->|Video stream| Player
    Player -->|Display| User
    
    style User fill:#e1f5ff
    style Component fill:#f3e5f5
    style CDN fill:#ffe0b2
    style Player fill:#c8e6c9
```

---

## 11. ROLE-BASED ACCESS CONTROL (RBAC)

```mermaid
graph TD
    User["👤 User"]
    JWT["JWT Token<br/>with role"]
    Middleware["Auth Middleware<br/>Check JWT"]
    
    Middleware -->|Verify| Check{"Role<br/>Valid?"}
    Check -->|No| Deny["❌ 403 Forbidden"]
    Check -->|Yes| Route["Route Handler"]
    
    Route -->|Admin| Admin["⚙️ Admin Features<br/>- Manage users<br/>- View all reports<br/>- System stats<br/>- Ban/suspend"]
    Route -->|Teacher| Teacher["👨‍🏫 Teacher Features<br/>- Create courses<br/>- Add lessons<br/>- Upload videos<br/>- View enrollments"]
    Route -->|Student| Student["📚 Student Features<br/>- Enroll courses<br/>- View lessons<br/>- Post forum<br/>- Chat with AI"]
    
    Admin --> Features["Advanced<br/>Features"]
    Teacher --> Features
    Student --> Features
    
    User -->|Logs in| JWT
    JWT -->|Sent in header| Middleware
    Deny -->|Error| User
    Features -->|Response| User
    
    style Admin fill:#ffccbc
    style Teacher fill:#fff9c4
    style Student fill:#c8e6c9
```

---

## 12. DEPLOYMENT ARCHITECTURE (Kiến Trúc Triển Khai)

```mermaid
graph TB
    GitHub["🔗 GitHub<br/>Repository"]
    
    GitHub -->|Push to<br/>main branch| Build["Build Pipeline"]
    
    Build -->|Frontend| FrontendBuild["📦 npm run build<br/>(Vite)"]
    Build -->|Backend| BackendBuild["📦 npm install"]
    
    FrontendBuild -->|Output: dist/| VercelBuild["🚀 Vercel Build"]
    BackendBuild -->|Output: node_modules/| RenderBuild["🚀 Render Build"]
    
    VercelBuild -->|Deploy| Vercel["Vercel Servers<br/>🌍 Global CDN<br/>- URL: your-site.vercel.app<br/>- PR previews<br/>- Instant rollback"]
    
    RenderBuild -->|Deploy| Render["Render Servers<br/>Node.js Container<br/>- Port: 5000<br/>- Auto-restart<br/>- Logs available"]
    
    Render -->|Connect| MongoDB["MongoDB Atlas<br/>Cloud Database<br/>- Connection pooling<br/>- Backups<br/>- Replica sets"]
    
    Render -->|API calls| Cloudinary["Cloudinary<br/>Media CDN<br/>- Image optimization<br/>- Video streaming<br/>- Global CDN"]
    
    Render -->|API calls| Gemini["Google Cloud<br/>Gemini API<br/>- Generative AI<br/>- Chat service"]
    
    Vercel -->|HTTPS| User["👤 Users<br/>Worldwide"]
    User -->|HTTP/REST| Render
    Render -->|HLS/DASH| User
    
    style GitHub fill:#e1f5ff
    style Vercel fill:#fff3e0
    style Render fill:#ffe0b2
    style MongoDB fill:#c8e6c9
    style Cloudinary fill:#b2dfdb
    style Gemini fill:#bbdefb
    style User fill:#f3e5f5
```

---

## 13. PERFORMANCE OPTIMIZATION (Tối Ưu Hiệu Suất)

```mermaid
graph LR
    subgraph Frontend["🎨 Frontend Optimization"]
        F1["Code Splitting<br/>Vite bundler"]
        F2["Component Chunks<br/>- editor.js<br/>- player.js<br/>- vendor.js"]
        F3["Lazy Loading<br/>Dynamic imports"]
        F4["Caching<br/>localStorage"]
    end
    
    subgraph Backend["🖥️ Backend Optimization"]
        B1["Database Indexing<br/>MongoDB indexes"]
        B2["Query Optimization<br/>Lean queries"]
        B3["Connection Pooling<br/>Mongoose"]
        B4["Caching Layer<br/>Seed data"]
    end
    
    subgraph CDN["☁️ CDN & Caching"]
        C1["Cloudinary<br/>Image optimization<br/>Video streaming"]
        C2["Vercel CDN<br/>Static files<br/>Global regions"]
        C3["Gzip Compression<br/>HTTP compression"]
    end
    
    F1 --> F2 --> F3 --> F4
    B1 --> B2 --> B3 --> B4
    C1 --> C2 --> C3
    
    F4 --> Result["⚡ Fast Load Times<br/>Smooth UX"]
    B4 --> Result
    C3 --> Result
    
    style Result fill:#c8e6c9
```

---

## 14. ERROR HANDLING & LOGGING (Xử Lý Lỗi & Ghi Log)

```mermaid
graph TD
    Error["⚠️ Error Occurs"]
    
    Error -->|Frontend| FE["Frontend Error"]
    Error -->|Backend| BE["Backend Error"]
    
    FE -->|Try-catch| FCatch["Catch block"]
    FCatch -->|Display| Toast["Toast Notification<br/>User friendly message"]
    Toast -->|Log to| Console["Browser Console<br/>Dev tools"]
    
    BE -->|Try-catch| BCatch["Catch block"]
    BCatch -->|Check type| Type{"Error<br/>Type?"}
    Type -->|Validation| Val["❌ 400<br/>Bad Request"]
    Type -->|Auth| Auth["❌ 401<br/>Unauthorized"]
    Type -->|Permission| Perm["❌ 403<br/>Forbidden"]
    Type -->|Not found| NotFound["❌ 404<br/>Not Found"]
    Type -->|Server| Server["❌ 500<br/>Server Error"]
    
    Val --> Log["📝 Log error details"]
    Auth --> Log
    Perm --> Log
    NotFound --> Log
    Server --> Log
    
    Log -->|Store in| Logs["Server Logs<br/>Render console<br/>timestamps<br/>stack traces"]
    
    Logs -->|Return| Response["JSON Error Response<br/>{<br/>  status,<br/>  message,<br/>  data<br/>}"]
    Response -->|Frontend| Toast
```

---

## 15. SECURITY LAYER (Lớp Bảo Mật)

```mermaid
graph TD
    Client["🌐 Client"]
    
    Client -->|HTTPS| CORS["CORS Check<br/>Whitelist origins"]
    CORS -->|Pass| Auth["JWT Verification<br/>Token signature"]
    Auth -->|Invalid| Reject["❌ 401 Reject"]
    Auth -->|Valid| Extract["Extract userId<br/>& role"]
    
    Extract -->|Check| Role["RBAC<br/>Role Check"]
    Role -->|No access| Deny["❌ 403 Deny"]
    Role -->|Has access| Input["Input Validation<br/>Sanitize data"]
    
    Input -->|Invalid| InputErr["❌ 400 Error"]
    Input -->|Valid| Hash["Password Hashing<br/>bcryptjs"]
    Hash -->|New password| Store["Encrypt in DB"]
    Store -->|Prevent| SQLi["SQL Injection"]
    
    Extract -->|User context| Log["Audit Log<br/>Track actions"]
    
    Extract -->|Database query| Query["Safe query<br/>Mongoose ORM<br/>No SQL injection"]
    
    Reject -->|Response| Client
    Deny -->|Response| Client
    InputErr -->|Response| Client
    Query -->|Data| Client
    Log -->|Stored| Audit["🔐 Audit Trail"]
    
    style Auth fill:#ffccbc
    style Role fill:#ffab91
    style Hash fill:#ff8a80
    style Query fill:#c8e6c9
    style Audit fill:#fff9c4
```

---

Các sơ đồ này trực quan hóa toàn bộ kiến trúc hệ thống KNS - Z-Mate Hub, từ giao diện người dùng cho đến triển khai trên server.

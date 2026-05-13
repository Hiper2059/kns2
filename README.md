# KNS (Full Stack)

## 1) Requirements

- Node.js 18+ (khuyen nghi)
- MongoDB Atlas (hoac MongoDB local)

## 2) Setup ENV

### Backend (root)

- Copy `.env.example` thanh `.env`
- Dien gia tri:
  - `MONGODB_URI` (MongoDB connection string)
  - `GEMINI_API_KEY` (neu dung chat/moderation)
  - `ADMIN_USERNAME`, `ADMIN_PASSWORD`

### Frontend

- Vao `frontend/`
- Copy `.env.example` thanh `.env`
- Dien `VITE_API_BASE_URL=http://localhost:5000`

## 3) Chay local

### Backend

```bash
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 4) Deploy nhanh

### Backend (Render)

- Build command: `npm install`
- Start command: `npm start`
- Set env trong Render theo `.env`

### Frontend (Vercel)

- Framework: Vite
- Build command: `npm run build`
- Output dir: `dist`
- Env: `VITE_API_BASE_URL=https://your-backend-domain.com`

## 5) Luu y

- Khong commit file `.env` len GitHub.
- Neu dung MongoDB Atlas, can whitelist IP trong Network Access.

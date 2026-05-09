# Z-Mate Frontend (Vite + React)

## 1) Chạy local

- Cài package frontend:
	- npm install
- Tạo file .env trong thư mục frontend từ .env.example
- Điền biến:
	- VITE_API_BASE_URL=http://localhost:5000
- Chạy:
	- npm run dev

## 2) Deploy Frontend lên Vercel

- Framework preset: Vite
- Build command: npm run build
- Output directory: dist

Biến môi trường cần set trên Vercel:

- VITE_API_BASE_URL=https://your-backend-domain.com

## 3) Lưu ý khi chạy online

- Frontend chỉ là static site, không chạy trực tiếp server Express.
- Bạn cần deploy backend (Express + MongoDB) lên một nền tảng server như Render/Railway/Fly.io, sau đó trỏ VITE_API_BASE_URL về backend đó.

## 4) Trường hợp bị lỗi CORS

Backend dùng biến FRONTEND_ORIGIN để whitelist domain.

Ví dụ trên backend .env:

- FRONTEND_ORIGIN=http://localhost:5173,https://your-site.vercel.app,https://*.vercel.app

Bạn có thể thêm nhiều domain, ngăn cách bằng dấu phẩy.

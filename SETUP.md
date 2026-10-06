# BrainFlow setup

## 1. Backend
```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Required backend `.env`:
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`

For AI:
- `AI_PROVIDER=openai`
- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-6-luna`

For password reset email in production:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`

Without SMTP in development, the OTP is printed in the backend terminal.

## 2. Frontend
```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 3. Production
Frontend: Vercel
Backend: Render
Database: MongoDB Atlas

Set:
- frontend `VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com/api`
- frontend `VITE_SOCKET_URL=https://YOUR-BACKEND.onrender.com`
- backend `CLIENT_URL=https://YOUR-FRONTEND.vercel.app`
- backend `NODE_ENV=production`

Do not commit `.env` or API keys.

# BrainFlow

AI-powered multi-tenant collaborative digital workspace.

## Included
- JWT HttpOnly cookie authentication
- Register/login/logout/session
- Forgot password with email OTP + hashed OTP + expiry/attempt limits
- Multi-workspace memberships and roles
- Documents with Slate editor
- Real-time document collaboration using Socket.IO + Yjs
- Presence events
- AI actions: chat, summarize, rewrite, expand, shorten, professional, casual, explain, improve, brainstorm
- AI usage persistence
- Notifications
- Activity logging
- React/Vite + Tailwind CSS v3 frontend

## Setup
1. Copy `backend/.env.example` to `backend/.env` and fill MongoDB/JWT.
2. Add `OPENAI_API_KEY` if AI is needed.
3. Optionally configure SMTP for password-reset email.
4. `cd backend && npm install && npm run dev`
5. `cd frontend && npm install && npm run dev`

No Gemini API is used.

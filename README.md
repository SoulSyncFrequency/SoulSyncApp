# SoulSync Full App (Final)

Fullstack app spremna za Render: backend u rootu (Express + Postgres), frontend u /frontend (Vite/React). 
Uključeno: JWT + refresh, reset password, ProtectedRoute, Navigation, ESLint/Prettier/Husky, VSCode settings, healthz.

## Quick Start (local)
1. Backend ENV (`.env` u rootu):
   - DATABASE_URL=postgres://user:pass@host:5432/db
   - JWT_SECRET=<random_hex>
   - FRONTEND_ORIGIN=http://localhost:5173
2. Install & migrate
   ```bash
   npm install
   npm run migrate:secure
   npm run dev
   ```
3. Frontend
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Otvori http://localhost:5173

## Render
- Backend (Root=., Build=`npm install && npm run build`, Start=`npm start`, Health=`/healthz`)
- Frontend (Root=`frontend`, Build=`npm install && npm run build`, Publish=`dist`)
- ENV:
  - Backend: DATABASE_URL, JWT_SECRET, FRONTEND_ORIGIN (i opcionalno SMTP_*)
  - Frontend: VITE_API_URL=https://<tvoj-backend>.onrender.com
- SPA rewrite: `/* -> /index.html` (Rewrite)

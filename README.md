# SoulSync Full App

Kompletna fullstack aplikacija (backend + frontend) s autentikacijom, refresh tokenima, reset lozinke, zaštićenim rutama i navigacijskim headerom.  
Spremna za lokalni razvoj i deploy na **Render**.

---

## 🚀 Funkcionalnosti
- **Auth flow**: registracija, login, refresh tokeni, logout  
- **Password reset**: forgot password + reset password token preko e-maila  
- **Zaštićene rute**: `Dashboard` i `Settings` dostupne samo logiranim korisnicima  
- **React Router** integracija s ProtectedRoute wrapperom  
- **Navigacija**: zajednički header (Dashboard | Settings | Logout)  
- **Backend sigurnost**: Helmet, CORS, rate limiting, JWT, migracije za refresh_tokens i password_resets  

---

## 🛠️ Instalacija (lokalno)

### 1. Kloniraj repo i instaliraj zavisnosti
```bash
git clone <tvoj-repo>
cd <tvoj-repo>
```

**Backend**
```bash
cd backend
npm install
```

**Frontend**
```bash
cd ../frontend
npm install
```

---

### 2. Postavi ENV varijable

**Backend (`backend/.env`)**
```
DATABASE_URL=postgres://user:pass@host:5432/db
JWT_SECRET=neki_random_string
FRONTEND_ORIGIN=http://localhost:5173

# Opcionalno za reset password email:
SMTP_HOST=smtp.mailserver.com
SMTP_PORT=587
SMTP_USER=korisnik
SMTP_PASS=lozinka
SMTP_FROM=no-reply@soulsync.app
```

**Frontend (`frontend/.env`)**
```
VITE_API_URL=http://localhost:3000
```

---

### 3. Pokreni migracije
```bash
cd backend
npm run migrate:secure
```

---

### 4. Pokretanje lokalno
**Backend**
```bash
cd backend
npm run dev
```

**Frontend**
```bash
cd frontend
npm run dev
```

Aplikacija će raditi na:
- Frontend: [http://localhost:5173](http://localhost:5173)  
- Backend: [http://localhost:3000](http://localhost:3000)  

---

## 🌐 Deploy na Render

### Backend (Web Service)
- **Root directory**: `backend`
- **Build command**:  
  ```bash
  npm install && npm run build
  ```
- **Start command**:  
  ```bash
  npm start
  ```
- **Health check path**: `/healthz`
- **Environment variables**: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`, (SMTP varijable po želji)

Pokreni migracije jednom:
```bash
npm run migrate:secure
```

### Frontend (Static Site)
- **Root directory**: `frontend`
- **Build command**:  
  ```bash
  npm install && npm run build
  ```
- **Publish directory**: `dist`
- **Environment variables**:  
  ```
  VITE_API_URL=https://tvoj-backend.onrender.com
  ```

---

## 📂 Struktura projekta
```
backend/
  src/
    server.ts
    routes/auth.ts
    middleware/auth.ts
    utils/email.ts
  scripts/migrate-secure.ts
  package.json
  tsconfig.json

frontend/
  src/
    App.jsx
    api.js
    components/
      AuthPage.jsx
      LoginForm.jsx
      RegisterForm.jsx
      Dashboard.jsx
      Settings.jsx
      ForgotPassword.jsx
      ResetPassword.jsx
      ProtectedRoute.jsx
      Navigation.jsx
```

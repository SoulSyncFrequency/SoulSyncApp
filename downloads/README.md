# 🌌 SoulSyncApp

![CI](https://github.com/SoulSyncFrequency/SoulSyncApp/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/SoulSyncFrequency/SoulSyncApp/branch/main/graph/badge.svg)](https://codecov.io/gh/SoulSyncFrequency/SoulSyncApp)

---

## 🚀 O projektu
**SoulSyncApp** je fullstack aplikacija za terapije i praćenje zdravlja, bazirana na vlastitim patentima i modulima (F₀ resonance, EMDR, Metabolic Awakening, Nutrition & Lifestyle itd.).

Sastoji se od:
- **Frontend**: React + Vite (Capacitor za mobilnu aplikaciju)
- **Backend**: Node.js + Express (SQLite/Postgres baza)
- **CI/CD**: GitHub Actions + Codecov za coverage
- **Deploy**: Render (backend + frontend), moguće i Docker/Kubernetes (`helm/`, `k8s/` mape)

---

## 📦 Struktura projekta

```
backend/     # Node.js Express API
frontend/    # React + Vite app
.github/     # CI/CD workflow (ci.yml)
helm/        # Helm chart za Kubernetes deploy
k8s/         # Kubernetes YAML manifesti
```

---

## 🛠️ Instalacija (lokalno)

### Backend
```bash
cd backend
npm install
npm run dev
```
API dostupan na `http://localhost:5000`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Aplikacija dostupna na `http://localhost:5173`.

---

## 🧪 Testiranje
Pokretanje testova (s coverage-om):
```bash
cd backend
npm test -- --coverage
```

Frontend (ako ima testova):
```bash
cd frontend
npm test -- --coverage
```

---

## ☁️ Deploy

### Render (preporučeno za testiranje)
- **Backend** → Web Service (Node), root `backend/`
- **Frontend** → Static Site, root `frontend/`, publish dir `dist/`

### Docker
```bash
docker build -t soulsync-backend ./backend
docker run -p 5000:5000 soulsync-backend
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

---

## ✅ Statusi
- **CI**: Automatski testovi pokrenuti na svakom pushu (`ci.yml`)
- **Codecov**: Coverage analiza svih testova

---

## 👨‍💻 Autor
**Marko Jurič**  
Inventor & developer of the F₀ resonance therapeutic system.  

# F₀ Engine v2 — Integration Notes (v288)

This app now includes the official **F₀ Engine v2** module wired into the TypeScript backend.

- Service (TS): `src/services/F0Engine.v2.ts`
- Route (TS): `src/routes/f0.ts`
- Mounted at: `POST /api/f0score` via `src/app.ts`

## Request example

```json
{
  "Sym": 0.78, "Pol": 0.64, "Bph": 0.92, "Emo": 0.81, "Coh": 0.73,
  "Frac": 0.66, "Conn": 0.70, "Chak": 0.75, "Info": 0.68, "Safe": 0.93,
  "disease_type": "neurodegenerative"
}
```

## Response
```json
{ "F0_score": 0.842 }
```

### Build & run
- **Dev:** `npm run dev` (uses tsx, loads `src/server.ts` which uses `src/app.ts`)
- **Build:** `npm run build` → emits to `dist/`
- **Start:** `npm start` (runs `node dist/server.js`)

> Note: Legacy JS files were also added under `backend/routes` and `backend/services` as a fallback, but the **TS source under `src/`** is authoritative and used during build.


---
## v288 PRO Additions
- **/api/admin/suggestions/apply** — server-side merge (auto‑tune by score) + backup
- **/api/admin/datasheet/pdf** — JSON → PDF tablica (reports/)
- **/api/f0/healthz** — health probe za F₀ Engine
- **/api/f0score** — sada s **Zod validacijom**, **cache-om** i opcionalnim **metrics histogramom**
- **Realtime export progress** — WS ako je dostupan (Socket.IO), fallback na SSE (`GET /api/admin/export/:id/stream`)
- **CI rate‑policy checker** — diff trenutnih vs. predloženih limita i PR komentar
- **Testovi** — `tests/f0/f0engine.test.ts`, `tests/suggestions/suggestions.test.ts`
- **ENV overrides** — `F0_SAFE_THRESHOLD`, `F0_SYNERGY_SCALE`, `F0_CACHE_MAX`, `F0_CACHE_TTL_MS`

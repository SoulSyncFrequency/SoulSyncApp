HARDENING REPORT for v90.6.0
- Rewrote backend/src/routes/adminTherapyModules.ts fully (logs, export, stats, CRUD).
- Rewrote backend/src/routes/executor.ts fully (THERAPIST guard, queue fallback, hooks).
- Rebuilt backend/src/app.ts to a minimal, consistent composition (removed broken imports).
- Stubbed TS files that contained '...' to avoid compile errors (server.ts kept minimal start).
- No changes to frontend in this pass.
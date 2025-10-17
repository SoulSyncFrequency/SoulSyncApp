
# Legal Patch — Integration Guide

This patch provides ready-made legal documents and an Express route file.

## Files
- apps/backend/public/legal/privacy.html
- apps/backend/public/legal/terms.html
- apps/backend/routes/legal.ts

## Steps
1) Copy the files into your project preserving paths.
2) In your backend entry (the file that creates `const app = express()`), add:
   ```ts
   import path from 'path';
   import legalRoutes from './routes/legal';
   app.use('/public', express.static(path.join(__dirname, 'public')));
   app.use(legalRoutes);
   ```
3) Rebuild/restart the backend.
4) Test:
   - GET /legal/privacy -> serves privacy.html
   - GET /legal/terms -> serves terms.html

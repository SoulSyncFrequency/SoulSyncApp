import { Router } from 'express';
import path from 'path';

const router = Router();
const legalRoot = path.join(__dirname, '..', 'public', 'legal');

router.get('/legal/privacy', (_req, res) => {
  res.sendFile(path.join(legalRoot, 'privacy.html'));
});

router.get('/legal/terms', (_req, res) => {
  res.sendFile(path.join(legalRoot, 'terms.html'));
});

export default router;

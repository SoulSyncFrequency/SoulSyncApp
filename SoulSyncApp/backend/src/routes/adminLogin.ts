import { Router } from 'express';
const router = Router();
// delegated: prefer /auth/login (DB session). Keep for backwards-compat.
router.post('/admin/login', (_req, res) => {
  res.status(426).json({ message: 'Use /auth/login' });
});
export default router;

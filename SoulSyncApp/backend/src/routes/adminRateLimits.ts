import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { rateStats } from '../middleware/rateLimit';

const router = Router();
router.use(requireAuth, requireRole(['ADMIN']));

router.get('/admin/rate-limits', (_req, res) => {
  res.json(rateStats());
});

export default router;

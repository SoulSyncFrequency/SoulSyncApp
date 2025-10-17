import { Router } from 'express';
const router = Router();

router.post('/admin/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

export default router;

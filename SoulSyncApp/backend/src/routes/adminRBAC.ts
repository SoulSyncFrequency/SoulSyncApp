import { Router } from 'express';
import { prisma } from '../db/prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
router.use(requireAuth, requireRole(['ADMIN']));

router.get('/admin/rbac/export', async (_req,res)=>{
  if(!prisma) return res.json({ db:false, roles:[], therapistClient:[] });
  // Nemamo centralni Users model u ovom paketu, pa izvozimo TherapistClient relacije
  const tc = await prisma.therapistClient.findMany();
  res.json({ db:true, therapistClient: tc, env: { REQUIRE_2FA: !!process.env.REQUIRE_2FA } });
});

export default router;

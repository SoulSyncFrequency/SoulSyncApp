import { addNotification } from '../services/notifyService';
import { Router } from 'express';
import { prisma } from '../db/prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
router.use(requireAuth, requireRole(['ADMIN']));

// GET all user plans
router.get('/admin/user-plans', async (req,res)=>{
  if(!prisma) return res.status(501).json({error:'DB not available'});
  const plans = await prisma.userPlan.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(plans);
});

// Activate plan
router.post('/admin/user-plans/:id/activate', async (req,res)=>{
  if(!prisma) return res.status(501).json({error:'DB not available'});
  const id = Number(req.params.id);
  const plan = await prisma.userPlan.findUnique({ where: { id } });
  if(!plan) return res.status(404).json({error:'Plan not found'});
  await prisma.userPlan.updateMany({ where: { userId: plan.userId }, data: { active: false } });
  await prisma.userPlan.update({ where: { id }, data: { active: true } });
  res.json({ ok: true });
});

export default router;

// DELETE plan
router.delete('/admin/user-plans/:id', async (req,res)=>{
  if(!prisma) return res.status(501).json({error:'DB not available'});
  const id = Number(req.params.id);
  await prisma.userPlan.delete({ where: { id } });
  res.json({ ok:true });
});

// Revert to previous active plan (most recent older than current)
router.post('/admin/user-plans/:id/revert', async (req,res)=>{
  if(!prisma) return res.status(501).json({error:'DB not available'});
  const id = Number(req.params.id);
  const cur = await prisma.userPlan.findUnique({ where: { id } });
  if(!cur) return res.status(404).json({error:'Plan not found'});
  const prev = await prisma.userPlan.findFirst({ where: { userId: cur.userId, createdAt: { lt: cur.createdAt } }, orderBy: { createdAt: 'desc' } });
  if(!prev) return res.status(400).json({error:'No previous plan'});
  await prisma.userPlan.updateMany({ where: { userId: cur.userId }, data: { active: false } });
  await prisma.userPlan.update({ where: { id: prev.id }, data: { active: true } });
  try { await prisma.auditLog.create({ data: { event: 'USERPLAN_REVERT', actorId: (req as unknown).user?.id, targetType: 'UserPlan', targetId: prev.id, meta: { from: id, to: prev.id } } }); } catch {}
  res.json({ ok:true, activated: prev.id });
});


// --- Notifications glue (create/activate helpers) ---
router.post('/admin/user-plans/:id/notify-activated', async (req,res)=>{
  try{ await addNotification({ type:'USERPLAN_ACTIVATED', message: 'User plan activated', meta:{ id: Number(req.params.id), url:'/admin/user-plans' } }); } catch {}
  res.json({ ok:true })
})

router.post('/admin/user-plans/:id/notify-created', async (req,res)=>{
  try{ await addNotification({ type:'USERPLAN_CREATED', message: 'User plan created', meta:{ id: Number(req.params.id), url:'/admin/user-plans' } }); } catch {}
  res.json({ ok:true })
})

import { addNotification } from '../services/notifyService';
import { Router } from 'express';
import { prisma } from '../db/prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
router.use(requireAuth, requireRole(['ADMIN']));

// List modules
router.get('/admin/modules', async (_req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const mods = await prisma.therapyModule.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(mods);
});

// Create module
router.post('/admin/modules', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const { name, version, description } = req.body || {};
  if(!name || !version) return res.status(400).json({ error: 'name and version required' });
  const m = await prisma.therapyModule.create({ data: { name, version, description } });
  res.json(m);
});

// Toggle active
router.post('/admin/modules/:id/toggle', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const id = Number(req.params.id);
  const m0 = await prisma.therapyModule.findUnique({ where: { id } });
  if(!m0) return res.status(404).json({ error: 'Not found' });
  const m = await prisma.therapyModule.update({ where: { id }, data: { active: !m0.active } });
  if(!m0.active) { try { await prisma.auditLog.create({ data: { event: 'MODULE_MANUAL_ENABLED', actorId: (req as unknown).user?.id, targetType: 'TherapyModule', targetId: id } }); } catch {} }
  res.json(m);
});

// Update info
router.post('/admin/modules/:id/update', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const id = Number(req.params.id);
  const { name, version, description } = req.body || {};
  const m = await prisma.therapyModule.update({ where: { id }, data: { name, version, description } });
  res.json(m);
});

// Get one
router.get('/admin/modules/:id', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const id = Number(req.params.id);
  const m = await prisma.therapyModule.findUnique({ where: { id } });
  if(!m) return res.status(404).json({ error: 'Not found' });
  res.json(m);
});

// Link endpoint/config/files
router.post('/admin/modules/:id/link', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const id = Number(req.params.id);
  const { endpoint, config, files } = req.body || {};
  const m = await prisma.therapyModule.update({ where: { id }, data: { endpoint, config, files } });
  res.json(m);
});

// Logs (with optional filters)
router.get('/admin/modules/:id/logs', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const id = Number(req.params.id);
  const { status, since } = req.query as unknown;
  const where: unknown = { moduleId: id };
  if(status) where.status = status;
  if(since) where.createdAt = { gte: new Date(String(since)) };
  const logs = await prisma.moduleRunLog.findMany({ where, include: { module: true }, orderBy: { createdAt: 'desc' } });
  res.json(logs);
});

// Export logs
router.get('/admin/modules/:id/logs/export', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const id = Number(req.params.id);
  const { format='json' } = req.query as unknown;
  const logs = await prisma.moduleRunLog.findMany({ where: { moduleId: id }, orderBy: { createdAt: 'desc' } });
  if(format === 'csv'){
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="logs.csv"');
    res.write('createdAt,status,extraInput,result\n');
    for(const l of logs){
      const meta = JSON.stringify((l as unknown).response?.meta || {});
      const result = JSON.stringify((l as unknown).response?.result || (l as unknown).response || {});
      res.write(`"${l.createdAt.toISOString()}","${String(l.status).replace(/"/g,'""')}","${meta.replace(/"/g,'""')}","${result.replace(/"/g,'""')}"\n`);
    }
    return res.end();
  } else {
    res.setHeader('Content-Type','application/json');
    res.setHeader('Content-Disposition','attachment; filename="logs.json"');
    return res.end(JSON.stringify(logs, null, 2));
  }
});

// Stats per day
router.get('/admin/modules/:id/logs/stats', async (req,res)=>{
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const id = Number(req.params.id);
  const days = Number((req.query as unknown).days || 30);
  const since = new Date(Date.now() - days*24*60*60*1000);
  const logs = await prisma.moduleRunLog.findMany({ where: { moduleId:id, createdAt:{ gte: since } } });
  const grouped: Record<string,{success:number,failed:number}> = {};
  for(const l of logs){
    const d = l.createdAt.toISOString().split('T')[0];
    grouped[d] ||= { success: 0, failed: 0 };
    if(l.status==='SUCCESS') grouped[d].success++; else grouped[d].failed++;
  }
  const out = Object.entries(grouped).map(([date,v])=>({date, ...v})).sort((a,b)=>a.date.localeCompare(b.date));
  res.json(out);
});

export default router;

// Reset module fail counter (consecutiveFails=0) and clear disabledUntil
router.post('/admin/modules/:id/reset-fails', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const id = Number(req.params.id);
  try {
    await prisma.moduleHealth.upsert({
      where: { moduleId: id },
      update: { consecutiveFails: 0, disabledUntil: null },
      create: { moduleId: id, consecutiveFails: 0, disabledUntil: null }
    });
    try {
      await prisma.auditLog.create({ 
        data: { event: 'MODULE_FAILCOUNT_RESET', actorId: (req as unknown).user?.id, targetType: 'TherapyModule', targetId: id } 
      });
    } catch {}
    try { await addNotification({ type: 'MODULE_RESET', message: 'Fail counter reset & enabled', meta: { id, url: `/admin/therapy-modules` } }); } catch {}
    return res.json({ ok: true });
  } catch (e: unknown) {
    return res.status(500).json({ error: e?.message || 'Failed to reset' });
  }
});

// Reset fail counter AND enable the module in one step
router.post('/admin/modules/:id/reset-and-enable', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const id = Number(req.params.id);
  try {
    await prisma.moduleHealth.upsert({
      where: { moduleId: id },
      update: { consecutiveFails: 0, disabledUntil: null },
      create: { moduleId: id, consecutiveFails: 0, disabledUntil: null }
    });
    await prisma.therapyModule.update({ where: { id }, data: { active: true } });
    try {
      await prisma.auditLog.create({ 
        data: { event: 'MODULE_RESET_AND_ENABLED', actorId: (req as unknown).user?.id, targetType: 'TherapyModule', targetId: id } 
      });
    } catch {}
    return res.json({ ok: true });
  } catch (e: unknown) {
    return res.status(500).json({ error: e?.message || 'Failed to reset & enable' });
  }
});

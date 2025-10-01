import { Router } from 'express';
import { prisma } from '../db/prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { runModule } from '../engine/runModule';
import { enqueueModuleJob, getQueue } from '../queue';
import { onModuleSuccess, onSessionComplete } from '../engine/hooks';

const router = Router();
router.use(requireAuth, requireRole(['ADMIN','THERAPIST']));

router.post('/executor/run', async (req, res) => {
  if (!prisma) return res.status(501).json({ error: 'DB not available' });
  const { userId, input = {} } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  // If therapist, ensure user is their client
  const me: unknown = (req as unknown).user;
  if(me?.role === 'THERAPIST'){
    const rel = await prisma.therapistClient.findFirst({ where: { therapistId: me.id, userId: Number(userId) } });
    if(!rel) return res.status(403).json({ error: 'Not your client' });
  }

  const modules = await prisma.therapyModule.findMany({ where: { active: true } });
  const session = await prisma.therapySession.create({
    data: {
      userId: Number(userId),
      modulesUsed: modules.map(m => ({ id: m.id, name: m.name, version: m.version })),
      status: 'PENDING',
      triggeredByRole: me?.role || 'ADMIN'
    }
  });

  const results: unknown[] = [];
  await prisma.therapySession.update({ where: { id: session.id }, data: { status: 'IN_PROGRESS' } });

  for (const m of modules) {
    // check if module is temporarily disabled
    const mh = await prisma.moduleHealth.findFirst({ where: { moduleId: m.id } }).catch(()=>null);
    if (mh?.disabledUntil && mh.disabledUntil > new Date()) {
      results.push({ moduleId: m.id, name: m.name, status: 'SKIPPED', reason: 'Temporarily disabled' });
      continue;
    }
    if (!m.endpoint) {
      results.push({ moduleId: m.id, name: m.name, status: 'SKIPPED', reason: 'No endpoint set' });
      continue;
    }
    const q = getQueue();
    if (q) {
      await enqueueModuleJob({ module: m, input });
      results.push({ moduleId: m.id, name: m.name, status: 'QUEUED' });
    } else {
      try {
        const standardized = await runModule(m, input);
        await prisma.moduleRunLog.create({ data: { moduleId: m.id, status: 'SUCCESS', response: { meta: input, result: standardized.raw } } });
        results.push(standardized);
        try { await prisma.moduleHealth.upsert({ where: { moduleId: m.id }, update: { consecutiveFails: 0, lastSuccess: new Date() }, create: { moduleId: m.id, consecutiveFails: 0, lastSuccess: new Date() } }); } catch {}
        await onModuleSuccess(standardized, Number(userId), session.id);
      } catch (e: unknown) {
        await prisma.moduleRunLog.create({ data: { moduleId: m.id, status: 'FAILED', response: { meta: input, error: e?.message || 'Unknown' } } });
        results.push({ moduleId: m.id, name: m.name, type: (m as unknown).type || 'generic', status: 'FAILED', score: null, artifacts: [], raw: { error: e?.message || 'Unknown' } });
        try {
          const h = await prisma.moduleHealth.upsert({ where: { moduleId: m.id }, update: { consecutiveFails: { increment: 1 } }, create: { moduleId: m.id, consecutiveFails: 1 } });
          const now = new Date();
          if ((h.consecutiveFails+1) >= 5) {
            await prisma.therapyModule.update({ where: { id: m.id }, data: { active: false } });
            await prisma.auditLog.create({ data: { event: 'MODULE_AUTO_DISABLED', actorId: (req as unknown).user?.id, targetType: 'TherapyModule', targetId: m.id, meta: { reason: '5 consecutive failures', time: now } } });
          }
        } catch {}

      }
    }
  }

  const summary = {
    success: results.filter(r => r.status === 'SUCCESS').length,
    failed: results.filter(r => r.status === 'FAILED').length,
    skipped: results.filter(r => r.status === 'SKIPPED').length,
    queued:  results.filter(r => r.status === 'QUEUED').length,
  };

  await prisma.therapySession.update({
    where: { id: session.id },
    data: { result: { summary, modules: results }, status: summary.failed ? (summary.success ? 'PARTIAL' : 'FAILED') : 'DONE' }
  });

  const saved = await prisma.therapySession.findUnique({ where: { id: session.id } });
  await onSessionComplete(saved);
  res.json({ sessionId: session.id, summary, modules: results });
});

export default router;

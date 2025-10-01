import { Router } from 'express';
import { prisma } from '../db/prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
router.use(requireAuth, requireRole(['ADMIN']));

// List audit logs with filters
router.get('/admin/audit', async (req, res) => {
  if (!prisma) return res.status(501).json({ error: 'DB not available' });
  const { event, since, limit='200' } = req.query as unknown;
  const where: unknown = {};
  if (event) where.event = String(event);
  if (since) where.createdAt = { gte: new Date(String(since)) };
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(limit)||200, 1000)
  });
  res.json(logs);
});

// Export audit logs
router.get('/admin/audit/export', async (req, res) => {
  if (!prisma) return res.status(501).json({ error: 'DB not available' });
  const { format='json', event, since } = req.query as unknown;
  const where: unknown = {};
  if (event) where.event = String(event);
  if (since) where.createdAt = { gte: new Date(String(since)) };
  const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' } });

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit.csv"');
    res.write('createdAt,event,actorId,targetType,targetId,meta\n');
    for (const l of logs) {
      const meta = JSON.stringify(l.meta||{}).replace(/"/g,'""');
      res.write(`"${l.createdAt.toISOString()}","${(l.event||'').replace(/"/g,'""')}","${l.actorId??''}","${(l.targetType||'').replace(/"/g,'""')}","${l.targetId??''}","${meta}"\n`);
    }
    return res.end();
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="audit.json"');
    return res.end(JSON.stringify(logs, null, 2));
  }
});

export default router;

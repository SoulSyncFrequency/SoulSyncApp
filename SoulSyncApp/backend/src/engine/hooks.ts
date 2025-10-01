import { logger } from './logger'
import { prisma } from '../db/prismaClient';

export async function onModuleSuccess(moduleResult: unknown, userId: number, sessionId: number) {
  try {
    logger.info('[hook] module success', { sessionId, userId, module: moduleResult.name, score: moduleResult.score });
    // prostor za budući zapis u per-modul tablice ili artefakte
  } catch (e) { logger.error(e); }
}

export async function onSessionComplete(session: unknown) {
  try {
    logger.info('[hook] session complete', { sessionId: session.id, status: session.status });
    if (!prisma) return;
    const result = (session as unknown).result || {};
    const summary = result.summary || {};
    const hasSuccess = (summary.success || 0) > 0;
    if (session.status === 'DONE' || (session.status === 'PARTIAL' && hasSuccess)) {
      const lastActive = await prisma.userPlan.findFirst({ where: { userId: session.userId, active: true }, orderBy: { createdAt: 'desc' } });
      const version = (lastActive?.version || 0) + 1;
      // Deactivate old
      await prisma.userPlan.updateMany({ where: { userId: session.userId, active: true }, data: { active: false } });
      // Create new
      await prisma.userPlan.create({ data: { userId: session.userId, sessionId: session.id, plan: result, active: true, version, sourceSessionId: session.id } });
      await prisma.auditLog.create({ data: { event: 'USERPLAN_AUTO_ACTIVATED', actorId: session.userId, targetType: 'UserPlan', targetId: session.id, meta: { version } } });
    }
  } catch (e) { logger.error(e); }
}
);
    if (!prisma) return;
    // Ako je sesija DONE ili PARTIAL sa barem jednim uspjehom -> postavi kao aktivni plan
    const result = (session as unknown).result || {};
    const summary = result.summary || {};
    const hasSuccess = (summary.success || 0) > 0;
    if (session.status === 'DONE' || (session.status === 'PARTIAL' && hasSuccess)) {
      // Deaktiviraj stare planove
      await prisma.userPlan.updateMany({ where: { userId: session.userId, active: true }, data: { active: false } });
      // Upsert novi plan iz rezultata sesije
      await prisma.userPlan.create({
        data: {
          userId: session.userId,
          sessionId: session.id,
          plan: result, // cijeli strukturirani rezultat zadržavamo
          active: true
        }
      });
    }
  } catch (e) { logger.error(e); }
}

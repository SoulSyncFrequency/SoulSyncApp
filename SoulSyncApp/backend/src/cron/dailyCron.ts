import { requestWithCB } from './lib/httpClient'
import { logger } from './logger'
import { checkSLOs } from './sloMetrics'
import { sloCheckHourly } from './metricsSLO'
import { sendWeeklyDashboardPDF } from './weeklyDashboardReport'
import { sendDailyReport } from './dailyEmailReport'
import { retryFailedWebhooks } from './retryFailedWebhooks'
import { sendDailyEmailReport } from './dailyEmailReport'
import { pruneNotifications } from './notificationsPrune'
let cron: unknown=null; try { cron = require('node-cron'); } catch {  try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}
import { prisma } from '../db/prismaClient';

export function startDailyCron(){
  if(!cron){ logger.info('[cron] node-cron not installed; skipping'); return;   try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}
  cron.schedule('0 3 * * *', async ()=>{
    try {
      const ninety = new Date(Date.now()-90*24*60*60*1000);
      await prisma?.moduleRunLog.deleteMany({ where: { createdAt: { lt: ninety } } });
      const week = new Date(Date.now()-7*24*60*60*1000);
      await prisma?.therapySession.deleteMany({ where: { status: 'PENDING', createdAt: { lt: week } } });
      // ping active modules
      const mods = await prisma?.therapyModule.findMany({ where: { active: true } });
      for(const m of (mods||[])){
        if(!m.endpoint) continue;
        try {
        const resp = await requestWithCB(m.endpoint, { method: 'HEAD' });
        if(resp && (resp.status<400)){
          // if module was auto-disabled due to fails, try to re-enable
          try {
            const mh = await prisma?.moduleHealth.findFirst({ where: { moduleId: m.id } });
            if(mh && mh.consecutiveFails>=5){
              await prisma?.therapyModule.update({ where: { id: m.id }, data: { active: true } });
              await prisma?.moduleHealth.update({ where: { moduleId: m.id }, data: { consecutiveFails: 0, lastSuccess: new Date(), disabledUntil: null } });
              try { await prisma?.auditLog.create({ data: { event: 'MODULE_AUTO_REENABLED', targetType: 'TherapyModule', targetId: m.id } }); } catch {  try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}
              try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}
          } catch {  try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}
          try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}
      } catch {  try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}
        try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}
    } catch (e) { logger.warn('[cron] error', e?.message);   try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}
  });
  logger.info('[cron] daily maintenance scheduled @ 03:00');

  try{ const res = await pruneNotifications(); logger.info('[Prune]', res) }catch(e){ logger.info('[Prune] failed', (e as unknown)?.message)   try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}

  try{ await sendDailyEmailReport(); }catch(e){  try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}
  try{ await retryFailedWebhooks(); }catch(e){  try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}

  try{ await sendDailyReport() }catch(e){ logger.info('[Daily Email] failed')   try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}

  try{
    const day = new Date().getDay() // 1 = Monday (0=Sun)
    if(day===1) await sendWeeklyDashboardPDF()
  }catch(e){ logger.info('[Weekly PDF] failed trigger')   try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}

  try{ await sloCheckHourly() }catch(e){ logger.info('[SLO] failed')   try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}
  try{ await checkSLOs() }catch(e){ logger.info('[SLO] failed') }
}

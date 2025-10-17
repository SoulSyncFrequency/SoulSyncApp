import { requestWithCB } from './lib/httpClient'
import { logger } from './logger'
import fs from 'fs';
import fetch from 'node-fetch';

const LOG_FILE = 'logs/watchdog.log';
if (!fs.existsSync('logs')) fs.mkdirSync('logs');

async function log(msg: string) {
  const line = `[WATCHDOG] ${new Date().toISOString()} - ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  logger.info(line.trim());
  if(process.env.DISCORD_WEBHOOK_URL){
    requestWithCB(process.env.DISCORD_WEBHOOK_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({content:msg})
    }).catch(()=>{});
  }
}

async function check() {
  try {
    const health = await requestWithCB('http://localhost:3000/healthz', { timeout: 5000 });
    if (!health.ok) throw new Error('healthz not ok');

    const metrics = await requestWithCB('http://localhost:3000/metrics');
    const txt = await metrics.text();
    const lines = txt.split('\n');
    const heapUsed = Number(lines.find(l=>l.startsWith('app_heap_used_bytes'))?.split(' ')[1] || 0) / 1024 / 1024;
    const uptime = Number(lines.find(l=>l.startsWith('app_uptime_seconds'))?.split(' ')[1] || 0);

    if (heapUsed > 1536 || uptime < 60) {
      await log(`heap=${heapUsed.toFixed(1)}MB uptime=${uptime}s → triggering backup+restart`);
          if(process.env.DISCORD_WEBHOOK_URL){
            await requestWithCB(process.env.DISCORD_WEBHOOK_URL,{
              method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({content:`⚠️ [SoulSync Watchdog]\nHeap: ${heapUsed.toFixed(1)}MB | Uptime: ${uptime}s\nAction: Backup + Restart`})
            });
          }
      await requestWithCB('http://localhost:3000/admin/backup', { method: 'POST' });
      await requestWithCB('http://localhost:3000/admin/restart', { method: 'POST' });
    } else {
      await log(`OK heap=${heapUsed.toFixed(1)}MB uptime=${uptime}s`);
    }
  } catch (e: unknown) {
    await log(`ERROR ${e.message} → triggering backup+restart`);
        if(process.env.DISCORD_WEBHOOK_URL){
          await requestWithCB(process.env.DISCORD_WEBHOOK_URL,{
            method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({content:`⚠️ [SoulSync Watchdog]\n${e.message}\nAction: Backup + Restart`})
          });
        }
    try {
      await requestWithCB('http://localhost:3000/admin/backup', { method: 'POST' });
      await requestWithCB('http://localhost:3000/admin/restart', { method: 'POST' });
    } catch {}
  }
}

setInterval(check, 5 * 60 * 1000);
log('Watchdog started');

async function sendDailyReport() {
  if (!process.env.DISCORD_WEBHOOK_URL) return;
  try {
    const vres = await requestWithCB('http://localhost:3000/version');
    const version = await vres.json();
    const mres = await requestWithCB('http://localhost:3000/metrics');
    const txt = await mres.text();
    const lines = txt.split('\n');
    const heap = Number(lines.find(l=>l.startsWith('app_heap_used_bytes'))?.split(' ')[1]||0)/1024/1024;
    const rss = Number(lines.find(l=>l.startsWith('process_resident_memory_bytes'))?.split(' ')[1]||0)/1024/1024;
    const req = Number(lines.find(l=>l.startsWith('app_requests_total'))?.split(' ')[1]||0);
    const uptime = Number(lines.find(l=>l.startsWith('app_uptime_seconds'))?.split(' ')[1]||0);
    const restarts = (fs.existsSync('logs/watchdog.log') ? fs.readFileSync('logs/watchdog.log','utf-8').split('\n').filter(l=>l.includes('triggering backup+restart')).length : 0);
    const msg = `📊 [SoulSync Daily Health Report]\nVersion: v${version.version} • ${version.commit}\nUptime: ${(uptime/3600).toFixed(1)}h\nHeap: ${heap.toFixed(1)} MB | RSS: ${rss.toFixed(1)} MB\nRequests: ${req}\nRestarts today: ${restarts}\nTime: ${new Date().toISOString()}`;
    await requestWithCB(process.env.DISCORD_WEBHOOK_URL,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({content: msg})
    });
  } catch(e: unknown) {
    await log('Daily report failed: '+e.message);
  }
}

setInterval(sendDailyReport, 24 * 60 * 60 * 1000);

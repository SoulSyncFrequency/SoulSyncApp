
import { prisma } from '../db/prismaClient'
import { sendEmail } from '../services/emailService'

const CRITICAL = ['MODULE_TOGGLED','MODULE_RESET','USER_DELETED','USER_DEACTIVATED','USERPLAN_ACTIVATED']

export async function sendDailyReport(){
  if(!prisma) return
  const since = new Date(Date.now() - 24*60*60*1000)
  const items = await (prisma as unknown).notification.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: 'desc' } })
  const critical = items.filter((i: unknown)=> CRITICAL.includes(i.type))
  const admins = await (prisma as unknown).user.findMany({ where: { role: 'ADMIN' } })
  const total = items.length, crit = critical.length

  const top = critical.slice(0,10).map((n: unknown)=>`<li>[${n.type}] ${escapeHtml(n.message||'')} — ${new Date(n.createdAt).toLocaleString()}</li>`).join('')
  const html = `
  <div style="font-family:system-ui,Segoe UI,Arial">
    <h2>SoulSync — dnevni izvještaj notifikacija</h2>
    <p><b>Ukupno:</b> ${total} &nbsp; <b>Kritične:</b> ${crit}</p>
    <h3>Zadnjih 10 kritičnih</h3>
    <ol>${top || '<li>Nema kritičnih događaja u zadnja 24h.</li>'}</ol>
    <p><a href="${process.env.FRONTEND_ORIGIN || ''}/admin/notifications">Pogledaj sve u aplikaciji</a></p>
  </div>`

  for(const a of admins){
    await sendEmail(a.email, `[SoulSync] Daily notification report`, html)
  }
}

function escapeHtml(s:string){ return String(s).replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' } as unknown)[c]) }

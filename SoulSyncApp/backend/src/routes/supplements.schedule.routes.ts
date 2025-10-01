
import { Router } from 'express'

const router = Router()
/**
 * Deterministic schedule suggestion.
 * Query/body:
 * - timesPerDay (1..12)
 * - wakeStart (e.g., '07:30') and wakeEnd ('23:00') — optional; default 08:00–22:00
 * - withFood: true|false (optional) → shifts to typical meal times if true
 * - avoidLate: true|false (optional) → nudge last dose before 20:00
 */
router.post('/supplements/schedule-suggest', (req, res) => {
  try{
    const tpd = Math.max(1, Math.min(12, Number(req.body?.timesPerDay||3)))
    const wS = String(req.body?.wakeStart||'08:00')
    const wE = String(req.body?.wakeEnd||'22:00')
    const withFood = String(req.body?.withFood||'false').toLowerCase()==='true'
    const avoidLate = String(req.body?.avoidLate||'true').toLowerCase()==='true'

    function toMin(hhmm:string){ const [h,m] = hhmm.split(':').map(x=>Number(x)); return (h*60 + (m||0))|0 }
    function toHHMM(min:number){ const h = Math.floor(min/60)%24; const m = Math.floor(min%60); const pad=(x:number)=>String(x).padStart(2,'0'); return `${pad(h)}:${pad(m)}` }

    let start = toMin(wS), end = toMin(wE)
    if (end<=start) end = start + 14*60 // assume 14h wake if invalid

    const span = end - start
    const step = Math.floor(span / tpd)
    let times:number[] = []
    for (let i=0;i<tpd;i++){
      times.push(start + Math.floor(step*i + step/2)) // center each slot
    }
    if (avoidLate){ times = times.map(t=> Math.min(t, toMin('20:00'))) }

    if (withFood){
      // Typical meals ~08:00, 13:00, 19:00 — map closest slots to these anchors
      const anchors = [toMin('08:00'), toMin('13:00'), toMin('19:00')]
      for (let i=0; i<Math.min(tpd, anchors.length); i++){
        times[i] = anchors[i]
      }
      times.sort((a,b)=>a-b)
    }

    const schedule = times.map(t=>({ time: toHHMM(t) }))
    res.json({
      ok:true,
      disclaimer: 'Informational only. Not medical advice. Consult a qualified professional before changing supplementation.',
      params: { timesPerDay: tpd, wakeStart: wS, wakeEnd: wE, withFood, avoidLate },
      schedule
    })
  }catch(e:any){
    res.status(500).json({ error:'schedule_suggest_error', message:String(e?.message||e) })
  }
})

export default router

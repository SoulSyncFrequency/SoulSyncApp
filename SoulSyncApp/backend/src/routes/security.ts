import { Router } from 'express'
const router = Router()
router.post('/_csp/report', (req,res)=>{
  try{ const fs = require('fs'); const path = require('path'); const dir = path.join(process.cwd(),'security','csp'); fs.mkdirSync(dir,{recursive:true}); const rec = { ts: Date.now(), ua: req.headers['user-agent']||'', report: req.body||{} }; fs.appendFile(path.join(dir,'csp.jsonl'), JSON.stringify(rec)+'\n', ()=>{}) }catch{}
  res.status(204).end()
})
export default router

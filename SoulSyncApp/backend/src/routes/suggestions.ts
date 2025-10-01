// src/routes/suggestions.ts
import { Router } from 'express'
let Counter: any = null; try{ Counter = require('prom-client').Counter }catch{}
const sugCounter = Counter ? new Counter({ name:'suggestions_apply_total', help:'count of suggestions apply calls' }) : null
import { applySuggestions, backupDocument, Suggestion } from '../services/suggestions'
import { SuggestionsApplySchema } from '../schemas/suggestions'
import { verifySuggestions } from '../ai/verifySuggestions'

const router = Router()

/**
 * POST /api/admin/suggestions/apply
 * body: { collection?:string, id?:string, document:any, suggestions: Suggestion[], autoTune?:boolean, dryRun?:boolean }
 */
router.post('/admin/suggestions/apply', async (req, res)=>{ sugCounter?.inc();
  const { collection='generic', id='temp', document, suggestions, autoTune=false, dryRun=false } = req.body || {}
  const parsed = SuggestionsApplySchema.safeParse(req.body||{})
  if(!parsed.success){ return res.status(400).json({ error:'validation_error', details: parsed.error.flatten() }) }
  const { collection='generic', id='temp', document, suggestions, autoTune=false, dryRun=false } = parsed.data
  if(!document || !Array.isArray(suggestions)){
    return res.status(400).json({ error:'invalid_payload' })
  }
  const original = document
  const verification = await verifySuggestions(original, suggestions)
  if(process.env.VERIFY_SUGGESTIONS === '1' && verification.flags.length){ return res.status(409).json({ ok:false, verification, message:'risky_changes_flagged' }) }
  const { result, applied, conflicts } = applySuggestions(original, suggestions, { autoTune })

  let backupPath: string | null = null
  if(!dryRun){
    try{ backupPath = await backupDocument(collection, id, original) } catch {}
  }
  return res.json({ ok:true, backupPath, counts:{ applied:applied.length, conflicts:conflicts.length }, conflicts, result })
})

export default router

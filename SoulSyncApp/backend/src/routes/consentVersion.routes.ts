import { withEtag } from '../utils/etag'
import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { createConsentVersion,listConsentVersions } from '../models/consentVersion'
const r=Router()
r.get('/admin/consents',requireAuth,async(_req,res)=>{ { const data=await listConsentVersions(); if(!withEtag(res,data)){} } })
r.post('/admin/consents',requireAuth,async(req,res)=>{ const {text}=req.body||{}; if(!text)return res.status(400).end(); res.json(await createConsentVersion(text)) })
export default r

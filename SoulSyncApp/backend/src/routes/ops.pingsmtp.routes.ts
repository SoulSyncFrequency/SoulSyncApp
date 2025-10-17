
import { Router } from 'express'
import nodemailer from 'nodemailer'

const router = Router()

router.get('/ops/ping-smtp', async (_req, res) => {
  try{
    const url = process.env.SMTP_URL
    if(!url) return res.status(503).json({ error:'smtp_not_configured' })
    const transporter = nodemailer.createTransport(url)
    await transporter.verify()
    res.status(204).end()
  }catch(e:any){
    res.status(503).json({ error:'smtp_unavailable', message:String(e?.message||e) })
  }
})

export default router

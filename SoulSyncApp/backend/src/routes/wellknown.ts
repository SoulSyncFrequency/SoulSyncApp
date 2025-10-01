import { Router } from 'express'
const router = Router()

router.get('/.well-known/security.txt', (_req,res)=>{
  const email = process.env.SECURITY_CONTACT || 'security@example.com'
  const txt = `Contact: mailto:${email}\nExpires: 2099-12-31T23:59:59Z\nPreferred-Languages: en,hr\n`
  res.type('text/plain').send(txt)
})

router.get('/robots.txt', (_req,res)=>{
  const txt = `User-agent: *\nDisallow:\n`
  res.type('text/plain').send(txt)
})

export default router

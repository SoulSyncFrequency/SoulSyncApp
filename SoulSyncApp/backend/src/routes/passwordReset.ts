import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prismaClient';
import { sendMail } from '../utils/mailer';

const router = Router();

function hash(pw:string){ return crypto.createHash('sha256').update(pw).digest('hex'); }
function valid(pw:string){ return typeof pw==='string' && pw.length>=10 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw); }

router.post('/auth/password/request', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const { email } = req.body || {};
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000*60*30);
    await prisma.resetToken.create({ data: { token, userId: user.id, expiresAt } });
    const url = (process.env.APP_URL || 'http://localhost:3000') + '/auth/password/reset/' + token;
    await sendMail(email, 'Reset your SoulSync password', 'Click to reset: ' + url);
  }
  res.json({ ok: true });
});

router.post('/auth/password/reset/:token', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const tok = await prisma.resetToken.findUnique({ where: { token: require('crypto').createHash('sha256').update(req).digest('hex').params.token } });
  if (!tok || tok.used || tok.expiresAt < new Date()) return res.status(400).json({ error: 'Invalid or expired' });
  const { password } = req.body || {};
  if (!valid(password)) return res.status(400).json({ error: 'Password too weak (min 10 chars, upper, lower, digit)' });
  await prisma.user.update({ where: { id: tok.userId }, data: { password: hash(password) } });
  await prisma.resetToken.update({ where: { id: tok.id }, data: { used: true } });
  res.json({ ok: true });
});

export default router;

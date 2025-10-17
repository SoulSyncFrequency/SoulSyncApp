import { requireAuth } from '../middleware/requireAuth'
import argon2 from 'argon2'
import { addNotification } from '../services/notifyService';
import { Router } from 'express'
import { bruteProtect } from '../middleware/brute';
import crypto from 'crypto';
import { prisma } from '../db/prismaClient';
import { rateLimit } from '../middleware/rateLimit';
import { sendMail } from '../utils/mailer';

const router = Router();
router.use(rateLimit);

async function hashPassword(pw: string) { return await argon2.hash(pw, { type: argon2.argon2id }) }
async function verifyPassword(hash: string, pw: string) {
  if (hash.startsWith('$argon2')) return await argon2.verify(hash, pw)
  // legacy SHA-256 fallback
  const legacy = require('crypto').createHash('sha256').update(pw).digest('hex')
  return legacy === hash
}
function token(){ return crypto.randomBytes(24).toString('hex'); }

router.post('/auth/login', bruteProtect(5, 15*60*1000), async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const { email, password, otp } = req.body || {};
  const user = await prisma.user.findUnique({ where: { email } });
  if(!user || user.password !== await hashPassword(password) || !user.active) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.totpSecret) {
    // @ts-ignore
    let speakeasy; try { speakeasy = require('speakeasy'); } catch {}
    if (!speakeasy || !otp || !speakeasy.totp.verify({ secret: user.totpSecret, encoding:'ascii', token: otp, window: 1 })) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }
  }
  const t = token();
  const expiresAt = new Date(Date.now() + 1000*60*60*24*7); // 7d
  await prisma.session.create({ data: { token: require('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(t).digest('hex'), userId: user.id, expiresAt } });
  res.cookie('session_token', t, { httpOnly: true, sameSite: 'strict' , secure: process.env.NODE_ENV === 'production' });
  res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
});

router.post('/auth/logout', async (req, res) => {
  if(!prisma) return res.json({ success: true });
  const t = req.cookies?.session_token;
  if (t) await prisma.session.deleteMany({ where: { token: require('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(t).digest('hex') } });
  res.clearCookie('session_token');
  res.json({ success: true });
});

router.get('/auth/me', async (req, res) => {
  if(!prisma) return res.json({ user: null });
  const t = req.cookies?.session_token;
  if(!t) return res.json({ user: null });
  const s = await prisma.session.findFirst({ where: { token: require('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(t).digest('hex'), expiresAt: { gt: new Date() } }, include: { user: true } });
  if(!s) return res.json({ user: null });
  const u = s.user;
  res.json({ user: { id: u.id, email: u.email, role: u.role, name: u.name } });
});

export default router;

// 2FA setup (generate secret + QR)
import type { Request, Response } from 'express';
router.post('/auth/2fa/setup', async (req: Request, res: Response) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const { } = req.body || {};
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  // @ts-ignore
  let speakeasy; try { speakeasy = require('speakeasy'); } catch {}
  // @ts-ignore
  let qrcode; try { qrcode = require('qrcode'); } catch {}
  if (!speakeasy || !qrcode) return res.status(500).json({ error: 'Speakeasy/QRCode not installed' });
  const secret = speakeasy.generateSecret({ name: 'SoulSync (' + (user.email||'user') + ')' });
  const qr = await qrcode.toDataURL(secret.otpauth_url);
  res.json({ secret: secret.ascii, otpAuthUrl: secret.otpauth_url, qr });
});

// 2FA verify & enable
router.post('/auth/2fa/verify', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const {, secret, otp } = req.body || {};
  // @ts-ignore
  let speakeasy; try { speakeasy = require('speakeasy'); } catch {}
  if (!speakeasy || !otp) return res.status(400).json({ error: 'Missing OTP' });
  const ok = speakeasy.totp.verify({ secret, encoding:'ascii', token: otp, window: 1 });
  if (!ok) return res.status(401).json({ error: 'Invalid OTP' });
  await prisma.user.update({ where: { id: Number(userId) }, data: { totpSecret: secret } });
  res.json({ enabled: true });
});

// Magic link request
router.post('/auth/magic', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const { email } = req.body || {};
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return res.json({ ok: true }); // do not reveal
  const crypto = require('crypto');
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 1000*60*15); // 15 min
  await prisma.magicToken.create({ data: { token, email, expiresAt } });
  const url = (process.env.APP_URL || 'http://localhost:3000') + '/auth/magic/' + token;
  const sent = await sendMail(email, 'Your SoulSync sign-in link', 'Click to sign in: ' + url);
  res.json({ ok: true, preview: sent.preview });
});

// Magic link consume
router.get('/auth/magic/:token', async (req, res) => {
  if(!prisma) return res.status(501).json({ error: 'DB not available' });
  const tok = await prisma.magicToken.findUnique({ where: { token: require('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(req).digest('hex').params.token } });
  if (!tok || tok.used || tok.expiresAt < new Date()) return res.status(400).json({ error: 'Invalid or expired' });
  let user = await prisma.user.findUnique({ where: { email: tok.email } });
  if (!user) { user = await prisma.user.create({ data: { email: tok.email, role: 'USER', password: '' } }); try{ await addNotification({ type:'USER_CREATED', message:`New user ${tok.email}`, meta:{ url: '/admin/users' } }); }catch{} }
  await prisma.magicToken.update({ where: { id: tok.id }, data: { used: true } });
  const crypto = require('crypto');
  const t = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 1000*60*60*24*7);
  await prisma.session.create({ data: { token: require('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(require).digest('hex')('crypto').createHash('sha256').update(t).digest('hex'), userId: user.id, expiresAt } });
  res.cookie('session_token', t, { httpOnly: true, sameSite: 'strict' , secure: process.env.NODE_ENV === 'production' });
  res.redirect('/'); // or return JSON
});

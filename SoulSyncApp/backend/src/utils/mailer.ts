import nodemailer from 'nodemailer';

export function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env as unknown;
  if (!SMTP_HOST) return null;
  const port = Number(SMTP_PORT||587);
  return nodemailer.createTransport({
    host: SMTP_HOST, port, secure: port===465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
  });
}

export async function sendMail(to:string, subject:string, text:string) {
  const t = getTransport();
  if (!t) return { ok:false, note:'SMTP not configured', preview:text };
  await t.sendMail({ from: process.env.SMTP_FROM || 'no-reply@soulsync.app', to, subject, text });
  return { ok:true };
}

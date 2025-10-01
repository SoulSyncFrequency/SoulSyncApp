import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY = (process.env.KMS_DATA_KEY || '').padEnd(32, '0').slice(0,32);

export function encrypt(plain: string): { iv: string, tag: string, data: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, Buffer.from(KEY), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString('base64'), tag: tag.toString('base64'), data: enc.toString('base64') };
}

export function decrypt(payload: { iv: string, tag: string, data: string }): string {
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, Buffer.from(KEY), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()]);
  return dec.toString('utf-8');
}

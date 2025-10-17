import speakeasy from 'speakeasy'
export function generateSecret(label='SoulSync User'){ return speakeasy.generateSecret({ name: label }) }
export function verifyTOTP(secret:string, token:string){ return speakeasy.totp.verify({ secret, encoding:'base32', token, window:1 }) }

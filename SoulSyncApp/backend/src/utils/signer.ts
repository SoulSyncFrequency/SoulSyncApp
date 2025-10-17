import crypto from 'crypto'

let _sk = process.env.SECRET_KEY || ''
if(!_sk){
  _sk = crypto.randomBytes(16).toString('hex')
  process.env.SECRET_KEY = _sk
}

export function sign(params: Record<string,string|number>){
  const h = crypto.createHmac('sha256', _sk)
  const base = Object.keys(params).sort().map(k=> `${k}=${params[k]}`).join('&')
  h.update(base)
  return h.digest('hex')
}

export function verify(params: Record<string,string|number>, sig: string){
  const s = sign(params)
  return crypto.timingSafeEqual(Buffer.from(s), Buffer.from(sig))
}

import jwt from 'jsonwebtoken'

export function signAccessToken(payload: any){
  const secret = process.env.JWT_SECRET as string
  const exp = '5m'
  return jwt.sign(payload, secret, { expiresIn: exp })
}

export function signRefreshToken(payload: any){
  const secret = process.env.REFRESH_SECRET as string
  const exp = '30d'
  return jwt.sign(payload, secret, { expiresIn: exp })
}

export function verifyAccessToken(token: string){
  return jwt.verify(token, process.env.JWT_SECRET as string)
}

export function verifyRefreshToken(token: string){
  return jwt.verify(token, process.env.REFRESH_SECRET as string)
}


export function signRefreshTokenWithJti(payload: any, jti: string, exp: string='30d'){
  const secret = process.env.REFRESH_SECRET as string
  return (require('jsonwebtoken') as any).sign(payload, secret, { expiresIn: exp, jwtid: jti })
}

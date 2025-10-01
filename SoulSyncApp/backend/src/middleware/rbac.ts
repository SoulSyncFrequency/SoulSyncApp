import { Request, Response, NextFunction } from 'express'

type Role = 'ops' | 'admin' | 'superadmin'

function parseAdminTokens(): Record<string, Role> {
  const env = process.env.ADMIN_TOKENS || ''
  // Format: "role:token,role2:token2"
  const map: Record<string, Role> = {}
  env.split(',').map(s => s.trim()).filter(Boolean).forEach(pair => {
    const [role, token] = pair.split(':')
    if (role && token) map[token] = role as Role
  })
  return map
}

function rank(role: Role): number {
  return role === 'superadmin' ? 3 : role === 'admin' ? 2 : 1
}

export function requireRole(minRole: Role){
  return (req: Request, res: Response, next: NextFunction) => {
    const token = String(req.header('x-admin-token') || '')
    const map = parseAdminTokens()
    const userRole = map[token]
    if (!userRole) return res.status(401).json({ error: { code: 'unauthorized', message: 'Missing/invalid admin token' } })
    if (rank(userRole) < rank(minRole)) return res.status(403).json({ error: { code: 'forbidden', message: 'Insufficient role' } })
    ;(req as any).adminRole = userRole
    return next()
  }
}

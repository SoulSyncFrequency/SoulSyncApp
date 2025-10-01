
import fs from 'fs'
import path from 'path'

export type F0AuditRecord = {
  t: number
  inputHash: string
  profile: string
  params: any
  score: number
  safeGate: number
}

const dir = path.join(process.cwd(), 'logs')
const file = path.join(dir, 'f0_audit.ndjson')

export function recordF0Audit(rec: F0AuditRecord){
  try{
    fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(file, JSON.stringify(rec) + "\n", { encoding: 'utf-8' })
  }catch{}
}

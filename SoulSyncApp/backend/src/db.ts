import fs from 'fs'
import path from 'path'

let pg: unknown = null
try { pg = require('pg') } catch {}

const usePg = !!(process.env.DATABASE_URL && pg)
const SUBS_FILE = path.join(process.cwd(),'backend','data','subscriptions.json')
const DEVICES_FILE = path.join(process.cwd(),'backend','data','devices.json')

function ensureFile(p: string){
  const dir = path.dirname(p)
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if(!fs.existsSync(p)) fs.writeFileSync(p, '[]', 'utf-8')
}

export async function initDb(){
  if(usePg){
    const client = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS devices (
        user_id TEXT,
        segment TEXT,
        id SERIAL PRIMARY KEY,
        platform TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      );
    `)
    await client.end()
  } else {
    ensureFile(SUBS_FILE)
    ensureFile(DEVICES_FILE)
  }
}

export async function addSubscription(sub: unknown){
  if(usePg){
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    await pool.query(`INSERT INTO subscriptions(endpoint, data) VALUES ($1,$2)
                      ON CONFLICT (endpoint) DO UPDATE SET data = EXCLUDED.data`, [sub.endpoint, sub])
    await pool.end()
  } else {
    ensureFile(SUBS_FILE)
    const arr = JSON.parse(fs.readFileSync(SUBS_FILE,'utf-8'))
    if(!arr.find((s: unknown)=>s.endpoint===sub.endpoint)){ arr.push(sub) }
    fs.writeFileSync(SUBS_FILE, JSON.stringify(arr,null,2), 'utf-8')
  }
}

export async function listSubscriptions(): Promise<any[]>{
  if(usePg){
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    const { rows } = await pool.query(`SELECT data FROM subscriptions`)
    await pool.end()
    return rows.map(r=>r.data)
  } else {
    ensureFile(SUBS_FILE)
    return JSON.parse(fs.readFileSync(SUBS_FILE,'utf-8'))
  }
}

export async function addDevice(device: {platform:string, token:string, userId?:string, segment?:string}){
  if(usePg){
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    await pool.query(`INSERT INTO devices(platform, token) VALUES ($1,$2)
                      ON CONFLICT (token) DO NOTHING`, [device.platform, device.token] // TODO: add user_id/segment)
    await pool.end()
  } else {
    ensureFile(DEVICES_FILE)
    const arr = JSON.parse(fs.readFileSync(DEVICES_FILE,'utf-8'))
    if(!arr.find((d: unknown)=>d.token===device.token)){ arr.push(device) }
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(arr,null,2), 'utf-8')
  }
}

export async function listDevices(): Promise<any[]>{
  if(usePg){
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    const { rows } = await pool.query(`SELECT platform, token, user_id, segment FROM devices`)
    await pool.end()
    return rows
  } else {
    ensureFile(DEVICES_FILE)
    return JSON.parse(fs.readFileSync(DEVICES_FILE,'utf-8'))
  }
}


export async function updateDevice(token:string, updates: { userId?:string, segment?:string }): Promise<boolean>{
  if(usePg){
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    const fields = []
    const values: unknown[] = []
    if(updates.userId !== undefined){ fields.push('user_id = $'+(fields.length+1)); values.push(updates.userId) }
    if(updates.segment !== undefined){ fields.push('segment = $'+(fields.length+1)); values.push(updates.segment) }
    if(!fields.length){ await pool.end(); return true }
    values.push(token)
    const q = `UPDATE devices SET ${fields.join(', ')} WHERE token = $${fields.length+1}`
    const r = await pool.query(q, values)
    await pool.end()
    return r.rowCount>0
  } else {
    ensureFile(DEVICES_FILE)
    const arr = JSON.parse(fs.readFileSync(DEVICES_FILE,'utf-8'))
    const idx = arr.findIndex((d: unknown)=>d.token===token)
    if(idx<0) return false
    if(updates.userId !== undefined) arr[idx].user_id = updates.userId
    if(updates.segment !== undefined) arr[idx].segment = updates.segment
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(arr,null,2), 'utf-8')
    return true
  }
}

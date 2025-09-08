// Simple migration runner for Postgres using node-postgres
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

async function run(){
  const url = process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL
  if(!url){ 
    console.log('[migrate] PG connection string not set. Skipping migrations.')
    process.exit(0)
  }
  const client = new Client({ connectionString: url })
  await client.connect()
  const dir = path.join(process.cwd(), 'migrations')
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort()
  for(const f of files){
    const sql = fs.readFileSync(path.join(dir,f),'utf-8')
    console.log('[migrate] applying', f)
    await client.query(sql)
  }
  await client.end()
  console.log('[migrate] done')
}

run().catch(e=>{ console.error(e); process.exit(1) })

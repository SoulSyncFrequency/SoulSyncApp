/* Minimal SQL migration runner. Applies files in backend/db/migrations ascending.
 * Tracks state in table: schema_migrations(filename TEXT PRIMARY KEY, checksum TEXT).
 * Env: POSTGRES_URL (required). Optional: PGVECTOR_INDEX=HNSW|IVF|NONE to control index migrations.
 */
const fs = require('fs'); const path = require('path'); const crypto = require('crypto')
const { Client } = require('pg')

const MIGR_DIR = path.join(__dirname, '..', 'db', 'migrations')

function sha(s){ return crypto.createHash('sha256').update(s).digest('hex') }

async function main(){
  const url = process.env.POSTGRES_URL
  if(!url){ console.error('POSTGRES_URL not set'); process.exit(1) }
  const indexPref = (process.env.PGVECTOR_INDEX || 'HNSW').toUpperCase()
  const client = new Client({ connectionString: url })
  await client.connect()
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, checksum TEXT NOT NULL)')
  const files = fs.readdirSync(MIGR_DIR).filter(f=>/\.sql$/i.test(f)).sort()
  for(const f of files){
    if(f.startsWith('004_index_ivfflat') && indexPref !== 'IVF') continue
    if(f.startsWith('003_index_hnsw') && indexPref !== 'HNSW') continue
    const sql = fs.readFileSync(path.join(MIGR_DIR,f), 'utf8')
    const sum = sha(sql)
    const { rows } = await client.query('SELECT checksum FROM schema_migrations WHERE filename=$1',[f])
    if(rows.length && rows[0].checksum === sum){
      console.log('== Skipping (already applied):', f); continue
    }
    console.log('\n== Applying:', f)
    await client.query('BEGIN')
    try{
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations(filename, checksum) VALUES($1,$2) ON CONFLICT (filename) DO UPDATE SET checksum=$2',[f,sum])
      await client.query('COMMIT')
    }catch(e){
      await client.query('ROLLBACK'); console.error('Migration failed:', f, e); process.exit(1)
    }
  }
  await client.end()
  console.log('\nAll migrations applied.')
}
main().catch(e=>{ console.error(e); process.exit(1) })

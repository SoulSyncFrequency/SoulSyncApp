/* Seeds a few demo rows into content_embeddings with random vectors (1536-dim). */
const { Pool } = require('pg')
const crypto = require('crypto')

function randVec(n){ return Array.from({length:n}, ()=> (Math.random()*2-1).toFixed(6)).join(',') }

async function main(){
  const url = process.env.POSTGRES_URL
  if(!url){ console.error('POSTGRES_URL not set'); process.exit(1) }
  const pool = new Pool({ connectionString: url, max: 2 })
  const items = [
    { id: 'therapy-a', title:'Therapy A'},
    { id: 'therapy-b', title:'Therapy B'},
    { id: 'therapy-c', title:'Therapy C'}
  ]
  for(const it of items){
    const vecLiteral = '[' + randVec(1536) + ']'
    await pool.query(`INSERT INTO content_embeddings (id, title, embedding) VALUES ($1,$2,$3::vector)
                      ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, embedding=EXCLUDED.embedding`,
                      [it.id, it.title, vecLiteral])
    console.log('Seeded:', it.id)
  }
  await pool.end()
  console.log('Done.')
}
main().catch(e=>{ console.error(e); process.exit(1) })

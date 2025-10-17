/**
 * Initializes a simple RediSearch index if it doesn't exist and seeds sample data.
 * Uses environment variables: REDIS_URL or REDIS_HOST/REDIS_PORT.
 */
import Redis from 'ioredis'

const url = process.env.REDIS_URL
const host = process.env.REDIS_HOST || '127.0.0.1'
const port = Number(process.env.REDIS_PORT || 6379)

const redis = url ? new Redis(url) : new Redis({ host, port })

const indexVersion = process.env.REDISEARCH_INDEX_VERSION || 'v1'
const IDX_NAME = `idx:docs:${indexVersion}`

async function ensureIndex(){
  try{
    await redis.call('FT.INFO', IDX_NAME)
    console.log('RediSearch index idx:docs already exists.')
    return
  }catch(e){
    console.log('Creating RediSearch index', IDX_NAME, '...')
    try{ await redis.call('FT.DROPINDEX', IDX_NAME, 'KEEPDOCS') }catch(e){ /* ignore */ }
    await redis.call('FT.CREATE', IDX_NAME,'ON','HASH','PREFIX','1','doc:',
      'SCHEMA','title','TEXT','content','TEXT','tags','TAG','SEPARATOR',',')
    console.log('Index created.')
  }
}

async function seed(){
  // Add a couple of example docs
  await redis.hset('doc:1', { title: 'Hello SoulSync', content: 'Sample document for therapy & nutrition.', tags: 'therapy,nutrition' })
  await redis.hset('doc:2', { title: 'Quantum Module', content: 'F0 resonance & bio-photonic molecules.', tags: 'f0,quantum' })
  console.log('Seeded sample documents.')
}

async function main(){
  try{
    await ensureIndex()
    await seed()
  } finally {
    redis.disconnect()
  }
}

main().catch((err)=>{ console.error(err); process.exit(1) })

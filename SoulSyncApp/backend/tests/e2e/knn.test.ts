import { PgVectorRepo } from '../../src/repo/recommendations'
import { Pool } from 'pg'

const shouldRun = !!process.env.POSTGRES_URL && process.env.TEST_PGVECTOR === 'on'

(shouldRun ? describe : describe.skip)('KNN via pgvector', () => {
  it('should upsert and query nearest without error', async () => {
    const pg = new Pool({ connectionString: process.env.POSTGRES_URL, max: 1 })
    const repo = new PgVectorRepo(pg as any)
    // Insert 2 tiny vectors near each other and 1 far; NOTE: table expects 1536 dims in prod,
    // this test assumes the schema matches. If not, skip by default.
    const dim = 1536
    const a = Array(dim).fill(0); a[0]=0.1
    const b = Array(dim).fill(0); b[0]=0.12
    const c = Array(dim).fill(0); c[0]=4.0
    await repo.upsertEmbedding('knn-a','KNN A', a as any)
    await repo.upsertEmbedding('knn-b','KNN B', b as any)
    await repo.upsertEmbedding('knn-c','KNN C', c as any)

    const res = await repo.nearest(a as any, 2)
    expect(res.length).toBeGreaterThan(0)
    expect(res[0].id).toBeDefined()
    await pg.end()
  })
})

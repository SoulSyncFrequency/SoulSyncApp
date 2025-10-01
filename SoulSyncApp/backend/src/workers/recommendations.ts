import { ai } from '../ai'

// Placeholder: generate embeddings and recommend similar therapies/content
export async function generateRecommendations(userId: string) {
  const items = [`Therapy A`, `Therapy B`, `Therapy C`]
  const embeds = await ai.embed(items)
  // Normally would store in pgvector/Redis and query nearest neighbors
  return items.map((it, i) => ({ item: it, vector: embeds[i] }))
}

async function getPgRepo(){ if(!process.env.POSTGRES_URL) return null; const {Pool}=await import('pg'); const pg = new Pool({connectionString:process.env.POSTGRES_URL,max:2}); return new PgVectorRepo(pg as any) }

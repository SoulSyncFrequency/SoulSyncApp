import type { Pool } from 'pg'
export type Vector = number[]
export type RecItem = { id: string, title: string, score?: number }

export interface VectorRepo {
  upsertEmbedding(id: string, title: string, vector: Vector): Promise<void>
  nearest(vector: Vector, k: number): Promise<RecItem[]>
}

export class PgVectorRepo implements VectorRepo {
  constructor(private pg: Pool){}
  async upsertEmbedding(id: string, title: string, vector: Vector){
    const vecLiteral = '[' + vector.join(',') + ']'
    await this.pg.query(`INSERT INTO content_embeddings (id, title, embedding) VALUES ($1,$2,$3::vector)`, [id, title, vecLiteral])
  }
  async nearest(vector: Vector, k: number){
    const vecLiteral = '[' + vector.join(',') + ']'
    const { rows } = await this.pg.query(`SELECT id, title, (embedding <-> $1::vector) AS dist
      FROM content_embeddings ORDER BY embedding <-> $1::vector ASC LIMIT $2`, [vecLiteral, k])
    return rows.map((r: any) => ({ id: r.id, title: r.title, score: 1.0/(1.0 + Number(r.dist)) }))
  }
}

export class RedisVectorRepo implements VectorRepo {
  async upsertEmbedding(_id: string, _title: string, _vector: Vector){}
  async nearest(_vector: Vector, _k: number){ return [] }
}

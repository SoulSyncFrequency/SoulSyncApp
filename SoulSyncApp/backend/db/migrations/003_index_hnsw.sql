-- Optional: HNSW index (requires pgvector with hnsw support)
-- Adjust ops (vector_l2_ops / vector_ip_ops / vector_cosine_ops) to your similarity
CREATE INDEX IF NOT EXISTS idx_content_embeddings_hnsw
ON content_embeddings USING hnsw (embedding vector_l2_ops);

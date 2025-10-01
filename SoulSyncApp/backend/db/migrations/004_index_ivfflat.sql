-- Optional: IVFFlat index (needs ANALYZE after building; lists determines recall/speed)
CREATE INDEX IF NOT EXISTS idx_content_embeddings_ivf
ON content_embeddings USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

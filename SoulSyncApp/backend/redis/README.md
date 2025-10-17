# Redis RediSearch Vector Index (example)

Requires Redis Stack / RediSearch >= 2.4 with VECTOR type.

## Create index
```
FT.CREATE idx:content ON HASH PREFIX 1 content: SCHEMA
  title TEXT
  embedding VECTOR HNSW 6 TYPE FLOAT32 DIM 1536 DISTANCE_METRIC L2
```

## Insert
- Store vectors as binary (FLOAT32) or base64-encoded blob in a field, e.g. `embedding`.

## Query KNN
```
FT.SEARCH idx:content "*=>[KNN 5 @embedding $vec AS score]" PARAMS 2 vec $BLOB SORTBY score DIALECT 2
```

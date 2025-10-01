# Self-test
- `GET /self-test` provjerava: obavezne ENV varijable, DB konekciju, (opcionalno) Redis TCP konekciju, te mogućnost pisanja na disk.
- Vraća `200 { ok:true }` ili `503 { ok:false, checks:{...} }`.

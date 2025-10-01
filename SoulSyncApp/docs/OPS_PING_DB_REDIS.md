# /ops/ping-db i /ops/ping-redis
- **GET /ops/ping-db** → `204` ako je baza dostupna, inače `503` + poruka.
- **GET /ops/ping-redis** → `204` ako je Redis dostupan, inače `503` + poruka.
- Korisno za preciznije health check-ove (DB vs cache sloj).

# Request limits & timeouts
- **Body size**: `JSON_MAX_BODY` (default `1mb`) primjenjuje se na `express.json` i `urlencoded` parser.
- **Timeout**: `REQUEST_TIMEOUT_MS` (default `30000`) — middleware vraća `503 timeout` ako obrada traje dulje.
- **Request logger (optional)**: `REQ_LOGGER_ENABLED=true` → zapisuje minimalne podatke u `logs/requests.ndjson` uz redakciju osjetljivih polja.

# Rate Limiting Headers
- `X-RateLimit-Limit`: per-key limit (RPM or window tokens)
- `X-RateLimit-Remaining`: remaining tokens this window
- `Retry-After`: present on 429/503 to guide client backoff

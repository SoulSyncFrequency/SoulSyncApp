# Rate Limit & Backpressure Headers
- `X-RateLimit-Limit`: plan limit for the current window
- `X-RateLimit-Remaining`: remaining tokens
- `X-RateLimit-Reset`: unix seconds when window resets (hint)
- On 429: includes `Retry-After: 60`
- On 503 (backpressure): includes `Retry-After: 1`

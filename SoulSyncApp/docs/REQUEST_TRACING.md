# Request Tracing
- `X-Request-Id` is generated (or propagated) per request and returned in response headers.
- Include `X-Request-Id` when reporting issues so we can correlate logs and traces.
- Backpressure responses include `Retry-After` and `X-Backpressure: true`.

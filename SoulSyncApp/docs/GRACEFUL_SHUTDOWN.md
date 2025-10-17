# Graceful Shutdown
- Handles SIGINT/SIGTERM, drains HTTP server and disconnects DB (if exposed) with timeout `SHUTDOWN_TIMEOUT_MS`.
- Also reports unhandled rejections/exceptions to Sentry before exit.

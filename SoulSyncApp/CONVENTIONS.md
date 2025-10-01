# Conventions

## Naming
- Files: `kebab-case.ts`, classes `PascalCase`, functions/vars `camelCase`.
- Routes: nouns (plural), verbs in POST body; `GET /things`, `POST /things/:id/purge`.

## Folders
- `src/routes` HTTP layer; `src/services` business logic; `src/lib` shared utils; `src/middleware` express middlewares.

## Logging
- Use structured logs (`logger.info({key}, 'message')`). Never log secrets or PII.

## Metrics
- Prefix app metrics with `soulsync_`. Add HELP/TYPE lines; label cardinality low.

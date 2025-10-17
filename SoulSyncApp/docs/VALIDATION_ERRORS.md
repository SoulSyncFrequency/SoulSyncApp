# Validation Errors
- Koristi `parseOrError(schema, data)` iz `src/lib/validation.ts`.
- Na neuspjeh baca `{ status:400, code:'invalid_request', details:[{path,code,message}] }` — hvata ga globalni `errorHandler`.

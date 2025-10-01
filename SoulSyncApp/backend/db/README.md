# Database Migrations (SQL Skeleton)

- Put SQL migration files into `db/migrations` with incremental prefixes (e.g., `001_*.sql`, `002_*.sql`).
- Dev:
  ```bash
  npm run migrate:dev
  ```
- Prod:
  ```bash
  npm run migrate:prod
  ```

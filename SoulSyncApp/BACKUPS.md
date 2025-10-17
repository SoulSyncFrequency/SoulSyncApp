# Database Backups

- Backup: `./scripts/pg-backup.sh backup.sql` (uses `POSTGRES_URL` env)
- Restore: `./scripts/pg-restore.sh backup.sql`

For production, schedule periodic backups and store them in a secure bucket with lifecycle rules.

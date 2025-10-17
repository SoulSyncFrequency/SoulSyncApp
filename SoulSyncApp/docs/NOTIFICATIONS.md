# Notifications
Supported channels:
- Slack: `SLACK_WEBHOOK_URL`
- Discord: `DISCORD_WEBHOOK_URL`
- Email: requires `SMTP_URL` and `NOTIFY_EMAIL_TO` (optional `NOTIFY_EMAIL_FROM`)

## CI Workflows
- `weekly-backup.yml` i `weekly-maintenance.yml` šalju poruku u Slack/Discord ako su postavljeni odgovarajući `secrets`.
- Format: `[<workflow>] status: <success|failure> (run <run_number>)`.

## Runtime
- `/self-test` nakon izvršavanja šalje notifikacije (ako `NO_NOTIFY!=1`). Poruke:
  - **Self-test OK** — svi checkovi prošli.
  - **Self-test FAILED** — provjeri logove/Sentry.

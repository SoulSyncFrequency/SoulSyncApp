# CI Notifications details
- `weekly-backup.yml` šalje detaljniju poruku (status, run number, run URL). Ako postoji `backups/`, workflow ispiše veličine datoteka.
- `weekly-maintenance.yml` uključuje run URL u poruci.
- Postavi GitHub `secrets`: `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`.

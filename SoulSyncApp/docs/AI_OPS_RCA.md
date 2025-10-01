# AI Ops RCA (daily)
- Script: `backend/scripts/ai_ops_rca.py`
- Workflow: `.github/workflows/ai-ops-rca.yml` (set secret `OPS_RCA_WEBHOOK`)
- Aggregates NDJSON logs in `logs/` + (optionally) metric snapshots; posts summary as JSON.
- Safe by design; no PHI is sent unless logs themselves contain it. Use `pii_scan.py` to audit logs.


## TL;DR (optional)
- Set `OPS_RCA_AI_TLDR_ENABLED=true` to include a one-line TL;DR in the daily JSON payload.

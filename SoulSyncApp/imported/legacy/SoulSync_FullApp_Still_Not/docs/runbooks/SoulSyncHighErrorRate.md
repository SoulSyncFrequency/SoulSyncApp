---
layout: default
title: SoulSyncHighErrorRate
---

# Runbook: SoulSyncHighErrorRate

**Severity:** Critical  
**Description:** The proportion of HTTP 5xx responses has exceeded 5% in the last 10 minutes.

## Steps to Investigate
1. Check recent deployments or code changes.
2. Inspect application logs for stack traces or errors.
3. Verify database and external dependencies are healthy.

## Mitigation
- Roll back recent deployment if error spike started after it.
- Restart pods if stuck or crashlooping.

## Escalation
- Notify on-call SRE team.
- If persistent, escalate to backend development lead.

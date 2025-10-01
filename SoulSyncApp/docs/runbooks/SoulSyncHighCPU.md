---
layout: default
title: SoulSyncHighCPU
---

# Runbook: SoulSyncHighCPU

**Severity:** Warning  
**Description:** Average CPU usage of pods is above 0.5 cores for 10 minutes.

## Steps to Investigate
1. Check `kubectl top pods` to confirm CPU usage.
2. Look for increased traffic or heavy tasks.
3. Inspect logs for performance regressions.

## Mitigation
- Scale replicas or increase CPU limits.
- Optimize code paths if usage is unexpectedly high.

## Escalation
- Notify backend performance team.

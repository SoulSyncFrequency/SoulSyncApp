---
layout: default
title: SoulSyncPodRestarts
---

# Runbook: SoulSyncPodRestarts

**Severity:** Warning  
**Description:** A pod has restarted more than 3 times in the last 10 minutes.

## Steps to Investigate
1. Inspect `kubectl describe pod` events for OOMKilled or CrashLoopBackOff.
2. Check logs for errors before crash.
3. Ensure resource requests/limits are adequate.

## Mitigation
- Increase memory/CPU limits if hitting OOM.
- Fix crash cause if code-related.

## Escalation
- Notify platform team if restart count keeps rising.

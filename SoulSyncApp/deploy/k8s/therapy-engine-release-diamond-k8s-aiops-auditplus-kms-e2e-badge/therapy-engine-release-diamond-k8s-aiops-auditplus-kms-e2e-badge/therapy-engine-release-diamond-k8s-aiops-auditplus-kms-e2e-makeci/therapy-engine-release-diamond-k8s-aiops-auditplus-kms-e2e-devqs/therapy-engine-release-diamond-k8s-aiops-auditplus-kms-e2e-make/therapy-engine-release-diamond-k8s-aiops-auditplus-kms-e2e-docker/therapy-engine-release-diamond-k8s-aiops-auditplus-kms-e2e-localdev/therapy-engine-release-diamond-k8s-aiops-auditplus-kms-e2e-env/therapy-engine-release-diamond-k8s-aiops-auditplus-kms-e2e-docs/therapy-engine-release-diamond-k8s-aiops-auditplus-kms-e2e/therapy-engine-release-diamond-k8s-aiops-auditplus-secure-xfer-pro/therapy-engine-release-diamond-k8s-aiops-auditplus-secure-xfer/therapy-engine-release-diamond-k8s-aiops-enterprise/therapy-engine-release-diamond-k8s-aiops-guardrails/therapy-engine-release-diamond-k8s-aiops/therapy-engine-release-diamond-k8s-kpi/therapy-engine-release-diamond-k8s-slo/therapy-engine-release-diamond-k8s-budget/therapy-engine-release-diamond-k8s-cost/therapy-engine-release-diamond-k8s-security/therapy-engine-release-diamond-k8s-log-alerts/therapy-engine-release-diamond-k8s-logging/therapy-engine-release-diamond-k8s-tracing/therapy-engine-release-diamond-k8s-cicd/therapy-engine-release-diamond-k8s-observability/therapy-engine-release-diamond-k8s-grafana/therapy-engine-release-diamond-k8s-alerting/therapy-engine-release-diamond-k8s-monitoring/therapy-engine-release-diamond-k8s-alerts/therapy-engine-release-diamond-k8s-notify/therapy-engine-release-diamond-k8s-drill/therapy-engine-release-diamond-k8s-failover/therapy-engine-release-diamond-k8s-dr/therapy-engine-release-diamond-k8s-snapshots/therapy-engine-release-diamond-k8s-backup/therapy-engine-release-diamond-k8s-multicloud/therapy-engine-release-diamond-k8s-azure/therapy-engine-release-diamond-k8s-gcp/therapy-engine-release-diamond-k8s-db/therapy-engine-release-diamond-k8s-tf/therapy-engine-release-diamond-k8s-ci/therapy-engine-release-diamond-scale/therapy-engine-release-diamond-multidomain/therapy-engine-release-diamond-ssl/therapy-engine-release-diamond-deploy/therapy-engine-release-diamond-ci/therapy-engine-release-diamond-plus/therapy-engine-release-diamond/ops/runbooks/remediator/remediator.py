import os, json, time
from datetime import datetime, timezone
from kubernetes import client, config

def k8s():
    try:
        config.load_incluster_config()
    except Exception:
        config.load_kube_config()
    return client.CoreV1Api(), client.AppsV1Api()

def nowiso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def parse_policy(s: str):
    policy = []
    for part in (s or "").split(";"):
        part = part.strip()
        if not part: continue
        if "=" not in part: 
            continue
        left, action = part.split("=", 1)
        metric_pat = None
        reason = None
        if ":" in left:
            metric_pat, reason = left.split(":", 1)
        else:
            reason = left
        param = None
        if ":" in action:
            action, param = action.split(":", 1)
        policy.append((metric_pat, reason, action, param))
    return policy

def has_crashloop(core: client.CoreV1Api, ns: str, label: str) -> bool:
    pods = core.list_namespaced_pod(ns, label_selector=f"app={label}").items
    for p in pods:
        cs = (p.status.container_statuses or []) + (p.status.init_container_statuses or [])
        for c in cs:
            st = c.state.waiting or c.state.terminated
            if st and getattr(st, "reason", "") == "CrashLoopBackOff":
                return True
    return False

def restart_pods(core: client.CoreV1Api, ns: str, label: str, dry: bool):
    pods = core.list_namespaced_pod(ns, label_selector=f"app={label}").items
    names = [p.metadata.name for p in pods]
    print(f"[{nowiso()}] restart_pods: {names} (dry={dry})")
    if dry: return {"action":"restart_pods","pods":names,"dry_run":True}
    for n in names:
        try:
            core.delete_namespaced_pod(name=n, namespace=ns)
        except Exception as e:
            print(f"delete pod {n} failed: {e}")
    return {"action":"restart_pods","pods":names,"dry_run":False}

def rollout_restart(apps: client.AppsV1Api, ns: str, label: str, dry: bool):
    deps = apps.list_namespaced_deployment(ns, label_selector=f"app={label}").items
    dn = [d.metadata.name for d in deps]
    print(f"[{nowiso()}] rollout_restart deployments: {dn} (dry={dry})")
    if dry: return {"action":"rollout_restart","deployments":dn,"dry_run":True}
    for d in deps:
        name = d.metadata.name
        now = nowiso()
        body = {"spec":{"template":{"metadata":{"annotations":{"kubectl.kubernetes.io/restartedAt": now}}}}}
        try:
            apps.patch_namespaced_deployment(name=name, namespace=ns, body=body)
        except Exception as e:
            print(f"patch deployment {name} failed: {e}")
    return {"action":"rollout_restart","deployments":dn,"dry_run":False}

def scale_change(apps: client.AppsV1Api, ns: str, label: str, step: int, max_repl: int, dry: bool):
    deps = apps.list_namespaced_deployment(ns, label_selector=f"app={label}").items
    res = []
    for d in deps:
        name = d.metadata.name
        current = (d.spec.replicas or 1)
        desired = min(max(1, current + step), max_repl)
        res.append({"deployment":name,"from":current,"to":desired})
        print(f"[{nowiso()}] scale {name}: {current} -> {desired} (dry={dry})")
        if not dry and desired != current:
            body = {"spec":{"replicas": desired}}
            try:
                apps.patch_namespaced_deployment_scale(name=name, namespace=ns, body=body)
            except Exception as e:
                print(f"scale deployment {name} failed: {e}")
    return {"action":"scale_change","results":res,"dry_run":dry}

def main():
    ns = os.getenv("TARGET_NAMESPACE","default")
    label = os.getenv("APP_LABEL","therapy-backend")
    metric = os.getenv("METRIC","unknown")
    reasons = json.loads(os.getenv("REASONS_JSON","[]"))
    policy = parse_policy(os.getenv("AUTOFIX_POLICY","crashloop=restart_pods;success_rate:trend_break=rollout_restart;latency_p99:level_shift=scale_up:+1"))
    dry = os.getenv("AUTOFIX_DRY_RUN","true").lower() == "true"
    max_rep = int(os.getenv("AUTOFIX_SCALE_MAX","10"))
    step = int(os.getenv("AUTOFIX_SCALE_STEP","1"))

    core, apps = k8s()
    did = None

    if has_crashloop(core, ns, label):
        did = restart_pods(core, ns, label, dry)
    else:
        for metric_pat, reason, action, param in policy:
            reason_match = reason.lower() in [str(r).lower() for r in reasons]
            metric_match = (metric_pat is None) or (metric_pat in metric)
            if reason_match and metric_match:
                if action == "restart_pods":
                    did = restart_pods(core, ns, label, dry); break
                elif action == "rollout_restart":
                    did = rollout_restart(apps, ns, label, dry); break
                elif action == "scale_up":
                    did = scale_change(apps, ns, label, abs(int(param or "1")), max_rep, dry); break
                elif action == "scale_down":
                    did = scale_change(apps, ns, label, -abs(int(param or "1")), max_rep, dry); break

    print(json.dumps({"metric":metric, "reasons":reasons, "result": did or {"action":"noop"}}, indent=2))

if __name__ == "__main__":
    main()

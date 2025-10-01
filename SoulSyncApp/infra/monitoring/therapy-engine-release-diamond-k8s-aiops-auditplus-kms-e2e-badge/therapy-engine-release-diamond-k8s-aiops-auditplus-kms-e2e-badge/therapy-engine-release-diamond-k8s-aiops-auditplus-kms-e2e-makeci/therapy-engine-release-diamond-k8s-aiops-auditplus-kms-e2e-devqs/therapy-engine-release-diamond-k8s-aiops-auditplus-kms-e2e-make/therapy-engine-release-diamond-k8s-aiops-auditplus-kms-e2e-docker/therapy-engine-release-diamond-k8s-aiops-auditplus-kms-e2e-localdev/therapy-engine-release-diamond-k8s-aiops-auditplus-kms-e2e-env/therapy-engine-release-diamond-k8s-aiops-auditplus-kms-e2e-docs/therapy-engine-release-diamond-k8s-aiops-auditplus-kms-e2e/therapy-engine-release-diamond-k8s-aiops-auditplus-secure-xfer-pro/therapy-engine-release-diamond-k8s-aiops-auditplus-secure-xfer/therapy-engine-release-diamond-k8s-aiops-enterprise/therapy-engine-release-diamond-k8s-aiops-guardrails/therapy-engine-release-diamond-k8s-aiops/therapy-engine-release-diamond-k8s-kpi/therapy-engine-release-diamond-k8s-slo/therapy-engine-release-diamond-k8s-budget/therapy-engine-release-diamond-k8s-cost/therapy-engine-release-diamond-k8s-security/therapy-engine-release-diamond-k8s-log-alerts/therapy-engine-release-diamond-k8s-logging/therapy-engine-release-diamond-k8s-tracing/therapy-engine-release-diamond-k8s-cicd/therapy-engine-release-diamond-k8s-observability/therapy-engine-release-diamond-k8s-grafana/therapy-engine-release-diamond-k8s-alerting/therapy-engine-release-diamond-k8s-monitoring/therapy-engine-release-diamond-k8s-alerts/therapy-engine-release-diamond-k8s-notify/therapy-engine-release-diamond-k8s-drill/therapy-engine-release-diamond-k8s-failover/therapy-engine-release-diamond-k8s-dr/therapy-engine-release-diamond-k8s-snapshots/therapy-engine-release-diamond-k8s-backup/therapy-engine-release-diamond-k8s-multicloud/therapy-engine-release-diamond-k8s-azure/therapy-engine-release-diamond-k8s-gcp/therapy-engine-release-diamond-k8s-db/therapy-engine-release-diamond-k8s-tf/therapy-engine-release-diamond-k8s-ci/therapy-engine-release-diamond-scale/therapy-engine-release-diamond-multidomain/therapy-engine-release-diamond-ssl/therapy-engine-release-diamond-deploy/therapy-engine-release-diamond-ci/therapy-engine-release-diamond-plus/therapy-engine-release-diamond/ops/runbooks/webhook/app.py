from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from kubernetes import client, config
from datetime import datetime
import os, uuid, json, hmac, hashlib, time, requests, psycopg2, psycopg2.extras

app = FastAPI()

NAMESPACE = os.getenv("RUNBOOKS_NAMESPACE", "runbooks")
IMAGE = os.getenv("RUNBOOK_COLLECTOR_IMAGE", "ghcr.io/REPLACE_WITH_OWNER/therapy-runbook-collector:latest")
REMEDIATOR_IMAGE = os.getenv("RUNBOOK_REMEDIATOR_IMAGE", "ghcr.io/REPLACE_WITH_OWNER/therapy-runbook-remediator:latest")
TTL = int(os.getenv("RUNBOOK_JOB_TTL", "3600"))
SLACK_WEBHOOK = os.getenv("RUNBOOKS_SLACK_WEBHOOK","")
CIRCUIT_MAX_HOURLY = int(os.getenv("RUNBOOK_CIRCUIT_MAX_HOURLY","3"))
CIRCUIT_MAX_DAILY = int(os.getenv("RUNBOOK_CIRCUIT_MAX_DAILY","10"))
REDIS_URL = os.getenv("RUNBOOK_REDIS_URL","")
AUTOFIX_ENABLED = os.getenv("RUNBOOK_AUTOFIX_ENABLED","false").lower() == "true"
APPROVAL_REQUIRED = os.getenv("RUNBOOK_AUTOFIX_REQUIRE_APPROVAL","false").lower() == "true"
APPROVAL_SECRET = os.getenv("RUNBOOK_APPROVAL_SECRET","changeme")
AIOPS_DATABASE_URL = os.getenv("AIOPS_DATABASE_URL")
SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN","")
SLACK_CHANNEL = os.getenv("SLACK_CHANNEL","")
SLACK_SIGNING_SECRET = os.getenv("SLACK_SIGNING_SECRET","")
RUNBOOK_POLICY_CM = os.getenv("RUNBOOK_POLICY_CM","runbooks-policy")

def k8s():
    try:
        config.load_incluster_config()
    except Exception:
        config.load_kube_config()
    return client.BatchV1Api(), client.CoreV1Api()

def rds():
    if not REDIS_URL:
        return None
    try:
        import redis
        return redis.Redis.from_url(REDIS_URL, decode_responses=True)
    except Exception:
        return None

ACTIONS = {}

def _hmac(token_base: str) -> str:
    return hmac.new(APPROVAL_SECRET.encode(), token_base.encode(), hashlib.sha256).hexdigest()

def _cb_keys(app_label: str):
    t = int(time.time())
    hour = t - (t % 3600)
    day = t - (t % 86400)
    return f"cb:hour:{app_label}:{hour}", f"cb:day:{app_label}:{day}"

def circuit_allow(app_label: str):
    r = rds()
    hk, dk = _cb_keys(app_label)
    if r:
        h = int(r.get(hk) or "0")
        d = int(r.get(dk) or "0")
        return h < CIRCUIT_MAX_HOURLY and d < CIRCUIT_MAX_DAILY
    else:
        store = ACTIONS.setdefault("_cb", {})
        h = store.get(hk, 0); d = store.get(dk, 0)
        return h < CIRCUIT_MAX_HOURLY and d < CIRCUIT_MAX_DAILY

def circuit_inc(app_label: str):
    r = rds()
    hk, dk = _cb_keys(app_label)
    if r:
        r.incr(hk, 1); r.expire(hk, 3600)
        r.incr(dk, 1); r.expire(dk, 86400)
    else:
        store = ACTIONS.setdefault("_cb", {})
        store[hk] = store.get(hk, 0) + 1
        store[dk] = store.get(dk, 0) + 1

def approval_store(action_id: str, payload: dict):
    r = rds()
    if r:
        r.setex(f"approve:{action_id}", 3600, json.dumps(payload))
    else:
        ACTIONS[action_id] = payload

def approval_load(action_id: str):
    r = rds()
    if r:
        data = r.get(f"approve:{action_id}")
        return json.loads(data) if data else None
    else:
        return ACTIONS.get(action_id)

def post_slack(text: str):
    if not SLACK_WEBHOOK:
        return
    try:
        requests.post(SLACK_WEBHOOK, json={"text": text}, timeout=5)
    except Exception:
        pass

def make_env(base: dict):
    env = []
    for k,v in base.items():
        env.append(client.V1EnvVar(name=k, value=v))
    # AWS creds if present
    env.extend([
        client.V1EnvVar(name="AWS_REGION", value_from=client.V1EnvVarSource(secret_key_ref=client.V1SecretKeySelector(name="runbooks-aws", key="AWS_REGION", optional=True))),
        client.V1EnvVar(name="AWS_ACCESS_KEY_ID", value_from=client.V1EnvVarSource(secret_key_ref=client.V1SecretKeySelector(name="runbooks-aws", key="AWS_ACCESS_KEY_ID", optional=True))),
        client.V1EnvVar(name="AWS_SECRET_ACCESS_KEY", value_from=client.V1EnvVarSource(secret_key_ref=client.V1SecretKeySelector(name="runbooks-aws", key="AWS_SECRET_ACCESS_KEY", optional=True))),
        client.V1EnvVar(name="AWS_SESSION_TOKEN", value_from=client.V1EnvVarSource(secret_key_ref=client.V1SecretKeySelector(name="runbooks-aws", key="AWS_SESSION_TOKEN", optional=True)))
    ])
    return env

def create_job(batch, name: str, image: str, env_base: dict):
    container = client.V1Container(name="job", image=image, image_pull_policy="Always", env=make_env(env_base))
    pod_spec = client.V1PodSpec(service_account_name="runbooks-sa", restart_policy="Never", containers=[container])
    template = client.V1PodTemplateSpec(metadata=client.V1ObjectMeta(labels={"job": name}), spec=pod_spec)
    job_spec = client.V1JobSpec(template=template, ttl_seconds_after_finished=TTL)
    job = client.V1Job(api_version="batch/v1", kind="Job", metadata=client.V1ObjectMeta(name=name, namespace=NAMESPACE), spec=job_spec)
    return batch.create_namespaced_job(namespace=NAMESPACE, body=job)

@app.post("/trigger")
async def trigger(req: Request):
    payload = await req.json()
    # audit: request received
    try:
        metric_dbg = payload.get('metric','unknown')
        reasons_dbg = payload.get('reasons',[])
        app_dbg = payload.get('app_label','therapy-backend')
        ns_dbg = payload.get('namespace','default')
        audit_log('webhook','request',app_dbg,ns_dbg,metric_dbg,reasons_dbg,{"path":"/trigger"})
    except Exception:
        pass
    metric = payload.get("metric", "unknown")
    reasons = payload.get("reasons", [])
    score = payload.get("score", 0.0)
    exp = payload.get("explanation", {})
    app_label = payload.get("app_label", "therapy-backend")
    target_ns = payload.get("namespace", "default")
    prom_url = payload.get("prom_url", "http://prometheus-server.default.svc")
    s3_bucket = os.getenv("RUNBOOKS_S3_BUCKET","")
    s3_prefix = os.getenv("RUNBOOKS_S3_PREFIX","runbooks")
    job_id = str(uuid.uuid4())[:8]

    batch, core = k8s()

    env_col = {
        "TARGET_NAMESPACE": target_ns,
        "APP_LABEL": app_label,
        "METRIC": metric,
        "REASONS_JSON": json.dumps(reasons),
        "SCORE": str(score),
        "EXPLANATION_JSON": json.dumps(exp),
        "PROM_URL": prom_url,
        "S3_BUCKET": s3_bucket,
        "S3_PREFIX": s3_prefix,
        "RUNBOOK_ID": job_id
    }
    resp1 = create_job(batch, f"runbook-{job_id}", IMAGE, env_col)

    if AUTOFIX_ENABLED:
        env_rem = {
            "TARGET_NAMESPACE": target_ns,
            "APP_LABEL": app_label,
            "METRIC": metric,
            "REASONS_JSON": json.dumps(reasons),
            "AUTOFIX_POLICY": (policy_from_cm(target_ns, app_label) or os.getenv("RUNBOOK_AUTOFIX_POLICY","")),
            "AUTOFIX_DRY_RUN": os.getenv("RUNBOOK_AUTOFIX_DRY_RUN","true"),
            "AUTOFIX_SCALE_MAX": os.getenv("RUNBOOK_AUTOFIX_SCALE_MAX","10"),
            "AUTOFIX_SCALE_STEP": os.getenv("RUNBOOK_AUTOFIX_SCALE_STEP","1")
        }
        if APPROVAL_REQUIRED:
            action_id = str(uuid.uuid4())[:8]
            token = _hmac(action_id)
            approval_store(action_id, {"env": env_rem, "app": app_label})
            post_slack_blocks(metric, reasons, app_label, target_ns, action_id)
            audit_log('webhook','approval_pending', app_label, target_ns, metric, reasons, {"action_id": action_id})
        else:
            if circuit_allow(app_label):
                create_job(batch, f"remed-{job_id}", REMEDIATOR_IMAGE, env_rem)
                audit_log('webhook','executed', app_label, target_ns, metric, reasons, {"job": f"remed-{job_id}"})
                circuit_inc(app_label)
            else:
                post_slack(f":no_entry: Circuit open for *{app_label}* – skipping autofix.")
                audit_log('webhook','skipped_circuit', app_label, target_ns, metric, reasons)

    audit_log('webhook','collector_started', app_label, target_ns, metric, reasons, {"job": resp1.metadata.name})
    return JSONResponse({"status":"ok","collector_job": resp1.metadata.name})

@app.post("/alertmanager")
async def alertmanager(req: Request):
    payload = await req.json()
    # audit: request received
    try:
        metric_dbg = payload.get('metric','unknown')
        reasons_dbg = payload.get('reasons',[])
        app_dbg = payload.get('app_label','therapy-backend')
        ns_dbg = payload.get('namespace','default')
        audit_log('webhook','request',app_dbg,ns_dbg,metric_dbg,reasons_dbg,{"path":"/trigger"})
    except Exception:
        pass
    alerts = payload.get("alerts", [])
    results = []
    for a in alerts:
        labels = a.get("labels", {})
        annotations = a.get("annotations", {})
        metric = labels.get("alertname") or annotations.get("summary") or "alert"
        reasons = [labels.get("severity","alert")] + [f"{k}={v}" for k,v in labels.items() if k!="alertname"]
        await trigger(Request({"type":"http","json": lambda: {"metric": metric, "reasons": reasons, "namespace": os.getenv("RUNBOOK_TARGET_NAMESPACE","default"), "app_label": os.getenv("RUNBOOK_APP_LABEL","therapy-backend")}}))
        results.append(metric)
    return JSONResponse({"status":"ok","count": len(results)})

@app.get("/approve")
async def approve(id: str, token: str):
    if _hmac(id) != token:
        return JSONResponse({"status":"error","error":"invalid token"}, status_code=403)
    payload = approval_load(id)
    if not payload:
        return JSONResponse({"status":"error","error":"not found"}, status_code=404)
    app_label = payload.get("app") or "app"
    if not circuit_allow(app_label):
        post_slack(f":no_entry: Circuit open for *{app_label}* – skipping approved autofix.")
        return JSONResponse({"status":"ok","note":"circuit open – skipped"})
    batch, _ = k8s()
    env_rem = payload["env"].copy()
    env_rem["AUTOFIX_DRY_RUN"] = "false"
    create_job(batch, f"remed-{id}", REMEDIATOR_IMAGE, env_rem)
    circuit_inc(app_label)
    post_slack(f":white_check_mark: Approved autofix executed for *{app_label}* (action {id}).")
    return JSONResponse({"status":"ok","action":"executed"})

@app.get("/reject")
async def reject(id: str, token: str):
    if _hmac(id) != token:
        return JSONResponse({"status":"error","error":"invalid token"}, status_code=403)
    post_slack(f":x: Autofix rejected (action {id}).")
    return JSONResponse({"status":"ok","action":"rejected"})


def audit_log(source: str, action: str, app_label: str=None, namespace: str=None, metric: str=None, reasons=None, details=None):
    if not AIOPS_DATABASE_URL:
        return
    try:
        conn = psycopg2.connect(AIOPS_DATABASE_URL)
        with conn, conn.cursor() as cur:
            cur.execute("""INSERT INTO runbooks_audit(source, app_label, namespace, metric, reasons, action, details)
                           VALUES (%s,%s,%s,%s,%s,%s,%s)""" ,
                        (source, app_label, namespace, metric, json.dumps(reasons or []),
                         action, json.dumps(details or {})))
    except Exception as e:
        # best-effort; don't crash on audit failure
        pass


def policy_from_cm(namespace: str, app_label: str) -> str | None:
    # ConfigMap in runbooks namespace (or NAMESPACE) with keys:
    #  - default
    #  - f"{namespace}.{app_label}"
    #  - f"{namespace}.*"
    #  - f"*.{app_label}"
    try:
        _, core = k8s()
        cm = core.read_namespaced_config_map(name=RUNBOOK_POLICY_CM, namespace=NAMESPACE)
        data = cm.data or {}
        key_exact = f"{namespace}.{app_label}"
        key_ns_any = f"{namespace}.*"
        key_any_app = f"*.{app_label}"
        return data.get(key_exact) or data.get(key_ns_any) or data.get(key_any_app) or data.get("default")
    except Exception:
        return None


def post_slack_blocks(metric: str, reasons: list, app_label: str, namespace: str, action_id: str):
    # Prefer Slack Bot API for interactive buttons
    if SLACK_BOT_TOKEN and SLACK_CHANNEL:
        try:
            import requests as _r
            blocks = [
                {"type":"section","text":{"type":"mrkdwn","text":f"*Autofix pending approval* for `{app_label}` in `{namespace}`\n*metric:* `{metric}`\n*reasons:* `{', '.join(map(str,reasons or []))}`"}},
                {"type":"actions","elements":[
                    {"type":"button","text":{"type":"plain_text","text":"Approve ✅"},"style":"primary","value":action_id,"action_id":"approve"},
                    {"type":"button","text":{"type":"plain_text","text":"Reject ❌"},"style":"danger","value":action_id,"action_id":"reject"}
                ]}
            ]
            _r.post("https://slack.com/api/chat.postMessage",
                    headers={"Authorization": f"Bearer {SLACK_BOT_TOKEN}","Content-Type":"application/json;charset=utf-8"},
                    json={"channel": SLACK_CHANNEL, "text":"Autofix pending approval", "blocks": blocks}, timeout=6)
            return
        except Exception:
            pass
    # Fallback to simple text via incoming webhook (no interactivity, just info)
    post_slack(f":warning: Autofix pending approval for *{app_label}* (metric={metric}, reasons={reasons}). Use /approve link if configured.")


def _verify_slack_signature(headers, body: bytes) -> bool:
    try:
        ts = headers.get("X-Slack-Request-Timestamp","0")
        sig = headers.get("X-Slack-Signature","")
        basestring = f"v0:{ts}:{body.decode()}"
        mysig = "v0=" + hmac.new(SLACK_SIGNING_SECRET.encode(), basestring.encode(), hashlib.sha256).hexdigest()
        # Basic compare
        return hmac.compare_digest(mysig, sig)
    except Exception:
        return False

@app.post("/slack/interactive")
async def slack_interactive(req: Request):
    raw = await req.body()
    if SLACK_SIGNING_SECRET and not _verify_slack_signature(req.headers, raw):
        return JSONResponse({"status":"error","error":"bad signature"}, status_code=403)
    # Slack sends application/x-www-form-urlencoded with 'payload=' JSON
    form = await req.form()
    payload = json.loads(form.get("payload","{}"))
    action = (payload.get("actions") or [{}])[0]
    action_id = action.get("value") or ""
    user = payload.get("user",{}).get("username") or payload.get("user",{}).get("id") or "user"
    if not action_id:
        return JSONResponse({"status":"error","error":"missing action id"}, status_code=400)
    data = approval_load(action_id)
    if not data:
        return JSONResponse({"status":"error","error":"not found"}, status_code=404)
    app_label = data.get("app") or "app"
    batch, _ = k8s()
    if action.get("action_id") == "approve":
        if not circuit_allow(app_label):
            post_slack(f":no_entry: Circuit open for *{app_label}* – skipping approved autofix.")
            audit_log('webhook','skipped_circuit', app_label, None, None, None, {"action":"approve-click"})
            return JSONResponse({"status":"ok","note":"circuit open"})
        env_rem = data["env"].copy(); env_rem["AUTOFIX_DRY_RUN"] = "false"
        job = create_job(batch, f"remed-{action_id}", REMEDIATOR_IMAGE, env_rem)
        circuit_inc(app_label)
        audit_log('webhook','approved', app_label, env_rem.get("TARGET_NAMESPACE"), env_rem.get("METRIC"), json.loads(env_rem.get("REASONS_JSON","[]")), {"by": user, "job": job.metadata.name})
        return JSONResponse({"status":"ok","action":"approved"})
    else:
        audit_log('webhook','rejected', app_label, None, None, None, {"by": user})
        post_slack(f":x: Autofix rejected by {user}.")
        return JSONResponse({"status":"ok","action":"rejected"})

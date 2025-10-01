import os, time, requests, math
from datetime import datetime, timedelta, timezone
import numpy as np
import psycopg2, psycopg2.extras, pickle, json, requests

from prometheus_client import start_http_server, Gauge

# Optional ML
try:
    from sklearn.ensemble import IsolationForest
    SKLEARN = True
except Exception:
    SKLEARN = False

PROM_URL = os.getenv("PROM_URL", "http://prometheus-server.default.svc")
PROM_TOKEN = os.getenv("PROM_TOKEN", "")
AIOPS_DATABASE_URL = os.getenv("AIOPS_DATABASE_URL")
INTERVAL_SEC = int(os.getenv("AIOPS_INTERVAL_SEC", "300"))
Z_THRESH = float(os.getenv("AIOPS_Z_THRESH", "3.0"))
VOL_MULT = float(os.getenv("AIOPS_VOL_MULT", "2.0"))
PCT_THRESH = float(os.getenv("AIOPS_PCT_THRESH", "0.2"))
RUNBOOK_WEBHOOK = os.getenv("AIOPS_RUNBOOK_WEBHOOK", "http://runbooks-webhook.runbooks.svc:8080/trigger")
RUNBOOK_ENABLED = os.getenv("AIOPS_RUNBOOK_ENABLED","true").lower() == "true"
RUNBOOK_POLICY = os.getenv("AIOPS_RUNBOOK_POLICY","http_requests:success_rate:trend_break;http_requests:latency_p99:level_shift;therapy:success_rate:trend_break")
RUNBOOK_TARGET_NAMESPACE = os.getenv("RUNBOOK_TARGET_NAMESPACE","default")
RUNBOOK_APP_LABEL = os.getenv("RUNBOOK_APP_LABEL","therapy-backend")
METRICS = [m.strip() for m in os.getenv("AIOPS_METRICS", "http_requests:success_rate,http_requests:latency_p99,therapy:success_rate,kubecost_cluster_cost").split(",") if m.strip()]

g_anom = Gauge("aiops_anomaly_current", "Current anomaly signal (1=anomaly)", ["metric"])
g_score = Gauge("aiops_anomaly_score", "Latest anomaly score (lower is more anomalous in IF)", ["metric"])
g_last  = Gauge("aiops_last_run_timestamp", "Unix timestamp of last run")
g_info  = Gauge("aiops_anomaly_info", "Anomaly reason flag", ["metric","reason"])
g_z     = Gauge("aiops_anomaly_zscore", "Z-score of last point vs window", ["metric","window"])
g_delta = Gauge("aiops_anomaly_delta", "Delta of last point vs mean24h", ["metric"])

MODEL_CACHE = {}
def get_db():
    if not AIOPS_DATABASE_URL:
        return None
    try:
        return psycopg2.connect(AIOPS_DATABASE_URL)
    except Exception:
        return None

def load_model(metric):
    if metric in MODEL_CACHE:
        return MODEL_CACHE[metric]
    conn = get_db()
    if not conn:
        return None
    try:
        with conn, conn.cursor() as cur:
            cur.execute("SELECT model FROM aiops_models WHERE metric=%s ORDER BY created_at DESC LIMIT 1", (metric,))
            row = cur.fetchone()
            if row and row[0]:
                mdl = pickle.loads(bytes(row[0]))
                MODEL_CACHE[metric] = mdl
                return mdl
    except Exception:
        return None
    finally:
        try: conn.close()
        except Exception: pass
    return None

def save_observation(metric, value):
    conn = get_db()
    if not conn:
        return
    try:
        with conn, conn.cursor() as cur:
            cur.execute("INSERT INTO aiops_observations(metric, ts, value) VALUES (%s, now(), %s)", (metric, float(value)))
    except Exception:
        pass
    finally:
        try: conn.close()
        except Exception: pass

def save_anomaly(metric, score, method, details=None):
    conn = get_db()
    if not conn:
        return
    try:
        with conn, conn.cursor() as cur:
            cur.execute("INSERT INTO aiops_anomalies(metric, score, method, details) VALUES (%s, %s, %s, %s)",
                        (metric, float(score), method, json.dumps(details or {})))
    except Exception:
        pass
    finally:
        try: conn.close()
        except Exception: pass


def prom_query_range(expr: str, start: datetime, end: datetime, step: int=300):
    params = {
        "query": expr,
        "start": int(start.timestamp()),
        "end": int(end.timestamp()),
        "step": step,
    }
    headers = {"Accept":"application/json"}
    if PROM_TOKEN:
        headers["Authorization"] = f"Bearer {PROM_TOKEN}"
    url = PROM_URL.rstrip("/") + "/api/v1/query_range"
    r = requests.get(url, params=params, headers=headers, timeout=30)
    r.raise_for_status()
    data = r.json()
    if data.get("status") != "success":
        raise RuntimeError(f"Prometheus error for {expr}: {data}")
    result = data["data"]["result"]
    if not result:
        return []
    # take the first time series
    series = result[0]["values"]
    # values is list of [timestamp, "value"]
    return [float(v[1]) for v in series if v[1] not in (None, "NaN", "Inf", "-Inf")]

def zscore_anomaly(vals):
    if len(vals) < 10:
        return 0.0, False
    arr = np.array(vals[:-1])
    mu = arr.mean()
    sd = arr.std() or 1.0
    last = vals[-1]
    z = abs((last - mu) / sd)
    return float(z), bool(z > 3.0)

def iforest_anomaly(vals):
    if not SKLEARN or len(vals) < 50:
        return 0.0, None
    X = np.array(vals).reshape(-1,1)
    model = IsolationForest(n_estimators=100, contamination='auto', random_state=42)
    model.fit(X)
    score = float(model.decision_function([[vals[-1]]])[0])  # lower -> more anomalous
    pred = int(model.predict([[vals[-1]]])[0])  # -1 anomalous, 1 normal
    return score, (pred == -1)

def run_once():
    end = datetime.now(timezone.utc)
    start = end - timedelta(hours=24)  # last 24h
    for m in METRICS:
        try:
            vals = prom_query_range(m, start, end, step=300)
            if not vals:
                g_anom.labels(metric=m).set(0)
                g_score.labels(metric=m).set(0)
                continue
            mdl = load_model(m)
            if mdl is not None:
                try:
                    score = float(mdl.decision_function([[vals[-1]]])[0])
                    anom = score < 0
                    method = 'iforest_model'
                except Exception:
                    score_if, anom_if = iforest_anomaly(vals)
                    z, anom_z = zscore_anomaly(vals)
                    if anom_if is not None:
                        anom = anom_if; score = score_if; method = 'iforest_live'
                    else:
                        anom = anom_z; score = -z; method = 'zscore'
            else:
                score_if, anom_if = iforest_anomaly(vals)
                z, anom_z = zscore_anomaly(vals)
                if anom_if is not None:
                    anom = anom_if; score = score_if; method = 'iforest_live'
                else:
                    anom = anom_z; score = -z; method = 'zscore'
            g_anom.labels(metric=m).set(1 if anom else 0)
            g_score.labels(metric=m).set(score)
            exp = build_explanation(vals)
            try:
                g_z.labels(metric=m, window='24h').set(exp['z24h'])
                g_z.labels(metric=m, window='6h').set(exp['z6h'])
                g_z.labels(metric=m, window='1h').set(exp['z1h'])
                g_delta.labels(metric=m).set(exp['delta24h'])
                for r in exp['reasons']:
                    g_info.labels(metric=m, reason=r).set(1)
            except Exception:
                pass
            if anom:
                try:
                    details = exp; details['method'] = method
                    save_anomaly(m, score, method, details)
                except Exception:
                    pass
                trigger_runbook(m, exp.get('reasons'), score, exp)
                notify_all(m, score)
        except Exception as e:
            # expose as anomaly with score -10 (very anomalous) to catch pipeline failures
            g_anom.labels(metric=m).set(1)
            g_score.labels(metric=m).set(-10.0)
            notify_all(m, -10.0, error=str(e))
    g_last.set(time.time())

def notify_all(metric, score, error=None):
    text = f"AIOps anomaly detected for '{metric}'. score={score:.4f}"
    if error:
        text += f" (pipeline_error={error})"
    # Slack
    slack = os.getenv("SLACK_WEBHOOK_URL", "")
    if slack:
        try:
            requests.post(slack, json={"text": text}, timeout=10)
        except Exception:
            pass
    # Discord
    disc = os.getenv("DISCORD_WEBHOOK_URL","")
    if disc:
        try:
            requests.post(disc, json={"content": text}, timeout=10)
        except Exception:
            pass
    # PagerDuty
    pd_key = os.getenv("PAGERDUTY_ROUTING_KEY","")
    if pd_key:
        try:
            requests.post("https://events.pagerduty.com/v2/enqueue", json={
                "routing_key": pd_key,
                "event_action": "trigger",
                "payload": {
                    "summary": text,
                    "severity": "error",
                    "source": "aiops-detector"
                }
            }, timeout=10)
        except Exception:
            pass

def main():
    start_http_server(int(os.getenv("AIOPS_PORT","8000")))
    while True:
        run_once()
        time.sleep(INTERVAL_SEC)

if __name__ == "__main__":
    main()

def pct_change(a, b):
    try:
        if b == 0: return 0.0
        return (a - b) / abs(b)
    except Exception:
        return 0.0

def slope(vals):
    n = len(vals)
    if n < 5: return 0.0
    x_mean = (n-1)/2
    y_mean = sum(vals)/n
    num = sum((i - x_mean)*(vals[i] - y_mean) for i in range(n))
    den = sum((i - x_mean)**2 for i in range(n)) or 1.0
    return num/den

def build_explanation(values):
    last = values[-1]
    v24 = values[-288:] if len(values) >= 288 else values
    v6h = values[-72:] if len(values) >= 72 else values
    v1h = values[-12:] if len(values) >= 12 else values
    mean24 = float(np.mean(v24)); std24 = float(np.std(v24) or 1.0)
    mean6 = float(np.mean(v6h)); std6 = float(np.std(v6h) or 1.0)
    mean1 = float(np.mean(v1h)); std1 = float(np.std(v1h) or 1.0)
    z24 = abs((last - mean24) / std24)
    z6 = abs((last - mean6) / std6)
    z1 = abs((last - mean1) / std1)
    d24 = last - mean24
    sl6 = slope(v6h); sl1 = slope(v1h)
    pc1 = pct_change(last, v1h[0] if v1h else last)
    pc6 = pct_change(last, v6h[0] if v6h else last)
    reasons = []
    if z24 > Z_THRESH: reasons.append("level_shift")
    if (std1 / (std6 or 1.0)) > VOL_MULT: reasons.append("volatility_spike")
    if sl1 * sl6 < 0 and abs(sl1) > abs(sl6): reasons.append("trend_break")
    if abs(pc1) > PCT_THRESH or abs(pc6) > PCT_THRESH: reasons.append("percent_change")
    return {
        "last": last,
        "mean24h": mean24, "std24h": std24, "z24h": z24, "delta24h": d24,
        "mean6h": mean6, "std6h": std6, "z6h": z6,
        "mean1h": mean1, "std1h": std1, "z1h": z1,
        "pct_change_1h": pc1, "pct_change_6h": pc6,
        "slope_1h": sl1, "slope_6h": sl6,
        "reasons": reasons[:3] or ["unspecified"]
    }

def parse_policy(s: str):
    policy = set()
    for part in (s or "").split(";"):
        part = part.strip()
        if not part: continue
        toks = part.split(":")
        if len(toks) < 2: continue
        metric = ":".join(toks[:-1]); reason = toks[-1]
        policy.add((metric, reason))
    return policy

def trigger_runbook(metric: str, reasons: list, score: float, explanation: dict):
    if not RUNBOOK_ENABLED or not RUNBOOK_WEBHOOK:
        return
    pol = parse_policy(RUNBOOK_POLICY)
    for r in reasons or []:
        if (metric, r) in pol:
            try:
                requests.post(RUNBOOK_WEBHOOK, json={
                    "metric": metric,
                    "reasons": reasons,
                    "score": float(score),
                    "explanation": explanation,
                    "namespace": RUNBOOK_TARGET_NAMESPACE,
                    "app_label": RUNBOOK_APP_LABEL,
                    "prom_url": PROM_URL
                }, timeout=5)
            except Exception:
                pass
            break

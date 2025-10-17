import os, pickle, psycopg2, psycopg2.extras
from datetime import datetime, timedelta, timezone
from sklearn.ensemble import IsolationForest

DATABASE_URL = os.getenv("AIOPS_DATABASE_URL") or os.getenv("DATABASE_URL")
METRICS = [m.strip() for m in os.getenv("AIOPS_TRAIN_METRICS","").split(",") if m.strip()] or None
DAYS = int(os.getenv("AIOPS_TRAIN_DAYS","30"))
MIN_POINTS = int(os.getenv("AIOPS_MIN_POINTS","200"))

if not DATABASE_URL:
    raise SystemExit("AIOPS_DATABASE_URL/DATABASE_URL not set")

conn = psycopg2.connect(DATABASE_URL)
with conn, conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
    if METRICS is None:
        cur.execute("SELECT DISTINCT metric FROM aiops_observations")
        METRICS = [r[0] for r in cur.fetchall()]
    cutoff = datetime.now(timezone.utc) - timedelta(days=DAYS)

    for metric in METRICS:
        cur.execute("SELECT value FROM aiops_observations WHERE metric=%s AND ts >= %s ORDER BY ts ASC", (metric, cutoff))
        rows = cur.fetchall()
        values = [float(r[0]) for r in rows]
        if len(values) < MIN_POINTS:
            print(f"[SKIP] {metric}: not enough data ({len(values)} < {MIN_POINTS})")
            continue
        X = [[v] for v in values]
        model = IsolationForest(n_estimators=200, contamination='auto', random_state=42)
        model.fit(X)
        blob = pickle.dumps(model)
        cur.execute("INSERT INTO aiops_models(metric, model) VALUES (%s, %s)", (metric, psycopg2.Binary(blob)))
        print(f"[OK] stored model for {metric} ({len(values)} points)")
print("Training complete.")

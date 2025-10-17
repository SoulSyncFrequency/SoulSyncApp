# scripts/anomaly_detector.py
import json, os, math, time, glob, statistics as stats

def z(x, mu, sigma): 
    return (x - mu) / sigma if sigma else 0.0

def detect_anomalies(values, thresh=3.0):
    if len(values) < 10: 
        return []
    mu = stats.mean(values)
    sigma = stats.pstdev(values)
    return [i for i,v in enumerate(values) if abs(z(v,mu,sigma)) >= thresh]

def main():
    # Example: scan NDJSON logs emitted by pino/morgan with {"latency_ms":..., "ok":true}
    files = glob.glob("./logs/*.ndjson")
    alerts = []
    for fp in files:
        latencies = []
        errors = 0
        total = 0
        with open(fp,"r",encoding="utf-8",errors="ignore") as f:
            for line in f:
                try:
                    j = json.loads(line)
                    if "latency_ms" in j:
                        latencies.append(j["latency_ms"])
                    total += 1
                    if j.get("level") == "error" or j.get("status",200) >= 500:
                        errors += 1
                except Exception:
                    continue
        if total >= 20:
            err_rate = errors/total
            spikes = detect_anomalies(latencies)
            if spikes or err_rate > float(os.getenv("ANOMALY_ERR_THRESH","0.05")):
                alerts.append({"file": fp, "err_rate": err_rate, "spikes": len(spikes)})
    if alerts:
        print(json.dumps({"alerts": alerts}, ensure_ascii=False))
    else:
        print(json.dumps({"alerts": []}))

if __name__ == "__main__":
    main()

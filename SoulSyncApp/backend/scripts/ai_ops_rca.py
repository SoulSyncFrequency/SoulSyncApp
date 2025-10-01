
import os, json, time, glob, statistics as stats
from datetime import datetime, timedelta

WEBHOOK = os.getenv('OPS_RCA_WEBHOOK')  # Slack/Teams webhook
LOOKBACK_HOURS = int(os.getenv('OPS_RCA_LOOKBACK_HOURS', '24'))

def load_ndjson(pattern):
    rows=[]
    for f in glob.glob(pattern):
        try:
            with open(f, 'r', encoding='utf-8', errors='ignore') as fh:
                for line in fh:
                    try:
                        rows.append(json.loads(line))
                    except:
                        pass
        except: pass
    return rows

def summarize_errors(logs):
    # naive: count by level/message
    out = {}
    for r in logs:
        lvl = (r.get('level') or r.get('severity') or 'info').lower()
        if lvl not in ('error','fatal'): continue
        key = (r.get('msg') or r.get('message') or 'unknown')[:120]
        out[key] = out.get(key, 0)+1
    return sorted(out.items(), key=lambda x:-x[1])[:10]

def summarize_latency(metrics_file='metrics_sample.json'):
    # placeholder: if you export histograms to a file, read here
    try:
        m = json.load(open(metrics_file,'r',encoding='utf-8'))
        p95 = m.get('http_p95_ms', None)
        p99 = m.get('http_p99_ms', None)
        return p95, p99
    except:
        return None, None

def __orig_build_report():
    since = datetime.utcnow() - timedelta(hours=LOOKBACK_HOURS)
    logs = load_ndjson('logs/*.ndjson')
    errors = summarize_errors(logs)
    p95,p99 = summarize_latency()
    report = {
        'since': since.isoformat()+'Z',
        'highlights': {
            'top_errors': [{'message':k,'count':v} for k,v in errors],
            'latency_p95_ms': p95, 'latency_p99_ms': p99
        },
        'notes': 'Automated daily RCA summary (placeholder).'
    }
    return report

def post_webhook(url, payload):
    try:
        import urllib.request
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type':'application/json'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            resp.read()
    except Exception as e:
        print('Webhook post failed:', e)

def main():
    rpt = build_report()
    print(json.dumps(rpt, indent=2))
    if WEBHOOK:
        post_webhook(WEBHOOK, rpt)

if __name__=='__main__':
    main()


def git_release_notes():
    import subprocess
    try:
        out = subprocess.check_output(['git','--no-pager','log','-n','30','--pretty=format:%s'], stderr=subprocess.DEVNULL).decode('utf-8','ignore')
        lines = [l.strip() for l in out.splitlines() if l.strip()]
        # de-duplicate similar prefixes
        top = []
        seen=set()
        for l in lines:
            k = l.split(':')[0].lower()
            if k in seen: continue
            seen.add(k); top.append(l)
            if len(top)>=10: break
        return top
    except Exception:
        return []

def __orig_build_report():
    since = datetime.utcnow() - timedelta(hours=LOOKBACK_HOURS)
    logs = load_ndjson('logs/*.ndjson')
    errors = summarize_errors(logs)
    p95,p99 = summarize_latency()
    notes = git_release_notes()
    report = {
        'since': since.isoformat()+'Z',
        'highlights': {
            'top_errors': [{'message':k,'count':v} for k,v in errors],
            'latency_p95_ms': p95, 'latency_p99_ms': p99,
            'release_notes': notes
        },
        'notes': 'Automated daily RCA summary.'
    }
    return report


def make_tldr(report: dict) -> str:
    hi = report.get('highlights', {}) or {}
    errs = hi.get('top_errors', []) or []
    p95 = hi.get('latency_p95_ms')
    p99 = hi.get('latency_p99_ms')
    notes = hi.get('release_notes', []) or []
    parts = []
    if errs:
        parts.append(f"Top error: '{errs[0]['message']}' x{errs[0]['count']}")
    if isinstance(p95,(int,float)) and isinstance(p99,(int,float)):
        parts.append(f"latency p95={int(p95)}ms p99={int(p99)}ms")
    if notes:
        parts.append(f"recent: {notes[0][:60]}")
    return ' | '.join(parts) or 'No significant events.'

def __orig_build_report():
    rpt = __orig_build_report() if 'since' in globals() else None  # placeholder

def build_report():
    base = __orig_build_report()
    if (os.getenv('OPS_RCA_AI_TLDR_ENABLED','false').lower()=='true'):
        base['tldr'] = make_tldr(base)
    return base

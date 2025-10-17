
# Reads NDJSON access logs (one per line) and prints basic p95 latency per route.
import json, sys, statistics

def main(path='logs/access.ndjson'):
  counts = {}
  lat = {}
  try:
    with open(path,'r',encoding='utf-8',errors='ignore') as f:
      for line in f:
        try:
          j=json.loads(line)
        except:
          continue
        route = j.get('route') or j.get('path') or 'unknown'
        ms = j.get('duration_ms') or j.get('latency_ms')
        if ms is None: continue
        counts[route]=counts.get(route,0)+1
        lat.setdefault(route, []).append(float(ms))
  except FileNotFoundError:
    print('no logs at', path)
    return
  for r, arr in lat.items():
    arr.sort()
    p95 = arr[int(0.95*len(arr))-1] if arr else None
    print(f"{r}\tp95={p95:.0f}ms\tcount={len(arr)}")

if __name__=='__main__':
  main(*sys.argv[1:])


import json, glob, collections
def main():
  srcs = collections.defaultdict(set)
  for f in glob.glob('logs/csp.ndjson'):
    for line in open(f,'r',encoding='utf-8',errors='ignore'):
      try:
        j=json.loads(line)
      except: 
        continue
      rep = j.get('report') or j.get('csp-report') or {}
      vd = rep.get('violated-directive','')
      bu = rep.get('blocked-uri','')
      if not vd: continue
      # crude extraction of host for allowlist suggestions
      if bu and '://' in bu:
        host = bu.split('://',1)[1].split('/',1)[0]
        srcs[vd].add(host)
  for d, hosts in srcs.items():
    print(d, '=>', ' '.join(sorted(set(hosts))))
if __name__=='__main__':
  main()

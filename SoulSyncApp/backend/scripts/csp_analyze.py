
import json, glob, collections
def main():
  counts = collections.Counter()
  for f in glob.glob('logs/csp.ndjson'):
    for line in open(f,'r',encoding='utf-8',errors='ignore'):
      try:
        j=json.loads(line)
      except: 
        continue
      rep = j.get('report') or j.get('csp-report') or {}
      k = f"{rep.get('violated-directive','unknown')}|{rep.get('blocked-uri','')}"
      counts[k]+=1
  top = counts.most_common(20)
  for k,v in top:
    print(v, k)
if __name__=='__main__':
  main()

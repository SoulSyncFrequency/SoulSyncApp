
import os, time, glob
DAYS = int(os.getenv('LOG_RETENTION_DAYS','30'))
CUTOFF = time.time() - DAYS*86400
for f in glob.glob('logs/*.ndjson') + glob.glob('logs/*.gz'):
  try:
    if os.path.getmtime(f) < CUTOFF:
      os.remove(f)
      print('deleted', f)
  except Exception as e:
    print('skip', f, e)

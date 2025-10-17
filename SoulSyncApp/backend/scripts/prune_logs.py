
import os, time, glob
from datetime import datetime, timedelta
days = int(os.getenv('LOG_RETENTION_DAYS','14'))
cutoff = time.time() - days*86400
for f in glob.glob('logs/*.ndjson'):
    if os.path.getmtime(f) < cutoff:
        try: os.remove(f)
        except: pass
print('done')


# Size-based rotate if > MAX_LOG_SIZE_MB
import gzip
MAX_MB = int(os.getenv('MAX_LOG_SIZE_MB','50'))
def rotate_if_big(path):
    try:
        if os.path.getsize(path) > MAX_MB*1024*1024:
            with open(path,'rb') as fh, gzip.open(path + '.gz','wb') as gz:
                gz.writelines(fh)
            open(path,'w').close()
    except: pass

for f in glob.glob('logs/*.ndjson'):
    rotate_if_big(f)

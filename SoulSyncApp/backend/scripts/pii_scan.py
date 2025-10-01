
import re, sys, json
# naive PII regexes
EMAIL=r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
PHONE=r"\+?\d[\d\s().-]{7,}\d"
def scan_text(t:str):
    hits=[]
    if re.search(EMAIL,t): hits.append('email')
    if re.search(PHONE,t): hits.append('phone')
    return hits
def main():
    # Placeholder: read NDJSON from stdin or files provided
    import fileinput
    alerts=[]
    for line in fileinput.input():
        try:
            j=json.loads(line)
        except: 
            continue
        txt = json.dumps(j, ensure_ascii=False)
        h=scan_text(txt)
        if h: alerts.append({'idx': fileinput.filelineno(), 'hits': h})
    print(json.dumps({'alerts':alerts}))
if __name__=='__main__':
    main()

NAME=r"\b([A-Z][a-z]+\s[A-Z][a-z]+)\b"
DOB=r"\b(19|20)\d{2}-\d{2}-\d{2}\b"
ADDR=r"\d+\s+\w+\s+(Street|St|Road|Rd|Ave|Avenue|Blvd)\b"
def scan_text(t:str):
    hits=[]
    if re.search(EMAIL,t): hits.append('email')
    if re.search(PHONE,t): hits.append('phone')
    if re.search(DOB,t): hits.append('dob')
    if re.search(ADDR,t): hits.append('address')
    return hits
if __name__=='__main__':
    import argparse, glob
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', help='Directory to scan (NDJSON files)', default='logs')
    args = ap.parse_args()
    files = glob.glob(os.path.join(args.dir, '*.ndjson'))
    for f in files:
        with open(f, 'r', encoding='utf-8', errors='ignore') as fh:
            for i,line in enumerate(fh, start=1):
                try:
                    j=json.loads(line)
                except:
                    continue
                txt=json.dumps(j, ensure_ascii=False)
                h=scan_text(txt)
                if h:
                    print(json.dumps({'file':f,'line':i,'hits':h}))

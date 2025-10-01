const fs = require('fs'); const path = require('path'); const yaml = require('js-yaml');
const appTs = path.join(__dirname, '../backend/src/app.ts')
const oapi = path.join(__dirname, '../backend/openapi.yaml')
if(!fs.existsSync(appTs) || !fs.existsSync(oapi)){ console.log('SKIP: missing app.ts or openapi.yaml'); process.exit(0) }
const app = fs.readFileSync(appTs,'utf8'); const doc = yaml.load(fs.readFileSync(oapi,'utf8'))
const paths = Object.keys(doc.paths||{}); let missing=[]
for(const p of paths){ if(!app.includes(p.split('?')[0])) missing.push(p) }
if(missing.length){ console.error('Missing in app.ts:', missing); process.exit(1) }
console.log('OpenAPI check OK.')

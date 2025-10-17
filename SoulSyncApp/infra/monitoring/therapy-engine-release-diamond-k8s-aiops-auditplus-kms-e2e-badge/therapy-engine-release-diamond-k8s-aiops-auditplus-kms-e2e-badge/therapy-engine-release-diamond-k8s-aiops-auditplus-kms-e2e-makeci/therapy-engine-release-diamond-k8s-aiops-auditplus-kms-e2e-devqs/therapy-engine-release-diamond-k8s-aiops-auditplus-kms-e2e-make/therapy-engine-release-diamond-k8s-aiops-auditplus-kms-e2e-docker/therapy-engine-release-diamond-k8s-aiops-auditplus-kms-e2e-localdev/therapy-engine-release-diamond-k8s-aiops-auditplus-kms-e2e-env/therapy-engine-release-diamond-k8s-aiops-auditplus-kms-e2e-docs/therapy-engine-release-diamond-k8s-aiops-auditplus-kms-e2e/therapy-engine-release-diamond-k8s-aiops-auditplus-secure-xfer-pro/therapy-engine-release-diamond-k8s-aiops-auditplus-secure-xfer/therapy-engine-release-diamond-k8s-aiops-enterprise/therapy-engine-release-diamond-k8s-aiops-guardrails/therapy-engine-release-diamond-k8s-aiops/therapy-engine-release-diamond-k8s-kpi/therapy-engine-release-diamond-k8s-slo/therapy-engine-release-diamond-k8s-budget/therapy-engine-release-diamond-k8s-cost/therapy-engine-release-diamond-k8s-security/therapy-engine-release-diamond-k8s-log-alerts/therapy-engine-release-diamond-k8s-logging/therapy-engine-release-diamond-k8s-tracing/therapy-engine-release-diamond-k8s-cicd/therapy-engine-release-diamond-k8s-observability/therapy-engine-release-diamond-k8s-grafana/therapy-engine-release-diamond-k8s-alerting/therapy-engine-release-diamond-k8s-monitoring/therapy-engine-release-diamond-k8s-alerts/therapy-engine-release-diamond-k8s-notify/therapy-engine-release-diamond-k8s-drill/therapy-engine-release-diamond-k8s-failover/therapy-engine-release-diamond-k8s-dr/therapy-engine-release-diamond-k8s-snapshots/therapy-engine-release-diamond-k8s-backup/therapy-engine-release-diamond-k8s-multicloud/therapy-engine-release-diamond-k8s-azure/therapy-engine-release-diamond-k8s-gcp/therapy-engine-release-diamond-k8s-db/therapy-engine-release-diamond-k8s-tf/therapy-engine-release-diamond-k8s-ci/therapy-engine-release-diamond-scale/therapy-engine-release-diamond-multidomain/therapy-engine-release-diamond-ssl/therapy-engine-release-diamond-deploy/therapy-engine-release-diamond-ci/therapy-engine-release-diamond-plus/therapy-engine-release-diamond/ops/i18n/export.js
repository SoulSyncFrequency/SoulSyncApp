#!/usr/bin/env node
// Export locales to CSV
import fs from 'fs';
import path from 'path';
const localesDir = path.resolve(process.cwd(), '../../frontend/src/locales');
const langs = fs.readdirSync(localesDir).filter(f=>f.endsWith('.json')).map(f=>f.replace('.json',''));
const keys = new Set();
const data = {};
for (const lang of langs){
  const j = JSON.parse(fs.readFileSync(path.join(localesDir, lang+'.json'),'utf8'));
  data[lang]=j;
  Object.keys(j).forEach(k=>keys.add(k));
}
let csv = 'key,'+langs.join(',')+'\n';
for (const k of keys){
  const row=[k];
  for (const lang of langs){ row.push(JSON.stringify(data[lang][k]||'')); }
  csv += row.join(',')+'\n';
}
fs.writeFileSync('locales_export.csv', csv);
console.log('Wrote locales_export.csv');

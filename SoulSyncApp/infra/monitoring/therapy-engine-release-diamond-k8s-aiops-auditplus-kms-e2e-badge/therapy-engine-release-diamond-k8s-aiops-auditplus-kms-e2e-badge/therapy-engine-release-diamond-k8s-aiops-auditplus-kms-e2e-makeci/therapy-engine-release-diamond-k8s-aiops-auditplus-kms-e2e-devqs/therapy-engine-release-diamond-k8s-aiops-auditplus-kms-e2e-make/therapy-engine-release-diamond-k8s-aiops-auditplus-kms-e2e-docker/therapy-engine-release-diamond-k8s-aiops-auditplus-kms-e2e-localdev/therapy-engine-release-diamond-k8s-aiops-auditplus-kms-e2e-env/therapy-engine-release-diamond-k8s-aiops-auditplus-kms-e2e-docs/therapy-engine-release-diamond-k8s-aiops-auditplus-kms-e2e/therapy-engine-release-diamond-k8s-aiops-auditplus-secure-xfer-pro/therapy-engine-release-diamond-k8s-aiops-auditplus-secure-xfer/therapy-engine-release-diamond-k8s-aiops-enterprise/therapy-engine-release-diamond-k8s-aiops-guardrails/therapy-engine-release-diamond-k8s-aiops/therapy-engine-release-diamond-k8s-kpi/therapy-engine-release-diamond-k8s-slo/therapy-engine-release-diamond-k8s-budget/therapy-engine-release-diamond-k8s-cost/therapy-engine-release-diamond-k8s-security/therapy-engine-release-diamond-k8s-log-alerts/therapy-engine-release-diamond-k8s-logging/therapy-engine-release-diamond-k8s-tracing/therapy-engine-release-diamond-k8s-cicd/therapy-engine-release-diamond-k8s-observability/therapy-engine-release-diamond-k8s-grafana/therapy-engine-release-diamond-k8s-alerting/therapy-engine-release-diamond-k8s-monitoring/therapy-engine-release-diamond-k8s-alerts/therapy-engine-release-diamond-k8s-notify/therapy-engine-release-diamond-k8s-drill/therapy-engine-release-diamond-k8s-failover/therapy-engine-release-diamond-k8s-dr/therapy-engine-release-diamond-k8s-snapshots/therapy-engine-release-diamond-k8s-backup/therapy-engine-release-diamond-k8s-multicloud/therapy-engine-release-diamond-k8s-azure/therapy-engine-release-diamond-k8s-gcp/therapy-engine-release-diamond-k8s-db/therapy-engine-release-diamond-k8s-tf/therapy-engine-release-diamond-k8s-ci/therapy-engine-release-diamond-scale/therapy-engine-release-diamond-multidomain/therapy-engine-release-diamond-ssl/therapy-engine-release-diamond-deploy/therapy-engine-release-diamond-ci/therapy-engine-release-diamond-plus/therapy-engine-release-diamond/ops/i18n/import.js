#!/usr/bin/env node
// Import CSV into locale JSONs
import fs from 'fs';
import path from 'path';
const localesDir = path.resolve(process.cwd(), '../../frontend/src/locales');
const text = fs.readFileSync(process.argv[2]||'locales_import.csv','utf8');
const lines = text.trim().split(/\r?\n/);
const header = lines[0].split(',').slice(1);
const data = {};
for (const lang of header){ data[lang]={}; }
for (const line of lines.slice(1)){
  const parts = line.split(',');
  const key = parts[0];
  parts.slice(1).forEach((val,i)=>{
    try { val=JSON.parse(val); }catch{}
    data[header[i]][key]=val;
  });
}
for (const lang of header){
  fs.writeFileSync(path.join(localesDir, lang+'.json'), JSON.stringify(data[lang],null,2));
}
console.log('Updated locales JSON');

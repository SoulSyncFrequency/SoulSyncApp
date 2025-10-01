#!/usr/bin/env node
// Generate App Store/Play metadata JSON/CSV from store/en & store/hr files.
import fs from 'fs'; import path from 'path';
const root = path.resolve(process.cwd(), '..', '..');
function read(p){ return fs.existsSync(p) ? fs.readFileSync(p,'utf-8').trim() : ''; }
const en = {
  title: read(path.join(root,'store/en/title.txt')),
  short: read(path.join(root,'store/en/short_description.txt')),
  full: read(path.join(root,'store/en/full_description.txt')),
};
const hr = {
  title: read(path.join(root,'store/hr/title.txt')),
  short: read(path.join(root,'store/hr/short_description.txt')),
  full: read(path.join(root,'store/hr/full_description.txt')),
};
const out = { ios: { en, hr }, android: { en, hr } };
fs.writeFileSync(path.join(process.cwd(),'metadata.json'), JSON.stringify(out,null,2));
console.log('Wrote ops/store/metadata.json');

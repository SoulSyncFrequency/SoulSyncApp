const { readFileSync } = require('fs');
const { join } = require('path');

const files = process.argv.slice(2);
let bad = [];
for (const f of files) {
  const p = join(process.cwd(), f);
  const txt = readFileSync(p, 'utf8');
  if (/console\.log\(/.test(txt)) bad.push(f);
  if (/process\.env\.(SECRET|TOKEN|KEY)/i.test(txt)) bad.push(f);
}
if (bad.length) {
  console.error('Disallowed patterns found in:', bad.join(', '));
  process.exit(1);
}

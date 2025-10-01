// Convert brand SVGs (generated earlier) to PNG sets using sharp.
import fs from 'fs'; import path from 'path'; import sharp from 'sharp';
const inDir = process.argv[2] || path.join(process.cwd(), 'out');
const outDir = process.argv[3] || path.join(process.cwd(), 'png');
fs.mkdirSync(outDir, { recursive: true });

for (const file of fs.readdirSync(inDir)) {
  if (!file.endsWith('.svg')) continue;
  const base = file.replace(/\.svg$/,'');
  const svgPath = path.join(inDir, file);
  const sizes = [192,512,1024];
  for (const s of sizes) {
    const out = path.join(outDir, `${base}-${s}.png`);
    const buf = fs.readFileSync(svgPath);
    await sharp(buf).resize({ width: s, height: s, fit: 'contain', background: { r:255,g:255,b:255,alpha:0 } }).png().toFile(out);
    console.log('Wrote', out);
  }
}

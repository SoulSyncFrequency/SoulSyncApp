// Generate iOS/Android app icons & splash from brand SVG using sharp.
import fs from 'fs'; import path from 'path'; import sharp from 'sharp';

const inDir = process.argv[2] || path.join(process.cwd(), 'out');
const outDir = process.argv[3] || path.join(process.cwd(), 'png');
fs.mkdirSync(outDir, { recursive: true });

const iosSizes = [20,29,40,60,76,83.5,1024];
const androidSizes = { mdpi:48, hdpi:72, xhdpi:96, xxhdpi:144, xxxhdpi:192 };
const splashSizes = [ {name:'phone', w:1280,h:720}, {name:'tablet',w:1920,h:1080}, {name:'universal',w:2732,h:2732} ];

for (const file of fs.readdirSync(inDir)) {
  if (!file.endsWith('.svg')) continue;
  const base = file.replace(/\.svg$/,'');
  const buf = fs.readFileSync(path.join(inDir, file));
  for (const s of iosSizes) {
    const out = path.join(outDir, `${base}-ios-${s}.png`);
    await sharp(buf).resize({ width: Math.round(s), height: Math.round(s), fit: 'contain', background: {r:255,g:255,b:255,alpha:0} }).png().toFile(out);
  }
  for (const [dpi,px] of Object.entries(androidSizes)) {
    const out = path.join(outDir, `${base}-android-${dpi}.png`);
    await sharp(buf).resize({ width: px, height: px, fit: 'contain', background: {r:255,g:255,b:255,alpha:0} }).png().toFile(out);
  }
  for (const sp of splashSizes) {
    const out = path.join(outDir, `${base}-splash-${sp.name}.png`);
    await sharp(buf).resize({ width: sp.w, height: sp.h, fit: 'contain', background: {r:255,g:255,b:255,alpha:0} }).png().toFile(out);
  }
}

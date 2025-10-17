#!/usr/bin/env node
// Simple brand asset builder: reads ops/brands/brands.example.json and outputs SVG icon/splash per brand.
const fs = require('fs'); const path = require('path');
const brandsPath = process.argv[2] || path.join(__dirname, 'brands.example.json');
const outDir = process.argv[3] || path.join(__dirname, 'out');
const brands = JSON.parse(fs.readFileSync(brandsPath,'utf-8'));
fs.mkdirSync(outDir, { recursive: true });
for (const [host, cfg] of Object.entries(brands)) {
  const name = cfg.name || 'TherapyEngine';
  const primary = cfg.primary || '#111827';
  const accent = cfg.accent || '#60a5fa';
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="100%" height="100%" rx="180" ry="180" fill="${primary}"/><circle cx="512" cy="512" r="240" fill="${accent}"/><text x="50%" y="54%" font-family="Arial" font-size="220" fill="white" text-anchor="middle">${(name[0]||'T')+(name[1]||'E')}</text></svg>`;
  const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732"><rect width="100%" height="100%" fill="${primary}"/><circle cx="1366" cy="1366" r="480" fill="${accent}" opacity="0.2"/><text x="50%" y="50%" font-family="Arial" font-size="240" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${name}</text></svg>`;
  fs.writeFileSync(path.join(outDir, `${host.replace(/[^a-z0-9.-]/gi,'_')}_icon.svg`), icon);
  fs.writeFileSync(path.join(outDir, `${host.replace(/[^a-z0-9.-]/gi,'_')}_splash.svg`), splash);
}
console.log('Brand SVGs exported to', outDir);

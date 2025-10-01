#!/usr/bin/env node
// Build dist for each brand host in brands.json (sets VITE_BRAND_NAME and VITE_BRAND_COLOR).
import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
const brandsPath = process.argv[2] || path.join(process.cwd(), 'brands.example.json');
const brands = JSON.parse(fs.readFileSync(brandsPath,'utf-8'));
const front = path.resolve(process.cwd(), '../../frontend');
async function buildBrand(host, cfg){
  return new Promise((resolve,reject)=>{
    const env = { ...process.env, VITE_BRAND_NAME: cfg.name||'TherapyEngine', VITE_BRAND_COLOR: cfg.primary||'#111827' };
    const p = spawn('npm', ['run','build'], { cwd: front, env, stdio: 'inherit' });
    p.on('exit', (code)=> code===0 ? resolve() : reject(new Error('build failed')));
  });
}
(async()=>{
  for (const [host, cfg] of Object.entries(brands)) {
    console.log('Building brand', host);
    await buildBrand(host, cfg);
    const dist = path.join(front,'dist');
    const out = path.join(process.cwd(), 'builds', host.replace(/[^a-z0-9.-]/gi,'_'));
    fs.rmSync(out, { recursive:true, force: true });
    fs.mkdirSync(out, { recursive: true });
    // copy dist
    const cp = (src,dst)=>{
      const st = fs.statSync(src);
      if (st.isDirectory()) { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) cp(path.join(src,f), path.join(dst,f)); }
      else fs.copyFileSync(src,dst);
    };
    cp(dist, out);
  }
  console.log('Brand builds ready in ops/brands/builds');
})().catch(e=>{ console.error(e); process.exit(1); });

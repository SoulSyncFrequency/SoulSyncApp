const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
(async () => {
  const puppeteer = require('puppeteer');
  const outDir = path.resolve(__dirname, '../../screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  const preview = spawn('npm', ['run', 'preview'], { cwd: path.resolve(__dirname, '../../frontend'), stdio: 'pipe' });
  await new Promise((res) => setTimeout(res, 3000));

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const base = process.env.PREVIEW_URL || 'http://localhost:4173';

  async function capture(name, url, prep) {
    if (prep) await prep();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: true });
  }

  // EN
  await capture('01_en_landing', base + '/');
  await capture('02_en_login', base + '/', async ()=> {
    await page.evaluate(()=>{ localStorage.setItem('lang','en'); });
  });
  await capture('03_en_demo_therapy', base + '/?demo=1');
  // Questionnaire screen (just open and scroll to form area)
  await page.goto(base + '/');
  await page.evaluate(()=>{ localStorage.setItem('lang','en'); });
  await page.waitForTimeout(200);
  await page.evaluate(()=> window.scrollTo(0, document.body.scrollHeight));
  await page.screenshot({ path: path.join(outDir, '04_en_questionnaire.png'), fullPage: true });

  // HR
  await capture('05_hr_landing', base + '/', async ()=> {
    await page.evaluate(()=>{ localStorage.setItem('lang','hr'); });
  });
  await capture('06_hr_demo_therapy', base + '/?demo=1');
  await page.goto(base + '/');
  await page.evaluate(()=>{ localStorage.setItem('lang','hr'); });
  await page.waitForTimeout(200);
  await page.evaluate(()=> window.scrollTo(0, document.body.scrollHeight));
  await page.screenshot({ path: path.join(outDir, '07_hr_questionnaire.png'), fullPage: true });

  await browser.close();
  preview.kill('SIGTERM');
  console.log('Screens saved:', outDir);
})().catch(e => { console.error(e); process.exit(1); });

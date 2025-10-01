(function(){ 
  const $ = s => document.querySelector(s);
  const els = {
    // Light pickers
    l_brand_primary: $('#l_brand_primary'), l_brand_accent: $('#l_brand_accent'),
    l_bg: $('#l_bg'), l_text: $('#l_text'), l_sidebar_bg: $('#l_sidebar_bg'), l_sidebar_text: $('#l_sidebar_text'), l_header_bg: $('#l_header_bg'),
    // Dark pickers
    d_bg: $('#d_bg'), d_text: $('#d_text'), d_sidebar_bg: $('#d_sidebar_bg'), d_sidebar_text: $('#d_sidebar_text'), d_header_bg: $('#d_header_bg'),
    font: $('#font'), logo: $('#logo'), exportBtn: $('#export'), duplicate: $('#duplicate'),
    importBtn: $('#importBtn'), importFile: $('#importFile'), undo: $('#undo'), reset: $('#reset'),
    saved: $('#saved'), previewLogo: $('#previewLogo'), previewLight: $('#previewLight'), previewDark: $('#previewDark'),
    themesList: $('#themesList')
  };

  const VARS_LIGHT = ['--brand-primary','--brand-accent','--bg','--text','--sidebar-bg','--sidebar-text','--header-bg','--brand-font'];
  const VARS_DARK  = ['--bg','--text','--sidebar-bg','--sidebar-text','--header-bg'];

  let baseCss = '', lightVars = {}, darkVars = {}, currentLogo = null;
  let backupLight = null, backupDark = null, backupLogo = null;

  function showSaved(){ els.saved.style.display='inline'; setTimeout(()=> els.saved.style.display='none', 3000); }
  function setThemeAttr(mode){ document.documentElement.setAttribute('data-theme', mode); els.previewLight.classList.toggle('active', mode==='light'); els.previewDark.classList.toggle('active', mode==='dark'); }

  function applyLight(vars){
    const root = document.documentElement;
    Object.entries(vars).forEach(([k,v])=> root.style.setProperty(k, v));
    localStorage.setItem('themeOverridesLight', JSON.stringify(vars));
  }
  function applyDark(vars){
    let style = document.getElementById('darkThemeVars');
    if (!style) { style = document.createElement('style'); style.id='darkThemeVars'; document.head.appendChild(style); }
    const lines = Object.entries(vars).map(([k,v]) => `  ${k}: ${v};`).join('\n');
    style.textContent = `[data-theme='dark'] {\n${lines}\n}`;
    localStorage.setItem('themeOverridesDark', JSON.stringify(vars));
  }

  function readCssVarsFromText(cssText, selector){ 
    const re = selector === ':root' ? /:root\s*\{([\s\S]*?)\}/ : /\[data-theme=['"]dark['"]\]\s*\{([\s\S]*?)\}/;
    const m = cssText.match(re); const out={};
    if (m){ const body = m[1]; const keys = selector===':root' ? VARS_LIGHT : VARS_DARK; keys.forEach(v=>{ const mm = body.match(new RegExp(v.replace(/[-]/g,'[-]') + '\s*:\s*([^;]+);')); if(mm) out[v]=mm[1].trim(); }); }
    return out;
  }

  function loadInitial(){ 
    fetch('/assets/theme.css').then(r=>r.text()).then(css=>{
      baseCss = css;
      const rootVars = readCssVarsFromText(css, ':root');
      const darkBlock = readCssVarsFromText(css, "[data-theme='dark']");
      const savedLight = JSON.parse(localStorage.getItem('themeOverridesLight')||'{}');
      const savedDark = JSON.parse(localStorage.getItem('themeOverridesDark')||'{}');
      lightVars = Object.assign({}, rootVars, savedLight);
      darkVars  = Object.assign({}, darkBlock, savedDark);
      // apply
      applyLight(lightVars); applyDark(darkVars);
      // init inputs
      els.l_brand_primary.value = lightVars['--brand-primary'] || '#6a4bff';
      els.l_brand_accent.value  = lightVars['--brand-accent']  || '#ff4bd6';
      els.l_bg.value            = lightVars['--bg']            || '#ffffff';
      els.l_text.value          = lightVars['--text']          || '#222222';
      els.l_sidebar_bg.value    = lightVars['--sidebar-bg']    || '#f7f7f7';
      els.l_sidebar_text.value  = lightVars['--sidebar-text']  || '#333333';
      els.l_header_bg.value     = lightVars['--header-bg']     || '#ffffff';
      els.font.value            = lightVars['--brand-font']    || "'Inter', sans-serif";
      els.d_bg.value            = darkVars['--bg']             || '#1e1e1e';
      els.d_text.value          = darkVars['--text']           || '#dddddd';
      els.d_sidebar_bg.value    = darkVars['--sidebar-bg']     || '#2a2a2a';
      els.d_sidebar_text.value  = darkVars['--sidebar-text']   || '#eeeeee';
      els.d_header_bg.value     = darkVars['--header-bg']      || '#2c2c2c';
      const custom = localStorage.getItem('customLogo'); if (custom) { currentLogo = custom; els.previewLogo.src = custom; }
      renderThemesList();
    });
  }

  function bind(){
    // Light
    [['l_brand_primary','--brand-primary'],['l_brand_accent','--brand-accent'],['l_bg','--bg'],['l_text','--text'],['l_sidebar_bg','--sidebar-bg'],['l_sidebar_text','--sidebar-text'],['l_header_bg','--header-bg']]
    .forEach(([id,css])=> els[id].addEventListener('input', ()=>{ lightVars[css]=els[id].value; applyLight(lightVars); showSaved(); }));
    // Dark
    [['d_bg','--bg'],['d_text','--text'],['d_sidebar_bg','--sidebar-bg'],['d_sidebar_text','--sidebar-text'],['d_header_bg','--header-bg']]
    .forEach(([id,css])=> els[id].addEventListener('input', ()=>{ darkVars[css]=els[id].value; applyDark(darkVars); showSaved(); }));
    // Font
    els.font.addEventListener('change', ()=>{ lightVars['--brand-font']=els.font.value; applyLight(lightVars); showSaved(); });
    // Logo
    els.logo.addEventListener('change', e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const reader=new FileReader(); reader.onload=()=>{ currentLogo=reader.result; localStorage.setItem('customLogo', currentLogo); $('#previewLogo').src=currentLogo; showSaved(); }; reader.readAsDataURL(f); });
    // Export logo
    $('#exportLogo').addEventListener('click', ()=>{ if(!currentLogo){ alert('No custom logo set.'); return; } const a=document.createElement('a'); a.href=currentLogo; a.download='logo.png'; a.click(); showSaved(); });
    // Preview toggle also switches site theme
    els.previewLight.addEventListener('click', ()=> setThemeAttr('light'));
    els.previewDark.addEventListener('click', ()=> setThemeAttr('dark'));
    // Export theme.css
    els.exportBtn.addEventListener('click', ()=> exportTheme());
    // Duplicate
    els.duplicate.addEventListener('click', ()=> exportTheme(true));
    // Import
    els.importBtn.addEventListener('click', ()=> els.importFile.click());
    els.importFile.addEventListener('change', onImportFile);
    // Undo
    els.undo.addEventListener('click', undoImport);
    // Reset
    els.reset.addEventListener('click', resetAll);
  }

  function buildCss(light, dark){
    const date = new Date().toISOString().slice(0,10);
    const rootLines = VARS_LIGHT.map(k => `  ${k}: ${light[k] || ''};`).join('\n');
    const darkLines = VARS_DARK.map(k => `  ${k}: ${dark[k] || ''};`).join('\n');
    return `/* exported on ${date} */\n:root {\n${rootLines}\n}\n\n[data-theme='dark'] {\n${darkLines}\n}\n`;
  }

  function download(filename, content){
    const blob = new Blob([content], {type:'text/css'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  }

  function canvasThumb(light, dark, logo){
    const c = document.createElement('canvas'); c.width=144; c.height=84; const ctx = c.getContext('2d');
    ctx.fillStyle = light['--bg'] || '#fff'; ctx.fillRect(0,0,144,84);
    ctx.fillStyle = light['--header-bg'] || '#fff'; ctx.fillRect(0,0,144,18);
    ctx.fillStyle = light['--sidebar-bg'] || '#f7f7f7'; ctx.fillRect(0,18,36,66);
    ctx.fillStyle = light['--bg'] || '#fff'; ctx.fillRect(36,18,108,66);
    ctx.fillStyle = light['--brand-primary'] || '#6a4bff'; ctx.beginPath(); ctx.arc(12,9,5,0,6.28); ctx.fill();
    return c.toDataURL('image/png');
  }

  function getPresets(){ try { return JSON.parse(localStorage.getItem('themePresets')||'[]'); } catch(e) { return []; } }
  function setPresets(list){ localStorage.setItem('themePresets', JSON.stringify(list)); }

  function savePreset(name, css){
    const list = getPresets();
    const date = new Date().toISOString().slice(0,10);
    const thumb = canvasThumb(lightVars, darkVars, currentLogo);
    const preset = { name, date, light: lightVars, dark: darkVars, logo: currentLogo, thumb };
    list.push(preset); setPresets(list); renderThemesList();
  }

  function renderThemesList(){
    const list = getPresets();
    els.themesList.innerHTML = '';
    if (!list.length) { els.themesList.innerHTML = '<div class="muted">No saved themes yet.</div>'; return; }
    list.forEach((p, idx)=>{
      const row = document.createElement('div'); row.className='theme-item';
      const img = document.createElement('img'); img.src = p.thumb || '';
      const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = `<strong>${p.name}</strong><div class="muted">saved on ${p.date}</div>`;
      const btnPrev = document.createElement('button'); btnPrev.textContent='👁️ Preview';
      const btnSet = document.createElement('button'); btnSet.textContent='▶️ Set as Active';
      const btnDel = document.createElement('button'); btnDel.textContent='🗑️ Delete';
      btnPrev.addEventListener('click', ()=> applyPreset(p, false));
      btnSet.addEventListener('click', ()=> setActivePreset(p));
      btnDel.addEventListener('click', ()=> { const arr = getPresets(); arr.splice(idx,1); setPresets(arr); renderThemesList(); });
      row.appendChild(img); row.appendChild(meta); row.appendChild(btnPrev); row.appendChild(btnSet); row.appendChild(btnDel);
      els.themesList.appendChild(row);
    });
  }

  function applyPreset(preset, persistIt){
    lightVars = Object.assign({}, preset.light); darkVars = Object.assign({}, preset.dark); currentLogo = preset.logo || currentLogo;
    applyLight(lightVars); applyDark(darkVars);
    if (currentLogo) { localStorage.setItem('customLogo', currentLogo); $('#previewLogo').src=currentLogo; }
    // update pickers
    els.l_brand_primary.value = lightVars['--brand-primary'] || '#6a4bff';
    els.l_brand_accent.value  = lightVars['--brand-accent']  || '#ff4bd6';
    els.l_bg.value            = lightVars['--bg'] || '#ffffff';
    els.l_text.value          = lightVars['--text'] || '#222222';
    els.l_sidebar_bg.value    = lightVars['--sidebar-bg'] || '#f7f7f7';
    els.l_sidebar_text.value  = lightVars['--sidebar-text'] || '#333333';
    els.l_header_bg.value     = lightVars['--header-bg'] || '#ffffff';
    els.font.value            = lightVars['--brand-font'] || "'Inter', sans-serif";
    els.d_bg.value            = darkVars['--bg'] || '#1e1e1e';
    els.d_text.value          = darkVars['--text'] || '#dddddd';
    els.d_sidebar_bg.value    = darkVars['--sidebar-bg'] || '#2a2a2a';
    els.d_sidebar_text.value  = darkVars['--sidebar-text'] || '#eeeeee';
    els.d_header_bg.value     = darkVars['--header-bg'] || '#2c2c2c';
    if (persistIt){ localStorage.setItem('themeOverridesLight', JSON.stringify(lightVars)); localStorage.setItem('themeOverridesDark', JSON.stringify(darkVars)); showSaved(); }
  }

  async function setActivePreset(preset){
    applyPreset(preset, true);
    try {
      const repo = localStorage.getItem('gh_repo'); // e.g., "user/SoulSync"
      const token = localStorage.getItem('gh_token'); // PAT with repo scope
      if (!repo || !token) return; // local only
      const css = buildCss(lightVars, darkVars);
      const content = btoa(unescape(encodeURIComponent(css)));
      const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/docs/assets/theme.css`, {
        headers: { Authorization: `token ${token}`, 'Accept': 'application/vnd.github+json' }
      });
      const j = await getRes.json();
      const sha = j.sha;
      const body = {
        message: 'chore(theme): set active preset via Theme Editor',
        content,
        sha,
        branch: 'main'
      };
      await fetch(`https://api.github.com/repos/${repo}/contents/docs/assets/theme.css`, {
        method: 'PUT',
        headers: { Authorization: `token ${token}`, 'Accept': 'application/vnd.github+json' },
        body: JSON.stringify(body)
      });
      alert('Theme committed to GitHub. Pages će se uskoro redeployati.');
    } catch(e) {
      console.warn('GitHub commit failed or skipped:', e);
    }
  }

  function onImportFile(e){
    const f = e.target.files && e.target.files[0]; if(!f) return;
    backupLight = JSON.stringify(lightVars); backupDark = JSON.stringify(darkVars); backupLogo = localStorage.getItem('customLogo') || null;
    localStorage.setItem('backupThemeLight', backupLight); localStorage.setItem('backupThemeDark', backupDark); if (backupLogo) localStorage.setItem('backupLogo', backupLogo);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      const lv = readCssVarsFromText(text, ':root');
      const dv = readCssVarsFromText(text, "[data-theme='dark']");
      lightVars = Object.assign({}, lightVars, lv);
      darkVars  = Object.assign({}, darkVars, dv);
      applyLight(lightVars); applyDark(darkVars);
      localStorage.setItem('themeOverridesLight', JSON.stringify(lightVars));
      localStorage.setItem('themeOverridesDark', JSON.stringify(darkVars));
      showSaved();
      renderThemesList();
    };
    reader.readAsText(f);
  }

  function undoImport(){
    try {
      const l = localStorage.getItem('backupThemeLight');
      const d = localStorage.getItem('backupThemeDark');
      const logo = localStorage.getItem('backupLogo');
      if (l) lightVars = JSON.parse(l);
      if (d) darkVars = JSON.parse(d);
      if (logo) { currentLogo = logo; localStorage.setItem('customLogo', logo); $('#previewLogo').src = logo; }
      applyLight(lightVars); applyDark(darkVars);
      localStorage.setItem('themeOverridesLight', JSON.stringify(lightVars));
      localStorage.setItem('themeOverridesDark', JSON.stringify(darkVars));
      showSaved();
    } catch(e) { alert('No backup available.'); }
  }

  function resetAll(){
    if (!confirm('Reset to defaults? This clears all local overrides and logo (localStorage).')) return;
    localStorage.removeItem('themeOverridesLight'); localStorage.removeItem('themeOverridesDark'); localStorage.removeItem('customLogo');
    const rootVars = readCssVarsFromText(baseCss, ':root');
    const darkBlock = readCssVarsFromText(baseCss, "[data-theme='dark']");
    lightVars = Object.assign({}, rootVars);
    darkVars  = Object.assign({}, darkBlock);
    applyLight(lightVars); applyDark(darkVars);
    $('#previewLogo').src = '/assets/logo.png';
    showSaved(); renderThemesList();
  }

  function exportTheme(duplicateOnly=false){
    const date = new Date().toISOString().slice(0,10);
    const css = buildCss(lightVars, darkVars);
    const name = `theme_${date}.css`;
    const blob = new Blob([css], {type:'text/css'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    savePreset(name, css);
    if (!duplicateOnly) showSaved();
  }

  function renderThemesList(){
    const list = getPresets();
    els.themesList.innerHTML = '';
    if (!list.length) { els.themesList.innerHTML = '<div class="muted">No saved themes yet.</div>'; return; }
    list.forEach((p, idx)=>{
      const row = document.createElement('div'); row.className='theme-item';
      const img = document.createElement('img'); img.src = p.thumb || '';
      const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = `<strong>${p.name}</strong><div class="muted">saved on ${p.date}</div>`;
      const btnPrev = document.createElement('button'); btnPrev.textContent='👁️ Preview';
      const btnSet = document.createElement('button'); btnSet.textContent='▶️ Set as Active';
      const btnDel = document.createElement('button'); btnDel.textContent='🗑️ Delete';
      btnPrev.addEventListener('click', ()=> applyPreset(p, false));
      btnSet.addEventListener('click', ()=> setActivePreset(p));
      btnDel.addEventListener('click', ()=> { const arr = getPresets(); arr.splice(idx,1); setPresets(arr); renderThemesList(); });
      row.appendChild(img); row.appendChild(meta); row.appendChild(btnPrev); row.appendChild(btnSet); row.appendChild(btnDel);
      els.themesList.appendChild(row);
    });
  }

  function getPresets(){ try { return JSON.parse(localStorage.getItem('themePresets')||'[]'); } catch(e) { return []; } }
  function setPresets(list){ localStorage.setItem('themePresets', JSON.stringify(list)); }

  function savePreset(name, css){
    const list = getPresets();
    const date = new Date().toISOString().slice(0,10);
    const thumb = (function(){
      const c = document.createElement('canvas'); c.width=144; c.height=84; const ctx = c.getContext('2d');
      ctx.fillStyle = lightVars['--bg'] || '#fff'; ctx.fillRect(0,0,144,84);
      ctx.fillStyle = lightVars['--header-bg'] || '#fff'; ctx.fillRect(0,0,144,18);
      ctx.fillStyle = lightVars['--sidebar-bg'] || '#f7f7f7'; ctx.fillRect(0,18,36,66);
      ctx.fillStyle = lightVars['--bg'] || '#fff'; ctx.fillRect(36,18,108,66);
      ctx.fillStyle = lightVars['--brand-primary'] || '#6a4bff'; ctx.beginPath(); ctx.arc(12,9,5,0,6.28); ctx.fill();
      return c.toDataURL('image/png');
    })();
    const preset = { name, date, light: lightVars, dark: darkVars, logo: currentLogo, thumb };
    list.push(preset); setPresets(list); renderThemesList();
  }

  function init(){
    setThemeAttr('light');
    loadInitial();
    bind();
  }
  init();
})();
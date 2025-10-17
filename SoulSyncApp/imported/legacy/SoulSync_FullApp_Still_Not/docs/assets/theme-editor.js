(function(){
  const q = s => document.querySelector(s);
  const els = {
    brand_primary: q('#brand_primary'), brand_accent: q('#brand_accent'),
    bg: q('#bg'), text: q('#text'), sidebar_bg: q('#sidebar_bg'),
    sidebar_text: q('#sidebar_text'), header_bg: q('#header_bg'),
    font: q('#font'), logo: q('#logo'), exportBtn: q('#export'),
    importBtn: q('#importBtn'), importFile: q('#importFile'),
    undo: q('#undo'), reset: q('#reset'), saved: q('#saved'),
    previewLogo: q('#previewLogo'), exportLogo: q('#exportLogo')
  };
  let originalCss = '', originalVars = {}, currentVars = {}, backupTheme = null, backupLogo = null;
  const VAR_MAP = { brand_primary:'--brand-primary', brand_accent:'--brand-accent', bg:'--bg', text:'--text', sidebar_bg:'--sidebar-bg', sidebar_text:'--sidebar-text', header_bg:'--header-bg', font:'--brand-font' };

  function parseVarsFromCss(cssText) {
    const rootMatch = cssText.match(/:root\s*\{([\s\S]*?)\}/); const out = {};
    if (rootMatch) {
      const body = rootMatch[1];
      Object.values(VAR_MAP).forEach(v => { const m = body.match(new RegExp(v.replace(/[-]/g,'[-]') + '\\s*:\\s*([^;]+);')); if (m) out[v] = m[1].trim(); });
    } return out;
  }
  function applyVars(vars) {
    const root = document.documentElement;
    Object.entries(vars).forEach(([k,v]) => root.style.setProperty(k, v));
    const map = Object.entries(VAR_MAP).reduce((a,[key,css])=>(a[css]=key,a),{});
    Object.entries(vars).forEach(([cssVar,val])=>{ const id=map[cssVar]; if(!id) return; if(id==='font') els[id].value = val; else if (els[id]) { try { els[id].value = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val) ? val : els[id].value; } catch(e){} } });
  }
  function showSaved(){ els.saved.style.display='inline'; setTimeout(()=> els.saved.style.display='none',3000); }
  function loadLocalOverrides(){ try { const raw = localStorage.getItem('themeOverrides'); return raw?JSON.parse(raw):{}; } catch(e){ return {}; } }
  function saveLocalOverrides(vars){ localStorage.setItem('themeOverrides', JSON.stringify(vars)); }
  function updatePreviewLogoFromStorage(){ const custom = localStorage.getItem('customLogo'); if(custom) els.previewLogo.src = custom; }

  fetch('/assets/theme.css').then(r=>r.text()).then(css=>{
    originalCss = css; originalVars = parseVarsFromCss(css);
    currentVars = Object.assign({}, originalVars, loadLocalOverrides());
    applyVars(currentVars);
    els.brand_primary.value = currentVars['--brand-primary'] || '#6a4bff';
    els.brand_accent.value = currentVars['--brand-accent'] || '#ff4bd6';
    els.bg.value = currentVars['--bg'] || '#ffffff';
    els.text.value = currentVars['--text'] || '#222222';
    els.sidebar_bg.value = currentVars['--sidebar-bg'] || '#f7f7f7';
    els.sidebar_text.value = currentVars['--sidebar-text'] || '#333333';
    els.header_bg.value = currentVars['--header-bg'] || '#ffffff';
    els.font.value = currentVars['--brand-font'] || "'Inter', sans-serif";
    updatePreviewLogoFromStorage();
  });

  Object.entries(VAR_MAP).forEach(([id,cssVar])=>{
    if (!els[id]) return;
    els[id].addEventListener('input', ()=>{ const val = els[id].value; currentVars[cssVar]=val; document.documentElement.style.setProperty(cssVar,val); saveLocalOverrides(currentVars); });
  });

  els.logo.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{ const dataUrl = reader.result; localStorage.setItem('customLogo', dataUrl); els.previewLogo.src = dataUrl; showSaved(); };
    reader.readAsDataURL(f);
  });

  els.exportLogo.addEventListener('click', ()=>{ const dataUrl = localStorage.getItem('customLogo'); if(!dataUrl){ alert('No custom logo set.'); return; } const a=document.createElement('a'); a.href=dataUrl; a.download='logo.png'; a.click(); showSaved(); });

  els.exportBtn.addEventListener('click', ()=>{
    const lines=[]; Object.values(VAR_MAP).forEach(cssVar => { if(cssVar==='--brand-font') lines.push(`  ${cssVar}: ${currentVars[cssVar] || "'Inter', sans-serif"};`); else lines.push(`  ${cssVar}: ${currentVars[cssVar] || ''};`); });
    const rootBlock = `:root {\n${lines.join('\n')}\n}\n\n`; const darkMatch = originalCss.match(/\[data-theme=['"]dark['"]\][\s\S]*/); const rest = darkMatch ? darkMatch[0] : ""; const out = rootBlock + rest;
    const blob = new Blob([out], {type:'text/css'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='theme.css'; a.click(); showSaved();
  });

  els.importBtn.addEventListener('click', ()=> els.importFile.click());
  els.importFile.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    backupTheme = JSON.stringify(currentVars); backupLogo = localStorage.getItem('customLogo') || null;
    localStorage.setItem('backupTheme', backupTheme); if(backupLogo) localStorage.setItem('backupLogo', backupLogo);
    const reader = new FileReader();
    reader.onload = ()=>{ const text = reader.result; const vars = (function(css){ const m = css.match(/:root\s*\{([\s\S]*?)\}/); const out={}; if(m){ const b=m[1]; Object.values(VAR_MAP).forEach(v=>{ const mm = b.match(new RegExp(v.replace(/[-]/g,'[-]') + '\\s*:\\s*([^;]+);')); if(mm) out[v]=mm[1].trim(); }); } return out; })(text);
      Object.assign(currentVars, vars); applyVars(currentVars); saveLocalOverrides(currentVars); showSaved(); };
    reader.readAsText(f);
  });

  els.undo.addEventListener('click', ()=>{
    try{ const t = localStorage.getItem('backupTheme'); if(t){ currentVars = JSON.parse(t); applyVars(currentVars); saveLocalOverrides(currentVars); } const l=localStorage.getItem('backupLogo'); if(l){ localStorage.setItem('customLogo', l); els.previewLogo.src = l; } showSaved(); } catch(e){ alert('No backup available.'); }
  });

  els.reset.addEventListener('click', ()=>{
    if(!confirm('Reset to defaults? This clears all local overrides and logo.')) return;
    localStorage.removeItem('themeOverrides'); localStorage.removeItem('customLogo');
    currentVars = Object.assign({}, originalVars); applyVars(currentVars); els.previewLogo.src = '/assets/logo.png'; showSaved();
  });
})();
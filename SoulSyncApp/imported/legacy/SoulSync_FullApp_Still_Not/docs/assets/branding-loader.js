// Apply theme overrides (light + dark) and custom logo from localStorage on every page
(function(){ 
  const root = document.documentElement;
  try {
    const lightRaw = localStorage.getItem('themeOverridesLight');
    if (lightRaw) {
      const vars = JSON.parse(lightRaw);
      Object.entries(vars).forEach(([k,v]) => root.style.setProperty(k, v));
    }
    const darkRaw = localStorage.getItem('themeOverridesDark');
    if (darkRaw) {
      const vars = JSON.parse(darkRaw);
      let style = document.getElementById('darkThemeVars');
      if (!style) { style = document.createElement('style'); style.id='darkThemeVars'; document.head.appendChild(style); }
      const lines = Object.entries(vars).map(([k,v]) => `  ${k}: ${v};`).join('\n');
      style.textContent = `[data-theme='dark'] {\n${lines}\n}`;
    }
  } catch(e){}

  const customLogo = localStorage.getItem('customLogo');
  if (customLogo) {
    document.querySelectorAll('img.logo, .sidebar-footer img').forEach(img => { img.src = customLogo; });
  }

  const params = new URLSearchParams(location.search);
  if (params.get('admin') === '1') {
    const btn = document.getElementById('adminBtn');
    if (btn) btn.style.display = 'inline-block';
  }
})();
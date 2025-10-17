(function() {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved) root.setAttribute('data-theme', saved);
  else if (prefersDark) root.setAttribute('data-theme', 'dark');
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', current);
      localStorage.setItem('theme', current);
      btn.textContent = current === 'dark' ? '☀️' : '🌙';
    });
    btn.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  }
})();

const pages = Array.from(document.querySelectorAll('#sidebar-list a')).map(a => ({title: a.textContent, url: a.href}));
const idx = lunr(function () { this.ref('url'); this.field('title'); pages.forEach(p => this.add(p)); });
document.getElementById('searchBox').addEventListener('input', e => {
  const q = e.target.value;
  const results = q ? idx.search(q).map(r => r.ref) : pages.map(p=>p.url);
  document.querySelectorAll('#sidebar-list a').forEach(a => { a.parentElement.style.display = results.includes(a.href) ? '' : 'none'; });
});

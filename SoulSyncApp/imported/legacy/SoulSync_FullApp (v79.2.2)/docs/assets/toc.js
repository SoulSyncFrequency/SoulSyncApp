document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar-list');
  const sections = Array.from(document.querySelectorAll('main h2, main h3'));
  const openState = JSON.parse(localStorage.getItem('tocOpen') || '[]');
  let currentH2 = null;
  sections.forEach(sec => {
    const id = sec.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-');
    sec.id = id;
    if (sec.tagName === 'H2') {
      const li = document.createElement('li'); li.className='h2';
      const a = document.createElement('a'); a.href = '#' + id; a.textContent = sec.textContent;
      const toggle = document.createElement('span'); toggle.textContent = openState.includes(id) ? '▼' : '▸'; toggle.className='toggle';
      toggle.addEventListener('click', e => { e.stopPropagation(); const open = toggle.textContent === '▸'; toggle.textContent = open ? '▼':'▸'; li.querySelectorAll('.h3').forEach(x => x.style.display = open ? 'list-item':'none'); const ns=openState.filter(x=>x!==id); if(open) ns.push(id); localStorage.setItem('tocOpen', JSON.stringify(ns)); });
      li.appendChild(toggle); li.appendChild(a); sidebar.appendChild(li); currentH2 = li;
    } else if (sec.tagName === 'H3' && currentH2) {
      const li = document.createElement('li'); li.className='h3';
      const a = document.createElement('a'); a.href = '#' + id; a.textContent = sec.textContent;
      li.appendChild(a);
      if (!openState.includes(currentH2.querySelector('a').hash.slice(1))) li.style.display='none';
      currentH2.appendChild(li);
    }
  });
  const hash = location.hash.slice(1);
  if (hash) {
    const active = sections.find(s => s.id === hash);
    if (active) {
      const parentH2 = active.tagName === 'H2' ? active : active.closest('h2');
      if (parentH2) {
        const pid = parentH2.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-');
        const li = Array.from(sidebar.querySelectorAll('.h2')).find(l => l.querySelector('a').hash === '#' + pid);
        if (li) { li.querySelector('.toggle').textContent = '▼'; li.querySelectorAll('.h3').forEach(x => x.style.display='list-item'); }
      }
    }
  }
});

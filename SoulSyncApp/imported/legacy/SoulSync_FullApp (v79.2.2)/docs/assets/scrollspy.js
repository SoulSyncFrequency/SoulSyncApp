document.addEventListener('DOMContentLoaded', () => {
  const sections = Array.from(document.querySelectorAll('main h2, main h3'));
  const links = Array.from(document.querySelectorAll('#sidebar-list a'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        links.forEach(a => a.classList.toggle('active', a.hash === '#' + id));
        history.replaceState(null, '', '#' + id);
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  sections.forEach(s => observer.observe(s));
  links.forEach(a => a.addEventListener('click', e => { e.preventDefault(); const t=document.querySelector(a.hash); if(t) t.scrollIntoView({behavior:'smooth'}); }));
});

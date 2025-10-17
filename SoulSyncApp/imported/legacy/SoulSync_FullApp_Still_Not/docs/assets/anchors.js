document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('main h2, main h3').forEach(h => {
    const id = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-');
    h.id = id;
  });
});

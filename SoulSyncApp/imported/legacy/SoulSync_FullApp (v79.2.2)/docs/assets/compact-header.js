let lastScroll = 0;
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  const current = window.scrollY;
  if (current > 50) header.classList.add('compact'); else header.classList.remove('compact');
  if (current > lastScroll && current > 100) header.classList.add('hide'); else header.classList.remove('hide');
  lastScroll = current;
});

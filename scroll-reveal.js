(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const items = document.querySelectorAll(
    '.lower-strip, .committee-briefing, .country-card, .mun-toolkit, .toolkit-grid article, .dashboard-bottom, .chair-dashboard-grid > article'
  );
  if (!items.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

  items.forEach((item, index) => {
    item.classList.add('scroll-reveal');
    if (item.matches('.toolkit-grid article, .chair-dashboard-grid > article')) {
      item.style.setProperty('--reveal-delay', `${(index % 3) * 70}ms`);
    }
    observer.observe(item);
  });
})();

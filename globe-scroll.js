(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const globe = document.querySelector('.globe-spin-button');
  if (!globe || reducedMotion.matches) return;

  let scheduled = false;
  const updateRotation = () => {
    const degrees = Math.min(42, Math.max(0, window.scrollY * 0.08));
    globe.style.setProperty('--globe-scroll-rotation', `${-5 + degrees}deg`);
    scheduled = false;
  };

  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateRotation);
  }, { passive: true });

  updateRotation();
})();

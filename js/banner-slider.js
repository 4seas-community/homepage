(() => {
  const root = document.querySelector('.swiper.banner_slider');
  if (!root || typeof Swiper === 'undefined') return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = root.querySelector('.banner-slider-toggle');
  let paused = motion.matches;
  const slider = new Swiper(root, {
    initialSlide: 0,
    slidesPerView: 1,
    loop: true,
    speed: motion.matches ? 0 : 650,
    autoplay: { delay: 7000, disableOnInteraction: false },
    pagination: { el: root.querySelector('.banner-slider-pagination'), clickable: true },
    a11y: { enabled: true, paginationBulletMessage: 'Show poster {{index}}' }
  });

  const updatePlayback = () => {
    const interacting = root.matches(':hover') || root.contains(document.activeElement);
    if (paused || document.hidden || interacting) slider.autoplay.stop();
    else slider.autoplay.start();
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    toggle.setAttribute('aria-pressed', String(paused));
  };
  toggle.addEventListener('click', () => { paused = !paused; updatePlayback(); });
  root.addEventListener('mouseenter', updatePlayback);
  root.addEventListener('mouseleave', updatePlayback);
  root.addEventListener('focusin', updatePlayback);
  root.addEventListener('focusout', () => setTimeout(updatePlayback, 0));
  document.addEventListener('visibilitychange', updatePlayback);
  motion.addEventListener('change', () => {
    paused = motion.matches;
    slider.params.speed = motion.matches ? 0 : 650;
    updatePlayback();
  });
  updatePlayback();
})();

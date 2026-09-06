(() => {
  const root = document.querySelector('.swiper.banner_slider');
  if (!root || typeof Swiper === 'undefined') return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Touch browsers can leave :hover stuck on a tapped element, which would pause
  // the carousel forever. Only honour hover where the pointer can actually leave.
  const canHover = window.matchMedia('(hover: hover)').matches;
  const toggle = root.querySelector('.banner-slider-toggle');
  let paused = motion.matches;
  let hovering = false;
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
    // The toggle lives inside the carousel, so focusing it must not count as
    // interaction; otherwise pressing Play could never restart the rotation.
    const focused = root.contains(document.activeElement) && document.activeElement !== toggle;
    if (paused || document.hidden || hovering || focused) slider.autoplay.stop();
    else slider.autoplay.start();
    if (!toggle) return;
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
  };

  if (toggle) {
    toggle.addEventListener('click', () => { paused = !paused; updatePlayback(); });
  }
  if (canHover) {
    root.addEventListener('mouseenter', () => { hovering = true; updatePlayback(); });
    root.addEventListener('mouseleave', () => { hovering = false; updatePlayback(); });
  }
  root.addEventListener('focusin', updatePlayback);
  root.addEventListener('focusout', () => setTimeout(updatePlayback, 0));
  document.addEventListener('visibilitychange', updatePlayback);

  const onMotionChange = () => {
    paused = motion.matches;
    slider.params.speed = motion.matches ? 0 : 650;
    updatePlayback();
  };
  // Safari below 14 only implements the deprecated MediaQueryList.addListener.
  if (typeof motion.addEventListener === 'function') motion.addEventListener('change', onMotionChange);
  else if (typeof motion.addListener === 'function') motion.addListener(onMotionChange);

  updatePlayback();
})();

// Generated from @4seas/site-chrome 1.1.0. Do not edit.
(() => {
// Used unchanged by React and the generated static script.
function mountHeader(root) {
  const button = root.querySelector('.fs-menu');
  const nav = root.querySelector('.fs-navigation');
  const language = root.querySelector('.fs-language');
  if (!button || !nav) return () => {};
  const document = root.ownerDocument;
  const view = document.defaultView;
  const desktop = view.matchMedia('(min-width: 901px)');
  const close = () => { button.setAttribute('aria-expanded', 'false'); root.removeAttribute('data-menu-open'); };
  const toggle = () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    root.toggleAttribute('data-menu-open', open);
    if (open && language) language.open = false;
  };
  const escape = event => {
    if (event.key !== 'Escape') return;
    if (button.getAttribute('aria-expanded') === 'true') { close(); button.focus(); }
    if (language?.open) { language.open = false; language.querySelector('summary')?.focus(); }
  };
  const navigate = event => { if (event.target.closest('a')) close(); };
  const outside = event => { if (!root.contains(event.target)) { close(); if (language) language.open = false; } };
  const resize = () => { if (desktop.matches) close(); };
  button.addEventListener('click', toggle);
  nav.addEventListener('click', navigate);
  document.addEventListener('keydown', escape);
  document.addEventListener('click', outside);
  desktop.addEventListener('change', resize);
  root.setAttribute('data-chrome-ready', '');
  return () => {
    button.removeEventListener('click', toggle);
    nav.removeEventListener('click', navigate);
    document.removeEventListener('keydown', escape);
    document.removeEventListener('click', outside);
    desktop.removeEventListener('change', resize);
    root.removeAttribute('data-chrome-ready');
    close();
  };
}

 document.querySelectorAll('.fs-header').forEach(mountHeader);
})();

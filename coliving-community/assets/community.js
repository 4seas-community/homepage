(() => {
  const languages = ['en', 'zh', 'th'];
  const base = '/coliving-community/';
  const current = location.pathname.match(/^\/coliving-community\/(en|zh|th)\//)?.[1] || 'en';
  const readPreference = () => { try { return localStorage.getItem('4seas-language'); } catch { return null; } };
  const savePreference = lang => { try { localStorage.setItem('4seas-language', lang); } catch {} };
  if (document.body.dataset.colivingEntry === 'true') {
    const saved = readPreference();
    if (languages.includes(saved) && saved !== current) {
      location.replace(base + saved + '/' + location.search + location.hash);
      return;
    }
  } else savePreference(current);
  document.querySelectorAll('[data-language]').forEach(link => {
    const lang = link.dataset.language;
    if (!languages.includes(lang)) return;
    link.href = base + lang + '/' + location.search + location.hash;
    link.addEventListener('click', () => savePreference(lang));
  });
  // Keep the selected section when switching language after using page navigation.
  window.addEventListener('hashchange', () => {
    document.querySelectorAll('[data-language]').forEach(link => {
      if (languages.includes(link.dataset.language)) link.href = base + link.dataset.language + '/' + location.search + location.hash;
    });
  });
  const menu = document.querySelector('.menu');
  const links = document.querySelector('.navlinks');
  if (!menu || !links) return;
  const closeMenu = () => { menu.setAttribute('aria-expanded', 'false'); links.classList.remove('open'); };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    links.classList.toggle('open', open);
  });
  links.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
})();

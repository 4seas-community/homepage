// Generated from @4seas/site-chrome 1.2.0. Do not edit.
(() => {
const COPY = {"en":{"menu":"Menu","navigation":"4Seas navigation","language":"Choose language","home":"4Seas home"},"zh":{"menu":"菜单","navigation":"4Seas 主导航","language":"选择语言","home":"4Seas 首页"},"th":{"menu":"เมนู","navigation":"เมนูหลัก 4Seas","language":"เลือกภาษา","home":"หน้าหลัก 4Seas"}};
const LANGUAGES = [{"code":"en","label":"EN"},{"code":"zh","label":"中文"},{"code":"th","label":"ไทย"}];
const queryLanguage = function queryLanguage(search = '', fallback = 'en') {
  const value = new URLSearchParams(search).get('lang');
  return ['en', 'zh', 'th'].includes(value) ? value : fallback;
};
const queryLanguages = function queryLanguages(pathname = '/', search = '', hash = '') {
  return LANGUAGES.map(item => {
    const query = new URLSearchParams(search);
    query.set('lang', item.code);
    return { ...item, href: pathname + '?' + query.toString() + hash };
  });
};
const notFoundLanguage = function notFoundLanguage(pathname = '', basePath) {
  const path = pathname.split(/[?#]/, 1)[0];
  let parts = path.split('/').filter(Boolean);
  if (basePath === undefined) {
    if (['longevity', 'coliving-community', 'event', 'residency', 'coliving'].includes(parts[0])) parts = parts.slice(1);
  } else if (basePath) {
    const prefix = basePath.split('/').filter(Boolean);
    if (prefix.every((part, index) => parts[index] === part)) parts = parts.slice(prefix.length);
  }
  return parts[0] === 'zh' || parts[0] === 'zh-CN' ? 'zh' : parts[0] === 'th' ? 'th' : 'en';
};
function mountQueryLanguage(root, helpers) {
  if (!root.hasAttribute('data-query-language')) return;
  const { COPY, queryLanguage, queryLanguages, notFoundLanguage } = helpers;
  const document = root.ownerDocument;
  const { pathname, search, hash } = document.defaultView.location;
  const locale = queryLanguage(search, notFoundLanguage(pathname));
  const copy = COPY[locale];
  root.lang = locale === 'zh' ? 'zh-CN' : locale;
  root.querySelector('.fs-language-label').textContent = queryLanguages().find(item => item.code === locale).label;
  root.querySelector('.fs-language summary').setAttribute('aria-label', copy.language);
  root.querySelector('.fs-navigation').setAttribute('aria-label', copy.navigation);
  root.querySelector('.fs-brand').setAttribute('aria-label', copy.home);
  root.querySelector('.fs-menu').textContent = copy.menu;
  document.querySelector('.fs-footer-brand')?.setAttribute('aria-label', copy.home);
  const links = queryLanguages(pathname, search, hash);
  root.querySelectorAll('[data-language]').forEach(link => {
    const item = links.find(item => item.code === link.dataset.language);
    link.setAttribute('href', item.href);
    if (item.code === locale) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  root.querySelectorAll('.fs-navigation a').forEach(link => {
    const url = new URL(link.href);
    if (/^\/(longevity|coliving-community)\//.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/(?:en|zh|th)\/$/, '/') + locale + '/';
      link.href = url.href;
    }
  });
}

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

 document.querySelectorAll('.fs-header').forEach(root => { mountQueryLanguage(root, { COPY, queryLanguage, queryLanguages, notFoundLanguage }); mountHeader(root); });
})();

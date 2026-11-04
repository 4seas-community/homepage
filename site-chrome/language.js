export const LANGUAGES = Object.freeze([
  { code: 'en', label: 'EN' }, { code: 'zh', label: '中文' }, { code: 'th', label: 'ไทย' },
]);

/** Query choices translate public chrome on pages without localized routes. */
export function queryLanguage(search = '', fallback = 'en') {
  const value = new URLSearchParams(search).get('lang');
  return ['en', 'zh', 'th'].includes(value) ? value : fallback;
}
export function queryLanguages(pathname = '/', search = '', hash = '') {
  return LANGUAGES.map(item => {
    const query = new URLSearchParams(search);
    query.set('lang', item.code);
    return { ...item, href: pathname + '?' + query.toString() + hash };
  });
}

/** Shared static adapter: native links preserve the unknown path and query. */
export function mountQueryLanguage(root, helpers) {
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

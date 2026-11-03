import { HOME, COMMUNITY, BRAND_KIT, QUOTE, COPY, VERSION, languageCode, navigation } from './config.js';
import { queryLanguages } from './language.js';
export { LANGUAGES, queryLanguage, queryLanguages } from './language.js';
import { NOT_FOUND_COPY, NOT_FOUND_DESTINATIONS } from './not-found.js';
export { HOME, NAVIGATION, COMMUNITY, BRAND_KIT, QUOTE, VERSION, navigation, languageCode } from './config.js';
export { NOT_FOUND_COPY, NOT_FOUND_LANGUAGES, NOT_FOUND_DESTINATIONS, notFoundLanguage } from './not-found.js';

// A framework-neutral tree is rendered by both adapters: no second JSX template.
const node = (tag, attrs = {}, ...children) => ({ tag, attrs, children: children.flat().filter(child => child != null && child !== false) });
const paths = {
  x: 'M18.24 2H21.5l-7.13 8.15L22.75 22h-6.59l-5.16-6.75L6.1 22H2.8l7.63-8.72L1.5 2h6.76l4.66 6.18L18.24 2Zm-1.16 18h1.79L7.01 3.9H5.1L17.08 20Z',
  telegram: 'M21.6 3.4 2.8 10.6c-1.28.5-1.27 1.22-.23 1.54l4.82 1.5 11.16-7.04c.53-.32 1.01-.15.61.21L9.3 15.3l-.35 4.9c.48 0 .69-.22.96-.48l2.3-2.24 4.78 3.53c.88.49 1.51.23 1.73-.82l3.13-14.76c.32-1.28-.49-1.86-1.25-1.53Z',
  notion: 'M6.2 3.2h9.2l3.4 3.3v14.3c0 .6-.5 1-1.1 1H6.2c-.6 0-1.2-.5-1.2-1.1V4.3c0-.6.5-1.1 1.2-1.1Zm8.4 1.6v2.7h2.8L14.6 4.8ZM8 8.2v1.5h1.2v6.1c0 .8.4 1.2 1.2.8l.1-.1v-6.8H12v7.4l-1.7 1.1c-1.3.7-2.5.2-2.5-1.2V9.7H8V8.2h2.2V7H8v1.2Zm6.2 0v8.6h1.5V8.2h-1.5Z',
};
const external = { target: '_blank', rel: 'noopener noreferrer' };
const social = item => node('a', { class: 'fs-icon', href: item.href, 'aria-label': item.label, ...external },
  node('svg', { width: '18', height: '18', viewBox: '0 0 24 24', 'aria-hidden': 'true' }, node('path', { fill: 'currentColor', d: paths[item.key] })));
const logo = (assetBase, lazy = false) => node('img', { src: `${assetBase}/logo.png`, alt: '4Seas', width: '500', height: '113', ...(lazy ? { loading: 'lazy' } : {}) });

export function headerTree({ assetBase = '/site-chrome', section, locale, languages, id = 'fs-global-navigation' } = {}) {
  const copy = COPY[languageCode(locale)];
  const queryMode = !languages?.length;
  languages = queryMode ? queryLanguages() : languages;
  return node('header', { class: 'fs-header', lang: languageCode(locale), 'data-site-chrome': VERSION, ...(queryMode ? { 'data-query-language': '' } : {}) },
    node('div', { class: 'fs-header-inner' },
      node('a', { class: 'fs-brand', href: HOME, 'aria-label': copy.home }, logo(assetBase), node('span', { lang: 'en' }, 'A part of Zuzalu')),
      node('nav', { class: 'fs-navigation', id, 'aria-label': copy.navigation },
        navigation(locale).map(item => node('a', { href: item.href, ...(item.key === section ? { 'aria-current': 'page' } : {}) }, item.label))),
      node('div', { class: 'fs-tools' },
        languages.length > 0 && node('details', { class: 'fs-language' },
          node('summary', { 'aria-label': copy.language }, node('span', { 'aria-hidden': 'true' }, '◎'), node('span', { class: 'fs-language-label' }, languages.find(item => languageCode(item.code) === languageCode(locale))?.label || 'EN'), node('span', { 'aria-hidden': 'true' }, '⌄')),
          node('div', { class: 'fs-language-list' }, languages.map(item => node('a', { href: item.href, lang: item.code, hreflang: item.code, 'data-language': item.code,
            ...(languageCode(item.code) === languageCode(locale) ? { 'aria-current': 'true' } : {}) }, item.label)))),
        node('div', { class: 'fs-header-social' }, COMMUNITY.slice(0, 2).map(social)),
        node('button', { class: 'fs-menu', type: 'button', 'aria-expanded': 'false', 'aria-controls': id }, copy.menu))));
}
export function footerTree({ assetBase = '/site-chrome', locale } = {}) {
  return node('footer', { class: 'fs-footer', id: 'footer', 'data-site-chrome': VERSION },
    node('div', { class: 'fs-footer-inner' }, node('div', { class: 'fs-footer-card' },
      node('p', { class: 'fs-quote', lang: 'en' }, QUOTE),
      node('div', { class: 'fs-footer-row' },
        node('a', { class: 'fs-footer-brand', href: HOME, 'aria-label': COPY[languageCode(locale)].home }, logo(assetBase, true)),
        node('div', { class: 'fs-footer-links', role: 'group', 'aria-label': '4Seas community links' }, COMMUNITY.map(social),
          node('a', { class: 'fs-brand-kit', href: BRAND_KIT, ...external }, 'Brand Kit'))),
      { slot: 'footerExtra' })));
}
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
export function notFoundTree({ locale = 'en' } = {}) {
  const language = languageCode(locale);
  const text = NOT_FOUND_COPY[language];
  const copy = (tag, key, attrs = {}) => node(tag, { ...attrs, 'data-error-copy': key }, text[key]);
  return node('main', { class: 'fs-not-found', lang: language === 'zh' ? 'zh-CN' : language },
    node('div', { class: 'errorContainer' },
      node('div', { class: 'errorLayout' },
        node('div', {}, node('span', { class: 'errorNumber', 'aria-hidden': 'true' }, '404'),
          copy('h1', 'title'), copy('p', 'description', { class: 'errorDescription' }),
          node('div', { class: 'errorActions' }, copy('a', 'home', { href: HOME }), copy('a', 'events', { href: 'https://4seas.xyz/event' }))),
        node('section', { class: 'errorRoutes', 'aria-label': text.explore }, copy('h2', 'explore'),
          NOT_FOUND_DESTINATIONS.map((href, index) => node('a', { href, class: 'errorRoute' },
            node('span', { 'data-error-route': String(index) }, text.routes[index]), node('span', { 'aria-hidden': 'true' }, '↗')))))));
}
export function renderHtml(tree) {
  if (typeof tree === 'string' || typeof tree === 'number') return escape(tree);
  if (tree.slot) return '';
  const attrs = Object.entries(tree.attrs).filter(([, value]) => value != null && typeof value !== 'function').map(([key, value]) => ` ${key}="${escape(value)}"`).join('');
  return `<${tree.tag}${attrs}>` + (tree.tag === 'img' ? '' : tree.children.map(renderHtml).join('') + `</${tree.tag}>`);
}
export const renderHeader = options => renderHtml(headerTree(options));
export const renderFooter = options => renderHtml(footerTree(options));
export const renderNotFound = options => renderHtml(notFoundTree(options));

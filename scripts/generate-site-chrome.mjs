import { readFile, writeFile } from 'node:fs/promises';
import { renderHeader, renderFooter, renderNotFound, NOT_FOUND_COPY, notFoundLanguage, queryLanguage, queryLanguages, LANGUAGES, VERSION } from '../site-chrome/index.js';
import { COPY } from '../site-chrome/config.js';
const root = new URL('../', import.meta.url);
const check = process.argv.includes('--check');
let stale = false;
async function output(path, value) {
  const url = new URL(path, root);
  const old = await readFile(url).catch(() => null);
  if (old?.equals(Buffer.from(value))) return;
  if (check) { console.error('Stale shared chrome: ' + path); stale = true; }
  else await writeFile(url, value);
}
const labels = { en: 'EN', zh: '中文', th: 'ไทย' };
const pages = ['index.html', '404.html', ...['longevity', 'coliving-community'].flatMap(base => ['', 'en/', 'zh/', 'th/'].map(lang => `${base}/${lang}index.html`))];
for (const path of pages) {
  if (path === '404.html') {
    const options = { assetBase: '/images/site-chrome' };
    await output(path, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Page not found | 4Seas</title>
<link rel="icon" href="/images/favicon.jpg"><link rel="stylesheet" href="/css/site-chrome.css?v=${VERSION}">
<style>html,body{margin:0;padding:0}body{min-height:100vh;display:flex;flex-direction:column}</style></head><body>
<!-- site-chrome:header:start -->${renderHeader(options)}<!-- site-chrome:header:end -->
<!-- site-chrome:not-found:start -->${renderNotFound()}<!-- site-chrome:not-found:end -->
<!-- site-chrome:footer:start -->${renderFooter(options)}<!-- site-chrome:footer:end -->
<script defer src="/js/site-chrome.js?v=${VERSION}"></script><script defer src="/js/site-not-found.js?v=${VERSION}"></script>
</body></html>\n`);
    continue;
  }
  let html = await readFile(new URL(path, root), 'utf8');
  const section = path.startsWith('longevity/') ? 'longevity' : path.startsWith('coliving-community/') ? 'coliving' : undefined;
  const base = section === 'longevity' ? 'longevity' : 'coliving-community';
  const locale = section ? path.match(/\/(en|zh|th)\//)?.[1] || 'en' : undefined;
  const options = { assetBase: '/images/site-chrome', section, locale,
    languages: section ? Object.entries(labels).map(([code, label]) => ({ code, label, href: `/${base}/${code}/` })) : [] };
  for (const [part, render] of [['header', renderHeader], ['footer', renderFooter]]) {
    const start = `<!-- site-chrome:${part}:start -->`, end = `<!-- site-chrome:${part}:end -->`;
    const a = html.indexOf(start), b = html.indexOf(end);
    if (a < 0 || b < a) throw Error(`Missing chrome markers in ${path}: ${part}`);
    html = html.slice(0, a) + start + render(options) + end + html.slice(b + end.length);
  }
  html = html.replace(/<link data-site-chrome-style[^>]*>/, `<link data-site-chrome-style rel="stylesheet" href="/css/site-chrome.css?v=${VERSION}">`)
    .replace(/<script data-site-chrome-runtime[^>]*><\/script>/, `<script data-site-chrome-runtime defer src="/js/site-chrome.js?v=${VERSION}"></script>`);
  await output(path, html);
}
await output('css/site-chrome.css', await readFile(new URL('site-chrome/style.css', root)));
const languageInteraction = await readFile(new URL('site-chrome/language.js', root), 'utf8');
const queryMount = languageInteraction.slice(languageInteraction.indexOf('export function mountQueryLanguage')).replace('export function', 'function');
const helpers = `const COPY = ${JSON.stringify(COPY)};\nconst LANGUAGES = ${JSON.stringify(LANGUAGES)};\nconst queryLanguage = ${queryLanguage.toString()};\nconst queryLanguages = ${queryLanguages.toString()};\nconst notFoundLanguage = ${notFoundLanguage.toString()};\n`;
const interaction = await readFile(new URL('site-chrome/interaction.js', root), 'utf8');
await output('js/site-chrome.js', `// Generated from @4seas/site-chrome ${VERSION}. Do not edit.\n(() => {\n${helpers}${queryMount}\n${interaction.replace('export function mountHeader', 'function mountHeader')}\n document.querySelectorAll('.fs-header').forEach(root => { mountQueryLanguage(root, { COPY, queryLanguage, queryLanguages, notFoundLanguage }); mountHeader(root); });\n})();\n`);
await output('images/site-chrome/logo.png', await readFile(new URL('site-chrome/assets/logo.png', root)));
const notFoundInteraction = await readFile(new URL('site-chrome/not-found-interaction.js', root), 'utf8');
await output('js/site-not-found.js', `// Generated from @4seas/site-chrome ${VERSION}. Do not edit.\n(() => {\nconst copy = ${JSON.stringify(NOT_FOUND_COPY)};\nconst queryLanguage = ${queryLanguage.toString()};\nconst detectLanguage = ${notFoundLanguage.toString()};\n${notFoundInteraction.replace('export function mountNotFound', 'function mountNotFound')}\ndocument.querySelectorAll('.fs-not-found').forEach(root => mountNotFound(root, copy, detectLanguage, queryLanguage));\n})();\n`);
if (stale) process.exitCode = 1;

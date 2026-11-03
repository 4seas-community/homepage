import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { navigation, renderHeader, renderFooter, QUOTE } from '../site-chrome/index.js';
import { mountHeader } from '../site-chrome/interaction.js';

test('every public menu sends Coliving to the introduction directly after Longevity', () => {
  for (const locale of [undefined, 'en', 'zh', 'th', 'zh-CN']) {
    const items = navigation(locale);
    assert.deepEqual(items.map(i => i.key), ['events', 'zuzalu', 'about', 'space', 'longevity', 'coliving', 'residency']);
    const item = items.find(i => i.key === 'coliving');
    assert.match(item.href, /^https:\/\/4seas.xyz\/coliving-community\/(en\/|zh\/|th\/)?$/);
    assert.equal(items[0].href, 'https://4seas.xyz/event');
  }
});
test('rendered chrome is complete without runtime fetches and escapes input', () => {
  const html = renderHeader({ locale: 'zh', section: 'coliving', languages: [{ code: 'zh', label: '<中文>', href: '/zh/?q="x"&t=1' }] });
  assert.match(html, /&lt;中文&gt;/);
  assert.match(html, /q=&quot;x&quot;&amp;t=1/);
  assert.match(html, /aria-controls="fs-global-navigation"/);
  assert.match(html, /id="fs-global-navigation"/);
  assert.match(html, /coliving-community\/zh\/" aria-current="page"/);
  const footer = renderFooter();
  assert.equal((footer.match(/<footer/g) || []).length, 1);
  assert.equal((footer.match(/<nav/g) || []).length, 0);
  assert(footer.includes(QUOTE));
  assert.match(footer, /noopener noreferrer/);
  assert.doesNotMatch(html + footer, /<iframe|fetch\(|coliving\/en\/start/);
});
function element() {
  return { attrs: new Map(), handlers: {}, setAttribute(k,v){this.attrs.set(k,v);}, getAttribute(k){return this.attrs.get(k);}, removeAttribute(k){this.attrs.delete(k);},
    toggleAttribute(k,v){v?this.attrs.set(k,''):this.attrs.delete(k);}, addEventListener(k,f){this.handlers[k]=f;},removeEventListener(k){delete this.handlers[k];},focus(){this.focused=true;} };
}
test('shared interaction closes on Escape, outside clicks and desktop resize and cleans up', () => {
  const root=element(), button=element(), nav=element(), language=element(), document=element(), desktop=element();
  root.querySelector=q=>({'.fs-menu':button,'.fs-navigation':nav,'.fs-language':language})[q];
  root.contains=target=>target===button;
  root.ownerDocument=document; document.defaultView={matchMedia:()=>desktop};
  const cleanup=mountHeader(root);
  button.handlers.click(); assert.equal(button.getAttribute('aria-expanded'),'true');
  document.handlers.keydown({key:'Escape'}); assert.equal(button.getAttribute('aria-expanded'),'false'); assert(button.focused);
  button.handlers.click(); document.handlers.click({target:{}}); assert.equal(button.getAttribute('aria-expanded'),'false');
  button.handlers.click(); desktop.matches=true; desktop.handlers.change(); assert.equal(button.getAttribute('aria-expanded'),'false');
  button.handlers.click(); nav.handlers.click({target:{closest:()=>true}}); assert.equal(button.getAttribute('aria-expanded'),'false');
  cleanup(); assert.deepEqual(button.handlers,{}); assert.deepEqual(document.handlers,{}); assert.deepEqual(desktop.handlers,{});
});
test('checked-in static pages, styles, script and logo are generated from the same package', () => {
  execFileSync(process.execPath, ['scripts/generate-site-chrome.mjs', '--check'], { cwd: new URL('../', import.meta.url), stdio: 'pipe' });
  for (const file of ['index.html','404.html','longevity/en/index.html','coliving-community/zh/index.html']) {
    const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
    assert.equal((html.match(/class="fs-header"/g)||[]).length,1,file);
    assert.equal((html.match(/class="fs-footer"/g)||[]).length,1,file);
    assert.doesNotMatch(html, /w-nav-menu|class="wrap site-brand-header"/);
  }
});

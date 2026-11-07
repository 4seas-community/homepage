import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { navigation, renderHeader, renderFooter, QUOTE, queryLanguage, queryLanguages } from '../site-chrome/index.js';
import { mountHeader } from '../site-chrome/interaction.js';

test('every public menu sends Coliving to the introduction directly after Longevity', () => {
  const english = ['Longevity', 'Coliving', 'Residency', 'Event', 'Zuzalu', 'Space', 'Login'];
  const chinese = ['Longevity', 'Coliving', 'Residency', 'Event', 'Zuzalu', 'Space', '登录'];
  const thai = ['สุขภาพระยะยาว', 'ที่พักร่วมกัน', 'โปรแกรมพำนัก', 'กิจกรรม', 'Zuzalu', 'พื้นที่', 'เข้าสู่ระบบ'];
  for (const locale of [undefined, 'en', 'zh', 'th', 'zh-CN']) {
    const items = navigation(locale);
    assert.deepEqual(items.map(i => i.key), ['longevity', 'coliving', 'residency', 'events', 'zuzalu', 'space', 'login']);
    const item = items.find(i => i.key === 'coliving');
    assert.match(item.href, /^https:\/\/4seas.xyz\/coliving-community\/(en\/|zh\/|th\/)?$/);
    const loginItem = items.find(i => i.key === 'login');
    assert.match(loginItem.href, /^https:\/\/4seas.xyz\/coliving\/(en\/|zh\/|th\/)?login$/);
    assert.deepEqual(items.map(i => i.label), locale === 'th' ? thai : locale?.startsWith('zh') ? chinese : english);
    assert.equal(items[3].href, 'https://4seas.xyz/event');
  }
});
test('Thai header keeps the existing Thai tagline and navigation', () => {
  const html = renderHeader({ locale: 'th', languages: [{ code: 'th', label: 'ไทย', href: '/longevity/th/' }] });
  assert.match(html, /<span lang="th">ส่วนหนึ่งของ Zuzalu<\/span>/);
  assert.match(html, /กิจกรรม/);
  assert.match(html, /สุขภาพระยะยาว/);
  assert.match(html, /ที่พักร่วมกัน/);
  assert.match(html, /โปรแกรมพำนัก/);
  assert.match(html, /พื้นที่/);
  const chinese = renderHeader({ locale: 'zh' });
  assert.match(chinese, /<span lang="en">A part of Zuzalu<\/span>/);
  assert.match(chinese, />Longevity</);
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
  for (const file of ['index.html','404.html', ...['longevity','coliving-community'].flatMap(base => ['', 'en/', 'zh/', 'th/'].map(locale => `${base}/${locale}index.html`))]) {
    const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
    assert.equal((html.match(/class="fs-header"/g)||[]).length,1,file);
    assert.equal((html.match(/class="fs-footer"/g)||[]).length,1,file);
    assert.match(html, /class="fs-language"/,file);
    assert.equal((html.match(/data-language=/g)||[]).length,3,file);
    assert.doesNotMatch(html, /errorLanguages/,file);
    assert.doesNotMatch(html, /w-nav-menu|class="wrap site-brand-header"/);
  }
});

test('omitted language options never hide the shared Header language selector', () => {
  for (const options of [{}, { languages: [] }, { locale: 'zh' }]) {
    const html = renderHeader(options);
    assert.match(html, /class="fs-language"/);
    assert.equal((html.match(/data-language=/g)||[]).length,3);
    assert.match(html, /data-query-language/);
  }
});
test('query language preserves the missing path, existing parameters and fragment', () => {
  const options = queryLanguages('/longevity/zh/missing', '?t=keep&from=mail', '#details');
  const thai = options.find(item => item.code === 'th');
  assert.equal(thai.href, '/longevity/zh/missing?t=keep&from=mail&lang=th#details');
  assert.equal(queryLanguage('?lang=th', 'zh'), 'th');
  assert.equal(queryLanguage('?lang=invalid', 'zh'), 'zh');
});

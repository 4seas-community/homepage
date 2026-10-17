import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import { execSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
// The browser modules ship as .js (production nginx serves .mjs as
// application/octet-stream, which browsers refuse to run as a module), so load
// them as ES modules explicitly instead of relying on Node's .js detection.
const { prepareEvents, selectEvents } = await import(
  'data:text/javascript,' + encodeURIComponent(read('longevity/assets/longevity-calendar-data.js')));
const locales = ['en', 'zh', 'th'];
const data = JSON.parse(read('longevity/assets/longevity-events.json'));
const runtime = read('longevity/assets/site-i18n.js');

test('standalone pages resolve local dependencies, anchors and all three language entries', () => {
  for (const locale of ['', ...locales]) {
    const path = `longevity/${locale ? locale + '/' : ''}index.html`;
    const html = read(path);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size);
    assert.deepEqual([...html.matchAll(/data-language="([^"]+)"/g)].map(m => m[1]), locales);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.doesNotMatch(html, /localhost|127\.0\.0\.1|\/(?:en|zh|th)\/[^" ]*\.html|(?:coliving|canteen|hosts)\.html|href="[^" ]*\/hosts\//i);
    for (const [, reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (reference.startsWith('#')) assert(ids.includes(reference.slice(1)), reference);
      else if (reference.startsWith('/')) {
        const url = new URL(reference, 'https://4seas.xyz');
        let file = join(root, url.pathname);
        if (url.pathname.endsWith('/')) file += 'index.html';
        assert(existsSync(file), `${path}: ${reference}`);
        if (/\.(?:css|js|mjs)$/.test(url.pathname)) assert.equal(url.searchParams.get('v'), '20261017');
      }
    }
    assert.match(html, /href="https:\/\/linktr\.ee\/ZuzaluLongevityChiangMai"/);
    assert.match(html, /rel="canonical" href="https:\/\/4seas\.xyz\/longevity\//);
    assert(html.indexOf('id="peptide"') < html.indexOf('id="data"'));
    assert.match(html, /2026-11-30/);
    assert.match(html, /2026-12-26/);
    assert.match(html, /2026-12-28/);
    assert.doesNotMatch(html, /\bconference\b|Second Nomad Market|v11-os-connection/);
  }
  assert.match(read('index.html'), /href="\/longevity\/"[^>]*>Longevity<\/a>/);
});

test('public event snapshot keeps only display fields, real profiles and valid period boundaries', () => {
  const allowed = new Set(['id','title','start','end','tags','category','venue','cover','host','hostName','url','hostUrl']);
  assert.equal(data.events.length, 213);
  for (const e of data.events) {
    assert(Object.keys(e).every(k => allowed.has(k)));
    assert.match(e.url, /^https:\/\/sola\.day\/event\/detail\//);
    if (e.hostUrl) assert.match(e.hostUrl, /^https:\/\/sola\.day\/profile\//);
  }
  const rows = prepareEvents(data.events), now = Date.parse('2026-10-17T12:00:00+07:00');
  assert.equal(selectEvents(rows, {now}).length, 18);
  assert.equal(selectEvents(rows, {now, period:'past'}).length, 195);
  const ongoing = prepareEvents([{id:'ongoing', title:'Ongoing', start:'2026-10-17T04:00:00Z', end:'2026-10-17T06:00:00Z', tags:['Longevity'], url:'https://sola.day/event/detail/ongoing'}]);
  assert.equal(selectEvents(ongoing, {now}).length, 1);
  assert.equal(selectEvents(ongoing, {now, period:'past'}).length, 0);
});

class Element {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.attrs={};this.dataset={};this.events={};this.value='';this.hidden=false;this.disabled=false;this.text='';}
  set textContent(value){this.text=String(value);this.children=[];}
  get textContent(){return this.text+this.children.map(e=>e.textContent).join('');}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=nodes;this.text='';}
  setAttribute(k,v){this.attrs[k]=v;}
  removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
  fire(k){for(const fn of this.events[k]||[])fn({target:this});}
  querySelector(q){return this.children.find(c=>c.tagName===q)||this.children.map(c=>c.querySelector(q)).find(Boolean);}
  focus(){}
}
function context(lang='en', saved=null, {entry=false, denyStorage=false}={}) {
  const ids=new Map(), selectors=new Map(), ready=[];
  const location={origin:'https://4seas.xyz', pathname:entry?'/longevity/':`/longevity/${lang}/`,search:'?ref=community',hash:'#data',replace:url=>location.redirect=url};
  const values=new Map(saved?[['4seas-language',saved]]:[]);
  const storage={getItem:k=>{if(denyStorage)throw Error('blocked');return values.get(k);},setItem:(k,v)=>{if(denyStorage)throw Error('blocked');values.set(k,v);}};
  const document={addEventListener:(type,fn)=>{if(type==='DOMContentLoaded')ready.push(fn);},querySelectorAll:q=>selectors.get(q)||[],getElementById:id=>ids.get(id)||null,querySelector:q=>selectors.get(q)?.[0]||null,createElement:t=>new Element(t)};
  const ctx={document,location,localStorage:storage,URL,URLSearchParams,Intl,Date,AbortController,setTimeout,clearTimeout,setInterval:()=>0,console};ctx.window=ctx;
  vm.createContext(ctx);vm.runInContext(runtime,ctx);
  return {ctx,ids,selectors,ready,values};
}

test('nested locale URLs preserve language preference, query and section without rewriting external profiles', () => {
  for(const lang of locales) {
    const c=context(lang); assert.equal(c.ctx.siteLang,lang);
    assert.equal(c.ctx.siteHref('https://sola.day/profile/jasonryer'),'https://sola.day/profile/jasonryer');
    c.ready.forEach(fn=>fn());assert.equal(c.values.get('4seas-language'),lang);
  }
  for(const saved of ['zh','th']) {
    const c=context('en',saved,{entry:true});c.ready.forEach(fn=>fn());
    assert.equal(c.ctx.location.redirect,`/longevity/${saved}/?ref=community#data`);
  }
  const blocked=context('th',null,{denyStorage:true});assert.doesNotThrow(()=>blocked.ready.forEach(fn=>fn()));
  const c=context('zh');const link=new Element('a');link.href='https://4seas.xyz/longevity/en/';link.dataset.language='en';
  c.selectors.set('[data-language]',[link]);c.ready.forEach(fn=>fn());
  assert.equal(link.href,'/longevity/en/?ref=community#data');
  link.href='https://4seas.xyz'+link.href;link.fire('click');assert.equal(c.values.get('4seas-language'),'en');
});

test('EN/TH calendar loads its shipped data, pages, searches and handles network failure', async () => {
  const source=read('longevity/assets/longevity-v6.js').replace(/^import .*?;\n/,'');
  const settle=async()=>{await new Promise(setImmediate);await new Promise(setImmediate);};
  for(const lang of ['en','th']) for(const unavailable of [false,true]) {
    const c=context(lang);
    for(const id of ['l-event-grid','l-event-status','l-search','l-topic','l-more','l-upcoming-count','l-past-count'])c.ids.set(id,new Element());
    c.ids.get('l-topic').value='all';
    const periods=['upcoming','past'].map(p=>{const e=new Element('button');e.dataset.lPeriod=p;return e;});
    c.selectors.set('[data-l-period]',periods);c.ctx.prepareEvents=prepareEvents;c.ctx.selectEvents=selectEvents;
    c.ctx.Date=class extends Date {static now(){return Date.parse('2026-10-17T12:00:00+07:00');}};
    c.ctx.fetch=async url=>{assert.equal(url,'/longevity/assets/longevity-events.json?v=20261017');if(unavailable)throw Error('offline');return{ok:true,json:async()=>data};};
    vm.runInContext(source,c.ctx);await settle();
    const status=c.ids.get('l-event-status');assert(!/[\u4e00-\u9fff]/.test(status.textContent),status.textContent);
    if(unavailable){assert.equal(c.ids.get('l-more').hidden,true);continue;}
    assert.equal(c.ids.get('l-event-grid').children.length,6);
    c.ids.get('l-more').fire('click');assert.equal(c.ids.get('l-event-grid').children.length,12);
    periods[1].fire('click');assert.equal(c.ids.get('l-past-count').textContent,'195');
    c.ids.get('l-search').value='this-event-does-not-exist';c.ids.get('l-search').fire('input');
    assert.equal(c.ids.get('l-event-grid').children.length,1);
    assert(!/[\u4e00-\u9fff]/.test(c.ids.get('l-event-grid').textContent));
  }
});

test('Longevity payload ships no .mjs files', () => {
  // Production nginx has no .mjs MIME mapping and sends nosniff, so a .mjs
  // module script is rejected by every browser even though it works locally.
  const files = execSync('git ls-files longevity', { cwd: root, encoding: 'utf8' }).split('\n');
  assert.deepEqual(files.filter(f => f.endsWith('.mjs')), []);
  for (const locale of ['', ...locales.map(l => l + '/')]) {
    assert.doesNotMatch(read(`longevity/${locale}index.html`), /\.mjs\b/);
  }
});

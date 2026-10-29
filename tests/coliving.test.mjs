import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('Coliving is standalone, localized, and keeps every dependency inside the payload', () => {
  const home = read('index.html');
  assert.match(home, />Longevity<\/a>\s*<a href="\/coliving-community\/"[^>]*>Coliving<\/a>/);
  for (const locale of ['', 'en/', 'zh/', 'th/']) {
    const html = read(`coliving-community/${locale}index.html`);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.deepEqual([...html.matchAll(/data-language="([^"]+)"/g)].map(m => m[1]), ['en', 'zh', 'th']);
    assert.equal((html.match(/href="https:\/\/4seas.xyz\/coliving\/en\/start"/g) || []).length, 7);
    assert.equal((html.match(/href="https:\/\/linktr.ee\/4seascoliving"/g) || []).length, 2);
    assert.doesNotMatch(html, /localhost|127\.0\.0\.1|\/(?:en|zh|th)\/[^" ]*\.html|canteen\.html|src="\/main.js/);
    assert.match(html, /Questions That Matter/);
    assert.match(html, /Move Freely/);
    assert.match(html, /Move Strong/);
    assert.match(html, /rel="canonical" href="https:\/\/4seas.xyz\/coliving-community\//);
    for (const [,ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (ref.startsWith('#')) assert(ids.includes(ref.slice(1)), ref);
      else if (ref.startsWith('/')) {
        const url = new URL(ref, 'https://4seas.xyz');
        const file = url.pathname.slice(1) + (url.pathname.endsWith('/') ? 'index.html' : '');
        assert(existsSync(new URL(file, root)), `${locale}: ${ref}`);
        if (/\.(css|js)$/.test(url.pathname)) assert.equal(url.searchParams.get('v'), '20261029');
      }
    }
  }
});

function runtime({path='/coliving-community/en/', entry=false, stored=null, blocked=false}={}) {
  const links=['en','zh','th'].map(lang => ({dataset:{language:lang},addEventListener(){}}));
  const storage=new Map(stored ? [['4seas-language',stored]] : []);
  const windowEvents={};
  const context={location:{pathname:path,search:'?ref=stay',hash:'#everyday',replace(url){this.redirect=url;}},
    localStorage:{getItem(k){if(blocked)throw Error('denied');return storage.get(k);},setItem(k,v){if(blocked)throw Error('denied');storage.set(k,v);}},
    document:{body:{dataset:entry?{colivingEntry:'true'}:{}},querySelectorAll:()=>links,querySelector:()=>null},
    window:{addEventListener(k,fn){windowEvents[k]=fn;}}};
  vm.runInNewContext(read('coliving-community/assets/community.js'),context);
  return {context,links,storage,windowEvents};
}

test('language switching preserves the section and query without breaking application URLs', () => {
  const {context,links,windowEvents}=runtime();
  assert.equal(links[1].href,'/coliving-community/zh/?ref=stay#everyday');
  context.location.hash='#package';windowEvents.hashchange();
  assert.equal(links[2].href,'/coliving-community/th/?ref=stay#package');
  assert.equal(runtime({entry:true,stored:'zh'}).context.location.redirect,'/coliving-community/zh/?ref=stay#everyday');
  assert.equal(runtime({entry:true,stored:'invalid'}).context.location.redirect,undefined);
  assert.doesNotThrow(()=>runtime({blocked:true,entry:true}));
  assert.doesNotThrow(()=>runtime({blocked:true}));
  assert.equal(runtime({path:'/coliving-community/th/'}).storage.get('4seas-language'),'th');
});

test('release packaging and verification include the new isolated directory', () => {
  const release=read('scripts/release-244.sh');
  assert.match(release,/rsync -a .*coliving-community/);
  assert.match(release,/css images js longevity coliving-community RELEASE-MANIFEST.txt/);
  assert.match(release,/validate-coliving.py/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { renderNotFound, notFoundLanguage, NOT_FOUND_COPY, NOT_FOUND_DESTINATIONS } from '../site-chrome/index.js';
import { mountNotFound } from '../site-chrome/not-found-interaction.js';

test('404 language uses the route locale, never an incidental later segment', () => {
  for (const [path, base, expected] of [
    ['/longevity/zh/longevitymonth2026', undefined, 'zh'], ['/coliving/th/missing', '/coliving', 'th'],
    ['/event/zh/missing', '/event', 'zh'], ['/residency/th/missing', '/residency', 'th'],
    ['/zh-CN/missing', '', 'zh'], ['/unknown/th/missing', undefined, 'en'],
    ['/apply/zh', '', 'en'], ['/crypto/th/missing', undefined, 'en'], ['/eventual/th/missing', '/event', 'en'],
    ['/unknown?language=th', undefined, 'en'],
  ]) assert.equal(notFoundLanguage(path, base), expected, path);
});
test('all three 404 pages share destinations and have one main, heading and no extra navigation', () => {
  for (const locale of ['en','zh','th']) {
    const html = renderNotFound({locale});
    assert.equal((html.match(/<main\b/g)||[]).length,1);
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    assert.equal((html.match(/<nav\b/g)||[]).length,0);
    assert(html.includes(NOT_FOUND_COPY[locale].title));
    for (const href of NOT_FOUND_DESTINATIONS) assert(html.includes(`href="${href}"`));
    assert.match(html, /https:\/\/book\.4seas\.xyz\//);
    assert.doesNotMatch(html, /booking\.4seas|File not found|Error response|onClick=/);
  }
});
test('static 404 selects Chinese at the screenshot URL and switches copy without navigating', () => {
  const buttons=['zh','en','th'].map(code=>({dataset:{errorLanguage:code},attrs:{},events:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this.events[k]=f;}}));
  const title={dataset:{errorCopy:'title'}},route={dataset:{errorRoute:'4'}};
  const section={setAttribute(){}},languages={setAttribute(){}};
  const doc={defaultView:{location:{pathname:'/longevity/zh/longevitymonth2026'}}};
  const root={ownerDocument:doc,querySelectorAll:q=>q==='[data-error-language]'?buttons:q==='[data-error-copy]'?[title]:[route],querySelector:q=>q==='.errorRoutes'?section:languages};
  mountNotFound(root,NOT_FOUND_COPY,notFoundLanguage);
  assert.equal(root.lang,'zh-CN');assert.equal(title.textContent,NOT_FOUND_COPY.zh.title);
  assert.equal(buttons[0].attrs['aria-pressed'],'true');
  buttons[2].events.click();assert.equal(root.lang,'th');assert.equal(title.textContent,NOT_FOUND_COPY.th.title);
  assert.equal(route.textContent,NOT_FOUND_COPY.th.routes[4]);assert.equal(buttons[0].attrs['aria-pressed'],'false');
});
test('local preview serves branded HTML with actual 404 status, including HEAD and nested paths', async () => {
  const server=spawn('python3',['scripts/preview.py','--port','0'],{cwd:new URL('../',import.meta.url),stdio:['ignore','pipe','pipe']});
  let output='';
  const ready=new Promise((resolve,reject)=>{
    server.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:(\d+)/);if(match)resolve(Number(match[1]));});
    server.on('error',reject);server.on('exit',code=>reject(Error('Preview exited: '+code)));
  });
  try {
    const port=await Promise.race([ready,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Preview startup timeout')),8000);timer.unref();})]);
    const base=`http://127.0.0.1:${port}`;
    for(const path of ['/longevity/zh/longevitymonth2026','/missing','/site-chrome/config.js','/.git/config','/images/']) {
      const res=await fetch(base+path);assert.equal(res.status,404,path);
      const html=await res.text();assert.match(html,/class="fs-not-found"/);assert.doesNotMatch(html,/Error response|File not found/);
      assert.equal((html.match(/class="fs-header"/g)||[]).length,1);assert.equal((html.match(/class="fs-footer"/g)||[]).length,1);
    }
    const head=await fetch(base+'/missing',{method:'HEAD'});assert.equal(head.status,404);assert.equal(await head.text(),'');
    assert(Number(head.headers.get('content-length'))>0);
    for(const path of ['/','/css/site-chrome.css','/js/site-not-found.js','/images/site-chrome/logo.png']) assert.equal((await fetch(base+path)).status,200,path);
  } finally { server.kill('SIGTERM');await once(server,'exit'); }
});

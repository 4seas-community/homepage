import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const run = args => new Promise(resolve => {
  const child = spawn('python3', args, {cwd: fileURLToPath(root)});
  let stdout='', stderr='';child.stdout.on('data',v=>stdout+=v);child.stderr.on('data',v=>stderr+=v);
  child.on('error',error=>resolve({code:-1,stdout,stderr:String(error)}));
  child.on('close',code=>resolve({code,stdout,stderr}));
});

test('public validator accepts exact payload and refuses a stale asset or missing locale', async () => {
  let mode='valid';
  const server=createServer((request,response)=>{
    const pathname=new URL(request.url,'http://local').pathname;
    if(mode==='missing' && pathname==='/longevity/th/') {response.writeHead(404);response.end('missing');return;}
    if(mode==='stale' && pathname==='/longevity/assets/site-i18n.css') {response.end('stale cache');return;}
    try {
      const path=pathname.endsWith('/')?pathname+'index.html':pathname;
      response.end(readFileSync(new URL('.'+path,root)));
    } catch {response.writeHead(404);response.end('missing');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try {
    const args=['scripts/validate-longevity.py','--base-url',`http://127.0.0.1:${server.address().port}/`];
    let result=await run(args);assert.equal(result.code,0,result.stderr);assert.match(result.stdout,/Verified 24/);
    mode='stale';result=await run(args);assert.notEqual(result.code,0);assert.match(result.stderr,/Content hash mismatch/);
    mode='missing';result=await run(args);assert.notEqual(result.code,0);assert.match(result.stderr,/404/);
  } finally {await new Promise(resolve=>server.close(resolve));}
});

import { chromium } from 'playwright-core';
import fs from 'node:fs';
const out='/workspace/traced/screens/landing'; fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'}); await p.waitForTimeout(1500);
const ids=['hero','story','features','badges','inside','trace-back','honesty','cta'];
let n=1;
for(const id of ids){
  const info=await p.evaluate(id=>{const e=document.getElementById(id); if(!e) return null; const r=e.getBoundingClientRect(); return {top:r.top+scrollY,h:r.height};},id);
  if(!info){console.log('missing',id);continue;}
  const stops = info.h>1400 ? [0,0.5] : [0];
  for(const f of stops){
    await p.evaluate(y=>window.scrollTo(0,y), info.top + f*(info.h-900));
    await p.waitForTimeout(1400);
    const file=`${out}/${String(n).padStart(2,'0')}-${id}${stops.length>1?(f?'-b':'-a'):''}.png`;
    await p.screenshot({path:file}); console.log(file); n++;
  }
}
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(1000);
await p.screenshot({path:`${out}/${String(n).padStart(2,'0')}-footer.png`});
await b.close();

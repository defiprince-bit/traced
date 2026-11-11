// CDP screenshot driver (no deps; Node ≥ 22 has WebSocket). Real time, so canvases and scroll effects settle.
// usage: node shoot.mjs <out.png> <url> <w> <h> [scrollJS] [waitMs] [full]
import { spawn } from 'node:child_process';
const [out,url,w,h,scrollJS='',waitMs='1600',full=''] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random()*500);
const chrome = spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars',`--remote-debugging-port=${port}`,`--window-size=${w},${h}`,'--force-device-scale-factor=1','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ver;for(let i=0;i<50;i++){try{ver=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();if(ver.length)break}catch{}await sleep(150)}
const page=ver.find(t=>t.type==='page');const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend=new Map();ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){pend.get(d.id)(d);pend.delete(d.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
await send('Emulation.setDeviceMetricsOverride',{width:+w,height:+h,deviceScaleFactor:1,mobile:+w<600});
await send('Page.enable');await send('Page.navigate',{url});await sleep(1200);
if(scrollJS){await send('Runtime.evaluate',{expression:scrollJS});}
await sleep(+waitMs);
let clip;
if(full){const r=await send('Runtime.evaluate',{expression:'document.documentElement.scrollHeight',returnByValue:true});const H=r.result.result.value;const fs=await import('node:fs');const tiles=[];
 // stitch viewport tiles (keeps iframes and vh-based layout intact); header hidden after the first tile
 for(let y=0,k=0;y<H;y+=+h,k++){await send('Runtime.evaluate',{expression:`scrollTo(0,${y});document.querySelector('header')&&(document.querySelector('header').style.visibility=${k?"'hidden'":"''"})`});await sleep(700);
  const t=await send('Page.captureScreenshot',{format:'png'});const f=`${out}.tile${k}.png`;fs.writeFileSync(f,Buffer.from(t.result.data,'base64'));tiles.push([f,Math.min(y,H-+h)]);}
 fs.writeFileSync(out+'.json',JSON.stringify({H,w:+w,tiles}));ws.close();chrome.kill('SIGKILL');
 const {execFileSync}=await import('node:child_process');execFileSync('python3',['-c',`
import json,os;from PIL import Image
m=json.load(open('${out}.json'));c=Image.new('RGB',(m['w'],m['H']),(11,11,11))
for f,y in m['tiles']:
  c.paste(Image.open(f).convert('RGB'),(0,y));os.remove(f)
c.save('${out}');os.remove('${out}.json')`]);process.exit(0);}
const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:!!full,...(clip?{clip}:{})});
const fs=await import('node:fs');fs.writeFileSync(out,Buffer.from(shot.result.data,'base64'));
ws.close();chrome.kill('SIGKILL');process.exit(0);

/* TraceScene v1: voxel dot-cubes + dust travelling on right-angle PCB traces (Canvas2D, no deps).
   new TraceScene(canvas,{cubes:[{x,y,size,state}],flow:{from,to,rate},...})
   states: 'lume' | 'orig' | 'copy' | 'dim'.  Honors prefers-reduced-motion (one static frame). */
(function(){
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('static');
const SMALL=matchMedia('(max-width: 767px)').matches;
const COL={lume:[200,255,106],orig:[255,194,102],copy:[255,107,139],dim:[120,132,110],trace:[62,82,34]};
function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>(s=s*16807%2147483647)/2147483647;}
const NORM=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
function makeCube(n,seed,dissolve){const r=rng(seed),pts=[];
 for(let f=0;f<6;f++)for(let i=0;i<n;i++)for(let j=0;j<n;j++){
  const u=(i+.5)/n*2-1,v=(j+.5)/n*2-1,p=f<2?[f?-1:1,u,v]:f<4?[u,f===2?1:-1,v]:[u,v,f===4?1:-1];
  // dissolve toward one corner, like ref1's crumbling cubes
  const d=(p[0]+p[1]-p[2]+3)/6; if(r()<Math.pow(d,3)*dissolve)continue;
  pts.push({p,f,s:.55+r()*.55,b:.75+r()*.25});}
 return pts;}
class TraceScene{
 constructor(canvas,opt={}){
  this.c=canvas;this.g=canvas.getContext('2d');
  this.o=Object.assign({n:SMALL?11:17,maxDust:SMALL?220:700,ambient:SMALL?20:46,auto:.12,tilt:true,trace:true,lanes:5,float:0,pedestal:false,hoverFlow:true,static:RM},opt);
  this.cubes=(opt.cubes||[]).map((cb,i)=>Object.assign({yaw:.65+i*.5,pitch:-.5,hl:0,glow:0,state:'lume',dissolve:i?1.1:.7},cb,{pts:makeCube(this.o.n,11+i*29,cb.dissolve??(i?1.1:.7)),proj:[]}));
  this.flow=Object.assign({from:0,to:1,rate:1},opt.flow||{});
  this.dust=[];this.amb=[];this.mx=0;this.my=0;this.tx=0;this.ty=0;this.hover=-1;this.touchUntil=0;this.t=0;this.visible=true;
  this.rand=rng(99);
  this.resize();new ResizeObserver(()=>{this.resize();if(this.o.static)this.frame(0)}).observe(canvas);
  if(this.o.tilt){const host=opt.host||canvas;
   host.addEventListener('pointermove',e=>this.point(e));host.addEventListener('pointerleave',()=>{this.tx=0;this.ty=0;if(performance.now()>this.touchUntil)this.setHover(-1)});
   host.addEventListener('pointerdown',e=>{this.point(e);if(this.hover>=0)this.touchUntil=performance.now()+2600});}
  new IntersectionObserver(es=>{this.visible=es[0].isIntersecting},{rootMargin:'100px'}).observe(canvas);
  if(this.o.static){this.seedStatic();this.frame(0);}else{this.project();if(this.cubes.length>1)for(let i=0;i<this.o.maxDust*.35;i++)this.spawn(this.rand()*.95);let last=performance.now();const loop=now=>{const dt=Math.min(50,now-last);last=now;if(this.visible)this.frame(dt);requestAnimationFrame(loop)};requestAnimationFrame(loop);}
 }
 resize(){const r=this.c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);this.w=r.width;this.h=r.height;this.c.width=Math.max(1,r.width*d);this.c.height=Math.max(1,r.height*d);this.g.setTransform(d,0,0,d,0,0);}
 point(e){const r=this.c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;this.tx=x/r.width-.5;this.ty=y/r.height-.5;
  let h=-1;this.cubes.forEach((cb,i)=>{const S=this.S(cb);if(Math.hypot(x-cb.sx,y-cb.sy)<S*1.35)h=i});
  if(h!==this.hover&&(h>=0||performance.now()>this.touchUntil))this.setHover(h);}
 setHover(i){this.hover=i;if(this.o.onHover)this.o.onHover(i,this);else if(this.o.hoverFlow&&i>=0&&this.cubes.length>1){this.flow.from=i;this.flow.to=1-i;}}
 S(cb){return cb.size*Math.min(this.w,this.h)}
 setFlow(from,to,rate){this.flow.from=from;this.flow.to=to;if(rate!=null)this.flow.rate=rate;}
 route(a,b,lane){const A=this.cubes[a],B=this.cubes[b],SA=this.S(A),SB=this.S(B),o=(lane-(this.o.lanes-1)/2)*7;
  const dx=B.sx-A.sx,dy=B.sy-A.sy;
  if(Math.abs(dx)>=Math.abs(dy)*.8){const sx=A.sx+Math.sign(dx)*SA*1.05,ex=B.sx-Math.sign(dx)*SB*1.05,mx=(sx+ex)/2+o*Math.sign(dx)*Math.sign(dy||1);
   return[[sx,A.sy+o],[mx,A.sy+o],[mx,B.sy+o],[ex,B.sy+o]];}
  const sy=A.sy+Math.sign(dy)*SA*1.05,ey=B.sy-Math.sign(dy)*SB*1.05,my=(sy+ey)/2+o;
  return[[A.sx+o,sy],[A.sx+o,my],[B.sx+o,my],[B.sx+o,ey]];}
 along(pts,t){let L=0;const seg=[];for(let i=1;i<pts.length;i++){const l=Math.abs(pts[i][0]-pts[i-1][0])+Math.abs(pts[i][1]-pts[i-1][1]);seg.push(l);L+=l}
  let d=t*L;for(let i=0;i<seg.length;i++){if(d<=seg[i]||i===seg.length-1){const k=seg[i]?Math.min(1,d/seg[i]):0;return[pts[i][0]+(pts[i+1][0]-pts[i][0])*k,pts[i][1]+(pts[i+1][1]-pts[i][1])*k]}d-=seg[i]}}
 spawn(t0){const f=this.flow,A=this.cubes[f.from];if(!A||!A.proj.length||!this.cubes[f.to])return;const r=this.rand;
  const q=A.proj[(r()*A.proj.length)|0];
  this.dust.push({from:f.from,to:f.to,lane:(r()*this.o.lanes)|0,t:t0??0,v:.00022+r()*.00022,sz:1.6+r()*1.8,ox:q[0]-A.sx,oy:q[1]-A.sy,tx:(r()-.5),ty:(r()-.5),st:A.state});}
 seedStatic(){this.project();for(let i=0;i<(SMALL?60:140);i++)this.spawn(this.rand());}
 project(){const t=this.t;
  this.cubes.forEach((cb,i)=>{
   cb.sx=cb.x*this.w;cb.sy=cb.y*this.h+(this.o.float?Math.sin(t*.0012+i)*this.o.float:0)+(cb.dy||0);
   const yaw=cb.yaw+(this.o.static?0:t*.001*this.o.auto*(i?-1:1))+this.mx*.9,pit=cb.pitch+this.my*.6;
   const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pit),sp=Math.sin(pit),S=this.S(cb)*(cb.scale||1);
   const rot=p=>{const x=p[0]*cy+p[2]*sy,z=-p[0]*sy+p[2]*cy;return[x,p[1]*cp-z*sp,p[1]*sp+z*cp]};
   const nrm=NORM.map(rot);cb.proj=[];cb.vis=nrm.map(n=>n[2]<-.04);cb.rot=rot;cb.Sp=S;
   for(const q of cb.pts){if(!cb.vis[q.f])continue;const r=rot(q.p),k=900/(900+r[2]*S);cb.proj.push([cb.sx+r[0]*S*k,cb.sy+r[1]*S*k,k,q,nrm[q.f]]);}
  });}
 frame(dt){this.t+=dt;const g=this.g,o=this.o;
  this.mx+=(this.tx-this.mx)*.06;this.my+=(this.ty-this.my)*.06;
  this.project();g.clearRect(0,0,this.w,this.h);
  // pedestal
  if(o.pedestal)this.cubes.forEach(cb=>{const S=this.S(cb);g.fillStyle='rgba(200,255,106,.22)';for(let r=0;r<4;r++)for(let a=0;a<64;a++){const th=a/64*6.283+this.t*.0002*(r%2?1:-1),R=S*(1.25+r*.22);g.fillRect(cb.sx+Math.cos(th)*R-1,cb.sy+S*1.75+Math.sin(th)*R*.22-1,2,2)}});
  // traces
  if(o.trace&&this.cubes.length>1){const f=this.flow;g.lineWidth=1;
   for(let l=0;l<o.lanes;l++){const pts=this.route(f.from,f.to,l);g.strokeStyle=`rgba(${COL.trace},${l===2?.9:.55})`;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))g.lineTo(p[0],p[1]);g.stroke();
    if(l===2){g.strokeStyle='rgba(200,255,106,.6)';for(const p of [pts[1],pts[2]]){g.beginPath();g.arc(p[0],p[1],3.5,0,6.283);g.stroke()}}}}
  // cubes
  const light=[-.35,-.55,-.76];
  this.cubes.forEach((cb,i)=>{cb.hl+=((this.hover===i?1:0)-cb.hl)*.1;cb.glow*=.96;const c=cb.rgb||COL[cb.state]||COL.lume;const S=cb.Sp,n=o.n,base=S*2/n*.62;
   for(const [x,y,k,q,nr] of cb.proj){const lum=.28+.72*Math.max(0,-(nr[0]*light[0]+nr[1]*light[1]+nr[2]*light[2]));
    const a=Math.min(1,(.35+lum*.75)*q.b+cb.hl*.15+cb.glow*.3),s=base*k*q.s*(1+cb.hl*.12);
    g.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${a})`;g.fillRect(x-s/2,y-s/2,s,s);}
   // ambient specks drifting off the dissolving corner
   if(!o.static&&cb.proj.length){for(let k=0;k<2;k++)if(this.amb.length<o.ambient*this.cubes.length){const q=cb.proj[(this.rand()*cb.proj.length)|0];this.amb.push({i,x:q[0]-cb.sx,y:q[1]-cb.sy,vx:(this.rand()-.3)*.03,vy:(this.rand()-.7)*.03,life:1,sz:1+this.rand()*2});}}
  });
  if(!o.static)this.amb=this.amb.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt*.0006;const cb=this.cubes[p.i],c=cb.rgb||COL[cb.state]||COL.lume;g.fillStyle=`rgba(${c},${Math.max(0,p.life)*.6})`;g.fillRect(cb.sx+p.x,cb.sy+p.y,p.sz,p.sz);return p.life>0});
  // dust
  if(!o.static&&this.cubes.length>1){const want=this.flow.rate*dt*.09;let k=want;while(k>0&&this.dust.length<o.maxDust){if(k>=1||this.rand()<k)this.spawn();k-=1}}
  this.dust=this.dust.filter(p=>{p.t+=p.v*dt*(o.static?0:1);if(p.t>=1){const T=this.cubes[p.to];if(T)T.glow=Math.min(1,T.glow+.04);return false}
   const A=this.cubes[p.from],B=this.cubes[p.to];if(!A||!B)return false;const pts=this.route(p.from,p.to,p.lane);let x,y;
   if(p.t<.15){const e=p.t/.15,s=pts[0];x=A.sx+p.ox+(s[0]-A.sx-p.ox)*e;y=A.sy+p.oy+(s[1]-A.sy-p.oy)*e;}
   else if(p.t>.85){const e=(p.t-.85)/.15,s=pts[pts.length-1];x=s[0]+(B.sx-s[0])*e+p.tx*B.Sp*e;y=s[1]+(B.sy-s[1])*e+p.ty*B.Sp*e;}
   else[x,y]=this.along(pts,(p.t-.15)/.7);
   const c=COL[p.st]||COL.lume,a=p.t>.9?(1-p.t)*10:1;g.fillStyle=`rgba(${c},${a*.95})`;g.fillRect(x-p.sz/2,y-p.sz/2,p.sz,p.sz);return true});
  if(o.onFrame)o.onFrame(this);
 }
}
window.TraceScene=TraceScene;window.TRACE_RM=RM;window.TRACE_SMALL=SMALL;
})();

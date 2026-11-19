// Traced trace helpers: right-angle routing + signal pulses (transform/opacity only).
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
// points: [[x,y],...] orthogonal polyline. Rounded corners r.
function tracePath(pts,r=6){let d=`M${pts[0][0]} ${pts[0][1]}`;for(let i=1;i<pts.length;i++){const [x,y]=pts[i];if(i<pts.length-1){const [px,py]=pts[i-1],[nx,ny]=pts[i+1];const dx1=Math.sign(x-px),dy1=Math.sign(y-py),dx2=Math.sign(nx-x),dy2=Math.sign(ny-y);const rr=Math.min(r,Math.abs(x-px)+Math.abs(y-py),Math.abs(nx-x)+Math.abs(ny-y))/1;d+=` L${x-dx1*rr} ${y-dy1*rr} Q${x} ${y} ${x+dx2*rr} ${y+dy2*rr}`;}else d+=` L${x} ${y}`;}return d;}
function len(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.abs(pts[i][0]-pts[i-1][0])+Math.abs(pts[i][1]-pts[i-1][1]);return L;}
// a glowing pulse that travels along pts once (or loops)
function pulse(svg,pts,{delay=0,dur=900,loop=false,color='var(--signal)',size=6,gap=2400}={}){
  if(RM)return;
  const g=el('g',{class:'pulse'},svg);
  el('rect',{x:-size/2,y:-size/2,width:size,height:size,rx:1.5,fill:color,style:'filter:drop-shadow(0 0 4px rgba(184,242,107,.9))'},g);
  const L=len(pts);let acc=0;const kf=[{transform:`translate(${pts[0][0]}px,${pts[0][1]}px)`,opacity:0,offset:0}];
  for(let i=1;i<pts.length;i++){acc+=Math.abs(pts[i][0]-pts[i-1][0])+Math.abs(pts[i][1]-pts[i-1][1]);kf.push({transform:`translate(${pts[i][0]}px,${pts[i][1]}px)`,opacity:1,offset:Math.min(1,acc/L)});}
  kf[1].opacity=1;kf.splice(1,0,{transform:kf[0].transform,opacity:1,offset:0.02});
  kf[kf.length-1].opacity=0;
  g.animate(kf,{duration:dur,delay,easing:'cubic-bezier(.45,0,.2,1)',iterations:loop?Infinity:1,fill:'both',endDelay:loop?gap:0});
}
function via(svg,x,y,cls='via'){const g=el('g',{class:cls},svg);el('circle',{cx:x,cy:y,r:4.5,class:'via-ring'},g);el('circle',{cx:x,cy:y,r:1.6,class:'via-hole'},g);return g;}

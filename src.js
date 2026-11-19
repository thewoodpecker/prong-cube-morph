(()=>{
const G=window.__GEO;
const C=Math.cos(Math.PI/6), D2R=Math.PI/180;
const TURN=1.2, HOLD=2.0, T=TURN+HOLD, LEAD=0.45;
const qs=new URLSearchParams(location.search);
const LIGHT=qs.get('theme')==='light';
document.documentElement.classList.toggle('light',LIGHT);
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches && !qs.has('motion');
const cv=document.getElementById('cube'), ctx=cv.getContext('2d');
const words=[...document.querySelectorAll('.wm')];
// ---------- easing ----------
const clamp=x=>x<0?0:x>1?1:x;
const ioCubic=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const ioQuint=x=>x<.5?16*x**5:1-Math.pow(-2*x+2,5)/2;
const outCubic=x=>1-Math.pow(1-x,3);
const inCubic=x=>x*x*x;
const outBack=(s=1.70158)=>x=>{const c3=s+1;return 1+c3*Math.pow(x-1,3)+s*Math.pow(x-1,2);};
const arr=(a,delay,dur,e)=>a<=delay?0:a>=delay+dur?1:e((a-delay)/dur);
const dep=(d,delay,dur)=>d<=delay?1:d>=delay+dur?0:1-inCubic((d-delay)/dur);
// ---------- geometry helpers ----------
const rotZ=(p,deg)=>{const r=deg*D2R,c=Math.cos(r),s=Math.sin(r),x=p[0]-50,y=p[1]-50;return [50+x*c-y*s,50+x*s+y*c,p[2]];};
const SIDE=[[0,1],[1,0],[0,-1],[-1,0]]; // local outward normals F0..F3
const faceBasis=i=>{const [nx,ny]=SIDE[i];const U=[ny,-nx,0];const O=[50+nx*50-U[0]*50,50+ny*50-U[1]*50,100];return {n:[nx,ny,0],U,O};};
const fpt=(b,s,t,dpt=0)=>[b.O[0]+b.U[0]*s+b.n[0]*dpt,b.O[1]+b.U[1]*s+b.n[1]*dpt,b.O[2]-t];
const scalePoly=(poly,cx,cy,k)=>poly.map(([s,t])=>[cx+(s-cx)*k,cy+(t-cy)*k]);
const bboxC=polys=>{let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const p of polys)for(const [s,t] of p){a=Math.min(a,s);b=Math.min(b,t);c=Math.max(c,s);d=Math.max(d,t);}return [(a+c)/2,(b+d)/2];};
const glyph=(polys,k,dt=0)=>{if(k<=0.001)return [];const [cx,cy]=bboxC(polys);return polys.map(p=>scalePoly(p,cx,cy,k).map(([s,t])=>[s,t+dt]));};
const rectP=(s0,t0,s1,t1)=>[[s0,t0],[s1,t0],[s1,t1],[s0,t1]];
// ---------- colours ----------
const BG=LIGHT?'#FFFFFF':'#000000', TOP=LIGHT?'#0A0A0A':'#FFFFFF';
const grey=k=>{k=Math.max(-.6,Math.min(1.6,k));const g=LIGHT?255*(0.3-0.1*k):255*(0.3+0.3*k);const v=Math.round(Math.max(0,Math.min(255,g)));return `rgb(${v},${v},${v})`;};
const shadeFor=(n)=>{if(n[2]>0.5)return TOP;return grey(Math.atan2(n[1],n[0])/D2R/90);};
// ---------- projection ----------
let VIEW={s:1,ox:0,oy:0}, TH=0;
const W=p=>rotZ(p,TH);
const proj=p=>{const w=W(p);return [VIEW.ox+((w[0]-w[1])*C)*VIEW.s, VIEW.oy+(((w[0]+w[1])/2-w[2]))*VIEW.s];};
const wn=n=>{const r=TH*D2R,c=Math.cos(r),s=Math.sin(r);return [n[0]*c-n[1]*s,n[0]*s+n[1]*c,n[2]];};
const visible=n=>{const w=wn(n);return w[0]+w[1]+w[2]>1e-4;};
const pathPoly=(pts)=>{ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();};
// ---------- logos ----------
// right-side art & extras as function of a (time since landing) and d (time since departure start)
const LOGOS=[
 { // 0: Roam !ndustries
  L:G.R,
  right(a,d){const e=arr(a,0.05,0.75,outBack(1.1));const k=dep(d,0,0.4);if(e<=0||k<=0)return {holes:[]};
    return {holes:glyph(G.bang,k,-(1-e)*95)};},
  boxes(){return [];}
 },
 { // 1: Roam office (O4)
  L:G.R,
  right(a,d){const holes=[];
    G.win.forEach((w,i)=>{const row=Math.floor(i/3);const k=arr(a,0.1+(2-row)*0.12,0.38,outBack(1.6))*dep(d,row*0.06,0.26);if(k>0.001){const [cx,cy]=bboxC([w]);holes.push(scalePoly(w,cx,cy,k));}});
    const ang=88*arr(a,0.35,0.75,ioCubic)*(d>0?1-ioCubic(clamp(d/0.4)):1);
    return {holes,door:ang>0.3?ang:0};},
  boxes(a,d){const h1=arr(a,0.45,0.55,outBack(1.8))*dep(d,0.05,0.3), h2=arr(a,0.62,0.6,outBack(1.6))*dep(d,0,0.3);const o=[];
    if(h1>0.01)o.push([52,82,18,44,100,100+16*h1]); if(h2>0.01)o.push([22,28,22,28,100,100+46*h2]); return o;}
 },
 { // 2: Prong F
  L:G.P,
  right(){return {holes:[]};},
  boxes(a,d){const o=[];[64,26].forEach((y0,i)=>{const b=arr(a,0.08+i*0.07,0.55,outBack(2.4))*dep(d,i*0.04,0.26);if(b>0.01)o.push([100,100+40*b,y0,y0+8,30,74]);});return o;}
 }
];
// ---------- draw ----------
function drawSide(fi,holes,door){
  const b=faceBasis(fi); if(!visible(b.n))return;
  const quad=[[0,0],[100,0],[100,100],[0,100]].map(([s,t])=>proj(fpt(b,s,t)));
  ctx.save(); ctx.beginPath(); pathPoly(quad); ctx.clip();
  ctx.beginPath(); pathPoly(quad); for(const h of holes) pathPoly(h.map(([s,t])=>proj(fpt(b,s,t))));
  if(door){const [s0,t0,s1,t1]=G.door; pathPoly(rectP(s0,t0,s1,t1).map(([s,t])=>proj(fpt(b,s,t))));}
  const col=shadeFor(wn(b.n)); ctx.fillStyle=col; ctx.fill('evenodd'); ctx.restore();
  ctx.beginPath(); pathPoly(quad); ctx.strokeStyle=col; ctx.lineWidth=0.7; ctx.stroke();
  if(door){ // inward-swinging door, hinged at s0, clipped to the doorway
    const [s0,t0,s1,t1]=G.door, w=s1-s0, r=door*D2R;
    const dq=rectP(s0,t0,s1,t1).map(([s,t])=>proj(fpt(b,s,t)));
    const se=s0+w*Math.cos(r), de=-w*Math.sin(r);
    const slab=[[s0,t0,0],[se,t0,de],[se,t1,de],[s0,t1,0]].map(([s,t,dd])=>proj(fpt(b,s,t,dd)));
    // door leaf normal (outward side) in local coords
    const U=b.U,n=b.n,ln=[n[0]*Math.cos(r)+U[0]*Math.sin(r),n[1]*Math.cos(r)+U[1]*Math.sin(r),0];
    ctx.save(); ctx.beginPath(); pathPoly(dq); ctx.clip(); ctx.beginPath(); pathPoly(slab); ctx.fillStyle=shadeFor(wn(ln)); ctx.fill(); ctx.restore();
  }
}
function drawBox(bx){
  const [x0,x1,y0,y1,z0,z1]=bx;
  const F=[[[1,0,0],[[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[x1,y0,z0]]],[[-1,0,0],[[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[x0,y0,z0]]],
           [[0,1,0],[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]]],[[0,-1,0],[[x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[x0,y0,z0]]],
           [[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]]];
  for(const [n,pts] of F){if(!visible(n))continue;ctx.beginPath();pathPoly(pts.map(proj));ctx.fillStyle=shadeFor(wn(n));ctx.fill();
    ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=0.6;ctx.stroke();}
}
const toLocal=(bx,m)=>{const a=rotZ([bx[0],bx[2],0],-m*90),b=rotZ([bx[1],bx[3],0],-m*90);return [Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1]),bx[4],bx[5]];};
const mod=(a,b)=>((a%b)+b)%b;
function state(tau){
  const n=Math.floor(tau/T), u=tau-n*T, turning=u<TURN, p=clamp(u/TURN);
  TH=REDUCED?n*90:(n-1)*90+90*ioQuint(p);
  const side={}; const add=(fi,h)=>{fi=mod(fi,4);(side[fi]=side[fi]||{holes:[],door:0});side[fi].holes.push(...h.holes||[]);if(h.door)side[fi].door=h.door;};
  const boxes=[];
  const cur=mod(n,3), prv=mod(n-1,3);
  const aC=REDUCED?99:u-TURN, dC=REDUCED?0:Math.max(0,u-(T-LEAD));
  if(turning&&!REDUCED){const aP=99,dP=u+LEAD;
    add(n-1,{holes:glyph(LOGOS[prv].L,1)});
    add(n,LOGOS[prv].right(aP,dP)); LOGOS[prv].boxes(aP,dP).forEach(b=>boxes.push(toLocal(b,n-1)));
    add(n,{holes:glyph(LOGOS[cur].L,p<=0.06?0:p>=0.6?1:outBack(1.4)((p-0.06)/0.54))});
  } else add(n,{holes:glyph(LOGOS[cur].L,1)});
  add(n+1,LOGOS[cur].right(aC,dC)); LOGOS[cur].boxes(aC,dC).forEach(b=>boxes.push(toLocal(b,n)));
  // wordmarks
  const wo=[0,0,0], wy=[0,0,0];
  if(turning&&!REDUCED){wo[prv]=1-ioCubic(clamp(p/0.5)); wy[prv]=-10*ioCubic(clamp(p/0.5)); const e=ioCubic(clamp((p-0.4)/0.6)); wo[cur]=Math.max(wo[cur],e); wy[cur]=10*(1-e);} else {wo[cur]=1;}
  return {side,boxes,wo,wy};
}
function render(tau){
  const st=state(tau);
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height);
  ctx.lineJoin='miter';
  // top
  const top=[[0,0,100],[100,0,100],[100,100,100],[0,100,100]];
  ctx.beginPath(); pathPoly(top.map(proj)); ctx.fillStyle=TOP; ctx.fill(); ctx.strokeStyle=TOP; ctx.lineWidth=0.7; ctx.stroke();
  for(let fi=0;fi<4;fi++){const s=st.side[fi]||{holes:[],door:0}; drawSide(fi,s.holes,s.door);}
  const depth=b=>{const w=W([(b[0]+b[1])/2,(b[2]+b[3])/2,(b[4]+b[5])/2]);return w[0]+w[1]+w[2];};
  st.boxes.sort((a,b)=>depth(a)-depth(b)).forEach(drawBox);
  words.forEach((w,i)=>{w.style.opacity=st.wo[i].toFixed(3); w.style.transform=`translate(-50%, ${st.wy[i].toFixed(2)}px)`;});
}
// seam fix: draw faces slightly expanded? (handled by miter + same-colour stroke on boxes)
function resize(){
  const r=cv.getBoundingClientRect(), dpr=Math.min(3,window.devicePixelRatio||1);
  cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
  // view box: x [-140,140], y [-158,122]
  VIEW.s=cv.width/280; VIEW.ox=cv.width/2; VIEW.oy=cv.height*(158/280);
}
addEventListener('resize',()=>{resize();render(last);});
resize();
let last=TURN, t0=null;
window.__render=t=>{last=t;render(t);};
window.__LOOP={start:TURN,len:3*T};
if(qs.has('capture')){render(TURN);return;}
if(REDUCED){render(TURN);let n=1;setInterval(()=>{cv.style.opacity=0;setTimeout(()=>{last=n*T+TURN;n++;render(last);cv.style.opacity=1;},250);},3200);return;}
const loop=ts=>{if(t0===null)t0=ts;last=TURN+(ts-t0)/1000;render(last);requestAnimationFrame(loop);};
requestAnimationFrame(loop);
})();

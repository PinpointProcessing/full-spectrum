"use strict";
/* D-Day's battle screen, Version 167. Bryan: "for the normal user it still feels way to confusing and messy... How can we make
   this more sound, user friendly, and fun?" What's written over the men now is only what asks for a decision (combat.js's
   DD_SAY keeps a few callouts; overlay.js draws the rest). This file:
   - ddCover(u): how covered a man of the squad you play is from the enemies who could shoot him, as a shield over his head
     (green full cover, yellow half, red in the open);
   - ddDanger(): the field of fire of every enemy machine gun you know about, red on the ground, cut off where something stops it;
   - ddShooters(): an arrow at the screen's edge toward whoever is shooting your men (a ring on him when he's on screen);
   - ddObjective()/ddObjDraw(): one objective always in view, a pill at the top ("Take the square · 80 m") and an arrow at the
     edge toward it (a marker over it when it's on screen). Replaces the place names and the top-centre lines. */

const DD_OK='#5fe08e',DD_HALF='#ffcf4a',DD_OPEN='#ff5a48';
// 2 full cover, 1 half, 0 open, from the worst of the enemies in reach who could see him (seen ones: you know they're there)
function ddCover(u){
  const now=performance.now();if(u._cv&&now-u._cv.t<250)return u._cv.k;   // (four times a second is plenty)
  let k=2;
  for(const e of enemies){
    if(beaten(e)||e.side!=='E'||e.mon||!(e.seen||e.vis))continue;
    if(hyp(e.x-u.x,e.y-u.y)>wRange(e)*(e.gunner?1.45:1.12))continue;
    if(!los(e.x,e.y,u.x,u.y))continue;   // something between: he can't hit him
    const c=coverAt(u.x,u.y,e.x,e.y);if(c<k)k=c;if(!k)break;
  }
  if(k&&typeof peekOf==='function'&&peekOf(u))k=Math.min(k,1);   // leaning out of cover to shoot
  u._cv={t:now,k};return k;
}
function ddShield(x,y,k){
  const s=1.55,col=k>=2?DD_OK:k===1?DD_HALF:DD_OPEN;
  ox.save();ox.translate(x,y);ox.scale(s,s);
  ox.beginPath();ox.moveTo(0,-5);ox.lineTo(4.6,-3.5);ox.lineTo(4.1,1.5);ox.quadraticCurveTo(2.6,4.6,0,5.6);ox.quadraticCurveTo(-2.6,4.6,-4.1,1.5);ox.lineTo(-4.6,-3.5);ox.closePath();
  ox.fillStyle='rgba(8,11,14,.85)';ox.fill();ox.lineWidth=1.3;ox.strokeStyle='rgba(8,11,14,.9)';ox.stroke();
  ox.beginPath();ox.moveTo(0,-3.6);ox.lineTo(3.3,-2.5);ox.lineTo(3,1.1);ox.quadraticCurveTo(1.9,3.4,0,4.1);ox.quadraticCurveTo(-1.9,3.4,-3,1.1);ox.lineTo(-3.3,-2.5);ox.closePath();
  if(k===1){ox.save();ox.clip();ox.fillStyle=col;ox.fillRect(-4,-4,4,9);ox.restore();ox.strokeStyle=col;ox.lineWidth=1;ox.stroke();}   // half cover: half filled
  else{ox.fillStyle=col;ox.fill();}
  if(k===0){ox.fillStyle='#0b0f13';ox.fillRect(-.55,-2.4,1.1,3.3);ox.fillRect(-.55,1.6,1.1,1.1);}   // in the open: an exclamation mark
  ox.restore();
}

// a machine gun's field of fire: rays from the gun across its swing, each stopped where its line is blocked (worked out
// about once a second: the gun doesn't move)
let ddWedgeN=0;   // (at most one field worked out a frame, so several guns don't all land on the same frame)
function ddWedge(e,g,R){
  const W=e._wd;if(W&&(simT-W.t<1.2||ddWedgeN>0)&&W.R===R&&W.x===g.x&&W.a===g.ang)return W.pts;ddWedgeN++;
  const n=16,pts=[];
  for(let i=0;i<=n;i++){const a=g.ang-g.arc+2*g.arc*i/n,dx=Math.cos(a),dy=Math.sin(a);
    let lo=0,hi=R;if(los(g.x,g.y,g.x+dx*R,g.y+dy*R))lo=R;else for(let j=0;j<6;j++){const m=(lo+hi)/2;if(los(g.x,g.y,g.x+dx*m,g.y+dy*m))lo=m;else hi=m;}
    pts.push([g.x+dx*Math.max(lo,30),g.y+dy*Math.max(lo,30)]);}
  e._wd={t:simT,R,x:g.x,a:g.ang,pts};return pts;
}
function ddDanger(now){
  const W=[];ddWedgeN=0;
  for(const e of enemies){
    if(!e.gunner||!e.onGun||beaten(e)||e.side!=='E'||!(e.seen||e.vis))continue;
    const g=e.onGun,R=Math.min(wRange(e)*1.45,640),pts=ddWedge(e,g,R);
    toSBack=false;const S=[toS(g.x,g.y,1)];for(const[x,y]of pts)S.push(toS(x,y,1));if(toSBack)continue;
    W.push({S,hot:simT-(e.shotAtT??-99)<1.2});
  }
  if(!W.length)return;
  // one shape for all of them, filled once (overlapping fields don't stack into a solid red), then each one's far edge
  ox.beginPath();for(const{S}of W){ox.moveTo(S[0][0],S[0][1]);for(let i=1;i<S.length;i++)ox.lineTo(S[i][0],S[i][1]);ox.closePath();}
  ox.fillStyle=W.some(w=>w.hot)?'rgba(255,52,36,.12)':'rgba(255,52,36,.09)';ox.fill('nonzero');
  ox.setLineDash([6,5]);ox.lineWidth=1.5;
  for(const{S,hot}of W){ox.beginPath();ox.moveTo(S[1][0],S[1][1]);for(let i=2;i<S.length;i++)ox.lineTo(S[i][0],S[i][1]);ox.strokeStyle=`rgba(255,90,70,${hot?.6:.35})`;ox.stroke();}
  ox.setLineDash([]);
}
// the screen's usable box: under the buttons at the top, over the squad's bar at the bottom (read from the page about once a second)
let ddBoxC=null;
function ddBox(){
  const t=performance.now();if(ddBoxC&&t-ddBoxC.t<1000&&ddBoxC.w===cw&&ddBoxC.h===ch)return ddBoxC;
  const st=$('#stage'),R=st?st.getBoundingClientRect():{top:0,left:0},sq=$('#sq');let bot=ch-14;
  if(sq&&!sq.hidden&&sq.offsetParent){const r=sq.getBoundingClientRect();if(r.height)bot=Math.min(bot,r.top-R.top-10);}
  const top=cw<560?96:62;ddBoxC={t,w:cw,h:ch,l:16,r:cw-16,top:Math.min(top,bot-80),bot};return ddBoxC;
}
// where a world point is on screen, or which way it lies when it's off it: {on, x, y, dx, dy} (dx,dy a unit screen direction)
function ddWhere(x,y,h){
  const B=ddBox();toSBack=false;const p=toS(x,y,h||0),back=toSBack;
  if(!back&&p[0]>=B.l&&p[0]<=B.r&&p[1]>=B.top&&p[1]<=B.bot)return{on:true,x:p[0],y:p[1]};
  const cx=camT.x,cy=camT.z,d=hyp(x-cx,y-cy)||1;toSBack=false;const a=toS(cx,cy),b=toS(cx+(x-cx)/d*20,cy+(y-cy)/d*20);
  let dx=b[0]-a[0],dy=b[1]-a[1];if(!back&&!toSBack){dx=p[0]-(B.l+B.r)/2;dy=p[1]-(B.top+B.bot)/2;}   // on the far side of the box but in front: straight toward it
  const L=hyp(dx,dy)||1;return{on:false,dx:dx/L,dy:dy/L};
}
// an arrow on the box's edge pointing dx,dy; col its colour, text under it
function ddEdgeArrow(dx,dy,col,text,size){
  const B=ddBox(),cx=(B.l+B.r)/2,cy=(B.top+B.bot)/2,hw=(B.r-B.l)/2-6,hh=(B.bot-B.top)/2-6;
  const k=Math.min(hw/Math.max(1e-6,Math.abs(dx)),hh/Math.max(1e-6,Math.abs(dy))),x=cx+dx*k,y=cy+dy*k,s=size||11,a=Math.atan2(dy,dx);
  ox.save();ox.translate(x,y);ox.rotate(a);ox.beginPath();ox.moveTo(s,0);ox.lineTo(-s*.75,s*.78);ox.lineTo(-s*.35,0);ox.lineTo(-s*.75,-s*.78);ox.closePath();
  ox.fillStyle=col;ox.fill();ox.lineWidth=2;ox.strokeStyle='rgba(8,11,14,.85)';ox.stroke();ox.restore();
  if(text)label(text,clamp(x-dx*24,B.l+20,B.r-20),clamp(y-dy*22,B.top+8,B.bot-8),col,10,700);
}

// whoever has fired on the squad you play in the last 2 s: a ring on him, or an arrow toward him
function ddShooters(now){
  const mine=players.filter(p=>alive(p)&&p.team===dd.active&&!p.inBoat);if(!mine.length)return;
  const S=new Set();for(const e of enemies)if(!beaten(e)&&!e.mon&&e.target&&mine.includes(e.target)&&simT-(e.shotAtT??-99)<2)S.add(e);
  const pu=.5+.5*Math.sin(now*9);let arrows=0;
  for(const e of S){const w=ddWhere(e.x,e.y,14);
    if(w.on){gPath(e.x,e.y,13+pu*3);if(!toSBack){ox.strokeStyle=`rgba(255,60,40,${(.55+pu*.4).toFixed(2)})`;ox.lineWidth=2.4;ox.stroke();}}
    else if(arrows++<4)ddEdgeArrow(w.dx,w.dy,`rgba(255,70,50,${(.75+pu*.25).toFixed(2)})`,null,10);}
}

/* ---------- the objective ---------- */
const ddTitle=s=>s.toLowerCase();
function ddObjective(){
  if(!dd||!dd.land||!dd.land.done||dd.seq||dd.won||state!=='play')return null;
  const mine=players.filter(p=>alive(p)&&p.team===dd.active&&!p.inBoat),ours=mine.length?mine:players.filter(p=>alive(p)&&!p.inBoat);
  const near=(L,f)=>{let b=null,bd=1e9;for(const q of L){const P=f?f(q):q;const d=Math.min(...ours.map(u=>hyp(u.x-P.x,u.y-P.y)),1e9);if(d<bd){bd=d;b=q;}}return b;};
  // a tank in the fight comes first
  const tanks=(dd.tanks||[]).filter(K=>K.hp>0&&!K.left&&!K.hold&&!K.wreck&&ours.some(u=>hyp(u.x-K.x,u.y-K.y)<760));
  if(tanks.length){const K=near(tanks);return{t:dd.counter?'Tank! Field gun or bazooka':'Tank! Bazooka or grenades',x:K.x,y:K.y,h:20,k:'danger'};}
  if(dd.counter){const C=dd.dc;if(!C||C.ph==='intro')return null;
    const s=Math.max(0,Math.ceil((C.ph==='setup'?DCA.setup:DCA.lull)-C.t));
    if(C.cpN)return{t:C.cpT>1?`They're in the command post · ${Math.max(1,Math.ceil(20-C.cpT))}`:'They\'re in the command post',x:DCA.cp.x+60,y:DCA.cp.y+55,k:'danger'};
    const free=C.guns.filter(g=>!g.dead&&!g.man&&!g.going),g=near(free);
    if(C.ph==='setup')return g?{t:`Man the guns · ${s}`,x:g.x,y:g.y,h:10}:{t:`They attack in ${s}`};
    if(C.ph==='lull')return g?{t:`Man the guns · wave ${C.wave+1} in ${s}`,x:g.x,y:g.y,h:10}:{t:`Wave ${C.wave+1} in ${s}`};
    const foes=enemies.filter(e=>e.tag==='w'+C.wave&&!beaten(e)),seen=foes.filter(e=>e.seen||e.vis),f=near(seen);
    return f?{t:`Hold the base · ${foes.length} left`,x:f.x,y:f.y,h:14,k:'danger'}:{t:`Hold the base · wave ${C.wave} of 3`};}
  if(dd.vil){const V=dd.vg;if(!V)return null;
    if(V.ph==='woods'){const fy=Math.min(...ours.map(u=>u.y),900),ty=Math.max(320,Math.min(fy-160,760));return{t:'Through the woods',x:vgTrackX(ty),y:ty};}
    if(V.ph==='field'){const gun=near(enemies.filter(e=>(e.tag==='fh'||e.tag==='ff')&&e.gunner&&!beaten(e)&&(e.seen||e.vis)));
      if(gun)return{t:'Knock out the machine gun',x:gun.x,y:gun.y,h:14,k:'danger'};
      const gp=near(VG.gaps.map(([a,b])=>({x:(a+b)/2,y:VG.hedgeY})));return{t:'Through the hedgerow',x:gp.x,y:gp.y};}
    const left=VG.zones.filter(z=>!V.held[z.k]),n=4-left.length;
    if(left.length){const z=near(left,z=>({x:z.lx,y:z.ly}));return{t:`Take ${ddTitle(z.n)} · ${n}/4`,x:z.lx,y:z.ly};}
    const rest=enemies.filter(e=>!beaten(e)&&e.side==='E'&&e.y<-50),f=near(rest.filter(e=>e.seen||e.vis));
    return f?{t:`Hold the village · ${rest.length} left`,x:f.x,y:f.y,h:14}:{t:'Hold the village'};}
  // the beach and the top
  const b=dd.base;
  const hold=(T,N,F,what,x,y)=>T>0?{t:`Hold ${what} · ${Math.max(1,Math.ceil(4-T))}`,x,y,k:'hold'}:N&&F?{t:`Clear ${what} · ${F} left`,x,y,k:'danger'}:N?{t:`Two men at the door of ${what}`,x,y,k:'hold'}:{t:`Take ${what}`,x,y};
  if(b&&b.open)return hold(b.holdT,b.holdN,b.holdFoes,'the command post',DB.cp.door.x,DB.cp.door.y);
  if(dd.front>-300){const P=DD_ROUTE.find(([x,y])=>y<dd.front-60)||DD_ROUTE[DD_ROUTE.length-1];return{t:dd.front>330?'Get off the beach':'Up the draw to the top',x:P[0]+DDX,y:P[1]};}
  return hold(dd.holdT,dd.holdN,dd.holdFoes,'the barracks',DD_SPOT.door.x+DDX,DD_SPOT.door.y);
}
// the pill at the top (DOM) and, on the map, the arrow or the marker; called from overlay.js every frame
function ddObjDraw(now){
  const el=$('#ddObj');if(!el)return;
  const O=ddObjective();
  if(!O){if(!el.hidden)el.hidden=true;return;}
  const lead=players.filter(p=>alive(p)&&p.team===dd.active&&!p.inBoat);
  let d=null;if(O.x!=null&&lead.length)d=Math.min(...lead.map(u=>hyp(u.x-O.x,u.y-O.y)));
  const m=d!=null&&d>=60?Math.round(d/10):null,txt=O.t+(m?` · ${m} m`:''),k=O.k||'go';
  if(el.dataset.t!==txt){el.dataset.t=txt;el.querySelector('span').textContent=txt;}
  if(el.dataset.k!==k)el.dataset.k=k;el.hidden=false;
  if(O.x==null||dd.fp||m==null)return;   // (there: no arrow; first person has its own view)
  const col=k==='danger'?'#ff7a5c':k==='hold'?'#8fd0ff':'#ffcf4a',w=ddWhere(O.x,O.y,O.h||0);
  if(w.on){const pu=.5+.5*Math.sin(now*4),y=w.y-30-pu*4;   // a chevron over it
    ox.save();ox.beginPath();ox.moveTo(w.x-8,y-8);ox.lineTo(w.x+8,y-8);ox.lineTo(w.x,y+3);ox.closePath();ox.fillStyle=col;ox.fill();ox.lineWidth=2;ox.strokeStyle='rgba(8,11,14,.85)';ox.stroke();ox.restore();}
  else ddEdgeArrow(w.dx,w.dy,col,`${m} m`,13);
}

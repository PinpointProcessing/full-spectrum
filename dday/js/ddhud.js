"use strict";
/* D-Day's battle screen, Version 167. Bryan: "for the normal user it still feels way to confusing and messy... How can we make
   this more sound, user friendly, and fun?" What's written over the men now is only what asks for a decision (combat.js's
   DD_SAY keeps a few callouts; overlay.js draws the rest). This file:
   - ddCover(u): how covered a man of the squad you play is from the enemies who could shoot him, as a shield over his head
     (green full cover, yellow half, red in the open);
   - ddDanger(): the field of fire of every enemy machine gun you know about, red on the ground, cut off where something stops it (off since Version 170, DD_FIELDS);
   - ddShooters(): an arrow at the screen's edge toward whoever is shooting your men (a ring on him when he's on screen);
   - ddObjective()/ddObjDraw(): one objective always in view, a pill at the top ("Take the square · 80 m") and an arrow at the
     edge toward it (a marker over it when it's on screen). Replaces the place names and the top-centre lines. */

const DD_OK='#5fe08e',DD_HALF='#ffcf4a',DD_OPEN='#ff5a48';
// how far a gun's field is drawn: its real reach (ddplay.js's ddFireR, which the shield uses), but no further than 64 m: the hill guns
// reach 100 m and would paint the whole beach, where past 46 m they hit only by luck (Version 155)
const ddReach=e=>Math.min(ddFireR(e),640);
// can a mounted gun swing onto (x,y)? (ddplay.js's ddPick's own test, from the gun, not the man behind it)
function ddCanSwing(e,x,y){if(!e.onGun)return true;let da=Math.atan2(y-e.onGun.y,x-e.onGun.x)-e.onGun.ang;da=Math.atan2(Math.sin(da),Math.cos(da));return Math.abs(da)<=e.onGun.arc;}
// 2 full cover, 1 half, 0 open, from the worst of the enemies in reach who could see him (seen ones: you know they're there)
let ddCoverN=0;   // (at most two shields worked out a frame: ddDanger resets it)
function ddCover(u){
  const now=performance.now();if(u._cv&&(now-u._cv.t<250||ddCoverN>=2))return u._cv.k;ddCoverN++;   // (four times a second is plenty)
  let k=2;
  for(const e of enemies){
    if(beaten(e)||e.side!=='E'||e.mon||!(e.seen||e.vis))continue;
    if(hyp(e.x-u.x,e.y-u.y)>ddFireR(e)||!ddCanSwing(e,u.x,u.y))continue;
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
const _dv=new T.Vector3();
const ddDepth=(x,y)=>-_dv.set(x,gndH(x,y)+1,y).applyMatrix4(camera.matrixWorldInverse).z;   // (how far in front of the camera; below 0 behind it)
// Version 170 (Bryan, after Version 169: "Why is there a large red area when I land on the beach? Can the controlled areas just turn blue"): the machine guns'
// red fields of fire are off; the ground that's ours is blue (ddplay.js's ddBlueRect). The cover shield over each man and the red ring on whoever's shooting stay
const DD_FIELDS=false;
function ddDanger(now){
  ddWedgeN=0;ddCoverN=0;if(!DD_FIELDS)return;   // (the counts the cover shields keep to are still reset every frame)
  const W=[];const lim=Math.max(2,camera.near*3);
  for(const e of enemies){
    if(!e.gunner||!e.onGun||beaten(e)||e.side!=='E'||!(e.seen||e.vis))continue;
    // the field [gun, ray ends...] clipped against a plane just in front of the camera (whatever part of it is behind is cut off, the
    // rest drawn); each point notes whether the stretch after it is the field's far edge, so the dashed line never runs along a cut
    const g=e.onGun,P=[[g.x,g.y],...ddWedge(e,g,ddReach(e))],D=P.map(([x,y])=>ddDepth(x,y)),C=[];
    for(let i=0;i<P.length;i++){const j=(i+1)%P.length,a=P[i],b=P[j],ia=D[i]>=lim,ib=D[j]>=lim,far=i>0&&j>0;
      if(ia)C.push({p:a,s:far});
      if(ia!==ib){const t=(lim-D[i])/(D[j]-D[i]);C.push({p:[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],s:far&&!ia});}}
    if(C.length<3)continue;
    const S=[],F=[];for(const c of C){toSBack=false;const q=toS(c.p[0],c.p[1],1);if(toSBack)continue;S.push(q);F.push(c.s);}
    if(S.length<3)continue;W.push({S,F,hot:simT-(e.shotAtT??-99)<1.2});
  }
  if(!W.length)return;
  // one shape for all of them, filled once (overlapping fields don't stack into a solid red), then each one's far edge
  ox.beginPath();for(const{S}of W){ox.moveTo(S[0][0],S[0][1]);for(let i=1;i<S.length;i++)ox.lineTo(S[i][0],S[i][1]);ox.closePath();}
  ox.fillStyle=W.some(w=>w.hot)?'rgba(255,52,36,.12)':'rgba(255,52,36,.09)';ox.fill('nonzero');
  ox.setLineDash([6,5]);ox.lineWidth=1.5;
  for(const{S,F,hot}of W){ox.beginPath();for(let i=0;i<S.length;i++)if(F[i]){const b=S[(i+1)%S.length];ox.moveTo(S[i][0],S[i][1]);ox.lineTo(b[0],b[1]);}ox.strokeStyle=`rgba(255,90,70,${hot?.6:.35})`;ox.stroke();}
  ox.setLineDash([]);
}

// the screen's usable box: under the buttons at the top, over the squad's bar at the bottom (read from the page about once a second)
let ddBoxC=null;
function ddBox(){
  const t=performance.now(),po0=$('#ddObj'),k=(po0&&!po0.hidden?1:0)+(document.body.classList.contains('fp')?2:0);   // (the pill showing or not, first person or not: either moves the top)
  if(ddBoxC&&t-ddBoxC.t<1000&&ddBoxC.w===cw&&ddBoxC.h===ch&&ddBoxC.k===k)return ddBoxC;
  const st=$('#stage'),R=st?st.getBoundingClientRect():{top:0,left:0},sq=$('#sq');let bot=ch-14;
  if(sq&&!sq.hidden&&sq.offsetParent){const r=sq.getBoundingClientRect();if(r.height)bot=Math.min(bot,r.top-R.top-10);}
  let top=cw<560?96:62;const po=$('#ddObj');if(po&&!po.hidden){const r=po.getBoundingClientRect();if(r.height)top=Math.max(top,r.bottom-R.top+8);}   // (under the objective pill, wherever it sits)
  ddBoxC={t,k,w:cw,h:ch,l:16,r:cw-16,top:Math.min(top,bot-80),bot};return ddBoxC;
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

// whoever has fired on the squad you play in the last 2 s, or whose shell is coming down on it or landed by it in the last 3 s (ddplay.js's ddShell):
// a ring on him, or an arrow toward him
function ddShooters(now){
  const mine=players.filter(p=>alive(p)&&p.team===dd.active&&!p.inBoat);if(!mine.length)return;
  const hit=L=>simT<L.t+3&&mine.some(u=>hyp(u.x-L.x,u.y-L.y)<(L.R||50)+60);
  const S=new Set();for(const e of enemies){if(beaten(e)||e.mon)continue;
    if(e.target&&mine.includes(e.target)&&simT-(e.shotAtT??-99)<2)S.add(e);
    if((e.shells||[]).some(hit))S.add(e);}   // (the heavy gun, the cannon, the artillery, mortars, the grenadier)
  for(const K of dd.tanks||[])if(K.hp>0&&(K.shells||[]).some(hit))S.add(K);
  if(dd.offShells){dd.offShells=dd.offShells.filter(L=>simT<L.t+3);for(const L of dd.offShells)if(hit(L))S.add({x:L.fx,y:L.fy});}   // (fired from off the map: the arrow toward where it came from)
  const pu=.5+.5*Math.sin(now*9);let arrows=0;
  for(const e of S){const w=ddWhere(e.x,e.y,14);
    if(w.on){gPath(e.x,e.y,13+pu*3);if(!toSBack){ox.strokeStyle=`rgba(255,60,40,${(.55+pu*.4).toFixed(2)})`;ox.lineWidth=2.4;ox.stroke();}}
    else if(arrows++<4)ddEdgeArrow(w.dx,w.dy,`rgba(255,70,50,${(.75+pu*.25).toFixed(2)})`,null,10);}
}

/* ---------- the objective ----------
   One step at a time, the first that applies, each with where it is ({t text, x,y,h the spot, k 'danger'|'hold', nod: no distance
   in the pill, for a spot that keeps moving ahead of you). Worked out from the battle's own state, so it can't fall behind it. */
const ddTitle=s=>s.toLowerCase();
// how far up DD_ROUTE from y0 to y1 (y1 further north), for the pill on the way up
function ddRouteLeft(y0,y1){let d=0,px=ddRouteX(y0);for(let y=y0-10;y>=y1;y-=10){const x=ddRouteX(y);d+=hyp(x-px,10);px=x;}return d;}
function ddObjective(){
  if(!dd||!dd.land||!dd.land.done||dd.seq||dd.won||state!=='play')return null;
  const mine=players.filter(p=>alive(p)&&p.team===dd.active&&!p.inBoat),ours=mine.length?mine:players.filter(p=>alive(p)&&!p.inBoat);if(!ours.length)return null;
  const dM=P=>Math.min(...ours.map(u=>hyp(u.x-P.x,u.y-P.y))),near=(L,f)=>{let b=null,bd=1e9;for(const q of L){const d=dM(f?f(q):q);if(d<bd){bd=d;b=q;}}return b;};
  const known=e=>!beaten(e)&&(e.seen||e.vis),Ly=Math.min(...ours.map(u=>u.y));   // (Ly: the squad's man furthest up the map)
  // the counterattack's command post: while their clock runs it comes before anything (losing it loses the base)
  if(dd.counter&&dd.dc&&dd.dc.ph!=='intro'&&dd.dc.cpN&&dd.dc.cpT>0){const C=dd.dc,K=(dd.tanks||[]).find(K=>K.hp>0&&dcIn(K,DCA.cpZone));
    return{t:`${K?'Tank in the command post':'Retake the command post'} · ${Math.max(1,Math.ceil(20-C.cpT))}`,x:K?K.x:975,y:K?K.y:705,h:K?20:0,k:'danger'};}   // (975,705: in front of its west door, outside the building)
  // a tank in the fight comes first (one dug in counts: it fires from its pit; one waiting to be let loose doesn't)
  const tank=near((dd.tanks||[]).filter(K=>K.hp>0&&!K.left&&!K.retreat&&!K.wreck&&(dd.counter?!K.hold:(K.range||0)>1)&&dM(K)<(K.range||520)+120));
  if(tank)return{t:dd.counter?'Tank! Field gun or bazooka':'Tank! Bazooka or grenades',x:tank.x,y:tank.y,h:20,k:'danger'};
  if(dd.counter){const C=dd.dc;if(!C||C.ph==='intro')return null;
    if(C.ph==='setup'||C.ph==='lull'){const s=Math.max(0,Math.ceil((C.ph==='setup'?DCA.setup:DCA.lull)-C.t));
      const free=C.guns.filter(g=>!g.dead&&!(g.man&&!g.man.npc)&&!(g.going&&!g.going.npc)),g=ours.some(u=>!u.dcGun)?near(free,dcSeat):null;   // (a gun one of the other troops holds counts as free: a squad man takes it over)
      const t=C.ph==='setup'?`They attack in ${s}`:`Wave ${C.wave+1} in ${s}`;
      if(!g)return{t};const P=dcSeat(g);return{t:`Man the guns · ${s}`,x:P.x,y:P.y,h:10};}
    const n=enemies.filter(e=>e.tag==='w'+C.wave&&!beaten(e)).length+(dd.tanks||[]).filter(K=>K.w===C.wave&&K.hp>0).length,f=near(enemies.filter(e=>e.tag==='w'+C.wave&&known(e)));
    return f?{t:`Hold the base · ${n} left`,x:f.x,y:f.y,h:14,k:'danger'}:{t:`Hold the base · ${n} left`};}
  if(dd.vil){const V=dd.vg;if(!V)return null;
    if(V.ph==='woods')return{t:'To the edge of the woods',x:VG.road,y:vgEdge(VG.road)};
    if(V.ph==='field'){const gun=near(enemies.filter(e=>(e.tag==='fh'||e.tag==='ff')&&e.gunner&&known(e)&&dM(e)<260));
      if(gun)return{t:'Knock out the machine gun',x:gun.x,y:gun.y,h:14,k:'danger'};
      const road=enemies.some(e=>e.tag==='fh'&&e.gunner&&!beaten(e)),G=near(VG.gaps.filter(g=>!(road&&g[0]===672)),g=>({x:(g[0]+g[1])/2,y:-43}));   // (not the road's gap while its gun is up: round by the orchard or the farm)
      return{t:'Through the hedgerow',x:(G[0]+G[1])/2,y:VG.hedgeY+7};}
    const truck=near((V.trucks||[]).filter(K=>K.hp>0&&(K.ph==='drive'||K.ph==='unload')&&dM(K)<450));
    if(truck)return{t:'Blow up the truck',x:truck.x,y:truck.y,h:12,k:'danger'};
    const left=VG.zones.filter(z=>!V.held[z.k]),SP={gate:[700,-300],square:[700,-505],church:[500,-624],hall:[870,-598]};   // (standing spots: the hall's and the church's label points are inside the buildings)
    if(left.length){const z=near(left,z=>({x:SP[z.k][0],y:SP[z.k][1]})),nm=ddTitle(z.n),inz=enemies.filter(e=>!beaten(e)&&e.x>z.x0&&e.x<z.x1&&e.y>z.y0&&e.y<z.y1);
      const sn=inz.length&&inz.every(e=>e.weapon==='sniper')?inz[0]:null,f=near(inz.filter(known));
      if(sn)return{t:'Shoot the sniper in the tower',x:sn.x,y:sn.y,h:(sn.elev||0)+14,k:'danger'};
      return inz.length?{t:`Clear ${nm} · ${inz.length} left`,x:f?f.x:SP[z.k][0],y:f?f.y:SP[z.k][1],h:f?14:0,k:'danger'}:{t:`Take ${nm} · ${4-left.length}/4`,x:SP[z.k][0],y:SP[z.k][1]};}
    if(!V.r2)return{t:'Hold the village · more coming',k:'hold'};
    const rest=enemies.filter(e=>!beaten(e)&&e.side==='E'&&e.y<-160),f=near(rest.filter(known));
    return f?{t:`Clear the village · ${Math.max(1,rest.length-2)} more`,x:f.x,y:f.y,h:14}:{t:'Clear the village'};}
  // the beach and the top
  const hold=(T,N,F,what,door,R)=>{const d=dM(door);
    if(F){const f=near(enemies.filter(e=>known(e)&&hyp(e.x-door.x,e.y-door.y)<R));return{t:`Clear ${what} · ${F} left`,x:f?f.x:door.x,y:f?f.y:door.y,h:f?14:0,k:'danger'};}
    if(T>0)return{t:`Hold ${what} · ${Math.max(1,Math.ceil(4-T))}`,x:door.x,y:door.y,k:'hold'};
    if(d<200)return{t:'Two men at the door',x:door.x,y:door.y,k:'hold'};
    return{t:`Take ${what}`,x:door.x,y:door.y};};
  const b=dd.base;
  if(b&&b.open&&Ly<=-300)return hold(b.holdT,b.holdN,b.holdFoes,'the command post',{x:DB.cp.door.x,y:DB.cp.door.y},240);
  if(Ly>=340){const W=(dd.wires||[]).filter(o=>o.y===340),lx=ours.reduce((a,u)=>a+u.x,0)/ours.length,G=W.filter(o=>o.gone&&Math.abs(o.x+o.w/2-lx)<150),o=near(G.length?G:W.filter(o=>!o.gone),o=>({x:o.x+o.w/2,y:344}));
    return o?{t:G.length?'Through the gap in the wire':'Grenade the wire, or climb it',x:o.x+o.w/2,y:344}:{t:'Get off the beach',x:ddRouteX(300),y:300};}
  if(Ly>200){const H=dd.held||{},P={left:{x:DD_SPOT.leftMG.x+DDX,y:262,n:'the left bunker'},pill:{x:DD_SPOT.pill.x+DDX,y:262,n:'the pillbox'}},k=near(['left','pill'].filter(k=>!H[k]),k=>P[k]);
    if(k)return{t:`Take ${P[k].n}`,x:P[k].x,y:P[k].y};}
  if(Ly>-300){const g=enemies.find(e=>e.tag==='draw'&&e.gunner&&known(e));
    if(g&&Ly>-160)return{t:'Knock out the MG nest',x:g.x,y:g.y,h:14,k:'danger'};
    const ty=Math.max(-340,Ly-120);return{t:'Up the draw to the top',x:ddRouteX(ty),y:ty,far:ddRouteLeft(Ly,-340)};}
  const g=near(enemies.filter(e=>e.tag==='top'&&e.gunner&&known(e)&&dM(e)<300));
  if(g&&!(b&&b.open))return{t:'Knock out the machine gun',x:g.x,y:g.y,h:14,k:'danger'};
  if(!(b&&b.open))return hold(dd.holdT,dd.holdN,dd.holdFoes,'the barracks',{x:DD_SPOT.door.x+DDX,y:DD_SPOT.door.y},200);
  return{t:'Up the draw to the top',x:ddRouteX(-340),y:-340};
}
// the pill at the top (DOM) and, on the map, the arrow or the marker; called from overlay.js every frame
function ddObjDraw(now){
  const el=$('#ddObj');if(!el)return;
  const O=ddObjective();
  if(!O){if(!el.hidden)el.hidden=true;return;}
  const lead=players.filter(p=>alive(p)&&p.team===dd.active&&!p.inBoat);
  let d=null;if(O.x!=null&&lead.length)d=O.far!=null?O.far:Math.min(...lead.map(u=>hyp(u.x-O.x,u.y-O.y)));
  const m=d!=null&&d>=60?Math.round(d/10):null,txt=O.t+(m?` · ${m} m`:''),k=O.k||'go';
  if(el.dataset.t!==txt){el.dataset.t=txt;el.querySelector('span').textContent=txt;}
  if(el.dataset.k!==k)el.dataset.k=k;el.hidden=false;
  if(O.x==null||dd.fp||m==null)return;   // (there: no arrow; first person has its own view)
  const col=k==='danger'?'#ff7a5c':k==='hold'?'#8fd0ff':'#ffcf4a',w=ddWhere(O.x,O.y,O.h||0);
  if(w.on){const pu=.5+.5*Math.sin(now*4),y=Math.max(w.y-30-pu*4,ddBox().top+10);   // a chevron over it (never up under the pill)
    ox.save();ox.beginPath();ox.moveTo(w.x-8,y-8);ox.lineTo(w.x+8,y-8);ox.lineTo(w.x,y+3);ox.closePath();ox.fillStyle=col;ox.fill();ox.lineWidth=2;ox.strokeStyle='rgba(8,11,14,.85)';ox.stroke();ox.restore();}
  else ddEdgeArrow(w.dx,w.dy,col,`${m} m`,13);
}

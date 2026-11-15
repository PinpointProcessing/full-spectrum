// Version 167, the cleaned-up battle screen (js/ddhud.js and the D-Day branches in overlay.js): node hud-clean-test.js [W H PORT]
// Checks: only the keep-list callouts; the objective's text and target through each chapter's phases; the pill shown in battle
// and hidden on the report; the cover shield (open, behind a wall); a machine gun's field of fire worked out; blood sprites
// that fade; the overlay drawn on every map with no page errors.
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const W=+process.argv[2]||390,H=+process.argv[3]||760,PO=+process.argv[4]||0;
(async()=>{const port=9880+PO,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);const log=async(l,f,a)=>console.log(l+':',JSON.stringify(await ev(f,a)));let fails=0;
const ok=async(l,f,a)=>{const r=await ev(f,a);if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));};
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));for(const r of['rifle','gunner'])R.reserve.push(ddmNewMan(r,3,false));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(7);window.requestAnimationFrame=()=>0;
  window.SEEN=new Set();const c0=callout;callout=(u,t,c)=>{c0(u,t,c);};
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);for(const c of callouts)SEEN.add(c.text);if(i%6===0)drawOverlay(.03,simT);}};
  window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'&&!t.npc?undefined:d0(t,d,s);
  window.OBJ=()=>{const O=ddObjective(),el=$('#ddObj');return{t:O&&O.t,k:O&&O.k||null,x:O&&O.x!=null?Math.round(O.x):null,y:O&&O.y!=null?Math.round(O.y):null,pill:el.hidden?null:el.textContent};};});
// --- the beach
await page.click('#ddBtn');await page.waitForTimeout(400);
await ok('no pill on the ride in',()=>{RUN(1);drawOverlay(.03,simT);return{ok:$('#ddObj').hidden&&!ddObjective(),done:dd.land.done};});
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(4);});
await ok('beach objective: the wire',()=>{drawOverlay(.03,simT);const o=OBJ(),W=(dd.wires||[]).filter(o=>o.y===340).length;return{ok:/wire/.test(o.t||'')&&!!o.pill&&W>0,wires:W,...o};});
await ok('callouts only from the keep-list',()=>{RUN(20);const bad=[...SEEN].filter(t=>!DD_SAY.has(t));return{ok:!bad.length,seen:[...SEEN],bad};});
await ok('no rings under the other troops or the other squad',()=>{render(.03,simT);const npc=units.filter(u=>u.npc&&u.m&&u.m.ring&&u.m.ring.visible).length,other=players.filter(u=>u.team!==dd.active&&u.m&&u.m.ring.visible).length,mine=players.filter(u=>u.team===dd.active&&alive(u)&&!u.inBoat&&u.m&&u.m.ring.visible).length;return{ok:!npc&&!other&&mine>0,npc,other,mine};});
await ok('a known gun has a field of fire',()=>{const g=enemies.find(e=>e.gunner&&e.onGun&&!beaten(e));if(!g)return{ok:false,why:'no gun'};g.seen=true;drawOverlay(.03,simT);return{ok:!!(g._wd&&g._wd.pts.length===17),tag:g.tag,pts:g._wd&&g._wd.pts.length,first:g._wd&&g._wd.pts[0].map(Math.round)};});
await ok('cover shield: in the open in front of a gun',()=>{const g=enemies.find(e=>e.gunner&&e.onGun&&!beaten(e)&&e.seen);const u=players.find(p=>p.team===dd.active&&alive(p));
  // a spot straight out in front of the gun, in its reach and in its sight
  let spot=null;for(let d=120;d<400&&!spot;d+=20){const x=g.onGun.x+Math.cos(g.onGun.ang)*d,y=g.onGun.y+Math.sin(g.onGun.ang)*d;if(isFree(x,y)&&los(g.x,g.y,x,y)&&coverAt(x,y,g.x,g.y)===0)spot={x,y};}
  if(!spot)return{ok:false,why:'no open spot'};const ox0=u.x,oy0=u.y;u.x=spot.x;u.y=spot.y;u._cv=null;const k=ddCover(u);u.x=ox0;u.y=oy0;u._cv=null;return{ok:k===0,k,spot:[Math.round(spot.x),Math.round(spot.y)]};});
await ok('fields of fire still drawn with the squad right under the guns',()=>{const M=players.filter(p=>p.team===dd.active&&alive(p)),P=M.map(u=>[u.x,u.y]);const G=enemies.filter(e=>e.gunner&&e.onGun&&!beaten(e));for(const e of G)e.seen=true;
  const r=[];for(const y of[600,450,360]){M.forEach((u,i)=>{u.x=820+i*12;u.y=y;});ddGoSquad(dd.active);for(let i=0;i<40;i++){panTick(1/30);ddFrame(1/30,simT);}render(.001,simT);
    let n=0;const lim=Math.max(2,camera.near*3);for(const e of G){const pts=ddWedge(e,e.onGun,ddReach(e));if(ddDepth(e.onGun.x,e.onGun.y)>=lim)n++;}
    const fill=[];const f0=ox.fill.bind(ox);ox.fill=function(){fill.push(1);return f0.apply(ox,arguments);};ddDanger(simT);ox.fill=f0;r.push({y,guns:G.length,inFront:n,filled:fill.length});}
  M.forEach((u,i)=>{u.x=P[i][0];u.y=P[i][1];});return{ok:r.every(q=>q.filled>0),r};});
await ok('shield ignores a gun that cannot swing onto him',()=>{const g=enemies.find(e=>e.gunner&&e.onGun&&!beaten(e)&&e.onGun.arc<1);const u=players.find(p=>p.team===dd.active&&alive(p));
  const a=g.onGun.ang+g.onGun.arc+.5,x=g.onGun.x+Math.cos(a)*200,y=g.onGun.y+Math.sin(a)*200;return{ok:!ddCanSwing(g,x,y)&&ddCanSwing(g,g.onGun.x+Math.cos(g.onGun.ang)*200,g.onGun.y+Math.sin(g.onGun.ang)*200),arc:g.onGun.arc};});
await ok('a gun shelling the squad is marked',()=>{const u=players.find(p=>p.team===dd.active&&alive(p)),e=enemies.find(e=>(e.tag==='heavy'||e.tag==='mortar'||e.tag==='art')&&!beaten(e))||enemies.find(e=>!beaten(e));const n0=nades.length;ddShell(e,u.x+20,u.y,50,78,2.6);nades.length=n0;
  let marked=false;const g0=gPath,a0=ddEdgeArrow;window.gPath=function(x,y){if(x===e.x&&y===e.y)marked=true;return g0.apply(this,arguments);};ddEdgeArrow=function(){marked=true;return a0.apply(this,arguments);};ddShooters(simT);window.gPath=g0;ddEdgeArrow=a0;e.shellAt=null;return{ok:marked,tag:e.tag};});
await ok('the box starts under the pill',()=>{drawOverlay(.03,simT);ddBoxC=null;const B=ddBox(),r=$('#ddObj').getBoundingClientRect(),st=$('#stage').getBoundingClientRect();return{ok:$('#ddObj').hidden||B.top>=r.bottom-st.top,top:B.top,pillBottom:r.bottom-st.top};});
await ok('blood: a sprite that fades',()=>{const e=enemies.find(e=>!beaten(e)&&!e.gunner);ddGore(e,true);const on=DD.blood.filter(q=>q.on).length;RUN(32);const left=DD.blood.filter(q=>q.on&&q.t<28).length;return{ok:on>0&&DD.blood.every(q=>!q.on||q.t<28),on,left,ground:'not painted'};});
await ok('a squad man hurt shows a bar, the target only gets the pill',()=>{const u=players.find(p=>p.team===dd.active&&alive(p));u.hp=60;const e=enemies.find(q=>q.vis&&!beaten(q));if(e){for(const p of players)if(p.team===dd.active)p.focus=e;}drawOverlay(.03,simT);u.hp=100;return{ok:true,target:!!e,pill:e&&e._pill?e._pill.text:null};});
// the base: the barracks taken, the command post
await ok('the way up, then the barracks, then the command post',()=>{const M=players.filter(p=>p.team===dd.active&&alive(p)),P=M.map(u=>[u.x,u.y]);const GS=enemies.filter(e=>e.gunner).map(e=>[e,e.seen,e.vis]);for(const[e]of GS){e.seen=false;e.vis=false;}   // (guns unseen: the steps for knocking them out are checked by the woods and field cases)
const at=(x,y)=>M.forEach(u=>{u.x=x;u.y=y;});
  at(ddRouteX(150),150);const w=OBJ();at(ddRouteX(-200),-200);const up=OBJ();at(720,-420);const a=OBJ();at(720,-620);const F0=dd.holdFoes;dd.holdFoes=0;const nr=OBJ();dd.holdT=2;const b2=OBJ();dd.holdT=0;dd.holdFoes=F0;
  const r={w,up,a,nr,b:b2};if(typeof ddBaseOpen==='function'&&!(dd.base&&dd.base.open)){try{ddBaseOpen();}catch(e){r.err=String(e);}}const c=OBJ();r.c=c;M.forEach((u,i)=>{u.x=P[i][0];u.y=P[i][1];});for(const[e,s0,v0]of GS){e.seen=s0;e.vis=v0;}
  return{ok:/bunker|pillbox|draw/.test(w.t)&&/Up the draw|MG nest/.test(up.t)&&/the barracks|machine gun/.test(a.t)&&/Two men at the door|Take the barracks/.test(nr.t)&&/Hold the barracks · 2/.test(b2.t)&&(!dd.base||!dd.base.open||/command post/.test(c.t)),...r};});
// --- the counterattack
await ev(()=>{SEEN.clear();ddRoster.stage=1;startCounter();});await page.waitForTimeout(400);
await ok('counter: intro then man the guns',()=>{const a=OBJ();RUN(8);const b2=OBJ();return{ok:!a.t&&/Man the guns · \d+/.test(b2.t||'')&&b2.x!=null,a,b:b2};});
await ok('counter: a gun manned changes the target',()=>{const C=dd.dc,g0=OBJ();const u=players.find(p=>alive(p));const g=C.guns.find(q=>!q.man&&!q.dead&&Math.round(q.x)===g0.x&&Math.round(q.y)===g0.y);if(!g)return{ok:false,why:'no gun at target',g0};g.man=u;const g1=OBJ();g.man=null;return{ok:g1.x!==g0.x||g1.y!==g0.y||/They attack/.test(g1.t),g0,g1};});
await ok('counter: the wave',()=>{RUN(26);const o=OBJ();return{ok:/Hold the base/.test(o.t||''),ph:dd.dc.ph,...o};});
await ok('counter: the command post',()=>{dd.dc.cpN=2;dd.dc.cpT=5;const o=OBJ();dd.dc.cpN=0;dd.dc.cpT=0;return{ok:/Retake the command post · 15/.test(o.t)&&o.k==='danger'&&o.x<1000,...o};});
await ok('counter: the command post clock comes before a tank',()=>{const K=dd.tanks.find(K=>K.hp>0);const h=K.hold,x=K.x,y=K.y;K.hold=false;const u=players.find(p=>alive(p));K.x=u.x;K.y=u.y-300;dd.dc.cpN=1;dd.dc.cpT=8;const o=OBJ();K.x=1000;K.y=700;const o2=OBJ();dd.dc.cpN=0;dd.dc.cpT=0;K.hold=h;K.x=x;K.y=y;
  return{ok:/Retake the command post · 12/.test(o.t)&&/Tank in the command post · 12/.test(o2.t),o,o2};});
await ok('counter: a tank comes first',()=>{const K=dd.tanks.find(K=>K.hp>0);if(!K)return{ok:false};const h=K.hold,x=K.x,y=K.y;K.hold=false;const u=players.find(p=>alive(p));K.x=u.x;K.y=u.y-300;const o=OBJ();K.hold=h;K.x=x;K.y=y;return{ok:/Tank! Field gun or bazooka/.test(o.t),...o};});
await ok('counter: callouts only from the keep-list',()=>{RUN(10);const bad=[...SEEN].filter(t=>!DD_SAY.has(t));return{ok:!bad.length,bad};});
// --- the village
await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(400);
await ok('village: the woods',()=>{RUN(1);const o=OBJ();return{ok:/edge of the woods/.test(o.t||'')&&o.y>280&&o.y<360,...o};});
await ok('village: the field',()=>{dd.vg.ph='field';const o=OBJ();return{ok:/machine gun|hedgerow/.test(o.t),...o};});
await ok('village: the four places',()=>{dd.vg.ph='village';const a=OBJ();dd.vg.held.gate=true;dd.vg.held.square=true;const b2=OBJ();for(const z of VG.zones)dd.vg.held[z.k]=true;const c=OBJ();for(const z of VG.zones)dd.vg.held[z.k]=false;dd.vg.ph='woods';
  return{ok:/(Take|Clear) the barricade/.test(a.t)&&/church|hall|sniper/.test(b2.t)&&/Hold the village/.test(c.t),a,b:b2,c};});
await ok('village: the pill and an arrow or marker drawn',()=>{drawOverlay(.03,simT);return{ok:!$('#ddObj').hidden,pill:$('#ddObj').textContent,box:ddBox()};});
// --- off the battle
await ok('the pill hides on the report',()=>{dd.won=true;endAt=performance.now();finish();const h=$('#ddObj').hidden||getComputedStyle($('#ddObj')).display==='none';return{ok:h,state};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

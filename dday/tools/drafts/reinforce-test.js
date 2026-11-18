// Version 170: where the reserves come in, and everyone down (js/ddplay.js's ddSpawnAt, ddAllDown; ddvillage.js's vgFrom; ddcounter.js's dcReplace),
// the red fields gone and ours blue (ddhud.js's DD_FIELDS, ddplay.js's ddBlueRect), the range circles while a tool is dragged (ddctl.js's ddcReach).
// Since Version 187 the places taken here are the left bunker and the upper bunker (the pillbox isn't one any more). node reinforce-test.js [W H PORT]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const W=+process.argv[2]||390,H=+process.argv[3]||760,PO=+process.argv[4]||0;
(async()=>{const port=9940+PO,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);let fails=0;
const ok=async(l,f,a)=>{let r;try{r=await ev(f,a);}catch(e){r={ok:false,err:String(e).slice(0,300)};}if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));return r;};
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));for(let i=0;i<6;i++)R.reserve.push(ddmNewMan(['rifle','gunner','medic'][i%3],3,false));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(5);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);if(i%6===0)drawOverlay(.03,simT);}};
  window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'&&!t.npc?undefined:d0(t,d,s);
  window.BAN=[];const b0=banner;banner=function(t){BAN.push(t);return b0.apply(this,arguments);};
  window.DOWN=L=>{for(const p of L){Object.assign(p,{downed:true,hp:0,bleed:DD_BLEED,critical:false,path:[]});}};});
// --- the beach
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);});
await ok('no red fields of fire on the beach; the beach blue',()=>{const G=enemies.filter(e=>e.gunner&&e.onGun&&!beaten(e));for(const e of G)e.seen=true;let red=0,blue=0;const f0=ox.fill.bind(ox);
  ox.fill=function(){const s=String(ox.fillStyle);if(/255,\s*52,\s*36/.test(s))red++;if(/96,\s*165,\s*255/.test(s)||/#60a5ff/i.test(s))blue++;return f0.apply(ox,arguments);};drawOverlay(.03,simT);ox.fill=f0;
  return{ok:!DD_FIELDS&&red===0&&!!(dd.held&&dd.held.beach)&&blue>0&&(dd.heldOrder||[])[0]==='beach',red,blue,order:dd.heldOrder};});
await ok('cover shields still worked out every frame',()=>{const M=players.filter(p=>p.team===dd.active&&alive(p));for(const u of M)u._cv=null;const t0=performance.now();for(let i=0;i<4;i++){drawOverlay(.03,simT);}return{ok:M.filter(u=>u._cv).length>=Math.min(2,M.length),shields:M.filter(u=>u._cv).length};});
await ok('the beach alone: replacements by boat',()=>({ok:ddSpawnAt()===null,order:dd.heldOrder}));
await ok('two places taken: from the first',()=>{dd.heldOrder=['beach','left','nest'];dd.held.left=dd.held.nest=true;const s=ddSpawnAt();return{ok:!!s&&/left bunker/.test(s.n),from:s&&s.n};});
await ok('one place taken after the beach: still the boat',()=>{dd.heldOrder=['beach','left'];return{ok:ddSpawnAt()===null};});
await ok('the barracks taken: from the place taken before it',()=>{dd.heldOrder=['beach','left','nest','draw','art'];const b0=dd.blown.barracks;dd.blown.barracks=true;const s=ddSpawnAt();dd.blown.barracks=b0;return{ok:!!s&&/artillery/.test(s.n),from:s&&s.n};});
await ok('a man lost: his replacement comes up at the place before the last',()=>{dd.heldOrder=['beach','left','nest'];const u=players.find(p=>p.team==='A'&&alive(p)&&p.ddRole==='medic')||players.find(p=>p.team==='A'&&alive(p));BAN.length=0;u.gone=true;ddKill(u,'test');   // (the medic: nobody waits to raise him)
  let n=null;for(let i=0;i<48&&!n;i++){RUN(.25);n=players.find(p=>p.team==='A'&&!p.dead&&p.id===u.id0);}
  const L={x:DD_SPAWN.left[0]+DDX,y:DD_SPAWN.left[1]};return{ok:!!n&&hyp(n.x-L.x,n.y-L.y)<60&&BAN.some(t=>/from the left bunker/.test(t)),at:n&&[Math.round(n.x),Math.round(n.y)],spawn:[L.x,L.y],banners:BAN.slice(-2)};});
await ok('everyone down: dead at once, every replacement at once, one banner, a squad picked',()=>{const N=players.length,pool0=dd.pool;BAN.length=0;DOWN(players.filter(p=>!p.dead));const t0=simT;let t=0;
  while(t<6&&!(players.filter(alive).length>=Math.min(N,pool0))){RUN(.25);t+=.25;}
  const up=players.filter(alive).length,rush=BAN.filter(s=>/Everyone was down/.test(s)).length,joins=BAN.filter(s=>/ joins /.test(s)).length;
  return{ok:up>=Math.min(N,pool0)&&t<3&&rush===1&&joins===0&&sel.length>0&&sel.every(alive),took:+t.toFixed(2),up,pool:pool0,banners:BAN.slice(0,3),sel:sel.length};});
await ok('everyone down with nobody left in reserve: the battle is lost at once',()=>{dd.pool=0;dd.queue.length=0;DOWN(players.filter(p=>!p.dead));let t=0;while(t<5&&!endAt){RUN(.25);t+=.25;}const r={ok:!!endAt&&dd.over&&t<2,took:t};dd.over=false;endAt=0;return r;});
// the reach while a tool is in hand (Version 173: clicked into hand, no dragging)
await ev(()=>{startDDay();});await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);hud();drawOverlay(.03,simT);});
{const a=await ev(()=>{const b=document.querySelector('#sq .sq-tool[data-k="nade"]');const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2];});await page.mouse.click(a[0],a[1]);
 await ok('a grenade clicked into hand: the reach of the man holding it drawn',()=>{let n=0;const r0=ddcRingPath;window.ddcRingPath=function(){n++;return r0.apply(this,arguments);};drawOverlay(.03,simT);window.ddcRingPath=r0;
   return{ok:dd.toolK==='nade'&&!!dd.toolU&&n>=1,circles:n,who:dd.toolU&&dd.toolU.name};});
 await page.mouse.click(a[0],a[1]);
 await ok('clicked again: put away, nothing drawn',()=>{let n=0;const r0=ddcRingPath;window.ddcRingPath=function(){n++;return r0.apply(this,arguments);};drawOverlay(.03,simT);window.ddcRingPath=r0;return{ok:!dd.toolK&&n===0,circles:n};});}
{const a=await ev(()=>{const b=document.querySelector('#sq .sq-tool[data-k="rpg"]');const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2];});await page.mouse.click(a[0],a[1]);
 await ok('the Bazooka clicked into hand: its reach drawn though most of it runs past the camera',()=>{let n=0,f=0;const r0=ddcRingPath,f0=ox.fill.bind(ox);window.ddcRingPath=function(){const k=r0.apply(this,arguments);if(k)n++;return k;};ox.fill=function(){if(/255,\s*140,\s*30/.test(String(ox.fillStyle)))f++;return f0.apply(ox,arguments);};drawOverlay(.03,simT);window.ddcRingPath=r0;ox.fill=f0;ddToolEnd();return{ok:n>=1&&f>=1,drawn:n,filled:f};});}
// Version 187 (Bryan: "the Pill box on the right side of the beach doesn't need to be a capture point"): its men down and one of ours standing in it,
// it isn't ours and nothing says it is; with the left bunker ours, the end of the beach asks for no bunker (the pillbox's ground, r 600,206,770,344)
await ok('the pillbox isn\'t a place to take: its men down and one of ours in it, it isn\'t ours, no banner, and no "Take the pillbox"',()=>{
  for(const e of enemies)if(e.tag==='pill'&&!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}
  for(const e of enemies)if(e.tag==='left'&&!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}
  const u=dd.allies.find(q=>alive(q)&&!q.inBoat)||players.find(alive);const x0=u.x,y0=u.y;u.x=685+DDX;u.y=280;u.path=[];BAN.length=0;
  const order0=(dd.heldOrder||[]).slice();ddZones();ddZones();const held=!!(dd.held&&dd.held.pill),said=BAN.some(t=>/pillbox/i.test(t));
  dd.held.left=true;const ours=players.filter(p=>alive(p)&&p.team===dd.active&&!p.inBoat);const ys=ours.map(p=>p.y);for(const p of ours){p.y=250;p.x=Math.max(p.x,600+DDX);}
  const O=ddObjective();ours.forEach((p,i)=>p.y=ys[i]);u.x=x0;u.y=y0;
  return{ok:!held&&!said&&!(dd.heldOrder||[]).includes('pill')&&!!O&&!/pillbox|left bunker/i.test(O.t)&&!O.cam&&!DD_SPAWN.pill,held,said,objective:O&&O.t,order:dd.heldOrder,before:order0};});
// --- the village: the rally point before the last
await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(400);
await ok('village: from the rally point before the last',()=>{RUN(1);const R0=dd.vg.rally;dd.vg.rally=[{x:VG.road,y:300,n:'the edge of the woods'},{x:VG.road,y:20,n:'the hedgerow'},{x:700,y:-280,n:'the barricade'}];
  const E=enemies.filter(e=>!beaten(e)),P=E.map(e=>[e.x,e.y]);for(const e of E){e.x=-5000;e.y=-5000;}const a=vgFrom().n;dd.vg.rally.pop();const b2=vgFrom().n;dd.vg.rally=[];const c=vgFrom().n;
  dd.vg.rally=[{x:VG.road,y:300,n:'the edge of the woods'},{x:VG.road,y:20,n:'the hedgerow'},{x:700,y:-280,n:'the barricade'}];E[0].x=VG.road;E[0].y=30;const d=vgFrom().n;
  E.forEach((e,i)=>{e.x=P[i][0];e.y=P[i][1];});dd.vg.rally=R0;return{ok:a==='the hedgerow'&&b2==='the edge of the woods'&&c==='the track'&&d==='the edge of the woods',a,b:b2,c,d};});
await ok('village: held places blue on the ground',()=>{dd.vg.ph='village';const z=VG.zones[0];dd.vg.held[z.k]=true;let n=0;const r0=ddBlueRect;window.ddBlueRect=function(){n++;return r0.apply(this,arguments);};dd.track=null;camPan=null;camT.x=z.lx;camT.z=z.ly-60;zoom=2;for(let i=0;i<20;i++)ddFrame(1/30,simT);drawOverlay(.03,simT);window.ddBlueRect=r0;dd.vg.held[z.k]=false;return{ok:n>0,drawn:n};});
await ok('village: everyone down, the reserves at once',()=>{BAN.length=0;const N=players.length;DOWN(players.filter(p=>!p.dead));let t=0;while(t<6&&!players.some(alive)){RUN(.25);t+=.25;}
  return{ok:players.some(alive)&&t<3&&BAN.filter(s=>/Everyone was down/.test(s)).length===1,took:t,up:players.filter(alive).length,banners:BAN.slice(0,2)};});
// --- the counterattack
await ev(()=>{ddRoster.stage=1;for(let i=0;i<6;i++)ddRoster.reserve.push(ddmNewMan('rifle',3,false));ddmSave();startCounter();});await page.waitForTimeout(400);
await ok('counterattack: everyone down, out of the barracks at once',()=>{RUN(6);BAN.length=0;DOWN(players.filter(p=>!p.dead));let t=0;while(t<6&&!players.some(alive)){RUN(.25);t+=.25;}
  return{ok:players.some(alive)&&t<3&&BAN.some(s=>/Everyone was down\. The reserves come out of the barracks/.test(s)),took:t,up:players.filter(alive).length,banners:BAN.slice(0,2)};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

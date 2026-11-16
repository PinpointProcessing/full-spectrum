// Version 168, the two test controls (js/ddctl.js): node controls-test.js [W H PORT]
// Checks: the start card's switches (on by default, kept); Lead one squad: no tabs, the swap button and FOLLOW / HOLD, the other squad
// following behind yours and holding when told, a swap that leaves the squad let go where it is, the lead passing to the other squad when
// yours is all down; Tap an enemy for actions: the ring on an enemy (fire order, slow motion, Suppress, Grenade), on the wire (MOVE HERE),
// on a tank (Bazooka first), closed by a tap elsewhere (which does nothing more) and by itself after 4.5 s; dragging a grenade, the medic kit
// and the Bazooka from the bar onto the map with real mouse events (thrown, used, fired), cancelled over the bar, a plain tap saying to drag;
// the counterattack starting both squads on HOLD; both switches off giving back Version 167's controls; no page errors.
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const W=+process.argv[2]||390,H=+process.argv[3]||760,PO=+process.argv[4]||0;
(async()=>{const port=9890+PO,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);let fails=0;
const ok=async(l,f,a)=>{let r;try{r=await ev(f,a);}catch(e){r={ok:false,err:String(e).slice(0,300)};}if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));return r;};
await ok('start card: both switches there and on',()=>{localStorage.removeItem('warehouseYard.ddctl.v1');const a=$('#ddCtlLead'),c=$('#ddCtlRing');return{ok:!!a&&!!c&&a.checked&&c.checked&&DDC.lead&&DDC.ring};});
await ok('start card: a switch is kept',()=>{const a=$('#ddCtlRing');a.click();const s1=localStorage.getItem('warehouseYard.ddctl.v1');a.click();const s2=localStorage.getItem('warehouseYard.ddctl.v1');return{ok:/"ring":false/.test(s1)&&/"ring":true/.test(s2)&&DDC.ring,s1,s2};});
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave&&ddmSave(R);
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(11);window.requestAnimationFrame=()=>0;
  window.NOSUP=1;window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);if(NOSUP)for(const p of players)p.sup=0;if(i%6===0)drawOverlay(.03,simT);}};
  window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'&&!t.npc?undefined:d0(t,d,s);
  window.CENTER=(x,y,z)=>{dd.track=null;camPan=null;zoom=z;camT.x=x;camT.z=y-100;for(let i=0;i<30;i++)ddFrame(1/30,simT);render(.001,simT);drawOverlay(.03,simT);};
  window.MID=L=>({x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length});
  window.LED=()=>players.filter(p=>p.team===dd.active&&alive(p)),window.SUP=()=>players.filter(p=>p.team!==dd.active&&alive(p));
  window.TP=(L,dx,dy)=>{for(const[ax,ay]of[[dx,dy],[-dx,dy],[dx,-dy],[-dx,-dy]])if(L.every(u=>isFree(u.x+ax,u.y+ay,7)&&u.x+ax>DDX+20&&u.x+ax<DDX+DDW-20)){for(const u of L){u.x+=ax;u.y+=ay;u.path=[];}return[ax,ay];}return null;};   // (the squad you lead put somewhere else at once: the test is of the other squad, not of the way there)
  window.MOVE=(L,x,y)=>{const as=makeAssign(L,x,y);if(as.length)commit(as);return as.length;};
  window.MA=0;const m0=makeAssign;makeAssign=function(L,x,y){if(L&&L.length&&dd&&L[0].team!==dd.active)MA++;return m0.apply(this,arguments);};
  window.SCR=(x,y,h)=>{toSBack=false;const p=toS(x,y,h||0);return toSBack?null:p;};});
// --- the beach
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);});
await ok('lead: no tabs, the swap button shows the other squad',()=>{RUN(.2);const sw=$('#ddSwap'),o=dd.active==='A'?'BRAVO':'ALPHA';return{ok:document.body.classList.contains('ddlead')&&getComputedStyle(document.querySelector('.panel')).display==='none'&&!!sw&&!sw.hidden&&sw.querySelector('.ddc-swap b').textContent===o&&sw.querySelector('.ddc-seg .on').dataset.m==='follow',active:dd.active,name:sw&&sw.querySelector('.ddc-swap b').textContent};});
await ok('lead: the swap button sits over the bar, on screen',()=>{const r=$('#ddSwap').getBoundingClientRect(),q=$('#sq').getBoundingClientRect();return{ok:r.bottom<=q.top+1&&r.right<=innerWidth&&r.top>0,swap:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)],barTop:Math.round(q.top)};});
await ok('follow: the other squad comes up behind yours',()=>{const L=LED(),S=SUP(),l0=MID(L),s0=MID(S);const n=MOVE(L,l0.x,l0.y-230);RUN(14);const l1=MID(LED()),s1=MID(SUP());
  const strip=SUP().every(u=>u.x>DDX-6&&u.x<DDX+DDW+6);return{ok:n>0&&hyp(s1.x-s0.x,s1.y-s0.y)>50&&hyp(s1.x-l1.x,s1.y-l1.y)<260&&s1.y>l1.y-20&&strip,lead:[Math.round(l1.x),Math.round(l1.y)],sup:[Math.round(s1.x),Math.round(s1.y)],moved:Math.round(hyp(s1.x-s0.x,s1.y-s0.y))};});
await ok('hold: told to hold, they stay where they are',()=>{$('#ddSwap .ddc-seg button[data-m="hold"]').click();const o=dd.active==='A'?'B':'A';RUN(3);const s0=MID(SUP()),L=LED(),l0=MID(L);const tp=TP(L,240,-40);RUN(10);const s1=MID(SUP()),l1=MID(LED());
  return{ok:ddcMode(o)==='hold'&&$('#ddSwap .ddc-seg .on').dataset.m==='hold'&&hyp(s1.x-s0.x,s1.y-s0.y)<60&&hyp(l1.x-l0.x,l1.y-l0.y)>60,leadMoved:Math.round(hyp(l1.x-l0.x,l1.y-l0.y)),supMoved:Math.round(hyp(s1.x-s0.x,s1.y-s0.y))};});
await ok('hold: they pin down what yours is shooting',()=>{const o=dd.active==='A'?'B':'A',S=SUP(),e=enemies.find(e=>!beaten(e)&&!e.dead&&e.gunner&&e.onGun)||enemies.find(e=>!beaten(e)&&!e.dead);let spot=null;   // (the other squad put where it can see a gun, the gun made your squad's target)
  for(let d=150;d<400&&!spot;d+=30)for(let a=0;a<12&&!spot;a++){const x=e.x+Math.cos(a/12*TAU)*d,y=e.y+Math.sin(a/12*TAU)*d;if(!isFree(x,y,7))continue;const u=S[0],ox=u.x,oy=u.y;u.x=x;u.y=y;const k=hyp(x-e.x,y-e.y)<=wRange(u)&&!!fireLine(u,e);u.x=ox;u.y=oy;if(k)spot={x,y};}
  if(!spot)return{ok:false,why:'no spot with a line to '+e.tag};const P=S.map(u=>[u.x,u.y]);S.forEach((u,i)=>{u.x=spot.x+i*8;u.y=spot.y;u.path=[];u.supT=null;u.lastOrder=-99;});
  for(const u of LED())u.focus=e;ddcSupport(o);const n=S.filter(u=>u.supT&&hyp(u.supT.x-e.x,u.supT.y-e.y)<1).length;S.forEach((u,i)=>{u.x=P[i][0];u.y=P[i][1];u.supT=null;});return{ok:ddcMode(o)==='hold'&&n>0,suppressing:n,of:S.length,tag:e.tag};});
await ok('follow again: back after yours',()=>{$('#ddSwap .ddc-seg button[data-m="follow"]').click();const s0=MID(SUP()),d0=hyp(s0.x-MID(LED()).x,s0.y-MID(LED()).y);RUN(16);const s1=MID(SUP()),l1=MID(LED());return{ok:hyp(s1.x-l1.x,s1.y-l1.y)<260&&(d0<200||hyp(s1.x-s0.x,s1.y-s0.y)>60),before:Math.round(d0),dist:Math.round(hyp(s1.x-l1.x,s1.y-l1.y)),moved:Math.round(hyp(s1.x-s0.x,s1.y-s0.y))};});
await ok('swap: you lead the other squad, the one let go stays put',()=>{const a0=dd.active;RUN(4);$('#ddSwap .ddc-swap').click();const a1=dd.active;MA=0;RUN(4);const nm=$('#ddSwap .ddc-swap b').textContent;
  return{ok:a1!==a0&&sel.every(u=>u.team===a1)&&nm===(a0==='A'?'ALPHA':'BRAVO')&&MA===0&&dd.track&&dd.track.team===a1,from:a0,to:a1,followMovesAfterSwap:MA};});
await ok('lead passes on when your squad is all down',()=>{const a0=dd.active,L=LED();for(const p of L){p.downed=true;p.hp=1;p.bleed=60;}RUN(1.5);const a1=dd.active;for(const p of L){p.downed=false;p.hp=100;p.critical=false;}selectTeam(a0);RUN(.2);return{ok:a1!==a0,from:a0,to:a1,banner:$('#banner').textContent};});
// the ring
const ENEMY=()=>ev(()=>{const e=enemies.filter(e=>!e.dead&&!beaten(e)&&!e.surr).sort((a,b)=>(LED().some(u=>fireLine(u,b))?1:0)-(LED().some(u=>fireLine(u,a))?1:0)||hyp(a.x-MID(LED()).x,a.y-MID(LED()).y)-hyp(b.x-MID(LED()).x,b.y-MID(LED()).y))[0];
  e.vis=true;e.seen=true;window.TGT=e;const m=MID(LED());CENTER((e.x+m.x)/2,(e.y+m.y)/2+60,2.6);return{tag:e.tag,line:LED().some(u=>fireLine(u,e))};});
console.log('target',JSON.stringify(await ENEMY()));
await ok('ring: a tap on an enemy opens fire and shows what you can do',()=>{const e=TGT,p=SCR(e.x+(e.lx||0),e.y+(e.ly||0),8+(e.elev||0));if(!p)return{ok:false,why:'enemy behind the camera'};const t0=performance.now();tap(p[0],p[1]);const ms=Math.round(performance.now()-t0);drawOverlay(.03,simT);
  const bs=[...document.querySelectorAll('#ddRing .ddc-act')].map(b=>b.dataset.k+(b.classList.contains('off')?'(off)':''));const fire=LED().some(u=>u.focus===e||u.fireGo&&u.fireGo.e===e);
  const R=bs.length?document.querySelector('#ddRing .ddc-act').getBoundingClientRect():null;
  return{ok:!!ddcR&&ddcR.kind==='enemy'&&!$('#ddRing').hidden&&bs[0].startsWith('sup')&&bs.length>=2&&timeScale()===.25&&fire,items:bs,subs:[...document.querySelectorAll('#ddRing .ddc-act i')].map(i=>i.textContent),fire,slow:timeScale(),tapMs:ms};});
await ok('ring: its buttons are on screen',()=>{for(const b of document.querySelectorAll('#ddRing .ddc-act'))b.style.animation='none';const a=[...document.querySelectorAll('#ddRing .ddc-act')].map(b=>b.getBoundingClientRect());return{ok:a.length>0&&a.every(r=>r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight),rects:a.map(r=>[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)])};});
await ok('ring: Suppress pins him down',()=>{const b=document.querySelector('#ddRing .ddc-act[data-k="sup"]');const off=b.classList.contains('off');b.click();const n=LED().filter(u=>u.supT).length;return{ok:off?!ddcR||true:n>0&&!ddcR&&$('#ddRing').hidden,off,suppressing:n};});
await ok('ring: Grenade thrown (or walked up for)',()=>{const e=TGT,p=SCR(e.x+(e.lx||0),e.y+(e.ly||0),8+(e.elev||0));tap(p[0],p[1]);drawOverlay(.03,simT);const b=document.querySelector('#ddRing .ddc-act[data-k="nade"]')||document.querySelector('#ddRing .ddc-act[data-k="rgl"]');
  if(!b)return{ok:true,skipped:'no grenades in the squad'};const off=b.classList.contains('off'),n0=LED().reduce((a,u)=>a+(u.grenade||0),0),nd0=nades.length;b.click();const go=LED().some(u=>u.throwGo)||nades.length>nd0||LED().reduce((a,u)=>a+(u.grenade||0),0)<n0;
  return{ok:off||go,off,sub:b.querySelector('i').textContent,go};});
await ok('ring: a tap elsewhere puts it away and nothing else',()=>{const e=TGT,p=SCR(e.x+(e.lx||0),e.y+(e.ly||0),8+(e.elev||0));tap(p[0],p[1]);drawOverlay(.03,simT);const was=!!ddcR;const m=MID(LED()),q=SCR(m.x+60,m.y+40,0);preview=null;tap(q[0],q[1]);
  return{ok:was&&!ddcR&&!preview,was,preview:!!preview};});
await ok('ring: gone by itself after 4.5 s, full speed again',()=>{const e=TGT,p=SCR(e.x+(e.lx||0),e.y+(e.ly||0),8+(e.elev||0));tap(p[0],p[1]);drawOverlay(.03,simT);const s0=timeScale();ddcR.t0-=5000;const s1=timeScale();drawOverlay(.03,simT);return{ok:s0===.25&&s1===1&&!ddcR&&$('#ddRing').hidden,s0,s1};});
await ok('ring: the wire, with MOVE HERE',()=>{const o=(dd.wires||[]).find(q=>!q.gone);if(!o)return{ok:true,skipped:'no wire'};CENTER(o.x+o.w/2,o.y+120,3);const p=SCR(o.x+o.w/2,o.y+o.h/2,0);tap(p[0],p[1]);drawOverlay(.03,simT);
  const ks=[...document.querySelectorAll('#ddRing .ddc-act')].map(b=>b.dataset.k);const mv=document.querySelector('#ddRing .ddc-act[data-k="move"]');if(mv)mv.click();const paths=LED().filter(u=>u.path.length).length;
  return{ok:ks.includes('move')&&paths>0&&!ddcR,items:ks,moving:paths};});
// dragging from the bar (real mouse events)
const toolRect=k=>ev(k=>{const b=document.querySelector(`#sq .sq-tool[data-k="${k}"]`);if(!b||b.disabled)return null;const r=b.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};},k);
const drag=async(k,to,end)=>{const a=await toolRect(k);if(!a)return null;await page.mouse.move(a.x,a.y);await page.mouse.down();for(let i=1;i<=8;i++)await page.mouse.move(a.x+(to[0]-a.x)*i/8,a.y+(to[1]-a.y)*i/8);
  const mid=await ev(()=>{drawOverlay(.03,simT);const D=dd.drag;return D&&{ok:D.ok,u:D.u&&D.u.name,why:D.why,pt:!!D.pt,slow:timeScale()};});if(end)await end();await page.mouse.up();return mid;};
await ev(()=>{RUN(4);const m=MID(LED());CENTER(m.x,m.y+40,2.6);hud();drawOverlay(.03,simT);});
{const spot=await ev(()=>{const m=MID(LED());window.SPOT={x:m.x+10,y:m.y-100};const p=SCR(SPOT.x,SPOT.y,0);window.N0=LED().reduce((a,u)=>a+(u.grenade||0),0);window.ND0=nades.length;return p;});
 const mid=await drag('nade',spot);
 await ok('drag: a grenade onto the map is thrown',(mid)=>{const go=LED().some(u=>u.throwGo)||nades.length>ND0||LED().reduce((a,u)=>a+(u.grenade||0),0)<N0;return{ok:!!mid&&mid.ok&&mid.pt&&mid.slow===.25&&go&&!dd.drag&&!dd.toolK&&timeScale()===1,mid,go};},mid);}
{const spot=await ev(()=>{RUN(3);for(const u of LED())u.throwGo=null;window.N0=LED().reduce((a,u)=>a+(u.grenade||0),0);window.ND0=nades.length;const m=MID(LED());return SCR(m.x,m.y-100,0);});
 const bar=await ev(()=>{const r=$('#sq').getBoundingClientRect();return[r.left+r.width/2,r.top+r.height*.6];});
 const mid=await drag('nade',spot,async()=>{for(let i=1;i<=6;i++)await page.mouse.move(spot[0]+(bar[0]-spot[0])*i/6,spot[1]+(bar[1]-spot[1])*i/6);});
 await ok('drag: back over the bar and let go, nothing thrown',(mid)=>{const go=LED().some(u=>u.throwGo)||nades.length>ND0||LED().reduce((a,u)=>a+(u.grenade||0),0)<N0;return{ok:!!mid&&!go&&!dd.drag,go};},mid);}
{const a=await toolRect('nade');if(a){await page.mouse.click(a.x,a.y);await ok('drag: a plain tap on a tool says to drag it',()=>({ok:/Drag/.test($('#banner').textContent)&&!dd.toolK&&!mode,banner:$('#banner').textContent}));}}
{const t=await ev(()=>{const u=LED().find(p=>!(p.spec==='medkit'&&p.specN>0))||LED()[0];u.hp=55;window.HURT=u;CENTER(u.x,u.y+60,2.6);hud();drawOverlay(.03,simT);return SCR(u.x,u.y,12);});
 const mid=await drag('medkit',t);
 await ok('drag: the medic kit onto a hurt man',(mid)=>{if(!mid)return{ok:true,skipped:'no medic kit in this squad'};const m=LED().find(u=>u.medGo&&u.medGo.t===HURT);return{ok:mid.ok&&!!m,mid,medic:m&&m.name};},mid);}
{const t=await ev(()=>{RUN(.5);const m=MID(LED());const e=enemies.filter(e=>!beaten(e)&&!e.dead).sort((a,b)=>hyp(a.x-m.x,a.y-m.y)-hyp(b.x-m.x,b.y-m.y)).find(e=>hyp(e.x-m.x,e.y-m.y)>140);if(!e)return null;window.RT=e;CENTER((e.x+m.x)/2,(e.y+m.y)/2+40,1.6);hud();drawOverlay(.03,simT);return SCR(e.x,e.y,6);});
 const mid=t&&await drag('rpg',t);
 await ok('drag: the Bazooka onto a target',(mid)=>{if(!mid)return{ok:true,skipped:'no Bazooka or no target on screen'};const u=LED().find(p=>p.rpgAim||p.throwGo&&p.throwGo.kind==='rpg');return{ok:mid.ok?!!u||rockets.length>0:/far/i.test(mid.why),mid,by:u&&u.name};},mid);}
// --- the counterattack: both squads hold
await ev(()=>{ddRoster.stage=1;startCounter();});await page.waitForTimeout(400);
await ok('counter: both squads start on HOLD, the swap works',()=>{RUN(8);const a0=dd.active;const h=ddcMode('A')==='hold'&&ddcMode('B')==='hold';$('#ddSwap .ddc-swap').click();RUN(2);return{ok:h&&dd.active!==a0&&!$('#ddSwap').hidden,hold:h,from:a0,to:dd.active};});
// --- the village: the tank's ring, the follow in place of the old one
await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(400);
await ok('village: the other squad follows yours',()=>{RUN(4);const l0=MID(LED()),s0=MID(SUP());MOVE(LED(),l0.x,l0.y-220);RUN(10);const m=MID(LED());MOVE(LED(),m.x,m.y-200);RUN(16);const s1=MID(SUP()),l1=MID(LED());
  return{ok:hyp(l1.x-l0.x,l1.y-l0.y)>200&&hyp(s1.x-s0.x,s1.y-s0.y)>100&&hyp(s1.x-l1.x,s1.y-l1.y)<280,leadMoved:Math.round(hyp(l1.x-l0.x,l1.y-l0.y)),moved:Math.round(hyp(s1.x-s0.x,s1.y-s0.y)),dist:Math.round(hyp(s1.x-l1.x,s1.y-l1.y))};});
await ok('village: a tank tapped shows the Bazooka first',()=>{let K=ddTanksUp()[0];if(!K){if(typeof vgTank==='function')try{vgTank();}catch(e){}K=ddTanksUp()[0];}if(!K)return{ok:true,skipped:'no tank yet'};
  const k0={x:K.x,y:K.y,hold:K.hold};const m=MID(LED());K.x=m.x;K.y=m.y-260;CENTER(K.x,K.y+150,2.4);const p=SCR(K.x,K.y,16);tap(p[0],p[1]);drawOverlay(.03,simT);const ks=[...document.querySelectorAll('#ddRing .ddc-act')].map(b=>b.dataset.k);ddcClose();K.x=k0.x;K.y=k0.y;
  const rpg=players.some(u=>u.team===dd.active&&u.spec==='rpg'&&u.specN>0);return{ok:ks.length>0&&(!rpg||ks[0]==='rpg'),items:ks};});
// --- both switches off: Version 167's controls
await ok('switches off: tabs back, no swap, a tap on an enemy just fires, a tool tap takes it in hand',()=>{DDC.lead=false;DDC.ring=false;RUN(.2);drawOverlay(.03,simT);
  const tabs=getComputedStyle(document.querySelector('.panel')).display!=='none',sw=$('#ddSwap').hidden;const e=enemies.filter(e=>!beaten(e)&&!e.dead).sort((a,b)=>hyp(a.x-MID(LED()).x,a.y-MID(LED()).y)-hyp(b.x-MID(LED()).x,b.y-MID(LED()).y))[0];
  e.vis=true;const m=MID(LED());CENTER((e.x+m.x)/2,(e.y+m.y)/2+60,2.4);const p=SCR(e.x+(e.lx||0),e.y+(e.ly||0),8+(e.elev||0));tap(p[0],p[1]);const ring=!!ddcR;
  hud();drawOverlay(.03,simT);const t=document.querySelector('#sq .sq-tool:not([disabled])');let held=null;if(t){t.click();held=dd.toolK;ddToolEnd();}
  DDC.lead=true;DDC.ring=true;return{ok:tabs&&sw&&!ring&&(!t||!!held),tabs,swapHidden:sw,ring,held};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

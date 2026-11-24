// Version 168's test controls in pictures (js/ddctl.js): node controls-shots.js OUTDIR [W H PORT]
// 1 the swap button with FOLLOW / HOLD and the other squad's label; 2 the ring on an enemy; 3 a grenade being dragged onto the map.
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const OUT=process.argv[2]||'.',W=+process.argv[3]||390,H=+process.argv[4]||760,PO=+process.argv[5]||0;
(async()=>{const port=9900+PO,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=1`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);
const shot=async n=>{await ev(()=>{render(.001,simT);drawOverlay(.03,simT);});await page.waitForTimeout(700);await ev(()=>{render(.001,simT);drawOverlay(.03,simT);});await page.screenshot({path:`${OUT}/ctl-${W}x${H}-${n}.png`});console.log('shot',n);};
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(11);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);for(const p of players)p.sup=0;if(i%6===0)drawOverlay(.03,simT);}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);
  window.CENTER=(x,y,z)=>{dd.track=null;camPan=null;zoom=z;camT.x=x;camT.z=y-100;for(let i=0;i<30;i++)ddFrame(1/30,simT);};
  window.MID=L=>({x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length});
  window.LED=()=>players.filter(p=>p.team===dd.active&&alive(p));window.SCR=(x,y,h)=>{toSBack=false;const p=toS(x,y,h||0);return toSBack?null:p;};});
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(3);const L=LED(),m=MID(L),as=makeAssign(L,m.x,m.y-180);if(as.length)commit(as);RUN(12);dd.ddcSaid=-1;$('#banner').classList.remove('show');
  const a=MID(LED()),o=MID(players.filter(p=>p.team!==dd.active&&alive(p)));CENTER((a.x+o.x)/2,(a.y+o.y)/2+40,W>H?2.2:2.6);hud();});
await shot('1-swap');
await ev(()=>{const m=MID(LED());const e=enemies.filter(e=>!e.dead&&!beaten(e)).sort((a,b)=>(LED().some(u=>fireLine(u,b))?1:0)-(LED().some(u=>fireLine(u,a))?1:0)||hyp(a.x-m.x,a.y-m.y)-hyp(b.x-m.x,b.y-m.y))[0];e.vis=true;e.seen=true;
  CENTER((e.x+m.x)/2,(e.y+m.y)/2+60,W>H?1.9:2.4);render(.001,simT);const p=SCR(e.x+(e.lx||0),e.y+(e.ly||0),8+(e.elev||0));tap(p[0],p[1]);if(ddcR)ddcR.t0=performance.now()+60000;for(const b of document.querySelectorAll('#ddRing .ddc-act'))b.style.animation='none';});   // (kept up for the picture: a slow software render can take longer than its 4.5 s)
await shot('2-ring');
await ev(()=>{ddcClose();const m=MID(LED());CENTER(m.x,m.y-50,W>H?2.2:2.6);hud();});
const a=await ev(()=>{const b=document.querySelector('#sq .sq-tool[data-k="nade"]');const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2];});
const t=await ev(()=>{const m=MID(LED());return SCR(m.x+20,m.y-130,0);});
await page.mouse.move(a[0],a[1]);await page.mouse.down();for(let i=1;i<=8;i++)await page.mouse.move(a[0]+(t[0]-a[0])*i/8,a[1]+(t[1]-a[1])*i/8);
await shot('3-drag');
await page.mouse.up();
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();

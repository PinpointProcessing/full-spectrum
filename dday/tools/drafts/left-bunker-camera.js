// Version 184: Bryan's picture ("See when I'm on the road near the first bunker, the camera doesn't turn right"): the left bunker taken and the
// pillbox still to take, the squad sent from just past the wire up to the road by the left bunker; the view once they're there. Run it on two
// copies of the game: DDROOT=<old copy>/dday node left-bunker-camera.js PORT before.png; node left-bunker-camera.js PORT after.png
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const PO=+process.argv[2]||0,OUT=process.argv[3]||'lb.png';
(async()=>{const port=9830+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=0`);await page.setViewportSize({width:390,height:760});
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(7919);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){for(const u of players)u.sup=0;update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);
  window.SQ=t=>players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);
  window.PUT=(t,x,y)=>{const L=SQ(t);L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};
  window.MOVE=(t,x,y)=>{const as=makeAssign(SQ(t),x,y);if(as.length)commit(as);return as.length;};});
await page.click('#ddBtn');await page.waitForTimeout(400);
const r=await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);dd.ctr={on:true,sq:4,t:1e12};
  for(const e of enemies)if(e.tag==='left'&&!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}dd.held=dd.held||{};dd.held.left=true;
  for(const e of enemies)if(e.tag==='pill'&&!beaten(e))e.hp=1e6;dd.held.pill=false;
  const L=DD_SPOT.leftMG.x+DDX;PUT('A',L+60,328);PUT('B',L+180,330);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(3);MOVE('A',L-10,292);
  n=0;while(SQ('A').some(u=>u.path.length)&&n++<80)RUN(.5);RUN(5);return JSON.stringify({yaw:+yaw.toFixed(2),lead:(u=>[Math.round(u.x),Math.round(u.y)])(ddTrackAt())});});
await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(300);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});
await page.screenshot({path:OUT});console.log(r,'errors',errors.length);await b.close();srv.close();})();

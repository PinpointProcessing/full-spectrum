// Version 183: the end of the beach played as a player would (Alpha sent to the pillbox, then up onto the first hill's top) with the game's own
// camera, five pictures on the way. Run it on two copies of the game and put them side by side with end-of-beach-camera.py:
// DDROOT=<old copy>/dday node end-of-beach-camera.js PORT OUTDIR before; node end-of-beach-camera.js PORT OUTDIR after
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const PO=+process.argv[2]||0,OUT=process.argv[3]||'.',TAG=process.argv[4]||'x';
(async()=>{const port=9820+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:390,height:760});
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
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);dd.ctr={on:true,sq:4,t:1e12};const R=DD_ROUTE;PUT('A',R[4][0]+DDX-10,R[4][1]+40);PUT('B',R[4][0]+DDX-130,R[4][1]+60);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(5);});
const shot=async(n,label)=>{await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(300);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});
  await page.screenshot({path:`${OUT}/${TAG}-${n}.png`});console.log(TAG,n,label,await ev(()=>JSON.stringify({yaw:+yaw.toFixed(2),lead:(u=>u?[Math.round(u.x),Math.round(u.y)]:null)(ddTrackAt())})));};
await shot(1,'at the end of the beach');
await ev(()=>{MOVE('A',DD_SPOT.pill.x+DDX-30,262);RUN(3);});await shot(2,'sent to the pillbox, 3 s');
await ev(()=>{let n=0;while(SQ('A').some(u=>u.path.length)&&n++<40)RUN(.5);RUN(3);});await shot(3,'at the pillbox');
await ev(()=>{MOVE('A',1078,105);RUN(4);});await shot(4,'sent up the first hill, 4 s');
await ev(()=>{let n=0;while(SQ('A').some(u=>u.path.length)&&n++<160)RUN(.5);RUN(3);});await shot(5,'on the first hill');
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();

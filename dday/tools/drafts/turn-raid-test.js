// Version 175 (Bryan, on the camera samples: "C looks best, the only thing is the second machine gun nest on the first hill is completely ignored.
// I guess the AI can take it over if the player misses it"): the beach camera turns with the route (ddplay.js's ddTurn, ddRouteWay; DD_CAM.route),
// a turn by hand is kept a while, the village keeps facing north; and the other troops go for the upper bunker and the hill bunker once the
// squads are past them (ddRaids, ddRaidThink). node turn-raid-test.js [SEED] [PORT] [RAIDSECS]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const SEED=+process.argv[2]||1,PO=+process.argv[3]||0,RAIDSECS=+process.argv[4]||150;
(async()=>{const port=9950+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=0`);await page.setViewportSize({width:390,height:760});
const ev=(f,a)=>page.evaluate(f,a);let fails=0;
const ok=async(l,f,a)=>{let r;try{r=await ev(f,a);}catch(e){r={ok:false,err:String(e).slice(0,300)};}if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));return r;};
await ev(([SEED])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(SEED*7919);window.requestAnimationFrame=()=>0;
  // the frame loop's camera work too (ddFrame calls ddCam): real time is what holds a turn by hand, so a clock that follows the game's
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};
  window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'&&!t.npc?undefined:d0(t,d,s);   // (the squads unhurt; the other troops and the enemy as they are)
  window.BAN=[];const b0=banner;banner=function(t){BAN.push(t);return b0.apply(this,arguments);};
  window.WRAP=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
  window.WANT=u=>{const w=ddRouteWay(u.x,u.y);return w?Math.atan2(-w.x,-w.y):null;};
  window.PUT=(t,x,y)=>{const L=players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);   // (not a man still in a boat or walking up to join: moved, the boat put him back on the sand when it unloaded him, and he dragged the squad's middle back down the beach)
  L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};},[SEED]);
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(3);});
// --- the camera
await ok('after landing: higher than before, facing up the route, following',()=>{const p=Math.max(PITCH_MIN,basePitch()-tilt);return{ok:Math.abs(p-DD_CAM.route)<.02&&!!dd.track,pitch:+p.toFixed(3),yaw:+yaw.toFixed(2)};});
await ok('on the sand: the camera faces up the route (within 0.25: the men still walking to their spots, it eases behind)',()=>{const u=ddTrackAt();RUN(3);const w=WANT(ddTrackAt());return{ok:w!=null&&Math.abs(WRAP(yaw-w))<.25,yaw:+yaw.toFixed(2),want:+w.toFixed(2)};});
await ok('up the draw, where the route turns north-west: the camera turns with it',()=>{const R=DD_ROUTE;PUT('A',R[6][0]+DDX,R[6][1]);PUT('B',R[5][0]+DDX,R[5][1]);dd.front=Math.min(dd.front,-20);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(5);
  const u=ddTrackAt(),w=WANT(u);return{ok:Math.abs(WRAP(yaw-w))<.15&&w>.4,yaw:+yaw.toFixed(2),want:+w.toFixed(2),lead:[Math.round(u.x),Math.round(u.y)]};});
await ok('a turn by hand is kept for a few seconds, then it eases back',()=>{const y0=yaw;yaw+=1.0;updateCamera();RUN(2.5);const held=Math.abs(WRAP(yaw-(y0+1)))<.05;RUN(7);const w=WANT(ddTrackAt());return{ok:held&&Math.abs(WRAP(yaw-w))<.15,held,yaw:+yaw.toFixed(2),want:+w.toFixed(2)};});
await ok('a drag lets go: it neither follows nor turns',()=>{dd.track=null;const y0=yaw;yaw+=.6;updateCamera();RUN(10);return{ok:Math.abs(WRAP(yaw-(y0+.6)))<1e-6,yaw:+yaw.toFixed(2)};});
await ok('on the top, the route turning east to the barracks: it faces east-north-east',()=>{const R=DD_ROUTE;PUT('A',R[10][0]+DDX,R[10][1]);PUT('B',R[9][0]+DDX,R[9][1]);dd.front=Math.min(dd.front,-470);ddGoSquad('A');RUN(6);
  const w=WANT(ddTrackAt());return{ok:Math.abs(WRAP(yaw-w))<.15&&w<-.6,yaw:+yaw.toFixed(2),want:+w.toFixed(2)};});
await ok('a bunker roof between the camera and one of your men goes clear, one that isn\'t stays',()=>{
  const hv=DD.roofs.find(m=>m.userData.b.x0===230&&m.userData.b.y0===-440),far=DD.roofs.find(m=>m.userData.b.x0===1026&&m.userData.b.y0===250);if(!hv||!far)return{ok:false,why:'roofs?'};
  const L=players.filter(p=>p.team==='A'&&alive(p));L.forEach((u,k)=>{Object.assign(u,{x:270+k*14,y:-468,path:[]});});
  players.filter(p=>p.team==='B'&&alive(p)).forEach((u,k)=>{Object.assign(u,{x:600+k*14,y:-520,path:[]});});   // (Bravo out of the way: since Version 180 it stands beside Alpha, here by that bunker, and one of ours inside a bunker keeps its roof clear)
  dd.track=null;camPan=null;yaw=0;zoom=DD_CAM.zoom;tilt=ddTilt(zoom,DD_CAM.route);camT.x=290;camT.z=-468;clampCam();updateCamera();for(let i=0;i<20;i++){ddFrame(1/30,simT);}
  const hid=L.filter(u=>ddRoofHides(hv,u)).length,r={ok:hid>0&&hv.material.opacity<.5&&far.material.opacity>.95,hid,hv:+hv.material.opacity.toFixed(2),far:+far.material.opacity.toFixed(2)};
  yaw=Math.PI;updateCamera();for(let i=0;i<30;i++){ddFrame(1/30,simT);}r.backAfterTurn=+hv.material.opacity.toFixed(2);r.ok=r.ok&&r.backAfterTurn>.9;return r;});
// --- the other troops and the bunkers the squads went past
// a fresh beach: the squads landed, then put up the draw past both bunkers while they're still manned
await ev(()=>{startDDay();});await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(8);});
const raid=await ok(`the squads past both bunkers: the other troops go for them (${RAIDSECS} s)`,([S])=>{
  const R=DD_ROUTE;PUT('A',R[7][0]+DDX,R[7][1]);PUT('B',R[6][0]+DDX,R[6][1]);dd.front=Math.min(dd.front,-110);
  const tags=['nest','hill'],up=t=>enemies.filter(e=>e.tag===t&&!beaten(e)).length,before={nest:up('nest'),hill:up('hill')},npc0=dd.npcs.filter(u=>!u.dead).length,lost0=dd.npcLost||0;
  BAN.length=0;let t=0,first={};const seen={nest:0,hill:0};
  while(t<S&&!(dd.held.nest&&dd.held.hill)){RUN(1);t++;for(const k of tags){const n=dd.npcs.filter(u=>!u.dead&&u.raid===k).length;seen[k]=Math.max(seen[k],n);if(dd.held[k]&&first[k]==null)first[k]=t;}}
  return{ok:!!(dd.raid&&dd.raid.nest&&dd.raid.hill&&(dd.raid.nest.on||dd.raid.nest.done)&&(dd.raid.hill.on||dd.raid.hill.done))&&(before.nest===0||BAN.some(s=>/The other troops go for the upper bunker/.test(s)))&&!!(dd.held.nest&&dd.held.hill),
    secs:t,held:{nest:!!dd.held.nest,hill:!!dd.held.hill},takenAt:first,before,left:{nest:up('nest'),hill:up('hill')},raiders:seen,npcLost:(dd.npcLost||0)-lost0,banners:BAN.filter(s=>/other troops|is yours/.test(s))};},[RAIDSECS]);
await ok('the village still faces north as it follows',()=>{startVillage({skip:true});RUN(2);const y0=yaw;RUN(4);return{ok:Math.abs(yaw)<1e-6&&!ddTurnRoute(),yaw};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

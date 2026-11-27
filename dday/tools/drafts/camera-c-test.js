// Version 179 (Bryan, on the hilltop camera drafts: "Let's do C"): on the top the camera faces down the road (ddplay.js's ddTurnRoute goes on
// along DB.east from the start), and a tank coming within 90 m of the man it follows turns it to face the tank, the view slid toward it up to
// 8 m (ddTankNear, ddTurn, ddTrack); not a tank still waiting (hold) or further off; back once it's knocked out; a turn by hand kept; the village
// (no route) back to north after a tank, a turn by hand there kept; the counterattack's waiting tanks ignored. node camera-c-test.js [SEED] [PORT]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const SEED=+process.argv[2]||1,PO=+process.argv[3]||0;
(async()=>{const port=9890+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=0`);await page.setViewportSize({width:390,height:760});
const ev=(f,a)=>page.evaluate(f,a);let fails=0;
const ok=async(l,f,a)=>{let r;try{r=await ev(f,a);}catch(e){r={ok:false,err:String(e).slice(0,300)};}if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));return r;};
await ev(([SEED])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(SEED*7919);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;   // (real time holds a turn by hand: a clock that follows the game's)
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);   // (nobody of ours hurt: the camera's the test)
  window.WRAP=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
  window.TO=(u,K)=>Math.atan2(-(K.x-u.x),-(K.y-u.y));
  window.PUT=(t,x,y)=>{const L=players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);   // (not a man still in a boat or walking up to join: moved, the boat put him back on the sand when it unloaded him, and he dragged the squad's middle back down the beach)
  L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};
  window.HOLDALL=()=>{for(const u of players){u.path=[];u.lastOrder=simT;u.exposeT=0;}};   // (the squads kept where they're put)
  window.TANK=(x,y,hold)=>{const K=(ddTankSpawn({x,y,way:[]}),dd.tanks[dd.tanks.length-1]);K.hold=!!hold;K.fireT=1e12;return K;};},[SEED]);
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);});
await ok('just landed, nothing taken: the way ahead at the end of the way up already turns down the road east (it used to only once the barracks was taken)',()=>{const E=DD_ROUTE[DD_ROUTE.length-1],w=ddRouteWay(E[0]+DDX,E[1]),want=Math.atan2(-w.x,-w.y),R=ddTurnRoute();
  return{ok:!(dd.base&&dd.base.open)&&R.length===DD_ROUTE.length+DB.east.length&&want<-1.35,want:+want.toFixed(2),points:R.length};});
// the top, by the barracks, the counterattack kept from starting so the only tanks are the test's (with everyone of theirs out of the way the barracks is taken at once: the camera works the same either way now)
await ev(()=>{dd.ctr={on:true,sq:4,t:1e12};for(const e of enemies)if(!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}
  const R=DD_ROUTE;PUT('A',R[12][0]+DDX-20,R[12][1]+10);PUT('B',R[11][0]+DDX,R[11][1]+20);dd.front=Math.min(dd.front,-560);selectTeam('A');dd.active='A';dd.track={team:'A'};ddTurnFree();
  for(let i=0;i<8;i++){HOLDALL();RUN(1);}});
await ok('on the top by the barracks: the camera faces down the road east',()=>{const u=ddTrackAt(),w=ddRouteWay(u.x,u.y),want=Math.atan2(-w.x,-w.y);
  return{ok:want<-1.35&&Math.abs(WRAP(yaw-want))<.15,want:+want.toFixed(2),yaw:+yaw.toFixed(2),lead:[Math.round(u.x),Math.round(u.y)]};});
await ok('a tank 60 m off to the north-east, moving: the camera turns to face it and slides toward it',()=>{const u=ddTrackAt();window.K1=TANK(u.x+520,u.y-300,false);
  for(let i=0;i<5;i++){HOLDALL();RUN(1);}const v=ddTrackAt(),want=TO(v,K1),fx=v.x-Math.sin(yaw)*DD_CAM.look,fz=v.y-Math.cos(yaw)*DD_CAM.look,off=hyp(camT.x-fx,camT.z-fz);
  const toward=((camT.x-fx)*(K1.x-v.x)+(camT.z-fz)*(K1.y-v.y))/(off||1)/hyp(K1.x-v.x,K1.y-v.y);
  return{ok:Math.abs(WRAP(yaw-want))<.15&&off>50&&off<95&&toward>.9,yaw:+yaw.toFixed(2),want:+want.toFixed(2),slid:Math.round(off),toward:+toward.toFixed(2),d:Math.round(hyp(K1.x-v.x,K1.y-v.y))};});
await ok('a turn by hand while it faces the tank is kept for a few seconds, then it faces the tank again',()=>{const y0=yaw;yaw+=1.0;updateCamera();for(let i=0;i<3;i++){HOLDALL();RUN(.8);}
  const held=Math.abs(WRAP(yaw-(y0+1)))<.05;for(let i=0;i<8;i++){HOLDALL();RUN(1);}const want=TO(ddTrackAt(),K1);return{ok:held&&Math.abs(WRAP(yaw-want))<.15,held,yaw:+yaw.toFixed(2),want:+want.toFixed(2)};});
await ok('the tank knocked out: back to facing down the road',()=>{K1.hp=0;for(let i=0;i<7;i++){HOLDALL();RUN(1);}const u=ddTrackAt(),w=ddRouteWay(u.x,u.y),want=Math.atan2(-w.x,-w.y);
  return{ok:Math.abs(WRAP(yaw-want))<.15&&ddTankNear(u)===null,yaw:+yaw.toFixed(2),want:+want.toFixed(2)};});
await ok('a tank still waiting (hold), 50 m off: no turn',()=>{const u=ddTrackAt();window.K2=TANK(u.x+200,u.y-460,true);const y0=yaw;for(let i=0;i<5;i++){HOLDALL();RUN(1);}
  return{ok:Math.abs(WRAP(yaw-y0))<.05&&ddTankNear(ddTrackAt())===null,moved:+WRAP(yaw-y0).toFixed(3)};});
await ok('a tank 120 m off, moving: no turn either',()=>{K2.hp=0;const u=ddTrackAt();window.K3=TANK(u.x+1100,u.y-500,false);const y0=yaw;for(let i=0;i<5;i++){HOLDALL();RUN(1);}
  return{ok:Math.abs(WRAP(yaw-y0))<.05,moved:+WRAP(yaw-y0).toFixed(3),d:Math.round(hyp(K3.x-u.x,K3.y-u.y))};});
await ok('dragged (not following): a tank near doesn\'t turn it',()=>{K3.hp=0;dd.track=null;const u=players.find(p=>p.team==='A'&&alive(p)),K4=TANK(u.x-400,u.y-200,false);const y0=yaw;for(let i=0;i<5;i++){HOLDALL();RUN(1);}
  K4.hp=0;return{ok:Math.abs(WRAP(yaw-y0))<1e-6};});
// the village: no route, so it faces north; a tank turns it, and after the tank it's north again; a turn by hand with no tank stays
await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(300);
await ev(()=>{RUN(2);dd.track={team:dd.active};ddTurnFree();yaw=0;updateCamera();for(let i=0;i<3;i++)RUN(1);});
await ok('the village: following, facing north, no tank about',()=>({ok:Math.abs(yaw)<.02&&!!dd.vil,yaw:+yaw.toFixed(3)}));
await ok('the village: a tank 50 m to the east turns it, and once it\'s knocked out it\'s back to north',()=>{const u=ddTrackAt(),K=TANK(u.x+480,u.y-100,false);for(let i=0;i<5;i++){HOLDALL();RUN(1);}
  const v=ddTrackAt(),want=TO(v,K),faced=Math.abs(WRAP(yaw-want))<.2,y1=yaw;K.hp=0;for(let i=0;i<8;i++){HOLDALL();RUN(1);}
  return{ok:faced&&want<-1&&Math.abs(yaw)<.05,faced,yawAtTank:+y1.toFixed(2),want:+want.toFixed(2),after:+yaw.toFixed(3)};});
await ok('the village: a turn by hand with no tank about stays where you put it',()=>{yaw=.6;updateCamera();for(let i=0;i<10;i++){HOLDALL();RUN(1);}return{ok:Math.abs(yaw-.6)<1e-6,yaw:+yaw.toFixed(3)};});
// the counterattack: its tanks wait on the road (hold) until their wave; following a squad there, they don't turn it
await ev(()=>{startCounter();});await page.waitForTimeout(300);
await ok('the counterattack: following a squad, the waiting tanks don\'t turn the camera',()=>{RUN(2);dd.track={team:'A'};ddTurnFree();yaw=0;updateCamera();for(let i=0;i<4;i++)RUN(1);
  return{ok:Math.abs(yaw)<.02&&(dd.tanks||[]).some(K=>K.hold),yaw:+yaw.toFixed(3),waiting:(dd.tanks||[]).filter(K=>K.hold).length};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

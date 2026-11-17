// Version 183 (Bryan, after Version 182: "The camera doesn't follow the first hill when you reach the end of the beach, it turns to the second
// hill"): the camera faces where you send the squad when that's off the way up (ddplay.js's ddTurn with dd.cam.go from ddFollowAgain, the
// way up being ddTurnRoute): sent from the end of the beach to the pillbox, then onto the first hill's top, it turns to face where they're
// going and keeps facing that way once they're there; a move back onto the way up turns it up the draw again; a move back the way they came
// doesn't spin it round; picking the squad again forgets it; a tank still comes first; the village keeps facing north. node camera-follow-test.js [SEED] [PORT]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const SEED=+process.argv[2]||1,PO=+process.argv[3]||0;
(async()=>{const port=9810+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:390,height:760});
const ev=(f,a)=>page.evaluate(f,a);let fails=0;
const ok=async(l,f,a)=>{let r;try{r=await ev(f,a);}catch(e){r={ok:false,err:String(e).slice(0,300)};}if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));return r;};
await ev(([SEED])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(SEED*7919);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;   // (real time holds a turn by hand: a clock that follows the game's)
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){for(const u of players)u.sup=0;update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};   // (kept unpinned: the walks are the test)
  const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);   // (nobody of ours hurt: the camera's the test)
  window.WRAP=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
  window.WANT=u=>{const w=ddRouteWay(u.x,u.y);return w?Math.atan2(-w.x,-w.y):null;};
  window.SQ=t=>players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);
  window.PUT=(t,x,y)=>{const L=SQ(t);L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};
  window.MOVE=(t,x,y)=>{const as=makeAssign(SQ(t),x,y);if(as.length)commit(as);return as.length;};   // (a move of yours, as a tap on the map gives it)
  window.WALK=(max)=>{let n=0;while(SQ('A').some(u=>u.path.length)&&n++<max)RUN(.5);RUN(1.5);};   // (until they're there)
  window.TO=(u,G)=>Math.atan2(-(G.x-u.x),-(G.y-u.y));window.MID=L=>({x:L.reduce((n,q)=>n+q.x,0)/L.length,y:L.reduce((n,q)=>n+q.y,0)/L.length});},[SEED]);
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);dd.ctr={on:true,sq:4,t:1e12};});   // (the counterattack kept back: no tank turns the camera until the test brings one)
await ok('walking up the sand, the camera faces along the way up as before',()=>{const R=DD_ROUTE;PUT('A',R[1][0]+DDX,R[1][1]);PUT('B',R[1][0]+DDX+120,R[1][1]+20);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(2);
  MOVE('A',R[2][0]+DDX,R[2][1]);RUN(3);const u=ddTrackAt(),w=WANT(u);return{ok:Math.abs(WRAP(yaw-w))<.2,yaw:+yaw.toFixed(2),want:+w.toFixed(2)};});
await ok('at the end of the beach, sent to the pillbox off to the right of the way up: it turns to face where they\'re going',()=>{const R=DD_ROUTE;PUT('A',R[4][0]+DDX-10,R[4][1]+40);ddGoSquad('A');RUN(4);const y0=yaw;
  const M0=MID(SQ('A'));MOVE('A',DD_SPOT.pill.x+DDX-30,262);const G=dd.cam.go,off=Math.round(ddRouteOff(G.x,G.y)),to=TO(M0,G);RUN(2.5);const w=WANT(ddTrackAt());
  return{ok:off>100&&Math.abs(WRAP(yaw-to))<.15&&WRAP(w-yaw)>.6,yaw:+yaw.toFixed(2),toward:+to.toFixed(2),wayUp:+w.toFixed(2),before:+y0.toFixed(2),offTheWay:off};});   // (the way from the squad's middle to where they're going)
await ok('once they\'re there it keeps facing that way, not back up the draw',()=>{const G=dd.cam.go;WALK(30);RUN(5);const w=WANT(ddTrackAt());
  return{ok:G.a!=null&&Math.abs(WRAP(yaw-G.a))<.05&&WRAP(w-yaw)>.6,yaw:+yaw.toFixed(2),kept:+G.a.toFixed(2),wayUpWouldBe:+w.toFixed(2)};});
await ok('sent onto the first hill\'s top: on the way it faces where they\'re going, up onto the hill, not up the draw; up there it keeps facing on',()=>{const M0=MID(SQ('A'));MOVE('A',1078,105);const G=dd.cam.go;RUN(3);let u=ddTrackAt();const on=Math.abs(WRAP(yaw-TO(M0,G)))<.15,w=WANT(u),y1=yaw;
  WALK(160);const v=ddTrackAt(),w2=WANT(v),up=SQ('A').filter(q=>hyp(q.x-G.x,q.y-G.y)<250&&groundH(q.x,q.y)>80).length;
  return{ok:on&&Math.abs(WRAP(y1-w))>.6&&up>=2&&Math.abs(WRAP(yaw-G.a))<.05&&Math.abs(WRAP(yaw-w2))>.6,
    onTheWay:+y1.toFixed(2),wayUpThen:+w.toFixed(2),yaw:+yaw.toFixed(2),wayUp:+w2.toFixed(2),onTheHill:up,lead:[Math.round(v.x),Math.round(v.y)]};});
await ok('a move back onto the way up, into the draw: it turns up the draw again',()=>{const R=DD_ROUTE;MOVE('A',R[6][0]+DDX,R[6][1]);WALK(60);RUN(3);const u=ddTrackAt(),w=WANT(u);
  return{ok:Math.abs(WRAP(yaw-w))<.2&&w>.3&&dd.cam.offA==null,yaw:+yaw.toFixed(2),want:+w.toFixed(2),at:[Math.round(u.x),Math.round(u.y)]};});
await ok('sent back down toward the beach, off the way up: it doesn\'t spin round to face back',()=>{const y0=yaw;MOVE('A',DD_SPOT.pill.x+DDX+40,330);RUN(4);const G=dd.cam.go;
  return{ok:Math.abs(WRAP(yaw-y0))<.25&&ddRouteOff(G.x,G.y)>100,yaw:+yaw.toFixed(2),before:+y0.toFixed(2)};});
await ok('picking the squad again (its tab) forgets where they were sent: the way up again',()=>{WALK(60);ddGoSquad('A');RUN(4);const u=ddTrackAt(),w=WANT(u);
  return{ok:!dd.cam.go&&Math.abs(WRAP(yaw-w))<.2,yaw:+yaw.toFixed(2),want:+w.toFixed(2)};});
await ok('sent off the way again with a tank coming: the tank still comes first',()=>{MOVE('A',1078,105);RUN(2);const u=ddTrackAt(),K=(ddTankSpawn({x:u.x+500,y:u.y-300,ang:Math.PI,way:[]}),dd.tanks[dd.tanks.length-1]);K.fireT=1e12;RUN(5);
  const v=ddTrackAt(),to=TO(v,K);const r={ok:Math.abs(WRAP(yaw-to))<.2,yaw:+yaw.toFixed(2),tank:+to.toFixed(2)};K.hp=0;return r;});
await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(300);
await ok('the village: a move off to the east doesn\'t turn it (it keeps facing north)',()=>{RUN(2);selectTeam(dd.active);dd.track={team:dd.active};ddTurnFree();yaw=0;updateCamera();RUN(1);
  const t=dd.active,c=SQ(t).reduce((a,u)=>({x:a.x+u.x/SQ(t).length,y:a.y+u.y/SQ(t).length}),{x:0,y:0});MOVE(t,c.x+260,c.y-60);RUN(5);return{ok:Math.abs(yaw)<.02,yaw:+yaw.toFixed(3)};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

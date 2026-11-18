// Versions 183, 184 and 185 (Bryan, after Version 182: "The camera doesn't follow the first hill when you reach the end of the beach, it turns to the
// second hill"; after Version 183, with a picture: "See when I'm on the road near the first bunker, the camera doesn't turn right"): ddplay.js's
// ddTurn with dd.cam.go from ddFollowAgain. While the squad walks where you sent it the camera faces the way you sent it; once it's there, at
// the end of the beach it faces the bunker to take next (ddTurnObj: the objective, the left bunker or the pillbox), elsewhere off the way up it
// keeps facing the way they went, and on the way up it turns with the way up. Checks: walking up the sand; Bryan's picture (the left bunker held,
// sent up the beach to the road by it: facing north on the way, then it turns right to the pillbox); sent to the pillbox; there; sent onto the
// first hill's top and on it; back into the draw; a move back the way they came doesn't spin it; picking the squad again; a tank still first; the
// village keeps facing north; (Version 185, "Camera still turns into the second hill before I even reach the top of the first") the bunkers
// taken, at the end of the beach it faces the first hill; (Version 186, "At the top of the first hill the camera should swing left") at the top
// of the ramp it faces up the way, even where you'd sent them off it on that hilltop; and (Version 187, "walking up the first hill should gradually
// turn the camera left... towards where the enemy troops are coming from") up the ramp it drifts steadily left to the way up the draw; since
// Version 187 the pillbox isn't a place to take. node camera-follow-test.js [SEED] [PORT]
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
  dashToCover=()=>false;ddDodge=()=>{};   // (and no running for cover or dodging shells on their own: a dodge takes a man off the way he was sent, and the walks are the test)
  window.WRAP=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
  window.WANT=u=>{const w=ddRouteWay(u.x,u.y);return w?Math.atan2(-w.x,-w.y):null;};
  window.SQ=t=>players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);
  window.MID=L=>({x:L.reduce((n,q)=>n+q.x,0)/L.length,y:L.reduce((n,q)=>n+q.y,0)/L.length});
  window.PUT=(t,x,y)=>{const L=SQ(t);L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};
  window.MOVE=(t,x,y)=>{const as=makeAssign(SQ(t),x,y);if(as.length)commit(as);return as.length;};   // (a move of yours, as a tap on the map gives it)
  window.WALK=(max)=>{let n=0;while(SQ('A').some(u=>u.path.length)&&n++<max)RUN(.5);RUN(1.5);};   // (until they're there)
  window.TO=(u,G)=>Math.atan2(-(G.x-u.x),-(G.y-u.y));
  window.OBJ=()=>{const O=ddObjective();return O&&O.cam?O:null;};},[SEED]);
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);dd.ctr={on:true,sq:4,t:1e12};});   // (the counterattack kept back: no tank turns the camera until the test brings one)
await ok('walking up the sand, the camera faces the way they go, up the way as before',()=>{const R=DD_ROUTE;PUT('A',R[1][0]+DDX,R[1][1]);PUT('B',R[1][0]+DDX+120,R[1][1]+20);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(2);
  MOVE('A',R[2][0]+DDX,R[2][1]);RUN(3);const u=ddTrackAt(),w=WANT(u);return{ok:Math.abs(WRAP(yaw-w))<.3,yaw:+yaw.toFixed(2),wayUp:+w.toFixed(2)};});
await ok('Bryan\'s picture: the left bunker taken, sent up the beach to the road by it: facing north on the way, and once there it turns right (since Version 187 to the first hill: the pillbox isn\'t a place to take any more)',()=>{
  for(const e of enemies)if(e.tag==='left'&&!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}dd.held=dd.held||{};dd.held.left=true;
  for(const e of enemies)if(e.tag==='pill'&&!beaten(e))e.hp=1e6;   // (the pillbox's men still there: they can't be shot down meanwhile, by Bravo either)
  const L=DD_SPOT.leftMG.x+DDX;for(const o of dd.wires||[])if(o.y===340&&!o.gone&&Math.abs(o.x+o.w/2-L)<160)ddWreck(o,null);   // (a gap blown in the wire below the left bunker: climbing it can take longer than the test waits)
  PUT('A',L+10,430);PUT('B',L+150,440);ddGoSquad('A');RUN(3);MOVE('A',L,305);const G=dd.cam.go,off=Math.round(ddRouteOff(G.x,G.y));RUN(1.5);const onTheWay=yaw;
  WALK(80);RUN(4);const u=ddTrackAt(),O=OBJ(),W=ddTurnWant(u),first=Math.max(DD_FIRST.maxR,TO(MID(SQ('A')),DD_FIRST));
  return{ok:off>100&&!O&&Math.abs(WRAP(onTheWay-G.a))<.3&&!!W&&Math.abs(WRAP(yaw-W.a))<.3&&Math.abs(WRAP(yaw-first))<.3&&WRAP(G.a-yaw)>.9,offTheWay:off,objective:O&&O.t,onTheWay:+onTheWay.toFixed(2),sent:+G.a.toFixed(2),yaw:+yaw.toFixed(2),firstHill:+first.toFixed(2),lead:[Math.round(u.x),Math.round(u.y)]};});
await ok('sent from there to the pillbox: it faces the way there',()=>{const M0=MID(SQ('A'));MOVE('A',DD_SPOT.pill.x+DDX-30,262);const G=dd.cam.go,to=TO(M0,G);RUN(2.5);
  return{ok:G.a!=null&&Math.abs(WRAP(yaw-to))<.15&&yaw<-.8,yaw:+yaw.toFixed(2),toward:+to.toFixed(2)};});
await ok('there it doesn\'t turn back up the draw (it faces the first hill, or the way it came if it\'s right by it)',()=>{WALK(30);RUN(5);const u=ddTrackAt(),w=WANT(u),O=OBJ();
  return{ok:WRAP(w-yaw)>.4,yaw:+yaw.toFixed(2),wayUpWouldBe:+w.toFixed(2),objective:O&&O.t};});
await ok('sent onto the first hill\'s top: on the way it faces where they\'re going, up onto the hill, not up the draw; up there it keeps facing on',()=>{const M0=MID(SQ('A'));MOVE('A',1078,105);const G=dd.cam.go;RUN(3);let u=ddTrackAt();const on=Math.abs(WRAP(yaw-TO(M0,G)))<.15,w=WANT(u),y1=yaw;
  WALK(160);const v=ddTrackAt(),w2=WANT(v),up=SQ('A').filter(q=>hyp(q.x-G.x,q.y-G.y)<250&&groundH(q.x,q.y)>80).length;RUN(3);
  return{ok:on&&Math.abs(WRAP(y1-w))>.6&&up>=1&&Math.abs(WRAP(yaw-G.a))<.05&&Math.abs(WRAP(yaw-w2))>.6,
    onTheWay:+y1.toFixed(2),wayUpThen:+w.toFixed(2),yaw:+yaw.toFixed(2),wayUp:+w2.toFixed(2),onTheHill:up,lead:[Math.round(v.x),Math.round(v.y)]};});
await ok('a move back onto the way up, into the draw: it turns up the draw again',()=>{const R=DD_ROUTE;MOVE('A',R[6][0]+DDX,R[6][1]);WALK(200);RUN(3);const u=ddTrackAt(),w=WANT(u);
  return{ok:u.y<=20&&Math.abs(WRAP(yaw-w))<.2&&w>.3&&dd.cam.offA==null,yaw:+yaw.toFixed(2),want:+w.toFixed(2),at:[Math.round(u.x),Math.round(u.y)]};});
await ok('sent back down toward the beach, off the way up: it doesn\'t spin round to face back',()=>{const y0=yaw;MOVE('A',DD_SPOT.pill.x+DDX+40,330);RUN(4);const G=dd.cam.go;
  return{ok:Math.abs(WRAP(yaw-y0))<.25&&G.a==null,yaw:+yaw.toFixed(2),before:+y0.toFixed(2)};});
await ok('picking the squad again forgets where they were sent: it faces what it would with no move given (the next bunker, the first hill or the way up)',()=>{WALK(60);ddGoSquad('A');RUN(5);const u=ddTrackAt(),W=ddTurnWant(u);
  return{ok:!dd.cam.go&&!!W&&Math.abs(WRAP(yaw-W.a))<.35,yaw:+yaw.toFixed(2),want:W?+W.a.toFixed(2):null};});
await ok('Versions 185 to 187, the bunkers taken: at the end of the beach the camera faces the first hill; up the ramp it drifts steadily left, toward the way up the draw where their men come down from, and by the top it faces up the draw; on up it stays so',()=>{
  for(const e of enemies)if((e.tag==='left'||e.tag==='pill')&&!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}dd.held.left=true;
  PUT('A',745,300);PUT('B',860,320);ddGoSquad('A');RUN(4);let u=ddTrackAt(),M=MID(SQ('A'));const F=DD_FIRST,r=v=>+v.toFixed(2);
  const st=[{at:'end of the beach',yaw:yaw,first:Math.max(F.maxR,TO(M,F)),way:WANT(u),y:Math.round(u.y)}];
  for(const[x,y,n]of[[760,236,'foot of the ramp'],[768,186,'half way up'],[772,150,'near the top'],[800,70,'at the top']]){MOVE('A',x,y);WALK(60);RUN(3);u=ddTrackAt();M=MID(SQ('A'));const W=ddTurnWant(u);
    st.push({at:n,yaw:yaw,want:W?W.a:null,first:Math.max(F.maxR,TO(M,F)),way:WANT(u),y:Math.round(u.y),h:Math.round(groundH(u.x,u.y))});}
  MOVE('A',735,-30);WALK(60);RUN(4);u=ddTrackAt();const top={yaw:yaw,way:WANT(u),y:Math.round(u.y)};
  const e=st[0],T=st[st.length-1],ramp=st.slice(1,-1);
  const ok=Math.abs(WRAP(e.yaw-e.first))<.2&&WRAP(e.way-e.yaw)>.4
    &&st.slice(1).every(q=>q.want!=null&&Math.abs(WRAP(q.yaw-q.want))<.15)   // (settled on what it wants at each)
    &&st.every((q,i)=>i===0||WRAP(q.yaw-st[i-1].yaw)>.08)&&WRAP(T.yaw-e.yaw)>1.1   // (each step up further left than the one before, about 70 degrees in all)
    &&ramp.every(q=>WRAP(q.yaw-q.first)>.05&&WRAP(q.way-q.yaw)>.05)   // (on the ramp between the first hill and the way up)
    &&T.y<=F.top&&Math.abs(WRAP(T.yaw-T.way))<.15&&Math.abs(WRAP(top.yaw-top.way))<.2&&top.way>.3;
  return{ok,steps:st.map(q=>({at:q.at,yaw:r(q.yaw),firstHill:r(q.first),wayUp:r(q.way),y:q.y})),onTop:{yaw:r(top.yaw),wayUp:r(top.way),y:top.y}};});
await ok('Version 186: sent from the end of the beach to the far side of the ramp\'s top, off the way up: on the way it faces where they\'re going; once they\'re there it swings left, up the way',()=>{
  PUT('A',745,300);ddGoSquad('A');RUN(3);MOVE('A',880,60);const G=dd.cam.go,off=Math.round(ddRouteOff(G.x,G.y));RUN(2.5);const onTheWay=yaw;
  WALK(80);RUN(3);const u=ddTrackAt(),w=WANT(u);
  return{ok:off>DD_TURN.off&&G.a!=null&&Math.abs(WRAP(onTheWay-G.a))<.3&&u.y<=DD_FIRST.top&&Math.abs(WRAP(yaw-w))<.2&&WRAP(yaw-G.a)>.8&&!dd.cam.go,
    offTheWay:off,sent:+G.a.toFixed(2),onTheWay:+onTheWay.toFixed(2),yaw:+yaw.toFixed(2),wayUp:+w.toFixed(2),lead:[Math.round(u.x),Math.round(u.y)]};});
await ok('sent off the way again with a tank coming: the tank still comes first',()=>{MOVE('A',1078,105);RUN(2);const u=ddTrackAt(),K=(ddTankSpawn({x:u.x+500,y:u.y-300,ang:Math.PI,way:[]}),dd.tanks[dd.tanks.length-1]);K.fireT=1e12;RUN(5);
  const v=ddTrackAt(),to=TO(v,K);const r={ok:Math.abs(WRAP(yaw-to))<.2,yaw:+yaw.toFixed(2),tank:+to.toFixed(2)};K.hp=0;return r;});
await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(300);
await ok('the village: a move doesn\'t turn it (it keeps facing north)',()=>{RUN(2);selectTeam(dd.active);dd.track={team:dd.active};ddTurnFree();yaw=0;updateCamera();RUN(1);
  const t=dd.active,c=MID(SQ(t));MOVE(t,c.x+260,c.y-60);RUN(5);return{ok:Math.abs(yaw)<.02,yaw:+yaw.toFixed(3)};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

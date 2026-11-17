// Version 177 (Bryan, after Version 176: "The view never automatically changed"): a drag of the map lets go of the squad; a move order for the
// squad you play takes it up again (combat.js's commit -> ddplay.js's ddFollowAgain), so the camera glides back and turns with the route. Real
// mouse drags and clicks on the map. node follow-again-test.js [SEED] [PORT]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const SEED=+process.argv[2]||1,PO=+process.argv[3]||0;
(async()=>{const port=9912+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:390,height:760});
const ev=(f,a)=>page.evaluate(f,a);let fails=0;
const ok=async(l,f,a)=>{let r;try{r=await ev(f,a);}catch(e){r={ok:false,err:String(e).slice(0,300)};}if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));return r;};
await ev(([SEED])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(SEED*7919);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}updateCamera();};
  const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);
  window.WRAP=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
  window.SQ=()=>players.filter(p=>p.team===dd.active&&alive(p)&&!p.joining&&!p.inBoat);
  window.MID=()=>{const L=SQ();return{x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length};};
  window.SCR=(x,y)=>{updateCamera();toSBack=false;const p=toS(x,y,0);return toSBack?null:p;};
  window.PUT=(t,x,y)=>{const L=players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);   // (not a man still in a boat or walking up to join: moved, the boat put him back on the sand when it unloaded him, and he dragged the squad's middle back down the beach)
  L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};},[SEED]);
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(3);for(const e of enemies)e.sup=1;});
const drag=async(dx,dy)=>{const x0=195,y0=330;await page.mouse.move(x0,y0);await page.mouse.down();for(let k=1;k<=8;k++)await page.mouse.move(x0+dx*k/8,y0+dy*k/8);await page.mouse.up();await ev(()=>{if(typeof glide!=='undefined'&&glide){glide.vx=glide.vz=0;}});};
// a move order the way a player gives one: a tap where to go, then a tap on the marker of the move
// (Version 179: the spot is the nearest to the one asked for that's free ground and on the screen, under the top row and over the squad's bar: after
// the drag, 12 m north of the squad could be off the screen's edge or on blocked ground, and the tap did nothing, on Version 178 as well)
const move=async(fx,fy)=>{const p=await ev(([fx,fy])=>{const m=MID(),c=[];for(let r=0;r<=90;r+=15)for(let a=0;a<6.28;a+=r?.5:7){const x=m.x+fx+Math.cos(a)*r,y=m.y+fy+Math.sin(a)*r,q=SCR(x,y);
    if(q&&isFree(x,y)&&q[0]>30&&q[0]<cw-30&&q[1]>150&&q[1]<ch-230&&!(typeof ddcEnemyAt==='function'&&ddcEnemyAt(q[0],q[1]))&&!players.some(u=>{if(!alive(u))return false;toSBack=false;const z=toS(u.x,u.y,14);return!toSBack&&hyp(z[0]-q[0],z[1]-q[1])<34;}))return q;}return null;},[fx,fy]);if(!p)return false;   // (nor on one of ours: a tap on a man picks him)   // (and not by an enemy on the screen: a tap there is a fire order and opens the ring of actions, ddctl.js)
  await ev(()=>{if(typeof ddcClose==='function')ddcClose();if(dd)dd.fireAt=0;});
  await page.mouse.click(p[0],p[1]);await page.waitForTimeout(80);const q=await ev(()=>preview?SCR(preview.x,preview.y):null);if(!q)return 'no preview';
  await ev(()=>{CLK+=1.5;});await page.mouse.click(q[0],q[1]);return await ev(()=>!preview);};
await ok('after landing it follows the squad',()=>({ok:!!dd.track&&dd.track.team===dd.active,track:dd.track}));
await drag(-140,90);
await ok('a drag of the map lets go of the squad',()=>({ok:!dd.track,track:dd.track}));
await ok('the view stays where it was dragged meanwhile',()=>{const c0={x:camT.x,z:camT.z};RUN(3);return{ok:hyp(camT.x-c0.x,camT.z-c0.z)<2,moved:Math.round(hyp(camT.x-c0.x,camT.z-c0.z))};});
let m1=null;for(const[fx,fy]of[[0,-120],[50,-100],[-50,-100],[0,-80]]){m1=await move(fx,fy);if(m1===true)break;await ev(()=>{preview=null;});}console.log('  the first move:',m1);   // (a spot that gives no move: the next one)
await ok('a move order (tap, then tap the marker): the camera follows the squad again',()=>({ok:!!dd.track&&dd.track.team===dd.active,track:dd.track}),null);
await ok('and glides back to it',()=>{RUN(4);const u=ddTrackAt(),tx=u.x-Math.sin(yaw)*DD_CAM.look,tz=u.y-Math.cos(yaw)*DD_CAM.look;return{ok:hyp(camT.x-tx,camT.z-tz)<40,off:Math.round(hyp(camT.x-tx,camT.z-tz))};});
// up the draw: dragged away, then a move up it, and the view turns north-west with the route
await ev(()=>{const R=DD_ROUTE;PUT('A',R[7][0]+DDX,R[7][1]);PUT('B',R[6][0]+DDX,R[6][1]);dd.front=Math.min(dd.front,-20);ddGoSquad('A');RUN(3);});   // (Version 185: well up the draw, past the first hill's top; just past it, as before, men that had drifted back down the ramp made the camera face the first hill, as it should there)
await drag(120,-60);
await ok('up the draw, dragged: let go',()=>({ok:!dd.track}));
const turnTo=await ev(()=>{const R=DD_ROUTE;yaw=0;updateCamera();window.Y0=yaw;return{fx:R[8][0]+DDX-MID().x,fy:R[8][1]-MID().y};});   // (the view put back facing north, as the old camera had it)
let mv=null;for(const k of[.6,.4,.8,.25,1,.15]){mv=await move(turnTo.fx*k,turnTo.fy*k);if(mv===true)break;await ev(()=>{preview=null;});}   // (a spot that can't be reached gives no move: the next one along)
console.log('  the move up the draw:',mv);
await ok('a move up the draw: following again, and the view turns along the route (north-west)',()=>{RUN(5);const t=ddTrackAt();if(!t)return{ok:false,why:'not following',track:dd.track};const w=ddRouteWay(t.x,t.y),want=Math.atan2(-w.x,-w.y);return{ok:!!dd.track&&Math.abs(WRAP(yaw-want))<.25&&want>.4&&Math.abs(Y0)<.01,yaw:+yaw.toFixed(2),want:+want.toFixed(2),before:+Y0.toFixed(2)};});
// the counterattack: you hold a base; a move doesn't make the camera follow
await ev(()=>{ddRoster.stage=1;ddmSave();startCounter();});await page.waitForTimeout(400);
await ev(()=>{RUN(4);dd.track=null;});
await ok('the counterattack: a move order leaves the camera where it is',()=>{const m=SQ();const as=makeAssign(m,MID().x,MID().y-60);if(as.length)commit(as);return{ok:!dd.track,track:dd.track,moved:as.length};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
(async()=>{const srv=await serve('/home/user/full-spectrum/dday',9795);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,'http://localhost:9795/index.html?noseq&gfx=0');await page.setViewportSize({width:390,height:760});
await page.evaluate(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4001);});
await page.click('#ddBtn');await page.waitForTimeout(600);
await page.evaluate(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);for(let i=0;i<600;i++)update(1/30);
  window.STEP=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};
  for(const e of enemies)if(e.tag!=='outpost'&&e.y>-150){e.hp=0;e.dead=true;}for(const e of enemies)if(e.tag==='outpost')e.stunT=simT+9999;
  for(const k of['beach','left','nest'])dd.held[k]=true;
  players.forEach((u,k)=>Object.assign(u,{x:DDX+590+(k%4)*14,y:150+((k/4)|0)*16,path:[],inBoat:false,afloat:false,joining:false}));selectTeam('A');dd.active='A';ddGoSquad('A');STEP(4);});
const T=()=>page.evaluate(()=>({yaw:+yaw.toFixed(2),track:dd.track&&(dd.track.id||dd.track.team),cap:dd.cam&&dd.cam.cap&&dd.cam.cap.k,go:!!(dd.cam&&dd.cam.go&&!dd.cam.go.done),held:!!dd.held.outpost,lead:(()=>{const u=ddTrackAt();return u?[Math.round(u.x-DDX),Math.round(u.y)]:null;})(),obj:(ddObjective()||{}).t}));
const clickW=async(x,y)=>page.evaluate(([x,y])=>{updateCamera();const q=toS(x+DDX,y);tap(q[0],q[1]);const u=players.find(p=>p.team==='A');return[Math.round(q[0]),Math.round(q[1]),u.path.length];},[x,y]);
console.log('start',JSON.stringify(await T()));
for(const[x,y]of[[640,110],[700,70]]){console.log('click',JSON.stringify(await clickW(x,y)));await page.evaluate(()=>STEP(7));console.log(' ',JSON.stringify(await T()));}
// into the yard by a tap, then they die
await page.evaluate(()=>{dd.track=null;camT.x=DDX+700;camT.z=40;updateCamera();});   // (a drag of the map to bring the yard into view, as a player does: the camera is let go)
console.log('click',JSON.stringify(await clickW(748,-10)));await page.evaluate(()=>STEP(10));console.log('in yard',JSON.stringify(await T()));
await page.evaluate(()=>{for(const e of enemies)if(e.tag==='outpost'){e.hp=0;e.dead=true;}});
for(let i=0;i<8;i++){await page.evaluate(()=>STEP(2));console.log('+'+(i*2+2)+'s',JSON.stringify(await T()));}
console.log('errors',errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

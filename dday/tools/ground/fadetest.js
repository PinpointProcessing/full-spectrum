// does a barracks between the camera and our men fade? node fadetest.js PORT OUT
const SP='/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad';
const {chromium}=require('/opt/node-tools/node_modules/playwright');const {serve,open}=require(SP+'/harness.js');
(async()=>{const port=9700+(+process.argv[2]),srv=await serve(process.env.DDROOT,port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=2`);await page.setViewportSize({width:640,height:480});
await page.evaluate(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4242);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);});
await page.click('#ddBtn');await page.waitForTimeout(400);
const r=await page.evaluate(()=>{let n=0;RUN(7);while(!dd.land.done&&n++<200)RUN(.25);RUN(1);
  const B=DD.objs.find(o=>o.kind==='ddbarr');const cx=B.x+B.w/2,cy=B.y+B.h/2;
  for(const p of players){if(p.team==='A'&&!p.npc){p.x=cx+(Math.random()-.5)*40;p.y=B.y-14;p.path=[];p.inBoat=false;}}
  dd.track=null;camPan=null;zoom=6;yaw=0;tilt=ddTilt(6,.33);camT={x:cx,z:B.y-14};updateCamera();
  const out=[];for(let k=0;k<12;k++){ddGroundFrame(1/30,0,1/30);out.push((B.gFadeA??1).toFixed(2));}render(.03,simT);
  return {fade:out.join(','),fadeTo:B.gFadeTo,cam:[camera.position.x|0,camera.position.y|0,camera.position.z|0],box:B._gBox?[B._gBox.min.y|0,B._gBox.max.y|0]:null};});
await page.waitForTimeout(300);await page.evaluate(()=>render(.03,simT));await page.screenshot({path:process.argv[3]});
console.log(JSON.stringify(r),'errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();

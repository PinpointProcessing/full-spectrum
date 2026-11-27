const {chromium}=require('playwright');const {serve,open}=require('../harness.js');
(async()=>{const srv=await serve('/home/user/full-spectrum/dday',9747);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,'http://localhost:9747/index.html?gfx=1');await page.setViewportSize({width:390,height:760});
await page.evaluate(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(77);});await page.click('#ddBtn');await page.waitForTimeout(600);
const r=await page.evaluate(()=>{damage=()=>{};let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  const o={};o.draw=enemies.filter(e=>!e.dead&&e.y<240&&e.y>-220&&e.x-DDX>380&&e.x-DDX<760).map(e=>e.tag+':'+Math.round(e.x-DDX)+','+Math.round(e.y)+(e.gunner?' mg':''));
  o.bags=objs.filter(q=>q.kind==='sandbag'&&q.x-DDX>300&&q.x-DDX<780&&q.y>-220&&q.y<345).map(q=>(q.x-DDX)+','+q.y+','+q.w+'x'+q.h);
  o.crates=objs.filter(q=>q.kind==='ddcrate').map(q=>(q.x-DDX)+','+q.y);
  for(const k of['left','nest','hill'])for(const e of enemies)if(e.tag===k||e.tag==='pill')e.dead=true;
  players.filter(p=>p.team==='A').forEach((u,k)=>Object.assign(u,{x:DDX+455+k*12,y:318+(k%2)*10,path:[],inBoat:false,afloat:false,joining:false}));players.filter(p=>p.team==='B').forEach((u,k)=>Object.assign(u,{x:DDX+560+k*14,y:330,path:[],inBoat:false,afloat:false,joining:false}));
  selectTeam('A');dd.active='A';for(let i=0;i<150;i++){update(1/30);panTick(1/30);if(i%5==0)ddFrame(1/6,simT);}
  o.cam=[camT.x-DDX,camT.z,yaw,zoom].map(v=>+v.toFixed(2));return o;});
console.log(JSON.stringify(r));await page.evaluate(()=>{ddFrame(1/30,simT);});await page.waitForTimeout(500);await page.evaluate(()=>{ddFrame(1/30,simT);});await page.waitForTimeout(200);await page.screenshot({path:'where.png'});await b.close();srv.close();process.exit(0);})();

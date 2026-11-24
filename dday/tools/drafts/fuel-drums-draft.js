// the fuel drums: close pictures and the map's data. node drumpics.js [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const PORT=+process.argv[2]||9797,OUT=process.env.OUT||'.';
(async()=>{const srv=await serve(process.env.DDROOT,PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4002);localStorage.removeItem('warehouseYard.ddmeta.v1');});
await page.click('#ddBtn');await page.waitForTimeout(600);
const shot=async n=>{await ev(()=>{bigText('');ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(450);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${n}.png`});};
const data=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);ddShelling=()=>{};let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  for(const e of enemies){e.nade=0;e.stunT=1e9;}ddWaves=()=>{};for(const u of dd.npcs){u.hp=0;u.dead=true;if(u.m)u.m.g.visible=false;}
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false,sup:0}));
  window.DR=()=>objs.filter(o=>o.kind==='dddrum'&&o.explosive);
  return{ddx:DDX,objs:objs.filter(o=>o.kind!=='drop'&&!o.hid).map(o=>({k:o.kind,x:Math.round(o.x-DDX),y:Math.round(o.y),w:o.w,h:o.h,e:o.explosive?1:0,tag:o.tag||''})),drops:objs.filter(o=>o.kind==='drop').map(o=>[Math.round(o.x-DDX),o.y,o.w,o.h]),
    route:typeof DD_ROUTE!=='undefined'?DD_ROUTE:null,en:enemies.filter(e=>!e.dead).map(e=>[Math.round(e.x-DDX),Math.round(e.y),e.gunner?1:0])};});
fs.writeFileSync(OUT+'/drums.json',JSON.stringify(data));console.log('objs',data.objs.length,'drums',data.objs.filter(o=>o.e).length);
// close on the pillbox's drums, the squad at the wire below them
await ev(()=>{const o=DR().find(q=>Math.round(q.x-DDX)===722);PUT('A',700,352);PUT('B',560,420);selectTeam('A');dd.active='A';dd.track=null;camPan=null;RUN(.4);zoom=11;yaw=0;tilt=ddTilt(11,.5);camT.x=o.x+4;camT.z=o.y+52;updateCamera();window.O1=o;});await shot('k1-close');
// the same, the moment it goes up
await ev(()=>{const o=O1,L=enemies.filter(e=>!beaten(e)&&!e.gunner).slice(0,2);L.forEach((e,i)=>Object.assign(e,{x:o.x+8+(i?-26:24),y:o.y+8+(i?-6:10),path:[],hp:100}));RUN(.2);ddDrumShoot(o);let T=0;for(;T<40&&!o.burst;T++)RUN(.1);RUN(.22);zoom=11;tilt=ddTilt(11,.5);camT.x=o.x+4;camT.z=o.y+52;updateCamera();});await shot('k2-blast');
await ev(()=>{RUN(1.1);zoom=11;tilt=ddTilt(11,.5);updateCamera();});await shot('k3-after');
// the top: the mortar pits' drums and the trucks'
await ev(()=>{const o=DR().find(q=>Math.round(q.x-DDX)===890);PUT('A',860,-400);selectTeam('A');RUN(.3);zoom=9.5;yaw=0;tilt=ddTilt(9.5,.45);camT.x=o.x;camT.z=o.y+70;updateCamera();});await shot('k4-top');
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

// Version 190: close looks at the tank model (a live Panzer on the top, the same knocked out, the beach wreck), drawn straight through the renderer with a camera of its own. node tank-look.js PO OUT (run from the scratchpad, harness.js there; DDROOT = the dday folder)
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const PO=+process.argv[2]||9,OUT=process.argv[3]||'.';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const port=9700+PO,srv=await serve(process.env.DDROOT,port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=2`);await page.setViewportSize({width:640,height:480});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4242);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'&&!t.npc?undefined:d0(t,d,s);});
await page.click('#ddBtn');await page.waitForTimeout(400);await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.25);RUN(1);});
const shot=async(name,c)=>{await ev(c=>{const cam=window._tc||(window._tc=new THREE.PerspectiveCamera(40,640/480,1,9000));cam.position.set(c[0],c[1],c[2]);cam.lookAt(c[3],c[4],c[5]);cam.updateMatrixWorld();
  renderer.toneMapping=DDL_TONE.map;renderer.toneMappingExposure=DDL_TONE.exp||1.26;renderer.setRenderTarget(null);renderer.render(DD.scene,cam);},c);await page.waitForTimeout(300);
  await ev(c=>{const cam=window._tc;renderer.render(DD.scene,cam);},c);await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${name}.png`});console.log('shot',name);};
const wr=await ev(()=>{const o=objs.find(o=>o.kind==='ddwreck'&&!o.lc);return o&&{x:o.x+o.w/2,y:o.y+o.h/2,h:ddH(o.x+o.w/2,o.y+o.h/2)};});
if(wr)await shot('beachwreck',[wr.x+70,wr.h+40,wr.y+75,wr.x,wr.h+8,wr.y]);
const K=await ev(()=>{const K=ddTankSpawn({x:820,y:-560,ang:Math.PI*.8,name:'Test',hold:true});K.tur.rotation.y=.3;return {x:K.x,y:K.y,h:ddH(K.x,K.y)};});
await shot('tank_side',[K.x+60,K.h+38,K.y+75,K.x,K.h+12,K.y]);await shot('tank_far',[K.x+120,K.h+120,K.y+160,K.x,K.h+10,K.y]);
await ev(()=>{const K=dd.tanks[dd.tanks.length-1];ddTankHit(K.x,K.y,3);RUN(4);});await shot('tank_dead',[K.x+60,K.h+38,K.y+75,K.x,K.h+12,K.y]);
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

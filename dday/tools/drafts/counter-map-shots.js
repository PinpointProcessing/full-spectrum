// Chapter 2's new map: a straight-down picture and the battle's own view. node map231.js OUTDIR [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'map231',PORT=+process.argv[3]||9930;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve('/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:1000,height:1300});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');window.requestAnimationFrame=()=>0;startCounter();bigText('');});await page.waitForTimeout(900);
const info=await ev(()=>{for(let i=0;i<90;i++)update(1/30);
  for(const q of['.bar','.panel','#sq','#ddObj','#banner','#bigText','#hint','#ddChip','#tl','#cards','#fitBtn','#gaitBtn','#dcBar','#dcNoRe'])for(const e of document.querySelectorAll(q))e.style.visibility='hidden';
  const T=THREE,cx=800,cy=70,hh=860,hw=hh*cw/ch;const c=new T.OrthographicCamera(-hw,hw,hh,-hh,1,4000);c.position.set(cx,1200,cy);c.up.set(0,0,-1);c.lookAt(cx,0,cy);c.updateProjectionMatrix();c.updateMatrixWorld();
  window.BIRD=()=>{updateCamera();render(.02,simT);scene.traverse(o=>{o.frustumCulled=false;});const f=scene.fog;scene.fog=null;renderer.setRenderTarget(null);renderer.render(scene,c);scene.fog=f;ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);};
  BIRD();return{ph:dd.dc.ph,guns:dd.dc.guns.map(g=>g.k+':'+(g.man?g.man.name:g.going?'going':'-')),npc:dd.npcs.length,foes:enemies.length,hCliff:[ddH(1000,0),ddH(1040,0),ddH(1100,0),ddH(1300,0)].map(Math.round)};});
console.log(JSON.stringify(info));await page.waitForTimeout(900);await ev(()=>BIRD());await page.waitForTimeout(300);await page.screenshot({path:OUT+'/bird.png'});
await page.setViewportSize({width:390,height:760});await page.waitForTimeout(400);
for(const[n,x,z,zm,p,yw]of[['battle',700,440,4.6,.6,0],['guns',780,470,7,.5,0],['field',700,60,3.4,.42,0],['check',720,-190,6.5,.5,0],['fork',650,-60,6,.45,0],['checkside',760,-230,7,.5,.9],['beach',900,300,3.6,.5,-.9]]){
  await ev(([x,z,zm,p,yw])=>{for(const q of['.bar'])for(const e of document.querySelectorAll(q))e.style.visibility='';dd.track=null;camPan=null;zoom=zm;yaw=yw;tilt=ddTilt(zm,p);camT.x=x;camT.z=z;for(let i=0;i<2;i++){updateCamera();ddFrame(.03,simT);render(.03,simT);}ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);},[x,z,zm,p,yw]);
  await page.waitForTimeout(700);await ev(()=>{updateCamera();render(.001,simT);ox.clearRect(0,0,cw,ch);});await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${n}.png`});}
console.log('errors',errors.length,errors.slice(0,4));await b.close();srv.close();process.exit(0);})();

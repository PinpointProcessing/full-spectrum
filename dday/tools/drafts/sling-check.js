// close looks at the slung rifles, the rifle by a seated man and the radio antenna (Version 239: they went through the helmets). DDROOT=<dday folder> node sling-check.js OUT [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'g244',PORT=+process.argv[3]||9830;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT,PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:600,height:600});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);window.requestAnimationFrame=()=>0;startCounter();});await page.waitForTimeout(800);
await ev(()=>{let n=0;while(dd.seq&&dd.seq.t<6&&n++<1200){update(1/30);ddCam(1/30);}});
const views=[[0,0,'a-back'],[0,1.6,'a-side'],[0,-1.6,'a-side2'],[5,1.6,'sit'],[3,0.7,'stand']];
for(const[i,da,n]of views){await ev(([i,da])=>{const u=players[i],a=u.ang+Math.PI+da,g=ddH(u.x,u.y);window.__cam=()=>{camera.position.set(u.x+Math.cos(a)*42,g+20,u.y+Math.sin(a)*42);camera.lookAt(u.x,g+11,u.y);camera.updateMatrixWorld();};
  window.dcSeqCam=()=>{__cam();return true;};document.body.classList.remove('cine');for(let k=0;k<2;k++){__cam();render(.03,simT);}},[i,da]);await page.waitForTimeout(600);await ev(()=>{__cam();render(.001,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});}
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

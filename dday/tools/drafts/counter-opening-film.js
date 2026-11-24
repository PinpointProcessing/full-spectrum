// Films Chapter 2's opening from the game: node film228.js OUT [port fps secs]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'film228',PORT=+process.argv[3]||9900,FPS=+process.argv[4]||12,SECS=+process.argv[5]||19;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);window.requestAnimationFrame=()=>0;startCounter();bigText('');});await page.waitForTimeout(900);
const N=Math.round(SECS*FPS);for(let k=0;k<N;k++){
  await ev(d=>{const n=Math.round(d*60);for(let i=0;i<n;i++){update(1/60);panTick(1/60);}ddCam(d);render(d,simT);if(!(dd.seq&&dd.seq.ph==='hut'))drawOverlay(d,simT);hud();},1/FPS);
  await page.waitForTimeout(160);await page.screenshot({path:`${OUT}/f-${String(k).padStart(3,'0')}.png`});if(k%24===0)console.log(k,JSON.stringify(await ev(()=>dd.seq?dd.seq.ph:dd.dc.ph)));}
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

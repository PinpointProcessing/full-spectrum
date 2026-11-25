// stills at each beat of Chapter 2's opening (Version 239). DDROOT=<dday folder> node counter-opening-shots.js OUT [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'s239',PORT=+process.argv[3]||9800;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT,PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);window.requestAnimationFrame=()=>0;startCounter();});await page.waitForTimeout(800);
const to=t=>ev(t=>{let n=0;while(dd.seq&&dd.seq.t<t&&n++<1200){update(1/30);ddCam(1/30);}return dd.seq?dd.seq.ph:'done';},t);
const shot=async n=>{await ev(()=>{for(let i=0;i<2;i++){if(dd.seq)ddCam(.03);render(.03,simT);if(!(dd.seq&&dd.seq.ph==='hut'))drawOverlay(.03,simT);}hud();});await page.waitForTimeout(700);await ev(()=>{if(dd.seq)ddCam(.001);render(.001,simT);if(!(dd.seq&&dd.seq.ph==='hut'))drawOverlay(.001,simT);});await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${n}.png`});};
for(const[t,n]of[[1.6,'01'],[3.6,'02'],[5.5,'03'],[7.2,'04'],[9.0,'05'],[10.7,'06'],[12.4,'07'],[14.0,'08'],[15.9,'09'],[16.85,'10'],[18.6,'11'],[21.5,'12'],[24.6,'13']]){const ph=await to(t);console.log(n,t,ph);await shot(n);}
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

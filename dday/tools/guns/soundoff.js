// The page with sound off (and once more with it on), each chapter started and run a while: page errors counted.
const {chromium}=require('playwright');const {serve,open}=require('/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');
const PO=+process.argv[2]||0;
(async()=>{const port=9700+PO,srv=await serve(process.env.DDROOT,port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
for(const mode of['off','on']){
  const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:390,height:760});
  await page.evaluate(m=>{localStorage.setItem('warehouseYard.sound',m);},mode);await page.reload();await page.waitForTimeout(2500);
  const ev=(f,a)=>page.evaluate(f,a);
  await ev(()=>{window.requestAnimationFrame=()=>0;window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){const ts=timeScale();if(ts>0)update(ts/30);panTick(1/30);if(typeof ddFrame==='function'&&MAPID==='dd')ddFrame(1/30,simT);audioFrame();}};});
  await page.click('#ddBtn');await page.waitForTimeout(400);
  const r1=await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.25);RUN(20);return {snd:sndOn,ac:!!AC,booms:booms.length,simT:+simT.toFixed(1)};});
  await ev(()=>{ddRoster.stage=1;ddmSave();startCounter();});await page.waitForTimeout(500);const r2=await ev(()=>{RUN(25);return +simT.toFixed(1);});
  await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(500);const r3=await ev(()=>{RUN(25);return +simT.toFixed(1);});
  console.log(mode,JSON.stringify(r1),r2,r3,'errors',errors.length,errors.slice(0,3));await page.close();}
await b.close();srv.close();})();

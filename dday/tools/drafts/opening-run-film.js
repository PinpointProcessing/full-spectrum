// Chapter 2's opening from a little before INCOMING to the fight, a frame at a time, for looking at the run to the front (Version 249).
// node opening-run-film.js OUT [port fps before after]   before: seconds of the camp before the shell's sound; after: seconds from then on
// (DDROOT = the dday folder; HARNESS = the scratchpad's harness.js). Then: python3 opening-run-sheet.py OUT sheet.jpg [every]
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const OUT=process.argv[2]||'runfilm',PORT=+process.argv[3]||9901,FPS=+process.argv[4]||8,BEFORE=+process.argv[5]||1,AFTER=+process.argv[6]||13;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1${process.env.Q||''}`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);window.requestAnimationFrame=()=>0;window.FERR=[];startCounter();bigText('');});await page.waitForTimeout(900);
const step=d=>ev(d=>{try{const n=Math.round(d*60);for(let i=0;i<n;i++){update(1/60);panTick(1/60);}ddCam(d);render(d,simT);if(!(dd.seq&&dd.seq.ph==='hut'))drawOverlay(d,simT);hud();}catch(e){FERR.push(e.message+' @'+(e.stack||'').split('\n')[1]);}},d);
for(let k=0;k<4;k++){await step(.1);await page.waitForTimeout(120);}   // (the inside set is drawn once, unseen, in the camp's first frames)
await ev(B=>{let n=0;while(dd.seq&&dd.seq.t<DCS.T.inc-B&&n++<40000){update(1/60);panTick(1/60);}},BEFORE);
const N=Math.round((BEFORE+AFTER)*FPS),log=[];for(let k=0;k<N;k++){await step(1/FPS);await page.waitForTimeout(150);await page.screenshot({path:`${OUT}/f-${String(k).padStart(3,'0')}.png`});
  const s=await ev(()=>({ph:dd.seq?dd.seq.ph:'fight:'+dd.dc.ph,t:dd.seq?+dd.seq.t.toFixed(2):null}));log.push(s.ph);if(k%8===0)console.log(k,JSON.stringify(s));if(s.ph.startsWith('fight')&&log.filter(q=>q.startsWith('fight')).length>FPS*2)break;}
fs.writeFileSync(OUT+'/phases.json',JSON.stringify(log));console.log('errors',errors.length,errors.slice(0,3),await ev(()=>FERR.slice(0,3)));await b.close();srv.close();process.exit(0);})();

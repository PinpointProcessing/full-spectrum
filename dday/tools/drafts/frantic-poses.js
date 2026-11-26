// The scramble's three ways of running beside the plain run (Version 249), close up from the side and from in front, a few moments of the stride.
// node frantic-poses.js OUT [port]   (DDROOT = the dday folder; HARNESS = the scratchpad's harness.js). From behind forward (left to right in the side view): the run, then u.frantic 1, 2, 3, all at the scramble's speed
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const OUT=process.argv[2]||'poses',PORT=+process.argv[3]||9904;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1&noseq`);await page.setViewportSize({width:1100,height:430});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);window.requestAnimationFrame=()=>0;window.FERR=[];startCounter();bigText('');});await page.waitForTimeout(900);
await ev(()=>{const M=window.PM=players.slice(0,4);M.forEach((u,k)=>{u.x=560+k*26;u.y=770;u.ang=0;u.sup=0;u.cool=99;u.frantic=k;u.rushK=1.3;u.franticT=1e9;u.path=[{x:u.x+900,y:u.y}];if(u.m.fig)u.m.fig.phase=k*.27;});
  for(const u of[...players.slice(4),...dd.npcs]){u.x=260;u.y=880;u.path=[];}window.VIEW=0;document.body.classList.add('ddseq','cine');
  window.updateCamera=()=>{const gx=PM.reduce((a,u)=>a+u.x,0)/4,g=ddH(gx,770);if(VIEW===0){camera.position.set(gx,g+16,770+100);camera.lookAt(gx,g+9,770);}else{camera.position.set(gx+105,g+24,770+52);camera.lookAt(gx+2,g+9,770);}camera.updateMatrixWorld();};});
const step=(d,v)=>ev(([d,v])=>{try{window.VIEW=v;const n=Math.round(d*60);for(let i=0;i<n;i++){for(const u of PM){u.path=[{x:u.x+900,y:u.y}];u.lastOrder=simT;u.sup=0;}update(1/60);}render(d,simT);ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);}catch(e){FERR.push(e.message+' @'+(e.stack||'').split('\n')[1]);}},[d,v]);
await step(.7,0);await page.waitForTimeout(300);
for(let k=0;k<6;k++){for(const v of[0,1]){await step(v?0:.07,v);await page.waitForTimeout(250);await ev(v=>{window.VIEW=v;render(.001,simT);},v);await page.waitForTimeout(150);await page.screenshot({path:`${OUT}/${v?'front':'side'}-${k}.png`});}}
console.log(JSON.stringify(await ev(()=>PM.map(u=>({id:u.id,fr:u.frantic,x:Math.round(u.x),spd:Math.round(u.m.fig.spd),w:u.weapon})))));
console.log('errors',errors.length,errors.slice(0,3),await ev(()=>FERR.slice(0,3)));await b.close();srv.close();process.exit(0);})();

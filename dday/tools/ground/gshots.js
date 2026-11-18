// Fixed-camera views of the ground (the same view every run, whatever the battle does): node gshots.js PORT OUTDIR [W H GFX GROUPS]
// GROUPS: beach,counter,village (default all). DDROOT = the dday folder.
const SP='/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad';
const {chromium}=require('/opt/node-tools/node_modules/playwright');const {serve,open}=require(SP+'/harness.js');const fs=require('fs');
const PO=+process.argv[2]||0,OUT=process.argv[3]||'.',W=+process.argv[4]||1280,H=+process.argv[5]||720,GFX=process.argv[6]!=null?+process.argv[6]:2;
const G=(process.argv[7]||'beach,counter,village').split(',');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const port=9700+PO,srv=await serve(process.env.DDROOT,port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=${GFX}`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4242);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);
  window.VIEW=(x,z,zm,yw,pitch,shift)=>{dd.track=null;camPan=null;zoom=zm;yaw=yw;tilt=ddTilt(zm,pitch);camT={x,z};camShift=shift;updateCamera();};
  document.body.classList.add('shotclean');const st=document.createElement('style');st.textContent='body.shotclean #sq,body.shotclean .panel,body.shotclean #hudTop,body.shotclean #ddChip,body.shotclean .banner{opacity:.0!important}';document.head.appendChild(st);});
const snap=async(name,v)=>{await ev(v=>{VIEW(...v);render(.03,simT);VIEW(...v);render(.03,simT);},v);await page.waitForTimeout(300);await ev(v=>{VIEW(...v);render(.03,simT);},v);await page.waitForTimeout(150);
  await page.screenshot({path:`${OUT}/${name}.png`});console.log('shot',name);};
if(G.includes('beach')){await page.click('#ddBtn');await page.waitForTimeout(400);
  await ev(()=>{let n=0;RUN(7);while(!dd.land.done&&n++<200)RUN(.25);RUN(4);});
  await snap('g_beach',[700,580,8.5,0,.38,.09]);
  await snap('g_crater',[590,540,11,.35,.5,0]);
  await snap('g_water',[640,680,9,-.2,.3,.05]);
  await snap('g_cliff',[1050,330,8.5,-.35,.3,.09]);
  await snap('g_wire',[660,380,9,.2,.33,.09]);
  await snap('g_draw',[700,40,8.5,.3,.38,.09]);
  await snap('g_top',[640,-480,8,.9,.36,.09]);
  await snap('g_over',[700,330,2.4,0,.75,0]);}
if(G.includes('counter')){await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');ddRoster=null;startCounter();});await page.waitForTimeout(1200);await ev(()=>{for(let i=0;i<20&&!(dd&&dd.dc);i++)RUN(.25);RUN(4);});
  await snap('g_counter',[700,560,7,0,.35,.09]);await snap('g_field',[640,240,7.5,.3,.33,.09]);}
if(G.includes('village')){await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(600);await ev(()=>RUN(5));
  await snap('g_woods',[700,620,8,0,.38,.09]);await snap('g_vfield',[740,120,6.5,0,.36,.09]);await snap('g_village',[700,-430,6.5,.25,.38,.09]);}
console.log('errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

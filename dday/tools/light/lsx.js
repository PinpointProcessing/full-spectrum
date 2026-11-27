// look-shots.js with the scene builds kept off the game's random numbers (three's uuids draw on Math.random, so any new mesh
// changed every later moment): buildDDay runs on a random stream of its own, so a baseline and a changed copy shoot the same moments.
// node lsx.js PO OUTDIR [W H GFX SCENES]  (scenes also: sky = the ride's view turned up to the horizon)   DDROOT=<dday folder>
const {chromium}=require('playwright');const {serve,open}=require('../../harness.js');const fs=require('fs');
const PO=+process.argv[2]||0,OUT=process.argv[3]||'.',W=+process.argv[4]||390,H=+process.argv[5]||760,GFX=process.argv[6]!=null?+process.argv[6]:2;
const ALL=['ride','ramp','beach','wire','draw','top','counter','village'],SC=(process.argv[7]||ALL.join(',')).split(',');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const port=9700+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=${GFX}`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4242);window.requestAnimationFrame=()=>0;
  const B0=buildDDay;buildDDay=function(){const R=Math.random;let s=99991;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;try{return B0.apply(this,arguments);}finally{Math.random=R;}};
  window.SEED=n=>{Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(n);};window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};
  window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'&&!t.npc?undefined:d0(t,d,s);
  window.SQ=t=>players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);
  window.PUT=(t,x,y)=>{const L=SQ(t);L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};});
const snap=async name=>{await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(350);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(150);
  await page.screenshot({path:`${OUT}/${name}.png`});console.log('shot',name);};
const want=s=>SC.includes(s);
if(['ride','sky','ramp','beach','wire','draw','top'].some(want)){
  await ev(()=>{SEED(4242);document.querySelector('#ddBtn').click();SEED(1001);});await page.waitForTimeout(400);await ev(()=>SEED(1002));
  await ev(()=>RUN(7));if(want('ride'))await snap('ride');
  if(want('sky')){await ev(()=>{window._ddc=ddCam;ddCam=function(){camera.position.set(700,70,1180);camera.lookAt(700,330,0);camera.updateMatrixWorld();};});await snap('sky');await ev(()=>{ddCam=window._ddc;});}
  await ev(()=>{SEED(1003);let n=0;while(!dd.land.done&&n++<200)RUN(.25);RUN(.6);});if(want('ramp'))await snap('ramp');
  await ev(()=>{SEED(1004);RUN(9);});if(want('beach'))await snap('beach');
  if(want('wire'))await ev(()=>{SEED(1005);PUT('A',700,360);PUT('B',820,370);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(6);}),await snap('wire');
  if(want('draw'))await ev(()=>{SEED(1006);dd.front=Math.min(dd.front,-20);PUT('A',700,-40);PUT('B',780,-10);ddGoSquad('A');RUN(8);}),await snap('draw');
  if(want('top'))await ev(()=>{SEED(1007);dd.front=Math.min(dd.front,-460);PUT('A',560,-500);PUT('B',640,-480);ddGoSquad('A');RUN(8);}),await snap('top');}
if(want('counter')){await ev(()=>{SEED(2001);ddRoster=ddRoster||ddmRead();ddRoster.stage=1;ddmSave();startCounter();SEED(2002);});await page.waitForTimeout(500);await ev(()=>{SEED(2003);RUN(4);});
  await ev(()=>{SEED(2004);const C=dd.dc;if(C&&C.ph!=='fight'){for(let i=0;i<120&&dd.dc.ph!=='fight';i++)RUN(.5);}RUN(8);});await snap('counter');}
if(want('village')){await ev(()=>{SEED(3001);startVillage({skip:true});SEED(3002);});await page.waitForTimeout(500);await ev(()=>{SEED(3003);RUN(12);});await snap('village');}
console.log('errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

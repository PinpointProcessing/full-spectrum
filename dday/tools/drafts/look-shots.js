// The look of every chapter, for judging graphics changes: a picture at each of a set of moments (the ride in, the ramp down, the beach
// under fire, the draw, the top, the counterattack, the village), the battle run a few seconds first so there's fire, smoke and bodies.
// node look-shots.js PORT OUTDIR [W H GFX SCENES]   (GFX: post-processing tier 0-2, default 2; SCENES: comma list, default all)
// DDROOT=<a copy's dday folder> to shoot another copy. Run from the scratchpad (harness.js there).
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const PO=+process.argv[2]||0,OUT=process.argv[3]||'.',W=+process.argv[4]||390,H=+process.argv[5]||760,GFX=process.argv[6]!=null?+process.argv[6]:2;
const ALL=['ride','ramp','beach','wire','draw','top','counter','village'],SC=(process.argv[7]||ALL.join(',')).split(',');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const port=9700+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=${GFX}`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4242);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};
  window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'&&!t.npc?undefined:d0(t,d,s);   // (the squads kept alive: the picture's the point)
  window.SQ=t=>players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);
  window.PUT=(t,x,y)=>{const L=SQ(t);L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};});
const snap=async name=>{await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(350);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(150);
  await page.screenshot({path:`${OUT}/${name}.png`});console.log('shot',name);};
const want=s=>SC.includes(s);
if(['ride','ramp','beach','wire','draw','top'].some(want)){
  await page.click('#ddBtn');await page.waitForTimeout(400);
  await ev(()=>RUN(7));if(want('ride'))await snap('ride');
  await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.25);RUN(.6);});if(want('ramp'))await snap('ramp');
  await ev(()=>RUN(9));if(want('beach'))await snap('beach');
  if(want('wire'))await ev(()=>{PUT('A',700,360);PUT('B',820,370);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(6);}),await snap('wire');
  if(want('draw'))await ev(()=>{dd.front=Math.min(dd.front,-20);PUT('A',700,-40);PUT('B',780,-10);ddGoSquad('A');RUN(8);}),await snap('draw');
  if(want('top'))await ev(()=>{dd.front=Math.min(dd.front,-460);PUT('A',560,-500);PUT('B',640,-480);ddGoSquad('A');RUN(8);}),await snap('top');}
if(want('counter')){await ev(()=>{ddRoster.stage=1;ddmSave();startCounter();});await page.waitForTimeout(500);await ev(()=>{RUN(4);});
  await ev(()=>{const C=dd.dc;if(C&&C.ph!=='fight'){for(let i=0;i<120&&dd.dc.ph!=='fight';i++)RUN(.5);}RUN(8);});await snap('counter');}
if(want('village')){await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(500);await ev(()=>RUN(12));await snap('village');}
console.log('errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

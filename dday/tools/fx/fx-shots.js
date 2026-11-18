// Version 188 FX worker: pictures of the effects at set moments, the battle held quiet. node fx-shots.js PO OUTDIR [W H GFX SETS]
// SETS: shell,nade,wreck,mg (comma list). Run from SP (harness.js there). DDROOT=<dday folder>
const {chromium}=require('playwright');const {serve,open}=require('../../harness.js');const fs=require('fs');
const PO=+process.argv[2]||40,OUT=process.argv[3]||'.',W=+process.argv[4]||390,H=+process.argv[5]||760,GFX=process.argv[6]!=null?+process.argv[6]:2;
const SETS=(process.argv[7]||'shell,nade,wreck,mg').split(',');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const port=9700+PO,srv=await serve(process.env.DDROOT,port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=${GFX}`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4242);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};
  window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'?undefined:d0(t,d,s);
  window.SQ=t=>players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);
  window.PUT=(t,x,y)=>{const L=SQ(t);L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};
  window.LOOK=(x,y)=>{window.ddCam=()=>{};camT={x,z:y+40};updateCamera();};
  window.HUSH=()=>{window.pickTarget0=window.pickTarget0||pickTarget;window.pickTarget=()=>null;window.ddShelling=()=>{};nades.length=0;rockets.length=0;for(const u of units){u.path=[];}};
  window.LOUD=()=>{window.pickTarget=window.pickTarget0;};
  window.FXSHELL=(x,y,R,enemy)=>{const by=enemy?enemies[0]:SQ('A')[0];nades.push({x0:x,y0:y-40,x1:x,y1:y,t:0,dur:.2,by,enemy:!!enemy,R:R||54,D:0});};});
const snap=async name=>{await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(300);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(120);
  await page.screenshot({path:`${OUT}/${name}.png`});console.log('shot',name);};
await page.click('#ddBtn');await page.waitForTimeout(400);
if(SETS.includes('ride'))for(const T of[4,8,11,13.5]){await ev(t=>RUN(t-(window.RT||0)),T);await ev(t=>{window.RT=t;},T);await snap('ride-'+T);}
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.25);RUN(.6);});
await ev(()=>{PUT('A',520,600);PUT('B',640,610);selectTeam('A');dd.active='A';HUSH();RUN(1);});
const seq=async(tag,x,y,R,en,times)=>{await ev(([x,y])=>{LOOK(x,y);RUN(.3);},[x,y]);await ev(([x,y,R,en])=>{FXSHELL(x,y,R,en);RUN(.22);},[x,y,R,en]);let t=.05;
  for(const T of times){await ev(d=>RUN(d),T-t);t=T;await snap(`${tag}-${T}`);}};
if(SETS.includes('shell'))await seq('shell',620,480,54,true,[.07,.25,.6,1.2,2.5,5]);
if(SETS.includes('nade'))await seq('nade',760,520,58,false,[.07,.3,1.2,3]);
if(SETS.includes('wreck')){await ev(()=>{LOOK(519,520);RUN(8);});await snap('wreck');}
if(SETS.includes('haze')){await ev(()=>{LOUD();window.ddCam=null;PUT('A',520,600);ddGoSquad('A');RUN(14);});await snap('haze-on');
  await ev(()=>{const S=DDF.soft;for(let i=0;i<S.n;i++)if(S.shape[i]===3)S.a[i]=0;ddFxDraw();});await snap('haze-off');}
if(SETS.includes('tank')){await ev(()=>{LOUD();window.ddCam=null;dd.front=Math.min(dd.front,-460);PUT('A',560,-500);PUT('B',640,-480);ddGoSquad('A');RUN(4);HUSH();const K=(dd.tanks||[])[0]||{x:640,y:-560,ta:Math.PI*.6};LOOK(K.x,K.y+40);RUN(.3);
    if(dd.tanks&&dd.tanks[0])flashes.push({x:K.x+Math.cos(K.ta)*58,y:K.y+Math.sin(K.ta)*58,t:0});else ddFxCannon(K.x,ddH(K.x,K.y)+28,K.y,K.ta);RUN(.05);});await snap('tank-a');
  await ev(()=>RUN(.3));await snap('tank-b');await ev(()=>RUN(1));await snap('tank-c');}
if(SETS.includes('village')){await ev(()=>{LOUD();window.ddCam=null;startVillage({skip:true});});await page.waitForTimeout(600);await ev(()=>{RUN(3);const c=objs.find(o=>o.kind==='vgcar');window.ddCam=()=>{};camT={x:c.x+c.w/2,z:c.y+c.h/2+40};updateCamera();RUN(2);});await snap('village-car');
  await ev(()=>{window.ddCam=null;RUN(25);});await snap('village-fight');}
if(SETS.includes('impacts')){await ev(()=>{HUSH();LOOK(620,520);RUN(.3);for(let k=0;k<6;k++)tracers.push({x1:560+k*20,y1:300,x2:580+k*14+fxR()*20,y2:500+fxR()*40,t:-k*.02,col:'255,140,100'});RUN(.1);});await snap('impacts-a');
  await ev(()=>{for(let k=0;k<6;k++)tracers.push({x1:560+k*20,y1:300,x2:580+k*14+fxR()*20,y2:500+fxR()*40,t:-k*.02,col:'255,140,100'});RUN(.2);});await snap('impacts-b');}
if(SETS.includes('top')){await ev(()=>{LOUD();window.ddCam=null;dd.front=Math.min(dd.front,-460);PUT('A',560,-500);PUT('B',640,-480);ddGoSquad('A');RUN(4);HUSH();LOOK(600,-560);RUN(.3);FXSHELL(600,-560,58,false);RUN(.07);});await snap('top-nade-0.07');
  await ev(()=>RUN(.25));await snap('top-nade-0.3');await ev(()=>{RUN(1);FXSHELL(640,-600,54,true);RUN(.25);});await snap('top-shell-0.25');await ev(()=>RUN(1.2));await snap('top-shell-1.4');}
if(SETS.includes('rocket')){await ev(()=>{HUSH();const u=SQ('A')[0];LOOK(u.x+60,u.y-160);RUN(.3);const tx=u.x+120,ty=u.y-420,d=hyp(tx-u.x,ty-u.y);
    rockets.push({x:u.x,y:u.y,dx:(tx-u.x)/d,dy:(ty-u.y)/d,left:d,total:d,z0:RPG_SH,z1:8,by:u,trail:[],spec:PRPG,speed:PRPG.speed});flashes.push({x:u.x,y:u.y,t:0});RUN(.5);});await snap('rocket-a');
  await ev(()=>RUN(.5));await snap('rocket-b');await ev(()=>RUN(2));await snap('rocket-c');}
if(SETS.includes('mg')){await ev(()=>{LOUD();ddCam=null;PUT('A',520,600);ddGoSquad('A');RUN(4);});await snap('mg');await ev(()=>RUN(.1));await snap('mg2');}
console.log('errors',errors.length,errors.slice(0,6));await b.close();srv.close();})();

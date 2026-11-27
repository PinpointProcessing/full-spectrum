// The battle as the game's own camera shows it, at fixed moments, for before/after pictures. node battle.js OUT [port] ; Q='&real=1' ; W,H ; ONLY=a,b
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const OUT=process.argv[2]||'bat',PORT=+process.argv[3]||9748,W=+process.env.W||390,H=+process.env.H||760,ONLY=process.env.ONLY?process.env.ONLY.split(','):null;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const start=async()=>{const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=2${process.env.Q||''}`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);
  await ev(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4002);localStorage.removeItem('warehouseYard.ddmeta.v1');
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);});
  const shot=async name=>{if(ONLY&&!ONLY.includes(name))return;await ev(()=>{bigText('');for(const s of ['#banner','#big','#hint','#dcNoRe'])for(const el of document.querySelectorAll(s))el.style.visibility='hidden';render(1/30,simT);drawOverlay(1/30,simT);hud();});await page.waitForTimeout(400);
    await ev(()=>{render(1/30,simT);drawOverlay(1/30,simT);});await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${name}.png`});console.log('shot',name);};
  return{page,errors,ev,shot};};
{const {page,errors,ev,shot}=await start();await page.click('#ddBtn');await page.waitForTimeout(600);
  await ev(()=>{RUN(3);});await shot('ride');
  await ev(()=>{let n=0;while(!dd.land.done&&n++<300)RUN(.25);RUN(2);for(const e of enemies)e.stunT=1e9;});await shot('landed');
  await ev(()=>{const put=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
    for(const u of dd.npcs)Object.assign(u,{x:DDX+300,y:600,path:[]});put('A',470,300);put('B',510,310);selectTeam('A');dd.active='A';dd.track={team:'A'};ddGoSquad('A');RUN(4);});await shot('wire');
  await ev(()=>{const put=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[]}));put('A',420,-470);put('B',460,-450);
    const K=ddTankSpawn({x:DDX+640,y:-540,ang:Math.PI,name:'Tank',hold:true});dd.track={team:'A'};ddGoSquad('A');RUN(5);});await shot('top');
  console.log('beach errors',errors.length,errors.slice(0,2));await page.close();}
{const {page,errors,ev,shot}=await start();await page.click('#ddCtrBtn');await page.waitForTimeout(900);
  await ev(()=>{RUN(12);for(const e of enemies)e.stunT=1e9;});await shot('base');
  await ev(()=>{zoom=Math.min(typeof MAXZ!=='undefined'?MAXZ:6,zoom*1.9);camT.x=560;camT.z=470;RUN(.2);});await shot('base-close');
  await ev(()=>{const K=(dd.tanks||[])[0];if(K){camT.x=K.x;camT.z=K.y+30;}RUN(.2);});await shot('tanks');
  console.log('counter errors',errors.length,errors.slice(0,2));await page.close();}
{const {page,errors,ev,shot}=await start();await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(1300);
  await ev(()=>{RUN(2);for(const e of enemies)e.stunT=1e9;const put=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:x+(k%2)*12,y:y+((k/2)|0)*12,path:[]}));put('A',690,-250);put('B',730,-240);
    const K=vgTruck({way:[[700,-330],[700,-400]],men:0,goal:[700,-420]});K.ph='parked';selectTeam('A');dd.active='A';dd.track={team:'A'};ddGoSquad('A');RUN(4);});await shot('village');
  console.log('village errors',errors.length,errors.slice(0,2));await page.close();}
await b.close();srv.close();process.exit(0);})();

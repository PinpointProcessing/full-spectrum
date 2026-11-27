// The view from behind the checkpoint's and the hilltop bunker's machine guns on the beach. node beachfp.js OUT [port] ; Q='&real=1' for the draft's guns ; W,H
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const OUT=process.argv[2]||'bfp',PORT=+process.argv[3]||9747,W=+process.env.W||390,H=+process.env.H||760;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=2${process.env.Q||''}`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4001);localStorage.removeItem('warehouseYard.ddmeta.v1');});
await page.click('#ddBtn');await page.waitForTimeout(600);
const info=await ev(()=>{damage=()=>{};let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};RUN(20);
  for(const e of enemies){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}
  dd.held=dd.held||{};for(const k of['beach','left','nest','hill','outpost','draw','crest','heavy'])dd.held[k]=true;
  for(const u of dd.npcs)Object.assign(u,{x:DDX+300,y:600,path:[]});dd.npcs.length=0;DD_POST.noAuto=true;if(typeof ddWaves==='function')ddWaves=()=>{};
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)&&!p.postGun).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
  PUT('A',748,-14);PUT('B',770,-34);selectTeam('A');dd.active='A';RUN(2);
  return dd.post.guns.map(g=>({z:g.z,x:Math.round(g.gx-DDX),y:Math.round(g.gy),held:ddPostHeld(g)}));});
console.log(JSON.stringify(info));
const fp=async(name,i,put,look)=>{const ok=await ev(([i,put])=>{if(dd.fp)fpExit();if(put){PUT('A',put[0],put[1]);PUT('B',put[0]+30,put[1]+20);}const g=dd.post.guns[i];if(!g)return'no gun';ddPostSend(g);let n=0;while(!g.man&&n++<60)RUN(.5);if(!g.man)return'no man';ddPostControl(g);return dd.fp?'ok':'no fp';},[i,put]);
  if(ok!=='ok'){console.log(name,ok);return;}
  await ev(look=>{if(look){dd.fp.a+=look[0];dd.fp.p=look[1];}bigText('');flashes.length=0;for(let k=0;k<3;k++)update(1/600);for(let k=0;k<30;k++)fpCam(1/30);render(1/30,simT);hud();ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);for(const s of ['#fp','#ddObj','#banner','#big','#hint','#top'])for(const el of document.querySelectorAll(s))el.style.visibility='hidden';},look);
  await page.waitForTimeout(450);await ev(()=>{fpCam(1/600);render(1/30,simT);ox.clearRect(0,0,9999,9999);});await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${name}.png`});console.log('shot',name);};
await fp('post',0,null,[0,-.06]);await fp('post-left',0,null,[-.5,-.1]);await fp('bunker',2,[330,-380],[0,-.08]);await fp('bunker-right',2,null,[.5,-.12]);
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
(async()=>{const srv=await serve('/home/user/full-spectrum/dday',9788);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,'http://localhost:9788/index.html?noseq&gfx=1');await page.setViewportSize({width:390,height:760});
await page.evaluate(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(77);});
await page.click('#ddBtn');await page.waitForTimeout(600);
const out=[];
for(const k of[0,1]){const r=await page.evaluate(k=>{if(!window.SET){window.SET=1;const d0=damage;window.DM=0;damage=(t,d,s)=>{if(t.side==='P')return;if(t.tag==='heavy'&&t.gunner)DM+=d;return d0(t,d,s);};let n=0;while(!dd.land.done&&n++<4000)update(1/30);
    for(const e of enemies)if(!(e.tag==='heavy'&&e.gunner)){e.hp=0;e.dead=true;}else e.hp=1e6;dd.held.beach=dd.held.left=dd.held.outpost=true;for(const u of dd.npcs)Object.assign(u,{x:DDX+300,y:600,path:[]});dd.npcs.length=0;
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};}
  if(dd.fp)fpExit();for(const g of dd.post.guns)if(g.man)ddPostOff(g,g.man);
  players.filter(p=>p.team==='A'&&alive(p)).forEach((u,i)=>Object.assign(u,{x:DDX+760+(i%2)*12,y:-20+((i/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));selectTeam('A');dd.active='A';RUN(.5);
  const G=dd.post.guns[k];ddPostSend(G);RUN(8);const F=dd.fp;if(!F)return{k,fp:false};const u=F.u,res=[];
  for(const e of enemies.filter(e=>e.tag==='heavy'&&e.gunner)){const P0=fpPose(),O=P0.O,ty=gndH(e.x,e.y)+(e.elev||0)+12,dx=e.x-O.x,dz=e.y-O.z,d=Math.hypot(dx,dz);
    F.a=Math.atan2(dz,dx);F.p=Math.atan2(ty-O.y,d);const P=fpPose(),g=fpGround(P.O,P.D);const a0=Math.atan2(Math.sin(F.a-u.onGun.ang),Math.cos(F.a-u.onGun.ang));
    DM=0;F.clip=60;for(let i=0;i<60;i++){F.clip=60;F.reloadT=0;fpShoot();}
    res.push({d:Math.round(d),inArc:Math.abs(a0)<=u.onGun.arc,off:+a0.toFixed(2),tG:g?Math.round(g.t):null,los:los(u.x,u.y,e.x,e.y),losGun:los(G.gx,G.gy,e.x,e.y),dmg:Math.round(DM),pitch:+F.p.toFixed(3)});}
  window.AIM=enemies.find(e=>e.tag==='heavy'&&e.gunner);return{k,fp:true,res};},k);out.push(r);
  await page.evaluate(()=>{const F=dd.fp,e=AIM,O=fpPose().O;F.a=Math.atan2(e.y-O.z,e.x-O.x);F.p=Math.atan2(gndH(e.x,e.y)+42-O.y,Math.hypot(e.x-O.x,e.y-O.z));fpCam(1/30);render(1/30,simT);});await page.waitForTimeout(450);await page.evaluate(()=>{fpCam(1/30);render(1/30,simT);});await page.waitForTimeout(200);await page.screenshot({path:'duel'+k+'.png'});}
console.log(JSON.stringify(out));console.log('errors',errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

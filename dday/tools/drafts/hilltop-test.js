// Version 208: the top of the hill as a place to take, the two men gone from left of the first bunker, shells while you're on a gun. node hilltop-test.js [seed port out]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9766,OUT=process.argv[4]||'.';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(s=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4000+s);localStorage.removeItem('warehouseYard.ddmeta.v1');},SEED);
await page.click('#ddBtn');await page.waitForTimeout(600);
const shot=async n=>{await ev(()=>{bigText('');ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(450);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});};
const a=await ev(()=>{window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)&&!p.postGun).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};
  const C=DD_CAPS.find(c=>c.k==='crest'),Z=DD_ZONES.find(z=>z.k==='crest');
  return{leftOf:enemies.filter(e=>!e.dead&&e.x-DDX<300&&e.y>200&&e.y<345).map(e=>e.tag+':'+Math.round(e.x-DDX)),left:enemies.filter(e=>e.tag==='left'&&!e.dead).length,
    crest:enemies.filter(e=>e.tag==='crest').map(e=>[Math.round(e.x-DDX),Math.round(e.y),!!e.gunner,isFree(e.x,e.y)]),flag:isFree(C.f[0]+DDX,C.f[1]),zone:!!Z,way:!!findPath(DDX+230,-300,DDX+300,-410)};});
console.log(JSON.stringify(a));ok(!a.leftOf.length&&a.left>=3,'nobody of theirs stands left of the first bunker; its guns and men inside are still there');
ok(a.zone&&a.crest.length===2&&a.way,'the top of the hill is a place to take, with its machine gun and a rifleman');
// up the draw with everything below dead: the objective, then take it with the camera let go
const o=await ev(()=>{for(const e of enemies)if(e.y>-330&&e.tag!=='crest'){e.hp=0;e.dead=true;}for(const k of['beach','left','nest','outpost','draw'])dd.held[k]=true;for(const e of enemies){e.stunT=999;if(e.tag==='crest')e.hp=1e6;}   // (its men kept alive for the look at the objective: since Version 214 it's taken from this near once they're down)
  PUT('A',250,-316);PUT('B',290,-300);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(3);const O=ddObjective();return{t:O&&O.t,held:!!dd.held.crest,ys:players.map(p=>p.team+Math.round(p.y)+(alive(p)?'':'x')+(p.inBoat?'b':'')+(p.joining?'j':''))};});
console.log(JSON.stringify(o));ok(/top of the hill/.test(o.t||'')&&!o.held,'the objective: '+o.t);await shot('h1-crest');
const c=await ev(()=>{dd.track=null;const y0=yaw;for(const e of enemies)if(e.tag==='crest'){e.hp=0;e.dead=true;}PUT('A',290,-400);PUT('B',330,-380);RUN(1.2);const held=!!dd.held.crest,tr=!!dd.track;RUN(5);drawOverlay(.03,simT);
  const u=players.find(p=>p.team==='A'),W=DD_SPOT.tankWay[0],want=Math.atan2(-(W[0]+DDX-u.x),-(W[1]-u.y));let d=yaw-want;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
  return{held,tr,d:+d.toFixed(2),yaw:+yaw.toFixed(2),y0:+y0.toFixed(2),flag:DD.capFlags.crest.color.getHexString(),obj:(ddObjective()||{}).t};});
console.log(JSON.stringify(c));ok(c.held&&c.flag==='2f6fd0','ours once its men are down and yours are on it; its flag blue');ok(c.tr&&Math.abs(c.d)<.2,'the camera, let go by a drag, comes back and turns to where the tank comes from');
ok(!/top of the hill/.test(c.obj||''),'the objective moves on: '+c.obj);await shot('h2-taken');
// on a checkpoint gun in first person, a shell coming down on it: you stay, the screen shows it
const g=await ev(()=>{for(const e of enemies){e.hp=0;e.dead=true;}PUT('A',748,-14);selectTeam('A');dd.active='A';RUN(.5);const G=dd.post.guns[1];ddPostSend(G);RUN(8);const fp0=!!dd.fp,m=G.man;
  ddShell({x:m.x+200,y:m.y-300,side:'E',name:'Mortar',stats:{}},m.x+30,m.y-10,54,0,2.4);RUN(.4);return{fp0,fp:!!dd.fp,on:G.man===m&&!!m.onGun,n:nades.filter(n=>n.enemy).length};});
console.log(JSON.stringify(g));ok(g.fp0&&g.fp&&g.on&&g.n>0,'a shell coming down on the gun you are behind: you stay on it');
await ev(()=>{fpCam(1/30);render(1/30,simT);drawOverlay(.03,simT);});await page.waitForTimeout(450);await ev(()=>{fpCam(1/30);render(1/30,simT);drawOverlay(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:OUT+'/h3-nade.png'});
console.log('errors',errors.length,errors.slice(0,4));console.log(fails||errors.length?'FAILS '+fails:'ALL OK');await b.close();srv.close();process.exit(0);})();

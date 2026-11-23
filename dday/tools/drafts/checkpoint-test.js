// Version 198: the checkpoint at the top of the first path. node checkpoint-test.js [seed port out]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9761,OUT=process.argv[4]||'.';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(s=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4000+s);localStorage.removeItem('warehouseYard.ddmeta.v1');},SEED);
await page.click('#ddBtn');await page.waitForTimeout(600);
const a=await ev(()=>{window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};
  const P=DD_POST,o={};o.foes=enemies.filter(e=>e.tag==='outpost').map(e=>(e.gunner?'mg ':'')+Math.round(e.x-DDX)+','+Math.round(e.y));
  o.hid=objs.filter(q=>q.post).length;o.zone=!!DD_ZONES.find(z=>z.k==='outpost');
  o.seat=dd.post.guns.map(g=>!!findPath(DDX+560,150,g.x,g.y));o.door=!!findPath(P.door[0]+DDX,P.door[1],P.c[0]+DDX,P.c[1]);o.free=[isFree(P.door[0]+DDX,P.door[1]),isFree(DD_POST.c[0]+DDX,DD_POST.c[1]),isFree(DD_POST.house.x+DDX,DD_POST.house.y)];
  o.up=!!findPath(DDX+560,150,DDX+520,-60);   // (the way up still open past it)
  {const pv=findPath(DDX+700,-20,DDX+752,-14)||[],L=pv.reduce((n,q,i)=>n+hyp(q.x-(i?pv[i-1].x:DDX+700),q.y-(i?pv[i-1].y:-20)),0);o.vault=[pv.some(q=>q.vault),Math.round(L)];}o.cov=coverAt(dd.post.guns[0].x,dd.post.guns[0].y,DDX+680,120);o.los=los(DDX+752,-14,DDX+600,150);return o;});
console.log(JSON.stringify(a));
ok(a.foes.length===5&&a.foes.filter(s=>s.startsWith('mg')).length===2,'two gunners and three riflemen hold it');
ok(a.zone&&a.hid>20,'its walls are on the map, and it is a place to take');
ok(a.seat.every(Boolean)&&a.door&&a.up,'the guns can be reached from the path, the house\'s door leads in, the way up is still open');
ok(a.free[0]&&a.free[1]&&!a.free[2],'the door and the yard are free ground, the house is solid');
ok(a.vault[0]&&a.vault[1]<90,'men hop the bags instead of going round: '+a.vault);ok(a.cov>0,'a man on a gun behind the wall has cover from down the path');
// the objective and the camera
const c=await ev(()=>{for(const e of enemies)if(e.tag==='left'||e.tag==='pill')e.dead=true;dd.held=dd.held||{};dd.held.beach=true;dd.held.left=true;PUT('A',540,200);PUT('B',600,230);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(6);
  const O=ddObjective(),u=players.find(p=>p.team==='A'),px=DD_POST.c[0]+DDX,py=DD_POST.c[1],want=Math.atan2(-(px-u.x),-(py-u.y));let d=yaw-want;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return{t:O&&O.t,d:+d.toFixed(2),yaw:+yaw.toFixed(2)};});
console.log(JSON.stringify(c));ok(/Take the checkpoint/.test(c.t||''),'the objective: Take the checkpoint');ok(Math.abs(c.d)<.4,'on the path below it the camera faces the checkpoint');
await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(500);await ev(()=>{render(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:OUT+'/cp-1-approach.png'});
// reinforcements out of the house, at most four
const r=await ev(()=>{SAFE=1;{const L=enemies.filter(e=>e.tag==='outpost'&&!e.dead);L.slice(1).forEach(e=>e.hp=1e6);if(L.length>4){L[0].hp=0;L[0].dead=true;}}PUT('A',620,60);PUT('B',600,100);const n0=enemies.filter(e=>e.tag==='outpost').length;let t=0;for(;t<160&&dd.post.sent<4;t+=10)RUN(10);const at4=dd.post.sent;RUN(25);return{n0,n1:n0+dd.post.sent,sent:dd.post.sent,at4,t};});   // (counted by how many were sent: since Version 220 more of ours fall, and the oldest bodies, theirs too, are tidied away sooner)
console.log(JSON.stringify(r));ok(r.sent===4&&r.n1>r.n0,'four more come out of the house over the fight, no more, and they count as theirs');
// taken
const t=await ev(()=>{dd.track=null;yaw+=1.3;for(const e of enemies)if(e.tag==='outpost'){e.hp=0;e.dead=true;}for(const e of enemies)if(e.tag==='draw')e.dead=true;PUT('A',640,96);PUT('B',750,-28);   // (the hard case: the camera let go and turned by hand, your own squad still below the wall, the other one inside)
  dd.npcs.slice(0,6).forEach((u,k)=>Object.assign(u,{x:DDX+640+k*10,y:40,path:[],inBoat:false,afloat:false}));
  RUN(2);const h=!!dd.held.outpost,flag=DD.postFlag.color.getHexString();RUN(7);const W3=q=>{const m=ddTrackAt()||q;return Math.atan2(-(DD_NEXT3.x-m.x),-(DD_NEXT3.y-m.y));},yaw0=+yaw.toFixed(2),w0=+W3().toFixed(2),tr=!!dd.track;PUT('A',742,-14);RUN(53);
  const g=dd.post.guns.filter(q=>q.z==='outpost').map(q=>q.man?[q.man.npc?'npc':'squad',+q.man.onGun.ang.toFixed(2),q.man.gunner]:null);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(5);
  const u=players.find(p=>p.team==='A'),w=ddRouteWay(u.x,u.y),O=ddObjective();return{yaw0,w0,w1:+W3().toFixed(2),tr,h,flag,g,dbg:dd.post.guns.map(q=>[!!q.going,q.going&&q.going.path.length,dd.npcs.filter(n=>alive(n)&&!n.inBoat).length]),sp:ddSpawnAt(),order:dd.heldOrder,obj:O&&O.t,yaw:+yaw.toFixed(2),way:w?+Math.atan2(-w.x,-w.y).toFixed(2):null};});
console.log(JSON.stringify(t));ok(t.h&&t.flag==='2f6fd0','the checkpoint is ours and its flag blue');ok(t.g.every(q=>q&&q[0]==='npc'&&q[2]),'one of the other troops on each gun, turned up the hill');
ok(!/checkpoint/.test(t.obj||''),'the objective moves on: '+t.obj);
ok(t.tr&&Math.abs(t.yaw0-t.w0)<.15,'the camera let go by a drag: taking the checkpoint takes it back and it swings to the top of the hill, the third place: '+t.yaw0+' / '+t.w0);
ok(Math.abs(t.yaw-t.w1)<.15,'taken, with the squad in it, the camera faces the top of the hill: '+t.yaw+' / '+t.w1);
await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(500);await ev(()=>{render(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:OUT+'/cp-2-taken.png'});
// the other chapters still start
const o2=await ev(async()=>{startCounter();await new Promise(r=>setTimeout(r,900));const c=!!(dd&&dd.counter),p=!dd.post;return{c,p};});ok(o2.c,'the counterattack still starts');
console.log('errors',errors.length,errors.slice(0,4));console.log(fails||errors.length?'FAILS '+fails:'ALL OK');await b.close();srv.close();process.exit(0);})();

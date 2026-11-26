// Version 199: the squads' men on the checkpoint's guns. node gun-control-test.js [seed port out]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9765,OUT=process.argv[4]||'.';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(s=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4000+s);localStorage.removeItem('warehouseYard.ddmeta.v1');},SEED);
await page.click('#ddBtn');await page.waitForTimeout(600);
const draw=async n=>{await ev(()=>{bigText('');ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(450);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});await page.waitForTimeout(200);if(n)await page.screenshot({path:`${OUT}/${n}.png`});};
await ev(()=>{window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)&&!p.postGun).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};
  // everything of theirs near the beach and the checkpoint gone, the checkpoint ours, the other troops kept away so the guns stay empty
  for(const e of enemies){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}   // (nobody of theirs left: the test brings its own)dd.held=dd.held||{};dd.held.beach=dd.held.left=dd.held.outpost=true;
  for(const u of dd.npcs)Object.assign(u,{x:DDX+300,y:600,path:[]});dd.npcs.length=0;DD_POST.noAuto=true;   // (the steps below seat a man without going behind the gun; the one tap doing both is checked last)

  PUT('A',748,-14);PUT('B',770,-34);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(2);});
await draw('g1-enter');
const s0=await ev(()=>({g:dd.post.guns.map(g=>[!!g.man,!!g.going]),lab:1}));ok(s0.g.every(q=>!q[0]&&!q[1]),'both guns empty: grey ENTER circles');
// a real click on a gun's circle
const pt=await ev(()=>{const g=dd.post.guns[1];const q=toS(g.gx,g.gy,8);const r=document.querySelector('#stage').getBoundingClientRect();return[q[0]+r.left,q[1]+r.top];});
await page.mouse.click(pt[0],pt[1]);await page.waitForTimeout(200);
const s1=await ev(()=>{const g=dd.post.guns[1];return{going:g.going&&g.going.id,team:g.going&&g.going.team};});ok(s1.going&&s1.team==='A','a tap on the circle sends the nearest man of your squad: '+s1.going);
const s2=await ev(()=>{RUN(8);const g=dd.post.guns[1],m=g.man;return{man:m&&m.id,on:!!(m&&m.onGun),ang:m&&+m.onGun.ang.toFixed(2)};});ok(s2.man===s1.going&&s2.on,'he takes the gun, turned up the hill: CONTROL');await draw('g2-control');
// a squad move with something to shoot: he stays; with nothing left and the squad gone on: he leaves
const s3=await ev(()=>{const g=dd.post.guns[1],m=g.man;const e=ddFoe('draw',640,-190,{post:true});enemies.push(e);e.hp=1e6;RUN(1);const T=ddPostTargets(g).length;
  const L=players.filter(p=>p.team==='A'&&alive(p));select(L);const as=makeAssign(L,DDX+470,-150);commit(as);RUN(3);const stay=g.man===m&&!m.path.length;
  e.hp=0;e.dead=true;RUN(14);return{T,stay,left:g.man!==m,mp:m.path.length,d:Math.round(hyp(m.x-g.x,m.y-g.y))};});
console.log(JSON.stringify(s3));ok(s3.T>0&&s3.stay,'his squad ordered on with an enemy to shoot: he stays on the gun');ok(s3.left,'nothing left to shoot and his squad gone on: he leaves it and follows');
// ordered alone: off it
const s4=await ev(()=>{for(const g of dd.post.guns)if(g.man)ddPostOff(g,g.man);PUT('A',748,-14);RUN(1);const g=dd.post.guns[0];const r0=ddPostTap(0,0,...toS(g.gx,g.gy,8));RUN(8);const m=g.man;if(!m)return{m:null};
  const e=ddFoe('draw',640,-190,{post:true});enemies.push(e);e.hp=1e6;RUN(1);select([m]);const p=findPath(m.x,m.y,DDX+760,-20);m.path=p;m.lastOrder=simT;RUN(1);const off=g.man!==m;e.hp=0;e.dead=true;return{m:m.id,off};});
ok(s4.m&&s4.off,'ordered off by himself: he leaves the gun at once');
// a shell on the gun: off it
const s5=await ev(()=>{for(const g of dd.post.guns)if(g.man)ddPostOff(g,g.man);PUT('A',748,-14);RUN(1);const g=dd.post.guns[0];ddPostTap(0,0,...toS(g.gx,g.gy,8));RUN(8);const m=g.man;if(!m)return{m:null};ddPostBlast({x1:g.x+10,y1:g.y,R:58});return{m:m.id,off:g.man!==m&&!m.onGun};});
ok(s5.m&&s5.off,'a shell coming down on the gun: he gets off it');
// CONTROL: first person, firing, EXIT
await ev(()=>{for(const g of dd.post.guns)if(g.man)ddPostOff(g,g.man);PUT('A',748,-14);RUN(1);const g=dd.post.guns[1];ddPostTap(0,0,...toS(g.gx,g.gy,8));RUN(8);const e=ddFoe('draw',640,-190,{post:true});enemies.push(e);e.hp=1e6;window.TG=e;RUN(1);});
const p2=await ev(()=>{const g=dd.post.guns[1];const q=toS(g.gx,g.gy,8);const r=document.querySelector('#stage').getBoundingClientRect();return[q[0]+r.left,q[1]+r.top,!!g.man];});
await page.mouse.click(p2[0],p2[1]);await page.waitForTimeout(300);
const s6=await ev(()=>({fp:!!dd.fp,one:dd.fp&&fpPose().one,mt:dd.fp&&fpPose().mt,btn:document.querySelector('#fp [data-a="back"]').textContent,own:null}));
ok(s6.fp&&s6.one&&s6.mt&&/EXIT/.test(s6.btn),'a tap on CONTROL: first person on the gun, with an EXIT button');
await ev(()=>{const F=dd.fp,P=fpPose(),e=TG;F.a=Math.atan2(e.y-P.O.z,e.x-P.O.x);const d=Math.hypot(e.x-P.O.x,e.y-P.O.z);F.p=Math.atan2(gndH(e.x,e.y)+12-P.O.y,d);for(let i=0;i<6;i++){update(1/30);}fpCam(1/30);render(1/30,simT);});await page.waitForTimeout(500);
await ev(()=>{fpCam(1/30);render(1/30,simT);});await page.waitForTimeout(250);await page.screenshot({path:OUT+'/g3-pov.png'});
const s7=await ev(()=>{const F=dd.fp,h0=TG.hp;F.fire=true;let fl=0;for(let i=0;i<60;i++){F.kick=0;update(1/30);fpCam(1/30);if(F.rg?flashes.some(f=>f.u===F.u):F.gun&&F.gun.userData.flash&&F.gun.userData.flash.visible)fl++;}F.fire=false;return{own:!!(F.rg||F.gun&&F.gun.userData.own),dmg:Math.round(h0-TG.hp),fl,clip:F.clip};});
console.log(JSON.stringify(s7));ok(s7.own,'its own machine-gun model in the view');ok(s7.dmg>0&&s7.fl>0,'firing it hurts the man in the sights, the muzzle flashes');
await ev(()=>{dd.fp.fire=true;for(let i=0;i<3;i++){update(1/30);fpCam(1/30);}render(1/30,simT);});await page.waitForTimeout(450);await ev(()=>{fpCam(1/30);render(1/30,simT);});await page.waitForTimeout(200);await page.screenshot({path:OUT+'/g4-pov-fire.png'});await ev(()=>{dd.fp.fire=false;});
await page.click('#fp [data-a="back"]');await page.waitForTimeout(300);
const s8=await ev(()=>{const g=dd.post.guns[1];return{fp:!!dd.fp,on:!!(g.man&&g.man.onGun)};});ok(!s8.fp&&s8.on,'EXIT: back to the squads, he stays on the gun');
// Version 202: one tap on the circle seats him and puts you behind the gun; the guns glow
await ev(()=>{if(dd.fp)fpExit();for(const g of dd.post.guns)if(g.man)ddPostOff(g,g.man);DD_POST.noAuto=false;PUT('A',748,-14);selectTeam('A');dd.active='A';RUN(.5);const g=dd.post.guns[1];dd.track=null;zoom=6;yaw=-.85;tilt=ddTilt(6,.45);camShift=0;camT.x=g.gx;camT.z=g.gy;updateCamera();render(.03,simT);});await page.waitForTimeout(400);   // (the test's own camera, on the gun: leaving first person left it over the man)
const s9=await ev(()=>{render(.03,simT);drawOverlay(.03,simT);const g=dd.post.guns[1],glow=DD.postGuns.map(q=>+q.userData.mat.emissiveIntensity.toFixed(2));const r=ddPostSend(g);RUN(8);const m=g.man;return{r,glow,fp:!!dd.fp,me:!!(m&&dd.fp&&dd.fp.u===m)};});
console.log(JSON.stringify(s9));ok(s9.glow.every(v=>v>0),'the guns glow while they are yours to take');ok(s9.r&&s9.fp&&s9.me,'one tap on the circle: he takes the gun and you are behind it');
// Version 206: behind the gun, your own squad goes on up by itself
const s10=await ev(()=>{const g=dd.post.guns[1],m=g.man,o=players.filter(p=>p.team==='A'&&p!==m&&alive(p)),y0=Math.min(...o.map(p=>p.y));for(const e of enemies)if(!e.dead&&e.y>-420){e.hp=0;e.dead=true;}dd.hop.A=0;RUN(40);return{fp:!!dd.fp,on:g.man===m,y0:Math.round(y0),y1:Math.round(Math.min(...o.map(p=>p.y)))};});
console.log(JSON.stringify(s10));ok(s10.fp&&s10.on&&s10.y1<s10.y0-60,'with you on the gun and nobody in front, your squad advances up the way; your man stays on the gun');
// Version 207: on either gun, a finger dragged on the left of the screen or the right turns the view
for(const k of[0,1]){
  await ev(k=>{if(dd.fp)fpExit();for(const g of dd.post.guns)if(g.man)ddPostOff(g,g.man);PUT('A',748,-14);selectTeam('A');dd.active='A';RUN(.5);ddPostSend(dd.post.guns[k]);RUN(8);},k);
  const a0=await ev(()=>dd.fp?+dd.fp.a.toFixed(3):null);const res=[];
  for(const x of[70,300]){const b=await ev(()=>dd.fp.a);
    await page.evaluate(([x])=>{const el=document.querySelector('#fp'),E=(t,cx)=>el.dispatchEvent(new PointerEvent(t,{pointerId:7,pointerType:'touch',clientX:cx,clientY:380,bubbles:true,cancelable:true}));E('pointerdown',x);E('pointermove',x+30);E('pointermove',x+60);E('pointerup',x+60);},[x]);
    const c=await ev(()=>dd.fp.a);res.push(+(c-b).toFixed(3));}
  const st=await ev(k=>({fp:!!dd.fp,on:!!(dd.fp&&dd.fp.u.onGun),mine:dd.fp&&dd.post.guns[k].man===dd.fp.u}),k);
  await ev(k=>{dd.fp.a=dd.post.guns[k].up;dd.fp.p=-.03;for(let i=0;i<3;i++)update(1/30);fpCam(1/30);render(1/30,simT);},k);await page.waitForTimeout(450);await ev(()=>{fpCam(1/30);render(1/30,simT);});await page.waitForTimeout(200);await page.screenshot({path:OUT+'/g5-pov-gun'+(k+1)+'.png'});
  console.log(JSON.stringify({k,a0,res,st}));ok(st.fp&&st.on&&st.mine&&res.every(d=>Math.abs(d)>.02),'gun '+(k+1)+': behind it, and a drag on the left or the right of the screen turns the view');}
console.log('errors',errors.length,errors.slice(0,4));console.log(fails||errors.length?'FAILS '+fails:'ALL OK');await b.close();srv.close();process.exit(0);})();

// Version 212: the heavy gun's bunker: two machine guns inside at its east opening, theirs on the checkpoint, ours to take and turn on the counterattack. node bunker-guns-test.js [seed port out]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9767,OUT=process.argv[4]||'.';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(s=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4000+s);localStorage.removeItem('warehouseYard.ddmeta.v1');},SEED);
await page.click('#ddBtn');await page.waitForTimeout(600);
const a=await ev(()=>{window.SAFE=1;const d0=damage;window.DM=0;damage=(t,d,s)=>{if(t.side==='P')return SAFE?undefined:d0(t,d,s);if(t.tag==='counter')DM+=d;return d0(t,d,s);};let n=0;while(!dd.land.done&&n++<4000)update(1/30);for(let i=0;i<600;i++)update(1/30);   // (everyone out of the boats: a man still aboard is put back on the sand when his turn comes)
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)&&!p.postGun).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};
  const G=enemies.filter(e=>e.tag==='heavy'&&e.gunner),H=dd.post.guns.filter(g=>g.z==='heavy'),big=objs.find(o=>o.kind==='ddgun'&&o.tag==='heavy');
  return{n:G.length,elev:G.map(e=>e.elev||0),see:G.map(e=>[los(e.x,e.y,DDX+752,-14),los(e.x,e.y,DDX+260,-330)]),guns:H.length,seat:H.map(g=>[isFree(g.x,g.y),!!findPath(DDX+260,-330,g.x,g.y)]),big:big&&!big.east,
    front:objs.filter(o=>o.bk==='hv').map(o=>[o.x-DDX,o.y,o.w,o.h,!!o.full])};});
console.log(JSON.stringify(a));ok(a.n===2&&a.elev.every(v=>!v)&&a.see.every(q=>q[0]&&q[1]),'two machine guns inside the bunker, on the ground, both seeing the checkpoint and the top of the draw');
ok(a.guns===2&&a.seat.every(q=>q[0]&&q[1]),'their seats are free ground a squad can walk to');ok(a.big,'the big gun looks out to sea again');
// before the place is ours: nothing to tap; after: one tap, behind the gun, facing along the top
const c=await ev(()=>{for(const e of enemies){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}for(const u of dd.npcs)Object.assign(u,{x:DDX+300,y:600,path:[]});dd.npcs.length=0;
  for(const k of['beach','left','nest','outpost','draw','crest'])dd.held[k]=true;const H=dd.post.guns.filter(g=>g.z==='heavy');const before=ddPostHeld(H[0]);
  PUT('A',90,-410);PUT('B',200,-380);selectTeam('A');dd.active='A';RUN(1.5);const held=!!dd.held.heavy;
  const r=ddPostSend(H[0]);RUN(8);const F=dd.fp,m=H[0].man;return{before,held,r,fp:!!F,me:!!(F&&F.u===m),a:F&&+F.a.toFixed(2),arc:m&&m.onGun&&m.onGun.arc,hid:objs.filter(o=>o.bk==='hv').every(o=>(o.meshes||[]).every(q=>!q.visible))};});
await ev(()=>{drawOverlay(.03,simT);});
const c2=await ev(()=>({hid:objs.filter(o=>o.bk==='hv').every(o=>(o.meshes||[]).every(q=>!q.visible))}));
console.log(JSON.stringify(c),JSON.stringify(c2));ok(!c.before&&c.held,'the heavy gun is ours once its men are down and yours are in it');ok(c.r&&c.fp&&c.me&&Math.abs(c.a-.1)<.01&&c.arc===1,'one tap: behind one of its machine guns, facing along the top');ok(c2.hid,'from behind it the bunker itself is not drawn');
// the counterattack's men along the top: in the swing, and hit
const d=await ev(()=>{const L=[];for(const[x,y]of[[520,-470],[560,-520],[480,-430]]){const e=ddFoe('counter',x,y,{ang:Math.PI});e.hp=1e6;e.stunT=9999;enemies.push(e);L.push(e);}RUN(.3);const F=dd.fp,u=F.u,P=fpPose(),e=L[0];
  F.a=Math.atan2(e.y-P.O.z,e.x-P.O.x);F.p=Math.atan2(gndH(e.x,e.y)+12-P.O.y,Math.hypot(e.x-P.O.x,e.y-P.O.z));const off=Math.atan2(Math.sin(F.a-u.onGun.ang),Math.cos(F.a-u.onGun.ang));DM=0;for(let i=0;i<60;i++){F.clip=60;F.reloadT=0;fpShoot();}
  const dn=Math.atan2(-14-u.y,DDX+752-u.x),offDown=Math.atan2(Math.sin(dn-u.onGun.ang),Math.cos(dn-u.onGun.ang));return{off:+off.toFixed(2),dmg:Math.round(DM),offDown:+offDown.toFixed(2),arc:u.onGun.arc};});
console.log(JSON.stringify(d));ok(Math.abs(d.off)<=d.arc&&d.dmg>0,'their men coming along the top are inside its swing and are hit');ok(Math.abs(d.offDown)<=d.arc,'it also swings down the hill to the checkpoint');
await ev(()=>{const F=dd.fp;F.a=-.2;F.p=-.02;for(let i=0;i<3;i++)update(1/600);fpCam(1/30);render(1/30,simT);drawOverlay(.03,simT);});await page.waitForTimeout(450);await ev(()=>{fpCam(1/30);render(1/30,simT);});await page.waitForTimeout(200);await page.screenshot({path:OUT+'/b1-view.png'});
const x=await ev(()=>{fpExit();ddFrame(1/30,simT);drawOverlay(.03,simT);return{back:objs.filter(o=>o.bk==='hv').every(o=>(o.meshes||[]).every(q=>q.visible)),on:!!dd.post.guns.find(g=>g.z==='heavy').man};});
ok(x.back&&x.on,'EXIT: the bunker is drawn again, he stays on the gun');
console.log('errors',errors.length,errors.slice(0,4));console.log(fails||errors.length?'FAILS '+fails:'ALL OK');await b.close();srv.close();process.exit(0);})();

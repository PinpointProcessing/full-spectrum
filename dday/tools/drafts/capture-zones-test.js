// Version 216: the barracks and the command post are gold areas like the other places: one man inside with nobody of theirs near takes it. node capture-zones-test.js [seed port out]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9768,OUT=process.argv[4]||'.';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(s=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4000+s);localStorage.removeItem('warehouseYard.ddmeta.v1');},SEED);
await page.click('#ddBtn');await page.waitForTimeout(600);
const shot=async n=>{await ev(()=>{bigText('');ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(450);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});};
const a=await ev(()=>{window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)&&!p.postGun).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};RUN(20);
  const B=DD_CAPS.find(c=>c.k==='base'),C=DD_CAPS.find(c=>c.k==='cp');const fr=C2=>{let n=0,t=0;for(let x=C2.r[0]+10;x<C2.r[2];x+=20)for(let y=C2.r[1]+10;y<C2.r[3];y+=20){t++;if(isFree(x+DDX,y))n++;}return n+'/'+t;};
  return{base:fr(B),cp:fr(C),flags:Object.keys(DD.capFlags)};});
console.log(JSON.stringify(a));ok(a.flags.includes('base')&&a.flags.includes('cp'),'a flag at the barracks and at the command post');
// the barracks: everything else taken, its men alive: not ours with a man inside; then dead: ours with one man inside
const r=await ev(()=>{for(const k of['beach','left','nest','outpost','draw','crest','heavy','art','hill'])dd.held[k]=true;for(const e of enemies){e.stunT=999;if(e.y>-430){e.hp=0;e.dead=true;}}
  PUT('B',300,-420);players.filter(p=>p.team==='A').forEach((u,k)=>Object.assign(u,{x:DDX+300+k*12,y:-400,path:[],inBoat:false,afloat:false,joining:false}));const one=players.find(p=>p.team==='A'&&alive(p));Object.assign(one,{x:DDX+520,y:-600});
  selectTeam('A');dd.active='A';RUN(2);const O1=(ddObjective()||{}).t,h1=!!dd.held.base;
  for(const e of enemies){e.hp=0;e.dead=true;}for(const K of dd.tanks||[])K.hp=0;Object.assign(one,{x:DDX+520,y:-600,path:[]});RUN(.4);const O2=(ddObjective()||{}).t;return{O1,h1,O2,in:ddCapIn('base',one)};});
console.log(JSON.stringify(r));ok(!r.h1&&r.in,'their men still near: the barracks is not ours yet ('+r.O1+')');await shot('z1-barracks');
const r2=await ev(()=>{RUN(2);drawOverlay(.03,simT);return{held:!!dd.held.base,open:!!(dd.base&&dd.base.open),flag:DD.capFlags.base.color.getHexString()};});
console.log(JSON.stringify(r2));ok(r2.held&&r2.open&&r2.flag==='2f6fd0','one man in the gold area and nobody of theirs near: the barracks is ours, its flag blue');
// the command post
const c=await ev(()=>{const one=players.find(p=>p.team==='A'&&alive(p));for(const e of enemies)e.stunT=999;Object.assign(one,{x:1500,y:-600,path:[]});PUT('B',1280,-600);RUN(2);const w1=!!dd.won,O1=(ddObjective()||{}).t;
  const C=DD_CAPS.find(c=>c.k==='cp');const f=enemies.find(e=>!beaten(e));Object.assign(f,{x:DB.cp.door.x-60,y:DB.cp.door.y+80,path:[],stunT:999});Object.assign(one,{x:(C.r[0]+C.r[2])/2+DDX,y:(C.r[1]+C.r[3])/2,path:[]});RUN(1);const w2=!!dd.won,O2=(ddObjective()||{}).t,n=enemies.filter(e=>!beaten(e)).length;return{w1,O1,w2,O2,n,free:isFree(one.x,one.y)};});
console.log(JSON.stringify(c));ok(!c.w1&&!c.w2,'standing outside it, or inside with their men near: not won ('+c.O2+')');
await ev(()=>{dd.track={team:'A'};const u=players.find(p=>p.team==='A'&&alive(p));camT.x=u.x;camT.y=u.y;RUN(.3);});await shot('z2-post');
const w=await ev(()=>{for(const e of enemies){e.hp=0;e.dead=true;}for(const K of dd.tanks||[])K.hp=0;RUN(2.5);return{won:!!dd.won,cp:!!dd.held.cp};});
console.log(JSON.stringify(w));ok(w.won&&w.cp,'their men down and one man in the gold area: the base is taken');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();

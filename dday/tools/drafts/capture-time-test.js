// Version 217: a capture takes 5 s (their flag down, ours up, a ring), and the hilltop bunker's guns are easy to reach. CAPT=1 node capture-time-test.js [seed port out]
process.env.CAPT='1';const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9769,OUT=process.argv[4]||'.';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(s=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4000+s);localStorage.removeItem('warehouseYard.ddmeta.v1');},SEED);
await page.click('#ddBtn');await page.waitForTimeout(600);
const shot=async n=>{await ev(()=>{bigText('');ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(450);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});};
await ev(()=>{window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)&&!p.postGun).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};RUN(20);
  // the draw a few times in real time so the flag and ring ease to where the game has them
  window.DRAW=()=>{let t=performance.now()/1000;for(let i=0;i<60;i++){t+=.15;ddCapDraw.t=t-.15;ddCapDraw(t);}};});
ok(await ev(()=>DD_CAP_T)===5,'a capture takes 5 s');
const a=await ev(()=>{for(const e of enemies){e.stunT=999;if(e.y>-330&&e.tag!=='crest'){e.hp=0;e.dead=true;}}for(const k of['beach','left','nest','outpost','draw'])dd.held[k]=true;
  for(const e of enemies)if(e.tag==='crest'){e.hp=0;e.dead=true;}ddWaves=()=>{};for(const u of dd.allies)if(u.npc||!players.includes(u)){u.hp=0;u.dead=true;}for(const u of dd.npcs){u.hp=0;u.dead=true;}PUT('B',300,-300);PUT('A',290,-400);selectTeam('A');dd.active='A';dd.track={team:'A'};RUN(2);DRAW();const F=DD.capFlagM.crest;
  return{p:dd.capP.crest,held:!!dd.held.crest,dy:+(F.y-F.m.position.y).toFixed(1),col:F.mat.color.getHexString()};});
console.log(JSON.stringify(a));ok(!a.held&&a.p>.25&&a.p<.5&&a.dy>12&&a.col==='b02222','2 s in: not ours yet, their flag part way down');await ev(()=>{dd.track=null;camT.x=DDX+250;camT.z=-380;});await shot('t1-red');
const b2=await ev(()=>{RUN(1.6);DRAW();const F=DD.capFlagM.crest;return{p:dd.capP.crest,held:!!dd.held.crest,dy:+(F.y-F.m.position.y).toFixed(1),col:F.mat.color.getHexString()};});
console.log(JSON.stringify(b2));ok(!b2.held&&b2.p>.5&&b2.col==='2f6fd0'&&b2.dy>3,'3.6 s in: ours going up, blue');await ev(()=>{dd.track=null;camT.x=DDX+250;camT.z=-380;});await shot('t2-blue');
const c=await ev(()=>{PUT('A',300,-300);PUT('B',340,-290);RUN(1.5);const p1=dd.capP.crest,h1=!!dd.held.crest;PUT('A',290,-400);RUN(6);DRAW();const F=DD.capFlagM.crest;return{p1,h1,held:!!dd.held.crest,dy:+(F.y-F.m.position.y).toFixed(1),col:F.mat.color.getHexString()};});
console.log(JSON.stringify(c));ok(!c.h1&&c.p1<b2.p,'the man leaves: it runs back down');ok(c.held&&c.dy<1&&c.col==='2f6fd0','back in and held 5 s: the top of the hill is ours, the blue flag at the top');
// the hilltop bunker's guns
const g=await ev(()=>{const G=dd.post.guns.filter(q=>q.z==='heavy'),h0=G.map(q=>ddPostHeld(q));for(const e of enemies)if(e.tag==='heavy'){e.hp=0;e.dead=true;}RUN(1);const h1=G.map(q=>ddPostHeld(q)),held=!!dd.held.heavy;
  const u=players.find(p=>p.team==='A'&&alive(p)),P=G.map(q=>{const p=findPath(u.x,u.y,q.x,q.y);if(!p)return null;let L=0,x=u.x,y=u.y;for(const w of p){L+=hyp(w.x-x,w.y-y);x=w.x;y=w.y;}return Math.round(L);});
  return{h0,h1,held,P,str:G.map(q=>Math.round(hyp(u.x-q.x,u.y-q.y))),door:isFree(DDX+127,-368)};});
console.log(JSON.stringify(g));ok(g.h1.every(Boolean)&&!g.held,'their crew down: the guns are yours to take before anyone stands in the bunker');
ok(g.door&&g.P.every((L,i)=>L&&L<g.str[i]*1.5+60),'a doorway behind the guns: the way in is short ('+g.P+' against '+g.str+' straight)');
const s=await ev(()=>{const G=dd.post.guns.find(q=>q.z==='heavy');DD_POST.noAuto=1;ddPostSend(G);let on=false,who=null,t=0;for(;t<20&&!on;t++){RUN(1);if(G.man&&G.man.onGun){on=true;who=G.man.name;}}return{on,who,t};});
console.log(JSON.stringify(s));ok(s.on,'sent to a gun, your man gets on it');await ev(()=>{const u=players.find(p=>p.onGun)||players[0];camT.x=u.x;camT.z=u.y;});await shot('t3-bunker');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();

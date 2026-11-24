// Version 224: Chapter 2 reworked: five guns the squad takes by itself, the row of guns, behind a gun and back, an empty gun, the NPC tag, a gun
// knocked out with its man down, every gun on a tapped enemy, a heavy gun on a tank, no reinforcements, the flag. node counter-guns-test.js [seed port out]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9805,OUT=process.argv[4]||'.';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
const start=async(res)=>{await ev(({s,res})=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4000+s);ddRoster=ddmRead();const R=ddRoster;R.stage=1;R.battles=1;R.minLevel=2;
    ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,2,false)));for(let i=0;i<res;i++)R.reserve.push(ddmNewMan('rifle',2,false));ddmSave();window.requestAnimationFrame=()=>0;startCounter();
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%6==0){panTick(.2);ddFrame(.2,simT);}}};window.G=k=>dd.dc.guns.find(g=>g.k===k);},{s:SEED,res});await page.waitForTimeout(700);};
const draw=async()=>{await ev(()=>{bigText('');updateCamera();ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(350);};
const shot=async n=>{await draw();await ev(()=>{render(.001,simT);drawOverlay(.001,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});};
await start(2);
// the start: no reserve shown, nobody hurt meanwhile
const a=await ev(()=>{const d0=damage;window.HURT=false;damage=(t,d,s)=>t.side==='P'&&!HURT?undefined:d0(t,d,s);const g0=dd.dc.guns.map(g=>[g.k,g.t,g.hv?1:0,g.going?g.going.ddRole:null]);RUN(7);
  return{g0,ph:dd.dc.ph,nore:!!document.querySelector('#dcNoRe.on'),txt:(document.querySelector('#dcNoRe')||{}).textContent,pool:dd.pool,chip:(document.querySelector('#ddChip')||{hidden:true}).hidden};});
console.log(JSON.stringify(a));
ok(a.g0.length===5&&a.g0[0][1]==='art'&&a.g0.filter(g=>g[2]).length===2&&a.g0.every(g=>g[3]),'five guns (the field gun, two heavy machine guns, two nests), a squad man sent to each as it starts ('+a.g0.map(g=>g[0]+':'+g[3]).join(' ')+')');
ok(a.ph==='setup'&&a.nore&&a.txt==='NO REINFORCEMENTS'&&a.pool===0&&a.chip,'the battle starts: NO REINFORCEMENTS across the top, no reserve chip');
await draw();
const s1=await ev(()=>{RUN(4);hud();drawOverlay(.03,simT);const B=document.querySelector('#dcBar');return{man:dd.dc.guns.map(g=>g.man?(g.man.npc?'npc':g.man.ddRole):null),free:players.filter(u=>alive(u)&&!u.dcGun).length,bar:!!B&&!B.hidden,tiles:B?B.querySelectorAll('.dcb-t').length:0,hd:!!(B&&B.querySelector('.dcb-hd')),
  sq:getComputedStyle(document.querySelector('#sq')).display,posts:dd.npcs.filter(u=>alive(u)&&u.y<420).length,ph:dd.dc.ph};});
console.log(JSON.stringify(s1));ok(s1.man.every(m=>m&&m!=='npc')&&s1.man[1]==='gunner'&&s1.man[4]==='gunner'&&s1.free===3,'all five manned by squad mates, the gunners on the heavy guns, three riflemen free');
ok(s1.bar&&s1.tiles===5&&s1.hd&&s1.sq==='none','the row of guns along the bottom with the arrow and "Man a Gun"; the squad\'s own bar gives way');ok(s1.posts>=7,'the other troops are out at their forward posts ('+s1.posts+' of 10 beyond the lower terrace)');
await shot('c1-start');
// a real click on a tile: behind that gun; another tile: straight to it; BACK; LEAVE GUN; the empty gun tapped
await page.locator('#dcBar .dcb-t').nth(1).click();await page.waitForTimeout(300);
const f1=await ev(()=>{RUN(.3);hud();drawOverlay(.03,simT);const F=dd.fp,B=document.querySelector('#dcBar');return{fp:!!F,on:F&&F.u===G('h1').man,view:F&&F.view,hd:!!B.querySelector('.dcb-hd'),two:[...B.querySelectorAll('.dcb-row.two button')].map(b=>b.firstChild.textContent.trim()),you:(B.querySelector('.dcb-t.you b')||{}).textContent,top:getComputedStyle(B).top};});
console.log(JSON.stringify(f1));ok(f1.fp&&f1.on&&f1.view==='1p'&&f1.you==='YOU','a tile tapped: behind that gun, first person');ok(!f1.hd,'the arrow and "Man a Gun" are gone once a gun has been picked');ok(f1.two.join('|')==='‹ BACK|LEAVE GUN','behind a gun: BACK and LEAVE GUN');
await shot('c2-behind');
await page.locator('#dcBar .dcb-t').nth(2).click();await page.waitForTimeout(300);const f2=await ev(()=>({on:!!dd.fp&&dd.fp.u===G('n1').man,h1:!!G('h1').man}));ok(f2.on&&f2.h1,'another tile: straight behind that gun; the one left keeps its man');
await page.locator('#dcBar [data-k=back]').click();await page.waitForTimeout(300);const f3=await ev(()=>{RUN(.3);return{fp:!!dd.fp,n1:!!G('n1').man&&!G('n1').man.npc};});ok(!f3.fp&&f3.n1,'BACK: out of the view, he stays on the gun');
await page.locator('#dcBar .dcb-t').nth(2).click();await page.waitForTimeout(300);await page.locator('#dcBar [data-k=leave]').click();await page.waitForTimeout(300);
const f4=await ev(()=>{RUN(.4);hud();drawOverlay(.03,simT);return{fp:!!dd.fp,n1:G('n1').man,st:document.querySelectorAll('#dcBar .dcb-t')[2].className};});ok(!f4.fp&&!f4.n1&&/empty/.test(f4.st),'LEAVE GUN: he is off it, the tile reads empty');
const f5=await ev(()=>{RUN(4);return{going:G('n1').going||G('n1').man,npcGuns:dd.dc.guns.filter(g=>g.man&&g.man.npc).length};});ok(!f5.going&&!f5.npcGuns,'an empty gun waits: the other troops leave it while a squad mate is free');
await page.locator('#dcBar .dcb-t').nth(2).click();await page.waitForTimeout(300);const f6=await ev(()=>{const g=G('n1'),u=g.going;RUN(6);return{sent:!!u&&!u.npc,man:!!g.man&&!g.man.npc};});ok(f6.sent&&f6.man,'the empty gun tapped: a squad mate goes to it and takes it');
// a move order doesn't take a man off his gun
const mv=await ev(()=>{const g=G('h2'),m=g.man;m.path=[{x:m.x,y:m.y+80}];m.lastOrder=simT;RUN(1);return{on:g.man===m,d:Math.round(hyp(m.x-g.x,m.y-g.y))};});ok(mv.on&&mv.d<14,'a move order leaves a man on his gun');
// what hits its man hits the gun; knocked out it blows up and he goes down, to be got up
const d=await ev(()=>{HURT=true;const g=G('h2'),m=g.man,h0=g.hp;m.hp-=40;RUN(.2);const h1=g.hp;dcGunHit(g,999);RUN(.3);hud();drawOverlay(.03,simT);HURT=false;return{h0,h1,dead:g.dead,man:g.man,down:m.downed,mdead:m.dead,tile:document.querySelectorAll('#dcBar .dcb-t')[4].textContent};});
console.log(JSON.stringify(d));ok(d.h1===d.h0-20,'40 off its man is 20 off the gun ('+d.h0+' to '+d.h1+')');ok(d.dead&&!d.man&&d.down&&!d.mdead&&/destroyed/.test(d.tile),'knocked out: it blows up, its man is down (not dead), the tile reads destroyed');
// the NPC tag: only with no squad mate left for an empty gun
const n=await ev(()=>{const g=G('n2'),m=g.man;dcLeave(g);m.dcGun=G('a1');for(const u of dcFreeMen())u.dcGun=G('a1');   /* (nobody free) */RUN(8);hud();drawOverlay(.03,simT);const t=document.querySelectorAll('#dcBar .dcb-t')[3];return{npc:!!g.man&&g.man.npc,tag:!!t.querySelector('u'),who:t.querySelector('b').textContent};});
console.log(JSON.stringify(n));ok(n.npc&&n.tag&&n.who==='Private','no squad mate free: one of the other troops takes the empty gun, tagged NPC in red');
await shot('c3-npc-destroyed');
// a thumb on one of theirs: every gun on him; dead, they pick their own again
const t=await ev(()=>{for(const u of players)if(u.dcGun===G('a1')&&G('a1').man!==u)u.dcGun=null;RUN(6);const e=enemies.filter(q=>!beaten(q)).sort((p,q)=>q.y-p.y)[0];Object.assign(e,{x:560,y:330,path:[],stunT:1e9,hp:1e5,seen:true,vis:true});RUN(.2);dd.track=null;camPan=null;camT.x=560;camT.z=360;updateCamera();render(.03,simT);
  toSBack=false;const p=toS(e.x,e.y,8);window.TE=e;return{sx:p[0],sy:p[1],ph:dd.dc.ph};});
await page.mouse.click(t.sx,t.sy);await page.waitForTimeout(200);
const t2=await ev(()=>{RUN(1.2);const C=dd.dc,on=C.guns.filter(g=>g.man&&g.t==='mg'&&g.man.focus===TE).length,mg=C.guns.filter(g=>g.man&&g.t==='mg').length;hud();drawOverlay(.03,simT);const tg=document.querySelectorAll('#dcBar .dcb-t.tg').length;TE.hp=1;damage(TE,50,players[0]);RUN(.6);return{foc:C.focus===TE,on,mg,tg,after:C.focus};});
console.log(JSON.stringify(t2));ok(t2.on===t2.mg&&t2.mg>=2&&t2.tg>=2,'a thumb on one of theirs: every machine gun\'s man is on him ('+t2.on+' of '+t2.mg+'), the tiles say ON TARGET');ok(!t2.after,'he is down: the guns go back to their own targets');
// a heavy machine gun on a tank
const k=await ev(()=>{const g=G('h1'),K=dd.tanks[0];Object.assign(K,{x:g.x+20,y:g.y-300,hold:false,i:99});const h0=K.hp,f0=K.fireT;G('a1').fireT=1e9;for(const u of[...players,...dd.npcs]){u.specN=0;u.grenade=0;}   /* (the heavy gun alone: no shells, rockets or grenades) */for(const e of enemies)if(!beaten(e)){e.x=1100;e.y=-500;e.path=[];e.stunT=1e9;}RUN(5);return{h0,h1:K.hp,man:!!g.man};});
console.log(JSON.stringify(k));ok(k.man&&k.h1<k.h0-20&&k.h1>k.h0-80,'a heavy machine gun marks a tank: '+k.h0+' to '+Math.round(k.h1)+' in 5 s (it takes the field gun or a bazooka to kill it)');
// no reinforcements: a man lost, two in the reserve, nobody comes
const r=await ev(()=>{const n0=players.length,u=players.find(p=>alive(p)&&!p.dcGun)||players.find(alive);Object.assign(u,{hp:0,dead:true,downed:false});RUN(30);return{n0,n1:players.length,alive:players.filter(p=>!p.dead).length,q:dd.queue.length,res:ddRoster.reserve.length};});
console.log(JSON.stringify(r));ok(r.res===2&&r.q===0&&r.alive===r.n0-1,'a man lost with two in the reserve: nobody comes for him');
// the flag: theirs for 14 s with none of ours at it, and it is lost
const fl=await ev(()=>{for(const p of players)if(!p.dead){p.x=300;p.y=840;p.path=[];}for(const u of dd.npcs){u.x=300;u.y=860;u.path=[];u.post=u.back={x:300,y:860};}const e=ddFoe('w'+(dd.dc.wave||1),DCA.flag.x-DDX,DCA.flag.y+20,{});enemies.push(e);Object.assign(e,{path:[],stunT:1e9,hp:1e5,stage:99});dd.dc.t=0;
  RUN(6);const mid={over:dd.over,t:+dd.dc.cpT.toFixed(1),obj:(ddObjective()||{}).t};RUN(9.5);return{mid,over:dd.over,why:dd.why};});
console.log(JSON.stringify(fl));ok(!fl.mid.over&&fl.mid.t>4&&/flag/i.test(fl.mid.obj||''),'their man at the flag: the clock runs and the objective says so ('+fl.mid.obj+')');ok(fl.over&&fl.why==='cp','fourteen seconds: the base is lost');
await ev(()=>{finish();});await page.waitForTimeout(400);const end=await ev(()=>({t:document.querySelector('#endTitle').textContent,bar:document.querySelector('#dcBar').hidden}));ok(end.t==='They took the flag'&&end.bar,'the end screen says so; the row of guns is gone');
console.log('errors',errors.length,errors.slice(0,4));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();

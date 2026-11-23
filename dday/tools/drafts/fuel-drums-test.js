// Version 223 (Bryan: "can you add more explosive barrels throughout the match"; "Give me power and accuracy to bazookas"): the fuel drums that go up,
// and the Bazooka's numbers. node fuel-drums-test.js [seed port out]   (DDROOT for another copy)
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9791,OUT=process.argv[4]||'.';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(s=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4000+s);localStorage.removeItem('warehouseYard.ddmeta.v1');},SEED);
await page.click('#ddBtn');await page.waitForTimeout(600);
const shot=async n=>{await ev(()=>{bigText('');ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(450);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});};
const a=await ev(()=>{const d0=damage;window.HURT=[];damage=(t,d,s)=>{if(t.side==='P'&&!t.npc){HURT.push([t.name,Math.round(d)]);return;}return d0(t,d,s);};let n=0;while(!dd.land.done&&n++<4000)update(1/30);window.N0=objs.filter(o=>o.kind==='dddrum'&&o.explosive).length;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};ddShelling=()=>{};for(const e of enemies)e.nade=0;RUN(20);ddWaves=()=>{};dd.post.sent=99;for(const e of enemies){e.nade=0;e.mortarT=1e9;e.stunT=1e9;}for(const u of dd.npcs){u.hp=0;u.dead=true;if(u.m)u.m.g.visible=false;}
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false,sup:0}));
  window.DR=()=>objs.filter(o=>o.kind==='dddrum'&&o.explosive);
  const D=DR(),hit=(p,q)=>p.x<q.x+q.w&&q.x<p.x+p.w&&p.y<q.y+q.h&&q.y<p.y+p.h;
  const over=D.map(o=>objs.filter(q=>q!==o&&!q.walk&&q.kind!=='drop'&&hit(o,q)).map(q=>q.kind+'@'+Math.round(q.x-DDX)+','+q.y)).map((L,i)=>L.length?[Math.round(D[i].x-DDX),D[i].y,L]:null).filter(Boolean);
  // can a man stand beside every one of them (so none is walled in or walls a way off)
  const beside=D.filter(o=>![[-12,8],[28,8],[8,-12],[8,28]].some(([dx,dy])=>isFree(o.x+dx,o.y+dy,5))).map(o=>[Math.round(o.x-DDX),o.y]);
  return{n:N0,now:D.length,mesh:D.filter(o=>o.meshes&&o.meshes.length>=6).length,over,beside,plain:objs.filter(o=>o.kind==='dddrum'&&!o.explosive).length,
    baz:{blast:PRPG.blast,dmg:PRPG.dmg,t:DD_BAZ.true0,s:DD_BAZ.stray},all:D.map(o=>[Math.round(o.x-DDX),o.y])};});
console.log(JSON.stringify(a));
ok(a.n===22&&a.mesh===a.now,'22 fuel drums that go up on Chapter 1\'s map (the beach, the draw, the checkpoint, the top, their base), each drawn');
ok(!a.over.length,'none sits on anything else '+JSON.stringify(a.over));ok(!a.beside.length,'a man can stand beside every one '+JSON.stringify(a.beside));
// a tap on one: the squad shoots it, it goes up, theirs beside it are killed, ours 8 m off are not hurt
const t=await ev(()=>{const o=DR().find(q=>Math.round(q.x-DDX)===392);PUT('A',380,352);PUT('B',300,420);selectTeam('A');dd.active='A';dd.track=null;camPan=null;camT.x=o.x+8;camT.z=o.y+70;
  const cx=o.x+8,cy=o.y+8,L=enemies.filter(e=>!beaten(e)&&!e.gunner&&hyp(e.x-cx,e.y-cy)>200),e1=L[0],e2=L[1];for(const e of enemies)if(!beaten(e)&&e!==e1&&e!==e2&&hyp(e.x-cx,e.y-cy)<160){e.x+=400;}Object.assign(e1,{x:cx+22,y:cy+8,path:[],hp:100});Object.assign(e2,{x:cx+140,y:cy,path:[],hp:100});window.E1=e1;window.E2=e2;RUN(.3);
  ddFrame(1/30,simT);render(.03,simT);const p=toS(cx,cy,7);window.TAPO=o;return{sx:p[0],sy:p[1],at:[Math.round(cx-DDX),cy],d:players.filter(u=>u.team==='A').map(u=>Math.round(hyp(u.x-cx,u.y-cy)))};});
console.log(JSON.stringify(t));await shot('d1-drum');
const t2=await ev(({sx,sy})=>{HURT.length=0;const o=TAPO,n0=enemies.filter(e=>e.dead).length,r=ddTap(o.x+8,o.y+8,sx,sy),foc=players.filter(u=>u.focusTank===o).length;let T=0;for(;T<60&&!o.burst;T++)RUN(.1);
  return{r,foc,burst:!!o.burst,T:+(T*.1).toFixed(1),dead:enemies.filter(e=>e.dead).length-n0,e1:!!E1.dead,e2:!!E2.dead,hurt:HURT.slice(),gone:!!o.gone,hid:(o.meshes||[]).every(m=>!m.visible),free:isFree(o.x+8,o.y+8,4)};},t);
console.log(JSON.stringify(t2));ok(t2.r===true&&t2.foc>=1,'a tap on a drum is the order to shoot it ('+t2.foc+' of the squad with a line)');ok(t2.burst&&t2.T<=4,'it goes up at the first burst ('+t2.T+' s)');
ok(t2.e1&&!t2.e2,'the one of theirs 2 m from it is killed, the one 14 m off is not');ok(!t2.hurt.length,'the squad, 8.5 m and more from it, is not hurt '+JSON.stringify(t2.hurt));ok(t2.gone&&t2.hid&&t2.free,'it is gone, and the ground where it stood is clear');
await ev(()=>RUN(.25));await shot('d2-blast');
// one of ours right beside one is hurt by it; a grenade sets one off; the next drum along goes too
const g=await ev(()=>{const o=DR().find(q=>Math.round(q.x-DDX)===722),cx=o.x+8,cy=o.y+8;HURT.length=0;const u=players.find(p=>p.team==='B'&&alive(p));u.x=cx+24;u.y=cy+18;
  const o2={kind:'dddrum',x:o.x+30,y:o.y,w:16,h:16,full:false,cover:1,explosive:true,hp:DD_DRUM.hp};objs.push(o2);tankBlast(cx+14,cy-10,players[0]);return{b1:!!o.burst,b2:!!o2.burst,hurt:HURT.slice()};});
console.log(JSON.stringify(g));ok(g.b1&&g.b2,'a blast 1.7 m from a drum sets it off, and the drum 3 m along goes with it');ok(g.hurt.length>=1,'one of ours 3 m from it is hurt ('+JSON.stringify(g.hurt)+')');
// too far, and behind a wall
const f=await ev(()=>{const o=DR().find(q=>Math.round(q.x-DDX)===574);PUT('A',300,700);selectTeam('A');dd.tapW={x:o.x,y:o.y,t:performance.now()};dd.notes=[];ddDrumShoot(o);return{note:(dd.notes||[]).map(n=>n.text),foc:players.filter(u=>u.focusTank===o).length};});
console.log(JSON.stringify(f));ok(f.foc===0&&f.note[0]==='Too far','out of reach: nobody fires, and it says Too far');
// the Bazooka: its blast against men, its stray, a gun and a tank
const z=await ev(()=>{const r={blast:PRPG.blast,dmg:PRPG.dmg};const kill=d=>PRPG.dmg*(1-d/(PRPG.blast+4))*.72>=100;r.kill=[0,10,20,30,36,40].filter(kill).pop();
  const u=players.find(p=>p.spec==='rpg');r.man=!!u;const st=d=>{let m=0;const f0=throwFrom;throwFrom=(q,x,y)=>{m=Math.max(m,hyp(x-(u.x+d),y-u.y));return null;};for(let i=0;i<200;i++){u.specN=4;fireRPG(u,u.x+d,u.y);}throwFrom=f0;return Math.round(m);};
  r.stray=[300,450,600,900].map(st);
  const gun=objs.find(o=>o.kind==='ddgun'&&o.tag==='art'&&!o.gone);const h0=gun.hp;dd.rkt=1;ddBlast(gun.x+12,gun.y+11,players[0]);dd.rkt=0;r.gun=[h0,gun.hp,!!gun.gone];
  const gun2=objs.find(o=>o.kind==='ddgun'&&o.tag==='art'&&!o.gone);const g0=gun2.hp;ddBlast(gun2.x+12,gun2.y+11,players[0]);r.gren=[g0,gun2.hp,!!gun2.gone];return r;});
console.log(JSON.stringify(z));ok(z.blast===75&&z.dmg===260,'the Bazooka on D-Day: a blast of 7.5 m, 260 at the middle (5.5 m and 120 before)');ok(z.kill>=30,'a rocket kills a defender out to '+z.kill/10+' m from where it lands (it could not kill one at all before)');
ok(z.stray[0]===0&&z.stray[1]===0&&z.stray[2]<=12&&z.stray[3]<=36&&z.stray[3]>=20,'dead on out to 45 m, at most 1.2 m off at 60 m and 3.6 m at 90 m ('+z.stray.map(v=>v/10).join(', ')+' m at 30, 45, 60, 90 m; 0, 3.6, 6.1, 11.2 m before)');
ok(z.gun[2]&&!z.gren[2],'a rocket on a gun knocks it out in one ('+z.gun[0]+' to '+Math.round(z.gun[1])+'); a grenade there still does not ('+z.gren[0]+' to '+Math.round(z.gren[1])+')');
await ev(()=>{bigText('');const o=DR().find(q=>Math.round(q.x-DDX)===724);dd.track=null;camPan=null;camT.x=o.x+8;camT.z=o.y+60;PUT('A',700,-330);selectTeam('A');});await shot('d3-artillery');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();

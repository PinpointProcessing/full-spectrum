// Version 223 (Bryan: "Give more power and accuracy to bazookas"): the Bazooka's blast against men, how far it strays, what a rocket does to a gun,
// a barracks and a tank, and a real rocket fired at a defender. node bazooka-test.js [seed port]   (DDROOT for another copy)
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9798;
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
const base=await ev(()=>({blast:PRPG.blast,dmg:PRPG.dmg}));
await ev(s=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4000+s);localStorage.removeItem('warehouseYard.ddmeta.v1');},SEED);
await page.click('#ddBtn');await page.waitForTimeout(600);
const z=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);ddShelling=()=>{};let n=0;while(!dd.land.done&&n++<4000)update(1/30);ddWaves=()=>{};for(const e of enemies){e.nade=0;e.stunT=1e9;}for(const u of dd.npcs){u.hp=0;u.dead=true;if(u.m)u.m.g.visible=false;}
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};
  const r={blast:PRPG.blast,dmg:PRPG.dmg,range:PRPG.range};const kill=d=>PRPG.dmg*(1-d/(PRPG.blast+4))*.72>=100;r.kill=[0,10,20,30,36,40].filter(kill).pop()??-1;
  const u=players.find(p=>p.spec==='rpg');r.man=!!u;r.rockets=u.specN;const st=d=>{let m=0;const f0=throwFrom;throwFrom=(q,x,y)=>{m=Math.max(m,hyp(x-(u.x+d),y-u.y));return null;};for(let i=0;i<200;i++){u.specN=4;fireRPG(u,u.x+d,u.y);}throwFrom=f0;return Math.round(m);};
  r.stray=[300,450,600,900].map(st);
  const G=objs.filter(o=>o.kind==='ddgun'&&o.tag==='art'&&!o.gone);const h0=G[0].hp;dd.rkt=1;ddBlast(G[0].x+12,G[0].y+11,players[0]);dd.rkt=0;r.gun=[h0,G[0].hp,!!G[0].gone];
  const g0=G[1].hp;ddBlast(G[1].x+12,G[1].y+11,players[0]);r.gren=[g0,G[1].hp,!!G[1].gone];
  const B=objs.find(o=>o.tag==='barr2');let nb=0;dd.rkt=1;while(!B.gone&&nb<9){ddBlast(B.x+B.w/2,B.y+B.h/2,players[0]);nb++;}dd.rkt=0;r.barr=nb;
  const K=ddTankSpawn({x:DDX+600,y:-500,hold:true});let nt=0;while(K.hp>0&&nt<9){ddTankHit(K.x+15,K.y,1,DD_BAZ.tank);nt++;}r.tank=nt;const K2=ddTankSpawn({x:DDX+700,y:-500,hold:true});let ng=0;while(K2.hp>0&&ng<9){ddTankHit(K2.x+15,K2.y);ng++;}r.tankG=ng;   // (1.5 m off its middle, as a rocket usually lands; dead on its middle two did it before as well)
  // a real rocket: a defender standing in the open 30 m from the Bazooka man, another 3 m beside him, a third 9 m off
  const L=enemies.filter(e=>!beaten(e)&&!e.gunner).slice(0,3);for(const p of players)Object.assign(p,{x:DDX+300,y:-330,path:[],inBoat:false,afloat:false,joining:false,sup:0});Object.assign(u,{x:DDX+420,y:-330,specN:4});
  for(const e of enemies)if(!L.includes(e)&&!beaten(e)&&hyp(e.x-u.x,e.y-u.y)<500){e.hp=0;e.dead=true;}
  [[300,0],[300,30],[300,90]].forEach(([dx,dy],i)=>Object.assign(L[i],{x:u.x+dx,y:u.y+dy,path:[],hp:100,stunT:1e9}));RUN(.3);selectTeam(u.team);
  r.fired=fireRPG(u,L[0].x,L[0].y);RUN(4);r.dead=L.map(e=>!!e.dead);r.hp=L.map(e=>Math.round(e.hp));r.left=u.specN;return r;});
console.log(JSON.stringify(base),JSON.stringify(z));
ok(base.blast===55&&base.dmg===120,'off D-Day the rocket is as it was (55, 120)');ok(z.blast===75&&z.dmg===260&&z.range===900&&z.rockets===4,'on D-Day: a blast of 7.5 m, 260 at the middle (5.5 m and 120 before); 90 m and four rockets as before');
ok(z.kill>=30,'a rocket kills a defender out to '+z.kill/10+' m from where it lands (it could not kill one at all before)');
ok(z.stray[0]===0&&z.stray[1]===0&&z.stray[2]<=12&&z.stray[3]<=36&&z.stray[3]>=20,'dead on out to 45 m, at most 1.2 m off at 60 m and 3.6 m at 90 m ('+z.stray.map(v=>v/10).join(', ')+' m at 30, 45, 60, 90 m; 0, 3.6, 6.1, 11.2 m before)');
ok(z.gun[2]&&!z.gren[2],'a rocket on a gun knocks it out in one ('+z.gun[0]+' to '+Math.round(z.gun[1])+'); a grenade there still does not ('+z.gren[0]+' to '+Math.round(z.gren[1])+')');
ok(z.barr===2,'two rockets for a barracks ('+z.barr+'; four before)');ok(z.tank===2&&z.tankG===3,'landing 1.5 m off a tank\'s middle: two rockets ('+z.tank+'), where it took three, as it still does with grenades ('+z.tankG+')');
ok(z.fired&&z.left===3&&z.dead[0]&&z.dead[1]&&!z.dead[2],'a real rocket at 30 m: the man it lands on and the man 3 m from him are killed, the man 9 m off is not ('+z.hp.join(', ')+' left)');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();

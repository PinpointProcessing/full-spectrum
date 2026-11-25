// Version 240: the medics. On the beach ten seconds after the landing (and once in Chapter 2), a situation set up by hand and the game stepped:
// a dead man brought back, a man down got up, a man under a quarter of his health given a kit in a fight, a man down before a man hurt, the body
// kept by the tidy-up, the other squad's man when it has no medic, a pinned medic throwing his smoke and going when he can.
// node medic-test.js [port] [only: comma list of names]     (DDROOT=<dday folder>; harness.js beside it)
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const PORT=+process.argv[2]||9880,ONLY=(process.argv[3]||'').split(',').filter(Boolean),ROOT=process.env.DDROOT||'/home/user/full-spectrum/dday';
let fails=0;const ok=(c,m,x)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m+(x!==undefined?'  '+JSON.stringify(x):''));};
const S={
  dead:{m:'a dead man is brought back, the same man, a smoke thrown onto him',fn:()=>{const t=WHO('rifle'),m=WHO('medic'),rm=t.rm,k0=m.medSmoke??2;ddKill(t,'test',false);const r=RUN(45,()=>players.includes(t)&&alive(t));return{ok:r.ok&&t.rm===rm&&(WHO('medic').medSmoke??2)<2,s:r.s,smoke:WHO('medic')&&WHO('medic').medSmoke,hp:Math.round(t.hp)};}},
  down:{m:'a man down is got up',fn:()=>{const t=WHO('gunner');DOWN(t);const r=RUN(20,()=>!t.downed&&alive(t));return{ok:r.ok,s:r.s,smoke:WHO('medic').medSmoke};}},
  low:{m:'a man under a quarter of his health gets a kit, with the fight going on',fn:()=>{const t=WHO('demo'),m=WHO('medic'),n0=m.specN;t.hp=18;let fight=false;const r=RUN(20,()=>{if(m.medGo&&!(m.sup<.5&&simT-(m.firedOnT||-9)>3))fight=true;return t.hp>=90||t.downed||t.dead;});return{ok:t.hp>=90&&m.specN===n0-1,s:r.s,hp:Math.round(t.hp),kits:[n0,m.specN],underFire:fight};}},
  order:{m:'a man down comes before a man who is hurt',fn:()=>{const a=WHO('gunner'),b=WHO('demo'),m=WHO('medic');DOWN(a);b.hp=20;let ta=null,tb=null;RUN(30,()=>{if(ta==null&&!a.downed&&alive(a))ta=+simT.toFixed(1);if(tb==null&&(b.hp>=90||m.medGo&&m.medGo.t===b&&m.medGo.prog>0))tb=+simT.toFixed(1);return ta!=null&&tb!=null;});return{ok:ta!=null&&(tb==null||ta<=tb),up:ta,kitStarted:tb};}},
  tidy:{m:'the tidy-up of old bodies leaves one of ours a medic may bring back',fn:()=>{const t=WHO('rifle');for(const p of players)if(p.ddRole==='medic')p.sup=1;ddKill(t,'test',false);RUN(.2,()=>false);t.deadT=simT-999;let n=0;for(const e of enemies){if(n>=30)break;if(!e.dead&&!e.veh){e.dead=true;e.deadT=simT;n++;}}ddTidy();return{ok:units.includes(t)&&t.corpse===true,made:n,left:units.filter(u=>u.dead&&(u.npc||u.side==='E')).length};}},
  other:{m:"with its medic dead, the other squad's medic sees to its men",fn:()=>{const mb=players.find(p=>p.team==='B'&&p.ddRole==='medic'),t=players.find(p=>p.team==='B'&&p.ddRole==='rifle'),ma=WHO('medic');PUT('B',ma.x+60,ma.y+10);ddKill(mb,'test',true);DOWN(t);const r=RUN(30,()=>!t.downed&&alive(t));return{ok:r.ok,s:r.s,gone:!!mb.gone};}},
  pinned:{m:'pinned, he throws his smoke from where he is, stays put, and goes once he can',fn:()=>{const t=WHO('gunner'),m=WHO('medic');m.x=t.x+90;m.y=t.y+20;m.path=[];const x0=m.x,y0=m.y,k0=m.medSmoke??2;DOWN(t);t.bleed=60;let moved=0;RUN(4,()=>{m.sup=1;moved=Math.max(moved,hyp(m.x-x0,m.y-y0));t.bleed=60;return false;});const k1=m.medSmoke??2,stay=moved;const r=RUN(25,()=>{t.bleed=Math.max(t.bleed,20);return !t.downed&&alive(t);});return{ok:k1<k0&&stay<12&&r.ok,smoke:[k0,k1],movedWhilePinned:Math.round(stay),s:r.s};}},
  counter:{ch:2,m:'Chapter 2: a dead man is brought back',fn:()=>{const t=WHO('rifle');ddKill(t,'test',false);const r=RUN(45,()=>players.includes(t)&&alive(t));return{ok:r.ok,s:r.s};}},
};
(async()=>{const srv=await serve(ROOT,PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});let errs=0;
for(const[k,sc]of Object.entries(S)){if(ONLY.length&&!ONLY.includes(k))continue;
  const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=0`);await page.setViewportSize({width:390,height:760});
  await page.evaluate(ch=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);window.requestAnimationFrame=()=>0;
    window.WHO=(role,team)=>players.find(p=>p.team===(team||'A')&&p.ddRole===role&&!p.dead);
    window.RUN=(secs,done)=>{for(let i=0;i<secs*30;i++){update(1/30);if(done()) return{ok:true,s:+(i/30).toFixed(1)};}return{ok:false,s:secs};};
    window.DOWN=t=>{t.hp=1;damage(t,30,enemies.find(alive));if(!t.downed){t.hp=0;t.downed=true;t.bleed=20;t.critical=false;t.revive=0;t.path=[];}};
    window.PUT=(team,x,y)=>players.filter(p=>p.team===team&&alive(p)).forEach((u,i)=>{const s=openSpot(x+(i%2)*16,y+((i/2)|0)*16,[])||{x,y};u.x=s.x;u.y=s.y;u.path=[];});
    if(ch===2)startCounter();else startDDay();},sc.ch||1);
  await page.waitForTimeout(900);
  await page.evaluate(ch=>{let n=0;if(ch===2){while(dd.dc&&!/^w/.test(dd.dc.ph)&&n++<2000)update(1/30);for(let i=0;i<30*40;i++)update(1/30);}else{while(!dd.land.done&&n++<6000)update(1/30);for(let i=0;i<300;i++)update(1/30);}},sc.ch||1);
  const r=await page.evaluate(f=>(new Function('return ('+f+')'))()(),sc.fn.toString());ok(r.ok,sc.m,r);errs+=errors.length;if(errors.length)console.log('  page errors',errors.slice(0,2));await page.close();}
console.log('errors',errs);console.log('fails:',fails);await b.close();srv.close();process.exit(fails?1:0);})();

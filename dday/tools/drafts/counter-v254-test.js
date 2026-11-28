// Version 254, Chapter 2 reworked for Bryan's notes after Version 253: on the guns from the first tap, the gun takes the hits before its man (who never
// goes below half), the light guns twice as fast and the heavy gun harder hitting, seven waves with WAVE n COMPLETE and the rest's clock, the other
// troops pushing out into the field, more defensive points, and after wave 2 the push on their checkpoint (Sgt. Kane's shout, the objective over it,
// taken, held, lost). Real clicks on the row.   node counter-v254-test.js [port] [OUTDIR for pictures]   (DDROOT, HARNESS as gun-row-test.js)
// (Version 255: the waves' tanks and helicopters and the 10 s rest are Version 255's; a wave is beaten here with its tanks knocked out too)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const PORT=+process.argv[2]||9771,OUT=process.argv[3]||null;if(OUT)fs.mkdirSync(OUT,{recursive:true});
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
const start=async(seed)=>{const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
  await ev(seed=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(seed);localStorage.removeItem('warehouseYard.ddmeta.v1');window.TKERR=[];
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){try{update(1/30);}catch(e){TKERR.push('update: '+e.message+' @'+(e.stack||'').split('\n')[1]);}if(i%3==0){try{panTick(.1);ddFrame(.1,simT);}catch(e){TKERR.push('frame: '+e.message);}}}};
    window.DRAW=()=>{try{updateCamera();if(dd.fp)fpCam(1/30);render(1/30,simT);drawOverlay(1/30,simT);hud();if(dd.fp)fpHud();}catch(e){TKERR.push('draw: '+e.message+' @'+(e.stack||'').split('\n')[1]);}};
    window.EV=[];const bt=bigText;window.bigText=(t,c)=>{if(t)EV.push(['big',t,+simT.toFixed(1)]);return bt(t,c);};const bb=bubble;window.bubble=(u,t,c,ms)=>{EV.push(['bubble',(u&&u.name)+': '+t,ms]);return bb(u,t,c,ms);};},seed);
  await page.click('#ddCtrBtn');await page.waitForTimeout(900);return{page,errors,ev};};
const by=k=>`dd.dc.guns.find(g=>g.k==='${k}')`;
// ---- 1. the guns: the first tap, the row, the shield, the rates
{const {page,errors,ev}=await start(254);
  await ev(()=>{const d0=damage;window.NOHURT=true;window.damage=(t,d,s)=>NOHURT&&t.side==='P'?undefined:d0(t,d,s);RUN(7);for(const e of enemies)e.stunT=1e9;});
  // the field gun's man still walking to it (as when the fight starts after the opening): one real click and you're behind it
  const g0=await ev(()=>{const C=dd.dc,g=C.guns.find(q=>q.k==='a1'),u=g.man||g.going;dcLeave(g);u.x=700;u.y=505;dcMan(u,g);RUN(.2);DRAW();return{going:!!g.going,man:!!g.man,d:Math.round(hyp(u.x-g.x,u.y-g.y)/10)};});
  await page.click('#dcBar [data-k="a1"]');const g1=await ev(()=>({fp:!!dd.fp,on:dd.fp&&dd.fp.u.dcGun&&dd.fp.u.dcGun.k,seated:!!dd.dc.guns.find(q=>q.k==='a1').man,d:dd.fp?Math.round(hyp(dd.fp.u.x-858,dd.fp.u.y-502)):null}));
  console.log('  ',JSON.stringify(g0),JSON.stringify(g1));
  ok(g0.going&&!g0.man&&g0.d>=8&&g1.on==='a1'&&g1.seated&&g1.d<6,`the field gun's man ${g0.d} m from it and still walking: one click on its tile puts him on it and you behind it (it did nothing until he got there: five clicks in a test)`);
  // the row isn't made again while its words change: the same button, its words changed, and a click held across the change still goes through
  const r0=await ev(()=>{fpExit();DRAW();const b=document.querySelector('#dcBar [data-k="a1"]');window.B0=b;const t0=b.textContent;const g=dd.dc.guns.find(q=>q.k==='a1');g.fireT=simT+5.2;DRAW();const t1=b.textContent;g.fireT=simT+3.1;DRAW();return{same:document.querySelector('#dcBar [data-k="a1"]')===B0,t0,t1,t2:b.textContent};});
  console.log('  ',JSON.stringify(r0));ok(r0.same&&r0.t1!==r0.t2&&/RELOAD 6/.test(r0.t1)&&/RELOAD 4/.test(r0.t2),'the row stays the same buttons while their words change (RELOAD 6, then RELOAD 4, on the same button): it was made again three times a second, and a tap could be lost with the button under it');
  const bx=await ev(()=>{const r=document.querySelector('#dcBar [data-k="h1"]').getBoundingClientRect();return[r.x+r.width/2,r.y+r.height/2];});
  await page.mouse.move(bx[0],bx[1]);await page.mouse.down();await ev(()=>{const g=dd.dc.guns.find(q=>q.k==='a1');g.fireT=simT+2.2;RUN(.4);DRAW();});await page.mouse.up();
  const r1=await ev(()=>({on:dd.fp&&dd.fp.u.dcGun&&dd.fp.u.dcGun.k}));ok(r1.on==='h1','a click on the heavy MG held while the row changed under it still puts you behind it ('+r1.on+')');
  // the heavy gun's man stays on it under fire: rounds at him, nothing else moving
  const s0=await ev(()=>{NOHURT=false;const g=dd.dc.guns.find(q=>q.k==='h1'),u=g.man,src=enemies[0];u.hp=100;const L=[];for(let i=0;i<120&&!g.dead;i++){damage(u,9+(i%6),src);L.push(u.hp);}RUN(1);return{min:Math.min(...L),dead:u.dead,down:u.downed,on:g.man===u,gdead:g.dead,ghp:Math.round(g.hp),hits:L.length};});
  console.log('  ',JSON.stringify(s0));ok(s0.min>=50&&!s0.dead&&!s0.down,`${s0.hits} rifle rounds into the heavy gun's man: never below ${s0.min} HP, never killed outright, never down`);
  ok(s0.gdead||s0.ghp<340,'the gun took them: '+(s0.gdead?'knocked out':s0.ghp+' of 340 left'));
  const s1=await ev(()=>{const g=dd.dc.guns.find(q=>q.k==='n1'),u=g.man,src=enemies[0];u.hp=90;let n=0;while(!g.dead&&n++<400)damage(u,12,src);const hp=u.hp,stun=u.stunT>simT,fpOff=!dd.fp||dd.fp.u!==u;RUN(2.5);return{n,gdead:g.dead,hp,alive:alive(u),down:u.downed,stun,walking:u.path.length>0||hyp(u.x-g.x,u.y-g.y)>20,on:g.man};});
  console.log('  ',JSON.stringify(s1));ok(s1.gdead&&s1.hp>=50&&s1.alive&&!s1.down&&s1.stun&&s1.walking&&!s1.on,`a nest shot until it's knocked out (${s1.n} rounds at its man): it blows up first, he's thrown off it hurt at ${s1.hp} HP, on his feet after a moment and back toward the flag (he used to go down)`);
  // a man on a gun with less than half: he can't be hurt further there
  const s2=await ev(()=>{const g=dd.dc.guns.find(q=>q.k==='n2'),u=g.man;u.hp=30;for(let i=0;i<20;i++)damage(u,14,enemies[0]);return{hp:u.hp,alive:alive(u)};});ok(s2.alive&&s2.hp===30,'a man who took the gun with 30 HP stays at 30 there');
  ok(errors.length===0&&(await ev(()=>TKERR.length))===0,'the guns: no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));await page.close();}
// ---- 1b. the rates on a fresh page: every other man of ours and theirs out of it, a target in front of a nest and the heavy gun
{const {page,errors,ev}=await start(77);
  const rt=await ev(()=>{const d0=damage;window.damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);RUN(8);for(const e of enemies){e.hp=0;e.dead=true;}for(const u of dd.npcs){u.hp=0;u.dead=true;}
    const C=dd.dc,T={},cnt={n2:0,h1:0},dm={n2:[],h1:[]},G=k=>C.guns.find(q=>q.k===k);
    for(const k of['n2','h1']){const g=G(k),e=hostile('T'+k,g.x,g.y-220,{alerted:true,aware:1,name:'Target',cloth:DD_GER,ang:Math.PI/2});e.hp=1e9;e.stunT=1e9;enemies.push(e);T[k]=e;}
    const rs=resolveShot;window.resolveShot=s=>{for(const k of['n2','h1'])if(s.t===T[k]&&s.u===G(k).man)cnt[k]++;return rs(s);};
    const d1=damage;window.damage=(t,d,s)=>{for(const k of['n2','h1'])if(t===T[k]&&s===G(k).man)dm[k].push(Math.round(d));return d1(t,d,s);};
    RUN(20);window.resolveShot=rs;window.damage=d1;
    const res={n2:cnt.n2/20,h1:cnt.h1/20,n2dmg:[Math.min(...dm.n2),Math.max(...dm.n2)],h1dmg:[Math.min(...dm.h1),Math.max(...dm.h1)]};
    for(const k of['n2','h1']){dcTile(k);const F=dd.fp;if(!F||F.u.dcGun!==G(k)){res[k+'fp']='not in';continue;}let n=0;const s0=fpShoot;window.fpShoot=()=>{n++;return s0();};F.fire=true;F.clip=999;F.reloadT=0;
      for(let i=0;i<60;i++)update(1/30);F.fire=false;window.fpShoot=s0;res[k+'fp']=n/2;res[k+'wk']=fpWK(F.u);fpExit();}
    return res;});
  console.log('  ',JSON.stringify(rt));
  ok(rt.n2>=5.5&&rt.h1<=3.6&&rt.n2>=rt.h1*1.7,`left to themselves a nest fires ${rt.n2} rounds a second (a gunner fired about 3.2 before) and the heavy gun ${rt.h1}`);
  ok(rt.h1dmg[0]>=26&&rt.h1dmg[1]<=36&&rt.n2dmg[1]<=16,`the heavy gun's rounds hit for ${rt.h1dmg.join(' to ')}, a nest's for ${rt.n2dmg.join(' to ')} (a gunner's rounds were his rifle's, 11 to 16)`);
  ok(rt.n2fp>=19&&rt.h1fp>=5&&rt.h1fp<=7&&rt.n2wk==='lmg'&&rt.h1wk==='hvmg',`behind a nest you fire ${rt.n2fp} rounds a second (11.8 before), behind the heavy gun ${rt.h1fp}`);
  ok(errors.length===0&&(await ev(()=>TKERR.length))===0,'the rates: no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));await page.close();}
// ---- 2. the waves, the rest's clock, the other troops, the push, the checkpoint
{const {page,errors,ev}=await start(1254);
  const w=await ev(()=>({n:DCA.waves.length,tk:DCA.waves.map(W=>(W.tanks||[]).length),hl:DCA.waves.map(W=>W.helis||0),men:DCA.waves.map(W=>W.inf+(W.more||0)),def:DCA.def.length,bags:objs.filter(o=>o.kind==='sandbag'&&DCA.def.some(([x,y])=>Math.abs(o.x-(x-24))<1&&Math.abs(o.y-(y-20))<1)).length}));
  console.log('  ',JSON.stringify(w));ok(w.n===7&&w.tk.join()==='2,1,2,2,2,3,3'&&w.hl.join()==='0,0,0,0,1,0,2'&&w.men[4]<w.men[3]&&w.men[6]>w.men[4],`seven waves (${w.men.join(', ')} men; tanks ${w.tk.join(', ')}; helicopters ${w.hl.join(', ')}): Version 255's, Bryan's numbers, with wave 1's two from Version 256; wave 5 with fewer men than wave 4`);
  ok(w.def>=9&&w.bags===w.def,`${w.def} defensive points across the field, each a horseshoe of bags (two before)`);
  // wave 1: the other troops out in the field
  // (Version 255: wave 1 has a tank and the line comes and goes with it, so the most out at any moment of its first 30 s, sampled every 2 s)
  const a=await ev(()=>{RUN(16);let best={n:-1};for(let k=0;k<15;k++){RUN(2);const L=[0,0,0,0,0];for(const u of dd.npcs)if(alive(u))L[u.ln||0]++;const n=L[2]+L[3];if(n>best.n)best={n,L,far:dd.npcs.filter(u=>alive(u)&&u.y<200).length,t:2*k+2};}return{ph:dd.dc.ph,...best};});
  console.log('  ',JSON.stringify(a));ok(a.ph==='w1'&&a.L[2]+a.L[3]>=2&&a.far>=2,`in wave 1's first thirty seconds the other troops get out into the field (${a.t} s in: by line ${a.L.join('/')}, ${a.far} past the middle)`);
  // wave 1 beaten: WAVE 1 COMPLETE and the clock
  const b1=await ev(()=>{for(const e of enemies)if(e.tag==='w1'&&!e.dead){e.hp=0;e.dead=true;}for(const K of dd.tanks)if(K.w===1)K.hp=0;dd.dc.more=1;RUN(1.2);DRAW();const el=document.querySelector('#dcRest');return{ph:dd.dc.ph,big:EV.filter(q=>q[0]==='big').map(q=>q[1]),rest:el&&!el.hidden?el.textContent:null};});
  await ev(()=>{RUN(4);DRAW();});const b2=await ev(()=>{const el=document.querySelector('#dcRest');return{rest:el&&!el.hidden?el.textContent:null,w:el&&el.querySelector('em').style.width};});
  console.log('  ',JSON.stringify(b1),JSON.stringify(b2));
  ok(b1.ph==='lull'&&b1.big.includes('Wave 1 complete')&&/^WAVE 2 IN [89]$/.test(b1.rest||'')&&/^WAVE 2 IN [45]$/.test(b2.rest||''),`wave 1 beaten (its men and its tank): "Wave 1 complete", then the rest's clock (10 s since Version 255): ${b1.rest}, four seconds later ${b2.rest} (bar ${b2.w})`);
  if(OUT){await ev(()=>{RUN(.1);DRAW();});await page.waitForTimeout(500);await ev(()=>DRAW());await page.waitForTimeout(300);await page.screenshot({path:OUT+'/rest.png'});}
  // wave 2 beaten: the push
  const p=await ev(()=>{RUN(15);for(const e of enemies)if(/^w/.test(e.tag)&&!e.dead){e.hp=0;e.dead=true;}for(const K of dd.tanks)K.hp=0;dd.dc.more=1;RUN(5);return{ph:dd.dc.ph,go:dd.npcs.filter(u=>alive(u)&&u.cpGo).length,n:dd.npcs.filter(alive).length,garr:enemies.filter(e=>e.tag==='cp'&&!e.dead).length,
    garr0:(dd.dc.garr||[]).length,kane:EV.filter(q=>q[0]==='bubble').map(q=>q[1]),big:EV.filter(q=>q[0]==='big').map(q=>q[1])};});
  console.log('  ',JSON.stringify(p));
  ok(p.ph==='push'&&p.big.includes('Wave 2 complete')&&p.kane.some(t=>t==='Sgt. Kane: Move Forward!! Take the checkpoint ahead!!'),'wave 2 beaten: "Wave 2 complete", then Sgt. Kane: "Move Forward!! Take the checkpoint ahead!!"');
  ok(p.go>=8&&p.n>=10&&p.garr0===7,`the other troops made up to ${p.n} and ${p.go} of them run for it; their checkpoint has men in it now (${p.garr0}, ${p.garr} still up three seconds on: the field gun shells the blockhouse)`);
  const o=await ev(()=>{RUN(1);DRAW();const O=ddObjective();return{t:O&&O.t,x:O&&O.x,shown:simT-dd.dc.pushT0>2.5};});
  console.log('  ',JSON.stringify(o));ok(o.shown&&/^Take the checkpoint/.test(o.t||'')&&Math.abs(o.x-706)<20,`after the shout the objective is over the checkpoint: "${o.t}"`);
  if(OUT){await ev(()=>{dd.fp=null;camT.x=706;camT.z=-160;zoom=4.2;updateCamera();DRAW();});await page.waitForTimeout(600);await ev(()=>DRAW());await page.waitForTimeout(300);await page.screenshot({path:OUT+'/push.png'});}
  // taken: its men down and ours in it for the capture's time
  const c=await ev(()=>{for(const e of enemies)if(e.tag==='cp'||(/^w/.test(e.tag)&&!e.dead)){e.hp=0;e.dead=true;}for(const K of dd.tanks)K.hp=0;const Z=DCA.cz;dd.npcs.filter(alive).slice(0,3).forEach((u,i)=>{u.x=640+i*30;u.y=-200;u.path=[];u.stunT=simT+7;});RUN(6);DRAW();
    return{ours:dd.dc.cpOurs,ph:dd.dc.ph,row:[...document.querySelectorAll('#dcBar .dcb-row:not(.two) .dcb-t i')].map(q=>q.textContent),big:EV.filter(q=>q[0]==='big').map(q=>q[1]).slice(-2)};});
  console.log('  ',JSON.stringify(c));ok(c.ours&&c.ph==='lull'&&c.big.includes('Checkpoint taken')&&c.row.includes('FORWARD MG 1')&&c.row.includes('FORWARD MG 2'),'its men down and ours in it: "Checkpoint taken", their two light guns ours in the row (FORWARD MG 1, 2), and the rest before wave 3');
  const m=await ev(()=>{RUN(8);return dd.dc.guns.filter(g=>g.cp).map(g=>g.man?(g.man.npc?'npc':'squad'):g.going?'going':'-');});ok(m.every(q=>q==='npc'||q==='going'),'the other troops up there take their light guns ('+m.join(', ')+')');
  // wave 3: some of it comes for the checkpoint; none comes out of it (each man of it with a 0.4 roll, DCA.cpAtt: 2 or more of 20, not 4, since Version 258)
  const w3=await ev(()=>{RUN(14);const W=enemies.filter(e=>e.tag==='w3');return{ph:dd.dc.ph,n:W.length,att:W.filter(e=>e.cpAtt).length,fromCp:W.filter(e=>!e.cpAtt&&e.y>-380&&e.y<-330&&e.x>690&&e.x<790).length};});   // (Version 255: not counting those going into it: with the 10 s rest they're 18 s in, not 8)
  console.log('  ',JSON.stringify(w3));ok(w3.ph==='w3'&&w3.att>=2&&w3.att<w3.n&&w3.fromCp===0,`wave 3: ${w3.att} of its ${w3.n} go for the checkpoint first, none out of it`);
  // lost: theirs in it, none of ours, for the time it takes
  const l=await ev(()=>{const Z=DCA.cz;for(const u of[...dd.npcs,...players])if(alive(u)&&dcIn(u,Z)){u.x=700;u.y=420;u.path=[];u.cpGo=false;u.ln=1;}
    for(const g of dd.dc.guns)if(g.cp&&g.man){const u=g.man;dcLeave(g);u.x=700;u.y=430;u.path=[];u.ln=1;}
    const e=enemies.find(e=>e.tag==='w3'&&!e.dead);e.x=700;e.y=-200;e.path=[];e.stunT=1e9;for(let i=0;i<11*30;i++){update(1/30);for(const u of[...dd.npcs,...players])if(alive(u)&&dcIn(u,Z)){u.x=700;u.y=430;u.path=[];u.ln=1;}}DRAW();
    return{ours:dd.dc.cpOurs,row:[...document.querySelectorAll('#dcBar .dcb-row:not(.two) .dcb-t i')].map(q=>q.textContent).join(',')};});
  console.log('  ',JSON.stringify(l));ok(!l.ours&&!/FORWARD/.test(l.row),'theirs in it and none of ours for ten seconds: lost, the forward guns out of the row');
  ok(errors.length===0&&(await ev(()=>TKERR.length))===0,'the waves: no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));await page.close();}
console.log(fails?'FAILED '+fails:'ALL OK');await b.close();srv.close();})();

// Version 259, Bryan: "1) Smoke doesn't immune someone from bullets. They seem like they go completely invisible when inside smoke ... 3) Bullets,
// and missiles/field guns drop with distance. 4) The checkpoint base can be removed. The building gets destroyed and regenerates troops until it
// does. 5) The player just needs to hold the command center - the other checkpoint is too confusing for a new player."
// Chapter 2: no push on their checkpoint after wave 2 (the rest, then wave 3); their blockhouse sends men while it stands (a quarter of each lot,
// and two more every 18 s from 15 s into a wave, at most six a wave, only while four or more of the wave are out there), none once the field gun
// has brought it down; a man in smoke is seen and shot at, only harder to hit; from behind a gun the rounds, the field gun's shell and the
// bazooka's rocket fall with distance.
// node counter-v259-test.js [port] [OUTDIR for pictures]   (DDROOT, HARNESS as counter-v254-test.js)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const PORT=+process.argv[2]||9797,OUT=process.argv[3]||null;if(OUT)fs.mkdirSync(OUT,{recursive:true});
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
const start=async seed=>{const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
  await ev(seed=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(seed);localStorage.removeItem('warehouseYard.ddmeta.v1');window.TKERR=[];
    window.RUN=(s,keep)=>{for(let i=0;i<Math.round(s*30);i++){try{update(1/30);if(dd.dc)dd.dc.strT=simT;}catch(e){TKERR.push('update: '+e.message+' @'+(e.stack||'').split('\n')[1]);}if(i%3==0){try{panTick(.1);ddFrame(.1,simT);}catch(e){TKERR.push('frame: '+e.message+' @'+(e.stack||'').split('\n')[1]);}}}};   // (strT: the last of a wave would fall back into the woods after 25 s)
    window.DRAW=()=>{try{updateCamera();if(dd.fp)fpCam(1/30);render(1/30,simT);drawOverlay(1/30,simT);hud();if(dd.fp)fpHud();}catch(e){TKERR.push('draw: '+e.message+' @'+(e.stack||'').split('\n')[1]);}};
    window.BAN=[];const bn=banner;window.banner=(t,ms)=>{BAN.push({t:String(t),at:+simT.toFixed(1)});return bn(t,ms);};
    // every lot of their men: when, how many, whether it was the blockhouse's own (dcRegen), and how many came out at the blockhouse
    window.LOTS=[];const s0=dcSpawnLot;window.dcSpawnLot=(n,c,a)=>{const L=s0(n,c,a);LOTS.push({n,c,all:!!a,at:simT,bh:L.filter(e=>e.x>=703&&e.x<=775&&e.y>=-369&&e.y<=-351).length,men:L});return L;};
    window.KEEP=(n,tag)=>{const out=[];for(let k=0;k<n;k++){const z=ddFoe(tag,300+k*40-DDX,-1000,{});Object.assign(z,{hp:1e6,stunT:1e9,cool:1e9,path:[],keeper:1});enemies.push(z);out.push(z);}return out;};   // (far off in the woods, out of everyone's reach, so a wave doesn't end)
    window.KILL=q=>{q.dead=true;q.gone=true;q.hp=0;};},seed);
  await page.click('#ddCtrBtn');await page.waitForTimeout(900);return{page,errors,ev};};
const errs=async(ev,errors,what)=>ok(errors.length===0&&(await ev(()=>TKERR.length))===0,what+': no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));

// 1. no push on their checkpoint: after waves 1 and 2 the rest, then the next wave; what the game says
{const {page,errors,ev}=await start(259);
  const A=await ev(()=>{const C=dd.dc,ph=[],lots=[];let i=0;while(C.ph!=='w1'&&i++<900)RUN(.1);
    const kill=()=>{for(const e of enemies)if(!e.dead)KILL(e);for(const K of dd.tanks)K.hp=0;for(const H of C.helis||[])H.hp=0;};
    for(let w=1;w<=2;w++){let k=0;while(C.ph!=='w'+w&&k++<120)RUN(.25);kill();C.more=1;C.regenN=99;RUN(5.5);ph.push(C.ph);}
    RUN(DCA.lull+1);ph.push(C.ph);
    const kane=[...players,...dd.npcs].some(u=>u.name==='Sgt. Kane'),w2=LOTS.find(q=>q.n===2&&!q.all);
    return{ph,kane,cpGo:!!C.cpGo,pushOn:!!C.pushOn,cpOurs:!!C.cpOurs,w2:w2&&{c:w2.c,bh:w2.bh},guns:C.guns.filter(g=>!g.off).map(g=>g.k).join(','),hint:dcHint(),next:DDM_NEXT[1][1],ban:BAN.map(q=>q.t).filter(t=>/checkpoint|Kane|Take/i.test(t))};});
  console.log('  ',JSON.stringify(A));
  ok(A.ph[0]==='lull'&&A.ph[1]==='lull'&&A.ph[2]==='w3'&&!A.kane&&!A.cpGo&&!A.pushOn,`no push on their checkpoint: after wave 1 ${A.ph[0]}, after wave 2 ${A.ph[1]}, then ${A.ph[2]}; no Sgt. Kane, no storming party`);
  ok(!A.cpOurs&&!/c1|c2/.test(A.guns)&&!A.ban.length,`their checkpoint never ours, its guns never ours (the guns: ${A.guns}), nothing said about taking it`);
  ok(A.w2&&A.w2.c===18&&A.w2.bh===5,`wave 2's lot: ${A.w2&&A.w2.bh} of ${A.w2&&A.w2.c} out at the blockhouse (a quarter)`);
  ok(/command center/i.test(A.hint)&&/blockhouse/i.test(A.hint)&&/three hits/i.test(A.hint)&&!/take their checkpoint/i.test(A.hint),'the hint: hold the command center, the blockhouse keeps sending men until three hits of the field gun');
  ok(/command center/i.test(A.next)&&/blockhouse/i.test(A.next)&&!/checkpoint/i.test(A.next),`the briefing: "${A.next}"`);
  await errs(ev,errors,'no push');await page.close();}

// 2. the blockhouse's men: from 15 s into a wave two every 18 s, six at most; not with fewer than four of the wave out there; none once it's down
{const {page,errors,ev}=await start(2591);
  const B=await ev(()=>{const C=dd.dc;let i=0;while(C.ph!=='w1'&&i++<900)RUN(.1);
    const w0=simT-C.t;for(const e of enemies)KILL(e);for(const K of dd.tanks)K.hp=0;C.more=1;const keep=KEEP(5,'w1');
    // the first lot's men tough for a moment, to see where they go
    let first=null,moved=null;const out=[];
    for(let s=0;s<76;s++){RUN(1,true);const L=LOTS.filter(q=>q.all);
      if(!first&&L.length){first=L[0].men.map(e=>({e,x:e.x,y:e.y}));for(const f of first){f.e.hp=1e6;f.e.dmgK=0;}}
      if(first&&!moved&&simT-L[0].at>=9){moved=first.map(f=>({dy:Math.round(f.e.y-f.y),d:Math.round(hyp(f.e.x-f.x,f.e.y-f.y)),stage:f.e.stage}));for(const f of first)KILL(f.e);}}
    const regen=LOTS.filter(q=>q.all&&q.n===1).map(q=>({t:+(q.at-w0).toFixed(1),c:q.c,bh:q.bh}));
    const said=BAN.filter(q=>/come out of the blockhouse/i.test(q.t)).map(q=>q.t),co0=objs.find(o=>o.tag==='check'),stood={gone:!!co0.gone,hits:co0.artHits||0};   // (stood: their field gun's crew on its own never brings it down)
    // three of the wave left: nothing more for 25 s; five again: they come
    for(const e of enemies)if(!e.keeper&&!e.dead)KILL(e);KILL(keep[0]);KILL(keep[1]);C.regenN=0;C.regenT=simT;const n0=LOTS.length;RUN(25,true);const few=LOTS.length-n0;
    KEEP(2,'w1');RUN(1.2,true);const again=LOTS.filter((q,k)=>k>=n0&&q.all).map(q=>q.c);
    // the field gun on it: three hits and it comes down
    const g=C.guns.find(q=>q.t==='art'&&!q.dead),co=objs.find(o=>o.tag==='check'),c=DCA.check;if(!g.man)dcSit(g,players.find(p=>alive(p)&&!p.dcGun));RUN(.3);
    let shots=0;while(!co.gone&&shots<6){g.fireT=0;dcFire(g,c.x+c.w/2,c.y+c.h/2);shots++;RUN(2.6,true);}
    const down={gone:!!co.gone,dead:!!C.checkDead,shots,hits:co.artHits,said:BAN.filter(q=>/Direct hit|comes down/.test(q.t)).map(q=>q.t)};
    for(const e of enemies)if(!e.keeper&&!e.dead)KILL(e);C.regenN=0;C.regenT=simT;const n1=LOTS.length;RUN(40,true);const after=LOTS.filter((q,k)=>k>=n1&&q.all).length;
    // and the next wave: nobody out of it
    for(const e of enemies)if(!e.dead)KILL(e);for(const K of dd.tanks)K.hp=0;let k=0;while(C.ph!=='w2'&&k++<200)RUN(.25);const w2=LOTS.find(q=>q.n===2&&!q.all);
    return{regen,said,stood,moved,few,again,down,after,w2:w2&&{c:w2.c,bh:w2.bh},ph:C.ph};});
  console.log('  ',JSON.stringify(B));
  const R=B.regen;
  ok(R.length===3&&R.every(q=>q.c===2&&q.bh===2)&&R[0].t>=15&&R[0].t<=15.6&&[1,2].every(k=>R[k].t-R[k-1].t>=18&&R[k].t-R[k-1].t<=18.6),`from 15 s into the wave two men out of the blockhouse every 18 s, six in all: ${R.map(q=>q.c+' at '+q.t+' s').join(', ')}`);
  ok(B.said.length===1&&/field gun/.test(B.said[0]),`said once: "${B.said[0]}"`);
  ok(!B.stood.gone&&!B.stood.hits,`76 s with nothing else for their field gun's crew to shoot at, the blockhouse still stands (${B.stood.hits} hits): bringing it down is the player's call`);
  ok(B.moved&&B.moved.length===2&&B.moved.every(q=>q.d>=30&&q.dy>0),`they come on toward the base (9 s on: ${B.moved&&B.moved.map(q=>q.d/10+' m, '+(q.dy/10)+' m south').join('; ')})`);
  ok(B.few===0&&B.again.length===1&&B.again[0]===2,`with three of the wave left nobody comes out in 25 s (${B.few}); with five, two at once (${B.again})`);
  ok(B.down.gone&&B.down.dead&&B.down.hits===3&&B.down.said.length===3,`the field gun brings it down in three hits (${B.down.shots} shells, ${B.down.hits} hits): ${B.down.said.join(' / ')}`);
  ok(B.after===0&&B.w2&&B.w2.bh===0&&B.ph==='w2',`once it's down nobody comes out of it (${B.after} in 40 s), nor in wave 2's lot (${B.w2&&B.w2.bh} of ${B.w2&&B.w2.c})`);
  await errs(ev,errors,'the blockhouse');await page.close();}

// 3. smoke: a man in it is seen and shot, harder to hit; his own shots come through it too
{const {page,errors,ev}=await start(2592);
  const g0=await ev(()=>{const C=dd.dc,d0=damage;window.HITS=[];window.PHITS=[];window.damage=(t,d,s)=>{if(s&&s.tst)PHITS.push({t:t.id,d});if(t.side==='P')return;if(t.tst)HITS.push({d,s:s&&s.id,fp:!!(s&&s.fp)});return d0(t,d,s);};
    let i=0;while(C.ph!=='w1'&&i++<900)RUN(.1);for(const e of enemies)KILL(e);for(const K of dd.tanks)K.hp=0;C.more=1;C.regenN=99;KEEP(1,'w1');
    const g=C.guns.find(q=>q.k==='n1');if(!g.man||g.man.fp)dcSit(g,players.find(p=>alive(p)&&!p.dcGun));RUN(.3);
    window.BURSTS=[];const b0=burst;window.burst=(u,t,L)=>{if(t&&t.tst||u.tst)BURSTS.push({u:u.id,t:t&&t.id});return b0(u,t,L);};return{man:g.man&&g.man.id};});
  // the test's man 30 m out in front of MG NEST 1, a clean line and no cover (as Version 258's test)
  const S=await ev(()=>{const C=dd.dc,g=C.guns.find(q=>q.k==='n1'),m=g.man,f=g.face0??-Math.PI/2;let e=null;
    for(const da of[0,.12,-.12,.24,-.24,.36,-.36]){const x=g.x+Math.cos(f+da)*300,y=g.y+Math.sin(f+da)*300;if(!isFree(x,y))continue;
      const z=ddFoe('w'+C.wave,x-DDX,y,{});Object.assign(z,{tst:1,hp:1e6,stunT:1e9,cool:1e9,path:[],ang:Math.PI/2,seen:true,alerted:true});enemies.push(z);const L=fireLine(m,z);if(L&&!shotCover(L)){e=z;break;}KILL(z);}
    if(!e)return null;const L0=fireLine(m,e),c0=hitChance(m,e,L0);
    // without smoke 12 s, then with it (thrown again halfway: it lasts 14 s)
    const shoot=(smoke)=>{HITS.length=0;BURSTS.length=0;e.sup=0;smokes.length=0;let blk=0,seen=0,n=0;
      for(let k=0;k<12;k++){if(smoke&&k%6===0)popSmoke((m.x+e.x)/2,(m.y+e.y)/2);RUN(1);n++;if(smokes.length&&smokeBlocks(m.x,m.y,e.x,e.y))blk++;if(e.seen)seen++;}
      return{bursts:BURSTS.filter(q=>q.u===m.id).length,hits:HITS.filter(q=>q.s===m.id).length,blk,seen,n};};
    const no=shoot(false);smokes.length=0;popSmoke((m.x+e.x)/2,(m.y+e.y)/2);RUN(1);
    const L1=fireLine(m,e),c1=L1?hitChance(m,e,L1):null,sight={los:los(m.x,m.y,e.x,e.y),blocks:smokeBlocks(m.x,m.y,e.x,e.y),line:!!L1};
    const yes=shoot(true);
    return{c0:+c0.toFixed(3),c1:c1==null?null:+c1.toFixed(3),sight,no,yes,e:{x:Math.round(e.x),y:Math.round(e.y)}};});
  console.log('  ',JSON.stringify(S));
  ok(S&&S.sight.blocks&&S.sight.los&&S.sight.line&&S.yes.seen===S.yes.n,`a man in the smoke is still seen (in sight ${S&&S.yes.seen} of ${S&&S.yes.n} s with the smoke on the line ${S&&S.yes.blk} of them)`);
  ok(S&&S.c1!=null&&Math.abs(S.c1-Math.max(.05,S.c0*.5))<.01,`harder to hit through it: ${S&&S.c0} a round in the clear, ${S&&S.c1} through the smoke`);
  ok(S&&S.yes.bursts>0&&S.yes.hits>0&&S.yes.hits<S.no.hits,`the nest's gunner keeps firing on him (${S&&S.yes.bursts} bursts in 12 s) and hits him ${S&&S.yes.hits} times (${S&&S.no.hits} in the clear)`);
  console.log('  ',JSON.stringify(await ev(()=>{const g=dd.dc.guns.find(q=>q.k==='n1'),m=g.man;return{man:m&&m.id,going:g.going&&g.going.id,dead:g.dead,e:!!enemies.find(q=>q.tst&&!q.dead)};})));
  if(OUT){await ev(()=>{const C=dd.dc,g=C.guns.find(q=>q.k==='n1'),e=enemies.find(q=>q.tst&&!q.dead);smokes.length=0;popSmoke((g.x+e.x)/2,(g.y+e.y)/2);camT={x:(g.x+e.x)/2,z:(g.y+e.y)/2+30};zoom=3.2;RUN(2.5);DRAW();});await page.waitForTimeout(500);await ev(()=>DRAW());await page.waitForTimeout(300);await page.screenshot({path:`${OUT}/smoke-top.png`});}
  // his shots at one of ours, 20 m off in the open, through smoke
  const P=await ev(()=>{const C=dd.dc,e=enemies.find(q=>q.tst&&!q.dead),p=players.find(q=>alive(q)&&!q.dcGun&&!q.fp);if(!p)return null;
    let spot=null;for(let a=0;a<6.28&&!spot;a+=.2){const x=e.x+Math.cos(a)*200,y=e.y+Math.sin(a)*200;if(!isFree(x,y))continue;const L=fireLine(e,{...p,x,y,path:[]});if(L&&!coverAt(x,y,e.x,e.y))spot={x,y};}
    if(!spot)return null;const at=()=>{p.x=spot.x;p.y=spot.y;p.path=[];p.lastOrder=simT;p.sup=0;p.stunT=simT+2;};
    e.cool=0;e.stunT=0;e.focus=p;const hush=()=>{for(const u of dd.allies)if(alive(u))u.stunT=simT+1.2;e.sup=0;};   // (hush: none of ours fire on him meanwhile, or their fire pins him and he hardly shoots)
    const fire=smoke=>{PHITS.length=0;BURSTS.length=0;smokes.length=0;for(let k=0;k<15;k++){if(smoke&&k%6===0)popSmoke((p.x+e.x)/2,(p.y+e.y)/2);at();hush();RUN(1);}return{bursts:BURSTS.filter(q=>q.u===e.id).length,hits:PHITS.filter(q=>q.t===p.id).length};};
    const no=fire(false),yes=fire(true);e.cool=1e9;e.stunT=1e9;smokes.length=0;return{no,yes};});
  console.log('  ',JSON.stringify(P));
  ok(P&&P.yes.bursts>0&&P.yes.hits>0&&P.yes.hits<P.no.hits,`one of theirs firing on our man through smoke 20 m off: ${P&&P.yes.bursts} bursts, ${P&&P.yes.hits} hits (${P&&P.no.hits} in the clear)`);
  // from behind the gun: 40 rounds with the crosshair on him, through the smoke and without
  const F=await ev(()=>{const C=dd.dc,e=enemies.find(q=>q.tst&&!q.dead);if(!dd.fp)dcTile('n1');RUN(.2);const P0=dd.fp;if(!P0)return null;
    const forty=smoke=>{smokes.length=0;if(smoke){popSmoke((P0.u.x+e.x)/2,(P0.u.y+e.y)/2);RUN(1);}HITS.length=0;
      for(let k=0;k<40;k++){const P=fpPose(),O=P.O,ty=gndH(e.x,e.y)+12,V=FP_DROP.v[fpWK(P0.u)];P0.a=Math.atan2(e.y-O.z,e.x-O.x);P0.p=Math.atan2(ty+fpDrop(hyp(e.x-O.x,e.y-O.z),V)-O.y,hyp(e.x-O.x,e.y-O.z));P0.reloadT=0;P0.clip=99;P0.kick=0;fpShoot();}
      return HITS.filter(q=>q.fp).length;};
    const no=forty(false),yes=forty(true);smokes.length=0;return{no,yes};});
  console.log('   fp',JSON.stringify(F));
  ok(F&&F.no>=30&&F.yes>=10&&F.yes<F.no,`from behind the gun at 30 m: ${F&&F.yes} of 40 rounds through the smoke hit him (${F&&F.no} in the clear)`);
  await errs(ev,errors,'smoke');await page.close();}

// 4. the drop: from behind a machine gun, the field gun and the bazooka
{const {page,errors,ev}=await start(2593);
  await ev(()=>{const C=dd.dc,d0=damage;window.HITS=[];window.damage=(t,d,s)=>{if(t.side==='P')return;if(t.tst)HITS.push({d,s:s&&s.id,fp:!!(s&&s.fp)});return d0(t,d,s);};
    let i=0;while(C.ph!=='w1'&&i++<900)RUN(.1);for(const e of enemies)KILL(e);for(const K of dd.tanks)K.hp=0;C.more=1;C.regenN=99;KEEP(1,'w1');
    const g=C.guns.find(q=>q.k==='n1');if(!g.man||g.man.fp)dcSit(g,players.find(p=>alive(p)&&!p.dcGun));RUN(.3);});
  const num=await ev(()=>({mg115:+fpDrop(1150,FP_DROP.v.mg).toFixed(1),mg60:+fpDrop(600,FP_DROP.v.mg).toFixed(1),rocket:+fpDrop(PRPG.range,FP_DROP.v.rocket).toFixed(1),shell:+fpDrop(960,FP_DROP.v.shell).toFixed(1),rocketR:PRPG.range}));
  console.log('  ',JSON.stringify(num));
  ok(num.mg60>=3&&num.mg60<=8&&num.mg115>=15&&num.mg115<=25&&num.rocket>=5&&num.shell>=10&&num.shell<=16,`how far they fall: a machine gun's round ${(num.mg60/10).toFixed(1)} m at 60 m and ${(num.mg115/10).toFixed(1)} m at 115 m, the bazooka's rocket ${(num.rocket/10).toFixed(1)} m at its ${num.rocketR/10} m, the field gun's shell ${(num.shell/10).toFixed(1)} m at 96 m`);
  // a man 30 m and 110 m out in front of MG NEST 1: 40 rounds with the crosshair on his chest, and 40 held over him by the drop
  const place=d=>ev(d=>{const C=dd.dc,g=C.guns.find(q=>q.k==='n1'),m=g.man,f=g.face0??-Math.PI/2;
    for(const da of[0,.12,-.12,.24,-.24,.36,-.36,.5,-.5]){const x=g.x+Math.cos(f+da)*d,y=g.y+Math.sin(f+da)*d;if(!isFree(x,y))continue;
      const z=ddFoe('w'+C.wave,x-DDX,y,{});Object.assign(z,{tst:1,hp:1e6,stunT:1e9,cool:1e9,path:[],ang:Math.PI/2,seen:true,alerted:true});enemies.push(z);const L=fireLine(m,z);if(L&&!shotCover(L))return true;KILL(z);}
    return false;},d);
  const R={};
  for(const d of[300,1100]){if(!await place(d)){ok(false,`no clean spot ${d/10} m out`);continue;}
    R[d]=await ev(()=>{const e=enemies.find(q=>q.tst&&!q.dead);if(!dd.fp)dcTile('n1');RUN(.2);const P0=dd.fp;if(!P0)return null;
      const forty=hold=>{HITS.length=0;const far=[];for(let k=0;k<80;k++){const P=fpPose(),O=P.O,ty=gndH(e.x,e.y)+12,h=hyp(e.x-O.x,e.y-O.z),V=FP_DROP.v[fpWK(P0.u)];
          P0.a=Math.atan2(e.y-O.z,e.x-O.x);P0.p=Math.atan2(ty+(hold?fpDrop(h,V):0)-O.y,h);P0.reloadT=0;P0.clip=99;P0.kick=0;fpShoot();const T=tracers[tracers.length-1];far.push(hyp(T.x2-T.x1,T.y2-T.y1));}
        far.sort((a,b)=>a-b);return{hits:HITS.filter(q=>q.fp).length,mid:Math.round(far[40]),d:Math.round(hyp(e.x-P0.u.x,e.y-P0.u.y))};};   // (mid: where half the rounds have come down by, or hit him)
      const r={chest:forty(false),over:forty(true)};KILL(e);RUN(.1);return r;});
    console.log(`   ${d/10} m`,JSON.stringify(R[d]));
    if(OUT&&d===1100){await ev(()=>{const e=enemies.find(q=>q.tst&&!q.dead);});}}
  const r30=R[300],r110=R[1100];
  ok(r30&&r30.chest.hits>=60,`30 m, the crosshair on his chest: ${r30&&r30.chest.hits} of 80 hit (the drop hardly shows)`);
  ok(r110&&r110.chest.mid<r110.chest.d-40,`110 m, the crosshair on his chest: the rounds come down short, half of them by ${r110&&r110.chest.mid/10} m (he's at ${r110&&r110.chest.d/10} m); ${r110&&r110.chest.hits} of 80 hit`);
  ok(r110&&Math.abs(r110.over.mid-r110.over.d)<=25&&r110.over.hits>=r110.chest.hits,`110 m, held over him by the drop (about ${(num.mg115/10).toFixed(1)} m): half the rounds reach ${r110&&r110.over.mid/10} m, ${r110&&r110.over.hits} of 80 hit`);
  // the field gun: the crosshair where a straight line meets the ground 90 m off: the shell comes down short; raised by the drop, it gets there
  const A=await ev(()=>{if(dd.fp)fpExit();RUN(.1);dcTile('a1');RUN(.3);const P0=dd.fp;if(!P0||!fpArt(P0.u))return null;
    const P=fpPose(),O=P.O,a=P0.a;let lo=-.5,hi=0;   // (the pitch whose straight line meets the ground 90 m out, found by halving)
    const st=p=>{P0.p=p;const Q=fpPose(),G=fpGround(Q.O,Q.D,0);return G?hyp(G.x-(Q.A?Q.A.x:P0.u.x),G.y-(Q.A?Q.A.y:P0.u.y)):1e4;};
    for(let k=0;k<30;k++){const m=(lo+hi)/2;if(st(m)>900)hi=m;else lo=m;}const p0=(lo+hi)/2,d0=st(p0);
    P0.p=p0;const s1=fpArtAim(),A0=fpPose().A||P0.u,d1=hyp(s1.x-A0.x,s1.y-A0.y);
    const Q=fpPose(),V=FP_DROP.v.shell,t=Q.O.y-gndH(Q.O.x+Q.D.x*900,Q.O.z+Q.D.z*900);P0.p=Math.atan2(-(t)+fpDrop(900,V),900);const s2=fpArtAim(),d2=hyp(s2.x-A0.x,s2.y-A0.y);
    // a tank 80 m off: the crosshair on the middle of its hull takes it; on its tracks the shell comes down short of it
    const ang=a,tx=A0.x+Math.cos(ang)*800,ty=A0.y+Math.sin(ang)*800,K=ddTankSpawn({x:tx,y:ty,ang:ang+Math.PI,hold:true,way:DCA.ways.road,name:'Tank',range:DCA.tankR});K.hp=K.hp0=DCA.tankHp;
    const at=h=>{const Q=fpPose(),dh=hyp(K.x-Q.O.x,K.y-Q.O.z);P0.a=Math.atan2(K.y-Q.O.z,K.x-Q.O.x);P0.p=Math.atan2(gndH(K.x,K.y)+h-Q.O.y,dh);const s=fpArtAim();return{tank:s.tank===K,d:Math.round(hyp(s.x-A0.x,s.y-A0.y))};};
    const mid=at(17),low=at(5);K.hp=0;
    return{line:Math.round(d0),flat:Math.round(d1),raised:Math.round(d2),tk:Math.round(hyp(K.x-A0.x,K.y-A0.y)),mid,low};});
  console.log('   field gun',JSON.stringify(A));
  ok(A&&A.line>=880&&A.line<=920&&A.flat<A.line-60&&Math.abs(A.raised-A.line)<A.line-A.flat,`the field gun: aimed where a straight line meets the ground at ${A&&A.line/10} m, the shell comes down at ${A&&A.flat/10} m; raised by the drop, at ${A&&A.raised/10} m`);
  ok(A&&A.mid.tank&&!A.low.tank&&A.low.d<A.tk-40,`a tank ${A&&A.tk/10} m off: the crosshair on the middle of its hull hits it, on its tracks the shell comes down at ${A&&A.low.d/10} m, short of it`);
  // the bazooka's rocket: the spot it goes to with the drop against without, the crosshair where a straight line meets the ground 34 m off
  const Z=await ev(()=>{if(dd.fp)fpExit();RUN(.1);const p=players.find(q=>alive(q)&&q.spec==='rpg'&&!q.dcGun)||players.find(q=>alive(q)&&!q.dcGun);if(!p)return null;p.spec='rpg';p.specN=2;fpEnter(p,'3p');RUN(.2);const P0=dd.fp;if(!P0)return null;
    let lo=-.6,hi=.2;const st=v=>{const Q=fpPose(),G=fpGround(Q.O,Q.D,v);return G?hyp(G.x-p.x,G.y-p.y):1e4;};
    for(let k=0;k<30;k++){const m=(lo+hi)/2;P0.p=m;if(st(0)>340)hi=m;else lo=m;}P0.p=(lo+hi)/2;
    const a=fpAimPoint(PRPG.range-4,PRPG.min+4,0),b=fpAimPoint(PRPG.range-4,PRPG.min+4,FP_DROP.v.rocket);fpExit();return{straight:Math.round(a.d),falls:Math.round(b.d)};});
  console.log('   bazooka',JSON.stringify(Z));
  ok(Z&&Z.straight>=320&&Z.straight<=360&&Z.falls<Z.straight-20,`the bazooka: aimed where a straight line meets the ground at ${Z&&Z.straight/10} m, the rocket comes down at ${Z&&Z.falls/10} m`);
  await errs(ev,errors,'the drop');await page.close();}
console.log(fails?'FAILED '+fails:'ALL OK');await b.close();srv.close();})();

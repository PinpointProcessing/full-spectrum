// Version 258, Bryan: "Make sure the stationary nests work at a distance too. Obviously not as strong or as accurate, but make it feel like it does
// something." One of their men stood still in the open in front of MG NEST 1 at 30, 60, 90, 110 and 120 m (nobody else of theirs on the field):
// does the nest's gunner fire on him by himself, how often a round hits, what a hit does, how pinned he gets; then the same from behind the gun.
// node counter-v258-test.js [port] [OUTDIR for pictures]   (DDROOT, HARNESS as counter-v254-test.js)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const PORT=+process.argv[2]||9795,OUT=process.argv[3]||null;if(OUT)fs.mkdirSync(OUT,{recursive:true});
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(258);localStorage.removeItem('warehouseYard.ddmeta.v1');window.TKERR=[];
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){try{update(1/30);if(dd.dc)dd.dc.strT=simT;}catch(e){TKERR.push('update: '+e.message+' @'+(e.stack||'').split('\n')[1]);}if(i%3==0){try{panTick(.1);ddFrame(.1,simT);}catch(e){TKERR.push('frame: '+e.message+' @'+(e.stack||'').split('\n')[1]);}}}};   // (strT: the last of a wave would fall back into the woods after 25 s)
  window.DRAW=()=>{try{updateCamera();if(dd.fp)fpCam(1/30);render(1/30,simT);drawOverlay(1/30,simT);hud();if(dd.fp)fpHud();}catch(e){TKERR.push('draw: '+e.message+' @'+(e.stack||'').split('\n')[1]);}};});
await page.click('#ddCtrBtn');await page.waitForTimeout(900);
// the fight under way, then everything of theirs off the field and our side unhurt; the test's man stands in the open in front of MG NEST 1
const g0=await ev(()=>{const C=dd.dc,d0=damage;window.HITS=[];window.damage=(t,d,s)=>{if(t.side==='P')return;if(t.tst)HITS.push({d,s:s&&s.id,fp:!!(s&&s.fp)});return d0(t,d,s);};
  let i=0;while(C.ph!=='w1'&&i++<900)RUN(.1);for(const e of enemies){e.dead=true;e.gone=true;e.hp=0;}for(const K of dd.tanks)K.hp=0;C.more=1;
  const z=ddFoe('w'+C.wave,400-DDX,-1000,{});Object.assign(z,{hp:1e6,stunT:1e9,cool:1e9,path:[]});enemies.push(z);   // (one far off in the woods, out of everyone's reach, so the wave doesn't end between the test's men)
  const g=C.guns.find(q=>q.k==='n1');if(!g.man||g.man.fp)dcSit(g,players.find(p=>alive(p)&&!p.dcGun));RUN(.3);
  window.BURSTS=[];const b0=burst;window.burst=(u,t,L)=>{if(t&&t.tst)BURSTS.push({u:u.id,t:+simT.toFixed(1)});return b0(u,t,L);};
  return{man:g.man&&g.man.id,face:+(g.face0??-Math.PI/2).toFixed(2),x:g.x,y:g.y,reach:typeof wRange==='function'?wRange(g.man):null};});
console.log('  ',JSON.stringify(g0));
// a spot d out in front of the nest with a clean line from its gunner and no cover
const place=d=>ev(d=>{const C=dd.dc,g=C.guns.find(q=>q.k==='n1'),m=g.man,f=g.face0??-Math.PI/2;let best=null;
  for(const da of[0,.12,-.12,.24,-.24,.36,-.36,.5,-.5]){const x=g.x+Math.cos(f+da)*d,y=g.y+Math.sin(f+da)*d;if(!isFree(x,y))continue;
    const e=ddFoe('w'+C.wave,x-DDX,y,{});e.tst=1;e.hp=1e6;e.stunT=1e9;e.cool=1e9;e.path=[];e.ang=Math.PI/2;e.seen=true;e.alerted=true;enemies.push(e);
    const L=fireLine(m,e),cov=L?shotCover(L):9;if(L&&!cov){best=e;break;}e.dead=true;e.gone=true;e.hp=0;}
  if(!best)return null;const L=fireLine(m,best);return{x:Math.round(best.x),y:Math.round(best.y),c:+hitChance(m,best,L).toFixed(3)};},d);
const R=[];
for(const d of[300,600,900,1100,1200]){const p=await place(d);if(!p){ok(false,`no clean spot ${d/10} m out in front of MG NEST 1`);continue;}
  const r=await ev(()=>{HITS.length=0;BURSTS.length=0;const e=enemies.find(q=>q.tst&&!q.dead);e.sup=0;const sup=[];for(let k=0;k<15;k++){RUN(1);sup.push(e.sup);}
    const m=dd.dc.guns.find(q=>q.k==='n1').man,h=HITS.filter(q=>q.s===m.id);e.dead=true;e.gone=true;e.hp=0;RUN(.2);
    return{bursts:BURSTS.filter(q=>q.u===m.id).length,hits:h.length,per:h.length?+(h.reduce((a,q)=>a+q.d,0)/h.length).toFixed(1):0,sup:+Math.max(...sup).toFixed(2)};});
  R.push({d:d/10,...p,...r});console.log('  ',JSON.stringify({d:d/10,...p,...r}));}
const at=d=>R.find(q=>q.d===d)||{};
ok(at(30).bursts>0&&at(30).hits>0,`30 m: the nest's gunner fires on him by himself (${at(30).bursts} bursts, ${at(30).hits} hits, ${at(30).per} a hit, chance ${at(30).c})`);
ok(at(60).bursts>0&&at(60).hits>0&&at(90).bursts>0&&at(90).hits>0&&at(110).bursts>0,`60, 90 and 110 m: he still fires on him (${at(60).bursts}, ${at(90).bursts}, ${at(110).bursts} bursts in 15 s) and hits (${at(60).hits}, ${at(90).hits}, ${at(110).hits})`);
ok(at(30).c>at(60).c&&at(60).c>at(90).c&&at(90).c>at(110).c&&at(110).c>=.1,`less accurate the further: ${at(30).c}, ${at(60).c}, ${at(90).c}, ${at(110).c} a round in the open`);
ok(at(90).per>0&&at(90).per<at(30).per*.8&&(!at(110).hits||at(110).per<at(90).per+1),`weaker the further: ${at(30).per} a hit at 30 m, ${at(60).per} at 60, ${at(90).per} at 90, ${at(110).per} at 110`);
ok(at(90).sup>=.5,`at 90 m he's pinned down (suppression ${at(90).sup})`);
ok(at(120).bursts===0,`120 m: out of reach (${at(120).bursts} bursts)`);
if(OUT){await ev(()=>{const C=dd.dc,g=C.guns.find(q=>q.k==='n1');camT={x:g.x,z:g.y-430};zoom=1.6;});const p=await place(900);await ev(()=>{RUN(4);DRAW();});await page.waitForTimeout(500);await ev(()=>DRAW());await page.waitForTimeout(300);await page.screenshot({path:`${OUT}/top-90m.png`});
  await ev(()=>{const e=enemies.find(q=>q.tst&&!q.dead);if(e){e.dead=true;e.gone=true;e.hp=0;}});}
// from behind the gun: 40 rounds with the crosshair on him at 30, 90 and 120 m
const F=[];
for(const d of[300,900,1200]){const p=await place(d);if(!p)continue;
  const f=await ev(()=>{const C=dd.dc,g=C.guns.find(q=>q.k==='n1');if(!dd.fp)dcTile('n1');RUN(.2);const P0=dd.fp;if(!P0)return{fp:false};HITS.length=0;const e=enemies.find(q=>q.tst&&!q.dead);
    for(let k=0;k<40;k++){const P=fpPose(),O=P.O,ty=gndH(e.x,e.y)+12;P0.a=Math.atan2(e.y-O.z,e.x-O.x);P0.p=Math.atan2(ty-O.y,hyp(e.x-O.x,e.y-O.z));P0.reloadT=0;P0.clip=99;P0.kick=0;fpShoot();}   // (kick: the test fires all 40 in one moment, so the recoil it would shake off between rounds is put back by hand)
    const h=HITS.filter(q=>q.fp),far=tracers.slice(-40).map(t=>Math.round(hyp(t.x2-t.x1,t.y2-t.y1)));
    return{fp:true,on:P0.u.dcGun&&P0.u.dcGun.k,hits:h.length,per:h.length?+(h.reduce((a,q)=>a+q.d,0)/h.length).toFixed(1):0,reach:Math.max(...far)};});
  F.push({d:d/10,...f});console.log('   fp',JSON.stringify({d:d/10,...f}));
  if(OUT&&d===900){await ev(()=>{const e=enemies.find(q=>q.tst&&!q.dead),P0=dd.fp;for(let k=0;k<6;k++){const P=fpPose(),O=P.O,ty=gndH(e.x,e.y)+12;P0.a=Math.atan2(e.y-O.z,e.x-O.x);P0.p=Math.atan2(ty-O.y,hyp(e.x-O.x,e.y-O.z));P0.kick=0;fpShoot();}ddFrame(1/30,simT);DRAW();});
    await page.waitForTimeout(500);await ev(()=>{ddFrame(1/60,simT);DRAW();});await page.waitForTimeout(300);await page.screenshot({path:`${OUT}/fp-90m.png`});}   // (mid-burst: the tracers out to him)
  await ev(()=>{const e=enemies.find(q=>q.tst&&!q.dead);if(e){e.dead=true;e.gone=true;e.hp=0;}RUN(.1);});}
const fa=d=>F.find(q=>q.d===d)||{};
ok(fa(30).fp&&fa(30).hits>=20,`behind the gun, 40 rounds at 30 m: ${fa(30).hits} hits, ${fa(30).per} a hit`);
ok(fa(90).hits>=5&&fa(90).hits<fa(30).hits&&fa(90).per<fa(30).per*.8&&fa(90).reach>=850,`at 90 m: the rounds reach him (${fa(90).reach}), ${fa(90).hits} hits of 40, ${fa(90).per} a hit`);
ok(fa(120).hits===0,`at 120 m: out of reach (${fa(120).hits} hits, rounds stop at ${fa(120).reach})`);
ok(errors.length===0&&(await ev(()=>TKERR.length))===0,'no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));
console.log(fails?'FAILED '+fails:'ALL OK');await b.close();srv.close();})();

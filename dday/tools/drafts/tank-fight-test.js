// Version 247 (Bryan, after Version 246: "The field gun was not doing anything to the tank and the tank was not engaging at all. There should be an
// MG unit on top of the tank too"): Chapter 2's tanks. The man at the machine gun in the commander's hatch (there, at the hatch, seen, round with the
// turret); the fight left to itself (the tank's gun fires with every gun of ours on it); from behind the field gun (a shell aimed at the tank's hull
// hits the tank, a second knocks it out, its gunner with it; a shot at open ground lands where the crosshair is); the gunner (he fires on our men,
// the flash from his gun's muzzle, half cover in his hatch, killed from behind a machine gun, the tank fights on).
// node tank-fight-test.js PORT [real=0|1] [OUTDIR for pictures]   (real 1: the draft's tank and its own machine gun; DDROOT = the dday folder; HARNESS = the scratchpad's harness.js)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const PORT=+process.argv[2]||9815,REAL=process.argv[3]==='1',OUT=process.argv[4]||null;if(OUT)fs.mkdirSync(OUT,{recursive:true});
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
const start=async()=>{const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1${REAL?'&real=1':''}`);await page.setViewportSize({width:OUT?640:390,height:OUT?480:760});const ev=(f,a)=>page.evaluate(f,a);
  await ev(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4247);localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.lastError');
    window.TKERR=[];window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){try{update(1/30);}catch(e){TKERR.push('update: '+e.message+' @'+(e.stack||'').split('\n')[1]);}if(i%3==0){try{panTick(.1);ddFrame(.1,simT);}catch(e){TKERR.push('frame: '+e.message+' @'+(e.stack||'').split('\n')[1]);}}}};
    window.SAFE=on=>{if(!window._d0)window._d0=damage;damage=on?((t,d,s)=>t.side==='P'?undefined:_d0(t,d,s)):_d0;};});
  await page.click('#ddCtrBtn');await page.waitForTimeout(900);return{page,errors,ev};};
const shot=async(page,ev,name,c)=>{if(!OUT)return;await ev(c=>{window._cam=c;if(!window._uc0)window._uc0=updateCamera;updateCamera=()=>{const c=window._cam;camera.fov=c[6]||38;camera.near=1;camera.aspect=cw/ch;camera.updateProjectionMatrix();camera.position.set(c[0],c[1],c[2]);camera.lookAt(c[3],c[4],c[5]);camera.updateMatrixWorld();};
    if(!window._dc)window._dc=ddCam;ddCam=()=>{};for(const s of ['#sq','.panel','#ddObj','#hint','#banner','#big','#bigText','#tl','#obj','#fp','#dcBar','#ddSwap','#dcNoRe'])for(const el of document.querySelectorAll(s))el.style.visibility='hidden';
    ddFrame(.6,simT);render(1/30,simT);ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);},c);await page.waitForTimeout(400);
  await ev(()=>{ddFrame(.6,simT);render(1/30,simT);ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);});await page.waitForTimeout(300);await page.screenshot({path:`${OUT}/${name}.png`});console.log('shot',name);};
// ---- 1. the man on the tank: there, at the hatch, seen; pictures
{const {page,errors,ev}=await start();
  const s=await ev(()=>{SAFE(1);RUN(1.2);const out=[];for(const K of dd.tanks){const e=K.mg;if(!e){out.push(null);continue;}K.tur.updateWorldMatrix(true,true);const w=K.mgG.getWorldPosition(new THREE.Vector3()),f=e.m.g.position;
      out.push({alive:!e.dead,dormant:!!e.dormant,vis:!!e.vis,shown:(render(1/30,simT),e.m.g.visible),dx:+(w.x-e.x).toFixed(2),dz:+(w.z-e.y).toFixed(2),waist:+(w.y-e.m.g.position.y).toFixed(2),inE:enemies.includes(e),tag:e.tag,gunner:e.gunner,elev:+e.elev.toFixed(1)});}
    return{n:dd.tanks.length,out,real:dd.tanks.every(K=>!!(K.g.userData&&K.g.userData.real))};});
  ok(s.n===4&&s.out.every(q=>q&&q.alive&&q.inE&&q.gunner&&q.tag==='tankmg'),'every tank has a man at a machine gun, one of their men ('+s.out.length+')');
  ok(s.out.every(q=>q&&Math.abs(q.dx)<.6&&Math.abs(q.dz)<.6&&Math.abs(q.waist-10.5)<.8),'he stands in the commander\'s hatch, waist at its rim '+JSON.stringify(s.out[0]));
  ok(s.out.every(q=>q&&!q.dormant&&q.vis&&q.shown),'he is seen on a waiting tank from across the field');ok(s.real===REAL,'the tank model is the '+(REAL?'draft\'s':'old one'));
  if(OUT){const K=await ev(()=>{const K=dd.tanks[0];K.ta=K.ang+.5;K.mg.ang=K.ta-.7;K.mg.aimT=simT+99;for(const e of enemies)if(!e.onTank)e.stunT=1e9;ddTankTick(0);const g=ddH(K.x,K.y);return{x:K.x,y:K.y,g};});
    const at=(name,az,d,h,lh,fov)=>shot(page,ev,name,[K.x+Math.cos(az)*d,K.g+h,K.y+Math.sin(az)*d,K.x,K.g+(lh==null?12:lh),K.y,fov||38]);
    await at('tank-q',.9,96,46,16);await at('tank-close',1.25,52,44,30,34);await at('tank-side',2.3,70,30,22,36);await at('tank-battle',1.57,190,150,10,30);}
  // turned: he goes round with the turret
  const t=await ev(()=>{const K=dd.tanks[0];K.ta=K.ang+1.3;K.mg.aimT=simT;ddTankTick(0);K.tur.updateWorldMatrix(true,true);const w=K.mgG.getWorldPosition(new THREE.Vector3());return{d:+Math.hypot(w.x-K.mg.x,w.z-K.mg.y).toFixed(2),gy:+K.mgG.rotation.y.toFixed(2),want:+(-(K.mg.ang-K.ta)).toFixed(2)};});
  ok(t.d<.6&&Math.abs(t.gy-t.want)<.02,'the turret turned: he and his gun go round with it, the gun where he aims '+JSON.stringify(t));
  ok(errors.length===0&&(await ev(()=>TKERR.length))===0,'no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));await page.close();}
// ---- 2. the fight by itself: the tank's gun and its machine gun are heard from
{const {page,errors,ev}=await start();
  const r=await ev(()=>{SAFE(1);window.N={shell:0,mg:0,mgHit:0,first:null,mgFirst:null};const s0=ddShell;ddShell=function(by){if(by&&by.way){N.shell++;if(N.first==null)N.first=+simT.toFixed(1);}return s0.apply(this,arguments);};
    const b0=burst;burst=function(u,t){if(u.onTank){N.mg++;if(N.mgFirst==null)N.mgFirst=+simT.toFixed(1);}return b0.apply(this,arguments);};
    RUN(16.2);const K=dd.tanks.find(q=>q.w===1);const log=[];let t0=simT;
    while(simT-t0<45&&K.hp>0){RUN(3);log.push([+(simT-t0).toFixed(0),Math.round(K.hp),Math.round(K.y),N.shell,N.mg,K.mg.dead?'x':Math.round(K.mg.hp)]);}
    return{log,N,dead:K.hp<=0,at:[Math.round(K.x),Math.round(K.y)],mgDead:K.mg.dead,mgGone:!!K.mg.gone,guns:dd.dc.guns.map(g=>g.k+':'+(g.dead?'dead':g.man?'manned':'-')+' '+Math.round(g.hp)).join(' | ')};});
  console.log('   tank log [t, hp, y, shells, mg bursts, gunner hp]:',JSON.stringify(r.log));console.log('  ',JSON.stringify(r.N),r.guns);
  ok(r.N.shell>=1,'with every gun of ours on it the first tank still fires its gun ('+r.N.shell+' shells, the first at '+r.N.first+' s)');
  console.log('   (its machine gunner: '+r.N.mg+' bursts, the first at '+r.N.mgFirst+' s)');
  ok(!r.dead||(r.mgDead&&r.mgGone),'the tank knocked out: its gunner went with it');
  ok(errors.length===0&&(await ev(()=>TKERR.length))===0,'no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));await page.close();}
// ---- 3. from behind the field gun: the shell goes to what the crosshair is on
{const {page,errors,ev}=await start();
  const r=await ev(()=>{SAFE(1);RUN(16.5);const C=dd.dc,g=C.guns.find(q=>q.t==='art'),out={};for(const q of C.guns)if(q.hv&&q.man)dcLeave(q);
    dcTile(g.k);if(!dd.fp)return{fp:false};const F=dd.fp;RUN(6);const K=dd.tanks.find(q=>!q.hold&&q.hp>0);if(!K)return{fp:true,tank:null};out.shots=[];K.hp=K.hp0;
    const shoot=(label,hgt)=>{const P0=fpPose();F.a=Math.atan2(K.y-P0.O.z,K.x-P0.O.x);const P1=fpPose(),d=Math.hypot(K.x-P1.O.x,K.y-P1.O.z);F.p=Math.atan2(gndH(K.x,K.y)+hgt-P1.O.y,d);F.kick=0;
      g.fireT=0;const n0=nades.length,hp0=K.hp;F.fire=true;fpTick(1/30);const n=nades[nades.length-1],fired=nades.length>n0;RUN((n?n.dur:1)+.3);
      out.shots.push({label,dist:Math.round(d),dur:n?+n.dur.toFixed(2):null,direct:!!(n&&n.direct),tk:!!(n&&n.tk),fired,hp0:Math.round(hp0),hp1:Math.round(K.hp),tankDead:K.hp<=0});};
    shoot('at its hull',12);shoot('at its turret',25);out.mg=K.mg?{dead:K.mg.dead,gone:!!K.mg.gone}:null;
    // a shot at open ground still lands where the crosshair is
    {const P0=fpPose();F.a=-Math.PI/2+.5;F.p=-.05;F.kick=0;g.fireT=0;const A=fpAimPoint(DCA.art.max,DCA.art.min);F.fire=true;fpTick(1/30);const n=nades[nades.length-1];out.ground={dx:Math.round(n.x1-A.x),dy:Math.round(n.y1-A.y),direct:!!n.direct,dur:+n.dur.toFixed(2)};}
    out.err=TKERR.slice(0,3);return out;});
  console.log('  ',JSON.stringify(r));
  ok(r.shots&&r.shots[0].fired&&r.shots[0].direct&&r.shots[0].tk&&r.shots[0].hp1<r.shots[0].hp0-120,'aimed at the tank\'s hull the shell hits the tank ('+(r.shots&&r.shots[0].hp0)+' to '+(r.shots&&r.shots[0].hp1)+', '+(r.shots&&r.shots[0].dur)+' s in the air at '+(r.shots&&r.shots[0].dist/10)+' m)');
  ok(r.shots&&r.shots[1].tankDead,'a second, at its turret, knocks it out');ok(r.mg&&r.mg.dead,'and its gunner with it');
  ok(r.ground&&Math.abs(r.ground.dx)<2&&Math.abs(r.ground.dy)<2&&r.ground.direct,'a shot at open ground lands where the crosshair is, flat ('+JSON.stringify(r.ground)+')');
  ok(errors.length===0&&(await ev(()=>TKERR.length))===0,'no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));await page.close();}
// ---- 4. the gunner can be shot: by the squad's own fire, and from behind a machine gun; the tank fights on without him
{const {page,errors,ev}=await start();
  const r=await ev(()=>{SAFE(1);RUN(16.5);const C=dd.dc,out={};const K=dd.tanks.find(q=>q.w===1),e=K.mg;
    // put the tank 30 m in front of a nest, everyone else of theirs out of it
    for(const q of enemies)if(q!==e){q.stunT=1e9;q.x=300;q.y=-600;q.path=[];}const g=C.guns.find(q=>q.t==='mg'&&!q.hv&&q.man);K.x=g.x+40;K.y=g.y-300;K.hold=true;K.ang=Math.PI/2;K.ta=Math.PI/2;K.fireT=simT+999;ddTankTick(0);
    {let nb=0,hit=0;const b0=burst;burst=function(u,t){if(u===e)nb++;return b0.apply(this,arguments);};const d1=damage;damage=function(t,d,s){if(s===e&&t.side==='P')hit++;if(t===e)return;return d1.apply(this,arguments);};e.cool=0;const hpK=K.hp;for(let i=0;i<12;i++){RUN(.5);K.hp=hpK;K.fireT=simT+999;}burst=b0;damage=d1;out.bursts=nb;out.hits=hit;out.tgt=e.target?e.target.name:null;out.mz=(()=>{render(1/30,simT);const v=muzzleAt(e,new THREE.Vector3());K.tur.updateWorldMatrix(true,true);const w=K.mgG.getWorldPosition(new THREE.Vector3());return v?[+Math.hypot(v.x-w.x,v.z-w.z).toFixed(1),+(v.y-w.y).toFixed(1)]:null;})();}
    out.cover=coverAt(e.x,e.y,g.man.x,g.man.y);out.chance=+hitChance(g.man,e).toFixed(2);e.onTank=null;out.chanceOpen=+hitChance(g.man,e).toFixed(2);e.onTank=K;
    // from behind the gun: aim at his chest
    dcTile(g.k);if(!dd.fp)return Object.assign(out,{fp:false});const F=dd.fp,P0=fpPose();F.a=Math.atan2(e.y-P0.O.z,e.x-P0.O.x);const P1=fpPose(),d=Math.hypot(e.x-P1.O.x,e.y-P1.O.z);F.p=Math.atan2(gndH(e.x,e.y)+e.elev+15-P1.O.y,d);
    const hp0=e.hp;let n=0;F.clip=60;F.reloadT=0;for(let i=0;i<40&&!e.dead;i++){F.kick=0;fpShoot();n++;}out.fp={hp0,hp1:Math.round(e.hp),dead:e.dead,rounds:n,dist:Math.round(d)};fpExit();
    let sh=0;const f0=ddShell;ddShell=function(by){if(by===K)sh++;return f0.apply(this,arguments);};K.fireT=simT;K.fireMax=null;RUN(1.5);out.after={gone:!!e.gone,gunUp:+K.mgG.rotation.z.toFixed(2),tankHp:Math.round(K.hp)};K.hold=false;RUN(10);out.shellsAfter=sh;
    out.err=TKERR.slice(0,3);return out;});
  console.log('  ',JSON.stringify(r));
  ok(r.bursts>=2,'30 m in front of a nest his machine gun fires on our men ('+r.bursts+' bursts in 6 s, '+r.hits+' rounds home, at '+r.tgt+')');ok(r.mz&&r.mz[0]>13&&r.mz[0]<19&&r.mz[1]>1&&r.mz[1]<4,'the flash comes from his gun\'s muzzle ('+JSON.stringify(r.mz)+' ahead of him, over the rim)');
  ok(r.chance<r.chanceOpen-.2||r.chance<=.06,'he has half cover in his hatch ('+r.chance+' to hit him against '+r.chanceOpen+' in the open)');
  ok(r.fp&&r.fp.dead,'from behind a machine gun, rounds at his chest kill him ('+(r.fp&&r.fp.rounds)+' rounds at '+(r.fp&&r.fp.dist/10)+' m)');
  ok(r.after&&r.after.gone&&r.after.gunUp>.3,'he drops inside, his gun left pointing up');ok(r.shellsAfter>=1,'the tank fights on with its gun ('+r.shellsAfter+' shells in 11 s)');
  ok(errors.length===0&&(await ev(()=>TKERR.length))===0,'no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));await page.close();}
// ---- 5. Chapter 1: a tank kept back with no reach of its own (the base's second tank in its motor pool): its gunner stays down inside until it rolls out
{const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1${REAL?'&real=1':''}`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
  await ev(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4247);localStorage.removeItem('warehouseYard.ddmeta.v1');window.TKERR=[];
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){try{update(1/30);}catch(e){TKERR.push('update: '+e.message+' @'+(e.stack||'').split('\n')[1]);}if(i%3==0){try{panTick(.1);ddFrame(.1,simT);}catch(e){TKERR.push('frame: '+e.message);}}}};});
  await page.click('#ddBtn');await page.waitForTimeout(700);
  const r=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);RUN(1);dd.ctr={on:true,sq:4,t:1e9};   // (the beach's tanks are moved on once its counterattack has begun: ddCounter)
    const n0=enemies.length,K=ddTankSpawn({x:DDX+700,y:-560,ang:Math.PI,name:'Test',range:1,hold:true}),e=K.mg;RUN(1);render(1/30,simT);
    const a={inE:enemies.includes(e),added:enemies.length-n0,dormant:!!e.dormant,shown:e.m.g.visible,beaten:beaten(e)};
    K.hold=false;K.range=520;RUN(1);render(1/30,simT);const bb={dormant:!!e.dormant,shown:e.m.g.visible,vis:!!e.vis};
    ddTankHit(K.x,K.y,3);RUN(1.5);render(1/30,simT);return{a,b:bb,c:{dead:e.dead,gone:!!e.gone,shown:e.m.g.visible,wreck:!!K.wreck},err:TKERR.slice(0,3)};});
  console.log('  ',JSON.stringify(r));
  ok(r.a.inE&&r.a.added===1&&r.a.dormant&&!r.a.shown&&r.a.beaten,'the beach: on a tank kept back with no reach its gunner is down inside, out of the fight');
  ok(!r.b.dormant&&r.b.shown&&r.b.vis,'it rolls out: he is up and seen');ok(r.c.dead&&r.c.gone&&!r.c.shown&&r.c.wreck,'it is knocked out: he is gone with it, the wreck is cover');
  ok(errors.length===0&&r.err.length===0,'no errors '+errors.slice(0,2)+r.err);await page.close();}
console.log(fails?'FAILED '+fails:'ALL OK');await b.close();srv.close();})();

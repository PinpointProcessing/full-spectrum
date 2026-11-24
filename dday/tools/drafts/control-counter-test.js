const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const W=+process.argv[2]||1100,H=+process.argv[3]||680,PO=+process.argv[4]||0;
(async()=>{const port=9960+PO,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=2`);
await page.setViewportSize({width:W,height:H});
await page.evaluate(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=1;R.battles=1;R.minLevel=2;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,2,false)));ddmSave();window.requestAnimationFrame=()=>0;startCounter();});
await page.waitForTimeout(800);const ev=(f,a)=>page.evaluate(f,a);
const shot=async n=>{await ev(()=>{updateCamera();render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(700);await ev(()=>{updateCamera();render(.001,simT);drawOverlay(.001,simT);});await page.screenshot({path:`fp_${n}_${W}.png`});};
await ev(()=>{window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};});
const log=async(l,f,a)=>console.log(l+':',await ev(f,a));
await ev(()=>RUN(3));
await ev(()=>{select(players.filter(p=>p.team==='A'&&alive(p)));hud();drawOverlay(.03,simT);});
await log('bar button',()=>{const b=document.querySelector('.sq-fp');return b?b.textContent:'MISSING';});
await shot('0bar');
await page.click('.sq-fp');
await log('entered',()=>{const F=dd.fp;return F?`${F.u.name} ${F.u.ddRole} view ${F.view} H ${F.H.toFixed(1)} sel ${sel.length} body.fp ${document.body.classList.contains('fp')} fphidden ${$('#fp').hidden}`:'NO'});
await ev(()=>RUN(.3));await shot('1third');
// walk forward (north) 3 s with W held
await log('walk',()=>{const F=dd.fp,u=F.u,x0=u.x,y0=u.y;F.a=-Math.PI/2;F.keys.w=true;RUN(3);F.keys.w=false;const m=players.filter(p=>p.team===u.team&&p!==u&&alive(p));return `moved ${Math.round(hyp(u.x-x0,u.y-y0))} to ${Math.round(u.x)},${Math.round(u.y)}; mates dist ${m.map(p=>Math.round(hyp(p.x-u.x,p.y-u.y))+(p.path.length?'*':'')).join(' ')}`;});
await log('walk on 6s',()=>{const F=dd.fp,u=F.u;F.keys.w=true;RUN(6);F.keys.w=false;RUN(4);const m=players.filter(p=>p.team===u.team&&p!==u&&alive(p));return `at ${Math.round(u.x)},${Math.round(u.y)}; mates dist ${m.map(p=>Math.round(hyp(p.x-u.x,p.y-u.y))+(p.path.length?'*':'')).join(' ')}`;});
await shot('2walked');
// a wall: walk into the gate wall sideways
await log('strafe 2s',()=>{const F=dd.fp,u=F.u,x0=u.x;F.keys.d=true;RUN(2);F.keys.d=false;return `dx ${Math.round(u.x-x0)}`;});
// shooting: put an enemy 150 ahead, aim at his chest
await log('shoot',()=>{const F=dd.fp,u=F.u;const e=enemies.filter(e=>!beaten(e))[0];e.x=u.x;e.y=u.y-150;e.path=[];e.dcStage=99;e.stunT=1e9;const hp0=e.hp;
  const P=fpPose(),g=gndH(e.x,e.y)+12;F.a=Math.atan2(e.y-u.y,e.x-u.x);F.p=0;const P2=fpPose();F.p=Math.atan2(g-P2.O.y,hyp(e.x-P2.O.x,e.y-P2.O.z));
  window.TE=e;F.fire=true;let n=0,c0=FP_W[fpWK(u)].clip;RUN(1.2);F.fire=false;return `weapon ${u.weapon} hp ${hp0} -> ${Math.round(e.hp)} dead ${e.dead} clip ${F.clip}/${c0} hitT ${F.hitT>0} kills ${u.stats&&u.stats.kills}`;});
await log('aim away, shoot',()=>{const F=dd.fp,u=F.u,e=enemies.filter(e=>!beaten(e)&&e!==window.TE)[0];e.x=u.x+10;e.y=u.y-150;e.path=[];const hp0=e.hp;F.a=-Math.PI/2-.5;F.p=0;F.fire=true;RUN(1);F.fire=false;return `hp ${hp0} -> ${Math.round(e.hp)} (should be unchanged) clip ${F.clip} reload ${F.reloadT>0}`;});
await ev(()=>{dd.fp.view='1p';dd.fp.a=-Math.PI/2;dd.fp.p=-.03;RUN(.1);});await shot('3first');
await ev(()=>{dd.fp.aim=true;RUN(.5);});await shot('3aim');await ev(()=>{dd.fp.aim=false;});
// grenade
await log('grenade',()=>{const F=dd.fp,u=F.u,n0=u.grenade,k=nades.length;F.p=-.2;fpNade();return `gren ${n0}->${u.grenade} nades ${k}->${nades.length} msg ${F.msg&&F.msg.t}`;});
await log('spec',()=>{const F=dd.fp,u=F.u,n0=u.specN;fpSpec();RUN(2);return `${u.spec} ${n0}->${u.specN} msg ${F.msg&&F.msg.t}`;});
// next man by Tab
await page.keyboard.press('Tab');await log('tab',()=>dd.fp.u.name+' '+dd.fp.u.ddRole+' view '+dd.fp.view+' others fp '+players.filter(p=>p.fp).length);
// man a gun: walk him next to nest w1 and Use
await log('gun',()=>{const F=dd.fp,u=F.u,g=dd.dc.guns.find(g=>g.k==='w1');if(g.man){g.man.onGun=null;g.man.gunner=false;g.man.dcGun=null;g.man=null;}u.x=g.x+20;u.y=g.y+30;u.path=[];RUN(.1);const near=fpGunNear();fpHud();const bt=document.querySelector('#fp [data-a="use"]');const r=[`near ${near&&near.k} btn "${bt.textContent}" hidden ${bt.hidden}`];fpUse();RUN(4);r.push(`onGun ${!!u.onGun} man ${g.man&&g.man.name} pos ${Math.round(u.x)},${Math.round(u.y)} wk ${fpWK(u)} clip ${F.clip}`);
  F.a=-Math.PI/2+3;const a0=F.a;document.querySelector('#fp').dispatchEvent(new Event('x'));return r.join(' | ');});
await ev(()=>{dd.fp.a=-Math.PI/2;dd.fp.p=-.05;RUN(.1);});await shot('4gun');
await log('mg fire',()=>{const F=dd.fp,u=F.u,e=window.TE.dead?enemies.filter(e=>!beaten(e))[0]:window.TE;e.x=u.x;e.y=u.y-200;e.path=[];e.stunT=1e9;const hp0=e.hp;const P2=fpPose(),g=gndH(e.x,e.y)+12;F.a=Math.atan2(e.y-u.y,e.x-u.x);F.p=Math.atan2(g-P2.O.y,hyp(e.x-P2.O.x,e.y-P2.O.z));F.fire=true;RUN(1.5);F.fire=false;return `hp ${hp0}->${Math.round(e.hp)} dead ${e.dead} clip ${F.clip} los ${los(u.x,u.y,e.x,e.y)}`;});
await log('leave gun by stick',()=>{const F=dd.fp,u=F.u;F.keys.s=true;RUN(1);F.keys.s=false;return `onGun ${!!u.onGun} dcGun ${!!u.dcGun} man ${dd.dc.guns.find(g=>g.k==='w1').man}`;});
// field gun
await log('field gun',()=>{const F=dd.fp,u=F.u,g=dd.dc.guns.find(g=>g.t==='art');if(g.man){g.man.dcGun=null;g.man=null;}u.x=g.x+10;u.y=g.y+40;RUN(.1);fpUse();RUN(4);const A=fpArt(u);dd.dc.ph='w1';if(A)A.fireT=0;F.a=-Math.PI/2;F.p=-.12;const k=nades.length;F.fire=true;RUN(.2);return `art ${!!A} shells ${k}->${nades.length} target ${nades.length?Math.round(nades[nades.length-1].x1)+','+Math.round(nades[nades.length-1].y1):''} gun ${Math.round(g.x)},${Math.round(g.y)}`;});
await shot('5art');
// Escape back to command
await page.keyboard.press('Escape');await log('exit',()=>`fp ${dd.fp} sel ${sel.length} fov ${camera.fov} near ${camera.near} body.fp ${document.body.classList.contains('fp')} anyfp ${players.some(p=>p.fp)}`);
await ev(()=>RUN(2.5));await shot('6command');
// F key in, then he goes down
await page.keyboard.press('KeyF');await log('F in',()=>dd.fp?dd.fp.u.name:'NO');
await log('downed',()=>{const u=dd.fp.u;u.hp=1;damage(u,50,null);RUN(.2);return `downed ${u.downed} dead ${u.dead} fp ${dd.fp} banner ${$('#banner').textContent}`;});
console.log('errors',errors.length,errors.slice(0,6));
await b.close();srv.close();})();

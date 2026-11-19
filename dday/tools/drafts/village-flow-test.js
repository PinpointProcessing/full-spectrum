const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const W=+process.argv[2]||390,H=+process.argv[3]||760,PO=+process.argv[4]||0,SEED=+process.argv[5]||4;
(async()=>{const port=9860+PO,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=2`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);const log=async(l,f,a)=>console.log(l+':',await ev(f,a));
await ev(([SEED])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(SEED*7919+13);ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));for(const r of['rifle','gunner','medic','demo'])R.reserve.push(ddmNewMan(r,3,false));ddmSave();window.requestAnimationFrame=()=>0;},[SEED]);
const shot=async n=>{await ev(()=>{if(state==='ddmeta'){ddMetaFrame(.03,simT);}else{if(dd&&dd.seq)ddCam(.05);render(.03,simT);drawOverlay(.03,simT);hud();}});await page.waitForTimeout(700);await ev(()=>{if(state==='ddmeta')ddMetaFrame(.001,simT);else{render(.001,simT);drawOverlay(.001,simT);}});await page.screenshot({path:`vg3_${n}_${W}.png`});};
await ev(()=>{ddCtrBtnShow();});await page.click('#ddVilBtn');await page.waitForTimeout(300);
await ev(()=>{for(let i=0;i<20;i++){update(1/30);ddFrame(1/30,simT);}});await shot('0wide');
await ev(()=>{for(let i=0;i<40;i++){update(1/30);ddFrame(1/30,simT);}});await ev(()=>{for(let i=0;i<60;i++)ddFrame(1/30,simT);talkNext();});await shot('1talk');
// skip with the button
await page.click('#vgSkip');await page.waitForTimeout(1400);
await log('after skip',()=>`vil ${!!(dd&&dd.vil)} talk ${talk.on} skip ${$('#vgSkip')?$('#vgSkip').hidden:'none'} ddseq ${document.body.classList.contains('ddseq')}`);
await ev(()=>{window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};RUN(3);});
await log('start: visible enemies',()=>enemies.filter(e=>e.vis).length+' contact shots '+tracers.length+' nearest enemy '+Math.round(Math.min(...enemies.map(e=>Math.min(...players.map(p=>hyp(p.x-e.x,p.y-e.y)))))));
await shot('2start');
// the bot from vg2 (inline), to the village
await ev(()=>{const W=[[690,780],[655,690],[650,600],[690,520],[726,450],[722,380],[700,330],[600,270],[470,230],[360,170],[330,60],[323,-20],[360,-130],[460,-220],[600,-300],[700,-330],[700,-430],[700,-520],[560,-620],[860,-640],[700,-520]];
  window.BOT={W,i:0,nadeT:0,rpgT:0};window.BOTSTEP=()=>{const B=BOT,m=players.filter(p=>p.team===dd.active&&alive(p)&&!p.joining);if(!m.length)return;const cx=m.reduce((a,u)=>a+u.x,0)/m.length,cy=m.reduce((a,u)=>a+u.y,0)/m.length;
    const vis=enemies.filter(e=>!beaten(e)&&e.vis&&hyp(e.x-cx,e.y-cy)<360);
    if(simT>B.rpgT){const r=m.find(u=>u.spec==='rpg'&&u.specN>0&&!u.throwGo&&!u.rpgAim&&!pinnedNow(u));if(r){const K=ddTanksUp().find(K=>hyp(K.x-r.x,K.y-r.y)<600&&hyp(K.x-r.x,K.y-r.y)>PRPG.min+10)||vis.find(e=>e.gunner&&hyp(e.x-r.x,e.y-r.y)<500&&hyp(e.x-r.x,e.y-r.y)>PRPG.min+10);if(K&&orderThrow(r,K.x,K.y,'rpg'))B.rpgT=simT+8;}}
    if(vis.length||m.some(u=>u.path.length))return;if(dd.vg.ph==='village'){const z=VG.zones.find(z=>!dd.vg.held[z.k]);if(z&&B.i>=B.W.length-5)B.W[B.i]=[z.lx,z.ly+20];}
    const w=B.W[Math.min(B.i,B.W.length-1)];if(hyp(cx-w[0],cy-w[1])<55&&B.i<B.W.length-1){B.i++;return;}const as=makeAssign(m,w[0],w[1]);for(const q of as)Object.assign(q.u,{path:q.path,lastOrder:simT});};
  window.RUNB=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);ddFrame(1/30,simT);if(i%30===0)BOTSTEP();if(endAt)break;}};});
await ev(()=>{let n=0;while(dd.vg.ph==='woods'&&n++<40)RUNB(5);});await log('woods done',()=>`t ${Math.round(dd.vg.t)} ph ${dd.vg.ph}`);await shot('3fieldedge');
await ev(()=>{let n=0;while(dd.vg.ph!=='village'&&n++<60)RUNB(5);RUNB(14);});await log('village',()=>`t ${Math.round(dd.vg.t)} npcs ${dd.npcs.filter(alive).length} stations ${HQ_ZONES.length}`);
await ev(()=>{dd.track=null;camT.x=640;camT.z=-160;zoom=4.2;tilt=ddTilt(4.2);});await shot('4company');
await ev(()=>{let n=0;while(!dd.vg.r1&&n++<40)RUNB(3);RUNB(9);});await ev(()=>{dd.track=null;camT.x=760;camT.z=-470;zoom=4.6;tilt=ddTilt(4.6);});await shot('5trucks');
await ev(()=>{let n=0;while(!dd.vg.r2&&n++<60)RUNB(3);RUNB(8);});await ev(()=>{const K=dd.tanks[0];dd.track=null;camT.x=K?K.x:700;camT.z=(K?K.y:-500)+60;zoom=5;tilt=ddTilt(5);});await shot('6tank');
await ev(()=>{let n=0;while(!endAt&&n++<120)RUNB(5);});await log('end',()=>`won ${dd.won} t ${Math.round(dd.vg.t)} lost ${dd.lost} held ${Object.keys(dd.vg.held).join(',')}`);
await ev(()=>{dd.track=null;camT.x=700;camT.z=-480;zoom=4;tilt=ddTilt(4);});await shot('7won');
await ev(()=>{finish();});await page.waitForTimeout(2600);
await log('report',()=>`state ${state} ph ${ddm&&ddm.ph} chap ${ddm&&ddm.chap} sum ${ddm&&ddm.sum} stage ${ddRoster.stage} minLevel ${ddRoster.minLevel}`);await shot('8report');
await page.evaluate(()=>ddmRollTap(true));await page.waitForTimeout(150);await page.click('#ddm [data-a="base"]');await page.waitForTimeout(300);await shot('9base');
await log('base bar',()=>$('#ddm .ddm-bar.bot').textContent.replace(/\s+/g,' ').trim());
await page.click('#ddm [data-a="barracks"]');await page.waitForTimeout(400);await log('barracks out',()=>$('#ddm [data-a="out"]').textContent);
await page.click('#ddm [data-a="out"]');await page.waitForTimeout(200);await page.click('#ddm [data-a="go"]');await page.waitForTimeout(150);await page.click('#ddm [data-a="start"]');await page.waitForTimeout(300);await log('after out',()=>`ph ${ddm&&ddm.ph} state ${state}`);
await page.click('#ddm [data-a="menu"]');await page.waitForTimeout(300);await log('menu',()=>`intro ${!$('#intro').hidden} vilBtn ${!$('#ddVilBtn').hidden}`);
console.log('errors',errors.length,errors.slice(0,8));
await b.close();srv.close();})();

const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
(async()=>{const port=9841,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=0`);await page.setViewportSize({width:844,height:390});
const ev=(f,a)=>page.evaluate(f,a);const log=async(l,f,a)=>console.log(l+':',await ev(f,a));
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');window.requestAnimationFrame=()=>0;window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};});
// 1 the beach
await page.click('#ddBtn');await page.waitForTimeout(500);await ev(()=>{let n=0;while(!dd.land.done&&n++<100)RUN(.5);RUN(5);});
await log('beach',()=>`MAPID ${MAPID} mode ${DD_MODE} landed ${dd.land.done} players ${players.length} enemies ${enemies.length} vil ${!!dd.vil}`);
// 2 the counterattack: won by hand -> report -> base -> barracks -> leave: the sequence
await ev(()=>{ddRoster=ddmRead();const R=ddRoster;R.stage=1;R.battles=1;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=R.squads[t][i]||ddmNewMan(r,2,false)));ddmSave();startCounter();});
await page.waitForTimeout(400);await ev(()=>RUN(8));
await log('counter',()=>`mode ${DD_MODE} counter ${!!dd.counter} ph ${dd.dc.ph} players ${players.length}`);
await ev(()=>{dd.won=true;ddFinish();});await page.waitForTimeout(300);
await log('counter won',()=>`state ${state} chap ${ddm.chap} stage ${ddRoster.stage}`);
await page.evaluate(()=>ddmRollTap(true));await page.waitForTimeout(150);   // (Version 226: no base or barracks screens; the report goes straight on)
await page.click('#ddm .ddm-fbot [data-a="go"]');await page.waitForTimeout(150);await page.click('#ddm [data-a="start"]');await page.waitForTimeout(500);
await log('after leaving',()=>`state ${state} seq ${!!(dd&&dd.seq)} mode ${DD_MODE} talk ${talk.on} ddm ${!!ddm}`);
await ev(()=>{for(let i=0;i<60;i++){update(1/30);ddFrame(1/30,simT);}});
await log('talk',()=>`talk ${talk.on} line ${talk.i} ${talk.q[talk.i]&&talk.q[talk.i].who.name}`);
await ev(()=>{render(.03,simT);});await page.waitForTimeout(500);await ev(()=>render(.001,simT));await page.screenshot({path:'vg4_talk_844.png'});
// the talk panel's own Skip: straight to the march
await page.click('#talk .tk-skip');await page.waitForTimeout(200);
await log('talk skipped',()=>`talk ${talk.on} ph ${dd.seq&&dd.seq.ph}`);
await ev(()=>{for(let i=0;i<90;i++){update(1/30);ddFrame(1/30,simT);}render(.03,simT);});await page.waitForTimeout(500);await ev(()=>render(.001,simT));await page.screenshot({path:'vg4_march_844.png'});
await ev(()=>{for(let i=0;i<330;i++){update(1/30);ddFrame(1/30,simT);}});await page.waitForTimeout(1400);
await log('battle',()=>`vil ${!!(dd&&dd.vil)} players ${players.length} ph ${dd.vg&&dd.vg.ph}`);
await ev(()=>{RUN(2);render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(500);await ev(()=>{render(.001,simT);drawOverlay(.001,simT);});await page.screenshot({path:'vg4_start_844.png'});
// 3 lost: the reserve gone, everyone killed -> the end screen -> Try the village again: the roster as it was
await log('before loss',()=>`squads ${ddmAll().length} reserve ${ddRoster.reserve.length}`);
await ev(()=>{ddRoster.reserve=[];for(const p of players.slice())ddKill(p,'test',false);let n=0;while(!endAt&&n++<60)RUN(.5);});
await log('lost',()=>`over ${dd.over} endAt ${!!endAt}`);
await ev(()=>{finish();});await page.waitForTimeout(400);
await log('end screen',()=>`end ${!$('#end').hidden} title ${$('#endTitle').textContent} again ${$('#againBtn').textContent}`);
await page.click('#againBtn');await page.waitForTimeout(800);
await log('retry',()=>`vil ${!!(dd&&dd.vil)} seq ${!!(dd&&dd.seq)} players ${players.length} reserve ${ddRoster.reserve.length} state ${state}`);
console.log('errors',errors.length,errors.slice(0,8));
await b.close();srv.close();})();

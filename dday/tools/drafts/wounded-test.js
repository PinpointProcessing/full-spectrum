const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const W=+process.argv[2]||390,H=+process.argv[3]||760,PO=+process.argv[4]||0;
(async()=>{const port=9811+PO,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=2`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);const log=async(l,f,a)=>console.log(l+':',await ev(f,a));
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=1;R.battles=1;R.medals=1;R.minLevel=2;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,2,false)));for(const r of['rifle','gunner'])R.reserve.push(ddmNewMan(r,2,false));ddmSave();window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};});
const shot=async n=>{await ev(()=>{if(state==='ddmeta')ddMetaFrame(.03,simT);else{render(.03,simT);drawOverlay(.03,simT);}});await page.waitForTimeout(700);await ev(()=>{if(state==='ddmeta')ddMetaFrame(.001,simT);else render(.001,simT);});await page.screenshot({path:`wd_${n}_${W}.png`});};
// the counterattack, won with two men still down
await ev(()=>startCounter());await page.waitForTimeout(400);await ev(()=>RUN(3));
const names=await ev(()=>{const a=players.find(p=>p.id==='A2'),b=players.find(p=>p.id==='B4');for(const u of[a,b]){u.downed=true;u.hp=0;u.bleed=20;}dd.won=true;ddFinish();return[a.name,b.name,a.rm.uid,b.rm.uid];});
await page.waitForTimeout(2400);
await log('report',()=>`stage ${ddRoster.stage} hurt ${ddmHurt().map(h=>h.m.name+'@'+h.where).join(', ')} treat ${ddRoster.treat} rows hurt ${ddm.rows.filter(r=>r.hurt).length}`);
await shot('1report');
await page.evaluate(()=>ddmRollTap(true));await page.waitForTimeout(150);await page.click('#ddm .ddm-bar [data-a="base"]');await page.waitForTimeout(400);await shot('2base');
await log('hospital tag',()=>{const t=$('#ddm [data-a="hospital"]');return t?t.textContent+' flag '+!!ddm.flag:'none';});
await page.click('#ddm [data-a="hospital"]');await page.waitForTimeout(300);await shot('3hospital');
await log('sheet',()=>$('#ddm .ddm-sheet').textContent.replace(/\s+/g,' ').trim().slice(0,300));
await page.click(`#ddm [data-a="treat"][data-u="${names[2]}"]`);await page.waitForTimeout(300);
await log('treated first',()=>`hurt ${ddmHurt().map(h=>h.m.name).join(',')} treat ${ddRoster.treat} medals ${ddRoster.medals} button ${$('#ddm [data-a="treat"]')&&$('#ddm [data-a="treat"]').textContent}`);
await page.click('#ddm [data-a="hospx"]');await page.waitForTimeout(200);
// the barracks: his square, his bunk
await page.click('#ddm .ddm-bar [data-a="barracks"]');await page.waitForTimeout(500);
await log('barracks squares',()=>[...document.querySelectorAll('#ddm .ddm-sq')].map(b=>(b.classList.contains('hurt')?'+':'')+b.dataset.t+b.dataset.i).join(' '));
await ev(()=>{for(let i=0;i<40;i++)ddMetaFrame(1/30,simT);});await shot('4barracks');
await page.click('#ddm .ddm-sq[data-t="B"][data-i="3"]');await page.waitForTimeout(400);await ev(()=>{for(let i=0;i<40;i++)ddMetaFrame(1/30,simT);});await shot('5wounded');
await log('panel',()=>{const p=$('#ddm .ddm-perk.hurt');return p?p.textContent.replace(/\s+/g,' '):'none';});
await page.click('#ddm [data-a="wide"]');await page.waitForTimeout(300);
// leaving with him still in Bravo: a warning first, then a second tap goes
await page.click('#ddm [data-a="out"]');await page.waitForTimeout(300);
await log('first tap',()=>`state ${state} banner ${$('#banner').textContent}`);
await page.click('#ddm [data-a="go"]');await page.waitForTimeout(150);await page.click('#ddm [data-a="start"]');await page.waitForTimeout(600);
await log('second tap',()=>`state ${state} seq ${!!(dd&&dd.seq)} players ${players.length} ids ${players.map(p=>p.id).join(',')}`);
await ev(()=>{if(dd.seq){dd.seq.out=true;if(talk.on)talkStop();}vgFade(vgBattle);});await page.waitForTimeout(1400);
await log('village',()=>`vil ${!!(dd&&dd.vil)} players ${players.length} ids ${players.map(p=>p.id).join(',')} pool ${dd.pool}`);
// a death: the replacement is a fit reserve man, not a wounded one
await ev(()=>{ddRoster.reserve[0].hurt=1;});
await log('replacement',()=>{const u=players.find(p=>p.id==='A1');ddKill(u,'test',false);RUN(9);const n=players.find(p=>p.id==='A1'&&!p.dead);return `new A1 ${n?n.name+' hurt '+!!n.rm.hurt:'none'} reserve ${ddRoster.reserve.map(m=>m.name+(m.hurt?'+':'')).join(',')}`;});
// the village won with someone down: the one who sat out is fit again and back in his slot, the new one wounded
await ev(()=>{const u=players.find(p=>p.id==='A3');u.downed=true;dd.won=true;ddFinish();});await page.waitForTimeout(2400);
await log('after village',()=>`stage ${ddRoster.stage} hurt ${ddmHurt().map(h=>h.m.name+'@'+h.where).join(', ')} B ${ddRoster.squads.B.map(m=>m?m.name+(m.hurt?'+':''):'-').join(',')} treat ${ddRoster.treat}`);
console.log('names',names.slice(0,2).join(','));
console.log('errors',errors.length,errors.slice(0,6));
await b.close();srv.close();})();

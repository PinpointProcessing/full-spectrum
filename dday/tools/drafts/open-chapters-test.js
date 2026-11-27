// Version 178 (Bryan: "let's make all levels accessible like we did for the horror game version"): every chapter's button on the start card from
// the start; a chapter not reached yet gets squads made for it (ddmeta.js's ddmReady), a roster that's further on is left as it is, the retry
// after a loss is the same squads. Real clicks on the start card. node open-chapters-test.js [w h port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const W=+process.argv[2]||390,H=+process.argv[3]||760,PO=+process.argv[4]||0;
(async()=>{const port=9930+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=0`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);let fails=0;
const ok=async(l,f,a)=>{let r;try{r=await ev(f,a);}catch(e){r={ok:false,err:String(e).slice(0,300)};}if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));return r;};
await ev(()=>{Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4242);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};
  window.FRESH=()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');ddRoster=ddmRead();};
  window.MENU=()=>{reset();document.body.classList.remove('ddm','ddseq');$('#end').hidden=true;$('#intro').hidden=false;state='intro';ddCtrBtnShow();};
  window.MEN=()=>players.filter(p=>!p.npc).map(u=>({id:u.id,lv:u.level,uid:u.rm&&u.rm.uid}));
  window.STORED=()=>{const R=JSON.parse(localStorage.getItem('warehouseYard.ddmeta.v1')||'null');return R&&{stage:R.stage||0,battles:R.battles,medals:R.medals,minLevel:R.minLevel,squad:['A','B'].flatMap(t=>R.squads[t].map(m=>m?m.level:null)),rec:(R.recruits||[]).map(m=>m.level)};};
  FRESH();MENU();});
const vis=id=>ev(id=>{const e=document.querySelector(id);if(!e)return null;const r=e.getBoundingClientRect();return!e.hidden&&r.width>0&&r.height>0;},id);
{const r={ch1:await vis('#ddBtn'),ch2:await vis('#ddCtrBtn'),ch3:await vis('#ddVilBtn')};const t=await ev(()=>['#ddBtn','#ddCtrBtn','#ddVilBtn'].map(id=>$(id).textContent));
  if(!(r.ch1&&r.ch2&&r.ch3)){fails++;console.log('FAIL buttons',JSON.stringify(r));}else console.log('ok buttons shown',JSON.stringify(t));}
// Chapter 2 with nothing played
await page.click('#ddCtrBtn');await page.waitForTimeout(500);
await ok('Chapter 2 from a fresh roster: the counterattack with eight men at level 2',()=>{RUN(6);const m=MEN();return{ok:DD_MODE==='counter'&&!!dd.counter&&m.length===8&&m.every(u=>u.lv===2),mode:DD_MODE,men:m.length,lv:[...new Set(m.map(u=>u.lv))],stored:STORED()};});
await ok('the roster moved on to it: stage 1, battles 1, a medal, recruits at level 2',()=>{const s=STORED();return{ok:s.stage===1&&s.battles===1&&s.medals>=1&&s.minLevel===2&&s.rec.length===8&&s.rec.every(l=>l===2)&&s.squad.every(l=>l===2),s};});
await ok('a retry after a loss is the same squads',()=>{const u0=MEN().map(u=>u.uid).sort().join();startCounter(true);RUN(2);const u1=MEN().map(u=>u.uid).sort().join();return{ok:u0===u1&&MEN().length===8,same:u0===u1};});
await ok('the counterattack plays on (20 s, no errors)',()=>{RUN(20);return{ok:state==='play'&&!!dd.counter,phase:dd.dc&&dd.dc.ph};});
// Chapter 3 with nothing played: the setting-out sequence first, then the village
await ev(()=>{FRESH();MENU();});
await page.click('#ddVilBtn');await page.waitForTimeout(500);
await ok('Chapter 3 from a fresh roster: the setting-out sequence first',()=>({ok:!!(dd&&dd.seq)&&MEN().length===8,seq:!!(dd&&dd.seq),men:MEN().length}));
await ok('skipped: the village, eight men at level 3, the roster at stage 2',()=>{vgBattle();RUN(6);const m=MEN(),s=STORED();return{ok:!!dd.vil&&m.length===8&&m.every(u=>u.lv===3)&&s.stage===2&&s.minLevel===3,vil:!!dd.vil,lv:[...new Set(m.map(u=>u.lv))],s};});
await ok('the village plays on (20 s, no errors)',()=>{RUN(20);return{ok:state==='play'&&!!dd.vil,ph:dd.vg&&dd.vg.ph};});
// a roster that's further on is left as it is
await ev(()=>{FRESH();const R=ddRoster;R.stage=3;R.battles=3;R.minLevel=4;R.medals=5;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,6,false)));ddmSave();window.UIDS=['A','B'].flatMap(t=>R.squads[t].map(m=>m.uid)).sort().join();MENU();});
await page.click('#ddCtrBtn');await page.waitForTimeout(500);
await ok('a roster at stage 3: Chapter 2 with its own men (level 6), nothing changed',()=>{RUN(2);const m=MEN(),s=STORED();return{ok:m.length===8&&m.every(u=>u.lv===6)&&m.map(u=>u.uid).sort().join()===UIDS&&s.stage===3&&s.medals===5&&s.minLevel===4,lv:[...new Set(m.map(u=>u.lv))],s};});
// a roster at stage 1 with two men lost: Chapter 3 keeps them and fills the two slots
await ev(()=>{FRESH();const R=ddRoster;R.stage=1;R.battles=1;R.minLevel=2;R.medals=1;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,2,false)));R.squads.A[3]=null;R.squads.B[1]=null;ddmSave();
  window.KEPT=['A','B'].flatMap(t=>R.squads[t].filter(Boolean).map(m=>m.uid)).sort().join();MENU();});
await page.click('#ddVilBtn');await page.waitForTimeout(500);
await ok('a roster at stage 1 with two slots empty: Chapter 3 keeps its six and adds two at level 3',()=>{vgBattle();RUN(2);const m=MEN(),s=STORED(),uids=m.map(u=>u.uid);const kept=KEPT.split(',').map(Number);
  return{ok:m.length===8&&kept.every(u=>uids.includes(u))&&m.filter(u=>!kept.includes(u.uid)).every(u=>u.lv===3)&&s.stage===2,lv:m.map(u=>u.lv),s};});
// Chapter 1 still starts the same from a fresh roster, and leaves the stage alone
await ev(()=>{FRESH();MENU();});
await page.click('#ddBtn');await page.waitForTimeout(500);
await ok('Chapter 1 from a fresh roster: the ride in, eight men, the roster still at stage 0',()=>{RUN(4);const s=STORED();return{ok:DD_MODE==='beach'&&MEN().length===8&&(!s||!s.stage),mode:DD_MODE,s};});
// the menu after a chapter: the buttons are still all there
await ev(()=>{MENU();});
{const r={ch1:await vis('#ddBtn'),ch2:await vis('#ddCtrBtn'),ch3:await vis('#ddVilBtn')};if(!(r.ch1&&r.ch2&&r.ch3)){fails++;console.log('FAIL buttons after',JSON.stringify(r));}else console.log('ok buttons still shown after a chapter');}
await page.screenshot({path:(process.env.OUT||'.')+`/open-chapters-${W}x${H}.png`});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

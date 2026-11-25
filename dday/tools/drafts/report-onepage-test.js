// Version 240's draft: the report on one page (the start card's "new one-page report" shortcut), step by step with pictures: straight to the page, the bars, one man's perks open at a time, the man who climbs two levels, CONTINUE only once it's all in, BRING BACK, a man's page, the briefing. node report-onepage-test.js OUT [port W H]   (DDROOT=<dday folder>; harness.js beside it)
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'rep3',PORT=+process.argv[3]||9872,W=+process.argv[4]||390,H=+process.argv[5]||760;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=0`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);let fails=0;const ok=(c,m,x)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m+(x!==undefined?'  '+JSON.stringify(x):''));};
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);});
await page.screenshot({path:`${OUT}/0-start-card.png`});
await page.click('#ddAfter2Btn');await page.waitForFunction(()=>typeof state!=='undefined'&&state==='ddmeta',null,{timeout:60000});
const st=()=>ev(()=>({v2:!!ddm.v2,step:ddm.step,n:ddm.rows.length,done:ddm.v2Done,scr:ddm.scr,wait:ddm.rows.filter(r=>r.v&&r.v.wait).length,left:ddm.rows.filter(r=>r.v&&r.v.left>0).length,dead:ddm.dead.length,medals:ddRoster.medals,mvp:ddm.rows.filter(r=>r.mvp).map(r=>r.rm.name),btn:(document.querySelector('#ddm .ddm-fbot .ddm-btn')||{}).textContent,dis:(document.querySelector('#ddm .ddm-fbot .ddm-btn')||{}).disabled,vic:!!document.querySelector('#ddm .ddm-vic'),medalScr:!!document.querySelector('#ddm .ddm-aw'),cards:!!document.querySelector('#ddm .ddm-roll')}));
await page.waitForTimeout(500);let s=await st();await page.screenshot({path:`${OUT}/1-open.png`});
ok(s.v2&&!s.vic&&!s.medalScr&&!s.cards&&s.n===7&&s.dead===1&&s.mvp.length===1,'straight to the one page: no VICTORY card to tap, no medal screen, no card a man; the medal already given',s);
ok(s.dis===true,'CONTINUE is off while the bars fill',{btn:s.btn});
await page.waitForFunction(()=>ddm.rows.every(r=>r.v.wait||r.v.left<=0),null,{timeout:30000});await page.waitForTimeout(400);s=await st();await page.screenshot({path:`${OUT}/2-perks-due.png`});
const rows=await ev(()=>ddm.rows.map(r=>({n:r.rm.name,role:r.rm.role,lv0:r.lv0,lv:r.v.lv,lv1:r.lv1,wait:r.v.wait,left:Math.round(r.v.left),pk:r.rm.pk,shown:+document.getElementById('ddmL'+ddm.rows.indexOf(r)).textContent})));
ok(s.wait>0&&rows.filter(r=>!r.wait).every(r=>r.left===0&&r.lv===r.lv1)&&rows.filter(r=>r.wait).every(r=>r.lv===r.lv0+1&&r.shown===r.lv),'the men with no perk coming are filled to the end; each man with one stopped at his next level with the two perks under his row',{wait:s.wait,btn:s.btn,dis:s.dis});
ok(/PICK/.test(s.btn)&&s.dis===true,'the button says how many perks are still to pick, and stays off',{btn:s.btn});
// a tap on a row does nothing yet
const rg=await ev(()=>{document.querySelector('#ddm .ddm-sr').click();return{man:ddm.man};});ok(rg.man==null,'a row tapped before it is all in does nothing',rg);
// one man's perks open at a time, top to bottom
const open0=await ev(()=>({n:document.querySelectorAll('#ddm .ddm-pk2').length,btns:document.querySelectorAll('#ddm [data-a="perk2"]').length,next:document.querySelectorAll('#ddm .ddm-tg span.w').length}));
ok(open0.n===1&&open0.btns===2&&open0.next===s.wait-1,'only one man\'s two perks are open; the others owed one are marked and wait their turn',open0);
const two=rows.findIndex(r=>r.lv1-r.lv0>=2);ok(two>=0,'one man climbs two levels',rows[two]);
let picks=0,shot3=false;const seen=[];for(let g=0;g<12;g++){const o=await ev(()=>{const b=document.querySelector('#ddm [data-a="perk2"]');if(!b)return null;const k=+b.dataset.i;window.__pt=(window.__pt||[]).concat([...document.querySelectorAll('#ddm [data-a="perk2"]')].map(e=>ddm.rows[k].rm.role+': '+e.textContent));b.click();return k;});if(o==null){if(await ev(()=>ddm.v2Done))break;await page.waitForTimeout(500);continue;}picks++;
  await page.waitForFunction(k=>ddm.rows[k].v.wait||ddm.rows[k].v.left<=0,o,{timeout:20000});await page.waitForTimeout(350);
  if(picks===1){await page.screenshot({path:`${OUT}/3-one-picked.png`});const q=await st();ok(q.dis===true&&/PICK/.test(q.btn),'after one pick the next man\'s perks open; the button still off',{btn:q.btn,wait:q.wait});}
  if(o===two&&!shot3){shot3=true;const r2=await ev(k=>({lv:ddm.rows[k].v.lv,wait:ddm.rows[k].v.wait,pkd:ddm.rows[k].pkd.length}),two);await page.screenshot({path:`${OUT}/4-second-level.png`});ok(r2.wait&&r2.lv===rows[two].lv0+2&&r2.pkd===1,'the man who climbs two: his bar went on to the next level and stopped again for the second perk',r2);}}
await page.waitForFunction(()=>ddm.v2Done,null,{timeout:20000});await page.waitForTimeout(300);s=await st();await page.screenshot({path:`${OUT}/5-done.png`});
ok(picks===6,'six perks picked in all, one at a time',{picks});
const pt=await ev(()=>window.__pt||[]);ok(pt.some(t=>/^rifle: GRENADIER\+1 rifle grenade/.test(t)),'the Rifleman\'s GRENADIER reads +1 rifle grenade',pt.filter(t=>/^rifle/.test(t)).slice(0,2));
ok(s.done&&s.dis===false&&/CONTINUE/.test(s.btn)&&s.wait===0,'every bar in and every perk picked: CONTINUE comes on',{btn:s.btn});
ok(await ev(()=>ddmPerksDue()===0&&ddm.rows.every(r=>Math.abs(r.gain-(+document.getElementById('ddmN'+ddm.rows.indexOf(r)).textContent.slice(1)))<1)),'nothing owed, and each row shows all its XP');
const un=await ev(()=>[...document.querySelectorAll('#ddm .ddm-tg span.u')].map(e=>e.textContent));ok(un.length>=1,'the man who reached level 3 shows what it unlocked',un);
// the fallen man brought back with a medal
const m0=s.medals;await ev(()=>{const b=document.querySelector('#ddm [data-a="revive"]');b.scrollIntoView();b.click();});await page.waitForTimeout(400);s=await st();await page.screenshot({path:`${OUT}/6-brought-back.png`});
ok(s.medals===m0-1&&await ev(()=>ddm.dead[0].back===true),'BRING BACK spends a medal and he is back with the squad',{medals:[m0,s.medals]});
// a man's page from a row, and back
await ev(()=>{document.querySelector('#ddm .ddm-sum').scrollIntoView();document.querySelector('#ddm .ddm-sr').click();});await page.waitForTimeout(1500);const mp=await ev(()=>({man:ddm.man,mv:!!document.querySelector('#ddm .ddm-mv')}));await page.screenshot({path:`${OUT}/7-man-page.png`});
ok(mp.man===0&&mp.mv,'a row tapped now is that man\'s page',mp);await ev(()=>document.querySelector('#ddm [data-a="manx"]').click());await page.waitForTimeout(600);ok(await ev(()=>ddm.man==null&&!!document.querySelector('#ddm .ddm-full.v2')),'and back to the page');
await ev(()=>document.querySelector('#ddm .ddm-fbot .ddm-btn').click());await page.waitForTimeout(500);await page.screenshot({path:`${OUT}/8-briefing.png`});
ok(await ev(()=>!!ddm.brief&&!!document.querySelector('#ddm .ddm-brief [data-a="start"]')),'CONTINUE opens the next mission\'s briefing');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();

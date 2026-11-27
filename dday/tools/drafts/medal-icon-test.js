// the drawn medal wherever medals show: pictures of the stats page, a man's page, the base, the hospital, the barracks and its recruits. node med1.js OUT [port W H]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'med1',PORT=+process.argv[3]||9890,W=+process.argv[4]||390,H=+process.argv[5]||760;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=0`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);let fails=0;const ok=(c,m,x)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m+(x!==undefined?'  '+JSON.stringify(x):''));};
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);});
await page.click('#ddAfter2Btn');await page.waitForFunction(()=>typeof state!=='undefined'&&state==='ddmeta'&&ddm&&ddm.v2,null,{timeout:60000});await page.waitForTimeout(1200);
const med=sel=>ev(sel=>{const e=document.querySelector(sel);if(!e)return null;const s=e.querySelector('svg.ddm-mi');if(!s)return{t:e.textContent.trim().slice(0,60),svg:false};const r=s.getBoundingClientRect(),f=parseFloat(getComputedStyle(e).fontSize);return{t:e.textContent.trim().slice(0,60),svg:true,w:Math.round(r.width*10)/10,h:Math.round(r.height*10)/10,font:f,star:/★|\u{1F3C5}/u.test(e.textContent)};},sel);
const good=m=>m&&m.svg&&!m.star&&m.w>8&&m.w<30&&Math.abs(m.w-m.h)<1;
// the man's page of the draft (the medal's man is first)
let m=await med('#ddm .ddm-medal');ok(good(m),'the level-up page: the company\'s medal line has the drawn medal',m);m=await med('#ddm .ddm-cite b');ok(good(m),'and his citation',m);await page.screenshot({path:`${OUT}/1-man.png`});
// the stats page
await ev(()=>{for(const k of ddm.v2Q){const r=ddm.rows[k];while(r.rm.pk>0)ddmPerkPick(r.rm,ddmJob(r.rm)[0][0]);r.v.left=0;r.v.lv=r.lv1;r.v.wait=false;}ddm.v2I=ddm.v2Q.length;ddmV2Go();});await page.waitForFunction(()=>ddm.v2Done,null,{timeout:120000});await page.waitForTimeout(400);
m=await med('#ddm .ddm-mvl');ok(good(m),'the stats page: COMPANY\'S MEDAL',m);m=await med('#ddm [data-a="revive"]');ok(good(m)&&/^REVIVE\s*1\/\d+$/.test(m.t),'REVIVE: the drawn medal, cost / owned',m);await page.screenshot({path:`${OUT}/2-stats.png`});
await ev(()=>document.querySelector('#ddm .ddm-sr').click());await page.waitForTimeout(1500);m=await med('#ddm .ddm-mvn q.g');ok(good(m)&&/MVP/.test(m.t),'a man\'s page: MVP',m);await page.screenshot({path:`${OUT}/3-manpage.png`});
await ev(()=>document.querySelector('#ddm [data-a="manx"]').click());await page.waitForTimeout(500);
// the base
await ev(()=>{ddRoster.medals=3;ddRoster.squads.A[1].hurt=1;ddRoster.treat=0;ddmClick({target:{closest:()=>({dataset:{a:'base'}})}});});await page.waitForTimeout(1500);
m=await med('#ddm .ddm-bar.top .ddm-t.gold');ok(good(m)&&/3 MEDALS/.test(m.t),'the base: the medals owned',m);m=await med('#ddm [data-a="hospital"] small');ok(good(m),'the field hospital\'s tag: what a treatment costs',m);await page.screenshot({path:`${OUT}/4-base.png`});
await ev(()=>document.querySelector('#ddm [data-a="hospital"]').click());await page.waitForTimeout(600);m=await med('#ddm .ddm-sheet.mid .ddm-dim');ok(good(m),'the hospital\'s sheet',m);m=await med('#ddm .ddm-sheet.mid [data-a="treat"],#ddm .ddm-sheet.mid button.ddm-btn');ok(good(m),'TREAT and its medal',m);await page.screenshot({path:`${OUT}/5-hospital.png`});
// the barracks, a recruit with a price
await ev(()=>{ddm.hosp=false;ddRoster.recruits.forEach((q,i)=>{if(i===1)q.cost=2;});ddmClick({target:{closest:()=>({dataset:{a:'barracks'}})}});});await page.waitForTimeout(2500);
m=await med('#ddm .ddm-hd .ddm-t.gold');ok(good(m),'the barracks: the medals owned',m);await page.screenshot({path:`${OUT}/6-barracks.png`});
await ev(()=>{const e=document.querySelector('#ddm [data-a="slot"]');if(e)e.click();});await page.waitForTimeout(700);
await ev(()=>{ddm.sub='pick';ddm.tab='rec';ddmUI();});await page.waitForTimeout(700);
const pool=await ev(()=>[...document.querySelectorAll('#ddm .ddm-pool button small')].map(e=>({t:e.textContent,svg:!!e.querySelector('svg.ddm-mi'),w:e.querySelector('svg.ddm-mi')?Math.round(e.querySelector('svg.ddm-mi').getBoundingClientRect().width*10)/10:0})));
ok(pool.some(q=>q.svg&&q.w>6&&q.w<16),'the recruits: a price with the drawn medal, small',pool.filter(q=>q.svg).slice(0,2));await page.screenshot({path:`${OUT}/7-recruits.png`});
ok(await ev(()=>!/\u{1F3C5}/u.test(document.querySelector('#ddm').textContent)),'no emoji medal left');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();

// Version 194: the medal, the cards (swipe, perk), the grid, the base's stops. node rep.js PO OUT W H
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const PO=+process.argv[2]||9,OUT=process.argv[3]||'.',W=+process.argv[4]||390,H=+process.argv[5]||760;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const port=9700+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=1`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
const snap=async n=>{await page.waitForTimeout(700);await page.screenshot({path:`${OUT}/${n}.png`});};
await page.click('#ddAfterBtn');await page.waitForFunction(()=>typeof ddm!=='undefined'&&ddm&&ddm.ph==='report',null,{timeout:60000});
const s0=await ev(()=>({noms:ddm.noms.map(r=>r.rm.name+':'+r.sc),mvp:!!ddm.mvp,stars:ddm.rows.reduce((n,r)=>n+r.rm.stars,0)}));console.log(JSON.stringify(s0));
await snap('1-victory');await page.waitForTimeout(600);await page.click('.ddm-vic');await page.waitForTimeout(300);
ok(await ev(()=>ddm.scr==='medal'&&!ddm.mvp),'the medal screen comes after VICTORY');await snap('2-medal');
await page.click('.ddm-nom[data-i="1"]');await page.waitForTimeout(200);const pick=await ev(()=>({n:ddm.noms[1].rm.name,g:ddm.noms[1].gain,x:ddm.noms[1].rm.xp,l:ddm.noms[1].rm.level}));
await page.click('[data-a=award]');await page.waitForTimeout(300);
const s1=await ev(()=>({mvp:ddm.mvp&&ddm.mvp.name,first:ddm.rows[0].rm.name,stars:ddm.rows[0].rm.stars,gain:ddm.rows[0].gain,step:ddm.step,cite:ddm.rows[0].cite[0]}));console.log(JSON.stringify(s1));
ok(s1.mvp===pick.n&&s1.first===pick.n&&s1.stars===1&&s1.gain===pick.g+100&&s1.step===0&&s1.cite==='MOST VALUABLE','the second nominee picked: star, +100 XP, first card');
await page.waitForFunction(()=>ddm.an&&ddm.an.done,null,{timeout:90000});await snap('3-card-perk');
const p0=await ev(()=>{const m=ddm.rows[0].rm;return{pk:m.pk,o:ddmPerkOpts(m),role:m.role,st:{...m.st}};});console.log(JSON.stringify(p0));
ok(p0.pk>0&&await page.$('.ddm-pkb')!=null,'a level up offers a perk');
// a tap on the finished card stays
await page.click('.ddm-rc .ddm-cite');await page.waitForTimeout(200);ok(await ev(()=>ddm.step)===0,'a tap on a finished card stays on it');
await page.click('.ddm-pkb');await page.waitForTimeout(300);const p1=await ev(()=>{const m=ddm.rows[0].rm;return{pk:m.pk,st:{...m.st},perks:m.perks};});
ok(p1.pk===p0.pk-1&&p1.perks.length===1&&p1.perks[0]===p0.o[0]&&JSON.stringify(p1.st)===JSON.stringify(p0.st),'the perk: one of his job\'s two, kept; one fewer to choose');await snap('4-card-picked');
for(let k=0;k<4&&await page.$('.ddm-pkb');k++){await page.click('.ddm-pkb');await page.waitForTimeout(200);}
// swipe left: next man; swipe right: back, shown finished
const sw=async dx=>{const y=H-200,x=W/2;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx/2,y,{steps:3});await page.mouse.move(x+dx,y,{steps:3});await page.mouse.up();await page.waitForTimeout(450);};
await sw(-140);ok(await ev(()=>ddm.step)===1,'a swipe left: the next man');
await sw(140);ok(await ev(()=>ddm.step===0&&ddm.an.done&&document.getElementById('ddmLv').textContent==ddm.rows[0].lv1),'a swipe right: back, his card as it ended');
await page.click('[data-a=rollnext]');await page.waitForTimeout(200);await page.click('[data-a=rollnext]');await page.waitForTimeout(300);await page.click('[data-a=rollnext]');await page.waitForTimeout(300);
console.log('step',await ev(()=>ddm.step));await snap('5-card-mid');
await page.click('.ddm-skip');await page.waitForTimeout(300);const pd=await ev(()=>ddmPerksDue());ok(await ev(()=>ddm.step===ddm.rows.length),'SEE ALL: the grid');console.log('perks due',pd);await snap('6-grid');
await page.click('[data-a=base]');await page.waitForTimeout(1500);await snap('7-base');
const nx=await ev(()=>({k:ddmTodo().k,tags:[...document.querySelectorAll('.ddm-tag')].map(t=>t.dataset.b+':'+t.className.replace('ddm-tag','').trim()+':'+Math.round(t.getBoundingClientRect().left)+','+Math.round(t.getBoundingClientRect().top)),path:document.querySelector('#ddmPath polyline').getAttribute('points')}));console.log(JSON.stringify(nx));
ok(pd?nx.k==='report':true,'perks left: the base says so first');
if(nx.k==='report'){await page.click('.ddm-next [data-a=report]');await page.waitForTimeout(600);ok(await ev(()=>ddm.ph==='report'&&ddm.step===ddm.rows.length),'GO: back to the grid');
  for(let g=0;g<10&&await ev(()=>ddmPerksDue());g++){const i=await ev(()=>ddm.rows.findIndex(r=>r.rm.pk>0));await page.click(`.ddm-sr[data-i="${i}"]`);await page.waitForTimeout(250);
    if(await ev(()=>!ddm.an||!ddm.an.done))await ev(()=>{ddmRollTick(.6);ddmRollEnd();});for(let k=0;k<4&&await page.$('.ddm-pkb:visible');k++){await page.click('.ddm-pkb');await page.waitForTimeout(200);}await page.click('.ddm-skip');await page.waitForTimeout(250);}
  ok(await ev(()=>ddmPerksDue())===0,'every perk chosen from the grid');await snap('6b-grid-done');await page.click('[data-a=base]');await page.waitForTimeout(1200);}
const n2=await ev(()=>ddmTodo().k);console.log('next',n2);ok(n2==='hospital'||n2==='barracks','then the hospital or the barracks');
if(n2==='hospital'){await page.click('.ddm-next [data-a=hospital]');await page.waitForTimeout(300);await snap('8-hospital');await page.click('[data-a=treat]');await page.waitForTimeout(300);await page.click('[data-a=hospx]');await page.waitForTimeout(300);ok(await ev(()=>ddmTodo().k)==='barracks','treated: the barracks next');}
await snap('9-base-barracks-next');await page.click('.ddm-next [data-a=barracks]');await page.waitForTimeout(1500);await page.click('[data-a=out]');await page.waitForTimeout(600);
ok(await ev(()=>ddmTodo().k)==='go','after the barracks: the briefing next');await snap('10-base-brief-next');
await page.click('.ddm-tag.brief');await page.waitForTimeout(300);ok(await page.$('.ddm-brief')!=null,'the briefing stop opens the briefing');await snap('11-brief');
await page.click('[data-a=start]');await page.waitForTimeout(2500);const en=await ev(()=>({state,counter:!!(dd&&dd.counter),players:players.length}));console.log(JSON.stringify(en));ok(en.counter,'START MISSION: Chapter 2');
console.log('errors',errors.length,errors.slice(0,4));const fx=await ev(()=>{const mk=(role,level,perks)=>{const u={ddRole:role,name:'T',stats:{}};const rm=ddmNewMan(role,level,false,'T');rm.st={hp:50,aim:50,spd:50,brv:50};rm.perks=perks;ddmAttach(u,rm);return{sup:+u.supK.toFixed(3),dmg:+u.dmgIn.toFixed(3),aim:+u.aimK.toFixed(3),gr:u.grenade,sn:u.specN};};
  return{g1:mk('gunner',1,[]),g1p:mk('gunner',1,['sup','sup','armor']),g3:mk('gunner',3,[]),g5:mk('gunner',5,[]),d1:mk('demo',1,[]),d3:mk('demo',3,['kit']),r3:mk('rifle',3,['aim'])};});console.log(JSON.stringify(fx));
ok(Math.abs(fx.g1p.sup-fx.g1.sup*1.15*1.15)<.01&&fx.g1p.dmg<fx.g1.dmg&&Math.abs(fx.g3.sup-fx.g1.sup*1.3)<.01&&fx.g5.dmg<fx.g3.dmg*.85&&fx.d3.sn===fx.d1.sn+3&&fx.r3.gr>=5,'perks and unlocks reach the man in battle');
console.log(fails?'FAILS '+fails:'ALL OK');await b.close();srv.close();process.exit(0);})();

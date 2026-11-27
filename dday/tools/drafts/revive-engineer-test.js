// After Version 224: a medal brings a fallen man back on the report; the bazooka man is the Engineer. node rev225.js [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const PORT=+process.argv[2]||9815;
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
const act=async(sel,w)=>{const r=await ev(s=>{const e=document.querySelector(s);if(!e)return 'none';ddmClick({target:e,clientX:0,clientY:0});return 'ok';},sel);await page.waitForTimeout(w||1200);return r;};
ok(await ev(()=>DDM_ROLE.demo==='Engineer'&&DD_ROLES.demo.n==='Engineer'&&DDM_ICON.demo===DDM_ICON.eng&&DD_ROLES.demo.spec==='rpg'),'the bazooka man is the Engineer, with the wrench');
// make one man of Alpha die at the end: wrap ddmStart
await ev(()=>{const f=ddmStart;window.ddmStart=function(){const u=players.find(p=>p.team==='A'&&p.ddRole==='demo'&&p.rm);if(u){u.dead=true;u.downed=false;window.DEADN=u.name;}return f.apply(this,arguments);};});
await page.click('#ddAfterBtn');await page.waitForFunction(()=>typeof ddm!=='undefined'&&ddm&&ddm.ph==='report',null,{timeout:60000});await page.waitForTimeout(1500);
await ev(()=>{ddm.stepT=2;ddm.swT=0;});await act('.ddm-vic');await act('[data-a=award]',2500);await act('.ddm-skip');
const s0=await ev(()=>({dead:ddm.dead.map(d=>d.name),want:window.DEADN,med:ddRoster.medals,inA:ddRoster.squads.A.filter(Boolean).length,btn:!!document.querySelector('[data-a=revive]'),txt:document.querySelector('.ddm-dead')?.textContent}));console.log(JSON.stringify(s0));
ok(s0.dead.includes(s0.want)&&s0.btn&&s0.inA===3,'the fallen man is listed with BRING BACK, his squad one short');
await page.screenshot({path:'v225out/fallen.png'});
const box=await page.locator('[data-a=revive]').first().boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(800);
const s1=await ev(()=>({med:ddRoster.medals,inA:ddRoster.squads.A.filter(Boolean).length,back:ddm.dead[0].back,btn:!!document.querySelector('[data-a=revive]'),names:ddRoster.squads.A.filter(Boolean).map(m=>m.name),saved:JSON.parse(localStorage.getItem('warehouseYard.ddmeta.v1')).squads.A.filter(Boolean).length}));console.log(JSON.stringify(s1));
ok(s1.med===s0.med-1&&s1.inA===4&&s1.back&&!s1.btn&&s1.names.includes(s0.want)&&s1.saved===4,'a tap: a medal spent, he is back in his squad, saved');
await page.screenshot({path:'v225out/back.png'});
const m0=await ev(()=>{ddRoster.medals=0;ddm.dead.push({name:'Test',role:'rifle',rm:ddmNewMan('rifle',1,false),team:'B',slot:0});ddmUI();return ddmRevive(1);});ok(m0===false&&await ev(()=>document.querySelector('[data-a=revive]').disabled),'no medals: the button is off and nothing happens');
// the man page: his feet and head on screen
await act('.ddm-sr',2500);await ev(()=>{for(let i=0;i<5;i++)ddMetaFrame(.3,performance.now());});await page.waitForTimeout(900);await page.screenshot({path:'v225out/man.png'});
ok(await ev(()=>!!document.querySelector('.ddm-mv')&&!!ddm.por&&ddm.por.u),'the man page is up on its own backdrop');
await act('[data-a=manx]',1500);ok(await ev(()=>!document.querySelector('.ddm-mv')&&!ddm.por.u&&!!document.querySelector('.ddm-full')),'back to the report');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();

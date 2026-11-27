// the report's man page: pictures and checks. node rep223.js W H TAG [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const W=+process.argv[2]||390,Hh=+process.argv[3]||760,T=process.argv[4]||'p',PORT=+process.argv[5]||9793;
(async()=>{const srv=await serve(process.env.DDROOT,PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:W,height:Hh});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
const ev=(f,a)=>page.evaluate(f,a);
const act=async(sel,w)=>{const r=await page.evaluate(s=>{const e=document.querySelector(s);if(!e)return 'none';try{ddmClick({target:e,clientX:0,clientY:0});return 'ok';}catch(x){return 'ERR '+x.message;}},sel);if(r!=='ok')console.log(sel,r);await page.waitForTimeout(w||1500);return r;};
const shot=async n=>{await page.evaluate(()=>{for(let i=0;i<5;i++)ddMetaFrame(.3,performance.now());});await page.waitForTimeout(900);await page.screenshot({path:`${process.env.OUT||'.'}/r-${T}-${n}.png`});};
await page.click('#ddAfterBtn');await page.waitForFunction(()=>typeof ddm!=='undefined'&&ddm&&ddm.ph==='report',null,{timeout:60000});await page.waitForTimeout(1500);
await ev(()=>{ddm.stepT=2;ddm.swT=0;});await act('.ddm-vic');await act('[data-a=award]',2500);await act('.ddm-skip');await shot('1-report');
const n=await ev(()=>ddm.rows.length);
ok(await ev(()=>!!document.querySelector('.ddm-full')&&document.querySelectorAll('.ddm-sr[data-a=manv]').length===ddm.rows.length),'the full report, a row a man');
// a real tap on the third row
const box=await page.locator('.ddm-sr').nth(2).boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(2500);
await ev(()=>{for(let i=0;i<5;i++)ddMetaFrame(.3,performance.now());});const m1=await ev(()=>({man:ddm.man,step:ddm.step,n:ddm.rows.length,page:!!document.querySelector('.ddm-mv'),name:document.querySelector('.ddm-mvn b')?.textContent,row:ddm.rows[2].rm.name,
  out:ddm.rows[2].u.y-ddm.rows[2].y0,scr:(()=>{const u=ddm.rows[2].u,v=new THREE.Vector3(u.x,(typeof ddH==='function'?ddH(u.x,u.y):0)+12,u.y).project(camera);return[Math.round((v.x+1)*cw/2),Math.round((1-v.y)*ch/2)];})(),chips:[...document.querySelectorAll('.ddm-mvr .ddm-chips span')].map(s=>s.textContent)}));
console.log(JSON.stringify(m1));ok(m1.man===2&&m1.page&&m1.step===m1.n&&m1.name===m1.row,'a tap on a row opens that man\'s page ('+m1.name+')');ok(m1.out===20,'he steps out of the line');
ok(m1.scr[0]>W*.06&&m1.scr[0]<W*.4,'he stands on the left of the screen (x '+m1.scr[0]+' of '+W+')');ok(m1.chips.length>=9,'this battle and his record on the right ('+m1.chips.length+' numbers)');await shot('2-man');
// the next man, by the arrow and by a swipe
await page.locator('.ddm-mvf [data-d="1"]').click();await page.waitForTimeout(1800);const m2=await ev(()=>ddm.man);ok(m2===3,'the arrow: the next man');
await page.mouse.move(W*.25,Hh*.5);await page.mouse.down();await page.mouse.move(W*.75,Hh*.5,{steps:6});await page.mouse.up();await page.waitForTimeout(1800);const m3=await ev(()=>ddm.man);ok(m3===2,'a swipe right: the man before');
// a man with a perk owed can choose it here
const pk=await ev(()=>{const k=ddm.rows.findIndex(r=>r.rm.pk>0);if(k<0)return null;ddmManGo(k);return{k,btn:document.querySelectorAll('.ddm-mvr [data-a=perk]').length,pk:ddm.rows[k].rm.pk};});
if(pk){await shot('3-perk');await page.locator('.ddm-mvr [data-a=perk]').first().click();await page.waitForTimeout(900);const p2=await ev(k=>({pk:ddm.rows[k].rm.pk,perks:(ddm.rows[k].rm.perks||[]).length,man:ddm.man}),pk.k);ok(pk.btn===2&&p2.pk===pk.pk-1&&p2.perks>=1&&p2.man===pk.k,'a perk owed is chosen on his page');}else console.log('nobody with a perk owed');
// back: straight to the full report, everyone in line again
await page.locator('.ddm-mvt [data-a=manx]').click();await page.waitForTimeout(1800);
const bk=await ev(()=>({man:ddm.man,full:!!document.querySelector('.ddm-full'),mv:!!document.querySelector('.ddm-mv'),inl:ddm.rows.every(r=>r.u.y===r.y0),ph:ddm.ph,step:ddm.step}));
console.log(JSON.stringify(bk));ok(bk.man==null&&bk.full&&!bk.mv&&bk.inl&&bk.step===n,'BACK: the full report again, everyone back in the line');await shot('4-back');
// and on from there as before
await act('[data-a=manv][data-i="0"]',1500);await page.locator('.ddm-mvf [data-a=manx]').click();await page.waitForTimeout(900);await act('[data-a=base]',2500);
const bs=await ev(()=>({ph:ddm.ph,man:ddm.man}));ok(bs.ph==='base'&&bs.man==null,'CONTINUE still goes on to the base');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();

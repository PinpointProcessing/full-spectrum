// the level-up page's backdrops: one picture a backdrop (the same man, the same level). node bg1.js OUT [port W H]  env CH=1|2|3 (the chapter) BGS=auto,stage,base,field (auto: the chapter's own) LV=5 ROW=0 HIDE=1 (no card)
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'bg1',PORT=+process.argv[3]||9887,W=+process.argv[4]||390,H=+process.argv[5]||760;
const BGS=(process.env.BGS||'stage,base,field').split(','),LV=+(process.env.LV||5),ROW=+(process.env.ROW||0);
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);});
await page.click({1:'#ddAfter2Btn',2:'#ddAfterC2Btn',3:'#ddAfterC3Btn'}[process.env.CH||1]);await page.waitForFunction(()=>typeof state!=='undefined'&&state==='ddmeta'&&ddm&&ddm.v2,null,{timeout:60000});await page.waitForTimeout(1200);
await ev(([hide,row,lv])=>{if(hide){const st=document.createElement('style');st.textContent='#ddm{visibility:hidden!important}';document.head.appendChild(st);}ddmV2Tick=()=>{};window.__row=row;window.__lv=lv;},[process.env.HIDE==='1',ROW,LV]);
// BF="x:y:yaw;x:y:yaw": battlefield places to try, a picture each (bf-0.png, bf-1.png...)
const BF=(process.env.BF||'').split(';').filter(Boolean).map(q=>q.split(':').map(Number));
for(let i=0;i<BF.length;i++){const ok=await ev(([q])=>{ddm.sp.bf=[q[0],q[1],[q[2]]];ddm.v2Bg='field';ddm.step=window.__row;ddm.rows[ddm.step].u.lookLv=window.__lv;ddmStepOut(ddm.step);ddmBgPick(ddm.step);ddm.v2Shown=null;ddmUI();return ddm.v2K+' '+(ddm.v2At?[Math.round(ddm.v2At.x),Math.round(ddm.v2At.y),ddm.v2At.yaw].join(','):'-');},[BF[i]]);
  await page.waitForTimeout(2600);await page.screenshot({path:`${OUT}/bf-${i}.png`});console.log('bf',i,BF[i].join(':'),'->',ok);}
for(const bg of (BF.length?[]:BGS)){
  await ev(([bg,ov])=>{ddm.v2Bg=bg==='auto'?null:bg;ddm.step=window.__row;ddm.rows[ddm.step].u.lookLv=window.__lv;if(ov)Object.assign(DDM_SHOT,ov);ddmStepOut(ddm.step);ddmBgPick(ddm.step);ddm.v2Shown=null;ddmUI();},[bg,process.env.SHOT?JSON.parse(process.env.SHOT):null]);
  await page.waitForTimeout(2800);await page.screenshot({path:`${OUT}/${bg}.png`});
  console.log(bg,JSON.stringify(await ev(()=>({k:ddm.v2K,at:ddm.v2At&&[Math.round(ddm.v2At.x),Math.round(ddm.v2At.y),ddm.v2At.yaw],away:ddm.rows.filter(r=>r.u.away).length,stage:!!(ddm.por&&ddm.por.u)}))));}
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

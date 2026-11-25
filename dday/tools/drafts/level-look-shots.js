// the look by level, on the stage: one picture a level and angle. node lvlook.js OUT [port] ; env ROWS=0,1 LEVELS=1,2,3 YAWS=.4,3.6
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'lvlook',PORT=+process.argv[3]||9882;
const ROWS=(process.env.ROWS||'0').split(',').map(Number),LEVELS=(process.env.LEVELS||'1,2,3,4,5,6,7,8,9,10').split(',').map(Number),YAWS=(process.env.YAWS||'.45').split(',').map(Number);
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:+(process.env.W||340),height:+(process.env.H||560)});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);});
await page.click('#ddAfter2Btn');await page.waitForFunction(()=>typeof state!=='undefined'&&state==='ddmeta'&&ddm&&ddm.v2,null,{timeout:60000});await page.waitForTimeout(1200);
await ev(()=>{const st=document.createElement('style');st.textContent='#ddm{visibility:hidden!important}';document.head.appendChild(st);DDM_STAGE[0]=[.86,0,0];DDM_STAGE[1]=[.86,0,0];ddmV2Tick=()=>{};});
const info=await ev(()=>ddm.rows.map(r=>r.rm.name+':'+r.rm.role+':'+r.lv0+'>'+r.lv1));console.log(info.join(' '));
for(const row of ROWS)for(const yaw of YAWS)for(const lv of LEVELS){
  await ev(([row,yaw,lv])=>{ddm.step=row;const u=ddm.rows[row].u;u.lookLv=lv;ddmPorScene().yaw=yaw;},[row,yaw,lv]);await page.waitForTimeout(1300);
  await page.screenshot({path:`${OUT}/r${row}-y${String(yaw).replace('.','_')}-l${String(lv).padStart(2,'0')}.png`});}
const g=await ev(()=>({keys:[...FIG_GEO.keys()].filter(k=>k.split('|').length>5).length,tris:(()=>{const o={};for(const [k,G] of FIG_GEO)if(/^sq/.test(k))o[k]=G.index.count/3;return o;})()}));console.log(JSON.stringify(g).slice(0,900));
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

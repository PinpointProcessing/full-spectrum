// which backdrop every man of the line would get, at both screen shapes (no pictures). node bgall.js [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
(async()=>{const PORT=+process.argv[2]||9891;const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=0`);const ev=(f,a)=>page.evaluate(f,a);
for(const [W,H] of [[390,760],[844,390],[1280,720]]){await page.setViewportSize({width:W,height:H});
  await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);});
  if(W===390){await page.click('#ddAfter2Btn');await page.waitForFunction(()=>typeof state!=='undefined'&&state==='ddmeta'&&ddm&&ddm.v2,null,{timeout:60000});}
  await page.waitForTimeout(1200);
  const out=await ev(()=>{ddmV2Tick=()=>{};ddmWorldOff();const o=[];for(let k=0;k<ddm.rows.length;k++){const r=ddm.rows[k];const q=[];for(const kind of['base','field']){const at=ddmShotPick(r,kind);q.push(at?kind+'('+Math.round(at.x-r.u.x)+','+Math.round(at.y-(r.y0??r.u.y))+','+at.yaw+')':kind+':NONE');}o.push(r.rm.name+' '+q.join(' '));}return o;});
  console.log(W+'x'+H+'\n  '+out.join('\n  '));}
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

// Version 234: the blockhouse breaking open in stages. node breach234.js OUT [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'b234',PORT=+process.argv[3]||9960;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve('/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');window.requestAnimationFrame=()=>0;startCounter();bigText('');});await page.waitForTimeout(700);
await ev(()=>{for(let i=0;i<200;i++)update(1/30);for(const e of enemies){e.x=60;e.y=-700;e.path=[];e.stunT=1e9;e.cool=1e9;}for(const K of dd.tanks)K.hold=true;for(const q of['#banner','#bigText','#dcNoRe','#dcBar','.panel','#sq','#ddObj'])for(const e of document.querySelectorAll(q))e.style.visibility='hidden';});
const shot=async n=>{await ev(()=>{dd.track=null;camPan=null;zoom=8.5;yaw=0;tilt=ddTilt(8.5,.42);camT.x=736;camT.z=-215;for(let i=0;i<45;i++)update(1/30);for(let i=0;i<2;i++){updateCamera();ddFrame(.03,simT);render(.03,simT);drawOverlay(.03,simT);}});await page.waitForTimeout(700);await ev(()=>{render(.001,simT);drawOverlay(.001,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});};
const hit=n=>ev(n=>{const co=objs.find(o=>o.tag==='check'),c=DCA.check;for(let i=0;i<n&&!co.gone;i++)ddBlast(c.x+c.w/2,c.y+c.h+4,players[1]);for(let i=0;i<4;i++)update(1/30);return{hp:Math.round(co.hp),breach:co.breach||0,live:dcSlits().filter(s=>!s.out).length,gone:!!co.gone};},n);
await shot('0-whole');
const a=await hit(3);console.log(JSON.stringify(a));ok(a.breach===1&&a.live===2,'a third gone: breached, two guns left');await shot('1-breached');
const b2=await hit(2);console.log(JSON.stringify(b2));ok(b2.breach===2&&b2.live===1,'two thirds gone: half the roof off, one gun left');await shot('2-broken');
const c=await hit(4);console.log(JSON.stringify(c));ok(c.gone,'destroyed');await ev(()=>{for(let i=0;i<240;i++)update(1/30);});await shot('3-destroyed');await ev(()=>{yaw=.7;});await shot('4-destroyed-side');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();

// Version 192: the report's roll call, the summary, the base and the briefing, through the start card's shortcut. node rep.js PO OUT W H
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const PO=+process.argv[2]||9,OUT=process.argv[3]||'.',W=+process.argv[4]||390,H=+process.argv[5]||760;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const port=9700+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=1`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');});
const snap=async n=>{await page.waitForTimeout(700);await page.screenshot({path:`${OUT}/${n}.png`});console.log('shot',n,JSON.stringify(await ev(()=>ddm&&{ph:ddm.ph,step:ddm.step,done:ddm.an&&ddm.an.done})));};
await page.click('#ddAfterBtn');await page.waitForFunction(()=>typeof ddm!=='undefined'&&ddm&&ddm.ph==='report',null,{timeout:60000});
await snap('1-victory');await page.click('.ddm-vic');
await page.waitForFunction(()=>ddm.step===0&&ddm.an&&ddm.an.done,null,{timeout:60000});await snap('2-roll-mvp');
const tap=async()=>{await page.click('.ddm-rc .ddm-chips');};
await tap();await page.waitForTimeout(1200);await snap('3-roll-mid');await tap();await page.waitForTimeout(300);await snap('3b-roll-ended');
for(let k=0;k<12;k++){const st=await ev(()=>ddm.step);if(st>=6)break;await tap();await page.waitForTimeout(250);}
await page.waitForFunction(()=>ddm.an&&ddm.an.done,null,{timeout:60000}).catch(()=>{});await snap('4-roll-wounded');
await page.click('.ddm-skip');await snap('5-summary');
await page.click('[data-a=base]');await page.waitForTimeout(1500);await snap('6-base');
await page.click('[data-a=go]');await snap('7-brief');
await page.click('[data-a=gox]');await page.click('[data-a=barracks]');await page.waitForTimeout(1500);await snap('8-barracks');
await page.click('[data-a=out]');await page.waitForTimeout(500);console.log('after out',JSON.stringify(await ev(()=>({ph:ddm&&ddm.ph,state,counter:!!(dd&&dd.counter)}))));
await page.click('[data-a=go]');await page.click('[data-a=start]');await page.waitForTimeout(2500);console.log('after start',JSON.stringify(await ev(()=>({state,counter:!!(dd&&dd.counter),players:players.length}))));
console.log('errors',errors.length,errors.slice(0,4));await b.close();srv.close();process.exit(0);})();

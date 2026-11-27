const {chromium}=require('playwright');const {serve,open}=require('../harness.js');
(async()=>{const srv=await serve('/home/user/full-spectrum/dday',9741);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,'http://localhost:9741/index.html?gfx=1');await page.setViewportSize({width:390,height:760});
await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.click('#ddBtn');await page.waitForTimeout(600);
const r=await page.evaluate(()=>{const H=(dx,y)=>+ddH(dx+DDX,y).toFixed(0),o={};
  o.grid=[];for(let y=-60;y<=220;y+=20){let row=String(y).padStart(4)+' ';for(let dx=520;dx<=1000;dx+=20)row+=String(H(dx,y)).padStart(4);o.grid.push(row);}
  o.top2=H(770,-390);o.art=H(756,-384);o.drawMG=H(466,-140);o.rampTop=H(560,100);
  const S=(a,b)=>ddSightOK(a[0]+DDX,a[1],b[0]+DDX,b[1]);o.sight={};
  for(const[n,p]of[['art',[756,-384]],['drawMG',[466,-140]],['top2edge',[770,-340]],['base',[520,-600]],['topMG',[350,-588]]])o.sight[n]=[[800,60],[860,80],[900,110],[820,130],[880,150]].map(q=>S(p,q)?1:0).join('');
  o.objs=objs.filter(q=>q.x-DDX>740&&q.x-DDX<1000&&q.y>20&&q.y<215&&q.kind!=='drop').map(q=>q.kind+':'+(q.x-DDX)+','+q.y+','+q.w+'x'+q.h);
  o.hill=enemies.filter(e=>e.tag==='hill').map(e=>Math.round(e.x-DDX)+','+Math.round(e.y)+(e.gunner?' mg':''));
  o.free=[[800,60],[860,80],[900,110],[820,130]].map(q=>isFree(q[0]+DDX,q[1])?1:0).join('');
  return o;});
console.log(r.grid.join('\n'));delete r.grid;console.log(JSON.stringify(r,null,1));console.log('errors',errors.length);await b.close();srv.close();process.exit(0);})();

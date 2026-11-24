// CAPTURE flags and the highlighted-area drafts: node cap.js OUT
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'cap';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve('/home/user/full-spectrum/dday',9781);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,'http://localhost:9781/index.html?noseq&gfx=2');await page.setViewportSize({width:390,height:760});
await page.evaluate(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(77);});
await page.click('#ddBtn');await page.waitForTimeout(600);
await page.evaluate(()=>{damage=()=>{};let n=0;while(!dd.land.done&&n++<4000)update(1/30);for(const e of enemies)e.stunT=999;
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*13,y:y+((k/2)|0)*13,path:[],inBoat:false,afloat:false,joining:false}));});
const shot=async(n,place,hl)=>{await page.evaluate(([place,hl])=>{DD_CAP_HL=hl;
    if(place==='left'){PUT('A',330,400);PUT('B',400,420);}else{dd.held.left=true;dd.held.nest=true;PUT('A',600,150);PUT('B',650,170);}
    selectTeam('A');dd.active='A';for(let i=0;i<150;i++){update(1/30);panTick(1/30);if(i%5==0)ddFrame(1/6,simT);}bigText('');ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();},[place,hl]);
  await page.waitForTimeout(500);await page.evaluate(()=>{render(.03,simT);drawOverlay(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});console.log('shot',n);};
for(const pl of['left','post'])for(const hl of[0,1,2])await shot(pl+hl,pl,hl);
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

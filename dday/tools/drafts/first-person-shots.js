const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'fp213';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve('/home/user/full-spectrum/dday',9793);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,'http://localhost:9793/index.html?noseq&gfx=2');await page.setViewportSize({width:390,height:760});
await page.evaluate(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(77);});
await page.click('#ddBtn');await page.waitForTimeout(600);
await page.evaluate(()=>{damage=()=>{};let n=0;while(!dd.land.done&&n++<4000)update(1/30);for(let i=0;i<600;i++)update(1/30);for(const e of enemies)e.stunT=9999;
  window.PUT=(t,x,y,a)=>players.filter(p=>p.team===t).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*13,y:y+((k/2)|0)*13,ang:a||0,path:[],inBoat:false,afloat:false,joining:false}));});
const fpShot=async(n,setup,arg)=>{await page.evaluate(setup,arg);await page.evaluate(()=>{bigText('');for(let i=0;i<3;i++)update(1/600);for(let i=0;i<30;i++)fpCam(1/30);render(1/30,simT);hud();ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);});await page.waitForTimeout(500);await page.evaluate(()=>{if(window.FIRE){dd.fp.cool=1;dd.fp.vk=1;}fpCam(1/600);render(1/30,simT);ox.clearRect(0,0,9999,9999);});await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${n}.png`});console.log('shot',n);await page.evaluate(()=>{if(dd.fp)fpExit();});};
await page.evaluate(()=>{window.AT=(w,aim,fire,where)=>{const P={beach:[452,560,-1.52,.02],top:[300,-380,-.55,0],post:[690,74,-1.0,.06]}[where];PUT('A',P[0],P[1],P[2]);PUT('B',P[0]+70,P[1]+30,P[2]);const u=players.find(p=>p.team==='A');u.weapon=w;
  const L=enemies.slice(-6);if(where==='top')L.forEach((e,i)=>Object.assign(e,{x:DDX+420+i*26,y:-480-(i%3)*24}));if(where==='beach')L.forEach((e,i)=>Object.assign(e,{x:DDX+430+i*24,y:300+(i%2)*20}));
  fpEnter(u,'1p');dd.fp.a=P[2];dd.fp.p=P[3];dd.fp.aim=!!aim;window.FIRE=!!fire;};});
for(const[n,w,a,f,wh]of[['rifle','rifle',0,0,'beach'],['rifle-aim','rifle',1,0,'beach'],['rifle-fire','rifle',0,1,'top'],['bar','hmg',0,0,'post'],['sniper','sniper',0,0,'top']])
  await fpShot(n,([w,a,f,wh])=>AT(w,a,f,wh),[w,a,f,wh]);
console.log('errors',errors.length,errors.slice(0,4));await b.close();srv.close();process.exit(0);})();

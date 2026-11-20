// the outpost draft: pictures of the scratch copy with a free camera. node shots.js OUT [FLAG]
const {chromium}=require('playwright');const {serve,open}=require('../harness.js');const fs=require('fs');
const OUT=process.argv[2]||'p',CAP=process.argv[3]==='cap';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(__dirname+'/dday',9743+(CAP?1:0));const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${9743+(CAP?1:0)}/index.html?gfx=2`);await page.setViewportSize({width:390,height:760});
await page.evaluate(c=>{window.requestAnimationFrame=()=>0;if(c)window.OP_FLAG=0x2f6fd0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(77);},CAP);
await page.click('#ddBtn');await page.waitForTimeout(600);
await page.evaluate(c=>{const d0=damage;damage=()=>{};let n=0;while(!dd.land.done&&n++<4000)update(1/30);for(let i=0;i<60;i++)update(1/30);window.LD=[dd.land.done,n];
  const put=(t,x,y,a)=>players.filter(p=>p.team===t).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*13,y:y+((k/2)|0)*13,ang:a,path:[],inBoat:false,afloat:false,joining:false}));
  if(c){put('A',628,84,1.6);put('B',660,36,-1.9);for(const e of enemies)if(e.tag==='draw'&&!e.gunner){e.x=DDX+200;e.y=700;}}else{put('A',575,200,-1.4);put('B',600,235,-1.4);
    const hs=enemies.filter(e=>!e.gunner&&!e.dead).slice(0,5),P=[[630,88,1.8],[660,90,1.6],[690,74,1.9],[640,60,1.6],[745,20,2.4]];hs.forEach((e,i)=>Object.assign(e,{x:DDX+P[i][0],y:P[i][1],ang:P[i][2],path:[],hold:{ang:P[i][2]},tag:'outpost'}));}
  for(let i=0;i<3;i++)update(1/600);ddFrame(1/600,simT);},CAP);
const shot=async(n,cx,cy,zm,yw,tl)=>{await page.evaluate(([cx,cy,zm,yw,tl])=>{for(const e of document.querySelectorAll('body *'))if(e.tagName!=='CANVAS'&&!e.querySelector('canvas'))e.style.visibility='hidden';
    zoom=zm;yaw=yw;tilt=ddTilt(zm,tl);camT.x=DDX+cx;camT.z=cy;camShift=0;updateCamera();render(.03,simT);ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);},[cx,cy,zm,yw,tl]);
  await page.waitForTimeout(500);await page.evaluate(()=>{render(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});console.log('shot',n);};
const T=CAP?'cap-':'';
await shot(T+'south',655,80,8.5,0,.5);          // from below, coming up the path
await shot(T+'east',670,55,8,-Math.PI/2,.5);
await shot(T+'north',660,40,7,Math.PI,.5);
await shot(T+'wide',690,90,4.4,0,.7);
console.log(JSON.stringify(await page.evaluate(()=>({LD,state,cam:camera.position.toArray().map(Math.round)}))));console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();


// three places for the house, each from the same two views. node samples.js
const {chromium}=require('playwright');const {serve,open}=require('../harness.js');const fs=require('fs');
const S={A:[892,88,-Math.PI/2-.35],B:[850,-40,-Math.PI/2],C:[800,6,.75-Math.PI]};
(async()=>{fs.mkdirSync('ps',{recursive:true});const srv=await serve(__dirname+'/dday',9757);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for(const k of Object.keys(S)){const {page,errors}=await open(b,'http://localhost:9757/index.html?gfx=2');await page.setViewportSize({width:390,height:760});
  await page.evaluate(h=>{window.requestAnimationFrame=()=>0;window.OP_H=h;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(77);},S[k]);
  await page.click('#ddBtn');await page.waitForTimeout(600);
  await page.evaluate(()=>{damage=()=>{};let n=0;while(!dd.land.done&&n++<4000)update(1/30);for(let i=0;i<60;i++)update(1/30);
    const put=(t,x,y,a)=>players.filter(p=>p.team===t).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*13,y:y+((k/2)|0)*13,ang:a,path:[],inBoat:false,afloat:false,joining:false}));put('A',540,150,-1.2);put('B',600,180,-1.2);
    for(const e of enemies)if(e.tag==='draw'&&!e.gunner&&e.y>-100){e.x=DDX+200;e.y=700;}
    const hs=enemies.filter(e=>!e.gunner&&!e.dead&&e.y<700).slice(0,3),P=[[698,14,1.9],[731,19,1.5],[716,-6,2.9]];hs.forEach((e,i)=>Object.assign(e,{x:DDX+P[i][0],y:P[i][1],ang:P[i][2],path:[],hold:{ang:P[i][2]}}));
    for(let i=0;i<3;i++)update(1/600);ddFrame(1/600,simT);});
  const shot=async(n,cx,cy,zm,yw,tl)=>{await page.evaluate(([cx,cy,zm,yw,tl])=>{for(const e of document.querySelectorAll('body *'))if(e.tagName!=='CANVAS'&&!e.querySelector('canvas'))e.style.visibility='hidden';
      zoom=zm;yaw=yw;tilt=ddTilt(zm,tl);camT.x=DDX+cx;camT.z=cy;camShift=0;updateCamera();render(.03,simT);ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);},[cx,cy,zm,yw,tl]);
    await page.waitForTimeout(500);await page.evaluate(()=>{render(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:`ps/${k}-${n}.png`});};
  await shot('view',740,60,5.6,-.85,.38);await shot('top',780,40,4.2,0,.8);console.log(k,'errors',errors.length);await page.close();}
await b.close();srv.close();process.exit(0);})();

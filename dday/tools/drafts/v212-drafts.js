// drafts: the heavy gun down the hill with two MGs inside its bunker, the view from one of them at the counterattack, and first person as it is now
const {chromium}=require('playwright');const {serve,open}=require('../harness.js');const fs=require('fs');const OUT='d212';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(__dirname+'/dday',9791);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,'http://localhost:9791/index.html?noseq&gfx=2');await page.setViewportSize({width:390,height:760});
await page.evaluate(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(77);});
await page.click('#ddBtn');await page.waitForTimeout(600);
await page.evaluate(()=>{damage=()=>{};let n=0;while(!dd.land.done&&n++<4000)update(1/30);for(const e of enemies)e.stunT=9999;
  window.PUT=(t,x,y,a)=>players.filter(p=>p.team===t).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*13,y:y+((k/2)|0)*13,ang:a||0,path:[],inBoat:false,afloat:false,joining:false}));PUT('A',260,-330,-1.2);PUT('B',300,-310,-1.2);for(let i=0;i<5;i++)update(1/600);});
const hide=()=>page.evaluate(()=>{for(const e of document.querySelectorAll('body *'))if(e.tagName!=='CANVAS'&&!e.querySelector('canvas'))e.style.visibility='hidden';});
const show=()=>page.evaluate(()=>{for(const e of document.querySelectorAll('body *'))e.style.visibility='';});
const shot=async(n,cx,cy,zm,yw,tl)=>{await hide();await page.evaluate(([cx,cy,zm,yw,tl])=>{dd.track=null;zoom=zm;yaw=yw;tilt=ddTilt(zm,tl);camT.x=DDX+cx;camT.z=cy;camShift=0;updateCamera();render(.03,simT);ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);},[cx,cy,zm,yw,tl]);
  await page.waitForTimeout(500);await page.evaluate(()=>{render(.03,simT);ox.clearRect(0,0,9999,9999);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});console.log('shot',n);};
await shot('b1',150,-400,8,1.15,.36);await shot('b2',130,-400,8,2.0,.5);await shot('b3',110,-405,6.5,0,.9);
// the view from one of its guns, ours: the tank and its infantry coming along the top from the east
const fpShot=async(n,setup)=>{await show();await page.evaluate(setup);await page.evaluate(()=>{bigText('');for(let i=0;i<3;i++)update(1/600);fpCam(1/30);render(1/30,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(500);await page.evaluate(()=>{fpCam(1/30);render(1/30,simT);});await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${n}.png`});console.log('shot',n);await page.evaluate(()=>{if(dd.fp)fpExit();});};
await fpShot('mg',()=>{for(const e of enemies){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}dd.held.heavy=dd.held.crest=dd.held.outpost=true;
  const W=DD_SPOT.tankWay;ddTankSpawn({x:DDX+560,y:-520,way:[[DDX+420,-500]]});for(const[x,y]of[[470,-470],[500,-540],[430,-440],[520,-490],[390,-520],[450,-560]]){const e=ddFoe('counter',x,y,{ang:Math.PI});e.stunT=9999;enemies.push(e);}
  for(let i=0;i<10;i++)update(1/600);for(const o of objs)if(o.bk==='hv')for(const m of o.meshes||[])m.visible=false;DD.roofs[DD.roofs.length-1].visible=false;window.HV=1;const u=players.find(p=>p.team==='A');Object.assign(u,{x:DDX+133,y:-427,path:[]});u.onGun={x:DDX+137,y:-427,ang:-.25,arc:1};u.gunner=true;u.postGun={up:-.25};fpEnter(u,'1p');dd.fp.a=-.25;dd.fp.p=-.02;const b=document.querySelector('#fp [data-a="back"]');if(b)b.textContent='◀ EXIT';});
// first person as it is today, as a rifleman
await page.evaluate(()=>{for(const u of players){u.onGun=null;u.gunner=false;u.postGun=null;}});
await fpShot('fp1',()=>{PUT('A',452,560,-1.57);PUT('B',520,585,-1.57);const u=players.find(p=>p.team==='A');for(const e of enemies.slice(-6))Object.assign(e,{x:DDX+430+Math.random()*120,y:300+Math.random()*30});fpEnter(u,'1p');dd.fp.a=-Math.PI/2+.05;dd.fp.p=.02;});
await fpShot('fp2',()=>{PUT('A',690,74,-1.1);PUT('B',660,100,-1.1);const u=players.find(p=>p.team==='A');const L=enemies.slice(-6);[[752,-12],[764,-32],[748,-46],[740,-34],[747,-7],[800,-30]].forEach((q,i)=>Object.assign(L[i],{x:DDX+q[0],y:q[1]}));fpEnter(u,'1p');dd.fp.a=-1.0;dd.fp.p=.06;});
await fpShot('fp3',()=>{PUT('A',300,-380,-.4);PUT('B',330,-350,-.4);const u=players.find(p=>p.team==='A');const L=enemies.slice(-6);L.forEach((e,i)=>Object.assign(e,{x:DDX+420+i*26,y:-480-(i%3)*24}));fpEnter(u,'1p');dd.fp.a=-.55;dd.fp.p=0;dd.fp.aim=false;});
console.log('errors',errors.length,errors.slice(0,4));await b.close();srv.close();process.exit(0);})();

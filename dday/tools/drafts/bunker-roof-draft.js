// Draft after Version 217 (Bryan: "make the roof much taller or partially open above the guns so the player can see they are accessible - draw me drafts"):
// the hilltop bunker with its roof as it is, A raised on posts, B cut back so the guns stand in the open, C a low roof over the big gun and a tall open canopy over the machine guns.
// Changes are made in the page only. node bunker-roof-draft.js [port out]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const PORT=+process.argv[2]||9771,OUT=process.argv[3]||'roofd';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4001);localStorage.removeItem('warehouseYard.ddmeta.v1');});
await page.click('#ddBtn');await page.waitForTimeout(600);
const shot=async n=>{await ev(()=>{bigText('');ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(450);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});};
await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};RUN(20);
  for(const e of enemies){e.hp=0;e.dead=true;}for(const k of['beach','left','nest','outpost','draw','crest'])dd.held[k]=true;for(const u of dd.npcs){u.hp=0;u.dead=true;u.m.g.visible=false;}
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
  const T=THREE,r=DD.roofs.find(q=>q.userData.bk==='hv'),all=[r,...r.userData.parts],S0=all.map(q=>({p:q.position.clone(),s:q.scale.clone()})),extra=[];
  const add=(geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;DD.scene.add(m);extra.push(m);return m;};
  const g0=r.position.y-25,X=x=>x+DDX,conc=r.material;
  window.VAR=v=>{all.forEach((q,i)=>{q.position.copy(S0[i].p);q.scale.copy(S0[i].s);q.visible=true;});for(const m of extra)DD.scene.remove(m);extra.length=0;
    const squeeze=(x0,x1)=>{const k=(x1-x0)/120,c=X(90),nc=X((x0+x1)/2);all.forEach(q=>{q.position.x=nc+(q.position.x-c)*k;q.scale.x*=k;});};
    if(v==='A'){all.forEach(q=>q.position.y+=18);for(const[x,y]of[[34,-436],[146,-436],[34,-368],[146,-368],[90,-436],[90,-368]])add(new T.BoxGeometry(5,20,5),conc,X(x),g0+31,y);}
    if(v==='B'){squeeze(30,104);}
    if(v==='C'){squeeze(30,104);const cm=new T.MeshStandardMaterial({color:0x5a6238,roughness:1,side:T.DoubleSide});add(new T.BoxGeometry(50,1.6,82),cm,X(127),g0+44,-402);
      for(const[x,y]of[[106,-438],[148,-438],[106,-366],[148,-366]])add(new T.CylinderGeometry(1.2,1.2,44,6),new T.MeshStandardMaterial({color:0x4a3a28,roughness:.9}),X(x),g0+22,y);}
  };});
await ev(()=>{PUT('A',240,-400);PUT('B',300,-380);selectTeam('A');dd.active='A';dd.track={team:'A'};ddGoSquad('A');RUN(5);window.Y0=yaw;dd.track=null;});
for(const v of (process.env.ONLY||'now,A,B,C').split(','))for(const vw of [0,1,2]){
  await ev(([v,vw])=>{VAR(v);dd.track=null;camPan=null;camT.x=DDX+120;camT.z=-395;yaw=vw===0?Y0:vw===1?Math.PI/2:-Math.PI/2;if(typeof updateCamera==='function')updateCamera();},[v,vw]);
  await shot(`${v}-${vw}`);}
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

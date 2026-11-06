"use strict";
/* The Headquarters (Bryan, after v71: "Inside can be a large room with three rooms on each side. Inside the main room will be a
   large (boss) monster with smaller monsters coming out of the rooms. Once they kill all of them it's the players new HQ").
   Its own small map, swapped in like Level 2's (MAPID 'hq'; the big map waits in STASH.out): a long hall with three rooms down
   each side, the way in at the south through an entry hall with a medic station and an ammo drop, and at the far end the Brood
   Mother (a giant centipede: creatures.js) coiled round her clutch. She's awake as the squad comes in; her roar opens two of
   the side rooms and her young come out; at two thirds and a third of her health she roars again and two more open. Walk
   into a side room early and its young are on you there. If she dies first, the rooms left burst open. When nothing is left
   alive the place is the squad's: "Headquarters taken", the freed men's goodbye, the report. No save inside: a lost fight
   goes back to the gate ('gate'). The place is her nest (Bryan: goo on the walls, "hard purple, black, red, brown slime rocks
   growing up furniture and walls, extending to the ground"; "No pink"): hqNest in creatures.js. */
const HQB={x0:60,x1:940,y0:80,y1:940},HQ_START=[[470,880],[500,880],[530,880],[455,905],[485,905],[515,905],[545,905],[500,925]];
const HQ_REST=[{k:'med',x:440,y:872},{k:'sup',x:560,y:872}];
// the side rooms: west (x 120-330) and east (x 670-880), each with its doorway into the hall; which pair opens when
const HQ_ROOMS=[
  {id:'W3',x0:120,y0:590,x1:330,y1:780,door:{x:335,y:685},side:-1,phase:0},{id:'E3',x0:670,y0:590,x1:880,y1:780,door:{x:665,y:685},side:1,phase:0},
  {id:'W2',x0:120,y0:370,x1:330,y1:570,door:{x:335,y:470},side:-1,phase:1},{id:'E2',x0:670,y0:370,x1:880,y1:570,door:{x:665,y:470},side:1,phase:1},
  {id:'W1',x0:120,y0:150,x1:330,y1:350,door:{x:335,y:250},side:-1,phase:2},{id:'E1',x0:670,y0:150,x1:880,y1:350,door:{x:665,y:250},side:1,phase:2}];
const HQ_HALL={x0:340,y0:140,x1:660,y1:780},HQ_LAMPS=[
  {x:500,y:640,h:30,c:0xffd8c8,i:1.6,d:230,flick:1},{x:420,y:400,h:30,c:0xff3010,i:1.1,d:220},{x:580,y:400,h:30,c:0xff3010,i:1.1,d:220},
  {x:500,y:870,h:26,c:0xff3010,i:1.6,d:170},   // the entry hall: emergency red (deep, toward orange: grey went pink under the old red)
  {x:380,y:740,h:26,c:0xff3010,i:1.4,d:180},{x:620,y:740,h:26,c:0xff3010,i:1.4,d:180},
  {x:500,y:520,h:30,c:0xd8e2ff,i:1.2,d:200,flick:1},   // one strip light left working in the middle of the hall
  {x:500,y:158,h:34,c:0xd88a3e,i:1.3,d:300},   // the lair: a low amber glow over her clutch
  {x:225,y:470,h:22,c:0xb06a2c,i:1.0,d:160},{x:775,y:470,h:22,c:0xb06a2c,i:1.0,d:160}];   // the nests
let HQ=null,hqs={awake:false,phase:-1,won:false,t0:0,killed:0,pending:[]};
function resetHQ(){hqs={awake:false,phase:-1,won:false,t0:simT,killed:0,pending:[]};for(const r of HQ_ROOMS)r.open=false;}   // (a Retry comes back to closed rooms)
// a room opening a moment from now, on the game's clock (a pause holds it)
function openSoon(r,dt){if(!r.open&&!hqs.pending.some(p=>p.r===r))hqs.pending.push({r,at:simT+dt});}
function hqObjects(){
  const o=[],O=(kind,x,y,w,h,ex={})=>o.push(Object.assign({kind,x,y,w,h,full:FULL.has(kind)},ex));
  // the hall's walls, with three doorways down each side and the way in at the south
  O('wall',330,130,340,10);
  for(const x of[330,660]){let y=140;for(const r of HQ_ROOMS.filter(r=>Math.abs(r.door.x-x-5)<10).sort((a,b)=>a.door.y-b.door.y)){O('wall',x,y,10,r.door.y-25-y);y=r.door.y+25;}O('wall',x,y,10,790-y);}
  O('wall',330,780,140,10);O('wall',530,780,140,10);
  // the side rooms' outer walls and the walls between them
  for(const[x0,x1]of[[110,330],[670,890]]){O('wall',x0,140,x1-x0,10);O('wall',x0,780,x1-x0,10);O('wall',x0,355,x1-x0,10);O('wall',x0,575,x1-x0,10);O('wall',x0===110?110:880,140,10,650);}
  // the entry hall behind the way in
  O('wall',390,790,10,140);O('wall',600,790,10,140);O('wall',390,930,220,10);
  // in the hall: four big glass tanks (they block sight), machines at the far end, crates and debris for cover
  for(const[x,y]of[[384,300],[570,300],[384,540],[570,540]])O('ctank',x,y,46,46);
  O('xfmr',360,148,44,26);O('xfmr',596,148,44,26);O('console',440,330,40,12);O('console',520,330,40,12);
  for(const[x,y,w,h]of[[372,700,24,20],[604,690,24,20],[470,630,32,18],[515,445,26,20],[430,420,22,20],[600,410,22,20],[365,620,20,24]])O('crate',x,y,w,h);
  for(const[x,y]of[[455,700],[548,705],[620,600]])O('barrel',x,y,12,12);
  // in the rooms: overturned crates, a barrel or two (the nests themselves are painted on the floor)
  for(const r of HQ_ROOMS){const cx=(r.x0+r.x1)/2,cy=(r.y0+r.y1)/2;O('crate',cx-60*r.side,cy-40,24,20);O('crate',cx-30*r.side,cy+50,22,22);O('barrel',cx+50*r.side-6,cy-60,12,12);}
  // beyond the walls: nothing (the camera's frame)
  O('void',HQB.x0,HQB.y0,50,HQB.y1-HQB.y0);O('void',HQB.x1-50,HQB.y0,50,HQB.y1-HQB.y0);
  return o;
}
function paintHQGround(g){paintNestGround(g);}   // (creatures.js: the floor under her nest)
function disposeHQ(){
  if(!HQ||!HQ.scene)return;
  HQ.scene.traverse(o=>{if(o.geometry&&!o.geometry.userData.keep)o.geometry.dispose();});   // (not the monsters' shapes: made once, kept)
  if(HQ.tex)HQ.tex.dispose();HQ=null;
}
function buildHQ(){
  disposeHQ();
  HQ={objs:hqObjects(),lamps:HQ_LAMPS.map(l=>Object.assign({},l)),hq:[],scene:null,lights:null,tex:null};
  const sc=new T.Scene();sc.background=new T.Color(0x07080b);sc.fog=new T.FogExp2(0x07080b,0.00035);HQ.scene=sc;
  const fc=document.createElement('canvas');fc.width=Math.round((HQB.x1-HQB.x0)*1.2);fc.height=Math.round((HQB.y1-HQB.y0)*1.2);paintHQGround(fc.getContext('2d'));
  const tex=new T.CanvasTexture(fc);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;HQ.tex=tex;
  const keep=scene;scene=sc;
  try{
    const gw=HQB.x1-HQB.x0,gh=HQB.y1-HQB.y0;
    const ground=new T.Mesh(new T.PlaneGeometry(gw,gh),new T.MeshStandardMaterial({map:tex,roughness:.85,metalness:.1}));
    ground.rotation.x=-Math.PI/2;ground.position.set((HQB.x0+HQB.x1)/2,0,(HQB.y0+HQB.y1)/2);ground.receiveShadow=true;sc.add(ground);
    meshObjs(HQ.objs.filter(o=>o.kind!=='void'));
    for(const L of HQ.lamps){const hd=new T.Mesh(new T.BoxGeometry(8,1.5,3),new T.MeshBasicMaterial({color:L.c,toneMapped:false}));hd.position.set(L.x,L.h+1,L.y);sc.add(hd);L.head=hd;}
    const hemi=new T.HemisphereLight(0x7d776e,0x120e0b,.3);hemi.userData.base=.3;sc.add(hemi);
    // her nest: resin down the walls, wet resin over the lair's floor, egg clutches, slime rocks up the fittings and walls; the
    // old fittings grimed over (the pale tanks burned out to white under her lamps)
    HQ.nest=hqNest(sc,HQ.objs);
    for(const o of HQ.objs)if(o.meshes&&['ctank','xfmr','console','crate','barrel','wall'].includes(o.kind))for(const m of o.meshes){if(!m.material||!m.material.color||m.userData.grimed)continue;
      m.material=m.material.clone();m.userData.grimed=true;m.material.color.multiplyScalar(o.kind==='ctank'?.16:o.kind==='wall'?.45:.45).lerp(new T.Color(0x2a1c12),o.kind==='wall'?0:.25);}
    const moon=new T.DirectionalLight(0xb0a4ff,.32);moon.position.set(300,600,300);moon.target.position.set(500,0,500);moon.castShadow=true;
    moon.shadow.mapSize.set(1024,1024);Object.assign(moon.shadow.camera,{left:-520,right:520,top:520,bottom:-520,near:50,far:1600});moon.shadow.bias=-0.0008;sc.add(moon,moon.target);
    const pool=[];for(let k=0;k<LAMP_POOL;k++){const p=new T.PointLight(0xffffff,0,100,1.4);sc.add(p);pool.push(p);}
    const mz=[];for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);sc.add(m);mz.push(m);}
    const bl=new T.PointLight(0xffa050,0,280,1.6);sc.add(bl);
    HQ.lights={hemi,moon,lampPool:pool,muzzle:mz,boomL:bl};
  }finally{scene=keep;}
}
// in through the gate (from the gather area at the drawbridge: monsters.js); the scientists and the rest wait outside
function enterHQ(){
  const f=$('#fade');if(f)f.classList.add('on');
  setTimeout(()=>{
    buildHQ();stashOut(players);
    useMap({objs:HQ.objs,hq:HQ.hq,slow:[],lamps:HQ.lamps,scene:HQ.scene,lights:HQ.lights});
    tankFires=[];rockets=[];charges=[];
    const live=players.filter(p=>!p.dead&&!p.gone);
    for(const p of players){moveMesh(p,HQ.scene);Object.assign(p,{path:[],peek:null,tk:null,plant:null,supT:null,focus:null,elev:0,vaultK:0,crawl:false,lx:0,ly:0,offMap:false,throwGo:null,medGo:null});}
    live.forEach((p,i)=>{const s=HQ_START[i]||HQ_START[0];p.x=s[0];p.y=s[1];p.ang=-Math.PI/2;});
    units=[...players];MAPID='hq';enemies=[];civs=[];resetHQ();addZones(HQ_REST);
    const keep=scene;scene=HQ.scene;
    try{const b=broodMother(500,300);b.ang=Math.PI/2;b.hp=b.maxHp=BOSS.hp+BOSS.perMan*live.filter(p=>!p.downed).length;b.dmgIn=BOSS.dmgIn;
      const per=live.filter(p=>!p.downed).length>5?3:2;   // (a small squad meets two to a room, a big one three)
      for(const r of HQ_ROOMS)for(let k=0;k<per;k++){const h=hound((r.x0+r.x1)/2+(k-1)*26,(r.y0+r.y1)/2+(k%2?20:-14),{dormant:true,room:r.id,kind:'young',ang:r.side<0?0:Math.PI});}
    }finally{scene=keep;}
    contact=false;clearTeams();sel=[];cardGroup=[];hqs.wakeAt=simT+.6;   // (she's awake: she roars as they come in, bossThink)
    VB={x0:HQB.x0,z0:HQB.y0,x1:HQB.x1,z1:HQB.y1};FIT.w=HQB.x1-HQB.x0+40;FIT.h=HQB.y1-HQB.y0+40;fitDist();
    zoom=2.0;yaw=0;tilt=0;camT={x:500,z:800};clampCam();updateCamera();
    updateObjUI();setStatus();buildCards();hud();
    bigText('The Headquarters','inbound');
    if(f)setTimeout(()=>f.classList.remove('on'),60);
  },380);
}
function leaveHQNow(){   // back to the big map at once (a Retry, a New game)
  if(MAPID!=='hq')return;const out=STASH.out;
  for(const u of units)if(u.side!=='P'&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';
  for(const p of players){p.offMap=false;moveMesh(p,out.scene);}
  units=[...out.units,...players.filter(p=>!out.units.includes(p))];enemies=units.filter(u=>u.side==='E');civs=units.filter(u=>u.side==='C');
  VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();disposeHQ();
}
function openRoom(r,quiet){
  if(r.open)return;r.open=true;
  const hs=enemies.filter(e=>e.room===r.id&&e.dormant);for(const h of hs){h.dormant=false;h.againT=simT+.8+Math.random();h.growlT=simT+Math.random()*2;}
  if(!quiet&&hs[0])sfxMon('mon_scream',hs[0],1,.85);
}
// the Brood Mother (from monTick in monsters.js)
function bossThink(u,dt){
  const inHall=p=>alive(p)&&p.x>HQ_HALL.x0&&p.x<HQ_HALL.x1&&p.y>HQ_HALL.y0&&p.y<HQ_HALL.y1;
  for(const r of HQ_ROOMS)if(!r.open&&players.some(p=>alive(p)&&p.x>r.x0&&p.x<r.x1&&p.y>r.y0&&p.y<r.y1))openRoom(r);   // walked in on them
  if(u.ms==='sleep'){if(simT>=(hqs.wakeAt??1e9)||players.some(inHall)||u.hp<u.maxHp)bossRoar(u,0);return;}   // (Bryan: awake when they come in: she roared at the drawbridge, she knows they're coming)
  if(hqs.awakeT&&simT>(hqs.nextRoomT||0)){hqs.nextRoomT=simT+40;const r=HQ_ROOMS.find(q=>!q.open);if(r)openRoom(r);}   // and every 40 s another room, whatever her health
  if(u.ms==='roar'){u.path=[];if(simT-u.mt0>2.4){u.ms='walk';}return;}
  const tg=monPrey(u,2000);if(!tg){u.path=[];return;}monSaw(tg);
  const dx=tg.x-u.x,dy=tg.y-u.y,d=hyp(dx,dy)||1;
  if(u.ms==='slam'){u.path=[];
    if(simT-u.mt0>=BOSS.slamT){const s=u.slamAt;sfxMon('boss_slam',s,1.3,1);shake(1.1);booms.push({x:s.x,y:s.y,t:0});paintDecal({k:'scorch',x:s.x,y:s.y,r:Math.random()});
      for(const p of players){if(!alive(p))continue;const dd=hyp(p.x-s.x,p.y-s.y);if(dd<BOSS.slamR)monHit(u,p,BOSS.slamDmg*(1-dd/(BOSS.slamR*1.2)),.9);}
      u.ms='walk';u.slamCdT=simT+BOSS.slamCd;u.slamDownT=simT;}   // (her front crashes down: monsters.js)
    return;}
  if(u.ms==='swipe'){u.path=[];if(simT-u.mt0>=.5){for(const p of players){if(!alive(p))continue;const dd=hyp(p.x-u.x,p.y-u.y);let da=Math.atan2(p.y-u.y,p.x-u.x)-u.ang;da=Math.atan2(Math.sin(da),Math.cos(da));if(dd<BOSS.swipeR+10&&Math.abs(da)<1.3)monHit(u,p,BOSS.swipeDmg,.6);}
    u.ms='walk';u.swipeCdT=simT+BOSS.swipeCd;}return;}
  u.ang=turn(u.ang,Math.atan2(dy,dx),dt*1.6);
  if(d<BOSS.swipeR&&simT>u.swipeCdT){u.ms='swipe';u.mt0=simT;sfxMon('boss_hurt',u,.9,1.15);return;}
  if(d<230&&simT>u.slamCdT&&los(u.x,u.y,tg.x,tg.y)){u.ms='slam';u.mt0=simT;u.slamAt={x:tg.x,y:tg.y};sfxMon('boss_roar',u,.8,1.25);return;}
  if(u.path.length&&simT>u.stepT){u.stepT=simT+.75;sfxMon('boss_step',u,.9);shake(.18);}
  if(simT>(u.repath||0)){u.repath=simT+.6;const p=findPath(u.x,u.y,tg.x,tg.y,FOOT);if(p)u.path=p;}
}
function bossRoar(u,phase){
  u.ms='roar';u.mt0=simT;u.path=[];u.alerted=true;sfxMon('boss_roar',u,1.5,.95);shake(.8);hqs.phase=phase;
  if(!hqs.awake){hqs.awake=true;hqs.awakeT=simT;hqs.nextRoomT=simT+40;if(typeof startContact==='function')startContact('Contact! Here she comes!',false);banner('The Brood Mother. Keep clear of her slam: the violet ring. Medic station and ammo behind you.',4200);}
  for(const r of HQ_ROOMS)if(r.phase===phase)openSoon(r,.7+Math.random()*.6);
}
function bossHurt(u){
  const k=u.hp/u.maxHp;if(u.ms==='sleep')return;
  if(hqs.phase<1&&k<.66)bossRoar(u,1);else if(hqs.phase<2&&k<.33)bossRoar(u,2);
}
function bossDied(u){
  bigText('She’s down','clear');for(const r of HQ_ROOMS)if(!r.open)openSoon(r,.9+Math.random()*.9);   // what's left of the brood comes out
}
// every tick: the win
function hqTickWin(){
  if(MAPID!=='hq'||hqs.won||state!=='play')return;
  for(const p of hqs.pending.slice())if(simT>=p.at){hqs.pending.splice(hqs.pending.indexOf(p),1);openRoom(p.r);}
  if(enemies.some(e=>e.mon&&!e.dead))return;if(!enemies.some(e=>e.mon==='boss'))return;
  hqs.won=true;obj=6;objCompleted(4);updateObjUI();bigText('Headquarters taken','complete');banner('It’s yours now. This is your new HQ.',3600);
  setTimeout(()=>{if(state==='play'&&MAPID==='hq')farewell(()=>{if(state==='play'){endAt=performance.now()+1800;}});},OBJ_LIST_T+400);
}
function hqHint(){
  if(MAPID!=='hq')return'';
  if(!hqs.awake)return'Here she comes.';
  const b=enemies.find(e=>e.mon==='boss');
  if(b&&!b.dead)return'Keep moving: get out of the violet ring before she slams, shoot her young when they rear up. Her roars open the side rooms.';
  return'Finish her young: the side rooms are open.';
}
function drawHQ(now){
  if(MAPID!=='hq')return;
  const b=enemies.find(e=>e.mon==='boss');if(!b||!hqs.awake)return;
  // her health across the top
  const w=Math.min(300,cw-120),x=(cw-w)/2,y=92,k=Math.max(0,b.hp/b.maxHp);
  ox.fillStyle='rgba(10,8,14,.75)';ox.fillRect(x-2,y-2,w+4,12);ox.fillStyle='#2a1838';ox.fillRect(x,y,w,8);ox.fillStyle=b.dead?'#3a2a44':'#b46cff';ox.fillRect(x,y,w*k,8);
  label('BROOD MOTHER',cw/2,y-10,'#e2c8ff',10,700);
}

"use strict";
/* The Headquarters (Bryan, after v71: "Inside can be a large room with three rooms on each side. Inside the main room will be a
   large (boss) monster with smaller monsters coming out of the rooms. Once they kill all of them it's the players new HQ").
   Its own small map, swapped in like Level 2's (MAPID 'hq'; the big map waits in STASH.out): a long hall with three rooms down
   each side, the way in at the south through an entry hall with a medic station and an ammo drop, and at the far end the Brood
   Mother (a giant centipede: creatures.js) coiled round her clutch. She's awake as the squad comes in; her roar opens two of
   the side rooms and her young come out; at two thirds and a third of her health she roars again and two more open. Walk
   into a side room early and its young are on you there. If she dies first, the rooms left burst open. When nothing is left
   alive the place is the squad's: "Headquarters taken", then the wounded, the scientists brought in, the clean-up and the
   finished HQ (base.js), and the report. No save inside until then: a lost fight
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
let HQ=null,hqs={awake:false,phase:-1,won:false,t0:0,killed:0,pending:[],hatch:[]};
function resetHQ(){hqs={awake:false,phase:-1,won:false,t0:simT,killed:0,pending:[],hatch:[]};hqEnd=null;for(const r of HQ_ROOMS)r.open=false;}   // (a Retry comes back to closed rooms)
// her eggs hatch (Bryan: her young swarm "from the side rooms and from the nest eggs"): n of clutch k burst, a hatchling crawls
// out of each and comes for the squad. Hatchlings are newborn: less to kill (HATCH.hp) and a weaker bite
const HATCH={hp:40,hit:.75,lair:1,room:1};   // (lair: how many her clutch hatches at each roar; enterHQ makes it two for a big squad)
// her young waiting in each side room, for a squad of up to five and a bigger one, and how often another room opens while she
// lives (Bryan, after v91: too easy; a big squad had her down in half a minute with nobody hurt)
const HQ_BROOD={room:1,roomBig:3,every:30};   // (it was 1 and 2, every 40 s)
function hatch(k,n){
  const D=HQ&&HQ.nest&&HQ.nest.userData.eggs;if(!D||MAPID!=='hq'||hqs.won)return;const c=D.clutches[k];if(!c)return;
  const left=[];for(let i=c.a;i<c.b;i++)if(!D.list[i].burst)left.push(i);if(!left.length)return;
  left.sort((i,j)=>D.list[j].y-D.list[i].y);   // (the eggs on top of the heap first)
  for(let q=0;q<n&&q*5<left.length;q++){const e=D.list[left[q*5]];for(let r=0;r<5&&q*5+r<left.length;r++)crEggBurst(HQ.nest,left[q*5+r]);   // (five eggs split for each one that crawls out)
    const tg=players.filter(alive).sort((a,b)=>hyp(a.x-e.x,a.y-e.z)-hyp(b.x-e.x,b.y-e.z))[0],ang=tg?Math.atan2(tg.y-e.z,tg.x-e.x):Math.PI/2;
    const h=hound(e.x+Math.cos(ang)*6,e.z+Math.sin(ang)*6,{kind:'young',hatched:true,ang,hp:HATCH.hp,maxHp:HATCH.hp,againT:simT+1.5});h.hitK=HATCH.hit;}
  sfxMon('mon_snarl',{x:c.x,y:c.z},.9,1.25);if(typeof playSample==='function')playSample('flesh',c.x,c.z,.9);
}
function hatchSoon(k,n,dt){hqs.hatch.push({k,n,at:simT+dt});}
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
  O('wall',390,790,10,140);O('wall',600,790,10,140);O('wall',390,930,80,10);O('wall',530,930,80,10);   // (its south door, x 470-530: the way out to the drawbridge)
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
      m.userData.cleanMat=m.material;m.material=m.material.clone();m.userData.grimed=true;m.material.color.multiplyScalar(o.kind==='ctank'?.16:o.kind==='wall'?.45:.45).lerp(new T.Color(0x2a1c12),o.kind==='wall'?0:.25);}
    const moon=new T.DirectionalLight(0xb0a4ff,.32);moon.position.set(300,600,300);moon.target.position.set(500,0,500);moon.castShadow=true;
    moon.shadow.mapSize.set(1024,1024);Object.assign(moon.shadow.camera,{left:-520,right:520,top:520,bottom:-520,near:50,far:1600});moon.shadow.bias=-0.0008;sc.add(moon,moon.target);
    const pool=[];for(let k=0;k<LAMP_POOL;k++){const p=new T.PointLight(0xffffff,0,100,1.4);sc.add(p);pool.push(p);}
    const mz=[];for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);sc.add(m);mz.push(m);}
    const bl=new T.PointLight(0xffa050,0,280,1.6);sc.add(bl);
    HQ.lights={hemi,moon,lampPool:pool,muzzle:mz,boomL:bl};
  }finally{scene=keep;}
}
// in through the gate (from the gather area at the drawbridge: monsters.js); the scientists and the rest wait outside
function enterHQ(after){   // (after: the fight already over, her and her young dead where they fell: hqAftermath, below)
  const f=$('#fade');if(f){f.hidden=false;void f.offsetWidth;f.classList.add('on');}
  setTimeout(()=>{
    buildHQ();stashOut(players);baseActs();   // (BRING THE SCIENTISTS once the fight's over: base.js)
    useMap({objs:HQ.objs,hq:HQ.hq,slow:[],lamps:HQ.lamps,scene:HQ.scene,lights:HQ.lights});
    tankFires=[];rockets=[];charges=[];
    const live=players.filter(p=>!p.dead&&!p.gone);
    for(const p of players){moveMesh(p,HQ.scene);Object.assign(p,{path:[],peek:null,tk:null,plant:null,supT:null,focus:null,elev:0,vaultK:0,crawl:false,lx:0,ly:0,offMap:false,throwGo:null,medGo:null});}
    live.forEach((p,i)=>{const s=HQ_START[i]||HQ_START[0];p.x=s[0];p.y=s[1];p.ang=-Math.PI/2;});
    units=[...players];MAPID='hq';enemies=[];civs=[];resetHQ();addZones(HQ_REST);
    const keep=scene;scene=HQ.scene;
    try{if(after)hqAftermath(live);
      else{const b=broodMother(500,300);b.ang=Math.PI/2;b.hp=b.maxHp=BOSS.hp+BOSS.perMan*live.filter(p=>!p.downed).length;b.dmgIn=BOSS.dmgIn;
      const per=live.filter(p=>!p.downed).length>5?HQ_BROOD.roomBig:HQ_BROOD.room;   // (a small squad meets one to a room, a big one more; one more hatches from each room's clutch, hatch)
      for(const r of HQ_ROOMS)for(let k=0;k<per;k++){const h=hound((r.x0+r.x1)/2+(k-1)*26,(r.y0+r.y1)/2+(k%2?20:-14),{dormant:true,room:r.id,kind:'young',ang:r.side<0?0:Math.PI});}}
    }finally{scene=keep;}
    contact=false;clearTeams();sel=[];cardGroup=[];if(!after)hqs.wakeAt=simT+.6;hqs.lairN=live.filter(p=>!p.downed).length>5?2:1;   // (she's awake: she roars as they come in, bossThink)
    VB={x0:HQB.x0,z0:HQB.y0,x1:HQB.x1,z1:HQB.y1};FIT.w=HQB.x1-HQB.x0+40;FIT.h=HQB.y1-HQB.y0+40;fitDist();
    zoom=after?frameZoom(300,260):2.0;yaw=0;tilt=0;camT=after?{x:500,z:640}:{x:500,z:800};clampCam();updateCamera();
    updateObjUI();setStatus();buildCards();hud();
    if(!after)bigText('The Headquarters','inbound');   // (after: "Headquarters taken" comes on the next tick, hqTickWin)
    if(f)setTimeout(()=>{f.classList.remove('on');setTimeout(()=>{if(!f.classList.contains('on'))f.hidden=true;},400);},60);
  },380);
}
/* ---------- starting just after her death (save.js's 'won', the Level 4 button; Bryan, after v111: "Can we make the level 4
   start from inside the HQ, so crossing the bridge will be the first time and I can see the sequence after killing the
   monster?"): the hall the way a fight leaves it, her and her young dead where they fell, the side rooms open, the eggs that
   hatched burst open, the squad standing at the hall's south end looking up it; on the next tick hqTickWin finds nothing
   alive and it goes on from "Headquarters taken" as it does after a real fight (the wounded, BRING THE SCIENTISTS, the talk,
   the clean-up: base.js) ---------- */
const HQ_DEAD={mother:[480,596,22,55],young:[[372,668,.3],[420,716,.7],[628,672,2.8],[586,726,2.5],[402,488,.9],[606,502,2.2],[452,560,1.3],[548,612,1.9],[230,700,-.4],[780,452,3],[470,420,1.6],[560,378,1.2],[520,226,1.5],[650,330,2.4],[352,262,.8]],
  squad:[[430,684],[472,678],[516,676],[558,682],[598,690],[450,734],[500,740],[556,744]],slams:[[502,652],[446,628]]};
function hqAftermath(live){   // (from enterHQ, with its scene in place)
  hqs.after=true;hqs.awake=true;hqs.awakeT=simT;hqs.phase=2;for(const r of HQ_ROOMS)r.open=true;
  const r=rng(4112),body=(x,y,ang,L,amp,lam)=>{const c=Math.cos(ang),s=Math.sin(ang),pts=[];for(let d=0;d<=L;d+=2){const w=amp*Math.sin(d/lam);pts.push({x:x-c*d-s*w,y:y-s*d+c*w});}return pts;};   // (a body lying from its head back, bending as it goes)
  const lay=(u,S,pts)=>{u.x=pts[0].x;u.y=pts[0].y;u.ang=Math.atan2(pts[0].y-pts[1].y,pts[0].x-pts[1].x);crTrailInit(u,S,pts);
    Object.assign(u,{dead:true,hp:0,seen:true,alerted:true,dormant:false,diedT:simT-4,path:[]});paintDecal({k:'scorch',x:u.x,y:u.y,r:r()});};
  const[mx,my,ma,ml]=HQ_DEAD.mother,b=broodMother(mx,my);b.maxHp=BOSS.hp+BOSS.perMan*live.length;b.ms='walk';   // her: almost on them, her length back up the hall
  lay(b,MOTHER,body(mx,my,Math.PI/2,MOTHER.head.l+MOTHER.n*MOTHER.seg+40,ma,ml));
  for(const[x,y,a]of HQ_DEAD.young){const h=hound(x,y,{kind:'young',ang:a});lay(h,BROOD,body(x,y,a,BROOD.head.l+BROOD.n*BROOD.seg+32,(r()<.5?-1:1)*(3+r()*5),12+r()*8));}
  for(const[x,y]of HQ_DEAD.slams)paintDecal({k:'scorch',x,y,r:r()});   // (where she slammed)
  const D=HQ.nest&&HQ.nest.userData.eggs,gone=(k,n)=>{const c=D&&D.clutches[k];if(!c)return;const left=[];for(let i=c.a;i<c.b;i++)if(!D.list[i].burst)left.push(i);
    left.sort((i,j)=>D.list[j].y-D.list[i].y);for(let q=0;q<Math.min(left.length,n*5);q++)crEggBurst(HQ.nest,left[q]);};   // (what hatched: five eggs split for each, as in hatch)
  gone(0,3*(live.length>5?2:1));for(let k=3;k<3+HQ_ROOMS.length;k++)gone(k,HATCH.room);
  const taken=[];live.forEach((p,i)=>{const q=HQ_DEAD.squad[i%HQ_DEAD.squad.length],t=openSpot(q[0],q[1],taken)||{x:q[0],y:q[1]};taken.push(t);p.x=t.x;p.y=t.y;p.ang=-Math.PI/2;});
}
function leaveHQNow(){   // back to the big map at once (a Retry, a New game)
  if(MAPID!=='hq')return;const out=STASH.out;hqEnd=null;base=null;$('#app').classList.remove('cine');if(typeof talkStop==='function')talkStop();
  for(const u of units)if(u.side!=='P'&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';curFloor='GF';floorChip();
  for(const p of players){p.offMap=false;moveMesh(p,out.scene);}
  units=[...out.units,...players.filter(p=>!out.units.includes(p))];enemies=units.filter(u=>u.side==='E');civs=units.filter(u=>u.side==='C');
  VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();disposeHQ();
}
function openRoom(r,quiet){
  if(r.open)return;r.open=true;
  const hs=enemies.filter(e=>e.room===r.id&&e.dormant);for(const h of hs){h.dormant=false;h.againT=simT+.8+Math.random();h.growlT=simT+Math.random()*2;}
  if(!quiet&&hs[0])sfxMon('mon_scream',hs[0],1,.85);
  hatchSoon(3+HQ_ROOMS.indexOf(r),HATCH.room,.9+Math.random());   // (the room's own clutch hatches too)
}
// the Brood Mother (from monTick in monsters.js)
function bossThink(u,dt){
  const inHall=p=>alive(p)&&p.x>HQ_HALL.x0&&p.x<HQ_HALL.x1&&p.y>HQ_HALL.y0&&p.y<HQ_HALL.y1;
  for(const r of HQ_ROOMS)if(!r.open&&players.some(p=>alive(p)&&p.x>r.x0&&p.x<r.x1&&p.y>r.y0&&p.y<r.y1))openRoom(r);   // walked in on them
  if(u.ms==='sleep'){if(simT>=(hqs.wakeAt??1e9)||players.some(inHall)||u.hp<u.maxHp)bossRoar(u,0);return;}   // (Bryan: awake when they come in: she roared at the drawbridge, she knows they're coming)
  if(hqs.awakeT&&simT>(hqs.nextRoomT||0)){hqs.nextRoomT=simT+HQ_BROOD.every;const r=HQ_ROOMS.find(q=>!q.open);if(r)openRoom(r);}   // and every HQ_BROOD.every s another room, whatever her health
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
  if(!hqs.awake){hqs.awake=true;hqs.awakeT=simT;hqs.nextRoomT=simT+HQ_BROOD.every;if(typeof startContact==='function')startContact('',false,null,true);}   // (no words on screen as she comes: Bryan)
  for(const r of HQ_ROOMS)if(r.phase===phase)openSoon(r,.7+Math.random()*.6);
  hatchSoon(0,hqs.lairN||HATCH.lair,1.2+Math.random()*.8);   // (her clutch answers her: one, two for a big squad)
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
  if(MAPID!=='hq'||state!=='play')return;
  if(hqs.won){hqEndTick();return;}
  for(const p of hqs.pending.slice())if(simT>=p.at){hqs.pending.splice(hqs.pending.indexOf(p),1);openRoom(p.r);}
  for(const h of hqs.hatch.slice())if(simT>=h.at){hqs.hatch.splice(hqs.hatch.indexOf(h),1);hatch(h.k,h.n);}
  if(enemies.some(e=>e.mon&&!e.dead))return;if(!enemies.some(e=>e.mon==='boss'))return;
  hqs.won=true;hqs.wonT=simT;obj=6;objCompleted(4);updateObjUI();setStatus();hud();bigText('Headquarters taken','complete');   // (setStatus: the chip off "Bridge down" when no fight set it, the start at her death)
  setTimeout(()=>{if(state==='play'&&MAPID==='hq'&&!hqEnd)banner(anyDown()?'It’s over. Get the wounded up, then send someone for the scientists.':'It’s over. Send someone out for the scientists.',4200);},OBJ_LIST_T+300);   // (the player's turn now: base.js)
}
/* ---------- the end (Bryan, after v85: "one of the surviving soldiers exits the HQ off screen and returns with the
   scientist. Then a sequence happens."; after v94: the player gets the wounded up and sends someone for the scientists, and
   "When the scientists come in, they all walk to the center while the conversation is happening"): the soldier the player
   sends (BRING THE SCIENTISTS: base.js's startFetch) goes out of the entry hall's south door for the scientists left tied
   on the drawbridge and brings them in; as they come in everyone walks to the middle of the hall and they talk (story.js's
   panel); then base.js's montage and the finished HQ. No orders from the moment he's sent (endingBusy: input.js, hud.js);
   nobody bleeds out once the fight's over (hqCalm: combat.js). ---------- */
const HQ_DOOR={x:500,y:922},HQ_OUT={x:500,y:974},HQ_SCI={x:500,y:893};   // (the door out of the entry hall, the dark beyond it, where the scientist stops)
// the conversation: a draft for Bryan (who, the words); clips hqend_1.. once it's voiced
const HQ_TALK=[['sci',"She's dead. You actually killed her."],['lead',"No thanks to you. Start talking."],
  ['sci',"She was the first. They wanted a weapon nothing could stop, so we bred one."],
  ['sci',"Then she started laying eggs on her own. We lost the whole building in a week."],
  ['other',"So you sealed the doors and left her in here."],['sci',"It was that or let her out."],
  ['lead',"This place is ours now. It's our headquarters."],['lead',"And you're going to help us run it."],
  ['sci',"Why would I help you?"],['lead',"Because the next thing that hatches won't care whose side you're on."],
  ['sci',"Fine. What do you need?"],['lead',"Power. A working lab. And everything you know about those things."]];
let hqEnd=null;
const endingBusy=()=>!!hqEnd&&hqEnd.ph!=='done'||roadBusy();   // (and the road east's first look and talk: road.js)
function hqEndTick(){   // (every tick once she's dead: hqTickWin)
  const E=hqEnd;if(!E||E.ph!=='out')return;const f=E.fetch;
  if(!f.away&&(f.y>946||simT-E.t>14)){f.away=true;f.path=[];E.t=simT;}   // out of the door, into the dark
  if(!f.away||simT-E.t<2.4)return;
  E.ph='talk';E.t=simT;f.away=false;f.x=HQ_OUT.x;f.y=HQ_OUT.y-6;f.ang=-Math.PI/2;f.path=[{x:HQ_DOOR.x,y:HQ_DOOR.y}];f.lastOrder=simT;
  E.sci=E.tied.map((o,i)=>{const d=[[0,0],[-24,16],[24,16],[0,30]][i%4],u=sciCopy(o,HQ_OUT.x+d[0],HQ_OUT.y+16+d[1],-Math.PI/2);   // (back with him: the ones tied on the drawbridge)
    u.path=[{x:HQ_DOOR.x+d[0]*.4,y:HQ_DOOR.y+6},{x:HQ_DOOR.x+d[0]*.4,y:HQ_DOOR.y-10}];return u;});
  walkToMid(E);   // in through the door and on to the middle of the hall, everyone, while they talk (base.js)
  const s0=E.sci[0],who={sci:s0,lead:E.lead,other:E.other},to={sci:E.lead,lead:s0,other:s0};
  const lines=HQ_TALK.map(([k,t],i)=>({who:who[k],to:to[k],text:t,clip:`hqend_${i+1}`}));
  const crew=players.filter(p=>p.joined&&!p.dead),boss=!E.lead.joined?E.lead:players.find(p=>!p.joined&&!p.dead&&!p.offMap);
  if(crew.length&&boss&&crewStays()){const n=crew.map(p=>p.name),c0=crew.find(p=>p.id==='B4')||crew[0];   // the freed men stay on as its crew (base.js; Bryan, after v109)
    lines.push({who:boss,to:c0,text:`${n.length>1?n.slice(0,-1).join(', ')+' and '+n[n.length-1]:n[0]}: you stay here. Fix this place up and get it running.`},
      {who:c0,to:boss,text:"We'll have it running by the time you're back."});}
  talkStart(lines,()=>{E.ph='montage';E.done();});
}
function hqHint(){
  if(MAPID!=='hq')return'';
  if(hqs.won){if(HQ&&HQ.base){if(HQ.floors&&curFloor!=='GF')return hqFloorHint();
    const n=civs.filter(c=>c.crew&&!c.dead).length,rooms=n?`The freed men are fixing up ${n===1?'one of the side rooms':n+' of the side rooms'}; the other ${6-n} ${6-n===1?'is':'are'} empty for now.`:'The six side rooms are empty for now.';   // (the crew: base.js)
    return`Your Headquarters: the command center, the medic table and the supply table. ${rooms} ${HQ.floors?'The stairs and the lift at the north end go up to the second floor and the roof. ':''}Gather everyone at the south door to go out.`;}
    if(hqEnd)return'';
    return anyDown()?'Get the wounded up: a soldier beside a downed man brings him round while his bar lasts; once it has run out (CRITICAL) it takes a medic kit, or carry him to the medic station. Nobody bleeds out now.':'Send someone for the scientists: select a soldier, then tap BRING THE SCIENTISTS at the south door.';}
  if(!hqs.awake)return'Here she comes.';
  const b=enemies.find(e=>e.mon==='boss');
  if(b&&!b.dead)return'Keep moving: get out of the violet ring before she slams, shoot her young when they rear up. Her roars open the side rooms and hatch her eggs.';
  return'Finish her young: the side rooms are open.';
}
function drawHQ(now){
  if(MAPID!=='hq')return;drawBase(now);
  const b=enemies.find(e=>e.mon==='boss');if(!b||!hqs.awake||hqs.won)return;
  // her health across the top
  const w=Math.min(300,cw-120),x=(cw-w)/2,y=92,k=Math.max(0,b.hp/b.maxHp);
  ox.fillStyle='rgba(10,8,14,.75)';ox.fillRect(x-2,y-2,w+4,12);ox.fillStyle='#2a1838';ox.fillRect(x,y,w,8);ox.fillStyle=b.dead?'#3a2a44':'#b46cff';ox.fillRect(x,y,w*k,8);
  label('BROOD MOTHER',cw/2,y-10,'#e2c8ff',10,700);
}

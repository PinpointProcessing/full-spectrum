"use strict";
/* The Headquarters once it's taken (Bryan, after v94: "when the match is over. The player should revive any downed unit, if
   their save bar hasn't depleted, remember only a medic can revive when it's depleted completely, so if one managed to survive
   they can survive them all. Then the player should send someone to go get the scientist. When the scientists come in, they
   all walk to the center while the conversation is happening. Then after the conversation the screen shows a montage of the
   units and scientists cleaning the HQ. It then goes to the complete HQ which has a command center, medic table, supply
   table. Then we can talk about adding some new stations and rooms."):
   - after the fight nobody bleeds out (hqCalm, read by combat.js), so whoever's down can be got up the usual way: a teammate
     beside him while his bar lasts, a medic kit once he's critical, or carry him to the medic station;
   - then BRING THE SCIENTISTS at the entry hall's south door (a thing to use, interior.js's ACTS; not while anyone's still
     down): the soldier sent goes out into the dark and comes back with the scientists left tied on the drawbridge
     (fortress.js's hqEndTick), and as they come in everyone walks to the middle of the hall while they talk (story.js);
   - then the montage: four shots with a fade between them while the nest comes away (the eggs, the resin, the slime rocks;
     the floor clean, the fittings clean, the lights on), the squad and the scientists at work in each;
   - then the finished HQ (makeBase): the hall clean and lit, the debris gone, a command center in the middle, a medic table
     and a supply table (they heal and restock like the stations), the side rooms empty for what comes next but the ones the
     freed men are fixing up (the crew, below); "Mission complete!" and the report; and a save ('base') so Continue comes back
     to it (enterBase). */
const HQ_MID={x:500,y:600};   // the middle of the hall, where everyone gathers while they talk
const BASE_ST={cmd:{x:500,y:468,w:64,h:34},med:{x:400,y:744},sup:{x:600,y:744}};   // the command center, the medic table, the supply table
let base=null;   // the montage while it plays ({t0, i}), then {done:true} once the HQ is finished
let hqStaff=[];   // the scientists who work there now ({id, name, sciN}): the ones brought in, or as many as came out of the data center
let hqCrew=[];   // the freed men who stay on as its crew ({id, name}), from the clean-up's end on (below)
let aarCrew=[];   // this mission's freed men once they're crew (or lost): still on its report (progress.js)

const hqCalm=()=>MAPID==='hq'&&hqs.won;   // (the fight's over: nobody bleeds out, combat.js)
const cineOn=()=>!!(base&&base.cine);   // (the montage: no HUD, nothing drawn over the picture, nobody talking: overlay.js, monsters.js)
const tiedSci=()=>{const out=STASH.out;return out?out.units.filter(u=>u.sci&&u.railed&&!u.dead):[];};
const anyDown=()=>players.some(p=>p.downed&&!p.dead&&!p.offMap);

// a scientist brought into the Headquarters: a new figure for one left outside (STASH.out)
function sciCopy(o,x,y,ang){
  const u=mk('C','C',o.id,o.name,x,y,ang);
  Object.assign(u,{kind:'sci',sci:true,sciN:o.sciN,detained:true,weapon:null,grenade:0,spec:null,specN:0,pleadT:simT+1e6,hold:{ang}});
  makePerson(u);civs.push(u);return u;   // (mk has put him in units already)
}

/* ---------- after the fight: the wounded, then someone out for the scientists ---------- */
function baseActs(){   // (from enterHQ: fortress.js)
  for(let i=ACTS.length-1;i>=0;i--)if(ACTS[i].map==='hq')ACTS.splice(i,1);
  ACTS.push({id:'fetchsci',map:'hq',x:HQ_DOOR.x,y:HQ_DOOR.y-12,r:20,standY:2,secs:.3,solo:true,label:'BRING THE SCIENTISTS',
    avail:()=>hqs.won&&!hqEnd&&tiedSci().length>0,need:()=>anyDown()?'Get the wounded up first.':null,act:u=>startFetch(u)});
}
function startFetch(f){   // he goes out of the south door into the dark (fortress.js's hqEndTick brings him back with them)
  if(hqEnd||!hqs.won||!alive(f))return;const tied=tiedSci(),up=players.filter(p=>alive(p)&&!p.offMap&&!p.away);if(!tied.length)return;
  const lead=['A1','B1'].map(id=>up.find(p=>p.id===id&&p!==f)).find(Boolean)||up.find(p=>p!==f)||f;
  const other=['A2','B2','B1','A3','A4','B3','B4'].map(id=>up.find(p=>p.id===id&&p!==lead&&p!==f)).find(Boolean)||up.find(p=>p!==lead&&p!==f)||f;
  select([]);preview=null;mode=null;f.ret=null;
  hqEnd={ph:'out',t:simT,done:montageStart,tied,lead,fetch:f,other,sci:[]};
  f.path=[...(findPath(f.x,f.y,HQ_DOOR.x,HQ_DOOR.y)||[]),{x:HQ_OUT.x,y:HQ_OUT.y}];f.lastOrder=simT;
  callout(f,'Bringing them in.',C.good);
  camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:500,z:880,zoom:2.6},t:0,dur:1.4};
}
// as they come in: the scientists to the middle of the hall, facing the squad, and the squad in an arc in front of them
function walkToMid(E){
  const taken=[],up=players.filter(p=>alive(p)&&!p.offMap&&!p.away).sort((a,b)=>(b===E.lead)-(a===E.lead));
  E.sci.forEach((s,i)=>{const d=[[0,-22],[-30,-10],[30,-10],[0,-50]][i%4],t=openSpot(HQ_MID.x+d[0],HQ_MID.y+d[1],taken)||{x:HQ_MID.x+d[0],y:HQ_MID.y+d[1]};taken.push(t);
    s.path=[...s.path,...(findPath(HQ_DOOR.x,HQ_DOOR.y-10,t.x,t.y,FOOT)||[{x:t.x,y:t.y}])];s.hold={ang:Math.PI/2};});
  up.forEach((p,i)=>{const k=i?(i%2?1:-1)*Math.ceil(i/2):0,a=Math.PI/2+k*.4,t=openSpot(HQ_MID.x+Math.cos(a)*64,HQ_MID.y+10+Math.sin(a)*50,taken)||{x:p.x,y:p.y};taken.push(t);
    p.path=findPath(p.x,p.y,t.x,t.y)||[];p.lastOrder=simT;p.ret=null;});
  camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:HQ_MID.x,z:HQ_MID.y+90,zoom:2.1},t:0,dur:6};
}

/* ---------- the montage ---------- */
function fadeTo(on){const el=$('#fade');if(!el)return;if(on){el.hidden=false;void el.offsetWidth;el.classList.add('on');}else{el.classList.remove('on');setTimeout(()=>{if(!el.classList.contains('on'))el.hidden=true;},400);}}
const workers=()=>[...players.filter(p=>alive(p)&&!p.offMap),...civs.filter(c=>c.sci&&!c.dead)];
function setWork(list){   // [u, x, y, facing, 'kneel'|'stand'|null]: where each one is and what he's doing in this shot
  for(const[u,x,y,ang,w]of list){u.x=x;u.y=y;u.path=[];u.ang=ang;u.work=w||null;if(u.hold)u.hold={ang};}
}
function ringAround(cx,cy,R,a0,a1,list,w,rr=R){   // spread them round a point, each facing it
  const n=list.length;return list.map((u,i)=>{const a=n>1?a0+(a1-a0)*i/(n-1):(a0+a1)/2,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*rr;return[u,x,y,Math.atan2(cy-y,cx-x),w];});
}
function addLamp(x,y,i,d,c,head,h=34){   // (into the Headquarters' list and the one in play: scene.js's lamp pool lights the nearest)
  const L={x,y,h,c:c||0xfff0de,i,d};HQ.lamps.push(L);if(lamps!==HQ.lamps)lamps.push(L);
  if(head){const hd=new T.Mesh(new T.BoxGeometry(8,1.5,3),new T.MeshBasicMaterial({color:L.c,toneMapped:false}));hd.position.set(x,h+1,y);HQ.scene.add(hd);L.head=hd;}return L;
}
function camShot(x,z,zm,yw,tl){camPan=null;camT={x,z};zoom=zm;yaw=yw||0;tilt=tl||0;clampCam();updateCamera();}
// 1. her lair: they clear the clutch, the eggs coming away a few at a time
function shotLair(){
  const W=workers(),L={x:500,y:212};setWork(ringAround(L.x,L.y,66,.12*Math.PI,.88*Math.PI,W,'kneel',58));
  const D=HQ.nest&&HQ.nest.userData.eggs;base.eggs=D?D.list.map((e,i)=>i).sort(()=>Math.random()-.5):[];base.eggN=base.eggs.length;
  base.work=[addLamp(500,250,2.4,300,0xe8eeff,false,46)];if(HQ.lights&&HQ.lights.hemi)HQ.lights.hemi.intensity=HQ.lights.hemi.userData.base=.45;   // (work lights brought in)
  camShot(500,262,3.6,.18,.3);
}
// 2. a side room and the hall's wall: the resin scraped off, the slime rocks broken up and carried away
function shotRooms(){
  const W=workers(),q=HQ_ROOMS.find(r=>r.id==='W2'),list=[];
  W.forEach((u,i)=>{let s;
    if(i<4)s=[u,q.x0+40+i*44,q.y0+22,-Math.PI/2,'stand'];   // along the room's north wall
    else if(i<6)s=[u,q.x0+20,q.y0+70+(i-4)*60,Math.PI,'stand'];   // its west wall
    else if(i<9)s=[u,q.x0+70+(i-6)*50,q.y1-40,Math.PI/2,'kneel'];   // the floor by the south wall
    else s=[u,HQ_HALL.x0+18,q.y0+40+(i-9)*40,Math.PI,'stand'];   // the hall's side of the wall
    list.push(s);});
  setWork(list);base.fadeObjs=[HQ.nest&&HQ.nest.children.filter(c=>c!==(HQ.nest.userData.eggs&&HQ.nest.userData.eggs.mesh)),HQ.nest&&HQ.nest.userData.rocks].flat().filter(Boolean);
  base.work.push(addLamp(q.x0+110,q.y0+100,2.2,260,0xe8eeff,false,44));
  camShot(240,520,2.8,-.32,.22);
}
// 3. the hall: the lights coming back on one by one, the scientists at the old consoles, the squad hauling the debris out
function shotHall(){
  const W=workers(),sci=W.filter(u=>u.sci),men=W.filter(u=>!u.sci),list=[];
  sci.forEach((u,i)=>list.push([u,[452,532,410,592][i%4],[348,348,360,360][i%4],-Math.PI/2,'stand']));
  setWork(list);
  men.forEach((u,i)=>{const x=410+(i%4)*60,y=360+Math.floor(i/4)*120;u.x=x;u.y=y;u.work=null;u.path=findPath(x,y,470+(i%3)*30,840)||[];u.lastOrder=simT;});
  for(const L of base.work||[])L.off=true;base.lit=0;base.litT=simT;camShot(500,640,1.9,0,.15);
}
// 4. done: the finished HQ, everyone about it
function shotReveal(){
  const W=workers(),sci=W.filter(u=>u.sci),men=W.filter(u=>!u.sci&&!(u.joined&&crewStays())),c=BASE_ST.cmd,list=[];
  for(const u of W)if(u.joined&&crewStays()){const s=crewSpot(u.id);list.push([u,s.x,s.y,s.ang,s.work]);}   // the freed men each at work in a side room of his own (the crew, below)
  sci.forEach((u,i)=>list.push([u,[476,524,452,548][i%4],[c.y-c.h/2-18,c.y-c.h/2-18,c.y-c.h/2-6,c.y-c.h/2-6][i%4],Math.PI/2,i<2?'stand':null]));   // at the screens
  const spots=[[BASE_ST.sup.x-12,BASE_ST.sup.y-20,Math.PI/2,'stand'],[BASE_ST.med.x+4,BASE_ST.med.y-20,Math.PI/2,'stand'],[BASE_ST.sup.x+18,BASE_ST.sup.y-22,Math.PI/2,null]];
  men.forEach((u,i)=>{if(i<spots.length&&men.length>4){const s=spots[i];list.push([u,s[0],s[1],s[2],s[3]]);return;}
    const k=men.length>4?i-spots.length:i,n=men.length>4?men.length-spots.length:men.length,a=-.12*Math.PI+1.24*Math.PI*(n>1?k/(n-1):.5),x=c.x+Math.cos(a)*62,y=c.y+Math.sin(a)*40;
    list.push([u,x,y,Math.atan2(c.y-y,c.x-x),null]);});
  setWork(list);camShot(500,560,2.3,0,.2);
}
const MONTAGE=[
  [0,()=>fadeTo(true)],
  [.6,()=>{clearCorpses();shotLair();fadeTo(false);}],
  [4.6,()=>fadeTo(true)],
  [5.2,()=>{shotRooms();fadeTo(false);}],
  [9.2,()=>fadeTo(true)],
  [9.8,()=>{nestGone();cleanFloor();cleanFittings();clearDebris();shotHall();fadeTo(false);}],
  [14.2,()=>fadeTo(true)],
  [14.8,()=>{makeBase();shotReveal();fadeTo(false);}],
  [20.5,()=>montageEnd()]];
function montageStart(){   // (the conversation's over: fortress.js's hqEndTick)
  if(hqEnd)hqEnd.ph='montage';if(typeof talkStop==='function')talkStop();select([]);preview=null;mode=null;
  base={t0:simT,i:0,cine:true};$('#app').classList.add('cine');
}
function montageEnd(){
  base={done:true};$('#app').classList.remove('cine');for(const u of units)u.work=null;for(const c of civs)if(c.sci)c.staff=true;   // (HQ staff now: office.js draws no DETAINED over them)
  hqStaff=civs.filter(c=>c.sci&&!c.dead).map(c=>({id:c.id,name:c.name,sciN:c.sciN}));
  crewUp();   // the freed men stay on: its crew from now (below)
  if(hqEnd)hqEnd.ph='done';saveGame('base');updateObjUI();hud();
  if(state==='play'&&!hqs.after)endAt=performance.now()+1200;   // "Mission complete!" and the report (hud.js's finish)
  else if(state==='play'){aarCrew=[];setTimeout(()=>{if(state==='play'&&MAPID==='hq'&&!cineOn())banner('The Headquarters is yours. Gather everyone at the south door to go out.',4200);},700);}   // (begun at her death, the Level 4 button: no fight played, so no report; on to the road east: road.js)
}
function baseTick(dt){   // (every tick: combat.js's update)
  if(MAPID!=='hq')return;
  if(hqs.won)useTick(dt);   // (BRING THE SCIENTISTS: interior.js)
  hqFloorTick();   // (the stairs and the lift: hqfloors.js)
  if(hqs.won&&!hqEnd&&!base&&!tiedSci().length&&!anyDown()&&simT-(hqs.wonT||0)>5){hqEnd={ph:'montage',t:simT,sci:[]};montageStart();return;}   // (nobody left on the drawbridge to fetch: straight on to the clean-up)
  const b=base;if(!b||!b.cine)return;const t=simT-b.t0;
  while(b.i<MONTAGE.length&&t>=MONTAGE[b.i][0]){MONTAGE[b.i][1]();b.i++;if(base!==b)return;}
  if(b.eggs&&b.eggs.length&&t<4.6){const D=HQ.nest&&HQ.nest.userData.eggs;if(D){const want=Math.ceil(b.eggN*Math.min(1,(t-.6)/3.4)),m4=new T.Matrix4().makeScale(0,0,0);
    while(b.eggN-b.eggs.length<want){D.mesh.setMatrixAt(b.eggs.pop(),m4);}D.mesh.instanceMatrix.needsUpdate=true;}}
  if(b.fadeObjs&&t>=5.2&&t<9.8)fadeOut(b.fadeObjs,1-Math.min(1,(t-5.6)/3));
  if(b.lit!=null&&t>=9.8&&t<14.2){const n=Math.min(HQ.lamps.length,Math.floor((simT-b.litT)/.35));while(b.lit<n)lampOn(HQ.lamps[b.lit++]);}
  if(t>=14.8){zoom=Math.max(1.55,zoom-dt*.14);camT.z+=dt*5;}else camT.z+=dt*2.2;clampCam();updateCamera();   // (a slow drift through each shot; the last pulls back over the finished hall)
}
// pieces of the nest fading out (their own copies of the materials, so nothing else that shares one fades with them)
function fadeOut(list,k){
  for(const root of list)root.traverse(o=>{if(!o.isMesh)return;
    if(!o.userData.fadeMat){o.material=o.material.clone();o.material.transparent=true;o.userData.fadeMat=true;}
    o.material.opacity=Math.max(0,k);o.material.depthWrite=k>.95;o.visible=k>.01;});
}
function clearCorpses(){   // the bodies carried out
  for(const e of units)if(e.mon&&e.m&&e.m.g&&e.m.g.parent)e.m.g.parent.remove(e.m.g);
  units=units.filter(u=>!u.mon);enemies=enemies.filter(e=>!e.mon);
}
function nestGone(){if(HQ.nest){HQ.nest.visible=false;if(HQ.nest.userData.rocks)HQ.nest.userData.rocks.visible=false;}}
function cleanFittings(){if(!HQ.scene)return;HQ.scene.traverse(m=>{if(m.userData&&m.userData.cleanMat){m.material=m.userData.cleanMat;delete m.userData.cleanMat;}});}
function lampOn(L){L.c=0xfff0de;L.i=Math.max(L.i,1.5);L.d=Math.max(L.d,240);L.flick=0;if(L.head)L.head.material.color.setHex(0xfff0de);}
function clearDebris(){   // the overturned crates and barrels in the hall and the rooms: hauled out
  const gone=objs.filter(o=>(o.kind==='crate'||o.kind==='barrel')&&!o.base);
  for(const o of gone)for(const m of o.meshes||[])if(m.parent)m.parent.remove(m);
  const keep=objs.filter(o=>!gone.includes(o));objs.length=0;objs.push(...keep);HQ.objs=keep.slice();rebuildNav();
}
// the floor: sealed concrete, the slabs' joints, a little wear, hazard stripes at the doorways, a ring round the command center
function paintBaseGround(g){
  const S=1.2,r=rng(5150);g.setTransform(S,0,0,S,-HQB.x0*S,-HQB.y0*S);
  g.fillStyle='#121315';g.fillRect(HQB.x0,HQB.y0,HQB.x1-HQB.x0,HQB.y1-HQB.y0);
  const slab=(x0,y0,x1,y1,c,step)=>{g.fillStyle=c;g.fillRect(x0,y0,x1-x0,y1-y0);g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=1;
    for(let x=x0;x<=x1;x+=step){g.beginPath();g.moveTo(x,y0);g.lineTo(x,y1);g.stroke();}for(let y=y0;y<=y1;y+=step){g.beginPath();g.moveTo(x0,y);g.lineTo(x1,y);g.stroke();}};
  slab(340,140,660,780,'#4e5255',40);for(const q of HQ_ROOMS)slab(q.x0,q.y0,q.x1,q.y1,'#46494c',30);slab(400,790,600,930,'#55585b',20);
  for(let i=0;i<220;i++){const x=120+r()*760,y=150+r()*780,rr=4+r()*20,gr=g.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,'rgba(18,20,22,.12)');gr.addColorStop(1,'rgba(18,20,22,0)');g.fillStyle=gr;g.fillRect(x-rr,y-rr,rr*2,rr*2);}
  const stripes=(x,y,w,h)=>{g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.fillStyle='rgba(214,170,46,.7)';g.fillRect(x,y,w,h);g.fillStyle='rgba(20,20,20,.85)';
    for(let k=-h-w;k<w+h;k+=8){g.beginPath();g.moveTo(x+k,y);g.lineTo(x+k+4,y);g.lineTo(x+k+4+h,y+h);g.lineTo(x+k+h,y+h);g.fill();}g.restore();};
  for(const q of HQ_ROOMS)stripes(q.door.x-(q.side<0?12:-2),q.door.y-24,10,48);stripes(470,780,60,8);stripes(470,922,60,8);
  const c=BASE_ST.cmd;g.strokeStyle='rgba(120,200,220,.35)';g.lineWidth=2;g.beginPath();g.arc(c.x,c.y,64,0,7);g.stroke();g.setLineDash([6,6]);g.beginPath();g.arc(c.x,c.y,74,0,7);g.stroke();g.setLineDash([]);
}
function cleanFloor(){if(!HQ||!HQ.tex)return;paintBaseGround(HQ.tex.image.getContext('2d'));HQ.tex.needsUpdate=true;}

/* ---------- the crew (Bryan, after v109: "I think we should have the new soldiers stay back and 'repair' and establish the
   base. I think the 2 4-unit squads are overkill and can be used for large battles/missions"; his answers: they stay once the
   HQ is taken, and work in the empty rooms). The freed men fight to the end of Level 3; in the clean-up's last shot each is at
   work in a side room of his own, and from its end they're the Headquarters' crew: people, not soldiers (no card, not
   selectable, nobody's target), at work there whenever the squad comes in. From the road east on it's the original four.
   If none of the four is left alive, the freed men go on as the squad instead. ---------- */
const CREW_ROOM={A3:'W2',A4:'W3',B3:'E2',B4:'E3'};   // Alpha's two on the west side, Bravo's two on the east; the north pair stay empty
const crewStays=()=>players.some(p=>!p.joined&&!p.dead);
function crewSpot(id){   // at his room's outer wall, kneeling or standing at it
  const q=HQ_ROOMS.find(r=>r.id===CREW_ROOM[id])||HQ_ROOMS[0],w=q.side<0,k=['A3','A4','B3','B4'].indexOf(id);
  return{q,x:w?q.x0+30:q.x1-30,y:(q.y0+q.y1)/2+(k%2?-24:24),ang:w?Math.PI:0,work:k===0||k===3?'kneel':'stand'};
}
function crewPost(u){const s=crewSpot(u.id);return Object.assign(u,{x:s.x,y:s.y,ang:s.ang,path:[],work:s.work,room:s.q.id,crew:true,staff:true});}
function crewUp(){   // (the clean-up's over: montageEnd) the freed men stay
  const men=players.filter(p=>p.joined);if(!men.length||!crewStays())return;
  aarCrew=men.slice();players=players.filter(p=>!p.joined);sel=sel.filter(p=>!p.joined);cardGroup=cardGroup.filter(p=>!p.joined);
  for(const u of men){
    if(u.dead){if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);units=units.filter(q=>q!==u);continue;}   // (the lost: carried out with the rest)
    Object.assign(u,{side:'C',cell:null,strapped:false,weapon:null,weapon2:null,gl:false,grenade:0,carry:null,carriedBy:null,ret:null,focus:null,supT:null,throwGo:null,medGo:null,carryGo:null,loot:null,lift:null,away:false,peek:null});
    crewPost(u);if(!civs.includes(u))civs.push(u);
    if(u.m){u.m.ring.material.color.set('#9aa3a8');figRefresh(u);}   // (a person's grey ring; his rifle put away)
  }
  hqCrew=men.filter(u=>!u.dead).map(u=>({id:u.id,name:u.name}));buildCards();floorChip();   // (four cards, four dots on the floor chip)
}
function crewCopy(o){   // one of the crew at work in his room (a Continue, or the squad back in from outside: enterBase)
  const u=mk('C',/^A/.test(o.id)?'A':'B',o.id,o.name,0,0,0);
  Object.assign(u,{kind:'prisoner',freed:true,weapon:null,grenade:0,spec:null,specN:0,charges:0});
  crewPost(u);makePerson(u);civs.push(u);return u;
}

/* ---------- the finished HQ ---------- */
function makeBase(){
  if(!HQ||HQ.base)return;HQ.base=true;
  nestGone();cleanFittings();cleanFloor();clearDebris();clearCorpses();for(const L of HQ.lamps)lampOn(L);
  if(HQ.lights&&HQ.lights.hemi){HQ.lights.hemi.intensity=HQ.lights.hemi.userData.base=.75;}if(HQ.lights&&HQ.lights.moon)HQ.lights.moon.intensity=.45;
  for(const L of HQ.lamps)if(L.h>40)L.off=true;   // (the montage's work lights)
  addLamp(BASE_ST.cmd.x,BASE_ST.cmd.y,2.2,240,0xfff0de,true);addLamp(BASE_ST.med.x,BASE_ST.med.y,1.9,200,0xf2f8ff,true);addLamp(BASE_ST.sup.x,BASE_ST.sup.y,1.9,200,0xfff0de,true);
  for(const q of HQ_ROOMS)addLamp((q.x0+q.x1)/2,(q.y0+q.y1)/2,1.2,190,0xdfe8ff,true,30);
  for(const z of HQ_ZONES)if(z.mesh&&z.mesh.parent)z.mesh.parent.remove(z.mesh);HQ_ZONES.length=0;   // (the field stations in the entry hall: the tables take over)
  const c=BASE_ST.cmd,O=(x,y,w,h)=>({kind:'crate',x,y,w,h,full:false,base:true});
  objs.push(O(c.x-c.w/2,c.y-c.h/2,c.w,c.h),O(c.x-34,c.y-c.h/2-8,68,4),O(BASE_ST.med.x-17,BASE_ST.med.y-7,34,14),O(BASE_ST.sup.x-20,BASE_ST.sup.y-8,40,16));HQ.objs=objs.slice();rebuildNav();
  const keep=scene;scene=HQ.scene;try{cmdMesh();medMesh();supMesh();}finally{scene=keep;}
  addZones([{k:'med',x:BASE_ST.med.x,y:BASE_ST.med.y,label:'MEDIC TABLE',noMesh:true},{k:'sup',x:BASE_ST.sup.x,y:BASE_ST.sup.y,label:'SUPPLY TABLE',noMesh:true}]);
  hqFloorsBuild();   // the stairs and the lift where her lair was, the second floor and the roof (hqfloors.js)
}
const bBox=(g,w,h,d,m,x,y,z,ry)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);if(ry)o.rotation.y=ry;o.castShadow=o.receiveShadow=true;g.add(o);return o;};
const bLit=(tex,w,h)=>new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,toneMapped:false}));
// the command center: a map table that lights up, three screens on a rail behind it, chairs round it
function cmdMesh(){
  const c=BASE_ST.cmd,g=new T.Group();g.position.set(c.x,0,c.y);
  const dark=new T.MeshStandardMaterial({color:0x1d2227,roughness:.6,metalness:.4}),metal=new T.MeshStandardMaterial({color:0x5a6168,roughness:.4,metalness:.7}),seat=new T.MeshStandardMaterial({color:0x2c3136,roughness:.8});
  bBox(g,c.w,1.6,c.h,dark,0,8.2,0);bBox(g,c.w-10,7,c.h-10,dark,0,4,0);
  const map=bLit(canvasTex(256,136,(x,w,h)=>{x.fillStyle='#06191c';x.fillRect(0,0,w,h);x.strokeStyle='rgba(80,200,210,.18)';x.lineWidth=1;
    for(let i=0;i<w;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}for(let j=0;j<h;j+=16){x.beginPath();x.moveTo(0,j);x.lineTo(w,j);x.stroke();}
    const r=rng(77);x.fillStyle='rgba(60,150,120,.55)';for(let k=0;k<5;k++){x.beginPath();const cx=30+r()*200,cy=20+r()*96;for(let a=0;a<7;a+=.5){const R=14+r()*22;x.lineTo(cx+Math.cos(a)*R*1.4,cy+Math.sin(a)*R);}x.fill();}
    x.strokeStyle='rgba(120,220,255,.6)';x.lineWidth=2;x.beginPath();x.moveTo(0,90);x.bezierCurveTo(70,70,120,120,256,84);x.stroke();
    for(const[px,py,col]of[[150,60,'#5cff8a'],[70,40,'#ff5040'],[210,30,'#ff5040'],[40,110,'#ffcf4a']]){x.fillStyle=col;x.beginPath();x.arc(px,py,4,0,7);x.fill();x.strokeStyle=col;x.beginPath();x.arc(px,py,9,0,7);x.stroke();}}),c.w-6,c.h-6);
  map.rotation.x=-Math.PI/2;map.position.y=9.1;g.add(map);
  for(const sx of[-1,0,1]){bBox(g,1.4,14,1.4,metal,sx*21,7,-c.h/2-6);bBox(g,17,11,1.2,dark,sx*21,18,-c.h/2-6);
    const s=bLit(canvasTex(64,40,(x,w,h)=>{x.fillStyle=sx?'#0b2230':'#1a1230';x.fillRect(0,0,w,h);x.strokeStyle=sx?'#58d6ff':'#c08cff';x.lineWidth=2;x.beginPath();
      for(let i=0;i<w;i+=4)x.lineTo(i,h/2+Math.sin(i*.3+sx*2)*h*.3*(sx?1:.5));x.stroke();x.fillStyle='rgba(255,255,255,.5)';x.fillRect(4,4,22,3);x.fillRect(4,10,14,3);}),15,9);
    s.position.set(sx*21,18,-c.h/2-5.3);g.add(s);}
  for(const[px,pz,ry]of[[-20,c.h/2+7,0],[0,c.h/2+7,0],[20,c.h/2+7,0],[-c.w/2-7,0,Math.PI/2],[c.w/2+7,0,-Math.PI/2]]){const ch=new T.Group();ch.position.set(px,0,pz);ch.rotation.y=ry;
    bBox(ch,6,1.2,6,seat,0,5,0);bBox(ch,6,6,1,seat,0,8,2.6);bBox(ch,1,5,1,metal,0,2.5,0);g.add(ch);}
  HQ.scene.add(g);return g;
}
// the medic table: an exam table with a lamp over it, a cabinet with a red cross, a drip stand
function medMesh(){
  const p=BASE_ST.med,g=new T.Group();g.position.set(p.x,0,p.y);
  const white=new T.MeshStandardMaterial({color:0xdfe6e8,roughness:.55}),steel=new T.MeshStandardMaterial({color:0x8d969c,roughness:.35,metalness:.7}),pad=new T.MeshStandardMaterial({color:0x2f5b63,roughness:.8});
  bBox(g,32,1.2,12,steel,0,7,0);bBox(g,30,1.6,10,pad,0,8.4,0);for(const sx of[-1,1])for(const sz of[-1,1])bBox(g,1,7,1,steel,sx*14,3.5,sz*5);
  const cab=bBox(g,10,14,6,white,-24,7,-2);const cross=bLit(canvasTex(32,32,(x,w,h)=>{x.fillStyle='#e8ece8';x.fillRect(0,0,w,h);x.fillStyle='#d4231c';x.fillRect(12,5,8,22);x.fillRect(5,12,22,8);}),6,6);cross.position.set(-24,9,1.05);g.add(cross);
  bBox(g,.8,20,.8,steel,22,10,-4);const bag=bBox(g,3,5,1.6,new T.MeshStandardMaterial({color:0xcfe8f0,roughness:.2,transparent:true,opacity:.75}),22,17,-4);
  const lamp=bLit(canvasTex(8,8,(x,w,h)=>{x.fillStyle='#fff6e8';x.fillRect(0,0,w,h);}),10,3);lamp.rotation.x=Math.PI/2;lamp.position.set(0,26,0);g.add(lamp);bBox(g,.6,8,.6,steel,0,30,0);
  HQ.scene.add(g);return g;
}
// the supply table: a workbench with ammo cans and a rifle on it, a rack of rifles, crates stacked by it
function supMesh(){
  const p=BASE_ST.sup,g=new T.Group();g.position.set(p.x,0,p.y);
  const wood=new T.MeshStandardMaterial({color:0x6b5038,roughness:.8}),olive=new T.MeshStandardMaterial({color:0x4b5536,roughness:.7,metalness:.2}),dark=new T.MeshStandardMaterial({color:0x1c1f21,roughness:.5,metalness:.5}),crate=new T.MeshStandardMaterial({color:0x5d6640,roughness:.85});
  bBox(g,40,1.4,16,wood,0,8,0);for(const sx of[-1,1])for(const sz of[-1,1])bBox(g,1.4,8,1.4,dark,sx*18,4,sz*6.5);
  for(const[x,z]of[[-12,-3],[-6,-3],[0,-3]])bBox(g,5,4,3,olive,x,10.7,z);bBox(g,16,1.2,2.2,dark,8,9.4,3);bBox(g,5,1.6,2,dark,1,9.6,3.4);
  bBox(g,2,18,10,dark,26,9,0);for(const z of[-3,0,3])bBox(g,1.2,16,1.4,dark,24.6,9,z);
  bBox(g,12,9,12,crate,-28,4.5,2);bBox(g,10,7,10,crate,-27,12.5,1);
  HQ.scene.add(g);return g;
}
// the labels: what each thing is, and the empty rooms waiting
function drawBase(now){
  if(MAPID!=='hq'||!HQ||!HQ.base||cineOn())return;
  if(HQ.floors&&curFloor!=='GF'){drawHQFloors(now);return;}   // (the second floor, the roof: hqfloors.js)
  if(HQ.ride)drawHQFloors(now);
  const c=BASE_ST.cmd,[lx,ly]=below(c.x,c.y+c.h/2+16,6);label('COMMAND CENTER',lx,ly,'#8fe6f2',10,700);
  for(const q of HQ_ROOMS){const[x,y]=toS((q.x0+q.x1)/2,(q.y0+q.y1)/2,1);if(toSBack)continue;
    const m=civs.find(c=>c.crew&&!c.dead&&c.room===q.id);   // one of the crew at work in it (above)
    if(m){label('REPAIRING',x,y,'rgba(255,207,74,.8)',9,700);label(m.name.toUpperCase(),x,y+11,'rgba(200,210,220,.55)',8,700);}
    else label('EMPTY ROOM',x,y,'rgba(200,210,220,.55)',9,700);}
}

/* ---------- Continue from the save in the finished HQ, or back in from outside (the drawbridge's gather area: monsters.js) ---------- */
function enterBase(fromOut){
  fadeTo(true);
  setTimeout(()=>{
    buildHQ();stashOut(players);
    useMap({objs:HQ.objs,hq:HQ.hq,slow:[],lamps:HQ.lamps,scene:HQ.scene,lights:HQ.lights});
    tankFires=[];rockets=[];charges=[];
    for(const p of players){moveMesh(p,HQ.scene);Object.assign(p,{path:[],peek:null,tk:null,plant:null,supT:null,focus:null,elev:0,vaultK:0,crawl:false,lx:0,ly:0,offMap:false,throwGo:null,medGo:null,work:null});}
    units=[...players];MAPID='hq';enemies=[];civs=[];resetHQ();hqs.won=true;hqs.awake=true;hqEnd={ph:'done'};baseActs();
    if(!hqStaff.length)hqStaff=Array.from({length:Math.max(1,sciOut||0)},(_,i)=>({id:'S'+(i+1),name:'Scientist',sciN:i}));   // (a Continue: as many as came out of the data center)
    hqStaff.forEach((o,i)=>sciCopy(o,470+i*20,430,Math.PI/2));
    makeBase();base={done:true};shotReveal();for(const u of units)u.work=null;for(const c of civs)if(c.sci)c.staff=true;
    hqCrew.forEach(crewCopy);   // the crew at work in their rooms (above)
    if(fromOut){players.filter(p=>!p.dead&&!p.gone&&!p.carriedBy).forEach((p,i)=>{p.x=440+(i%4)*40;p.y=806+Math.floor(i/4)*24;p.ang=-Math.PI/2;});camShot(500,760,2.0,0,.1);}   // (in at the south door, short of its gather area)
    else camShot(500,600,1.6,0,.1);
    contact=false;clearTeams();sel=[];cardGroup=[];obj=Math.max(obj,6);objDone=4;
    VB={x0:HQB.x0,z0:HQB.y0,x1:HQB.x1,z1:HQB.y1};FIT.w=HQB.x1-HQB.x0+40;FIT.h=HQB.y1-HQB.y0+40;fitDist();
    if(HQ.floors)setHQFloor('GF',{x:camT.x,y:camT.z});   // (the ground floor on screen: hqfloors.js)
    updateObjUI();setStatus();buildCards();hud();fadeTo(false);
  },380);
}

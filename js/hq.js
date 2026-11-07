"use strict";
/* Checkpoints (Bryan): an area whose defenders are all down gets a medic station and an ammo drop, real things to look at
   (scene.js: stationMesh) with a ring round each, green and orange. Walk a soldier into the ring: the medic station heals,
   the ammo drop refills his grenade and special item after a moment (no swapping). The office building's lobby has a pair
   too. The warehouse's first pair comes with a short camera tour. Also the smooth camera pans, and the rings on the overlay. */
const HQ_ZONES=[];   // {k:'med'|'sup',x,y (centre),r,col,label}
// each area's pair: where the medic station and the ammo drop stand (centres); the ring is big enough for the whole squad
const REST_ZONES={
  wh:[{k:'med',x:240,y:445},{k:'sup',x:375,y:445}],   // (Bryan: in the middle of the warehouse, past the front crates and short of the centre crate in the back, where nobody outside can see in; the old spots were in a line of sight through the back door)
  br:[{k:'med',x:380,y:188},{k:'sup',x:572,y:188}],
  maze:[{k:'med',x:485,y:-100},{k:'sup',x:485,y:-186}],   // (on the bridge's road, between the container rows)
  dco:[{k:'med',x:300,y:-398},{k:'sup',x:170,y:-398}],   // (in front of the building, west of the doors)
  dc:[{k:'med',x:610,y:-490},{k:'sup',x:705,y:-490}],   // (west of the gather box at the drawbridge, MON_OUT in monsters.js)
},WH_ZONES=REST_ZONES.wh,ZONE_R=46;
const HEAL_RATE=8,SUPPLY_T=2;
let hq=null,camPan=null;
function zoneAt(x,y){return HQ_ZONES.find(z=>z.r?hyp(x-z.x,y-z.y)<=z.r:x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);}
// a station with its colour and label (a box given as a rectangle, like the office lobby's, becomes a ring round its middle)
const hqZone=z=>{const c=z.w?{x:z.x+z.w/2,y:z.y+z.h/2}:{x:z.x,y:z.y};return Object.assign({},z,c,{r:ZONE_R,col:z.k==='med'?'127,224,138':'255,163,72',label:z.label||(z.k==='med'?'MEDIC':'AMMO')},z.w?{w:0,h:0}:{});};   // (label: the finished HQ's tables, base.js)
function addZones(list,floorGroup){
  for(const z0 of list){const z=hqZone(z0);if(HQ_ZONES.some(q=>q.k===z.k&&hyp(q.x-z.x,q.y-z.y)<5))continue;HQ_ZONES.push(z);
    if(!z0.noMesh&&typeof stationMesh==='function'&&typeof T!=='undefined'){   // (noMesh: the HQ's tables have their own models, base.js)
     const m=stationMesh(z);(floorGroup||scene).add(m);z.mesh=m;}}
}

// every tick of the mission: healing and refilling at the stations, then the mission's own tick
function hqTick(dt){
  if(!hq)return;
  stationTick(dt);missionTick(dt);
}
function stationTick(dt){   // (Level 1 calls it too: level1.js)
  for(const p of players){
    if(!alive(p))continue;
    const z=zoneAt(p.x,p.y);
    if(z&&z.k==='med'&&p.hp<100){if(!p.healing)callout(p,'Healing',C.good);p.healing=true;p.hp=Math.min(100,p.hp+HEAL_RATE*dt);}else p.healing=false;   // (the medic station)
    const short=p.grenade<nadeFull(p)||(p.spec&&p.specN<specFull(p))||(C4_ON&&p.charges<1);   // (an M203's three rounds, an Assault's two frags: combat.js)   // (a freed prisoner has no special item, but takes a grenade)
    if(z&&z.k==='sup'&&short){p.restock=(p.restock||0)+dt;if(p.restock>=SUPPLY_T){p.grenade=nadeFull(p);if(p.spec)p.specN=specFull(p);p.charges=1;p.restock=0;callout(p,'Restocked',C.good);hud();}}else p.restock=0;
  }
}
/* ---------- the tour after the HQ popup (Bryan): show the medical and supply boxes, say what they're for ---------- */
const TOURS={
  hq:[['med','<b>Medic station.</b> Walk a wounded soldier into the green ring to heal. Carry a downed man in to bring him round.'],['sup','<b>Ammo drop.</b> Walk into the orange ring to refill your grenade and special item.']],
};
function hqGotIt(){   // the tour of the boxes (straight after the warehouse; the old popup's button calls it too)
  $('#hqPop').hidden=true;
  const steps=hq&&TOURS[hq.tour];if(!steps){paused=false;hud();return;}   // (the first checkpoint's: mission.js)
  hq.tour=null;paused=true;const mine=hq,back={x:camT.x,z:camT.z,zoom},tip=$('#tut');
  const show=i=>{
    if(hq!==mine||state!=='play'){tip.hidden=true;return;}
    if(i>=steps.length){tip.hidden=true;camPan={from:{x:camT.x,z:camT.z,zoom},to:back,t:0,dur:1.2};paused=false;hud();return;}
    const z=HQ_ZONES.find(q=>q.k===steps[i][0]);
    if(z)camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:z.x,z:z.y+30,zoom:2.8},t:0,dur:1};   // (a station's x,y is its middle)
    tip.innerHTML=`<small>Checkpoint · ${i+1}/${steps.length}</small>${steps[i][1]}`;tip.hidden=false;
    setTimeout(()=>show(i+1),3000);
  };
  show(0);
}
// smooth camera move (real time, every frame)
function panTick(rdt){
  if(!camPan)return;
  camPan.t=Math.min(1,camPan.t+rdt/camPan.dur);const k=camPan.t<.5?2*camPan.t*camPan.t:1-Math.pow(-2*camPan.t+2,2)/2;   // ease in-out
  const a=camPan.from,b=camPan.to;camT={x:a.x+(b.x-a.x)*k,z:a.z+(b.z-a.z)*k};zoom=a.zoom+(b.zoom-a.zoom)*k;clampCam();updateCamera();
  if(camPan.t>=1)camPan=null;
}

/* ---------- drawn on the overlay ---------- */
// a ring round each station (the station itself is a 3D model), its name under it, and each soldier's refill filling round him
// (it was called drawHQ, the same name as fortress.js's boss bar, which loads later and replaced it: from v71 no ring was drawn)
function drawStations(now){
  if(!HQ_ZONES.length)return;
  for(const z of HQ_ZONES){
    if(z.mesh&&z.mesh.userData.strobe)z.mesh.userData.strobe.visible=Math.sin(now*7)>.2;   // the ammo drop's strobe
    if(!z.r||offFloor(z))continue;   // (a station on another floor of the office building)
    toSBack=false;gPath(z.x,z.y,z.r);if(toSBack)continue;
    ox.setLineDash([7,6]);ox.lineDashOffset=-now*6;ox.strokeStyle=`rgba(${z.col},.85)`;ox.lineWidth=2;ox.stroke();ox.setLineDash([]);
    const[lx,ly]=below(z.x,z.y+z.r,6);label(z.label,lx,ly,`rgba(${z.col},.95)`,9,700);
  }
  for(const p of players)if(alive(p)&&p.restock>0){gPath(p.x,p.y,14,-Math.PI/2,-Math.PI/2+p.restock/SUPPLY_T*TAU);ox.strokeStyle='rgba(255,163,72,.95)';ox.lineWidth=2.2;ox.stroke();}
}

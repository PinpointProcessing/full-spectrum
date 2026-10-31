"use strict";
/* Temporary HQ after the battle (free time, still the tutorial). The warehouse gets a medical point and a supply
   point inside, and the captured jeep sits on a motor-pool spot outside with a full repair bar. A soldier standing
   in the medical box heals; in the supply box he gets his grenade back. After 30 s a red arrow pulses towards the
   north-east, where the next area will be. The jeep itself is in vehicle.js. */
const HQ_ZONES=[
  {k:'med',x:186,y:322,w:90,h:70,col:'255,74,64',label:'MEDICAL'},
  {k:'sup',x:344,y:322,w:90,h:70,col:'232,186,84',label:'SUPPLY'},
  {k:'motor',x:458,y:560,w:44,h:70,col:'255,206,64',label:'MOTOR POOL'},
];
const UNLOCK_SHOW=3;   // s the camera stays on the jeep after the report before the HQ popup
const MOTOR={x:480,y:595},HEAL_RATE=8,SUPPLY_T=4,ARROW_T=30,NEXT={x:552,y:735};   // NEXT: where the arrow sits, pointing east at the depot gate
let hq=null,camPan=null;
function zoneAt(x,y){return HQ_ZONES.find(z=>z.k!=='motor'&&x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);}

function startHQ(){
  $('#aar').hidden=true;
  state='play';endAt=0;contact=false;paused=true;wave.phase='hq';hq={t0:simT,arrow:false};
  for(const p of players)if(alive(p)){p.sup=0;p.supT=null;p.focus=null;}
  parkJeepAt(MOTOR.x,MOTOR.y);
  // first the camera goes to the captured jeep: "New vehicle unlocked!"; then over to the warehouse with the HQ popup
  camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:MOTOR.x,z:MOTOR.y-45,zoom:2.8},t:0,dur:1.4};
  bigText('New vehicle unlocked!','unlock');
  const mine=hq;
  setTimeout(()=>{
    if(hq!==mine||state!=='play')return;   // restarted meanwhile
    camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:310,z:430,zoom:2.1},t:0,dur:1.4};
    $('#hqPop').hidden=false;
  },UNLOCK_SHOW*1000);
  setStatus();hud();
  saveGame('hq');   // milestone: warehouse secured (save.js)
}
// the captured jeep moves to the motor pool (its old spot is freed, the new one blocked); the dead gunner drops to the ground
function parkJeepAt(x,y){
  const j=wave.jeep;if(!j)return;
  unparkObstacle(j);
  Object.assign(j,{x,y,heading:-Math.PI/2,owner:'P',hp:100,state:'ok',path:[],moving:false});   // it's ours now (vehicle.js); parked facing north
  j.m.g.position.set(x,0,y);j.m.g.rotation.y=Math.PI/2-j.heading;j.m.tur.rotation.y=-Math.PI/2;jeepLight.intensity=0;
  parkObstacle(j);
  const g=gunnerOf();if(g)g.elev=0;
}
// the first time the whole squad is aboard the jeep, a patrol of four comes through the north gate and attacks
function startPatrol(){
  hq.patrol='on';contact=true;
  [[465,22],[488,22],[470,48],[492,48]].forEach(([x,y],i)=>{
    const u=mk('E','E','E'+(10+i),'Hostile',x,y,Math.PI/2);
    Object.assign(u,{wave:2,alerted:true,aware:1,cool:1+Math.random(),moveCool:simT+0.3+i*0.4});makeSoldier(u);
  });
  enemies=units.filter(u=>u.side==='E');
  bigText('Enemy inbound!','inbound');banner('A patrol is coming through the north gate!',2600);setStatus();
}
function hqTick(dt){
  if(!hq)return;
  const j=jeepOf(),live=players.filter(alive);
  if(!hq.patrol&&j&&j.state==='ok'&&live.length&&live.every(p=>p.inVeh===j))startPatrol();
  if(hq.patrol==='on'&&enemies.every(e=>e.dead)){
    hq.patrol='done';contact=false;bigText('All clear!','clear');setStatus();
    const mine=hq;setTimeout(()=>{if(hq===mine&&state==='play')revealArea();},CLEAR_T*1000);   // then the depot opens
  }
  for(const p of players){
    if(!alive(p))continue;
    const z=zoneAt(p.x,p.y);
    if(z&&z.k==='med'&&p.hp<100){if(!p.healing)callout(p,'Healing',C.good);p.healing=true;p.hp=Math.min(100,p.hp+HEAL_RATE*dt);}else p.healing=false;
    if(z&&z.k==='sup'&&p.grenade<1){p.restock=(p.restock||0)+dt;if(p.restock>=SUPPLY_T){p.grenade=1;p.restock=0;callout(p,'Restocked',C.good);}}else p.restock=0;
  }
  if(!hq.arrow&&!hq.noArrow&&simT-hq.t0>=ARROW_T){hq.arrow=true;banner('Next area: north-east. Move out when you\'re ready.',4000);}
}
/* ---------- the depot: locked behind the yard's east gate until the jeep patrol is beaten ---------- */
let area={open:false,gone:[],slide:0};
function lockArea(){
  if(area.open){area.gone=addObstacle(depotGate);area.open=false;}
  area.slide=0;if(depotGate.mesh)depotGate.mesh.position.z=depotGate.y+depotGate.h/2;
  VB={x0:0,z0:0,x1:YARD_W,z1:H};
}
function openArea(){
  if(area.open)return;
  removeObstacle(depotGate,area.gone);area.gone=[];area.open=true;area.slide=0.001;
  VB={x0:0,z0:0,x1:W,z1:H};
  startDepot();   // the checkpoint's garrison takes its posts (depot.js)
}
function gateTick(rdt){   // the gate slides open along the fence (every frame)
  if(area.slide>0&&area.slide<1){area.slide=Math.min(1,area.slide+rdt/1.6);depotGate.mesh.position.z=depotGate.y+depotGate.h/2-66*area.slide;}
}
// "New area unlocked!": the gate opens and the camera sweeps out to the checkpoint, then comes back
function revealArea(){
  openArea();paused=true;bigText('New area unlocked!','unlock');saveGame('depot');
  const back={x:camT.x,z:camT.z,zoom};
  camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:1050,z:420,zoom:1.6},t:0,dur:1.8};
  const mine=hq;
  setTimeout(()=>{
    if(hq!==mine||state!=='play')return;
    camPan={from:{x:camT.x,z:camT.z,zoom},to:back,t:0,dur:1.6};paused=false;
    banner('The depot is open. Take the road east, then north up the main road to the checkpoint.',4500);hud();
  },4200);
}
// smooth camera move to the warehouse when the HQ opens (real time, every frame)
function panTick(rdt){
  if(!camPan)return;
  camPan.t=Math.min(1,camPan.t+rdt/camPan.dur);const k=camPan.t<.5?2*camPan.t*camPan.t:1-Math.pow(-2*camPan.t+2,2)/2;   // ease in-out
  const a=camPan.from,b=camPan.to;camT={x:a.x+(b.x-a.x)*k,z:a.z+(b.z-a.z)*k};zoom=a.zoom+(b.zoom-a.zoom)*k;clampCam();updateCamera();
  if(camPan.t>=1)camPan=null;
}

/* ---------- drawn on the overlay ---------- */
function drawHQ(now){
  if(!hq)return;
  const pulse=(Math.sin(now*4)+1)/2;
  for(const z of HQ_ZONES){
    const c=[[z.x,z.y],[z.x+z.w,z.y],[z.x+z.w,z.y+z.h],[z.x,z.y+z.h]].map(([x,y])=>toS(x,y,.3));
    ox.beginPath();ox.moveTo(...c[0]);for(const p of c)ox.lineTo(...p);ox.closePath();
    ox.fillStyle=`rgba(${z.col},${.08+pulse*.05})`;ox.fill();
    ox.setLineDash([6,5]);ox.lineDashOffset=-now*8;ox.strokeStyle=`rgba(${z.col},.9)`;ox.lineWidth=1.8;ox.stroke();ox.setLineDash([]);
    const[cx,cy]=toS(z.x+z.w/2,z.y+z.h/2,.3),s=Math.max(8,hyp(c[1][0]-c[0][0],c[1][1]-c[0][1])*.22);
    if(z.k==='med'){ox.fillStyle=`rgba(${z.col},.95)`;ox.fillRect(cx-s*.32,cy-s,s*.64,s*2);ox.fillRect(cx-s,cy-s*.32,s*2,s*.64);}
    else if(z.k==='sup'){   // ammo crate: box with straps and an arrow pointing in
      ox.strokeStyle=`rgba(${z.col},.95)`;ox.lineWidth=2;ox.strokeRect(cx-s,cy-s*.6,s*2,s*1.3);
      ox.beginPath();ox.moveTo(cx-s*.4,cy-s*.6);ox.lineTo(cx-s*.4,cy+s*.7);ox.moveTo(cx+s*.4,cy-s*.6);ox.lineTo(cx+s*.4,cy+s*.7);ox.stroke();
      ox.beginPath();ox.moveTo(cx,cy-s*1.5);ox.lineTo(cx,cy-s*.8);ox.moveTo(cx-s*.3,cy-s*1.1);ox.lineTo(cx,cy-s*.8);ox.lineTo(cx+s*.3,cy-s*1.1);ox.stroke();
    }
    const[lx,ly]=below(z.x+z.w/2,z.y+z.h,6);label(z.label,lx,ly,`rgba(${z.col},.95)`,9,700);
  }
  // supply progress over anyone restocking
  for(const p of players)if(alive(p)&&p.restock>0){gPath(p.x,p.y,14,-Math.PI/2,-Math.PI/2+p.restock/SUPPLY_T*TAU);ox.strokeStyle='rgba(232,186,84,.95)';ox.lineWidth=2.2;ox.stroke();}
  // the way on: a pulsing red arrow on the ground in the north-east, pointing NE, and one at the screen edge if it's off view
  if(hq.arrow){
    const a=0,ca=Math.cos(a),sa=Math.sin(a),pts=[[34,0],[4,-22],[4,-9],[-28,-9],[-28,9],[4,9],[4,22]].map(([u,v])=>toS(NEXT.x+u*ca-v*sa,NEXT.y+u*sa+v*ca,.4));
    ox.globalAlpha=.35+pulse*.6;ox.beginPath();ox.moveTo(...pts[0]);for(const p of pts)ox.lineTo(...p);ox.closePath();
    ox.fillStyle='rgba(255,60,44,.85)';ox.fill();ox.strokeStyle='rgba(255,170,150,.9)';ox.lineWidth=1.5;ox.stroke();ox.globalAlpha=1;
    const[nx,ny]=toS(NEXT.x,NEXT.y);
    if(nx<0||ny<0||nx>cw||ny>ch){
      const mx=clamp(nx,24,cw-24),my=clamp(ny,70,ch-24),ang=Math.atan2(ny-ch/2,nx-cw/2);
      ox.save();ox.translate(mx,my);ox.rotate(ang);ox.globalAlpha=.4+pulse*.6;ox.fillStyle='#ff3b2a';
      ox.beginPath();ox.moveTo(14,0);ox.lineTo(-8,-10);ox.lineTo(-3,0);ox.lineTo(-8,10);ox.closePath();ox.fill();ox.restore();ox.globalAlpha=1;
    }
  }
}

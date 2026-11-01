"use strict";
/* Captured objectives become temporary HQ points (Bryan): a medical box (stand inside to heal) and a supply box (stand
   inside a few seconds to get your grenade and demolition charge back). The warehouse's come with a popup and a short
   camera tour of the two boxes after its report; later objectives just add their boxes (mission.js). Also the smooth
   camera pans used by the HQ popup and the objective reveals, and the boxes drawn on the overlay. */
const HQ_ZONES=[];   // {k:'med'|'sup',x,y,w,h,col,label}
const WH_ZONES=[{k:'med',x:186,y:322,w:90,h:70},{k:'sup',x:344,y:322,w:90,h:70}];
const HEAL_RATE=8,SUPPLY_T=4;
let hq=null,camPan=null;
function zoneAt(x,y){return HQ_ZONES.find(z=>x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);}
function addZones(list){for(const z of list)HQ_ZONES.push(Object.assign({col:z.k==='med'?'255,74,64':'232,186,84',label:z.k==='med'?'MEDICAL':'SUPPLY'},z));}

// after the warehouse's report: its HQ boxes, the popup, then the tour; objective 2 starts when the tour ends
function startHQ(){
  $('#aar').hidden=true;
  state='play';endAt=0;contact=false;paused=true;wave.phase='hq';hq={t0:simT,tour:'hq'};
  for(const p of players)if(alive(p)){p.sup=0;p.supT=null;p.focus=null;}
  if(!HQ_ZONES.length)addZones(WH_ZONES);
  $('#hqPop').hidden=false;
  setStatus();hud();
  saveGame('wh');   // milestone: warehouse taken (save.js)
}
// every tick once the warehouse is taken: healing and restocking in the boxes, then the mission's own tick
function hqTick(dt){
  if(!hq)return;
  for(const p of players){
    if(!alive(p))continue;
    const z=zoneAt(p.x,p.y);
    if(z&&z.k==='med'&&p.hp<100){if(!p.healing)callout(p,'Healing',C.good);p.healing=true;p.hp=Math.min(100,p.hp+HEAL_RATE*dt);}else p.healing=false;
    const short=p.grenade<1||p.charges<1;
    if(z&&z.k==='sup'&&short){p.restock=(p.restock||0)+dt;if(p.restock>=SUPPLY_T){p.grenade=1;p.charges=1;p.restock=0;callout(p,'Restocked',C.good);hud();}}else p.restock=0;
  }
  missionTick(dt);
}
/* ---------- the tour after the HQ popup (Bryan): show the medical and supply boxes, say what they're for ---------- */
const TOURS={
  hq:[['med','<b>Medical.</b> Stand a wounded soldier in the red box to heal.'],['sup','<b>Supply.</b> Step inside to get your grenade and demolition charge back.']],
};
function hqGotIt(){   // from the popup's button
  $('#hqPop').hidden=true;
  const steps=hq&&TOURS[hq.tour];if(!steps){paused=false;hud();return;}
  hq.tour=null;paused=true;const mine=hq,back={x:camT.x,z:camT.z,zoom},tip=$('#tut');
  const show=i=>{
    if(hq!==mine||state!=='play'){tip.hidden=true;return;}
    if(i>=steps.length){tip.hidden=true;camPan={from:{x:camT.x,z:camT.z,zoom},to:back,t:0,dur:1.2};paused=false;hud();startObjective(1);return;}   // objective 2 for the player: the bridge
    const z=HQ_ZONES.find(q=>q.k===steps[i][0]);
    if(z)camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:z.x+z.w/2,z:z.y+z.h/2+30,zoom:2.8},t:0,dur:1};
    tip.innerHTML=`<small>Temporary HQ · ${i+1}/${steps.length}</small>${steps[i][1]}`;tip.hidden=false;
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
function drawHQ(now){
  if(!HQ_ZONES.length)return;
  const pulse=(Math.sin(now*4)+1)/2;
  for(const z of HQ_ZONES){
    const c=[[z.x,z.y],[z.x+z.w,z.y],[z.x+z.w,z.y+z.h],[z.x,z.y+z.h]].map(([x,y])=>toS(x,y,.3));
    ox.beginPath();ox.moveTo(...c[0]);for(const p of c)ox.lineTo(...p);ox.closePath();
    ox.fillStyle=`rgba(${z.col},${.08+pulse*.05})`;ox.fill();
    ox.setLineDash([6,5]);ox.lineDashOffset=-now*8;ox.strokeStyle=`rgba(${z.col},.9)`;ox.lineWidth=1.8;ox.stroke();ox.setLineDash([]);
    const[cx,cy]=toS(z.x+z.w/2,z.y+z.h/2,.3),s=Math.max(8,hyp(c[1][0]-c[0][0],c[1][1]-c[0][1])*.22);
    if(z.k==='med'){ox.fillStyle=`rgba(${z.col},.95)`;ox.fillRect(cx-s*.32,cy-s,s*.64,s*2);ox.fillRect(cx-s,cy-s*.32,s*2,s*.64);}
    else{   // ammo crate: box with straps and an arrow pointing in
      ox.strokeStyle=`rgba(${z.col},.95)`;ox.lineWidth=2;ox.strokeRect(cx-s,cy-s*.6,s*2,s*1.3);
      ox.beginPath();ox.moveTo(cx-s*.4,cy-s*.6);ox.lineTo(cx-s*.4,cy+s*.7);ox.moveTo(cx+s*.4,cy-s*.6);ox.lineTo(cx+s*.4,cy+s*.7);ox.stroke();
      ox.beginPath();ox.moveTo(cx,cy-s*1.5);ox.lineTo(cx,cy-s*.8);ox.moveTo(cx-s*.3,cy-s*1.1);ox.lineTo(cx,cy-s*.8);ox.lineTo(cx+s*.3,cy-s*1.1);ox.stroke();
    }
    const[lx,ly]=below(z.x+z.w/2,z.y+z.h,6);label(z.label,lx,ly,`rgba(${z.col},.95)`,9,700);
  }
  for(const p of players)if(alive(p)&&p.restock>0){gPath(p.x,p.y,14,-Math.PI/2,-Math.PI/2+p.restock/SUPPLY_T*TAU);ox.strokeStyle='rgba(232,186,84,.95)';ox.lineWidth=2.2;ox.stroke();}
}

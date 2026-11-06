"use strict";
/* Squad orders (docs/feel-plan.md): Watch and Breach room. Bryan, playtesting: no buttons for them on the bottom bar.
   Watch is automatic (Full Spectrum Warrior's fire sector): in a fight, a soldier holding still watches the nearest enemy
   you know of; a hostile who comes into his cone (±WATCH.half, out to WATCH.range) gets a snap shot at once, with
   +WATCH.bonus to hit (a small edge now it's automatic). Moving ends it. It's never an order to fire before contact (that would give the squad away).
   Breach room: with soldiers selected near a room (inside the office building, or the warehouse), a BREACH marker shows at
   the room's nearest doorway; tapping it, the team stacks up either side of the doorway, and once both are set they go in
   together to spots either side inside. For BREACH.t s they have +BREACH.bonus to hit, and anyone inside who hadn't seen
   them is slow to react (BREACH.stun s). */
const WATCH={half:.62,range:300,bonus:.05},BREACH={t:2.5,bonus:.2,stun:.9,near:150};   // (the watch's bonus was +0.15 as an order; automatic, it's a small edge for holding still)
let breach=null;
function resetOrders(){breach=null;breachHere=null;doorCache.clear();}

/* ---------- watch (automatic) ---------- */
function inWatch(u,e){
  const w=u.watch;if(!w||beaten(e))return false;const d=hyp(e.x-u.x,e.y-u.y);if(d>WATCH.range)return false;
  let da=Math.atan2(e.y-u.y,e.x-u.x)-w.ang;da=Math.atan2(Math.sin(da),Math.cos(da));return Math.abs(da)<=WATCH.half;
}
// every tick: who's watching, which way (the nearest enemy you know of, re-picked twice a second), and a snap shot at a
// hostile who has just come into a watcher's cone
function watchTick(){
  for(const u of players){
    if(!alive(u)||u.offMap||!caught(u)||u.path.length||u.carry||u.onGun||u.climb||u.inVeh||u.supT){if(u.watch){u.watch=null;u.watchIn=[];}continue;}
    if(!u.watch||simT-u.watch.t>.5){
      const fl=MAPID==='in'?floorOf(u.x,u.y):null;let best=null,bd=1e9;
      for(const e of enemies){if(beaten(e)||!e.seen)continue;const p=e.vis?e:e.last;if(!p)continue;if(fl&&floorOf(p.x,p.y)!==fl)continue;const d=hyp(p.x-u.x,p.y-u.y);if(d<bd){bd=d;best=p;}}
      if(best)u.watch={ang:Math.atan2(best.y-u.y,best.x-u.x),t:simT};else if(u.watch)u.watch.t=simT;
    }
    if(!u.watch)continue;
    if(simT-u.aimT>.6)u.ang=turn(u.ang,u.watch.ang,.2);   // facing his sector
    const now=enemies.filter(e=>inWatch(u,e)&&e.vis).map(e=>e.id);
    if(now.some(id=>!(u.watchIn||[]).includes(id)))u.cool=Math.min(u.cool,.05);   // someone new in the cone: fire first
    u.watchIn=now;
  }
}

/* ---------- breach ---------- */
// the room at (wx,wy): an office room inside, or the warehouse outdoors (inside its walls, map.js: its doorways are the roll
// door, the back door and the east door)
const WH_ROOM={x0:180,y0:270,x1:440,y1:550,name:'the warehouse'};
function roomFor(wx,wy){
  if(MAPID==='in'){const f=floorOf(wx,wy),fl=f&&IN.floors[f],r=fl&&roomAt(fl,wx,wy);return r&&!/hall|lobby/i.test(r.name)?{x0:r.x0,y0:r.y0,x1:r.x1,y1:r.y1,name:r.name}:null;}
  if(MAPID==='l2'){const r=L2_ROOMS.find(z=>wx>=z.x0&&wx<=z.x1&&wy>=z.y0&&wy<=z.y1);return r?{...r}:null;}   // Level 2's control building (level2.js)
  const z=WH_ROOM;return wx>=z.x0&&wx<=z.x1&&wy>=z.y0&&wy<=z.y1?{...z}:null;
}
/* ---------- doors (Bryan: "can we add doors to break down. We can have them kick it in, later incorporate C4s or flashbangs") ----------
   The office's rooms off the halls have doors (office-layout.js; built by interior.js). Shut, a door blocks sight, shots and
   throws, never the way: whoever walks into one (a soldier, a guard) stops and opens it quietly in DOOR.open s (doorWait,
   from updateUnit). A breach kicks a shut door in: the lead kicks it (DOOR.kick s), it bangs open off its hinges, loud
   (the room and anyone near hear it, but they're caught off guard: an ambush), and the team goes straight in. */
const DOOR={open:.5,kick:.45,reach:16,barKick:1.2};
// open it the quiet way, or a barred one (build.js) the loud way: kicked in, heard like a shot
function doorThrough(o,u){
  if(!o.barred){openDoor(o,false,u);return;}
  const x=o.x+o.w/2,y=o.y+o.h/2;openDoor(o,true,u);
  if(u.side==='P'){alertAll(null,false,x,y,null,null,{x:u.x,y:u.y},undefined,undefined,true,u);squadNoise(u,x,y);}
  else alertAll(null,false,x,y,null,null,{x,y});
}
function doorPose(o,k){   // k: 0 shut .. 1 open (the group sits on the hinge); a kicked door swings further and sags off its hinges
  const g=o.mesh;if(!g)return;g.rotation.set(0,o.into*(o.broken?1.85:Math.PI/2)*k,o.broken?o.into*.14*k:0);}
function openDoor(o,kick,by){
  if(!o||o.open)return;o.open=true;o.full=false;o.broken=!!kick;o.anim={t:0,dur:kick?.16:.45};
  if(o.barMesh){if(o.barMesh.parent)o.barMesh.parent.remove(o.barMesh);o.barMesh=null;}o.barred=false;   // (a barred door only goes this way: build.js)
  fillSight();dKey='';   // what can be seen through it now (pathfinding.js's sight grid)
  const x=o.x+o.w/2,y=o.y+o.h/2;
  if(kick){playSample('hit_wood',x,y,1,.7);playSample('slam',x,y,.9,1.15);shake(.1);if(by)callout(by,'Door!',C.warn);}
  else playSample('cell',x,y,.3,1.3);   // the latch
}
function roomDoorTick(dt){   // (office.js has its own doorTick, for the steel door)
  if(MAPID!=='in')return;
  for(const o of objs)if(o.door&&o.anim){o.anim.t+=dt;const k=Math.min(1,o.anim.t/o.anim.dur);doorPose(o,o.broken?k:1-(1-k)*(1-k));if(k>=1)o.anim=null;}
  for(const u of players){const g=u.doorGo;if(!g){if(u.doorT&&!u.path.length)u.doorT=0;continue;}   // sent to open a door (doorTap): at it, he opens it and stays there
    if(!alive(u)||g.o.open||u.lastOrder>g.t+.01){u.doorGo=null;continue;}
    if(u.path.length||rectDist(u.x,u.y,g.o)>DOOR.reach)continue;
    u.doorT=(u.doorT||0)+dt;u.ang=Math.atan2(g.o.y+g.o.h/2-u.y,g.o.x+g.o.w/2-u.x);u.aimT=simT;
    if(u.doorT>=(g.o.barred?DOOR.barKick:DOOR.open)){u.doorT=0;doorThrough(g.o,u);u.doorGo=null;}}
}
// a tap on a shut door: the nearest soldier selected goes to it, on his side, and opens it (a look inside without going in)
function doorTap(wx,wy){
  if(MAPID!=='in')return false;
  const o=objs.find(q=>q.door&&!q.open&&rectDist(wx,wy,q)<9);if(!o)return false;
  const team=sel.filter(u=>alive(u)&&!u.carry&&!offFloor(u));if(!team.length){banner('Select a soldier, then tap the door to open it.',1800);return true;}
  const dx=o.x+o.w/2,dy=o.y+o.h/2,u=team.reduce((a,b)=>hyp(b.x-dx,b.y-dy)<hyp(a.x-dx,a.y-dy)?b:a);
  const side=Math.sign(u.x-dx)||1,p=findPath(u.x,u.y,dx+side*12,dy);   // (the doors are in north-south walls: his side is east or west of it)
  if(!p){banner('No way to that door from here.',1800);return true;}
  Object.assign(u,{path:p,lastOrder:simT,supT:null,focus:null,tk:null,doorGo:{o,t:simT}});callout(u,'Opening the door',C.good);
  return true;
}
// a shut door in his way (updateUnit, combat.js): he stops at it and opens it
function doorWait(u,p,dt){
  if(MAPID!=='in')return false;
  for(const o of objs){
    if(!o.door||o.open||rectDist(u.x,u.y,o)>DOOR.reach||!segHitsRect(u.x,u.y,p.x,p.y,o,1))continue;
    u.doorT=(u.doorT||0)+dt;u.ang=turn(u.ang,Math.atan2(o.y+o.h/2-u.y,o.x+o.w/2-u.x),dt*8);
    if(u.doorT>=(o.barred?DOOR.barKick:DOOR.open)){u.doorT=0;doorThrough(o,u);}
    return true;
  }
  u.doorT=0;return false;
}
const shutDoorAt=d=>MAPID==='in'&&d?objs.find(o=>o.door&&!o.open&&rectDist(d.x,d.y,o)<12)||null:null;   // the shut door in a doorway (orders.js's doorway finder)

// its doorways: runs of free ground along the walls' middle line (a 3-4 m doorway leaves a run of 10-20 once clearance is
// counted), with a wall at both ends and no wider than a doorway: an open side (the office's shared room and its wings are
// one open space) is no doorway (Bryan: BREACH showed up where there was no way into a room). The one nearest (fx,fy).
// Worked out once a room every few seconds (the marker asks four times a second)
const WALL_KINDS=new Set(['wall','owall','iwall','liftwall','steeldoor','carddoor','liftdoor','bars']);
const wallNear=(x,y)=>objs.some(o=>WALL_KINDS.has(o.kind)&&rectDist(x,y,o)<=4);
const doorCache=new Map();
function doorOf(r,fx,fy){
  const key=MAPID+r.x0+','+r.y0+','+r.x1+','+r.y1,c=doorCache.get(key);let doors;
  if(c&&performance.now()-c.t<4000)doors=c.doors;else{doors=doorsOf(r);doorCache.set(key,{doors,t:performance.now()});}
  let best=null,bd=1e9;for(const d of doors){const dd=hyp(d.x-fx,d.y-fy);if(dd<bd){bd=dd;best=d;}}
  return best;
}
function doorsOf(r){
  const doors=[];
  const sides=[{n:[0,-1],a:[r.x0,r.y0-5],b:[r.x1,r.y0-5]},{n:[0,1],a:[r.x0,r.y1+5],b:[r.x1,r.y1+5]},{n:[-1,0],a:[r.x0-5,r.y0],b:[r.x0-5,r.y1]},{n:[1,0],a:[r.x1+5,r.y0],b:[r.x1+5,r.y1]}];
  for(const s of sides){
    const L=hyp(s.b[0]-s.a[0],s.b[1]-s.a[1]),tx=(s.b[0]-s.a[0])/L,ty=(s.b[1]-s.a[1])/L;let run=null;
    for(let d=0;d<=L;d+=5){
      const x=s.a[0]+tx*d,y=s.a[1]+ty*d,free=isFree(x,y,5)&&isFree(x+s.n[0]*14,y+s.n[1]*14,5)&&isFree(x-s.n[0]*14,y-s.n[1]*14,5);
      if(free){if(!run)run={d0:d};run.d1=d;}
      if((!free||d+5>L)&&run){
        const w=run.d1-run.d0,end=k=>wallNear(s.a[0]+tx*k,s.a[1]+ty*k);
        if(w>=10&&w<=(MAPID==='in'?60:100)&&end(run.d0-8)&&end(run.d1+8)){const m=(run.d0+run.d1)/2;doors.push({x:s.a[0]+tx*m,y:s.a[1]+ty*m,n:s.n,t:[tx,ty],w});}
        run=null;}
    }
  }
  return doors;
}
// the BREACH marker (Bryan: no Breach button): the room whose doorway is nearest the selected soldiers, within BREACH.near,
// with them outside it; a room inside the office building (not a hallway or lobby), or the warehouse while it's held
let breachHere=null,breachT=-1;
function breachRooms(){
  if(MAPID==='in'){const f=IN&&IN.floors[curFloor];return f?(f.rooms||[]).filter(r=>!/hall|lobby|lift|stair/i.test(r.name)).map(r=>({x0:r.x0,y0:r.y0,x1:r.x1,y1:r.y1,name:r.name})):[];}
  if(MAPID==='out'&&!finished[0])return[{...WH_ROOM}];
  if(MAPID==='l2')return L2_ROOMS.filter(r=>enemies.some(e=>!beaten(e)&&e.x>=r.x0&&e.x<=r.x1&&e.y>=r.y0&&e.y<=r.y1)).map(r=>({...r}));   // Level 2's control building, while anyone's in there (level2.js)
  return[];
}
function breachSpot(){
  if(performance.now()-breachT<250)return breachHere;breachT=performance.now();breachHere=null;
  const team=sel.filter(u=>alive(u)&&!u.carry&&!offFloor(u));if(!team.length||breach||state!=='play'||mode)return null;
  const cx=team.reduce((a,u)=>a+u.x,0)/team.length,cy=team.reduce((a,u)=>a+u.y,0)/team.length;let bd=BREACH.near;
  for(const r of breachRooms()){
    if(cx>=r.x0&&cx<=r.x1&&cy>=r.y0&&cy<=r.y1)continue;   // they're in it already
    const d=doorOf(r,cx,cy);if(!d)continue;const dd=hyp(d.x-cx,d.y-cy);if(dd<bd){bd=dd;breachHere={room:r,door:d,mx:d.x-d.n[0]*8,my:d.y-d.n[1]*8};}   // (the marker just inside the doorway, clear of the men outside)
  }
  return breachHere;
}
// a tap on the marker (from tap() in input.js, before a tap on one of ours: the men are often right by it)
function breachTap(sx,sy){
  const b=breachSpot();if(!b)return false;toSBack=false;const[mx,my]=toS(b.mx,b.my);if(toSBack||hyp(mx-sx,my-sy)>24)return false;
  if(!tutAllows('btn','breach'))return true;
  return orderBreach(sel,(b.room.x0+b.room.x1)/2,(b.room.y0+b.room.y1)/2)||true;
}
const spotNear=(x,y,taken)=>isFree(x,y,8)&&!taken.some(t=>hyp(t.x-x,t.y-y)<14)?{x,y}:openSpot(x,y,taken);
function orderBreach(list,wx,wy){
  const team=list.filter(u=>alive(u)&&!u.carry).slice(0,4);if(!team.length)return false;
  const room=roomFor(wx,wy);if(!room){banner(MAPID==='in'?'Tap a room to breach (not a hallway).':'Tap inside the warehouse to breach it.',2200);return false;}
  const cx=team.reduce((a,u)=>a+u.x,0)/team.length,cy=team.reduce((a,u)=>a+u.y,0)/team.length,door=doorOf(room,cx,cy);
  if(!door){banner('No doorway into that room from here.',2000);return false;}
  const stack=[],entry=[];
  team.forEach((u,i)=>{
    const side=i%2?1:-1,row=Math.floor(i/2);
    stack.push(spotNear(door.x+door.n[0]*(16+row*16)+door.t[0]*side*24,door.y+door.n[1]*(16+row*16)+door.t[1]*side*24,stack)||{x:u.x,y:u.y});
    const ex=clamp(door.x-door.n[0]*(34+row*26)+door.t[0]*side*30,room.x0+12,room.x1-12),ey=clamp(door.y-door.n[1]*(34+row*26)+door.t[1]*side*30,room.y0+12,room.y1-12);
    entry.push(spotNear(ex,ey,entry)||{x:ex,y:ey});
  });
  for(const[i,u]of team.entries()){const p=findPath(u.x,u.y,stack[i].x,stack[i].y);Object.assign(u,{path:p||[],lastOrder:simT,supT:null,focus:null,tk:null,watch:null,medGo:null,carryGo:null});}
  breach={team,room,door,stack,entry,phase:'stack',t:simT,obj:shutDoorAt(door)};callout(team[0],'Stacking up',C.good);
  return true;
}
function breachTick(){
  const b=breach;if(!b)return;
  if(b.team.some(u=>!alive(u)||(u.lastOrder>b.t+.01&&b.phase==='stack'&&!u.breaching))){breach=null;return;}   // someone was given another order, or went down
  if(b.phase==='stack'){
    if(simT-b.t>25){breach=null;return;}
    const set=b.team.every((u,i)=>!u.path.length&&hyp(u.x-b.stack[i].x,u.y-b.stack[i].y)<10);
    if(!set){b.setT=0;return;}
    b.setT=(b.setT||0)+1/60;if(b.setT<.4)return;   // a breath, then go
    if(b.obj&&!b.obj.open){   // a shut door: the one nearest it kicks it in first
      const dx=b.obj.x+b.obj.w/2,dy=b.obj.y+b.obj.h/2;
      if(!b.kick){b.kick=b.team.reduce((a,u)=>hyp(u.x-dx,u.y-dy)<hyp(a.x-dx,a.y-dy)?u:a);b.kickT=simT;callout(b.kick,'Kicking it in',C.warn);}
      const k=b.kick;k.ang=Math.atan2(dy-k.y,dx-k.x);k.aimT=simT;
      if(simT-b.kickT<DOOR.kick)return;
      for(const e of enemies)if(!e.dead&&!e.alerted&&e.x>=b.room.x0&&e.x<=b.room.x1&&e.y>=b.room.y0&&e.y<=b.room.y1)e.cool=Math.max(e.cool,BREACH.stun);   // caught off guard
      openDoor(b.obj,true,k);const ix=dx-b.door.n[0]*20,iy=dy-b.door.n[1]*20;
      alertAll(null,true,dx,dy,ix,iy,{x:k.x,y:k.y},undefined,undefined,true,k);squadNoise(k,dx,dy);   // loud: the room hears it, and whoever's near (an ambush: they're slow to react)
    }
    b.phase='go';b.t=simT;
    for(const[i,u]of b.team.entries()){const p=findPath(u.x,u.y,b.entry[i].x,b.entry[i].y);Object.assign(u,{path:p||[],lastOrder:simT,breachT:simT+BREACH.t+.8,breaching:true});}
    for(const e of enemies)if(!e.dead&&!e.alerted&&e.x>=b.room.x0&&e.x<=b.room.x1&&e.y>=b.room.y0&&e.y<=b.room.y1)e.cool=Math.max(e.cool,BREACH.stun);   // caught off guard
    callout(b.team[0],'Breach! Breach!',C.warn);if(typeof say==='function')say(b.team[0],'ack_attack');
    return;
  }
  if(b.team.every(u=>!u.path.length)||simT-b.t>6){for(const u of b.team)u.breaching=false;breach=null;}
}

/* ---------- drawing (from the overlay) ---------- */
function drawOrders(now){
  for(const u of players){   // the automatic watch: a faint wedge for the soldiers selected only (four at once would clutter a fight)
    if(!u.watch||!alive(u)||offFloor(u)||!sel.includes(u))continue;
    const w=u.watch,hot=(u.watchIn||[]).length>0;
    gPath(u.x,u.y,WATCH.range*.5,w.ang-WATCH.half,w.ang+WATCH.half,true);if(toSBack)continue;
    ox.fillStyle=`rgba(${hot?'255,207,74':'94,224,142'},${hot?.08:.035})`;ox.fill();
    ox.setLineDash([5,7]);ox.lineDashOffset=-now*8;ox.strokeStyle=`rgba(${hot?'255,207,74':'94,224,142'},.32)`;ox.lineWidth=1.1;ox.stroke();ox.setLineDash([]);
  }
  const m=!breach&&breachSpot();   // the BREACH marker at the doorway near the selected soldiers
  if(m){const p=(Math.sin(now*4)+1)/2;toSBack=false;gPath(m.mx,m.my,12+p*3);if(!toSBack){ox.strokeStyle='rgba(255,207,74,.9)';ox.lineWidth=2;ox.setLineDash([5,4]);ox.lineDashOffset=-now*10;ox.stroke();ox.setLineDash([]);const[lx,ly]=toS(m.mx-m.door.n[0]*26,m.my-m.door.n[1]*26,2);label(shutDoorAt(m.door)?'BREACH · KICK IT IN':'BREACH '+(m.room.name==='the warehouse'?'WAREHOUSE':'ROOM'),lx,ly,'#ffcf4a',10,700);}}
  const b=breach;if(!b)return;
  toSBack=false;const r=b.room,c=[[r.x0,r.y0],[r.x1,r.y0],[r.x1,r.y1],[r.x0,r.y1]].map(([x,y])=>toS(x,y,.4));if(toSBack)return;
  ox.beginPath();ox.moveTo(...c[0]);for(const p of c)ox.lineTo(...p);ox.closePath();ox.setLineDash([8,6]);ox.lineDashOffset=-now*12;ox.strokeStyle='rgba(255,207,74,.85)';ox.lineWidth=2;ox.stroke();ox.setLineDash([]);
  const[lx,ly]=toS((r.x0+r.x1)/2,(r.y0+r.y1)/2,.4);label(b.phase==='stack'?(b.kick?'BREACH · KICKING IT IN':'BREACH · STACKING UP'):'BREACH!',lx,ly,'#ffcf4a',11,700);
  if(b.phase==='stack')for(const s of b.stack){gPath(s.x,s.y,6);ox.strokeStyle='rgba(255,207,74,.8)';ox.lineWidth=1.5;ox.stroke();}
}

"use strict";
/* Squad orders (docs/feel-plan.md): Watch and Breach room.
   Watch (Full Spectrum Warrior's fire sector): press Watch, then tap where to watch. Each selected soldier takes the nearest
   cover within WATCH.move that still sees that way (Bryan: they take cover if it's there) and holds, facing it; a hostile
   who comes into his cone (±WATCH.half, out to WATCH.range) gets a snap shot at once, with +WATCH.bonus to hit. It is an
   order to fire: even before contact a hostile walking into the cone is shot (an ambush). Any move order ends it.
   Breach room (Bryan: after Watch, a similar order): press Breach, then tap a room (inside the office building, or the
   warehouse). The team stacks up either side of the room's doorway nearest them; once both are set they go in together to
   spots either side inside. For BREACH.t s they have +BREACH.bonus to hit, and anyone inside who hadn't seen them is slow
   to react (BREACH.stun s). */
const WATCH={half:.62,range:300,move:40,bonus:.15},BREACH={t:2.5,bonus:.2,stun:.9};
let breach=null;
function resetOrders(){breach=null;}

/* ---------- watch ---------- */
function inWatch(u,e){
  const w=u.watch;if(!w||e.dead)return false;const d=hyp(e.x-u.x,e.y-u.y);if(d>WATCH.range)return false;
  let da=Math.atan2(e.y-u.y,e.x-u.x)-w.ang;da=Math.atan2(Math.sin(da),Math.cos(da));return Math.abs(da)<=WATCH.half;
}
function orderWatch(list,wx,wy){
  const th=[{x:wx,y:wy}],taken=players.filter(p=>!list.includes(p)&&!p.dead).map(destOf);
  for(const u of list){
    let best=null,bd=1e9;   // the nearest cover that still sees the watched spot
    for(const c of coverPts){
      const d=hyp(c.x-u.x,c.y-u.y);if(d>WATCH.move||d>=bd||taken.some(t=>hyp(t.x-c.x,t.y-c.y)<SPACE_COVER))continue;
      if(MAPID==='in'&&floorOf(c.x,c.y)!==floorOf(u.x,u.y))continue;
      const st=protStats(c,th);if(!st.see||st.prot<1)continue;bd=d;best=c;
    }
    const spot=best||{x:u.x,y:u.y},p=hyp(spot.x-u.x,spot.y-u.y)>4?findPath(u.x,u.y,spot.x,spot.y):[];
    Object.assign(u,{path:p||[],lastOrder:simT,supT:null,focus:null,tk:null,medGo:null,carryGo:null,watchIn:[]});
    u.watch={ang:Math.atan2(wy-spot.y,wx-spot.x),x:wx,y:wy};taken.push(spot);
  }
  if(list[0])callout(list[0],'Watching',C.good);
}
function endWatch(list){for(const u of list)if(u.watch){u.watch=null;u.watchIn=[];}}
// every tick: a hostile who has just come into a watcher's cone gets a snap shot
function watchTick(){
  for(const u of players){
    if(!u.watch)continue;if(!alive(u)){u.watch=null;continue;}
    if(u.path.length)continue;
    if(simT-u.aimT>.6)u.ang=turn(u.ang,u.watch.ang,.2);   // facing his sector
    const now=enemies.filter(e=>inWatch(u,e)&&e.vis).map(e=>e.id);
    if(now.some(id=>!(u.watchIn||[]).includes(id)))u.cool=Math.min(u.cool,.05);   // someone new in the cone: fire first
    u.watchIn=now;
  }
}

/* ---------- breach ---------- */
// the room at (wx,wy): an office room inside, or the warehouse outdoors
function roomFor(wx,wy){
  if(MAPID==='in'){const f=floorOf(wx,wy),fl=f&&IN.floors[f],r=fl&&roomAt(fl,wx,wy);return r&&!/hall|lobby/i.test(r.name)?{x0:r.x0,y0:r.y0,x1:r.x1,y1:r.y1,name:r.name}:null;}
  const z=LOCS[0].zone;return wx>=z.x0&&wx<=z.x1&&wy>=z.y0&&wy<=z.y1?{x0:z.x0,y0:z.y0,x1:z.x1,y1:z.y1,name:'the warehouse'}:null;
}
// its doorways: runs of free ground along the walls' middle line (a 3-4 m doorway leaves a run of 10-20 once clearance is
// counted); the one nearest (fx,fy)
function doorOf(r,fx,fy){
  const doors=[];
  const sides=[{n:[0,-1],a:[r.x0,r.y0-5],b:[r.x1,r.y0-5]},{n:[0,1],a:[r.x0,r.y1+5],b:[r.x1,r.y1+5]},{n:[-1,0],a:[r.x0-5,r.y0],b:[r.x0-5,r.y1]},{n:[1,0],a:[r.x1+5,r.y0],b:[r.x1+5,r.y1]}];
  for(const s of sides){
    const L=hyp(s.b[0]-s.a[0],s.b[1]-s.a[1]),tx=(s.b[0]-s.a[0])/L,ty=(s.b[1]-s.a[1])/L;let run=null;
    for(let d=0;d<=L;d+=5){
      const x=s.a[0]+tx*d,y=s.a[1]+ty*d,free=isFree(x,y,5)&&isFree(x+s.n[0]*14,y+s.n[1]*14,5)&&isFree(x-s.n[0]*14,y-s.n[1]*14,5);
      if(free){if(!run)run={d0:d};run.d1=d;}
      if((!free||d+5>L)&&run){if(run.d1-run.d0>=10){const m=(run.d0+run.d1)/2;doors.push({x:s.a[0]+tx*m,y:s.a[1]+ty*m,n:s.n,t:[tx,ty],w:run.d1-run.d0});}run=null;}
    }
  }
  let best=null,bd=1e9;for(const d of doors){const dd=hyp(d.x-fx,d.y-fy);if(dd<bd){bd=dd;best=d;}}
  return best;
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
  breach={team,room,door,stack,entry,phase:'stack',t:simT};callout(team[0],'Stacking up',C.good);
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
  for(const u of players){
    if(!u.watch||!alive(u)||offFloor(u))continue;
    const w=u.watch,hot=(u.watchIn||[]).length>0;
    gPath(u.x,u.y,WATCH.range,w.ang-WATCH.half,w.ang+WATCH.half,true);if(toSBack)continue;
    ox.fillStyle=`rgba(${hot?'255,207,74':'94,224,142'},${hot?.12:.06})`;ox.fill();
    ox.setLineDash([6,6]);ox.lineDashOffset=-now*8;ox.strokeStyle=`rgba(${hot?'255,207,74':'94,224,142'},.55)`;ox.lineWidth=1.3;ox.stroke();ox.setLineDash([]);
  }
  const b=breach;if(!b)return;
  toSBack=false;const r=b.room,c=[[r.x0,r.y0],[r.x1,r.y0],[r.x1,r.y1],[r.x0,r.y1]].map(([x,y])=>toS(x,y,.4));if(toSBack)return;
  ox.beginPath();ox.moveTo(...c[0]);for(const p of c)ox.lineTo(...p);ox.closePath();ox.setLineDash([8,6]);ox.lineDashOffset=-now*12;ox.strokeStyle='rgba(255,207,74,.85)';ox.lineWidth=2;ox.stroke();ox.setLineDash([]);
  const[lx,ly]=toS((r.x0+r.x1)/2,(r.y0+r.y1)/2,.4);label(b.phase==='stack'?'BREACH · STACKING UP':'BREACH!',lx,ly,'#ffcf4a',11,700);
  if(b.phase==='stack')for(const s of b.stack){gPath(s.x,s.y,6);ox.strokeStyle='rgba(255,207,74,.8)';ox.lineWidth=1.5;ox.stroke();}
}

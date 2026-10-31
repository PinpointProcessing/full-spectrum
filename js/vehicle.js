"use strict";
/* The captured jeep as a vehicle the squad uses: board, drive, man the turret, dismount.
   Four seats: the first soldier in drives, the second is put on the machine gun, the rest ride. Selecting any of the
   crew selects the vehicle: tap the ground twice to drive there (like a squad move), tap a hostile and the driver
   lines the turret up on him. Damage: bullets wear it down (smoke under 60 %, fire under 30 %); at 0 it breaks down,
   the crew bail out and it blows up BURN_T s later. A mine or RPG blows it up at once and leaves the crew downed
   outside the wreck (revivable). Hits on the jeep sometimes wound the crew inside; the gunner is exposed.
   It repairs on the motor-pool box. Partial (half) cover. */
const VEH_SPEED=80,VEH_TURN=3,BURN_T=6,SEATS=4,REPAIR_RATE=6,FIGHT_QUIET=5;   // FIGHT_QUIET: s with no enemy in sight before a gunner left on the gun climbs down
let mines=[];   // {x,y}; none on this map yet
function jeepOf(){const j=wave.jeep;return j&&j.owner==='P'?j:null;}
function crewOf(j){return j?players.filter(p=>p.inVeh===j):[];}
function seatOf(j,s){return crewOf(j).find(u=>u.seat===s);}
function selCrew(){const j=jeepOf();return j?sel.filter(u=>u.inVeh===j):[];}

/* ---------- parking: a parked jeep blocks movement and is cover; a moving one isn't ---------- */
function jeepRect(j){const ew=Math.abs(Math.cos(j.heading))>Math.abs(Math.sin(j.heading)),w=ew?JEEP.l:JEEP.w,h=ew?JEEP.w:JEEP.l;return{kind:'jeep',x:j.x-w/2,y:j.y-h/2,w,h,full:false};}
function parkObstacle(j){if(j.obj)return;j.obj=jeepRect(j);j.gone=addObstacle(j.obj);}
function unparkObstacle(j){if(!j.obj)return;removeObstacle(j.obj,j.gone);j.obj=null;j.gone=null;}
// a route for the jeep, planned on the vehicle grid without the jeep itself in the way
function vehRoute(j,tx,ty){const had=!!j.obj;unparkObstacle(j);buildVehGrid();const p=findPath(j.x,j.y,tx,ty,VEH);if(had)parkObstacle(j);return p;}
function driveAlong(j,p){unparkObstacle(j);j.path=p;j.moving=true;}
function onMotorPool(j){const z=HQ_ZONES.find(q=>q.k==='motor');return z&&j.x>=z.x&&j.x<=z.x+z.w&&j.y>=z.y&&j.y<=z.y+z.h;}

/* ---------- getting in and out ---------- */
function orderBoard(list){
  const j=jeepOf();if(!j)return;
  if(j.state!=='ok'){banner('The jeep is wrecked.');return;}
  const free=SEATS-crewOf(j).length-players.filter(p=>p.boarding===j).length;
  const go=list.filter(u=>alive(u)&&!u.inVeh&&u.boarding!==j).slice(0,Math.max(0,free));
  if(!go.length){banner('The jeep is full.',1600);return;}
  const taken=[];
  for(const u of go){
    const s=openSpot(j.x,j.y,taken)||{x:j.x+20,y:j.y};taken.push(s);
    const p=findPath(u.x,u.y,s.x,s.y);if(p){u.path=p;u.boarding=j;u.lastOrder=simT;u.supT=null;}
  }
  callout(go[0],'Mounting up',C.good);
}
function seatIn(u,j){
  u.seat=!seatOf(j,'driver')?'driver':!seatOf(j,'gunner')?'gunner':'pass';
  u.inVeh=j;u.boarding=null;u.path=[];u.peek=null;u.supT=null;u.focus=null;
  if(u.seat==='gunner'){u.gunner=true;u.elev=9;}
  callout(u,u.seat==='driver'?'Driving':u.seat==='gunner'?'On the gun':'Riding',C.good);
}
// force: everyone in list gets out (bailing out, or the gunner told to on his own). Otherwise, while the fight is on,
// the gunner stays on the gun to cover the others and climbs down once it's been quiet for FIGHT_QUIET s.
function dismount(list,force){
  const j=list.length&&list[0].inVeh;if(!j)return;
  if(!force&&list.length>1&&simT-(j.lastFight??-99)<FIGHT_QUIET){
    const g=list.find(u=>u.seat==='gunner');
    if(g){list=list.filter(u=>u!==g);j.gunnerStays=true;callout(g,'Covering you!',C.warn);}
  }
  j.path=[];j.moving=false;j.engage=null;parkObstacle(j);
  const taken=players.filter(p=>!p.inVeh&&!p.dead).map(destOf);
  for(const u of list){
    const s=openSpot(j.x,j.y,taken)||{x:j.x,y:j.y+30};taken.push(s);
    Object.assign(u,{inVeh:null,seat:null,gunner:false,elev:0,x:s.x,y:s.y,path:[],focus:null,lastOrder:simT});
  }
  const c=crewOf(j);   // whoever's left in the back takes the wheel (a gunner left alone stays on the gun: no driver, it can't move)
  if(!seatOf(j,'driver')){const p=c.find(o=>o.seat==='pass');if(p)p.seat='driver';}
}

/* ---------- damage ---------- */
function vehHit(j,dmg,src){   // bullets that hit the jeep (or the driver/passengers inside it)
  if(j.state!=='ok')return;
  j.hp-=dmg*0.35;   // rifle fire wears a jeep down slowly; mines and RPGs are what kill it
  if(Math.random()<0.25){const c=crewOf(j).filter(u=>u.seat!=='gunner'&&alive(u));if(c.length)damage(c[(Math.random()*c.length)|0],dmg*0.5,src);}
  if(j.hp<=0){j.hp=0;vehBreakDown(j);}
}
function vehBlast(j,dmg){if(j.state!=='ok')return;j.hp-=dmg;if(j.hp<=0){j.hp=0;vehBreakDown(j);}}   // grenade nearby
function vehBreakDown(j){
  j.state='broken';j.burnT=BURN_T;
  const c=crewOf(j);dismount(c,true);
  for(const u of c){   // bail out and get clear of the blast on their own
    const a=Math.atan2(u.y-j.y,u.x-j.x),taken=players.filter(o=>o!==u&&!o.dead).map(destOf);
    const s=openSpot(j.x+Math.cos(a)*85,j.y+Math.sin(a)*85,taken),p=s&&findPath(u.x,u.y,s.x,s.y);
    if(p){u.path=p;u.lastOrder=simT;}
  }
  if(c.length)callout(c[0],'Bail out!',C.bad);
  banner('The jeep is breaking down. Get clear before it blows!',2800);
}
// mine, RPG, or a burning wreck going up. Anyone still inside is thrown out, downed (revivable)
function vehDestroy(j,cause){
  if(j.state==='wreck')return;
  const c=crewOf(j);dismount(c,true);for(const u of c)if(alive(u))damage(u,999);
  j.state='wreck';j.hp=0;j.wreckT=simT;j.path=[];j.moving=false;parkObstacle(j);
  explode(j.x,j.y,null,enemies.every(e=>e.dead));
  j.m.g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(o.material.color)o.material.color.setHex(0x161616);if(o.material.emissive)o.material.emissive.setHex(0);}});
  j.m.tur.rotation.z=0.35;jeepLight.intensity=0;
  banner(cause==='mine'?'Mine! The jeep is destroyed.':cause==='rpg'?'RPG hit! The jeep is destroyed.':'The jeep exploded.',2800);
}

/* ---------- each game tick ---------- */
function vehTick(dt){
  const j=jeepOf();if(!j)return;
  for(const u of players)if(u.boarding&&!u.path.length){   // arrived next to it: climb in
    const b=u.boarding;u.boarding=null;
    if(alive(u)&&b===j&&j.state==='ok'&&crewOf(j).length<SEATS&&rectDist(u.x,u.y,jeepRect(j))<16)seatIn(u,j);
  }
  if(enemies.some(e=>!e.dead&&e.vis))j.lastFight=simT;
  if(j.gunnerStays){   // left on the gun to cover the dismount: climbs down once it's quiet
    const c=crewOf(j);
    if(c.length===1&&c[0].seat==='gunner'){if(simT-(j.lastFight??-99)>=FIGHT_QUIET){j.gunnerStays=false;callout(c[0],'Gun\'s clear, coming down',C.good);dismount(c,true);}}
    else if(!c.some(u=>u.seat==='gunner')||c.length>1)j.gunnerStays=false;
  }
  const drv=seatOf(j,'driver');
  if(j.state==='ok'&&j.path&&j.path.length){
    if(!drv||!alive(drv))j.path=[];
    else{
      const p=j.path[0],dx=p.x-j.x,dy=p.y-j.y,d=hyp(dx,dy),da=wrapA(Math.atan2(dy,dx)-j.heading);
      if(d>1)j.heading=wrapA(j.heading+clamp(da,-VEH_TURN*dt,VEH_TURN*dt));
      const sp=VEH_SPEED*dt*(Math.abs(da)>1?0.35:1);   // slow right down for sharp turns
      if(d<=sp){j.x=p.x;j.y=p.y;j.path.shift();}else{j.x+=dx/d*sp;j.y+=dy/d*sp;}
      for(const m of mines)if(hyp(m.x-j.x,m.y-j.y)<12){mines.splice(mines.indexOf(m),1);vehDestroy(j,'mine');return;}
    }
    if(!j.path.length){j.moving=false;parkObstacle(j);}
  }
  for(const u of crewOf(j)){const back=u.seat==='gunner'?-8:0;u.x=j.x+Math.cos(j.heading)*back;u.y=j.y+Math.sin(j.heading)*back;}
  // engage: the gunner takes the target; if he has no line, the driver moves to a spot that gives him one
  if(j.engage){
    const e=j.engage,g=seatOf(j,'gunner');
    if(e.dead||!g){j.engage=null;}
    else{g.focus=e;if(!j.path.length&&drv&&!fireLine(g,e)&&simT>(j.engageT||0)){j.engageT=simT+3;const s=engageSpot(j,e);const p=s&&vehRoute(j,s.x,s.y);if(p)driveAlong(j,p);}}
  }
  if(j.state==='ok'&&!j.moving&&j.hp<100&&onMotorPool(j)&&simT-(j.lastFight??-99)>=FIGHT_QUIET)j.hp=Math.min(100,j.hp+REPAIR_RATE*dt);   // no repairs under fire
  if(j.state==='broken'){j.burnT-=dt;if(j.burnT<=0)vehDestroy(j,'burn');}
  j.m.g.position.set(j.x,0,j.y);j.m.g.rotation.y=Math.PI/2-j.heading;
  if(j.state==='ok'&&drv){jeepLight.intensity=3.2;const c=Math.cos(j.heading),s=Math.sin(j.heading);jeepLight.position.set(j.x+c*22,10,j.y+s*22);jeepLight.target.position.set(j.x+c*140,0,j.y+s*140);}
  else if(j.state==='ok')jeepLight.intensity=0;
}
// nearest spot 15–34 m from the target, with a clear line for the gun and room for the jeep
function engageSpot(j,e){
  const had=!!j.obj;unparkObstacle(j);buildVehGrid();
  let best=null,bd=1e9;
  for(let r=150;r<=340;r+=38)for(let k=0;k<20;k++){
    const a=k/20*TAU,x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r;
    if(!isFree(x,y,VEH.end)||!los(x,y,e.x,e.y))continue;
    const d=hyp(x-j.x,y-j.y);if(d<bd){bd=d;best={x,y};}
  }
  if(had)parkObstacle(j);
  return best;
}

/* ---------- drawn on the overlay ---------- */
function jeepAtScreen(sx,sy){
  const j=jeepOf();if(!j)return false;
  const[x,y]=toS(j.x,j.y,10),[x2,y2]=toS(j.x+24,j.y,10);
  return hyp(sx-x,sy-y)<Math.max(26,hyp(x2-x,y2-y));
}
function drawVehicle(rdt,now){
  const j=jeepOf();if(!j)return;
  // smoke under 60 %, fire under 30 % or once broken; a wreck smoulders
  const age=j.state==='wreck'?simT-j.wreckT:0;
  const smoke=j.state!=='wreck'?j.hp<60:age<40,fire=j.state==='broken'||(j.state==='ok'&&j.hp<30)||(j.state==='wreck'&&age<18);
  j.puffs=j.puffs||[];j.emit=(j.emit||0)-rdt;
  if(smoke&&j.emit<=0){j.emit=fire?0.07:0.16;j.puffs.push({x:j.x+(Math.random()-.5)*10,y:j.y+(Math.random()-.5)*14,t:0,life:2+Math.random(),dx:(Math.random()-.5)*6});}
  const[ax,ay]=toS(j.x,j.y),[bx,by]=toS(j.x+10,j.y),k=hyp(bx-ax,by-ay)/10;   // px per world unit here
  for(let i=j.puffs.length-1;i>=0;i--){
    const p=j.puffs[i];p.t+=rdt;if(p.t>=p.life){j.puffs.splice(i,1);continue;}
    const f=p.t/p.life,[sx,sy]=toS(p.x+p.dx*p.t,p.y,12+p.t*16);
    ox.fillStyle=`rgba(${fire?120:150},${fire?112:150},${fire?104:156},${(.42*(1-f)).toFixed(3)})`;ox.beginPath();ox.arc(sx,sy,k*(3+f*9),0,TAU);ox.fill();   // light grey: lit by the fire and lamps
  }
  if(fire){
    ox.globalCompositeOperation='lighter';
    for(let i=0;i<7;i++){   // flickering flame blobs: white-yellow core fading to red
      const fl=Math.random(),[fx,fy]=toS(j.x+(Math.random()-.5)*14,j.y+(Math.random()-.5)*20,8+fl*10),r=k*(2.5+fl*4);
      const gr=ox.createRadialGradient(fx,fy,0,fx,fy,r);gr.addColorStop(0,'rgba(255,240,190,.9)');gr.addColorStop(.45,'rgba(255,150,40,.6)');gr.addColorStop(1,'rgba(200,40,10,0)');
      ox.fillStyle=gr;ox.beginPath();ox.arc(fx,fy,r,0,TAU);ox.fill();}
    ox.globalCompositeOperation='source-over';
  }
  // condition bar and crew count
  const[hx,hy]=toS(j.x,j.y,44);   // above the gunner's own bar
  if(j.state==='wreck')label('WRECK',hx,hy-4,'#8c959b',9,700);
  else{bar(hx-16,hy-8,32,j.hp/100,j.hp>60?C.good:j.hp>30?C.warn:C.bad);label(`JEEP ${crewOf(j).length}/${SEATS}`,hx,hy-16,'#cfe8d6',9,700);
    if(j.state==='broken')label(`BLOWING IN ${Math.ceil(j.burnT)}`,hx,hy-27,C.bad,10,700);}
  // where it's going, and the preview of a drive order
  if(j.path&&j.path.length){ox.strokeStyle='rgba(207,232,214,.55)';ox.setLineDash([4,5]);ox.lineWidth=1.6;ox.beginPath();ox.moveTo(...toS(j.x,j.y,.5));for(const p of j.path)ox.lineTo(...toS(p.x,p.y,.5));ox.stroke();ox.setLineDash([]);}
  if(preview&&preview.veh){
    const p=preview.path,e=p[p.length-1],q=p.length>1?p[p.length-2]:{x:j.x,y:j.y},h=Math.atan2(e.y-q.y,e.x-q.x),c=Math.cos(h),s=Math.sin(h);
    const pts=[[23,12],[23,-12],[-23,-12],[-23,12]].map(([u,v])=>toS(e.x+u*c-v*s,e.y+u*s+v*c,.5));
    ox.beginPath();ox.moveTo(...pts[0]);for(const t of pts)ox.lineTo(...t);ox.closePath();ox.fillStyle='rgba(207,232,214,.15)';ox.fill();
    ox.setLineDash([5,4]);ox.strokeStyle='rgba(235,240,245,.9)';ox.lineWidth=1.6;ox.stroke();ox.setLineDash([]);
    ox.strokeStyle='rgba(207,232,214,.6)';ox.setLineDash([3,4]);ox.beginPath();ox.moveTo(...toS(j.x,j.y,.5));for(const t of p)ox.lineTo(...toS(t.x,t.y,.5));ox.stroke();ox.setLineDash([]);
    const[lx,ly]=below(e.x,e.y,30);label('TAP AGAIN TO DRIVE',lx,ly,'#eef2f5',10,700);
  }
}

"use strict";
/* The checkpoint across the depot's main road: its garrison, the RPG gunner, the fuel tanks, and taking it as the second HQ.
   The garrison spawns when the depot opens (openArea in hq.js). Nine hostiles, unaware but jumpy: a sentry in the guard
   tower (heavy cover) and a lookout on the watchtower (half cover) who never leave their posts, two at the boom gate,
   two at the sandbags, the RPG gunner beside the guard tower, and a two-man patrol walking the main road south.
   The RPG takes RPG.aim s to aim (red reticle on the ground where it's aimed, "RPG!"), then fires a slow, visible rocket
   that lands RPG.spread off target: time to move. A direct hit destroys the jeep. Fuel tanks blow up when shot enough,
   or hit by a grenade, rocket or another tank's blast, and burn afterwards. Clearing the garrison completes the mission:
   report, then the checkpoint becomes a second HQ with its own medical and supply points. */
const RPG={aim:1.3,reload:8,speed:170,spread:[18,42],range:400,blast:40,dmg:85};   // blast: damage radius (smaller than a grenade's)
const CK_ZONE={x0:930,x1:1290,y0:-462,y1:-212};   // where the garrison shifts between cover once alerted
let rockets=[],tankFires=[],tankQueue=[],garrison=[];
let mission={name:'yard',t0:0};

function startDepot(){
  wave.phase='depot';mission={name:'checkpoint',t0:simT};downCount=0;
  for(const p of players)p.stats={kills:0,streak:0,best:0,lastKill:-99,revives:0,items:0,downs:0};
  const S2=Math.PI/2;   // facing south, down the road the squad comes up
  const spec=[
    ['Sentry',1000,-307,S2,{post:true,elev:14}],['Lookout',1099,-323,S2,{post:true,elev:41}],
    ['Hostile',1036,-284,S2,{}],['Hostile',1064,-282,S2,{}],
    ['Hostile',995,-258,S2+0.3,{}],['Hostile',1046,-244,S2,{}],
    ['RPG',965,-290,S2-0.2,{rpg:true}],   // beside the guard tower, covering the road
    // down the main road past where the curving road joins it, and back
    ['Patrol',1040,-192,S2,{route:[{x:1040,y:18},{x:1040,y:-192}]}],['Patrol',1062,-176,S2,{route:[{x:1062,y:34},{x:1062,y:-176}]}],
  ];
  garrison=spec.map(([name,x,y,ang,extra],i)=>{
    const u=mk('E','E','E'+(20+i),name,x,y,ang);
    Object.assign(u,{zone:CK_ZONE,jumpy:true,ri:0,waitT:0},extra);
    if(u.rpg)u.cool=1;
    makeSoldier(u);
    if(u.rpg){const tube=new T.Mesh(new T.CylinderGeometry(1,1,12,8),new T.MeshStandardMaterial({color:0x3b4a2e,roughness:.8}));tube.rotation.z=Math.PI/2;tube.position.set(1,15,-2.5);u.m.pose.add(tube);}
    return u;
  });
  enemies=units.filter(u=>u.side==='E');
  setStatus();hud();
}
function resetDepot(){
  rockets=[];tankFires=[];tankQueue=[];garrison=[];mission={name:'yard',t0:0};
  for(const o of objs)if(o.kind==='tank'){o.hp=100;o.burst=false;if(o.meshes)for(const m of o.meshes)if(m.userData.c0!=null)m.material.color.setHex(m.userData.c0);}
  for(let i=HQ_ZONES.length-1;i>=0;i--)if(HQ_ZONES[i].hq2)HQ_ZONES.splice(i,1);
}

/* ---------- each tick ---------- */
// rockets in flight and tanks waiting to go up in a chain reaction: these keep going even as the battle ends
function depotFx(dt){
  rocketTick(dt);
  for(let i=tankQueue.length-1;i>=0;i--)if(simT>=tankQueue[i].at){const o=tankQueue[i].o;tankQueue.splice(i,1);tankExplode(o,null);}
}
function depotTick(dt){
  // the patrol walks the road and back, pausing at each end
  for(const e of garrison){
    if(e.dead||e.alerted||!e.route||e.path.length)continue;
    if(!e.waitT){e.waitT=simT+2.5;continue;}
    if(simT<e.waitT)continue;
    e.ri=(e.ri+1)%e.route.length;const p=e.route[e.ri],path=findPath(e.x,e.y,p.x,p.y);if(path)e.path=path;e.waitT=0;
  }
  if(wave.phase==='depot'&&garrison.length&&garrison.every(e=>e.dead)){
    wave.phase='depotdone';bigText('All clear!','clear');endAt=performance.now()+CLEAR_T*1000;setStatus();
  }
}

/* ---------- RPG ---------- */
// called from updateUnit instead of rifle fire: aim at a soldier (the jeep if it's crewed) for RPG.aim s, then fire
function rpgThink(u){
  if(u.aimAt){
    if(simT<u.aimAt.until)return;
    const a=Math.random()*TAU,off=RPG.spread[0]+Math.random()*(RPG.spread[1]-RPG.spread[0]);
    const tx=u.aimAt.x+Math.cos(a)*off,ty=u.aimAt.y+Math.sin(a)*off,d=hyp(tx-u.x,ty-u.y)||1;
    rockets.push({x:u.x,y:u.y,dx:(tx-u.x)/d,dy:(ty-u.y)/d,left:d,by:u,trail:[]});
    flashes.push({x:u.x,y:u.y,t:0});u.aimAt=null;u.cool=RPG.reload;return;
  }
  if(u.cool>0)return;
  const jv=jeepOf(),cands=players.filter(p=>alive(p)&&p.seat!=='pass'&&hyp(p.x-u.x,p.y-u.y)<=RPG.range&&fireLine(u,p));
  if(!cands.length){u.cool=.5;return;}
  let t=cands.find(p=>p.inVeh&&p.inVeh===jv)||cands.reduce((a,b)=>hyp(a.x-u.x,a.y-u.y)<hyp(b.x-u.x,b.y-u.y)?a:b);
  const tx=t.inVeh?t.inVeh.x:t.x,ty=t.inVeh?t.inVeh.y:t.y;
  u.aimAt={x:tx,y:ty,until:simT+RPG.aim};u.ang=Math.atan2(ty-u.y,tx-u.x);u.aimT=simT+RPG.aim;
  if(u.vis)callout(u,'RPG!',C.bad);banner('RPG! Get moving!',1600);
}
function rocketTick(dt){
  for(let i=rockets.length-1;i>=0;i--){
    const r=rockets[i],step=Math.min(r.left,RPG.speed*dt),nx=r.x+r.dx*step,ny=r.y+r.dy*step;
    r.trail.push({x:r.x,y:r.y,t:0});if(r.trail.length>14)r.trail.shift();
    let hitX=null,hitY=null;
    if(!los(r.x,r.y,nx,ny)){hitX=r.x;hitY=r.y;}   // slammed into a container, wall or tank
    const jv=jeepOf();if(hitX==null&&jv&&jv.state!=='wreck'&&hyp(jv.x-nx,jv.y-ny)<16){hitX=nx;hitY=ny;}
    r.x=nx;r.y=ny;r.left-=step;
    if(hitX==null&&r.left<=0){hitX=r.x;hitY=r.y;}
    if(hitX!=null){rockets.splice(i,1);rpgBlast(hitX,hitY,r.by);}
  }
}
function rpgBlast(x,y,by){
  const jv=jeepOf();if(jv&&jv.state!=='wreck'&&hyp(jv.x-x,jv.y-y)<30)vehDestroy(jv,'rpg');
  booms.push({x,y,t:0});paintDecal({k:'scorch',x,y,r:Math.random()});tankBlast(x,y,by);
  for(const v of units){
    if(v.dead||v.seat==='driver')continue;const d=hyp(v.x-x,v.y-y);if(d>RPG.blast||!los(x,y,v.x,v.y))continue;
    v.sup=Math.min(1.2,v.sup+0.9);if(!v.downed)damage(v,RPG.dmg*(1-d/(RPG.blast+4)),by);
  }
}

/* ---------- fuel tanks ---------- */
function tankHit(o,dmg,by){if(o.burst)return;o.hp=(o.hp??100)-dmg;if(o.hp<=0)tankExplode(o,by);}
// a blast near the tanks (from explode): close enough and they go up
function tankBlast(x,y,by){for(const o of objs)if(o.kind==='tank'&&!o.burst){const d=rectDist(x,y,o);if(d<25)tankExplode(o,by);else if(d<45)tankHit(o,80*(1-d/45),by);}}   // right next to it: it goes up
function tankExplode(o,by){
  if(o.burst)return;o.burst=true;o.hp=0;
  const cx=o.x+o.w/2,cy=o.y+o.h/2;
  for(let k=0;k<4;k++)booms.push({x:cx+(Math.random()-.5)*o.w,y:cy+(Math.random()-.5)*o.h,t:-k*0.06});
  paintDecal({k:'scorch',x:cx,y:cy,r:Math.random()});
  for(const v of units){
    if(v.dead||v.seat==='driver')continue;const d=hyp(v.x-cx,v.y-cy)-o.w/2;if(d>95||!los(cx,cy,v.x,v.y))continue;
    v.sup=Math.min(1.2,v.sup+1);if(!v.downed)damage(v,140*(1-Math.max(0,d)/100),by);if(v.side==='E')v.alerted=true;
  }
  const jv=jeepOf();if(jv&&jv.state!=='wreck'&&hyp(jv.x-cx,jv.y-cy)<85)vehDestroy(jv,'blast');
  for(const t of objs)if(t.kind==='tank'&&!t.burst&&t!==o&&rectDist(cx,cy,t)<70&&!tankQueue.some(q=>q.o===t))tankQueue.push({o:t,at:simT+0.45+Math.random()*0.3});   // chain reaction
  if(o.meshes)for(const m of o.meshes){if(m.userData.c0==null)m.userData.c0=m.material.color.getHex();m.material.color.setHex(0x1a1816);}
  tankFires.push({x:cx,y:cy,r:o.w/2,t0:simT,puffs:[],emit:0});
  banner('Fuel tank explosion!',1800);
  if(enemies.some(e=>!e.dead))alertAll('Contact. Weapons free.',!!(by&&by.side==='P'));
}
// soldiers ordered to shoot a tank (u.focusTank, set by tapping it): one burst every 1.6–2.2 s
function shootTank(u){
  const o=u.focusTank;if(o.burst){u.focusTank=null;return false;}
  const cx=o.x+o.w/2,cy=o.y+o.h/2,f=sightOf(u,cx,cy);
  if(!f||hyp(cx-u.x,cy-u.y)>380)return false;
  u.ang=Math.atan2(cy-f.y,cx-f.x);u.aimT=simT;leanOut(u,{lean:f.x!==u.x||f.y!==u.y,fx:f.x,fy:f.y});
  for(let k=0;k<3;k++)tracers.push({x1:f.x,y1:f.y,x2:cx+(Math.random()-.5)*o.w*.6,y2:cy+(Math.random()-.5)*o.h*.6,t:0,col:'255,231,163'});
  flashes.push({x:f.x,y:f.y,t:0});
  if(!contact&&enemies.some(e=>!e.dead))alertAll('Contact. Weapons free.',true);
  tankHit(o,22+Math.random()*8,u);u.cool=1.6+Math.random()*.6;return true;
}

/* ---------- the second HQ ---------- */
function startHQ2(){
  $('#aar').hidden=true;
  state='play';endAt=0;contact=false;paused=true;wave.phase='hq2';hq.arrow=false;hq.noArrow=true;
  for(const p of players)if(alive(p)){p.sup=0;p.supT=null;p.focus=null;p.focusTank=null;}
  addHQ2Zones();
  camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:960,z:-402,zoom:2.2},t:0,dur:1.4};
  $('#hqPop .eyebrow').textContent='Second temporary HQ';$('#hqPop h1').textContent='Checkpoint secured';
  $('#hqPop p').textContent='The checkpoint is now a temporary HQ. Heal and resupply here before you push on. Hold enough of these and you can establish a permanent HQ.';
  $('#hqPop ul').innerHTML='<li><b>Medical (red +)</b> and <b>Supply</b> points are set up west of the road, behind the checkpoint.</li><li>That\'s the end of this demo area for now.</li>';
  $('#hqPop').hidden=false;setStatus();hud();
  saveGame('hq2');
}
function addHQ2Zones(){HQ_ZONES.push({k:'med',x:874,y:-450,w:72,h:64,col:'255,74,64',label:'MEDICAL',hq2:true},{k:'sup',x:952,y:-450,w:70,h:64,col:'232,186,84',label:'SUPPLY',hq2:true});}

/* ---------- drawn on the overlay ---------- */
function drawDepot(rdt,now){
  const pulse=(Math.sin(now*9)+1)/2;
  // RPG gunners taking aim: a red reticle where they're aiming (always shown, so you can react) and their aim line if seen
  for(const e of garrison){
    if(e.dead||!e.aimAt)continue;
    const a=e.aimAt;gPath(a.x,a.y,RPG.blast);ox.fillStyle=`rgba(255,40,30,${(.08+pulse*.12).toFixed(3)})`;ox.fill();
    ox.strokeStyle=`rgba(255,70,50,${(.6+pulse*.4).toFixed(2)})`;ox.lineWidth=2;ox.setLineDash([6,5]);ox.stroke();ox.setLineDash([]);
    const[rx,ry]=toS(a.x,a.y);label('RPG',rx,ry,'#ff5040',11,700);
    if(e.vis){ox.strokeStyle='rgba(255,60,40,.55)';ox.lineWidth=1.2;ox.setLineDash([3,4]);ox.beginPath();ox.moveTo(...toS(e.x,e.y,14));ox.lineTo(...toS(a.x,a.y,2));ox.stroke();ox.setLineDash([]);}
  }
  // rockets: a bright head and a smoke trail
  for(const r of rockets){
    for(const t of r.trail){t.t+=rdt;const[sx,sy]=toS(t.x,t.y,10);ox.fillStyle=`rgba(170,170,170,${Math.max(0,.35-t.t*.4).toFixed(3)})`;ox.beginPath();ox.arc(sx,sy,2+t.t*6,0,TAU);ox.fill();}
    const[hx,hy]=toS(r.x,r.y,10);ox.globalCompositeOperation='lighter';
    const gr=ox.createRadialGradient(hx,hy,0,hx,hy,12);gr.addColorStop(0,'rgba(255,250,220,1)');gr.addColorStop(.35,'rgba(255,170,60,.85)');gr.addColorStop(1,'rgba(255,80,20,0)');
    ox.fillStyle=gr;ox.beginPath();ox.arc(hx,hy,12,0,TAU);ox.fill();ox.globalCompositeOperation='source-over';
  }
  // damaged tanks show how close they are to going up; burst ones burn and smoke
  for(const o of objs)if(o.kind==='tank'&&!o.burst&&o.hp<100){const[bx,by]=toS(o.x+o.w/2,o.y+o.h/2,36);bar(bx-14,by,28,o.hp/100,C.bad);}
  for(const f of tankFires){
    const age=simT-f.t0;if(age>45)continue;
    const[ax,ay]=toS(f.x,f.y),[bx,by]=toS(f.x+10,f.y),k=hyp(bx-ax,by-ay)/10;
    f.emit-=rdt;if(f.emit<=0){f.emit=.08;f.puffs.push({x:f.x+(Math.random()-.5)*f.r,y:f.y+(Math.random()-.5)*f.r,t:0,life:2.5+Math.random()});}
    for(let i=f.puffs.length-1;i>=0;i--){const p=f.puffs[i];p.t+=rdt;if(p.t>=p.life){f.puffs.splice(i,1);continue;}const q=p.t/p.life,[sx,sy]=toS(p.x,p.y,30+p.t*22);ox.fillStyle=`rgba(90,86,82,${(.45*(1-q)).toFixed(3)})`;ox.beginPath();ox.arc(sx,sy,k*(5+q*14),0,TAU);ox.fill();}
    if(age<30){ox.globalCompositeOperation='lighter';
      for(let i=0;i<9;i++){const fl=Math.random(),[fx,fy]=toS(f.x+(Math.random()-.5)*f.r*1.4,f.y+(Math.random()-.5)*f.r*1.4,10+fl*24),r=k*(4+fl*7);
        const gr=ox.createRadialGradient(fx,fy,0,fx,fy,r);gr.addColorStop(0,'rgba(255,240,190,.9)');gr.addColorStop(.45,'rgba(255,140,40,.6)');gr.addColorStop(1,'rgba(200,40,10,0)');ox.fillStyle=gr;ox.beginPath();ox.arc(fx,fy,r,0,TAU);ox.fill();}
      ox.globalCompositeOperation='source-over';}
  }
}

"use strict";
/* The Defender's fortifications (Bryan: "Add another class 'defender' who can build mobile fortifications and wall amongst
   other things"). His special item is a build kit (BUILD.kits uses; an ammo drop fills it again). Tap it on his card, then
   a spot within BUILD.range of him: he walks round behind the spot and builds there, across the line to the nearest threat
   (the one he can see or last saw, else where the area's defenders are):
   - a barricade (one use, BUILD.barricade.t s): a steel shield on wheels, waist high. Heavy cover for whoever's behind it,
     and it doesn't block sight, so the men behind it can shoot over it. He can pack it up again (tap it with him
     selected) and roll it on: the mobile fortification. Packing it up gives the use back.
   - a wall (tap the kit again for it; two uses, BUILD.wall.t s): a row of sand-filled barriers taller than a man. It blocks
     sight, shots and blasts (seal off a machine gun's line, cover a crossing). It stays.
   A frag or a rocket close by wrecks a barricade; a wall takes two. Like everything on the map they're axis-aligned (the
   collision is), so a fortification runs north-south or east-west, whichever is more across the threat's line. Built
   things are cleared at a reset (a level's start, a retry; clearBuilds from reset). Hostiles can use them for cover too. */
const BUILD={kits:3,range:320,barricade:{len:40,th:6,h:9,t:2.5,cost:1,hp:100,pack:2},wall:{len:40,th:10,h:22,t:5,cost:2,hp:200}};
let builds=[];   // {o, mesh}

// where a fortification goes: centred on (x,y), across the line to the nearest threat; n points at the threat
function fortPlan(kind,x,y){
  const S=BUILD[kind],th=threats();let t=th[0],td=1e9;for(const q of th){const d=hyp(q.x-x,q.y-y);if(d<td){td=d;t=q;}}
  const dx=t.x-x,dy=t.y-y,across=Math.abs(dy)>=Math.abs(dx);   // the threat north or south of it: the fortification runs east-west
  const w=across?S.len:S.th,h=across?S.th:S.len,n=across?[0,Math.sign(dy)||-1]:[Math.sign(dx)||1,0];
  const r={x:x-w/2,y:y-h/2,w,h},back=S.th/2+12;
  return{kind,r,n,spot:{x:x-n[0]*back,y:y-n[1]*back}};
}
const rectsMeet=(a,b,pad=0)=>a.x-pad<b.x+b.w&&a.x+a.w+pad>b.x&&a.y-pad<b.y+b.h&&a.y+a.h+pad>b.y;
// why it can't go there, or null
function fortBlocked(r){
  if(r.x<12||r.y<TOP+12||r.x+r.w>W-12||r.y+r.h>H-12)return'Too close to the edge.';
  for(const o of objs)if(o.disk?rectDist(r.x+r.w/2,r.y+r.h/2,o)<Math.max(r.w,r.h)/2+3:rectsMeet(r,o,3))return o.kind==='water'||o.kind==='pit'?'Not on the water.':'Something’s in the way.';
  for(const u of units)if(!u.dead&&!u.offMap&&rectsMeet(r,{x:u.x,y:u.y,w:0,h:0},6))return'Someone’s standing there.';
  return null;
}
const buildCost=kind=>BUILD[kind].cost;
function orderBuild(u,x,y,kind){
  if(!u||!alive(u)||u.spec!=='build'){mode=null;return false;}
  if(u.specN<buildCost(kind)){banner(kind==='wall'?`A wall takes ${BUILD.wall.cost} build kits; ${u.name} has ${u.specN}.`:`${u.name}'s build kit is empty. Refill at an ammo drop.`,2200);return false;}
  if(hyp(x-u.x,y-u.y)>BUILD.range){banner('Too far. Build inside the circle.',1600);return false;}
  const pl=fortPlan(kind,x,y),why=fortBlocked(pl.r);if(why){banner(why+' Pick another spot.',1800);return false;}
  const p=findPath(u.x,u.y,pl.spot.x,pl.spot.y);if(!p){banner('No way to get behind that spot from here.',1800);return false;}
  Object.assign(u,{path:p,lastOrder:simT,supT:null,focus:null,tk:null,doorGo:null,pack:null,build:{...pl,t0:simT,p:0}});
  callout(u,kind==='wall'?'Building a wall':'Setting up a barricade',C.good);return true;
}
// a tap on a barricade itself (not the ground beside it: that's where you'd put a man behind it) with a Defender
// selected: the nearest one packs it up
function fortTap(sx,sy){
  if(!builds.length)return false;const hit=tapTarget(sx,sy).obj,o=hit&&hit.fort==='barricade'?hit:null;if(!o)return false;
  const ds=sel.filter(u=>alive(u)&&u.spec==='build'&&!u.carry);if(!ds.length)return false;   // (anyone else: the tap moves them as usual)
  const cx=o.x+o.w/2,cy=o.y+o.h/2,u=ds.reduce((a,b)=>hyp(b.x-cx,b.y-cy)<hyp(a.x-cx,a.y-cy)?b:a);
  if(u.specN>=BUILD.kits){banner(`${u.name}'s build kit is full: he leaves the barricade where it is.`,2000);return true;}
  const v=o.w>o.h,s=v?Math.sign(u.y-cy)||1:Math.sign(u.x-cx)||1,gx=v?cx:cx+s*(o.w/2+10),gy=v?cy+s*(o.h/2+10):cy;   // (his side of it)
  const p=findPath(u.x,u.y,gx,gy);if(!p){banner('No way to that barricade from here.',1800);return true;}
  Object.assign(u,{path:p,lastOrder:simT,supT:null,focus:null,tk:null,doorGo:null,build:null,pack:{o,t0:simT,p:0}});callout(u,'Packing it up',C.good);
  return true;
}
// every tick (update): the builders and packers at work
function buildTick(dt){
  for(const u of players){
    const b=u.build,k=u.pack;if(!b&&!k)continue;
    const job=b||k;if(!alive(u)||u.lastOrder>job.t0+.01||u.carry){u.build=u.pack=null;continue;}   // another order, down, or carrying a man: the job's off
    if(u.path.length)continue;
    if(b){
      if(hyp(u.x-b.spot.x,u.y-b.spot.y)>16){u.build=null;callout(u,'Can’t get there',C.warn);continue;}
      u.ang=Math.atan2(b.n[1],b.n[0]);u.aimT=simT;
      if(b.p<BUILD[b.kind].t){b.p+=dt;continue;}
      if(fortBlocked(b.r))continue;   // someone walked into it: he waits for the space
      if(u.specN<buildCost(b.kind)){u.build=null;continue;}
      makeFort(b.kind,b.r,b.n);u.specN-=buildCost(b.kind);u.stats.items++;u.build=null;
      callout(u,b.kind==='wall'?'Wall up':'Barricade up',C.good);if(typeof playSample==='function')playSample(b.kind==='wall'?'gear':'hit_metal',u.x,u.y,.7,.8);hud();
    }else{
      if(!objs.includes(k.o)){u.pack=null;continue;}
      if(rectDist(u.x,u.y,k.o)>18){u.pack=null;callout(u,'Can’t get there',C.warn);continue;}
      u.ang=Math.atan2(k.o.y+k.o.h/2-u.y,k.o.x+k.o.w/2-u.x);u.aimT=simT;
      if(k.p<BUILD.barricade.pack){k.p+=dt;continue;}
      removeFort(k.o);u.specN=Math.min(BUILD.kits,u.specN+BUILD.barricade.cost);u.pack=null;callout(u,'Packed up',C.good);hud();
    }
  }
}
function makeFort(kind,r,n){
  const S=BUILD[kind],o={kind:kind==='wall'?'fwall':'barricade',fort:kind,x:r.x,y:r.y,w:r.w,h:r.h,built:true,hp:S.hp,maxHp:S.hp,n,full:kind==='wall'};
  if(kind==='barricade')o.cover=2;   // heavy cover that doesn't block sight (like our pillboxes)
  o.gone=addObstacle(o);if(o.full){fillSight();dKey='';}
  if(MAPID==='in'&&IN&&!IN.objs.includes(o))IN.objs.push(o);   // (inside the office building: it's still there after a trip outside)
  const m=fortMesh(o),par=MAPID==='in'&&IN&&IN.groups?IN.groups[floorOf(r.x+r.w/2,r.y+r.h/2)]||scene:scene;par.add(m);
  builds.push({o,mesh:m});return o;
}
function removeFort(o){
  const i=builds.findIndex(b=>b.o===o);if(i<0)return;const b=builds[i];builds.splice(i,1);
  if(objs.includes(o))removeObstacle(o,o.gone||[]);
  if(IN&&IN.objs){const j=IN.objs.indexOf(o);if(j>=0)IN.objs.splice(j,1);}
  if(b.mesh&&b.mesh.parent)b.mesh.parent.remove(b.mesh);
  if(o.full){fillSight();dKey='';}
}
// a frag or a rocket going off close by (tankBlast, mission.js): a barricade goes in one, a wall in two
function buildBlast(x,y){
  for(const b of builds.slice()){const o=b.o,d=rectDist(x,y,o);if(d>30||!objs.includes(o))continue;
    o.hp-=150*(1-d/40);if(o.hp>0){shake(.05);continue;}   // (a frag within ~1.5 m wrecks a barricade; a wall takes two close by)
    const cx=o.x+o.w/2,cy=o.y+o.h/2;removeFort(o);for(let k=0;k<6;k++)sparks.push({x:cx+(Math.random()-.5)*o.w,y:cy+(Math.random()-.5)*o.h,t:0});
    callouts.push({x:cx,y:cy,t:0,dur:2,text:o.fort==='wall'?'Wall down':'Barricade wrecked',col:'#ffb36b',small:true});}
}
// a reset (a level's start, a retry, a new game): everything built goes
function clearBuilds(){
  if(!builds.length)return;
  for(const b of builds){if(b.mesh&&b.mesh.parent)b.mesh.parent.remove(b.mesh);let i=objs.indexOf(b.o);if(i>=0)objs.splice(i,1);if(IN&&IN.objs){i=IN.objs.indexOf(b.o);if(i>=0)IN.objs.splice(i,1);}}
  builds=[];for(const p of players){p.build=null;p.pack=null;}rebuildNav();
}

/* ---------- the 3D models (our own) ---------- */
let FORT_MAT=null;
function fortMats(){
  if(FORT_MAT)return FORT_MAT;
  const M=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.75,metalness:.15},o));
  FORT_MAT={steel:M(0x8d978a,{metalness:.45,roughness:.5}),dark:M(0x1d2124,{metalness:.4,roughness:.5}),hazard:M(0xe0b52c,{emissive:0x5a4206}),tyre:M(0x151719,{roughness:.9}),
    sack:M(0xb39a6c,{roughness:.95,metalness:0}),sand:M(0x8f7a55,{roughness:1,metalness:0}),mesh:M(0x5b5d58,{metalness:.6,roughness:.4})};
  return FORT_MAT;
}
function fortMesh(o){
  const mt=fortMats(),g=new T.Group(),v=o.h>o.w,len=v?o.h:o.w,th=v?o.w:o.h;   // built along local x, then turned if it runs north-south
  const box=(w,h,d,m,x,y,z,rx=0)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.rotation.x=rx;b.castShadow=true;b.receiveShadow=true;g.add(b);return b;};
  const f=v?(o.n[0]>0?-1:1):(o.n[1]>0?1:-1);   // which local z is the threat's side
  if(o.fort==='barricade'){
    const H=BUILD.barricade.h;
    box(len,H,2.2,mt.steel,0,H/2+1.6,f*.6,-f*.12);   // the steel shield, leaning back a little
    box(len+.2,1,2.4,mt.hazard,0,H+1.5,f*.2,-f*.12);   // a yellow edge along its top (it glows a little: it reads at night)
    box(5,1.1,2.5,mt.dark,0,H-.8,f*.45,-f*.12);   // the vision slit
    for(const s of[-1,1]){box(1,H*.8,1,mt.steel,s*len*.3,H*.45,-f*1.8,f*.35);   // struts behind
      const w=new T.Mesh(new T.CylinderGeometry(1.8,1.8,1.2,10),mt.tyre);w.rotation.x=Math.PI/2;w.rotation.z=Math.PI/2;w.position.set(s*(len/2-3),1.8,-f*1.2);g.add(w);}   // wheels
  }else{
    const H=BUILD.wall.h,n=4,cw=len/n;
    for(let i=0;i<n;i++){const x=-len/2+cw*(i+.5);box(cw-.5,H,th,mt.sack,x,H/2,0);box(cw-.5,.6,th-.6,mt.sand,x,H+.1,0);
      for(const z of[-1,1])for(const yy of[H*.33,H*.66])box(cw-.4,.25,.2,mt.mesh,x,yy,z*(th/2+.05));   // the wire mesh round each one
      for(const z of[-1,1])box(.3,H,.2,mt.mesh,x-cw/2+.4,H/2,z*(th/2+.05));}
  }
  g.position.set(o.x+o.w/2,0,o.y+o.h/2);if(v)g.rotation.y=Math.PI/2;
  return g;
}

/* ---------- the overlay: the job in hand, the build circle ---------- */
function drawBuilds(now){
  if((mode==='build'||mode==='buildwall')&&sel[0]){gPath(sel[0].x,sel[0].y,BUILD.range);ox.setLineDash([6,5]);ox.strokeStyle='#d9b46a';ox.globalAlpha=.75;ox.lineWidth=1.5;ox.stroke();ox.setLineDash([]);ox.globalAlpha=1;}
  for(const u of players){
    const b=u.build;if(!b||!alive(u)||offFloor(u))continue;const r=b.r;toSBack=false;
    const c=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]].map(([x,y])=>toS(x,y,.4));if(toSBack)continue;
    ox.beginPath();ox.moveTo(...c[0]);for(const p of c)ox.lineTo(...p);ox.closePath();
    const k=Math.min(1,b.p/BUILD[b.kind].t);ox.fillStyle=`rgba(217,180,106,${.1+k*.3})`;ox.fill();
    ox.setLineDash([5,4]);ox.lineDashOffset=-now*8;ox.strokeStyle='rgba(217,180,106,.9)';ox.lineWidth=1.6;ox.stroke();ox.setLineDash([]);
    const[lx,ly]=toS(r.x+r.w/2,r.y+r.h/2,.4);label(b.p>0?`${b.kind==='wall'?'WALL':'BARRICADE'} ${Math.round(k*100)}%`:b.kind==='wall'?'WALL HERE':'BARRICADE HERE',lx,ly-14,'#ffd68a',10,700);
  }
  for(const u of players){const k=u.pack;if(!k||!alive(u)||!k.p)continue;const o=k.o,[lx,ly]=toS(o.x+o.w/2,o.y+o.h/2,10);if(!toSBack)label(`PACKING ${Math.round(Math.min(1,k.p/BUILD.barricade.pack)*100)}%`,lx,ly-10,'#ffd68a',10,700);}
}

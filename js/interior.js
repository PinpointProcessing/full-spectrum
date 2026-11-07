"use strict";
/* The office building's inside (objective 4; Bryan's design and the review: docs/office-building.md) as its own map.
   The outdoor map and the interior share one frame (x 0..W, y TOP..H) and one engine: going in swaps what's in it: the
   objects (and so the nav grid, cover points, vault links and sight grid: rebuildNav), the units, the medical and supply
   boxes, the lamps, the camera's bounds, and the 3D scene (a second THREE.Scene with its own lights and floor canvas).
   The floors (OFFICE_LAYOUT: GF, B1, 1F) sit side by side in the frame with 'void' between them; the camera shows one at a
   time (the floor chip switches it) and every floor runs at once, so the fire teams can split (Bryan). Inside, noise only
   carries to nearby rooms on the same floor (alertNear), and contact ends once no alerted hostile on a floor with the squad
   has seen them for a while, so the squad can go quiet again between rooms. Things to use (the computer, the stairs and
   the lift, the cells; office.js has what each one does) share one look and one tap (ACTS). */
let MAPID='out',curFloor='GF',fading=false;
// the front doors (Bryan): open unless the alarm's going (a radio call, reinforcements on the way) or they're out hunting the squad
function dcLocked(){return MAPID==='out'&&(contact||threatOn()||enemies.some(e=>!e.dead&&!e.surr&&!e.veh&&e.alerted));}
let IN=null;            // the interior once built: {L,floors,objs,lamps,hq,units,scene,lights,canvas,tex}
const STASH={};         // the map that isn't in play
const IN_HEAR_OPEN=260,IN_HEAR_WALL=110,IN_QUIET=8;   // how far gunfire carries inside, in sight and through walls; s unseen before contact ends
const IN_OPEN=['GF','B1','1F'];   // the floors in use (all three now: office.js)

/* ---------- building it ---------- */
// the frame minus the floors: invisible full blocks, so nothing between the floors is walkable or gives cover points
function voidRects(bs,x1=W){   // (x1: the frame's east edge; the Headquarters' floors run past W: hqfloors.js)
  const xs=[...new Set([0,x1,...bs.flatMap(b=>[b.x0,b.x1])])].sort((a,b)=>a-b),ys=[...new Set([TOP,H,...bs.flatMap(b=>[b.y0,b.y1])])].sort((a,b)=>a-b),out=[];
  for(let j=0;j<ys.length-1;j++){
    let run=null;
    for(let i=0;i<xs.length-1;i++){
      const cx=(xs[i]+xs[i+1])/2,cy=(ys[j]+ys[j+1])/2,inside=bs.some(b=>cx>b.x0&&cx<b.x1&&cy>b.y0&&cy<b.y1);
      if(!inside){if(run)run.w=xs[i+1]-run.x;else run={kind:'void',x:xs[i],y:ys[j],w:xs[i+1]-xs[i],h:ys[j+1]-ys[j],full:true};}
      else if(run){out.push(run);run=null;}
    }
    if(run)out.push(run);
  }
  return out;
}
const offFloor=u=>(MAPID==='in'&&!!IN&&floorOf(u.x,u.y)!==curFloor)||(MAPID==='hq'&&!!HQ&&!!HQ.floors&&hqFloorOf(u.x,u.y)!==curFloor);   // on another floor of the building than the one on screen: not drawn (the office building, the Headquarters: hqfloors.js)
function roomAt(f,x,y){return (f.rooms||[]).find(r=>x>=r.x0&&x<=r.x1&&y>=r.y0&&y<=r.y1);}
function floorOf(x,y){if(!IN)return null;for(const f of IN.L.floors){const b=f.bounds;if(x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1)return f.id;}return null;}
const IN_FLOOR_COL={lobby:'#565b60',hall:'#464b50',office:'#36414c',meeting:'#3d3933',shared:'#4b4e52',store:'#414244',stair:'#404144',lift:'#43464a',cell:'#323436',basement:'#343638',turret:'#434649',lab:'#61686f',science:'#61686f',security:'#38404a'};
function roomCol(name){const n=(name||'').toLowerCase();for(const k in IN_FLOOR_COL)if(n.includes(k))return IN_FLOOR_COL[k];return '#35393d';}
// the floors: each room's own finish (polished tiles in the lobby and labs, carpet tiles in offices, worn vinyl in the
// halls, concrete elsewhere), grime toward the corners, then soft dark edges along every wall and under the furniture
function paintFloors(g,L){
  const grid=(r,s)=>{g.beginPath();for(let x=r.x0+s;x<r.x1;x+=s){g.moveTo(x+.5,r.y0);g.lineTo(x+.5,r.y1);}for(let y=r.y0+s;y<r.y1;y+=s){g.moveTo(r.x0,y+.5);g.lineTo(r.x1,y+.5);}g.stroke();};
  g.fillStyle='#020304';g.fillRect(0,TOP,W,H-TOP);
  for(const f of L.floors){
    const b=f.bounds;g.fillStyle='#2f3337';g.fillRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);
    for(const r of f.rooms||[]){
      const n=(r.name||'').toLowerCase(),w=r.x1-r.x0,h=r.y1-r.y0,rr=rng(Math.round(r.x0*7+r.y0*3)+99);
      g.save();g.beginPath();g.rect(r.x0,r.y0,w,h);g.clip();g.fillStyle=roomCol(r.name);g.fillRect(r.x0,r.y0,w,h);
      if(/lobby|lab|science/.test(n)){
        for(let x=r.x0;x<r.x1;x+=20)for(let y=r.y0;y<r.y1;y+=20){g.fillStyle=`rgba(255,255,255,${(rr()*.04).toFixed(3)})`;g.fillRect(x,y,20,20);}
        g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1;grid(r,20);
        const sh=g.createLinearGradient(r.x0,r.y0,r.x1,r.y1);sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(.5,'rgba(255,255,255,.06)');sh.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sh;g.fillRect(r.x0,r.y0,w,h);
      }else if(/office|meeting|security/.test(n)){
        for(let x=r.x0;x<r.x1;x+=10)for(let y=r.y0;y<r.y1;y+=10){const k=rr();g.fillStyle=k<.5?`rgba(0,0,0,${(k*.14).toFixed(3)})`:`rgba(255,255,255,${((k-.5)*.05).toFixed(3)})`;g.fillRect(x,y,10,10);}
      }else if(/hall/.test(n)){
        for(let i=0;i<w*h/40;i++){g.fillStyle=`rgba(0,0,0,${(.05+rr()*.08).toFixed(3)})`;g.fillRect(r.x0+rr()*w,r.y0+rr()*h,1+rr()*3,1);}
        g.fillStyle='rgba(255,255,255,.035)';if(w<h)g.fillRect((r.x0+r.x1)/2-6,r.y0,12,h);else g.fillRect(r.x0,(r.y0+r.y1)/2-6,w,12);   // the worn path down the middle
      }else{
        for(let i=0;i<w*h/30;i++){g.fillStyle=rr()<.5?'rgba(0,0,0,.07)':'rgba(255,255,255,.03)';g.fillRect(r.x0+rr()*w,r.y0+rr()*h,1+rr()*2,1+rr()*2);}
        if(/cell|basement|turret|stair|shared|store/.test(n)){g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=1;grid(r,40);}
      }
      const cx=(r.x0+r.x1)/2,cy=(r.y0+r.y1)/2,vg=g.createRadialGradient(cx,cy,Math.min(w,h)*.2,cx,cy,Math.hypot(w,h)*.6);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=vg;g.fillRect(r.x0,r.y0,w,h);
      g.restore();
    }
  }
  // story in glimpses: papers scattered in the offices, spent casings by the front desk, a blood trail down the east hall,
  // drag marks to the shared room, a scorched patch by the steel door
  for(const f of L.floors)for(const r of f.rooms||[]){
    const n=(r.name||'').toLowerCase(),rr=rng(Math.round(r.x0*11+r.y0*17)),w=r.x1-r.x0,h=r.y1-r.y0;
    if(/office|security|records|meeting/.test(n))for(let i=0;i<w*h/2600;i++){const x=r.x0+8+rr()*(w-16),y=r.y0+8+rr()*(h-16);g.save();g.translate(x,y);g.rotate(rr()*3);g.fillStyle=`rgba(205,202,190,${(.16+rr()*.18).toFixed(2)})`;g.fillRect(-2.5,-3.5,5,7);g.restore();}
    if(/lobby/.test(n)&&!/elevator/.test(n))for(let i=0;i<14;i++){const x=(r.x0+r.x1)/2-40+rr()*80,y=r.y0+20+rr()*40;g.fillStyle='rgba(200,165,80,.8)';g.fillRect(x,y,1.6,.8);}
    if(/east hall/.test(n)){g.fillStyle='rgba(90,10,8,.55)';for(let y=r.y1-20;y>r.y0+30;y-=6+rr()*5){g.beginPath();g.ellipse((r.x0+r.x1)/2+Math.sin(y*.05)*6,y,2+rr()*2.5,1.5+rr(),0,0,7);g.fill();}}
    if(/west hall/.test(n)){g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=2;g.beginPath();g.moveTo((r.x0+r.x1)/2-4,r.y1-10);g.lineTo((r.x0+r.x1)/2+3,r.y0+10);g.stroke();}
  }
  for(const f of L.floors)for(const o of f.objects)if(o.kind==='steeldoor'){const cx=o.x+o.w/2,cy=o.y+o.h+16,gr=g.createRadialGradient(cx,cy,0,cx,cy,30);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(cx,cy,30,0,7);g.fill();}
  g.save();g.fillStyle='rgba(0,0,0,.5)';
  for(const o of IN.objs){if(o.kind==='void'||o.kind==='srail'||o.door)continue;const wall=/wall|pillar|steeldoor|cabinet|rack|carddoor/.test(o.kind);g.shadowColor=wall?'rgba(0,0,0,.8)':'rgba(0,0,0,.6)';g.shadowBlur=wall?16:9;g.fillRect(o.x,o.y,o.w,o.h);}
  g.restore();
  for(const f of L.floors)for(const z of f.zones||[])if(z.kind==='stairs-down')g.clearRect(z.x0,z.y0,z.x1-z.x0,z.y1-z.y0);   // a hole in the floor: the flight goes down into it (buildFlight)
}
function buildInterior(){
  const L=OFFICE_LAYOUT;
  IN={L,floors:{},objs:[],lamps:[],hq:[],units:[],acts:[],scene:null,lights:null,canvas:null,tex:null};
  for(const f of L.floors)IN.floors[f.id]=f;
  for(const f of L.floors)for(const o of f.objects)IN.objs.push({kind:o.kind,x:o.x,y:o.y,w:o.w,h:o.h,full:FULL.has(o.kind),floor:f.id,gate:o.gate});
  for(const f of L.floors)for(const d of f.doors||[])IN.objs.push({kind:'door',door:true,x:d.x,y:d.y,w:d.w,h:d.h,into:d.into,room:d.room,open0:!!d.open,open:!!d.open,full:!d.open,floor:f.id});   // the rooms' doors (orders.js)
  IN.flights=[];for(const f of L.floors)for(const z of f.zones||[])if(/^stairs-(up|down)$/.test(z.kind)&&z.dir){IN.flights.push({...z,floor:f.id,up:z.kind==='stairs-up'});IN.objs.push(...flightRails(z,f.id));}   // the stairs in 3D, and rails you can't walk through along their sides
  IN.objs.push(...voidRects(L.floors.map(f=>f.bounds)));IN.allObjs=IN.objs.slice();   // (allObjs: doors and gates that open come back on a fresh visit)
  // the light plan (docs/feel-plan.md: rooms you can read): rooms with people in them and the main spaces are lit, a hallway
  // tube sputters, empty rooms are dark or lit only by a red emergency light. One light every 12 m along anything long.
  // (They share the lamp pool like the street lamps.)
  for(const f of L.floors)for(const r of f.rooms||[]){
    const w=r.x1-r.x0,h=r.y1-r.y0,n=Math.max(1,Math.round(Math.max(w,h)/120)),floor=f.id,nm=r.name||'',rr=rng(Math.round(r.x0*13+r.y0*7));
    const occupied=(f.posts||[]).some(p=>/rifleman|mg|ambusher|prisoner|strapped|scientist/.test(p.role)&&p.x>=r.x0&&p.x<=r.x1&&p.y>=r.y0&&p.y<=r.y1),main=/lobby|reception|shared|science|turret|stair|lift/i.test(nm),hall=/hall/i.test(nm);
    if(!occupied&&!main&&!hall){if(rr()<.5)IN.lamps.push({x:(r.x0+r.x1)/2,y:r.y0+12,h:22,c:0xff3a2a,i:.7,d:110,floor});continue;}   // empty: dark, or a red emergency light
    for(let k=0;k<n;k++){const t=(k+.5)/n;IN.lamps.push({x:w>=h?r.x0+w*t:(r.x0+r.x1)/2,y:w>=h?(r.y0+r.y1)/2:r.y0+h*t,h:32,c:/cell|basement/i.test(nm)?0xffd39a:/lab|science/i.test(nm)?0xe4f0ff:/office|meeting|security/i.test(nm)?0xffe9c8:0xf0f2f4,i:1.5,d:190,ceil:1,floor,flick:hall&&k===0});}
  }
  for(const f of L.floors)for(const o of f.objects)if(o.kind==='steeldoor')IN.lamps.push({x:o.x+o.w/2,y:o.y+o.h/2+(o.w>o.h?18:0),h:20,c:0xff3a22,i:1.3,d:80,floor:f.id});   // a red warning light over a steel door
  for(const f of L.floors)for(const z of f.zones||[])if(z.kind==='rest-med'||z.kind==='rest-sup')IN.hq.push(hqZone({k:z.kind==='rest-med'?'med':'sup',x:z.x0,y:z.y0,w:z.x1-z.x0,h:z.y1-z.y0,floor:f.id}));   // (the lobby's medic station and ammo drop: models added with the floors below)
  // the 3D scene: a floor canvas (1 px per unit; decals paint into it too), the furniture, the lights
  const sc=new T.Scene();sc.background=new T.Color(0x030405);sc.fog=new T.FogExp2(0x030405,0.00022);IN.scene=sc;
  const fc=document.createElement('canvas');fc.width=W;fc.height=H-TOP;const g=fc.getContext('2d');g.setTransform(1,0,0,1,0,-TOP);IN.canvas=fc;
  paintFloors(g,L);
  const tex=new T.CanvasTexture(fc);tex.encoding=T.sRGBEncoding;IN.tex=tex;
  // one group per floor (its floor tiles, walls and furniture): only the floor on screen is shown (setFloor)
  const gmat=new T.MeshStandardMaterial({map:tex,roughness:.82,metalness:.06,alphaTest:.5}),V=y=>1-(y-TOP)/(H-TOP);IN.groups={};
  for(const f of L.floors){
    const b=f.bounds,grp=new T.Group();grp.visible=false;sc.add(grp);IN.groups[f.id]=grp;
    const geo=new T.PlaneGeometry(b.x1-b.x0,b.y1-b.y0);geo.setAttribute('uv',new T.Float32BufferAttribute([b.x0/W,V(b.y0),b.x1/W,V(b.y0),b.x0/W,V(b.y1),b.x1/W,V(b.y1)],2));
    const gr=new T.Mesh(geo,gmat);gr.rotation.x=-Math.PI/2;gr.position.set((b.x0+b.x1)/2,0,(b.y0+b.y1)/2);grp.add(gr);
  }
  for(const z of IN.hq)if(IN.groups[z.floor]){const m=stationMesh(z);IN.groups[z.floor].add(m);z.mesh=m;}   // the lobby's medic station and ammo drop
  // matte (Lambert) for walls and furniture: no glare off the faces the lamps and torches hit, and cheaper on phones; metal keeps a sheen
  const M=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.8,metalness:.1},o)),ML=c=>new T.MeshLambertMaterial({color:c});
  const mat={wall:ML(0x2a2f35),owall:ML(0x202429),cap:ML(0x7a8087),wood:ML(0x5c4a38),light:ML(0x8f897e),metal:M(0x4d5359,{metalness:.5,roughness:.5}),dark:M(0x23272b,{metalness:.4,roughness:.5}),steel:M(0x3a4046,{metalness:.7,roughness:.35}),
    sofa:ML(0x2c3440),leaf:ML(0x2f5a34),bag:ML(0x8a7a5a),screen:new T.MeshBasicMaterial({color:0x5fb8e8,toneMapped:false}),led:new T.MeshBasicMaterial({color:0x37e08a,toneMapped:false}),glow:new T.MeshBasicMaterial({color:0xa8e6ff,toneMapped:false}),
    bars:M(0x2c3034,{metalness:.7,roughness:.4}),hazard:M(0xc8a02a),chair:ML(0x1c2126),door:ML(0x7a5a3c),doorTop:ML(0xc0925a)};
  let tgt=sc;const box=(w,h,d,m,x,y,z)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y,z);tgt.add(b);return b;};
  for(const o of IN.objs){
    if(o.kind==='void')continue;const cx=o.x+o.w/2,cz=o.y+o.h/2,hgt=objHeight(o);tgt=new T.Group();(IN.groups[o.floor]||sc).add(tgt);o.mesh=o.grp=tgt;   // (its own group: doors sink away, gates vanish)
    if(o.kind==='owall'||o.kind==='iwall'||o.kind==='pillar'||o.kind==='liftwall'){   // cut away at waist height with a dark top, like Dark Descent
      box(o.w,hgt,o.h,o.kind==='liftwall'?mat.metal:o.kind==='owall'?mat.owall:mat.wall,cx,hgt/2,cz);box(o.w+.2,1.2,o.h+.2,mat.cap,cx,hgt+.6,cz);
    }else if(o.kind==='steeldoor'){box(o.w,hgt,o.h,mat.steel,cx,hgt/2,cz);for(let k=0;k<3;k++)box(o.w>o.h?o.w:1.2,1.4,o.w>o.h?1.2:o.h,mat.hazard,cx,3+k*4,cz);}
    else if(o.kind==='srail')continue;   // (drawn with its flight: buildFlight)
    else if(o.door){   // a room's door: a wooden slab hinged at its north end (the group sits on the hinge and turns: doorPose, orders.js)
      const dh=10.5;tgt.position.set(cx,0,o.y);box(o.w,dh,o.h-1,mat.door,0,dh/2,o.h/2);box(o.w+.3,.8,o.h-1,mat.doorTop,0,dh+.4,o.h/2);   // (a warm wood top: from above it reads as a door in the wall line, lower than the walls)
      for(const s of[-1,1])box(.8,1.2,1.6,mat.metal,s*(o.w/2+.4),dh*.55,o.h-5);
      doorPose(o,o.open?1:0);
    }
    else if(o.kind==='carddoor'){   // the stair door up top: plain steel with a wired glass panel; the card reader on the wall beside it, stairwell side (east)
      box(o.w,hgt,o.h,mat.metal,cx,hgt/2,cz);box(o.w+.4,4,o.h*.4,mat.dark,cx,8.5,cz);box(o.w+.6,.8,o.h,new T.MeshBasicMaterial({color:0xd02818,toneMapped:false}),cx,hgt+.4,cz);   // a red strip along its top: locked
      for(const e of[o.y-1,o.y+o.h+1])box(o.w+1,hgt+1,2,mat.hazard,cx,(hgt+1)/2,e);   // a yellow frame either side
      tgt=IN.groups[o.floor]||sc;const rd=box(1.4,4,3,mat.dark,o.x+o.w+.7,8,o.y+o.h+4.5);const led=new T.MeshBasicMaterial({color:0xff2a1a,toneMapped:false});
      const l=new T.Mesh(new T.BoxGeometry(.5,.8,.8),led);l.position.set(o.x+o.w+1.5,9.2,o.y+o.h+4.5);tgt.add(l);IN.readerLed=led;rd.userData.reader=true;
    }
    else if(o.kind==='liftdoor'){const v=o.h>o.w;box(v?o.w:o.w/2-.4,hgt,v?o.h/2-.4:o.h,mat.steel,v?cx:o.x+o.w/4,hgt/2,v?o.y+o.h/4:cz);box(v?o.w:o.w/2-.4,hgt,v?o.h/2-.4:o.h,mat.steel,v?cx:o.x+o.w*.75,hgt/2,v?o.y+o.h*.75:cz);}
    else if(o.kind==='cabinet'){box(o.w,hgt,o.h,mat.metal,cx,hgt/2,cz);}
    else if(o.kind==='rack'){box(o.w,hgt,o.h,mat.dark,cx,hgt/2,cz);const r=rng(o.x+o.y);for(let k=0;k<6;k++){const l=new T.Mesh(new T.BoxGeometry(1,1,1),mat.led);l.position.set(o.x+2+r()*(o.w-4),3+r()*(hgt-6),o.w>o.h?o.y-.3:cz);tgt.add(l);}}
    else if(o.kind==='desk'||o.kind==='terminal'){
      box(o.w,hgt,o.h,mat.wood,cx,hgt/2,cz);const on=o.kind==='terminal'||rng(o.x*3+o.y)()<.55,s=box(Math.min(10,o.w*.4),5,1,on?mat.screen:mat.dark,cx,hgt+2.5,cz);if(o.kind==='terminal')s.scale.set(1.4,1.2,1);   // some monitors still on, glowing
      const r=rng(o.x+o.y*5),wide=o.w>=o.h,side=r()<.5?-1:1,ch=box(5,6,5,mat.chair,wide?cx+(r()-.5)*o.w*.5:cx+side*(o.w/2+5),3,wide?cz+side*(o.h/2+5):cz+(r()-.5)*o.h*.5);   // a chair pushed back from it
      if(r()<.2){ch.rotation.z=Math.PI/2;ch.position.y=2.5;}   // knocked over
    }
    else if(o.kind==='counter'){box(o.w,hgt,o.h,mat.light,cx,hgt/2,cz);box(o.w,1,o.h+2,mat.wood,cx,hgt+.5,cz);}
    else if(o.kind==='copier'){box(o.w,hgt,o.h,mat.light,cx,hgt/2,cz);}
    else if(o.kind==='sofa'){box(o.w,hgt,o.h,mat.sofa,cx,hgt/2,cz);}
    else if(o.kind==='planter'){box(o.w,hgt*.6,o.h,mat.dark,cx,hgt*.3,cz);const p=new T.Mesh(new T.SphereGeometry(Math.min(o.w,o.h)*.55,8,6),mat.leaf);p.position.set(cx,hgt*.8,cz);tgt.add(p);}
    else if(o.kind==='crate'){box(o.w,hgt,o.h,mat.wood,cx,hgt/2,cz);}
    else if(o.kind==='sandbag'){box(o.w,hgt,o.h,mat.bag,cx,hgt/2,cz);}
    else if(o.kind==='lab'){o.mesh=box(o.w,hgt,o.h,mat.light,cx,hgt/2,cz);for(let k=0;k<3;k++){const v=new T.Mesh(new T.CylinderGeometry(1.2,1.2,4,8),mat.glow);v.position.set(o.x+o.w*(k+1)/4,hgt+2,cz);tgt.add(v);}}
    else if(o.kind==='bars'){const n=Math.max(2,Math.round(Math.max(o.w,o.h)/4));for(let k=0;k<=n;k++){const t=k/n,b=new T.Mesh(new T.CylinderGeometry(.5,.5,hgt,5),mat.bars);b.position.set(o.w>=o.h?o.x+o.w*t:cx,hgt/2,o.w>=o.h?cz:o.y+o.h*t);tgt.add(b);}box(o.w>=o.h?o.w:1,1,o.w>=o.h?1:o.h,mat.bars,cx,hgt,cz);}
    else box(o.w,Math.max(4,hgt),o.h,mat.light,cx,Math.max(4,hgt)/2,cz);
  }
  {const fm={step:ML(0x50555b),nose:ML(0xb79a3c),pit:ML(0x16191c),rail:M(0x8a9097,{metalness:.6,roughness:.4})};for(const z of IN.flights)buildFlight(z,IN.groups[z.floor]||sc,fm);}
  const hemi2=new T.HemisphereLight(0x7d8aa0,0x120e0a,.15);hemi2.userData.base=.15;sc.add(hemi2);   // dark inside: the lit rooms and the torches carry it (more ambient zoomed out)
  const pool=[];for(let k=0;k<LAMP_POOL;k++){const p=new T.PointLight(0xffffff,0,100,1.4);sc.add(p);pool.push(p);}
  const mz=[];for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);sc.add(m);mz.push(m);}
  const bl=new T.PointLight(0xffa050,0,280,1.6);sc.add(bl);
  IN.lights={hemi:hemi2,moon:null,lampPool:pool,muzzle:mz,boomL:bl};
  officeActs();   // the things to use: the computer, the card, the stairs and the lift, the cells, the man on the wall (office.js)
}
function spawnInterior(){   // the guards at their posts (the men on the landing behind the steel door too), unaware; then the prisoners and scientists (office.js)
  let n=0;
  for(const f of IN.L.floors)if(IN_OPEN.includes(f.id))for(const p of f.posts||[]){
    if(p.role!=='rifleman'&&p.role!=='mg'&&p.role!=='ambusher')continue;
    const r=roomAt(f,p.x,p.y),zone=r?{x0:r.x0+8,x1:r.x1-8,y0:r.y0+8,y1:r.y1-8}:{x0:f.bounds.x0,x1:f.bounds.x1,y0:f.bounds.y0,y1:f.bounds.y1},id='I'+(++n);
    const u=p.role==='mg'?mgGunner(id,p.x,p.y):hostile(id,p.x,p.y,{zone,ang:p.ang});
    Object.assign(u,{ang:p.ang,jumpy:false,floor:f.id,area:p.group,note:p.note,zone:p.role==='mg'?undefined:zone});
    if(/operator/i.test(p.note||''))addRadioKit(u);   // he can call it in: everyone on the floor comes (hunt.js)
  }
  spawnCivs();
}

/* ---------- going in and out ---------- */
function stashOut(going){
  STASH.out={objs:objs.slice(),units:units.filter(u=>!going.includes(u)),hq:HQ_ZONES.slice(),slow:SLOW.slice(),lamps:lamps.slice(),vb:{...VB},fit:{w:FIT.w,h:FIT.h},
    cam:{x:camT.x,z:camT.z,zoom,yaw,tilt},scene,lights:{hemi,moon,lampPool,muzzle,boomL},fx:{tankFires,rockets,charges},x1:EAST_X};   // (x1: its east edge, further once the road east is open: road.js)
}
function useMap(st){   // put a map's objects, boxes, lamps, scene and lights in play
  objs.length=0;objs.push(...st.objs);HQ_ZONES.length=0;HQ_ZONES.push(...st.hq);SLOW.length=0;SLOW.push(...st.slow);lamps.length=0;lamps.push(...st.lamps);
  EAST_X=st.x1||W;rebuildNav();scene=st.scene;({hemi,moon,lampPool,muzzle,boomL}=st.lights);
  shots=[];tracers=[];flashes=[];sparks=[];nades=[];booms=[];callouts=[];smokes=[];preview=null;mode=null;
}
function moveMesh(u,to){if(u.m&&u.m.g.parent!==to){if(u.m.g.parent)u.m.g.parent.remove(u.m.g);to.add(u.m.g);}}
function slotsIn(z,n,taken=[]){   // n free spots 20 apart inside zone z (any that don't fit go just outside it)
  const out=[];for(let y=z.y0+12;y<=z.y1-12&&out.length<n;y+=20)for(let x=z.x0+12;x<=z.x1-12&&out.length<n;x+=20)if(isFree(x,y,8)&&!taken.some(t=>hyp(t.x-x,t.y-y)<18))out.push({x,y});
  while(out.length<n){const s=openSpot((z.x0+z.x1)/2,(z.y0+z.y1)/2,[...taken,...out]);if(!s)break;out.push(s);}
  return out;
}
/* ---------- the stairs in 3D (Bryan: the painted stripes "don't look like they go up at all") ----------
   Each flight in the layout's zones has a direction (dir: the way it climbs or goes down). One going up is a block of concrete
   steps with yellow nosings and a handrail, rising to a little above the walls' cut-away height; one going down drops into a
   hole in the floor (the floor canvas is clear there and the floor material cuts it out: alphaTest) with dark walls round the
   pit. Rails along its sides (srail: they stop feet, not sight, shots or cover) mean you step on at the start and nowhere
   else, and anyone on it rises or sinks with the steps (stairElev, from syncUnits). */
const FLIGHT={up:17,down:20,step:10};
function flightT(z,x,y){return clamp(z.dir==='n'?(z.y1-y)/(z.y1-z.y0):z.dir==='s'?(y-z.y0)/(z.y1-z.y0):z.dir==='w'?(z.x1-x)/(z.x1-z.x0):(x-z.x0)/(z.x1-z.x0),0,1);}   // 0 at its start, 1 at its far end
function stairElev(x,y){
  const fl=MAPID==='in'&&IN?IN.flights:MAPID==='hq'&&HQ?HQ.flights:null;if(!fl)return 0;   // (the Headquarters' stairs: hqfloors.js)
  for(const z of fl)if(x>=z.x0&&x<=z.x1&&y>=z.y0&&y<=z.y1){const t=flightT(z,x,y);return z.up?t*FLIGHT.up:-t*FLIGHT.down;}
  return 0;
}
function flightRails(z,floor){   // both long sides and the far end (2 thick, just inside the zone)
  const ns=z.dir==='n'||z.dir==='s',r=[],o=(x,y,w,h)=>r.push({kind:'srail',x,y,w,h,full:false,floor});
  if(ns){o(z.x0,z.y0,2,z.y1-z.y0);o(z.x1-2,z.y0,2,z.y1-z.y0);o(z.x0,z.dir==='n'?z.y0:z.y1-2,z.x1-z.x0,2);}
  else{o(z.x0,z.y0,z.x1-z.x0,2);o(z.x0,z.y1-2,z.x1-z.x0,2);o(z.dir==='w'?z.x0:z.x1-2,z.y0,2,z.y1-z.y0);}
  return r;
}
function farPart(z,k=.42){   // the last stretch of a flight: where the men going up or down make for, so they take the whole flight
  if(!z.dir)return z;const h=(z.y1-z.y0)*k,w=(z.x1-z.x0)*k;
  return z.dir==='n'?{...z,y1:z.y0+h}:z.dir==='s'?{...z,y0:z.y1-h}:z.dir==='w'?{...z,x1:z.x0+w}:{...z,x0:z.x1-w};
}
function buildFlight(z,grp,M){
  const ns=z.dir==='n'||z.dir==='s',len=ns?z.y1-z.y0:z.x1-z.x0,wid=ns?z.x1-z.x0:z.y1-z.y0,n=Math.max(4,Math.round(len/FLIGHT.step)),sd=len/n,cx=(z.x0+z.x1)/2,cy=(z.y0+z.y1)/2;
  const at=(s,a=0)=>z.dir==='n'?[cx+a,z.y1-s]:z.dir==='s'?[cx+a,z.y0+s]:z.dir==='w'?[z.x1-s,cy+a]:[z.x0+s,cy+a];   // s along the flight from its start, a across it
  const dims=(along,across)=>ns?[across,along]:[along,across];
  const B=(sx,sy,sz,m,x,y,q)=>{const b=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);b.position.set(x,y,q);grp.add(b);return b;};
  const D=FLIGHT.down,bot=-D-6;
  for(let i=0;i<n;i++){
    const s0=i*sd,[x,q]=at(s0+sd/2),[dx,dz]=dims(sd+.02,wid);
    if(z.up){const h=(i+1)*FLIGHT.up/n;B(dx,h,dz,M.step,x,h/2,q);const[nx,nq]=at(s0+.7),[ex,ez]=dims(1.4,wid-.6);B(ex,.4,ez,M.nose,nx,h+.12,nq);}   // a solid block down to the floor; the nosing on its front edge
    else{const top=-(i+1)*D/n,m=M.step.clone();m.color.lerp(new T.Color(0x0b0d0f),.85*(i+1)/n);B(dx,top-bot,dz,m,x,(top+bot)/2,q);const[nx,nq]=at(s0+sd-.7),[ex,ez]=dims(1.4,wid-.6);B(ex,.4,ez,M.nose,nx,top+.12,nq);}   // darker the deeper it goes
  }
  if(!z.up){   // the pit's walls: both long sides and the far end
    for(const a of[-wid/2+.8,wid/2-.8]){const[x,q]=at(len/2,a),[dx,dz]=dims(len,1.6);B(dx,-bot,dz,M.pit,x,bot/2,q);}
    const[x,q]=at(len-.8),[dx,dz]=dims(1.6,wid);B(dx,-bot,dz,M.pit,x,bot/2,q);
  }
  // handrails on both long sides: posts and a rail that follows the flight (level round the hole of one going down)
  const RH=9;for(const a of[-wid/2+1,wid/2-1]){
    const rise=z.up?FLIGHT.up:0,np=Math.max(2,Math.round(len/22));
    for(let k=0;k<=np;k++){const s=len*k/np,[x,q]=at(s,a),h0=z.up?rise*s/len:0;B(.7,RH,.7,M.rail,x,h0+RH/2,q);}
    const[x0,q0]=at(0,a),[x1,q1]=at(len,a),r=new T.Mesh(new T.BoxGeometry(.8,.8,Math.hypot(len,rise)),M.rail);r.position.set((x0+x1)/2,RH+rise/2,(q0+q1)/2);grp.add(r);r.lookAt(x1,RH+rise,q1);
  }
}
function zoneOf(f,kind){const z=(f.zones||[]).find(q=>q.kind===kind);return z&&{x0:z.x0,x1:z.x1,y0:z.y0,y1:z.y1,dir:z.dir};}
function fadeThen(fn){
  const el=$('#fade');fading=true;el.hidden=false;void el.offsetWidth;el.classList.add('on');
  setTimeout(()=>{fn();requestAnimationFrame(()=>{el.classList.remove('on');setTimeout(()=>{el.hidden=true;fading=false;},380);});},380);
}
// the squad at the front doors outside, everyone who's up: in they go (the downed stay outside, frozen, until the squad comes back)
function enterReady(){return MAPID==='out'&&obj===3&&!sciOut&&!dcLocked()&&state==='play'&&players.some(alive)&&players.filter(alive).every(p=>inZone(p,DC_ENTER));}
function enterBuilding(force){   // (force: a Continue from the checkpoint inside: save.js)
  if(fading||(!force&&!enterReady()))return;
  fadeThen(()=>{
    if(!IN)buildInterior();
    if(typeof preloadVoices==='function')preloadVoices(VOICE_IN);   // the prisoners' and scientists' voices (voice.js)
    const going=players.filter(alive);for(const c of going.slice())if(c.carry&&!going.includes(c.carry))going.push(c.carry);   // a man being carried goes in with his carrier
    stashOut(going);
    for(const p of players)p.offMap=!going.includes(p);
    if(!IN.spawned){restoreObjs();resetOffice();}   // a fresh visit: the doors shut and the gates locked again (office.js)
    useMap({objs:IN.objs,hq:IN.hq,slow:[],lamps:IN.lamps,scene:IN.scene,lights:IN.lights});
    tankFires=[];rockets=[];charges=[];
    for(const p of going){moveMesh(p,IN.scene);Object.assign(p,{path:[],peek:null,tk:null,plant:null,supT:null,focus:null,focusTank:null,elev:0,vaultK:0,crawl:false,lx:0,ly:0});}
    units=[...going];MAPID='in';
    if(!IN.spawned){   // a fresh visit (the first, or after a Retry or New game): guards at their posts, the floors clean again
      if(IN.marked){const g=IN.canvas.getContext('2d');g.setTransform(1,0,0,1,0,-TOP);paintFloors(g,IN.L);IN.tex.needsUpdate=true;IN.marked=false;}
      spawnInterior();IN.spawned=true;IN.units=units.filter(u=>u.side!=='P');}else{for(const u of IN.units){moveMesh(u,IN.scene);units.push(u);}}
    enemies=units.filter(u=>u.side==='E');civs=units.filter(u=>u.side==='C');
    const gf=IN.floors.GF,ez=zoneOf(gf,'entry-spawn')||{x0:gf.bounds.x0+40,x1:gf.bounds.x1-40,y0:gf.bounds.y1-90,y1:gf.bounds.y1-20},spots=slotsIn(ez,going.length);
    going.forEach((p,i)=>{const s=spots[i]||spots[0]||{x:(ez.x0+ez.x1)/2,y:(ez.y0+ez.y1)/2};p.x=s.x;p.y=s.y;p.ang=-Math.PI/2;});
    contact=false;clearTeams();sel=sel.filter(u=>going.includes(u));cardGroup=cardGroup.filter(u=>going.includes(u));
    setFloor('GF',{x:(ez.x0+ez.x1)/2,y:(ez.y0+ez.y1)/2-110});zoom=2.4;clampCam();updateCamera();
    objCompleted(1);updateObjUI();setStatus();buildCards();hud();floorChip();
    banner('Find the scientists on the top floor',3000);saveGame('dci');   // getting in is a checkpoint (Bryan): the lobby's medic station and ammo drop are right here
  });
}
// leaving with the scientists: everyone who's up (the freed prisoners too) at the front doors, and at least one detained scientist on
// this floor (they follow the soldier who tied them, and come out with the squad)
function exitReady(){
  if(MAPID!=='in'||!detained().some(c=>floorOf(c.x,c.y)==='GF')||state!=='play')return false;
  const z=zoneOf(IN.floors.GF,'exit');if(!z)return false;
  const ups=players.filter(p=>alive(p)&&!p.offMap);return ups.length>0&&ups.every(p=>inZone(p,z))&&!players.some(p=>p.downed&&!p.offMap&&!p.carriedBy);   // (a man being carried goes out with his carrier)
}
function exitBuilding(){
  if(fading||!exitReady())return;
  fadeThen(()=>{
    const out=STASH.out,back=players.filter(p=>!p.dead&&(!p.offMap||p.downed)),sci=detained();   // anyone left downed outside was stabilised and rejoins here; the detained scientists come along
    for(const p of back)if(p.offMap&&p.downed)Object.assign(p,{downed:false,hp:Math.max(p.hp,35),revive:0,bleed:BLEED_T,sup:0});
    for(const u of units)if(u.side!=='P'&&!sci.includes(u)&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
    useMap(out);({tankFires,rockets,charges}=out.fx);
    for(const p of [...back,...sci])moveMesh(p,out.scene);
    units=[...out.units.filter(u=>!back.includes(u)),...back,...sci];enemies=units.filter(u=>u.side==='E');civs=sci.slice();sciOut=sci.length;MAPID='out';
    for(const p of players)p.offMap=false;
    const spots=slotsIn(DC_ENTER,back.length+sci.length);[...back,...sci].forEach((p,i)=>{const s=spots[i]||{x:245,y:-410};Object.assign(p,{x:s.x,y:s.y,path:[],ang:Math.PI/2,peek:null,stairs:null,lift:null});});
    VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();camT={x:245,z:-380};zoom=2.4;yaw=out.cam.yaw;tilt=out.cam.tilt;clampCam();updateCamera();
    contact=false;clearTeams();sel=[];cardGroup=[];floorChip();
    obj=4;objCompleted(2);updateObjUI();setStatus();buildCards();hud();saveGame('sci');
    setTimeout(()=>{if(state==='play'&&obj===4)banner('Take a scientist to the drawbridge\'s bio scanner',3500);},OBJ_LIST_T);
  });
}
// back outside at once, without the ceremony (a new game or Continue while inside)
function leaveInteriorNow(){
  if(IN){for(const u of IN.units)if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);IN.units=[];IN.spawned=false;}   // the next visit starts fresh
  if(MAPID!=='in')return;const out=STASH.out;
  for(const u of units)if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';for(const p of players){p.offMap=false;moveMesh(p,out.scene);}
  units=[...out.units,...players.filter(p=>!out.units.includes(p))];enemies=units.filter(u=>u.side==='E');civs=[];
  VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();floorChip();
}

/* ---------- floors ---------- */
function setFloor(id,at){
  if(!IN||!IN.floors[id])return;curFloor=id;const b=IN.floors[id].bounds;
  for(const k in IN.groups)IN.groups[k].visible=k===id;
  VB={x0:b.x0,z0:b.y0,x1:b.x1,z1:b.y1};FIT.w=b.x1-b.x0+40;FIT.h=b.y1-b.y0+40;fitDist();
  camT=at?{x:at.x,z:at.y}:{x:(b.x0+b.x1)/2,z:(b.y0+b.y1)/2};clampCam();updateCamera();floorChip();
}
const FLOOR_NAMES={'1F':'1F','GF':'GF','B1':'B1','2F':'2F',RF:'ROOF'};
function floorChip(){   // the floor switcher, right side: which floor you're looking at, and dots for who's on each (the office building, or the Headquarters once it has its upstairs)
  const el=$('#floors');if(!el)return;const hqF=hqFloors();el.hidden=MAPID!=='in'&&!hqF;if(el.hidden)return;
  const ids=hqF?HQ_FLOOR_IDS:['1F','GF','B1'].filter(id=>IN.floors[id]&&IN_OPEN.includes(id)),fo=hqF?hqFloorOf:floorOf,key=ids.join();
  if(el.dataset.ids!==key){el.dataset.ids=key;el.innerHTML=ids.map(id=>`<button data-f="${id}"><b>${FLOOR_NAMES[id]||id}</b><i></i></button>`).join('');}
  for(const b of el.children){const id=b.dataset.f;b.classList.toggle('on',id===curFloor);
    b.querySelector('i').innerHTML=players.filter(p=>!p.dead&&!p.offMap&&fo(p.x,p.y)===id).map(p=>`<span style="background:${teamCol(p)}"></span>`).join('');}
}
function bindFloors(){
  const el=$('#floors');if(!el)return;
  el.addEventListener('click',ev=>{const b=ev.target.closest('button'),hqF=hqFloors();if(!b||(MAPID!=='in'&&!hqF))return;const id=b.dataset.f,fo=hqF?hqFloorOf:floorOf;
    const on=players.filter(p=>alive(p)&&!p.offMap&&fo(p.x,p.y)===id);if(id!==curFloor&&!mayLeave(on))return;   // (not away from men under fire: input.js)
    const at=on.length?{x:on.reduce((a,p)=>a+p.x,0)/on.length,y:on.reduce((a,p)=>a+p.y,0)/on.length}:null;if(hqF)setHQFloor(id,at);else setFloor(id,at);});
}

/* ---------- noise and contact inside ---------- */
// a shot or a blast at (x,y) (and where it lands, x2,y2) alerts the hostiles on that floor who'd hear it: anyone in the
// same room, in sight within IN_HEAR_OPEN, through walls within IN_HEAR_WALL
function alertNear(x,y,msg,ambush,x2,y2,lk,open=IN_HEAR_OPEN,wall=IN_HEAR_WALL,room=true,who){   // room=false: not everyone in the room (a silenced shot)
  const f=floorOf(x,y),fl=IN.floors[f];let any=false;
  const pts=x2==null?[[x,y]]:[[x,y],[x2,y2]],rooms=fl&&room?pts.map(([px,py])=>roomAt(fl,px,py)).filter(Boolean):[];
  const hears=e=>{if(fl&&rooms.includes(roomAt(fl,e.x,e.y)))return true;
    for(const[px,py]of pts){const d=hyp(e.x-px,e.y-py);if(d<=wall||(d<=open&&gridSight(px,py,e.x,e.y)))return true;}return false;};
  for(const e of enemies){
    if(e.dead||e.alerted||e.surr||e.floor!==f||!hears(e))continue;
    alertOne(e,lk||{x,y},ambush);any=true;   // (hunt.js: he'll come looking where the noise was)
  }
  if(any)startContact(msg,ambush,who||lk);   // an ambush only if it caught someone unaware (who: whose team gave itself away, hunt.js)
  return any;
}
let inQuietT=0;
function interiorTick(dt){
  useTick(dt);officeTick(dt);
  if((inQuietT-=dt)>0)return;inQuietT=.5;
  floorChip();   // (contact ending: hunt.js, for both maps)
}
function inThreat(){const b=IN.floors[curFloor].bounds;return{x:(b.x0+b.x1)/2,y:b.y0+40};}   // before anyone's seen inside: where previews judge cover from

/* ---------- things to use (Bryan: one way to use everything) ---------- */
// A ring and a word where it is. A pickup is taken by walking over it. Anything else: with soldiers selected, a tap on it
// sends the nearest one; a ring fills while he works (secs), then it happens. Each has avail() and act(u).
const ACTS=[];let useGos=[];   // (one soldier a job: layers.js pickFor)
const useOf=u=>useGos.find(g=>g.u===u)||null,useFor=a=>useGos.find(g=>g.a===a)||null;
function actsHere(){return ACTS.filter(a=>a.map===MAPID&&a.avail());}
function actAt(wx,wy){let best=null,bd=1e9;for(const a of actsHere()){let d=hyp(a.x-wx,a.y-wy);if(a.near){const o=a.near();if(o)d=Math.min(d,rectDist(wx,wy,o)+4);}if(d<=a.r+10&&d<bd){bd=d;best=a;}}return best;}   // (near: something with a body, a lab bench: a tap anywhere on it)
function orderUse(a){
  const why=a.need&&a.need();if(why){if(why===CARD_NEED&&orderHack(a))return;banner(why,2600);return;}   // locked: say what it needs, don't walk there (a Cyber Ops selected gets in without the card: skills.js)
  const foot=sel.filter(u=>alive(u)&&!u.inVeh&&!u.carry).sort((p,q)=>hyp(p.x-a.x,p.y-a.y)-hyp(q.x-a.x,q.y-a.y));
  if(!foot.length){banner('Select a soldier first.',1600);return;}
  if(a.multi){a.go(foot);return;}   // the stairs and the lift: everyone selected goes (office.js)
  if(useFor(a))return;   // (someone's already on it)
  const sx=a.x+(a.standX||0),sy=a.y+(a.standY??14),u=pickFor(foot,a.x,a.y),s=openSpot(sx,sy,players.filter(p=>p!==u&&!p.dead).map(destOf))||{x:sx,y:sy},p=findPath(u.x,u.y,s.x,s.y);
  if(!p){banner('No way there from here.',1600);return;}
  u.path=p;u.lastOrder=simT;useGos=useGos.filter(g=>g.u!==u);zipGos=zipGos.filter(z=>z.u!==u);useGos.push({u,a,prog:0});markRet(u);callout(u,'Moving',C.good);
}
function useTick(dt){
  for(const a of actsHere())if(a.pickup){const u=players.find(p=>alive(p)&&!p.offMap&&hyp(p.x-a.x,p.y-a.y)<a.r);if(u)a.act(u);}
  for(const g of[...useGos]){const{u,a}=g,end=()=>{useGos=useGos.filter(q=>q!==g);};
    if(!alive(u)||!a.avail()||(u.path.length&&simT-u.lastOrder>.1&&hyp(u.path[u.path.length-1].x-a.x,u.path[u.path.length-1].y-a.y)>30)){end();continue;}
    if(u.path.length)continue;
    if(hyp(u.x-a.x,u.y-a.y)>a.r+18){end();continue;}
    g.prog+=dt;if(g.prog>=(g.secs||a.secs||0)){end();if(g.hack){a.hacked=true;callout(u,'Bypassed',C.good);if(a.multi){banner(`${a.label}: unlocked. Tap it again to use it.`,2400);continue;}}a.act(u);backSoon(u);}}   // (done: back to the others: retTick in combat.js)
}
function drawActs(now){
  const pulse=(Math.sin(now*3)+1)/2,act=sel.some(alive);
  for(const a of actsHere()){
    if(a.floor&&a.floor!==curFloor)continue;
    gPath(a.x,a.y,a.r+pulse*3);ox.strokeStyle=a.pickup?'#7ff0ff':'#ffcf4a';ox.lineWidth=2;ox.setLineDash([5,5]);ox.lineDashOffset=-now*10;ox.stroke();ox.setLineDash([]);
    const[lx,ly]=below(a.x,a.y+a.r,6);if(act&&!a.pickup)pill(a.label,lx,ly,C.good);else label(a.label,lx,ly,a.pickup?'#7ff0ff':'#ffcf4a',9,700);
  }
  for(const g of useGos)if(!g.u.path.length&&(g.secs||g.a.secs)){const u=g.u,T2=g.secs||g.a.secs;gPath(u.x,u.y,14,-Math.PI/2,-Math.PI/2+g.prog/T2*TAU);ox.strokeStyle='#ffcf4a';ox.lineWidth=2.4;ox.stroke();}
}
// the gather areas: ENTER at the data center's front doors outside, EXIT at the lobby's front doors inside
function gatherZone(){
  if(MAPID==='out'&&obj===3&&!sciOut)return{z:DC_ENTER,ready:enterReady(),go:'ENTER',need:players.filter(alive),locked:dcLocked()};
  if(MAPID==='in'&&detained().length){const z=zoneOf(IN.floors.GF,'exit');if(z)return{z,ready:exitReady(),go:'LEAVE',need:players.filter(p=>alive(p)&&!p.offMap)};}
  return roadGather();   // (GO OUT of the finished Headquarters, the tunnel at the end of the road east: road.js)
}
const gatherZones=()=>{const G=gatherZone();return !G?[]:Array.isArray(G)?G:[G];};   // (the tunnel has one at each end: road.js)
function drawGather(now){for(const G of gatherZones())drawGatherOne(G,now);}
function drawGatherOne(G,now){
  const z=G.z,pulse=(Math.sin(now*4)+1)/2;
  toSBack=false;const c=[[z.x0,z.y0],[z.x1,z.y0],[z.x1,z.y1],[z.x0,z.y1]].map(([x,y])=>toS(x,y,.4));if(toSBack)return;
  ox.beginPath();ox.moveTo(...c[0]);for(const p of c)ox.lineTo(...p);ox.closePath();
  ox.fillStyle=`rgba(95,224,142,${(G.ready?.18:.06+pulse*.07).toFixed(3)})`;ox.fill();
  ox.setLineDash(G.ready?[]:[10,7]);ox.lineDashOffset=-now*14;ox.strokeStyle='rgba(95,224,142,.95)';ox.lineWidth=2.4;ox.stroke();ox.setLineDash([]);
  const n=G.need.filter(p=>inZone(p,z)).length,[lx,ly]=below((z.x0+z.x1)/2,z.y1,8);
  if(G.locked){label('LOCKED · THEY\'RE SEARCHING',lx,ly,'#ffb35a',10,700);return;}   // (the dashes still say where)
  if(G.ready)pill(G.auto?G.go:`TAP TO ${G.go}`,lx,ly,C.good);else label(`${G.name||G.go} ${n}/${G.need.length}`,lx,ly,'#5fe08e',11,700);   // (auto: it goes by itself once everyone's in it)
}
// a tap: on a ready gather area it goes; on something to use it's used; returns true if the tap was taken
function interiorTap(wx,wy){
  if(fading)return true;
  for(const G of gatherZones()){
    const onG=wx>=G.z.x0-20&&wx<=G.z.x1+20&&wy>=G.z.y0-20&&wy<=G.z.y1+20;
    if(onG&&G.locked&&!sel.length){banner('Not while the alarm is going or they\'re searching for you. Lose them first.',2600);if(typeof gen==='function'){const w=tutBy(G.z.x0,G.z.y0);if(w)chat('dclock',12,gen(w,'dclock'));}return true;}
    if(onG&&G.ready){if(G.fn)G.fn();else if(MAPID==='out')enterBuilding();else exitBuilding();return true;}
  }
  const a=actAt(wx,wy);if(a&&!a.pickup){orderUse(a);return true;}
  return false;
}

"use strict";
/* The office building's inside (objective 4; Bryan's design and the review: docs/office-building.md) as its own map.
   The outdoor map and the interior share one frame (x 0..W, y TOP..H) and one engine: going in swaps what's in it: the
   objects (and so the nav grid, cover points, vault links and sight grid: rebuildNav), the units, the medical and supply
   boxes, the lamps, the camera's bounds, and the 3D scene (a second THREE.Scene with its own lights and floor canvas).
   The floors (OFFICE_LAYOUT: GF, B1, 1F) sit side by side in the frame with 'void' between them; the camera shows one at a
   time (the floor chip switches it) and every floor runs at once, so the fire teams can split (Bryan). Inside, noise only
   carries to nearby rooms on the same floor (alertNear), and contact ends once no alerted hostile on a floor with the squad
   has seen them for a while, so the squad can go quiet again between rooms. Things to use (the decryption key for now;
   the computer, cells and the rest in the next steps) share one look and one tap (ACTS). */
let MAPID='out',curFloor='GF',hasKey=false,dcTaken=false,fading=false;
let IN=null;            // the interior once built: {L,floors,objs,lamps,hq,units,scene,lights,canvas,tex}
const STASH={};         // the map that isn't in play
const IN_HEAR_OPEN=260,IN_HEAR_WALL=110,IN_QUIET=8;   // how far gunfire carries inside, in sight and through walls; s unseen before contact ends
const IN_OPEN=['GF'];   // the floors the built steps use (docs/office-building.md: B1 with step 3, 1F with step 4); the others are built but empty and off the floor chip

/* ---------- building it ---------- */
// the frame minus the floors: invisible full blocks, so nothing between the floors is walkable or gives cover points
function voidRects(bs){
  const xs=[...new Set([0,W,...bs.flatMap(b=>[b.x0,b.x1])])].sort((a,b)=>a-b),ys=[...new Set([TOP,H,...bs.flatMap(b=>[b.y0,b.y1])])].sort((a,b)=>a-b),out=[];
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
const offFloor=u=>MAPID==='in'&&!!IN&&floorOf(u.x,u.y)!==curFloor;   // on another floor of the building than the one on screen: not drawn
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
    for(const z of f.zones||[])if(/stairs/.test(z.kind)){g.fillStyle='rgba(255,255,255,.06)';for(let y=z.y0;y<z.y1;y+=6)g.fillRect(z.x0,y,z.x1-z.x0,2);}   // stair treads
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
  for(const o of IN.objs){if(o.kind==='void')continue;const wall=/wall|pillar|steeldoor|cabinet|rack/.test(o.kind);g.shadowColor=wall?'rgba(0,0,0,.8)':'rgba(0,0,0,.6)';g.shadowBlur=wall?16:9;g.fillRect(o.x,o.y,o.w,o.h);}
  g.restore();
}
function buildInterior(){
  const L=OFFICE_LAYOUT;
  IN={L,floors:{},objs:[],lamps:[],hq:[],units:[],acts:[],scene:null,lights:null,canvas:null,tex:null};
  for(const f of L.floors)IN.floors[f.id]=f;
  for(const f of L.floors)for(const o of f.objects)IN.objs.push({kind:o.kind,x:o.x,y:o.y,w:o.w,h:o.h,full:FULL.has(o.kind),floor:f.id});
  IN.objs.push(...voidRects(L.floors.map(f=>f.bounds)));
  // the light plan (docs/feel-plan.md: rooms you can read): rooms with people in them and the main spaces are lit, a hallway
  // tube sputters, empty rooms are dark or lit only by a red emergency light. One light every 12 m along anything long.
  // (They share the lamp pool like the street lamps.)
  for(const f of L.floors)for(const r of f.rooms||[]){
    const w=r.x1-r.x0,h=r.y1-r.y0,n=Math.max(1,Math.round(Math.max(w,h)/120)),floor=f.id,nm=r.name||'',rr=rng(Math.round(r.x0*13+r.y0*7));
    const occupied=(f.posts||[]).some(p=>/rifleman|mg|ambusher/.test(p.role)&&p.x>=r.x0&&p.x<=r.x1&&p.y>=r.y0&&p.y<=r.y1),main=/lobby|reception|shared|science|turret|stair|lift/i.test(nm),hall=/hall/i.test(nm);
    if(!occupied&&!main&&!hall){if(rr()<.5)IN.lamps.push({x:(r.x0+r.x1)/2,y:r.y0+12,h:22,c:0xff3a2a,i:.7,d:110,floor});continue;}   // empty: dark, or a red emergency light
    for(let k=0;k<n;k++){const t=(k+.5)/n;IN.lamps.push({x:w>=h?r.x0+w*t:(r.x0+r.x1)/2,y:w>=h?(r.y0+r.y1)/2:r.y0+h*t,h:32,c:/cell|basement/i.test(nm)?0xffd39a:/lab|science/i.test(nm)?0xe4f0ff:/office|meeting|security/i.test(nm)?0xffe9c8:0xf0f2f4,i:1.5,d:190,ceil:1,floor,flick:hall&&k===0});}
  }
  for(const f of L.floors)for(const o of f.objects)if(o.kind==='steeldoor')IN.lamps.push({x:o.x+o.w/2,y:o.y+o.h/2+(o.w>o.h?18:0),h:20,c:0xff3a22,i:1.3,d:80,floor:f.id});   // a red warning light over a steel door
  for(const f of L.floors)for(const z of f.zones||[])if(z.kind==='rest-med'||z.kind==='rest-sup')IN.hq.push(hqZone({k:z.kind==='rest-med'?'med':'sup',x:z.x0,y:z.y0,w:z.x1-z.x0,h:z.y1-z.y0}));
  // the 3D scene: a floor canvas (1 px per unit; decals paint into it too), the furniture, the lights
  const sc=new T.Scene();sc.background=new T.Color(0x030405);sc.fog=new T.FogExp2(0x030405,0.00022);IN.scene=sc;
  const fc=document.createElement('canvas');fc.width=W;fc.height=H-TOP;const g=fc.getContext('2d');g.setTransform(1,0,0,1,0,-TOP);IN.canvas=fc;
  paintFloors(g,L);
  const tex=new T.CanvasTexture(fc);tex.encoding=T.sRGBEncoding;IN.tex=tex;
  // one group per floor (its floor tiles, walls and furniture): only the floor on screen is shown (setFloor)
  const gmat=new T.MeshStandardMaterial({map:tex,roughness:.82,metalness:.06}),V=y=>1-(y-TOP)/(H-TOP);IN.groups={};
  for(const f of L.floors){
    const b=f.bounds,grp=new T.Group();grp.visible=false;sc.add(grp);IN.groups[f.id]=grp;
    const geo=new T.PlaneGeometry(b.x1-b.x0,b.y1-b.y0);geo.setAttribute('uv',new T.Float32BufferAttribute([b.x0/W,V(b.y0),b.x1/W,V(b.y0),b.x0/W,V(b.y1),b.x1/W,V(b.y1)],2));
    const gr=new T.Mesh(geo,gmat);gr.rotation.x=-Math.PI/2;gr.position.set((b.x0+b.x1)/2,0,(b.y0+b.y1)/2);grp.add(gr);
  }
  // matte (Lambert) for walls and furniture: no glare off the faces the lamps and torches hit, and cheaper on phones; metal keeps a sheen
  const M=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.8,metalness:.1},o)),ML=c=>new T.MeshLambertMaterial({color:c});
  const mat={wall:ML(0x2a2f35),owall:ML(0x202429),cap:ML(0x7a8087),wood:ML(0x5c4a38),light:ML(0x8f897e),metal:M(0x4d5359,{metalness:.5,roughness:.5}),dark:M(0x23272b,{metalness:.4,roughness:.5}),steel:M(0x3a4046,{metalness:.7,roughness:.35}),
    sofa:ML(0x2c3440),leaf:ML(0x2f5a34),bag:ML(0x8a7a5a),screen:new T.MeshBasicMaterial({color:0x5fb8e8,toneMapped:false}),led:new T.MeshBasicMaterial({color:0x37e08a,toneMapped:false}),glow:new T.MeshBasicMaterial({color:0xa8e6ff,toneMapped:false}),
    bars:M(0x2c3034,{metalness:.7,roughness:.4}),hazard:M(0xc8a02a),chair:ML(0x1c2126)};
  let tgt=sc;const box=(w,h,d,m,x,y,z)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y,z);tgt.add(b);return b;};
  for(const o of IN.objs){
    if(o.kind==='void')continue;const cx=o.x+o.w/2,cz=o.y+o.h/2,hgt=objHeight(o);tgt=IN.groups[o.floor]||sc;
    if(o.kind==='owall'||o.kind==='iwall'||o.kind==='pillar'||o.kind==='liftwall'){   // cut away at waist height with a dark top, like Dark Descent
      box(o.w,hgt,o.h,o.kind==='liftwall'?mat.metal:o.kind==='owall'?mat.owall:mat.wall,cx,hgt/2,cz);box(o.w+.2,1.2,o.h+.2,mat.cap,cx,hgt+.6,cz);
    }else if(o.kind==='steeldoor'){box(o.w,hgt,o.h,mat.steel,cx,hgt/2,cz);for(let k=0;k<3;k++)box(o.w>o.h?o.w:1.2,1.4,o.w>o.h?1.2:o.h,mat.hazard,cx,3+k*4,cz);}
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
  const hemi2=new T.HemisphereLight(0x7d8aa0,0x120e0a,.15);hemi2.userData.base=.15;sc.add(hemi2);   // dark inside: the lit rooms and the torches carry it (more ambient zoomed out)
  const pool=[];for(let k=0;k<LAMP_POOL;k++){const p=new T.PointLight(0xffffff,0,100,1.4);sc.add(p);pool.push(p);}
  const mz=[];for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);sc.add(m);mz.push(m);}
  const bl=new T.PointLight(0xffa050,0,280,1.6);sc.add(bl);
  IN.lights={hemi:hemi2,moon:null,lampPool:pool,muzzle:mz,boomL:bl};
  // the things to use, from the layout (more kinds join in the next steps)
  for(const f of L.floors)if(IN_OPEN.includes(f.id))for(const it of f.interact||[]){
    if(it.kind==='key')ACTS.push({id:'key',map:'in',floor:f.id,x:it.x,y:it.y,r:16,label:'DECRYPTION KEY',pickup:true,avail:()=>!hasKey,act:u=>takeKey(u)});
  }
}
function spawnInterior(){   // the guards at their posts, unaware (ambushers, prisoners, scientists come with their own steps)
  let n=0;
  for(const f of IN.L.floors)if(IN_OPEN.includes(f.id))for(const p of f.posts||[]){
    if(p.role!=='rifleman'&&p.role!=='mg')continue;
    const r=roomAt(f,p.x,p.y),zone=r?{x0:r.x0+8,x1:r.x1-8,y0:r.y0+8,y1:r.y1-8}:{x0:f.bounds.x0,x1:f.bounds.x1,y0:f.bounds.y0,y1:f.bounds.y1},id='I'+(++n);
    const u=p.role==='mg'?mgGunner(id,p.x,p.y):hostile(id,p.x,p.y,{zone,ang:p.ang});
    Object.assign(u,{ang:p.ang,jumpy:false,floor:f.id,area:p.group,zone:p.role==='mg'?undefined:zone});
    if(/operator/i.test(p.note||''))addRadioKit(u);   // he can call it in: everyone on the floor comes (hunt.js)
  }
}

/* ---------- going in and out ---------- */
function stashOut(going){
  STASH.out={objs:objs.slice(),units:units.filter(u=>!going.includes(u)),hq:HQ_ZONES.slice(),slow:SLOW.slice(),lamps:lamps.slice(),vb:{...VB},fit:{w:FIT.w,h:FIT.h},
    cam:{x:camT.x,z:camT.z,zoom,yaw,tilt},scene,lights:{hemi,moon,lampPool,muzzle,boomL},fx:{tankFires,rockets,charges}};
}
function useMap(st){   // put a map's objects, boxes, lamps, scene and lights in play
  objs.length=0;objs.push(...st.objs);HQ_ZONES.length=0;HQ_ZONES.push(...st.hq);SLOW.length=0;SLOW.push(...st.slow);lamps.length=0;lamps.push(...st.lamps);
  rebuildNav();scene=st.scene;({hemi,moon,lampPool,muzzle,boomL}=st.lights);
  shots=[];tracers=[];flashes=[];sparks=[];nades=[];booms=[];callouts=[];smokes=[];preview=null;mode=null;
}
function moveMesh(u,to){if(u.m&&u.m.g.parent!==to){if(u.m.g.parent)u.m.g.parent.remove(u.m.g);to.add(u.m.g);}}
function slotsIn(z,n,taken=[]){   // n free spots 20 apart inside zone z (any that don't fit go just outside it)
  const out=[];for(let y=z.y0+12;y<=z.y1-12&&out.length<n;y+=20)for(let x=z.x0+12;x<=z.x1-12&&out.length<n;x+=20)if(isFree(x,y,8)&&!taken.some(t=>hyp(t.x-x,t.y-y)<18))out.push({x,y});
  while(out.length<n){const s=openSpot((z.x0+z.x1)/2,(z.y0+z.y1)/2,[...taken,...out]);if(!s)break;out.push(s);}
  return out;
}
function zoneOf(f,kind){const z=(f.zones||[]).find(q=>q.kind===kind);return z&&{x0:z.x0,x1:z.x1,y0:z.y0,y1:z.y1};}
function fadeThen(fn){
  const el=$('#fade');fading=true;el.hidden=false;void el.offsetWidth;el.classList.add('on');
  setTimeout(()=>{fn();requestAnimationFrame(()=>{el.classList.remove('on');setTimeout(()=>{el.hidden=true;fading=false;},380);});},380);
}
// the squad at the front doors outside, everyone who's up: in they go (the downed stay outside, frozen, until the squad comes back)
function enterReady(){return MAPID==='out'&&obj===3&&dcTaken&&!hasKey&&state==='play'&&players.some(alive)&&players.filter(alive).every(p=>inZone(p,DC_ENTER));}
function enterBuilding(){
  if(fading||!enterReady())return;
  fadeThen(()=>{
    if(!IN)buildInterior();
    const going=players.filter(alive);for(const c of going.slice())if(c.carry&&!going.includes(c.carry))going.push(c.carry);   // a man being carried goes in with his carrier
    stashOut(going);
    for(const p of players)p.offMap=!going.includes(p);
    useMap({objs:IN.objs,hq:IN.hq,slow:[],lamps:IN.lamps,scene:IN.scene,lights:IN.lights});
    tankFires=[];rockets=[];charges=[];
    for(const p of going){moveMesh(p,IN.scene);Object.assign(p,{path:[],peek:null,tk:null,plant:null,supT:null,focus:null,focusTank:null,elev:0,vaultK:0,crawl:false,lx:0,ly:0});}
    units=[...going];MAPID='in';
    if(!IN.spawned){   // a fresh visit (the first, or after a Retry or New game): guards at their posts, the floors clean again
      if(IN.marked){const g=IN.canvas.getContext('2d');g.setTransform(1,0,0,1,0,-TOP);paintFloors(g,IN.L);IN.tex.needsUpdate=true;IN.marked=false;}
      spawnInterior();IN.spawned=true;IN.units=units.filter(u=>u.side==='E');}else{for(const u of IN.units){moveMesh(u,IN.scene);units.push(u);}}
    enemies=units.filter(u=>u.side==='E');
    const gf=IN.floors.GF,ez=zoneOf(gf,'entry-spawn')||{x0:gf.bounds.x0+40,x1:gf.bounds.x1-40,y0:gf.bounds.y1-90,y1:gf.bounds.y1-20},spots=slotsIn(ez,going.length);
    going.forEach((p,i)=>{const s=spots[i]||spots[0]||{x:(ez.x0+ez.x1)/2,y:(ez.y0+ez.y1)/2};p.x=s.x;p.y=s.y;p.ang=-Math.PI/2;});
    contact=false;sel=sel.filter(u=>going.includes(u));cardGroup=cardGroup.filter(u=>going.includes(u));
    setFloor('GF',{x:(ez.x0+ez.x1)/2,y:(ez.y0+ez.y1)/2-110});zoom=2.4;clampCam();updateCamera();
    updateObjUI();setStatus();buildCards();hud();floorChip();
    banner('Find the decryption key',3000);
  });
}
// leaving with the key: the squad's original four who are up step out at the front doors (the freed prisoners will stay behind: next steps)
function exitReady(){
  if(MAPID!=='in'||!hasKey||state!=='play')return false;
  const z=zoneOf(IN.floors.GF,'exit');if(!z)return false;
  const ups=players.filter(p=>alive(p)&&!p.offMap);return ups.length>0&&ups.every(p=>inZone(p,z))&&!players.some(p=>p.downed&&!p.offMap&&!p.carriedBy);   // (a man being carried goes out with his carrier)
}
function exitBuilding(){
  if(fading||!exitReady())return;
  fadeThen(()=>{
    const out=STASH.out,back=players.filter(p=>!p.dead&&(!p.offMap||p.downed));   // anyone left downed outside was stabilised and rejoins here
    for(const p of back)if(p.offMap&&p.downed)Object.assign(p,{downed:false,hp:Math.max(p.hp,35),revive:0,bleed:BLEED_T,sup:0});
    for(const u of units)if(u.side==='E'&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
    useMap(out);({tankFires,rockets,charges}=out.fx);
    for(const p of back)moveMesh(p,out.scene);
    units=[...out.units.filter(u=>!back.includes(u)),...back];enemies=units.filter(u=>u.side==='E');MAPID='out';
    for(const p of players)p.offMap=false;
    const spots=slotsIn(DC_ENTER,back.length);back.forEach((p,i)=>{const s=spots[i]||{x:245,y:-410};Object.assign(p,{x:s.x,y:s.y,path:[],ang:Math.PI/2,peek:null});});
    VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();camT={x:245,z:-380};zoom=2.4;yaw=out.cam.yaw;tilt=out.cam.tilt;clampCam();updateCamera();
    contact=false;sel=[];cardGroup=[];floorChip();
    obj=4;updateObjUI();setStatus();buildCards();hud();saveGame('key');
    setTimeout(()=>{if(state==='play'&&obj===4)banner(OBJ_INTRO[4],3500);},1200);
  });
}
// back outside at once, without the ceremony (a new game or Continue while inside)
function leaveInteriorNow(){
  if(IN){for(const u of IN.units)if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);IN.units=[];IN.spawned=false;}   // the next visit starts fresh
  if(MAPID!=='in')return;const out=STASH.out;
  for(const u of units)if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';for(const p of players){p.offMap=false;moveMesh(p,out.scene);}
  units=[...out.units,...players.filter(p=>!out.units.includes(p))];enemies=units.filter(u=>u.side==='E');
  VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();floorChip();
}

/* ---------- floors ---------- */
function setFloor(id,at){
  if(!IN||!IN.floors[id])return;curFloor=id;const b=IN.floors[id].bounds;
  for(const k in IN.groups)IN.groups[k].visible=k===id;
  VB={x0:b.x0,z0:b.y0,x1:b.x1,z1:b.y1};FIT.w=b.x1-b.x0+40;FIT.h=b.y1-b.y0+40;fitDist();
  camT=at?{x:at.x,z:at.y}:{x:(b.x0+b.x1)/2,z:(b.y0+b.y1)/2};clampCam();updateCamera();floorChip();
}
const FLOOR_NAMES={'1F':'1F','GF':'GF','B1':'B1'};
function floorChip(){   // the floor switcher, right side: which floor you're looking at, and dots for who's on each
  const el=$('#floors');if(!el)return;el.hidden=MAPID!=='in';if(el.hidden)return;
  const ids=['1F','GF','B1'].filter(id=>IN.floors[id]&&IN_OPEN.includes(id));
  if(el.children.length!==ids.length)el.innerHTML=ids.map(id=>`<button data-f="${id}"><b>${FLOOR_NAMES[id]}</b><i></i></button>`).join('');
  for(const b of el.children){const id=b.dataset.f;b.classList.toggle('on',id===curFloor);
    b.querySelector('i').innerHTML=players.filter(p=>!p.dead&&!p.offMap&&floorOf(p.x,p.y)===id).map(p=>`<span style="background:${teamCol(p)}"></span>`).join('');}
}
function bindFloors(){
  const el=$('#floors');if(!el)return;
  el.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b||MAPID!=='in')return;const id=b.dataset.f;
    const on=players.filter(p=>alive(p)&&!p.offMap&&floorOf(p.x,p.y)===id);
    setFloor(id,on.length?{x:on.reduce((a,p)=>a+p.x,0)/on.length,y:on.reduce((a,p)=>a+p.y,0)/on.length}:null);});
}

/* ---------- noise and contact inside ---------- */
// a shot or a blast at (x,y) (and where it lands, x2,y2) alerts the hostiles on that floor who'd hear it: anyone in the
// same room, in sight within IN_HEAR_OPEN, through walls within IN_HEAR_WALL
function alertNear(x,y,msg,ambush,x2,y2,lk,open=IN_HEAR_OPEN,wall=IN_HEAR_WALL){
  const f=floorOf(x,y),fl=IN.floors[f];let any=false;
  const pts=x2==null?[[x,y]]:[[x,y],[x2,y2]],rooms=fl?pts.map(([px,py])=>roomAt(fl,px,py)).filter(Boolean):[];
  const hears=e=>{if(fl&&rooms.includes(roomAt(fl,e.x,e.y)))return true;
    for(const[px,py]of pts){const d=hyp(e.x-px,e.y-py);if(d<=wall||(d<=open&&gridSight(px,py,e.x,e.y)))return true;}return false;};
  for(const e of enemies){
    if(e.dead||e.alerted||e.floor!==f||!hears(e))continue;
    alertOne(e,lk||{x,y},ambush);any=true;   // (hunt.js: he'll come looking where the noise was)
  }
  if(any)startContact(msg,ambush);   // an ambush only if it caught someone unaware
  return any;
}
let inQuietT=0;
function interiorTick(dt){
  useTick(dt);
  if((inQuietT-=dt)>0)return;inQuietT=.5;
  floorChip();   // (contact ending: hunt.js, for both maps)
}
function inThreat(){const b=IN.floors[curFloor].bounds;return{x:(b.x0+b.x1)/2,y:b.y0+40};}   // before anyone's seen inside: where previews judge cover from

/* ---------- things to use (Bryan: one way to use everything) ---------- */
// A ring and a word where it is. A pickup is taken by walking over it. Anything else: with soldiers selected, a tap on it
// sends the nearest one; a ring fills while he works (secs), then it happens. Each has avail() and act(u).
const ACTS=[];let useGo=null;
function actsHere(){return ACTS.filter(a=>a.map===MAPID&&a.avail());}
function actAt(wx,wy){let best=null,bd=1e9;for(const a of actsHere()){const d=hyp(a.x-wx,a.y-wy);if(d<=a.r+10&&d<bd){bd=d;best=a;}}return best;}
function orderUse(a){
  const foot=sel.filter(u=>alive(u)&&!u.inVeh).sort((p,q)=>hyp(p.x-a.x,p.y-a.y)-hyp(q.x-a.x,q.y-a.y));
  if(!foot.length){banner('Select a soldier first.',1600);return;}
  const u=foot[0],s=openSpot(a.x,a.y+(a.standY||14),players.filter(p=>p!==u&&!p.dead).map(destOf))||{x:a.x,y:a.y+14},p=findPath(u.x,u.y,s.x,s.y);
  if(!p){banner('No way there from here.',1600);return;}
  u.path=p;u.lastOrder=simT;useGo={u,a,prog:0};callout(u,'Moving',C.good);
}
function useTick(dt){
  for(const a of actsHere())if(a.pickup){const u=players.find(p=>alive(p)&&!p.offMap&&hyp(p.x-a.x,p.y-a.y)<a.r);if(u)a.act(u);}
  if(!useGo)return;const{u,a}=useGo;
  if(!alive(u)||!a.avail()||(u.path.length&&simT-u.lastOrder>.1&&hyp(u.path[u.path.length-1].x-a.x,u.path[u.path.length-1].y-a.y)>30)){useGo=null;return;}
  if(u.path.length)return;
  if(hyp(u.x-a.x,u.y-a.y)>a.r+18){useGo=null;return;}
  useGo.prog+=dt;if(useGo.prog>=(a.secs||0)){useGo=null;a.act(u);}
}
function takeKey(u){hasKey=true;callout(u,'Got the key',C.good);say(u,'objective');banner('Decryption key taken. Get out the front doors.',3000);updateObjUI();hud();}
function drawActs(now){
  const pulse=(Math.sin(now*3)+1)/2,act=sel.some(alive);
  for(const a of actsHere()){
    if(a.floor&&a.floor!==curFloor)continue;
    gPath(a.x,a.y,a.r+pulse*3);ox.strokeStyle=a.pickup?'#7ff0ff':'#ffcf4a';ox.lineWidth=2;ox.setLineDash([5,5]);ox.lineDashOffset=-now*10;ox.stroke();ox.setLineDash([]);
    const[lx,ly]=below(a.x,a.y+a.r,6);if(act&&!a.pickup)pill(a.label,lx,ly,C.good);else label(a.label,lx,ly,a.pickup?'#7ff0ff':'#ffcf4a',9,700);
  }
  if(useGo&&!useGo.u.path.length&&useGo.a.secs){const u=useGo.u;gPath(u.x,u.y,14,-Math.PI/2,-Math.PI/2+useGo.prog/useGo.a.secs*TAU);ox.strokeStyle='#ffcf4a';ox.lineWidth=2.4;ox.stroke();}
}
// the gather areas: ENTER at the data center's front doors outside, EXIT at the lobby's front doors inside
function gatherZone(){
  if(MAPID==='out'&&obj===3&&dcTaken&&!hasKey)return{z:DC_ENTER,ready:enterReady(),go:'ENTER',need:players.filter(alive)};
  if(MAPID==='in'&&hasKey){const z=zoneOf(IN.floors.GF,'exit');if(z)return{z,ready:exitReady(),go:'LEAVE',need:players.filter(p=>alive(p)&&!p.offMap)};}
  return null;
}
function drawGather(now){
  const G=gatherZone();if(!G)return;const z=G.z,pulse=(Math.sin(now*4)+1)/2;
  toSBack=false;const c=[[z.x0,z.y0],[z.x1,z.y0],[z.x1,z.y1],[z.x0,z.y1]].map(([x,y])=>toS(x,y,.4));if(toSBack)return;
  ox.beginPath();ox.moveTo(...c[0]);for(const p of c)ox.lineTo(...p);ox.closePath();
  ox.fillStyle=`rgba(95,224,142,${(G.ready?.18:.06+pulse*.07).toFixed(3)})`;ox.fill();
  ox.setLineDash(G.ready?[]:[10,7]);ox.lineDashOffset=-now*14;ox.strokeStyle='rgba(95,224,142,.95)';ox.lineWidth=2.4;ox.stroke();ox.setLineDash([]);
  const n=G.need.filter(p=>inZone(p,z)).length,[lx,ly]=below((z.x0+z.x1)/2,z.y1,8);
  if(G.ready)pill(`TAP TO ${G.go}`,lx,ly,C.good);else label(`${G.go} ${n}/${G.need.length}`,lx,ly,'#5fe08e',11,700);
}
// a tap: on a ready gather area it goes; on something to use it's used; returns true if the tap was taken
function interiorTap(wx,wy){
  if(fading)return true;
  const G=gatherZone();
  if(G&&G.ready&&wx>=G.z.x0-20&&wx<=G.z.x1+20&&wy>=G.z.y0-20&&wy<=G.z.y1+20){if(MAPID==='out')enterBuilding();else exitBuilding();return true;}
  const a=actAt(wx,wy);if(a&&!a.pickup){orderUse(a);return true;}
  return false;
}

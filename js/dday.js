"use strict";
/* D-Day test (docs/dday-test.md; Bryan's drawing, docs/dday-map-draft.jpg): a Normandy beach as its own map, MAPID 'dd',
   swapped in like Level 1's. This file: the map (its ground has real height: groundH in scene.js), its objects, its look.
   The rules, the troops and the HUD are in ddplay.js.
   The play area is x DDX..DDX+DDW (1000 wide); 200 either side of it is the edge of the battle next door (walkable, but
   out of bounds: ddplay.js), and beyond that mirror copies of the land, for looks only.
   Bottom to top (south to north), as drawn: the sea, the beach with its shell holes, wire and obstacles; a line of gate,
   sandbags, concrete wall, gate, concrete wall and the mountain's rock wall; behind the left gate a pillbox; from the middle
   gate the only way up, a broad draw climbing to the left between the mountain face and the rock; on the rock to the right
   two machine gun nests; at the top a flat base: the heavy gun on the left, a long position along the back (sniper, cannon,
   machine gun), the mortars and the barracks on the right. Rock is a 'drop': it stops feet, not eyes (everything up there
   looks down on the beach). */
const DDB={x0:0,x1:1400,y0:-760,y1:900},DDX=200,DDW=1000,DDS=1.2;
let DD=null;
const DD_FACE=[[0,120],[330,120],[330,300],[470,300],[600,85],[120,-320],[0,-320]],
  DD_RWALL=[[600,316],[600,280],[740,40],[1000,40],[1000,316]],
  DD_RRIGHT=[[316,-312],[440,-435],[1000,-435],[1000,-95],[752,-95]];
function ddIn(poly,x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;}
const ddMx=x=>{let d=x-DDX;if(d<0)d=-d;if(d>DDW)d=2*DDW-d;return clamp(d,0,DDW);};   // the play area's x (0..1000) for any x: the edges mirror it
const ddRock=(dx,y)=>ddIn(DD_FACE,dx,y)?1:ddIn(DD_RWALL,dx,y)?2:ddIn(DD_RRIGHT,dx,y)?3:0;
const ddRamp=y=>18+clamp((300-y)/620,0,1)*132;   // the draw's floor: 1.8 m at the gate to 15 m at the top
const DD_HOLES=[{x:380,y:520,r:34,c:2,n:'deep'},{x:640,y:560,r:30,c:1},{x:820,y:470,r:20,c:1},{x:250,y:400,r:18,c:1},{x:545,y:392,r:18,c:1},{x:130,y:600,r:20,c:1},{x:900,y:640,r:22,c:1}];
function ddRawH(dx,y){
  if(y>=316)return y<700?16*(700-y)/384:y<770?-7*(y-700)/70:Math.max(-20,-7-(y-770)*.16);
  const r=ddRock(dx,y),n=Math.sin(dx*.071+y*.043)*7+Math.sin(dx*.023-y*.061)*9;
  if(r===1)return Math.min(ddRamp(y)+58,172)+n;
  if(r===2)return 104+n*.7;
  if(r===3)return Math.min(ddRamp(y)+52,182)+n;
  if(dx<335&&y>=120)return 20+(316-y)*.03;          // the pocket behind the left gate (the pillbox)
  if(dx>=752&&y>=-95&&y<=40)return 92;              // the nests' shelf
  if(y<-320)return 152;                             // the base at the top
  return ddRamp(y);
}
const DDG={nx:141,ny:167,h:null};
function ddBuildH(){
  const{nx,ny}=DDG;let a=new Float32Array(nx*ny),b=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)a[j*nx+i]=ddRawH(ddMx(i*10),DDB.y0+j*10);
  for(let p=0;p<2;p++){   // soften the cliffs a little (a wall of stretched triangles otherwise)
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let s=0,n=0;for(let v=-1;v<=1;v++)for(let u=-1;u<=1;u++){const x=i+u,y=j+v;if(x<0||y<0||x>=nx||y>=ny)continue;s+=a[y*nx+x];n++;}b[j*nx+i]=s/n;}
    [a,b]=[b,a];
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const dx=ddMx(i*10),y=DDB.y0+j*10;   // the shell holes
    for(const h of DD_HOLES){const d=hyp(dx-h.x,y-h.y);if(d<h.r+8)a[j*nx+i]-=(h.c===2?11:6.5)*Math.max(0,1-(d/(h.r+8))**2);}}
  DDG.h=a;
}
function ddH(x,y){
  const g=DDG.h;if(!g)return 0;
  const fx=clamp(x/10,0,DDG.nx-1.001),fy=clamp((y-DDB.y0)/10,0,DDG.ny-1.001),i=fx|0,j=fy|0,u=fx-i,v=fy-j,k=j*DDG.nx+i;
  return(g[k]*(1-u)+g[k+1]*u)*(1-v)+(g[k+DDG.nx]*(1-u)+g[k+DDG.nx+1]*u)*v;
}

/* ---------- the map's objects (play-area coordinates dx 0..1000, then moved over by DDX) ---------- */
const DD_SPOT={   // where things are (dx,y): ddplay.js posts the defenders by these
  pill:{x:130,y:186,ang:Math.PI/2,arc:1.2},nests:[{x:842,y:14,ang:2.4,arc:1.05},{x:930,y:14,ang:2.0,arc:1.05}],
  heavy:{x:90,y:-398},cannon:{x:240,y:-594},topMG:{x:350,y:-588,ang:Math.PI/2,arc:1.3},sniper:{x:122,y:-590},
  mortars:[{x:862,y:-478},{x:922,y:-468},{x:974,y:-480}],barracks:{x:700,y:-715,w:240,h:60},door:{x:820,y:-640},
  gateL:{x:24,w:86},gateM:{x:474,w:62},boat:{x:500,y:772}};
function ddObjects(){
  const L=[],o=(kind,dx,y,w,h,ex)=>{const q=Object.assign({kind,x:dx+DDX,y,w,h,full:false},ex||{});L.push(q);return q;};
  // rock: rows of 'drop' 20 deep, from the three masses (and their mirror images in the edges)
  for(let y=-440;y<320;y+=20){let run=null;
    for(let dx=0;dx<=1000;dx+=10){const inR=dx<1000&&ddRock(dx+5,y+10)>0;
      if(inR&&run==null)run=dx;
      if(!inR&&run!=null){o('drop',run,y,dx-run,20,{rock:1});run=null;}}}
  o('drop',0,300,24,16,{rock:1});
  // the line at the top of the beach: gate, sandbags, concrete, gate, concrete (the rock wall carries on to the right)
  o('ddgate',DD_SPOT.gateL.x,302,DD_SPOT.gateL.w,12,{cover:1,hp:70,tag:'gateL'});
  for(const x of[120,190,260])o('sandbag',x,304,66,10);
  o('ddconc',330,300,140,16,{full:true});
  o('ddgate',DD_SPOT.gateM.x,302,DD_SPOT.gateM.w,12,{cover:1,hp:70,tag:'gateM'});
  o('ddconc',540,300,60,16,{full:true});
  // the pillbox behind the left gate: concrete to the front and sides, open at the back
  o('ddpb',80,198,100,8,{cover:2});o('ddpb',80,150,8,48,{cover:2});o('ddpb',172,150,8,48,{cover:2});
  // the two machine gun nests on the rock to the right: open on the draw's side
  o('ddpb',790,30,190,8,{cover:2});o('ddpb',980,-30,8,68,{cover:2});
  // the draw: sandbags across it at three heights, and boulders
  for(const[x,y]of[[500,190],[430,-130],[520,-152],[230,-270]])o('sandbag',x,y,66,10);
  for(const[x,y]of[[590,120],[660,20],[540,-40],[430,-80],[610,-100],[380,-190],[500,-215],[310,-245],[420,-262],[640,-170],[560,250],[520,105]])o('ddbould',x,y,18,15,{cover:1});
  // the base at the top: the heavy gun's emplacement, the long position along the back, the mortar pits, crates, the barracks
  o('ddpb',30,-372,120,8,{cover:2});o('ddpb',30,-440,8,68,{cover:2});o('ddpb',142,-440,8,68,{cover:2});
  o('ddgun',78,-408,24,22,{cover:1,hp:200,tag:'heavy'});
  o('ddpb',90,-572,300,8,{cover:2});
  o('ddgun',228,-600,24,20,{cover:1,hp:200,tag:'cannon'});
  for(const[x,y]of[[840,-462],[900,-452],[952,-464]])o('sandbag',x,y,44,10);
  for(const[x,y]of[[450,-520],[560,-560],[640,-500],[520,-462],[760,-540],[330,-470],[250,-500]])o('ddcrate',x,y,22,20,{cover:1});
  o('ddbarr',DD_SPOT.barracks.x,DD_SPOT.barracks.y,DD_SPOT.barracks.w,DD_SPOT.barracks.h,{full:true,hp:380,tag:'barracks'});
  // the beach: obstacles, wire, the holes' forward lips (cover from up the hill), two wrecks
  for(const[x,y]of[[150,640],[330,650],[520,660],[700,640],[880,655],[240,560],[450,600],[760,585],[120,430],[690,405],[930,540],[60,520],[470,470]])o('ddhog',x,y,14,14,{cover:1});
  o('fence',60,466,190,8,{tag:'wire',hp:40});
  for(const h of DD_HOLES)o('ddrim',h.x-h.r,h.y-h.r-3,h.r*2,6,{cover:h.c});
  o('ddwreck',296,488,46,26,{full:true});o('ddwreck',838,596,24,56,{full:true,lc:1});
  // the edges: mirror images of the rock that reaches them, so the cliffs carry on (nobody fights there)
  for(const q of L.slice()){if(q.kind!=='drop')continue;const dx=q.x-DDX;
    if(dx<200)L.push(Object.assign({},q,{x:DDX-dx-q.w}));
    if(dx+q.w>800)L.push(Object.assign({},q,{x:DDX+2*DDW-dx-q.w}));}
  L.push({kind:'drop',x:0,y:300,w:DDX,h:16,full:false,rock:1},{kind:'drop',x:DDX+DDW,y:300,w:DDX,h:16,full:false,rock:1});   // the line carries on as rock across the edges
  L.push({kind:'water',x:0,y:776,w:1400,h:124,full:false});
  return L;
}
VAULTABLE.add('ddgate');   // a gate can be climbed (pathfinding.js), or blown open (ddBlast in ddplay.js)

/* ---------- the ground's picture ---------- */
function paintDDGround(g){
  const W0=DDW,r=rng(1944),c=document.createElement('canvas');c.width=Math.round(W0*DDS);c.height=Math.round((DDB.y1-DDB.y0)*DDS);
  const x=c.getContext('2d');x.setTransform(DDS,0,0,DDS,0,-DDB.y0*DDS);
  // sand: dry and pale up the beach, wet and dark at the water; the sea bed beyond
  let gr=x.createLinearGradient(0,316,0,900);gr.addColorStop(0,'#b6a57f');gr.addColorStop(.5,'#a8966f');gr.addColorStop(.8,'#8a7a5c');gr.addColorStop(.87,'#6d6450');gr.addColorStop(1,'#4d4d44');
  x.fillStyle=gr;x.fillRect(0,300,W0,600);
  // the ground above the line: worn earth in the draw and the pocket, grass on the base
  gr=x.createLinearGradient(0,316,0,-760);gr.addColorStop(0,'#8c7d5d');gr.addColorStop(.35,'#7b7150');gr.addColorStop(.62,'#6a6b45');gr.addColorStop(1,'#5c6640');
  x.fillStyle=gr;x.fillRect(0,-760,W0,1076);
  const poly=(P,fill)=>{x.beginPath();P.forEach(([px,py],i)=>i?x.lineTo(px,py):x.moveTo(px,py));x.closePath();x.fillStyle=fill;x.fill();};
  // rock: grey-brown, with strata and cracks
  for(const P of[DD_FACE,DD_RWALL,DD_RRIGHT]){poly(P,'#6f6a60');
    x.save();x.beginPath();P.forEach(([px,py],i)=>i?x.lineTo(px,py):x.moveTo(px,py));x.closePath();x.clip();
    for(let i=0;i<260;i++){const px=r()*W0,py=-460+r()*800,l=20+r()*70;x.strokeStyle=`rgba(${r()<.5?'40,36,30':'150,142,128'},${.1+r()*.22})`;x.lineWidth=.8+r()*2.2;x.beginPath();x.moveTo(px,py);x.lineTo(px+l,py+(r()-.5)*14);x.stroke();}
    for(let i=0;i<70;i++){const px=r()*W0,py=-460+r()*800;x.fillStyle=`rgba(86,98,60,${.15+r()*.3})`;x.beginPath();x.ellipse(px,py,10+r()*26,6+r()*14,r()*3,0,7);x.fill();}   // scrub on the tops
    x.restore();}
  // speckle everywhere: stones in the sand, tufts in the grass
  for(let i=0;i<26000;i++){const px=r()*W0,py=-760+r()*1660,s=.6+r()*1.6;x.fillStyle=py>316?`rgba(${r()<.5?'70,60,44':'214,200,168'},${.1+r()*.25})`:`rgba(${r()<.5?'48,52,30':'150,150,104'},${.1+r()*.22})`;x.fillRect(px,py,s,s);}
  // shingle under the wall, tide lines, the worn way up the draw
  for(let i=0;i<5000;i++){const px=r()*W0,py=318+r()*r()*46,s=1+r()*2.4;x.fillStyle=`rgba(${r()<.5?'96,92,84':'150,146,136'},${.5+r()*.4})`;x.beginPath();x.arc(px,py,s,0,7);x.fill();}
  for(const[yy,a]of[[690,.3],[655,.16],[612,.1]]){x.strokeStyle=`rgba(60,52,40,${a})`;x.lineWidth=3;x.beginPath();for(let px=0;px<=W0;px+=20)x.lineTo(px,yy+Math.sin(px*.03+yy)*5+Math.sin(px*.11)*2);x.stroke();}
  x.strokeStyle='rgba(120,104,74,.5)';x.lineWidth=46;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(505,300);x.lineTo(560,150);x.lineTo(520,10);x.lineTo(380,-150);x.lineTo(230,-300);x.lineTo(240,-400);x.lineTo(520,-520);x.lineTo(800,-600);x.stroke();
  // the shell holes: scorched, dark at the bottom
  for(const h of DD_HOLES){gr=x.createRadialGradient(h.x,h.y,2,h.x,h.y,h.r+10);gr.addColorStop(0,'rgba(40,34,26,.85)');gr.addColorStop(.7,'rgba(70,60,44,.5)');gr.addColorStop(1,'rgba(70,60,44,0)');x.fillStyle=gr;x.beginPath();x.arc(h.x,h.y,h.r+10,0,7);x.fill();}
  // onto the map's canvas: the play area, and its mirror image in each edge and beyond
  g.setTransform(1,0,0,1,0,0);g.drawImage(c,DDX*DDS,0);
  g.save();g.translate(DDX*DDS,0);g.scale(-1,1);g.drawImage(c,0,0,DDX*DDS,c.height,0,0,DDX*DDS,c.height);g.restore();
  g.save();g.translate((DDX+2*DDW)*DDS,0);g.scale(-1,1);g.drawImage(c,(DDW-DDX)*DDS,0,DDX*DDS,c.height,(DDW-DDX)*DDS,0,DDX*DDS,c.height);g.restore();
}

/* ---------- the scene ---------- */
function disposeDD(){
  if(!DD||!DD.scene)return;
  DD.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of[].concat(o.material)){if(m.map&&m.map!==DD.tex)m.map.dispose();m.dispose();}}});
  if(DD.tex)DD.tex.dispose();DD=null;
}
// the time of day, 0 dawn .. 1 evening (it goes by as the squads climb: ddplay.js sets DD.day)
const DD_SKY=[[.0,0x8e9aa2,0x9aa6ae,.62,0xcfd8e2,.5],[.5,0xa9b4ba,0xb4bfc6,.78,0xfff2dc,.72],[1,0xb98a62,0xc49a74,.5,0xffb070,.62]];   // [t, fog/sky, hemi sky, hemi k, sun colour, sun k]
function ddSky(t){
  let a=DD_SKY[0],b=DD_SKY[DD_SKY.length-1];for(let i=0;i<DD_SKY.length-1;i++)if(t>=DD_SKY[i][0]&&t<=DD_SKY[i+1][0]){a=DD_SKY[i];b=DD_SKY[i+1];}
  const k=b[0]>a[0]?clamp((t-a[0])/(b[0]-a[0]),0,1):0,L=DD.lights,mix=(p,q)=>new T.Color(p).lerp(new T.Color(q),k);
  const sky=mix(a[1],b[1]);DD.scene.background.copy(sky);DD.scene.fog.color.copy(sky);if(DD.dome)DD.dome.material.color.copy(sky);
  L.hemi.color.copy(mix(a[2],b[2]));L.hemi.userData.base=a[3]+(b[3]-a[3])*k;L.moon.color.copy(mix(a[4],b[4]));L.moon.intensity=a[5]+(b[5]-a[5])*k;
  if(DD.sea)DD.sea.material.color.copy(new T.Color(0x4a5c63).lerp(new T.Color(0x6a5548),Math.max(0,t-.5)*2));
}
function buildDDay(){
  disposeDD();ddBuildH();
  const objsL=ddObjects();
  DD={objs:objsL,lamps:[],hq:[],scene:null,lights:null,canvas:null,tex:null,props:null,sea:null,gibs:[],boats:[],day:0,dayShown:-1};
  const sc=new T.Scene();sc.background=new T.Color(0x8e9aa2);sc.fog=new T.FogExp2(0x8e9aa2,0.00034);DD.scene=sc;
  const fc=document.createElement('canvas');fc.width=Math.round((DDB.x1-DDB.x0)*DDS);fc.height=Math.round((DDB.y1-DDB.y0)*DDS);
  paintDDGround(fc.getContext('2d'));
  const tex=new T.CanvasTexture(fc);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;DD.canvas=fc;DD.tex=tex;
  const keep=scene;scene=sc;
  try{
    // the land: one sheet with the heights in it; a mirror image either side (the battle next door)
    const gw=DDB.x1-DDB.x0,gd=DDB.y1-DDB.y0,geo=new T.PlaneGeometry(gw,gd,DDG.nx-1,DDG.ny-1),pos=geo.attributes.position;
    for(let k=0;k<pos.count;k++){const i=k%DDG.nx,j=(k/DDG.nx)|0;pos.setZ(k,DDG.h[j*DDG.nx+i]);}
    geo.computeVertexNormals();
    const gmat=new T.MeshStandardMaterial({map:tex,roughness:.96,metalness:0});
    const land=new T.Mesh(geo,gmat);land.rotation.x=-Math.PI/2;land.position.set(gw/2,0,(DDB.y0+DDB.y1)/2);land.receiveShadow=true;sc.add(land);
    for(const s of[-1,1]){const m=new T.Mesh(geo,gmat);m.rotation.x=-Math.PI/2;m.scale.x=-1;m.position.set(s<0?-gw/2:gw*1.5,0,(DDB.y0+DDB.y1)/2);m.receiveShadow=true;sc.add(m);}
    // far land behind the base, and the sea bed out to the horizon
    const far=new T.Mesh(new T.PlaneGeometry(9000,3000),new T.MeshStandardMaterial({color:0x5c6640,roughness:1}));far.rotation.x=-Math.PI/2;far.position.set(700,151,DDB.y0-1500);sc.add(far);
    // the sea: grey-green, a slow swell in its normals, pale where it thins over the sand
    const wm=new T.MeshStandardMaterial({color:0x4a5c63,roughness:.5,metalness:.12,transparent:true,opacity:.86,normalMap:rippleTex().clone(),normalScale:new T.Vector2(.3,.3)});
    wm.normalMap.needsUpdate=true;wm.normalMap.wrapS=wm.normalMap.wrapT=T.RepeatWrapping;wm.normalMap.repeat.set(70,22);
    const sea=new T.Mesh(new T.PlaneGeometry(9000,2800),wm);sea.rotation.x=-Math.PI/2;sea.position.set(700,.2,700+1400);sea.receiveShadow=true;sc.add(sea);DD.sea=sea;
    const foamT=canvasTex(256,32,(q,w,h)=>{const r=rng(7);q.clearRect(0,0,w,h);for(let i=0;i<500;i++){const a=r()*.5*(1-Math.abs(r()-.5)*2);q.fillStyle=`rgba(236,240,238,${a})`;q.beginPath();q.arc(r()*w,h*.5+(r()-.5)*h*.7,1+r()*3,0,7);q.fill();}});
    foamT.wrapS=T.RepeatWrapping;foamT.repeat.set(26,1);
    const foam=new T.Mesh(new T.PlaneGeometry(9000,26),new T.MeshBasicMaterial({map:foamT,transparent:true,opacity:.8,depthWrite:false}));foam.rotation.x=-Math.PI/2;foam.position.set(700,.5,702);sc.add(foam);DD.foam=foam;
    // a sky to look at when the camera's tilted down: a big dome the colour of the haze
    const dome=new T.Mesh(new T.SphereGeometry(5200,24,12),new T.MeshBasicMaterial({color:0x8e9aa2,side:T.BackSide,fog:false,depthWrite:false}));dome.position.set(700,0,0);sc.add(dome);DD.dome=dome;
    ddProps(sc,objsL);
    // the light: an overcast dawn (ddSky moves it on through the day)
    const hemi=new T.HemisphereLight(0x9aa6ae,0x5a5244,.62);hemi.userData.base=.62;sc.add(hemi);
    const sun=new T.DirectionalLight(0xcfd8e2,.5);sun.position.set(400,620,300);sun.target.position.set(700,0,100);
    const phone=matchMedia('(pointer:coarse)').matches;sun.castShadow=true;sun.shadow.mapSize.set(phone?1024:2048,phone?1024:2048);
    Object.assign(sun.shadow.camera,{left:-640,right:640,top:640,bottom:-640,near:50,far:2000});sun.shadow.bias=-0.0012;sc.add(sun,sun.target);
    const pool=[];for(let k=0;k<LAMP_POOL;k++){const p=new T.PointLight(0xffffff,0,100,1.4);sc.add(p);pool.push(p);}
    const mz=[];for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);sc.add(m);mz.push(m);}
    const bl=new T.PointLight(0xffa050,0,300,1.6);sc.add(bl);
    DD.lights={hemi,moon:sun,lampPool:pool,muzzle:mz,boomL:bl};
    ddGibPool(sc);
  }finally{scene=keep;}
}
// everything standing on the land: built into one group, and copied (mirrored) either side for the battle next door
function ddProps(sc,objsL){
  const G=new T.Group();DD.props=G;sc.add(G);
  const M=(c,r=.9,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m}),
    conc=M(0x8b8a84,.95),concD=M(0x6f6e69,.95),bag=M(0x8a7d5e,1),steel=M(0x3a3632,.6,.7),rust=M(0x5a4030,.8,.4),wood=M(0x5d4a34,.95),rockM=M(0x6c675d,1),olive=M(0x4d5540,.9),dark=M(0x26282a,.7,.5);
  const add=(geo,mat,x,y,z,ry,rx,rz)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;if(rx)m.rotation.x=rx;if(rz)m.rotation.z=rz;m.castShadow=true;m.receiveShadow=true;G.add(m);return m;};
  const box=(o,h,mat,lift=0)=>{const g0=ddH(o.x+o.w/2,o.y+o.h/2);const m=add(new T.BoxGeometry(o.w,h,o.h),mat,o.x+o.w/2,g0+h/2+lift,o.y+o.h/2);(o.meshes=o.meshes||[]).push(m);return m;};
  const bagG=new T.SphereGeometry(1,7,5),r=rng(66);
  for(const o of objsL){
    const cx=o.x+o.w/2,cy=o.y+o.h/2,g0=ddH(cx,cy);
    if(o.kind==='sandbag'){   // two courses of bags
      const horiz=o.w>=o.h,n=Math.round((horiz?o.w:o.h)/8);o.meshes=[];
      for(let c=0;c<2;c++)for(let k=0;k<n-c;k++){const t=(k+.5+c*.5)/n,x=horiz?o.x+t*o.w:cx,y=horiz?cy:o.y+t*o.h,m=add(bagG,bag,x,ddH(x,y)+2.4+c*3.6,y,horiz?0:Math.PI/2);m.scale.set(4.6,2.3,horiz?o.h*.5:o.w*.5);m.rotation.y+=(r()-.5)*.2;o.meshes.push(m);}
    }else if(o.kind==='ddconc'){box(o,24,conc);const cap=add(new T.BoxGeometry(o.w+2,2.4,o.h+3),concD,cx,g0+25,cy);o.meshes.push(cap);}
    else if(o.kind==='ddpb'){box(o,15,conc);}
    else if(o.kind==='ddgate'){   // a steel frame gate with cross bars
      o.meshes=[];const n=Math.round(o.w/14);
      for(let k=0;k<=n;k++)o.meshes.push(add(new T.BoxGeometry(1.6,17,1.6),steel,o.x+k*o.w/n,g0+8.5,cy));
      for(const hh of[4,10,16])o.meshes.push(add(new T.BoxGeometry(o.w,1.2,1.2),steel,cx,g0+hh,cy));
      for(let k=0;k<n;k++)o.meshes.push(add(new T.BoxGeometry(hyp(o.w/n,12),1,1),rust,o.x+(k+.5)*o.w/n,g0+10,cy,0,0,(k%2?1:-1)*Math.atan2(12,o.w/n)));
    }else if(o.kind==='ddbould'){const m=add(new T.DodecahedronGeometry(10,0),rockM,cx,g0+4,cy,r()*6);m.scale.set(1.05,.8+r()*.3,.9);(o.meshes=[]).push(m);}
    else if(o.kind==='ddcrate'){box(o,13,wood);}
    else if(o.kind==='ddhog'){   // a steel hedgehog: three girders crossed
      o.meshes=[];for(const[rx,rz]of[[.6,.6],[-.6,.6],[0,-1.0]])o.meshes.push(add(new T.BoxGeometry(2,22,2),rust,cx,g0+7,cy,r()*.4,rx,rz));
    }else if(o.kind==='fence'){   // coils of barbed wire on stakes
      o.meshes=[];const n=Math.round(o.w/7),wm=M(0x55504a,.5,.7);
      for(let k=0;k<n;k++){const x=o.x+k*7+3.5,t=add(new T.TorusGeometry(4,.3,4,9),wm,x,ddH(x,cy)+4.2,cy,Math.PI/2+.35);o.meshes.push(t);}
      for(let x=o.x;x<=o.x+o.w;x+=38)o.meshes.push(add(new T.BoxGeometry(1,9,1),wood,x,ddH(x,cy)+4.5,cy));
    }else if(o.kind==='ddwreck'){
      if(o.lc){o.meshes=[ddBoatMesh(G,true)];o.meshes[0].position.set(cx,g0-1,cy);o.meshes[0].rotation.set(.05,.3,.22);}
      else{box(o,14,dark);o.meshes.push(add(new T.BoxGeometry(22,9,18),dark,cx+4,g0+18,cy),add(new T.CylinderGeometry(1.4,1.4,30,6),dark,cx+22,g0+19,cy-2,0,0,Math.PI/2-.25));}
    }else if(o.kind==='ddgun'){   // a gun on its mount, barrel out over the beach
      o.meshes=[add(new T.BoxGeometry(o.w,9,o.h),steel,cx,g0+4.5,cy),add(new T.BoxGeometry(20,12,3),olive,cx,g0+13,cy+7)];
      const b=add(new T.CylinderGeometry(1.7,2.2,o.tag==='heavy'?64:46,8),steel,cx,g0+15,cy+(o.tag==='heavy'?36:27),0,Math.PI/2-.07);o.meshes.push(b);o.barrel=b;
    }else if(o.kind==='ddbarr'){   // the barracks: a long hut, pitched roof, door and windows to the south
      box(o,26,M(0x6d6a58,.95));
      const roof=add(new T.CylinderGeometry(o.h*.62,o.h*.62,o.w+10,3,1),M(0x3d3f38,.9),cx,g0+26+o.h*.3,cy,0,0,Math.PI/2);roof.rotation.x=Math.PI/2;roof.scale.set(.5,1,1);o.meshes.push(roof);
      o.meshes.push(add(new T.BoxGeometry(18,20,1.5),dark,cx,g0+10,o.y+o.h+.6));
      for(const dxw of[-80,-40,40,80])o.meshes.push(add(new T.BoxGeometry(12,8,1.2),new T.MeshBasicMaterial({color:0xd9b46a}),cx+dxw,g0+15,o.y+o.h+.5));
    }
  }
  // roofs over the pillbox and the nests (they fade when one of ours is inside: ddFrame), the heavy gun's and the cannon's shields
  const slab=(dx0,y0,w,d,hh)=>{const x=dx0+DDX+w/2,y=y0+d/2,m=add(new T.BoxGeometry(w+8,4,d+8),new T.MeshStandardMaterial({color:0x7d7c76,roughness:.95,transparent:true}),x,ddH(x,y)+hh,y);m.userData.b={x0:dx0+DDX,x1:dx0+DDX+w,y0,y1:y0+d};return m;};
  DD.roofs=[slab(80,150,100,56,17),slab(790,-30,198,68,17),slab(30,-440,120,76,17)];
  for(const m of DD.roofs)m.castShadow=true;
  // the battle next door: the same works, mirrored
  for(const s of[-1,1]){const c=G.clone(true);c.scale.x=-1;c.position.x=s<0?0:2*(DDB.x1-DDB.x0);sc.add(c);}
}
// a landing craft: a steel box of a hull, a ramp at the bow (north, -z) that drops
function ddBoatMesh(parent,wreck){
  const g=new T.Group(),hm=new T.MeshStandardMaterial({color:wreck?0x3a3d3c:0x69736f,roughness:.8,metalness:.3}),dm=new T.MeshStandardMaterial({color:0x4b5350,roughness:.9});
  const B=(w,h,d,x,y,z,m)=>{const q=new T.Mesh(new T.BoxGeometry(w,h,d),m||hm);q.position.set(x,y,z);q.castShadow=true;q.receiveShadow=true;g.add(q);return q;};
  B(34,3,104,0,1.5,0,dm);B(2.4,15,104,-17,9,0);B(2.4,15,104,17,9,0);B(34,15,2.4,0,9,52);B(30,9,18,0,13,42,dm);   // deck, sides, stern, the engine house
  const ramp=new T.Group();ramp.position.set(0,3,-52);const rp=new T.Mesh(new T.BoxGeometry(33,2,16),hm);rp.position.set(0,8,0);rp.rotation.x=Math.PI/2;rp.castShadow=true;ramp.add(rp);g.add(ramp);g.userData.ramp=ramp;
  (parent||scene).add(g);return g;
}
// bits of men (ddplay.js's gore): a pool of small blocks thrown about, then lying where they land
function ddGibPool(sc){
  DD.gibs=[];const geos=[new T.BoxGeometry(2.2,6,2.2),new T.BoxGeometry(2.6,2.6,2.6),new T.BoxGeometry(4.4,5,3),new T.SphereGeometry(1.1,5,4)];
  for(let i=0;i<44;i++){const m=new T.Mesh(geos[i%geos.length],new T.MeshStandardMaterial({color:0x6a1410,roughness:.6}));m.visible=false;m.castShadow=true;sc.add(m);DD.gibs.push({m,on:false,v:[0,0,0],w:[0,0,0],t:0});}
}
function ddGib(x,y,n,cloth,pow=1){
  if(!DD)return;let k=0;
  for(const g of DD.gibs){if(k>=n)break;if(g.on&&g.t<14)continue;const a=Math.random()*TAU,s=(30+Math.random()*70)*pow;
    g.on=true;g.t=0;g.m.visible=true;g.m.position.set(x+(Math.random()-.5)*6,ddH(x,y)+8+Math.random()*8,y+(Math.random()-.5)*6);
    g.v=[Math.cos(a)*s,60+Math.random()*90*pow,Math.sin(a)*s];g.w=[Math.random()*9-4.5,Math.random()*9-4.5,Math.random()*9-4.5];
    g.m.material.color.set(k%3===1&&cloth?cloth:k%4===3?0xb98a6e:0x6a1410);k++;}
}
// every frame (from render): the sea, the boats, the bits, the day going by, the roofs over our men
function ddFrame(rdt,now){
  if(!DD)return;
  if(DD.sea){const n=DD.sea.material.normalMap;n.offset.set(now*.006,now*.011);}
  if(DD.foam){DD.foam.position.z=702+Math.sin(now*.7)*5;DD.foam.material.opacity=.55+.3*Math.sin(now*.7+1.2);DD.foam.material.map.offset.x=now*.004;}
  if(Math.abs(DD.day-DD.dayShown)>.004){DD.dayShown+=clamp(DD.day-DD.dayShown,-rdt*.05,rdt*.05);ddSky(DD.dayShown);}
  if(DD.dome)DD.dome.position.set(camera.position.x,0,camera.position.z);
  for(const m of DD.roofs||[]){const b=m.userData.b,inside=players.some(p=>alive(p)&&p.x>b.x0&&p.x<b.x1&&p.y>b.y0&&p.y<b.y1);m.material.opacity+=((inside?.18:1)-m.material.opacity)*Math.min(1,rdt*8);m.material.depthWrite=m.material.opacity>.95;}
  const dt=Math.min(.05,rdt)*(typeof timeScale==='function'&&state==='play'?timeScale():1);
  for(const g of DD.gibs){if(!g.on)continue;g.t+=dt;const p=g.m.position;
    if(g.v){g.v[1]-=260*dt;p.x+=g.v[0]*dt;p.y+=g.v[1]*dt;p.z+=g.v[2]*dt;g.m.rotation.x+=g.w[0]*dt;g.m.rotation.y+=g.w[1]*dt;g.m.rotation.z+=g.w[2]*dt;
      const fl=ddH(p.x,p.z)+1.2;if(p.y<=fl){p.y=fl;if(Math.abs(g.v[1])>50){g.v[1]*=-.3;g.v[0]*=.5;g.v[2]*=.5;paintDecal({k:'body',x:p.x,y:p.z,a:0,r:Math.random()*.4});}else g.v=null;}}
    if(g.t>26){g.on=false;g.m.visible=false;}}
  if(typeof ddBoatsFrame==='function')ddBoatsFrame(dt,now);
}

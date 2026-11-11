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
const DD_LEDGE={x0:598,x1:740,y0:212,y1:300};   // the first bunker's shelf, cut into the foot of the hill the nests stand on (Bryan: "The first bunker should share the same hill going up to the second bunker, just at the edge of the beach")
const ddLedge=(dx,y)=>dx>=DD_LEDGE.x0&&dx<=DD_LEDGE.x1&&y>=DD_LEDGE.y0&&y<DD_LEDGE.y1;
const ddRock=(dx,y)=>ddLedge(dx,y)?0:ddIn(DD_FACE,dx,y)?1:ddIn(DD_RWALL,dx,y)?2:ddIn(DD_RRIGHT,dx,y)?3:0;
const ddRamp=y=>18+clamp((300-y)/620,0,1)*132;   // the draw's floor: 1.8 m at the gate to 15 m at the top
const DD_HOLES=[{x:380,y:520,r:34,c:2,n:'deep'},{x:640,y:560,r:30,c:1},{x:820,y:470,r:20,c:1},{x:250,y:400,r:18,c:1},{x:545,y:392,r:18,c:1},{x:130,y:600,r:20,c:1},{x:900,y:640,r:22,c:1}];
function ddRawH(dx,y){
  if(dx>=DD_LEDGE.x0&&dx<=DD_LEDGE.x1&&y>=DD_LEDGE.y0&&y<318)return ddRamp(DD_LEDGE.y1)+10;   // the shelf, and its lip down to the sand
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
  pill:{x:668,y:280,ang:Math.PI/2,arc:1.3},nests:[{x:842,y:14,ang:2.4,arc:1.05},{x:930,y:14,ang:2.0,arc:1.05}],
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
  o('ddpb',626,290,84,8,{cover:2});o('ddpb',626,250,8,40,{cover:2});o('ddpb',702,250,8,40,{cover:2});
  o('sandbag',716,286,22,10);o('sandbag',100,200,66,10);o('ddcrate',190,190,22,20,{cover:1});   // (the pocket behind the left gate, where the bunker was: a sandbag line)
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
  // the base's vehicles, tents, drums and radio mast (their looks: ddlook.js)
  o('ddtruck',958,-648,26,58,{full:true});o('ddtruck',612,-712,26,58,{full:true});o('ddtent',470,-724,40,46,{full:true});o('ddtent',410,-720,40,46,{full:true});o('ddtent',180,-520,40,46,{full:true});
  for(const[x,y]of[[668,-650],[946,-724],[300,-548],[560,-470]])o('dddrum',x,y,16,16,{cover:1});
  o('ddmast',676,-742,8,8,{});
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
  // the ground, a picture worked out point by point (2 units a point): what it is (sand, wet sand, rock face, grass on the
  // tops, worn earth in the draw) from its height and steepness, lit from the sun's side, darker in the hollows
  {const SW=W0/2|0,SH=(DDB.y1-DDB.y0)/2|0,sc2=document.createElement('canvas');sc2.width=SW;sc2.height=SH;const s2=sc2.getContext('2d'),img=s2.createImageData(SW,SH),D=img.data;
    const gN=64,gv=new Float32Array(gN*gN);for(let i=0;i<gv.length;i++)gv[i]=r();
    const vn=(px,py)=>{const x0=Math.floor(px),y0=Math.floor(py),tx=px-x0,ty=py-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),v=(i,j)=>gv[((j%gN+gN)%gN)*gN+((i%gN+gN)%gN)];return(v(x0,y0)*(1-sx)+v(x0+1,y0)*sx)*(1-sy)+(v(x0,y0+1)*(1-sx)+v(x0+1,y0+1)*sx)*sy;};
    const fbm=(px,py)=>vn(px,py)*.55+vn(px*2.3+7,py*2.3+3)*.3+vn(px*5.1+1,py*5.1+9)*.15;
    const mix=(A,B,k)=>[A[0]+(B[0]-A[0])*k,A[1]+(B[1]-A[1])*k,A[2]+(B[2]-A[2])*k];
    const SAND=[212,184,128],SANDW=[150,128,92],BED=[112,132,120],ROCK=[168,152,124],ROCKD=[128,112,90],GRASS=[108,138,66],GRASS2=[84,118,56],DIRT=[166,138,94],DRY=[162,154,94];
    for(let j=0;j<SH;j++)for(let i=0;i<SW;i++){
      const dx=i*2+1,y=DDB.y0+j*2+1,wx=dx+DDX,h=ddH(wx,y),hx=(ddH(wx+4,y)-ddH(wx-4,y))/8,hy=(ddH(wx,y+4)-ddH(wx,y-4))/8,sl=Math.hypot(hx,hy);
      const n1=fbm(dx*.02,y*.02),n2=fbm(dx*.07+40,y*.07+11);let c;
      if(y>316&&!ddRock(dx,y)){const wet=clamp((y-640)/70,0,1);c=mix(mix(SAND,[196,166,112],n1),SANDW,wet*.85);if(y>706)c=mix(c,BED,clamp((y-706)/50,0,1));
        const rip=Math.sin((y+Math.sin(dx*.02)*12)*.55+n1*5);c=mix(c,[c[0]*.9,c[1]*.9,c[2]*.9],rip>.6?.5:0);}   // ripples in the sand
      else{const steep=clamp((sl-.28)/.35,0,1),top=h>40?1:0;
        let g2=mix(GRASS,GRASS2,clamp(n1*1.6-.3,0,1));g2=mix(g2,DRY,clamp(n2*2-1.1,0,1)*.7);
        const flat=ddRock(dx,y)?g2:(y<-320?mix(g2,DIRT,clamp(n2*1.8-.55,0,1)*.6):mix(DIRT,g2,clamp(n1*2.2-.75,0,1)*.8));
        const band=.5+.5*Math.sin(h*.42+n1*4),rk=mix(ROCKD,ROCK,band*.7+n2*.3);
        c=mix(flat,rk,steep);}
      const lit=clamp(.9+(-hx*.4-hy*.55)*.9,.62,1.25);                    // the sun from the south-west, a little
      const hol=(ddH(wx-10,y)+ddH(wx+10,y)+ddH(wx,y-10)+ddH(wx,y+10))/4-h,ao=clamp(1-hol*.03,.74,1.06);
      const k=(j*SW+i)*4,f=lit*ao*(.94+n2*.12);D[k]=clamp(c[0]*f,0,255);D[k+1]=clamp(c[1]*f,0,255);D[k+2]=clamp(c[2]*f,0,255);D[k+3]=255;}
    s2.putImageData(img,0,0);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(sc2,0,DDB.y0,W0,DDB.y1-DDB.y0);}
  // rock faces: strata lines and cracks where it's steep; clumps of gorse and grass on the tops
  for(let i=0;i<1500;i++){const px=r()*W0,py=-460+r()*780;if(!ddRock(px,py))continue;const wx=px+DDX,sl=Math.hypot(ddH(wx+5,py)-ddH(wx-5,py),ddH(wx,py+5)-ddH(wx,py-5))/10;
    if(sl>.3){const l=10+r()*34;x.strokeStyle=`rgba(${r()<.6?'52,44,34':'214,200,170'},${.16+r()*.26})`;x.lineWidth=.7+r()*1.8;x.beginPath();x.moveTo(px,py);x.lineTo(px+l,py+(r()-.5)*8);x.stroke();}
    else if(r()<.5){x.fillStyle=`rgba(${r()<.5?'58,96,40':'150,160,70'},${.3+r()*.4})`;x.beginPath();x.ellipse(px,py,4+r()*10,3+r()*7,r()*3,0,7);x.fill();}}
  // speckle everywhere: stones in the sand, tufts in the grass
  for(let i=0;i<26000;i++){const px=r()*W0,py=-760+r()*1660,s=.6+r()*1.6;x.fillStyle=py>316?`rgba(${r()<.5?'120,96,60':'250,236,200'},${.12+r()*.25})`:`rgba(${r()<.5?'52,84,34':'190,196,110'},${.1+r()*.22})`;x.fillRect(px,py,s,s);}
  // shingle under the wall, tide lines, the worn way up the draw
  for(let i=0;i<5000;i++){const px=r()*W0,py=318+r()*r()*46,s=1+r()*2.4;x.fillStyle=`rgba(${r()<.5?'96,92,84':'150,146,136'},${.5+r()*.4})`;x.beginPath();x.arc(px,py,s,0,7);x.fill();}
  for(const[yy,a]of[[690,.3],[655,.16],[612,.1]]){x.strokeStyle=`rgba(60,52,40,${a})`;x.lineWidth=3;x.beginPath();for(let px=0;px<=W0;px+=20)x.lineTo(px,yy+Math.sin(px*.03+yy)*5+Math.sin(px*.11)*2);x.stroke();}
  x.strokeStyle='rgba(176,146,98,.55)';x.lineWidth=46;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(505,300);x.lineTo(560,150);x.lineTo(520,10);x.lineTo(380,-150);x.lineTo(230,-300);x.lineTo(240,-400);x.lineTo(520,-520);x.lineTo(800,-600);x.stroke();
  let gr; // the shell holes: scorched, dark at the bottom
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
const DD_SKY=[[.0,0xa8bccb,0xc2d2de,.5,0xfff0d8,.78],[.5,0xb4d2e8,0xd2e2f0,.54,0xfff6e4,.9],[1,0xe2a878,0xe6b48c,.46,0xffa860,.8]];   // [t, fog/sky, hemi sky, hemi k, sun colour, sun k]
function ddSky(t){
  let a=DD_SKY[0],b=DD_SKY[DD_SKY.length-1];for(let i=0;i<DD_SKY.length-1;i++)if(t>=DD_SKY[i][0]&&t<=DD_SKY[i+1][0]){a=DD_SKY[i];b=DD_SKY[i+1];}
  const k=b[0]>a[0]?clamp((t-a[0])/(b[0]-a[0]),0,1):0,L=DD.lights,mix=(p,q)=>new T.Color(p).lerp(new T.Color(q),k);
  const sky=mix(a[1],b[1]);DD.scene.background.copy(sky);DD.scene.fog.color.copy(sky);if(DD.dome)DD.dome.material.color.copy(sky);
  L.hemi.color.copy(mix(a[2],b[2]));L.hemi.userData.base=a[3]+(b[3]-a[3])*k;L.moon.color.copy(mix(a[4],b[4]));L.moon.intensity=a[5]+(b[5]-a[5])*k;
  if(DD.sea)DD.sea.material.color.copy(new T.Color(0x2f7890).lerp(new T.Color(0x7a6258),Math.max(0,t-.5)*2));
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
    const far=new T.Mesh(new T.PlaneGeometry(9000,3000),new T.MeshStandardMaterial({color:0x6f9440,roughness:1}));far.rotation.x=-Math.PI/2;far.position.set(700,151,DDB.y0-1500);sc.add(far);
    // the sea: grey-green, a slow swell in its normals, pale where it thins over the sand
    const seaT=canvasTex(256,256,(q,w,h)=>{const r2=rng(5);q.fillStyle='#e4ecee';q.fillRect(0,0,w,h);for(let i=0;i<90;i++){const y=r2()*h,x=r2()*w,l=30+r2()*70;q.strokeStyle=r2()<.5?`rgba(255,255,255,${.4+r2()*.5})`:`rgba(120,150,164,${.35+r2()*.4})`;q.lineWidth=1+r2()*2.5;q.beginPath();for(let k=0;k<=8;k++){const px=x+l*k/8,py=y+Math.sin(k*.9+i)*2.4;for(const ox of[-w,0,w])for(const oy of[-h,0,h])k?0:q.moveTo(px+ox,py+oy);q.lineTo(px,py);}q.stroke();}});
    seaT.wrapS=seaT.wrapT=T.RepeatWrapping;seaT.repeat.set(40,12);
    {const bed=new T.Mesh(new T.PlaneGeometry(9000,2700),new T.MeshLambertMaterial({color:0x6f887c,fog:false}));bed.rotation.x=-Math.PI/2;bed.position.set(700,-20,880+1350);sc.add(bed);}   // the sea bed beyond the land's sheet
    const wm=new T.MeshLambertMaterial({color:0x2f7890,map:seaT,transparent:true,opacity:.84,fog:false});
    const sea=new T.Mesh(new T.PlaneGeometry(9000,2800,60,20),wm);sea.rotation.x=-Math.PI/2;sea.position.set(700,.2,700+1400);sea.receiveShadow=true;sc.add(sea);DD.sea=sea;
    const foamT=canvasTex(256,32,(q,w,h)=>{const r=rng(7);q.clearRect(0,0,w,h);for(let i=0;i<500;i++){const a=r()*.5*(1-Math.abs(r()-.5)*2);q.fillStyle=`rgba(236,240,238,${a})`;q.beginPath();q.arc(r()*w,h*.5+(r()-.5)*h*.7,1+r()*3,0,7);q.fill();}});
    foamT.wrapS=T.RepeatWrapping;foamT.repeat.set(26,1);
    const foam=new T.Mesh(new T.PlaneGeometry(9000,26),new T.MeshBasicMaterial({map:foamT,transparent:true,opacity:.8,depthWrite:false}));foam.rotation.x=-Math.PI/2;foam.position.set(700,.5,702);sc.add(foam);DD.foam=foam;
    // a sky to look at when the camera's tilted down: a big dome the colour of the haze
    const dome=new T.Mesh(new T.SphereGeometry(5200,24,12),new T.MeshBasicMaterial({color:0x8e9aa2,side:T.BackSide,fog:false,depthWrite:false}));dome.position.set(700,0,0);sc.add(dome);DD.dome=dome;
    ddProps(sc,objsL);
    if(typeof ddScenery==='function')ddScenery(sc);   // (ddlook.js: sky, ships, balloons, the landings either side)
    // the light: an overcast dawn (ddSky moves it on through the day)
    const hemi=new T.HemisphereLight(0xc2d2de,0x8a7a5c,.5);hemi.userData.base=.5;sc.add(hemi);
    const sun=new T.DirectionalLight(0xfff0d8,.82);sun.position.set(330,640,420);sun.target.position.set(700,0,100);
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
    conc=M(0xb4b0a4,.95),concD=M(0x8a877c,.95),bag=M(0xb8a372,1),steel=M(0x3a3632,.6,.7),rust=M(0x5a4030,.8,.4),wood=M(0x5d4a34,.95),rockM=new T.MeshStandardMaterial({color:0x857a68,roughness:1,flatShading:true}),olive=M(0x4d5540,.9),dark=M(0x26282a,.7,.5);
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
      box(o,26,M(0xa89a78,.95));
      const rs=new T.Shape();rs.moveTo(-o.h/2-5,0);rs.lineTo(o.h/2+5,0);rs.lineTo(0,17);rs.closePath();const roof=add(new T.ExtrudeGeometry(rs,{depth:o.w+12,bevelEnabled:false}),M(0x7a4a36,.9),o.x-6,g0+26,cy,Math.PI/2);o.meshes.push(roof);
      o.meshes.push(add(new T.BoxGeometry(18,20,1.5),dark,cx,g0+10,o.y+o.h+.6));
      for(const dxw of[-80,-40,40,80])o.meshes.push(add(new T.BoxGeometry(12,8,1.2),new T.MeshBasicMaterial({color:0xd9b46a}),cx+dxw,g0+15,o.y+o.h+.5));
    }
  }
  // roofs over the pillbox and the nests (they fade when one of ours is inside: ddFrame), the heavy gun's and the cannon's shields
  const slab=(dx0,y0,w,d,hh)=>{const x=dx0+DDX+w/2,y=y0+d/2,m=add(new T.BoxGeometry(w+8,4,d+8),new T.MeshStandardMaterial({color:0x7d7c76,roughness:.95,transparent:true}),x,ddH(x,y)+hh,y);m.userData.b={x0:dx0+DDX,x1:dx0+DDX+w,y0,y1:y0+d};return m;};
  DD.roofs=[slab(626,250,84,48,17),slab(790,-30,198,68,17),slab(30,-440,120,76,17)];
  for(const m of DD.roofs)m.castShadow=true;
  if(typeof ddDress==='function')ddDress(G,sc,M);   // (ddlook.js: grass, bushes, trees, stones, clutter)
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
  if(DD.sea&&DD.sea.material.map)DD.sea.material.map.offset.set(now*.004,now*.012);
  if(DD.foam){DD.foam.position.z=702+Math.sin(now*.7)*5;DD.foam.material.opacity=.55+.3*Math.sin(now*.7+1.2);DD.foam.material.map.offset.x=now*.004;}
  if(Math.abs(DD.day-DD.dayShown)>.004){DD.dayShown+=clamp(DD.day-DD.dayShown,-rdt*.05,rdt*.05);ddSky(DD.dayShown);}
  if(DD.dome)DD.dome.position.set(camera.position.x,0,camera.position.z);
  for(const m of DD.roofs||[]){const b=m.userData.b,inside=players.some(p=>alive(p)&&p.x>b.x0&&p.x<b.x1&&p.y>b.y0&&p.y<b.y1);m.material.opacity+=((inside?.18:1)-m.material.opacity)*Math.min(1,rdt*8);m.material.depthWrite=m.material.opacity>.95;}
  const dt=Math.min(.05,rdt)*(typeof timeScale==='function'&&state==='play'?timeScale():1);
  for(const g of DD.gibs){if(!g.on)continue;g.t+=dt;const p=g.m.position;
    if(g.v){g.v[1]-=260*dt;p.x+=g.v[0]*dt;p.y+=g.v[1]*dt;p.z+=g.v[2]*dt;g.m.rotation.x+=g.w[0]*dt;g.m.rotation.y+=g.w[1]*dt;g.m.rotation.z+=g.w[2]*dt;
      const fl=ddH(p.x,p.z)+1.2;if(p.y<=fl){p.y=fl;if(Math.abs(g.v[1])>50){g.v[1]*=-.3;g.v[0]*=.5;g.v[2]*=.5;paintDecal({k:'body',x:p.x,y:p.z,a:0,r:Math.random()*.4});}else g.v=null;}}
    if(g.t>26){g.on=false;g.m.visible=false;}}
  if(typeof ddLookFrame==='function')ddLookFrame(dt,now);
  if(typeof ddCam==='function')ddCam(rdt);   // (ddplay.js: the camera keeps with the squad)
}

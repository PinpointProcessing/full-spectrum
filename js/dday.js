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
const DD_FACE=[[0,120],[600,85],[120,-320],[0,-320]],   // (until Version 133 a block of it came down to the beach at dx 330-470; Bryan circled it: "Remove the circled part and make it a road")
  DD_RWALL=[[600,316],[600,280],[740,40],[1000,40],[1000,316]],
  DD_RRIGHT=[[316,-312],[440,-435],[1000,-435],[1000,-95],[752,-95]];
function ddIn(poly,x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;}
const ddMx=x=>{let d=x-DDX;if(d<0)d=-d;if(d>DDW)d=2*DDW-d;return clamp(d,0,DDW);};   // the play area's x (0..1000) for any x: the edges mirror it
const DD_LEDGE={x0:598,x1:1000,y0:212,y1:300},ddPathH=dx=>28+clamp((dx-598)/402,0,1)*40;   // since Version 129 one path along the foot of the mountain's face, at the beach's edge, from the first bunker up to the second (Bryan: "The current mountain between them should be a path running horizontally to both bases"); it climbs 4 m on the way   // the first bunker's shelf, cut into the foot of the hill the nests stand on (Bryan: "The first bunker should share the same hill going up to the second bunker, just at the edge of the beach")
const ddLedge=(dx,y)=>dx>=DD_LEDGE.x0&&dx<=DD_LEDGE.x1&&y>=DD_LEDGE.y0&&y<DD_LEDGE.y1;
// since Version 132 the top of the hill on the right is ground too (Bryan: "Artillery and another bunker are on top of the hill on the right too.
// Right now it's empty"): reached from the draw by the old nests' shelf, a rim of rock left between it and the path below
const DD_TOP={x0:770,x1:986,y0:40,y1:170},ddTop=(dx,y)=>dx>=DD_TOP.x0&&dx<=DD_TOP.x1&&y>=DD_TOP.y0&&y<DD_TOP.y1;
// (Version 137) the second hill, behind and above it, has a top too: the artillery's, reached from the base (Bryan: "Artillery should be on the second hill and should rain down on the beach")
const DD_TOP2={x0:640,x1:900,y0:-436,y1:-336},ddTop2=(dx,y)=>dx>=DD_TOP2.x0&&dx<=DD_TOP2.x1&&y>=DD_TOP2.y0&&y<DD_TOP2.y1;
const ddRock=(dx,y)=>ddLedge(dx,y)||ddTop(dx,y)||ddTop2(dx,y)?0:ddIn(DD_FACE,dx,y)?1:ddIn(DD_RWALL,dx,y)?2:ddIn(DD_RRIGHT,dx,y)?3:0;
const ddRamp=y=>18+clamp((300-y)/620,0,1)*132;   // the draw's floor: 1.8 m at the gate to 15 m at the top
const DD_HOLES=[{x:380,y:520,r:34,c:2,n:'deep'},{x:640,y:560,r:30,c:1},{x:820,y:470,r:20,c:1},{x:250,y:400,r:18,c:1},{x:545,y:392,r:18,c:1},{x:130,y:600,r:20,c:1},{x:900,y:640,r:22,c:1}];
function ddRawH(dx,y){
  if(dx>=DD_LEDGE.x0&&dx<=DD_LEDGE.x1&&y>=DD_LEDGE.y0&&y<318)return ddPathH(dx);   // the path, and its lip down to the sand
  if(ddTop(dx,y))return 96;
  if(ddTop2(dx,y))return 178;
  if(y>=316)return y<700?16*(700-y)/384:y<770?-7*(y-700)/70:Math.max(-20,-7-(y-770)*.16);
  const r=ddRock(dx,y),n=Math.sin(dx*.071+y*.043)*7+Math.sin(dx*.023-y*.061)*9;
  if(r===1)return Math.min(ddRamp(y)+58,172)+n;
  if(r===2)return 104+n*.7;
  if(r===3)return Math.min(ddRamp(y)+52,182)+n;
  if(dx<600&&y>=100){const road=20+(316-y)*.03,k=clamp((dx-440)/130,0,1);return road+(ddRamp(y)-road)*k*k*(3-2*k);}   // the road along the top of the beach, from the left edge to the draw's mouth, where it meets the path
  if(dx>=752&&y>=-95&&y<=40)return 92;              // the nests' shelf
  if(y<-320)return 152;                             // the base at the top
  return ddRamp(y);
}
const DDG={nx:141,ny:167,h:null};
function ddBuildH(){
  const{nx,ny}=DDG;let a=new Float32Array(nx*ny),b=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)a[j*nx+i]=i*10>=1290&&DDB.y0+j*10<=-330?152:ddRawH(ddMx(i*10),DDB.y0+j*10);   // (east of the old play area the top is flat ground, not a mirror image: the road on to their base, ddbase.js)
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

// the ground in the way (Version 154, Bryan: "Bullets go through the hill at the top. Enemies can shoot right through it"): rock was only a
// 'drop', which stops feet and not eyes, so every hill was glass. A line from eye to eye is blocked where the ground rises above it.
const DD_EYE=15;
function ddSightOK(ax,ay,bx,by){
  if(!DDG.h)return true;const d=Math.hypot(bx-ax,by-ay);if(d<40)return true;
  const ha=ddH(ax,ay)+DD_EYE,hb=ddH(bx,by)+DD_EYE,n=Math.min(48,Math.ceil(d/16));
  for(let i=1;i<n;i++){const t=i/n;if(t*d<14||(1-t)*d<14)continue;if(ddH(ax+(bx-ax)*t,ay+(by-ay)*t)>ha+(hb-ha)*t+3)return false;}
  return true;
}

/* ---------- the map's objects (play-area coordinates dx 0..1000, then moved over by DDX) ---------- */
const DD_SPOT={   // where things are (dx,y): ddplay.js posts the defenders by these
  // (Version 139, Bryan: "add more stationary machine tunes in each one": three in each bunker on the path, fanned out, each with a narrow swing, so
  // between them a bunker covers what its one gun did; two on the hill; a light one at the top of the way up)
  pill:{x:668,y:280,ang:Math.PI/2,arc:.36},pillMGs:[{x:644,y:280,ang:Math.PI/2+.62,arc:.36},{x:692,y:280,ang:Math.PI/2-.62,arc:.36}],
  leftMG:{x:342,y:280,ang:Math.PI/2,arc:.34},leftMGs:[{x:318,y:280,ang:Math.PI/2+.6,arc:.34},{x:366,y:280,ang:Math.PI/2-.6,arc:.34}],
  nests:[{x:858,y:280,ang:Math.PI/2+.66,arc:.38},{x:906,y:280,ang:Math.PI/2,arc:.36},{x:954,y:280,ang:Math.PI/2-.5,arc:.36}],
  hillMG2:{x:904,y:140,ang:Math.PI/2-.42,arc:.48},pathMG:{x:292,y:-424,ang:1.32,arc:.8},sniper2:{x:206,y:-590},
  hillMG:{x:856,y:140,ang:Math.PI/2+.42,arc:.5},art:{x:756,y:-384},heavy:{x:90,y:-398},cannon:{x:240,y:-594},topMG:{x:350,y:-588,ang:Math.PI/2,arc:1.3},drawMG:{x:466,y:-140,ang:1.35,arc:.85},sniper:{x:122,y:-590},
  mortars:[{x:862,y:-478},{x:922,y:-468},{x:974,y:-480}],barracks:{x:400,y:-715,w:240,h:60},door:{x:520,y:-640},   // (Version 152, Bryan: "The upper right barracks is awkward to turn too. Can we make it more direct on the path?": it stood at dx 700-940, a long way east along the top; now it's straight ahead where the way up comes out, beside the other one)
  
  barr2:{x:112,y:-716,w:250,h:58},door2:{x:236,y:-646},door3:{x:1085,y:-600},tankWay:[[1085,-600],[930,-578],[800,-565]],   // (Version 145: a second barracks behind the highest bunker; since Version 148 the counterattack comes out of their base's gate, ddbase.js)
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
  for(const x of[120,190])o('sandbag',x,304,66,10);
  // the left bunker, on the road at the map's centre left (Bryan: "move the bunker more the right so it's at the center left of the map")
  o('ddpb',300,290,84,8,{cover:2,bk:'p0'});o('ddpb',300,250,8,40,{cover:2,full:true,bk:'p0'});o('ddpb',376,250,8,40,{cover:2,full:true,bk:'p0'});
  for(const x of[404])o('sandbag',x,304,62,10);   // (concrete walls stood here until Version 131; Bryan: "No wall divides the bunker on the left with the bunker on the right")
  // the wire: a fence of barbed wire right across the beach, between the sand and everything else. It can be climbed, which cuts
  // (ddplay.js), or blown open a stretch at a time (Bryan: "A fence blocks all access and has to be climbed or blown up")
  for(let x=0;x<1000;x+=50)o('ddwire',x,340,50,8,{hp:40,tag:'wire'});
  o('sandbag',540,304,52,10);
  // the pillbox behind the left gate: concrete to the front and sides, open at the back
  o('ddpb',626,290,84,8,{cover:2,bk:'p1'});o('ddpb',626,250,8,40,{cover:2,full:true,bk:'p1'});o('ddpb',702,250,8,40,{cover:2,full:true,bk:'p1'});   // (bk: a closed bunker: a slit in its front wall, side walls that block sight, open at the back)
  o('sandbag',716,286,22,10);o('sandbag',236,262,10,40);o('ddcrate',190,190,22,20,{cover:1});   // (the pocket behind the left gate, where the bunker was: a sandbag line)
  // the two machine gun nests on the rock to the right: open on the draw's side
  o('ddpb',826,290,160,8,{cover:2,bk:'p2'});o('ddpb',826,250,8,40,{cover:2,full:true,bk:'p2'});o('ddpb',978,250,8,40,{cover:2,full:true,bk:'p2'});
  // the top of the hill on the right: a third bunker at its south rim, over the path and the beach, and an artillery piece behind sandbags
  o('ddpb',830,152,100,8,{cover:2,bk:'p3'});o('ddpb',830,112,8,40,{cover:2,full:true,bk:'p3'});o('ddpb',922,112,8,40,{cover:2,full:true,bk:'p3'});
  o('sandbag',946,124,34,10);o('sandbag',790,124,44,10);
  // the artillery, two guns on the second hill's top looking out over everything
  o('ddgun',690,-392,24,22,{cover:1,hp:200,tag:'art'});o('ddgun',800,-392,24,22,{cover:1,hp:200,tag:'art'});o('sandbag',676,-352,58,10);o('sandbag',786,-352,58,10);o('ddcrate',748,-420,22,20,{cover:1});
  // the nest up the draw: bags round three sides of its gun, which looks straight down the way up (Bryan: "The hill up should have a mg nest facing downwards")
  o('sandbag',420,-158,10,38);o('sandbag',498,-158,10,38);o('ddcrate',850,66,22,20,{cover:1});o('ddcrate',930,60,22,20,{cover:1});
  // the draw: sandbags across it at three heights, and boulders
  for(const[x,y]of[[500,190],[430,-130],[520,-152],[230,-270]])o('sandbag',x,y,66,10);
  for(const[x,y]of[[590,120],[660,20],[540,-40],[430,-80],[610,-100],[380,-190],[500,-215],[310,-245],[420,-262],[640,-170],[560,250],[520,105]])o('ddbould',x,y,18,15,{cover:1});
  // the base at the top: the heavy gun's emplacement, the long position along the back, the mortar pits, crates, the barracks
  o('ddpb',30,-372,120,8,{cover:2,bk:'hv'});o('ddpb',30,-440,8,68,{cover:2,full:true,bk:'hv'});o('ddpb',142,-440,8,68,{cover:2,full:true,bk:'hv'});
  o('ddgun',78,-408,24,22,{cover:1,hp:200,tag:'heavy'});
  o('ddpb',90,-572,300,8,{cover:2,bk:'tp'});o('ddpb',90,-620,8,48,{cover:2,full:true,bk:'tp'});o('ddpb',382,-620,8,48,{cover:2,full:true,bk:'tp'});   // the highest bunker: closed in like the others since Version 139
  o('sandbag',262,-410,58,10);o('sandbag',256,-440,10,34);o('sandbag',322,-440,10,34);   // the light machine gun's nest at the top of the way up, in front of it
  o('ddgun',228,-600,24,20,{cover:1,hp:200,tag:'cannon'});
  for(const[x,y]of[[840,-462],[900,-452],[952,-464]])o('sandbag',x,y,44,10);
  for(const[x,y]of[[450,-520],[560,-560],[640,-500],[520,-462],[760,-540],[330,-470],[250,-500]])o('ddcrate',x,y,22,20,{cover:1});
  o('ddbarr',DD_SPOT.barracks.x,DD_SPOT.barracks.y,DD_SPOT.barracks.w,DD_SPOT.barracks.h,{full:true,hp:380,tag:'barracks'});
  {const b=DD_SPOT.barr2;o('ddbarr',b.x,b.y,b.w,b.h,{full:true,hp:380,tag:'barr2'});}
  // the base's vehicles, tents, drums and radio mast (their looks: ddlook.js)
  o('ddtruck',958,-648,26,58,{full:true});o('ddtruck',700,-712,26,58,{full:true});o('ddtent',790,-724,40,46,{full:true});o('ddtent',850,-720,40,46,{full:true});o('ddtent',180,-520,40,46,{full:true});
  for(const[x,y]of[[668,-650],[946,-724],[300,-548],[560,-470]])o('dddrum',x,y,16,16,{cover:1});
  o('ddmast',676,-742,8,8,{});
  // the beach: obstacles, wire, the holes' forward lips (cover from up the hill), two wrecks
  for(const[x,y]of[[150,640],[330,650],[520,660],[700,640],[880,655],[240,560],[450,600],[760,585],[120,430],[690,405],[930,540],[60,520],[470,470]])o('ddhog',x,y,14,14,{cover:1});
  for(const h of DD_HOLES)o('ddrim',h.x-h.r,h.y-h.r-3,h.r*2,6,{cover:h.c});
  o('ddwreck',296,488,46,26,{full:true});o('ddwreck',838,596,24,56,{full:true,lc:1});
  // the edges: mirror images of the rock that reaches them, so the cliffs carry on (nobody fights there)
  for(const q of L.slice()){if(q.kind!=='drop')continue;const dx=q.x-DDX;
    if(dx<200)L.push(Object.assign({},q,{x:DDX-dx-q.w}));
    if(dx+q.w>800)L.push(Object.assign({},q,{x:DDX+2*DDW-dx-q.w}));}
  L.push({kind:'drop',x:0,y:300,w:DDX,h:16,full:false,rock:1},{kind:'drop',x:DDX+DDW,y:300,w:DDX,h:16,full:false,rock:1});   // the line carries on as rock across the edges
  L.push({kind:'water',x:0,y:776,w:1400,h:124,full:false});
  if(typeof ddBaseObjects==='function')for(const q of ddBaseObjects())L.push(q);   // (their base east of the top: ddbase.js)
  return L;
}
VAULTABLE.add('ddgate');VAULTABLE.add('ddwire');   // a gate can be climbed (pathfinding.js), or blown open (ddBlast in ddplay.js)

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
  // the path along the cliff's foot: one worn track from the draw's mouth past both bunkers (Bryan: "The bunker on the left needs to be on the path")
  x.fillStyle='rgba(186,158,108,.5)';x.fillRect(598,214,402,84);
  x.strokeStyle='rgba(190,160,108,.8)';x.lineWidth=34;x.beginPath();x.moveTo(-10,236);x.lineTo(300,232);x.lineTo(520,240);x.lineTo(600,236);x.stroke();   // the road: on left from the path, behind the left bunker, to the map's edge
  x.strokeStyle='rgba(96,78,52,.45)';x.lineWidth=2.2;for(const oy of[-8,8]){x.beginPath();x.moveTo(-10,236+oy);x.lineTo(300,232+oy);x.lineTo(520,240+oy);x.lineTo(600,236+oy);x.stroke();}
  x.strokeStyle='rgba(190,160,108,.75)';x.lineWidth=30;x.beginPath();x.moveTo(520,286);x.lineTo(600,236);x.lineTo(1000,232);x.stroke();
  x.strokeStyle='rgba(96,78,52,.45)';x.lineWidth=2.2;for(const oy of[-7,7]){x.beginPath();x.moveTo(524,286+oy);x.lineTo(602,236+oy);x.lineTo(1000,232+oy);x.stroke();}
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
// poured concrete: the marks of the boards it was cast against, rain streaks, stains and a few cracks
function ddConcTex(){const t=canvasTex(256,256,(q,w,h)=>{const r=rng(31);q.fillStyle='#c9c5b8';q.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=16){q.fillStyle=`rgba(${r()<.5?'70,66,58':'235,232,222'},${.05+r()*.1})`;q.fillRect(0,y,w,16);q.fillStyle='rgba(60,56,50,.35)';q.fillRect(0,y,w,1);}
    for(let i=0;i<70;i++){const x=r()*w,l=20+r()*90;const g=q.createLinearGradient(0,0,0,l);g.addColorStop(0,`rgba(50,48,42,${.1+r()*.22})`);g.addColorStop(1,'rgba(50,48,42,0)');q.fillStyle=g;q.fillRect(x,r()*h*.5,2+r()*7,l);}
    for(let i=0;i<26;i++){q.fillStyle=`rgba(${r()<.5?'86,98,60':'92,84,70'},${.1+r()*.16})`;q.beginPath();q.ellipse(r()*w,r()*h,8+r()*26,5+r()*16,r()*3,0,7);q.fill();}
    q.strokeStyle='rgba(40,38,34,.5)';q.lineWidth=1;for(let i=0;i<7;i++){let x=r()*w,y=r()*h;q.beginPath();q.moveTo(x,y);for(let k=0;k<6;k++){x+=(r()-.5)*26;y+=6+r()*14;q.lineTo(x,y);}q.stroke();}
    for(let i=0;i<900;i++){q.fillStyle=`rgba(${r()<.5?'40,38,34':'250,248,240'},${.05+r()*.12})`;q.fillRect(r()*w,r()*h,1.4,1.4);}});
  t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,1);return t;}
// everything standing on the land: built into one group, and copied (mirrored) either side for the battle next door
function ddProps(sc,objsL){
  const G=new T.Group();DD.props=G;sc.add(G);
  const M=(c,r=.9,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m}),
    conc=M(0xb4b0a4,.95),concD=M(0x8a877c,.95),bag=M(0xb8a372,1),steel=M(0x3a3632,.6,.7),rust=M(0x5a4030,.8,.4),wood=M(0x5d4a34,.95),rockM=new T.MeshStandardMaterial({color:0x857a68,roughness:1,flatShading:true}),olive=M(0x4d5540,.9),dark=M(0x26282a,.7,.5);
  const add=(geo,mat,x,y,z,ry,rx,rz)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;if(rx)m.rotation.x=rx;if(rz)m.rotation.z=rz;m.castShadow=true;m.receiveShadow=true;G.add(m);return m;};
  const box=(o,h,mat,lift=0)=>{const g0=ddH(o.x+o.w/2,o.y+o.h/2);const m=add(new T.BoxGeometry(o.w,h,o.h),mat,o.x+o.w/2,g0+h/2+lift,o.y+o.h/2);(o.meshes=o.meshes||[]).push(m);return m;};
  const bagG=new T.SphereGeometry(1,7,5),r=rng(66),BK=DD.bk={},concT=ddConcTex(),bkM=(k,v=0)=>{const L=BK[k]||(BK[k]=[]);return L[v]||(L[v]=v===2?new T.MeshStandardMaterial({color:0x7a6a48,roughness:1,transparent:true}):v===3?new T.MeshStandardMaterial({color:0x5f8a3a,roughness:1,transparent:true}):new T.MeshStandardMaterial({color:v?0x8f8b80:0xd0ccc0,map:concT,roughness:.95,transparent:true}));};
  for(const o of objsL){
    const cx=o.x+o.w/2,cy=o.y+o.h/2,g0=ddH(cx,cy);
    if(o.kind==='sandbag'){   // two courses of bags
      const horiz=o.w>=o.h,n=Math.round((horiz?o.w:o.h)/8);o.meshes=[];
      for(let c=0;c<2;c++)for(let k=0;k<n-c;k++){const t=(k+.5+c*.5)/n,x=horiz?o.x+t*o.w:cx,y=horiz?cy:o.y+t*o.h,m=add(bagG,bag,x,ddH(x,y)+2.4+c*3.6,y,horiz?0:Math.PI/2);m.scale.set(4.6,2.3,horiz?o.h*.5:o.w*.5);m.rotation.y+=(r()-.5)*.2;o.meshes.push(m);}
    }else if(o.kind==='ddconc'){box(o,24,conc);const cap=add(new T.BoxGeometry(o.w+2,2.4,o.h+3),concD,cx,g0+25,cy);o.meshes.push(cap);}
    else if(o.kind==='ddpb'){   // a bunker's wall (their look redone for Version 131, Bryan: "the pillboxes look bad"): board-marked, stained concrete
      // thick at the foot, the front leaning back to a deep firing slit with a stepped throat, earth banked up the sides; each bunker's
      // parts share materials of its own, so the whole of it can go clear with one of ours inside (ddFrame)
      if(!o.bk)box(o,15,conc);
      else{const m=bkM(o.bk),md=bkM(o.bk,1),me=bkM(o.bk,2);o.meshes=o.meshes||[];const P=(geo,mat,x,y,z,ry,rx,rz)=>{const q=add(geo,mat,x,y,z,ry,rx,rz);o.meshes.push(q);return q;};
        if(o.w>o.h){   // the front: a battered lower wall, the slit, a heavy lintel, piers at the ends and the middle
          const sh=new T.Shape();sh.moveTo(-o.h/2-4,0);sh.lineTo(o.h/2+1,0);sh.lineTo(o.h/2+1,6.5);sh.lineTo(-o.h/2,6.5);sh.closePath();   // (since Version 139 a low wall and a tall opening: Bryan, "The bunker's embrasure should be much larger, the player can see inside the bunker from the ground")
          const low=P(new T.ExtrudeGeometry(sh,{depth:o.w+6,bevelEnabled:false}),m,o.x-3,g0,cy,Math.PI/2);
          P(new T.BoxGeometry(o.w+6,5.5,o.h+2),m,cx,g0+21.8,cy);                         // the lintel
          P(new T.BoxGeometry(o.w+10,1.4,o.h+7),md,cx,g0+18.6,cy+1);                      // its drip edge over the opening
          for(const fx of(o.w>200?[0,.25,.5,.75,1]:[0,1]))P(new T.BoxGeometry(6,12.6,o.h+2),m,o.x+3+fx*(o.w-6),g0+12.6,cy);
        }else{P(new T.BoxGeometry(o.w+2,24.5,o.h+4),m,cx,g0+12.2,cy+1);
          const east=cx>DDX+({p0:342,p1:668,p2:906,p3:880,tp:240}[o.bk]||90)?1:-1;if(!((o.bk==='p1'&&east>0)||(o.bk==='p2'&&east<0))){const be=P(new T.SphereGeometry(1,10,7),me,cx+east*9,g0+1,cy+4);be.scale.set(13,15,o.h*.62);   // earth banked against the side
          const tf=P(new T.SphereGeometry(1,8,6),bkM(o.bk,3),cx+east*10,g0+13,cy+6);tf.scale.set(8,4.5,o.h*.4);}}
      }}
    else if(o.kind==='ddgate'){   // a steel frame gate with cross bars
      o.meshes=[];const n=Math.round(o.w/14);
      for(let k=0;k<=n;k++)o.meshes.push(add(new T.BoxGeometry(1.6,17,1.6),steel,o.x+k*o.w/n,g0+8.5,cy));
      for(const hh of[4,10,16])o.meshes.push(add(new T.BoxGeometry(o.w,1.2,1.2),steel,cx,g0+hh,cy));
      for(let k=0;k<n;k++)o.meshes.push(add(new T.BoxGeometry(hyp(o.w/n,12),1,1),rust,o.x+(k+.5)*o.w/n,g0+10,cy,0,0,(k%2?1:-1)*Math.atan2(12,o.w/n)));
    }else if(o.kind==='ddbould'){const m=add(new T.DodecahedronGeometry(10,0),rockM,cx,g0+4,cy,r()*6);m.scale.set(1.05,.8+r()*.3,.9);(o.meshes=[]).push(m);}
    else if(o.kind==='ddcrate'){box(o,13,wood);}
    else if(o.kind==='ddhog'){   // a steel hedgehog: three girders crossed
      o.meshes=[];for(const[rx,rz]of[[.6,.6],[-.6,.6],[0,-1.0]])o.meshes.push(add(new T.BoxGeometry(2,22,2),rust,cx,g0+7,cy,r()*.4,rx,rz));
    }else if(o.kind==='ddwire'){   // the fence: posts, three strands and a coil of barbed wire along the top
      o.meshes=[];const wm=M(0x4a4640,.5,.7);
      for(let x=o.x;x<o.x+o.w-1;x+=12.5){const p=add(new T.BoxGeometry(1.3,17,1.3),wood,x+.6,ddH(x,cy)+8.5,cy);o.meshes.push(p);}
      for(const hh of[5,10,15])o.meshes.push(add(new T.BoxGeometry(o.w,.35,.35),wm,cx,g0+hh,cy));
      for(let x=o.x+3;x<o.x+o.w;x+=6)o.meshes.push(add(new T.TorusGeometry(2.6,.28,4,8),wm,x,ddH(x,cy)+17.5,cy,Math.PI/2+.4));
      for(let x=o.x+4;x<o.x+o.w;x+=8)o.meshes.push(add(new T.TorusGeometry(2.2,.25,4,8),wm,x,ddH(x,cy+5)+2.2,cy+5,Math.PI/2-.3));
    }else if(o.kind==='fence'){   // coils of barbed wire on stakes
      o.meshes=[];const n=Math.round(o.w/7),wm=M(0x55504a,.5,.7);
      for(let k=0;k<n;k++){const x=o.x+k*7+3.5,t=add(new T.TorusGeometry(4,.3,4,9),wm,x,ddH(x,cy)+4.2,cy,Math.PI/2+.35);o.meshes.push(t);}
      for(let x=o.x;x<=o.x+o.w;x+=38)o.meshes.push(add(new T.BoxGeometry(1,9,1),wood,x,ddH(x,cy)+4.5,cy));
    }else if(o.kind==='ddwreck'){
      if(o.lc){o.meshes=[ddBoatMesh(G,true)];o.meshes[0].position.set(cx,g0-1,cy);o.meshes[0].rotation.set(.05,.3,.22);}
      else{box(o,14,dark);o.meshes.push(add(new T.BoxGeometry(22,9,18),dark,cx+4,g0+18,cy),add(new T.CylinderGeometry(1.4,1.4,30,6),dark,cx+22,g0+19,cy-2,0,0,Math.PI/2-.25));}
    }else if(o.kind==='ddgun'){   // a gun on its mount, barrel out over the beach
      o.meshes=[add(new T.BoxGeometry(o.w,9,o.h),steel,cx,g0+4.5,cy),add(new T.BoxGeometry(20,12,3),olive,cx,g0+13,cy+7)];
      const b=add(new T.CylinderGeometry(1.7,2.2,o.tag==='heavy'?64:o.tag==='art'?70:46,8),steel,cx,g0+(o.tag==='art'?24:15),cy+(o.tag==='heavy'?36:o.tag==='art'?30:27),0,Math.PI/2-(o.tag==='art'?.55:.07));o.meshes.push(b);o.barrel=b;
    }else if(o.kind==='ddbarr'){   // the barracks: a long hut, pitched roof, door and windows to the south
      box(o,26,M(0xa89a78,.95));
      const rs=new T.Shape();rs.moveTo(-o.h/2-5,0);rs.lineTo(o.h/2+5,0);rs.lineTo(0,17);rs.closePath();const roof=add(new T.ExtrudeGeometry(rs,{depth:o.w+12,bevelEnabled:false}),M(0x7a4a36,.9),o.x-6,g0+26,cy,Math.PI/2);o.meshes.push(roof);
      o.meshes.push(add(new T.BoxGeometry(18,20,1.5),dark,cx,g0+10,o.y+o.h+.6));
      for(const dxw of[-80,-40,40,80])o.meshes.push(add(new T.BoxGeometry(12,8,1.2),new T.MeshBasicMaterial({color:0xd9b46a}),cx+dxw,g0+15,o.y+o.h+.5));
    }
  }
  // roofs over the pillbox and the nests (they fade when one of ours is inside: ddFrame), the heavy gun's and the cannon's shields
  // a bunker's roof: a thick slab with a chamfered edge, turf and a few sandbags on top, a vent pipe; all in the bunker's own materials
  const slab=(dx0,y0,w,d,hh,bk)=>{const x=dx0+DDX+w/2,y=y0+d/2,g0=ddH(x,y),rm=bkM(bk,1),m=add(new T.BoxGeometry(w+12,5,d+12),rm,x,g0+hh,y);
    add(new T.BoxGeometry(w+6,2.2,d+6),bkM(bk,0),x,g0+hh+3.4,y);
    const tf=add(new T.SphereGeometry(1,10,6),bkM(bk,3),x-w*.12,g0+hh+4.2,y-d*.1);tf.scale.set(w*.34,2.6,d*.34);
    for(let k=0;k<5;k++){const b=add(bagG,bkM(bk,2),x-w/2+6+k*8.5,g0+hh+6.4,y+d/2+1);b.scale.set(4.4,2.2,3);}
    add(new T.CylinderGeometry(1.1,1.1,7,7),bkM(bk,1),x+w*.3,g0+hh+7,y-d*.25);
    m.userData.b={x0:dx0+DDX,x1:dx0+DDX+w,y0,y1:y0+d};m.userData.walls=BK[bk]||null;return m;};
  DD.roofs=[slab(300,250,84,48,25,'p0'),slab(626,250,84,48,25,'p1'),slab(826,250,160,48,25,'p2'),slab(830,112,100,48,25,'p3'),slab(90,-620,300,56,25,'tp'),slab(30,-440,120,76,25,'hv')];
  for(const m of DD.roofs)m.castShadow=true;
  // the machine guns themselves: a barrel on a tripod at every gun's place, pointing where it covers
  {const gm=M(0x2a2c2e,.5,.7);for(const sp of[DD_SPOT.leftMG,...DD_SPOT.leftMGs,DD_SPOT.pill,...DD_SPOT.pillMGs,...DD_SPOT.nests,DD_SPOT.topMG,DD_SPOT.drawMG,DD_SPOT.hillMG,DD_SPOT.hillMG2,DD_SPOT.pathMG]){const x=sp.x+DDX,y=sp.y,g0=ddH(x,y),g=new T.Group();g.position.set(x,g0,y);g.rotation.y=-sp.ang;
      const q=(geo,px,py,pz,rz,ry)=>{const b=new T.Mesh(geo,gm);b.position.set(px,py,pz);if(rz)b.rotation.z=rz;if(ry)b.rotation.y=ry;b.castShadow=true;g.add(b);};
      q(new T.CylinderGeometry(.75,.75,17,7),9,11.6,0,Math.PI/2);q(new T.CylinderGeometry(1.25,1.25,7,8),3,11.6,0,Math.PI/2);q(new T.BoxGeometry(5,3,2.2),-2,11.2,0);q(new T.BoxGeometry(3,2.4,4.6),1,10.6,2.6);
      for(const a of[0,2.3,-2.3]){const l=new T.Mesh(new T.CylinderGeometry(.4,.4,13,5),gm);l.position.set(Math.cos(a)*3.4,5.4,Math.sin(a)*3.4);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(l);}
      G.add(g);}}
  if(typeof ddDress==='function')ddDress(G,sc,M);   // (ddlook.js: grass, bushes, trees, stones, clutter)
  // the battle next door: the same works, mirrored
  for(const s of[-1,1]){const c=G.clone(true);c.scale.x=-1;c.position.x=s<0?0:2*(DDB.x1-DDB.x0);sc.add(c);
    for(const m of c.children)if(!m.isInstancedMesh&&m.position.z<-330&&m.position.x>(s<0?1200:860))m.visible=false;}   // (no mirror image where their base stands, or of it: ddbase.js)
  if(typeof ddBaseBuild==='function')ddBaseBuild(sc);
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
// water thrown up: by a shell in the sea, by bullets round the boats (ddplay.js's ride in)
function ddSplash(x,y,s=1){
  if(!DD)return;const P=DD.spl||(DD.spl=[]);let q=P.find(o=>!o.on);
  if(!q){if(P.length>=22)return;const m=new T.Mesh(new T.ConeGeometry(1,1,7,1,true),new T.MeshBasicMaterial({color:0xeef3f2,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide,fog:false}));m.geometry.translate(0,.5,0);DD.scene.add(m);q={m,on:false};P.push(q);}
  Object.assign(q,{on:true,t:0,s,x,y});q.m.visible=true;q.m.position.set(x,Math.max(.3,ddH(x,y)),y);
}
// a bullet on steel: a white-hot flash and a few sparks thrown off (the boats' hulls and helmets on the ride in; steel obstacles and wrecks in the fight)
function ddSpark(x,h,y,k=1){
  if(!DD)return;const P=DD.spk||(DD.spk=[]);let q=P.find(o=>!o.on);
  if(!q){if(P.length>=16)return;const g=new T.Group(),fm=new T.MeshBasicMaterial({color:0xffeeb0,transparent:true,fog:false,depthWrite:false}),f=new T.Mesh(new T.OctahedronGeometry(1,0),fm);g.add(f);
    const bits=[];for(let i=0;i<5;i++){const m=new T.Mesh(new T.BoxGeometry(.32,.32,2.6),new T.MeshBasicMaterial({color:0xffb040,transparent:true,fog:false,depthWrite:false}));g.add(m);bits.push({m,v:[0,0,0]});}
    DD.scene.add(g);q={g,f,bits,on:false};P.push(q);}
  q.on=true;q.t=0;q.k=k;q.g.visible=true;q.g.position.set(x,h,y);
  for(const b of q.bits){const a=Math.random()*TAU,s=30+Math.random()*60;b.v=[Math.cos(a)*s,25+Math.random()*70,Math.sin(a)*s*.6+18];b.m.position.set(0,0,0);}
}
// every frame (from render): the sea, the boats, the bits, the day going by, the roofs over our men
// Our rockets in 3D (Bryan: "watch a rocket go through the air"): a fat rocket with fins and a burning tail, a white smoke trail left behind it,
// and at the launch a flash at the muzzle and the blast out of the back of the tube
function ddRockets(rdt){
  const T=THREE,R=DD.rk||(DD.rk={pool:[],puffs:[],n:0});
  if(!R.geo){R.geo=new T.SphereGeometry(1,7,5);
    R.mk=()=>{const g=new T.Group(),bm=new T.MeshStandardMaterial({color:0x4a5038,roughness:.6,metalness:.3}),fm=new T.MeshBasicMaterial({color:0xffc060,transparent:true,opacity:.95,fog:false});
      const b=new T.Mesh(new T.CylinderGeometry(.75,.75,5.2,10),bm);b.rotation.z=-Math.PI/2;g.add(b);
      const n=new T.Mesh(new T.ConeGeometry(1.05,2.6,10),bm);n.rotation.z=-Math.PI/2;n.position.x=3.9;g.add(n);
      for(let i=0;i<4;i++){const f=new T.Mesh(new T.BoxGeometry(1.8,1.7,.14),bm);f.position.set(-2.6,0,0);const h=new T.Group();h.rotation.x=i*Math.PI/2;f.position.y=.9;h.add(f);g.add(h);}
      const fl=new T.Mesh(new T.ConeGeometry(1.0,6,8),fm);fl.rotation.z=Math.PI/2;fl.position.x=-5.6;g.add(fl);g.userData.fl=fl;
      const gl=new T.Mesh(R.geo,new T.MeshBasicMaterial({color:0xffe6a0,transparent:true,opacity:.9,fog:false}));gl.scale.setScalar(1.5);gl.position.x=-3.2;g.add(gl);
      g.scale.setScalar(2.1);DD.scene.add(g);return g;};
    R.puff=(x,h,y,s,life,col,vy)=>{let p=R.puffs.find(q=>q.t>=q.life);if(!p){if(R.puffs.length>260)return;const m=new T.Mesh(R.geo,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));DD.scene.add(m);p={m,t:0,life:0};R.puffs.push(p);}
      p.t=0;p.life=life;p.s=s;p.vy=vy||3;p.m.material.color.setHex(col);p.m.position.set(x+(Math.random()-.5)*2,h+(Math.random()-.5)*2,y+(Math.random()-.5)*2);p.m.visible=true;};
  }
  let i=0;
  for(const r of rockets){if(!r.by||r.by.side!=='P'||!r.total)continue;
    const f=1-r.left/r.total,sx=r.x-r.dx*(r.total-r.left),sy=r.y-r.dy*(r.total-r.left),ex=r.x+r.dx*r.left,ey=r.y+r.dy*r.left;
    const h0=ddH(sx,sy)+(r.z0||15)*1.3,h1=ddH(ex,ey)+(r.z1||8),h=Math.max(h0+(h1-h0)*f+Math.sin(f*Math.PI)*Math.min(26,r.total*.05),ddH(r.x,r.y)+4);
    const g=R.pool[i]||(R.pool[i]=R.mk());i++;g.visible=true;
    if(!r.dd3){r.dd3={h};   // the launch: the flash, and the back-blast behind the man
      for(let k=0;k<7;k++)R.puff(sx-r.dx*(10+k*5),h0-1,sy-r.dy*(10+k*5),5+k*1.6,.9+k*.12,k<2?0xffb040:0xd8d4c8,5);
      for(let k=0;k<3;k++)R.puff(sx+r.dx*(12+k*4),h0,sy+r.dy*(12+k*4),4,.35,0xffd070,2);}
    const dh=h-r.dd3.h;r.dd3.h=h;g.position.set(r.x,h,r.y);g.rotation.set(0,-Math.atan2(r.dy,r.dx),0);g.rotateZ(Math.atan2(dh,Math.max(.01,(r.speed||300)*Math.max(rdt,.001))));
    g.userData.fl.scale.set(1,.8+Math.random()*.7,1);
    r.dd3.e=(r.dd3.e||0)+rdt;while(r.dd3.e>0){r.dd3.e-=.012;R.puff(r.x-r.dx*(9+Math.random()*4),h,r.y-r.dy*(9+Math.random()*4),4.2,1.8,0xe8e6de,4);}
  }
  for(;i<R.pool.length;i++)R.pool[i].visible=false;
  for(const p of R.puffs){if(p.t>=p.life){if(p.m.visible)p.m.visible=false;continue;}p.t+=rdt;const q=Math.min(1,p.t/p.life);p.m.scale.setScalar(p.s*(.55+q*1.5));p.m.position.y+=p.vy*rdt;p.m.material.opacity=.7*(1-q)*(1-q);}
}
function ddFrame(rdt,now){
  if(!DD)return;
  ddRockets(rdt);
  if(DD.sea&&DD.sea.material.map)DD.sea.material.map.offset.set(now*.004,now*.012);
  if(DD.foam){DD.foam.position.z=702+Math.sin(now*.7)*5;DD.foam.material.opacity=.55+.3*Math.sin(now*.7+1.2);DD.foam.material.map.offset.x=now*.004;}
  if(Math.abs(DD.day-DD.dayShown)>.004){DD.dayShown+=clamp(DD.day-DD.dayShown,-rdt*.05,rdt*.05);ddSky(DD.dayShown);}
  if(DD.dome)DD.dome.position.set(camera.position.x,0,camera.position.z);
  for(const m of DD.roofs||[]){const b=m.userData.b,inside=players.some(p=>alive(p)&&p.x>b.x0&&p.x<b.x1&&p.y>b.y0&&p.y<b.y1);m.material.opacity+=((inside?.18:1)-m.material.opacity)*Math.min(1,rdt*8);m.material.depthWrite=m.material.opacity>.95;const w=m.userData.walls;if(w)for(const q of w)if(q&&q!==m.material){q.opacity=m.material.opacity;q.depthWrite=m.material.depthWrite;}}   // (a bunker with one of ours inside goes clear, walls and roof: Bryan, "the wall goes transparent when they get in there")
  const dt=Math.min(.05,rdt)*(typeof timeScale==='function'&&state==='play'?timeScale():1);
  for(const g of DD.gibs){if(!g.on)continue;g.t+=dt;const p=g.m.position;
    if(g.v){g.v[1]-=260*dt;p.x+=g.v[0]*dt;p.y+=g.v[1]*dt;p.z+=g.v[2]*dt;g.m.rotation.x+=g.w[0]*dt;g.m.rotation.y+=g.w[1]*dt;g.m.rotation.z+=g.w[2]*dt;
      const fl=ddH(p.x,p.z)+1.2;if(p.y<=fl){p.y=fl;if(Math.abs(g.v[1])>50){g.v[1]*=-.3;g.v[0]*=.5;g.v[2]*=.5;paintDecal({k:'body',x:p.x,y:p.z,a:0,r:Math.random()*.4});}else g.v=null;}}
    if(g.t>26){g.on=false;g.m.visible=false;}}
  for(const q of DD.spl||[]){if(!q.on)continue;q.t+=dt;const D=.5+q.s*.45,k=q.t/D;if(k>=1){q.on=false;q.m.visible=false;continue;}
    const up=Math.sin(Math.min(1,k*1.5)*Math.PI/2)*(1-k*k*.6);q.m.scale.set(q.s*(3+k*7),Math.max(.01,q.s*26*up),q.s*(3+k*7));q.m.material.opacity=.85*(1-k);}
  for(const q of DD.spk||[]){if(!q.on)continue;q.t+=dt;const k=q.t/.32;if(k>=1){q.on=false;q.g.visible=false;continue;}
    const fl=Math.max(0,1-q.t/.07);q.f.scale.setScalar(.01+q.k*2.3*fl);q.f.rotation.z=q.t*40;
    for(const b of q.bits){b.v[1]-=220*dt;b.m.position.x+=b.v[0]*dt;b.m.position.y+=b.v[1]*dt;b.m.position.z+=b.v[2]*dt;b.m.lookAt(q.g.position.x+b.m.position.x+b.v[0],q.g.position.y+b.m.position.y+b.v[1],q.g.position.z+b.m.position.z+b.v[2]);b.m.material.opacity=1-k;}}
  if(typeof ddLookFrame==='function')ddLookFrame(dt,now);
  if(typeof ddCam==='function')ddCam(rdt);   // (ddplay.js: the camera keeps with the squad)
}

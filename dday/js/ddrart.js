"use strict";
/* D-Day, Version 246 (a draft, behind ddReal()): see js/ddreal.js for the kit and tools/real/GUIDE.md for the rules.
   The guns on carriages and the mortar, made to look like the real things (Bryan: "Can you make the vehicles and stationary weapons look
   more real?"). Each is a function of lod (0 the battle's camera, 1 close up) that returns a Group in the kit's frame: +x where it points,
   +y up, +z its right, the origin on the ground at the middle of its axle or base.
   - ddrArtPak40(lod)        the German 7.5 cm PaK 40 anti-tank gun (their 'cannon' on the hilltop)
   - ddrArtM1AT(lod)         the US 57 mm Gun M1 (the player's FIELD GUN in Chapter 2)
   - ddrArtMortar(lod), ddrArtMortarKit(lod)   the 8 cm GrW 34 mortar; an open bomb crate and two bombs to set down beside it
   - ddrArtLeFH18(lod,elev)  the 10.5 cm leFH 18 field howitzer (their 'art')
   - ddrArtFlak38(lod)       the 2 cm Flak 38 (their 'aa')
   - ddrArtCoast(lod)        the 'heavy' gun in its casemate: a coastal gun on a pedestal
   A gun's Group has userData: barrel (a Group holding the tube and breech; slide it back along its own x for recoil, at rest its position is
   0,0,0), elev (the barrel's parent, at the trunnions, turned by the elevation the model was built with: the cradle is part of the fixed
   mesh, so don't turn it afterwards), muzzle [x,y,z] in the Group's frame, len, wid, hgt, S (how much bigger than life).
   Everything inside is written in real decimetres (1 unit = 10 cm) in a frame scaled by S (ddrArtB's push), so the numbers are the real gun's. */
const DDR_ART_S=1.15;       // the guns on carriages
const DDR_ART_SM=1.3;       // the mortar (a thin tube: at 1.15 it reads as a stick beside the men)
const DDRA={gelbL:0xc4ab6e,gelbM:0xa58c52,gelbS:0x7c683c,steelW:0x7e8288,navy:0x6c767b,navyD:0x4b5357,navyL:0x8b9498,odS:0x3a3f26,earth:0x6b5a40,
  woodL:0xa07a48,woodM:0x86602f,bomb:0x4d5338,bombD:0x383d2a,bombR:0x6e2a22,alu:0x9a9c98,seat:0x3a2a1c,hole:0x2a2620,soot:0x6e6040,sootD:0x4c4430};

/* ---------- the paint ----------
   The kit's 'paint' is the wear picture alone; a gun that has stood in the open has more on it: faded and grimy patches, rain streaks down its
   faces, the paint chipped to primer and steel, scratches. One picture, multiplied over the part's colour (so it does dunkelgelb, olive drab
   and navy grey alike). Every 'paint' part of these models is drawn in it (ddrArtB maps the key). */
function ddrArtInit(){
  if(DDR_DEF.ddrArtPaint)return;
  const r=rng(9341),tex=ddrCanvas(512,512,(q,w,h)=>{q.fillStyle='#e9e9e9';q.fillRect(0,0,w,h);
    const wrap=fn=>{for(const ox of[0,-w,w])for(const oy of[0,-h,h]){q.save();q.translate(ox,oy);fn();q.restore();}};
    for(let i=0;i<16000;i++){const v=r()<.5?255:0;q.fillStyle=`rgba(${v},${v},${v},${.02+r()*.04})`;q.fillRect(r()*w,r()*h,1+r()*1.6,1+r()*1.6);}
    for(let i=0;i<60;i++){const x=r()*w,y=r()*h,R=24+r()*76,a=r()*6,dk=r()<.55,al=dk?.12+r()*.15:.1+r()*.13,c=dk?'40,30,14':'255,250,235';
      wrap(()=>{const g=q.createRadialGradient(x,y,1,x,y,R);g.addColorStop(0,`rgba(${c},${al})`);g.addColorStop(1,`rgba(${c},0)`);q.fillStyle=g;q.beginPath();q.ellipse(x,y,R,R*.6,a,0,7);q.fill();});}
    for(let i=0;i<150;i++){const x=r()*w,y=r()*h,l=30+r()*120,dk=r()<.7,al=dk?.1+r()*.11:.08+r()*.09,c=dk?'30,22,10':'255,255,245',ww=1+r()*3;
      wrap(()=>{const g=q.createLinearGradient(0,y,0,y+l);g.addColorStop(0,`rgba(${c},${al})`);g.addColorStop(1,`rgba(${c},0)`);q.fillStyle=g;q.fillRect(x,y,ww,l);});}
    for(let i=0;i<80;i++){const cx=r()*w,cy=r()*h,n=2+r()*11,sp=3+r()*14;for(let j=0;j<n;j++){const x=cx+(r()-.5)*sp*2,y=cy+(r()-.5)*sp,c=r()<.45?'92,44,30':'52,50,48',al=.3+r()*.4,a=.5+r()*1.3,b=.4+r()*.9,t=r()*3;
      wrap(()=>{q.fillStyle=`rgba(${c},${al})`;q.beginPath();q.ellipse(x,y,a,b,t,0,7);q.fill();});}}
    for(let i=0;i<150;i++){const x=r()*w,y=r()*h,a=r()*6,l=8+r()*50,c=r()<.55?'255,255,250':'40,36,30',al=.13+r()*.2,lw=.6+r()*.9;
      wrap(()=>{q.strokeStyle=`rgba(${c},${al})`;q.lineWidth=lw;q.beginPath();q.moveTo(x,y);q.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);q.stroke();});}},true);
  ddrMatDef('ddrArtPaint',{r:1.25,m:.25,e:.55,map:tex,tile:22});
}

/* ---------- the kit's builder with frames ----------
   push(x,y,z,rx,ry,rz,s) / pop(): parts added in between are placed in that frame (nested frames multiply); plate(): a flat plate facing +x
   from its outline; turn(): a turned shape that can be mirrored for the other side. (The kit's builder has no frames: put and tube are
   wrapped here.) */
function ddrArtB(lod){
  ddrArtInit();
  const T=THREE,B=ddrB(lod),put0=B.put,tube0=B.tube,st=[],e=new T.Euler(),q=new T.Quaternion(),v=new T.Vector3(),s3=new T.Vector3();let top=null,sc=1;
  // (the battle's model has no bare steel of its own: its few steel parts go into the paint's mesh, a draw call less)
  const MK=lod?{paint:'ddrArtPaint'}:{paint:'ddrArtPaint',steel:'ddrArtPaint'};
  B.push=(x,y,z,rx,ry,rz,s)=>{const m=new T.Matrix4().compose(new T.Vector3(x||0,y||0,z||0),new T.Quaternion().setFromEuler(new T.Euler(rx||0,ry||0,rz||0)),new T.Vector3(s||1,s||1,s||1));
    if(top)m.premultiply(top);st.push(m);top=m;sc=m.getMaxScaleOnAxis();return B;};
  B.pop=()=>{st.pop();top=st.length?st[st.length-1]:null;sc=top?top.getMaxScaleOnAxis():1;return B;};
  B.put=(mk,g,c,x,y,z,rx,ry,rz,sx,sy,sz,o)=>{mk=MK[mk]||mk;if(!top)return put0(mk,g,c,x,y,z,rx,ry,rz,sx,sy,sz,o);
    const m=new T.Matrix4().compose(v.set(x||0,y||0,z||0),q.setFromEuler(e.set(rx||0,ry||0,rz||0)),s3.set(sx??1,sy??1,sz??1)).premultiply(top);
    return put0(mk,g,c,0,0,0,0,0,0,1,1,1,Object.assign({m},o||{}));};
  B.tube=(mk,c,a,b,ra,rb,n,open)=>{mk=MK[mk]||mk;if(!top)return tube0(mk,c,a,b,ra,rb,n,open);
    const A=v.set(a[0],a[1],a[2]).applyMatrix4(top).toArray(),Z=v.set(b[0],b[1],b[2]).applyMatrix4(top).toArray();return tube0(mk,c,A,Z,ra*sc,(rb==null?ra:rb)*sc,n,open);};
  // where a point of the frame on top is, in the model's frame
  B.at=(x,y,z)=>{v.set(x,y,z);if(top)v.applyMatrix4(top);return[v.x,v.y,v.z];};
  // a flat plate facing +x: its outline [z,y] (z to the right, y up), th thick
  B.plate=(mk,c,pts,th,x,y,z,bev)=>B.ext(mk,c,pts.map(p=>[-p[0],p[1]]),th,x||0,y||0,z||0,0,Math.PI/2,0,bev);
  // a turned shape [[t,r],...] whose outer face looks along s (-1: mirrored along its axis)
  B.turn=(mk,c,prof,x,y,z,ax,n,s)=>B.lathe(mk,c,s<0?prof.map(p=>[-p[0],p[1]]).reverse():prof,x,y,z,ax,n);
  // a flat ring or disc with round holes through it (close up): in the plane across z, th thick, n holes of radius hr at hR from the middle
  B.holed=(mk,c,R,r0,th,nh,hR,hr,x,y,z,n,a0)=>{const s=new T.Shape(),N=n||20;
    for(let i=0;i<N;i++){const a=i/N*Math.PI*2;s[i?'lineTo':'moveTo'](Math.cos(a)*R,Math.sin(a)*R);}s.closePath();
    const hole=(cx,cy,rr,m)=>{const h=new T.Path();for(let i=0;i<m;i++){const a=-i/m*Math.PI*2;h[i?'lineTo':'moveTo'](cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}h.closePath();s.holes.push(h);};
    if(r0>0)hole(0,0,r0,10);for(let i=0;i<nh;i++){const a=(a0||0)+i/nh*Math.PI*2;hole(Math.cos(a)*hR,Math.sin(a)*hR,hr,nh>8?7:9);}
    const g=new T.ExtrudeGeometry(s,{depth:th,bevelEnabled:false,steps:1});g.translate(0,0,-th/2);return B.put(mk,g,c,x,y,z);};
  return B;
}
// the gun put together from its built parts: the fixed mesh, and the barrel in a Group at the trunnions turned by the elevation
function ddrArtGun(M){
  const g=new THREE.Group(),el=new THREE.Group(),bar=ddrPart(M.barrel);g.add(ddrPart(M.base));
  el.position.set(M.tr[0],M.tr[1],M.tr[2]);el.rotation.z=M.elev||0;el.add(bar);g.add(el);
  const U=g.userData;U.barrel=bar;U.elev=el;U.muzzle=M.muzzle.slice();U.len=M.len;U.wid=M.wid;U.hgt=M.hgt;U.S=M.S;U.real=true;return g;
}
// where the muzzle is in the model's frame: the trunnions tr (real dm), the muzzle mx along the bore from them, the elevation, the scale
const ddrArtMuz=(tr,mx,el,S)=>[(tr[0]+Math.cos(el)*mx)*S,(tr[1]+Math.sin(el)*mx)*S,tr[2]*S];

/* ---------- parts the guns share ---------- */
// a German gun's wheel: a pressed steel disc with lightening holes and a solid rubber tyre; the axle along z, s the side its outer face looks
// (o: holes how many, hR where (a share of r), hr how big, tyre how thick the rubber is (a share of r), hub)
function ddrArtWheelG(B,col,r,w,x,y,z,s,o){
  o=o||{};const T=THREE,C=DDRC,L=B.lod,n=B.N(o.n||12,22),ri=r*(1-(o.tyre||.1)),nh=o.holes||6,hR=r*(o.hR||.52),hr=r*(o.hr||.1),hub=r*(o.hub||.2),zf=w*.16,cD=o.colD||C.gelbD;
  B.lathe('matte',C.rubber,[[-w/2,ri],[-w/2,r*.972],[-w*.3,r],[w*.3,r],[w/2,r*.972],[w/2,ri]],x,y,z,'z',n);
  if(!L){   // one turned shape: the rim's lip, the dished disc, the hub; the holes dark discs on its face
    B.turn('paint',col,[[-w*.42,.01],[-w*.42,ri],[w*.46,ri],[w*.46,ri*.9],[zf,ri*.82],[zf,hub*1.5],[w*.5,hub*1.15],[w*.66,hub*.7],[w*.66,.01]],x,y,z,'z',n,s);
    for(let i=0;i<nh;i++){const a=i/nh*Math.PI*2+.3;B.put('matte',new T.CircleGeometry(hr,7),DDRA.hole,x+Math.cos(a)*hR,y+Math.sin(a)*hR,z+s*(zf+.04),0,s<0?Math.PI:0,0);}
  }else{   // close up: the rim, a disc with real holes through it, the hub with its nuts
    B.turn('paint',col,[[-w*.42,ri*.84],[-w*.42,ri],[w*.46,ri],[w*.46,ri*.9],[zf,ri*.82],[-w*.42,ri*.84]],x,y,z,'z',n,s);
    B.holed('paint',col,ri*.86,hub*.9,w*.16,nh,hR,hr,x,y,z+s*(zf-w*.08),n,.3);
    B.turn('paint',cD,[[-w*.5,.01],[-w*.5,hub*1.2],[zf,hub*1.5],[w*.5,hub*1.15],[w*.66,hub*.7],[w*.66,.01]],x,y,z,'z',12,s);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;B.box('steel',C.gunD,r*.05,r*.05,w*.1,x+Math.cos(a)*hub*1.3,y+Math.sin(a)*hub*1.3,z+s*(zf+w*.1),0,0,a);}
  }
  return B;
}
// a hand wheel: the rim, its spokes and the handle. Push its frame first: it lies across z, the handle on the +z side
function ddrArtHandwheel(B,R,col){
  const C=DDRC,c=col||C.gunL,t=R*.11;
  B.torus('steel',c,R,t,0,0,0,0,0,0,0,8,3);
  B.tube('steel',c,[-R,0,0],[R,0,0],t*.8,t*.8,4);if(B.lod)B.tube('steel',c,[0,-R,0],[0,R,0],t*.8,t*.8,4);
  B.cyl('steel',C.gunD,R*.2,R*.5,0,0,-R*.1,'z',5);
  B.cyl('matte',C.bake,t*1.3,R*.55,R*.92,0,R*.3,'z',4);
  return B;
}
// a tubular trail from its hinge a to its end b, the spade at the end (o.eye: the towing eye on this one)
function ddrArtTrailT(B,a,b,ra,rb,col,o){
  o=o||{};const C=DDRC,L=B.lod,cD=o.colD||C.gelbD,yaw=Math.atan2(-(a[2]-b[2]),a[0]-b[0]);
  B.tube('paint',col,a,b,ra,rb,L?10:7);
  B.push(b[0],b[1],b[2],0,yaw,0);   // the spade's frame: x back along the trail toward the gun, y up
  B.plate('paint',cD,[[-2.2,1.2],[2.2,1.2],[2.5,-.6],[1.5,-b[1]-1.2],[-1.5,-b[1]-1.2],[-2.5,-.6]],.26,-.6,0,0);
  B.box('paint',col,3.8,.26,4.4,1.1,-rb-.05,0);
  B.both(s=>B.ext('paint',cD,[[-.5,1.1],[-.5,-rb],[3.4,-rb]],.18,0,0,s*1.5));
  if(o.eye)B.torus('steel',C.gunD,.8,.22,-1.7,.2,0,Math.PI/2,0,0,0,8,3).box('steel',C.gunD,1.0,.44,.56,-.9,.2,0);
  if(L){B.both(s=>B.tube('steel',C.gunL,[4.2,rb,s*1.2],[4.2,rb+1.6,s*1.2],.13,.13,3));B.tube('steel',C.gunL,[4.2,rb+1.6,-1.2],[4.2,rb+1.6,1.2],.13,.13,3);}
  B.pop();return B;
}

/* ---------- the 7.5 cm PaK 40 ----------
   Real: the piece 3.70 m with its double-baffle muzzle brake (L/46), 2.08 m wide over the hubs, 1.25 m to the top of the shield, the bore
   0.93 m up; wheels 0.93 m across with solid rubber tyres; split tubular trails 3.1 m, spread. The tube is drawn a tenth fatter than life. */
function ddrArtPak40(lod){
  lod=lod?1:0;const S=DDR_ART_S;
  const M=ddrModel('artPak40|'+lod,()=>{
    const B=ddrArtB(lod),R=ddrArtB(lod),C=DDRC,A=DDRA,p='paint',st='steel',L=lod,col=C.gelb,cD=C.gelbD,TR=[.3,9.3,0],EL=0,MX=28.6;
    B.push(0,0,0,0,0,0,S);
    // the wheels, the axle and the lower carriage
    B.both(s=>ddrArtWheelG(B,col,4.65,1.7,0,4.65,s*8.6,s,{holes:6}));
    B.cyl(p,cD,.5,15.8,0,4.65,0,'z',8);
    B.rbox(p,cD,5.2,1.6,4.8,.2,-.5,4.9,0);
    B.both(s=>B.box(p,cD,1.8,1.3,1.5,-2.6,4.6,s*2.6));
    // the top carriage: the ring it turns on, the cheeks up to the trunnions
    B.cyl(p,cD,2.1,.6,.2,5.95,0,'y',10);
    B.both(s=>{B.ext(p,col,[[-3.4,6.1],[3.2,6.1],[1.5,10.0],[-.9,10.0]],.3,0,0,s*1.8);B.cyl(p,cD,.6,.5,TR[0],TR[1],s*2.1,'z',8);});
    B.box(p,cD,1.2,2.2,3.4,-2.2,7.2,0);
    // the cradle: the trough the barrel slides in, the recoil cylinder's end, the guard by the breech on the gunner's side
    const tilt=.36;
    B.push(TR[0],TR[1],0,0,0,EL);
    B.rbox(p,col,18.4,2.0,2.3,.25,3.5,-1.9,0);
    B.cyl(p,cD,.95,1.0,13.1,-1.9,0,'x',8).cyl(st,C.gunL,.42,.6,13.8,-1.9,0,'x',6);
    B.both(s=>B.box(p,cD,18.0,.3,.36,3.5,-.82,s*.98));
    B.push(1.9,0,0,0,0,tilt);B.plate(p,cD,[[-1.3,-3.0],[1.3,-3.0],[1.3,1.7],[-1.3,1.7]],.2,0,0,0);B.pop();
    B.tube(p,cD,[-5.7,-1.0,-1.6],[-13.0,-1.0,-2.1],.22,.22,4).tube(p,cD,[-13.0,-1.0,-2.1],[-7.0,-3.4,-1.7],.2,.2,4);
    if(L){B.torus(st,C.gunD,5.2,.22,-.5,-.6,-1.25,0,0,-2.2,1.1,8,3);B.box(p,cD,2.4,1.0,1.6,-3.2,-3.1,0);}
    B.pop();
    // the shield: two thin plates a finger apart, the middle one square to the bore, the wings swept back over the wheels; the flap below
    const H=(12.45-4.9)/Math.cos(tilt),sw=.52,CP=[[-3.3,0],[-1.45,0],[-1.45,6.1],[1.45,6.1],[1.45,0],[3.3,0],[3.3,H],[-3.3,H]],WP=[[0,0],[0,H],[5.6,H],[8.0,H-1.5],[8.0,5.4],[5.5,4.9],[3.6,.9]];
    B.push(4.8,4.9,0,0,0,tilt);
    for(const[dx,c]of[[0,col],[-.62,cD]]){B.plate(p,c,CP,.24,dx,0,0);
      B.both(s=>{B.push(0,0,s*3.3,0,-s*sw,0);B.plate(p,c,WP.map(q=>[s*q[0],q[1]]),.24,dx,0,0);B.pop();});}
    B.box('matte',C.black,.14,.8,1.0,.1,6.9,-2.35);
    if(L){B.box(p,cD,.12,.5,1.3,.16,7.5,-2.35);   // the sight port's flap, the spacers between the plates, the top edges worn to the steel
      for(const z of[-2.9,-1.9,1.9,2.9])for(const y of[.6,3.2,5.6,7.6])B.box(st,C.gunD,.9,.2,.2,-.3,y,z,.8,0,0);
      B.tube(st,A.steelW,[.04,H,-3.3],[.04,H,3.3],.08,.08,3);
      B.both(s=>{B.push(0,0,s*3.3,0,-s*sw,0);for(const[z,y]of[[1,.8],[1,4],[1,7.4],[4,3],[4,7.4],[7,5.9],[7,7.0]])B.box(st,C.gunD,.9,.2,.2,-.3,y,s*z,.8,0,0);
        B.tube(st,A.steelW,[.04,H,0],[.04,H,s*5.6],.08,.08,3).tube(st,A.steelW,[.04,H,s*5.6],[.04,H-1.5,s*8.0],.08,.08,3);B.pop();});}
    B.pop();
    B.push(4.7,4.9,0,0,0,-.1);B.plate(p,cD,[[-5.7,0],[5.7,0],[5.7,-2.3],[4.7,-3.3],[-4.7,-3.3],[-5.7,-2.3]],.3,0,0,0);B.pop();
    B.both(s=>B.tube(p,cD,[-1.0,10.0,s*2.0],[.6,10.9,s*7.0],.16,.16,4));
    // what aims it, on the left: the sight on its bracket, the elevating wheel, the traversing wheel
    B.box(p,cD,.6,2.0,.6,.8,10.4,-2.7).cyl(st,C.gunD,.26,1.9,1.5,11.5,-2.7,'x',6);
    B.box(p,cD,1.5,1.5,1.0,-2.0,8.3,-2.4);
    B.push(-2.0,8.3,-3.1,0,Math.PI,0);ddrArtHandwheel(B,1.2);B.pop();
    B.push(-3.4,6.9,-2.4,0,-Math.PI/2,0);ddrArtHandwheel(B,1.0);B.pop();
    // the trails
    const sp=.5,LT=31,ta=s=>[-2.6,4.6,s*2.6],tb=s=>[-2.6-LT*Math.cos(sp),1.3,s*(2.6+LT*Math.sin(sp))];
    B.both(s=>ddrArtTrailT(B,ta(s),tb(s),.86,.64,col,{eye:s>0}));
    if(L){const a=ta(-1),b=tb(-1),f=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+.95,a[2]+(b[2]-a[2])*t];B.tube(st,C.gunD,f(.2),f(.8),.14,.14,3);   // the cleaning rod on the left trail
      B.both(s=>{const a=ta(s),b=tb(s),g=(t,dy)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+dy,a[2]+(b[2]-a[2])*t+s*.5];B.tube(st,C.gunL,g(.62,.5),g(.64,1.5),.11,.11,3).tube(st,C.gunL,g(.64,1.5),g(.72,1.5),.11,.11,3).tube(st,C.gunL,g(.72,1.5),g(.74,.5),.11,.11,3);});}
    B.pop();
    // the barrel (its own frame: the bore along x from the trunnions): the tube, the muzzle brake, the breech ring and its block
    R.push(0,0,0,0,0,0,S);
    R.lathe(p,col,[[-5.6,1.0],[4.2,.98],[4.5,.86],[14,.74],[24.3,.62]],0,0,0,'x',L?16:8);
    R.lathe(p,A.soot,[[24.2,.62],[24.4,.8],[24.8,.8],[24.9,1.18],[26.5,1.24],[26.6,.86],[27.1,.86],[27.2,1.16],[28.5,1.12],[MX,.72],[MX,.46]],0,0,0,'x',L?16:8);
    R.cyl(st,C.black,.46,.1,MX-.06,0,0,'x',8);
    R.box(st,C.black,1.1,.72,2.52,25.7,0,0).box(st,C.black,.9,.68,2.36,27.85,0,0);
    R.rbox(p,cD,3.0,3.0,2.8,.2,-7.1,0,0);
    R.box(st,C.gun,1.3,1.5,.7,-7.2,0,1.6).box(st,C.black,.16,1.3,1.2,-8.56,.1,0);   // the block's end out of the ring's right side, the loading opening
    R.tube(st,A.steelW,[-7.0,1.55,1.0],[-5.4,2.0,1.9],.14,.14,4).box(p,cD,1.2,1.1,1.0,-6.6,-1.9,0);
    if(L){R.ball(st,A.steelW,.26,-5.4,2.0,1.9);R.box(p,col,3.04,.3,2.84,-7.1,.9,0).box(st,C.gunD,.5,.5,.3,-7.9,-.6,1.45);}
    R.pop();
    const mz=ddrArtMuz(TR,MX,EL,S);
    return{base:B.geos(),barrel:R.geos({lo:.93}),tr:[TR[0]*S,TR[1]*S,0],elev:EL,muzzle:mz,S,len:(MX+TR[0]+2.6+LT*Math.cos(sp)+2)*S,wid:2*(2.6+LT*Math.sin(sp)+2.5)*S,hgt:12.45*S};});
  return ddrArtGun(M);
}

/* ---------- the US 57 mm Gun M1 ----------
   Real (the British 6-pounder built in America): the piece 2.82 m (L/50), no muzzle brake; 1.8 m wide, 1.28 m to the shield's straight top,
   the bore 0.8 m up; combat tyres 0.86 m across; split tubular trails 2.3 m, spread wide (its man stands between them, 12 units behind the
   origin). Olive drab. */
function ddrArtM1AT(lod){
  lod=lod?1:0;const S=DDR_ART_S;
  const M=ddrModel('artM1AT|'+lod,()=>{
    const B=ddrArtB(lod),R=ddrArtB(lod),C=DDRC,A=DDRA,p='paint',st='steel',L=lod,col=C.od,cD=C.odD,cL=C.odL,TR=[.6,8.0,0],EL=0,MX=24.2;
    B.push(0,0,0,0,0,0,S);
    // the wheels, the axle and the lower carriage
    B.wheel(col,4.3,1.9,0,4.3,-7.6,{rim:.58}).wheel(col,4.3,1.9,0,4.3,7.6,{rim:.58});
    B.cyl(p,cD,.55,13.4,0,4.3,0,'z',8);
    B.rbox(p,cD,4.4,1.7,4.2,.2,-.3,4.5,0);
    B.both(s=>B.box(p,cD,1.7,1.3,1.4,-2.0,4.3,s*2.3));
    // the top carriage
    B.cyl(p,cD,1.8,.5,.3,5.6,0,'y',10);
    B.both(s=>{B.ext(p,col,[[-2.6,5.8],[3.0,5.8],[1.8,8.7],[-.6,8.7]],.3,0,0,s*1.6);B.cyl(p,cD,.55,.5,TR[0],TR[1],s*1.9,'z',8);});
    // the cradle under the barrel, its recoil cylinder's end, the guard plate by the breech
    const tilt=.17;
    B.push(TR[0],TR[1],0,0,0,EL);
    B.rbox(p,col,11.0,1.7,2.0,.2,3.9,-1.75,0);
    B.cyl(p,cD,.8,.9,9.8,-1.75,0,'x',8).cyl(st,C.gunL,.36,.5,10.4,-1.75,0,'x',6);
    B.both(s=>B.box(p,cD,15.0,.26,.3,2.0,-.98,s*.86));
    B.box(p,cD,5.0,2.2,.16,-3.6,-.3,-1.9);
    if(L){B.torus(st,C.gunD,4.4,.2,-.4,-.8,-1.1,0,0,-2.1,1.0,8,3);B.box(p,cD,2.0,.9,1.4,-2.6,-2.8,0);}
    B.pop();
    // the shield: one flat plate with a straight top, the side flaps swung back over the wheels, the flap below
    const H=(12.8-4.6)/Math.cos(tilt),sw=.78,MP=[[-5.6,0],[-1.4,0],[-1.4,5.0],[1.4,5.0],[1.4,0],[5.6,0],[5.6,H],[-5.6,H]],FP=[[0,0],[1.0,0],[1.7,3.8],[4.5,4.7],[4.5,H],[0,H]];
    B.push(3.4,4.6,0,0,0,tilt);
    B.plate(p,col,MP,.26,0,0,0);
    B.both(s=>{B.push(0,0,s*5.6,0,-s*sw,0);B.plate(p,col,FP.map(q=>[s*q[0],q[1]]),.26,0,0,0);
      if(L){for(const y of[1.2,4.4,7.4])B.box(st,C.gunD,.5,.9,.34,-.02,y,0);B.tube(st,A.steelW,[.05,H,0],[.05,H,s*4.5],.08,.08,3);}B.pop();});
    B.box('matte',C.black,.14,.8,1.2,.14,6.4,-3.3);
    B.both(s=>B.box(p,cD,.3,H-.6,.5,-.3,H/2,s*4.6));
    if(L){B.box(p,cD,.12,.5,1.5,.2,7.0,-3.3).box('matte',C.black,.14,.5,.6,.14,6.5,-1.9);B.tube(st,A.steelW,[.05,H,-5.6],[.05,H,5.6],.08,.08,3);
      for(const z of[-5,-2.2,2.2,5])for(const y of[.5,H-.5])B.box(st,C.gunD,.12,.22,.22,.16,y,z);}
    B.pop();
    B.push(3.3,4.6,0,0,0,-.08);B.plate(p,cD,[[-5.3,0],[5.3,0],[5.3,-2.9],[-5.3,-2.9]],.26,0,0,0);B.pop();
    B.both(s=>B.tube(p,cD,[-.6,8.6,s*1.7],[1.7,11.2,s*4.6],.16,.16,4));
    // what aims it, on the left: the telescope on its bracket, the elevating wheel, the shoulder piece he swings it round with
    B.box(p,cD,.6,1.8,.6,1.0,9.6,-2.6).cyl(st,C.gunD,.26,2.2,1.6,10.6,-2.6,'x',6);
    B.box(p,cD,1.3,1.3,.9,-1.2,7.0,-2.2);
    B.push(-1.2,7.0,-2.8,0,Math.PI,0);ddrArtHandwheel(B,1.05);B.pop();
    B.tube(p,cD,[-1.6,8.4,-2.3],[-5.4,8.6,-3.0],.18,.18,4).box('matte',C.leather,.6,1.7,1.1,-5.6,8.6,-3.1,0,.25,0);
    // the trails
    const sp=.61,LT=23,ta=s=>[-2.0,4.3,s*2.3],tb=s=>[-2.0-LT*Math.cos(sp),1.2,s*(2.3+LT*Math.sin(sp))];
    B.both(s=>ddrArtTrailT(B,ta(s),tb(s),.74,.58,col,{eye:s<0,colD:cD}));
    if(L)B.both(s=>{const a=ta(s),b=tb(s),g=(t,dy)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+dy,a[2]+(b[2]-a[2])*t+s*.45];B.tube(st,C.gunL,g(.56,.45),g(.58,1.4),.11,.11,3).tube(st,C.gunL,g(.58,1.4),g(.68,1.4),.11,.11,3).tube(st,C.gunL,g(.68,1.4),g(.7,.45),.11,.11,3);});
    B.pop();
    // the barrel: a long slim tube with a collar at the muzzle, the breech ring, its block and lever
    R.push(0,0,0,0,0,0,S);
    R.lathe(p,col,[[-1.6,.9],[5.2,.88],[5.6,.78],[13,.68],[23.1,.57],[23.2,.66],[24.1,.66],[MX,.58],[MX,.38]],0,0,0,'x',L?16:8);
    R.cyl(st,C.black,.38,.1,MX-.06,0,0,'x',8);
    R.rbox(p,cD,2.7,2.6,2.5,.2,-2.9,0,0);
    R.box(st,C.gun,1.2,.3,1.4,-3.0,1.4,0).box(st,C.black,.16,1.1,1.0,-4.2,.1,0);
    R.tube(st,A.steelW,[-2.8,-.9,1.3],[-1.5,.5,1.7],.13,.13,4).box(p,cD,1.1,1.0,.9,-2.5,-1.6,0);
    if(L)R.ball(st,A.steelW,.24,-1.5,.5,1.7);
    R.pop();
    const mz=ddrArtMuz(TR,MX,EL,S);
    return{base:B.geos(),barrel:R.geos({lo:.93}),tr:[TR[0]*S,TR[1]*S,0],elev:EL,muzzle:mz,S,len:(MX+TR[0]+2.0+LT*Math.cos(sp)+2)*S,wid:2*(2.3+LT*Math.sin(sp)+2.5)*S,hgt:12.8*S};});
  return ddrArtGun(M);
}

/* ---------- the 8 cm Granatwerfer 34 ----------
   Real: the tube 1.14 m, 8.14 cm bore; a rectangular ribbed baseplate; a bipod of two tubular legs under an elevating column, the traversing
   screw across its top with the hand wheel at one end and the sight at the other, the tube held in a collar on two buffer cylinders; the
   left leg's sliding collar and link level it. Drawn 1.3 times life (a thin tube). The tube stands at 1.05 rad from the ground.
   userData: muzzle [x,y,z], dir (the bore's direction), len, wid, hgt, S. */
function ddrArtMortar(lod){
  lod=lod?1:0;const S=DDR_ART_SM;
  const M=ddrModel('artMortar|'+lod,()=>{
    const B=ddrArtB(lod),C=DDRC,A=DDRA,p='paint',st='steel',L=lod,col=C.gelb,cD=C.gelbD,TH=1.05,LB=11.43,FY=1.05,ct=Math.cos(TH),sn=Math.sin(TH);
    B.push(0,0,0,0,0,0,S);
    // the baseplate: tilted to take the kick, its ribs and raised edge, the socket, the spades under it, the handle at its back edge
    B.push(-.4,.55,0,0,0,-.22);
    B.rbox(p,cD,5.8,.26,4.6,.1,0,0,0);
    for(const z of[-1.9,-1.15,1.15,1.9])B.box(p,cD,5.4,.2,.2,0,.22,z);
    B.box(p,cD,.24,.22,4.5,-2.75,.22,0).box(p,cD,.24,.22,4.5,2.75,.22,0);
    B.box(p,col,1.5,.42,1.5,.3,.3,0).cyl(st,C.gunD,.5,.3,.3,.62,0,'y',8);
    B.both(s=>B.box(p,cD,.2,1.3,4.2,s*1.7,-.7,0));
    if(L){B.torus(st,C.gunL,.6,.09,-2.9,.2,0,0,Math.PI/2,0,Math.PI,4,2);for(const z of[-1.5,1.5])B.box(st,C.gunD,.24,.14,.24,-2.2,.2,z).box(st,C.gunD,.24,.14,.24,2.2,.2,z);}
    B.pop();
    // the tube: the ball in the socket, the breech cap, the muzzle's ring; its collar and the two buffers down to the yoke
    B.push(0,FY,0,0,0,TH);
    B.ball(st,C.gunD,.36,.12,0,0,1,1,1,5);
    B.lathe(p,col,[[.3,.25],[.48,.57],[1.5,.57],[1.6,.49],[LB-.6,.49],[LB-.55,.58],[LB,.58],[LB,.42]],0,0,0,'x',L?12:8);
    B.cyl(st,C.black,.42,.08,LB-.05,0,0,'x',L?7:8);
    B.lathe(p,cD,[[7.1,.5],[7.16,.68],[7.9,.68],[7.96,.5]],0,0,0,'x',L?12:8);
    B.both(s=>{B.cyl(p,col,.23,2.5,6.3,-.3,s*.98,'x',L?4:6).cyl(st,A.steelW,.1,1.4,4.6,-.3,s*.98,'x',L?3:4);B.box(p,cD,.6,.5,.5,7.5,-.2,s*.8);});
    B.box(p,cD,1.0,.8,2.7,4.5,-.5,0);
    if(L)B.box(p,cD,.5,.3,.3,10.2,.62,0);   // (the sighting line's white stripe sits on a small boss near the muzzle)
    B.pop();
    // the bipod: the traversing screw across under the yoke, the elevating column down to where the legs meet, the legs and their feet
    const Tx=4.5*ct+.95*sn,Ty=FY+4.5*sn-.95*ct,F=[6.9,.06,3.5],Hx=Tx+.26*(F[0]-Tx),Hy=Ty+.26*(F[1]-Ty);
    B.cyl(p,col,.22,3.9,Tx,Ty,0,'z',6);
    B.box(p,cD,.8,.7,1.0,Tx,Ty,0);
    if(L){B.push(Tx,Ty,2.05,0,0,0);ddrArtHandwheel(B,.52);B.pop();}else B.cyl(st,C.gunL,.5,.12,Tx,Ty,2.05,'z',8);
    B.box(st,C.black,.5,.9,.5,Tx,Ty+.55,-2.2);
    if(L){B.cyl(st,C.gunD,.16,.7,Tx+.1,Ty+1.1,-2.2,'x',5);B.box(st,C.gunD,.3,.3,.5,Tx,Ty+.05,-2.2);}
    B.tube(p,col,[Tx,Ty,0],[Hx,Hy,0],.27,.27,6).cyl(p,cD,.36,.5,Hx,Hy,0,'z',6);
    B.tube(st,C.gunL,[Hx,Hy,.2],[Hx,Hy,1.1],.08,.08,4).tube(st,C.gunL,[Hx,Hy,1.1],[Hx+.3,Hy-.5,1.1],.08,.08,4);
    B.both(s=>{B.tube(p,col,[Hx,Hy,s*.2],[F[0],F[1]+.1,s*F[2]],.2,.15,6);B.cyl(p,cD,.44,.14,F[0],F[1],s*F[2],'y',6);});
    {const t=.5,lx=Hx+(F[0]-Hx)*t,ly=Hy+(F[1]-Hy)*t,lz=-(.2+(F[2]-.2)*t),cx=Tx+.55*(Hx-Tx),cy=Ty+.55*(Hy-Ty);   // the levelling link: a collar on the left leg, a screw across to the column
      B.cyl(p,cD,.3,.5,lx,ly,lz,'y',5).tube(st,A.steelW,[lx,ly,lz],[cx,cy,0],.08,.08,4);}
    if(L){const t=.72,cx=Hx+(F[0]-Hx)*t,cy=Hy+(F[1]-Hy)*t,cz=.2+(F[2]-.2)*t;B.both(s=>B.tube(st,C.gunD,[cx,cy,s*cz],[cx-.1,cy-.5,0],.05,.05,3));}   // the chain between the legs
    B.pop();
    return{base:B.geos({tile:lod?9:13}),muzzle:[LB*ct*S,(FY+LB*sn)*S,0],dir:[ct,sn,0],len:(F[0]+.5+3.4)*S,wid:(2*F[2]+1)*S,hgt:(FY+LB*sn+.3)*S,S};});
  const g=ddrPart(M.base),U=g.userData;U.muzzle=M.muzzle.slice();U.dir=M.dir.slice();U.len=M.len;U.wid=M.wid;U.hgt=M.hgt;U.S=M.S;U.real=true;return g;
}
// a mortar bomb (the 8 cm Wurfgranate 34: 33 cm long, a teardrop on a finned tail), along x from its tail at the frame's origin to its nose
function ddrArtBomb(B,body){
  const C=DDRC,A=DDRA,L=B.lod;
  if(L){B.lathe('paint',body,[[.5,.16],[1.1,.16],[1.35,.3],[1.9,.405],[2.5,.39],[2.95,.2]],0,0,0,'x',8);
    B.lathe('steel',A.alu,[[2.95,.19],[3.05,.17],[3.3,.07]],0,0,0,'x',8);
    B.cyl('steel',C.gunD,.15,.6,.3,0,0,'x',3);for(let i=0;i<6;i++)B.box('steel',C.gunD,.66,.25,.03,.33,.27,0,i*Math.PI/3,0,0);}
  else{B.lathe('paint',body,[[.6,.16],[1.15,.17],[1.8,.405],[2.5,.39],[2.95,.2]],0,0,0,'x',5);
    B.lathe('steel',A.alu,[[2.95,.19],[3.3,.07]],0,0,0,'x',5);B.cyl('steel',C.gunD,.38,.68,.34,0,0,'x',5);}
  return B;
}
/* what goes beside the mortar: an open wooden crate with three bombs in it, its lid swung back, and two bombs stood on the ground.
   The origin on the ground under the crate's middle, the crate's length along x; the standing bombs to its right (+z). */
function ddrArtMortarKit(lod){
  lod=lod?1:0;const S=DDR_ART_SM;
  const M=ddrModel('artMortarKit|'+lod,()=>{
    const B=ddrArtB(lod),C=DDRC,A=DDRA,w='wood',L=lod,wc=A.woodL,wd=A.woodM,red=A.bombR;
    B.push(0,0,0,0,0,0,S);
    // the crate: a floor, four sides, the battens round it, the lid swung back on its hinges, the cradles the bombs lie in
    B.box(w,wd,5.6,.18,3.2,0,.09,0);
    B.both(s=>{B.box(w,wc,5.6,2.0,.18,0,1.0,s*1.51);B.box(w,wc,.18,2.0,2.84,s*2.71,1.0,0);if(L)B.box(w,wd,.24,2.04,3.26,s*1.9,1.0,0);});
    B.both(s=>B.box(w,wd,.26,.72,2.8,s*1.3,.54,0));
    B.push(0,2.0,-1.6,-2.3,0,0);B.box(w,wc,5.6,.18,3.2,0,.09,1.6);if(L)B.both(s=>B.box(w,wd,.45,.1,3.1,s*1.9,.23,1.6));B.pop();
    if(L){B.both(s=>B.torus(w,C.canvas,.5,.08,s*2.82,1.3,0,0,Math.PI/2,0,Math.PI,4,2));B.both(s=>B.box('steel',C.gunD,.45,.1,.26,s*1.9,2.0,-1.62));}
    // the bombs: three in the crate, two stood on their fins beside it
    for(const z of[-.95,0,.95]){B.push(-1.7,1.3,z,0,0,0);ddrArtBomb(B,red);B.pop();}
    for(const[x,z,a]of[[-.5,2.9,0],[.8,3.4,.6]]){B.push(x,0,z,0,a,Math.PI/2);ddrArtBomb(B,red);B.pop();}
    B.pop();
    return{base:B.geos({tile:lod?9:13}),len:5.8*S,wid:7.2*S,hgt:4.5*S,S};});
  const g=ddrPart(M.base),U=g.userData;U.len=M.len;U.wid=M.wid;U.hgt=M.hgt;U.S=M.S;U.real=true;return g;
}

/* ---------- the 10.5 cm leichte Feldhaubitze 18 ----------
   Real: the piece 2.94 m (L/28), no muzzle brake; the recuperator's cylinder over the barrel and the recoil brake in the cradle under it; 1.98 m
   wide over the hubs, 1.88 m to the top of the shield, the trunnions 1.18 m up and well back; pressed steel wheels 1.30 m across on solid rubber;
   long riveted box trails with big spades. elev: how far the barrel is raised (rad; the default 0.5, firing over the hill). */
// a riveted box trail from its hinge h out and down to the ground, spread sp to side s, LT long, the big spade at its end
function ddrArtTrailBox(B,h,sp,s,LT,col,o){
  o=o||{};const C=DDRC,L=B.lod,cD=o.colD||C.gelbD,w=o.w||1.5,h0=o.h0||1.15,h1=o.h1||.7,dy=(o.endY||1.5)-h[1];
  B.push(h[0],h[1],h[2],0,Math.PI+s*sp,0);   // x out along the trail, y up
  B.ext('paint',col,[[0,h0],[LT,dy+h1],[LT,dy-h1],[0,-h0]],w,0,0,0);
  B.ext('paint',cD,[[0,h0],[LT,dy+h1],[LT,dy+h1+.2],[0,h0+.2]],w+.36,0,0,0).ext('paint',cD,[[0,-h0],[LT,dy-h1],[LT,dy-h1-.2],[0,-h0-.2]],w+.36,0,0,0);   // (the flanges the sides are riveted to)
  B.plate('paint',cD,[[-2.7,dy+1.7],[2.7,dy+1.7],[2.7,dy-1.0],[1.6,-h[1]-1.4],[-1.6,-h[1]-1.4],[-2.7,dy-1.0]],.3,LT+.1,0,0);
  B.box('paint',cD,3.0,.3,4.6,LT-1.3,dy-h1-.1,0);
  if(o.eye)B.torus('steel',C.gunD,.85,.24,LT+1.6,dy+.4,0,Math.PI/2,0,0,0,8,3).box('steel',C.gunD,1.2,.5,.6,LT+.7,dy+.4,0);
  if(L){const f=t=>dy*t/LT;   // the flanges along its edges, the rivets, the handle
    for(let i=1;i<7;i++){const x=LT*i/7;for(const e of[-1,1])B.box('steel',cD,.2,.2,.14,x,f(x)+e*(h0+(h1-h0)*i/7-.3),-s*(w/2+.04));}   // (its outer side)
    B.both(q=>B.tube('steel',C.gunL,[LT-6,f(LT-6)+h1+.1,q*.5],[LT-5.6,f(LT-5.6)+h1+1.5,q*.5],.12,.12,3));B.tube('steel',C.gunL,[LT-5.6,f(LT-5.6)+h1+1.5,-.5],[LT-5.6,f(LT-5.6)+h1+1.5,.5],.12,.12,3);}
  B.pop();return B;
}
function ddrArtLeFH18(lod,elev){
  lod=lod?1:0;const S=DDR_ART_S,EL=Math.round((elev==null?.5:elev)*100)/100;
  const M=ddrModel('artLeFH18|'+lod+'|'+EL,()=>{
    const B=ddrArtB(lod),R=ddrArtB(lod),C=DDRC,A=DDRA,p='paint',st='steel',L=lod,col=C.gelb,cD=C.gelbD,TR=[-.5,11.8,0],MX=24.4,ce=Math.cos(EL),se=Math.sin(EL);
    const E=(x,y,z)=>[TR[0]+x*ce-y*se,TR[1]+x*se+y*ce,z||0];   // a point of the cradle's frame, in the gun's
    B.push(0,0,0,0,0,0,S);
    // the wheels, the axle and the lower carriage
    B.both(s=>ddrArtWheelG(B,col,6.5,1.15,0,6.5,s*7.9,s,{holes:12,hR:.67,hr:.075,tyre:.07,hub:.17,n:16}));
    B.cyl(p,cD,.6,14.6,0,6.5,0,'z',8);
    B.rbox(p,cD,6.0,2.0,5.2,.25,-.6,7.0,0);
    B.both(s=>B.box(p,cD,2.0,1.7,1.7,-2.9,6.4,s*2.7));
    // the top carriage: the ring it turns on, the cheeks up to the trunnions
    B.cyl(p,cD,2.4,.6,-.4,8.3,0,'y',10);
    B.both(s=>{B.ext(p,col,[[-4.2,8.5],[2.8,8.5],[.7,12.7],[-1.8,12.7]],.34,0,0,s*2.2);B.cyl(p,cD,.7,.5,TR[0],TR[1],s*2.55,'z',8);});
    B.box(p,cD,1.4,2.6,4.1,-3.3,9.6,0);
    // what's raised with the barrel: the cradle's trough under it (the recoil brake), the recuperator's cylinder over it, the yokes that hold
    // the two together round the barrel, the small shield that closes the slot
    B.push(TR[0],TR[1],0,0,0,EL);
    B.rbox(p,col,19.0,2.4,2.6,.3,5.0,-2.95,0);
    B.cyl(p,cD,1.0,.9,14.9,-2.95,0,'x',8).cyl(st,C.gunL,.45,.6,15.5,-2.95,0,'x',6);
    B.lathe(p,col,[[-1.0,.01],[-1.0,.78],[-.7,.88],[10.6,.88],[11.2,.7],[11.4,.36],[11.4,.01]],0,2.2,0,'x',L?14:8);
    for(const x of[-.4,8.6])B.both(s=>B.box(p,cD,.4,3.7,.24,x,.3,s*1.27));
    B.both(s=>B.box(p,cD,18.6,.5,.4,5.0,-1.55,s*1.12));
    B.plate(p,cD,[[-1.6,-4.3],[1.6,-4.3],[1.6,3.3],[-1.6,3.3]],.2,1.4,0,0);
    if(L){B.torus(st,C.gunD,6.4,.26,-.4,-1.0,-1.45,0,0,-2.3,1.2,8,3);B.cyl(st,C.gunL,.3,1.2,-1.6,2.2,0,'x',5);}
    B.pop();
    // the spring that balances the barrel's weight, from the carriage's front up to the cradle
    {const a=[2.2,8.5,0],b=E(8.0,-4.1,0),m=[a[0]+(b[0]-a[0])*.6,a[1]+(b[1]-a[1])*.6,0];B.tube(p,cD,a,m,.6,.6,6).tube(st,C.gunL,m,b,.3,.3,5);}
    // the shield: two tall plates either side of the slot, bent back above, the top cut down on the left for the sight; the flap below
    const tilt=.6,HU=(18.8-14.2)/Math.cos(tilt),sl=(16.9-14.2)/Math.cos(tilt);
    B.both(s=>B.plate(p,col,[[s*1.75,5.2],[s*6.7,5.2],[s*6.7,14.2],[s*1.75,14.2]],.26,1.6,0,0));
    B.push(1.6,14.2,0,0,0,tilt);
    B.plate(p,col,[[-6.7,0],[-1.75,0],[-1.75,sl],[1.75,sl],[1.75,0],[6.7,0],[6.7,HU-1.0],[5.7,HU],[-4.3,HU],[-4.3,HU-1.7],[-6.7,HU-1.7]],.26,0,0,0);
    if(L){B.tube(st,A.steelW,[.05,HU,-4.3],[.05,HU,5.7],.08,.08,3);for(const z of[-6.2,-2.3,2.3,6.2])B.box(st,cD,.14,.22,.22,.18,.5,z);}
    B.pop();
    B.push(1.6,5.2,0,0,0,-.12);B.plate(p,cD,[[-6.6,0],[6.6,0],[6.6,-2.6],[5.6,-3.5],[-5.6,-3.5],[-6.6,-2.6]],.26,0,0,0);B.pop();
    B.both(s=>B.tube(p,cD,[-1.2,12.4,s*2.4],[1.4,15.0,s*5.2],.18,.18,4));
    if(L){B.both(s=>{for(const y of[6.2,10,13.6])B.box(st,cD,.14,.24,.24,1.78,y,s*6.3).box(st,cD,.14,.24,.24,1.78,y,s*2.2);});B.box(p,cD,.5,3.2,1.6,1.25,9.2,4.4);}
    // what aims it, on the left: the panoramic sight on its post above the shield's cut, the elevating and traversing wheels
    B.tube(p,cD,[-.3,12.6,-2.9],[-.1,18.0,-5.3],.22,.22,5).box(st,C.gunD,.7,.9,.7,-.1,18.4,-5.3).cyl(st,C.gunD,.3,.8,.3,19.0,-5.3,'x',6);
    B.box(p,cD,1.6,1.6,1.1,-2.8,10.4,-2.9);
    B.push(-2.8,10.4,-3.7,0,Math.PI,0);ddrArtHandwheel(B,1.35);B.pop();
    B.push(-4.4,8.9,-2.9,0,-Math.PI/2,0);ddrArtHandwheel(B,1.15);B.pop();
    // the trails
    const sp=.49,LT=31,th=s=>[-2.9,6.4,s*2.7];
    B.both(s=>ddrArtTrailBox(B,th(s),sp,s,LT,col,{eye:s>0}));
    B.pop();
    // the barrel: a short fat tube with a ring at the muzzle, the big breech ring, its block out to the right, the lugs the recoil rods hold
    R.push(0,0,0,0,0,0,S);
    R.lathe(p,col,[[-1.6,1.3],[5.5,1.28],[6.0,1.13],[12,1.02],[22.6,.9],[22.8,1.1],[MX,1.1],[MX,.6]],0,0,0,'x',L?16:8);
    R.cyl(st,C.black,.6,.1,MX-.06,0,0,'x',8);
    R.rbox(p,cD,3.6,3.5,3.4,.25,-3.2,0,0);
    R.box(st,C.gun,1.5,1.8,.8,-3.3,0,1.95).box(st,C.black,.16,1.6,1.5,-4.96,.1,0);
    R.tube(st,A.steelW,[-3.0,1.8,1.2],[-1.3,2.4,2.3],.16,.16,4);
    R.box(p,cD,1.1,1.3,1.2,-2.2,2.2,0).box(p,cD,1.1,1.3,1.2,-2.2,-2.3,0);
    if(L)R.ball(st,A.steelW,.3,-1.3,2.4,2.3);
    R.pop();
    const mz=ddrArtMuz(TR,MX,EL,S);
    return{base:B.geos(),barrel:R.geos({lo:.93}),tr:[TR[0]*S,TR[1]*S,0],elev:EL,muzzle:mz,S,len:(Math.max(MX*ce+TR[0],2)+2.9+LT*Math.cos(sp)+2)*S,wid:2*(2.7+LT*Math.sin(sp)+2.8)*S,hgt:Math.max(18.8,TR[1]+MX*se+1)*S};});
  return ddrArtGun(M);
}

/* ---------- the 2 cm Flak 38 ----------
   Real: the gun 2.25 m with its 1.30 m barrel (L/65) and conical flash hider, the 20-round box magazine in from the left; a triangular base
   on three levelling pads, the mount turning on it with the gunner's seat behind and a hand wheel either side of him, a small two-piece
   shield, the ring sight over the gun. About 1.6 m across its base. Drawn 1.25 times life (a slim gun); the barrel raised 0.7 rad.
   userData.barrel is the whole gun (receiver, barrel, magazine): it slides back in its cradle. */
const DDR_ART_SF=1.25;
function ddrArtFlak38(lod){
  lod=lod?1:0;const S=DDR_ART_SF;
  const M=ddrModel('artFlak38|'+lod,()=>{
    const B=ddrArtB(lod),R=ddrArtB(lod),C=DDRC,A=DDRA,p='paint',st='steel',L=lod,col=C.gelb,cD=C.gelbD,TR=[.4,7.6,0],EL=.7,MX=15.2,se=Math.sin(EL);
    B.push(0,0,0,0,0,0,S);
    // the triangular base: a plate with its corners cut, a beam out to each corner, a levelling screw on a round pad at each, the ring the mount turns on
    const V=[[8.2,0],[-4.4,7.1],[-4.4,-7.1]];
    B.ext(p,cD,[[8.6,-1.0],[8.6,1.0],[-3.4,7.9],[-5.2,6.8],[-5.2,-6.8],[-3.4,-7.9]],.5,0,1.5,0,Math.PI/2,0,0);
    for(const v of V){const l=Math.hypot(v[0],v[1]),a=Math.atan2(-v[1],v[0]);B.push(0,2.0,0,0,a,0);B.box(p,col,l-.6,.6,1.1,(l-.6)/2,0,0);B.pop();
      B.cyl(st,C.gunD,1.3,.3,v[0],.15,v[1],'y',8).cyl(st,C.gunL,.3,2.6,v[0],1.5,v[1],'y',5).cyl(p,col,.6,.7,v[0],2.1,v[1],'y',6);
      if(L)B.tube(st,C.gunL,[v[0]-.7,2.9,v[1]],[v[0]+.7,2.9,v[1]],.1,.1,3);}
    B.cyl(p,cD,3.3,.9,0,2.2,0,'y',12);
    // the mount that turns: its floor, the two cheeks up to the trunnions
    B.cyl(p,col,3.0,.5,0,2.9,0,'y',12).box(p,col,6.8,.3,4.2,-.5,3.25,0);
    B.both(s=>{B.ext(p,col,[[-3.7,3.3],[3.2,3.3],[1.9,8.5],[-.8,8.5],[-3.7,5.5]],.26,0,0,s*1.6);B.cyl(p,cD,.6,.4,TR[0],TR[1],s*1.85,'z',8);});
    // the cradle the gun slides in, raised with it, and the ring sight on its arm
    B.push(TR[0],TR[1],0,0,0,EL);
    B.box(p,cD,8.2,.4,2.5,-2.0,-1.1,0);
    B.both(s=>B.box(p,cD,8.2,1.1,.2,-2.0,-.6,s*1.2));
    B.box(p,cD,.5,1.3,2.5,2.0,-.7,0);
    B.tube(p,cD,[-3.0,-.4,-1.5],[-3.0,3.2,-1.5],.16,.16,4).tube(p,cD,[-4.8,3.2,-1.5],[.8,3.2,-1.5],.13,.13,4);
    B.torus(st,C.gunD,.62,.08,.8,4.0,-1.5,0,Math.PI/2,0,0,8,3).tube(st,C.gunD,[.8,3.2,-1.5],[.8,3.4,-1.5],.08,.08,3).box(st,C.gunD,.2,.6,.5,-4.8,3.6,-1.5);
    if(L){B.tube(st,C.gunD,[.8,3.4,-1.5],[.8,4.6,-1.5],.04,.04,3).tube(st,C.gunD,[.8,4.0,-2.1],[.8,4.0,-.9],.04,.04,3);B.box(p,cD,1.2,.9,.5,-1.2,-.5,1.5);}
    B.pop();
    // the gunner's place: the seat on its arms behind the gun, its back, his foot rests, a hand wheel on a post either side
    B.both(s=>B.tube(p,cD,[-3.2,3.5,s*1.3],[-7.6,3.0,s*1.3],.26,.26,4));
    B.box(p,cD,2.9,.2,2.9,-7.9,3.15,0).rbox('matte',A.seat,2.7,.5,2.7,.2,-7.9,3.5,0);
    B.push(-9.3,3.6,0,0,0,.22);B.box(p,cD,.2,2.8,2.8,-.28,1.5,0).rbox('matte',A.seat,.45,2.7,2.6,.2,0,1.5,0);B.pop();
    B.both(s=>{B.box(p,cD,1.7,.16,1.2,-4.9,2.7,s*3.0,0,0,.2);B.box(p,cD,.5,2.9,.5,-3.2,4.8,s*2.5);
      B.push(-3.7,6.3,s*2.5,0,-Math.PI/2,0);ddrArtHandwheel(B,1.05);B.pop();});
    // the shield: a flat plate either side of the gun, their outer parts swung back
    B.push(3.9,3.6,0,0,0,.12);
    B.both(s=>{B.plate(p,col,[[s*1.05,1.4],[s*3.7,.2],[s*3.7,8.8],[s*2.3,8.8],[s*1.05,7.5]],.2,0,0,0);
      B.push(0,0,s*3.7,0,-s*.55,0);B.plate(p,col,[[0,.2],[s*2.6,1.8],[s*2.6,7.0],[0,8.8]],.2,0,0,0);
      if(L)B.tube(st,A.steelW,[.03,8.8,0],[.03,7.0,s*2.6],.06,.06,3);B.pop();
      if(L){B.tube(st,A.steelW,[.03,8.8,s*2.3],[.03,8.8,s*3.7],.06,.06,3);for(const y of[2.2,5.2,8.0])B.box(st,cD,.5,.8,.3,-.04,y,s*3.7);}});
    B.pop();
    B.both(s=>B.tube(p,cD,[1.9,8.2,s*1.7],[3.5,9.6,s*3.0],.14,.14,4).tube(p,cD,[2.6,3.6,s*1.7],[3.6,4.4,s*3.2],.14,.14,4));
    B.pop();
    // the gun: the receiver, the barrel with its flash hider, the magazine in from the left, the case chute on the right
    R.push(0,0,0,0,0,0,S);
    R.rbox(st,C.gun,9.0,1.8,1.5,.15,-2.5,0,0);
    R.box(st,C.gunL,5.2,.3,1.3,-2.2,1.0,0).cyl(st,C.gunD,.6,1.0,-7.4,0,0,'x',8).cyl(st,C.gunD,.72,.9,2.3,0,0,'x',8);
    R.lathe(st,C.gunD,[[2.0,.52],[5.6,.5],[5.9,.37],[13.4,.34],[13.5,.44],[MX,.7],[MX,.6],[13.9,.3]],0,0,0,'x',L?12:8);
    R.cyl(st,C.black,.3,.06,13.95,0,0,'x',6);
    R.box(st,C.gunD,1.4,1.7,.5,.3,0,-.95).box(st,C.gunD,1.0,1.5,2.7,.3,.05,-2.2,.1,0,0);
    R.box(st,C.gunD,1.7,1.2,.6,-.8,-.2,1.0);
    if(L){R.tube(st,C.gunL,[-4.6,.3,.8],[-4.6,.3,1.6],.12,.12,4).ball(st,C.gunL,.2,-4.6,.3,1.7);for(let i=0;i<5;i++)R.box(st,C.black,.5,.12,1.52,3.0+i*.5,.2,0);}
    R.pop();
    const mz=ddrArtMuz(TR,MX,EL,S);
    return{base:B.geos(),barrel:R.geos({lo:.93}),tr:[TR[0]*S,TR[1]*S,0],elev:EL,muzzle:mz,S,len:(mz[0]/S+9.9)*S,wid:15.8*S,hgt:(TR[1]+MX*se+.7)*S};});
  return ddrArtGun(M);
}

/* ---------- the coastal gun in its casemate ----------
   A medium naval gun on a pedestal, as the navy's coastal batteries had them (after the 10.5 cm SK C/32 in its MPL mounting): a conical
   pedestal bolted to the floor, the carriage that turns on it with its fork up to the trunnions, the barrel in a sleeve cradle with the two
   recuperators over it and the recoil brake under, a wrap-round shield with a part roof, the breech ring with its wedge, a hand wheel and a
   seat either side (the layer on the left, the trainer on the right), the telescope. Barrel 4.5 m, the bore 1.28 m off the floor (14.7 units:
   the old gun's height, so it looks out of the same embrasure); the shield 20.7 units to its top, under the casemate's roof (22.5). Navy grey. */
function ddrArtCoast(lod){
  lod=lod?1:0;const S=DDR_ART_S;
  const M=ddrModel('artCoast|'+lod,()=>{
    const T=THREE,B=ddrArtB(lod),R=ddrArtB(lod),C=DDRC,A=DDRA,p='paint',st='steel',L=lod,col=A.navy,cD=A.navyD,cL=A.navyL,TR=[0,12.8,0],EL=0,MX=36;
    B.push(0,0,0,0,0,0,S);
    // the pedestal: its flange bolted down, the cone, the ring the carriage turns on
    B.lathe(p,cD,[[0,4.9],[.5,4.9],[.5,4.2],[6.2,2.7],[6.2,3.1],[7.0,3.1],[7.0,.01]],0,0,0,'y',L?20:12);
    if(L)for(let i=0;i<12;i++){const a=i*Math.PI/6;B.box(st,C.gunD,.4,.3,.4,Math.cos(a)*4.55,.62,Math.sin(a)*4.55,0,-a,0);}
    // the carriage: the fork up to the trunnions
    B.cyl(p,col,2.9,1.0,0,7.5,0,'y',12).box(p,cD,5.2,.6,5.6,0,7.9,0);
    B.both(s=>{B.ext(p,col,[[-3.3,7.6],[3.3,7.6],[1.6,13.8],[-1.6,13.8]],.5,0,0,s*2.55);B.cyl(p,cD,.95,.5,0,12.8,s*2.95,'z',8);});
    // the cradle: the sleeve the barrel slides through, two recuperators over it and the recoil brake under; the telescope on the left
    B.push(TR[0],TR[1],0,0,0,EL);
    B.lathe(p,col,[[-3.4,1.5],[-3.4,2.0],[5.6,2.0],[6.0,1.6],[6.0,1.3]],0,0,0,'x',L?16:10);
    B.both(s=>B.lathe(p,cD,[[-2.6,.01],[-2.6,.5],[5.0,.5],[5.4,.3],[5.4,.01]],0,2.3,s*.85,'x',L?8:6));
    B.lathe(p,cD,[[-2.6,.01],[-2.6,.62],[6.6,.62],[7.0,.4],[7.0,.01]],0,-2.5,0,'x',L?8:6);
    B.box(p,cD,.5,1.8,.5,.6,2.3,-2.5).cyl(st,C.gunD,.32,3.4,1.2,3.3,-2.8,'x',6);
    if(L)B.cyl(st,C.gunD,.42,.5,2.9,3.3,-2.8,'x',5).box(p,cD,3.0,.4,1.8,-5.6,-2.4,0);
    B.pop();
    // the shield: wrapped round the front and the sides, a part roof sloping in; a slot for the barrel, a port for the telescope
    const Ro=8.6,th=.3,shell=(y0,roof,a0,a1,n,y1)=>{const P=roof?[[Ro-th,y0],[Ro,y0],[Ro,15.6],[5.6,18.0],[5.6,17.7],[Ro-th,15.5],[Ro-th,y0]]:[[Ro-th,y0],[Ro,y0],[Ro,y1],[Ro-th,y1],[Ro-th,y0]];
      B.put(p,new T.LatheGeometry(P.map(q=>new T.Vector2(q[0],q[1])),n,Math.PI/2-a1,a1-a0),col,0,0,0);};
    shell(6.4,1,.27,1.75,L?9:5);shell(6.4,1,-1.75,-.27,L?9:5);shell(14.9,1,-.27,.27,L?3:2);shell(6.4,0,-.27,.27,L?3:2,10.6);
    B.box('matte',C.black,.14,1.0,1.3,Ro*Math.cos(.42)+.04,14.4,-Ro*Math.sin(.42),0,.42,0);
    B.both(s=>B.tube(p,cD,[1.6,11.2,s*2.9],[5.4,11.2,s*6.4],.2,.2,4).tube(p,cD,[1.0,13.6,s*2.6],[5.0,15.2,s*6.4],.18,.18,4));
    if(L){for(const a of[-1.7,-1.2,-.7,-.32,.32,.7,1.2,1.7])for(const y of[7.0,15.0])B.box(st,cD,.16,.26,.26,(Ro+.06)*Math.cos(a),y,(Ro+.06)*Math.sin(a),0,-a,0);
      for(const s of[-1,1])B.tube(st,A.steelW,[Ro*Math.cos(1.75),6.5,s*Ro*Math.sin(1.75)],[Ro*Math.cos(1.75),15.5,s*Ro*Math.sin(1.75)],.07,.07,3);}
    // the layer's seat and elevating wheel on the left, the trainer's on the right
    B.both(s=>{B.tube(p,cD,[-1.6,8.3,s*2.8],[-4.8,8.0,s*4.8],.24,.24,4);B.cyl('matte',A.seat,1.25,.4,-4.9,8.4,s*4.9,'y',8);B.box(p,cD,.3,1.7,2.0,-6.0,9.3,s*4.9,0,0,.15);
      B.box(p,cD,1.7,1.7,.9,-1.7,11.2,s*3.1);B.push(-1.7,11.2,s*3.75,0,s<0?Math.PI:0,0);ddrArtHandwheel(B,1.5);B.pop();});
    B.pop();
    // the barrel: a long tapering tube, the heavy breech ring with its wedge and lever, the lugs the recoil rods hold
    R.push(0,0,0,0,0,0,S);
    R.lathe(p,col,[[-4.2,1.55],[6.2,1.5],[6.6,1.32],[12,1.2],[35.0,.86],[35.2,1.03],[MX,1.03],[MX,.56]],0,0,0,'x',L?18:10);
    R.cyl(st,C.black,.56,.1,MX-.06,0,0,'x',8);
    R.rbox(p,cD,5.0,4.4,4.4,.4,-6.6,0,0);
    R.box(st,C.gun,1.7,.5,2.0,-6.8,2.3,0).box(st,C.black,.16,1.9,1.8,-9.06,.2,0);
    R.tube(st,A.steelW,[-6.8,.6,2.3],[-5.2,-1.6,2.9],.18,.18,4);
    R.box(p,cD,1.2,1.0,2.7,-4.6,2.4,0).box(p,cD,1.2,1.2,1.2,-4.6,-2.6,0);
    if(L){R.ball(st,A.steelW,.34,-5.2,-1.6,2.9);R.box(st,C.gunD,1.72,4.42,.2,-6.8,0,2.14).box(st,C.gunD,1.72,4.42,.2,-6.8,0,-2.14);}
    R.pop();
    const mz=ddrArtMuz(TR,MX,EL,S);
    return{base:B.geos(),barrel:R.geos({lo:.93}),tr:[TR[0]*S,TR[1]*S,0],elev:EL,muzzle:mz,S,len:(MX+9.1)*S,wid:2*Ro*S,hgt:18.0*S};});
  return ddrArtGun(M);
}

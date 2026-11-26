"use strict";
/* D-Day, Version 246 (a draft, behind ddReal()): the trucks, the cars and the landing craft made to look like the real things.
   See js/ddreal.js for the kit and tools/real/GUIDE.md for the rules. Everything here is built with the kit's builder (ddrB) and drawn in its
   materials, plus one of this file's own: 'ddrVehNavy', the landing craft's grey with rust and dirt run down it.
   - ddrVehLCVP(wreck,lod): the landing craft (an LCVP, the Higgins boat), in the old boat's frame (the bow and ramp toward -z; dday.js's ddBoatMesh).
   Helpers the kit doesn't have: ddrVehLoft (a skin through rows of points: hulls, bonnets, mudguards, canvas), ddrVehFan (a flat patch),
   ddrVehAt (a part's own frame, for things set at an angle). */

/* ---------- colours ---------- */
const ddrVehC={navy:0x79848a,navy2:0x858f95,navyD:0x40484e,navyC:0x5a646b,navyIn:0x6d787e,boot:0x2a2e31,deckW:0x7d725e,deckW2:0x6c6251,nonskid:0x566067,hole:0x14171a,
  rope:0x988c68,ropeD:0x7a6e4e,tread:0x858a90,gun:0x2b2d30,gunD:0x1f2123,red:0x8a2a20};

/* ---------- helpers ---------- */
// a skin through rows of points: rows[i] = [[x,y,z],...], each row the same number of points. A face looks the way (row i to i+1) x (point j to j+1)
// points; o.flip turns it round, o.closed joins a row's last point to its first, o.flat gives every face its own shade, o.skip(i,j) leaves a hole
function ddrVehLoft(rows,o){
  o=o||{};const T=THREE,n=rows.length,m=rows[0].length,P=[],I=[],mm=o.closed?m:m-1;
  for(const r of rows)for(const p of r)P.push(p[0],p[1],p[2]);
  for(let i=0;i<n-1;i++)for(let j=0;j<mm;j++){if(o.skip&&o.skip(i,j))continue;const a=i*m+j,b=(i+1)*m+j,c=(i+1)*m+(j+1)%m,d=i*m+(j+1)%m;
    if(o.flip)I.push(a,c,b,a,d,c);else I.push(a,b,c,a,c,d);}
  let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setIndex(I);
  if(o.flat){const f=g.toNonIndexed();g.dispose();g=f;}
  g.computeVertexNormals();return g;
}
// a flat patch through points going round anticlockwise as seen from the side it faces
function ddrVehFan(pts,flip){
  const T=THREE,P=[];for(let i=1;i<pts.length-1;i++){const t=flip?[pts[0],pts[i+1],pts[i]]:[pts[0],pts[i],pts[i+1]];for(const p of t)P.push(p[0],p[1],p[2]);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.computeVertexNormals();return g;
}
// a part's own frame: at x,y,z, turned ry about the vertical (positive: its nose toward -z, its left), then its nose lifted rz. Gives p(a,b,c) -> [x,y,z];
// a box in that frame takes the rotation (0,ry,rz)
function ddrVehAt(x,y,z,ry,rz){
  const cy=Math.cos(ry||0),sy=Math.sin(ry||0),cz=Math.cos(rz||0),sz=Math.sin(rz||0);
  return(a,b,c)=>{const x1=a*cz-b*sz,y1=a*sz+b*cz;return[x+x1*cy+(c||0)*sy,y+y1,z-x1*sy+(c||0)*cy];};
}

/* ---------- the landing craft's paint: navy grey with dirt and rust run down it ----------
   Laid on by where a part is, 40 units a picture: on an upright face the picture's height is the height on the boat, so the streaks start under
   the rub rail (y about 15) and run down to the water. */
function ddrVehNavy(){
  if(DDR_DEF.ddrVehNavy)return'ddrVehNavy';
  const tex=ddrCanvas(256,256,(q,w,h)=>{const r=rng(4471);q.fillStyle='#e4e4e4';q.fillRect(0,0,w,h);
    for(let i=0;i<4200;i++){const v=r()<.5?255:0;q.fillStyle=`rgba(${v},${v},${v},${.02+r()*.05})`;q.fillRect(r()*w,r()*h,1+r()*1.6,1+r()*1.6);}
    const blob=(x,y,R,col)=>{for(const ox of[0,-w,w])for(const oy of[0,-h,h]){const g=q.createRadialGradient(x+ox,y+oy,1,x+ox,y+oy,R);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');q.fillStyle=g;q.fillRect(x+ox-R,y+oy-R,R*2,R*2);}};
    for(let i=0;i<30;i++)blob(r()*w,r()*h,12+r()*30,r()<.6?`rgba(20,26,30,${.05+r()*.07})`:`rgba(255,255,255,${.04+r()*.06})`);
    // a streak from y0 running len down the picture (dir 1) or up it (dir -1), fading out
    const streak=(x,y0,len,wd,rgb,a,dir)=>{for(const oy of[0,-h,h]){const y1=y0+dir*len,g=q.createLinearGradient(0,y0+oy,0,y1+oy);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(.35,`rgba(${rgb},${a*.6})`);g.addColorStop(1,`rgba(${rgb},0)`);q.fillStyle=g;q.fillRect(x-wd/2,Math.min(y0,y1)+oy,wd,len);}};
    for(let i=0;i<34;i++){const x=r()*w,k=r();streak(x,150+r()*14,40+r()*80,1.5+r()*4,k<.55?'38,34,30':k<.8?'110,66,36':'255,255,255',k<.8?.14+r()*.2:.1+r()*.1,1);
      if(k>=.55&&k<.8){q.fillStyle=`rgba(96,52,26,${.3+r()*.25})`;q.beginPath();q.ellipse(x,152+r()*10,1.6+r()*2,1.2+r()*1.4,0,0,7);q.fill();}}
    for(let i=0;i<14;i++)streak(r()*w,165+r()*60,20+r()*50,1+r()*3,r()<.6?'38,34,30':'110,66,36',.1+r()*.16,1);
    for(let i=0;i<18;i++)streak(r()*w,108-r()*8,30+r()*50,1.5+r()*4,r()<.7?'38,34,30':'255,255,255',.08+r()*.12,-1);   // (the part of the picture the decks get)
    for(let i=0;i<60;i++){const x=r()*w,y=r()*h,a=r()*6,l=5+r()*30;q.strokeStyle=r()<.6?`rgba(255,255,255,${.1+r()*.2})`:`rgba(0,0,0,${.08+r()*.12})`;q.lineWidth=.5+r()*.7;q.beginPath();q.moveTo(x,y);q.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);q.stroke();}
    for(let i=0;i<70;i++){q.fillStyle=`rgba(255,255,255,${.1+r()*.18})`;q.fillRect(r()*w,r()*h,1+r()*2.2,1+r()*1.2);}
  },true);
  return ddrMatDef('ddrVehNavy',{r:1.3,m:.2,e:.5,map:tex,tile:40});
}

/* ---------- canvas, rubber and bare boards on the trucks and cars: the kit's matte with a cloth picture (a fine weave, creases running down, dust) ----------
   in place of the wear picture, whose blotches read as camouflage on a pale tilt. One material for everything dull on a vehicle keeps it at three meshes. */
function ddrVehCloth(){
  if(DDR_DEF.ddrVehCloth)return'ddrVehCloth';
  const tex=ddrCanvas(256,256,(q,w,h)=>{const r=rng(5519);q.fillStyle='#e8e8e8';q.fillRect(0,0,w,h);
    for(let i=0;i<9000;i++){const v=r()<.5?255:0;q.fillStyle=`rgba(${v},${v},${v},${.03+r()*.05})`;q.fillRect(r()*w,r()*h,1,1+r());}
    // creases: soft upright bands, light and dark, each in a few stretches
    for(let i=0;i<22;i++){const x=r()*w,wd=2.5+r()*8,dk=r()<.55,a=.025+r()*.055;for(let k=0;k<2;k++){const y0=r()*h,len=h*(.25+r()*.5);
      for(const ox of[0,-w,w])for(const oy of[0,-h])
{const g=q.createLinearGradient(x+ox-wd,0,x+ox+wd,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.5,dk?`rgba(0,0,0,${a})`:`rgba(255,255,255,${a})`);g.addColorStop(1,'rgba(0,0,0,0)');q.fillStyle=g;q.fillRect(x+ox-wd,y0+oy,wd*2,len);}}}
    // dust and stains
    for(let i=0;i<16;i++){const x=r()*w,y=r()*h,R=10+r()*26,dk=r()<.5;for(const ox of[0,-w,w])for(const oy of[0,-h,h]){const g=q.createRadialGradient(x+ox,y+oy,1,x+ox,y+oy,R);g.addColorStop(0,dk?`rgba(30,26,18,${.04+r()*.05})`:`rgba(255,250,235,${.05+r()*.06})`);g.addColorStop(1,'rgba(0,0,0,0)');q.fillStyle=g;q.fillRect(x+ox-R,y+oy-R,R*2,R*2);}}
  },true);
  return ddrMatDef('ddrVehCloth',{r:1.7,m:0,e:.2,map:tex,tile:22});
}

/* ---------- a .30 calibre Browning on its pintle behind a small shield (the landing craft's two) ----------
   At x,y,z (the pivot, under the front of the receiver), turned ry and lifted rz, k its size. */
function ddrVehM1919(B,mk,x,y,z,ry,rz,k,o){
  o=o||{};const C=ddrVehC,p=ddrVehAt(x,y,z,ry,rz),bx=(c,w,h,d,a,b,e)=>{const q=p(a*k,b*k,e*k);B.box(mk,c,w*k,h*k,d*k,q[0],q[1],q[2],0,ry,rz);};
  bx(C.gun,3.4,.95,.66,-1.2,.42,0);                                                   // the receiver
  B.tube(mk,C.gun,p(.5*k,.5*k,0),p(5.1*k,.5*k,0),.28*k,.28*k,6);                      // the barrel's jacket
  B.tube(mk,C.gunD,p(5.1*k,.5*k,0),p(5.6*k,.5*k,0),.19*k,.19*k,5);
  bx(C.gunD,.4,.9,.4,-3.0,-.3,0);                                                     // the grip
  bx(DDRC.odD,1.3,1.15,.62,-.7,.2,-.72);                                              // the ammunition box on its left
  bx(C.gunD,1.4,.4,.9,-.5,-.25,0);                                                    // the cradle
  if(!o.noShield)bx(o.shield||C.navy,.18,3.3,4.3,1.15,.8,0);
  if(B.lod){for(let i=0;i<5;i++)bx(C.gunD,.5,.2,.6,1.0+i*.82,.5,0);bx(C.gun,.3,.3,.3,-2.6,1.0,0);}
}

/* ---------- the landing craft (an LCVP, the Higgins boat) ----------
   Built in the kit's frame (+x the bow, +z starboard, the deck's top at y 3, the gunwale at 17, 104 long and 34 wide), then turned into the old
   boat's: the bow and ramp toward -z. The well is 28 wide inside from the ramp back to the engine's bulkhead (x -19 here: z 19 in the old frame). */
function ddrVehLCVPGeos(W,lod){
  const T=THREE,B=ddrB(lod),R=ddrB(lod),L=B.lod,C=ddrVehC,nv=ddrVehNavy(),mt='matte',hz=Math.PI/2,RAKE=.12,tr=Math.tan(RAKE);
  const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  // the hull's lines at x: half width and height of the gunwale (zg,yg) and of the chine (zc,yc), the keel (yk), the well's wall (zi)
  const H=x=>{const t=cl((x-18)/34,0,1),s=cl((-34-x)/18,0,1),t2=Math.pow(t,2.2),s2=Math.pow(s,2.4),zg=17-1.5*t*t-1.4*s2;
    return{zg,yg:17+t*Math.sqrt(t),zc:14.5-1.3*t*t-1.1*s2,yc:-1.6+3.5*t2+1.2*s*s,yk:-2.6+4.3*t2+1.7*s*s,zi:x<-34?zg-3:14-.8*Math.pow(cl((x-36)/16,0,1),1.5)};};
  const sk=(h,y)=>h.zc+(h.zg-h.zc)*(y-h.yc)/(h.yg-h.yc);                  // the side's skin at height y
  const XS=[-52,-50,-47,-43,-34,-19,-6,3,9,14,20,27,33,39,44,48,52],px=(x,y)=>x>=52?x+(y-3)*tr:x;   // (the bow's end leans forward with the ramp)
  const rows=(x0,fn)=>{const xs=XS.filter(x=>x>=x0);return{xs,rw:xs.map(x=>fn(x,H(x)))};};
  // both sides from one set of rows (the port side mirrored); sS and sP leave holes (the wreck's): (x,j) => true to leave that piece out
  const two=(mk,c,x0,fn,sS,sP)=>{const q=rows(x0,fn),mk1=s=>ddrVehLoft(q.rw,s?{skip:(i,j)=>s(q.xs[i],j)}:null);
    if(!sS&&!sP){const g=mk1(null);B.put(mk,g,c,0,0,0,0,0,0,1,1,1,{keep:1});B.put(mk,g,c,0,0,0,0,0,0,1,1,-1);}
    else{B.put(mk,mk1(sS),c);B.put(mk,mk1(sP),c,0,0,0,0,0,0,1,1,-1);}};
  const yb=h=>Math.max(.5,h.yc+1),inS=x=>x>=3&&x<14,inP=x=>x>=27&&x<33;   // the dark band at the water; where the wreck is holed, starboard and port
  // the bottom, the dark band along the water, the side, the gunwale's cap, the well's wall
  B.put(nv,ddrVehLoft(XS.map(x=>{const h=H(x);return[[px(x,h.yc),h.yc,-h.zc],[px(x,h.yk),h.yk,0],[px(x,h.yc),h.yc,h.zc]];})),C.boot);
  two(nv,C.boot,-99,(x,h)=>[[px(x,h.yc),h.yc,h.zc],[px(x,yb(h)),yb(h),sk(h,yb(h))]]);
  two(nv,C.navy,-99,(x,h)=>[[px(x,yb(h)),yb(h),sk(h,yb(h))],[px(x,9),9,sk(h,9)],[px(x,h.yg),h.yg,h.zg]],W&&((x,j)=>j===1&&inS(x)),W&&((x,j)=>j===0&&inP(x)));
  two(nv,C.navyC,-99,(x,h)=>[[px(x,h.yg),h.yg,h.zg+.1],[px(x,h.yg),h.yg,h.zi-.15]],W&&(x=>inS(x)),null);
  two(nv,C.navyIn,-34,(x,h)=>[[px(x,h.yg),h.yg,h.zi],[px(x,9),9,h.zi],[px(x,3),3,h.zi]],W&&((x,j)=>j===0&&inS(x)),W&&((x,j)=>j===1&&inP(x)));
  // the rub rail under the gunwale, and the armour plate bolted along the side from the bow to the engine
  two(nv,C.navyD,-99,(x,h)=>[[px(x,h.yg-1.95),h.yg-1.95,sk(h,h.yg-1.95)],[px(x,h.yg-1.8),h.yg-1.8,h.zg+.6],[px(x,h.yg-.8),h.yg-.8,h.zg+.75],[px(x,h.yg-.55),h.yg-.55,h.zg-.05]],W&&(x=>inS(x)),null);
  two(nv,C.navyD,-99,(x,h)=>{const y=Math.max(3.6,h.yc+2.6);return[[px(x,y-.5),y-.5,sk(h,y-.5)],[px(x,y),y,sk(h,y)+.55],[px(x,y+.5),y+.5,sk(h,y+.5)]];},null,W&&(x=>inP(x)));
  {const ap=(x,h)=>{const y0=Math.max(4.6,h.yc+3.6),y1=h.yg-2.4;return[[x,y0,sk(h,y0)+.22],[x,y1,sk(h,y1)+.22]];},xs=XS.filter(x=>x>=-19&&x<52).concat([50]),rw=xs.map(x=>ap(x,H(x)));
    const mkp=s=>ddrVehLoft(rw,s?{skip:(i,j)=>s(xs[i])}:null);B.put(nv,mkp(W&&inS),C.navy2);B.put(nv,mkp(W&&inP),C.navy2,0,0,0,0,0,0,1,1,-1);
    if(L)B.both(s=>{for(let x=-17;x<=49;x+=3.3){const h=H(x),e=ap(x,h);for(const q of e)B.box(nv,C.navyD,.34,.34,.2,x,q[1]+(q===e[0]?.7:-.7),s*(q[2]+.08));}});}
  // the stern's flat end, the bow's sill under the ramp and the posts the ramp shuts against
  {const h=H(-52),zb=sk(h,1.4);B.put(nv,ddrVehFan([[-52,h.yg,-h.zg],[-52,1.4,-zb],[-52,1.4,zb],[-52,h.yg,h.zg]]),C.navy);B.put(nv,ddrVehFan([[-52,1.4,-zb],[-52,h.yc,-h.zc],[-52,h.yk,0],[-52,h.yc,h.zc],[-52,1.4,zb]]),C.boot);}
  B.box(nv,C.navyD,1.3,1.5,26.6,51.4,2.3,0);
  B.both(s=>B.box(nv,C.navyD,1.1,15.6,2.7,53.05,10.6,s*14.4,0,0,-RAKE).box(nv,C.navyD,1.6,1.1,1.5,53.3,17.6,s*13.1,0,0,-RAKE));
  // the well: its floor, the boards on it, the frames up the walls and a stringer along them
  {const q=rows(-34,(x,h)=>[[px(x,3),3,h.zi],[px(x,3),3,-h.zi]]);B.put(nv,ddrVehLoft(q.rw),C.boot);}
  for(let i=0;i<8;i++){const z=-11.55+i*3.3;if(W&&(i===2||i===5)){B.box(mt,C.deckW2,30,.3,3.1,-2+i*4,3.4,z+1,0,.12*(i-3),.06);continue;}
    B.put(mt,new T.PlaneGeometry(70.6,3.12),(i*7)%3?C.deckW:C.deckW2,16.2,3.07,z,-hz,0,0);}
  for(let x=-30.5;x<50;x+=6.6)B.both(s=>{const h=H(x),cut=W&&(s>0?inS(x):inP(x));B.box(nv,C.navyD,.95,cut?6.5:13.3,1.1,x,cut?(s>0?6.3:13.5):9.75,s*(h.zi-.5));});
  B.both(s=>B.box(nv,C.navyD,70,.8,.55,1,10.2,s*13.75));
  if(L)B.both(s=>B.box(nv,C.navyD,70,.5,.5,1,5.4,s*13.75));
  // aft: the bulkhead and the after deck, the engine's box with its lids, the locker beside it, the coxswain's stand with the wheel
  B.box(nv,C.navyIn,.5,13.9,28,-34.25,9.95,0);
  {const q=XS.filter(x=>x<=-34).map(x=>{const h=H(x);return[[x,16.85,h.zi+.1],[x,16.85,-h.zi-.1]];});B.put(nv,ddrVehLoft(q),C.nonskid);}
  B.rbox(nv,C.navy,15,14.6,14,.5,-26.5,10.3,2);
  if(W){B.box(nv,C.navyD,6.9,.5,12.8,-30.4,18.6,3,0,.2,.5).box(nv,C.navyD,6.9,.5,12.8,-21.6,17.5,5,.3,-.15,-.12);}
  else{B.box(nv,C.navyD,6.9,.5,12.8,-30.2,17.8,2).box(nv,C.navyD,6.9,.5,12.8,-22.8,17.8,2);
    if(L)for(const x of[-30.2,-22.8]){B.tube('steel',C.gun,[x-1.4,18.3,6.5],[x+1.4,18.3,6.5],.14,.14,4);for(const z of[-3.6,7.6])B.box(nv,C.navy2,1.2,.2,.7,x,18.1,z-.2);}}
  B.box(nv,C.navy,15,8.6,5,-26.5,7.3,11.5);
  B.cyl(nv,C.navyD,.75,2.4,-31.5,19,7,'y',6).box(nv,C.navyD,1.9,1,1.7,-31.2,20.4,7);                 // the engine's air intake
  B.cyl(mt,C.red,.6,2.8,-27,10.5,-5.75,'y',6);                                                       // (a fire extinguisher on the box's side)
  B.box(nv,C.navyIn,.6,12.4,9.2,-19.3,9.2,-9.6).box(nv,C.navyD,13.6,3.4,9,-26.7,4.7,-9.5);            // the plate in front of the coxswain, his stand
  B.torus(nv,C.gun,2.25,.3,-20.9,13.4,-9.5,0,hz,0,0,10,3).cyl(nv,C.gun,.42,1.3,-20.2,13.4,-9.5,'x',6);
  B.box(nv,C.gun,.24,4.2,.36,-20.9,13.4,-9.5).box(nv,C.gun,.24,.36,4.2,-20.9,13.4,-9.5);
  B.tube(nv,C.gun,[-20,11.4,-12.7],[-21.5,14.6,-12.7],.2,.2,4).ball(mt,C.gunD,.42,-21.6,14.8,-12.7,1,1,1,5);   // the throttle
  // the two gun rings at the stern's quarters: a coaming round the hole, a ring on posts, the gun behind its shield
  B.both(s=>{const xr=-43,zr=s*8.6,dk=16.85,gone=W&&s>0;
    B.lathe(nv,C.navyD,[[0,5],[1.35,5],[1.35,4.3],[-.3,4.3]],xr,dk,zr,'y',10);
    B.put(nv,new T.CircleGeometry(4.3,B.N(10)),C.hole,xr,dk+.12,zr,-hz,0,0);
    B.torus(nv,C.gun,4.55,.36,xr,dk+3.3+(gone?-.5:0),zr,hz+(gone?.22:0),0,0,0,10,3);
    for(let i=0;i<4;i++){const a=.8+i*hz;B.tube(nv,C.gun,[xr+Math.cos(a)*4.55,dk+1.3,zr+Math.sin(a)*4.55],[xr+Math.cos(a)*4.55,dk+3.3,zr+Math.sin(a)*4.55],.24,.24,4,true);}
    if(gone)return;
    const a=.55,gx=xr+Math.cos(a)*4.55,gz=zr+s*Math.sin(a)*4.55;
    B.tube(nv,C.gun,[gx,dk+3.3,gz],[gx,dk+5,gz],.3,.3,5);
    ddrVehM1919(B,L?'steel':nv,gx,dk+5.2,gz,-s*.3,W?-.75:.22,1.3);
    if(!W)B.box(nv,DDRC.odD,2.2,1.6,1.2,xr-2.2,dk+.8,zr-s*5.7);});
  // on deck: the towing bitt and a hatch between the rings, cleats, lifting eyes, a coil of rope
  B.both(s=>B.cyl(nv,C.gun,.5,2.5,-49.7,18.1,s*1.15,'y',6));B.tube(nv,C.gun,[-49.7,18.6,-2],[-49.7,18.6,2],.3,.3,5);
  B.box(nv,C.navy,5,.4,5,-36.9,17.05,0);
  for(const x of[-40.5,6,41])B.both(s=>{const h=H(x),z=s*(h.zg-1.5);B.box(nv,C.gun,1.7,.36,.6,x,h.yg+.18,z);B.tube(nv,C.gun,[x-1.35,h.yg+.66,z],[x+1.35,h.yg+.66,z],.24,.24,4);});
  B.both(s=>{B.torus(nv,C.gun,.95,.22,46.5,H(46.5).yg,s*(H(46.5).zg-1.4),0,0,0,Math.PI,6,3);B.torus(nv,C.gun,.95,.22,-35.6,16.9,s*12.2,0,0,0,Math.PI,6,3);});
  if(!W){B.torus(mt,C.rope,1.4,.45,-36.1,17.35,-11.2,hz,0,0,0,8,3);if(L)B.torus(mt,C.ropeD,.9,.4,-36.1,17.8,-11.2,hz,0,0,0,8,3);}
  // rope fenders hung over the sides
  if(!W)for(const x of[-27,3,31])B.both(s=>{const h=H(x),z=s*(h.zg+1.35);B.lathe(mt,C.rope,[[0,.35],[.5,.95],[3.1,.95],[3.6,.35]],x,9.6,z-s*.3,'y',6);
    B.tube(mt,C.ropeD,[x,13.1,z-s*.3],[x,h.yg+.1,s*(h.zg-.7)],.14,.14,4,true);});
  // the exhaust through the stern; under it the skeg and the rudder (the wreck's, and close up)
  B.cyl(nv,C.gunD,.6,1.2,-52.4,5.5,8,'x',6);
  if(W||L){B.box(nv,C.boot,16,2,.5,-40,-3.4,0).box(nv,C.boot,3.4,3.8,.4,-50.2,-3,0,0,W?.5:0,0);}
  // the boat's number on the bow's sides and across the stern
  B.both(s=>{const x=37.5,h=H(x),z=sk(h,10.6)+.26;B.decal('pa',13,3.25,x,10.6,s*z,s*.142,s>0?.05:Math.PI-.05,0);});
  B.decal('pa',10,2.5,-52.06,11,0,0,-hz,0);
  if(W){   // torn edges round the holes
    for(const[x,y,z,a,b,c]of[[3.6,14.5,16.9,.3,.2,.7],[13.4,13.6,16.6,-.4,-.3,-.6],[8,9.6,16.2,.9,.1,.2],[27.6,5,-15.9,.5,.3,.5],[32.4,6.5,-16,-.3,-.2,-.7]])B.box(nv,C.navyD,3.2,.25,2.6,x,y,z,a,b,c);}
  // ---- the ramp: its own frame (the hinge along z through the origin, the plate up y, its outside toward +x) ----
  R.box(nv,C.navy,.7,16.4,26,.35,8.2,0).box(nv,C.navyIn,.12,15.9,25.2,-.06,8.2,0);
  R.box(nv,C.navyD,.9,1,26.6,1.1,15.9,0).box(nv,C.navyD,.9,1.3,26.6,1.1,.65,0);
  R.both(s=>R.box(nv,C.navyD,.9,14.4,.9,1.1,8.2,s*12.85).box(nv,C.navyD,.55,15.6,.6,-.3,8.2,s*12.6).box(nv,C.gun,.5,1.2,.8,1.7,15.2,s*11.4));
  for(const z of[-7.7,-2.57,2.57,7.7]){if(W&&z===2.57)continue;R.box(nv,C.navy2,.75,14.3,.7,1.05,8.25,z);}
  for(let i=0;i<8;i++){if(W&&(i===3||i===6))continue;R.box('steel',C.tread,.3,.34,23.4,-.22,1.5+i*1.9,0);}
  for(const z of[-10.5,-3.5,3.5,10.5])R.cyl(nv,C.navyD,.6,3.2,.35,0,z,'z',6);
  if(L)for(const z of[-7.7,-2.57,2.57,7.7])for(let y=2.6;y<15;y+=2.5)R.box('steel',C.gun,.2,.3,.3,1.5,y,z);
  const hull=B.geos(),ramp=R.geos({lo:.88,hi:1.01});
  for(const k in hull)hull[k].rotateY(hz);for(const k in ramp){ramp[k].rotateZ(-RAKE);ramp[k].rotateY(hz);}
  return{hull,ramp,tris:B.count()+R.count()};
}
// the landing craft: g (the hull), g.userData.ramp (a Group at (0,3,-52), hinged along x: rotation.x -1.75 lays it down forward). wreck: holed and
// stripped, the ramp fallen half open; ddrBurn(g) draws it burnt
function ddrVehLCVP(wreck,lod){
  const M=ddrModel('vehlcvp|'+(wreck?1:0)+'|'+(lod||0),()=>ddrVehLCVPGeos(!!wreck,lod||0));
  const g=new THREE.Group(),ramp=new THREE.Group();ramp.position.set(0,3,-52);ramp.add(ddrPart(M.ramp));g.add(ddrPart(M.hull));g.add(ramp);
  if(wreck){ramp.rotation.x=-1.05;ramp.rotation.z=.07;}
  g.userData.ramp=ramp;g.userData.real=true;return g;
}

/* ---------- parts the trucks and the cars share ---------- */
// the same geometry on both sides (the left one mirrored)
function ddrVehBoth(B,mk,g,c){B.put(mk,g,c,0,0,0,0,0,0,1,1,1,{keep:1});B.put(mk,g,c,0,0,0,0,0,0,1,1,-1);return B;}
// a road wheel, the axle along z, on side s (1 right, -1 left: its face outward). Lighter than the kit's and dished the way the real ones are: a single
// wheel's disc stands out to its hub, a dual's outer rim is sunk deep with the hub standing out of it, and what can't be seen isn't made.
// o: r, w (one tyre's width), col (the rim's), n sides, dual, bare (the tyre burnt off: the rim alone, r then the rim's radius)
function ddrVehWheel(B,x,y,z,s,o){
  const C=DDRC,r=o.r,w=o.w,n=o.n||10,rr=o.bare?r:r*(o.rim||.6),h=w/2,col=o.col,dk=o.dark||0x26241f,tc=o.tc||C.rubber,mt=ddrVehCloth();
  const P=q=>s>0?q:q.map(a=>[-a[0],a[1]]).reverse(),la=(mk,c,prof,zc)=>B.lathe(mk,c,P(prof),x,y,zc,'z',n);
  const back=zc=>la('paint',dk,[[-h*.5,.01],[-h*.5,rr]],zc);
  if(o.bare){la('paint',col,[[-h*.8,rr*.86],[-h*.8,rr],[h*.8,rr],[h*.8,rr*.86]],z);la('paint',col,[[h*.6,rr*.86],[h*.3,rr*.5],[h*.9,rr*.3],[h,.01]],z);back(z);return B;}
  if(o.dual){const g=w*.08,zo=z+s*(h+g),zi=z-s*(h+g);
    la(mt,tc,[[-h,r],[h*.62,r],[h,r*.9],[h,rr]],zo);la('paint',col,[[h*.8,rr],[-h*.7,rr*.52],[-h*.7,rr*.34],[h*.6,rr*.3],[h*.7,.01]],zo);
    la(mt,tc,[[-h,rr],[-h,r*.9],[-h*.62,r],[h,r]],zi);back(zi);}
  else{la(mt,tc,[[-h,rr],[-h,r*.9],[-h*.62,r],[h*.62,r],[h,r*.9],[h,rr]],z);la('paint',col,[[h*.8,rr],[h*.45,rr*.56],[h*.95,rr*.34],[h*1.05,.01]],z);back(z);}
  if(B.lod){const zf=o.dual?z+s*(h+w*.08)-s*h*.6:z+s*h*.75,nn=o.nuts||6;for(let i=0;i<nn;i++){const a=i*Math.PI*2/nn;B.cyl('steel',C.gunD,r*.035,w*.14,x+Math.cos(a)*rr*.43,y+Math.sin(a)*rr*.43,zf,'z',5);}}
  return B;
}
// a tyre on its rim lying or standing any way (a spare): the axle along ax ('x','y','z'), or turned rot [rx,ry,rz] from upright; bare: the tyre burnt off
function ddrVehSpare(B,r,w,x,y,z,ax,col,n,rot,bare){
  const T=THREE,h=w/2,rr=r*.6,hz=Math.PI/2,R=rot||(ax==='z'?[hz,0,0]:ax==='x'?[0,0,-hz]:[0,0,0]);n=B.N(n||9);
  const la=(mk,c,prof)=>B.put(mk,new T.LatheGeometry(prof.map(q=>new T.Vector2(Math.max(.0001,q[1]),q[0])),n),c,x,y,z,R[0],R[1],R[2]);
  if(bare)la('paint',col,[[-h*.8,rr*.86],[-h*.8,rr],[h*.8,rr],[h*.8,rr*.86]]);else la(ddrVehCloth(),DDRC.rubber,[[-h,rr],[-h,r*.9],[-h*.62,r],[h*.62,r],[h,r*.9],[h,rr]]);
  la('paint',col,[[h*.6,rr],[h*.3,rr*.5],[h*.5,.01]]);la('paint',col,[[-h*.5,.01],[-h*.3,rr*.5],[-h*.6,rr]]);return B;
}
// a canvas tilt over hoops. sec: the hoop's outline [[y,z],...] from the right side's foot up to the middle (the left side mirrored); xs: where the hoops
// stand, rear to front; between them the canvas sags. o: col, colIn (its inside, seen through the open back), front (the front end closed),
// hoop (the hoops' colour: flat strips against the inside), sag
function ddrVehTilt(B,sec,xs,o){
  o=o||{};const mt=ddrVehCloth(),full=sec.concat(sec.slice(0,-1).reverse().map(q=>[q[0],-q[1]])),y0=sec[0][0],y1=sec[sec.length-1][0],sag=o.sag==null?.5:o.sag;
  const at=(x,k,d)=>full.map(q=>{const f=(q[0]-y0)/(y1-y0);return[x,q[0]-k*sag*f*f-(d||0)*f,q[1]*(1-k*.026*(1-f*f))*(1-(d||0)*.02)];});
  const rows=[];for(let i=0;i<xs.length;i++){rows.push(at(xs[i],0));if(i<xs.length-1)rows.push(at((xs[i]+xs[i+1])/2,1));}
  B.put(mt,ddrVehLoft(rows),o.col);B.put(mt,ddrVehLoft(rows,{flip:1}),o.colIn);
  if(o.front){const f=at(xs[xs.length-1],0);B.put(mt,ddrVehFan(f,true),o.col);B.put(mt,ddrVehFan(f),o.colIn);}
  if(o.hoop!=null)for(const x of xs)B.put('paint',ddrVehLoft([at(x-.35,0,.3),at(x+.35,0,.3)],{flip:1}),o.hoop);
  return B;
}

/* ---------- the Opel Blitz 3-ton lorry (their trucks) ----------
   62 long, 24 wide, 27 to the top of the tilt: the real one (6.02 m by 2.27 m) at about 1.04. The rounded bonnet narrowing to its grille, the long
   sweeping mudguards with the headlamps beside the bonnet, the car-like cab with its split windscreen, a wooden bed under a canvas tilt open at the back. */
function ddrVehOpelGeos(lod){
  const T=THREE,B=ddrB(lod),L=B.lod,C=DDRC,p='paint',mt=ddrVehCloth(),hz=Math.PI/2,gl=L?'glass':p;
  const G=C.gelb,GD=C.gelbD,G2=0xa89158,CH=0x5e5238,DK=0x24221d,GLS=0x1d282e,CV=0x8a8866,CVD=0x56533c,WD=0x7a6b4c;
  // the frame, the axles on their springs, the wheels (single in front, dual behind)
  B.both(s=>B.box(p,CH,59.6,1.5,.8,-.6,8,s*4.3).box(p,CH,9.5,.5,.8,22.3,6.4,s*4.3).box(p,CH,11.5,.7,.9,-14.8,6.7,s*4.3));
  B.box(p,CH,.9,1.5,9.4,29,8,0).box(p,CH,.9,1.8,9.4,-30.3,7.9,0);
  B.tube(p,CH,[22.3,4.7,-8.2],[22.3,4.7,8.2],.5,.5,6).tube(p,CH,[-14.8,4.7,-8],[-14.8,4.7,8],.6,.6,6).ball(p,CH,1.7,-14.8,4.7,0,1.15,1,1,6);
  B.both(s=>{ddrVehWheel(B,22.3,4.7,s*8.9,s,{r:4.7,w:2.3,col:G,n:10});ddrVehWheel(B,-14.8,4.7,s*8.5,s,{r:4.7,w:2.2,col:G,n:10,dual:1});});
  // the bumper, the mudguards sweeping back to the running boards
  B.box(p,GD,.8,1.7,20.8,30.6,6.2,0);B.both(s=>B.box(p,CH,2.2,.6,.6,29.7,6.6,s*4.3).box(p,GD,9,.5,3.2,9.8,5.75,s*9.8));
  {const F=[[14,5.9],[14.9,7],[16.2,8.7],[18,10.1],[20,10.8],[22.3,11.1],[24.5,10.8],[26.5,10],[28.4,8.6],[29.5,7]],rows=F.map(([x,y])=>[[x,y-1.5,11.45],[x,y-.35,11.2],[x,y+.42,8],[x,y+.1,5.2]]);
    ddrVehBoth(B,p,ddrVehLoft(rows),G);ddrVehBoth(B,p,ddrVehLoft(rows,{flip:1}),DK);}
  // the bonnet: an arch narrowing and dropping to the grille, a hinge along its middle, louvres along its sides
  const bw=x=>7.8-(x-16.2)*.24,bt=x=>16.6-(x-16.2)*.115;
  const bsec=(x,k,dy)=>{k=k||1;dy=dy||0;const w=bw(x)*k,t=bt(x)-dy,y0=9.4+dy*1.2;return[[x,y0,w],[x,t-1.9,w],[x,t-.55,w-.9*k],[x,t,w*.5],[x,t+.12,0],[x,t,-w*.5],[x,t-.55,-w+.9*k],[x,t-1.9,-w],[x,y0,-w]];};
  B.put(p,ddrVehLoft([bsec(16.2),bsec(20),bsec(24),bsec(27.2),bsec(28.2),bsec(28.7,.86,.35)]),G);
  B.put(p,ddrVehFan(bsec(28.7,.86,.35),true),DK);
  for(let i=0;i<4;i++)B.box(p,GD,.14,.2,bw(28.7)*.86*(i<3?1.9:1.6),28.78,10.6+i*.9,0);
  B.box(p,G,.22,4.5,.5,28.8,12.2,0).box(p,G,1.4,2.6,10.4,28.4,8.4,0);
  B.box(p,GD,12.4,.16,.5,22.3,bt(22.3)+.15,0,0,0,-.115);
  B.both(s=>{for(let i=0;i<4;i++)B.box(p,DK,8.4,.2,.14,21.6,11+i*.72,s*(bw(21.6)+.02),0,s*.236,0);});
  // headlamps under blackout covers beside the bonnet, the width markers on the mudguards' tips, the blackout lamp on the left mudguard
  B.both(s=>{B.lathe(p,GD,[[-1,.01],[-.8,.7],[-.2,1.1],[.5,1.15]],27.2,11.9,s*6.9,'x',8);B.put(p,new T.CircleGeometry(1.15,B.N(8)),DK,27.71,11.9,s*6.9,0,hz,0);
    B.box(p,0xcfc7a0,.05,.16,1.2,27.74,11.9,s*6.9).tube(p,GD,[27,10.9,s*6.9],[26.6,9.9,s*6.9],.25,.25,4);
    B.tube(p,GD,[28.9,7.6,s*11],[28.9,12.8,s*11],.09,.09,3).ball(p,0xd8d4c0,.3,28.9,13,s*11,1,1,1,5);});
  B.lathe(p,GD,[[0,.3],[.5,.75],[.9,.75],[1.2,.4]],28.3,9.2,-9.3,'y',6);
  // the cab: a skin through its cross-sections from the back to the windscreen's top and down the screen to the scuttle
  const half=[[7.6,9.9],[15.8,9.9],[20.6,9.25],[21.9,7.9],[22.4,4.5],[22.5,0]],cowl=[[7.6,9.9],[15.8,9.9],[16,9.6],[16.3,8.2],[16.55,4.5],[16.6,0]];
  const csec=(x,hf,kz,dy)=>{const a=hf.map(q=>[x,q[0]>16.5?q[0]-(dy||0):q[0],q[1]*(kz||1)]);return a.concat(a.slice(0,-1).reverse().map(q=>[q[0],q[1],-q[2]]));};
  B.put(p,ddrVehLoft([csec(5.2,half,.94,.5),csec(6.1,half),csec(14.4,half),csec(16.3,cowl)]),G);
  B.put(p,ddrVehFan(csec(5.2,half,.94,.5)),G);B.put(p,ddrVehFan(csec(16.3,cowl),true),G);
  {const zq=y=>9.9-(y-15.8)*.135+.06,xf=y=>15-(y-16.4)*.33;ddrVehBoth(B,gl,ddrVehFan([[7,16.4,zq(16.4)],[xf(16.4),16.4,zq(16.4)],[xf(20.5),20.5,zq(20.5)],[7,20.5,zq(20.5)]]),GLS);
    ddrVehBoth(B,gl,ddrVehFan([[16.2,17.33,7.5],[16.2,17.33,.45],[14.8,21.53,.45],[14.8,21.53,7.3]]),GLS);
    B.put(gl,ddrVehFan([[5.13,18.2,-3.4],[5.13,18.2,3.4],[5.13,20.4,3.2],[5.13,20.4,-3.2]]),GLS);}
  B.box(p,G,.3,4.7,.5,15.5,19.4,0,0,0,.316);
  B.both(s=>B.box(p,GD,.14,8.2,.1,6.7,11.8,s*9.96).box(p,GD,.14,8.2,.1,14.7,11.8,s*9.96).box(p,GD,.6,.25,.3,7.7,14.7,s*10.05));
  B.tube(p,DK,[15,17.4,-10],[15.6,18.6,-11.6],.12,.12,3).cyl(p,DK,.8,.2,15.6,18.7,-11.7,'x',8);
  // the bed: its floor on bearers, three boards a side with their straps, the tall front wall, the tailgate, benches inside
  B.box(mt,WD,36,.7,23.4,-13.1,12.05,0);B.both(s=>B.box(p,CH,36,1.3,1,-13.1,10,s*4.3).box(mt,WD,33,.4,2.8,-13.5,15.3,s*10.1));
  for(const x of[3,-5.5,-14,-22.5,-30])B.box(p,CH,1,1.1,22.6,x,11.15,0);
  for(let i=0;i<3;i++){const y=13.33+i*1.86,c=i===1?G2:G;B.both(s=>B.box(mt,c,35.6,1.76,.5,-13.1,y,s*11.85));B.box(mt,c,.5,1.76,23.2,-30.85,y,0);}
  B.box(mt,G,.5,7.4,23.2,4.65,16.1,0);
  B.both(s=>{for(const x of[4.3,-7.2,-18.8,-30.5])B.box(p,GD,.55,5.9,.3,x,15.3,s*12.2);B.box(p,GD,.3,5.6,.5,-31.15,15.2,s*7.5);});
  // the tilt over five hoops, open at the back with the flap rolled up
  ddrVehTilt(B,[[17.2,12.3],[23,12.3],[25.2,11.2],[26.5,8.6],[27.1,4.5],[27.3,0]],[-31,-22.25,-13.5,-4.75,4.1],{col:CV,colIn:CVD,front:1,hoop:GD});
  B.tube(mt,CVD,[-31.4,25.8,-7.4],[-31.4,25.8,7.4],.7,.7,6);
  // under the bed: the tank on the right, a tool box on the left, the rear mudguards, the spare under the tail
  B.cyl(p,GD,1.9,7.6,-1.6,8.3,8.1,'x',8).box(p,GD,6,3,3.2,-2,8.7,-8.7);
  {const rows=[];for(let i=0;i<=6;i++){const a=(18+i*24)*Math.PI/180,x=-14.8+Math.cos(a)*5.7,y=4.7+Math.sin(a)*5.7;rows.push([[x,y,5.9],[x,y,11.6]]);}
    ddrVehBoth(B,p,ddrVehLoft(rows),GD);ddrVehBoth(B,p,ddrVehLoft(rows,{flip:1}),DK);}
  ddrVehSpare(B,4.7,2.3,-25,5.9,0,'y',G,9);
  // the plates (white, WH for the army), a tail lamp, the unit's mark on the tailgate
  B.decal('wh',5.6,1.4,31.03,6.2,-4.2,0,hz,0);
  B.box(p,GD,.15,1.8,6.2,-31,10.5,-6.5).box(p,C.red,.4,.9,.9,-31,10.5,-10.6).decal('wh',5.6,1.4,-31.1,10.5,-6.5,0,-hz,0).decal('tac',2.6,2.6,-31.13,15.2,8.6,0,-hz,0);
  if(L){   // close up: wipers, ropes tying the tilt down, the propeller shaft, the exhaust, the tow hook
    B.both(s=>{B.box(p,DK,.1,2.2,.14,15.2,20.2,s*4,0,0,.316);for(const x of[-27,-18,-9,0])B.tube(mt,C.web,[x,17.3,s*12.36],[x+.5,14.4,s*12.3],.1,.1,3);});
    B.tube(p,CH,[12,6.6,0],[-13.4,5,0],.3,.3,5).tube(p,DK,[14,6.8,5.6],[-8,6.4,5.6],.35,.35,5).box(p,CH,1.6,1,1,-31,7.9,0);
  }
  return B.geos({lo:.76});
}
// a cross-section mirrored about the middle: hf [[y,z],...] from the right side's foot up to the middle, at x; kz narrows it, dy lowers what's above yr (16.5)
function ddrVehSec(x,hf,kz,dy,yr){const a=hf.map(q=>[x,q[0]>(yr||16.5)?q[0]-(dy||0):q[0],q[1]*(kz||1)]);return a.concat(a.slice(0,-1).reverse().map(q=>[q[0],q[1],-q[2]]));}

/* ---------- the GMC CCKW 2½-ton 6x6 (our trucks) ----------
   60 long, 25 wide, 28 to the top of the tilt: the short-wheelbase truck (5.87 m by 2.24 m) at about 1.02 long and 1.1 wide. The long flat-sided bonnet
   behind its brush guard, flat mudguards, the closed cab, three driven axles with the rear two on dual wheels, a steel body under a round-topped tilt. */
function ddrVehGMCGeos(lod){
  const T=THREE,B=ddrB(lod),L=B.lod,C=DDRC,p='paint',mt=ddrVehCloth(),hz=Math.PI/2,gl=L?'glass':p;
  const O=C.od,OD=C.odD,CH=0x3a3e28,DK=0x1f211a,GLS=0x1d282e,CV=0x77744e,CVD=0x4a4831,WD=0x6f6548;
  // the frame, the three axles and their springs, the wheels
  B.both(s=>B.box(p,CH,57.6,1.6,.8,-.4,8.8,s*4.4).box(p,CH,10,.6,.8,21.4,6.6,s*4.4).box(p,CH,13.5,.9,.9,-16.2,7.2,s*4.6));
  B.box(p,CH,.9,1.6,9.6,28.4,8.8,0).box(p,CH,.9,1.6,9.6,-29.2,8.8,0);
  for(const x of[21.4,-10.4,-22])B.tube(p,CH,[x,4.6,-8.4],[x,4.6,8.4],.6,.6,6).ball(p,CH,1.6,x,4.6,x>0?2.2:0,1.1,1,1,6);
  B.both(s=>{ddrVehWheel(B,21.4,4.6,s*9.6,s,{r:4.6,w:2.3,col:O,n:10});for(const x of[-10.4,-22])ddrVehWheel(B,x,4.6,s*9.25,s,{r:4.6,w:2.2,col:O,n:9,dual:1});});
  // the heavy bumper, the flat mudguards and the steps under the doors
  B.box(p,OD,.9,2.1,23.4,29.55,6.6,0);B.both(s=>B.box(p,CH,2.6,1.2,.8,28.2,7.4,s*4.4).box(p,OD,9.4,.5,3.2,8.6,6.3,s*10.7));
  {const F=[[13.2,6.4],[14.2,8.2],[15.8,10.4],[17.5,11.1],[24.5,11.3],[26.6,10.6],[27.9,9.2],[28.5,7.6]],rows=F.map(([x,y])=>[[x,y-1.3,12.3],[x,y-.15,12.15],[x,y,11.4],[x,y,5.6]]);
    ddrVehBoth(B,p,ddrVehLoft(rows),O);ddrVehBoth(B,p,ddrVehLoft(rows,{flip:1}),DK);}
  // the bonnet: flat sides, a gently rounded top hinged along its middle, louvres by the scuttle; the radiator behind the brush guard
  const bw=x=>7.6-(x-12.6)*.107,bt=x=>16.9-(x-12.6)*.07;
  const bsec=x=>{const w=bw(x),t=bt(x);return[[x,10,w],[x,t-1.4,w],[x,t-.4,w-.7],[x,t,w*.55],[x,t+.15,0],[x,t,-w*.55],[x,t-.4,-w+.7],[x,t-1.4,-w],[x,10,-w]];};
  B.put(p,ddrVehLoft([bsec(12.6),bsec(20),bsec(27.6)]),O);B.put(p,ddrVehFan(bsec(27.6),true),OD);
  B.box(p,DK,.1,5,10,27.66,12.9,0).box(p,OD,15,.14,.4,20.1,bt(20.1)+.2,0,0,0,-.07);
  B.both(s=>{for(let i=0;i<5;i++)B.box(p,DK,.25,2.6,.12,14.6+i*.9,13.4,s*(bw(14.6+i*.9)+.02),0,s*.107,0);});
  {const gx=28.5;B.box(p,OD,.3,.5,21,gx,16.1,0).box(p,OD,.3,.5,21,gx,8.5,0);
    B.both(s=>B.box(p,OD,.3,8.1,.5,gx,12.3,s*10.3).box(p,OD,.3,8.1,.5,gx,12.3,s*5.3).torus(p,OD,1.75,.18,gx,12.7,s*7.8,0,hz,0,0,8,3).box(p,OD,.2,.3,4.6,gx,12.7,s*7.8).box(p,OD,1.3,.4,.4,27.9,9,s*9.6));
    for(let i=0;i<7;i++)B.box(p,OD,.2,7.4,.5,gx,12.3,-4.2+i*1.4);}
  B.both(s=>{B.lathe(p,OD,[[-1.1,.01],[-.9,.75],[-.2,1.2],[.4,1.25]],27.3,12.7,s*7.8,'x',8);B.put(p,new T.CircleGeometry(1.25,B.N(8)),0xbfc4bc,27.71,12.7,s*7.8,0,hz,0);
    B.cyl(p,OD,.45,1,25.6,11.85,s*10.4,'x',6);});
  // the closed cab: its skin through cross-sections, the two-pane windscreen, doors with their stars
  const half=[[8.4,10.6],[16.6,10.6],[21.3,10.1],[22.6,8.9],[23.15,5],[23.3,0]],cowl=[[8.4,10.6],[16.6,10.6],[16.8,10.3],[17,9],[17.1,5],[17.15,0]];
  B.put(p,ddrVehLoft([ddrVehSec(1.2,half,.95,.4),ddrVehSec(2,half),ddrVehSec(11.4,half),ddrVehSec(12.7,cowl)]),O);
  B.put(p,ddrVehFan(ddrVehSec(1.2,half,.95,.4)),O);B.put(p,ddrVehFan(ddrVehSec(12.7,cowl),true),O);
  {const zq=y=>10.6-(y-16.6)*.106+.06,xf=y=>11.6-(y-17.2)*.23;ddrVehBoth(B,gl,ddrVehFan([[3.4,17.2,zq(17.2)],[xf(17.2),17.2,zq(17.2)],[xf(21.2),21.2,zq(21.2)],[3.4,21.2,zq(21.2)]]),GLS);
    ddrVehBoth(B,gl,ddrVehFan([[12.63,17.85,8.1],[12.63,17.85,.45],[11.7,22.2,.45],[11.7,22.2,7.9]]),GLS);
    B.put(gl,ddrVehFan([[1.13,18.6,-4],[1.13,18.6,4],[1.13,21.2,3.8],[1.13,21.2,-3.8]]),GLS);}
  B.box(p,O,.3,4.6,.5,12.1,20.1,0,0,0,.208);
  B.both(s=>B.box(p,OD,.14,8.2,.1,3.1,12.6,s*10.66).box(p,OD,.14,8.2,.1,11.6,12.6,s*10.66).box(p,OD,.6,.25,.3,4.2,15.4,s*10.75).decal('star',4.4,4.4,7.3,12.6,s*10.68,0,s>0?0:Math.PI,0));
  B.tube(p,DK,[11.6,18.2,-10.6],[12.2,19.4,-12.3],.12,.12,3).cyl(p,DK,.8,.2,12.2,19.5,-12.4,'x',8);
  // the steel body: low sides with their ribs, the front panel, the tailgate, benches inside; under the tilt on its bows
  B.box(mt,WD,28.6,.6,24.2,-15.7,12.3,0);B.both(s=>B.box(p,CH,28.6,1.4,1,-15.7,10.5,s*4.4).box(mt,WD,26.4,.4,3,-15.7,15.6,s*10.5));
  for(const x of[-3,-11,-19,-27])B.box(p,CH,.9,.9,23.4,x,11.6,0);
  B.both(s=>{B.box(p,O,28.6,3.9,.4,-15.7,14.5,s*12.2).box(p,OD,28.8,.4,.6,-15.7,16.6,s*12.3).box(p,OD,.3,3.9,.7,-30.05,14.5,s*6);for(const x of[-2.2,-9,-15.7,-22.4,-29.2])B.box(p,OD,.7,3.9,.35,x,14.5,s*12.5);});
  B.box(p,O,.4,5.2,24.2,-1.6,15.2,0).box(p,O,.4,3.9,24.2,-29.8,14.5,0);
  ddrVehTilt(B,[[16.2,12.6],[21.6,12.6],[24.9,11.5],[27,8.7],[28,4.6],[28.3,0]],[-30,-22.85,-15.7,-8.55,-1.4],{col:CV,colIn:CVD,front:1,hoop:OD});
  B.tube(mt,CVD,[-30.4,26.8,-7.6],[-30.4,26.8,7.6],.7,.7,6);
  // the spare standing behind the cab on the left, the tank under the right step, a jerrycan on the left one, the bumperettes and the tow pintle
  ddrVehSpare(B,4.6,2.2,0,14.5,-6.9,'x',O,9);B.box(p,CH,.6,5,.6,0,11.6,-6.9).box(p,OD,7.4,3,3.8,3.6,8.2,9.6).box(p,O,1.7,4.6,3.3,5,8.85,-10.9);
  B.both(s=>B.box(p,OD,1.4,2,3.2,-30.5,8.6,s*6.4).box(p,C.red,.3,.8,.8,-30.1,10.6,s*10.8));B.box(p,CH,1.6,1,1,-30.6,8.6,0);
  // the marks: the number along the bonnet's sides, the ringed star on its top
  B.both(s=>B.decal('usa',9.6,2.4,20.6,13.9,s*(bw(20.6)+.04),0,s>0?.107:Math.PI-.107,0));
  B.decal('starc',7.4,7.4,20,bt(20)+.26,0,-hz,.07,-hz);
  if(L){   // close up: wipers, the tilt's ropes, mud flaps, the propeller shafts, tow shackles
    B.both(s=>{B.box(p,DK,.1,2.2,.14,12,20.9,s*4.2,0,0,.208);for(const x of[-26,-19,-12,-5])B.tube(mt,C.web,[x,16.4,s*12.66],[x+.5,13.4,s*12.6],.1,.1,3);
      B.box(mt,C.rubber,.2,4,4.6,-27.4,5.6,s*9.3).box(p,CH,1.2,.5,1.2,30.2,7.4,s*5.6);});
    B.tube(p,CH,[12,7,0],[-9,5.2,0],.3,.3,5).tube(p,CH,[12,7,1.6],[19.6,5.2,2.2],.28,.28,5);
  }
  return B.geos({lo:.76});
}
// a truck: 'opel' (the Opel Blitz, 62 by 24 by 27) or 'gmc' (the GMC CCKW, 60 by 25 by 28). One Group, nothing in it moves
function ddrVehTruck(kind,lod){
  const k=kind==='gmc'?'gmc':'opel',M=ddrModel('vehtruck|'+k+'|'+(lod||0),()=>({body:(k==='gmc'&&typeof ddrVehGMCGeos==='function'?ddrVehGMCGeos:ddrVehOpelGeos)(lod||0)}));
  const g=ddrPart(M.body);g.userData.real=true;return g;
}

/* ---------- the cars ---------- */
// a box seen from inside (a cab's dark inside behind windows with no glass left)
function ddrVehRoom(w,h,d){
  const g=new THREE.BoxGeometry(w,h,d),ix=g.index.array,n=g.attributes.normal.array;
  for(let i=0;i<ix.length;i+=3){const t=ix[i+1];ix[i+1]=ix[i+2];ix[i+2]=t;}for(let i=0;i<n.length;i++)n[i]=-n[i];return g;
}
/* the Kübelwagen (VW Typ 82), their light car: 37 long and 16 wide, life size. Flat ribbed panels, the nose sloping down under the spare wheel, angular
   mudguards with the headlamps on them, four doors, the screen that folds, the hood folded behind the back seat, the silencer across the tail.
   W: burnt out. No canvas or glass, the screen fallen forward on the spare, the back seat's left door hanging, the engine's lid thrown up, seats down to
   their frames, the left tyres gone to the rims so it leans that way. */
function ddrVehKubelGeos(W,lod,S){
  const T=THREE,B=ddrB(lod),L=B.lod,C=DDRC,p='paint',mt=ddrVehCloth(),hz=Math.PI/2,gl=L?'glass':p;
  const G=W?0xa8683c:C.gelb,GA=W?0xb8b0a0:C.gelb,GS=W?0x6a6258:C.gelb,GD=W?0x5a4a3a:C.gelbD,DK=0x24221d,SE=0x3a3d34,CV=0x77755a,GLS=0x1d282e;
  // the tub: flat panels through seven cross-sections [x, half width, top, sill, bottom], open over the seats
  const RS=[[-18.7,6.2,7,4.6,4],[-18.3,6.6,7.5,4.4,3.6],[-9,7,9.6,4.4,3.2],[-1.4,7,9.6,4.4,3.2],[6.5,7,9.6,4.4,3.2],[18.3,4.8,6.5,4.2,3.4],[18.7,4.5,6.1,4.3,3.7]];
  const rws=RS.map(([x,w,t,s,b])=>[[x,b,w],[x,s,w],[x,t,w],[x,t,-w],[x,s,-w],[x,b,-w]]),nw=x=>7-(x-6.5)*.1864;
  B.put(p,ddrVehLoft(rws.slice(0,3),{flat:1,skip:(i,j)=>W&&j===2&&i===1}),GS);
  B.put(p,ddrVehLoft(rws.slice(2,5),{flat:1,skip:(i,j)=>j===2||(W&&j===3&&i===0)}),G);
  B.put(p,ddrVehLoft(rws.slice(4),{flat:1}),GA);
  B.put(p,ddrVehFan(rws[0]),GS);B.put(p,ddrVehFan(rws[6],true),GA);
  B.put(p,ddrVehLoft(RS.map(([x,w,t,s,b])=>[[x,b,-w],[x,b,w]])),DK);
  {const wi=6.7,isec=x=>[[x,9.6,wi],[x,4.1,wi],[x,4.1,-wi],[x,9.6,-wi]];   // the inside of the tub
    B.put(p,ddrVehLoft([isec(-8.7),isec(-1.4),isec(6.2)],{flat:1,skip:(i,j)=>W&&j===2&&i===0}),GD);B.put(p,ddrVehFan(isec(6.2),true),GD);B.put(p,ddrVehFan(isec(-8.7)),GD);}
  // the mudguards: flat plates, a lip down their outer edge
  {const rf=[[7,4.4],[9.8,7.3],[16.9,7.3],[18.3,4.6]].map(([x,y])=>[[x,y-.7,8.05],[x,y,8],[x,y,nw(x)-.1]]),rr=[[-18.2,5],[-15.8,7.5],[-8,7.5],[-5.4,4.4]].map(([x,y])=>[[x,y-.7,8.05],[x,y,8],[x,y,6.5]]);
    for(const rw of[rf,rr]){ddrVehBoth(B,p,ddrVehLoft(rw,{flat:1}),rw===rf?GA:GS);ddrVehBoth(B,p,ddrVehLoft(rw,{flat:1,flip:1}),DK);}}
  // wheels (the burnt one's left tyres gone), the axles
  B.both(s=>{for(const x of[12.6,-11.4])ddrVehWheel(B,x,3.35,s*6.9,s,W&&s<0?{r:2,w:1.3,col:GD,n:8,bare:1}:{r:3.35,w:1.4,col:G,n:9});});
  B.tube(p,DK,[12.6,3.1,-6.2],[12.6,3.1,6.2],.4,.4,5).tube(p,DK,[-11.4,3.35,-6.2],[-11.4,3.35,6.2],.35,.35,5);
  // the ribs pressed along the doors and the nose, the doors' edges and top rails
  B.both(s=>{for(const[xc,ln,rear]of[[2.45,7.3,0],[-5.2,7,1]]){if(W&&s<0&&rear)continue;for(const y of[5.6,6.9,8.2])B.box(p,GD,ln,.22,.14,xc,y,s*7.05);B.box(p,GD,ln+.5,.25,.5,xc,9.62,s*6.85);}
    B.box(p,GD,10.8,.22,.14,12.4,5.4,s*(nw(12.4)+.05),0,s*.186,0);for(const x of[6.3,-1.4,-9])B.box(p,DK,.14,5.2,.1,x,7,s*7.03);});
  B.box(p,GD,.5,.25,13.4,-8.85,9.62,0);
  if(W){const f=ddrVehAt(-1.4,4.3,-7.05,Math.PI-1.1,-.09),bx=(c,w,h,d,a,b,e)=>{const q=f(a,b,e);B.box(p,c,w,h,d,q[0],q[1],q[2],0,Math.PI-1.1,-.09);};   // the door hanging open
    bx(GA,7,5.2,.3,3.5,2.6,0);for(const y of[1.3,2.6,3.9])bx(GD,6.6,.22,.14,3.5,y,.2);}
  // the engine's deck: louvres, or the lid thrown up over the engine
  if(W){B.box(p,GS,7.6,.25,9.6,-13.1,12,0,0,0,-.78).box(p,DK,5.4,3,6.4,-14,5.6,0);}
  else for(let i=0;i<4;i++)B.box(p,DK,.3,.12,7,-12.6-i*1.1,8.82-i*.248,0,0,0,.222);
  // the windscreen in its frame (the burnt one's folded forward onto the spare)
  {const rz=W?-1.45:.22,ry=W?.07:0,f=ddrVehAt(6.25,9.8,0,ry,rz),bx=(w,h,d,a,b,e)=>{const q=f(a,b,e);B.box(p,W?GS:GD,w,h,d,q[0],q[1],q[2],0,ry,rz);};
    bx(.3,.3,13.4,0,0,0);bx(.3,.3,13.4,0,5.2,0);bx(.3,5.2,.3,0,2.6,6.55);bx(.3,5.2,.3,0,2.6,-6.55);
    if(!W){const q=[f(.02,.2,6.35),f(.02,.2,-6.35),f(.02,5,-6.35),f(.02,5,6.35)];B.put(gl,ddrVehFan(q),GLS);B.put(gl,ddrVehFan(q,true),GLS);}}
  // seats (bare frames in the burnt one), the wheel on its column
  {const seat=(x,z,wd)=>{if(W){B.box(p,DK,3.6,.2,wd,x+1.8,6,z).box(p,DK,.2,.2,wd,x-.55,10.2,z);B.both(s=>B.box(p,DK,.2,4,.2,x-.3,8.2,z+s*wd*.46,0,0,.12));}
      else B.box(mt,SE,3.8,.8,wd,x+1.8,6.3,z).box(mt,SE,.7,4.2,wd,x-.2,8.6,z,0,0,.12);};
    seat(-.6,3.4,4.6);seat(-.6,-3.4,4.6);seat(-7.9,0,12.6);}
  B.tube(p,DK,[5.9,8.5,-3.4],[3.7,10.1,-3.4],.15,.15,4);{const g=new T.TorusGeometry(1.7,.16,3,B.N(8));g.rotateY(hz);B.put(p,g,DK,3.6,10.2,-3.4,0,0,-.628);}
  // the hood folded behind the back seat (its bare bows in the burnt one)
  if(W){for(const x of[-9.6,-10.4,-11.1])B.tube(p,DK,[x,9.9+(x+11.1)*.3,-6.6],[x,9.9+(x+11.1)*.3,6.6],.14,.14,3);B.both(s=>B.tube(p,DK,[-10.2,9.8,s*6.7],[-6.2,12.6,s*6.9],.14,.14,3));}
  else{B.ball(mt,CV,1,-10.7,10.25,0,2.1,1.2,6.9,6);B.both(s=>B.box(mt,SE,4.4,.2,.5,-10.7,11.3,s*3.6).tube(p,DK,[-9.6,9.8,s*6.8],[-4.4,10,s*6.9],.14,.14,3));}
  // the spare on the nose, the headlamps on the mudguards, the blackout lamp, the silencer across the tail with its two pipes
  ddrVehSpare(B,3.35,1.4,12.8,8.75,0,null,W?GD:G,9,[0,0,-.257],W);
  B.both(s=>{B.lathe(p,GD,[[-.8,.01],[-.6,.55],[-.1,.82],[.35,.85]],15.4,8.35,s*6.5,'x',6);B.put(p,new T.CircleGeometry(.85,B.N(6)),DK,15.76,8.35,s*6.5,0,hz,0);
    if(!W)B.box(p,0xcfc7a0,.04,.12,.9,15.79,8.35,s*6.5);B.tube(p,DK,[-18.3,3.5,s*3.2],[-19.4,3.3,s*3.2],.22,.22,4);});
  B.lathe(p,GD,[[0,.25],[.4,.55],[.75,.55],[1,.3]],17.3,6.55,-6.4,'y',6).cyl(p,DK,.8,8,-18.1,3.6,0,'z',6);
  if(!W)B.decal('wh',4.4,1.1,18.74,5.15,0,0,hz,0).decal('wh',4.4,1.1,-18.74,5.9,-2.6,0,-hz,0);
  if(L&&!W){   // close up: door handles, the spade on the nose's left side, the tow hook, the rear lamps
    B.both(s=>{for(const x of[5.2,-2.4])B.box(p,DK,.7,.2,.25,x,8.9,s*7.12);B.box(p,C.red,.2,.5,.5,-18.75,6.3,s*5);});
    B.tube(p,C.wood,[9,6.9,-6.6],[15,5.4,-5.5],.16,.16,5).box(p,DK,1.9,1.5,.12,15.8,5.1,-5.3,0,-.186,0).box(p,DK,.9,.5,.5,19,3.9,0);
  }
  const out=B.geos({lo:.78});
  if(W)for(const k in out){out[k].translate(0,0,-6.9);out[k].rotateX(-.097);out[k].translate(0,0,6.9);}   // down on its left rims
  if(S&&S!==1)for(const k in out)out[k].scale(S,S,S);
  return out;
}
/* a small civilian lorry, 36 long and 18 wide: the French one-tonner of the thirties every village had. A tall narrow bonnet behind an upright radiator,
   sweeping black mudguards with the lamps on a bar between them, a square cab, a wooden bed with low sides.
   W: burnt out. No glass (the cab hollow under its sagging roof), the driver's door hanging, one side of the bonnet up, most of the bed's boards gone,
   the front tyres down to the rims so its nose is down. */
function ddrVehLorryGeos(W,lod){
  const T=THREE,B=ddrB(lod),L=B.lod,C=DDRC,p='paint',mt=ddrVehCloth(),hz=Math.PI/2,gl=L?'glass':p;
  const BL=W?0xa8683c:0x5f7482,BL2=W?0xb8b0a0:0x56697a,BD=W?0x5a4a3a:0x44535f,FK=W?0x6a6258:0x23262a,CH=0x2c2c28,DK=0x1c1c1a,SOOT=0x15120f,GLS=0x1d282e,WD=W?0x3a332b:0x86724f,WD2=W?0x4a4034:0x786645;
  // the frame, the axles on their springs, the wheels (the burnt one's front tyres gone)
  B.both(s=>{B.box(p,CH,33,1.1,.7,-.8,6,s*3.4).box(p,CH,7,.4,.7,12.2,4.9,s*3.4).box(p,CH,8,.5,.7,-9.5,5,s*3.6);
    ddrVehWheel(B,12.2,3.6,s*7.2,s,W?{r:2.16,w:1.5,col:BD,n:8,bare:1}:{r:3.6,w:1.7,col:FK,n:9});ddrVehWheel(B,-9.5,3.6,s*7.3,s,{r:3.6,w:1.7,col:FK,n:9});});
  B.tube(p,CH,[12.2,3.6,-6.6],[12.2,3.6,6.6],.4,.4,5).tube(p,CH,[-9.5,3.6,-6.6],[-9.5,3.6,6.6],.45,.45,5).ball(p,CH,1.3,-9.5,3.6,0,1.1,1,1,6);
  // the bumper, the sweeping mudguards and the running boards
  B.box(p,FK,.4,.9,15.6,17.8,4.6,0);B.both(s=>B.box(p,CH,1.6,.4,.5,17,4.9,s*3.4).box(p,FK,6.4,.4,2,4.3,4.4,s*7.7));
  {const rows=[[7.6,4.4],[8.3,5.6],[9.4,7],[10.6,7.8],[12.2,8.2],[13.8,7.9],[15.2,7.1],[16.6,5.8],[17.3,4.6]].map(([x,y])=>[[x,y-1.2,8.7],[x,y-.3,8.5],[x,y+.35,6.2],[x,y+.05,3.4]]);
    ddrVehBoth(B,p,ddrVehLoft(rows),FK);ddrVehBoth(B,p,ddrVehLoft(rows,{flip:1}),DK);}
  // the bonnet (the burnt one's right half up, the engine under it), louvres down its sides, the radiator in its shell
  const bw=x=>4.7-(x-8.4)*.13,bt=x=>12.7-(x-8.4)*.07;
  const bsec=x=>{const w=bw(x),t=bt(x);return[[x,6.6,w],[x,t-1.2,w],[x,t-.35,w-.6],[x,t,w*.5],[x,t+.1,0],[x,t,-w*.5],[x,t-.35,-w+.6],[x,t-1.2,-w],[x,6.6,-w]];};
  B.put(p,ddrVehLoft([bsec(8.4),bsec(12.5),bsec(16.6)],{skip:(i,j)=>W&&j>=1&&j<=3}),BL);B.put(p,ddrVehFan(bsec(16.6),true),BL);
  if(W)B.box(p,BL2,8,.2,4.6,12.5,14.2,1.5,-.9,0,0).box(p,DK,6,3.4,3.6,12.4,8.6,0);
  B.box(p,DK,.12,4.5,5.2,16.68,9.3,0).cyl(p,BD,.3,.5,16.1,12.5,0,'y',5);for(let i=0;i<5;i++)B.box(p,BD,.14,4.5,.16,16.74,9.3,-2+i);
  B.both(s=>{for(let i=0;i<4;i++){const x=9.8+i*1.5;B.box(p,DK,.22,2.6,.1,x,9.5,s*(bw(x)+.02),0,s*.13,0);}});
  // the lamps on their bar in front of the radiator
  B.tube(p,FK,[15.3,8.5,-5.6],[15.3,8.5,5.6],.15,.15,4);
  B.both(s=>{B.lathe(p,FK,[[-.9,.01],[-.7,.6],[-.2,.92],[.3,.95]],15.5,9.4,s*5.4,'x',7);B.put(p,new T.CircleGeometry(.95,B.N(7)),W?SOOT:0xc4c8c0,15.81,9.4,s*5.4,0,hz,0);});
  // the cab: its skin through cross-sections. Burnt, the windows and the driver's doorway are holes into a dark inside and the roof sags
  const half=[[5.6,7.8],[12.6,7.8],[16.9,7.5],[17.9,6.6],[18.35,3.5],[18.45,0]],cowl=[[5.6,7.8],[12.2,7.8],[12.5,7.4],[12.65,6.4],[12.7,3.5],[12.72,0]],S=(x,h,k,d)=>ddrVehSec(x,h,k,d,12.65);
  if(W){B.put(p,ddrVehLoft([S(.8,half,.95,.4),S(1.5,half),S(4.6,half,1,.9),S(7.7,half),S(8.5,cowl)],{skip:(i,j)=>((i===1||i===2)&&(j===1||j===8||j===9))||(i===3&&j>=1&&j<=8)}),BL);
    B.put(p,ddrVehRoom(6.3,11.2,15.2),SOOT,4.6,11.3,0).box(p,DK,1.8,2.2,13,2.8,8.6,0);B.both(s=>B.tube(p,BD,[8.45,12.4,s*7.45],[7.72,16.95,s*7.5],.3,.3,4));
    const a=.95,f=ddrVehAt(7.6,5.8,-7.8,Math.PI-a,-.07),bx=(c,w,h,d,x,y)=>{const q=f(x,y,0);B.box(p,c,w,h,d,q[0],q[1],q[2],0,Math.PI-a,-.07);};
    bx(BL2,5.7,6.8,.3,2.85,3.4);bx(BD,5.7,.3,.3,2.85,10.9);bx(BD,.3,4.1,.3,.15,8.85);bx(BD,.3,4.1,.3,5.55,8.85);}
  else{B.put(p,ddrVehLoft([S(.8,half,.95,.4),S(1.5,half),S(7.7,half),S(8.5,cowl)]),BL);
    const zq=y=>7.8-(y-12.6)*.07+.05,xf=y=>7.5-(y-13)*.12;ddrVehBoth(B,gl,ddrVehFan([[2.2,13,zq(13)],[xf(13),13,zq(13)],[xf(16.6),16.6,zq(16.6)],[2.2,16.6,zq(16.6)]]),GLS);
    ddrVehBoth(B,gl,ddrVehFan([[8.5,13.3,6.2],[8.5,13.3,.3],[7.96,17.2,.3],[7.96,17.2,6]]),GLS);
    B.both(s=>B.box(p,BD,.12,6.6,.1,1.9,9.2,s*7.84).box(p,BD,.12,6.6,.1,7.6,9.2,s*7.84).box(p,DK,.5,.2,.25,2.6,11.6,s*7.92));B.box(p,BL,.25,4.2,.4,8.2,15.3,0,0,0,.16);}
  B.put(p,ddrVehFan(S(.8,half,.95,.4)),BL2);B.put(p,ddrVehFan(S(8.5,cowl),true),BL);
  B.put(gl,ddrVehFan([[.73,13.6,-3],[.73,13.6,3],[.73,16,2.8],[.73,16,-2.8]]),W?SOOT:GLS);
  if(W){B.tube(p,DK,[7.6,11.4,-3.6],[6,12.6,-3.6],.14,.14,4);const g=new T.TorusGeometry(1.5,.15,3,B.N(8));g.rotateY(hz);B.put(p,g,DK,5.9,12.7,-3.6,0,0,-.64);}
  // the bed: boards on bearers, two boards a side between iron stakes, the headboard, the tailgate (most of it burnt away in the wreck)
  for(const x of[-2,-7.5,-13,-17.2])B.box(p,CH,.8,1.2,16.8,x,7.2,0);
  for(let i=0;i<8;i++){const z=-7.7+i*2.2;if(W&&(i===1||i===2||i===5||i===6))continue;if(W&&i===4){B.box(mt,WD,12,.4,2,-6,7.6,z,0,.1,-.12);continue;}B.box(mt,i%3?WD:WD2,18.4,.4,2.12,-8.9,8.15,z);}
  B.box(mt,WD2,.4,5.4,17.6,.1,11.1,0).box(p,FK,.5,.3,18,.1,13.9,0);
  B.both(s=>{for(const x of[-.4,-8.9,-17.6])B.box(p,FK,.4,3.6,.25,x,10.1,s*9.05);if(W&&s<0)return;B.box(mt,WD,18.2,1.5,.4,-8.9,9.2,s*8.8);if(!W)B.box(mt,WD2,18.2,1.5,.4,-8.9,10.8,s*8.8);});
  if(W)B.box(mt,WD,.4,3.2,17.4,-18.25,6.5,0,0,0,.12);else B.box(mt,WD,.4,1.5,17.6,-17.95,9.2,0).box(mt,WD2,.4,1.5,17.6,-17.95,10.8,0);
  {const rows=[];for(let i=0;i<=5;i++){const a=(20+i*28)*Math.PI/180,x=-9.5+Math.cos(a)*4.5,y=3.6+Math.sin(a)*4.5;rows.push([[x,y,5.8],[x,y,8.8]]);}
    ddrVehBoth(B,p,ddrVehLoft(rows),FK);ddrVehBoth(B,p,ddrVehLoft(rows,{flip:1}),DK);}
  if(!W){B.box(mt,0x9a7c50,4.6,3,4.2,-4,9.9,3.6,0,.2,0).box(mt,0x86693f,3.6,2.4,3.6,-5.2,9.6,-3.4,0,-.12,0).box(p,C.red,.3,.6,.6,-18.1,7.4,-7.6);   // two crates aboard
    if(L)B.both(s=>B.box(p,DK,.1,1.8,.12,8.05,16.2,s*3,0,0,.16));}
  const out=B.geos({lo:.78});
  if(W)for(const k in out){out[k].translate(9.5,0,0);out[k].rotateZ(-.066);out[k].translate(-9.5,0,0);}   // nose down on its front rims
  return out;
}
// a car: 'kubel' (the Kübelwagen: 37.4 by 16 at life size, drawn at S, 1.08 unless given: 40 by 17.4) or 'lorry' (a small civilian lorry, 36 by 18).
// burnt: built as a burnt-out wreck (draw it with ddrBurn)
function ddrVehCar(kind,burnt,lod,S){
  const k=kind==='lorry'?'lorry':'kubel';S=k==='kubel'?(S||1.08):1;
  const M=ddrModel('vehcar|'+k+'|'+(burnt?1:0)+'|'+(lod||0)+'|'+S,()=>({body:k==='lorry'?ddrVehLorryGeos(!!burnt,lod||0):ddrVehKubelGeos(!!burnt,lod||0,S)}));
  const g=ddrPart(M.body);g.userData.real=true;return g;
}

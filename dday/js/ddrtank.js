"use strict";
/* D-Day, Version 246 (a draft, behind ddReal()): the tanks. See js/ddreal.js for the kit and tools/real/GUIDE.md for the rules.

   ddrTank(kind,o)      a live tank, {g,tur,mats} as ddground.js's ddgTank gave: 'panzer' a Panzer IV Ausf. H as in Normandy in 1944, 'sherman' an M4.
                        o: a number (the lod) or {lod, gun (the Panzer's muzzle ahead of the turret's middle: DDR_TK.gun, 50, if not given)}.
                        g.userData: tur, muzzle (where the gun ends, in the turret's own frame), roll(dist) (the tracks run), hull and top (the two parts).
   ddrTankWreck(kind,o) a knocked-out one that never moves: 'sherman' the beach's, 'panzer' the village's. One Group, the origin on the ground at its middle.
   ddrTankBurn(K)       a live tank K (K.g, K.tur) knocked out: burnt paint, its hatches thrown open, the gun dropped, a scorch under it.
   The first tank of a kind takes a moment to make (its shapes and its paint's picture): call ddrTank('panzer') once while a chapter is built and the
   ones that arrive in the battle cost nothing.

   How they're made (all with the kit's builder):
   - Every tank is two builders, the hull and the turret (the turret turns). Each comes out as the paint's mesh, the tracks' mesh (hull only) and the
     marks' mesh: five draw calls a tank.
   - The paint is one picture a scheme (ddrTankPaint: the Panzer's dunkelgelb with sprayed olive green and red-brown, the same burnt out, olive drab, olive
     drab sooted), laid on by view (ddrTankLay): each triangle reads the side view, the top view or the end view of the tank by the way it faces, so dust
     can lie low on the sides, runs go down them and soot sits on the deck. The patches are balls in the tank's own space, so one runs on over an edge.
   - Parts that aren't painted in the scheme (tyres, gun steel, tools' hafts, the muffler's rust) go in under the key 'ddrTankFlat' in their own colours
     and are joined into the paint's mesh, reading one plain patch of the picture (ddrTankFin): no extra draw call.
   - The tracks are one belt a side round the wheels (ddrTankBelt) with their own picture of links; roll(dist) slides it along. */
const DDR_TK={T:80,tex:{},
  gun:50,               // the Panzer's muzzle, ahead of the turret's middle
  ring:[.5,19.2,0],     // where its turret sits on the hull
  ringS:[2.5,19.9,0]};  // the Sherman's
// colours: w.. what the scheme's parts are multiplied by (plates that don't quite match), the rest as they should look
const DDR_TKC={w:0xffffff,w2:0xf1ede3,w3:0xe3ddcf,w4:0xd2ccbe,
  rub:0x2b2a28,rubD:0x1d1d1c,st:0x3c3d3e,stD:0x262728,stL:0x62625f,trk:0x4b4640,rust:0x6c4831,rustD:0x4c3628,rustL:0x8c5c38,
  wood:0x7d5d38,woodD:0x5e4428,blk:0x121212,gls:0x1b2523,gelb:0xb39a60,gelbD:0x97804c,feld:0x4e574a,od:0x5a6038,cable:0x38332e,lamp:0xd2ccaa,ash:0x8e8a82,canvas:0x7d7a56};

/* ---------- pictures ---------- */
// noise in three dimensions, 0..1 (smooth between a lattice of random numbers)
function ddrTankNoise(seed){
  const r=rng(seed),P=new Uint8Array(512),V=new Float32Array(256);for(let i=0;i<256;i++){P[i]=i;V[i]=r();}
  for(let i=255;i>0;i--){const j=(r()*(i+1))|0,t=P[i];P[i]=P[j];P[j]=t;}for(let i=0;i<256;i++)P[i+256]=P[i];
  const f=t=>t*t*(3-2*t),l=(p,q,t)=>p+(q-p)*t;
  return(x,y,z)=>{const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),u=f(x-X),v=f(y-Y),w=f(z-Z),a=X&255,b=Y&255,c=Z&255;
    const h=(i,j,k)=>V[P[P[P[(a+i)&255]+((b+j)&255)]+((c+k)&255)]];
    return l(l(l(h(0,0,0),h(1,0,0),u),l(h(0,1,0),h(1,1,0),u),v),l(l(h(0,0,1),h(1,0,1),u),l(h(0,1,1),h(1,1,1),u),v),w);};
}
/* The paint. The picture covers T (80) units of tank: across it x from -40 to 40; its lower two fifths the side view (y from the ground up), which
   the ends read too; above that the top view (z either side of the picture's row .7); its top left corner one plain patch for the flat-coloured parts.
   k: 'camo' the Panzer, 'char' the Panzer burnt out, 'od' olive drab, 'odw' olive drab sooted (the wreck on the beach). */
function ddrTankPaint(k){
  const TX=DDR_TK.tex;if(TX[k])return TX[k];
  const big=k==='camo',S=big?1024:512,LR=big?256:128,T=DDR_TK.T,r=rng({camo:7411,char:7417,od:7423,odw:7431}[k]||7411),n1=ddrTankNoise(7451),n2=ddrTankNoise(7459),n3=ddrTankNoise(7477);
  const pz=k==='camo'||k==='char',burnt=k==='char',soot=k==='odw';
  return TX[k]=ddrCanvas(S,S,(q,W,H)=>{
    // 1. the colours, small (drawn up to size they come out soft-edged, as sprayed)
    const lc=document.createElement('canvas');lc.width=lc.height=LR;const lq=lc.getContext('2d'),im=lq.createImageData(LR,LR),D=im.data;
    const fld=[new Float32Array(LR*LR).fill(-99),new Float32Array(LR*LR).fill(-99)];
    if(pz){const rr=rng(7489),M=2.6;
      // a patch is a chain of balls, as a spray gun's pass; each ball marks the pixels of both views it reaches
      const mark=(F,cx,cy,cz,R)=>{const ro=R+M,i0=Math.floor((cx-ro+40)/T*LR),i1=Math.ceil((cx+ro+40)/T*LR);
        const put=(j0,j1,side)=>{for(let j=Math.max(0,j0);j<=Math.min(LR-1,j1);j++){const v=1-(j+.5)/LR;if(side!==(v<.42))continue;
          for(let i=i0;i<=i1;i++){const x=(i+.5)/LR*T-40,y=side?v*T:20,z=side?16:(v-.7)*T,d=Math.hypot(x-cx,y-cy,z-cz),o=j*LR+((i%LR)+LR)%LR;if(R-d>F[o])F[o]=R-d;}}};
        if(Math.abs(16-cz)<ro)put(Math.floor((1-(cy+ro)/T)*LR),Math.ceil((1-(cy-ro)/T)*LR),true);
        if(Math.abs(20-cy)<ro)put(Math.floor((1-(.7+(cz+ro)/T))*LR),Math.ceil((1-(.7+(cz-ro)/T))*LR),false);};
      for(let c=0;c<2;c++)for(let n=0;n<(c?13:16);n++){let x=rr()*80-40,y=7+rr()*25,z=rr()*46-23,a=rr()*6.28,e=(rr()-.5)*.9;const m=4+((rr()*5)|0);
        for(let s=0;s<m;s++){mark(fld[c],x,y,z,3.2+rr()*3.4);x+=Math.cos(a)*Math.cos(e)*4.4;z+=Math.sin(a)*Math.cos(e)*4.4;y+=Math.sin(e)*4.4;a+=(rr()-.5)*1.2;e+=(rr()-.5)*.6;}}}
    for(let j=0;j<LR;j++)for(let i=0;i<LR;i++){const u=(i+.5)/LR,v=1-(j+.5)/LR,side=v<.42,x=u*T-40,y=side?v*T:20,z=side?16:(v-.7)*T,o=j*LR+i;
      const mo=1+(n1(x*.06+7,y*.06,z*.06)-.5)*.2+(n1(x*.3,y*.3,z*.3+9)-.5)*.08;let R,G,B;
      if(pz){R=178*mo;G=157*mo;B=103*mo;
        let a=clamp((fld[0][o]+(n2(x*.2,y*.2,z*.2)-.5)*4)/1.2+.5,0,1);a=a*a*(3-2*a)*.95;R+=(80*mo-R)*a;G+=(90*mo-G)*a;B+=(54*mo-B)*a;
        a=clamp((fld[1][o]+(n3(x*.2,y*.2,z*.2)-.5)*4)/1.2+.5,0,1);a=a*a*(3-2*a)*.95;R+=(102*mo-R)*a;G+=(63*mo-G)*a;B+=(42*mo-B)*a;}
      else{R=90*mo;G=97*mo;B=56*mo;}
      if(burnt){   // the paint scorched dark and grey, rust coming through, soot, ash where it burnt right off
        const g=(R+G+B)/3,ru=clamp((n2(x*.11+3,y*.11,z*.11)+.4*n3(x*.45,y*.45,z*.45)-.6)*3.6,0,1),so=clamp((n3(x*.07,y*.07+5,z*.07)-.4)*3,0,1),ash=clamp((n1(x*.5+2,y*.5,z*.5)-.7)*5,0,1);
        R=R*.36+g*.2+20;G=G*.31+g*.2+16;B=B*.27+g*.2+14;
        R+=(122-R)*ru*.8;G+=(76-G)*ru*.8;B+=(50-B)*ru*.8;R+=(42-R)*so*.84;G+=(39-G)*so*.84;B+=(37-B)*so*.84;R+=(146-R)*ash*.5;G+=(140-G)*ash*.5;B+=(132-B)*ash*.5;}
      if(soot){    // olive drab under soot: thickest over the deck and the turret, rust where the fire took the paint
        const up=side?clamp((y-8)/12,0,1):1,so=clamp((n3(x*.055,y*.055+5,z*.055)+.3*n2(x*.3,y*.3,z*.3)-.55+up*.3)*2.6,0,1),ru=clamp((n2(x*.12+3,y*.12,z*.12)+.4*n3(x*.45,y*.45,z*.45)-.93)*5,0,1)*so,gy=clamp((n1(x*.16+4,y*.16,z*.16)-.5)*4,0,1)*so;
        R+=(38-R)*so*.9;G+=(37-G)*so*.9;B+=(35-B)*so*.9;R+=(104-R)*gy*.4;G+=(98-G)*gy*.4;B+=(90-B)*gy*.4;R+=(112-R)*ru*.8;G+=(68-G)*ru*.8;B+=(44-B)*ru*.8;}
      const p=o*4;D[p]=R;D[p+1]=G;D[p+2]=B;D[p+3]=255;}
    lq.putImageData(im,0,0);q.imageSmoothingEnabled=true;q.drawImage(lc,0,0,W,H);
    // 2. wear at full size. sx, sy: the side view's place for a point of the tank; tz: the top view's row
    const px=W/T,sx=x=>(x+40)*px,sy=y=>H-y*px,tz=z=>H-(.7*T+z)*px,dk=burnt||soot;
    for(let i=0;i<S*7;i++){q.fillStyle=`rgba(${r()<.55?'24,20,16':'226,214,186'},${.03+r()*.06})`;q.fillRect(r()*W,r()*H,1+r()*1.8,1+r()*1.8);}
    // dust lying low on the sides and ends (dried mud lower still), thrown up in blotches
    const du=k==='camo'?1:burnt?.66:soot?.62:.5;let g=q.createLinearGradient(0,sy(14),0,sy(0));g.addColorStop(0,'rgba(170,152,116,0)');g.addColorStop(.45,`rgba(170,152,116,${.34*du})`);g.addColorStop(1,`rgba(158,138,102,${.74*du})`);q.fillStyle=g;q.fillRect(0,sy(14),W,sy(0)-sy(14));
    for(let i=0;i<70;i++){const x=r()*W,y=sy(r()*r()*11),R=(1.5+r()*3.5)*px;g=q.createRadialGradient(x,y,1,x,y,R);g.addColorStop(0,`rgba(${r()<.3?'112,94,66':'178,160,124'},${(.2+r()*.25)*du})`);g.addColorStop(1,'rgba(170,150,112,0)');q.fillStyle=g;q.fillRect(x-R,y-R,R*2,R*2);}
    // runs down the sides: rain's dirt, rust
    for(let i=0;i<190;i++){const x=r()*W,y=sy(9+r()*23),l=(1.5+r()*6)*px,w=1+r()*2.2,lt=r()<.3;g=q.createLinearGradient(0,y,0,y+l);const c=lt?'198,184,150':burnt?'96,52,28':'46,36,26',a=.1+r()*.16;
      g.addColorStop(0,`rgba(${c},${a})`);g.addColorStop(1,`rgba(${c},0)`);q.fillStyle=g;q.fillRect(x,y,w,l);}
    // the deck: scuffs, oil and soot over the engine (the back of the top view)
    for(let i=0;i<60;i++){const x=sx(-28+r()*14),y=tz(r()*26-13),R=(1+r()*3)*px;g=q.createRadialGradient(x,y,1,x,y,R);g.addColorStop(0,`rgba(26,24,21,${.14+r()*.2})`);g.addColorStop(1,'rgba(26,24,21,0)');q.fillStyle=g;q.fillRect(x-R,y-R,R*2,R*2);}
    for(let i=0;i<110;i++){const x=r()*W,y=tz(r()*44-22),a=r()*6.28,l=(.5+r()*2.5)*px;q.strokeStyle=`rgba(${r()<.6?'40,34,28':'214,202,172'},${.08+r()*.14})`;q.lineWidth=.6+r()*1.2;q.beginPath();q.moveTo(x,y);q.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);q.stroke();}
    // paint chipped off to the primer along the plates' edges, and anywhere boots and branches reach
    const chip=(x0,y0,x1,y1,n,sp)=>{const len=Math.hypot(x1-x0,y1-y0)||1;for(let c=0;c<n/9;c++){const t0=r(),m=2+r()*r()*12;for(let i=0;i<m;i++){const t=t0+(r()-.5)*1.6*px/len,x=x0+(x1-x0)*t+(r()-.5)*sp*px,y=y0+(y1-y0)*t+(r()-.5)*sp*px;q.fillStyle=r()<.7?`rgba(74,46,36,${.3+r()*.45})`:`rgba(40,38,36,${.3+r()*.45})`;q.fillRect(x,y,1+r()*2.8,1+r()*2);}}};
    if(pz){chip(sx(-29),sy(19),sx(19),sy(19),260,.5);chip(sx(-28),sy(18.2),sx(30),sy(18.2),300,.6);chip(sx(-28),sy(6.4),sx(30),sy(6.4),300,.7);chip(sx(-32),sy(12.6),sx(32),sy(12.6),200,.5);
      for(let k=0;k<6;k++)chip(sx(30-k*11.65),sy(6.2),sx(30-k*11.65),sy(18.2),70,.5);
      chip(sx(-19),sy(26.5),sx(11),sy(26.5),200,.6);chip(sx(-19),sy(20.2),sx(11),sy(20.2),160,.5);
      for(const z of[-15,15]){chip(sx(-27),tz(z),sx(19),tz(z),220,.6);}chip(sx(19.2),tz(-15),sx(19.2),tz(15),120,.6);chip(sx(-14),tz(-15),sx(-14),tz(15),90,.5);
      for(const z of[-8.4,8.4])chip(sx(-9),tz(z),sx(11),tz(z),90,.5);}
    else{chip(sx(-30),sy(19.6),sx(18),sy(19.6),240,.6);chip(sx(-30),sy(11.6),sx(30),sy(11.6),240,.6);for(const z of[-16,16])chip(sx(-30),tz(z),sx(18),tz(z),200,.6);}
    for(let i=0;i<(dk?500:260);i++){const x=r()*W,y=r()*H;q.fillStyle=burnt?`rgba(${r()<.5?'150,84,44':'30,27,25'},${.3+r()*.4})`:`rgba(70,44,34,${.3+r()*.4})`;q.fillRect(x,y,1+r()*3,1+r()*2.4);}
    // 3. the plain patch the flat-coloured parts read (ddrTankFin)
    q.fillStyle=burnt?'#a89a8c':soot?'#b4aca0':'#ffffff';q.fillRect(0,0,Math.round(W*.0235),Math.round(H*.0215));
  },true);
}
// the tracks' links, four to the picture: its upper part their outer faces, then their ends, then their inner faces. k: 'trk' the Panzer's, 'trkus' the
// Sherman's rubber blocks, a 'w' on the end rusted
function ddrTankTrkPic(k){
  const TX=DDR_TK.tex;if(TX[k])return TX[k];const us=k.indexOf('us')>0,w=k.charAt(k.length-1)==='w',r=rng(us?7507:7517);
  return TX[k]=ddrCanvas(128,64,(q,W,H)=>{
    q.fillStyle=w?'#4a382c':us?'#2c2b29':'#3f3b36';q.fillRect(0,0,W,H);
    for(let l=0;l<4;l++){const x=l*32;
      q.fillStyle=w?'#231a14':'#151416';q.fillRect(x,0,4,40);
      if(us){q.fillStyle=w?'#3c3028':'#353431';q.fillRect(x+5,5,26,30);q.strokeStyle=w?'#5e4a3a':'#56544f';q.lineWidth=3;q.beginPath();q.moveTo(x+9,8);q.lineTo(x+25,20);q.lineTo(x+9,32);q.stroke();
        q.fillStyle=w?'#6a4a34':'#66625a';q.fillRect(x+4,0,28,5);q.fillRect(x+4,35,28,5);}
      else{q.fillStyle=w?'#5c4534':'#59544c';q.fillRect(x+6,2,24,36);q.fillStyle=w?'#84603f':'#989184';q.fillRect(x+13,3,7,34);
        q.fillStyle=w?'#2c211a':'#222124';for(const y of[7,23]){q.fillRect(x+23,y,5,10);q.fillRect(x+7,y,4,10);}}
      q.fillStyle=w?'#231a14':'#151416';q.fillRect(x,40,3,12);q.fillStyle=w?'#5c4534':'#524d46';q.fillRect(x+4,41,27,10);q.fillStyle=w?'#84603f':'#8e887c';q.beginPath();q.arc(x+17,46,3.4,0,7);q.fill();
      q.fillStyle=w?'#3a2c22':'#34312d';q.fillRect(x+4,52,28,12);q.fillStyle=w?'#5c4534':'#5f5a52';q.fillRect(x+12,55,9,7);}
    for(let i=0;i<520;i++){q.fillStyle=`rgba(${r()<.5?'0,0,0':w?'160,96,52':'164,148,118'},${.05+r()*.13})`;q.fillRect(r()*W,r()*H,1+r()*2,1+r()*2);}
  },true);
}
// the materials, made when first wanted: key -> [picture, r, m, e] (as ddreal.js's DDR_DEF)
const DDR_TK_DEF={ddrTankCamo:['camo',1.34,.2,.42],ddrTankChar:['char',1.85,.1,.12],ddrTankOD:['od',1.36,.2,.4],ddrTankODw:['odw',1.75,.1,.14],
  ddrTankTrk:['trk',1.05,.55,.55],ddrTankTrkW:['trkw',1.7,.25,.14],ddrTankTrkUS:['trkus',1.5,.1,.3],ddrTankTrkUSw:['trkusw',1.8,.1,.12]};
// what each draws in once it's knocked out: the kit's ddrBurn asks DDR.mats for 'burnt_'+key and would tint a copy; ours are pictures of their own, so
// that slot answers with them (made the first time one is asked for)
const DDR_TK_BURNT={ddrTankCamo:'ddrTankChar',ddrTankTrk:'ddrTankTrkW',ddrTankOD:'ddrTankODw',ddrTankTrkUS:'ddrTankTrkUSw'};
function ddrTankDef(k){
  const d=DDR_TK_DEF[k];if(!d||DDR_DEF[k])return k;
  ddrMatDef(k,{r:d[1],m:d[2],e:d[3],map:d[0].slice(0,3)==='trk'?ddrTankTrkPic(d[0]):ddrTankPaint(d[0])});
  const b=DDR_TK_BURNT[k],slot='burnt_'+k;
  if(b)Object.defineProperty(DDR.mats,slot,{configurable:true,enumerable:true,get(){const m=ddrMat(ddrTankDef(b));if(typeof DDL_SEEN!=='undefined')DDL_SEEN.add(m);Object.defineProperty(DDR.mats,slot,{value:m,writable:true,configurable:true,enumerable:true});return m;}});
  return k;
}

/* ---------- shapes the kit hasn't got ---------- */
// flat-faced triangles from corner points [x,y,z], each wound to face away from mid (a body's middle)
function ddrTankTris(L,mid,smooth){
  const P=[];for(const t of L){let[a,b,c]=t;const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    if(nx*((a[0]+b[0]+c[0])/3-mid[0])+ny*((a[1]+b[1]+c[1])/3-mid[1])+nz*((a[2]+b[2]+c[2])/3-mid[2])<0){const s=b;b=c;c=s;}P.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(P,3));G.computeVertexNormals();
  if(smooth){   // corners that meet share the average of their faces' normals (weighted a little to each face's own, so a roof still reads as a roof)
    const na=G.attributes.normal,S={},key=i=>Math.round(P[i*3]*20)+'|'+Math.round(P[i*3+1]*20)+'|'+Math.round(P[i*3+2]*20);
    for(let i=0;i<na.count;i++){const k=key(i),a=S[k]||(S[k]=[0,0,0]);a[0]+=na.getX(i);a[1]+=na.getY(i);a[2]+=na.getZ(i);}
    for(let i=0;i<na.count;i++){const a=S[key(i)],l=Math.hypot(a[0],a[1],a[2])||1,x=na.getX(i)*(1-smooth)+a[0]/l*smooth,y=na.getY(i)*(1-smooth)+a[1]/l*smooth,z=na.getZ(i)*(1-smooth)+a[2]/l*smooth,m=Math.hypot(x,y,z)||1;na.setXYZ(i,x/m,y/m,z/m);}}
  return G;
}
// a body between two rings of as many corners (a turret's foot and its roof's edge), closed over the top
function ddrTankBody(bot,top,cap,smooth){
  const L=[],n=bot.length,mid=[0,0,0];for(const p of bot.concat(top)){mid[0]+=p[0]/(n*2);mid[1]+=p[1]/(n*2);mid[2]+=p[2]/(n*2);}
  for(let i=0;i<n;i++){const j=(i+1)%n;L.push([bot[i],bot[j],top[j]],[bot[i],top[j],top[i]]);}
  if(cap)for(let i=1;i<n-1;i++)L.push([top[0],top[i],top[i+1]]);
  return ddrTankTris(L,mid,smooth);
}
/* A track: one belt round the wheels it wraps (c: [[x,y,r]...] in the order it runs: the last road wheel, the first, the sprocket, the idler), lying
   over the return rollers' tops (sup: [[x,y]...] in the order it passes them, after circle o.top) with a little sag between. o: th thick, w wide,
   pitch a link's length, sag. Open (o.open: points [[x,y]...] of a thrown track lying on the ground) it's a strip. Its picture: links along, by rows across. */
function ddrTankBelt(c,sup,o){
  const th=o.th,w=o.w,pts=[],n=c?c.length:0,tan=[],TAU=Math.PI*2;
  if(o.open)for(const p of o.open)pts.push([p[0],p[1],0,0,1]);
  for(let i=0;i<n;i++){const a=c[i],b=c[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1];tan.push(Math.atan2(dy,dx)-Math.acos((a[2]-b[2])/Math.hypot(dx,dy)));}
  for(let i=0;i<n;i++){const a=c[i],t0=tan[(i+n-1)%n];let t1=tan[i];while(t1<t0-1e-6)t1+=TAU;while(t1>t0+TAU)t1-=TAU;
    const m=Math.max(1,Math.ceil(a[2]*(t1-t0)/o.pitch));
    for(let k=0;k<=m;k++){const t=t0+(t1-t0)*k/m;pts.push([a[0]+Math.cos(t)*a[2],a[1]+Math.sin(t)*a[2],Math.cos(t),Math.sin(t)]);}
    if(i===o.top&&sup&&sup.length){const b=c[(i+1)%n],e=[b[0]+Math.cos(t1)*b[2],b[1]+Math.sin(t1)*b[2]],S=[pts[pts.length-1]].concat(sup,[e]);
      for(let s=0;s<S.length-1;s++){const p=S[s],q=S[s+1],l=Math.hypot(q[0]-p[0],q[1]-p[1]),m2=Math.max(1,Math.round(l/(o.pitch*1.6)));
        for(let k=1;k<=m2;k++){if(s===S.length-2&&k===m2)break;const t=k/m2;pts.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t-(o.sag||0)*4*t*(1-t)*Math.min(1,l/11),0,0,1]);}}}}
  const m=pts.length,closed=!o.open;
  // the points put in along the top run (and a thrown track's) face out square to the way it runs there
  for(let i=0;i<m;i++){const p=pts[i];if(!p[4])continue;const a=pts[closed?(i+m-1)%m:Math.max(0,i-1)],b=pts[closed?(i+1)%m:Math.min(m-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;p[2]=(b[1]-a[1])/l;p[3]=-(b[0]-a[0])/l;}
  let tot=0;const ob=pts.map(p=>[p[0]+p[2]*th,p[1]+p[3]*th]),segs=closed?m:m-1;for(let i=0;i<segs;i++){const a=ob[i],b=ob[(i+1)%m];tot+=Math.hypot(b[0]-a[0],b[1]-a[1]);}
  const tile=closed?tot/Math.max(1,Math.round(tot/(o.pitch*4))):o.pitch*4,P=[],N=[],U=[],V=[[.4,.98],[.21,.35],[.02,.17]];let s=0;
  const quad=(p0,p1,p2,p3,nn,u0,u1,v)=>{const ux=p1[0]-p0[0],uy=p1[1]-p0[1],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vy=p2[1]-p0[1],vz=p2[2]-p0[2],f=(uy*vz-uz*vy)*nn[0]+(uz*vx-ux*vz)*nn[1]+(ux*vy-uy*vx)*nn[2]>=0;
    const Q=f?[[p0,u0,v[0]],[p1,u1,v[0]],[p2,u1,v[1]],[p0,u0,v[0]],[p2,u1,v[1]],[p3,u0,v[1]]]:[[p0,u0,v[0]],[p2,u1,v[1]],[p1,u1,v[0]],[p0,u0,v[0]],[p3,u0,v[1]],[p2,u1,v[1]]];
    for(const e of Q){P.push(e[0][0],e[0][1],e[0][2]);N.push(nn[0],nn[1],nn[2]);U.push(e[1],e[2]);}};
  for(let i=0;i<segs;i++){const a=pts[i],b=pts[(i+1)%m],A=ob[i],Bo=ob[(i+1)%m],l=Math.hypot(Bo[0]-A[0],Bo[1]-A[1])||1e-6,nx=(Bo[1]-A[1])/l,ny=-(Bo[0]-A[0])/l,u0=s/tile,u1=(s+l)/tile;s+=l;
    quad([A[0],A[1],-w/2],[Bo[0],Bo[1],-w/2],[Bo[0],Bo[1],w/2],[A[0],A[1],w/2],[nx,ny,0],u0,u1,V[0]);
    for(const e of[-1,1])quad([a[0],a[1],e*w/2],[b[0],b[1],e*w/2],[Bo[0],Bo[1],e*w/2],[A[0],A[1],e*w/2],[0,0,e],u0,u1,V[1]);
    quad([a[0],a[1],-w/2],[b[0],b[1],-w/2],[b[0],b[1],w/2],[a[0],a[1],w/2],[-nx,-ny,0],u0,u1,V[2]);}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(P,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));G.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));G.userData.tile=tile;return G;
}
// the paint's coordinates: each triangle by the way it faces (the side view, the top view, the end view). at: where this builder's origin is on the tank
function ddrTankLay(G,at){
  const pa=G.attributes.position,U=new Float32Array(pa.count*2),T=DDR_TK.T,ox=at?at[0]:0,oy=at?at[1]:0,oz=at?at[2]:0;
  for(let i=0;i<pa.count;i+=3){const ax=pa.getX(i),ay=pa.getY(i),az=pa.getZ(i),ux=pa.getX(i+1)-ax,uy=pa.getY(i+1)-ay,uz=pa.getZ(i+1)-az,vx=pa.getX(i+2)-ax,vy=pa.getY(i+2)-ay,vz=pa.getZ(i+2)-az;
    const nx=Math.abs(uy*vz-uz*vy),ny=Math.abs(uz*vx-ux*vz),nz=Math.abs(ux*vy-uy*vx),k=ny>nx&&ny>nz?1:nz>=nx?0:2;
    for(let j=0;j<3;j++){const x=pa.getX(i+j)+ox,y=pa.getY(i+j)+oy,z=pa.getZ(i+j)+oz;
      if(k===1){U[(i+j)*2]=(x+40)/T;U[(i+j)*2+1]=.7+z/T;}else{U[(i+j)*2]=((k?z:x)+40)/T;U[(i+j)*2+1]=Math.min(.415,y/T);}}}
  G.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));return G;
}
// two merged geometries as one
function ddrTankJoin(a,b){
  if(!a)return b;if(!b)return a;const G=new THREE.BufferGeometry();
  for(const k of['position','normal','color','uv']){const x=a.attributes[k],y=b.attributes[k],A=new Float32Array(x.array.length+y.array.length);A.set(x.array);A.set(y.array,x.array.length);G.setAttribute(k,new THREE.Float32BufferAttribute(A,x.itemSize));}
  a.dispose();b.dispose();G.computeBoundingSphere();G.computeBoundingBox();return G;
}
// a builder finished: a geometry a material, the paint (key P) laid by view, the flat-coloured parts joined into it on the picture's plain patch
function ddrTankFin(B,P,at,go){
  const G=B.geos(go),F=G.ddrTankFlat;if(G[P])ddrTankLay(G[P],at);
  if(F){const U=new Float32Array(F.attributes.position.count*2);for(let i=0;i<U.length;i+=2){U[i]=.0117;U[i+1]=.9893;}F.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));G[P]=ddrTankJoin(G[P],F);delete G.ddrTankFlat;}
  return G;
}

/* ---------- the Panzer IV Ausf. H ----------
   Sizes: 1.115 times life along it (the hull 64 from track to track, 67.6 with the mudguards' flaps and the muffler), 1.25 across (35.6 over the tracks, 36.4
   over the mudguards, 43.5 over the skirts), 1.14 up (19.2 to the hull's roof, 27 to the turret's, 30.4 to the cupola's, 37 to the aerial's tip). The gun is drawn a little
   stouter and longer than that (weapons are, in this game): its muzzle DDR_TK.gun ahead of the turret's middle.
   o: P the paint's key, K the tracks', ko knocked out (the wreck), sk which skirt plates still hang ([right five],[left five], front to back). */
function ddrTankPzHull(B,o){
  const T=THREE,C=DDR_TKC,L=B.lod,P=o.P,F='ddrTankFlat',K=o.K,ko=o.ko|0,hz=Math.PI/2;
  const TT=1.1,ZC=15.3,WX=[19.6,14.1,8.6,3.1,-2.4,-7.9,-13.4,-18.9],WR=2.6,WY=TT+WR,SP=[27.2,6.9,3.7],ID=[-27.6,6.6,3.3],RX=[17.2,6,-5.2,-16.4],RY=9.3,RR=1.3;
  const mir=(p,s)=>s>0?p:p.map(a=>[-a[0],a[1]]).reverse();
  // the lower hull between the tracks: the belly, the nose's two plates, the glacis, the tail; over it the superstructure, out over the tracks
  B.ext(P,C.w2,[[-26.5,4.6],[26.5,4.6],[31.4,6.8],[30.4,11.4],[19.8,13.4],[-29.4,13.4],[-30.4,7.4]],22.4,0,0,0,0,0,0,.2);
  B.ext(P,C.w,[[19.9,12.5],[19.3,19.2],[-14,19.2],[-27,17.9],[-29.2,12.5]],30,0,0,0,0,0,0,.25);
  // the glacis: the gearbox's hatch and the two over the brakes; a run of spare links across the nose; the towing eyes
  B.box(P,C.w3,5.8,.5,6,25.15,12.62,0,0,0,-.186);B.both(s=>{B.box(P,C.w4,5,.5,5,24.9,12.68,s*7.3,0,0,-.186);B.cyl(P,C.w3,.8,.5,24.2,13.2,s*7.3,'y',6);});
  for(let i=0;i<9;i++)B.box(F,i%4===1?C.rustD:C.trk,.9,4.2,2,31.4,9.2,-8.8+i*2.2,0,0,.21);
  B.box(F,C.stD,.5,.5,20.4,31.75,10.6,0,0,0,.21);
  B.both(s=>B.box(P,C.w3,1.7,2.5,.8,32,7.5,s*9.7));
  // the driver's plate: his visor on the left, the ball mount and its machine gun on the right; a visor each side
  B.box(P,C.w2,1.1,2.4,6.2,19.95,16.9,-7.2).box(F,C.blk,.3,.42,4.8,20.42,17,-7.2);
  B.ball(P,C.w2,2.1,19.75,16.4,7.4,.72,1,1,6);B.cyl(F,C.st,.46,3.4,21.9,16.4,7.4,'x',5);
  B.both(s=>{B.box(P,C.w2,2.5,1.5,.5,14.2,16.9,s*15.2);B.box(P,C.w3,5.6,.4,6.4,15,19.3,s*8.6);});
  for(let i=0;i<4;i++)B.box(F,i===2?C.rustD:C.trk,.8,3.6,1.9,20.05,16,-3.15+i*2.1,0,0,.09);
  // mudguards over the tracks, a flap hanging at each end
  B.both(s=>{B.box(P,C.w2,63.6,.4,7,-.2,12.4,s*14.7);B.box(P,C.w3,2.7,.36,7,32.7,11.7,s*14.7,0,0,-.54);B.box(P,C.w3,3.2,.36,7,-32.7,11,s*14.7,0,0,1.1);});
  // the engine deck: its two hatches; the cooling air's louvred boxes on the sides
  B.both(s=>{B.box(P,C.w3,9.6,.4,9,-20.5,18.76,s*5.7,0,0,.1);B.box(P,C.w2,5.6,.6,6,-21.3,19.1,s*5.7,0,0,.1);for(let i=0;i<3;i++)B.box(F,C.blk,.5,.66,5,-23+i*1.7,19.0+i*.17,s*5.7,0,0,.1);
    B.box(P,C.w2,10.4,4.3,1.6,-20.8,15.2,s*15.8);for(let i=0;i<4;i++)B.box(F,C.blk,9.8,.36,1.72,-20.8,13.75+i*.98,s*15.8);});
  // the tail: the big muffler across it, the little one of the turret's motor beside it, the hitch
  B.cyl(F,C.rust,1.9,12.6,-31.6,9.3,2.6,'z',10).cyl(F,C.rustD,.5,1.4,-31.6,9.3,9.5,'z',5);
  B.box(F,C.rustD,.5,3.4,.7,-30.9,10.6,-1.6).box(F,C.rustD,.5,3.4,.7,-30.9,10.6,6.8);
  B.cyl(F,C.rustL,1.2,4.4,-31.2,9.9,-7.3,'z',8);
  B.box(P,C.w3,1.6,1.9,2.6,-30.8,6.3,0);
  // the running gear, both sides: eight small road wheels in four bogies with their leaf springs, four return rollers, the sprocket ahead, the idler behind
  B.both(s=>{const z=s*ZC;
    for(const x of WX){
      if(ko<2)B.lathe(F,C.rub,mir([[-1.9,WR],[1.9,WR],[1.95,2.08]],s),x,WY,z,'z',10);
      B.lathe(P,C.w2,mir([[1.78,ko<2?2.1:2.3],[1.56,.85]],s),x,WY,z,'z',10);B.cyl(P,C.w3,.9,.9,x,WY,z+s*2,'z',6);
      if(L)for(let i=0;i<6;i++)B.cyl(F,C.st,.11,.2,x+Math.cos(i*1.047)*1.3,WY+Math.sin(i*1.047)*1.3,z+s*1.72,'z',4);}
    for(let b=0;b<4;b++){const x=(WX[b*2]+WX[b*2+1])/2;
      B.box(P,C.w3,2.5,3.6,2.3,x,6.1,s*12.3);B.box(F,C.st,6.6,.6,1.3,x,3.25,s*12.5);
      if(L){B.box(F,C.stD,5.2,.3,1.3,x,2.8,s*12.5);B.both(e=>B.tube(P,C.w3,[x,6.4,s*13.3],[x+e*2.75,WY,s*13.3],.55,.5,5));}
      B.cyl(F,C.rub,RR,3.4,RX[b],RY,z,'z',7);if(L)B.cyl(P,C.w3,.6,3.7,RX[b],RY,z,'z',6);}
    B.lathe(P,C.w3,mir([[2.1,3.5],[2,2.8],[1.4,1.5],[2.7,1.2],[2.7,.01]],s),SP[0],SP[1],z,'z',10);
    B.cyl(P,C.w3,2.5,2.2,SP[0],SP[1],s*12.2,'z',8);
    if(L)for(let i=0;i<16;i++){const a=i*Math.PI/8;B.both(e=>B.box(F,C.st,.5,.7,.5,SP[0]+Math.cos(a)*3.75,SP[1]+Math.sin(a)*3.75,z+e*1.7,0,0,a));}
    B.lathe(P,C.w3,mir([[2,3.15],[1.9,2.5],[1.25,2.3],[1.3,.95],[2.2,.8],[2.2,.01]],s),ID[0],ID[1],z,'z',9);
    if(L)for(let i=0;i<7;i++){const a=i*Math.PI*2/7;B.tube(P,C.w4,[ID[0]+Math.cos(a)*.9,ID[1]+Math.sin(a)*.9,z+s*1.6],[ID[0]+Math.cos(a)*2.4,ID[1]+Math.sin(a)*2.4,z+s*1.6],.3,.3,4);}
    // the track (thrown on the wreck's left: it lies along the ground under the wheels and out behind)
    const tk={th:TT,w:5,pitch:2.1,sag:.5,top:2};
    if(ko>1&&s<0)B.put(K,ddrTankBelt(null,null,Object.assign({open:[[-45,TT],[-39,TT+.25],[-33,TT],[-27,TT+.3],[-19,TT],[20,TT],[25,TT+.1]]},tk)),0xffffff,0,0,z,0,-.05,0,1,1,1,{uv:[1,1,0,0]});
    else{const g=ddrTankBelt([[WX[7],WY,WR],[WX[0],WY,WR],SP,ID],RX.map(x=>[x,RY+RR]),tk);o.tile=g.userData.tile;B.put(K,g,0xffffff,0,0,z,0,0,0,1,1,1,{uv:[1,1,0,0]});}
  });
  // what's carried on the mudguards. Right: an axe, three jerrycans, the jack. Left: the lamp, a shovel, two spare road wheels in their rack, the jack's block, an extinguisher
  if(ko<2){
    B.tube(F,C.wood,[17.5,13,16.8],[10.5,13,16.8],.22,.22,4).box(F,C.st,1.5,.3,1.5,17.6,13,16.8);
    for(let i=0;i<3;i++)B.rbox(i===1?F:P,i===1?C.feld:C.w3,4,5.3,2,.4,7.2-i*4.3,15.3,16.7,0,0,0);
    if(L)for(let i=0;i<3;i++)B.box(F,C.stD,1.6,.3,.5,7.2-i*4.3,18.1,16.7);
    B.cyl(F,C.st,.85,6.6,-10.2,13.6,16.9,'x',6).box(F,C.stD,1.2,1.9,1.9,-13.4,13.6,16.9);
    B.cyl(P,C.w2,.95,1.2,28.6,14.3,-15.6,'x',7).box(P,C.w2,.4,1.3,.4,28.4,13.2,-15.6).box(F,C.lamp,.1,.7,1.1,29.25,14.3,-15.6);
    B.tube(F,C.wood,[22,13,-16.9],[14,13,-16.9],.2,.2,4).box(F,C.st,2.6,.25,1.7,23.3,13,-16.9);
    B.both(e=>{B.cyl(F,C.rub,2.5,1.7,-3.6+e*2.7,15.2,-16.6,'z',8);B.cyl(P,C.w3,1.8,1.9,-3.6+e*2.7,15.2,-16.6,'z',8);});B.box(P,C.w3,11.2,1.6,2.4,-3.6,13.4,-16.6);
    B.rbox(F,C.wood,4.4,1.6,2.4,.3,5,13.4,-16.9,0,0,0);
    B.cyl(F,C.feld,.7,3.6,-10.6,13.4,-17,'x',6);}
  // the tow cable, hung round the tail and laid forward along the deck
  if(ko<2){const cb=[[-13,19.5,11.2],[-26.4,18.3,11.8],[-28.7,14.8,11],[-29.1,14.2,0],[-28.7,14.8,-11],[-26.4,18.3,-11.8],[-13,19.5,-11.2]];for(let i=0;i<6;i++)B.tube(F,C.cable,cb[i],cb[i+1],.34,.34,4);}
  if(L){B.both(s=>{B.torus(F,C.cable,.62,.2,-12.6,19.5,s*11.2,Math.PI/2,0,0);for(const x of[27,23.2])B.box(P,C.w3,.9,.3,.5,x,x>25?12.5:13.2,s*7.3,0,0,-.186);B.box(F,C.stD,.5,.5,.3,-18,19.1,s*1.5);});
    B.box(F,0x5a1c18,.3,.8,1.4,-32.2,13.1,-15.5).box(P,C.w3,.6,1.2,1.8,-31.9,13.1,-15.5);B.torus(F,C.st,2.3,.22,19.8,16.4,7.4,0,Math.PI/2,0);
    for(const z of[-4.5,4.5])B.box(P,C.w3,1.3,.7,1.1,13.5,19.75,z-12*Math.sign(z)+7.5*Math.sign(z));}
  // the aerial, on the left at the back
  B.cyl(F,C.rub,.55,1.5,-24.6,18.9,-13.2,'y',6);if(ko<2)B.tube(F,C.stD,[-24.6,19.4,-13.2],[-26.4,37,-13.5],.15,.07,4);
  // the skirts: a rail each side on its struts off the superstructure, five plates hung on it, some gone, none quite straight
  const sk=o.sk||(ko>1?[[0,1,0,0,0],[0,0,0,1,0]]:[[1,1,0,1,0],[0,1,1,0,1]]),tilt=ko>1?[[.16,.09,-.5],[.1,-.12,-.3],[.2,.1,-.6],[.12,-.1,-.4],[.2,.08,-.5]]:[[.05,.02,0],[.02,-.015,.1],[.07,.03,-.1],[.03,-.05,.15],[.08,.04,0]],mc=ko>1?0x8a8478:undefined;
  if(ko>1)B.box(P,C.w3,11.4,12,.32,-9,5.95,21,-.2,0,.05);   // (a wreck: a plate fallen off its rail, leaning on the track)
  B.both(s=>{const hang=sk[s>0?0:1];
    B.box(P,C.w3,60.6,.5,.5,1.1,18.25,s*20.6);
    for(const x of[28.4,17,5.6,-5.8,-17.2,-27.6])B.tube(P,C.w3,[x,17.3,s*15],[x,18.2,s*20.6],.24,.24,4);
    for(let k=0;k<5;k++){if(!hang[k])continue;const x=24.3-k*11.65,t=tilt[(k+(s>0?0:2))%5],c=[C.w,C.w3,C.w2,C.w4,C.w2][(k+(s>0?1:3))%5];
      const pts=k===0?[[-5.7,-6],[2.6,-6],[5.7,-2.2],[5.7,6],[-5.7,6]]:k===4?[[-5.7,-2.6],[-3,-6],[5.7,-6],[5.7,6],[-5.7,6]]:[[-5.7,-6],[5.7,-6],[5.7,6],[-5.7,6]];
      B.ext(P,c,pts,.32,x,12.2+t[2],s*(20.9+t[0]*4),-s*t[0],0,t[1]);
      if(L)B.both(e=>B.box(P,C.w3,.9,1.2,.5,x+e*3.4,18.3,s*20.9));}});
  // marks: a cross on each side of the superstructure (seen where a plate is gone), one on a plate of the left side
  B.decal('cross',4.4,4.4,1.2,15.9,15.03,0,0,0,mc).decal('cross',4.4,4.4,1.2,15.9,-15.03,0,Math.PI,0,mc);
  if(sk[1][2])B.decal('cross',4.4,4.4,1,13.2,-21.12,0,Math.PI,0,mc);
  return B;
}
function ddrTankPzTur(B,o){
  const T=THREE,C=DDR_TKC,L=B.lod,P=o.P,F='ddrTankFlat',ko=o.ko|0,hz=Math.PI/2,GL=(o.gun||DDR_TK.gun)-11;
  const bot=[[11.6,.35,8.4],[3,.35,12.2],[-6,.35,11.6],[-10.8,.35,6.6]],top=[[10.3,7.3,6.4],[3,7.75,8.5],[-5.4,7.8,8.2],[-9.5,7.8,4.8]];
  const ring=a=>a.concat(a.slice().reverse().map(p=>[p[0],p[1],-p[2]]));
  B.put(P,ddrTankBody(ring(bot),ring(top),true),C.w);B.cyl(P,C.w2,9.8,.5,0,.2,0,'y',12);
  // the mantlet and the long gun on their trunnion (on a knocked-out tank they hang)
  const dr=ko?-.17:0,cd=Math.cos(dr),sd=Math.sin(dr),gp=(x,y,z)=>[11+x*cd-y*sd,3.2+x*sd+y*cd,z||0];
  B.ext(P,C.w2,[[.2,-2.4],[1.9,-2.3],[2.9,-1.6],[3.4,-.5],[3.4,.6],[2.9,1.7],[1.9,2.5],[-.2,3]],11.2,11,3.2,0,0,0,dr,.2);
  const prof=[[3,2.55],[4.3,2.55],[4.6,2.15],[8.7,1.9],[9,1.5],[18,1.28],[GL-5.6,1.02],[GL-5.4,1.2],[GL-5,1.2],[GL-4.8,2],[GL-3.2,2],[GL-3,1.4],[GL-2.5,1.4],[GL-2.3,1.82],[GL-1.1,1.82],[GL-.9,1.28],[GL,1.28],[GL,.66]];
  B.put(P,new T.LatheGeometry(prof.map(p=>new T.Vector2(p[1],p[0])),B.N(8,14)),C.w,11,3.2,0,0,0,-hz+dr);
  let p=gp(GL-.04,0);B.put(F,new T.CylinderGeometry(.66,.66,.1,B.N(8,14)),C.blk,p[0],p[1],0,0,0,-hz+dr);
  p=gp(GL-4,0);B.box(F,C.blk,1.15,1.3,4.06,p[0],p[1],0,0,0,dr);p=gp(GL-1.7,0);B.box(F,C.blk,.85,1.15,3.7,p[0],p[1],0,0,0,dr);
  p=gp(4.5,.4,3.5);B.put(F,new T.CylinderGeometry(.42,.42,2.8,5),C.st,p[0],p[1],p[2],0,0,-hz+dr);
  p=gp(3.24,.5,-3.5);B.box(F,C.blk,.12,.8,.8,p[0],p[1],p[2],0,0,dr);
  // the cupola at the back of the roof, its five slits, the hatch (thrown open on a wreck); a ventilator; the hatches in the sides, two leaves each
  B.lathe(P,C.w2,[[0,4],[.5,4],[.6,3.7],[2.5,3.7],[3,3.3],[3.2,3.3],[3.2,2.4]],-5.8,7.6,0,'y',10);
  for(let i=0;i<5;i++){const a=i*1.2566;B.box(P,C.w3,.9,.9,2.4,-5.8+Math.cos(a)*3.75,9.3,Math.sin(a)*3.75,0,-a,0);B.box(F,C.gls,.3,.3,1.7,-5.8+Math.cos(a)*4.1,9.35,Math.sin(a)*4.1,0,-a,0);}
  if(ko)B.cyl(P,C.w2,2.7,.4,-5.8,12.9,-3.3,'z',10);else B.cyl(P,C.w2,2.7,.45,-5.8,10.95,0,'y',10);
  if(ko)B.cyl(F,C.blk,2.4,.1,-5.8,10.7,0,'y',10);
  B.cyl(P,C.w2,1.5,.5,5.4,7.8,3.5,'y',8);
  if(L){for(const q of[[8,7.6,-4.6],[-1,7.9,6.4],[-1,7.9,-6.4]])B.torus(F,C.st,.5,.16,q[0],q[1],q[2],0,q[2]>5||q[2]<-5?0:Math.PI/2,0);
    if(!ko){B.box(P,C.w3,1.2,.4,1.6,-8.6,11,0).box(F,C.st,.3,.5,1.4,-4.4,11.3,0);}B.torus(P,C.w3,2.75,.14,11+4.45,3.2,0,0,Math.PI/2,0);}
  const plate=(mk,col,a,b,c,d,u0,u1,v0,v1,th,sw)=>{const l3=(m,n,t)=>[m[0]+(n[0]-m[0])*t,m[1]+(n[1]-m[1])*t,m[2]+(n[2]-m[2])*t],pt=(u,v)=>l3(l3(a,b,u),l3(d,c,u),v),p0=pt(u0,v0),p1=pt(u1,v0),p2=pt(u0,v1),p3=pt(u1,v1);
    const ex=new T.Vector3(p1[0]-p0[0],p1[1]-p0[1],p1[2]-p0[2]),w=ex.length(),ey=new T.Vector3(p2[0]-p0[0],p2[1]-p0[1],p2[2]-p0[2]),h=ey.length(),n=new T.Vector3().crossVectors(ex,ey).normalize(),cen=new T.Vector3((p0[0]+p3[0])/2,(p0[1]+p3[1])/2,(p0[2]+p3[2])/2);
    ex.normalize();if(n.x*cen.x+n.z*cen.z<0){n.negate();ex.negate();}ey.crossVectors(n,ex);
    const M=new T.Matrix4().makeBasis(ex,ey,n).setPosition(cen.x+n.x*th/2,cen.y+n.y*th/2,cen.z+n.z*th/2);
    if(sw){const hg=new T.Vector3(cen.x-ex.x*w/2*Math.sign(sw),cen.y-ex.y*w/2*Math.sign(sw),cen.z-ex.z*w/2*Math.sign(sw));M.premultiply(new T.Matrix4().makeTranslation(-hg.x,-hg.y,-hg.z)).premultiply(new T.Matrix4().makeRotationAxis(ey,sw)).premultiply(new T.Matrix4().makeTranslation(hg.x,hg.y,hg.z));}
    B.put(mk,new T.BoxGeometry(w,h,th),col,0,0,0,0,0,0,1,1,1,{m:M});};
  B.both(s=>{const f=q=>[q[0],q[1],q[2]*s],a=f(bot[1]),b=f(bot[2]),c=f(top[2]),d=f(top[1]),op=ko&&s>0;
    plate(P,C.w2,a,b,c,d,.08,.48,.14,.86,.3,op?-1.9*s:0);plate(P,C.w3,a,b,c,d,.5,.9,.14,.86,.3,op?1.7*s:0);
    if(op)plate(F,C.blk,a,b,c,d,.1,.88,.16,.84,.06);
    plate(F,C.gls,a,b,c,d,.2,.36,.52,.6,.36,op?-1.9*s:0);});
  // the bin on the back
  B.ext(P,C.w2,[[-10.4,7.6],[-15.2,7.6],[-17.2,5.6],[-17.2,-5.6],[-15.2,-7.6],[-10.4,-7.6]],5,0,3.9,0,-hz,0,0,.25);
  if(L)B.box(P,C.w3,6.4,.2,15.4,-13.8,6.5,0);
  // the skirts round the turret: plates standing off its sides and round the bin on brackets, their front corners cut
  const SK=[[10.4,9.5],[5,14.8],[-8.5,15.4],[-16.2,11.6],[-19.8,4.8]],y0=.9,y1=7.3;
  const wall=(mk,col,a,b,th)=>{const dx=b[0]-a[0],dz=b[1]-a[1];B.box(mk,col,Math.hypot(dx,dz)+th*.6,y1-y0,th,(a[0]+b[0])/2,(y0+y1)/2,(a[1]+b[1])/2,0,Math.atan2(-dz,dx),0);};
  B.both(s=>{const f=q=>[q[0],q[1]*s];
    {const a=f(SK[0]),b=f(SK[1]),dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);   // the front plate, its top front corner cut away
      B.ext(P,C.w3,[[-l/2,y0],[l/2,y0],[l/2,y1],[-l/2+3.2,y1],[-l/2,y1-2.6]],.3,(a[0]+b[0])/2,0,(a[1]+b[1])/2,0,Math.atan2(-dz,dx),0);}
    wall(P,C.w,f(SK[1]),f(SK[2]),.3);wall(P,C.w2,f(SK[2]),f(SK[3]),.3);wall(P,C.w3,f(SK[3]),f(SK[4]),.3);
    for(const q of[[8.6,6.9,7.2,10.9],[1.5,7.5,1.2,14.9],[-5.6,7.5,-6.6,15.2],[-9.2,7.5,-13,13.2]])B.tube(P,C.w3,[q[0],7,q[1]*s],[q[2],7.05,q[3]*s],.26,.26,4);
    for(const x of[.6,-2.9,-6.4])B.box(F,C.stD,.16,y1-y0-.5,.4,x,(y0+y1)/2,s*(15-(x-5)*.0444));});
  wall(P,C.w2,[SK[4][0],SK[4][1]],[SK[4][0],-SK[4][1]],.3);
  B.both(s=>B.tube(P,C.w3,[-16.9,6.6,s*3.4],[-19.7,7,s*3.4],.26,.26,4));
  // marks: the tank's number on the skirts' sides and back
  const mc=ko>1?0x8a8478:undefined;B.decal('n3',7.4,7.4,-1.8,4.1,15.32,0,.044,0,mc).decal('n3',7.4,7.4,-1.8,4.1,-15.32,0,Math.PI-.044,0,mc).decal('n3',6.4,6.4,-19.98,4.1,0,0,-hz,0,mc);
  return B;
}

/* ---------- the M4 Sherman (75 mm, welded hull) ----------
   Sizes: 1.1 times life along it (64 from track to track), 1.25 across (32.8), 1.14 up (19.9 to the hull's roof, 28.6 to the turret's, 29.7 to the hatch ring).
   The muzzle 30 ahead of the turret's middle. o as the Panzer's (on the wreck the right track is thrown, the driver's and the commander's hatches open). */
function ddrTankShHull(B,o){
  const C=DDR_TKC,L=B.lod,P=o.P,F='ddrTankFlat',K=o.K,ko=o.ko|0,hz=Math.PI/2,mc=ko>1?0xb6b2a2:undefined;
  const TT=1.2,ZC=13.75,BX=[16.4,.4,-15.6],WR=2.8,WY=TT+WR,SP=[27,7.5,3.5],ID=[-27.2,6.6,3.2];
  const mir=(p,s)=>s>0?p:p.map(a=>[-a[0],a[1]]).reverse();
  // the lower hull between the tracks with the gearbox's rounded housing at its nose; over it the upper hull, as wide as the tracks: glacis, roof, engine deck
  B.ext(P,C.w2,[[-28.6,6.2],[-26,4.9],[22,4.9],[26.5,5.2],[29.6,6.4],[31.2,8.3],[31.4,10.4],[30.2,12.6],[-28.6,12.6]],21.2,0,0,0,0,0,0,.3);
  B.ext(P,C.w,[[30.2,12.5],[19,19.9],[-8,19.9],[-29.6,18.3],[-30.6,12.5]],32.8,0,0,0,0,0,0,.3);
  B.box(P,C.w3,.9,.9,21.6,30.25,12.5,0,0,0,.6);B.both(s=>B.box(P,C.w3,1.5,2.2,.8,31.7,7.6,s*6.4));
  // the driver's and the bow gunner's hoods and their hatches (the driver's thrown open on the wreck); the bow gun in its ball; lamps
  B.both(s=>{B.box(P,C.w2,6.2,3.2,6.6,18.6,19.4,s*7.7);
    if(ko>1&&s<0){B.box(P,C.w3,4.6,.3,5.2,15.7,23,s*7.7,0,0,1.35).box(F,C.blk,4,.1,4.6,18.4,21.02,s*7.7);}else B.box(P,C.w3,4.6,.34,5.2,18.3,21.15,s*7.7);
    B.cyl(P,C.w2,.85,1.2,27.2,15.6,s*13.4,'x',7);if(ko<2)B.box(F,C.lamp,.1,.9,.9,27.85,15.6,s*13.4);});
  B.ball(P,C.w2,1.7,25.5,15.75,7.7,1,1,1,6);B.cyl(F,C.st,.42,3.2,27.4,16,7.7,'x',5);
  // the engine deck: the grille behind the turret, the covers, the fuel caps; the tail: the engine's doors under the overhang, the exhausts
  B.box(P,C.w3,6,.3,17,-10.6,19.86,0,0,0,.074);for(let i=0;i<5;i++)B.box(F,C.blk,.5,.36,15.6,-12.8+i*1.1,19.72+i*.08,0,0,0,.074);
  B.box(P,C.w2,13.6,.3,19,-21.4,19.07,0,0,0,.074);B.both(s=>B.cyl(P,C.w3,.8,.5,-15.4,19.7,s*11.5,'y',6));
  B.box(P,C.w3,.5,5.4,13,-28.75,9.4,0);B.both(s=>B.cyl(F,C.rustD,.7,2.4,-29.6,11.4,s*4.6,'x',6));
  // plates welded on over the shell racks: two on the right side, one on the left
  B.box(P,C.w2,9,5,.45,11.5,16,16.6).box(P,C.w3,8,5,.45,-2.5,16,16.6).box(P,C.w2,9,5,.45,10,16,-16.6);
  // the running gear: three bogies a side, each two wheels on arms under a spring housing, a return roller behind, a skid on top; sprocket ahead, idler behind
  B.both(s=>{const z=s*ZC;
    for(const bx of BX){
      B.both(e=>{const x=bx+e*3.75;
        B.lathe(F,ko>1?C.rubD:C.rub,mir([[-2.2,WR],[2.2,WR],[2.28,2.05]],s),x,WY,z,'z',10);B.lathe(P,C.w3,mir([[2.1,2.07],[1.75,.9]],s),x,WY,z,'z',10);B.cyl(P,C.w3,.95,.9,x,WY,z+s*2.1,'z',6);
        B.tube(P,C.w3,[bx,7.4,z+s*1.9],[x,WY,z+s*1.9],.7,.6,4);});
      B.box(P,C.w3,2.8,6.4,2.8,bx,7.4,z).box(P,C.w2,4.6,2.3,3.2,bx,9.3,z).box(F,C.st,5.6,.4,3.2,bx+.4,10.75,z);
      B.cyl(F,C.rub,.95,3.2,bx-3.9,10.05,z,'z',7);}
    B.lathe(P,C.w3,mir([[2.3,3.3],[2.2,2.6],[1.5,1.6],[2.7,1.2],[2.7,.01]],s),SP[0],SP[1],z,'z',10);B.cyl(P,C.w3,2.6,2.6,SP[0],SP[1],s*11.4,'z',8);
    if(L)for(let i=0;i<13;i++){const a=i*Math.PI*2/13;B.box(F,C.st,.5,.8,.5,SP[0]+Math.cos(a)*3.55,SP[1]+Math.sin(a)*3.55,z+s*2,0,0,a);}
    B.lathe(P,C.w3,mir([[2.2,3],[2.1,2.3],[1.4,2.1],[1.5,.9],[2.4,.75],[2.4,.01]],s),ID[0],ID[1],z,'z',9);
    const tk={th:TT,w:5.25,pitch:2.4,sag:.2,top:2};
    if(ko>1&&s>0)B.put(K,ddrTankBelt(null,null,Object.assign({open:[[-44,TT],[-38,TT+.2],[-31,TT],[-24,TT+.25],[-19.4,TT],[20.2,TT],[24,TT+.1]]},tk)),0xffffff,0,0,z,0,.05,0,1,1,1,{uv:[1,1,0,0]});
    else{const g=ddrTankBelt([[BX[2]-3.75,WY,WR],[BX[0]+3.75,WY,WR],SP,ID],BX.map(x=>[x-3.9,11]),tk);o.tile=g.userData.tile;B.put(K,g,0xffffff,0,0,z,0,0,0,1,1,1,{uv:[1,1,0,0]});}});
  // what a live one carries: a tarpaulin rolled across the back of the deck, a box
  if(ko<2){B.cyl(F,C.canvas,1.5,13,-26.5,19.9,0,'z',8);B.rbox(F,C.od,5,2.6,3.4,.3,-20,20.4,-9,0,.1,0);}
  // marks: the star and the number on each side
  B.decal('star',6.2,6.2,-13.5,16,16.45,0,0,0,mc).decal('star',6.2,6.2,-13.5,16,-16.45,0,Math.PI,0,mc);
  B.decal('usa',10,2.5,-22,13.9,16.45,0,0,0,mc).decal('usa',10,2.5,-22,13.9,-16.45,0,Math.PI,0,mc);
  return B;
}
function ddrTankShTur(B,o){
  const T=THREE,C=DDR_TKC,L=B.lod,P=o.P,F='ddrTankFlat',ko=o.ko|0,hz=Math.PI/2,GL=30-11.2,mc=ko>1?0xb6b2a2:undefined;
  // the cast turret: rounded in plan with its bustle behind, its sides drawn in toward the roof
  const pl=[[11.6,0],[10.4,5.4],[6.8,9.4],[1,11.2],[-5,10.8],[-10.4,8.8],[-14.8,5.6]];
  const ring=(y,k,dx,yb)=>{const a=pl.map((p,i)=>[p[0]*k+dx,i>4?Math.max(y,yb||y):y,p[1]*k]);return a.concat(a.slice().reverse().filter(p=>p[2]>.01).map(p=>[p[0],p[1],-p[2]]));};
  const r0=ring(.3,1,0,3.6),r1=ring(5.8,.975,0),r2=ring(8.7,.8,-.7);
  B.put(P,ddrTankBody(r0.concat(),r1,false,.8),C.w).put(P,ddrTankBody(r1,r2,true,.8),C.w);B.box(P,C.w3,7,.4,12,-11.6,3.6,0);B.cyl(P,C.w2,9.8,.5,0,.2,0,'y',12);
  // the gun in its shield (they hang on a knocked-out tank): the 75, the machine gun on its left, the sight's hole on its right
  const dr=ko?-.15:0,cd=Math.cos(dr),sd=Math.sin(dr),gp=(x,y,z)=>[11.2+x*cd-y*sd,3.7+x*sd+y*cd,z||0];
  B.ext(P,C.w2,[[-.4,-2.7],[1.5,-2.6],[2.4,-1.6],[2.7,0],[2.4,1.6],[1.5,2.6],[-.4,2.9]],12.8,11.2,3.7,0,0,0,dr,.25);
  B.put(P,new T.LatheGeometry([[2.3,2.4],[3.5,2.4],[3.9,1.55],[9,1.35],[GL-.5,1.08],[GL-.5,1.24],[GL,1.24],[GL,.62]].map(p=>new T.Vector2(p[1],p[0])),B.N(8,14)),C.w,11.2,3.7,0,0,0,-hz+dr);
  let p=gp(GL-.04,0);B.put(F,new T.CylinderGeometry(.62,.62,.1,B.N(8,14)),C.blk,p[0],p[1],0,0,0,-hz+dr);
  p=gp(3.4,.3,-3.7);B.put(F,new T.CylinderGeometry(.4,.4,2.6,5),C.st,p[0],p[1],p[2],0,0,-hz+dr);p=gp(2.62,.6,3.7);B.box(F,C.blk,.12,.8,.8,p[0],p[1],p[2],0,0,dr);
  // the roof: the commander's ring and its two half-lids (standing open on a knocked-out tank), the loader's hatch, a periscope, the ventilator, the aerial's foot
  B.lathe(P,C.w2,[[0,3.5],[.9,3.5],[1,3.1],[1,2.5]],-2.8,8.6,4.2,'y',10);
  if(ko){B.both(e=>B.box(P,C.w2,4.6,2.5,.3,-2.8,10.8,4.2+e*2.9,e*.12,0,0));B.cyl(F,C.blk,2.5,.1,-2.8,9.55,4.2,'y',10);}else B.cyl(P,C.w3,2.6,.3,-2.8,9.7,4.2,'y',10);
  B.box(P,C.w3,4.2,.3,3.6,-1.6,8.85,-4.6,0,.3,0).box(P,C.w3,1.5,.9,1.1,4.6,9,4.6).cyl(P,C.w2,1.3,.6,-9.4,8.9,0,'y',7).cyl(F,C.rub,.6,1.2,-12,9.2,-3.6,'y',6);
  if(!ko)B.tube(F,C.stD,[-12,9.8,-3.6],[-13.2,20,-3.8],.15,.07,4);
  // marks: a star on each side
  B.decal('star',4.2,4.2,-2,4.9,11.02,0,-.066,0,mc).decal('star',4.2,4.2,-2,4.9,-11.02,0,Math.PI+.066,0,mc);
  return B;
}

/* ---------- a tank from its two builders ---------- */
// the shapes, made once and shared: {hull, tur} a geometry a material each. ko: 0 live, 1 knocked out in the battle (the turret's hatches open, the gun hanging: its hull is the live one's)
function ddrTankModel(kind,lod,ko,gun){
  const pz=kind!=='sherman';gun=pz?gun||DDR_TK.gun:30;
  return ddrModel('tank|'+kind+'|'+lod+'|'+(ko|0)+'|'+gun,()=>{
    const o={ko:ko|0,gun,P:pz?'ddrTankCamo':'ddrTankOD',K:pz?'ddrTankTrk':'ddrTankTrkUS'},ring=pz?DDR_TK.ring:DDR_TK.ringS,Tu=ddrB(lod);let hull,tile;
    if(ko){const M0=ddrTankModel(kind,lod,0,gun);hull=M0.hull;tile=M0.tile;}else{const H=ddrB(lod);(pz?ddrTankPzHull:ddrTankShHull)(H,o);hull=ddrTankFin(H,o.P,null);tile=o.tile;}
    (pz?ddrTankPzTur:ddrTankShTur)(Tu,o);
    return{hull,tur:ddrTankFin(Tu,o.P,ring,{lo:.93}),ring,tile:tile||8,gun,muzzle:[gun,pz?3.2:3.7,0]};});
}
function ddrTank(kind,o){
  o=typeof o==='number'?{lod:o}:o||{};kind=kind||'panzer';const M=ddrTankModel(kind,o.lod|0,0,o.gun);
  for(const k in M.hull)ddrTankDef(k);for(const k in M.tur)ddrTankDef(k);
  const g=new THREE.Group(),tur=new THREE.Group(),h=ddrPart(M.hull),t=ddrPart(M.tur);
  g.add(h);tur.position.set(M.ring[0],M.ring[1],M.ring[2]);tur.add(t);g.add(tur);
  g.userData={real:true,kind,lod:o.lod|0,tur,hull:h,top:t,gun:M.gun,muzzle:M.muzzle,cupola:kind!=='sherman'?[-5.8,11.2,0]:[-2.6,9.6,-4.2]};   // (cupola: the commander's hatch in the turret's own frame, its rim's height: where ddplay.js stands the man at the machine gun)
  // the tracks run: roll(dist) slides their picture by how far the tank has gone (this tank's own copy of the tracks' material, made when first asked)
  let own=null;g.userData.roll=d=>{const m=h.children.find(c=>DDR_TK_DEF[c.userData.ddrK]&&DDR_TK_DEF[c.userData.ddrK][0].slice(0,3)==='trk');if(!m)return;
    if(!own){own=ddrMat(m.userData.ddrK).clone();own.map=own.map.clone();own.map.needsUpdate=true;}if(m.material!==own){if(m.material!==ddrMat(m.userData.ddrK))return;m.material=own;}   // (not once it's burnt)
    own.map.offset.x=((d/M.tile)%1+1)%1;};
  return{g,tur,mats:[]};
}
/* A live tank K (K.g and K.tur from ddrTank) knocked out: burnt paint, rusted tracks, the turret's hatches thrown open and the gun hanging (the
   turret's shapes swapped for the knocked-out ones, made the first time), a scorch on the ground under it (as ddground.js's ddgTankBurn did). */
function ddrTankBurn(K){
  const g=K&&K.g,D=g&&g.userData;if(!g)return;ddrBurn(g);
  if(D&&D.real&&D.top&&!D.dead){D.dead=true;const M=ddrTankModel(D.kind,D.lod,1,D.gun);for(const m of D.top.children)if(M.tur[m.userData.ddrK])m.geometry=M.tur[m.userData.ddrK];}
  if(typeof paintDecal==='function'&&K.x!=null)for(const d of[-18,0,18])paintDecal({k:'scorch',x:K.x+Math.cos(K.ang||0)*d,y:K.y+Math.sin(K.ang||0)*d,r:Math.random()});
}
/* A wreck that never moves: 'sherman' (the beach's: olive drab under soot, its stars still showing, the right track thrown, the turret turned and
   tipped with the gun down, hatches open) or 'panzer' (the village's: burnt out, the tyres gone, most skirts gone, the left track thrown). One Group
   of three meshes (paint, tracks, marks), the origin on the ground at its middle, +x its front; 64 by 36 on the ground but for the thrown track's tail. */
function ddrTankWreck(kind,o){
  o=typeof o==='number'?{lod:o}:o||{};kind=kind||'sherman';const lod=o.lod|0;
  const M=ddrModel('tankw|'+kind+'|'+lod,()=>{const T=THREE,pz=kind!=='sherman',H=ddrB(lod),Tu=ddrB(lod),q={ko:2,P:pz?'ddrTankChar':'ddrTankODw',K:pz?'ddrTankTrkW':'ddrTankTrkUSw'},ring=pz?DDR_TK.ring:DDR_TK.ringS;
    (pz?ddrTankPzHull:ddrTankShHull)(H,q);(pz?ddrTankPzTur:ddrTankShTur)(Tu,q);const all=ddrTankFin(H,q.P,null),tur=ddrTankFin(Tu,q.P,ring,{lo:.93});
    // the turret turned and tipped, joined to the hull: one mesh a material
    const m=new T.Matrix4().compose(new T.Vector3(ring[0],ring[1]-.25,ring[2]),new T.Quaternion().setFromEuler(new T.Euler(pz?.05:-.05,pz?-.5:.52,pz?.07:.08)),new T.Vector3(1,1,1));
    for(const k in tur){tur[k].applyMatrix4(m);all[k]=ddrTankJoin(all[k],tur[k]);}
    return{all};});
  for(const k in M.all)ddrTankDef(k);const g=ddrPart(M.all);g.userData.real=true;g.userData.kind=kind;g.userData.wreck=true;return g;
}

/* ---------- the machine gun on the commander's cupola (Version 247, Bryan: "There should be an MG unit on top of the tank too") ----------
   An MG 34 on the cupola's anti-aircraft ring, as the Panzer IV carried one: the round perforated jacket, the belt drum on its left, the wooden
   butt, on an arm that rides a ring round the cupola. ddplay.js's ddTankCrew adds both groups to the turret at the cupola's middle, rim height:
   fix stays with the turret (the ring, the hatch's lid standing open behind the man); gun turns with him (the arm, the cradle, the gun: +x where he
   aims, his own axis at the origin). muz: the muzzle in his figure's own frame (post.js's muzzleAt). 1.2 times life, like the tank. */
function ddrTankMG(lod){
  lod=lod|0;const k=1.2,x0=6.6,y0=2.2;
  const M=ddrModel('tankmg|'+lod,()=>{
    const C=DDRC,st='steel',F=ddrB(lod),G=ddrB(lod,DDR_FOLD_T),L=lod,X=x=>x0+x*k,Y=y=>y0+y*k,P=a=>a.map(p=>[x0+p[0]*k,y0+p[1]*k]);
    // what stays with the turret
    F.torus('paint',C.gelbD,3.7,.2,0,-.25,0,Math.PI/2,0,0).cyl('paint',C.gelb,2.7,.4,-3.9,2.5,0,'x',L?12:9);
    if(L)F.both(s=>F.box('paint',C.gelbD,.5,.5,.5,-3.6,.2,s*1.2));
    // the arm up off the ring and the cradle the gun lies in
    G.tube('paint',C.gelbD,[3.7,-.25,0],[X(-.1),Y(-.6),0],.3,.24,5).box('paint',C.gelbD,2.2*k,.16*k,.56*k,X(.2),Y(-.4),0);
    // the gun: the jacket and its holes, the muzzle's cone, the front sight; the receiver, its cover and rear sight; the drum; the grip; the butt
    G.cyl(st,C.gun,.27*k,5.4*k,X(3.6),Y(0),0,'x',L?12:7);
    if(L)for(let i=0;i<9;i++)G.both(s=>G.box(st,C.black,.3*k,.14*k,.03*k,X(1.4+i*.55),Y(.04),s*.26*k));
    G.lathe(st,C.gunD,[[0,.2*k],[.3*k,.2*k],[.35*k,.3*k],[.8*k,.34*k],[.85*k,.2*k]],X(6.3),Y(0),0,'x',L?12:7);
    G.box(st,C.gunD,.12*k,.4*k,.1*k,X(5.9),Y(.45),0);
    G.rbox(st,C.gun,2.7*k,.62*k,.5*k,.08*k,X(-.45),Y(0),0).box(st,C.gunL,1.6*k,.14*k,.52*k,X(-.3),Y(.36),0).box(st,C.gunD,.1*k,.34*k,.3*k,X(.5),Y(.55),0);
    G.cyl(st,C.gunD,.62*k,.5*k,X(-.1),Y(-.22),-.62*k,'z',L?12:8);
    G.ext('matte',C.bake,P([[-1.75,-.3],[-1.25,-.3],[-1.4,-1.2],[-1.95,-1.2]]),.3*k,0,0,0,0,0,0,.06*k);
    G.ext('wood',C.woodD,P([[-1.8,.26],[-2.6,.2],[-4.4,.3],[-4.6,.3],[-4.6,-.7],[-4.3,-.7],[-2.9,-.3],[-1.8,-.3]]),.34*k,0,0,0,0,0,0,.08*k);
    return{fix:F.geos(),gun:G.geos({lo:.92}),muz:X(7.15)+.3};});
  const fix=ddrPart(M.fix),gun=ddrPart(M.gun);for(const g of[fix,gun]){g.userData.real=true;for(const m of g.children)if(m.userData.ddrK!=='steel')m.castShadow=false;}
  return{fix,gun,muz:[M.muz/(DD_FIG*1.06),(DD_TANKMG.waist+y0)/(DD_FIG*.9),0]};
}

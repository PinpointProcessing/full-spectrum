/* Figures: people and zombies, all generated here in code (no imported models).
   Each body is ONE smooth skinned mesh: limbs are lofted from rings of vertices and weighted to a 14-bone skeleton, so
   elbows, knees and waists bend instead of hinging. The head is a second, rigid mesh: a sculpted skull with eyes, brows,
   nose, mouth, ears and hair. Clothing is painted into the vertex colours (sleeves, hems, ties, blood, tears).
   Model faces +x; +z is its right. */
const PK=['by','br','lean','twist','hz','hy','sLz','sLx','sRz','sRx','eL','eR','wR','hL','hR','kL','kR'];
const BONE={body:0,hips:1,chest:2,head:3,sL:4,eL:5,haL:6,sR:7,eR:8,haR:9,hL:10,kL:11,hR:12,kR:13};
const SKINS=[0xe0ac86,0xcf9670,0xa9744f,0x7a5035,0xecc19c,0x8f5f3f];
const HAIRS=[0x1c1412,0x3a2618,0x6a4a2a,0x9a7a4a,0x2a2a2e,0x7a2a18,0xc9c4bc];
function vnoise(x,y,s){
  const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  const h=(a,b)=>{const n=Math.sin(a*127.1+b*311.7+s*74.7)*43758.5453;return n-Math.floor(n);};
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return lerp(lerp(h(xi,yi),h(xi+1,yi),u),lerp(h(xi,yi+1),h(xi+1,yi+1),u),v);
}
const _k1=new T.Color(),_k2=new T.Color();
const lin=(hex,out)=>(out||_k1).set(hex).convertSRGBToLinear();

/* ---- mesh builder: rings of vertices lofted into tubes, each vertex tied to one or two bones ---- */
function MB(){this.P=[];this.K=[];this.SI=[];this.SW=[];this.I=[];this.n=0;}
MB.prototype.v=function(x,y,z,c,a,b,t){this.P.push(x,y,z);this.K.push(c.r,c.g,c.b);this.SI.push(a,b,0,0);this.SW.push(1-t,t,0,0);return this.n++;};
/* rings: [{c:[x,y,z],rx,rz,w:[boneA,boneB,blend],...}]. Lofts round the y axis, or the x axis when ax==='x'. */
MB.prototype.loft=function(rings,n,paint,ax,capA,capB){
  const s=this.n,i0=this.I.length;
  for(const r of rings)for(let i=0;i<n;i++){
    const a=i/n*TAU;let x,y,z;
    if(ax==='x'){x=r.c[0];y=r.c[1]+r.rx*Math.sin(a);z=r.c[2]+r.rz*Math.cos(a);}else{x=r.c[0]+r.rx*Math.cos(a);y=r.c[1];z=r.c[2]+r.rz*Math.sin(a);}
    this.v(x,y,z,paint(r,a,x,y,z),r.w[0],r.w[1],r.w[2]||0);
  }
  for(let k=0;k<rings.length-1;k++)for(let i=0;i<n;i++){const a=s+k*n+i,b=s+k*n+(i+1)%n,c=a+n,d=b+n;this.I.push(a,c,d,a,d,b);}
  if(capA){const r=rings[0],ci=this.v(r.c[0],r.c[1],r.c[2],paint(r,0,r.c[0],r.c[1],r.c[2],1),r.w[0],r.w[1],r.w[2]||0);for(let i=0;i<n;i++)this.I.push(ci,s+i,s+(i+1)%n);}
  if(capB){const r=rings[rings.length-1],e=s+(rings.length-1)*n,ci=this.v(r.c[0],r.c[1],r.c[2],paint(r,0,r.c[0],r.c[1],r.c[2],1),r.w[0],r.w[1],r.w[2]||0);for(let i=0;i<n;i++)this.I.push(ci,e+(i+1)%n,e+i);}
  // make sure the faces point outward: test the widest ring against its own centre
  let k=0;for(let j=1;j<rings.length-1;j++)if(rings[j].rx>rings[k].rx)k=j;if(k===rings.length-1)k--;
  const P=this.P,a=s+k*n,c=a+n,d=a+n+1,rc=rings[k].c;
  const ux=P[c*3]-P[a*3],uy=P[c*3+1]-P[a*3+1],uz=P[c*3+2]-P[a*3+2],vx=P[d*3]-P[a*3],vy=P[d*3+1]-P[a*3+1],vz=P[d*3+2]-P[a*3+2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  if(nx*(P[a*3]-rc[0])+ny*(P[a*3+1]-rc[1])+nz*(P[a*3+2]-rc[2])<0)for(let i=i0;i<this.I.length;i+=3){const t=this.I[i+1];this.I[i+1]=this.I[i+2];this.I[i+2]=t;}
};
/* a ready-made shape (box, sphere...) riding on one bone */
MB.prototype.add=function(g,hex,bone){
  const p=g.attributes.position,ix=g.index,s=this.n,c=lin(hex,_k2);
  for(let i=0;i<p.count;i++)this.v(p.getX(i),p.getY(i),p.getZ(i),c,bone,bone,0);
  if(ix)for(let i=0;i<ix.count;i++)this.I.push(s+ix.array[i]);else for(let i=0;i<p.count;i++)this.I.push(s+i);
  g.dispose();
};
MB.prototype.build=function(){
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(this.P,3));g.setAttribute('color',new T.Float32BufferAttribute(this.K,3));
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(this.SI,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(this.SW,4));
  g.setIndex(this.I);g.computeVertexNormals();return g;
};
const tg=(g,sx,sy,sz,x,y,z,rx,ry,rz)=>{g.scale(sx,sy,sz);if(rx||ry||rz){if(rx)g.rotateX(rx);if(ry)g.rotateY(ry);if(rz)g.rotateZ(rz);}g.translate(x,y,z);return g;};
/* interpolate a profile [[y,rx,rz,cx],...] (sorted by descending y) at height y */
function prof(pts,y){
  if(y>=pts[0][0])return pts[0];if(y<=pts[pts.length-1][0])return pts[pts.length-1];
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(y<=a[0]&&y>=b[0]){const t=(a[0]-y)/(a[0]-b[0]||1);return[y,lerp(a[1],b[1],t),lerp(a[2],b[2],t),lerp(a[3]||0,b[3]||0,t)];}}
  return pts[0];
}

/* ---- what colour is this vertex? Clothes, skin, shading, and for zombies: tears, blood and bruising ---- */
function painter(sp,seed){
  const out=new T.Color(),Z=sp.zed,sk=sp.skin,hemY=sp.kind==='hoodie'||sp.kind==='jacket'?9.9:10.7;
  const mix=(hex,t)=>{out.lerp(lin(hex),t);};
  return function(r,a,x,y,z,cap){
    const part=r.part,ca=Math.cos(a),sa=Math.sin(a);let hex,cloth=true;
    if(part==='torso'){
      const robe=sp.kind==='robe';
      if(r.k==='neck'){hex=cap?0x6a0d0a:sk;cloth=false;}
      else if(r.k!=='hem'&&y<hemY-.005&&!robe&&sp.kind!=='dress')hex=sp.belt&&y>hemY-.55?sp.belt:sp.pants;
      else{
        hex=sp.top;
        if(sp.kind==='tank'&&y>15.9&&Math.abs(sa)>.5){hex=sk;cloth=false;}
        if(sp.kind==='jacket'&&ca>.93)hex=sp.inner||0xdedede;
        if(robe&&ca>.2&&y>13.4&&Math.abs(sa)<(y-13.4)*.075){hex=sp.inner||sk;cloth=!!sp.inner;}
        if(robe&&sp.belt&&y>10.3&&y<11.1)hex=sp.belt;
        if(sp.vneck&&ca>.3&&y>15.4&&Math.abs(sa)<(y-15.4)*.2){hex=sk;cloth=false;}
        if(sp.tie&&ca>.98&&y>11.8&&y<17.4)hex=sp.tie;
        if(sp.stripe&&y>13.6&&y<14.6)hex=sp.stripe;
        if(y>17.45&&sp.kind!=='hoodie'&&sp.kind!=='jacket'){hex=sk;cloth=false;}
        else if(y>17&&sp.collar)hex=sp.collar;
      }
    }else if(part==='arm'){
      if(r.k==='skin'){hex=sk;cloth=false;}else hex=sp.sleeveC||sp.top;
      if(r.k==='cuff')hex=sp.cuff||sp.sleeveC||sp.top;
    }else if(part==='hand'){hex=sp.glove||sk;cloth=!!sp.glove;}
    else if(part==='leg'){
      if(r.k==='skin'){hex=sk;cloth=false;}else if(r.k==='sock')hex=sp.sock||0xe8e8e8;else hex=sp.pants;
      if(sp.pstripe&&r.k==='cloth'&&Math.abs(sa)>.93)hex=sp.pstripe;
    }else if(part==='skirt'){hex=sp.skirt||sp.top;}
    else if(part==='shoe'){hex=sa<-.45?(sp.sole||0x1a1a1c):sp.shoe;}
    else hex=sp.top;
    out.copy(lin(hex));
    // cheap shading baked in: darker in the armpits, between the legs and inside the arms, a little grain everywhere
    let sh=1;
    if(part==='torso'&&y>14.3&&y<17.3&&Math.abs(sa)>.8)sh*=.8;
    if(part==='torso'&&y<9.6)sh*=.82;
    if((part==='leg'||part==='arm')&&sa*(r.side||1)<-.55)sh*=.84;
    if(part==='torso'&&r.k==='neck')sh*=.86;
    sh*=.95+vnoise(x*1.7+z,y*1.7,seed)*.1;
    if(cloth)sh*=.9+.1*vnoise(ca*2+y*.9,sa*2+y*.4,seed+3);   // soft folds
    if(Z){
      const n1=vnoise(ca*1.4+y*.42+(r.side||0),sa*1.4-y*.2,seed+11),n2=vnoise(ca*1.9+y*.6,sa*1.9+y*.33+(r.side||0)*2,seed+29);
      if(!cloth)mix(0x4b4a5c,.12+n1*.34);                                                   // dead, mottled skin
      else if(n1>.87&&part!=='shoe'){out.copy(lin(sk));mix(0x4b4a5c,.3);sh*=.9;}   // torn through
      let b=0;
      if(part==='torso')b=Math.max(0,ca)*(y>11?1:.4)*n2*1.5;
      else if(part==='hand')b=.55+n2*.5;
      else if(part==='arm'&&y<12.5)b=n2*.9;
      else if(part==='leg'&&y<5)b=n2*.5;
      if(b>.5)mix(0x3d0504,clamp((b-.5)*5,0,.94));
      if(y<3.2)sh*=.78;
    }
    out.multiplyScalar(sh);return out;
  };
}

/* ---- the body ---- */
function buildBody(sp,seed){
  const mb=new MB(),B=BONE,bw=sp.bw||1,fem=sp.fem?1:0,fat=sp.fat||0,paint=painter(sp,seed),lim=(fem?.88:1)*Math.sqrt(bw),hi=!!sp.hi;
  const shW=fem?.9:1,sz=2.5*bw*shW+1.0,kind=sp.kind,hemY=kind==='hoodie'||kind==='jacket'?9.9:10.7;
  // torso, pelvis to neck
  const tp=[[19.4,.84,.88,.1],[18.5,.88,.92,.05],[17.9,.96,1.02,0],[17.3,1.4,2.05*bw*shW,0],[16.2,1.88,2.82*bw*shW,.05],[14.6,1.98+fem*.26+fat*.3,2.76*bw*shW,.1+fem*.14],
    [12.8,1.7+fat*.9,2.46*bw*(fem?.92:1),fat*.55],[11.5,1.62+fat*1.15,2.36*bw*(fem?.88:1),fat*.8],[10.4,1.8+fat*.75,2.66*bw*(fem?1.06:1),fat*.55],[9.3,1.66+fat*.3,2.48*bw,fat*.2],[8.75,.95,1.4,0]];
  const loose=kind==='hoodie'||kind==='jacket'||kind==='robe'?1.1:kind==='tank'?1.01:1.05,tr=[];
  for(const y of hi?[8.75,9.3,9.9,10.4,10.7,11.5,12.2,12.8,13.7,14.6,15.4,16.2,16.8,17.3,17.9,18.5,19.4]:[8.75,9.3,9.9,10.4,10.7,11.5,12.8,13.7,14.6,16.2,17.3,17.9,18.5,19.4]){
    const p=prof(tp,y),cl=y>=hemY&&y<17.3?loose:1,w=y<10.9?[B.hips,B.hips,0]:y<12.3?[B.hips,B.chest,(y-10.9)/1.4]:y<18.2?[B.chest,B.chest,0]:[B.chest,B.head,.6];
    if(Math.abs(y-hemY)<.01&&kind!=='robe'&&kind!=='dress'){tr.push({c:[p[3],y-.03,0],rx:p[1],rz:p[2],w,part:'torso',k:''});tr.push({c:[p[3],y,0],rx:p[1]*cl*1.05,rz:p[2]*cl*1.04,w,part:'torso',k:'hem'});}
    else tr.push({c:[p[3],y,0],rx:p[1]*cl,rz:p[2]*(y<16.5?cl:1),w,part:'torso',k:y>=17.9?'neck':''});
  }
  mb.loft(tr,hi?20:13,paint,'y',true,true);
  if(kind!=='robe'&&kind!=='hoodie'&&kind!=='tank')mb.add(tg(new T.TorusGeometry(1.1,.15,hi?5:4,hi?16:10),1,1,1.02,.02,17.62,0,PI/2,0,0),sp.collar||new T.Color(sp.top).multiplyScalar(.82).getHex(),B.chest);
  // a long robe or dress hangs from the waist; each side swings with its own thigh
  if(sp.kind==='robe'||sp.kind==='dress'){
    const sk=[[10.7,2.02+fat*.8,3.0*bw,fat*.5,0],[8.4,2.15+fat*.5,3.1*bw,fat*.3,.35],[5.8,2.25,3.15*bw,0,.6],[sp.kind==='robe'?3.4:5.2,2.4,3.25*bw,0,.7]];
    const s0=mb.n;mb.loft(sk.map(([y,rx,rz,cx,t])=>({c:[cx,y,0],rx,rz,w:[B.hips,B.hR,t],part:'skirt'})),14,paint,'y');
    for(let i=s0;i<mb.n;i++)if(mb.P[i*3+2]<0)mb.SI[i*4+1]=B.hL;   // left half follows the left leg
  }
  for(const s of[1,-1]){
    const L=s<0,sB=L?B.sL:B.sR,eB=L?B.eL:B.eR,hB=L?B.haL:B.haR,tB=L?B.hL:B.hR,kB=L?B.kL:B.kR,zs=s*sz,zl=s*1.36*bw;
    /* arm */
    if(sp.noArm!==(L?'L':'R')){
      const ap=[[17.9,.4,.4],[17.6,.96,.96],[17,1.2,1.18],[15.6,1.05,1.02],[13.8,.9,.88],[12.9,.88,.86],[12.2,.94,.9],[10.8,.8,.77],[9.3,.6,.57]];
      const sl=sp.sleeve||(kind==='tank'?'none':kind==='tee'?'short':'long'),end=sl==='none'?99:sl==='short'?14.7:9.3,cl=kind==='hoodie'||kind==='jacket'||kind==='robe'?1.16:1.07;
      const ys=hi?[17.9,17.6,17,16.3,15.6,14.7,13.8,13.3,12.9,12.5,12.1,11.4,10.6,9.9,9.3]:[17.9,17.6,17,15.6,14.7,13.8,12.9,12.1,10.6,9.3],rings=[];
      for(const y of ys){
        const p=prof(ap,y),w=y>13.5?[sB,sB,0]:y>12.3?[sB,eB,(13.5-y)/1.2]:[eB,eB,0],cloth=y>=end;
        if(Math.abs(y-end)<.01&&sl!=='none'){rings.push({c:[0,y,zs],rx:p[1]*lim*cl*1.04,rz:p[2]*lim*cl*1.04,w,part:'arm',k:'cuff',side:s});rings.push({c:[0,y-.06,zs],rx:p[1]*lim*(sl==='long'?.9:1),rz:p[2]*lim*(sl==='long'?.9:1),w,part:'arm',k:'skin',side:s});}
        else rings.push({c:[0,y,zs],rx:p[1]*lim*(cloth?cl:1),rz:p[2]*lim*(cloth?cl:1),w,part:'arm',k:cloth?'cloth':'skin',side:s});
      }
      mb.loft(rings,hi?12:8,paint,'y',true,false);
      // hand: a flat mitten with a thumb, palm turned in toward the leg
      const hr=[[9.3,.56,.46,0],[8.95,.58,.4,.02],[8.5,.68,.38,.06],[8,.7,.36,.1],[7.6,.6,.33,.14],[7.3,.42,.26,.17],[7.18,.18,.12,.18]];
      mb.loft(hr.map(([y,rx,rz,cx])=>({c:[cx,y,zs],rx:rx*lim,rz:rz*lim,w:y>9?[eB,hB,.5]:[hB,hB,0],part:'hand',side:s})),hi?10:6,paint,'y',false,true);
      mb.loft([[8.75,.2],[8.45,.26],[8.1,.24],[7.85,.12]].map(([y,r],i)=>({c:[.6+i*.18,y,zs-s*.06],rx:r*lim,rz:r*lim,w:[hB,hB,0],part:'hand',side:s})),hi?6:4,paint,'y',true,true);
    }else{
      mb.add(tg(new T.SphereGeometry(.95,8,6),1,1.1,.8,0,16.75,zs*.86),0x3d0504,B.chest);mb.add(tg(new T.CylinderGeometry(.22,.3,1.5,6),1,1,1,0,16,zs*.95,s*-.5,0,0),0xd8d0b8,B.chest);   // what's left of it
    }
    /* leg */
    const lp=[[10.3,.9,.9,0],[10,1.42,1.4,0],[9.6,1.58,1.52,0],[8.2,1.5,1.42,0],[6.3,1.22,1.16,0],[5.3,1.06,1.04,.05],[4.9,1.03,1.02,.05],[4.4,.98,.96,0],[3.5,1.03,.96,-.16],[1.7,.7,.68,-.05],[1,.68,.68,0]];
    const long=sp.legs!=='shorts'&&sp.legs!=='bare',pend=long?1.25:sp.legs==='bare'?99:6.1,pl=1.07,sockY=sp.sock?2.5:0;
    const lys=hi?[10.3,10,9.6,8.9,8.2,7.3,6.3,6.1,5.7,5.3,4.9,4.5,4,3.5,2.6,2.5,1.7,1.25,1]:[10.3,10,9.6,8.2,6.3,6.1,5.3,4.9,4.4,3.5,2.5,1.7,1.25,1],lr=[];
    for(const y of lys){
      const p=prof(lp,y),w=y>9.3?[B.hips,tB,.75]:y>5.5?[tB,tB,0]:y>4.3?[tB,kB,(5.5-y)/1.2]:[kB,kB,0],cloth=y>=pend;
      const k=cloth?'cloth':y<=sockY?'sock':'skin',f=lim*(fem?1.02:1)*(cloth?pl:1)*(1+fat*.12);
      if(Math.abs(y-pend)<.01&&pend<50){lr.push({c:[p[3],y,zl],rx:p[1]*f*1.06,rz:p[2]*f*1.06,w,part:'leg',k:'cloth',side:s});lr.push({c:[p[3],y-.06,zl],rx:p[1]*lim*.94,rz:p[2]*lim*.94,w,part:'leg',k:y<=sockY?'sock':'skin',side:s});}
      else lr.push({c:[p[3],y,zl],rx:p[1]*f,rz:p[2]*f,w,part:'leg',k,side:s});
    }
    mb.loft(lr,hi?12:8,paint,'y',true,false);
    // shoe: lofted heel to toe, sole painted on the underside
    const sr=[[-1.35,.5,.3,.44],[-1.05,.88,.74,.78],[-.2,1,.92,.88],[.9,.86,.78,.94],[2,.64,.54,.94],[2.8,.46,.36,.76],[3.2,.38,.18,.34]];
    mb.loft(sr.map(([x,cy,ry,rz])=>({c:[x,cy,zl],rx:ry,rz:rz*(fem?.92:1),w:[kB,kB,0],part:'shoe',side:s})),hi?10:7,paint,'x',true,true);
  }
  // extras that ride on one bone
  if(sp.pack){mb.add(tg(new T.BoxGeometry(2.4,5.2,4.6),1,1,1,-3.1,14.3,0),sp.pack,B.chest);mb.add(tg(new T.BoxGeometry(2.5,1.6,3.6),1,1,1,-3.3,12.6,0),sp.pack,B.chest);for(const s of[1,-1])mb.add(tg(new T.BoxGeometry(4.6,.5,.7),1,1,1,-.3,16.6,s*2.1,0,0,-.5),sp.pack,B.chest);}
  if(sp.hood)mb.add(tg(new T.SphereGeometry(1.7,10,8),1.05,.8,1.15,-1.5,18,0),sp.top,B.chest);
  if(sp.badge)mb.add(tg(new T.BoxGeometry(.25,.9,.8),1,1,1,2.02*loose+.05,15.5,1.5),sp.badge,B.chest);
  if(sp.tag)mb.add(tg(new T.BoxGeometry(.16,.8,.6),1,1,1,2.02*loose+.02,14.4,-1.4),sp.tag,B.chest);
  if(sp.steth){const g=new T.TorusGeometry(1.5,.14,5,14,PI*1.3);mb.add(tg(g,1,1,1,.5,17.3,0,PI/2-.5,0,-PI/2+2.2),0x22262c,B.chest);mb.add(tg(new T.CylinderGeometry(.4,.4,.2,8),1,1,1,2.2,14.2,.8,0,0,PI/2),0xb8bcc2,B.chest);}
  if(sp.bag){mb.add(tg(new T.BoxGeometry(2.4,3.6,1.6),1,1,1,-.2,9.6,3.2*bw),sp.bag,B.hips);mb.add(tg(new T.BoxGeometry(.14,8.6,.6),1,1,1,2.12,13.9,.1,.62,0,0),sp.bag,B.chest);mb.add(tg(new T.BoxGeometry(.14,8.6,.6),1,1,1,-2.05,13.9,.1,-.62,0,0),sp.bag,B.chest);}
  if(sp.holster){mb.add(tg(new T.BoxGeometry(1.4,2.4,.9),1,1,1,.2,9.4,2.95*bw),0x15161a,B.hips);mb.add(tg(new T.BoxGeometry(1,1.1,.9),1,1,1,-1,10.3,-2.85*bw),0x15161a,B.hips);}
  if(sp.buckle)mb.add(tg(new T.BoxGeometry(.3,.8,1.1),1,1,1,1.9+fat*1.4,10.45,0),sp.buckle,B.hips);
  if(sp.knot)mb.add(tg(new T.BoxGeometry(.7,.7,1.3),1,1,1,2.25+fat*1.5,10.7,.3),sp.belt,B.hips);
  return mb.build();
}

/* ---- the head: a skull shaped from a sphere, then a face and hair put on it ---- */
function skullAt(x,y,z,out,grow){   // unit-sphere point -> head space (origin at the base of the skull)
  let X=x*1.82,Y=y*2.08,Z=z*1.66;
  if(y<0){const t=-y,t2=t*t;Z*=1-.4*t2;X*=1-.2*t2;X+=.3*t2*(x>0?1:.15);}
  X*=x>0?.94:1.07;if(y>.15)Z*=1.04;
  const g=grow||1;out.set(X*g+.12,Y*(1+(g-1)*.8)+2.12+(g-1)*.5,Z*g);return out;
}
function tintGeo(g,fn){
  const p=g.attributes.position,k=new Float32Array(p.count*3),c=new T.Color();
  for(let i=0;i<p.count;i++){fn(p.getX(i),p.getY(i),p.getZ(i),c);k[i*3]=c.r;k[i*3+1]=c.g;k[i*3+2]=c.b;}
  g.setAttribute('color',new T.BufferAttribute(k,3));return{g,keep:1};
}
/* hair is a second, slightly larger skull. Anything below the hairline is pulled inside the head, which leaves a clean edge. */
function hairShell(seed,hex,grow,line,rough,hi){
  const g=new T.SphereGeometry(1,hi?20:13,hi?15:10),p=g.attributes.position,v=new T.Vector3(),s=new T.Vector3();
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);skullAt(x,y,z,s,1);skullAt(x,y,z,v,grow);
    if(s.y<line(s.x,Math.abs(s.z),s.y)){v.copy(s).sub(_v.set(.1,2.2,0)).multiplyScalar(.86).add(_v);}
    else{const n=vnoise(x*4+seed,y*4+z*4,seed)-.5;v.x+=x*n*rough;v.y+=Math.abs(n)*rough*.8;v.z+=z*n*rough;}
    p.setXYZ(i,v.x,v.y,v.z);
  }
  g.computeVertexNormals();const base=lin(hex,new T.Color());
  return tintGeo(g,(x,y,z,c)=>{c.copy(base).multiplyScalar(.78+vnoise(x*3,y*5+z*3,seed)*.4);});
}
const HLINE={
  short:(x,z)=>x>1.05?3.3-z*.12:x>.25?lerp(2.55,3.3,(x-.25)/.8):x>-.6?lerp(1.35,2.55,(x+.6)/.85):1.25,
  crop:(x,z)=>x>1?3.42:x>.2?lerp(2.75,3.42,(x-.2)/.8):x>-.6?lerp(1.7,2.75,(x+.6)/.8):1.6,
  side:(x,z,y)=>y>3.25||x>.75?99:x>-.5?lerp(1.4,2.5,(x+.5)/1.25):1.3,
  long:(x,z)=>x>1.05?3.25-z*.3:x>.5?lerp(1.2,3.25,(x-.5)/.55):-9,
};
function buildHead(sp,seed){
  const it=[],sk=lin(sp.skin,new T.Color()),Z=sp.zed,hc=sp.hairC||0x2b2019,v=new T.Vector3(),hi=!!sp.hi,S=(r,a,b)=>new T.SphereGeometry(r,hi?a:Math.max(5,a-3),hi?b:Math.max(4,b-2));
  const add=(g,hex)=>it.push({g,c:hex});
  // skull and face
  const g=new T.SphereGeometry(1,hi?20:14,hi?15:11),p=g.attributes.position;
  for(let i=0;i<p.count;i++){skullAt(p.getX(i),p.getY(i),p.getZ(i),v);
    if(v.x>1.25&&v.y>2.05&&v.y<2.6&&Math.abs(v.z)>.3&&Math.abs(v.z)<1.15)v.x-=.1;            // eye sockets
    if(v.x>1.1&&v.y>2.65&&v.y<3&&Math.abs(v.z)<1.2)v.x+=.07;                                   // brow ridge
    if(v.x>1.1&&v.y>1.25&&v.y<1.9&&Math.abs(v.z)>.55&&Math.abs(v.z)<1.2)v.x+=.06;              // cheeks
    p.setXYZ(i,v.x,v.y,v.z);}
  g.computeVertexNormals();
  it.push(tintGeo(g,(x,y,z,c)=>{
    c.copy(sk);let sh=.96+vnoise(x*2+z*2,y*2,seed)*.08;
    if(x>1.2&&y>2&&y<2.65&&Math.abs(z)>.25&&Math.abs(z)<1.2)sh*=.86;      // shadow round the eyes
    if(y<.75)sh*=.84;                                                     // under the jaw
    if(!Z&&x>1&&y>1.2&&y<1.9&&Math.abs(z)>.6)c.lerp(lin(0xc0604a),.14);   // a little colour in the cheeks
    if(sp.stubble&&x>.5&&y<1.75&&(y<1.35||Math.abs(z)>.75))c.lerp(lin(sp.stubble),.34);
    if(Z){c.lerp(lin(0x4b4a5c),.14+vnoise(x*1.6+seed,y*1.6+z,seed)*.36);
      if(x>.9&&y<1.55)c.lerp(lin(0x4a0605),clamp(vnoise(z*2.2,y*2.4,seed+5)*1.7-.25,0,.92));   // blood down the chin
      if(vnoise(x*1.3+z*1.7,y*1.5,seed+9)>.76)c.lerp(lin(0x3a0505),.8);}                       // open wounds
    c.multiplyScalar(sh);}));
  // ears, nose
  for(const s of[1,-1])add(tg(S(.44,8,6),.55,1,.42,.02,2.08,s*1.74),new T.Color(sp.skin).multiplyScalar(.93).getHex());
  add(tg(S(.36,8,6),.95,1.2,.92,1.86,1.74,0,0,0,-.25),new T.Color(sp.skin).multiplyScalar(.95).getHex());
  add(tg(new T.BoxGeometry(.3,.85,.34),1,1,1,1.7,2.25,0,0,0,-.12),sp.skin);
  // eyes
  const white=Z?0xd8cf9c:0xf1eee6,iris=Z?(sp.glow?0x300808:0xb9c4b8):(sp.eyeC||0x3a2a1c);
  for(const s of[1,-1]){
    add(tg(S(.4,10,8),.5,.74,1,1.5,2.31,s*.72),white);
    add(tg(S(.21,8,6),.45,1,1,1.67,2.3,s*.72),iris);
    if(!sp.glow)add(tg(S(.1,6,4),.45,1,1,1.72,2.3,s*.72),0x0a0a0a);
    if(hi)add(tg(new T.BoxGeometry(.2,.1,.9),1,1,1,1.62,2.58,s*.72,s*-.06,0,0),new T.Color(sp.skin).multiplyScalar(.8).getHex());   // upper lid
    if(sp.brow!==0)add(tg(new T.BoxGeometry(.22,.15,.92),1,1,1,1.69,2.86+(Z?-.03:0),s*.72,s*(Z?-.3:sp.fem?.05:-.07),0,0),sp.brow||new T.Color(hc).multiplyScalar(.8).getHex());
  }
  // mouth
  if(Z){add(tg(S(.5,8,6),.5,.78,.95,1.47,.92,0),0x160405);add(tg(new T.BoxGeometry(.14,.16,.86),1,1,1,1.63,1.26,0),0xd9d2b4);add(tg(new T.BoxGeometry(.14,.14,.7),1,1,1,1.52,.6,0),0xcfc8a8);}
  else{add(tg(new T.BoxGeometry(.16,.1,.98),1,1,1,1.56,1.0,0),sp.fem?0xa8483e:0x8a4f44);add(tg(new T.BoxGeometry(.14,.07,.6),1,1,1,1.55,.9,0),sp.fem?0xb85a4e:0x9a5f52);}
  if(sp.stache)add(tg(new T.BoxGeometry(.3,.3,1.3),1,1,1,1.7,1.28,0),sp.stache);
  if(sp.glasses){for(const s of[1,-1]){add(tg(new T.TorusGeometry(.43,.06,5,12),1,1,1,1.8,2.3,s*.72,0,PI/2,0),sp.glasses);add(tg(new T.BoxGeometry(1.9,.08,.08),1,1,1,.9,2.38,s*1.5),sp.glasses);}add(tg(new T.BoxGeometry(.08,.08,.6),1,1,1,1.82,2.36,0),sp.glasses);}
  // hair and hats
  const st=sp.hair||'short',hat=sp.hat;
  if(st==='short'||st==='pony'||st==='bun'||st==='curl'||st==='band')it.push(hairShell(seed,hc,1.085,HLINE.short,.1,hi));
  else if(st==='crop')it.push(hairShell(seed,hc,1.045,HLINE.crop,.04,hi));
  else if(st==='side')it.push(hairShell(seed,hc,1.07,HLINE.side,.08,hi));
  else if(st==='afro')it.push(hairShell(seed,hc,1.34,HLINE.short,.2,hi));
  else if(st==='long'||st==='bob'){
    it.push(hairShell(seed,hc,1.1,HLINE.long,.1,hi));
    const len=st==='long'?2.9:1.9,b=new T.SphereGeometry(1,14,10),bp=b.attributes.position;
    for(let i=0;i<bp.count;i++){let x=bp.getX(i)*1.45-.62,y=bp.getY(i)*len+(st==='long'?.7:1.5),z=bp.getZ(i)*1.9;if(x>.55){x=.2;z*=.5;}bp.setXYZ(i,x,y,z);}
    b.computeVertexNormals();const base=lin(hc,new T.Color());it.push(tintGeo(b,(x,y,z,c)=>{c.copy(base).multiplyScalar(.74+vnoise(z*4,y*1.2,seed)*.4);}));
  }
  if(st==='pony'){add(tg(new T.CylinderGeometry(.55,.16,3.6,8),1,1,1,-2.5,1.9,0,0,0,-.45),hc);add(tg(new T.SphereGeometry(.5,8,6),1,1,1,-2,3.2,0),new T.Color(hc).multiplyScalar(.8).getHex());}
  if(st==='bun')add(tg(new T.SphereGeometry(.85,10,8),1,1,1,-1.5,3.9,0),hc);
  if(st==='curl')for(const[x,z]of[[1,-.9],[1,.9],[-.1,-1.2],[-.1,1.2],[.5,0],[-1,-.6],[-1,.6]])add(tg(new T.CylinderGeometry(.42,.42,1.3,7),1,1,1,x,4.25-Math.abs(z)*.2-Math.abs(x)*.12,z,PI/2,0,0),0xf08ab0);
  if(st==='band')add(tg(new T.CylinderGeometry(1,1,.5,16,1,true),1.92,1,1.8,.14,3.08,0),sp.hatC||0xe8e8e8);
  if(hat==='cap'){add(tg(new T.SphereGeometry(1,16,8,0,TAU,0,PI/2),2.02,1.5,1.86,.12,3,0),sp.hatC);add(tg(new T.CylinderGeometry(1.45,1.45,.14,14,1,false,0,PI),1,1,1.25,1.5,3.02,0),sp.hatC);if(sp.badge)add(tg(new T.BoxGeometry(.2,.6,.6),1,1,1,2.05,3.5,0),sp.badge);}
  if(hat==='beanie'){add(tg(new T.SphereGeometry(1,16,9,0,TAU,0,PI/2),2.04,1.95,1.9,.12,2.75,0),sp.hatC);add(tg(new T.CylinderGeometry(1,1,.6,16,1,true),2.1,1,1.95,.12,3,0),new T.Color(sp.hatC).multiplyScalar(.82).getHex());}
  const m=merge(it);return m;
}

function makeFig(sp){
  const seed=Math.random()*90+1;
  const mat=vmat({roughness:.74,skinning:true}),hmat=vmat({roughness:.66});
  const f={sp,mat,hmat,g:new T.Group(),j:{},cur:{},tgt:{},ph:Math.random()*TAU,seed:Math.random()*10,flash:0,weap:{},wname:null,eyes:null,sh:undefined};
  for(const k of PK){f.cur[k]=0;f.tgt[k]=0;}
  f.scale=(sp.h||1)*.85;f.g.scale.setScalar(f.scale);
  const bw=sp.bw||1,sz=2.5*bw*(sp.fem?.9:1)+1.0,J=f.j,bones=[];
  const bone=(name,par,x,y,z)=>{const b=new T.Bone();b.position.set(x,y,z);if(par)par.add(b);J[name]=b;bones[BONE[name]]=b;return b;};
  bone('body',null,0,0,0);bone('hips',J.body,0,10.4,0);bone('chest',J.hips,0,1.5,0);bone('head',J.chest,0,6.9,0);
  bone('sL',J.chest,0,5.1,-sz);bone('eL',J.sL,0,-4.1,0);bone('haL',J.eL,0,-4,0);
  bone('sR',J.chest,0,5.1,sz);bone('eR',J.sR,0,-4.1,0);bone('haR',J.eR,0,-4,0);
  bone('hL',J.hips,0,-.8,-1.36*bw);bone('kL',J.hL,0,-4.7,0);bone('hR',J.hips,0,-.8,1.36*bw);bone('kR',J.hR,0,-4.7,0);
  J.handR=J.haR;
  J.body.updateMatrixWorld(true);
  const mesh=new T.SkinnedMesh(buildBody(sp,seed),mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
  f.skel=new T.Skeleton(bones);mesh.add(J.body);mesh.bind(f.skel);f.g.add(mesh);f.mesh=mesh;
  // the head rides on the head bone and can come off in one piece
  f.headG=new T.Group();const hm=new T.Mesh(buildHead(sp,seed),hmat);hm.castShadow=true;f.headG.add(hm);f.headG.scale.setScalar(sp.headS||1.15);f.headG.position.y=-.3;J.head.add(f.headG);
  if(sp.glow){const e=new T.Mesh(merge([{g:tg(new T.SphereGeometry(.2,6,5),.5,1,1,1.71,2.3,.72),c:sp.glow},{g:tg(new T.SphereGeometry(.2,6,5),.5,1,1,1.71,2.3,-.72),c:sp.glow}]),emat());f.headG.add(e);f.eyes=e;}
  scene.add(f.g);return f;
}
const WEAPG={
  bat:()=>[cy(.42,1,12.5,8,6,0,0,0xc19a68,0,0,PI/2),cy(.5,.5,3.4,8,1.2,0,0,0x1e1e22,0,0,PI/2),cy(.62,.62,.4,8,-.5,0,0,0xc19a68,0,0,PI/2)],
  club:()=>[cy(.26,.3,13,6,6.5,0,0,0xaab0b8,0,0,PI/2),cy(.4,.4,3,6,1,0,0,0x1c1c1e,0,0,PI/2),bx(1.4,2.6,1.1,13,-.9,0,0x9aa0a8)],
  board:()=>[bx(11.5,.55,3.4,5,0,0,0x7a3fb0),bx(3,.57,3.42,5,0,0,0xe8c84a),cy(.6,.6,3.2,8,1.6,-.8,0,0xe8e2c8,PI/2,0,0),cy(.6,.6,3.2,8,8.4,-.8,0,0xe8e2c8,PI/2,0,0)],
  iron:()=>[cy(.4,.4,11,6,5.5,0,0,0x30343a,0,0,PI/2),bx(1.1,2.4,1.1,11,.8,0,0x30343a),cy(.6,.6,1,6,-.2,0,0,0x30343a,0,0,PI/2)],
  baton:()=>[cy(.42,.42,9.5,6,4.7,0,0,0x15171a,0,0,PI/2),cy(.36,.36,2,6,1.6,-1,0,0x15171a)],
  pistol:()=>[bx(4,1.5,1.05,1.8,.1,0,0x1c1e22),bx(1.3,2.3,1,.3,-1.3,0,0x24262b,0,0,.2),bx(.8,.5,.3,2.4,.95,0,0x0c0c0e)],
  shotgun:()=>[cy(.5,.5,10,6,7,.2,0,0x1a1816,0,0,PI/2),bx(5,1.9,1.4,-.6,-.3,0,0x5a4030,0,0,-.12),bx(4,1.2,1.7,5.5,-.8,0,0x5a4030),bx(3,1.4,1.3,2,.1,0,0x26221e)],
};
function setWeapon(f,name){
  if(f.wname===name)return;f.wname=name;
  for(const k in f.weap)f.weap[k].visible=false;
  if(!name||!WEAPG[name])return;
  if(!f.weap[name]){const m=new T.Mesh(merge(WEAPG[name]()),vmat({roughness:.5,metalness:.3}));m.castShadow=true;m.position.set(.3,-1.6,0);if(name==='board'){m.rotation.z=-2.5;m.position.set(.2,-1.2,.6);}f.j.handR.add(m);f.weap[name]=m;}
  f.weap[name].visible=true;
}
function removeFig(f){scene.remove(f.g);if(f.headG.parent===scene)scene.remove(f.headG);f.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});f.headG.traverse(o=>{if(o.geometry)o.geometry.dispose();});f.mat.dispose();f.hmat.dispose();f.skel.dispose();}

/* ---- who looks like what ---- */
const SPEC={
  you:{hi:1,skin:0xd6a47e,kind:'tee',top:0xdcdad2,collar:0x8a2f2a,cuff:0x8a2f2a,stripe:0x8a2f2a,pants:0x34405a,belt:0x2a2420,shoe:0xe6e2d8,sole:0xb9b4a8,hair:'short',hairC:0x2e2118,stubble:0x4a3a30,eyeC:0x3a5a7a,bw:1.08,h:1.03},
  walt:{hi:1,skin:0xdcae90,kind:'robe',top:0x6d2a34,belt:0x4a1a22,knot:1,inner:0xe9e4d6,skirt:0x6d2a34,pants:0x8a9cb4,pstripe:0xdfe5ee,legs:'long',shoe:0x7a5a3e,sole:0x3a2a1e,hair:'side',hairC:0xdedede,stache:0xdedede,brow:0xc8c8c8,glasses:0x2a2a2e,bw:1.08,fat:.5,h:.97},
  jules:{hi:1,skin:0xa9744f,kind:'hoodie',top:0x3f7a5a,hood:1,pants:0x26282e,shoe:0xd84a3a,sole:0xf0ece0,hair:'crop',hairC:0x1c1412,hat:'beanie',hatC:0xd9a03a,pack:0x2a3550,bw:.86,h:.9},
  marisol:{hi:1,skin:0xcf9670,kind:'tee',top:0x3fa39a,vneck:1,pants:0x3a968e,shoe:0xe6e6e6,sole:0xb8b8b8,hair:'pony',hairC:0x1c1412,fem:1,steth:1,tag:0xd8d8d0,bw:.9,h:.93},
  dunn:{hi:1,skin:0x7a5035,kind:'long',top:0x1f2a44,collar:0x18223a,pants:0x161d30,pstripe:0x2a3a5c,belt:0x0c0c0e,buckle:0xc8c8c8,holster:1,shoe:0x0c0c0e,hair:'crop',hairC:0x141010,hat:'cap',hatC:0x1a2338,badge:0xe0c24a,stubble:0x2a1c14,bw:1.06,h:1},
};
const CIVTOPS=[0xb04a3a,0x3a6ea5,0xd9c34a,0x6a8a4a,0xb86aa0,0xe0e0e0,0x4a4a4a,0x2f6f88];
function civSpec(){
  const fem=Math.random()<.5;
  return{skin:pick(SKINS),kind:pick(['tee','long','hoodie','jacket','tank']),top:pick(CIVTOPS),inner:0xe4e0d6,pants:pick([0x2b3348,0x3a3a3a,0x5a4a3a,0x44506a]),legs:Math.random()<.25?'shorts':'long',sock:0xe8e8e8,
    shoe:pick([0xe6e2d8,0x1c1c1e,0x7a3a2a]),hair:pick(fem?['long','pony','bob','bun']:['short','crop','short','afro']),hairC:pick(HAIRS),fem,bw:fem?rand(.84,.95):rand(.95,1.1),h:fem?rand(.9,.97):rand(.95,1.03)};
}
const ZSKIN=[0x9aa58a,0x8a968c,0xa69f8e,0x7f8a78];
const ZLOOK=[
  ()=>({kind:'long',top:0xd4d8dc,tie:0x8a1a16,collar:0xe6e9ec,pants:0x3d4558,belt:0x1a1a1c,shoe:0x1c1614,hair:'short'}),                                // office
  ()=>({kind:'robe',top:0xd97fa8,belt:0xb85a86,knot:1,skirt:0xd97fa8,pants:0xd97fa8,legs:'bare',shoe:0xe6a8c4,sole:0xb87a98,hair:'curl',hairC:0x8a8a8a,fem:1}), // robe and curlers
  ()=>({kind:'tee',top:0x4a78b0,collar:0x30405a,pants:0x30405a,legs:'shorts',sock:0xdcdcdc,shoe:0x1a1a1c,hair:'short',hat:'cap',hatC:0x30405a,bag:0x7a5a3a}), // mail carrier
  ()=>({kind:'tank',top:0xe8e04a,pants:0x18181c,legs:'shorts',sock:0xf0f0f0,shoe:0xe85a2a,sole:0xf0f0f0,hair:'band',hatC:0xe8e04a}),                     // jogger
  ()=>({kind:'tank',top:0xdedad0,pants:0x7a94b8,legs:'shorts',shoe:0x6a5a4a,hair:'side',fat:.9,bw:1.18}),                                              // tank top and boxers
  ()=>({kind:'long',top:0x5a6e52,stripe:0x3f5238,pants:0x3a3a40,shoe:0x3a2a20,hair:'long',hairC:0x5a3a22,fem:1}),
  ()=>({kind:'hoodie',top:0x6b4636,hood:1,pants:0x2a2c30,shoe:0x24201c,hair:'crop',hairC:0x6a5a3a}),
  ()=>({kind:'tee',top:0x2f6f88,vneck:1,pants:0x2a6278,shoe:0xe0e0e0,hair:'pony',fem:1,tag:0xe8e8e8}),                                                  // scrubs
  ()=>({kind:'jacket',top:0x2c2f38,inner:0xc8ccd0,tie:0x24406a,pants:0x2c2f38,shoe:0x141210,hair:'short',hairC:0x8a8a8a}),                               // suit
  ()=>({kind:'dress',top:0x8a3a4a,skirt:0x8a3a4a,pants:0x8a3a4a,legs:'bare',shoe:0x2a1a1c,hair:'bob',hairC:0x7a2a18,fem:1}),
];
function zSpec(type,look){
  const L=(look!==undefined?ZLOOK[look]:pick(ZLOOK))(),skin=pick(ZSKIN);
  const sp=Object.assign({skin,hairC:pick(HAIRS),zed:1},L);
  if(sp.fem&&!sp.bw)sp.bw=.9;
  if(type==='runner'){sp.glow=0xff3a20;sp.bw=(sp.bw||1)*.92;sp.h=rand(.95,1.03);sp.fat=0;}
  else if(type==='brute'){Object.assign(sp,{glow:0xffb020,kind:'tank',top:0xdedad0,pants:0x4a5a7a,legs:'shorts',shoe:0x3a3028,hair:'side',fem:0,bw:1.5,fat:1.25,h:1.3,tie:0,bag:0,hat:0});}
  else{sp.h=rand(.92,1.04);if(Math.random()<.14)sp.noArm=Math.random()<.5?'L':'R';}
  return sp;
}

/* ---- animation: work out target joint angles from what the unit is doing, then ease toward them ---- */
function figAnim(f,u,dt,now){
  const p=f.tgt;for(const k of PK)p[k]=0;
  const sp=u.spd||0;let rate=22;
  if(u.dead){
    p.sLz=.5;p.sRz=-.35;p.sLx=-.9;p.sRx=.9;p.hL=.3;p.hR=-.15;p.kR=-.5;p.hz=.3;p.eL=.5;rate=9;
  }else if(u.kind==='z'){
    const t=u.ztype,run=t==='runner';
    f.ph+=sp*dt*(run?.14:.22);
    const s=Math.sin(f.ph),c=Math.cos(f.ph);
    if(run){const A=clamp(sp/50,0,1);
      p.hL=s*1.05*A;p.hR=-s*1.05*A;p.kL=-(Math.max(0,c)*1.3+.15)*A;p.kR=-(Math.max(0,-c)*1.3+.15)*A;
      p.lean=-.2-.42*A;p.sLz=.7-s*1.05*A;p.sRz=.7+s*1.05*A;p.eL=p.eR=1.1;p.hz=.5;p.by=Math.abs(c)*1.1*A;p.hy=Math.sin(now*9+f.seed)*.15;
    }else{const A=clamp(sp/15,0,1),br=t==='brute';
      p.hL=s*.5*A;p.hR=-s*.3*A;p.kL=-Math.max(0,c)*.7*A;p.kR=-.12;p.by=Math.abs(c)*.5*A;p.br=s*.13*A+(f.seed>5?.09:-.07);
      p.lean=-.26+Math.sin(now*1.3+f.seed)*.05;
      p.sLz=1.28+Math.sin(now*1.7+f.seed)*.14;p.sRz=(f.seed%2>1?1.1:.35)+Math.sin(now*1.3+f.seed*2)*.16;p.eL=.25;p.eR=.4;p.hz=.22;p.hy=Math.sin(now*.9+f.seed)*.3+(f.seed-5)*.06;
      if(br){p.sLx=.55;p.sRx=-.55;p.sLz=.9;p.sRz=.9;p.lean=-.18;}
    }
    if(u.anim==='feed'){p.by=-6.6;p.hL=p.hR=1.65;p.kL=p.kR=-2.5;p.lean=-.95+Math.sin(now*5+f.seed)*.08;p.sLz=p.sRz=.9;p.eL=.6+Math.sin(now*7)*.3;p.eR=.6+Math.cos(now*7)*.3;p.hz=-.25;}
    else if(u.anim==='bang'){p.sLz=1.75+Math.sin(now*9+f.seed)*.55;p.sRz=1.75+Math.sin(now*9+f.seed+PI)*.55;p.eL=p.eR=.4;p.lean=-.32;}
    else if(u.anim==='tramp'){p.sLz=2.6+Math.sin(now*6)*.5;p.sRz=2.6+Math.cos(now*6)*.5;p.hL=.3;p.hR=-.3;}
    if(u.burning){p.sLz=2.4+Math.sin(now*11+f.seed)*.6;p.sRz=2.4+Math.cos(now*10)*.6;}
    if(u.as==='wind'){const w=clamp(u.at/u.windDur,0,1);p.lean=-.05+.3*w;p.sLz=p.sRz=1.4+1*w;p.eL=p.eR=.7;p.hz=-.15;rate=18;}
    else if(u.as==='strike'){p.lean=-.8;p.sLz=p.sRz=1.25;p.eL=p.eR=.1;p.by=-.9;p.hz=.55;p.hL=.6;p.hR=-.5;rate=34;}
    if(u.stag>0){const k=Math.min(1,u.stag/.25);p.lean=.55*k;p.sLz=p.sRz=1.9;p.hz=-.5*k;p.hL=.45*k;p.hR=.1;p.by=-.3;rate=30;}
  }else{
    f.ph+=sp*dt*.15;
    const s=Math.sin(f.ph),c=Math.cos(f.ph),A=clamp(sp/52,0,1);
    p.hL=s*.9*A;p.hR=-s*.9*A;p.kL=-(Math.max(0,c)*1.25+.12)*A;p.kR=-(Math.max(0,-c)*1.25+.12)*A;
    p.sLz=-s*.85*A+.03;p.sRz=s*.85*A+.03;p.sLx=.07;p.sRx=-.07;p.eL=p.eR=.2+.75*A;p.lean=-.2*A;p.by=Math.abs(c)*.9*A-.2*A+Math.sin(now*2+f.seed)*.1*(1-A);p.twist=s*.12*A;
    if(A<.1)p.hy=Math.sin(now*.7+f.seed)*.22;
    const melee=f.wname&&f.wname!=='pistol'&&f.wname!=='shotgun';
    if(melee){p.sRz=.2+s*.15*A;p.sRx=-.14;p.eR=1.95;p.wR=.15;}
    if(u.anim==='wave'){p.sLz=2.9+Math.sin(now*9)*.25;p.sLx=Math.sin(now*9)*.3;p.sRz=melee?2.5+Math.sin(now*4)*.2:2.9+Math.cos(now*9)*.25;p.sRx=0;p.eR=.3;p.eL=.2;p.wR=-.9;}
    else if(u.anim==='panic'){p.sLz=2.7+s*.45;p.sRz=2.7-s*.45;p.eL=p.eR=.35;p.sLx=-.3;p.sRx=.3;}
    else if(u.anim==='cower'){p.by=-5.8;p.hL=p.hR=1.5;p.kL=p.kR=-2.3;p.lean=-.6;p.sLz=p.sRz=2.4;p.eL=p.eR=2;p.hz=-.4;}
    else if(u.anim==='crank'){p.sRz=1.25+Math.sin(now*7)*.45;p.sLz=1.25+Math.sin(now*7+PI)*.45;p.eR=p.eL=.7;p.lean=-.22;p.wR=0;}
    if(u.shootT!==undefined&&u.shootT<.9){
      const rc=u.shootT<.13?1-u.shootT/.13:0;
      p.sRz=1.5+rc*.5;p.sRx=.28;p.eR=.06;p.wR=0;p.sLz=1.45+rc*.4;p.sLx=-.5;p.eL=.25;p.lean=.14*rc;p.twist=0;
    }
    if(u.atk){
      const k=u.atk.t/u.atk.dur,ty=u.atk.type,w=clamp(k/.22,0,1),st=clamp((k-.22)/.26,0,1),rc=clamp((k-.55)/.45,0,1);
      rate=40;
      if(!melee){ // fists
        const R=ty!==1;p[R?'sRz':'sLz']=.4+1.2*Math.sin(Math.min(1,k/.45)*PI);p[R?'eR':'eL']=1.4-1.3*Math.sin(Math.min(1,k/.45)*PI);p.twist=(R?1:-1)*.5*Math.sin(Math.min(1,k/.5)*PI);p[R?'sLz':'sRz']=.5;p[R?'eL':'eR']=1.6;p.lean=-.18;p.hL=.4;p.hR=-.3;
      }else if(ty===2){ // overhead smash
        const up=1-st;p.sRz=.75+2.25*up*w;p.sLz=.75+2.1*up*w;p.sRx=.35;p.sLx=-.45;p.eR=.45*up;p.eL=.5;p.wR=-.9*st-.2;p.lean=.28*w*up-.6*st*(1-rc);p.by=-1.4*st*(1-rc);p.hL=.55*st;p.hR=-.45*st;
      }else{
        const dir=ty===0?1:-1,tw=(-.95*w+1.95*st)*(1-rc);
        p.twist=dir*tw;p.sRz=1.35;p.sRx=dir>0?(-.95*w+1.7*st)*(1-rc*.6):(.85*w-1.75*st)*(1-rc*.6);p.eR=.3;p.wR=-1.25;
        p.sLz=1.05;p.sLx=-.6;p.eL=.7;p.lean=-.16;p.hL=.5*st;p.hR=-.4*st;
      }
    }
    if(u.dashT>0){p.lean=-.75;p.hL=.95;p.hR=-.85;p.kR=-1.3;p.sLz=-1;p.sRz=melee?.3:-1;p.by=-1;rate=40;}
    if(u.hurtT>0){p.lean+=.35;p.hz=-.35;}
    if(u.lying){for(const k of PK)p[k]=0;p.sLx=-.25;p.sRx=.25;rate=40;}
  }
  const k=1-Math.exp(-rate*dt),cu=f.cur,J=f.j;
  for(const key of PK)cu[key]+=(p[key]-cu[key])*k;
  J.body.position.y=cu.by;J.body.rotation.x=cu.br;
  J.chest.rotation.z=cu.lean;J.chest.rotation.y=cu.twist;
  J.head.rotation.z=cu.hz;J.head.rotation.y=cu.hy;
  J.sL.rotation.z=cu.sLz;J.sL.rotation.x=cu.sLx;J.sR.rotation.z=cu.sRz;J.sR.rotation.x=cu.sRx;
  J.eL.rotation.z=cu.eL;J.eR.rotation.z=cu.eR;J.handR.rotation.z=cu.wR;
  J.hL.rotation.z=cu.hL;J.hR.rotation.z=cu.hR;J.kL.rotation.z=cu.kL;J.kR.rotation.z=cu.kR;
  // root: position, facing, falling over
  let fall=0,lift=0;
  if(u.dead){const kk=ease(Math.min(1,u.deadT/.42));fall=(u.fallDir||1)*kk*PI/2;lift=1.7*kk;}
  else if(u.lying){fall=PI/2;lift=u.lyingH||0;}
  else if(u.upT>0){const kk=ease(u.upT/.9);fall=kk*PI/2;lift=(u.lyingH||0)*kk;}
  f.g.position.set(u.x,(u.z||0)+lift,u.y);f.g.rotation.set(0,-u.ang,fall);
  if(f.flash>0){f.flash=Math.max(0,f.flash-dt*7);f.mat.emissive.setScalar(f.flash*.9);f.hmat.emissive.setScalar(f.flash*.9);}
}

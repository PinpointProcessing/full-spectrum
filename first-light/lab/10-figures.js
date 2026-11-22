/* Character lab: five ways to build the main character, all generated in code.
   One anatomy, measured in "head units" the way figure-drawing books do it, drives every style:
   shoulders are part of the torso and the arm comes out of the side of it (no shoulder balls), the neck leans forward and
   enters the skull behind the jaw, and the head is lofted chin-to-crown from real profile curves instead of being a sphere.
   A style only changes proportions (how many heads tall, how wide, how thick) and how it is shaded. */
const PK=['by','br','lean','twist','hz','hy','sLz','sLx','sRz','sRx','eL','eR','wR','hL','hR','kL','kR'];
const BONE={body:0,hips:1,chest:2,head:3,sL:4,eL:5,haL:6,sR:7,eR:8,haR:9,hL:10,kL:11,hR:12,kR:13,faL:14,fbL:15,thL:16,faR:17,fbR:18,thR:19};
function vmat(o){return new T.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.8,metalness:0},o||{}));}
function vnoise(x,y,s){
  const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  const h=(a,b)=>{const n=Math.sin(a*127.1+b*311.7+s*74.7)*43758.5453;return n-Math.floor(n);};
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return lerp(lerp(h(xi,yi),h(xi+1,yi),u),lerp(h(xi,yi+1),h(xi+1,yi+1),u),v);
}
const _k1=new T.Color(),_k2=new T.Color();
const lin=(hex,out)=>(out||_k1).set(hex).convertSRGBToLinear();
const sgnpow=(v,e)=>v<0?-Math.pow(-v,e):Math.pow(v,e);
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
/* look up a table of rows [key,...values] (sorted either way) at key f, interpolating every column */
function tab(pts,f){
  const asc=pts[0][0]<pts[pts.length-1][0],n=pts.length;
  if(asc?f<=pts[0][0]:f>=pts[0][0])return pts[0];if(asc?f>=pts[n-1][0]:f<=pts[n-1][0])return pts[n-1];
  for(let i=0;i<n-1;i++){const a=pts[i],b=pts[i+1];if(asc?(f>=a[0]&&f<=b[0]):(f<=a[0]&&f>=b[0])){const t=(f-a[0])/(b[0]-a[0]||1),o=[f];for(let k=1;k<a.length;k++)o.push(lerp(a[k],b[k],t));return o;}}
  return pts[0];
}

/* ---- mesh builder: rings of vertices lofted into tubes, each vertex tied to one or two bones ---- */
function MB(){this.P=[];this.K=[];this.SI=[];this.SW=[];this.I=[];this.n=0;}
MB.prototype.v=function(x,y,z,c,a,b,t){this.P.push(x,y,z);this.K.push(c.r,c.g,c.b);this.SI.push(a,b,0,0);this.SW.push(1-t,t,0,0);return this.n++;};
/* A ring is a rounded cross-section: rf/rb = front/back reach, rz = half width, n = 2 for an ellipse, higher for boxier.
   ty tilts it (front lower when negative). Lofts go round the y axis, or the x axis when ax==='x' (ru/rd = up/down reach). */
MB.prototype.loft=function(rings,n,paint,ax,capA,capB){
  const s=this.n,i0=this.I.length;
  for(const r of rings){const e=2/(r.n||2);for(let i=0;i<n;i++){
    const a=i/n*TAU,u=sgnpow(Math.cos(a),e),v=sgnpow(Math.sin(a),e);let x,y,z;
    if(ax==='x'){x=r.c[0];y=r.c[1]+(v>=0?r.ru:r.rd)*v;z=r.c[2]+r.rz*u;}
    else{x=r.c[0]+(u>=0?r.rf:r.rb)*u;y=r.c[1]+(r.ty||0)*u;z=r.c[2]+r.rz*v;}
    if(r.mod){const m=r.mod(a,x,y,z);x=m[0];y=m[1];z=m[2];}
    const w=r.wf?r.wf(x,y,z):r.w;
    this.v(x,y,z,paint(r,a,x,y,z,0),w[0],w[1],w[2]||0);
  }}
  for(let k=0;k<rings.length-1;k++)for(let i=0;i<n;i++){const a=s+k*n+i,b=s+k*n+(i+1)%n,c=a+n,d=b+n;this.I.push(a,c,d,a,d,b);}
  const cap=(r,base,flip)=>{const ci=this.v(r.c[0],r.c[1],r.c[2],paint(r,0,r.c[0],r.c[1],r.c[2],1),r.w[0],r.w[1],r.w[2]||0);for(let i=0;i<n;i++){const p=base+i,q=base+(i+1)%n;if(flip)this.I.push(ci,q,p);else this.I.push(ci,p,q);}};
  if(capA)cap(rings[0],s,false);
  if(capB)cap(rings[rings.length-1],s+(rings.length-1)*n,true);
  // make sure the faces point outward: test the widest ring against its own centre
  let k=0;for(let j=1;j<rings.length-1;j++)if(rings[j].rz>rings[k].rz)k=j;if(k===rings.length-1)k--;
  const P=this.P,q=Math.floor(n/8),a=s+k*n+q,c=a+n,d=a+n+1,rc=rings[k].c;
  const ux=P[c*3]-P[a*3],uy=P[c*3+1]-P[a*3+1],uz=P[c*3+2]-P[a*3+2],vx=P[d*3]-P[a*3],vy=P[d*3+1]-P[a*3+1],vz=P[d*3+2]-P[a*3+2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  if(nx*(P[a*3]-rc[0])+ny*(P[a*3+1]-rc[1])+nz*(P[a*3+2]-rc[2])<0)for(let i=i0;i<this.I.length;i+=3){const t=this.I[i+1];this.I[i+1]=this.I[i+2];this.I[i+2]=t;}
};
/* a ready-made shape (box, sphere...) riding on one bone */
MB.prototype.add=function(g,hex,bone,front){
  const p=g.attributes.position,ix=g.index,s=this.n,c=typeof hex==='number'?lin(hex,_k2):hex,i0=this.I.length;
  for(let i=0;i<p.count;i++)this.v(p.getX(i),p.getY(i),p.getZ(i),c,bone||0,bone||0,0);
  if(ix)for(let i=0;i<ix.count;i++)this.I.push(s+ix.array[i]);else for(let i=0;i<p.count;i++)this.I.push(s+i);
  g.dispose();
};
MB.prototype.build=function(){
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(this.P,3));g.setAttribute('color',new T.Float32BufferAttribute(this.K,3));
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(this.SI,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(this.SW,4));
  g.setIndex(this.I);g.computeVertexNormals();return g;
};
const tg=(g,sx,sy,sz,x,y,z,rx,ry,rz)=>{g.scale(sx,sy,sz);if(rx)g.rotateX(rx);if(ry)g.rotateY(ry);if(rz)g.rotateZ(rz);g.translate(x,y,z);return g;};

/* ---- the five design types ----
   heads = how many head-heights tall. w* = width of shoulders / chest / waist / hips against a real adult. th* = limb thickness. */
const STYLES=[
  {id:'grounded',name:'Grounded',heads:6.85,wSh:1.04,wChest:1.03,wWaist:1,wHip:1,depth:1,neck:1.05,thArm:1.04,thFore:1.04,thLeg:1,hand:1.04,foot:1.03,head:{jaw:1.03,chin:1.08,cran:1,eye:1,nose:1}},
];
const LOOK={skin:0xd6a47e,tee:0xd8d5cc,trim:0x9a2f2a,pants:0x2f3b55,pstripe:0x46557c,shoe:0xe9e5db,sole:0x6f6b62,toe:0xcfcbc0,sock:0xcfcfcf,hair:0x2e2118,brow:0x2b1f17,iris:0x47698c,lip:0xa8675a,stubble:0x5e4a40,watch:0x1c1c20};

function painter(S,L,seed){
  const out=new T.Color(),flat=S.shade==='toon'||S.flat;
  return function(r,a,x,y,z,cap){
    const sa=Math.sin(a),ca=Math.cos(a);let hex;const k=r.k;
    if(k==='tee')hex=r.part==='torso'&&r.f>5.2&&r.f<5.44?L.trim:L.tee;
    else if(k==='pants')hex=r.part==='leg'&&Math.abs(sa)>.95&&ca>-.5?L.pstripe:L.pants;
    else if(k==='shoe')hex=sa<-.3?L.sole:r.xn>.5?L.toe:r.xn<-.2?L.trim:L.shoe;
    else if(k==='stump')hex=0x6a0d0a;
    else hex=L[k]!==undefined?L[k]:0xff00ff;
    out.copy(lin(hex));
    if(!flat){
      let sh=.95+vnoise(x*1.3+z,y*1.3,seed)*.08;
      if(r.part==='torso'&&r.f>5.5&&r.f<6.05&&Math.abs(sa)>.85)sh*=.82;                 // armpit
      if(r.part==='torso'&&r.f<3.75)sh*=.84;                                            // between the legs
      if((r.part==='leg'||r.part==='arm')&&sa*(r.side||1)<-.6)sh*=.86;                  // inner sides
      if(k==='tee'||k==='pants')sh*=.9+.1*vnoise(ca*2+y*.7,sa*2+y*.3,seed+3);           // soft folds
      out.multiplyScalar(sh);
    }
    return out;
  };
}

/* ---- the body: one skinned mesh ---- */
function buildBody(S,L,seed){
  const mb=new MB(),K=BONE,T0=20,Hh=T0/S.heads,B=(T0-Hh)/6.5,HF=3.95,legK=S.legK||1,armK=S.armK||1,hipY=HF*B*legK,chinY=T0-Hh;
  const Y=f=>f>=HF?hipY+(f-HF)/(6.5-HF)*(chinY-hipY):f/HF*hipY;       // anatomical height (in heads) -> model y
  const paint=painter(S,L,seed),wS=S.wSh,wC=S.wChest,wW=S.wWaist,wH=S.wHip,dK=S.depth||1,nK=S.neck||1,loose=S.loose||1.05;
  const sh=.98*B*wS,shY=Y(6.15),hz=(S.hipZ||.36*wH)*B,headCx=.1*B,neckTop=[headCx-.07*Hh,chinY+.3*Hh];
  const N=S.flat?[16,10,12]:[26,14,16];
  /* torso: pelvis -> waist -> ribcage -> shoulder yoke -> trapezius slope -> neck. Columns: height, half width, front, back, boxiness, centre x, tilt */
  const TP=[[3.58,.2,.16,.2,2,0,0],[3.68,.5*wH,.33*dK,.38*dK,2.2,0,0],[3.95,.72*wH,.4*dK,.47*dK,2.3,0,0],[4.25,.68*wH,.41*dK,.43*dK,2.3,0,0],[4.55,.58*wW,.39*dK,.36*dK,2.2,.02,0],
    [4.95,.64*wC,.43*dK,.4*dK,2.3,.03,0],[5.4,.73*wC,.5*dK,.43*dK,2.4,.04,0],[5.75,.79*wC,.49*dK,.46*dK,2.5,.03,0],[5.98,.94*wS,.43*dK,.45*dK,2.7,.01,-.01],
    [6.15,1.0*wS,.36*dK,.41*dK,2.6,0,-.03],[6.27,.97*wS,.27*dK,.35*dK,2.3,-.01,-.06],[6.38,.6*wS,.24*nK,.31*nK,2.1,-.03,-.11],[6.47,.3*nK,.25*nK,.27*nK,2,-.03,-.14],[6.6,.235*nK,.225*nK,.235*nK,2,0,-.08]];
  const hem=3.78,tr=[],P395=tab(TP,3.95);
  const yoke=f=>(x,y,z)=>[K.chest,z>0?K.sR:K.sL,clamp((Math.abs(z)-.5*sh)/(.5*sh),0,1)*.62*sstep(5.8,6,f)*(1-sstep(6.3,6.4,f))];
  for(const f of[3.58,3.68,3.76,hem,3.86,3.95,4.1,4.25,4.4,4.55,4.75,4.95,5.18,5.23,5.41,5.46,5.6,5.75,5.87,5.98,6.07,6.15,6.21,6.27,6.33,6.38,6.43,6.455,6.47,6.49,6.6]){
    const k=f<hem?'pants':f<6.44?'tee':f<6.48?'trim':'skin',p0=tab(TP,f),p=k==='tee'&&f<3.95?P395:p0;
    let g=k==='tee'?(f<6.2?loose:lerp(loose,1.01,(f-6.2)/.24)):k==='trim'?1.06:1;
    const w=f<4.3?[K.hips,K.hips,0]:f<4.95?[K.hips,K.chest,(f-4.3)/.65]:f<6.52?[K.chest,K.chest,0]:[K.chest,K.head,.35];
    const mk=(kk,gg,ff)=>({c:[p[5]*B+(ff>6.5?lerp(0,neckTop[0],.45):0),Y(ff),0],rf:p[2]*B*gg,rb:p[3]*B*gg,rz:p[1]*B*(ff<6.3?gg:1),n:p[4],ty:p[6]*B,w,wf:ff>5.8&&ff<6.4?yoke(ff):null,part:'torso',k:kk,f:ff});
    if(f===hem){const q=p0;tr.push({c:[0,Y(f-.006),0],rf:q[2]*B,rb:q[3]*B,rz:q[1]*B,n:q[4],ty:0,w,part:'torso',k:'pants',f:f-.006});g=loose*1.03;}
    tr.push(mk(k,g,f));
  }
  tr.push({c:[neckTop[0],neckTop[1],0],rf:.2*B*nK,rb:.2*B*nK,rz:.2*B*nK,n:2,ty:0,w:[K.chest,K.head,.7],part:'torso',k:'stump',f:7});
  mb.loft(tr,N[0],paint,'y',true,true);
  const rig={hips:[0,Y(4.15),0],chest:[0,Y(4.6),0],sh,shY,la:1.47*B*armK,lf:1.13*B*armK,hz,hipY:Y(HF),lt:Y(HF)-Y(2.1),B,Hh,chinY,headCx};
  for(const s of[1,-1]){
    const Lf=s<0,sB=Lf?K.sL:K.sR,eB=Lf?K.eL:K.eR,hB=Lf?K.haL:K.haR,tB=Lf?K.hL:K.hR,kB=Lf?K.kL:K.kR,zs=s*sh,zl=s*hz;
    /* arm: starts inside the shoulder so the torso's own surface is the shoulder; this is only the part that hangs out of it */
    const aY=f=>shY-(6.15-f)*B*armK;
    const AP=[[6.31,.05],[6.27,.15],[6.15,.225],[5.95,.235],[5.7,.22],[5.3,.2],[5.02,.178],[4.8,.17],[4.68,.168],[4.52,.186],[4.3,.184],[3.95,.156],[3.7,.128],[3.55,.118]];
    const fS=5.3,ar=[];
    for(const f of[6.31,6.27,6.21,6.15,6.05,5.95,5.8,5.6,5.45,fS,5.15,5,4.88,4.78,4.68,4.58,4.48,4.32,4.15,3.95,3.8,3.68,3.6]){
      let r=tab(AP,f)[1]*B*(f>4.74?S.thArm||1:S.thFore||S.thArm||1);
      if(S.tube)r=Math.min(tab(AP,f)[1]*B*2,S.tube*B);
      const w=f>4.96?[sB,sB,0]:f>4.42?[sB,eB,(4.96-f)/.54]:f>3.64?[eB,eB,0]:[eB,hB,.5],cl=f>=fS;
      const mk=(kk,gg,ff)=>({c:[0,aY(ff),zs],rf:r*1.06*gg,rb:r*1.06*gg,rz:r*.96*gg,n:2,w,part:'arm',k:kk,side:s,f:ff});
      if(f===fS){ar.push(mk('trim',S.tube?1.5:1.15,f));ar.push(mk('skin',1,f-.008));}
      else ar.push(mk(cl?'tee':'skin',cl?(S.tube?1.45:1.1):1,f));
    }
    mb.loft(ar,N[1],paint,'y',true,false);
    {
      /* hand: a boxy palm, four separate fingers in two segments, and a thumb. The palm faces the leg. Finger bones curl it into a fist. */
      const hd=S.hand||1,U=B*hd,wy=aY(3.55),hy=f=>wy-(3.55-f)*U,faB=Lf?K.faL:K.faR,fbB=Lf?K.fbL:K.fbR,thB=Lf?K.thL:K.thR;
      const PR=[[3.6,.126,.114,0,2],[3.52,.13,.098,.006,2.3],[3.4,.17,.08,.018,3],[3.28,.192,.076,.028,3],[3.19,.19,.07,.034,3]];
      mb.loft(PR.map(([f,hw,ht,cx,nn])=>({c:[cx*U,hy(f),zs],rf:hw*U,rb:hw*U*(f>3.55?1:.92),rz:ht*U,n:nn,w:f>3.52?[eB,hB,.5]:[hB,hB,0],part:'hand',k:'skin',side:s})),12,paint,'y',false,true);
      const yk=hy(3.19);
      for(const[xo,rad,len]of[[.132,.043,.33],[.046,.046,.37],[-.04,.043,.345],[-.122,.037,.275]]){
        const fr=[];
        for(const t of[0,.2,.4,.5,.6,.8,.95]){
          const w=t<.02?[hB,faB,.55]:t<.44?[faB,faB,0]:t<.59?[faB,fbB,clamp((t-.42)/.16,0,1)]:[fbB,fbB,0],r=rad*U*(1-.14*t)*(t>.9?.74:1);
          fr.push({c:[(.034+xo)*U,yk+.014*U-t*len*U,zs],rf:r,rb:r,rz:r,n:2,w,part:'hand',k:'skin',side:s});
        }
        mb.loft(fr,7,paint,'y',true,true);
      }
      const thz=zs-s*.035*U;
      mb.loft([[.118,3.5,.07],[.178,3.4,.064],[.228,3.3,.054],[.262,3.2,.047],[.282,3.12,.034]].map(([cx,f,r],i)=>({c:[cx*U,hy(f),thz],rf:r*U,rb:r*U,rz:r*U,n:2,w:i?[thB,thB,0]:[hB,thB,.4],part:'hand',k:'skin',side:s})),7,paint,'y',true,true);
      if(Lf)mb.add(tg(new T.CylinderGeometry(.128*B,.128*B,.11*B,12),1.06,1,.96,0,aY(3.74),zs),L.watch,eB);
      rig.hand={U,fa:[.034*U,yk-wy],fbDy:-.185*U,th:[.118*U,hy(3.5)-wy,.035*U]};
    }
    /* leg */
    const LP=[[4.12,.1,.1,0],[4,.33,.28,0],[3.8,.36,.31,0],[3.6,.375,.345,0],[3.3,.345,.31,.01],[2.85,.295,.265,.02],[2.4,.25,.228,.02],[2.15,.232,.218,.03],[2.02,.225,.212,.02],[1.75,.235,.215,-.03],[1.5,.245,.22,-.05],[1.1,.185,.17,-.02],[.6,.13,.122,0],[.36,.118,.112,0]];
    const cuff=.44,lr=[];
    for(const f of[4.12,4,3.8,3.72,3.6,3.3,3.05,2.85,2.6,2.4,2.25,2.15,2.02,1.9,1.75,1.5,1.3,1.1,.85,.6,cuff,.36]){
      const p=tab(LP,f),t=(S.thLeg||1)*(f>3.77?.8:1);let rx=p[1]*B*t,rz=p[2]*B*t;
      if(S.tube){rx=rz=Math.min(p[1]*B*2,S.tube*B*1.08);}
      const w=f>3.75?[K.hips,tB,.7]:f>2.4?[tB,tB,0]:f>1.85?[tB,kB,(2.4-f)/.55]:[kB,kB,0];
      const mk=(kk,gg,ff)=>({c:[S.tube?0:p[3]*B,Y(ff),zl],rf:rx*gg,rb:rx*gg,rz:rz*gg,n:2,w,part:'leg',k:kk,side:s,f:ff});
      if(f===cuff){lr.push(mk('pants',S.tube?1.5:1.16,f));lr.push(mk('sock',1,f-.01));}
      else lr.push(mk(f>cuff?'pants':'sock',f>cuff?(S.tube?1.4:1.07):1,f));
    }
    mb.loft(lr,N[1],paint,'y',true,false);
    // shoe: lofted heel to toe
    const ft=(S.foot||1)*B,FP=[[-.3,.13,.05,.07,.06],[-.26,.15,.15,.15,.14],[-.1,.17,.2,.17,.17],[.12,.165,.19,.165,.185],[.38,.13,.13,.13,.195],[.6,.1,.1,.1,.18],[.76,.085,.07,.085,.12],[.81,.07,.03,.05,.05]];
    mb.loft(FP.map(([x,cy,ru,rd,rz])=>({c:[x*ft,cy*ft,zl],ru:ru*ft,rd:rd*ft,rz:rz*ft,n:2.5,w:[kB,kB,0],part:'foot',k:'shoe',side:s,xn:x})),N[1]-2,paint,'x',true,true);
  }
  return{geo:mb.build(),rig};
}

/* ---- the head: lofted chin to crown. Columns: height (0 = chin, 1 = crown), front reach, back reach, half width, boxiness ---- */
function buildHead(S,L,seed,Hh){
  const mb=new MB(),hd=S.head||{},jaw=hd.jaw||1,chin=hd.chin||1,cran=hd.cran||1,rd=hd.round||0,eS=hd.eye||1,flat=S.shade==='toon'||S.flat,simple=!!hd.simple;
  const HP=[[0,.34,.17,.09,2],[.035,.395,.05,.15*chin,2.2],[.11,.42,-.12,.215*jaw,2.4],[.21,.43,-.25,.25*jaw,2.5],[.31,.435,-.35,.285,2.4],[.43,.43,-.42,.31,2.3],
    [.55,.43,-.455,.33*cran,2.25],[.68,.42,-.46,.34*cran,2.2],[.8,.37,-.44,.325*cran,2.1],[.9,.27,-.36,.27*cran,2],[.97,.13,-.2,.16*cran,2],[1,.03,-.07,.04,2]];
  const hp=yn=>{const p=tab(HP,yn).slice();if(rd){const e=Math.sqrt(Math.max(.0004,1-Math.pow(2*yn-1,2)));p[1]=lerp(p[1],.45*e,rd);p[2]=lerp(p[2],-.45*e,rd);p[3]=lerp(p[3],.4*e,rd);p[4]=lerp(p[4],2,rd);}return p;};
  const PX=-.06,PY=.1,eyeY=rd>.4?.43:.5,eyeZ=.158*(rd?1.12:1);
  const frontX=yn=>hp(yn)[1],halfW=yn=>hp(yn)[3];
  const surfX=(yn,zn)=>{const p=hp(yn),cx=(p[1]+p[2])/2,rr=(p[1]-p[2])/2,t=clamp(Math.abs(zn)/p[3],0,.999);return cx+rr*Math.pow(1-Math.pow(t,p[4]),1/p[4]);};
  const skin=lin(L.skin,new T.Color()),stub=lin(L.stubble,new T.Color()),tmp=new T.Color();
  const paintSkin=(r,a,x,y,z)=>{
    const yn=r.yn,ca=Math.cos(a);tmp.copy(skin);
    if(L.stubble&&!simple&&yn<.3&&ca>-.25)tmp.lerp(stub,(flat?.3:.26)*sstep(.31,.22,yn)*(1-sstep(.12,.2,yn)*sstep(.75,.95,ca)*.6));
    if(!flat){let sh=.96+vnoise(x*1.5+z,y*1.5,seed)*.07;if(yn<.07)sh*=.82;if(yn>.3&&yn<.45&&ca>.3&&Math.abs(Math.sin(a))>.45)tmp.lerp(lin(0xc56a55),.1);tmp.multiplyScalar(sh);}
    return tmp;
  };
  // skull + face
  const R=18,sk=[];
  for(let i=0;i<=R;i++){
    const yn=i===0?.004:i===R?.992:.5-.5*Math.cos(Math.PI*(i/R)*.96+.06),p=hp(yn),cx=(p[1]+p[2])/2,rr=(p[1]-p[2])/2;
    sk.push({c:[(cx-PX)*Hh,(yn-PY)*Hh,0],rf:rr*Hh,rb:rr*Hh,rz:p[3]*Hh,n:p[4],w:[0,0,0],yn,
      mod:simple?null:(a,x,y,z)=>{const zn=Math.abs(z)/Hh,ca=Math.cos(a);
        if(ca>.25){x-=.02*Hh*sstep(.07,.11,zn)*(1-sstep(.2,.27,zn))*sstep(eyeY-.075,eyeY-.03,yn)*(1-sstep(eyeY+.03,eyeY+.075,yn));     // eye sockets
          x+=.014*Hh*sstep(eyeY+.05,eyeY+.085,yn)*(1-sstep(eyeY+.11,eyeY+.16,yn))*(1-sstep(.2,.3,zn));}                                   // brow ridge
        return[x,y,z];}});
  }
  mb.loft(sk,S.flat?16:22,paintSkin,'y',true,true);
  const at=(xn,yn,zn)=>[(xn-PX)*Hh,(yn-PY)*Hh,zn*Hh];
  const el=(rx,ry,rz,xn,yn,zn,hex,rotY,rotX)=>{const p=at(xn,yn,zn);mb.add(tg(new T.SphereGeometry(1,simple?8:12,simple?6:9),rx*Hh,ry*Hh,rz*Hh,p[0],p[1],p[2],rotX||0,rotY||0,0),hex,0);};
  const box=(dx,dy,dz,xn,yn,zn,hex,rotX,rotY)=>{const p=at(xn,yn,zn);mb.add(tg(new T.BoxGeometry(dx*Hh,dy*Hh,dz*Hh),1,1,1,p[0],p[1],p[2],rotX||0,rotY||0,0),hex,0);};
  // ears
  for(const s of[1,-1])el(.05,.088,.026,-.035,eyeY-.06,s*(halfW(eyeY-.06)+.008),new T.Color(L.skin).multiplyScalar(.92).getHex(),s*-.3);
  // eyes and brows
  const tall=rd>.4?1.5:1,browY=eyeY+(rd>.4?.1:.075)*Math.max(1,eS*.72),ex=surfX(eyeY,eyeZ)-(simple?0:.02),bx0=surfX(browY,eyeZ),yaw=Math.atan2(surfX(eyeY,eyeZ-.05)-surfX(eyeY,eyeZ+.05),.1)*.8;
  for(const s of[1,-1]){
    if(simple)el(.014,.05*eS*.72,.024*eS*.72,ex+.004,eyeY,s*eyeZ,0x121214,s*-yaw);
    else{
      el(.02,.027*eS*tall,.052*eS,ex-.012,eyeY,s*eyeZ,0xf2efe8,s*-yaw);                   // white, set into the socket
      el(.012,.021*eS*tall,.021*eS,ex+.004,eyeY-.001,s*(eyeZ-.003),L.iris,s*-yaw);        // iris
      el(.008,.0105*eS*tall,.0105*eS,ex+.011,eyeY-.001,s*(eyeZ-.003),0x0a0a0c);           // pupil
      el(.015,.007*eS,.058*eS,ex+.001,eyeY+.024*eS*tall,s*eyeZ,0x1a120e,s*-yaw);          // upper lid line
    }
    box(.022,.017*(simple?.8:1),.15*(simple?.8:1),bx0+(simple?.004:.012),browY,s*eyeZ,L.brow,s*-.1,s*-yaw);
  }
  // nose: bridge, tip and nostrils as soft shapes, so it reads through shading and not as a dark patch
  if(hd.nose){
    const nS=hd.nose,sc=new T.Color(L.skin).multiplyScalar(.985).getHex();
    el(.024*nS,.09,.022*nS,frontX(.45)-.006,.455,0,sc);
    el(.034*nS,.03*nS,.034*nS,frontX(.372)+.015*nS,.376,0,sc);
    for(const s of[1,-1])el(.018*nS,.016*nS,.02*nS,frontX(.356)-.003,.36,s*.03*nS,new T.Color(L.skin).multiplyScalar(.95).getHex());
  }
  // mouth: two soft lips with a dark line between them
  const my=rd>.4?.2:.215,mx=frontX(my);
  if(simple)box(.02,.013,.09,mx-.002,my,0,0x121214);
  else{
    el(.022,.014,.082,mx-.008,my+.013,0,new T.Color(L.lip).multiplyScalar(.9).getHex());
    el(.026,.018,.07,mx-.008,my-.016,0,L.lip);
    box(.02,.006,.15,mx+.004,my,0,0x4a2620);
    for(const s of[1,-1])el(.012,.05,.012,-.03,eyeY-.06,s*(halfW(eyeY-.06)+.03),new T.Color(L.skin).multiplyScalar(.72).getHex(),s*-.3);   // inner ear
  }
  /* hair: a shell just outside the scalp. Below the hairline it tucks under the skin, which leaves a clean edge. */
  const hair=lin(L.hair,new T.Color()),hl=A=>A<.9?.8+.035*Math.pow(A/.9,2):A<1.3?lerp(.835,.53,sstep(.9,1.3,A)):A<1.42?.53:A<1.6?lerp(.53,.6,sstep(1.42,1.6,A)):A<1.85?.6:lerp(.6,.2,sstep(1.85,2.2,A));
  const hs=[],HR=28;
  for(let i=0;i<=HR;i++){
    const yn=.14+(.992-.14)*(i/HR),p=hp(yn),cx=(p[1]+p[2])/2,rr=(p[1]-p[2])/2;
    hs.push({c:[(cx-PX)*Hh,(yn-PY)*Hh,0],rf:rr*Hh,rb:rr*Hh,rz:p[3]*Hh,n:p[4],w:[0,0,0],yn,
      mod:(a,x,y,z)=>{const A=a>PI?TAU-a:a,inn=yn>hl(A),ox=x-(-.02-PX)*Hh,oy=y-(.52-PY)*Hh,d=Math.hypot(ox,oy,z)||1;
        const full=.034+.04*sstep(.72,.95,yn)+.018*sstep(1.9,1,A)*sstep(.7,.85,yn)+(flat?0:(vnoise(a*3,yn*9,seed)-.5)*.02),t=lerp(-.07,full,sstep(hl(A)-.05,hl(A)+.07,yn))*Hh;
        return[x+ox/d*t+(inn&&A<1?.02*Hh*sstep(.76,.86,yn)*(1-sstep(.9,1,yn)):0),y+oy/d*t,z+z/d*t];}});
  }
  mb.loft(hs,S.flat?16:32,(r,a,x,y,z)=>{tmp.copy(hair);if(!flat)tmp.multiplyScalar(.8+vnoise(a*5,r.yn*3+seed,seed)*.4);return tmp;},'y',false,true);
  // a few swept clumps on top so it reads as hair and not a cap
  if(!simple)for(const[xn,yn,zn,ry,rz,k]of[[.3,.905,.07,.5,.35,1],[.27,.925,-.1,-.4,.3,.95],[.18,.985,.13,.7,.12,.9],[.12,1.0,-.03,-.2,.08,1],[-.02,1.0,.12,.4,-.05,.85],[.0,.99,-.14,-.5,-.02,.85]]){
    const p=at(xn,yn+.012,zn);mb.add(tg(new T.SphereGeometry(1,9,7),.15*Hh*k,.05*Hh,.075*Hh,p[0],p[1],p[2],0,ry,rz),new T.Color(L.hair).multiplyScalar(1.12).getHex(),0);
  }
  return mb.build();
}

/* ---- put one together ---- */
function makeFig(sp){
  const S=typeof sp.style==='string'?STYLES.find(s=>s.id===sp.style):sp.style||STYLES[0],L=Object.assign({},LOOK,sp.look||{}),seed=sp.seed||7;
  const mat=vmat({roughness:.78,skinning:true}),hmat=vmat({roughness:.72});
  const f={sp,S,mat,hmat,g:new T.Group(),j:{},cur:{},tgt:{},ph:0,seed:3.3,flash:0,weap:{},wname:null,two:0,gR:.1,gL:.1};
  for(const k of PK){f.cur[k]=0;f.tgt[k]=0;}
  const body=buildBody(S,L,seed),r=body.rig,J=f.j,bones=[],hn=r.hand;f.rig=r;
  f.scale=(sp.h||1)*.975;f.g.scale.setScalar(f.scale);
  const bone=(name,par,x,y,z)=>{const b=new T.Bone();b.position.set(x,y,z);if(par)par.add(b);J[name]=b;bones[BONE[name]]=b;return b;};
  bone('body',null,0,0,0);bone('hips',J.body,0,r.hips[1],0);bone('chest',J.hips,0,r.chest[1]-r.hips[1],0);
  bone('head',J.chest,r.headCx-.06*r.Hh,r.chinY+.1*r.Hh-r.chest[1],0);
  bone('sL',J.chest,0,r.shY-r.chest[1],-r.sh);bone('eL',J.sL,0,-r.la,0);bone('haL',J.eL,0,-r.lf,0);
  bone('sR',J.chest,0,r.shY-r.chest[1],r.sh);bone('eR',J.sR,0,-r.la,0);bone('haR',J.eR,0,-r.lf,0);
  bone('hL',J.hips,0,r.hipY-r.hips[1],-r.hz);bone('kL',J.hL,0,-r.lt,0);bone('hR',J.hips,0,r.hipY-r.hips[1],r.hz);bone('kR',J.hR,0,-r.lt,0);
  for(const[x,s]of[['L',-1],['R',1]]){bone('fa'+x,J['ha'+x],hn.fa[0],hn.fa[1],0);bone('fb'+x,J['fa'+x],0,hn.fbDy,0);bone('th'+x,J['ha'+x],hn.th[0],hn.th[1],-s*hn.th[2]);}
  J.handR=J.haR;J.body.updateMatrixWorld(true);
  // where a handle sits inside the closed fist (z is toward the palm), and how the thumb folds over it
  f.grip={x:hn.fa[0],y:hn.fa[1]-.075*hn.U,z:.085*hn.U,gap:.4*r.B};
  const d0=new T.Vector3(.164,-.38,0).normalize();
  f.thQ={R:new T.Quaternion().setFromUnitVectors(d0,new T.Vector3(-.72,-.34,-.6).normalize()),L:new T.Quaternion().setFromUnitVectors(d0,new T.Vector3(-.72,-.34,.6).normalize())};
  const mesh=new T.SkinnedMesh(body.geo,mat);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;
  f.skel=new T.Skeleton(bones);mesh.add(J.body);mesh.bind(f.skel);f.g.add(mesh);f.mesh=mesh;
  f.headG=new T.Group();const hm=new T.Mesh(buildHead(S,L,seed,r.Hh),hmat);hm.castShadow=true;f.headG.add(hm);J.head.add(f.headG);
  scene.add(f.g);return f;
}
/* a bat turned on a lathe, to real size: thin taped handle, knob, fat barrel */
function batGeo(){
  const pts=[[0,0],[.25,.03],[.27,.14],[.17,.24],[.155,.6],[.155,2.9],[.19,3.8],[.27,5.1],[.37,6.4],[.42,7.6],[.42,9],[.37,9.3],[0,9.4]].map(p=>new T.Vector2(p[0],p[1]));
  const g=new T.LatheGeometry(pts,14),p=g.attributes.position,k=new Float32Array(p.count*3),c=new T.Color();
  for(let i=0;i<p.count;i++){const y=p.getY(i);lin(y>.25&&y<2.95?0x1b1b1f:0xc49c6a,c);if(y>=2.95)c.multiplyScalar(.9+.08*Math.sin(y*7));k[i*3]=c.r;k[i*3+1]=c.g;k[i*3+2]=c.b;}
  g.setAttribute('color',new T.BufferAttribute(k,3));g.rotateZ(-PI/2);g.computeVertexNormals();return g;
}
const WEAP={bat:{geo:batGeo,hold:1.75,two:1}};
function setWeapon(f,name){
  if(f.wname===name)return;f.wname=name;
  for(const k in f.weap)f.weap[k].visible=false;
  if(!name||!WEAP[name])return;
  if(!f.weap[name]){
    const W=WEAP[name],m=new T.Mesh(W.geo(),vmat({roughness:.5})),ws=f.rig.B/2.63,G=f.grip;m.castShadow=true;
    m.scale.setScalar(ws);m.position.set(G.x-W.hold*ws,G.y,-G.z);f.j.haR.add(m);f.weap[name]=m;
  }
  f.weap[name].visible=true;
}

/* ---- two hands on one handle ----
   A swing is written as where the grip is and which way the bat points, in the chest's own space. Both arms are then solved
   to reach it (two-bone IK), so the hands stay together on the handle whatever the body is doing. */
const SW={
  ready:{p:[.7,1.02,.34],b:[-.28,.93,.22],tw:0,ln:0,by:0},
  h:[{p:[.62,1.42,.6],b:[-.72,.62,.3],tw:-.8,ln:.04,by:0},{p:[.88,1.2,.42],b:[.1,.22,.97],tw:-.2,ln:-.08,by:0},{p:[1.05,1,-.12],b:[.86,.02,-.5],tw:.55,ln:-.2,by:-.3},{p:[.5,1.3,-.9],b:[-.45,.5,-.74],tw:1,ln:-.12,by:0}],
  v:[{p:[.5,2.25,.2],b:[-.7,.7,.12],tw:0,ln:.25,by:.3},{p:[.75,1.9,.1],b:[.35,.93,.05],tw:0,ln:.05,by:0},{p:[1.1,.78,0],b:[.9,-.42,0],tw:0,ln:-.5,by:-1.2},{p:[.92,.5,0],b:[.78,-.62,0],tw:0,ln:-.55,by:-1.4}],
};
const SWT=[.22,.34,.46,.62,1];
function swingAt(atk){   // which two keys the swing is between, and how far along
  const k=clamp(atk.t/atk.dur,0,1),K=atk.type===2?SW.v:SW.h,seq=[SW.ready,K[0],K[1],K[2],K[3],SW.ready];
  let i=0;while(i<4&&k>SWT[i])i++;
  const t0=i?SWT[i-1]:0,u=(k-t0)/(SWT[i]-t0),t=i===0?ease(u):i===4?ease(u):i<3?Math.pow(u,i===1?1.5:1):1-Math.pow(1-u,1.6),m=atk.type===1?-1:1;
  return{A:seq[i],B:seq[i+1],t,ma:i===0?1:m,mb:i===4?1:m};
}
const _gp=new T.Vector3(),_gb=new T.Vector3(),_P=new T.Vector3(),_Pl=new T.Vector3(),_S=new T.Vector3(),_Wr=new T.Vector3(),_b=new T.Vector3(),_y=new T.Vector3(),_z=new T.Vector3(),_t=new T.Vector3(),_tn=new T.Vector3(),_w0=new T.Vector3(),_el=new T.Vector3(),_pp=new T.Vector3(),_cr=new T.Vector3();
const _qc=new T.Quaternion(),_qh=new T.Quaternion(),_qa=new T.Quaternion(),_qs=new T.Quaternion(),_qe=new T.Quaternion(),_mb=new T.Matrix4();
function armIK(f,s,W,w){
  const J=f.j,sB=s>0?J.sR:J.sL,eB=s>0?J.eR:J.eL,la=f.rig.la,lf=f.rig.lf;
  _t.copy(W);J.chest.worldToLocal(_t);_t.sub(sB.position);
  const d=clamp(_t.length(),Math.abs(la-lf)+.02,la+lf-.02),phi=PI-Math.acos(clamp((la*la+lf*lf-d*d)/(2*la*lf),-1,1));
  _w0.set(lf*Math.sin(phi),-la-lf*Math.cos(phi),0).normalize();_tn.copy(_t).normalize();
  _qa.setFromUnitVectors(_w0,_tn);
  // swivel round the shoulder-to-hand line until the elbow hangs down and a little out
  _el.set(0,-1,0).applyQuaternion(_qa);_el.addScaledVector(_tn,-_el.dot(_tn));
  _pp.set(-.15,-1,s*.5);_pp.addScaledVector(_tn,-_pp.dot(_tn));
  if(_el.lengthSq()>1e-6&&_pp.lengthSq()>1e-6){_qs.setFromAxisAngle(_tn,Math.atan2(_cr.crossVectors(_el,_pp).dot(_tn),_el.dot(_pp)));_qa.premultiply(_qs);}
  sB.quaternion.slerp(_qa,w);eB.rotation.set(0,0,lerp(eB.rotation.z,phi,w));
  sB.updateMatrixWorld(true);
}
function handFrame(f,s,b,P,out){   // x along the handle, y back toward the arm, z out of the back of the right hand
  const J=f.j,B=f.rig.B;_y.set(-.45*B,.65*B,s*1.05*B);J.chest.localToWorld(_y);_y.sub(P);_y.addScaledVector(b,-_y.dot(b));if(_y.lengthSq()<1e-6)_y.set(0,1,0);_y.normalize();
  _z.crossVectors(b,_y);out.setFromRotationMatrix(_mb.makeBasis(b,_y,_z));
}
function setHand(f,s,Q,w){
  const J=f.j,eB=s>0?J.eR:J.eL,hB=s>0?J.haR:J.haL;
  eB.getWorldQuaternion(_qe);_qe.invert().multiply(Q);hB.quaternion.slerp(_qe,w);hB.updateMatrixWorld(true);
}
function twoHand(f,u,w){
  const J=f.j,B=f.rig.B,sc=f.scale,G=f.grip;
  if(u.atk){const k=swingAt(u.atk);_gp.set(lerp(k.A.p[0],k.B.p[0],k.t),lerp(k.A.p[1],k.B.p[1],k.t),lerp(k.A.p[2]*k.ma,k.B.p[2]*k.mb,k.t));_gb.set(lerp(k.A.b[0],k.B.b[0],k.t),lerp(k.A.b[1],k.B.b[1],k.t),lerp(k.A.b[2]*k.ma,k.B.b[2]*k.mb,k.t)).normalize();}
  else{_gp.fromArray(SW.ready.p);_gb.fromArray(SW.ready.b).normalize();}
  _P.copy(_gp).multiplyScalar(B);J.chest.localToWorld(_P);
  J.chest.getWorldQuaternion(_qc);_b.copy(_gb).applyQuaternion(_qc).normalize();
  // right hand (the top hand) first
  _P.addScaledVector(_b,G.gap*.5*sc);handFrame(f,1,_b,_P,_qh);
  _Wr.set(G.x,G.y,-G.z).multiplyScalar(sc).applyQuaternion(_qh);_Wr.subVectors(_P,_Wr);
  armIK(f,1,_Wr,w);setHand(f,1,_qh,w);
  // the left hand goes to wherever the handle really ended up, one hand-width nearer the knob
  _Pl.set(G.x-G.gap,G.y,-G.z);J.haR.localToWorld(_Pl);_b.set(1,0,0).transformDirection(J.haR.matrixWorld);
  handFrame(f,-1,_b,_Pl,_qh);
  _Wr.set(G.x,G.y,G.z).multiplyScalar(sc).applyQuaternion(_qh);_Wr.subVectors(_Pl,_Wr);
  armIK(f,-1,_Wr,w);setHand(f,-1,_qh,w);
}

/* ---- animation ---- */
function figAnim(f,u,dt,now){
  const p=f.tgt,J=f.j;for(const k of PK)p[k]=0;
  f.g.position.set(u.x,0,u.y);f.g.rotation.set(0,-u.ang,0);
  const sp=u.spd||0;let rate=22;
  f.ph+=sp*dt*.15;
  const s=Math.sin(f.ph),c=Math.cos(f.ph),A=clamp(sp/52,0,1),run=clamp((sp-30)/30,0,1);
  p.hL=s*(.62+.3*run)*A;p.hR=-s*(.62+.3*run)*A;p.kL=-(Math.max(0,c)*(.9+.45*run)+.1)*A;p.kR=-(Math.max(0,-c)*(.9+.45*run)+.1)*A;
  p.sLz=-s*(.5+.4*run)*A+.03;p.sRz=s*(.5+.4*run)*A+.03;p.sLx=.07;p.sRx=-.07;p.eL=p.eR=.18+(.3+.5*run)*A;p.lean=-(.07+.14*run)*A;
  p.by=(Math.abs(c)*(.45+.45*run)*A-.2*A+Math.sin(now*2+f.seed)*.07*(1-A))*f.rig.B/2.6;p.twist=s*.12*A;
  if(A<.1)p.hy=Math.sin(now*.7+f.seed)*.2;
  const armed=!!f.wname,twoW=armed&&WEAP[f.wname].two;
  if(armed){p.sRz=.2+s*.15*A;p.sRx=-.14;p.eR=1.95;p.wR=.15;}       // carried over the shoulder in one hand
  if(u.atk){
    rate=40;
    if(twoW){const k=swingAt(u.atk),m=u.atk.type===1?-1:1,st=sstep(.3,.46,u.atk.t/u.atk.dur)*(1-sstep(.62,.95,u.atk.t/u.atk.dur));
      p.twist=lerp(k.A.tw*(k.A===SW.ready?1:m),k.B.tw*(k.B===SW.ready?1:m),k.t);p.lean=lerp(k.A.ln,k.B.ln,k.t);p.by=lerp(k.A.by,k.B.by,k.t)*f.rig.B/2.6;
      p.hy=-p.twist*.55;p.hL=.5*st*m;p.hR=-.42*st*m;p.kL=-.3*st;p.kR=-.3*st;}
    else{const k=u.atk.t/u.atk.dur,R=u.atk.type!==1,a=Math.sin(Math.min(1,k/.45)*PI);p[R?'sRz':'sLz']=.4+1.2*a;p[R?'eR':'eL']=1.4-1.3*a;p.twist=(R?1:-1)*.5*a;p[R?'sLz':'sRz']=.5;p[R?'eL':'eR']=1.6;p.lean=-.18;p.hL=.4;p.hR=-.3;}
  }
  if(u.pose){Object.assign(p,u.pose);rate=14;}
  const k=1-Math.exp(-rate*dt),cu=f.cur;
  for(const key of PK)cu[key]+=(p[key]-cu[key])*k;
  J.body.position.y=cu.by;J.body.rotation.x=cu.br;
  J.chest.rotation.set(0,cu.twist,cu.lean);J.head.rotation.set(0,cu.hy,cu.hz);
  J.sL.rotation.set(cu.sLx,0,cu.sLz);J.sR.rotation.set(cu.sRx,0,cu.sRz);J.eL.rotation.set(0,0,cu.eL);J.eR.rotation.set(0,0,cu.eR);
  J.haR.rotation.set(0,0,cu.wR);J.haL.rotation.set(0,0,0);
  J.hL.rotation.z=cu.hL;J.hR.rotation.z=cu.hR;J.kL.rotation.z=cu.kL;J.kR.rotation.z=cu.kR;
  // both hands on the handle while swinging or standing ready
  f.two=damp(f.two,twoW&&(u.atk||u.ready)?1:0,u.atk?30:9,dt);
  if(f.two>.003){f.g.updateMatrixWorld(true);twoHand(f,u,ease(f.two));}
  // fingers: a loose curl when empty, a fist round anything held
  const fistR=armed||(u.atk&&!armed)?1:.08,fistL=Math.max(f.two,u.atk&&!armed?1:0,.08);
  f.gR=damp(f.gR,fistR,16,dt);f.gL=damp(f.gL,fistL,16,dt);
  J.faR.rotation.x=.12+1.36*f.gR;J.fbR.rotation.x=.2+1.5*f.gR;J.thR.quaternion.identity().slerp(f.thQ.R,f.gR);
  J.faL.rotation.x=-(.12+1.36*f.gL);J.fbL.rotation.x=-(.2+1.5*f.gL);J.thL.quaternion.identity().slerp(f.thQ.L,f.gL);
}

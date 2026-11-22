/* Character lab: five ways to build the main character, all generated in code.
   One anatomy, measured in "head units" the way figure-drawing books do it, drives every style:
   shoulders are part of the torso and the arm comes out of the side of it (no shoulder balls), the neck leans forward and
   enters the skull behind the jaw, and the head is lofted chin-to-crown from real profile curves instead of being a sphere.
   A style only changes proportions (how many heads tall, how wide, how thick) and how it is shaded. */
const PK=['by','br','lean','twist','hz','hy','sLz','sLx','sRz','sRx','eL','eR','wR','hL','hR','kL','kR'];
const BONE={body:0,hips:1,chest:2,head:3,sL:4,eL:5,haL:6,sR:7,eR:8,haR:9,hL:10,kL:11,hR:12,kR:13};
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
  {id:'grounded',name:'Grounded',blurb:'Real adult proportions, about 7 heads tall. Small head, natural shoulders, lean limbs. The closest to a realistic game character.',
    heads:6.9,wSh:1,wChest:1,wWaist:1,wHip:1,depth:1,neck:1,thArm:1,thFore:1,thLeg:1,hand:1,foot:1,head:{jaw:1,chin:1,cran:1,eye:1,nose:1}},
  {id:'comic',name:'Comic ink',blurb:'The same build drawn like a comic book: black outlines, flat colour, hard two-tone shadows. Reads clearly from far away.',
    heads:6.7,wSh:1.07,wChest:1.04,wWaist:.98,wHip:.98,depth:1,neck:1.08,thArm:1.08,thFore:1.1,thLeg:1.05,hand:1.12,foot:1.12,head:{jaw:1.08,chin:1.2,cran:1,eye:1.15,nose:1.05},shade:'toon',outline:.09},
  {id:'hero',name:'Hero',blurb:'Animated-film proportions, about 5 and a half heads tall. Big chest, forearms, hands and shoes, square jaw. Looks like a leader in a crowd.',
    heads:5.5,wSh:1.26,wChest:1.22,wWaist:1.08,wHip:1,depth:1.12,neck:1.36,thArm:1.45,thFore:1.62,thLeg:1.3,hand:1.5,foot:1.45,head:{jaw:1.18,chin:1.5,cran:.98,eye:1.5,nose:1.2}},
  {id:'stick',name:'Stick',blurb:'A stick figure done properly: thin limbs that bend smoothly, a slim torso, a big simple head. Very clean and very cheap to draw.',
    heads:4.9,wSh:.5,wChest:.6,wWaist:.6,wHip:.56,depth:.6,neck:.5,tube:.1,thLeg:1,hand:1,handBall:.17,foot:.95,hipZ:.24,loose:1.02,head:{jaw:1,chin:1.1,cran:1,round:.72,eye:1.5,nose:0,simple:1},flat:1},
  {id:'toy',name:'Big head',blurb:'Collectible-figure proportions, under 4 heads tall. Huge expressive head, short chunky body. Faces stay readable on a phone.',
    heads:3.7,legK:.74,armK:.8,wSh:.84,wChest:1.04,wWaist:1.2,wHip:1.08,depth:1.1,neck:.85,thArm:1.3,thFore:1.4,thLeg:1.34,hand:1.45,foot:1.4,head:{jaw:1.04,chin:1.2,cran:1.02,round:.5,eye:2.1,nose:.55}},
];
const LOOK={skin:0xd6a47e,tee:0xd8d5cc,trim:0x9a2f2a,pants:0x2f3b55,pstripe:0x46557c,shoe:0xf0ece2,sole:0x8d897e,toe:0xd6d2c6,sock:0xcfcfcf,hair:0x2e2118,brow:0x1f1711,iris:0x47698c,lip:0x9c5a4e,stubble:0x5e4a40,watch:0x1c1c20};

function painter(S,L,seed){
  const out=new T.Color(),flat=S.shade==='toon'||S.flat;
  return function(r,a,x,y,z,cap){
    const sa=Math.sin(a),ca=Math.cos(a);let hex;const k=r.k;
    if(k==='tee')hex=r.part==='torso'&&r.f>5.2&&r.f<5.44?L.trim:L.tee;
    else if(k==='pants')hex=r.part==='leg'&&Math.abs(sa)>.95&&ca>-.5?L.pstripe:L.pants;
    else if(k==='shoe')hex=sa<-.42?L.sole:r.xn>.5?L.toe:L.shoe;
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
  const rig={hips:[0,Y(4.15),0],chest:[0,Y(4.6),0],sh,shY,la:1.55*B*armK,lf:1.05*B*armK,hz,hipY:Y(HF),lt:Y(HF)-Y(2.1),B,Hh,chinY,headCx};
  for(const s of[1,-1]){
    const Lf=s<0,sB=Lf?K.sL:K.sR,eB=Lf?K.eL:K.eR,hB=Lf?K.haL:K.haR,tB=Lf?K.hL:K.hR,kB=Lf?K.kL:K.kR,zs=s*sh,zl=s*hz;
    /* arm: starts inside the shoulder so the torso's own surface is the shoulder; this is only the part that hangs out of it */
    const aY=f=>shY-(6.15-f)*B*armK;
    const AP=[[6.31,.05],[6.27,.15],[6.15,.225],[5.95,.235],[5.7,.22],[5.3,.2],[4.95,.178],[4.72,.17],[4.6,.168],[4.45,.185],[4.25,.182],[3.95,.155],[3.7,.128],[3.55,.118]];
    const fS=5.3,ar=[];
    for(const f of[6.31,6.27,6.21,6.15,6.05,5.95,5.8,5.6,5.45,fS,5.1,4.95,4.82,4.72,4.6,4.5,4.4,4.25,4.1,3.95,3.8,3.68,3.6]){
      let r=tab(AP,f)[1]*B*(f>4.66?S.thArm||1:S.thFore||S.thArm||1);
      if(S.tube)r=Math.min(tab(AP,f)[1]*B*2,S.tube*B);
      const w=f>4.9?[sB,sB,0]:f>4.35?[sB,eB,(4.9-f)/.55]:f>3.64?[eB,eB,0]:[eB,hB,.5],cl=f>=fS;
      const mk=(kk,gg,ff)=>({c:[0,aY(ff),zs],rf:r*1.06*gg,rb:r*1.06*gg,rz:r*.96*gg,n:2,w,part:'arm',k:kk,side:s,f:ff});
      if(f===fS){ar.push(mk('trim',S.tube?1.5:1.15,f));ar.push(mk('skin',1,f-.008));}
      else ar.push(mk(cl?'tee':'skin',cl?(S.tube?1.45:1.1):1,f));
    }
    mb.loft(ar,N[1],paint,'y',true,false);
    if(S.handBall)mb.add(tg(new T.SphereGeometry(S.handBall*B,12,9),1,1.15,.9,0,aY(3.42),zs),L.skin,hB);
    else{
      // hand: palm, a block of fingers with a slight curl, and a thumb. Palm faces the leg.
      const hd=S.hand||1,HP=[[3.6,.118,.1,0],[3.5,.135,.086,.01],[3.36,.182,.078,.02],[3.2,.198,.074,.035],[3.06,.176,.064,.06],[2.95,.146,.054,.09],[2.87,.106,.042,.115],[2.82,.05,.022,.125]];
      mb.loft(HP.map(([f,hw,ht,cx])=>({c:[cx*B*hd,aY(3.6)-(3.6-f)*B*hd,zs],rf:hw*B*hd,rb:hw*B*hd*.92,rz:ht*B*hd,n:2.6,w:f>3.55?[eB,hB,.5]:[hB,hB,0],part:'hand',k:'skin',side:s})),N[1]-2,paint,'y',false,true);
      mb.loft([[3.43,.15,.052],[3.3,.215,.058],[3.16,.262,.052],[3.06,.285,.03]].map(([f,cx,r])=>({c:[cx*B*hd,aY(3.6)-(3.6-f)*B*hd,zs-s*.02*B],rf:r*B*hd,rb:r*B*hd,rz:r*B*hd,n:2,w:[hB,hB,0],part:'hand',k:'skin',side:s})),7,paint,'y',true,true);
      if(Lf)mb.add(tg(new T.CylinderGeometry(.125*B,.125*B,.11*B,12),1.06,1,.96,0,aY(3.74),zs),L.watch,eB);
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
      el(.02,.03*eS*tall,.054*eS,ex-.004,eyeY,s*eyeZ,0xf2efe8,s*-yaw);                    // white
      el(.012,.022*eS*tall,.022*eS,ex+.011,eyeY-.002,s*(eyeZ-.004),L.iris,s*-yaw);        // iris
      el(.008,.011*eS*tall,.011*eS,ex+.018,eyeY-.002,s*(eyeZ-.004),0x0a0a0c);             // pupil
      box(.014,.008,(rd>.4?.09:.108)*eS,ex+.012,eyeY+.027*eS*tall,s*eyeZ,0x1a120e,s*-.07,s*-yaw);   // lash line
    }
    box(.03,.022*(simple?.8:1),.15*(simple?.8:1),bx0+(simple?.004:.014),browY,s*eyeZ,L.brow,s*-.1,s*-yaw);
  }
  // nose: bridge, tip and nostrils as soft shapes, so it reads through shading and not as a dark patch
  if(hd.nose){
    const nS=hd.nose,sc=new T.Color(L.skin).multiplyScalar(.985).getHex();
    el(.034*nS,.09,.03*nS,frontX(.445)+.004*nS,.45,0,sc);
    el(.05*nS,.042*nS,.048*nS,frontX(.37)+.03*nS,.372,0,sc);
    for(const s of[1,-1])el(.03*nS,.028*nS,.03*nS,frontX(.352)+.004,.352,s*.042*nS,sc);
  }
  // mouth
  const my=rd>.4?.2:.215,mx=frontX(my);
  box(.02,.013,simple?.09:.16,mx-.002,my,0,simple?0x121214:0x6e3a32);
  if(!simple)box(.02,.016,.11,mx-.005,my-.021,0,L.lip);
  /* hair: a shell just outside the scalp. Below the hairline it tucks under the skin, which leaves a clean edge. */
  const hair=lin(L.hair,new T.Color()),hl=A=>A<.8?.8+.03*(A/.8):A<1.1?lerp(.83,.5,(A-.8)/.3):A<1.3?.5:A<1.45?lerp(.5,.6,(A-1.3)/.15):A<1.85?.6:A<2.1?lerp(.6,.2,(A-1.85)/.25):.2;
  const hs=[],HR=20;
  for(let i=0;i<=HR;i++){
    const yn=.14+(.992-.14)*(i/HR),p=hp(yn),cx=(p[1]+p[2])/2,rr=(p[1]-p[2])/2;
    hs.push({c:[(cx-PX)*Hh,(yn-PY)*Hh,0],rf:rr*Hh,rb:rr*Hh,rz:p[3]*Hh,n:p[4],w:[0,0,0],yn,
      mod:(a,x,y,z)=>{const A=a>PI?TAU-a:a,inn=yn>hl(A),ox=x-(-.02-PX)*Hh,oy=y-(.52-PY)*Hh,d=Math.hypot(ox,oy,z)||1;
        const full=.034+.04*sstep(.72,.95,yn)+.018*sstep(1.9,1,A)*sstep(.7,.85,yn)+(flat?0:(vnoise(a*3,yn*9,seed)-.5)*.02),t=lerp(-.014,full,sstep(hl(A)-.015,hl(A)+.075,yn))*Hh;
        return[x+ox/d*t+(inn&&A<1?.02*Hh*sstep(.76,.86,yn)*(1-sstep(.9,1,yn)):0),y+oy/d*t,z+z/d*t];}});
  }
  mb.loft(hs,S.flat?16:22,(r,a,x,y,z)=>{tmp.copy(hair);if(!flat)tmp.multiplyScalar(.8+vnoise(a*5,r.yn*3+seed,seed)*.4);return tmp;},'y',false,true);
  // a few swept clumps on top so it reads as hair and not a cap
  if(!simple)for(const[xn,yn,zn,ry,rz,k]of[[.3,.905,.07,.5,.35,1],[.27,.925,-.1,-.4,.3,.95],[.18,.985,.13,.7,.12,.9],[.12,1.0,-.03,-.2,.08,1],[-.02,1.0,.12,.4,-.05,.85],[.0,.99,-.14,-.5,-.02,.85]]){
    const p=at(xn,yn+.012,zn);mb.add(tg(new T.SphereGeometry(1,9,7),.15*Hh*k,.05*Hh,.075*Hh,p[0],p[1],p[2],0,ry,rz),new T.Color(L.hair).multiplyScalar(1.12).getHex(),0);
  }
  return mb.build();
}

/* ---- put one together ---- */
let toonMap=null;
function makeFig(sp){
  const S=typeof sp.style==='string'?STYLES.find(s=>s.id===sp.style):sp.style,L=Object.assign({},LOOK,sp.look||{}),seed=sp.seed||7;
  const toon=S.shade==='toon';
  if(toon&&!toonMap){toonMap=new T.DataTexture(new Uint8Array([95,95,95,255,170,170,170,255,255,255,255,255]),3,1,T.RGBAFormat);toonMap.minFilter=toonMap.magFilter=T.NearestFilter;toonMap.needsUpdate=true;}
  const mk=skin=>toon?new T.MeshToonMaterial({vertexColors:true,gradientMap:toonMap,skinning:skin}):vmat({roughness:.78,skinning:skin});
  const mat=mk(true),hmat=mk(false);
  const f={sp,S,mat,hmat,g:new T.Group(),j:{},cur:{},tgt:{},ph:0,seed:3.3,flash:0,weap:{},wname:null};
  for(const k of PK){f.cur[k]=0;f.tgt[k]=0;}
  const body=buildBody(S,L,seed),r=body.rig,J=f.j,bones=[];f.rig=r;
  f.scale=(sp.h||1)*.975;f.g.scale.setScalar(f.scale);
  const bone=(name,par,x,y,z)=>{const b=new T.Bone();b.position.set(x,y,z);if(par)par.add(b);J[name]=b;bones[BONE[name]]=b;return b;};
  bone('body',null,0,0,0);bone('hips',J.body,0,r.hips[1],0);bone('chest',J.hips,0,r.chest[1]-r.hips[1],0);
  const hpx=r.headCx-.06*r.Hh,hpy=r.chinY+.1*r.Hh;bone('head',J.chest,hpx,hpy-r.chest[1],0);
  bone('sL',J.chest,0,r.shY-r.chest[1],-r.sh);bone('eL',J.sL,0,-r.la,0);bone('haL',J.eL,0,-r.lf,0);
  bone('sR',J.chest,0,r.shY-r.chest[1],r.sh);bone('eR',J.sR,0,-r.la,0);bone('haR',J.eR,0,-r.lf,0);
  bone('hL',J.hips,0,r.hipY-r.hips[1],-r.hz);bone('kL',J.hL,0,-r.lt,0);bone('hR',J.hips,0,r.hipY-r.hips[1],r.hz);bone('kR',J.hR,0,-r.lt,0);
  J.handR=J.haR;J.body.updateMatrixWorld(true);
  const mesh=new T.SkinnedMesh(body.geo,mat);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;
  f.skel=new T.Skeleton(bones);mesh.add(J.body);mesh.bind(f.skel);f.g.add(mesh);f.mesh=mesh;
  f.headG=new T.Group();const hgeo=buildHead(S,L,seed,r.Hh),hm=new T.Mesh(hgeo,hmat);hm.castShadow=true;f.headG.add(hm);J.head.add(f.headG);
  if(S.outline){
    // ink line: a slightly fattened copy drawn inside-out in black
    const ink=skin=>{const m=new T.MeshBasicMaterial({color:0x0b0b0d,side:T.BackSide,skinning:skin});m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','vec3 transformed=vec3(position)+normal*'+S.outline.toFixed(3)+';');};return m;};
    const o=new T.SkinnedMesh(body.geo,ink(true));o.frustumCulled=false;o.bind(f.skel,mesh.bindMatrix);f.g.add(o);
    f.headG.add(new T.Mesh(hgeo,ink(false)));
  }
  scene.add(f.g);return f;
}
const WEAPG={bat:()=>[cy(.42,1,12.5,10,6,0,0,0xc19a68,0,0,PI/2),cy(.5,.5,3.4,10,1.2,0,0,0x1e1e22,0,0,PI/2),cy(.62,.62,.4,10,-.5,0,0,0xc19a68,0,0,PI/2)]};
function setWeapon(f,name){
  if(f.wname===name)return;f.wname=name;
  for(const k in f.weap)f.weap[k].visible=false;
  if(!name||!WEAPG[name])return;
  if(!f.weap[name]){
    const toon=f.S.shade==='toon',m=new T.Mesh(merge(WEAPG[name]()),toon?new T.MeshToonMaterial({vertexColors:true,gradientMap:toonMap}):vmat({roughness:.5}));m.castShadow=true;
    const k=f.rig.B/2.6*(f.S.hand||1)**.4*.86;m.scale.setScalar(k);m.position.set(.03*f.rig.B,-.42*f.rig.B*(f.S.handBall?.3:f.S.hand||1),0);f.j.handR.add(m);f.weap[name]=m;
  }
  f.weap[name].visible=true;
}

/* ---- animation (same joint angles the game uses, so whichever design is chosen drops straight in) ---- */
function figAnim(f,u,dt,now){
  const p=f.tgt;for(const k of PK)p[k]=0;
  const sp=u.spd||0;let rate=22;
  f.ph+=sp*dt*.15;
  const s=Math.sin(f.ph),c=Math.cos(f.ph),A=clamp(sp/52,0,1),run=clamp((sp-30)/30,0,1);
  p.hL=s*(.62+.3*run)*A;p.hR=-s*(.62+.3*run)*A;p.kL=-(Math.max(0,c)*(.9+.45*run)+.1)*A;p.kR=-(Math.max(0,-c)*(.9+.45*run)+.1)*A;
  p.sLz=-s*(.5+.4*run)*A+.03;p.sRz=s*(.5+.4*run)*A+.03;p.sLx=.06;p.sRx=-.06;p.eL=p.eR=.16+(.3+.5*run)*A;p.lean=-(.07+.14*run)*A;
  p.by=(Math.abs(c)*(.45+.45*run)*A-.2*A+Math.sin(now*2+f.seed)*.07*(1-A))*f.rig.B/2.6;p.twist=s*.12*A;
  if(A<.1)p.hy=Math.sin(now*.7+f.seed)*.2;
  const melee=!!f.wname;
  if(melee){p.sRz=.2+s*.15*A;p.sRx=-.14;p.eR=1.95;p.wR=.15;}
  if(u.shootT!==undefined&&u.shootT<.9){const rc=u.shootT<.13?1-u.shootT/.13:0;p.sRz=1.5+rc*.5;p.sRx=.28;p.eR=.06;p.wR=0;p.sLz=1.45+rc*.4;p.sLx=-.5;p.eL=.25;p.lean=.14*rc;p.twist=0;}
  if(u.atk){
    const k=u.atk.t/u.atk.dur,ty=u.atk.type,w=clamp(k/.22,0,1),st=clamp((k-.22)/.26,0,1),rc=clamp((k-.55)/.45,0,1);rate=40;
    if(ty===2){const up=1-st;p.sRz=.75+2.25*up*w;p.sLz=.75+2.1*up*w;p.sRx=.35;p.sLx=-.45;p.eR=.45*up;p.eL=.5;p.wR=-.9*st-.2;p.lean=.28*w*up-.6*st*(1-rc);p.by=-1.4*st*(1-rc);p.hL=.55*st;p.hR=-.45*st;}
    else{const dir=ty===0?1:-1,tw=(-.95*w+1.95*st)*(1-rc);p.twist=dir*tw;p.sRz=1.35;p.sRx=dir>0?(-.95*w+1.7*st)*(1-rc*.6):(.85*w-1.75*st)*(1-rc*.6);p.eR=.3;p.wR=-1.25;p.sLz=1.05;p.sLx=-.6;p.eL=.7;p.lean=-.16;p.hL=.5*st;p.hR=-.4*st;}
  }
  if(u.pose){Object.assign(p,u.pose);rate=14;}
  const k=1-Math.exp(-rate*dt),cu=f.cur,J=f.j;
  for(const key of PK)cu[key]+=(p[key]-cu[key])*k;
  J.body.position.y=cu.by;J.body.rotation.x=cu.br;
  J.chest.rotation.z=cu.lean;J.chest.rotation.y=cu.twist;
  J.head.rotation.z=cu.hz;J.head.rotation.y=cu.hy;
  J.sL.rotation.z=cu.sLz;J.sL.rotation.x=cu.sLx;J.sR.rotation.z=cu.sRz;J.sR.rotation.x=cu.sRx;
  J.eL.rotation.z=cu.eL;J.eR.rotation.z=cu.eR;J.handR.rotation.z=cu.wR;
  J.hL.rotation.z=cu.hL;J.hR.rotation.z=cu.hR;J.kL.rotation.z=cu.kL;J.kR.rotation.z=cu.kR;
  f.g.position.set(u.x,0,u.y);f.g.rotation.set(0,-u.ang,0);
}

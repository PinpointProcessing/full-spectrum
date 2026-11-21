"use strict";
/* Queen drafts (Bryan, after v117: "The monsters walk on top of each other when going into the bridge. It doesn't need to be so
   many, maybe one giant Queen and some babies. Also, make sure the legs aren't seen when it goes into the bridge."). Loaded into
   the game page by queen.js. What goes wrong now (road.js's CENTI_SET/CENTI_PATH, creatures.js's crPoseCentiCore): five big young
   on paths that meet at the arch, under a second apart, so they pile up there; and their legs reach for the ground at height 0
   (not the surface they're on), so high up they swing to a fixed reach "down" along their own up: on the roof that's up through it
   and out of the hill above the mouth, on the hill they dig into it, over the coping they wave in the air. And the paths sit too
   close to the surfaces (on the roof the body is half in it).
   Here instead: every path is the surface's own outline moved out by the creature's height off it (its ride), so the body rides
   clear of it; each leg's foot goes on the surface under its own segment (the hill's ground, the headwall's face, the roof, the
   tunnel's walls), and a foot that would land inside rock or concrete (past a corner) is drawn back along the leg to where it
   meets it, so no leg goes through anything; each creature has a lane of its own and a time of its own, so none crosses another.
   QN.opt: 'A' the Queen first, the babies after; 'B' the babies first, then the Queen rears up over the headwall and comes in.
   Drawn only; nothing here changes the game until Bryan picks. */
const QN={opt:null,cs:[],on:false,t0:0};
const QN_CY=(PORTAL.y0+PORTAL.y1)/2,QN_OW=(PORTAL.y1-PORTAL.y0)/2,QN_ROOF=PORTAL.top+PORTAL.arch,QN_COPE=PORTAL.wall.h+4,QN_HW=(PORTAL.wall.y1-PORTAL.wall.y0)/2,QN_WC=(PORTAL.wall.y0+PORTAL.wall.y1)/2;
const qnArch=a=>Math.abs(a)>=QN_OW?0:PORTAL.top+PORTAL.arch*Math.sqrt(1-(a/QN_OW)**2);   // the opening's top across it (the crown 40)
// what's solid round the mouth: the ground, the headwall and its coping, the hill with the tunnel through it (x, height, map y)
function qnSolid(x,h,y){
  const d=x-HILL_X,a=y-QN_CY,inWall=Math.abs(y-QN_WC)<=QN_HW;
  if(h<0)return true;
  if(d<-2)return Math.abs(a)>48&&h<hillH(x,y)&&!inWall;   // in front of the headwall: the road's open; beyond its ends the hill
  if(d<=12&&inWall){if(h>=QN_COPE)return false;if(d<0)return h>=PORTAL.wall.h;if(d<=10)return!(Math.abs(a)<QN_OW&&h<qnArch(a));return h>=PORTAL.wall.h||h<hillH(x,y);}   // the coping overhangs the face by 2; the opening through the wall
  if(Math.abs(a)<QN_OW&&h<QN_ROOF&&d<PORTAL.depth+12)return false;   // inside the tunnel
  return h<hillH(x,y);
}
// the outline along the tunnel's axis at lane a (d into the hill from the face, h up): the hill, the coping, the face, under the
// arch and along the roof (in the opening), or down the face to the road (beside it)
function qnProfile(a,d0,dEnd){
  const P=[];for(let d=d0;d>12.5;d-=2.5)P.push([d,hillH(HILL_X+d,QN_CY+a)]);
  P.push([12,Math.min(hillH(HILL_X+12,QN_CY+a),QN_COPE-.1)],[12,QN_COPE],[-2,QN_COPE],[-2,PORTAL.wall.h],[0,PORTAL.wall.h]);
  if(Math.abs(a)<QN_OW){const ah=qnArch(a);P.push([0,ah],[10,ah]);if(ah<QN_ROOF-.01)P.push([10,QN_ROOF]);P.push([dEnd,QN_ROOF]);}
  else P.push([0,0]);
  return P;
}
// a 2D outline moved out by R on its open side (convex corners rounded, the inside of concave ones dropped): [[d,h,nd,nh]]
function qnOffset(P,R,air){
  const S=[];for(let i=0;i<P.length-1;i++){const[x0,y0]=P[i],[x1,y1]=P[i+1],L=Math.hypot(x1-x0,y1-y0);if(L<1e-6)continue;const dx=(x1-x0)/L,dy=(y1-y0)/L;let nx=-dy,ny=dx;
    if(!air((x0+x1)/2+nx*.4,(y0+y1)/2+ny*.4)){nx=-nx;ny=-ny;}S.push({x0,y0,dx,dy,L,nx,ny});}
  const out=[];S.forEach((s,i)=>{
    if(i){const p=S[i-1],a0=Math.atan2(p.ny,p.nx);let da=Math.atan2(s.ny,s.nx)-a0;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
      const m=Math.ceil(Math.abs(da)/(Math.PI/36));for(let k=1;k<m;k++){const g=a0+da*k/m,nx=Math.cos(g),ny=Math.sin(g);out.push([s.x0+nx*R,s.y0+ny*R,nx,ny]);}}
    const m=Math.max(1,Math.ceil(s.L/.5));for(let k=0;k<=m;k++){const t=s.L*k/m;out.push([s.x0+s.dx*t+s.nx*R,s.y0+s.dy*t+s.ny*R,s.nx,s.ny]);}});
  const dist=(x,y,s)=>{const t=Math.max(0,Math.min(s.L,(x-s.x0)*s.dx+(y-s.y0)*s.dy));return Math.hypot(x-s.x0-s.dx*t,y-s.y0-s.dy*t);};
  return out.filter(([x,y])=>S.every(s=>dist(x,y,s)>=R-.05));
}
// a lane over the headwall and in along the roof: points [x,h,y, ux,uh,uy] (up: away from the surface)
function qnOverTop(a,R,d0,dEnd){
  const air=(d,h)=>!qnSolid(HILL_X+d,h,QN_CY+a);
  return qnOffset(qnProfile(a,d0,dEnd),R,air).map(([d,h,nd,nh])=>[HILL_X+d,h,QN_CY+a,nd,nh,0]);
}
// a lane beside the opening: over the headwall at aOut, down its face, a turn across it toward the opening at height hw, round the
// edge of the opening and in along the tunnel's side wall at that height (sg: -1 the north side, the left from the bridge; +1 the south)
function qnSideWall(sg,aOut,hw,R,d0,dEnd){
  const rt=Math.min(14,Math.abs(aOut)-QN_OW-1),air=(d,h)=>!qnSolid(HILL_X+d,h,QN_CY+aOut);
  const top=qnOffset(qnProfile(aOut,d0,0),R,air).filter(([d,h])=>!(d<-R+.6&&h<hw+rt));
  const out=top.map(([d,h,nd,nh])=>[HILL_X+d,h,QN_CY+aOut,nd,nh,0]);
  const ac=aOut-sg*rt;for(let k=0;k<=12;k++){const t=k/12*Math.PI/2;out.push([HILL_X-R,hw+rt-rt*Math.sin(t),QN_CY+ac+sg*rt*Math.cos(t),-1,0,0]);}   // the turn on the face
  for(let a=ac-sg*1.5;sg*(a-sg*QN_OW)>0;a-=sg*1.5)out.push([HILL_X-R,hw,QN_CY+a,-1,0,0]);
  for(let k=0;k<=12;k++){const f=k/12*Math.PI/2;out.push([HILL_X-R*Math.cos(f),hw,QN_CY+sg*QN_OW-sg*R*Math.sin(f),-Math.cos(f),0,-sg*Math.sin(f)]);}   // round the opening's edge
  for(let d=1.5;d<=dEnd;d+=1.5)out.push([HILL_X+d,hw,QN_CY+sg*(QN_OW-R),0,0,-sg]);   // along the side wall inside
  return out;
}
// the path for one creature (in its own units: the world's over its scale): spaced points, ups smoothed along it, the depth of each
function qnPath(ctrl,sc,smooth){
  const P=[];for(const c of ctrl){const q=P[P.length-1];if(!q||Math.hypot(c[0]-q[0],c[1]-q[1],c[2]-q[2])>1.2)P.push(c);}
  const curve=new THREE.CatmullRomCurve3(P.map(c=>new THREE.Vector3(c[0]/sc,c[1]/sc,c[2]/sc)),false,'centripetal'),N=Math.max(400,Math.round(curve.getLength()*4));
  const pts=curve.getSpacedPoints(N),L=curve.getLength(),cum=[0];for(let i=1;i<P.length;i++)cum.push(cum[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1],P[i][2]-P[i-1][2]));
  const tot=cum[cum.length-1],ups=[];let j=0;
  for(let i=0;i<=N;i++){const s=i/N*tot;while(j<cum.length-2&&cum[j+1]<s)j++;const f=Math.max(0,Math.min(1,(s-cum[j])/((cum[j+1]-cum[j])||1))),a=P[j],b=P[j+1];
    ups.push(new THREE.Vector3(a[3]+(b[3]-a[3])*f,a[4]+(b[4]-a[4])*f,a[5]+(b[5]-a[5])*f).normalize());}
  const W=Math.max(1,Math.round(smooth/sc/(L/N))),sm=ups.map((_,i)=>{const v=new THREE.Vector3();for(let k=-W;k<=W;k++)v.add(ups[Math.max(0,Math.min(N,i+k))]);return v.normalize();});   // (round corners turn the body over gradually)
  return{pts,ups:sm,N,L,dep:pts.map(p=>p.x*sc-HILL_X)};
}
const QN_V=new THREE.Vector3(),QN_W=new THREE.Vector3();
function qnPull(hip,g,sc){   // a foot inside something solid: back along the leg to where it meets it
  if(!qnSolid(g.x*sc,g.y*sc,g.z*sc)||qnSolid(hip.x*sc,hip.y*sc,hip.z*sc))return;
  let lo=0,hi=1;for(let i=0;i<12;i++){const m=(lo+hi)/2;QN_V.lerpVectors(hip,g,m);if(qnSolid(QN_V.x*sc,QN_V.y*sc,QN_V.z*sc))hi=m;else lo=m;}
  QN_W.lerpVectors(hip,g,Math.max(0,lo-.02));g.copy(QN_W);}
// creatures.js's crPoseCentiCore with the feet on the surface under each segment (o.surf), not on the ground at height 0
function qnPoseCore(S,n,pts,t,o,put){
  const fr=CR_FR[n]||(CR_FR[n]={F:Array.from({length:n+1},()=>new THREE.Vector3()),X:Array.from({length:n+1},()=>new THREE.Vector3()),Y:Array.from({length:n+1},()=>new THREE.Vector3())});
  const F=fr.F,X=fr.X,Y=fr.Y,walk=o.walk??0,v=CR_V,sc=o.sc||1,tt=o.time??t;
  for(let i=0;i<=n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n,i+1)],f=F[i].subVectors(a,b);if(f.lengthSq()<1e-8)f.set(0,0,1);f.normalize();
    const x=X[i].crossVectors(o.ups[i],f);if(x.lengthSq()<1e-6)x.set(1,0,0);x.normalize();Y[i].crossVectors(f,x).normalize();}
  for(let i=1;i<=n;i++){const k=i-1,u=k/(n-1),w=S.w(u),p=pts[i],lt=X[i],up=Y[i],fw=F[i];
    crBasis(_cm,lt,up,fw,w*.52,S.h*.46,S.seg*.82,v[0].copy(p).addScaledVector(up,S.h*.14));put('terg',k,_cm);
    crBasis(_cm,lt,up,fw,w*.45,S.h*.5,S.seg*.74,p);put('core',k,_cm);
    crBasis(_cm,v[1].copy(lt).negate(),v[2].copy(up).negate(),fw,w*.41,S.h*.16,S.seg*.62,v[0].copy(p).addScaledVector(up,-S.h*.42));put('stern',k,_cm);
    const lift=o.lift?o.lift[i]:0,air=crS(S.raise*.2,S.raise*.75,lift);
    for(const s of[1,-1]){const j=k*2+(s>0?0:1),r=S.leg.r(u);
      const hip=v[3].copy(p).addScaledVector(lt,s*w*.4).addScaledVector(up,-S.h*.2);
      const out=v[4].copy(lt).multiplyScalar(s).addScaledVector(up,-.35).normalize(),t0=v[5].copy(hip).addScaledVector(out,S.leg.cx);
      crSeg(_cm,hip,t0,up,r*1.25);put('coxa',j,_cm);
      const ph=t*7-k*.62+(s>0?0:Math.PI),sw=Math.sin(ph)*walk,lf=Math.max(0,Math.cos(ph))*walk,reach=S.spread(u);
      const g=v[8].copy(p).addScaledVector(up,-(S.ride+lift)).addScaledVector(lt,s*(w*.5+reach)).addScaledVector(fw,S.stride*sw+(.5-u)*S.stride*.5).addScaledVector(up,S.lift*lf);   // on the surface under it
      if(up.y>.55&&g.x*sc-HILL_X>12.5)g.y=hillH(g.x*sc,g.z*sc)/sc+S.lift*lf;   // on the hill (behind the coping): its own ground under each foot
      qnPull(hip,g,sc);
      const wig=Math.sin(tt*5.3+k*1.7+(s>0?0:2))*(o.flail??.4);
      const a=v[9].copy(hip).addScaledVector(lt,s*reach*(.5+wig*.12)).addScaledVector(fw,reach*(.3+wig*.25)).addScaledVector(up,-reach*(.62-wig*.15));
      const tg=v[10].copy(g).lerp(a,air);if(air>0)qnPull(hip,tg,sc);
      const pole=v[11].copy(up).multiplyScalar(.75).addScaledVector(lt,s*.7).lerp(v[12].copy(lt).multiplyScalar(s).addScaledVector(fw,-.55).addScaledVector(up,.25),air);
      const fe=S.leg.fe(u),tb=S.leg.ti(u),ta=S.leg.ta(u),kn=crIK(t0,tg,fe,tb+ta,pole,v[13]);
      const ft=v[12].subVectors(tg,kn).normalize().multiplyScalar(tb+ta).add(kn);
      const ak=v[1].copy(kn).lerp(ft,tb/(tb+ta)).addScaledVector(pole,(tb+ta)*.06);
      crSeg(_cm,t0,kn,pole,r);put('fem',j,_cm);crSeg(_cm,kn,ak,pole,r*.82);put('tib',j,_cm);crSeg(_cm,ak,ft,pole,r*.7);put('tar',j,_cm);}}
  {const p=pts[n],lt=X[n],up=Y[n],fw=F[n],w=S.w(1);   // the last pair, trailing
    for(const s of[1,-1]){let a=v[0].copy(p).addScaledVector(lt,s*w*.3).addScaledVector(fw,-S.seg*.4);const dirs=[[-1,.42,.18],[-1,.2,.05],[-1,.05,-.22]];
      S.ult.forEach((len,q)=>{const d=v[1].copy(fw).multiplyScalar(dirs[q][0]).addScaledVector(lt,s*dirs[q][1]).addScaledVector(up,dirs[q][2]+Math.sin(tt*1.3+q+s)*.04).normalize();
        const b=v[2].copy(a).addScaledVector(d,len);crSeg(_cm,a,b,up,S.ultR*(1-q*.18));put('ult',(s>0?0:3)+q,_cm);a=v[0].copy(b);});}}
  const f=v[0].copy(F[0]).applyAxisAngle(X[0],o.look??0),y=v[1].crossVectors(f,X[0]).normalize();
  return crBasis(_chm,X[0],y,f,1,1,1,pts[0]);}
function qnPose(C,pts,t,o){
  C.head.matrix.copy(qnPoseCore(C.S,C.n,pts,t,o,(k,i,m)=>C[k].setMatrixAt(i,m)));C.head.matrixWorldNeedsUpdate=true;
  for(const k of['terg','stern','core','coxa','fem','tib','tar','ult'])C[k].instanceMatrix.needsUpdate=true;
  const R=crHeadRot(o,o.time??t);C.forc.forEach(({pv},i)=>pv.rotation.set(...R[i]));C.ant.forEach(({pv},i)=>pv.rotation.set(...R[2+i]));(C.mand||[]).forEach(({pv},i)=>pv.rotation.set(...R[4+i]));}

/* ---------- the cast ---------- */
const QN_QUEEN=crScale(MOTHER,.85,'queen','mother');   // her: the Brood Mother's kind, 85 % of her (about 12 m long, the body 1.6 m across)
// one creature: spec, scale, lane (a function of its ride giving the path's points), speed, when it comes, where its head starts
// (depth into the hill), and for her in B a stop to rear up over the coping
function qnMake(c){
  const keep=scene;scene=EAST.grp;let C;try{C=makeCentipede(c.spec);}finally{scene=keep;}C.g.scale.setScalar(c.sc);EAST.grp.add(C.g);C.g.visible=false;
  const S=c.spec,R=S.ride*c.sc,path=qnPath(c.lane(R),c.sc,R*1.4),len=S.head.l*.55+S.seg*.5+(S.n-1)*S.seg;
  let start=0;for(let i=0;i<=path.N;i++)if(path.dep[i]<=c.from){start=i/path.N*path.L;break;}   // (the head this far along the path at the start)
  let fi=0;for(let i=1;i<=path.N;i++)if(path.dep[i]<path.dep[fi])fi=i;   // (where it's on the headwall's face: the tail past that and deep enough inside, it's gone)
  return Object.assign(C,{c,sc:c.sc,path,len,faceK:fi/path.N*path.L,start:Math.max(start,len+1),pos:Math.max(start,len+1),on:false,done:false,lift:new Float32Array(S.n+1)});
}
const qnAt=(P,k)=>{const f=Math.max(0,Math.min(1,k/P.L))*P.N,i=Math.min(P.N-1,Math.floor(f));return P.pts[i].clone().lerp(P.pts[i+1],f-i);};
const qnUpAt=(P,k)=>{const f=Math.max(0,Math.min(1,k/P.L))*P.N,i=Math.min(P.N-1,Math.floor(f));return P.ups[i].clone().lerp(P.ups[i+1],f-i).normalize();};
const qnDepAt=(P,k)=>{const f=Math.max(0,Math.min(1,k/P.L))*P.N,i=Math.min(P.N-1,Math.floor(f));return P.dep[i]+(P.dep[i+1]-P.dep[i])*(f-i);};
function qnPoseOne(C,now){
  const S=C.c.spec,P=C.path,n=S.n,gap=S.head.l*.55+S.seg*.5,head=C.pos,pts=[],ups=[];
  for(let i=0;i<=n;i++){const k=i?head-gap-(i-1)*S.seg:head;pts.push(qnAt(P,k));ups.push(qnUpAt(P,k));}
  const rear=C.rear||0;for(let i=0;i<=n;i++){const l=rear*Math.pow(Math.max(0,1-i/6),1.6);C.lift[i]=l;pts[i].addScaledVector(ups[i],l);}   // (rearing: the front lifted off the surface)
  qnPose(C,pts,head/(4.46*S.stride),{walk:1,flail:.55,ups,lift:C.lift,sc:C.sc,time:now,look:-rear/S.raise*.35,jaw:.25+Math.sin(now*6+C.c.delay*3)*.1+rear/S.raise*.5,antUp:.25+rear/S.raise*.4});
}
function qnStart(opt){
  qnClear();QN.opt=opt;QN.t0=simT;QN.on=true;
  const over=a=>R=>qnOverTop(a,R,320,150),side=(sg,aOut,hw)=>R=>qnSideWall(sg,aOut,hw,R,240,150);
  const Q={spec:QN_QUEEN,sc:1,lane:over(12),v:32,from:70},B=(k,lane,v,delay,from=70)=>({spec:BROOD,sc:k,lane,v,delay,from});   // (her lane a little south of the middle: the work light over the mouth hangs in the middle)
  const L=opt==='A'?[{...Q,delay:0},B(1.0,side(-1,-64,15),42,2.6),B(.85,side(1,62,10),44,3.2),B(1.1,side(1,72,19),40,4.0),B(.95,over(-14),44,5.6),B(1.05,over(26),42,6.1)]
    :[B(1.0,side(-1,-64,15),44,0),B(.85,over(-14),46,.4),B(1.1,side(1,66,12),42,.8),B(.95,over(24),44,1.2),B(1.0,side(-1,-74,22),42,1.6),{...Q,delay:2.4,from:40,v:36,rearAt:9,rearT:2.2}];
  QN.cs=L.map(qnMake);
}
function qnClear(){for(const C of QN.cs){if(C.g.parent)C.g.parent.remove(C.g);}QN.cs=[];QN.on=false;}
function qnTick(dt){
  if(!QN.on)return;const now=simT,t=now-QN.t0;let any=false;
  for(const C of QN.cs){const c=C.c;if(C.done)continue;any=true;if(t<c.delay)continue;
    if(!C.on){C.on=true;C.g.visible=true;C.t1=now;}
    let v=c.v;if(c.rearAt!=null){   // B: she stops with her head over the coping and rears up, then comes on
      if(C.rearT0==null&&qnDepAt(C.path,C.pos)<=c.rearAt){C.rearT0=now;}
      if(C.rearT0!=null){const e=now-C.rearT0;C.rear=c.spec.raise*1.15*Math.sin(Math.PI*Math.min(1,e/c.rearT))**.7;if(e<c.rearT)v=0;}}
    C.pos+=v*dt/C.sc;qnPoseOne(C,now);
    if(C.pos-C.len>C.faceK&&qnDepAt(C.path,C.pos-C.len)>64){C.done=true;C.g.visible=false;}}   // (all of it in, past the arch and into the dark)
  if(!any)QN.on=false;
}

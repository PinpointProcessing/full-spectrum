"use strict";
/* D-Day's look, Version 188: blasts, smoke, dust and fire. ddFxBuild(sc) from dday.js's buildDDay (every chapter, after the scenery), ddFxFrame(rdt,now,dt) from ddFrame
   every frame.
   Looks only: it reads the battle's own lists (booms, nades, tankFires, tracers, flashes, sparks, rockets, the units) and never changes them, nor anything
   the rules read. Before this, a blast was one orange sprite and six grey ones (post.js's fxFrame), a knocked-out tank or a sunk boat had a fire on its
   list that nothing drew on D-Day (mission.js's 2D fires aren't drawn there), and tracers were flat lines on the overlay.
   Now, in the 3D scene, each in one instanced mesh (one draw call however many are alive), pooled and capped by POST.tier:
   - soft particles (ddFxSoft): smoke, dust, dirt and spray, drawn far to near, each a little ball lit from the sun's side, its edge eaten by noise (the
     light's noise picture, ddlight.js's ddNoiseTex); in front of one of the squad you play they thin out (a hole round each man on the screen, uMen);
   - glowing ones (ddFxGlow): flames, the flash of a blast, embers, added to the picture so the bloom catches them;
   - tracers in 3D (ddFxStreak): a bright bolt flying from the gun to where the round goes, glowing (the overlay's flat lines are off while these run);
   - clods of earth (ddFxClod): little lumps thrown out of a blast that bounce once and sink away;
   - a dust ring racing out along the ground from a blast (ddFxRing).
   What makes them: a blast (ddFxBlast: shells big, rifle grenades less, a hand grenade small, a wreck going up bigger still; on the water a column of spray
   instead), a burning wreck (ddFxFires: flames and a column of black smoke for a long while), a shot (a puff at the muzzle), a round that misses (a kick of
   sand or dirt where it lands) or hits cover (chips), a man running (dust at his heels), drifting battle smoke low over the field (ddFxHaze), and the
   rockets' trails (dday.js's ddRockets hands its puffs here). */
const DDFX={
  cap:{soft:[240,400,560],glow:[100,160,220],streak:[28,44,64],clod:[30,64,100],ring:[6,10,14],scorch:[10,18,26]},   // the most alive at once, by tier (0 cheapest .. 2)
  haze:[0,1,4],              // patches of battle smoke drifting low over the field, by tier (Version 190: 3 at tier 1 hid men and crates)
  wind:[-7,2.4],             // smoke's drift over the battle (x, y units a second; the light's far columns lean the same way)
  fireFlame:[7,11,16],fireSmoke:[1.5,2.4,3.2],   // a burning wreck's flames and puffs of black smoke a second, by tier
  muzzle:[.35,.7,1],         // the chance a shot leaves a puff at the muzzle, by tier
  dust:[.36,.24,.17],        // a running man kicks up a puff this often (seconds), by tier
  menK:.05,                  // smoke in front of one of our two squads thins to this (on the screen, round each man; nearly clear, since a column is many puffs deep; Version 190: both squads, not only the one you play)
  amb:[.76,.71,.64],sunK:.55,  // the soft particles' light: the sky's fill, and how much of the sun's colour on their lit side
  linger:[3,5,7],            // a shell's smoke left standing over where it fell, drifting off downwind for ten seconds or so (puffs, by tier)
  scorch:22,                 // a blast's scorch on the ground lasts this long (seconds), fading over its last third (Version 190: 40 drew the eye more than the men)
  far:[0,6.5,4],             // the battle beyond yours (Version 188, pass 3): a shell bursting out on the beach's flanks or in the sea every so many seconds, by tier (0: none)
  bluff:[0,4,4],             // Version 190: on a portrait screen after the landing, a burst on the bluff ahead every 3-5 s (by tier; 0 none): ddFxBluff
  farClear:[320,200,90],     // ...never this far from our squads, our other troops, and a German (200 from them too left about 1 spot in 100 in a
                             // portrait view while the bunkers are manned, 140 none in front of the camera; a burst 9 m off a gun on the bluff reads as a near miss)
  bluffSmoke:[0,2,3]         // Version 190: slow low banks of smoke along the foot of the bluff beyond their line (by tier): ddFxBluffSmoke
};
// its own run of random numbers, so the effects leave the game's (Math.random) as it was: a seeded test plays out the same with them or without
let _fxs=19440606;const fxR=()=>(_fxs=(_fxs*16807)%2147483647)/2147483647;
let DDF=null;   // the effects of the chapter being played (made by ddFxBuild; its meshes go with the scene, dday.js's disposeDD)
const ddFxTier=()=>typeof POST!=='undefined'?clamp(POST.tier|0,0,2):1;
// the 3D tracers are running (overlay.js leaves out its flat lines on D-Day then)
function ddFxTracing(){return!!(DDF&&DD&&DDF.sc===DD.scene);}
// the blasts are drawn here (post.js's fxFrame leaves them out on D-Day then)
const ddFxLive=ddFxTracing;

/* ---------- the stores: one typed array per field, the living ones packed at the front ---------- */
function ddFxStore(cap){
  const f=()=>new Float32Array(cap);
  return{cap,n:0,x:f(),y:f(),z:f(),vx:f(),vy:f(),vz:f(),age:f(),life:f(),s0:f(),s1:f(),c0:new Float32Array(cap*3),c1:new Float32Array(cap*3),a:f(),rot:f(),rv:f(),drag:f(),grav:f(),wk:f(),seed:f(),shape:f(),lit:f(),fin:f(),fl:f(),ord:new Uint16Array(cap),dep:f()};
}
const DDF_FIELDS=['x','y','z','vx','vy','vz','age','life','s0','s1','a','rot','rv','drag','grav','wk','seed','shape','lit','fin','fl'];
function ddFxKill(S,i){
  const j=--S.n;if(i===j)return;
  for(const k of DDF_FIELDS)S[k][i]=S[k][j];
  for(let c=0;c<3;c++){S.c0[i*3+c]=S.c0[j*3+c];S.c1[i*3+c]=S.c1[j*3+c];}
}
// one particle: where (x, height, y on the map), how it moves, how long, its size from s0 to s1, its colour from c0 to c1, its alpha, its look
// (shape: soft 0 smoke, 1 dust and dirt, 2 spray, 3 haze; glow 0 flame, 1 flash, 2 ember), drag, gravity (+ rises), how much the wind takes it,
// how much the sun lights it, how fast it fades in. Returns its slot, or -1 when the store is full (lim: the most this kind may fill)
function ddFxAdd(S,lim,x,y,z,vx,vy,vz,life,s0,s1,r,g,b,r1,g1,b1,a,shape,drag,grav,wk,lit,fin){
  if(S.n>=Math.min(S.cap,lim))return-1;const i=S.n++;
  S.x[i]=x;S.y[i]=y;S.z[i]=z;S.vx[i]=vx;S.vy[i]=vy;S.vz[i]=vz;S.age[i]=0;S.life[i]=life;S.s0[i]=s0;S.s1[i]=s1;
  S.c0[i*3]=r;S.c0[i*3+1]=g;S.c0[i*3+2]=b;S.c1[i*3]=r1;S.c1[i*3+1]=g1;S.c1[i*3+2]=b1;S.a[i]=a;S.rot[i]=fxR()*TAU;S.rv[i]=(fxR()-.5)*.6;
  S.drag[i]=drag;S.grav[i]=grav;S.wk[i]=wk;S.seed[i]=fxR();S.shape[i]=shape;S.lit[i]=lit;S.fin[i]=fin||.001;S.fl[i]=0;return i;
}
// a step for every particle: drag, gravity or lift, the wind, and the falling ones stopped on the ground (they lie there as dust and fade)
function ddFxStep(S,dt){
  if(dt<=0)return;const wx=DDFX.wind[0],wz=DDFX.wind[1];
  for(let i=0;i<S.n;i++){
    S.age[i]+=dt;if(S.age[i]>=S.life[i]){ddFxKill(S,i);i--;continue;}
    const d=Math.max(0,1-S.drag[i]*dt);S.vx[i]*=d;S.vy[i]*=d;S.vz[i]*=d;S.vy[i]+=S.grav[i]*dt;
    S.x[i]+=(S.vx[i]+wx*S.wk[i])*dt;S.y[i]+=S.vy[i]*dt;S.z[i]+=(S.vz[i]+wz*S.wk[i])*dt;S.rot[i]+=S.rv[i]*dt;
    if(S.grav[i]<0){const q=S.age[i]/S.life[i],sz=S.s0[i]+(S.s1[i]-S.s0[i])*q,g=ddH(S.x[i],S.z[i])+sz*.28;
      if(S.y[i]<g){S.y[i]=g;S.vy[i]=0;S.grav[i]=0;S.drag[i]=Math.max(S.drag[i],3.5);}}
  }
}
/* ---------- the meshes ---------- */
function ddFxInst(sc,cap,base,mat,order){
  const g=new T.InstancedBufferGeometry();g.index=base.index;g.setAttribute('position',base.getAttribute('position'));
  const mk=()=>{const a=new T.InstancedBufferAttribute(new Float32Array(cap*4),4);a.setUsage(T.DynamicDrawUsage);return a;};
  const A=mk(),B=mk(),C=mk();g.setAttribute('iA',A);g.setAttribute('iB',B);g.setAttribute('iC',C);g.instanceCount=0;
  const m=new T.Mesh(g,mat);m.frustumCulled=false;m.renderOrder=order;sc.add(m);return{m,g,A,B,C};
}
const DDF_VS=`attribute vec4 iA,iB,iC;uniform float uFN,uFF;varying vec2 vU,vQ;varying vec4 vB;varying vec3 vS;varying float vD,vF;
  void main(){vec4 mv=viewMatrix*vec4(iA.xyz,1.);vec2 p=position.xy*2.;float c=cos(iC.x),s=sin(iC.x);
    vU=vec2(p.x*c-p.y*s,p.x*s+p.y*c);vQ=p;mv.xy+=p*.5*iA.w;   // (the pattern turns; the ball and its light stay square to the screen)
    vB=iB;vS=iC.yzw;vD=-mv.z;vF=smoothstep(uFN,uFF,vD)*.85;gl_Position=projectionMatrix*mv;}`;
// soft: smoke, dust, spray and haze, in the picture's own colours (like the light's smoke columns: no tone curve), lit as little balls from the sun's side
const DDF_SOFT_FS=`uniform sampler2D tN;uniform vec3 uSun,uSunC,uAmb,uHor;uniform vec4 uMen[8];uniform float uMenN,uMenK;
  varying vec2 vU,vQ;varying vec4 vB;varying vec3 vS;varying float vD,vF;
  void main(){float sh=vS.y;vec2 Q=sh>2.5?vQ*vec2(1.,1.8):vQ;float r2=dot(Q,Q);if(r2>1.)discard;float d=1.-r2,a;   // (haze: a low bank, wider than it's tall)
    vec2 t=vU*(sh>2.5?.16:sh>.5&&sh<1.5?.48:.3)+vec2(vS.x*3.7,vS.x*1.9);float n=texture2D(tN,t).g*.62+texture2D(tN,t*2.3+.37).b*.38;
    if(sh<.5)a=smoothstep(.03,.4,d*.95-(1.-n)*.6);                     // smoke: billows eat the edge
    else if(sh<1.5)a=smoothstep(.02,.32,d-(1.-n)*.75)*(.5+.5*d);      // dust and dirt: grainier, thinner at the rim (Version 190: eaten harder and finer, a plume read as a stack of balls)
    else if(sh<2.5)a=smoothstep(.0,.28,d-(1.-n)*.5);                  // spray
    else a=d*d*(.25+.75*n)*.8;                                        // haze: soft all through, thinner in places
    a*=smoothstep(8.,36.,vD);                                         // (Version 190: gone right in front of the camera, as on the ride in)
    if(a<.004)discard;
    vec3 N=normalize(vec3(Q,sqrt(d)+.8));float l=clamp(dot(N,uSun),0.,1.);   // (lit flatter than a ball: Version 190)
    vec3 c=vB.rgb*mix(vec3(1.),uAmb+uSunC*l,vS.z)*(.82+.36*n);c=mix(c,uHor,vF);
    float k=1.;for(int i=0;i<8;i++){if(float(i)>=uMenN)break;vec4 m=uMen[i];if(vD<m.z){float e=distance(gl_FragCoord.xy,m.xy);k=min(k,mix(uMenK,1.,smoothstep(m.w*.55,m.w*1.6,e)));}}
    gl_FragColor=vec4(c,a*vB.a*k*(1.-vF*.4));}`;
// glow: flames, flashes and embers, added to the picture (the bloom catches what's bright)
const DDF_GLOW_FS=`uniform sampler2D tN;varying vec2 vU,vQ;varying vec4 vB;varying vec3 vS;varying float vD,vF;
  void main(){float r2=dot(vQ,vQ);if(r2>1.)discard;float sh=vS.y,d=1.-r2,a;
    if(sh<.5){vec2 t=vU*.4+vS.x*vec2(5.1,2.3);float n=texture2D(tN,t).g*.6+texture2D(tN,t*2.6+.2).b*.4;a=smoothstep(.0,.6,d*(.45+n)-.2);}   // a tongue of flame, ragged
    else if(sh<1.5){float an=atan(vU.y,vU.x),rr=sqrt(r2);a=exp(-r2*9.)*1.5+pow(abs(cos(an*3.)),20.)*(1.-rr)*.9+pow(abs(cos(an*2.+.7)),36.)*(1.-rr)*.5;}   // a flash: a hot core and rays
    else a=exp(-r2*5.);                                                                     // an ember
    gl_FragColor=vec4(vB.rgb*a*vB.a*(1.-vF*.6),1.);}`;
// tracers: a ribbon from the tail to the head of the bolt, turned to the camera, at least uPx wide on the screen, brightest at the head
const DDF_STREAK_VS=`attribute vec4 iA,iB,iC;uniform float uPx;varying float vA,vS;varying vec4 vC;
  void main(){vec4 a=viewMatrix*vec4(iA.xyz,1.),b=viewMatrix*vec4(iB.xyz,1.),v=mix(a,b,position.x);vec3 sd=cross(b.xyz-a.xyz,v.xyz);float L=length(sd);sd=L>1e-5?sd/L:vec3(0.,1.,0.);
    v.xyz+=sd*position.y*max(iA.w,-v.z*uPx);vA=position.x;vS=position.y;vC=vec4(iC.rgb,iB.w);gl_Position=projectionMatrix*v;}`;
const DDF_STREAK_FS=`varying float vA,vS;varying vec4 vC;
  void main(){float c=exp(-vS*vS*12.)*vA,k=exp(-vS*vS*2.6)*(.12+.88*vA*vA)+c*.9;gl_FragColor=vec4(vC.rgb*k*vC.a,c*.6*vC.a);}`;
// (blended as light added over what's behind, the hot core also covering a little of it: on the bright sand a purely added bolt came out a pale near-white
// line; now the core keeps its colour, yellow-orange ours, red-orange theirs. Version 188, pass 4)
// the dust ring: a flat band lying on the ground, racing outward
const DDF_RING_VS=`attribute vec4 iA,iB,iC;varying vec2 vP;varying vec4 vB;void main(){vP=position.xz;vB=iB;gl_Position=projectionMatrix*viewMatrix*vec4(iA.xyz+position*iA.w,1.);}`;
const DDF_RING_FS=`uniform sampler2D tN;varying vec2 vP;varying vec4 vB;
  void main(){float r=length(vP);if(r>1.)discard;float n=texture2D(tN,vP*.35+.5).g;float a=smoothstep(1.,.78,r)*smoothstep(.3,.8,r)*(.45+.75*n);gl_FragColor=vec4(vB.rgb,a*vB.a);}`;
// a scorch: a dark ragged blotch lying on the ground where a blast was, raked out in rays, thinner at its rim (Version 188, pass 3)
const DDF_SCORCH_VS=`attribute vec4 iA,iB,iC;varying vec2 vP;varying vec4 vB;varying float vS;
  void main(){float c=cos(iC.x),s=sin(iC.x);vP=vec2(position.x*c-position.z*s,position.x*s+position.z*c);vB=iB;vS=iC.y;gl_Position=projectionMatrix*viewMatrix*vec4(iA.xyz+vec3(vP.x,0.,vP.y)*iA.w,1.);}`;
const DDF_SCORCH_FS=`uniform sampler2D tN;varying vec2 vP;varying vec4 vB;varying float vS;
  void main(){float r=length(vP);if(r>1.)discard;float an=atan(vP.y,vP.x);vec2 t=vP*.42+vS*vec2(3.1,1.7);float n=texture2D(tN,t).g*.6+texture2D(tN,t*2.7+.3).b*.4;
    float ray=(pow(abs(cos(an*3.5+vS*9.)),6.)*.55+pow(abs(cos(an*5.+vS*5.)),10.)*.4)*.5+.12;   // (Version 190: the rays half as strong, a rounder blotch)
    float a=smoothstep(.0,.35,(.62+ray*.5-r)*(.7+n*.8))*(.55+.45*smoothstep(.65,.0,r))*(.75+.5*n);
    if(a<.01)discard;gl_FragColor=vec4(vB.rgb*(.75+.5*n),a*vB.a);}`;
function ddFxNoise(){
  if(typeof ddNoiseTex==='function')return ddNoiseTex();
  const N=64,D=new Uint8Array(N*N*4),r=rng(77);for(let i=0;i<D.length;i++)D[i]=(r()*255)|0;const t=new T.DataTexture(D,N,N,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.needsUpdate=true;return t;
}
function ddFxBuild(sc){
  const C=DDFX.cap,tN=ddFxNoise(),q=new T.PlaneGeometry(1,1);
  const U={tN:{value:tN},uSun:{value:new T.Vector3(0,0,1)},uSunC:{value:new T.Color(1,1,1)},uAmb:{value:new T.Color().fromArray(DDFX.amb)},uHor:{value:new T.Color(.8,.82,.84)},
    uMen:{value:[...Array(8)].map(()=>new T.Vector4(-1e4,-1e4,0,1))},uMenN:{value:0},uMenK:{value:DDFX.menK},uFN:{value:1000},uFF:{value:5000}};
  const sm=new T.ShaderMaterial({uniforms:U,vertexShader:DDF_VS,fragmentShader:DDF_SOFT_FS,transparent:true,depthWrite:false,fog:false});
  const gm=new T.ShaderMaterial({uniforms:{tN:U.tN,uFN:U.uFN,uFF:U.uFF},vertexShader:DDF_VS,fragmentShader:DDF_GLOW_FS,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false});
  const sq=new T.BufferGeometry();sq.setAttribute('position',new T.Float32BufferAttribute([0,-1,0,1,-1,0,1,1,0,0,1,0],3));sq.setIndex([0,1,2,0,2,3]);
  const km=new T.ShaderMaterial({uniforms:{uPx:{value:.002}},vertexShader:DDF_STREAK_VS,fragmentShader:DDF_STREAK_FS,transparent:true,depthWrite:false,fog:false,
    blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor,blendSrcAlpha:T.OneFactor,blendDstAlpha:T.OneMinusSrcAlphaFactor});
  const rq=new T.BufferGeometry();rq.setAttribute('position',new T.Float32BufferAttribute([-1,0,-1,1,0,-1,1,0,1,-1,0,1],3));rq.setIndex([0,2,1,0,3,2]);
  const rm=new T.ShaderMaterial({uniforms:{tN:U.tN},vertexShader:DDF_RING_VS,fragmentShader:DDF_RING_FS,transparent:true,depthWrite:false,fog:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
  const zm=new T.ShaderMaterial({uniforms:{tN:U.tN},vertexShader:DDF_SCORCH_VS,fragmentShader:DDF_SCORCH_FS,transparent:true,depthWrite:false,fog:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
  const cg=new T.DodecahedronGeometry(1,0),cm=new T.MeshLambertMaterial({color:0xffffff});cm.userData.ddKeep=true;   // (its colours are set as light already: ddlight.js's sweep leaves it)
  const clod=new T.InstancedMesh(cg,cm,C.clod[2]);clod.instanceMatrix.setUsage(T.DynamicDrawUsage);clod.frustumCulled=false;
  const wc=new T.Color(1,1,1);for(let i=0;i<C.clod[2];i++)clod.setColorAt(i,wc);clod.instanceColor.setUsage(T.DynamicDrawUsage);clod.count=0;sc.add(clod);   // (the colours made while count is the whole pool: setColorAt sizes its buffer by count)
  DDF={sc,U,
    soft:ddFxStore(C.soft[2]),glow:ddFxStore(C.glow[2]),clods:ddFxStore(C.clod[2]),rings:ddFxStore(C.ring[2]),scorch:ddFxStore(C.scorch[2]),
    softM:ddFxInst(sc,C.soft[2],q,sm,4),glowM:ddFxInst(sc,C.glow[2],q,gm,5),streakM:ddFxInst(sc,C.streak[2],sq,km,6),ringM:ddFxInst(sc,C.ring[2],rq,rm,3),scorchM:ddFxInst(sc,C.scorch[2],rq,zm,2),clod,
    seen:new WeakSet(),hit:new WeakSet(),run:new WeakMap(),nPrev:[],nPrevN:0,fwd:new T.Vector3(),v:new T.Vector3(),m4:new T.Matrix4(),e:new T.Euler(),bs:new T.Vector2(),
    col:[0,0,0],col2:[0,0,0],budget:0,hazeT:0,trail:0,farT:3};
  DDF.sortCmp=(a,b)=>DDF.soft.dep[b]-DDF.soft.dep[a];
}

/* ---------- the ground's loose stuff: sand on the beach, earth and grass inland ---------- */
// (into out: the colour of what a blast or a boot throws up there, as it's shown; fresh: what's dug up from under it, darker)
function ddFxDirt(x,y,out,fresh){
  let r,g,b;
  if(DD_MODE==='beach'&&y>300){r=.82;g=.72;b=.52;if(fresh){r=.6;g=.5;b=.35;}}
  else{r=.5;g=.43;b=.32;if(fresh){r=.33;g=.27;b=.2;}}
  out[0]=r;out[1]=g;out[2]=b;return out;
}
const ddFxWater=(x,y)=>DD_MODE==='beach'&&y>698&&ddH(x,y)<.4;   // (the sea: past the waterline; a deep shell hole on the sand is below the sea's level too)

/* ---------- a blast ---------- */
// k: how big (a hand grenade about .55, a rifle grenade .7, a shell 1, a wreck going up 1.4); hot: an oily fireball (a wreck, a fuel dump)
// far: one for the look only, far off (ddFxBluff): fewer puffs, no more than most of the store, and no scorch, ring or clods, too far off to see
function ddFxBlast(x,y,k,hot,far){
  const t=ddFxTier(),S=DDF.soft,G=DDF.glow,L=DDFX.cap.soft[t]*(far?.85:1),LG=DDFX.cap.glow[t],g=ddH(x,y),R=fxR,few=[.5,.78,1][t]*(far?.65:1);
  if(ddFxWater(x,y)){ddFxSpout(x,y,k);return;}
  const c=ddFxDirt(x,y,DDF.col,false),cr=c[0],cg=c[1],cb=c[2],f=ddFxDirt(x,y,[0,0,0],true);
  // the flash and the fireball
  ddFxAdd(G,LG,x,g+9*k,y,0,0,0,.11,34*k,52*k,1,.9,.7,1,.55,.25,.9,1,0,0,0,0);
  const nf=Math.round((hot?9:4+2*k)*few);
  for(let i=0;i<nf;i++){const a=R()*TAU,s=(16+R()*34)*k;ddFxAdd(G,LG,x+Math.cos(a)*5*k,g+(6+R()*10)*k,y+Math.sin(a)*5*k,Math.cos(a)*s,(26+R()*44)*k,Math.sin(a)*s,
    (hot?.65:.26)+R()*.2,(9+R()*6)*k,(20+R()*12)*k*(hot?1.4:1),1,.72,.38,.7,.2,.05,.62,0,2.5,hot?30:12,0,0,0);}
  for(let i=0;i<Math.round((hot?10:3+3*k)*few);i++){const a=R()*TAU,s=(60+R()*120)*k;ddFxAdd(G,LG,x,g+8*k,y,Math.cos(a)*s,(90+R()*160)*k,Math.sin(a)*s,.5+R()*.6,2.2,1.2,1,.8,.45,1,.35,.08,1,2,.4,-300,0,0,0);}   // sparks flung out
  // the plume: earth (or sand) flung up all at once at every speed, so it stands as a column for a moment, narrow and pale at the top, broad and dark at
  // the foot, then falls back as a curtain and lies as dust; and the heavier body of it thrown out low
  const sand=DD_MODE==='beach'&&y>300,np=Math.round((14+16*k)*few);
  for(let i=0;i<np;i++){const u=i/(np-1),a=R()*TAU,up=(60+u*330)*k*(.9+.2*R()),out=(5+(1-u)*34+R()*10)*k,m=.55+.45*u,j=.42+1.02*R()*(.55+.45*R());   // (j: sizes mixed, Version 190, so its outline is one ragged mass)
    ddFxAdd(S,L,x+Math.cos(a)*3*k,g+5*k,y+Math.sin(a)*3*k,Math.cos(a)*out,up,Math.sin(a)*out,1.3+u*.9+R()*.4,(13-6*u+R()*4)*k*j,(32-12*u+R()*10)*k*j,
      f[0]+(cr-f[0])*m,f[1]+(cg-f[1])*m,f[2]+(cb-f[2])*m,cr*1.04,cg*1.04,cb*1.04,.9,1,.25,-300,.12,.75,.015);}
  const nb=Math.round((4+5*k)*few);
  for(let i=0;i<nb;i++){const a=R()*TAU,o=R(),up=(70+R()*90)*k,out=(30+o*70)*k;
    ddFxAdd(S,L,x+Math.cos(a)*5*k,g+6*k,y+Math.sin(a)*5*k,Math.cos(a)*out,up,Math.sin(a)*out,1.2+R()*.8,(10+R()*6)*k,(24+R()*12)*k,f[0],f[1],f[2],cr,cg,cb,.85,1,.9,-260,.2,.8,.02);}
  // its heart: a dark column of smoke and earth standing a moment
  const nc=Math.round((2+2*k)*few);
  for(let i=0;i<nc;i++){const h=(10+i*16)*k;ddFxAdd(S,L,x+(R()-.5)*8*k,g+h,y+(R()-.5)*8*k,(R()-.5)*14,(60+R()*70)*k,(R()-.5)*14,1.1+R()*.7,(16+R()*8)*k,(38+R()*18)*k,f[0]*.8+.06,f[1]*.78+.06,f[2]*.76+.06,.52,.49,.44,.7,0,1.4,-60,.3,.9,.03);}   // (Version 190: earth brown, not near black)
  // a shell's (and a wreck's) smoke left standing as a column over where it fell, darker at its foot, leaning off downwind for ten seconds or so; it
  // fades in as the earth comes down, and takes no more than most of the store, so the next blast always has room (Version 188, pass 3)
  // (by one of the squad you play it's half as many and thinner: a shell beside them mustn't stand a wall of smoke over them for ten seconds)
  let close=false;if(k>=.9&&dd)for(const p of players)if(alive(p)&&!p.inBoat&&hyp(p.x-x,p.y-y)<130){close=true;break;}   // (Version 190: either squad)
  if(k>=.9){const nl=Math.round(DDFX.linger[t]*(hot?1.4:1)*Math.min(1.3,k)*(close?.5:1)),la=close?.55:1;
    for(let i=0;i<nl;i++){const u=i/Math.max(1,nl-1),dk=hot?.1:(sand?.44:.38)+u*.06,ta=hot?1:.6;   // (Version 190: earth-dust colours and thinner; it stood near black over the squad)
      ddFxAdd(S,L*.85,x+(R()-.5)*16*k,g+(14+u*52)*k,y+(R()-.5)*16*k,(R()-.5)*5,(8+u*14+R()*6)*k,(R()-.5)*5,
      10+R()*5+u*3,(30+R()*10)*k,(80+u*44+R()*30)*k,dk,dk*.93,dk*.84,dk+.2,dk+.18,dk+.15,(.64-u*.18)*la*ta,0,.5,.7,1+u*.5,.8,.8+u*.6);}}
  // the smoke that's left, drifting off (black and oily from a wreck; a brownish grey from earth and sand, not a cold grey)
  const ns=Math.round((hot?8:2+4*k)*few);
  for(let i=0;i<ns;i++){const a=R()*TAU,o=R()*16*k;const dk=hot?.12:sand?.42:.36;ddFxAdd(S,L,x+Math.cos(a)*o,g+(12+R()*24)*k,y+Math.sin(a)*o,Math.cos(a)*10,(5+R()*8)*k,Math.sin(a)*10,
    (hot?8:5)+R()*2.5,(18+R()*10)*k,(46+R()*26)*k*(hot?1.3:1),dk,dk*.94,dk*.86,dk+.2,dk+.17,dk+.12,hot?.8:.55,0,.5,2.6,1,.85,.45);}
  // the shock: dust racing out along the ground, and its ring
  const nr=Math.round((4+7*k)*few);
  for(let i=0;i<nr;i++){const a=i/nr*TAU+R()*.5,s=(130+R()*80)*k;ddFxAdd(S,L,x+Math.cos(a)*8*k,g+6,y+Math.sin(a)*8*k,Math.cos(a)*s,4+R()*8,Math.sin(a)*s,.9+R()*.7,(9+R()*5)*k,(28+R()*14)*k,Math.min(1,cr*1.1+.07),Math.min(1,cg*1.1+.07),Math.min(1,cb*1.1+.07),cr,cg,cb,.55,1,3.2,0,.4,.6,.02);}
  if(far)return;
  ddFxScorch(x,y,g,k,sand);
  ddFxAdd(DDF.rings,DDFX.cap.ring[t],x,g+2.5,y,0,0,0,.42,6*k,120*k,Math.min(1,cr*1.14+.08),Math.min(1,cg*1.14+.08),Math.min(1,cb*1.14+.08),cr,cg,cb,.8,0,0,0,0,0,0);
  // clods
  const nk=Math.round((sand?2+3*k:3+10*k)*few),K=DDF.clods;
  for(let i=0;i<nk;i++){const a=R()*TAU,s=(30+R()*90)*k;const j=ddFxAdd(K,DDFX.cap.clod[t],x+Math.cos(a)*4,g+6,y+Math.sin(a)*4,Math.cos(a)*s,(140+R()*170)*k,Math.sin(a)*s,2.2+R()*1.4,(1.6+R()*1.9)*Math.sqrt(k),0,f[0]*1.15,f[1]*1.15,f[2]*1.15,0,0,0,1,0,0,-400,0,0,0);
    if(j>=0){K.rv[j]=(R()-.5)*16;K.c1[j*3]=R()*TAU;K.c1[j*3+1]=R()*TAU;}}
}
// a scorch where it went off: the oldest goes when the store is full (a long fight keeps the newest)
function ddFxScorch(x,y,g,k,sand){
  const Z=DDF.scorch,lim=Math.min(Z.cap,DDFX.cap.scorch[ddFxTier()]);if(Z.n>=lim){let o=0;for(let i=1;i<Z.n;i++)if(Z.age[i]/Z.life[i]>Z.age[o]/Z.life[o])o=i;ddFxKill(Z,o);}
  const d=sand?[.33,.27,.19]:[.27,.22,.16];ddFxAdd(Z,lim,x,g+.6,y,0,0,0,DDFX.scorch*(.6+.4*Math.min(1,k)),(22+fxR()*8)*k*.75,0,d[0],d[1],d[2],0,0,0,sand?.4:.42,0,0,0,0,0,.25);   // (Version 190: burnt earth, smaller; near black it read as a hole)
}
// a shell in the sea: a column of white water thrown up and falling back, and mist
function ddFxSpout(x,y,k){
  const t=ddFxTier(),S=DDF.soft,L=DDFX.cap.soft[t],R=fxR,few=[.5,.78,1][t];
  const n=Math.round((8+12*k)*few);
  for(let i=0;i<n;i++){const a=R()*TAU,o=R(),up=(160+R()*200)*k*(.7+.6*(1-o));ddFxAdd(S,L,x+Math.cos(a)*5*k,1,y+Math.sin(a)*5*k,Math.cos(a)*(10+o*40)*k,up,Math.sin(a)*(10+o*40)*k,1.4+R()*.8,(8+R()*5)*k,(20+R()*14)*k,.96,.98,1,.9,.94,.96,.9,2,.4,-330,.1,.8,.02);}
  for(let i=0;i<Math.round(4*few);i++)ddFxAdd(S,L,x+(R()-.5)*20*k,(10+R()*30)*k,y+(R()-.5)*20*k,(R()-.5)*20,(20+R()*20)*k,(R()-.5)*20,2.4+R()*1.4,(26+R()*10)*k,(70+R()*30)*k,.9,.93,.95,.85,.88,.9,.32,0,.5,0,.8,.6,.25);
  ddFxAdd(DDF.rings,DDFX.cap.ring[t],x,1.2,y,0,0,0,.6,8*k,110*k,.92,.96,1,.92,.96,1,.6,0,0,0,0,0,0);
}

/* ---------- burning wrecks: flames at the foot and a column of black smoke, for a long while ---------- */
function ddFxFires(dt){
  if(dt<=0)return;const t=ddFxTier(),S=DDF.soft,G=DDF.glow,L=DDFX.cap.soft[t],LG=DDFX.cap.glow[t],R=fxR,cx=camera.position.x,cz=camera.position.z;
  for(const f of tankFires){
    const age=simT-f.t0;if(age<0||hyp(f.x-cx,f.y-cz)>1900)continue;   // (from the camera, not the view's centre: in the boat the camera's far from it)
    const fk=age<45?1:Math.max(.35,1-(age-45)/120),sk=age<90?1:Math.max(.4,1-(age-90)/200);   // the flames die down after the first minute; the smoke thins later, never quite gone
    const big=Math.min(1.8,Math.max(.7,(f.r||10)/11)),g=ddH(f.x,f.y),base=g+(DD_MODE==='beach'&&ddFxWater(f.x,f.y)?4:8+5*big),rr=(f.r||10)*.7;
    f.fxF=(f.fxF||0)+dt*DDFX.fireFlame[t]*fk*big;
    while(f.fxF>1){f.fxF--;const a=R()*TAU,o=R()*rr;ddFxAdd(G,LG*.8,f.x+Math.cos(a)*o,base+R()*4,f.y+Math.sin(a)*o,(R()-.5)*8,(30+R()*34)*big,(R()-.5)*8,.5+R()*.4,(12+R()*8)*big,(4+R()*3)*big,1,.6,.24,.75,.15,.03,.68,0,.8,8,.5,0,0);
      if(R()<.25)ddFxAdd(G,LG*.8,f.x+Math.cos(a)*o*.5,base+3,f.y+Math.sin(a)*o*.5,0,4,0,.35+R()*.2,(26+R()*10)*big*fk,(22+R()*8)*big*fk,1,.45,.12,.9,.3,.05,.22,2,0,0,.3,0,.05);   // the glow of it on the hull
      if(R()<.12)ddFxAdd(G,LG*.8,f.x+Math.cos(a)*o,base+8,f.y+Math.sin(a)*o,(R()-.5)*30,50+R()*50,(R()-.5)*30,1+R()*.8,1.6,1,1,.7,.35,1,.3,.05,1,2,.6,-10,.6,0,0);}   // an ember now and then
    f.fxS=(f.fxS||0)+dt*DDFX.fireSmoke[t]*sk*Math.sqrt(big);
    while(f.fxS>1){f.fxS--;ddFxAdd(S,L*.8,f.x+(R()-.5)*rr,base+8*big,f.y+(R()-.5)*rr,(R()-.5)*6,(20+R()*10)*big,(R()-.5)*6,6.5+R()*2,(11+R()*5)*big,(44+R()*20)*big,.07,.065,.06,.36,.35,.34,.42*sk+.08,0,.3,4,1.35,.7,.5);}
  }
}

/* ---------- drifting battle smoke, low over the field ---------- */
function ddFxHaze(dt){
  const t=ddFxTier(),S=DDF.soft,want=DDFX.haze[t];if(dt<=0||(dd&&dd.land&&!dd.land.done)||(dd&&dd.fp))return;
  let n=0;for(let i=0;i<S.n;i++)if(S.shape[i]===3&&S.fl[i]!==2)n++;   // (the bluff's banks, fl 2, are counted apart: ddFxBluffSmoke)
  if(n>=want||(DDF.hazeT-=dt)>0)return;DDF.hazeT=.4;
  const R=fxR,C=camera.position,dv=Math.hypot(C.x-camT.x,C.z-camT.z)+Math.abs(C.y-ddH(camT.x,camT.z)),rad=clamp(dv*.55,260,700);
  const m=players.filter(p=>alive(p)&&!p.inBoat);   // (both squads: a bank of smoke never lies down over either of them, pass 4)
  for(let k=0;k<6;k++){const a=R()*TAU,d=rad*(.25+R()*.75),x=camT.x+Math.cos(a)*d,y=camT.z+Math.sin(a)*d*.8;
    if(m.some(p=>hyp(p.x-x,p.y-y)<140))continue;if(DD_MODE==='beach'&&y>300)continue;   // (Version 190: none on the sand between the water and the wire)
    const s=300+R()*200,c=DD_MODE==='beach'&&y>300?[.62,.58,.51]:[.6,.58,.53];   // (warm greys: a neutral grey read blue over the grass and sand)
    ddFxAdd(S,DDFX.cap.soft[t],x,ddH(x,y)+s*.17,y,(R()-.5)*3,0,(R()-.5)*3,24+R()*16,s*.85,s*1.15,c[0],c[1],c[2],c[0],c[1],c[2],.15+R()*.06,3,0,0,.85,.45,7);return;}
}

/* ---------- shots: a puff at the muzzle, a kick of dirt where a round lands, chips off cover, dust from running feet ---------- */
function ddFxShots(dt){
  const t=ddFxTier(),S=DDF.soft,L=DDFX.cap.soft[t]*.7,R=fxR,seen=DDF.seen,v=DDF.v;
  for(const f of flashes){if(!f.u||seen.has(f))continue;seen.add(f);
    const at=f.u&&typeof muzzleAt==='function'?muzzleAt(f.u,v):null,x=at?at.x:f.x,h=at?at.y:ddH(f.x,f.y)+12,y=at?at.z:f.y,mg=f.u&&f.u.gunner;
    const fpk=f.u.fp&&at&&typeof ddReal==='function'&&ddReal()?.5:1;   // (Version 246, the draft's guns: from behind your own gun the flash is a few metres off, not across the field)
    ddFxAdd(DDF.glow,DDFX.cap.glow[t]*.6,x,h,y,0,0,0,.055,(mg?10:6.5)*fpk,(mg?15:9)*fpk,1,.9,.6,1,.55,.2,mg?1:.8,1,0,0,0,0,0);   // a star of flame at the barrel, each shot (Version 188, pass 4: the sprite alone was lost in daylight)
    if(R()>DDFX.muzzle[t])continue;
    ddFxAdd(S,L,x,h,y,(R()-.5)*6,5+R()*4,(R()-.5)*6,mg?1.4:.9,mg?5:3.4,mg?18:12,.86,.85,.83,.7,.7,.69,mg?.42:.34,0,.8,2,.6,.6,.04);}
  let kick=0;
  for(const r of tracers){if(r.t<.085||DDF.hit.has(r))continue;DDF.hit.add(r);if(kick++>8)continue;
    const x=r.x2,y=r.y2;if(ddFxWater(x,y))continue;let flesh=false;for(const u of units)if(!u.dead&&hyp(u.x-x,u.y-y)<6){flesh=true;break;}if(flesh)continue;
    const c=ddFxDirt(x,y,DDF.col,false),g=ddH(x,y),fr=ddFxDirt(x,y,DDF.col2,true);   // a spurt of the darker stuff under the top, then a light puff of it hanging
    ddFxAdd(S,L,x,g+2,y,(R()-.5)*10,60+R()*50,(R()-.5)*10,.45+R()*.2,1.6,4.5,fr[0],fr[1],fr[2],c[0],c[1],c[2],.85,1,1,-260,.1,1,.01);
    ddFxAdd(S,L,x+(R()-.5)*3,g+3,y+(R()-.5)*3,(R()-.5)*14,14+R()*14,(R()-.5)*14,.7+R()*.4,3,10+R()*4,Math.min(1,c[0]*1.08+.05),Math.min(1,c[1]*1.08+.05),Math.min(1,c[2]*1.08+.05),c[0],c[1],c[2],.5,1,2.2,-20,.3,.7,.01);}
  for(const s of sparks){if(seen.has(s))continue;seen.add(s);const g=ddH(s.x,s.y);
    for(let k=0;k<2;k++)ddFxAdd(S,L,s.x+(R()-.5)*3,g+5+R()*5,s.y+(R()-.5)*3,(R()-.5)*20,10+R()*20,(R()-.5)*20,.6+R()*.3,2,7,.66,.64,.6,.62,.6,.57,.5,1,1.5,-40,.2,1,.01);}
  // running: a puff at his heels now and then (the beach's sand most of all); a dive into cover throws up a little more
  if(dt<=0)return;const every=DDFX.dust[t];DDF.budget=Math.min(6,DDF.budget+dt*30);
  for(const u of units){if(u.dead||u.inBoat||u.afloat||u.offMap||u.mon||!u.m||!u.m.visible)continue;
    let q=DDF.run.get(u);if(!q){q={x:u.x,y:u.y,t:R()*every,v:0};DDF.run.set(u,q);continue;}
    const sp=hyp(u.x-q.x,u.y-q.y)/dt;q.x=u.x;q.y=u.y;const was=q.v;q.v=q.v*.7+sp*.3;
    if(DDF.budget<1)continue;
    if(q.v>28&&!u.downed){if((q.t-=dt)>0)continue;q.t=every*(.7+R()*.6);DDF.budget--;
      if(ddFxWater(u.x,u.y))continue;const c=ddFxDirt(u.x,u.y,DDF.col,false),g=ddH(u.x,u.y),sand=DD_MODE==='beach'&&u.y>300;
      ddFxAdd(S,L,u.x+(R()-.5)*4,g+2.5,u.y+(R()-.5)*4,(R()-.5)*8,6+R()*6,(R()-.5)*8,.7+R()*.4,3.5,sand?12:9,c[0],c[1],c[2],c[0],c[1],c[2],sand?.42:.3,1,2,0,.4,1,.03);}
    else if(was>30&&q.v<10&&!u.downed){DDF.budget--;const c=ddFxDirt(u.x,u.y,DDF.col,false),g=ddH(u.x,u.y);
      for(let k=0;k<3;k++){const a=R()*TAU;ddFxAdd(S,L,u.x+Math.cos(a)*5,g+3,u.y+Math.sin(a)*5,Math.cos(a)*24,8+R()*8,Math.sin(a)*24,.9+R()*.4,4,13,c[0],c[1],c[2],c[0],c[1],c[2],.38,1,3,0,.4,1,.03);}}
  }
}
/* ---------- the big guns: a tank's or a gun's shot, a tank on the move ---------- */
// a heavy gun's shot (a flash with no man behind it: a tank, the guns on the bluffs, the counterattack's guns): a ring of smoke blown out round the
// muzzle and on along the shot, the ground's dust lifted under it. dir: the shot's way, or null (then all round)
function ddFxCannon(x,h,y,dir){
  const t=ddFxTier(),S=DDF.soft,G=DDF.glow,L=DDFX.cap.soft[t],R=fxR,few=[.5,.78,1][t],c=ddFxDirt(x,y,DDF.col,false),g=ddH(x,y);
  const dx=dir==null?0:Math.cos(dir),dy=dir==null?0:Math.sin(dir);
  ddFxAdd(G,DDFX.cap.glow[t],x+dx*6,h,y+dy*6,0,0,0,.09,26,40,1,.9,.7,1,.6,.3,.9,1,0,0,0,0,0);
  for(let i=0;i<3;i++)ddFxAdd(G,DDFX.cap.glow[t],x+dx*(6+i*7),h,y+dy*(6+i*7),dx*60,4,dy*60,.18+i*.04,12-i*2,20-i*3,1,.75,.4,.8,.25,.05,.7,0,6,0,0,0,0);
  const n=Math.round(10*few);
  for(let i=0;i<n;i++){const a=i/n*TAU,s=40+R()*30,fw=dir==null?0:70+R()*90;
    ddFxAdd(S,L,x+dx*4,h,y+dy*4,Math.cos(a)*s*(dir==null?1:.55)+dx*fw,Math.sin(a*1.7)*s*.35+6,Math.sin(a)*s*(dir==null?1:.55)+dy*fw,2.2+R()*1.6,7+R()*4,26+R()*14,.8,.76,.7,.66,.63,.58,.6,0,2.4,3,1,.8,.03);}
  if(h-g<40)for(let i=0;i<Math.round(5*few);i++){const a=R()*TAU,s=60+R()*50;ddFxAdd(S,L,x+Math.cos(a)*6,g+4,y+Math.sin(a)*6,Math.cos(a)*s+dx*40,3,Math.sin(a)*s+dy*40,1.2+R()*.6,8,24,c[0],c[1],c[2],c[0],c[1],c[2],.42,1,3.4,0,.4,.6,.02);}
}
function ddFxBigGuns(dt){
  const seen=DDF.seen,tanks=dd&&dd.tanks||[];
  for(const f of flashes){if(f.u||seen.has(f))continue;seen.add(f);let h=ddH(f.x,f.y)+16,dir=null;
    for(const K of tanks){const mz=K.mz||58;if(hyp(K.x+Math.cos(K.ta)*mz-f.x,K.y+Math.sin(K.ta)*mz-f.y)<3){h=ddH(K.x,K.y)+(K.mh||28);dir=K.ta;break;}}
    if(dir==null&&rockets.some(r=>{const b=r.total?r.total-r.left:0;return hyp(r.x-r.dx*b-f.x,r.y-r.dy*b-f.y)<8;}))continue;   // (a bazooka's launch, where the rocket set off from: ddRockets puffs that one. Before pass 4 only a rocket still at the flash was caught, and it's 10 on by the first frame: a big gun's smoke ring went up round our own man)
    ddFxCannon(f.x,h,f.y,dir);}
  // a tank on the move: dust from its tracks, a little oily smoke from its back deck
  if(dt<=0)return;const t=ddFxTier(),S=DDF.soft,L=DDFX.cap.soft[t]*.75,R=fxR;
  for(const K of tanks){if(K.hp<=0)continue;let q=DDF.run.get(K);if(!q){DDF.run.set(K,q={x:K.x,y:K.y,t:0,v:0});continue;}
    const sp=hyp(K.x-q.x,K.y-q.y)/dt;q.x=K.x;q.y=K.y;q.v=q.v*.8+sp*.2;if(q.v<6||(q.t-=dt)>0)continue;q.t=[.3,.18,.12][t];
    const ca=Math.cos(K.ang),sa=Math.sin(K.ang),c=ddFxDirt(K.x,K.y,DDF.col,false);
    for(const sd of[-17,17]){const x=K.x-ca*30-sa*sd,y=K.y-sa*30+ca*sd;ddFxAdd(S,L,x,ddH(x,y)+5,y,-ca*8+(R()-.5)*6,5+R()*5,-sa*8+(R()-.5)*6,1.4+R()*.6,8,24+R()*8,c[0],c[1],c[2],c[0],c[1],c[2],.4,1,1.2,0,.6,.9,.1);}
    if(R()<.5){const x=K.x-ca*22,y=K.y-sa*22;ddFxAdd(S,L,x,ddH(x,y)+24,y,(R()-.5)*4,12,(R()-.5)*4,1.6,4,14,.25,.24,.23,.5,.49,.47,.4,0,.8,2,1,.7,.1);}}
}
// a puff for the rockets' trails, back-blasts and a hit gun's smoke (dday.js's ddRockets and ddcounter.js call DD.rk.puff, which comes here): col a hex
function ddFxPuff(x,h,y,s,life,col,vy,j1=.5,j2=.5,j3=.5){
  if(!DDF)return false;x+=(j1-.5)*2;h+=(j2-.5)*2;y+=(j3-.5)*2;const tr=life>1.6&&life<2;if(tr&&(DDF.trail=(DDF.trail+1)%2))return true;   // (a rocket's trail comes 80 puffs a second: every other one is plenty, each bigger)
  const t=ddFxTier(),r=((col>>16)&255)/255,g=((col>>8)&255)/255,b=(col&255)/255,warm=r>.8&&b<.5;
  if(warm)return ddFxAdd(DDF.glow,DDFX.cap.glow[t],x,h,y,(fxR()-.5)*6,vy||2,(fxR()-.5)*6,life*.6,s*1.6,s*.6,r,g*.85,b*.6,r*.8,g*.3,b*.1,.8,0,1,0,0,0,0)>=0;
  const R=fxR,j=.75+R()*.5;   // (a trail's puffs start big enough to touch the last one, about 7 apart at a rocket's speed, so it's one rope of smoke, not beads)
  const q=tr?.78:1;   // (Version 190: a rocket's trail thinner, greyer, fainter and shorter-lived: it read as a white hose)
  return ddFxAdd(DDF.soft,DDFX.cap.soft[t]*.85,x+(R()-.5)*3,h+(R()-.5)*3,y+(R()-.5)*3,(R()-.5)*5,vy||3,(R()-.5)*5,life*(1.1+R()*.5)*(tr?.6:1),s*(tr?1.15:.9)*j,s*(tr?2.4:3.4)*j,r*q,g*q,b*q,Math.min(1,r*q*1.08+.06),Math.min(1,g*q*1.08+.06),Math.min(1,b*q*1.08+.06),tr?.3:.7,tr?0:3,.6,0,.6,.7,.05)>=0;
}

/* ---------- the battle beyond yours: shells bursting out on the beach's flanks and in the sea ---------- */
// Looks only (nothing is hurt, nothing hears it): a spot ahead of the camera, 500 to 1600 away, out of the fight (the beach either side of the
// one you land on, x under 170 or over 1230, or the sea past the surf) and never within 450 of one of the squad; a column of water at sea, a burst
// of sand on the land. The beach only (the ride in and the landing); the counterattack and the village have battles of their own
function ddFxFar(dt){
  const t=ddFxTier(),every=DDFX.far[t];if(!every||dt<=0||DD_MODE!=='beach')return;ddFxBluff(dt);ddFxBluffSmoke(dt);if((DDF.farT-=dt)>0)return;DDF.farT=every*(.55+fxR()*.9)*(dd&&dd.land&&!dd.land.done?.5:1);
  const C=camera.position,F=camera.getWorldDirection(DDF.v),ha=Math.atan2(F.z,F.x);
  for(let k=0;k<6;k++){const d=500+fxR()*1100,a=ha+(fxR()-.5)*1.1,x=C.x+Math.cos(a)*d,y=C.z+Math.sin(a)*d;
    const sea=y>820&&y<2400,side=(x<170||x>1230)&&x>-600&&x<2000&&y>300&&y<820,ride=dd&&dd.land&&!dd.land.done&&y>330&&y<720;if(!sea&&!side&&!ride)continue;   // (on the ride in, the beach ahead is shelled too: nobody of ours is on it yet)
    let near=false;for(const p of players)if(!p.dead&&hyp(p.x-x,p.y-y)<450){near=true;break;}if(near)continue;
    if(sea)ddFxSpout(x,y,.8+fxR()*.5);else ddFxBlast(x,y,.9+fxR()*.4,false);if(typeof ddsFarBoom==='function')ddsFarBoom(x,y,sea);return;}   // (Version 190: heard too)
}

// Version 190: on a portrait phone the view ahead after the landing is narrow, and the far bursts above land off its sides, so the beach looked calm
// and tidy. These land in the upper part of the screen itself (a spot under the screen, scene.js's toW), on the bluff beyond the wire (x 200-1200,
// y under 300), every 3-5 s; looks only, the same keep-off as DDFX.farClear
function ddFxBluff(dt){
  const t=ddFxTier();if(!DDFX.bluff[t]||!dd||!dd.land||!dd.land.done||dd.fp||dd.counter||camera.aspect>=.8||(DDF.bluffT=(DDF.bluffT??2)-dt)>0)return;DDF.bluffT=DDFX.bluff[t]*(.75+fxR()*.5);
  const cl=DDFX.farClear;
  for(let k=0;k<24;k++){const w=toW(cw*(.08+.84*fxR()),ch*(.12+.38*fxR())),x=w[0],y=w[1];   // (from an eighth of the way down: a plume needs room above it)
   if(x<200||x>1200||y>300)continue;
    let near=false;for(const p of players)if(!p.dead&&hyp(p.x-x,p.y-y)<cl[0]){near=true;break;}
    if(!near)for(const u of units)if(!u.dead&&hyp(u.x-x,u.y-y)<(u.side==='E'?cl[2]:cl[1])){near=true;break;}
    if(near)continue;ddFxBlast(x,y,.75+fxR()*.35,false,true);if(typeof ddsFarBoom==='function')ddsFarBoom(x,y,false);return;}
}
// Version 190: two or three slow banks of battle smoke low along the foot of the bluff, beyond their line on the sand (y 90-130, within 220 either side
// of where the view's middle meets it), never laid down within 140 of one of our men or in front of a German within 90 (one in front of it stays in
// front: a bank is drawn at the depth of its middle); drawn as haze, marked fl 2
function ddFxBluffSmoke(dt){
  const t=ddFxTier(),want=DDFX.bluffSmoke[t],S=DDF.soft;if(!want||!dd||!dd.land||!dd.land.done||dd.fp||dd.counter||(DDF.bsT=(DDF.bsT??0)-dt)>0)return;DDF.bsT=1.5;
  let n=0;for(let i=0;i<S.n;i++)if(S.shape[i]===3&&S.fl[i]===2)n++;if(n>=want)return;
  const C=camera.position,F=camera.getWorldDirection(DDF.v),y=90+fxR()*40,x=clamp(C.x+(F.z<-.1?F.x/F.z*(y-C.z):0)+(fxR()-.5)*440,220,1180);
  for(const p of players)if(!p.dead&&hyp(p.x-x,p.y-y)<140)return;for(const u of enemies)if(!u.dead&&u.y<y+20&&hyp(u.x-x,u.y-y)<90)return;
  const s=240+fxR()*140,j=ddFxAdd(S,DDFX.cap.soft[t]*.8,x,ddH(x,y)+s*.12,y,(fxR()-.5)*2,0,(fxR()-.5)*1.5,30+fxR()*15,s*.85,s*1.2,.6,.57,.51,.62,.6,.55,.16+fxR()*.05,3,0,0,.6,.45,8);
  if(j>=0)S.fl[j]=2;
}

/* ---------- each frame ---------- */
// what landed since the last frame: the grenades and shells that were in the air (a blast at the very spot one was headed is that one)
function ddFxBooms(){
  const P=DDF.nPrev,seen=DDF.seen;
  for(const b of booms){if(b.t<0||seen.has(b))continue;seen.add(b);
    let k=(b.size||1)>=1.3?1.25+((b.size||1)-1.3)*.6:(b.size||1)>1?.8:.7,hot=(b.size||1)>=1.3;
    for(let i=0;i<DDF.nPrevN;i++){const n=P[i];if(n.x1!==b.x||n.y1!==b.y)continue;
      k=n.enemy?clamp((n.R||50)/54,.62,1.2):n.gl?.72:.55;break;}
    ddFxBlast(b.x,b.y,k,hot);}
  DDF.nPrevN=0;for(const n of nades)if(!n.smoke)P[DDF.nPrevN++]=n;   // (kept for the next frame's blasts)
}
function ddFxFrame(rdt,now,dt){
  if(!DDF||!DD||DDF.sc!==DD.scene)return;
  const bl=DD.lights&&DD.lights.boomL,lb=booms[booms.length-1];if(bl&&lb){const q=clamp(lb.t/.3,0,1);bl.intensity=2.4*(1-q)*(1-q);bl.distance=240;}   // (scene.js lights the latest blast at 7 for .6 s: under the daylight curve that burned a bright disc into the ground; a quick flash now)
  ddFxBooms();ddFxFires(dt);ddFxHaze(dt);ddFxFar(dt);ddFxShots(dt);ddFxBigGuns(dt);ddFxGibs(dt);
  ddFxStep(DDF.soft,dt);ddFxStep(DDF.glow,dt);ddFxStep(DDF.rings,dt);ddFxStep(DDF.scorch,dt);ddFxStepClods(dt);
  ddFxDraw();
}
// the bits of men (dday.js's ddGib) once they've landed: laid flat on a face, and from 8 s sunk into the ground a unit a second, so none is left
// standing about like a box (dday.js hides them at 12 s). Version 190; looks only
function ddFxGibs(dt){
  if(dt<=0||!DD.gibs)return;
  for(const g of DD.gibs){if(!g.on)continue;const r=g.m.rotation;
    if(g.v){g.fl=0;continue;}
    if(!g.fl){g.fl=1;r.x=Math.round(r.x/Math.PI)*Math.PI+(fxR()-.5)*.3;r.z=Math.round(r.z/Math.PI)*Math.PI+(fxR()-.5)*.3;g.m.position.y-=.5;}   // (dday.js stops them 1.2 up: a flat chunk sits on the ground)
    if(g.t>8)g.m.position.y-=dt;}
}
function ddFxStepClods(dt){
  const K=DDF.clods;if(dt<=0)return;
  for(let i=0;i<K.n;i++){K.age[i]+=dt;if(K.age[i]>=K.life[i]){ddFxKill(K,i);i--;continue;}
    if(K.grav[i]){K.vy[i]+=K.grav[i]*dt;K.x[i]+=K.vx[i]*dt;K.y[i]+=K.vy[i]*dt;K.z[i]+=K.vz[i]*dt;K.c1[i*3]+=K.rv[i]*dt;K.c1[i*3+1]+=K.rv[i]*.7*dt;
      const g=ddH(K.x[i],K.z[i])+K.s0[i]*.5;if(K.y[i]<g){K.y[i]=g;if(K.vy[i]<-60&&!K.fl[i]){K.fl[i]=1;K.vy[i]*=-.28;K.vx[i]*=.45;K.vz[i]*=.45;K.rv[i]*=.5;}else{K.grav[i]=0;K.vy[i]=0;}}}}
}
// the buffers for the GPU: the soft ones far to near; the men to keep clear (where each of the squad you play is on the screen, and how far)
function ddFxDraw(){
  const cam=camera;cam.matrixWorldInverse.copy(cam.matrixWorld).invert();const F=DDF.fwd.set(0,0,-1).applyQuaternion(cam.quaternion),cp=cam.position,U=DDF.U;
  renderer.getDrawingBufferSize(DDF.bs);const bw=DDF.bs.x,bh=DDF.bs.y;
  // the light: the sun's way in the camera's frame, its colour, the haze
  const S0=DD.sky;if(S0){DDF.v.copy(S0.sun).transformDirection(cam.matrixWorldInverse);U.uSun.value.copy(DDF.v);U.uSunC.value.copy(S0.sunC).multiplyScalar(DDFX.sunK);U.uHor.value.copy(S0.hor);}
  const fog=DD.scene.fog;if(fog&&fog.isFog){U.uFN.value=fog.near;U.uFF.value=fog.far;}
  let nm=0;
  if(dd&&!dd.fp)for(const p of players){if(nm>=8)break;if(!alive(p)||p.inBoat||(p.m&&!p.m.visible))continue;   // (Version 190: both squads: Bravo stood buried in smoke)
    const h=ddH(p.x,p.y),v=DDF.v.set(p.x,h+12,p.y);const dz=(v.x-cp.x)*F.x+(v.y-cp.y)*F.y+(v.z-cp.z)*F.z;if(dz<5)continue;v.project(cam);if(Math.abs(v.x)>1.2||Math.abs(v.y)>1.2)continue;
    const sx=(v.x+1)/2*bw,sy=(v.y+1)/2*bh;v.set(p.x,h+30,p.y).project(cam);const r=Math.max(22,Math.hypot((v.x+1)/2*bw-sx,(v.y+1)/2*bh-sy)*1.75);
    U.uMen.value[nm++].set(sx,sy,dz-6,r);}
  U.uMenN.value=nm;
  // the soft ones, sorted
  const S=DDF.soft,M=DDF.softM,A=M.A.array,B=M.B.array,C=M.C.array,n=S.n;
  for(let i=0;i<n;i++){S.ord[i]=i;S.dep[i]=(S.x[i]-cp.x)*F.x+(S.y[i]-cp.y)*F.y+(S.z[i]-cp.z)*F.z;}
  if(n>1)S.ord.subarray(0,n).sort(DDF.sortCmp);
  for(let k=0;k<n;k++)ddFxPut(S,S.ord[k],k,A,B,C);
  ddFxSend(M,n);
  const G=DDF.glow,MG=DDF.glowM;for(let i=0;i<G.n;i++)ddFxPut(G,i,i,MG.A.array,MG.B.array,MG.C.array);ddFxSend(MG,G.n);
  const RG=DDF.rings,MR=DDF.ringM;
  for(let i=0;i<RG.n;i++){const q=RG.age[i]/RG.life[i],e=1-(1-q)*(1-q)*(1-q),o=i*4;MR.A.array[o]=RG.x[i];MR.A.array[o+1]=RG.y[i];MR.A.array[o+2]=RG.z[i];MR.A.array[o+3]=RG.s0[i]+(RG.s1[i]-RG.s0[i])*e;
    MR.B.array[o]=RG.c0[i*3];MR.B.array[o+1]=RG.c0[i*3+1];MR.B.array[o+2]=RG.c0[i*3+2];MR.B.array[o+3]=RG.a[i]*(1-q)*(1-q);}
  ddFxSend(MR,RG.n);
  // scorches: there at once under the plume, fading over the last third of their time
  const Z=DDF.scorch,MZ=DDF.scorchM;
  for(let i=0;i<Z.n;i++){const q=Z.age[i]/Z.life[i],o=i*4;MZ.A.array[o]=Z.x[i];MZ.A.array[o+1]=Z.y[i];MZ.A.array[o+2]=Z.z[i];MZ.A.array[o+3]=Z.s0[i]*(.75+.25*Math.min(1,Z.age[i]/.3));
    MZ.B.array[o]=Z.c0[i*3];MZ.B.array[o+1]=Z.c0[i*3+1];MZ.B.array[o+2]=Z.c0[i*3+2];MZ.B.array[o+3]=Z.a[i]*Math.min(1,Z.age[i]/Z.fin[i])*(q<.66?1:(1-q)/.34);
    MZ.C.array[o]=Z.rot[i];MZ.C.array[o+1]=Z.seed[i];}
  ddFxSend(MZ,Z.n);
  // tracers: the bolt's head runs from the gun to where the round goes in .08 s, its tail some way behind
  const K=DDF.streakM,KA=K.A.array,KB=K.B.array,KC=K.C.array,lim=DDFX.cap.streak[ddFxTier()];let ns=0;
  K.m.material.uniforms.uPx.value=2*Math.tan(cam.fov*Math.PI/360)/bh*3;
  for(const r of tracers){if(ns>=lim)break;const L=hyp(r.x2-r.x1,r.y2-r.y1);if(L<1)continue;
    const hd=Math.min(1,r.t/.08),tl=Math.max(0,hd-Math.min(.9,Math.max(28,L*.22)/L)),fade=r.t<.08?1:Math.max(0,1-(r.t-.08)/.04);if(fade<=0)continue;
    const h1=ddH(r.x1,r.y1)+12,h2=ddH(r.x2,r.y2)+10,o=ns*4,en=r.col&&r.col.charCodeAt(4)===49;   // ('255,140,100': theirs, a hotter orange-red)
    KA[o]=r.x1+(r.x2-r.x1)*tl;KA[o+1]=h1+(h2-h1)*tl;KA[o+2]=r.y1+(r.y2-r.y1)*tl;KA[o+3]=r.q?.6:1.2;
    KB[o]=r.x1+(r.x2-r.x1)*hd;KB[o+1]=h1+(h2-h1)*hd;KB[o+2]=r.y1+(r.y2-r.y1)*hd;KB[o+3]=fade*(r.q?.35:1);
    if(r.q){KC[o]=.55;KC[o+1]=.62;KC[o+2]=.7;}else if(en){KC[o]=1;KC[o+1]=.36;KC[o+2]=.16;}else{KC[o]=1;KC[o+1]=.74;KC[o+2]=.32;}ns++;}
  ddFxSend(K,ns);
  // clods
  const KK=DDF.clods,cl=DDF.clod,m4=DDF.m4,eu=DDF.e;
  for(let i=0;i<KK.n;i++){const q=KK.age[i]/KK.life[i],s=KK.s0[i]*(q<.75?1:Math.max(.01,1-(q-.75)/.25));eu.set(KK.c1[i*3],KK.c1[i*3+1],0);m4.makeRotationFromEuler(eu);m4.scale(DDF.v.set(s,s*.8,s));m4.setPosition(KK.x[i],KK.y[i]-(q>.75?(q-.75)*4*KK.s0[i]:0),KK.z[i]);cl.setMatrixAt(i,m4);
    DDF.v.set(KK.c0[i*3],KK.c0[i*3+1],KK.c0[i*3+2]);cl.instanceColor.setXYZ(i,ddFxLin(DDF.v.x),ddFxLin(DDF.v.y),ddFxLin(DDF.v.z));}
  cl.count=KK.n;if(KK.n){cl.instanceMatrix.needsUpdate=true;cl.instanceColor.needsUpdate=true;}
}
const ddFxLin=c=>c*c*.85;   // (a shown colour to light, near enough, a little darker: the clods are lit by the sun as well as the sky)
function ddFxPut(S,i,k,A,B,C){
  const q=S.age[i]/S.life[i],e=1-(1-q)*(1-q),o=k*4,j=i*3,fi=Math.min(1,S.age[i]/S.fin[i]),fo=1-q*q*(3-2*q);
  A[o]=S.x[i];A[o+1]=S.y[i];A[o+2]=S.z[i];A[o+3]=S.s0[i]+(S.s1[i]-S.s0[i])*e;
  B[o]=S.c0[j]+(S.c1[j]-S.c0[j])*q;B[o+1]=S.c0[j+1]+(S.c1[j+1]-S.c0[j+1])*q;B[o+2]=S.c0[j+2]+(S.c1[j+2]-S.c0[j+2])*q;B[o+3]=S.a[i]*fi*fo;
  C[o]=S.rot[i];C[o+1]=S.seed[i];C[o+2]=S.shape[i];C[o+3]=S.lit[i];
}
function ddFxSend(M,n){
  M.g.instanceCount=n;if(!n)return;
  for(const a of[M.A,M.B,M.C]){a.updateRange.offset=0;a.updateRange.count=n*4;a.needsUpdate=true;}
}

"use strict";
/* D-Day's look, Version 188: the light, the sky and the colour. ddLightBuild(sc) from dday.js's buildDDay (every chapter, after the scenery), ddLightFrame(rdt,now) from ddFrame
   every frame.
   Why it looked washed out (Version 187): the renderer's ACES curve at 1.2 (2x inside the curve) took every bright thing to a pale cream; the sky was the
   haze's colour times a mostly white picture; the haze sat over the whole battle; the soft light from the sky was nearly as strong as the sun, so shadows were
   faint; and every prop's colour was a hex read as light (#80 came out at 73% grey instead of 50%), so the scenery came out pale next to the men, whose
   colours were already right. Now: a tone curve of its own for daylight (DDL_TONE, read by scene.js's render; ddToneChunk), the props' colours taken back
   toward their painted values (ddLinSweep), a strong sun from the side against a softer, bluer sky light (dday.js's DD_SKY), the sun's shadow box fitted to
   what the camera sees and snapped to its texels (ddSunFrame), a sky of its own (ddDome: a gradient from the haze to blue, the sun's glow, a layer of cloud
   lit from the sun's side), haze only past the battle (the fog's near end follows the camera), smoke columns from the fighting further off (ddSmokeCols),
   cloud shadows drifting over the ground (ddCloudShade), and a daylight grade in post.js (DDL_GRADE). Each chapter has its own sky (DDL_MODE). */
const DDL={
  lin:.8,           // how far the scenery's colours go from "a hex read as light" to the hex as painted (1: all the way; ddLinMat)
  fogNear:1.25,fogMin:760,   // the haze starts this many times the camera's distance to the view's centre away, and never nearer than fogMin (the battle stays clear; in the ride, the beach and the bluffs)
  fogFar:3300,      // ...and is thickest this much further on (the far land and the sea's edge melt into the horizon)
  shadowMax:720,shadowMin:170,shadowStep:24,shadowReach:1150,shadowUp:520,   // the sun's shadow box: its half-size limits, the step it grows in, how far the camera's view is followed, how far above the ground casters can stand
  bias:-.0004,normalBias:.7,
  shade:.15         // how much the clouds' shadows darken the ground (0: none)
};
// each chapter's sky: how much cloud (0 clear .. 1 overcast), and how fast it drifts
const DDL_MODE={beach:{cloud:.6,wind:1},counter:{cloud:.46,wind:1.3},village:{cloud:.7,wind:.8}};
// the renderer for D-Day's frames (scene.js's render sets these, then puts the old ones back): a curve that stays straight to 60% and rolls the brightest
// channel off softly, the others scaled with it, so lit sand and faces keep their colour (ACES took them pale and yellow)
const DDL_TONE={map:null,exp:1.17};   // (map: three's CustomToneMapping, set with its curve by ddToneChunk)
// the daylight grade in post.js's last pass (tiers 1 and 2): black point, contrast, cooler shadows, warmer light, colour where it's dull
const DDL_GRADE={black:.02,con:.3,cold:.5,warm:.3,sat:1.22,vig:.2,grain:.01};
let ddToneDone=false;
function ddToneChunk(){
  if(ddToneDone)return;ddToneDone=true;DDL_TONE.map=T.CustomToneMapping;
  T.ShaderChunk.tonemapping_pars_fragment=T.ShaderChunk.tonemapping_pars_fragment.replace('vec3 CustomToneMapping( vec3 color ) { return color; }',
    `vec3 CustomToneMapping( vec3 color ) {
      color *= toneMappingExposure;
      float m = max( max( color.r, color.g ), color.b );
      float s = m < .6 ? m : .6 + .4 * ( 1. - exp( -( m - .6 ) / .4 ) );
      color *= s / max( m, 1e-5 );
      return mix( color, vec3( s ), smoothstep( .86, 1., s ) * .3 );
    }`);
}
/* ---------- the scenery's colours ---------- */
// a material's colour was picked as a hex and handed to the light as it is; taken DDL.lin of the way to the hex decoded to light, it comes out as picked
// (the men's materials already decode theirs: figure.js's figMaterial, left alone). Lit materials only: the glows, flashes, rings and the HUD keep theirs.
// A material whose colours are already light (decoded) says so with userData.ddKeep and is left alone.
const DDL_SEEN=new WeakSet();let _lc=null;
function ddLinCol(c){if(c){_lc=_lc||new T.Color();_lc.copy(c).convertSRGBToLinear();c.lerp(_lc,DDL.lin);}}
// Version 189: a copy of a material that's already been through the sweep (scene.js's seeThrough, ddground.js's fade give a building its own materials
// to fade): marked as seen, or the next sweep took its colour toward light a second time and roofs and trim went near-black for good
function ddLinClone(m){const c=m.clone();DDL_SEEN.add(c);return c;}
function ddLinMat(m){
  if(!m||DDL_SEEN.has(m))return;DDL_SEEN.add(m);
  if(!(m.isMeshStandardMaterial||m.isMeshLambertMaterial||m.isMeshPhongMaterial)||(m.userData&&(m.userData.U||m.userData.ddKeep)))return;
  ddLinCol(m.color);ddLinCol(m.emissive);
}
function ddLinSweep(root){
  _lc=_lc||new T.Color();
  root.traverse(o=>{
    if(o.material){if(Array.isArray(o.material))for(const m of o.material)ddLinMat(m);else ddLinMat(o.material);}
    if(o.isInstancedMesh&&o.instanceColor&&!DDL_SEEN.has(o)){DDL_SEEN.add(o);if(o.material&&o.material.userData&&o.material.userData.ddKeep)return;const a=o.instanceColor.array;for(let i=0;i<a.length;i+=3){_lc.setRGB(a[i],a[i+1],a[i+2]);ddLinCol(_lc);a[i]=_lc.r;a[i+1]=_lc.g;a[i+2]=_lc.b;}o.instanceColor.needsUpdate=true;}
  });
}
/* ---------- the sky ---------- */
// a picture of soft noise that tiles, made once and kept for every chapter: big rolling shapes in red, middling in green, fine in blue
// (value noise summed over octaves, each channel stretched to the full range). The clouds, the smoke and the clouds' shadows all read it.
let DDL_NT=null;
function ddNoiseTex(){
  if(DDL_NT)return DDL_NT;
  const N=256,D=new Uint8Array(N*N*4),r=rng(1906),F=new Float32Array(N*N);
  const fbm=(P0,oct,ch)=>{
    const L=[];for(let o=0;o<oct;o++){const P=P0<<o,a=new Float32Array(P*P);for(let i=0;i<a.length;i++)a[i]=r();L.push({P,a,w:Math.pow(.52,o)});}
    let lo=1e9,hi=-1e9;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){let v=0;
      for(const q of L){const P=q.P,a=q.a,fx=x*P/N,fy=y*P/N,ix=fx|0,iy=fy|0,tx=fx-ix,ty=fy-iy,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),x1=(ix+1)%P,y1=(iy+1)%P;
        v+=q.w*((a[iy*P+ix]*(1-sx)+a[iy*P+x1]*sx)*(1-sy)+(a[y1*P+ix]*(1-sx)+a[y1*P+x1]*sx)*sy);}
      F[y*N+x]=v;if(v<lo)lo=v;if(v>hi)hi=v;}
    for(let i=0;i<N*N;i++)D[i*4+ch]=Math.round((F[i]-lo)/(hi-lo)*255);};
  fbm(4,5,0);fbm(8,4,1);fbm(16,3,2);for(let i=3;i<D.length;i+=4)D[i]=255;
  const t=new T.DataTexture(D,N,N,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;
  return DDL_NT=t;
}
// the dome round the camera (dday.js makes it): drawn in the picture's own colours (no tone curve, like the fog it meets at the horizon): the haze low down,
// a deeper blue overhead, the sun's glow, and a layer of cloud drifting over, its billows lit on the side toward the sun and grey-blue underneath,
// thinning into the haze toward the horizon
function ddDome(){
  const d=DD.dome;if(!d)return;const P=DDL_MODE[DD_MODE]||DDL_MODE.beach;
  const U={uHor:{value:new T.Color(0xc8d2d8)},uZen:{value:new T.Color(0x7090b4)},uSun:{value:new T.Vector3(0,1,0)},uSunC:{value:new T.Color(0xfff0dc)},uTime:{value:0},uCloud:{value:P.cloud},uWind:{value:P.wind},tN:{value:ddNoiseTex()}};
  if(d.material)d.material.dispose();
  d.material=new T.ShaderMaterial({uniforms:U,side:T.BackSide,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:`uniform vec3 uHor,uZen,uSun,uSunC;uniform float uTime,uCloud,uWind;uniform sampler2D tN;varying vec3 vW;
      float cl(vec2 p){return texture2D(tN,p).r*.58+texture2D(tN,p*2.3+.31).g*.28+texture2D(tN,p*5.7+.67).b*.14;}
      void main(){
        vec3 d=normalize(vW-cameraPosition);float h=d.y,hh=max(h,0.),s=max(dot(d,uSun),0.);
        vec3 c=mix(uHor,uZen,1.-exp(-hh*4.2));                                                // the haze low down, blue overhead
        c=mix(c,uHor*1.04,exp(-hh*36.)*.55);                                                  // a pale band along the horizon
        c+=uSunC*(pow(s,6.)*.1+pow(s,48.)*.18);                                               // the sun's glow in the haze
        if(h>.005){
          vec2 p=d.xz/(h+.07)*.1+vec2(.0016,.0006)*uTime*uWind;                             // the cloud layer as a ceiling over the battle
          float n=cl(p),t0=.66-uCloud*.32,dn=smoothstep(t0,t0+.2,n)*smoothstep(.01,.2,h);
          float lit=clamp((n-cl(p+normalize(uSun.xz+1e-4)*.022))*7.+.5,0.,1.);               // thinner toward the sun: that side lit
          vec3 sh=mix(uZen,uHor,.5)*vec3(.74,.77,.82),cc=mix(sh,mix(vec3(.95,.94,.92),uSunC*.96,.3),lit);
          cc*=1.-smoothstep(.62,.95,n)*.22;                                                   // the thick hearts darker
          cc=mix(uHor*1.02,cc,smoothstep(.0,.3,h));                                           // far off, into the haze
          c=mix(c,cc,dn*.94);
          c+=uSunC*pow(s,24.)*.35*dn*(1.-lit*.5);}                                            // the sun lighting the cloud round it
        c+=uSunC*pow(s,900.)*.9*(1.-smoothstep(.0,.03,-h));                                   // the sun's disc, faint through the overcast
        c=mix(c,uHor*.97,smoothstep(.0,-.06,h));                                              // below the horizon: the haze
        gl_FragColor=vec4(c,1.);}`});
  d.frustumCulled=false;d.renderOrder=-10;DD.domeU=U;
}
// smoke from the fighting further off: one mesh of upright strips that turn to the camera (two to a column, for body), cut in ten so they can bend; the smoke
// climbing them in billows and spreading as it rises, bent over by the wind higher up; black and oily at the foot (flames there for some), dark grey
// above, lighter where it thins, lit on the sun's side, the haze over the far ones. Where they stand: off the play area (the map's x 200-1200 is the
// battle; these are behind the bluffs, inland and along the coast either side), so they never cover our men. [x, y, height, width at the foot, fire]
const DDL_COLS={
  beach:[[-260,-1350,560,100,1],[520,-1780,1000,170,0],[1320,-1520,720,110,1],[1980,-1180,440,90,0],[960,-1150,330,60,1],[180,-1050,300,54,0],
    [-720,650,360,70,1],[-1480,520,470,90,0],[2160,660,420,80,1],[2920,470,520,96,0],[-1100,2650,380,80,0],[2600,2300,300,64,1]],
  counter:[[-620,-1250,620,110,1],[2120,-950,560,100,0],[1450,-1500,700,120,0],[60,-1700,520,90,1],[320,1750,700,130,1],[1150,2150,820,150,0],[1900,1500,520,96,1],[-300,1900,460,84,0]],
  village:[[-720,-950,560,100,0],[2220,-1300,640,110,1],[1150,-1650,520,90,1],[480,2050,720,130,0],[1550,2350,820,150,1],[-500,1600,420,84,0]]};
const DDL_SEG=10;
function ddSmokeCols(sc){
  const L=DDL_COLS[DD_MODE]||DDL_COLS.beach,Q=[],r=rng(44);
  for(const[x,y,h,w,f]of L){const g=ddH(clamp(x,DDB.x0,DDB.x1),clamp(y,DDB.y0,DDB.y1));for(let k=0;k<2;k++)Q.push([x+(k-.5)*w*.3,g-2,y+(k-.5)*12,w*[1,.78][k],h*[1,.84][k],r(),k?0:f]);}
  const S=DDL_SEG+1,n=Q.length*S*2,P=new Float32Array(n*3),C=new Float32Array(n*2),Z=new Float32Array(n*4),I=[];
  Q.forEach(([x,g,y,w,h,sd,f],i)=>{for(let j=0;j<S;j++)for(let k=0;k<2;k++){const v=(i*S+j)*2+k;P.set([x,g,y],v*3);C.set([k?1:-1,j/DDL_SEG],v*2);Z.set([w,h,sd,f],v*4);}
    for(let j=0;j<DDL_SEG;j++){const b=(i*S+j)*2;I.push(b,b+1,b+3,b,b+3,b+2);}});
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('corner',new T.BufferAttribute(C,2));geo.setAttribute('sz',new T.BufferAttribute(Z,4));geo.setIndex(I);
  const U={uTime:{value:0},uHor:{value:new T.Color()},uSun:{value:new T.Vector3(0,1,0)},uFN:{value:1000},uFF:{value:5000},uWind:{value:new T.Vector3(-.42,0,.14)},tN:{value:ddNoiseTex()}};
  const m=new T.Mesh(geo,new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:false,
    vertexShader:`attribute vec2 corner;attribute vec4 sz;uniform vec3 uWind,uSun;uniform float uFN,uFF,uTime;varying vec2 vC;varying vec4 vZ;varying float vF,vL;
      void main(){vec3 B=position,tc=cameraPosition-B;vec3 rt=normalize(vec3(tc.z,0.,-tc.x));float y=corner.y,s=sz.z;
        float wd=sz.x*(.42+2.1*pow(y,.8));                                                        // spreading as it rises
        vec3 p=B+rt*corner.x*wd+vec3(0.,y*sz.y,0.)+uWind*(pow(y,1.8)*sz.y)+rt*sin(y*3.4+s*6.+uTime*.05)*sz.x*.22*y;   // bent by the wind higher up, a slow meander
        vec4 mv=viewMatrix*vec4(p,1.);vC=corner;vZ=sz;vF=smoothstep(uFN,uFF,-mv.z)*.85;vL=dot(rt,normalize(uSun));gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform sampler2D tN;uniform float uTime;uniform vec3 uHor;varying vec2 vC;varying vec4 vZ;varying float vF,vL;
      void main(){float y=vC.y,x=vC.x,s=vZ.z,wy=.42+2.1*pow(y,.8);
        vec2 q=vec2(x*wy*vZ.x/240.+s*7.3,(y*vZ.y-uTime*7.)/240.+s*3.1);                          // the smoke rising through its own billows, about the same size up and across
        float n=texture2D(tN,q).r*.5+texture2D(tN,q*2.2+.31).g*.32+texture2D(tN,q*4.6+.67).b*.18;
        float e=abs(x)+(.5-n)*1.25,a=1.-smoothstep(.3,.78,e);                                       // the edge eaten in and pushed out by the billows
        a*=smoothstep(.0,.05,y)*(1.-smoothstep(.5,1.,y+(.5-n)*.45))*mix(1.,.62,y);
        if(a<.01)discard;
        float tn=fract(s*7.13);vec3 md=mix(vec3(.2,.19,.18),vec3(.33,.3,.26),step(.62,tn)),tp=mix(vec3(.46,.45,.43),vec3(.6,.57,.52),step(.62,tn));   // most black and oily, some browner and paler (grass, timber)
        vec3 c=mix(vec3(.09,.08,.07),md,smoothstep(.02,.28,y));c=mix(c,tp,smoothstep(.28,.95,y));
        c*=.62+.7*n;                                                                                 // billows catching the light, the hollows dark
        c+=vec3(.13,.11,.08)*clamp(vL*x,0.,1.)*(.35+.65*y);                                        // the sun's side
        c+=vec3(1.,.42,.12)*vZ.w*(1.-smoothstep(.0,.07,y))*(1.-smoothstep(.15,.6,abs(x)))*(1.1+.35*sin(uTime*7.+s*40.)*sin(uTime*2.3+s*9.));   // flames at the foot, flickering
        c=mix(c,uHor,vF);a*=1.-vF*.4;gl_FragColor=vec4(c,a*.96);}`}));
  m.frustumCulled=false;sc.add(m);DD.cols={m,U};
}
// cloud shadows: big soft patches drifting slowly over the ground (the land's sheet drawn a second time over itself, multiplying it a little darker where the
// noise is thick; the men and the props are left as they are). Faded with the haze; not on the cheapest tier (POST.tier 0).
function ddCloudShade(sc){
  if(!DDL.shade)return;const L=[],bo=DD.bo||[],P=DDL_MODE[DD_MODE]||DDL_MODE.beach;sc.traverse(o=>{if(o.isMesh&&o.material&&(o.material.map===DD.tex||o.userData.ddLand)&&!bo.includes(o))L.push(o);});   // (the battle's own sheet only: the mirror copies either side are too far off to be worth a second pass)
  const U={tC:{value:ddNoiseTex()},uT:{value:0},uK:{value:DDL.shade*(.5+P.cloud)},uW:{value:P.wind},uFN:{value:1000},uFF:{value:5000}};
  const mat=new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:T.MultiplyBlending,fog:false,
    vertexShader:'varying vec3 vW;varying float vD;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:`uniform sampler2D tC;uniform float uT,uK,uW,uFN,uFF;varying vec3 vW;varying float vD;
      void main(){vec2 p=vW.xz*.0008+vec2(.0045,.0016)*uT*uW;float n=texture2D(tC,p).r*.7+texture2D(tC,p*2.2+.27).g*.3;
        float s=smoothstep(.46,.8,n)*uK*(1.-smoothstep(uFN,uFF,vD));gl_FragColor=vec4(vec3(1.-s),1.);}`});
  DD.shade={U,L:L.map(o=>{const m=new T.Mesh(o.geometry,mat);m.position.copy(o.position);m.rotation.copy(o.rotation);m.scale.copy(o.scale);m.renderOrder=-1;sc.add(m);return{m,o};})};
}
/* ---------- building it ---------- */
function ddLightBuild(sc){
  ddToneChunk();
  ddDome();ddSmokeCols(sc);ddCloudShade(sc);
  const s=DD.lights.moon.shadow;s.bias=DDL.bias;s.normalBias=DDL.normalBias;
  ddLinSweep(sc);DD.linT=0;
  ddSky(DD.dayShown>=0?DD.dayShown:DD.day||0);
}
// the sky's state from dday.js's ddSky, handed on to the dome and the smoke
function ddLightSky(S){
  const D=DD&&DD.domeU;if(D){D.uHor.value.copy(S.hor);D.uZen.value.copy(S.zen);D.uSun.value.copy(S.sun);D.uSunC.value.copy(S.sunC);}
  const C=DD&&DD.cols;if(C){C.U.uHor.value.copy(S.hor);C.U.uSun.value.copy(S.sun);}
}
/* ---------- every frame ---------- */
const DDL_CORN=[[-1.05,-1.05],[1.05,-1.05],[1.05,1.05],[-1.05,1.05],[0,-1.05],[0,1.05],[-1.05,0],[1.05,0],[0,0]];
let _sq=null;
// the sun: its direction from the sky (moved a quarter of a degree at a time, as each move redraws every shadow), its shadow box round what the camera sees,
// in the sun's own frame (the frame its shadow camera looks along: three's lookAt with the world's up), snapped to whole texels so the shadows don't crawl
function ddSunFrame(){
  const S=DD.sky,sun=DD.lights&&DD.lights.moon;if(!S||!sun)return;
  const Q=_sq||(_sq={L:new T.Vector3(0,1,0),r:new T.Vector3(),u:new T.Vector3(),f:new T.Vector3(),v:new T.Vector3(),p:new T.Vector3(),Y:new T.Vector3(0,1,0),key:''}),L=Q.L;if(L.dot(S.sun)<.99999)L.copy(S.sun);
  const r=Q.r.crossVectors(Q.Y,L).normalize(),u=Q.u.crossVectors(L,r),f=Q.f.copy(L).negate(),C=camera.position,g=gndH(camT.x,camT.z);
  let r0=1e9,r1=-1e9,u0=1e9,u1=-1e9,d0=1e9,d1=-1e9;
  for(const[sx,sy]of DDL_CORN){const v=Q.v.set(sx,sy,.5).unproject(camera).sub(C).normalize();let t=DDL.shadowReach;if(v.y<-1e-3){const tg=(g-C.y)/v.y;if(tg>0&&tg<t)t=tg;}
    const p=Q.p.copy(C).addScaledVector(v,t),a=p.dot(r),b=p.dot(u),c=p.dot(f);if(a<r0)r0=a;if(a>r1)r1=a;if(b<u0)u0=b;if(b>u1)u1=b;if(c<d0)d0=c;if(c>d1)d1=c;}
  const st=DDL.shadowStep,cl=x=>Math.ceil(clamp(x,DDL.shadowMin,DDL.shadowMax)/st)*st,hx=cl((r1-r0)/2+30),hy=cl((u1-u0)/2+30);
  const ms=sun.shadow.mapSize,tx=2*hx/ms.x,ty=2*hy/ms.y,cr=Math.round((r0+r1)/2/tx)*tx,cu=Math.round((u0+u1)/2/ty)*ty;
  const dn=Math.floor((d0-DDL.shadowUp)/50)*50,df=Math.ceil((d1+80)/50)*50;
  sun.position.set(0,0,0).addScaledVector(r,cr).addScaledVector(u,cu).addScaledVector(f,dn);sun.target.position.copy(sun.position).addScaledVector(f,100);
  const key=hx+','+hy+','+(df-dn),c=sun.shadow.camera;
  if(key!==Q.key){Q.key=key;c.left=-hx;c.right=hx;c.top=hy;c.bottom=-hy;c.near=1;c.far=df-dn+1;c.updateProjectionMatrix();}
}
function ddLightFrame(rdt,now){
  if(!DD||!DD.lights)return;
  ddSunFrame();
  // the haze: none over the battle, thicker past it (the camera's distance to the ground at the view's centre)
  const fog=DD.scene.fog;if(fog&&fog.isFog){const C=camera.position,dv=Math.hypot(C.x-camT.x,C.y-gndH(camT.x,camT.z),C.z-camT.z),near=Math.max(DDL.fogMin,Math.min(1700,dv)*DDL.fogNear);fog.near=near;fog.far=near+DDL.fogFar;
    const K=DD.cols;if(K){K.U.uFN.value=near;K.U.uFF.value=near+DDL.fogFar;}}
  if(DD.dome)DD.dome.position.copy(camera.position);
  if(DD.domeU)DD.domeU.uTime.value=now;
  if(DD.cols)DD.cols.U.uTime.value=now;
  const H=DD.shade;if(H){H.U.uT.value=now;if(fog&&fog.isFog){H.U.uFN.value=fog.near;H.U.uFF.value=fog.far;}for(const q of H.L)q.m.visible=q.o.visible&&POST.tier>0;}
  // anything new in the scene (a wreck's charred paint, the first-person gun...) gets its colours like the rest, twice a second (a sweep is about 0.6 ms)
  if((DD.linT-=rdt)<=0){DD.linT=.5;ddLinSweep(DD.scene);}
}

"use strict";
/* D-Day's look, Version 188: the light, the sky and the colour. ddLightBuild(sc) from dday.js's buildDDay (every chapter, after the scenery), ddLightFrame(rdt,now) from ddFrame
   every frame.
   Why it looked washed out (Version 187): the renderer's ACES curve at 1.2 (2x inside the curve) took every bright thing to a pale cream; the sky was the
   haze's colour times a mostly white picture; the haze sat over the whole battle; the soft light from the sky was nearly as strong as the sun, so shadows were
   faint; and every prop's colour was a hex read as light (#80 came out at 73% grey instead of 50%), so the scenery came out pale next to the men, whose
   colours were already right. Now: a tone curve of its own for daylight (DDL_TONE, read by scene.js's render; ddToneChunk), the props' colours taken back
   toward their painted values (ddLinSweep), a stronger sun from the side against a softer sky (dday.js's DD_SKY), the sun's shadow box fitted to what the
   camera sees and snapped to its texels (ddSunFrame), a sky of its own (ddDome: a gradient from the haze to blue, the sun's glow, a layer of cloud), haze
   only past the battle (the fog's near end follows the camera), smoke columns on the horizon (ddSmokeCols), and a daylight grade in post.js (DDL_GRADE). */
const DDL={
  lin:.8,           // how far the scenery's colours go from "a hex read as light" to the hex as painted (1: all the way; ddLinMat)
  fogNear:1.25,fogMin:760,   // the haze starts this many times the camera's distance to the view's centre away, and never nearer than fogMin (the battle stays clear; in the ride, the beach and the bluffs)
  fogFar:4300,      // ...and is thickest this much further on (the far land and the sea's edge melt into the horizon)
  shadowMax:720,shadowMin:170,shadowStep:24,shadowReach:1150,shadowUp:520,   // the sun's shadow box: its half-size limits, the step it grows in, how far the camera's view is followed, how far above the ground casters can stand
  bias:-.0004,normalBias:.7,
  cloud:.62,        // the cloud cover in the sky (0 clear .. 1)
  shade:.2          // how much the clouds' shadows darken the ground (0: none)
};
// the renderer for D-Day's frames (scene.js's render sets these, then puts the old ones back): a curve that stays straight to 60% and rolls the brightest
// channel off softly, the others scaled with it, so lit sand and faces keep their colour (ACES took them pale and yellow)
const DDL_TONE={map:null,exp:1.1};   // (map: three's CustomToneMapping, set with its curve by ddToneChunk)
// the daylight grade in post.js's last pass (tiers 1 and 2): black point, contrast, cooler shadows, warmer light, colour where it's dull
const DDL_GRADE={black:.02,con:.18,cold:.5,warm:.3,sat:1.14,vig:.2,grain:.01};
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
const DDL_SEEN=new WeakSet();let _lc=null;
function ddLinCol(c){if(c){_lc=_lc||new T.Color();_lc.copy(c).convertSRGBToLinear();c.lerp(_lc,DDL.lin);}}
function ddLinMat(m){
  if(!m||DDL_SEEN.has(m))return;DDL_SEEN.add(m);
  if(!(m.isMeshStandardMaterial||m.isMeshLambertMaterial||m.isMeshPhongMaterial)||(m.userData&&m.userData.U))return;
  ddLinCol(m.color);ddLinCol(m.emissive);
}
function ddLinSweep(root){
  root.traverse(o=>{
    if(o.material){if(Array.isArray(o.material))for(const m of o.material)ddLinMat(m);else ddLinMat(o.material);}
    if(o.isInstancedMesh&&o.instanceColor&&!DDL_SEEN.has(o)){DDL_SEEN.add(o);const a=o.instanceColor.array;for(let i=0;i<a.length;i+=3){_lc.setRGB(a[i],a[i+1],a[i+2]);ddLinCol(_lc);a[i]=_lc.r;a[i+1]=_lc.g;a[i+2]=_lc.b;}o.instanceColor.needsUpdate=true;}
  });
}
/* ---------- the sky ---------- */
// a cloud layer's picture: big soft blobs in red, smaller ones in green, wrapping round at the edges so it tiles
function ddCloudTex(){
  const t=canvasTex(256,256,(q,w,h)=>{const r=rng(1906);q.fillStyle='#000';q.fillRect(0,0,w,h);q.globalCompositeOperation='lighter';
    for(const[ch,n,r0,r1,a]of[['255,0,0',70,16,46,.26],['0,255,0',220,5,16,.3]])for(let i=0;i<n;i++){const x=r()*w,y=r()*h,rad=r0+r()*(r1-r0);
      for(const ox of[-w,0,w])for(const oy of[-h,0,h]){const X=x+ox,Y=y+oy;if(X+rad<0||X-rad>w||Y+rad<0||Y-rad>h)continue;const g=q.createRadialGradient(X,Y,0,X,Y,rad);g.addColorStop(0,`rgba(${ch},${a})`);g.addColorStop(1,`rgba(${ch},0)`);q.fillStyle=g;q.fillRect(X-rad,Y-rad,rad*2,rad*2);}}});
  t.encoding=T.LinearEncoding;return t;
}
// the dome round the camera (dday.js makes it): drawn in the picture's own colours (no tone curve, like the fog it meets at the horizon): the haze low down,
// a deeper blue overhead, the sun's glow through the overcast, and a layer of cloud drifting, lit on the side toward the sun
function ddDome(){
  const d=DD.dome;if(!d)return;
  const U={uHor:{value:new T.Color(0xc8d2d8)},uZen:{value:new T.Color(0x7090b4)},uSun:{value:new T.Vector3(0,1,0)},uSunC:{value:new T.Color(0xfff0dc)},uTime:{value:0},uCloud:{value:DDL.cloud},tCloud:{value:DD.cloudT}};
  if(d.material)d.material.dispose();
  d.material=new T.ShaderMaterial({uniforms:U,side:T.BackSide,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:`uniform vec3 uHor,uZen,uSun,uSunC;uniform float uTime,uCloud;uniform sampler2D tCloud;varying vec3 vW;
      void main(){
        vec3 d=normalize(vW-cameraPosition);float h=d.y,s=max(dot(d,uSun),0.);
        vec3 c=mix(uHor,uZen,pow(clamp(h,0.,1.),.6));
        c=mix(c,uHor*.96,smoothstep(.0,-.08,h));                                              // below the horizon: the haze
        if(h>0.){vec2 p=d.xz/(h+.1)*.16+vec2(uTime*.0012,uTime*.0005);p.x*=.6;
          float n=texture2D(tCloud,p).r*.9+texture2D(tCloud,p*2.7+.31).g*.55;
          float cl=smoothstep(.22,.62,n)*uCloud*smoothstep(.0,.16,h);
          vec3 cc=mix(uHor*1.04,vec3(1.,.99,.97),.35+.35*s);cc*=.84+.16*smoothstep(.3,.9,n);  // the tops lit, the undersides greyer
          c=mix(c,cc,cl);}
        c+=uSunC*(pow(s,5.)*.16+pow(s,40.)*.22+pow(s,600.)*.6)*smoothstep(-.05,.12,h);       // the sun's glow through the cloud
        gl_FragColor=vec4(c,1.);}`});
  d.frustumCulled=false;d.renderOrder=-10;DD.domeU=U;
}
// smoke from the fighting further off, on the horizon: one mesh of upright quads that turn to the camera (three to a column, for body), the smoke climbing
// them and spreading as it rises, bent over by the wind higher up; black and oily at the foot, grey as it thins, lit on the sun's side, the haze over the
// far ones. Where they stand: well off the map, so they never cover our men. [x, y, height, width at the foot]
const DDL_COLS={
  beach:[[-260,-1350,720,140],[520,-1780,860,170],[1320,-1520,660,130],[1980,-1180,560,110],[-720,650,360,80],[-1480,520,470,96],[2160,660,420,84],[2920,470,520,100],[-1100,2650,380,90],[2600,2300,300,70]],
  counter:[[-620,-1250,620,120],[2120,-950,560,110],[320,1750,700,140],[1150,2150,820,160],[1900,1500,520,100],[-300,1900,460,90]],
  village:[[-720,-950,560,110],[2220,-1300,640,120],[480,2050,720,140],[1550,2350,820,160],[-500,1600,420,90]]};
function ddSmokeCols(sc){
  const L=DDL_COLS[DD_MODE]||DDL_COLS.beach,Q=[],r=rng(44);
  for(const[x,y,h,w]of L){const g=ddH(clamp(x,DDB.x0,DDB.x1),clamp(y,DDB.y0,DDB.y1));for(let k=0;k<3;k++)Q.push([x+(k-1)*w*.28,g-2,y+(k-1)*9,w*[1,.82,.7][k],h*[1,.86,.74][k],r()]);}
  const n=Q.length,P=new Float32Array(n*12),C=new Float32Array(n*8),S=new Float32Array(n*12),I=[];
  Q.forEach(([x,g,y,w,h,sd],i)=>{[[-1,0],[1,0],[1,1],[-1,1]].forEach(([cx,cy],k)=>{const j=i*4+k;P.set([x,g,y],j*3);C.set([cx,cy],j*2);S.set([w,h,sd],j*3);});const b=i*4;I.push(b,b+1,b+2,b,b+2,b+3);});
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('corner',new T.BufferAttribute(C,2));geo.setAttribute('sz',new T.BufferAttribute(S,3));geo.setIndex(I);
  const U={uTime:{value:0},uHor:{value:new T.Color()},uSun:{value:new T.Vector3(0,1,0)},uFN:{value:1000},uFF:{value:5000},uWind:{value:new T.Vector3(-.5,0,.16)},tN:{value:DD.cloudT}};
  const m=new T.Mesh(geo,new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:false,
    vertexShader:`attribute vec2 corner;attribute vec3 sz;uniform vec3 uWind,uSun;uniform float uFN,uFF,uTime;varying vec2 vC;varying float vS,vF,vL;
      void main(){vec3 B=position,tc=cameraPosition-B;vec3 rt=normalize(vec3(tc.z,0.,-tc.x));float y=corner.y,s=sz.z;
        float wd=sz.x*(.5+1.9*pow(y,.85));                                                         // spreading as it rises
        vec3 p=B+rt*corner.x*wd+vec3(0.,y*sz.y,0.)+uWind*(pow(y,1.7)*sz.y)+rt*sin(y*3.+s*6.+uTime*.05)*sz.x*.18;   // bent by the wind higher up, a slow meander
        vec4 mv=viewMatrix*vec4(p,1.);vC=corner;vS=s;vF=smoothstep(uFN,uFF,-mv.z)*.85;vL=dot(rt,uSun);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform sampler2D tN;uniform float uTime;uniform vec3 uHor;varying vec2 vC;varying float vS,vF,vL;
      void main(){float y=vC.y;
        float n=texture2D(tN,vec2(vC.x*.16+vS*7.,y*.5-uTime*.012+vS*3.)).r*.75+texture2D(tN,vec2(vC.x*.3+vS*5.,y*1.05-uTime*.03)).r*.5+texture2D(tN,vec2(vC.x*.5+vS*9.,y*2.1-uTime*.05)).g*.3-.08;   // billows climbing, big and small
        float d=abs(vC.x)+(.55-n)*.75,a=(1.-smoothstep(.3,.95,d))*smoothstep(0.,.04,y)*(1.-smoothstep(.5,1.,y))*mix(.95,.55,y);
        vec3 c=mix(vec3(.11,.1,.09),vec3(.42,.41,.4),smoothstep(0.,.6,y));c=mix(c,vec3(.62,.61,.6),smoothstep(.55,1.,y)*.6);
        c*=.8+.35*n+.22*vL*vC.x;                                                                  // the sun's side lighter
        c=mix(c,uHor,vF);a*=1.-vF*.45;if(a<.01)discard;gl_FragColor=vec4(c,a);}`}));
  m.frustumCulled=false;sc.add(m);DD.cols={m,U};
}
// cloud shadows: big soft patches drifting slowly over the ground (the land's sheet drawn a second time over itself, multiplying it a little darker where
// the cloud picture is thick; the men and the props are left as they are). Faded with the haze; not on the cheapest tier (POST.tier 0).
function ddCloudShade(sc){
  if(!DDL.shade)return;const L=[];sc.traverse(o=>{if(o.isMesh&&o.material&&o.material.map===DD.tex)L.push(o);});
  const U={tC:{value:DD.cloudT},uT:{value:0},uK:{value:DDL.shade},uFN:{value:1000},uFF:{value:5000}};
  const mat=new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:T.MultiplyBlending,fog:false,
    vertexShader:'varying vec3 vW;varying float vD;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:`uniform sampler2D tC;uniform float uT,uK,uFN,uFF;varying vec3 vW;varying float vD;
      void main(){vec2 p=vW.xz*.0006+vec2(.0045,.0016)*uT;float n=texture2D(tC,p).r*.95+texture2D(tC,p*2.2+.27).g*.35;
        float s=smoothstep(.3,.68,n)*uK*(1.-smoothstep(uFN,uFF,vD));gl_FragColor=vec4(vec3(1.-s),1.);}`});
  DD.shade={U,L:L.map(o=>{const m=new T.Mesh(o.geometry,mat);m.position.copy(o.position);m.rotation.copy(o.rotation);m.scale.copy(o.scale);m.renderOrder=-1;sc.add(m);return{m,o};})};
}
/* ---------- building it ---------- */
function ddLightBuild(sc){
  ddToneChunk();
  DD.cloudT=ddCloudTex();
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
  // anything new in the scene (a wreck's charred paint, the first-person gun...) gets its colours like the rest, four times a second
  if((DD.linT-=rdt)<=0){DD.linT=.25;ddLinSweep(DD.scene);}
}

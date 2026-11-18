"use strict";
/* D-Day's look, Version 188: the sea and the shore. ddSeaBuild(sc) from dday.js's buildDDay (every chapter, after the scenery), ddSeaFrame(rdt,now,dt) from ddFrame
   every frame.
   Until Version 187 the sea was a flat turquoise sheet with a painted texture sliding over it and a strip of foam that slid to and fro at the waterline.
   Now (the beach only; the other chapters have no sea):
   - one sheet of water (ddSeaMesh, one draw call): a long swell rolling in from the Channel, slowing, steepening and breaking over the shallows, with chop
     over it out at sea (the waves' heights in its vertices, so the ride in rises and falls over them; ddSeaY works out the same surface in JS for the boats);
     its colour from the depth of water over the sand (pale green over the sand, grey-green out deep: the land's own heights, in an attribute), the sky's colours in
     it at a glancing look, the sun's glint, whitewater behind each breaker and whitecaps out on the swell, the swash running up the sand and back, the darker
     wet band it leaves, a line of foam at the top of each run-up, foam round the stakes in the surf (ddSeaObMask), and the haze (the scene's fog) over the far
     water, so it melts into the sky at the horizon. It lies on the sand above the waterline as far as the swash reaches, for the wet band.
   - the landing craft ride the swell (ddplay.js's ddBoatPose asks ddSeaRide; the side beaches' craft too), each with a wake (ddSeaWakes: foam pushed up at its
     ramp and along its sides, the V of its bow wave spreading behind, the churned water of its screw; one instanced draw for every boat) and spray off its bow,
     a sheet of it over the ramp when it meets a crest (ddSeaBow).
   - splashes (dday.js's ddSplash): white columns of spray that rise, hang and fall back, a crown of water round the foot, mist, and a ring of foam where they
     came up; bullets' splashes are thin spouts (ddSeaSplash; one instanced draw of camera-facing puffs for all of them, ddSeaPuffs).
   Cheap on a phone: about 15,000 vertices of water, three draws (the water, the wakes, the spray), textures made once and kept; the second layer of fine
   ripples and the obstacles' foam are left out on the cheapest tier (POST.tier 0). */
const DSEA={
  level:.2,        // the sea's mean height (the land's sheet meets it at y 702: the shoreline)
  shore:702,
  Tb:6.4,          // seconds between one breaker and the next
  amp:1.3,         // the long swell's height out at sea, either side of the mean (map units, about 10 cm each)
  run0:20,run1:12, // how far the swash runs up the sand past the shoreline: so far, plus up to this much more along the beach (and each set .75 to 1.15 of it)
  north:664,       // the sheet starts here on the sand (the swash never reaches past about 672)...
  far:6600,        // ...and runs out to here (into the haze long before)
  heave:.75,       // how much of the swell's rise and fall the landing craft take (the first-person view rides with them: kept gentle)
  boatY:1.0,       // a landing craft's hull this far over the water at rest (as before: 1.2 over the old flat sea at .2)
  puffs:420        // the most spray puffs at once
};
// the waves, the same in the shaders and here: the long swell's phase in cycles (dsS: how far a crest has come in from 900, slowing as the water shoals;
// dsOff: the crests' line wanders along the beach), its height (steepening over the shallows, falling away once broken), and three trains of chop
const DSEA_GLSL=`uniform float uT,uTb,uAmp,uLv;
const float PI2=6.2831853;
float dsOff(float x){return .1*sin(x*.0045)+.06*sin(x*.0123+1.3)+.03*sin(x*.031+.4);}
float dsS(float z){float w=min(900.-z,198.);return w<0.?w*.0037037:w*(.0037037+2.576e-5*w);}
float dsU(float x,float z){return fract(uT/uTb+dsOff(x)-dsS(z));}
float dsLong(float x,float z){float u=dsU(x,z),p=.5+.5*cos(PI2*u),m=mix(1.,4.5,1.-smoothstep(760.,880.,z));
  float A=uAmp*mix(1.,1.35,1.-smoothstep(800.,900.,z))*mix(.12,1.,smoothstep(702.,790.,z));return A*(pow(p,m)-.3);}
float dsChop(float x,float z){return smoothstep(705.,820.,z)*(.55*sin(dot(vec2(x,z),vec2(-.2873,-.9578))*.04189-2.026*uT+1.)+.32*sin(dot(vec2(x,z),vec2(.4472,-.8944))*.0714-2.645*uT+2.)+.16*sin(dot(vec2(x,z),vec2(-.8575,-.5145))*.1337-3.62*uT+4.));}
float dsSea(float x,float z){return uLv+dsLong(x,z)+dsChop(x,z);}
`;
const dsRand=rng(4188);   // (the spray's own dice: the game's Math.random is left as it was, so a seeded test plays the same battle)
const dsSS=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);},dsFr=x=>x-Math.floor(x);
const dsOff=x=>.1*Math.sin(x*.0045)+.06*Math.sin(x*.0123+1.3)+.03*Math.sin(x*.031+.4);
const dsS=z=>{const w=Math.min(900-z,198);return w<0?w*.0037037:w*(.0037037+2.576e-5*w);};
const dsU=(x,z,t)=>dsFr(t/DSEA.Tb+dsOff(x)-dsS(z));
function dsLong(x,z,t){const u=dsU(x,z,t),p=.5+.5*Math.cos(TAU*u),m=1+3.5*(1-dsSS(760,880,z)),A=DSEA.amp*(1+.35*(1-dsSS(800,900,z)))*(.12+.88*dsSS(702,790,z));return A*(Math.pow(p,m)-.3);}
function dsChop(x,z,t){return dsSS(705,820,z)*(.55*Math.sin((-.2873*x-.9578*z)*.04189-2.026*t+1)+.32*Math.sin((.4472*x-.8944*z)*.0714-2.645*t+2)+.16*Math.sin((-.8575*x-.5145*z)*.1337-3.62*t+4));}
// the sea's surface at (x, map y) now: what the boats ride
function ddSeaY(x,z,t){t=t??ddSeaT();return DSEA.level+dsLong(x,z,t)+dsChop(x,z,t);}
const ddSeaT=()=>simT%600;   // (the waves' clock: game time, so they slow with the game; wrapped every ten minutes to keep the shaders' sums precise)
// a landing craft on the swell: its height from the water under its middle, bow, stern and sides; pitched and rolled with the water's slope
const _dsr={y:0,rx:0,rz:0};
function ddSeaRide(b,x,z){
  if(!DD||!DD.seaU)return null;x=x??b.x;z=z??b.y;const t=ddSeaT();
  const c=ddSeaY(x,z,t),f=ddSeaY(x,z-44,t),s=ddSeaY(x,z+44,t),l=ddSeaY(x-15,z,t),r=ddSeaY(x+15,z,t),m=(c*2+f+s+l+r)/6;
  _dsr.y=DSEA.level+DSEA.boatY+(m-DSEA.level)*DSEA.heave;_dsr.rx=Math.atan((f-s)/88)*.8;_dsr.rz=Math.atan((r-l)/30)*.7+Math.sin(t*1.3+x)*.012;return _dsr;
}
/* ---------- the textures, made once ---------- */
const DSEA_TX={};
// fine ripples: a tiling height of two dozen little waves, as a normal map (red and green: its slope across and along)
function dsRippleTex(){
  if(DSEA_TX.n)return DSEA_TX.n;
  const N=128,D=new Uint8Array(N*N*4),r=rng(188),W=[];
  for(let i=0;i<26;i++){let kx=0,ky=0;while(!kx&&!ky){kx=Math.round((r()-.5)*18);ky=Math.round((r()-.5)*18);}const k=Math.hypot(kx,ky);W.push([kx,ky,r()*TAU,Math.pow(k,-1.25)]);}
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){let dx=0,dy=0;const u=x/N,v=y/N;for(const[kx,ky,p,a]of W){const c=Math.cos(TAU*(kx*u+ky*v)+p)*a*TAU;dx+=c*kx;dy+=c*ky;}
    const k=(y*N+x)*4;D[k]=clamp(128+dx*2.2,0,255);D[k+1]=clamp(128+dy*2.2,0,255);D[k+2]=255;D[k+3]=255;}
  const t=new T.DataTexture(D,N,N,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;
  return DSEA_TX.n=t;
}
// foam: red a lace of bubbles (the edges of cells, two sizes, over a little noise), green soft blobs (where the lather gathers); both tile
function dsFoamTex(){
  if(DSEA_TX.f)return DSEA_TX.f;
  const N=128,D=new Uint8Array(N*N*4),r=rng(1806);
  const cells=G=>{const P=[];for(let i=0;i<G*G;i++)P.push([r(),r()]);return(x,y)=>{const gx=x*G,gy=y*G,ix=Math.floor(gx),iy=Math.floor(gy);let f1=9,f2=9;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=ix+i,cy=iy+j,q=P[((cy%G+G)%G)*G+((cx%G+G)%G)],d=Math.hypot(cx+q[0]-gx,cy+q[1]-gy);if(d<f1){f2=f1;f1=d;}else if(d<f2)f2=d;}return f2-f1;};};
  const c1=cells(7),c2=cells(15),g=new Float32Array(64);for(let i=0;i<64;i++)g[i]=r();
  const vn=(x,y)=>{const G=8,gx=x*G,gy=y*G,ix=Math.floor(gx),iy=Math.floor(gy),tx=gx-ix,ty=gy-iy,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),v=(i,j)=>g[((j%G+G)%G)*G+((i%G+G)%G)];return(v(ix,iy)*(1-sx)+v(ix+1,iy)*sx)*(1-sy)+(v(ix,iy+1)*(1-sx)+v(ix+1,iy+1)*sx)*sy;};
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=x/N,v=y/N,l=Math.max(1-dsSS(0,.16,c1(u,v)),.8*(1-dsSS(0,.14,c2(u,v))));
    const k=(y*N+x)*4;D[k]=clamp((l*.72+vn(u*2,v*2)*.28)*255,0,255);D[k+1]=clamp((vn(u,v)*.65+vn(u*2+.5,v*2+.3)*.35)*255,0,255);D[k+2]=0;D[k+3]=255;}
  const t=new T.DataTexture(D,N,N,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;
  return DSEA_TX.f=t;
}
// the spray's puffs: a soft billow (left half) and a broken ring of foam (right half), white with the shape in alpha
function dsPuffTex(){
  if(DSEA_TX.p)return DSEA_TX.p;
  const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d'),r=rng(77);
  for(let i=0;i<16;i++){const a=r()*TAU,d=i?r()*15:0,x=32+Math.cos(a)*d,y=32+Math.sin(a)*d,rr=i?7+r()*9:18,gr=g.createRadialGradient(x,y,0,x,y,rr);
    gr.addColorStop(0,`rgba(255,255,255,${i?.5:.75})`);gr.addColorStop(.6,`rgba(255,255,255,${i?.25:.4})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rr,0,TAU);g.fill();}
  g.lineCap='round';for(let i=0;i<46;i++){const a=r()*TAU,l=.1+r()*.35,rr=20+r()*7;g.strokeStyle=`rgba(255,255,255,${.35+r()*.5})`;g.lineWidth=1.5+r()*4;g.beginPath();g.arc(96,32,rr,a,a+l);g.stroke();}
  for(let i=0;i<70;i++){const a=r()*TAU,d=10+r()*20;g.fillStyle=`rgba(255,255,255,${.2+r()*.4})`;g.beginPath();g.arc(96+Math.cos(a)*d,32+Math.sin(a)*d,.8+r()*2,0,TAU);g.fill();}
  const t=new T.CanvasTexture(c);t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;return DSEA_TX.p=t;
}
// foam round what stands in the surf (the stakes in their rows, the hedgehogs nearest the water): a map of the band x -1400..2800, y 690..800, a point
// every two units, white round each one, read by the water where it's there
function ddSeaObMask(sc){
  if(DSEA_TX.ob)return DSEA_TX.ob;
  const c=document.createElement('canvas');c.width=2100;c.height=55;const g=c.getContext('2d'),P=[],M=new T.Matrix4(),v=new T.Vector3();
  sc.updateMatrixWorld(true);
  sc.traverse(o=>{if(!o.isInstancedMesh)return;const p=o.geometry&&o.geometry.parameters;if(!p||p.height!==15||p.radiusTop!==.9)return;   // (the stakes: ddlook.js's ddDress, in the land's props and their mirror copies)
    for(let i=0;i<o.count;i++){o.getMatrixAt(i,M);M.premultiply(o.matrixWorld);v.setFromMatrixPosition(M);if(v.z>692&&v.z<798)P.push([v.x,v.z,5.5]);}});
  for(const o of DD.objs)if(o.kind==='ddhog'){const x=o.x+o.w/2,y=o.y+o.h/2;for(const mx of[x,-x,2*DDB.x1-x])if(y>650)P.push([mx,y,11]);}
  for(const[x,y,rr]of P){const px=(x+1400)/2,py=(y-690)/2,gr=g.createRadialGradient(px,py,rr*.15,px,py,rr);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.5,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(px,py,rr,0,TAU);g.fill();
    g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(px,py-rr*.7,rr*.45,rr*.9,0,0,TAU);g.fill();}   // (and a streak toward the beach: the waves wrapping round it)
  const t=new T.CanvasTexture(c);t.minFilter=T.LinearFilter;t.generateMipmaps=false;return DSEA_TX.ob=t;
}
/* ---------- the water ---------- */
// colours as they should come out on screen (hex), taken to light before the tone curve (DDL_TONE.exp)
const dsLin=(hex,out)=>{out=out||new T.Color();out.setHex(hex).convertSRGBToLinear();return out.multiplyScalar(1/((typeof DDL_TONE!=='undefined'&&DDL_TONE.exp)||1));};
const DSEA_COL={shal:0x84d0b6,mid:0x2f8a7c,deep:0x285a50,foam:0xf3f5f1,wet:0x3b3024};
function dsCommonU(){
  return{uT:{value:0},uTb:{value:DSEA.Tb},uAmp:{value:DSEA.amp},uLv:{value:DSEA.level},uLit:{value:new T.Color(1,1,1)},uSunD:{value:new T.Vector3(0,1,0)},uSunC:{value:new T.Color(1,1,1)},
    uHor:{value:new T.Color()},uZen:{value:new T.Color()},uFoam:{value:dsLin(DSEA_COL.foam)},tF:{value:dsFoamTex()},uTier:{value:2}};
}
const DSEA_FRAG_END=`#include <tonemapping_fragment>
  #include <encodings_fragment>
  #include <fog_fragment>`;
function ddSeaMesh(sc){
  // the grid: fine near the beach (20 apart across it over the play area and its edges, 6 apart up and down over the shallows), coarser out to sea and far to the sides
  const xs=[],zs=[];
  for(let x=-3800;x<-1500;x+=300)xs.push(x);for(let x=-1500;x<-200;x+=50)xs.push(x);for(let x=-200;x<1600;x+=20)xs.push(x);for(let x=1600;x<2900;x+=50)xs.push(x);for(let x=2900;x<=5200;x+=300)xs.push(x);
  for(let z=DSEA.north;z<910;z+=6)zs.push(z);for(let z=910;z<1100;z+=12)zs.push(z);for(let z=1100;z<1500;z+=25)zs.push(z);for(let z=1500,s=40;z<DSEA.far;z+=s,s*=1.22)zs.push(z);zs.push(DSEA.far);
  const nx=xs.length,nz=zs.length,P=new Float32Array(nx*nz*3),G=new Float32Array(nx*nz),I=[];
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,x=xs[i],z=zs[j];P[k*3]=x;P[k*3+1]=DSEA.level;P[k*3+2]=z;
    G[k]=x<-DDB.x1||x>2*DDB.x1||z>DDB.y1?-20:Math.max(-20,ddHm(x,z));}   // (the land's height under it: the play area and its mirror copies either side; the sea bed beyond)
  for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;I.push(a,c,b,b,c,d);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('gh',new T.BufferAttribute(G,1));geo.setIndex(I);
  const U=Object.assign(T.UniformsUtils.merge([T.UniformsLib.fog]),dsCommonU(),{tN:{value:dsRippleTex()},tOb:{value:ddSeaObMask(sc)},uShal:{value:dsLin(DSEA_COL.shal)},uMid:{value:dsLin(DSEA_COL.mid)},
    uDeep:{value:dsLin(DSEA_COL.deep)},uWet:{value:dsLin(DSEA_COL.wet)},uRun:{value:new T.Vector2(DSEA.run0,DSEA.run1)}});
  const mat=new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:true,fog:true,
    vertexShader:`attribute float gh;varying vec3 vW;varying float vG;
      #include <fog_pars_vertex>
      ${DSEA_GLSL}
      void main(){vec3 p=position;p.y=max(gh+.3,dsSea(p.x,p.z));vW=p;vG=gh;   // (on the sand, above the water: lying on it, for the swash and the wet band)
        vec4 mvPosition=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform vec3 uLit,uSunD,uSunC,uHor,uZen,uFoam,uShal,uMid,uDeep,uWet;uniform vec2 uRun;uniform sampler2D tN,tF,tOb;uniform float uTier;
      varying vec3 vW;varying float vG;
      #include <fog_pars_fragment>
      ${DSEA_GLSL}
      float dsHash(float n){return fract(sin(n*12.9898)*43758.5453);}
      void main(){
        float x=vW.x,z=vW.z,t=uT;
        // the surface: its height and slope (the swell's along the way it runs, the chop's exactly), and the fine ripples over it
        float L=dsLong(x,z),Lz=(dsLong(x,z+1.5)-L)/1.5,kc=smoothstep(705.,820.,z),h=uLv+L+dsChop(x,z);
        float c2=.55*.04189*cos(dot(vec2(x,z),vec2(-.2873,-.9578))*.04189-2.026*t+1.),c3=.32*.0714*cos(dot(vec2(x,z),vec2(.4472,-.8944))*.0714-2.645*t+2.),c4=.16*.1337*cos(dot(vec2(x,z),vec2(-.8575,-.5145))*.1337-3.62*t+4.);
        vec2 g=vec2(kc*(-.2873*c2+.4472*c3-.8575*c4)*2.6,Lz*3.+kc*(-.9578*c2-.8944*c3-.5145*c4)*2.6);   // (the slopes made steeper for the shading than for the shape: the swell reads from high up)
        vec2 nd=(texture2D(tN,vW.xz/97.+t*vec2(.011,-.032)).xy-.5)*.55;
        if(uTier>.5)nd+=(texture2D(tN,vW.xz/37.+t*vec2(-.024,-.051)).xy-.5)*.4;
        vec3 n=normalize(vec3(-g.x+nd.x,1.,-g.y+nd.y)),V=normalize(cameraPosition-vW);
        // the swash: each breaker's water running up the sand past the shoreline and back (v: how far through it), this set's reach and the last one's
        float q=t/uTb+dsOff(x)-1.7232,v=fract(q),cyc=floor(q),Rb=uRun.x+uRun.y*(.5+.5*sin(x*.0071+.8)*cos(x*.0029+.3)),Rc=Rb*(.75+.4*dsHash(cyc)),Rp=Rb*(.75+.4*dsHash(cyc-1.));
        float zf=v<.32?702.-Rc*sin(v/.32*1.5708):702.-Rc*(1.-smoothstep(.32,.9,v)),e=z-zf,w=702.-z;
        float sw=z<714.?clamp(e*.045,0.,1.2)*(v<.32?1.:mix(1.,.45,smoothstep(.32,.9,v))):0.;
        float d=max(h-vG,sw);   // how deep the water is here
        // the sand the water has just left: dark and glossy, drying in a few seconds; a band the swash keeps damp
        float wet=0.;
        if(z<714.){float vd=.32+.58*(1.-w/Rc),dry=w<Rc&&v>.32?(v-vd)*uTb:w<Rp?(v+1.-(.32+.58*(1.-w/Rp)))*uTb:99.;
          wet=max((smoothstep(702.-Rb*1.15-5.,702.-Rb*.35,z))*.55,exp(-max(dry,0.)/2.6));}
        // foam: whitewater behind each breaking crest and lather between them, whitecaps on the swell further out, the swash's leading edge and its lather,
        // a line left at the top of the run-up, foam round the stakes
        float u=dsU(x,z),lace=texture2D(tF,vW.xz/34.+t*vec2(.004,.012)).r,blob=texture2D(tF,vW.xz/150.+t*vec2(-.003,.007)).g;
        float brk=(1.-smoothstep(778.,812.+14.*sin(x*.0061+2.),z))*smoothstep(698.,712.,z);
        float fa=brk*(exp(-u*8.)*1.3+.3*blob);
        fa+=smoothstep(.72,1.,pow(.5+.5*cos(PI2*u),2.))*smoothstep(.5,.8,blob)*smoothstep(800.,860.,z)*.95;
        fa+=smoothstep(.62,.9,blob*texture2D(tF,vW.xz/61.+t*vec2(.013,-.02)).g)*smoothstep(830.,900.,z)*.7;
        if(z<716.&&e>0.)fa+=(v<.32?exp(-e/4.)*1.2:exp(-e/2.)*.6)+.28*smoothstep(0.,.6,sw)*blob*2.;
        float top=exp(-pow((z-702.+Rc)/1.7,2.))*(v>.32?exp(-(v-.32)*uTb/2.2):0.);
        if(uTier>.5&&z>690.&&z<800.&&x>-1400.&&x<2800.)fa+=texture2D(tOb,vec2((x+1400.)/4200.,(z-690.)/110.)).r*(.35+.65*exp(-u*6.))*smoothstep(.2,1.,d);
        float fo=clamp((lace-(1.-fa))*2.6,0.,1.)*min(1.,fa*1.5)+clamp((lace-(1.-top))*2.,0.,1.)*top*.8;
        // put together, from the sand up: the wet sand, the water's body, the sky and the sun in it, the foam
        vec3 C=vec3(0.);float A=0.;
        vec3 R=reflect(-V,n);R.y=abs(R.y);vec3 sky=mix(uHor,uZen,1.-exp(-R.y*4.2));float nv=max(dot(n,V),0.),Fr=(.04+.96*pow(1.-nv,5.))*.62;   // (less of the pale sky than the real thing: the water keeps its colour)
        float wa=wet*(1.-smoothstep(0.,.2,d));if(wa>0.){C=uWet*uLit*wa*.42+sky*Fr*wa*.5;A=wa*.42;}
        float ab=1.-exp(-d*.55);
        vec3 body=mix(uShal,uMid,smoothstep(.5,4.,d));body=mix(body,uDeep,smoothstep(4.,15.,d));
        body*=uLit*(.7+.6*clamp(dot(n,uSunD),-1.,1.));body+=uShal*uLit*.32*smoothstep(.15,1.,L/uAmp)*smoothstep(4.,10.,d);   // (lit on the faces toward the sun, the crests paler where they're thin)
        C=body*ab+C*(1.-ab);A=ab+A*(1.-ab);
        float F=Fr*smoothstep(0.,.3,d);C=sky*F+C*(1.-F);A=F+A*(1.-F);
        float sp=max(dot(R,uSunD),0.);C+=uSunC*(pow(sp,300.)*2.5+pow(sp,36.)*.05)*smoothstep(0.,.4,d)*A;
        vec3 fc=uFoam*uLit*(.84+.22*clamp(dot(n,uSunD),0.,1.));C=fc*fo+C*(1.-fo);A=fo+A*(1.-fo);
        if(A<.003)discard;
        gl_FragColor=vec4(C/A,A);
        ${DSEA_FRAG_END}
      }`});
  const m=new T.Mesh(geo,mat);m.frustumCulled=false;m.renderOrder=-.5;sc.add(m);   // (drawn before the other see-through things, after the clouds' shadows on the land)
  return{m,U};
}
/* ---------- the boats' wakes ---------- */
// one strip of water round and behind each landing craft (in the craft's own frame: across it, and along it from in front of the ramp to far astern),
// drawn instanced for all of them: the foam its flat ramp shoves ahead, the collar along its sides, the V of its bow wave and the churn of its screw;
// all of them with its speed, a collar alone when it lies still
const DSEA_WK=16;
function ddSeaWakes(sc,base){
  const g=new T.InstancedBufferGeometry(),xs=[],zs=[];for(let i=0;i<=12;i++)xs.push(-140+i*280/12);for(let j=0;j<=22;j++)zs.push(-72+460*Math.pow(j/22,1.6));
  const P=[],I=[];for(const z of zs)for(const x of xs)P.push(x,0,z);for(let j=0;j<zs.length-1;j++)for(let i=0;i<xs.length-1;i++){const a=j*xs.length+i,b=a+1,c=a+xs.length,d=c+1;I.push(a,c,b,b,c,d);}
  g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setIndex(I);
  const iA=new T.InstancedBufferAttribute(new Float32Array(DSEA_WK*4),4),iB=new T.InstancedBufferAttribute(new Float32Array(DSEA_WK*4),4);iA.setUsage(T.DynamicDrawUsage);iB.setUsage(T.DynamicDrawUsage);
  g.setAttribute('iA',iA);g.setAttribute('iB',iB);g.instanceCount=0;
  const U=Object.assign(T.UniformsUtils.merge([T.UniformsLib.fog]),base);
  const mat=new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,
    vertexShader:`attribute vec4 iA,iB;varying vec2 vL;varying vec4 vA;varying vec3 vW;varying float vK;
      #include <fog_pars_vertex>
      ${DSEA_GLSL}
      void main(){vec2 l=position.xz;vec3 p=vec3(iA.x+l.x,0.,iA.y+l.y*iB.x);p.y=dsSea(p.x,p.z)+.3;vL=l;vA=iA;vW=p;vK=iB.y;
        vec4 mvPosition=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform vec3 uLit,uFoam,uSunD;uniform sampler2D tF;varying vec2 vL;varying vec4 vA;varying vec3 vW;varying float vK;
      #include <fog_pars_fragment>
      uniform float uT;
      void main(){
        float lx=abs(vL.x),lz=vL.y,sp=vA.z,cl=vA.w,a=lz+45.;
        float dr=length(max(vec2(lx,abs(lz))-vec2(17.,53.),0.));
        float fa=exp(-dr/(2.5+sp*5.))*(cl*.7+sp*.9);                                                    // the collar along its sides
        fa+=step(lz,-53.)*exp((lz+53.)/(4.+sp*12.))*sp*1.3*(1.-smoothstep(13.,22.,lx));                  // shoved ahead of the ramp
        fa+=step(0.,a)*exp(-abs(lx-17.-a*.36)/(2.2+a*.035))*sp*exp(-a/240.)*1.1;                        // the V of the bow wave
        float c=1.-smoothstep(7.+max(lz-53.,0.)*.06,13.+max(lz-53.,0.)*.13,lx);fa+=step(53.,lz)*c*sp*exp(-(lz-53.)/170.)*1.2;   // the screw's churn
        float lace=texture2D(tF,vW.xz/26.+uT*vec2(.006,.01)).r,fo=clamp((lace-(1.-fa))*2.4,0.,1.)*min(1.,fa*1.4)*vK;
        float tint=clamp(fa*.5,0.,.45)*vK;                                                                // stirred-up water, paler under the foam
        vec3 C=uFoam*uLit*vec3(.62,.8,.78)*tint;float A=tint;C=uFoam*uLit*fo+C*(1.-fo);A=fo+A*(1.-fo);
        if(A<.004)discard;gl_FragColor=vec4(C/A,A);
        ${DSEA_FRAG_END}
      }`});
  const m=new T.Mesh(g,mat);m.frustumCulled=false;m.renderOrder=-.4;sc.add(m);
  return{m,g,iA,iB,st:new WeakMap()};
}
/* ---------- spray: splashes, the bows' spray ---------- */
// one pool of puffs, drawn as one instanced mesh of squares that face the camera (or lie flat on the water: the rings of foam); each puff flies, falls and
// fades, drawn out along the way it's going when it's going fast (streaks of spray), round when it hangs
function ddSeaPuffs(sc,base){
  const N=DSEA.puffs,g=new T.InstancedBufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));g.setIndex([0,1,2,0,2,3]);
  const at=()=>{const a=new T.InstancedBufferAttribute(new Float32Array(N*4),4);a.setUsage(T.DynamicDrawUsage);return a;},iP=at(),iC=at(),iV=at();
  g.setAttribute('iP',iP);g.setAttribute('iC',iC);g.setAttribute('iV',iV);g.instanceCount=0;
  const U=Object.assign(T.UniformsUtils.merge([T.UniformsLib.fog]),{uLit:base.uLit,uFoam:base.uFoam,uSunD:base.uSunD,tP:{value:dsPuffTex()}});
  const mat=new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:true,
    vertexShader:`attribute vec4 iP,iC,iV;varying vec2 vU;varying vec4 vC;varying float vS;
      #include <fog_pars_vertex>
      void main(){vec2 c=position.xy;float s=iP.w,r=iC.z;vec2 cr=vec2(c.x*cos(r)-c.y*sin(r),c.x*sin(r)+c.y*cos(r));vec4 mvPosition;
        if(iC.y>.5)mvPosition=viewMatrix*vec4(iP.xyz+vec3(cr.x,0.,cr.y)*s,1.);
        else{mvPosition=viewMatrix*vec4(iP.xyz,1.);vec2 vv=(viewMatrix*vec4(iV.xyz,0.)).xy;float L=length(vv)*iV.w;
          if(L>.15){vec2 d=normalize(vv);cr=d*c.y*(1.+L)+vec2(-d.y,d.x)*c.x;}mvPosition.xy+=cr*s;}
        vU=vec2((c.x*.5+.5)*.5+iC.y*.5,c.y*.5+.5);vS=cr.y*.5+.5;vC=iC;gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform vec3 uLit,uFoam;uniform sampler2D tP;varying vec2 vU;varying vec4 vC;varying float vS;
      #include <fog_pars_fragment>
      void main(){float a=texture2D(tP,vU).a*vC.x;if(a<.01)discard;
        gl_FragColor=vec4(uFoam*uLit*mix(.74,1.,clamp(vS,0.,1.))*vC.w,a);
        ${DSEA_FRAG_END}
      }`});
  const m=new T.Mesh(g,mat);m.frustumCulled=false;sc.add(m);
  const F=k=>new Float32Array(N*k);
  return{m,g,iP,iC,iV,n:0,N,p:F(3),v:F(3),s:F(2),l:F(2),k:F(6)};   // (p position, v velocity, s size and its growth, l life and age, k: flat, spin, shade, how much it falls, how solid, how much it streaks)
}
// a puff: where, its velocity, size and how fast it grows, how long it lasts; o: flat (lying on the water), shade (1 white .. darker), fall (1: as spray
// does), a (how solid), st (how much it's drawn out along its way)
const DSEA_PO={};
function dsPuff(x,y,z,vx,vy,vz,s,gr,life,o){
  const P=DD&&DD.seaP;if(!P)return;o=o||DSEA_PO;let i=P.n;if(i>=P.N){i=(dsRand()*P.N)|0;}else P.n++;   // (full: one at random makes way)
  P.p[i*3]=x;P.p[i*3+1]=y;P.p[i*3+2]=z;P.v[i*3]=vx;P.v[i*3+1]=vy;P.v[i*3+2]=vz;P.s[i*2]=s;P.s[i*2+1]=gr;P.l[i*2]=life;P.l[i*2+1]=0;
  const k=P.k,j=i*6;k[j]=o.flat?1:0;k[j+1]=dsRand()*TAU;k[j+2]=o.shade??1;k[j+3]=o.fall??1;k[j+4]=o.a??.85;k[j+5]=o.st??0;
}
// water thrown up where a shell or a bullet hits the sea (dday.js's ddSplash hands it here): s about .35-.6 for a bullet, 1.5-2.6 for a shell
const DSEA_SPL={col:{st:.012},drop:{st:.022,shade:1,a:.95},crown:{st:.007,shade:.9},mist:{fall:.05,shade:.88,a:.38},ring:{flat:1,a:.75},ring2:{flat:1,a:.55,shade:.95},spout:{st:.016,a:.9}};
function ddSeaSplash(x,y,s=1){
  if(!DD||!DD.seaP)return;const R=dsRand,h=ddSeaY(x,y),O=DSEA_SPL;
  if(s>1){const k=Math.sqrt(s/2);
    for(let i=0;i<14+s*5;i++){const a=R()*TAU,o=R()*3.5*s;O.col.shade=.88+R()*.12;dsPuff(x+Math.cos(a)*o,h+2,y+Math.sin(a)*o,(R()-.5)*18*s,(130+R()*100)*k,(R()-.5)*18*s,(1.8+R()*2.2)*s,3*s,1.6+R()*.8,O.col);}   // the column
    for(let i=0;i<12;i++){const a=R()*TAU,sp=30+R()*45;dsPuff(x,h+3+R()*20*s,y,Math.cos(a)*sp,(80+R()*90)*k,Math.sin(a)*sp,(.7+R()*.7)*Math.sqrt(s),0,1+R()*.6,O.drop);}   // drops flung out of it
    for(let i=0;i<9;i++){const a=i/9*TAU+R()*.4,sp=(40+R()*40)*k;dsPuff(x,h+3,y,Math.cos(a)*sp,30+R()*45,Math.sin(a)*sp,(3+R()*3)*s,5*s,1+R()*.6,O.crown);}   // the crown round its foot
    for(let i=0;i<2;i++)dsPuff(x+(R()-.5)*8*s,h+16*s+i*22*s,y+(R()-.5)*8*s,(R()-.5)*6,10+R()*8,(R()-.5)*6,9*s,8*s,2.6+R(),O.mist);   // mist hanging after it
    dsPuff(x,h+.4,y,0,0,0,6*s,15*s,4.5,O.ring);dsPuff(x,h+.3,y,0,0,0,4*s,8*s,3.2,O.ring2);}   // the rings of foam it leaves
  else{for(let i=0;i<3;i++)dsPuff(x+(R()-.5)*2,h+1,y+(R()-.5)*2,(R()-.5)*6,60+R()*60,(R()-.5)*6,1+R(),1.5,.55+R()*.35,O.spout);
    for(let i=0;i<3;i++){const a=R()*TAU;dsPuff(x,h+2,y,Math.cos(a)*25,40+R()*50,Math.sin(a)*25,.5+R()*.4,0,.5+R()*.3,O.drop);}
    dsPuff(x,h+.3,y,0,0,0,2.2,7,1.3,O.ring2);}
}
function dsPuffsTick(dt){
  const P=DD.seaP;if(!P)return;const{p,v,s,l,k}=P,ap=P.iP.array,ac=P.iC.array,av=P.iV.array;let i=0;
  while(i<P.n){
    l[i*2+1]+=dt;const life=l[i*2],age=l[i*2+1],j=i*6;
    if(age>=life||(k[j]<.5&&v[i*3+1]<0&&p[i*3+1]<DSEA.level-2)){const e=--P.n;if(e!==i){for(let q=0;q<3;q++){p[i*3+q]=p[e*3+q];v[i*3+q]=v[e*3+q];}for(let q=0;q<6;q++)k[j+q]=k[e*6+q];s[i*2]=s[e*2];s[i*2+1]=s[e*2+1];l[i*2]=l[e*2];l[i*2+1]=l[e*2+1];}continue;}
    if(k[j]<.5){const dr=Math.max(0,1-dt*1.6);v[i*3]*=dr;v[i*3+2]*=dr;v[i*3+1]-=150*k[j+3]*dt;}
    p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;s[i*2]+=s[i*2+1]*dt;
    const q=age/life,a=Math.min(1,age/.08)*(q<.55?1:1-(q-.55)/.45);
    ap[i*4]=p[i*3];ap[i*4+1]=p[i*3+1];ap[i*4+2]=p[i*3+2];ap[i*4+3]=s[i*2];ac[i*4]=a*k[j+4];ac[i*4+1]=k[j];ac[i*4+2]=k[j+1];ac[i*4+3]=k[j+2];
    av[i*4]=v[i*3];av[i*4+1]=v[i*3+1];av[i*4+2]=v[i*3+2];av[i*4+3]=k[j+5];
    i++;}
  P.g.instanceCount=P.n;P.iP.needsUpdate=true;P.iC.needsUpdate=true;P.iV.needsUpdate=true;
}
/* ---------- the boats on it ---------- */
// every frame: each landing craft's wake from how fast it's going (worked out here from where it was), spray off its bow, a sheet of it over the ramp when it
// meets a crest; the side beaches' craft ride the swell too
const DSEA_BOW={side:{st:.012,shade:.95},ramp:{st:.01,shade:.97,a:.9}};
function ddSeaBow(dt){
  const W=DD.seaW;if(!W)return;let n=0;const a=W.iA.array,b=W.iB.array,C=camera.position,R=dsRand;
  const add=(x,z,sp,cl,dir,k)=>{if(n>=DSEA_WK)return;a[n*4]=x;a[n*4+1]=z;a[n*4+2]=sp;a[n*4+3]=cl;b[n*4]=dir;b[n*4+1]=k;n++;};
  for(const bt of(typeof dd!=='undefined'&&dd&&dd.boats)||[]){
    if(bt.st==='sunk'||!bt.m)continue;let s=W.st.get(bt);if(!s){s={z:bt.y,v:0,u:0};W.st.set(bt,s);}
    const z=bt.st==='back'?bt.m.position.z:bt.y;if(dt>0){const vz=(z-s.z)/dt;s.v+=(vz-s.v)*Math.min(1,dt*6);}s.z=z;
    const sp=clamp(Math.abs(s.v)/70,0,1),dir=s.v>4?-1:1;add(bt.x,z,sp,.75,dir,1);
    if(sp<.18||dt<=0||hyp(bt.x-C.x,z-C.z)>1300)continue;
    const by=bt.m.position.y,bz=z-52*dir,u=dsU(bt.x,bz,ddSeaT());
    s.e=(s.e||0)+dt*30*sp;while(s.e>1){s.e--;const sd=R()<.5?-1:1;dsPuff(bt.x+sd*(13+R()*5),by+1.5,bz+R()*6*dir,sd*(25+R()*35)*sp,(35+R()*55)*sp,s.v*.45+(R()-.5)*10,1.4+R()*2,4,.5+R()*.4,DSEA_BOW.side);}
    if(Math.abs(u-s.u)>.5&&sp>.3)for(let i=0;i<14;i++){const ox=(R()-.5)*30;dsPuff(bt.x+ox,by+6+R()*4,bz-4*dir,ox*.8,(70+R()*70)*sp,s.v*.3-dir*(10+R()*25),2+R()*3,6,.8+R()*.6,DSEA_BOW.ramp);}   // a crest meeting the ramp: a sheet of spray over it
    s.u=u;}
  for(const sb of DD.sideBoats||[]){const m=sb.m,r=ddSeaRide(null,m.position.x,m.position.z);if(!r)continue;m.position.y=r.y;m.rotation.x=r.rx;m.rotation.z=r.rz;add(m.position.x,m.position.z,0,.9,1,1);}
  W.g.instanceCount=n;W.iA.needsUpdate=true;W.iB.needsUpdate=true;
}
/* ---------- building it, and every frame ---------- */
function ddSeaBuild(sc){
  if(DD_MODE!=='beach')return;   // (the counterattack and the village have no sea)
  const S=ddSeaMesh(sc);DD.sea=S.m;DD.seaU=S.U;(DD.bo=DD.bo||[]).push(S.m);
  const base={uT:S.U.uT,uTb:S.U.uTb,uAmp:S.U.uAmp,uLv:S.U.uLv,uLit:S.U.uLit,uFoam:S.U.uFoam,uSunD:S.U.uSunD,tF:S.U.tF};   // (shared: one update moves them all)
  DD.seaW=ddSeaWakes(sc,base);DD.seaP=ddSeaPuffs(sc,base);
  const L=DD.lights;DD.seaL0=L?dsLight(L,new T.Color()):null;ddSeaFrame(0,0,0);
}
// the light falling on the water: the sky's and the sun's, as it is now (the evening dims and warms the sea)
function dsLight(L,out){const S=DD.sky;out.copy(L.hemi.color).multiplyScalar(L.hemi.userData.base??L.hemi.intensity);const k=Math.max(.05,S?S.sun.y:.5)*L.moon.intensity;out.r+=L.moon.color.r*k;out.g+=L.moon.color.g*k;out.b+=L.moon.color.b*k;return out;}
let _dsL=null;
function ddSeaFrame(rdt,now,dt){
  if(!DD||!DD.seaU)return;const U=DD.seaU,S=DD.sky,L=DD.lights;
  U.uT.value=ddSeaT();U.uTier.value=typeof POST!=='undefined'?POST.tier:2;
  if(S){U.uSunD.value.copy(S.sun);U.uSunC.value.copy(S.sunC).multiplyScalar(L?L.moon.intensity:1);dsLinOf(S.hor,U.uHor.value);dsLinOf(S.zen,U.uZen.value);}
  if(L&&DD.seaL0){_dsL=dsLight(L,_dsL||new T.Color());U.uLit.value.setRGB(_dsL.r/DD.seaL0.r,_dsL.g/DD.seaL0.g,_dsL.b/DD.seaL0.b);}
  ddSeaBow(dt);dsPuffsTick(dt);
  if(DD.seaP)DD.seaP.m.position.set(camT.x,0,camT.z);   // (only for sorting the see-through things: the puffs are placed in the world by their own positions)
}
// the sky's colours (as shown on screen) taken back to light, so the water shows them when it reflects the sky
function dsLinOf(c,out){out.copy(c).convertSRGBToLinear();return out.multiplyScalar(1/((typeof DDL_TONE!=='undefined'&&DDL_TONE.exp)||1));}

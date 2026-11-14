"use strict";
/* Post-processing (the graphics pass; Bryan: "how close to Dark Descent graphics can you get us?"). The scene is drawn into an
   off-screen picture first; then bright things (lamps, the team strobes, torch beams, fires) bleed light into the dark around
   them (bloom), and the picture gets a colour grade (cold shadows, warm lights, a gentle S-curve), a vignette and a little film
   grain. three.js r128 has no post-processing built in, so this is a small pipeline of its own: the scene pass (with 4x
   anti-aliasing where WebGL2 has it), a bright pass and a blur at a quarter of the size (and an eighth for a wider glow), and
   one final pass to the screen. All of it works on the picture as shown (sRGB), which keeps 8-bit buffers free of banding.
   Quality tiers (POST.tier): 2 everything, 1 one bloom level (phones start here), 0 none (straight to the screen, as before).
   A phone that can't keep up steps down by itself (postWatch, from the frame loop); key G cycles the tiers on a keyboard. */
const POST={tier:2,ok:false,rt:null,b1:null,b2:null,c1:null,c2:null,scene:null,cam:null,quad:null,M:{},w:0,h:0,acc:0,n:0,t:0,slow:0,manual:false};
const POST_VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
function postInit(){
  try{
    POST.cam=new T.OrthographicCamera(-1,1,1,-1,0,1);POST.scene=new T.Scene();
    POST.quad=new T.Mesh(new T.PlaneGeometry(2,2));POST.quad.frustumCulled=false;POST.scene.add(POST.quad);
    const mk=(fs,u)=>new T.ShaderMaterial({uniforms:u,vertexShader:POST_VS,fragmentShader:fs,depthTest:false,depthWrite:false});
    // the bright pass: a 4x4 average (four bilinear taps) of what's brighter than the threshold, with a soft knee
    POST.M.bright=mk(`uniform sampler2D tSrc;uniform vec2 px;uniform float thr;varying vec2 vUv;
      vec3 s(vec2 o){return texture2D(tSrc,vUv+o*px).rgb;}
      void main(){vec3 c=(s(vec2(-1.,-1.))+s(vec2(1.,-1.))+s(vec2(-1.,1.))+s(vec2(1.,1.)))*.25;
        float l=max(c.r,max(c.g,c.b)),k=clamp((l-thr)/(1.-thr),0.,1.);gl_FragColor=vec4(c*k*k,1.);}`,
      {tSrc:{value:null},px:{value:new T.Vector2()},thr:{value:.54}});
    // a 9-tap Gaussian in five bilinear taps, one direction at a time
    POST.M.blur=mk(`uniform sampler2D tSrc;uniform vec2 dir;varying vec2 vUv;
      void main(){vec3 c=texture2D(tSrc,vUv).rgb*.2270;
        c+=(texture2D(tSrc,vUv+dir*1.3846).rgb+texture2D(tSrc,vUv-dir*1.3846).rgb)*.3162;
        c+=(texture2D(tSrc,vUv+dir*3.2308).rgb+texture2D(tSrc,vUv-dir*3.2308).rgb)*.0703;gl_FragColor=vec4(c,1.);}`,
      {tSrc:{value:null},dir:{value:new T.Vector2()}});
    POST.M.down=mk(`uniform sampler2D tSrc;uniform vec2 px;varying vec2 vUv;
      void main(){gl_FragColor=vec4((texture2D(tSrc,vUv-px).rgb+texture2D(tSrc,vUv+px).rgb+texture2D(tSrc,vUv+vec2(px.x,-px.y)).rgb+texture2D(tSrc,vUv+vec2(-px.x,px.y)).rgb)*.25,1.);}`,
      {tSrc:{value:null},px:{value:new T.Vector2()}});
    POST.M.final=mk(`uniform sampler2D tScene,tB1,tB2;uniform float bloom1,bloom2,time,grain,vig,sat,cold;uniform vec2 res;varying vec2 vUv;
      float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      void main(){
        vec3 c=texture2D(tScene,vUv).rgb+texture2D(tB1,vUv).rgb*bloom1+texture2D(tB2,vUv).rgb*bloom2;
        float l=dot(c,vec3(.299,.587,.114));
        c=mix(c,c*vec3(.88,1.0,1.08)+vec3(0.,.006,.012),(1.-smoothstep(0.,.42,l))*cold);   // cold shadows
        c=mix(c,c*vec3(1.08,1.0,.88),smoothstep(.3,1.,l)*.65)*1.05;                     // warm lights, a little brighter overall
        c=clamp(mix(vec3(l),c,sat),0.,1.);c=mix(c,c*c*(3.-2.*c),.22);                  // a touch more colour and contrast
        c=c*.975+vec3(.006,.011,.016);                                                  // blacks lifted a little, toward blue-green
        vec2 q=vUv-.5;c*=1.-vig*dot(q,q)*1.6;                                            // vignette
        c+=(h(floor(vUv*res)+fract(time*7.31)*vec2(91.7,47.3))-.5)*grain;              // film grain
        gl_FragColor=vec4(c,1.);}`,
      {tScene:{value:null},tB1:{value:null},tB2:{value:null},bloom1:{value:1.0},bloom2:{value:.65},time:{value:0},grain:{value:.03},vig:{value:.42},sat:{value:1.08},cold:{value:.55},res:{value:new T.Vector2()}});
    POST.ok=true;
  }catch(e){POST.ok=false;}
  POST.tier=matchMedia('(pointer:coarse)').matches?1:2;
  try{const q=new URLSearchParams(location.search).get('gfx');if(q!=null&&/^[012]$/.test(q)){POST.tier=+q;POST.manual=true;}}catch(e){}
}
// the off-screen pictures, at the drawing buffer's size (from resize)
function postSize(){
  if(!POST.ok)return;const v=renderer.getDrawingBufferSize(new T.Vector2()),w=Math.max(1,v.x|0),h=Math.max(1,v.y|0);
  if(w===POST.w&&h===POST.h&&POST.rt)return;POST.w=w;POST.h=h;
  for(const k of['rt','b1','b2','c1','c2'])if(POST[k]){POST[k].dispose();POST[k]=null;}
  const lin={minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat,stencilBuffer:false};
  POST.rt=renderer.capabilities.isWebGL2?new T.WebGLMultisampleRenderTarget(w,h,Object.assign({depthBuffer:true},lin)):new T.WebGLRenderTarget(w,h,Object.assign({depthBuffer:true},lin));
  POST.rt.texture.encoding=T.sRGBEncoding;   // (the scene writes what the screen would show)
  const q=d=>new T.WebGLRenderTarget(Math.max(1,(w/d)|0),Math.max(1,(h/d)|0),Object.assign({depthBuffer:false},lin));
  POST.b1=q(4);POST.b2=q(4);POST.c1=q(8);POST.c2=q(8);
}
function postRender(sc,cam){
  if(!POST.ok||POST.tier===0||!POST.rt){renderer.setRenderTarget(null);renderer.render(sc,cam);return;}
  const M=POST.M,Q=POST.quad,pass=(mat,dst)=>{Q.material=mat;renderer.setRenderTarget(dst);renderer.render(POST.scene,POST.cam);};
  renderer.setRenderTarget(POST.rt);renderer.render(sc,cam);
  M.bright.uniforms.thr.value=MAPID==='dd'?.86:.54;
  M.bright.uniforms.tSrc.value=POST.rt.texture;M.bright.uniforms.px.value.set(1/POST.w,1/POST.h);pass(M.bright,POST.b1);
  const B=M.blur.uniforms,bw=POST.b1.width,bh=POST.b1.height;
  B.tSrc.value=POST.b1.texture;B.dir.value.set(1/bw,0);pass(M.blur,POST.b2);
  B.tSrc.value=POST.b2.texture;B.dir.value.set(0,1/bh);pass(M.blur,POST.b1);
  const wide=POST.tier>=2;
  if(wide){
    M.down.uniforms.tSrc.value=POST.b1.texture;M.down.uniforms.px.value.set(.5/bw,.5/bh);pass(M.down,POST.c1);
    const cw2=POST.c1.width,ch2=POST.c1.height;
    B.tSrc.value=POST.c1.texture;B.dir.value.set(1/cw2,0);pass(M.blur,POST.c2);
    B.tSrc.value=POST.c2.texture;B.dir.value.set(0,1/ch2);pass(M.blur,POST.c1);
  }
  const F=M.final.uniforms;F.tScene.value=POST.rt.texture;F.tB1.value=POST.b1.texture;F.tB2.value=wide?POST.c1.texture:POST.b1.texture;F.bloom2.value=wide?.65:0;
  {const day=MAPID==='dd';F.sat.value=day?1.2:1.08;F.cold.value=day?.12:.55;F.vig.value=day?0:.42;F.grain.value=day?.012:.03;F.bloom1.value=day?.35:1;M.bright.uniforms.thr.value=day?.86:.54;}   // (D-Day: daylight)
  F.time.value=reduced?0:performance.now()/1000;F.res.value.set(POST.w,POST.h);
  pass(M.final,null);
}
// a phone that can't keep up: two slow spells of 2 s in a row (under ~26 fps) and it steps down a tier; tier 0 draws at 1x too
function postWatch(raw){
  if(POST.manual||POST.tier===0||raw>.2||state!=='play'||paused)return;
  POST.acc+=raw;POST.n++;POST.t+=raw;if(POST.t<2)return;
  const avg=POST.acc/POST.n;POST.acc=POST.n=POST.t=0;
  if(simT<6)return;   // (shaders compiling, sounds decoding: the first seconds are always rough)
  if(avg>.038){if(++POST.slow>=2){POST.slow=0;postTier(POST.tier-1);}}else POST.slow=0;   // (.038: under ~26 fps; a phone held to 30 fps keeps its effects)
}
function postTier(t){POST.tier=clamp(t,0,2);if(POST.tier===0)resize();}

/* ---------- wet ground: a fine tiled bumpiness (a normal map made here) so lamps and torches glint off the wet surface ---------- */
let DETAIL_N=null;
function detailNormalTex(){
  if(DETAIL_N)return DETAIL_N;
  const N=256,h=new Float32Array(N*N),r=rng(91);
  const oct=(cells,amp)=>{const g=new Float32Array(cells*cells);for(let i=0;i<g.length;i++)g[i]=r();const v=(i,j)=>g[(((j%cells)+cells)%cells)*cells+(((i%cells)+cells)%cells)];
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const fx=x/N*cells,fy=y/N*cells,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);
      h[y*N+x]+=amp*((v(x0,y0)*(1-sx)+v(x0+1,y0)*sx)*(1-sy)+(v(x0,y0+1)*(1-sx)+v(x0+1,y0+1)*sx)*sy);}};
  oct(8,1);oct(32,.55);oct(128,.4);
  const c=document.createElement('canvas');c.width=c.height=N;const g2=c.getContext('2d'),img=g2.createImageData(N,N),H=(i,j)=>h[((j+N)%N)*N+((i+N)%N)];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const dx=(H(x+1,y)-H(x-1,y))*3,dy=(H(x,y+1)-H(x,y-1))*3,l=Math.hypot(dx,dy,1),k=(y*N+x)*4;
    img.data[k]=(-dx/l*.5+.5)*255;img.data[k+1]=(-dy/l*.5+.5)*255;img.data[k+2]=(1/l*.5+.5)*255;img.data[k+3]=255;}
  g2.putImageData(img,0,0);
  DETAIL_N=new T.CanvasTexture(c);DETAIL_N.wrapS=DETAIL_N.wrapT=T.RepeatWrapping;DETAIL_N.anisotropy=4;
  return DETAIL_N;
}
// a puddle on a ground picture (Bryan: the puddles were "grey circles"): a ragged outline (an ellipse and two smaller lobes,
// the edge wobbling; the same shape every time for the same spot, so the colour and roughness pictures match) and a damp,
// darker ring round it. kind 'col' paints the colour picture, 'rough' the roughness picture (the puddle mirror-smooth).
function puddle(c,kind,x,y,rx,ry,a){
  const h=k=>{const v=Math.sin(x*12.9898+y*78.233+k*37.719)*43758.5453;return v-Math.floor(v);};
  const path=sc=>{c.beginPath();for(let lobe=0;lobe<3;lobe++){const ox=lobe?(h(lobe)-.5)*rx*1.1:0,oy=lobe?(h(lobe+3)-.5)*ry*.9:0,s=(lobe?.42+h(lobe+6)*.3:1)*sc,p1=h(9+lobe)*6.3,p2=h(12+lobe)*6.3;
    for(let i=0;i<=30;i++){const t=i/30*Math.PI*2,w=1+.16*Math.sin(3*t+p1)+.09*Math.sin(5*t+p2)+.05*Math.sin(9*t+p1*2);const px=ox+Math.cos(t)*rx*s*w,py=oy+Math.sin(t)*ry*s*w;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();}};
  c.save();c.translate(x,y);c.rotate(a);
  c.fillStyle=kind==='col'?'rgba(8,11,14,.2)':'rgb(112,112,112)';path(1.32);c.fill();   // the damp ring
  c.fillStyle=kind==='col'?'rgba(5,8,11,.55)':'rgb(30,30,30)';path(1);c.fill();          // standing water
  c.restore();
}
// the night the wet ground reflects: dark all round, a few dim lamp glows and a cold patch of sky (puddles show them as
// glints; there was nothing to reflect, so they looked flat). The lights sit inside a dark dome: an empty background in a
// scene made into a reflection map came out white here.
let NIGHT_ENV;
function nightEnv(){
  if(NIGHT_ENV!==undefined)return NIGHT_ENV;NIGHT_ENV=null;
  try{const sc=new T.Scene(),add=(c,k,x,y,z,r)=>{const m=new T.Mesh(new T.SphereGeometry(r,12,8),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(k)}));m.position.set(x,y,z);sc.add(m);};
    sc.add(new T.Mesh(new T.SphereGeometry(90,32,16),new T.MeshBasicMaterial({color:0x05070a,side:T.BackSide})));
    add(0x1a2230,1,0,70,0,40);   // the overcast sky, faintly lit
    for(const[c,k,x,y,z,r]of[[0xffb060,2.4,-42,34,-48,4],[0xffc27a,2,52,30,24,3.5],[0xffa850,1.8,14,46,58,3.5],[0xff9a40,1.6,-58,24,30,3],[0xd8e6ff,1.5,-18,62,-20,5]])add(c,k,x,y,z,r);
    const pm=new T.PMREMGenerator(renderer);NIGHT_ENV=pm.fromScene(sc,.035).texture;pm.dispose();}catch(e){NIGHT_ENV=null;}
  return NIGHT_ENV;
}
// a ground plane's material (laid flat: its u along +x, v along -z): tiles of `tile` units, bumps of strength k (none on
// standing water: a puddle is a flat mirror; its bumps made it glitter)
function wetGround(mat,w,h,tile=24,k=.6){
  const U={uDetN:{value:detailNormalTex()},uDetRep:{value:new T.Vector2(w/tile,h/tile)},uDetK:{value:k}};
  mat.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uDetN;uniform vec2 uDetRep;uniform float uDetK;')
      .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n  {vec3 dn=texture2D(uDetN,vUv*uDetRep).xyz*2.-1.;dn.xy*=uDetK*smoothstep(.08,.36,roughnessFactor);vec3 Tt=normalize((viewMatrix*vec4(1.,0.,0.,0.)).xyz),Bt=normalize((viewMatrix*vec4(0.,0.,-1.,0.)).xyz);normal=normalize(Tt*dn.x+Bt*dn.y+normal*dn.z);}');};
  const env=nightEnv();if(env){mat.envMap=env;mat.envMapIntensity=.75;}
  mat.customProgramCacheKey=()=>'wet2';mat.needsUpdate=true;return mat;
}

/* ---------- 3D effects that glow: muzzle flashes at the real muzzle, fireballs and smoke from blasts ----------
   (They used to be drawn flat on the overlay, which the bloom can't reach.) A small pool of sprites per scene. */
const FXT={};
function fxTex(kind){
  if(FXT[kind])return FXT[kind];
  const N=128,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),m=N/2;
  if(kind==='flare'){
    let gr=g.createRadialGradient(m,m,0,m,m,m*.55);gr.addColorStop(0,'rgba(255,255,240,1)');gr.addColorStop(.25,'rgba(255,214,140,.85)');gr.addColorStop(1,'rgba(255,140,40,0)');g.fillStyle=gr;g.fillRect(0,0,N,N);
    g.globalCompositeOperation='lighter';
    for(let i=0;i<6;i++){const a=i*Math.PI/3+(i%2?.18:0),L=i%2?m*.55:m*.95;g.save();g.translate(m,m);g.rotate(a);gr=g.createLinearGradient(0,0,L,0);gr.addColorStop(0,'rgba(255,240,200,.95)');gr.addColorStop(1,'rgba(255,170,60,0)');g.fillStyle=gr;g.beginPath();g.moveTo(0,-3);g.lineTo(L,0);g.lineTo(0,3);g.fill();g.restore();}
  }else if(kind==='fire'){
    const r=rng(7);for(let i=0;i<14;i++){const x=m+(r()-.5)*m*.7,y=m+(r()-.5)*m*.7,rad=m*(.25+r()*.35),gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(255,240,190,.9)');gr.addColorStop(.4,'rgba(255,150,50,.6)');gr.addColorStop(1,'rgba(160,40,10,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();}
  }else{   // smoke
    const r=rng(11);for(let i=0;i<18;i++){const x=m+(r()-.5)*m*.8,y=m+(r()-.5)*m*.8,rad=m*(.25+r()*.3),gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(60,62,64,.5)');gr.addColorStop(1,'rgba(60,62,64,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();}
  }
  const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return FXT[kind]=t;
}
const MUZ={m4:5.45,m4s:6.9,hmg:7.0,sniper:6.8,ak:5.25,none:5};
const _fxv=new T.Vector3();
function fxPool(){
  if(scene.userData.fx)return scene.userData.fx;
  const mk=(kind,n,add)=>[...Array(n)].map(()=>{const s=new T.Sprite(new T.SpriteMaterial({map:fxTex(kind),transparent:true,depthWrite:false,blending:add?T.AdditiveBlending:T.NormalBlending,toneMapped:!add,fog:true}));s.visible=false;s.renderOrder=add?3:2;scene.add(s);return s;});
  return scene.userData.fx={flare:mk('flare',10,true),fire:mk('fire',6,true),smoke:mk('smoke',36,false),puffs:[],seen:new WeakSet()};
}
function muzzleAt(u,out){   // where his barrel ends, in the world
  const F=u&&u.m&&u.m.fig;
  if(F&&!u.gunner){const b=F.bones[20];b.updateWorldMatrix(true,false);return b.localToWorld(out.set((MUZ[F.key.split('|')[1]]||5.4)*GUN_S,.05*GUN_S,0));}
  if(u&&u.m&&u.m.g&&u.gunner){u.m.g.updateWorldMatrix(true,false);return u.m.g.localToWorld(out.set(16,9.5,0));}
  return null;
}
function fxFrame(){
  const P=fxPool();
  // muzzle flashes
  let i=0;
  for(const f of flashes){if(i>=P.flare.length)break;if(f.t>.07)continue;const s=P.flare[i++],k=1-f.t/.07;
    const at=f.u&&muzzleAt(f.u,_fxv);if(at)s.position.copy(at);else s.position.set(f.x,12+gndH(f.x,f.y),f.y);
    if(!f.rot){f.rot=Math.random()*6.28;f.sz=5+Math.random()*2.5;}s.material.rotation=f.rot;s.scale.setScalar(f.sz*(.7+k*.5));s.material.opacity=k;s.visible=true;}
  for(;i<P.flare.length;i++)P.flare[i].visible=false;
  // blasts: a fireball while it burns, then smoke that rises and spreads
  i=0;
  for(const b of booms){if(b.t<0)continue;if(!P.seen.has(b)){P.seen.add(b);for(let k=0;k<6;k++)P.puffs.push({x:b.x+(Math.random()-.5)*24,y:b.y+(Math.random()-.5)*24,h:6+Math.random()*8,t0:simT,life:2.6+Math.random()*1.6,sz:(18+Math.random()*16)*(b.size||1),rot:Math.random()*6.28});}
    if(i>=P.fire.length||b.t>.6)continue;const s=P.fire[i++],k=b.t/.6;s.position.set(b.x,10+k*14+gndH(b.x,b.y),b.y);s.scale.setScalar((22+k*40)*(b.size||1));s.material.opacity=Math.min(1,(1-k)*1.6);s.material.rotation=b.x;s.visible=true;}
  for(;i<P.fire.length;i++)P.fire[i].visible=false;
  P.puffs=P.puffs.filter(p=>simT-p.t0<p.life);
  i=0;for(const p of P.puffs){if(i>=P.smoke.length)break;const s=P.smoke[i++],k=(simT-p.t0)/p.life;s.position.set(p.x,p.h+k*26+gndH(p.x,p.y),p.y);s.scale.setScalar(p.sz*(.6+k*1.3));s.material.opacity=.75*(1-k)*Math.min(1,k*6);s.material.rotation=p.rot+k*.6;s.visible=true;}
  for(;i<P.smoke.length;i++)P.smoke[i].visible=false;
}

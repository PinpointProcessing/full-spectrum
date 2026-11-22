"use strict";
/* Core: constants, helpers, renderer, geometry merging. Units are about 10 cm. World x = east, y = south (three.js z). */
const W=720,H=1440,PI=Math.PI,TAU=PI*2;
const $=s=>document.querySelector(s);
const hyp=Math.hypot,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[(Math.random()*a.length)|0];
const angDiff=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
const ease=k=>k<=0?0:k>=1?1:k*k*(3-2*k);
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const COL={you:'#7fd4ff',ally:'#ffc35c',zed:'#ff5a48',good:'#6fe39a',warn:'#ffd24a',bad:'#ff5a48'};
const HUDFONT='"Chakra Petch","Rajdhani",ui-sans-serif,system-ui,sans-serif';
const stage=$('#stage'),cv=$('#cv'),ov=$('#ov'),ox=ov.getContext('2d');
let cw=1,ch=1,dpr=1;

const T=window.THREE;
if(!T){$('#nogl').hidden=false;return;}
let renderer;
try{renderer=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});}
catch(e){$('#nogl').hidden=false;return;}
renderer.outputEncoding=T.sRGBEncoding;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();
const FOGC=0x45343f;
scene.fog=new T.FogExp2(FOGC,0.00135);scene.background=new T.Color(FOGC);
const camera=new T.PerspectiveCamera(42,1,4,6000);

/* quality steps down by itself if the frame rate is poor: 3 = bloom + big shadows, 2 = no bloom, 1 = small shadows + lower res, 0 = no shadows */
const Q={level:3,auto:!window.__noScale,acc:0,n:0,warm:0};

/* ---- geometry merging: many coloured boxes become one mesh with vertex colours ---- */
const _m4=new T.Matrix4(),_e=new T.Euler(),_q=new T.Quaternion(),_s1=new T.Vector3(1,1,1),_p=new T.Vector3(),_n3=new T.Matrix3(),_c=new T.Color(),_v=new T.Vector3();
function part(g,x,y,z,c,rx,ry,rz){return{g,x,y,z,c,rx,ry,rz};}
function bx(w,h,d,x,y,z,c,rx,ry,rz){return part(new T.BoxGeometry(w,h,d),x,y,z,c,rx,ry,rz);}
function cy(rt,rb,h,seg,x,y,z,c,rx,ry,rz){return part(new T.CylinderGeometry(rt,rb,h,seg),x,y,z,c,rx,ry,rz);}
function merge(items,uvScale){
  let n=0,ni=0;
  for(const it of items){const g=it.g;if(!g.attributes.normal)g.computeVertexNormals();n+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;}
  const P=new Float32Array(n*3),N=new Float32Array(n*3),K=new Float32Array(n*3),U=new Float32Array(n*2),I=new (n>65535?Uint32Array:Uint16Array)(ni);
  let vo=0,io=0;
  for(const it of items){
    const g=it.g,pa=g.attributes.position,na=g.attributes.normal,ix=g.index;
    _m4.compose(_p.set(it.x||0,it.y||0,it.z||0),_q.setFromEuler(_e.set(it.rx||0,it.ry||0,it.rz||0)),_s1);
    _n3.getNormalMatrix(_m4);_c.set(it.c===undefined?0xffffff:it.c).convertSRGBToLinear();
    for(let i=0;i<pa.count;i++){
      const o=(vo+i)*3;
      _v.fromBufferAttribute(pa,i).applyMatrix4(_m4);P[o]=_v.x;P[o+1]=_v.y;P[o+2]=_v.z;
      const px=_v.x,py=_v.y,pz=_v.z;
      _v.fromBufferAttribute(na,i).applyMatrix3(_n3).normalize();N[o]=_v.x;N[o+1]=_v.y;N[o+2]=_v.z;
      if(it.keep&&g.attributes.color){const ka=g.attributes.color;K[o]=ka.getX(i);K[o+1]=ka.getY(i);K[o+2]=ka.getZ(i);}else{K[o]=_c.r;K[o+1]=_c.g;K[o+2]=_c.b;}
      if(uvScale){const o2=(vo+i)*2;
        if(Math.abs(_v.y)>.6){U[o2]=px*uvScale;U[o2+1]=pz*uvScale;}
        else if(Math.abs(_v.x)>.6){U[o2]=pz*uvScale;U[o2+1]=py*uvScale;}
        else{U[o2]=px*uvScale;U[o2+1]=py*uvScale;}}
    }
    if(ix)for(let i=0;i<ix.count;i++)I[io++]=ix.array[i]+vo;else for(let i=0;i<pa.count;i++)I[io++]=vo+i;
    vo+=pa.count;g.dispose();
  }
  const out=new T.BufferGeometry();
  out.setAttribute('position',new T.BufferAttribute(P,3));out.setAttribute('normal',new T.BufferAttribute(N,3));out.setAttribute('color',new T.BufferAttribute(K,3));
  if(uvScale)out.setAttribute('uv',new T.BufferAttribute(U,2));
  out.setIndex(new T.BufferAttribute(I,1));return out;
}
/* gable roof: ridge along x */
function roofGeo(L,Wd,h){
  const a=L/2,b=Wd/2,v=[
    -a,0,b, a,0,b, a,h,0,  -a,0,b, a,h,0, -a,h,0,
    a,0,-b, -a,0,-b, -a,h,0,  a,0,-b, -a,h,0, a,h,0,
    -a,0,-b, -a,0,b, -a,h,0,  a,0,b, a,0,-b, a,h,0];
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(v),3));g.computeVertexNormals();return g;
}
function canvasTex(w,h,draw,norepeat){
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new T.CanvasTexture(c);if(!norepeat)t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;
}

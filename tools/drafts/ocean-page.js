"use strict";
/* Ocean drafts for the road east (Bryan, after v113: "the lighthouse should be fairly off in the distance, and on a large island.
   The water is mean to go on and on? Like an ocean's horizon. Does that makes sense? Do you want to draft that first?"). Loaded
   into the game page by ocean.js before the road east is built: oceanSetup(opt) swaps in, for that build,
   - the water: the lake opened out to the sea north of it (its far shore across the head gone), on past the far plane;
   - the land: north of the Headquarters' fortress the ground ends in a coast that runs away west (a bank down to the water, like
     the lake's west shore), the hill's north end comes down into the sea (terrain.js's hillH falling away past a coast line), the
     ground beyond the old map cut away wherever the sea is;
   - the lighthouse on a large island far out (A about 300 m off, B about 450 m), taller than before so it reads at that distance,
     its lantern unfogged and its beam longer, a keeper's cottage with a lit window; the old island in the lake gone;
   oceanAfter() then puts up a sky with a little light low down (a dome round the camera: the horizon shows where the dark sea
   meets it) and lets the camera go a little lower than the game does (10 degrees over the water, the game stops at 14) so the
   horizon and some sky are in the walk's picture. Drawn only; nothing here changes the game until Bryan picks. */
const OD={opt:null,o:null,sky:null,pmin:10*Math.PI/180,lh:null,strips:[],haze:new THREE.Color(0x1d2630)};
const OD_OPT={   // (from the bridge the sea shows between the fortress on the left and the mountain on the right: the island lies off to the
                // left, its east end with the lighthouse in that gap and open sea to the right of it, the rest of it running away west)
  A:{x:560,y:-3740,rx:1000,ry:250,h:230,seed:71,lhA:.12,lhX:1500,lhS:2.0,beam:1.5},   // its east end about 330 m north of the bridge; 200 m long
  B:{x:240,y:-5260,rx:1350,ry:330,h:320,seed:73,lhA:.12,lhX:1520,lhS:2.6,beam:1.8}};  // about 480 m, on the horizon; 270 m long
const OD_WEST=[[1300,-1720],[1250,-1660],[1180,-1590],[1060,-1545],[900,-1520],[720,-1530],[540,-1565],[340,-1600],[60,-1640],[-300,-1700],[-800,-1760],[-1500,-1800],[-2600,-1830]];   // the coast north of the fortress, from the lake's head west
const OD_EAST=[[1640,-1700],[1662,-1790],[1700,-1880],[1780,-1950],[1900,-2000],[2080,-2030],[2330,-2000],[2600,-2060],[2950,-2130],[3300,-2090],[3700,-2150]];   // where the hill comes down to the sea, west to east
const OD_HILL={x0:HILL_X-60,x1:3700,y0:-2420,y1:1250};   // the hill's ground, grown north and east to its coast
function odCoastY(x){const P=OD_EAST;if(x<=P[0][0])return P[0][1];for(let i=1;i<P.length;i++)if(x<=P[i][0]){const a=P[i-1],b=P[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return P[P.length-1][1];}

/* ---------- the swaps, before the road east is built ---------- */
function oceanSetup(opt){
  const o=OD_OPT[opt];OD.opt=opt;OD.o=o;
  const lakePts0=lakePts,hillH0=hillH,lighthouse0=lighthouseMesh;
  window.lakePts=function(){   // the lake and the bay as before, the lake's head opened out to the sea
    const P=lakePts0(),i=P.findIndex(p=>p[0]===1660&&p[1]===-1720),foot=P.slice(i+1).filter(p=>p[1]>-1640);
    return[...P.slice(0,i),...OD_WEST.slice(1),[-6000,-1850],[-6000,-9500],[9000,-9500],[9000,-1640],[1700,-1640],...foot];
  };
  window.hillH=function(x,y){const h=hillH0(x,y),yc=odCoastY(x),k=sstep(yc-30,yc+230,y),f=WATER_Y-26;return f+(h-f)*k;};   // (the summit, Level 4's, well south of it: untouched)
  window.hillMesh=odHillMesh;window.shoreBanks=odShoreBanks;window.isleMesh=odIsleMesh;
  // the lighthouse on the big island's south shore, facing the bridge
  const spot=()=>{const a=o.lhA,R=odShore(a),sx=o.x+Math.cos(a)*o.rx*R,sy=o.y+Math.sin(a)*o.ry*R,sl=Math.hypot(sx-o.x,sy-o.y);return{x:sx+(o.x-sx)/sl*55,y:sy+(o.y-sy)/sl*55};};
  if(!o.slid){o.x+=o.lhX-spot().x;o.slid=1;}OD.lh=spot();OD.lh.h=odIsleH(OD.lh.x,OD.lh.y);   // (the island slid east or west so the lighthouse stands where it's meant to)
  LIGHTHOUSE.x=OD.lh.x;LIGHTHOUSE.y=OD.lh.y;Object.defineProperty(ISLE,'h',{get:()=>OD.lh.h,configurable:true});
  window.lighthouseMesh=function(grp){const n=grp.children.length;lighthouse0(grp);const g=grp.children[n];g.scale.setScalar(o.lhS);g.position.y=OD.lh.h-18*o.lhS;
    if(EAST.beam)EAST.beam.scale.set(o.beam,1,o.beam);
    g.traverse(m=>{if(m.isMesh&&m.material&&m.material.isMeshBasicMaterial)m.material.fog=false;});};   // (the lantern lit through the night air; the beam was already)
}
/* ---------- after the build: the sky, the ground beyond the old map cut where the sea is, the camera ---------- */
function oceanAfter(){
  // the ground beyond the old map: all five strips round it (scene.js) cut away over the water and under the hill
  OD.strips=scene.children.filter(m=>m.isMesh&&m.geometry&&m.geometry.type==='PlaneGeometry'&&Math.abs(m.position.y+.3)<1e-6);
  for(const m of OD.strips){const p=m.geometry.parameters,x0=m.position.x-p.width/2,z0=m.position.z-p.height/2,S=.2,c=document.createElement('canvas');c.width=Math.ceil(p.width*S);c.height=Math.ceil(p.height*S);
    const a=c.getContext('2d');a.fillStyle='#fff';a.fillRect(0,0,c.width,c.height);a.setTransform(S,0,0,S,-x0*S,-z0*S);shorePath(a);a.fillStyle='#000';a.fill();
    a.fillRect(HILL_X-8,OD_HILL.y0,OD_HILL.x1-HILL_X+8,OD_HILL.y1-OD_HILL.y0);a.fillStyle='#fff';a.fillRect(HILL_X-8,HILL_MID()-99,18,198);
    m.material=m.material.clone();m.material.alphaMap=new THREE.CanvasTexture(c);m.material.alphaTest=.5;m.material.needsUpdate=true;}
  // the water fading into a haze the colour of the sky low down as it goes off (not into the night like everything else): the far
  // sea pale at the horizon, distant land dark against it
  EAST.water.onBeforeCompile=sh=>{sh.uniforms.uHaze={value:OD.haze};sh.fragmentShader='uniform vec3 uHaze;\n'+sh.fragmentShader.replace('#include <fog_fragment>','#ifdef USE_FOG\n float hz=1.0-exp(-fogDensity*fogDensity*fogDepth*fogDepth);\n gl_FragColor.rgb=mix(gl_FragColor.rgb,uHaze,hz);\n#endif');};
  EAST.water.needsUpdate=true;
  // a sky dome round the camera: dark overhead, a little light low down that the far water meets
  const tex=canvasTex(8,1024,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);
    for(const[t,c]of[[0,'#04070b'],[.3,'#060a0f'],[.4,'#0a1017'],[.45,'#121a22'],[.48,'#1a232d'],[.497,'#222c37'],[.5,'#26303b'],[.52,'#1c242e'],[.56,'#0c1116'],[1,'#06090d']])g.addColorStop(t,c);
    x.fillStyle=g;x.fillRect(0,0,w,h);});
  tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;
  const sky=new THREE.Mesh(new THREE.SphereGeometry(5000,48,64),new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,fog:false,depthWrite:false}));
  sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);OD.sky=sky;
  const fx0=fxFrame;window.fxFrame=function(){if(OD.sky)OD.sky.position.copy(camera.position);return fx0.apply(this,arguments);};   // (keeps the horizon at eye level)
  window.updateCamera=function(){const dist=dist0/zoom,p=Math.max(OD.pmin,basePitch()-tilt),hd=dist*Math.cos(p);
    camera.position.set(camT.x+Math.sin(yaw)*hd,dist*Math.sin(p),camT.z+Math.cos(yaw)*hd);camera.lookAt(camT.x,0,camT.z);camera.updateMatrixWorld();};
}

/* ---------- the hill, grown to its coast ---------- */
function odHillMesh(grp){   // (terrain.js's hillMesh with the bounds out to the coast; the pines and stones kept out of the sea)
  const xs=[],ys=[],{x0:X0,x1:X1,y0:Y0,y1:Y1}=OD_HILL;
  for(let x=X0;x<=X1;x+=12)xs.push(x);for(let y=Y0;y<=Y1;y+=12)ys.push(y);
  const nx=xs.length,ny=ys.length,P=new Float32Array(nx*ny*3),UV=new Float32Array(nx*ny*2),I=[];
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i,x=xs[i],y=ys[j];P[k*3]=x;P[k*3+1]=hillH(x,y);P[k*3+2]=y;UV[k*2]=(x-X0)/(X1-X0);UV[k*2+1]=(y-Y0)/(Y1-Y0);}
  for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){if(HILL_HOLE((xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2))continue;const a=j*nx+i,b=a+1,c=a+nx,d=c+1;
    if(Math.max(P[a*3+1],P[b*3+1],P[c*3+1],P[d*3+1])<WATER_Y-14)continue;I.push(a,c,b,b,c,d);}   // (nothing far under the sea)
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('uv',new THREE.BufferAttribute(UV,2));g.setIndex(I);g.computeVertexNormals();
  odColour(g,P,nx*ny);
  const grain=canvasTex(128,128,(x,w,h)=>{const q=rng(77);x.fillStyle='#d8d8d8';x.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const v=150+q()*105|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(q()*w,q()*h,1+q()*2,1+q()*1.4);}});
  grain.repeat.set((X1-X0)/36,(Y1-Y0)/36);
  const mesh=new THREE.Mesh(g,wetGround(new THREE.MeshStandardMaterial({map:grain,vertexColors:true,roughness:.93,metalness:.04}),X1-X0,Y1-Y0,30,.5));mesh.castShadow=mesh.receiveShadow=true;grp.add(mesh);
  const r=rng(2468),T2=[];
  for(let k=0;k<2400&&T2.length<420;k++){const x=HILL_X+50+r()*1500,y=-2300+r()*3450,d=x-HILL_X;if(Math.abs(y-HILL_MID())<92&&d<230)continue;if(vn2(x/140,y/140,8)<.42)continue;
    const h=hillH(x,y),e=8;if(h<WATER_Y+14)continue;if(Math.abs(hillH(x+e,y)-h)>e*.9||Math.abs(hillH(x,y+e)-h)>e*.9)continue;T2.push([x,y,20+r()*18,h,(r()*1e5)|0]);}
  for(const m of pineMesh(T2))grp.add(m);
  const S=[],sd=()=>(r()*1e5)|0;
  for(let y=-1760;y<1150;y+=40+r()*50){if(Math.abs(y-HILL_MID())<160)continue;const x=HILL_X-2+r()*14,s=3+r()*6,h=hillH(x,y);if(h<WATER_Y-6)continue;S.push([x,y,s*1.4,s*.7,s,r()*6,sd(),h]);}
  for(let k=0,n=0;k<900&&n<24;k++){const x=HILL_X+24+r()*700,y=-2200+r()*3100;if(Math.abs(y-HILL_MID())<110&&x-HILL_X<230)continue;const h=hillH(x,y);if(h<WATER_Y)continue;const e=10,sl=Math.hypot(hillH(x+e,y)-h,hillH(x,y+e)-h)/e;if(sl<.55)continue;const s=10+r()*12;S.push([x,y,s*1.3,s*.7,s,r()*6,sd(),h-s*.38]);n++;}
  for(const[x,y,s]of[[HILL_X+20,PORTAL.wall.y0-14,9],[HILL_X+14,PORTAL.wall.y1+14,8],[HILL_X+40,PORTAL.wall.y0-30,7],[HILL_X+36,PORTAL.wall.y1+28,7]])S.push([x,y,s*1.3,s*.8,s,r()*6,sd(),hillH(x,y)+2]);
  grp.add(stoneMesh(S,1));
}
// terrain.js's colouring: earth, grass where it's gentle, rock where it's steep, wet at the water, the moon's light baked in a little
function odColour(g,P,n){
  const N=g.attributes.normal,C=new Float32Array(n*3),col=new THREE.Color(),grass=new THREE.Color(.064,.084,.042),earth=new THREE.Color(.105,.084,.06),rock=new THREE.Color(.16,.153,.142),wet=new THREE.Color(.05,.05,.047),Lx=-.39,Ly=.8,Lz=-.52;
  for(let k=0;k<n;k++){const x=P[k*3],h=P[k*3+1],y=P[k*3+2],slope=1-N.getY(k),q=vn2(x/9,y/9,4)*.6+vn2(x/31,y/31,6)*.4;
    col.copy(earth).lerp(grass,sstep(.24,.1,slope)*sstep(WATER_Y+6,WATER_Y+20,h)*(.6+.5*q)).lerp(rock,sstep(.2,.46,slope)*(.7+.4*q));
    if(h<WATER_Y+5)col.lerp(wet,sstep(WATER_Y+5,WATER_Y-2,h));col.multiplyScalar((.8+.4*q)*(.42+.8*Math.max(0,N.getX(k)*Lx+N.getY(k)*Ly+N.getZ(k)*Lz)));C[k*3]=col.r;C[k*3+1]=col.g;C[k*3+2]=col.b;}
  g.setAttribute('color',new THREE.BufferAttribute(C,3));
}
/* ---------- the shores: the lake's west shore on round the coast north of the fortress; no far shore across the lake's head ---------- */
function odShoreBanks(grp){
  const r=rng(1357),S=[],sd=()=>(r()*1e5)|0;
  const west=bankMesh(grp,[[ABUT.x1,ABUT.y0],...LAKE_W,...OD_WEST.slice(1)],[[-18,WATER_Y-8],[-5,WATER_Y+.5],[3,6],[12,11],[30,9],[52,4],[70,0]],21);
  west.forEach((p,k)=>{if(k%2||r()<.3)return;const s=4+r()*7;S.push([p[0]-4-r()*6,p[1]+(r()-.5)*6,s*1.3,s*.7,s,r()*6,sd(),WATER_Y+s*.3]);});
  bankMesh(grp,[[1664,900],[1000,900]],[[-20,WATER_Y-8],[-6,WATER_Y+1],[8,10],[40,26],[100,36]],25,20);
  grp.add(stoneMesh(S,1));
}
/* ---------- the big island far out ---------- */
function odShore(a){const c=OD.o;return 1+.2*(vn2(Math.cos(a)*1.8+11,Math.sin(a)*1.8+11,c.seed)-.5)*2+.07*Math.sin(3*a+.7)+.04*Math.sin(7*a+2);}
function odIsleH(x,y){const c=OD.o,dx=(x-c.x)/c.rx,dy=(y-c.y)/c.ry,a=Math.atan2(dy,dx),e=Math.hypot(dx,dy)/odShore(a),d=e<1e-3?2000:Math.min(2000,Math.hypot(x-c.x,y-c.y)*(1/e-1));   // (d: how far in from the shore along the line to its middle)
  const base=WATER_Y-24+54*sstep(-8,14,d);   // a low cliff at the water (3 m), the bottom shelving away under it
  return base+c.h*sstep(16,c.ry*1.1,d)*(.35+.8*fbm2(x/340+c.seed,y/340,c.seed))+(fbm2(x/50,y/50,c.seed+5)-.5)*8*sstep(0,60,d);}
function odIsleMesh(grp){
  const c=OD.o,X0=c.x-c.rx*1.32,X1=c.x+c.rx*1.32,Y0=c.y-c.ry*1.32,Y1=c.y+c.ry*1.32,st=20,xs=[],ys=[];
  for(let x=X0;x<=X1;x+=st)xs.push(x);for(let y=Y0;y<=Y1;y+=st)ys.push(y);
  const nx=xs.length,ny=ys.length,P=new Float32Array(nx*ny*3),I=[];
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i;P[k*3]=xs[i];P[k*3+1]=odIsleH(xs[i],ys[j]);P[k*3+2]=ys[j];}
  for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,cc=a+nx,d=cc+1;if(Math.max(P[a*3+1],P[b*3+1],P[cc*3+1],P[d*3+1])<WATER_Y-10)continue;I.push(a,cc,b,b,cc,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();odColour(g,P,nx*ny);
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:.02}));mesh.receiveShadow=true;grp.add(mesh);
  // pines in clumps over it: a ragged treeline against the sky
  const r=rng(c.seed*7),T2=[];
  for(let k=0;k<5000&&T2.length<520;k++){const x=X0+r()*(X1-X0),y=Y0+r()*(Y1-Y0),h=odIsleH(x,y);if(h<WATER_Y+40)continue;if(vn2(x/180,y/180,c.seed+9)<.38)continue;if(Math.hypot(x-OD.lh.x,y-OD.lh.y)<90)continue;T2.push([x,y,34+r()*30,h,(r()*1e5)|0]);}
  for(const m of pineMesh(T2))grp.add(m);
  // the keeper's cottage by the lighthouse, a window lit
  const L=OD.lh,cx=L.x-70,cz=L.y-20,ch=odIsleH(cx,cz),wall=new THREE.MeshStandardMaterial({color:0xaaa497,roughness:.86}),roof=new THREE.MeshStandardMaterial({color:0x2c3135,roughness:.68,metalness:.1});
  const hs=new THREE.Mesh(new THREE.BoxGeometry(52,22,32),wall);hs.position.set(cx,ch+11,cz);grp.add(hs);
  const rf=new THREE.Mesh(new THREE.ConeGeometry(34,16,4),roof);rf.rotation.y=Math.PI/4;rf.scale.set(1,1,.66);rf.position.set(cx,ch+30,cz);grp.add(rf);
  for(const dx of[-12,10]){const w=new THREE.Mesh(new THREE.PlaneGeometry(7,6),new THREE.MeshBasicMaterial({color:dx<0?0xffc878:0x4a3a22,toneMapped:false,fog:false}));w.position.set(cx+dx,ch+12,cz+16.2);grp.add(w);}
}

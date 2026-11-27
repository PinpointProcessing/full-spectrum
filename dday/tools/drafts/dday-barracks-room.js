// barracks room drafts: node dd60.js B|C   (B: bunks head to the wall, warm wooden hut; C: bunks along the walls, side-on pick view)
const {chromium}=require('playwright');const {serve,open,REPO}=require('./harness.js');const V=process.argv[2]||'B';
(async()=>{const port=V==='B'?9960:9961,srv=await serve(REPO,port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/warehouse-yard.html?gfx=2`);
await page.setViewportSize({width:390,height:760});await page.click('#ddBtn');await page.waitForTimeout(1200);
const ev=(f,a)=>page.evaluate(f,a);
await ev(V=>{window.requestAnimationFrame=()=>0;for(let i=0;i<900&&!dd.land.done;i++)update(1/30);
  for(let i=0;i<60;i++){for(const e of enemies)e.cool=9;update(1/30);ddBar();ddFrame(1/30,simT);}
  dd.track=null;camPan=null;for(const e of enemies){e.x=100;e.y=-700;}
  for(const el of document.querySelectorAll('body *')){if(el.tagName==='CANVAS'||el.querySelector('canvas'))continue;el.style.visibility='hidden';}
  window.CLR=()=>{for(const c of document.querySelectorAll('canvas')){const g=c.getContext('2d');if(g)g.clearRect(0,0,c.width,c.height);}};sel.length=0;
  const CX=1520,CY=-585,G=ddH(CX,CY),S=DD.scene,grp=new THREE.Group();S.add(grp);window.RM={CX,CY,G,V};
  const tex=(w,h,fn,rx,ry)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx||1,ry||1);return t;};
  const planks=(base,dark,vert)=>(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<8;i++){const p=i*w/8;g.fillStyle=`rgba(0,0,0,${.05+Math.random()*.12})`;vert?g.fillRect(p,0,w/8,h):g.fillRect(0,p,w,w/8);g.fillStyle=dark;vert?g.fillRect(p,0,2,h):g.fillRect(0,p,w,2);
    for(let k=0;k<5;k++){g.fillStyle='rgba(0,0,0,.08)';vert?g.fillRect(p+4+Math.random()*20,Math.random()*h,1,30+Math.random()*60):g.fillRect(Math.random()*w,p+4+Math.random()*20,30+Math.random()*60,1);}}};
  const WALL=V==='B'?tex(256,256,planks('#7a5a3c','#3d2a1a',true),6,1):tex(256,256,(g,w,h)=>{g.fillStyle='#6f7462';g.fillRect(0,0,w,h);g.fillStyle='#565b4b';g.fillRect(0,h*.62,w,h*.38);g.fillStyle='#3f4336';g.fillRect(0,h*.6,w,5);for(let i=0;i<400;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.06})`;g.fillRect(Math.random()*w,Math.random()*h,3,3);}},5,1);
  const FLOOR=tex(256,256,planks(V==='B'?'#5a4530':'#4c4a44','#2a2018',true),5,10);
  const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:0},o||{}));
  const box=(x,h,y,w,t,d,c,o)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,t,d),c&&c.isMaterial?c:M(c,o));m.position.set(x,G+h+t/2,y);m.castShadow=m.receiveShadow=true;grp.add(m);return m;};
  const cyl=(x,h,y,r,t,c,o)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,t,14),M(c,o));m.position.set(x,G+h+t/2,y);m.castShadow=true;grp.add(m);return m;};
  const HW=54,wm=M(0xffffff,{map:WALL}),wm2=M(0xffffff,{map:WALL.clone()});wm2.map.repeat.set(3,1);wm2.map.needsUpdate=true;
  box(CX,-1.3,CY+20,HW*2+8,1.6,280,M(0xffffff,{map:FLOOR,roughness:.7}));
  box(CX,0,CY-90,HW*2,64,3,wm2);box(CX-HW-1.5,0,CY+20,3,64,280,wm);box(CX+HW+1.5,0,CY+20,3,64,280,wm);
  box(CX,64,CY+20,HW*2+8,2,290,V==='B'?0x3a2a1c:0x3b3d36);
  for(let y=-80;y<=150;y+=46)box(CX,58,CY+y,HW*2,6,3,V==='B'?0x4a3523:0x4a4d43);                 // roof beams
  box(CX,0,CY-88,18,34,.8,0x3d2f22);box(CX+6,15,CY-87.4,1.2,1.2,.6,0xb8a04a,{metalness:.6});     // far door
  // a flag and a notice board on the far wall
  box(CX-30,30,CY-88.2,22,13,.3,0x7a2b24);box(CX-30,35.5,CY-88,22,2,.35,0xe8e2d0);box(CX-30,30.5,CY-88,22,2,.35,0xe8e2d0);
  box(CX+32,26,CY-88.2,18,14,.4,0x9c8a62);for(let i=0;i<5;i++)box(CX+26+i*3,28+(i%2)*4,CY-87.9,2.4,3.2,.1,0xe9e4d2);
  // the stove at the far end
  cyl(CX,0,CY-70,4.2,9,0x1c1c1e,{roughness:.5,metalness:.5});cyl(CX,9,CY-70,3.2,3,0x242426,{metalness:.5});cyl(CX,12,CY-70,1.1,52,0x242426,{metalness:.5});
  const glow=box(CX,3,CY-65.7,3,2.4,.3,M(0xff8a3c,{emissive:0xff6a1c,emissiveIntensity:1.6}));glow.castShadow=false;
  const win=(x,h,y,w,t,d)=>{const m=box(x,h,y,w,t,d,M(0x8fb2c8,{emissive:0x6f93ad,emissiveIntensity:.55}));m.castShadow=false;};
  const gun=(x,h,y,along,flip)=>{const g=new THREE.Group(),p=(a,b,c,w,t,d,col,o)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,t,d),M(col,o));m.position.set(a,b,c);m.castShadow=true;g.add(m);};
    p(0,.5,0,7,.9,.9,0x222428,{metalness:.5,roughness:.5});p(6.2,.6,0,6,.45,.45,0x1c1d20,{metalness:.6});p(9.4,.6,0,.9,.7,.7,0x1c1d20);p(-5.6,.3,0,5,1.5,.8,0x6b4526);p(-8,.1,0,1.2,2,.9,0x5a3a20);
    p(.8,-.5,0,.9,2.2,.6,0x18191b);p(-1.6,-.3,0,.7,1.4,.6,0x5a3a20);p(4.2,.5,0,3.4,1,.9,0x6b4526);p(8,.1,.9,.25,.25,2.4,0x1c1d20);p(8,.1,-.9,.25,.25,2.4,0x1c1d20);
    g.position.set(x,G+h+.9,y);g.rotation.y=(along?Math.PI/2:0)+(flip?Math.PI:0);g.rotation.x=.12;grp.add(g);return g;};
  const ys=V==='B'?[-50,-20,10,40]:[-58,-26,6,38];window.YS=ys;const fr=0x30342c,mat=0xb5ad92,bl=0x4f5d3c;window.SPOT={};
  for(const s of[-1,1])ys.forEach((y,i)=>{const by=CY+y;
    if(V==='B'){const bx=CX+s*41;win(CX+s*(HW-.2),28,by+15,.5,13,14);
      for(const dx of[-11,11])for(const dy of[-5.5,5.5])box(bx+dx,0,by+dy,1.1,24,1.1,fr,{metalness:.4});
      for(const h of[5,16]){box(bx,h,by,23,1,11,fr);box(bx,h+1,by,21.6,2.2,10.2,mat);box(bx+s*8,h+3.2,by,5,1.6,8,0xe6e0cc);box(bx-s*2,h+3.2,by,13,.6,10.4,bl);box(bx-s*9.4,h+3.3,by,2,.9,9,0x5f6e49);}
      gun(bx-s*8.5,8.9,by,true,s>0);
      const tx=bx-s*17,ty=by-9;box(tx,0,ty,7,5,12,0x46532f);box(tx,5,ty,7.5,.7,12.5,0x38432a);box(tx-s*3.8,1.5,ty,.3,1.6,2,0xb8a04a,{metalness:.6});
      const g=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),M(0x3a5226));g.position.set(tx,G+6.7,ty-3);g.castShadow=true;grp.add(g);cyl(tx,5.7,ty,.8,2.4,0x8f959b,{metalness:.4});box(tx,5.7,ty+3.6,2.4,1.9,2.8,0xe7e2d2);box(tx,7.6,ty+3.6,1.6,.1,.5,0xb53326);box(tx,7.6,ty+3.6,.5,.1,1.6,0xb53326);
      const hm=new THREE.Mesh(new THREE.SphereGeometry(2.4,14,10,0,Math.PI*2,0,Math.PI/2),M(0x4a5a3a));hm.position.set(bx-s*11,G+24,by+5.5);hm.castShadow=true;grp.add(hm);
      if(s<0&&i===1)SPOT.gun=[bx-s*8.5,G+10,by];
    }else{const bx=CX+s*47;win(CX+s*(HW-.2),34,by,.5,11,12);
      for(const dx of[-5.5,5.5])for(const dy of[-11,11])box(bx+dx,0,by+dy,1.1,24,1.1,fr,{metalness:.4});
      for(const h of[5,16]){box(bx,h,by,11,1,23,fr);box(bx,h+1,by,10.2,2.2,21.6,mat);box(bx,h+3.2,by-8,8,1.6,5,0xe6e0cc);box(bx,h+3.2,by+2,10.4,.6,13,bl);box(bx,h+3.3,by+9.4,9,.9,2,0x5f6e49);}
      gun(bx-s*1.5,8.9,by-1,false,true).rotation.y=Math.PI/2+(s<0?.0:Math.PI);
      const tx=bx-s*1,ty=by+17;box(tx,0,ty,11,5,7,0x46532f);box(tx,5,ty,11.5,.7,7.5,0x38432a);box(tx-s*5.9,1.5,ty,.3,1.6,2,0xb8a04a,{metalness:.6});
      const g=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),M(0x3a5226));g.position.set(tx-s*3,G+6.7,ty);g.castShadow=true;grp.add(g);cyl(tx,5.7,ty,.8,2.4,0x8f959b,{metalness:.4});box(tx+s*3.4,5.7,ty,2.8,1.9,2.4,0xe7e2d2);box(tx+s*3.4,7.6,ty,1.6,.1,.5,0xb53326);box(tx+s*3.4,7.6,ty,.5,.1,1.6,0xb53326);
      const hm=new THREE.Mesh(new THREE.SphereGeometry(2.4,14,10,0,Math.PI*2,0,Math.PI/2),M(0x4a5a3a));hm.position.set(bx-s*5.5,G+24,by-11);hm.castShadow=true;grp.add(hm);
      if(s<0&&i===1)SPOT.gun=[bx+1.5,G+10,by-1];}});
  // hanging lamps: warm pools down the aisle
  window.MINE=[];const lampAt=(y,sh)=>{cyl(CX,48,CY+y,.25,10,0x1c1c1c);const sd=new THREE.Mesh(new THREE.ConeGeometry(5,3.4,16,1,true),M(0x24352a,{side:THREE.DoubleSide,metalness:.3}));sd.position.set(CX,G+47,CY+y);grp.add(sd);
    const bb=new THREE.Mesh(new THREE.SphereGeometry(1.2,10,8),M(0xfff0c0,{emissive:0xffd890,emissiveIntensity:2.5}));bb.position.set(CX,G+45.6,CY+y);grp.add(bb);
    const L=new THREE.SpotLight(0xffc98a,1.9,170,1.05,.6,1.2);L.position.set(CX,G+45,CY+y);L.target.position.set(CX,G,CY+y);L.castShadow=!!sh;if(sh){L.shadow.mapSize.set(1024,1024);L.shadow.bias=-.002;L.shadow.camera.near=4;L.shadow.camera.far=170;}grp.add(L,L.target);MINE.push(L);};
  lampAt(-45,1);lampAt(15,1);lampAt(75,0);
  const amb=new THREE.HemisphereLight(0x8fa3b8,0x3a2c1e,V==='B'?.34:.3);grp.add(amb);MINE.push(amb);
  const st=new THREE.PointLight(0xff7a30,.8,70);st.position.set(CX,G+5,CY-62);grp.add(st);MINE.push(st);
  window.KEY=new THREE.SpotLight(0xfff1d6,0,160,.5,.5,1);KEY.castShadow=true;KEY.shadow.mapSize.set(1024,1024);KEY.shadow.bias=-.002;grp.add(KEY,KEY.target);MINE.push(KEY);
  const kk=figKitKey;figKitKey=function(u,L){const k=kk(u,L);return u.atEase?k.replace(/^sq\|[a-z0-9]+\|/,'sq|none|'):k;};
  const A=players.filter(p=>p.team==='A'&&alive(p)),B=players.filter(p=>p.team==='B'&&alive(p));window.MEN=[...A,...B];
  window.POSE=()=>{[[A,-1],[B,1]].forEach(([T,s])=>T.forEach((u,i)=>{u.atEase=true;const tw=[.2,-.1,.35,-.25][i];
    if(V==='B'){u.x=CX+s*22;u.y=CY+ys[i]+11;u.ang=(s<0?.8:Math.PI-.8)+tw*s;}else{u.x=CX+s*31;u.y=CY+ys[i]+9;u.ang=(s<0?.45:Math.PI-.45)+tw*s;}
    u.path=[];u.sup=0;u.inBoat=false;u.focus=null;u.target=null;u.cool=99;u.aimT=-9;u.watch=null;u.supT=0;u.covered=false;figRefresh(u);}));
    A[2].work='stand';B[0].work='stand';for(const n of units)if(n.npc){n.x=300;n.y=-700;n.path=[];}};POSE();
  window.KEEP=new Set([grp]);for(const c of S.children){let sk=false;c.traverse(o=>{if(o.isSkinnedMesh)sk=true;});if(sk)KEEP.add(c);}
  const cv=renderer.domElement;window.CW=cv.clientWidth;window.CH=cv.clientHeight;window.CAM=new THREE.PerspectiveCamera(34,CW/CH,1,2000);},V);
const shot=async(n,px,ph,py,lx,lh,ly,fov,key)=>{const r=await ev(([px,ph,py,lx,lh,ly,fov,key])=>{const {CX,CY,G}=RM;CAM.fov=fov;CAM.updateProjectionMatrix();
  camT.x=CX;camT.z=CY+40;zoom=9;for(let i=0;i<24;i++){POSE();simT+=1/30;updateCamera();render(.03);}
  CAM.position.set(CX+px,G+ph,CY+py);CAM.lookAt(CX+lx,G+lh,CY+ly);CAM.updateMatrixWorld();
  const A2=MEN[1];if(key){KEY.intensity=2.2;KEY.position.set(A2.x+34,G+50,A2.y+26);KEY.target.position.set(A2.x-4,G+8,A2.y-4);KEY.target.updateMatrixWorld();}else KEY.intensity=0;
  const off=[];DD.scene.traverse(o=>{if(o.isLight&&!MINE.includes(o)&&o.visible){o.visible=false;off.push(o);}});
  for(const c of DD.scene.children)if(!KEEP.has(c)&&!c.isLight)c.visible=false;const F=DD.scene.fog;if(F){if('density' in F)F.density=0;else{F.near=1e5;F.far=2e5;}}
  for(const c of KEEP)c.traverse(o=>{o.frustumCulled=false;});for(const u of MEN){let t=u.m.fig.mesh;while(t.parent&&t.parent!==DD.scene)t=t.parent;t.position.y=RM.G;t.updateMatrixWorld(true);}window.DBG=[];{const F=MEN[1].m.fig,ms=F.mesh;let vis=true,top=ms;for(let o=ms;o;o=o.parent){if(!o.visible)vis=false;if(o.parent===DD.scene)top=o;}DBG.push('fc '+ms.frustumCulled+' par '+(ms.parent&&ms.parent.type)+' topvis '+top.visible+' inKeep '+[...KEEP].includes(top)+' layers '+ms.layers.mask+' mv '+ms.visible+' geo '+(ms.geometry.attributes.position.count)+' key '+F.key,'chain '+vis,'kept '+KEEP.has(top),'op '+ms.material.opacity+' tr '+ms.material.transparent,'pos '+[top.position.x,top.position.y,top.position.z].map(Math.round));}
  renderer.setRenderTarget(null);renderer.render(DD.scene,CAM);CLR();for(const o of off)o.visible=true;
  const P=(x,h,y)=>{const v=new THREE.Vector3(x,h,y).project(CAM);return[Math.round((v.x+1)*CW/2),Math.round((1-v.y)*CH/2)];};
  return {dbg:JSON.stringify(DBG).slice(0,300),w:CW,h:CH,head:P(A2.x,G+29,A2.y),feet:P(A2.x,G,A2.y),gun:P(...SPOT.gun)};},[px,ph,py,lx,lh,ly,fov,key]);
  await page.waitForTimeout(500);await page.locator('canvas').first().screenshot({path:`rm${V}_${n}.png`});console.log(V,n,JSON.stringify(r));};
await shot('wide',0,34,128,0,9,-10,64,0);
if(V==='B')await shot('unit',34,24,14,-33,9,-17,50,1);else await shot('unit',36,22,-25,-46,10,-25,46,1);
console.log(errors);await b.close();srv.close();})();

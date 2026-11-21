// In the page (after creatures.js): the Headquarters dressed as her nest for the drafts, a clean set for close-ups, and shots
// through the game's own renderer and post-processing. The HQ's new look (amber lair light, darker fittings, the nest floor)
// is set up here for now; it moves into fortress.js once Bryan's happy with it.
window.ST={};
function studioSetup(){
  window.requestAnimationFrame=()=>0;   // the frame loop stops; we draw by hand
  for(const e of enemies)if(e.m)scene.remove(e.m.g);
  // the new look of the hall: amber where the violet was, warmer, darker
  for(const L of lamps){if(L.c===0x9a55ff)Object.assign(L,{c:0xd88a3e,i:1.3,d:300,h:34});else if(L.c===0x8a44ff)Object.assign(L,{c:0xb06a2c,i:1.0});else if(L.c===0xff5544||L.c===0xff4433)L.c=0xff3010;}   // (the red lamps deeper and more orange: no pink)
  hemi.color.setHex(0x7d776e);hemi.groundColor.setHex(0x120e0b);hemi.userData.base=.26;hemi.intensity=.26;
  ST.nest=HQ.nest||hqNest(scene,objs);   // (buildHQ makes the nest now)
  for(const k in (scene.userData.crPools||{}))scene.userData.crPools[k].g.visible=false;   // (the game's own monsters: the shots pose their own)
  for(const L of lamps)if(L.head)L.head.material.color.setHex(L.c);
  for(const o of objs)if(o.kind==='wall'&&o.meshes)for(const m of o.meshes)if(m.material&&m.material.color&&!m.material.userData.dk){m.material=m.material.clone();m.material.userData.dk=1;m.material.color.multiplyScalar(.45);}
  // the hall's old fittings: grimed over (the pale tanks and consoles burned out to white under her lamps)
  for(const o of objs)if(o.meshes)for(const m of o.meshes){const ms=Array.isArray(m.material)?m.material:[m.material];for(const q of ms)if(q&&q.color&&!q.userData.dk&&['ctank','xfmr','console','crate','barrel'].includes(o.kind)){q.userData.dk=1;q.color.multiplyScalar(o.kind==='ctank'?.16:.45).lerp(new T.Color(0x2a1c12),.25);if(q.roughness!=null)q.roughness=Math.min(1,q.roughness+.2);}}
  {const cv=HQ.tex.image,g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);paintNestGround(g);HQ.tex.needsUpdate=true;}
  ST.cam=new T.PerspectiveCamera(36,cw/ch,1,6000);
}
function studioSize(w,h,pr){for(let a=stage;a&&a!==document.body;a=a.parentElement)for(const el of a.parentElement.children)if(el!==a&&el.tagName!=='SCRIPT')el.style.display='none';for(const el of stage.children)if(el!==cv)el.style.display='none';stage.style.cssText='position:fixed;left:0;top:0;width:'+w+'px;height:'+h+'px;z-index:9999;margin:0';ov.style.display='none';
  document.body.style.overflow='hidden';resize();renderer.setPixelRatio(pr);renderer.setSize(cw,ch,false);postSize();ST.cam.aspect=cw/ch;ST.cam.updateProjectionMatrix();}
function studioShot(o){
  const c=ST.cam;c.fov=o.fov||36;c.position.set(...o.pos);c.lookAt(new T.Vector3(...o.at));c.updateProjectionMatrix();c.updateMatrixWorld();
  camT={x:o.at[0],z:o.at[2]};lampLights(o.t??simT);syncUnits(simT);
  if(o.tier!=null)POST.tier=o.tier;
  postRender(scene,c);
}
// a clean set for close-ups, centred on (cx,cz) in the game's units: wet dark floor with her stains, a resin-covered wall
// behind, a clutch, a warm key light low in front, a cold rim light high behind, a red lamp on the wall
function studioSet(cx,cz){
  const sc=new T.Scene();sc.background=new T.Color(0x040302);sc.fog=new T.FogExp2(0x040302,.0019);ST.set=sc;
  const N=1024,cv=document.createElement('canvas');cv.width=cv.height=N;const g=cv.getContext('2d'),rc=document.createElement('canvas');rc.width=rc.height=N;const gr=rc.getContext('2d'),r=rng(77);
  g.fillStyle='#1d1b19';g.fillRect(0,0,N,N);for(let i=0;i<14000;i++){g.fillStyle=r()<.5?'rgba(0,0,0,.25)':'rgba(255,235,210,.035)';g.fillRect(r()*N,r()*N,1+r()*3,1+r()*3);}
  g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=2;for(let k=0;k<=N;k+=128){g.beginPath();g.moveTo(k,0);g.lineTo(k,N);g.stroke();g.beginPath();g.moveTo(0,k);g.lineTo(N,k);g.stroke();}
  gr.fillStyle='#9a9a9a';gr.fillRect(0,0,N,N);
  const blot=(ctx,x,y,rx,ry,col,a)=>{ctx.save();ctx.translate(x,y);ctx.rotate(r()*3);ctx.scale(1,ry/rx);const q=ctx.createRadialGradient(0,0,0,0,0,rx);q.addColorStop(0,`rgba(${col},${a})`);q.addColorStop(.65,`rgba(${col},${a*.55})`);q.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=q;ctx.beginPath();ctx.arc(0,0,rx,0,7);ctx.fill();ctx.restore();};
  for(let i=0;i<90;i++){const x=r()*N,y=r()*N*.7,s=20+r()*90;blot(g,x,y,s,s*(.4+r()*.5),'12,9,6',.55+r()*.35);}
  for(let i=0;i<160;i++){let x=N/2+(r()-.5)*200,y=N*.3+(r()-.5)*120;const a=r()*7,L=80+r()*300;g.strokeStyle=`rgba(8,6,4,${(.35+r()*.5).toFixed(2)})`;g.lineWidth=1+r()*4;g.beginPath();g.moveTo(x,y);for(let s=0;s<12;s++){x+=Math.cos(a+(r()-.5))*L/12;y+=Math.sin(a+(r()-.5))*L/12;g.lineTo(x,y);}g.stroke();}
  const map=new T.CanvasTexture(cv);map.encoding=T.sRGBEncoding;map.anisotropy=8;const rough=new T.CanvasTexture(rc);
  const floor=new T.Mesh(new T.PlaneGeometry(900,900),new T.MeshStandardMaterial({map,roughnessMap:rough,roughness:1,metalness:0,envMap:crEnv(),envMapIntensity:.9,normalMap:crNormalTex('chitin',512,crChitinH),normalScale:new T.Vector2(.25,.25)}));
  floor.material.normalMap=floor.material.normalMap.clone();floor.material.normalMap.repeat.set(30,30);floor.material.normalMap.needsUpdate=true;
  floor.rotation.x=-Math.PI/2;floor.position.set(cx,0,cz);floor.receiveShadow=true;sc.add(floor);
  // the wall behind, resin down it, strands off it
  const wall=new T.Mesh(new T.BoxGeometry(700,70,12),new T.MeshStandardMaterial({color:0x17181b,roughness:.85,metalness:.2}));wall.position.set(cx,35,cz-170);wall.receiveShadow=true;sc.add(wall);
  const goo=crGooMat();{const m=new T.Mesh(crDrape(700,70,3.3),goo);m.position.set(cx-350,0,cz-163.8);m.castShadow=m.receiveShadow=true;sc.add(m);}
  for(let k=0;k<10;k++){const x=cx-250+r()*500,m=new T.Mesh(crStrand(new T.Vector3(x,40+r()*25,cz-163),new T.Vector3(x+(r()-.5)*30,0,cz-150+r()*40),.25+r()*.35,4+r()*8),goo);sc.add(m);}
  // slime underfoot
  const slime=crSlimeMat();for(let k=0;k<5;k++){const m=new T.Mesh(crBlob(10+r()*26,k*2.9),slime);m.position.set(cx+(r()-.5)*300,.15+k*.02,cz-120+r()*200);m.receiveShadow=true;sc.add(m);}
  // lights
  const hemi=new T.HemisphereLight(0x5d5852,0x0b0907,.16);sc.add(hemi);
  const key=new T.SpotLight(0xffae6a,3.0,900,.55,.7,1.1);key.position.set(cx-210,70,cz+230);key.target.position.set(cx,25,cz);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.0004;key.shadow.normalBias=.6;sc.add(key,key.target);
  const rim=new T.SpotLight(0xc4d4ff,5.5,900,.5,.6,1.0);rim.position.set(cx+190,170,cz-230);rim.target.position.set(cx,30,cz);rim.castShadow=true;rim.shadow.mapSize.set(2048,2048);rim.shadow.bias=-.0004;rim.shadow.normalBias=.6;sc.add(rim,rim.target);
  const red=new T.PointLight(0xff3a24,1.8,320,1.4);red.position.set(cx-150,52,cz-150);sc.add(red);
  const glow=new T.PointLight(0xffa050,1.1,160,1.6);glow.position.set(cx+70,10,cz-60);sc.add(glow);
  const lampA=new T.Mesh(new T.BoxGeometry(10,2,3),new T.MeshBasicMaterial({color:0xff4a30,toneMapped:false}));lampA.position.set(cx-150,58,cz-162);sc.add(lampA);
  ST.setLights={hemi,key,rim,red,glow};
  return sc;}
function studioShotIn(sc,o){const c=ST.cam;c.fov=o.fov||36;c.position.set(...o.pos);c.lookAt(new T.Vector3(...o.at));c.updateProjectionMatrix();c.updateMatrixWorld();syncUnits(simT);postRender(sc,c);}
function stPut(sc,list){players.forEach((p,i)=>{const q=list[i];if(!q){p.x=-9999;return;}p.x=q[0];p.y=q[1];p.ang=Math.atan2(q[3]-p.y,q[2]-p.x);p.path=[];moveMesh(p,sc);});}

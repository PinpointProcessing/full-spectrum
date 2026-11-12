const {chromium}=require('playwright');const {serve,open,REPO}=require('./harness.js');
(async()=>{const port=9959,srv=await serve(REPO,port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/warehouse-yard.html?gfx=2`);
await page.setViewportSize({width:390,height:760});await page.click('#ddBtn');await page.waitForTimeout(1200);
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{window.requestAnimationFrame=()=>0;for(let i=0;i<900&&!dd.land.done;i++)update(1/30);
  for(let i=0;i<60;i++){for(const e of enemies)e.cool=9;update(1/30);ddBar();ddFrame(1/30,simT);}
  dd.track=null;camPan=null;for(const e of enemies){e.x=100;e.y=-700;}
  for(const el of document.querySelectorAll('body *')){if(el.tagName==='CANVAS'||el.querySelector('canvas'))continue;el.style.visibility='hidden';}
  window.CLR=()=>{for(const c of document.querySelectorAll('canvas')){const g=c.getContext('2d');if(g)g.clearRect(0,0,c.width,c.height);}};sel.length=0;
  const CX=1520,CY=-585,G=ddH(CX,CY),S=DD.scene,grp=new THREE.Group();S.add(grp);window.RM={CX,CY,G};
  const M=c=>new THREE.MeshLambertMaterial({color:c});
  const box=(x,h,y,w,t,d,c,ry)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,t,d),M(c));m.position.set(x,G+h+t/2,y);if(ry)m.rotation.y=ry;m.castShadow=m.receiveShadow=true;grp.add(m);return m;};
  box(CX,-1.3,CY+20,120,1.6,260,0x6b5a45);for(let i=-8;i<=8;i++)box(CX,.3,CY+20+i*15,120,.1,.6,0x57483a);
  box(CX,0,CY-80,112,70,3,0x8a8f7a);box(CX-55,0,CY+20,3,70,260,0x80856f);box(CX+55,0,CY+20,3,70,260,0x80856f);
  box(CX,70,CY+20,116,2,270,0x4d4638);
  box(CX,0,CY-78.2,16,32,.6,0x4a3f30);box(CX+5,14,CY-77.8,1,1,.6,0xb8a04a);   // the door at the far end
  const ys=[-50,-20,10,40];window.YS=ys;
  for(const s of[-1,1]){
    for(const y of ys){const bx=CX+s*41,by=CY+y;
      box(CX+s*53.2,30,by+15,.5,12,14,0xcfe3ea);                               // window between bunks
      for(const dx of[-11,11])for(const dy of[-5.5,5.5])box(bx+dx,0,by+dy,1,22,1,0x3b3f37);
      for(const h of[5,15]){box(bx,h,by,23,1,11,0x3b3f37);box(bx,h+1,by,21,2,10,0xb9b49a);box(bx+s*8,h+3,by,5,1.4,8,0xe6e2d2);box(bx-s*4,h+3,by,10,.5,10,0x55633f);}
      // the gun laid across the lower bunk, near its foot
      const gx=bx-s*8;box(gx,8.6,by,.9,.8,10.5,0x24262a);box(gx,8.6,by+3.6,.9,1.5,3,0x6b4a2c);box(gx-.2,8,by-1.6,.6,1.6,.9,0x24262a);
      // trunk at the foot, kit on it
      const tx=bx-s*17,ty=by-9;box(tx,0,ty,7,5,12,0x4b5a3a);box(tx,5,ty,7.4,.6,12.4,0x3c482e);
      const g=new THREE.Mesh(new THREE.SphereGeometry(.9,10,8),M(0x3f5a2c));g.position.set(tx,G+6.5,ty-3);grp.add(g);
      const c=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,2.2,10),M(0x9aa0a6));c.position.set(tx,G+6.7,ty);grp.add(c);
      box(tx,5.6,ty+3.4,2.2,1.8,2.6,0xe9e6dc);}}
  const lamp=new THREE.PointLight(0xffdca0,.75,300);lamp.position.set(CX,G+62,CY+30);grp.add(lamp);grp.add(new THREE.AmbientLight(0xbfc6d0,.2));
  // at ease: no rifle in the hands
  const kk=figKitKey;figKitKey=function(u,L){const k=kk(u,L);return u.atEase?k.replace(/^sq\|[a-z0-9]+\|/,'sq|none|'):k;};
  const A=players.filter(p=>p.team==='A'&&alive(p)),B=players.filter(p=>p.team==='B'&&alive(p));window.MEN=[...A,...B];
  window.POSE=()=>{[[A,-1],[B,1]].forEach(([T,s])=>T.forEach((u,i)=>{u.atEase=true;u.x=CX+s*22;u.y=CY+ys[i]+9;u.ang=s<0?.75:Math.PI-.75;u.path=[];u.sup=0;u.inBoat=false;u.focus=null;u.target=null;u.cool=99;u.aimT=-9;u.watch=null;u.supT=0;u.covered=false;figRefresh(u);}));
    A[2].work='stand';B[0].work='stand';for(const n of units)if(n.npc){n.x=300;n.y=-700;n.path=[];}};POSE();
  window.KEEP=new Set([grp]);for(const c of S.children){let sk=false;c.traverse(o=>{if(o.isSkinnedMesh)sk=true;});if(sk)KEEP.add(c);}window.GRP=grp;
  window.CAM=new THREE.PerspectiveCamera(34,390/760,1,2000);});
const shot=async(n,px,ph,py,lx,lh,ly,fov)=>{const r=await ev(([px,ph,py,lx,lh,ly,fov])=>{const {CX,CY,G}=RM;CAM.fov=fov;CAM.updateProjectionMatrix();
  camT.x=CX;camT.z=CY+40;zoom=9;for(let i=0;i<24;i++){POSE();simT+=1/30;updateCamera();render(.03);}
  CAM.position.set(CX+px,G+ph,CY+py);CAM.lookAt(CX+lx,G+lh,CY+ly);CAM.updateMatrixWorld();
  for(const c of DD.scene.children)if(!KEEP.has(c)&&!c.isLight)c.visible=false;const F=DD.scene.fog;if(F){if('density' in F)F.density=0;else{F.near=1e5;F.far=2e5;}}
  renderer.setRenderTarget(null);renderer.render(DD.scene,CAM);CLR();
  const P=(x,h,y)=>{const v=new THREE.Vector3(x,h,y).project(CAM);return[Math.round((v.x+1)*195),Math.round((1-v.y)*380)];};
  return {men:MEN.map(u=>[u.id,u.role,...P(u.x,G+27,u.y),...P(u.x,G,u.y)]),gun:P(CX-33,G+9,CY+YS[1])};},[px,ph,py,lx,lh,ly,fov]);
  await page.waitForTimeout(400);await page.locator('canvas').first().screenshot({path:`bk4_${n}.png`});console.log(n,JSON.stringify(r));};
await shot('wide',0,36,128,0,8,-10,66);
await shot('unit',30,23,10,-33,9,-17,50);
console.log(errors);await b.close();srv.close();})();

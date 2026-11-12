const {chromium}=require('playwright');const {serve,open,REPO}=require('./harness.js');
(async()=>{const port=9958,srv=await serve(REPO,port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
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
  box(CX,-1.3,CY,260,1.6,150,0x6b5a45);                       // plank floor
  for(let i=-6;i<=6;i++)box(CX+i*20,.3,CY,.6,.1,150,0x57483a);
  box(CX,0,CY-46,260,70,3,0x8a8f7a);                       // back wall
  box(CX,0,CY-44.4,260,9,.6,0x5d6352);                     // skirting
  box(CX-130,0,CY,3,70,150,0x7f846f);box(CX+130,0,CY,3,70,150,0x7f846f);
  box(CX,70,CY-10,266,2,170,0x4d4638);                     // roof (shade)
  for(let i=-2;i<=2;i++){box(CX+i*44+22,30,CY-44.2,14,12,.5,0xcfe3ea);box(CX+i*44+22,29,CY-44,16,1,.8,0x4a4336);box(CX+i*44+22,42,CY-44,16,1,.8,0x4a4336);}   // windows
  // bunks: heads at the wall, feet toward the camera
  const bunk=x=>{for(const dx of[-5.5,5.5])for(const dy of[-42,-20])box(x+dx,0,CY+dy,1,22,1,0x3b3f37);
    for(const h of[5,15]){box(x,h,CY-31,11,1,23,0x3b3f37);box(x,h+1,CY-31,10,2,21,0xb9b49a);box(x,h+3,CY-39,8,1.4,5,0xe6e2d2);box(x,h+3,CY-26,10,.5,10,0x55633f);}};
  const xs=[-66,-22,22,66];xs.forEach(d=>bunk(CX+d));
  // trunks to the right of each man, kit laid out on the selected one's
  xs.forEach((d,i)=>{const tx=CX+d+13,ty=CY-8;box(tx,0,ty,13,5,7,0x4b5a3a);box(tx,5,ty,13.4,.6,7.4,0x3c482e);box(tx,2,ty+3.6,2,1.6,.4,0xb8a04a);
    if(i===1){box(tx-.5,5.6,ty-1.6,11,.7,.9,0x24262a,.06);box(tx-4.5,5.6,ty-1.2,3,1.4,.8,0x6b4a2c,.06);box(tx+1,5.6,ty-2.4,.7,.5,3,0x24262a);   // BAR
      const g=new THREE.Mesh(new THREE.SphereGeometry(.9,10,8),M(0x3f5a2c));g.position.set(tx-3.5,G+6.5,ty+1.6);grp.add(g);
      const s=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,2.2,10),M(0x9aa0a6));s.position.set(tx,G+6.7,ty+1.6);grp.add(s);
      box(tx+3.6,5.6,ty+1.4,2.6,1.8,2,0xe9e6dc);box(tx+3.6,7.4,ty+1.4,1.6,.1,.5,0xc0392b);box(tx+3.6,7.4,ty+1.4,.5,.1,1.6,0xc0392b);
      window.KIT={gun:[tx-.5,G+6.5,ty-1.6],nade:[tx-3.5,G+6.8,ty+1.6],smoke:[tx,G+7.2,ty+1.6],med:[tx+3.6,G+7.6,ty+1.4],trunk:[tx,G+5,ty]};}});
  const lamp=new THREE.PointLight(0xffdca0,.7,260);lamp.position.set(CX,G+60,CY+10);grp.add(lamp);const amb=new THREE.AmbientLight(0xbfc6d0,.2);grp.add(amb);
  const A=players.filter(p=>p.team==='A'&&alive(p));window.MEN=A;
  window.POSE=()=>{A.forEach((u,i)=>{u.x=CX+xs[i];u.y=CY-8;u.ang=Math.PI/2;u.path=[];u.sup=0;u.inBoat=false;u.focus=null;u.target=null;u.cool=99;u.aimT=0;});
    players.filter(p=>p.team==='B').forEach(u=>{u.x=CX+200;u.y=CY+200;u.path=[];});for(const n of units)if(n.npc){n.x=300;n.y=-700;n.path=[];}};POSE();
  const top=o=>{while(o&&o.parent&&o.parent!==S)o=o.parent;return o;};window.KEEP=new Set([grp]);for(const c of S.children){let sk=false;c.traverse(o=>{if(o.isSkinnedMesh)sk=true;});if(sk)KEEP.add(c);}window.KK='kept '+KEEP.size+' of '+S.children.length;window.GRP=grp;
  window.CAM=new THREE.PerspectiveCamera(34,390/760,1,2000);});
const shot=async(n,px,ph,py,lx,lh,ly,fov)=>{const r=await ev(([px,ph,py,lx,lh,ly,fov])=>{const {CX,CY,G}=RM;CAM.fov=fov;CAM.updateProjectionMatrix();
  camT.x=CX;camT.z=CY+40;zoom=9;for(let i=0;i<24;i++){POSE();simT+=1/30;updateCamera();render(.03);}
  CAM.position.set(CX+px,G+ph,CY+py);CAM.lookAt(CX+lx,G+lh,CY+ly);CAM.updateMatrixWorld();
  for(const c of DD.scene.children)if(!KEEP.has(c)&&!c.isLight)c.visible=false;const F=DD.scene.fog;if(F){if('density' in F)F.density=0;else{F.near=1e5;F.far=2e5;}}renderer.setRenderTarget(null);renderer.render(DD.scene,CAM);CLR();
  const P=(x,h,y)=>{const v=new THREE.Vector3(x,h,y).project(CAM);return[Math.round((v.x+1)*195),Math.round((1-v.y)*380)];};
  return {kk:KK,kit:Object.fromEntries(Object.entries(KIT).map(([k,v])=>[k,P(...v)])),men:MEN.map(u=>[u.name,u.role,...P(u.x,G+30,u.y)])};},[px,ph,py,lx,lh,ly,fov]);
  await page.waitForTimeout(400);await page.locator('canvas').first().screenshot({path:`bk_${n}.png`});console.log(n,JSON.stringify(r));};
await shot('wide',-128,36,96,-4,9,-14,56);
await shot('unit',-16,21,60,-16,12.5,-10,46);
console.log(errors);await b.close();srv.close();})();

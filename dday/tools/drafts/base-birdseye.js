// A straight-down picture of the D-Day level's last capture point (the base on the top: ddbase.js's DB). node bird.js OUT.png [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const OUT=process.argv[2]||'bird.png',PORT=+process.argv[3]||9920;
(async()=>{const srv=await serve('/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:1400,height:900});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{window.requestAnimationFrame=()=>0;});await page.click('#ddBtn');await page.waitForTimeout(900);
const info=await ev(()=>{for(let i=0;i<60;i++){update(1/30);}
  for(const q of['.bar','.panel','#sq','#ddObj','#banner','#bigText','#hint','#ddChip','#tl','#cards','#fitBtn','#gaitBtn'])for(const e of document.querySelectorAll(q))e.style.visibility='hidden';
  const T=THREE,D=DB,cx=(D.x0+D.x1)/2,cy=(D.y0+D.y1)/2,hw=(D.x1-D.x0)/2+70,hh=hw*ch/cw,g=ddH(cx,cy);
  const c=new T.OrthographicCamera(-hw,hw,hh,-hh,1,3000);c.position.set(cx,g+900,cy);c.up.set(0,0,-1);c.lookAt(cx,g,cy);c.updateProjectionMatrix();c.updateMatrixWorld();
  window.BIRD=()=>{updateCamera();render(.02,simT);for(const o of scene.children)o.frustumCulled=false;scene.traverse(o=>{o.frustumCulled=false;if(o.material&&o.material.opacity<1&&o.userData&&o.userData.ownMat){o.material.opacity=1;}});
    const f=scene.fog;scene.fog=null;renderer.setRenderTarget(null);renderer.render(scene,c);scene.fog=f;ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);};
  BIRD();return{cx,cy,hw,hh,g,foes:enemies.filter(e=>e.x>D.x0&&e.y<D.y1).length,cp:D.cp};});
console.log(JSON.stringify(info));await page.waitForTimeout(800);await ev(()=>BIRD());await page.waitForTimeout(300);await page.screenshot({path:OUT});
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

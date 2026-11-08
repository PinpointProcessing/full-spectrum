// Renders the ocean drafts (docs/drafts/ocean-*.jpg) with the game's own renderer, lights and post-processing: the road east from the
// 'road' checkpoint with ocean-page.js's swaps (the lake opened to the sea, the lighthouse on a big island far out, a sky with a little
// light low down), options A and B: the squad's walk across on a wide screen and on a phone (the game's lowest camera, 14 degrees over
// the water, with the picture moved down so the horizon and some sky are in), the bay from further back, and the layout from straight
// overhead (no fog, no sky). Setup once: npm i three@0.128.0 playwright
// (or THREE=path/to/three.min.js). Run: node ocean.js [outdir] (default docs/drafts)
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const REPO=path.resolve(__dirname,'../..'),THREE_SRC=fs.readFileSync(process.env.THREE||require.resolve('three/build/three.min.js'));
const O=path.resolve(process.argv[2]||path.join(REPO,'docs/drafts'));fs.mkdirSync(O,{recursive:true});
const serve=port=>new Promise(r=>{const srv=http.createServer((q,res)=>{const f=path.join(REPO,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(port,()=>r(srv));});
const WIDE={width:1280,height:720},PHONE={width:430,height:860};
(async()=>{const port=+process.env.PORT||9714,srv=await serve(port),b=await chromium.launch(),errors=[];
  for(const opt of(process.env.OPTS||'A,B').split(',')){
    const page=await b.newPage({viewport:WIDE});page.on('pageerror',e=>errors.push(opt+': '+String(e)));
    await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
    await page.goto(`http://localhost:${port}/warehouse-yard.html`);await page.waitForTimeout(2500);const E=(f,a)=>page.evaluate(f,a);
    await page.addScriptTag({path:path.join(__dirname,'ocean-page.js')});
    await E(o=>{POST.tier=2;oceanSetup(o);startCheckpoint('road');},opt);await page.waitForTimeout(1500);
    await E(()=>{oceanAfter();window.requestAnimationFrame=()=>0;$('#banner').classList.remove('show');$('#app').classList.add('cine');base={cine:true};   // (no HUD over the pictures)
      players.forEach((p,i)=>{p.x=1286+i*16;p.y=-262+(i%2)*14;p.ang=0;p.path=[];});EAST.beam.rotation.y=-2.73;});
    const shot=async(name,cam,vp)=>{await E(()=>camera.clearViewOffset());if(vp)await page.setViewportSize(vp);await page.waitForTimeout(300);   // (no lens shift while the game fits the map to the screen: fitDist)
      await E(c=>{camPan=null;camT={x:c.x,z:c.z};zoom=c.zoom;yaw=c.yaw||0;tilt=basePitch()-c.pitch*Math.PI/180;camera.clearViewOffset();resize();if(c.shift)camera.setViewOffset(cw,ch,0,-ch*c.shift,cw,ch);else camera.clearViewOffset();updateCamera();syncUnits(simT);render(.016,simT);},cam);   // (shift: the picture moved down, the horizon lower in it)
      await page.waitForTimeout(400);await E(()=>render(.016,simT));await page.waitForTimeout(250);
      await page.screenshot({path:path.join(O,`ocean-${opt}-${name}.jpg`),type:'jpeg',quality:86});console.log('shot',opt,name);};
    await shot('1-walk',{x:1300,z:-390,zoom:3.6,pitch:14,shift:.13},WIDE);
    await shot('2-walk-phone',{x:1300,z:-390,zoom:3.6,pitch:14,shift:.13},PHONE);
    await shot('3-bay',{x:1300,z:-1000,zoom:1.15,yaw:.04,pitch:8,shift:.08},WIDE);
    // the layout from straight overhead: no fog, no sky, north up
    await E(()=>{camera.clearViewOffset();scene.fog=null;OD.sky.visible=false;camera.far=40000;camera.updateProjectionMatrix();const keep=window.updateCamera;
      window.updateCamera=function(){camera.up.set(0,0,-1);camera.position.set(1000,10200,-2750);camera.lookAt(1000,0,-2750);camera.updateMatrixWorld();};});
    await page.waitForTimeout(200);await E(()=>{updateCamera();render(.016,simT);});await page.waitForTimeout(400);await E(()=>render(.016,simT));await page.waitForTimeout(250);
    await page.screenshot({path:path.join(O,`ocean-${opt}-4-overhead.jpg`),type:'jpeg',quality:86});console.log('shot',opt,'4-overhead');
    console.log('info',opt,JSON.stringify(await E(()=>({lh:OD.lh,strips:OD.strips.length,dist0:Math.round(dist0)}))));
    await page.close();}
  console.log('errors',JSON.stringify(errors.slice(0,5)));await b.close();srv.close();})().catch(e=>{console.log('CRASH',e.message);process.exit(1);});

// Renders the Queen drafts with the game's own renderer, lights and post-processing (queen-page.js has the options): from the 'road'
// checkpoint, the squad on the bridge in sight of the tunnel, and the things going in over the headwall, as the game does it now
// (road.js's centiStart) and as options A and B; the game's own camera at that moment, a little higher ('game': road.js's 'see'
// phase) and a closer look from higher up and to the side ('close': the hill over the mouth, where the legs used to come through). Frames into
// <outdir>/queen-frames/<opt>-<shot>-NNN.jpg (FPS a second, film grain off so the animations stay small); compose.py makes the
// GIFs and sheets. Setup once: npm i three@0.128.0 playwright (or THREE=path/to/three.min.js). Run: node queen.js [outdir]
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const REPO=path.resolve(process.env.REPO||path.join(__dirname,'../..')),THREE_SRC=fs.readFileSync(process.env.THREE||require.resolve('three/build/three.min.js'));
const O=path.resolve(process.argv[2]||path.join(REPO,'docs/drafts')),FR=path.join(O,'queen-frames');fs.mkdirSync(FR,{recursive:true});
const serve=port=>new Promise(r=>{const srv=http.createServer((q,res)=>{const f=path.join(REPO,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(port,()=>r(srv));});
const OPTS=(process.env.OPTS||'now,A,B').split(','),SHOTS=(process.env.SHOTS||'game,close').split(','),FPS=+process.env.FPS||8,DUR=+process.env.DUR||14,DPR=+process.env.DPR||1;
const CAMS={game:'({x:HILL_X+8,z:-280,zoom:frameZoom(220,170,.42),yaw:-Math.PI/2,tilt:.42,shift:.12})',   // road.js's view of the mouth from the bridge, a little higher (the top of the headwall cut it off)
  close:'({x:HILL_X+23,z:-288,zoom:4.2,yaw:-1.1,tilt:.05})'};   // from higher up and to the side: the hill over the mouth (worked out in the page: frameZoom needs its camera)
(async()=>{const port=+process.env.PORT||9718,srv=await serve(port),b=await chromium.launch(),errors=[];
  const page=await b.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
  await page.goto(`http://localhost:${port}/warehouse-yard.html`);await page.waitForTimeout(2500);const E=(f,a)=>page.evaluate(f,a);
  await page.addScriptTag({path:path.join(__dirname,'queen-page.js')});
  await E(()=>{POST.tier=2;startCheckpoint('road');});
  for(let k=0;k<80;k++){await page.waitForTimeout(100);if(await E(()=>!!(typeof road!=='undefined'&&road&&road.open&&EAST.grp&&state==='play')))break;}
  await page.waitForTimeout(600);
  await E(DPR=>{window.requestAnimationFrame=()=>0;$('#fade').classList.remove('on');$('#fade').hidden=true;fading=false;$('#banner').classList.remove('show');$('#app').classList.add('cine');base={cine:true};
    if(POST.M&&POST.M.final)POST.M.final.uniforms.grain.value=0;select([]);
    if(DPR!==1){Object.defineProperty(window,'devicePixelRatio',{get:()=>DPR,configurable:true});resize();}   // (drawn smaller and scaled up: software WebGL is slow)
    players.forEach((p,i)=>{p.x=1500-Math.floor(i/2)*24;p.y=-275+(i%2?16:-16);p.ang=0;p.path=[];});},DPR);
  for(const opt of OPTS)for(const shot of SHOTS){if(opt==='now'&&shot!=='game'&&!process.env.ALL)continue;   // (the game as it is: its own camera is enough)
    await E(([opt,cam])=>{qnClear();centiHide();camPan=null;const C=(0,eval)(cam);camT={x:C.x,z:C.z};zoom=C.zoom;yaw=C.yaw;tilt=C.tilt;camShift=C.shift||0;clampCam();updateCamera();
      if(opt==='now')centiStart();else qnStart(opt);},[opt,CAMS[shot]]);
    let i=0;for(;i<DUR*FPS;i++){
      const more=await E(([opt,dt])=>{const n=Math.ceil(dt*60-1e-6);for(let k=0;k<n;k++){update(dt/n);if(opt!=='now')qnTick(dt/n);}players.forEach(p=>{p.ang=0;});
        return opt==='now'?centiOn():QN.on;},[opt,1/FPS]);
      await E(()=>render(.016,simT));await page.waitForTimeout(120);await E(()=>render(.016,simT));await page.waitForTimeout(60);
      await page.screenshot({path:path.join(FR,`${opt}-${shot}-${String(i).padStart(3,'0')}.jpg`),type:'jpeg',quality:88});
      if(!more&&i>FPS*1.5)break;}
    console.log(opt,shot,'frames',i+1,JSON.stringify(await E(()=>({cs:QN.cs.map(C=>C.done?'done':Math.round(qnDepAt(C.path,C.pos)))}))));
  }
  console.log('errors',JSON.stringify(errors.slice(0,5)));await b.close();srv.close();})().catch(e=>{console.log('CRASH',e.message);process.exit(1);});

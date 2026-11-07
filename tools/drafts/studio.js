// Renders the monster and Headquarters drafts (docs/drafts) with the game's own renderer, lights and post-processing.
// Setup once, here: npm i three@0.128.0 playwright   (Chromium as Playwright installs it, or the one in the environment)
// Run: node studio.js shots.js out      (a 'gate' save takes the squad straight into the Headquarters)
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const REPO=path.resolve(__dirname,'../..'),THREE_SRC=fs.readFileSync(require.resolve('three/build/three.min.js'));
const shots=require(path.resolve(process.argv[2]||'shots.js')),O=process.argv[3]||'out';fs.mkdirSync(O,{recursive:true});
const serve=port=>new Promise(r=>{const srv=http.createServer((q,res)=>{const f=path.join(REPO,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(port,()=>r(srv));});
(async()=>{const port=9711,srv=await serve(port),b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const page=await b.newPage({viewport:{width:430,height:860}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
  await page.goto(`http://localhost:${port}/warehouse-yard.html`);await page.waitForTimeout(2500);const E=(f,a)=>page.evaluate(f,a);
  await E(()=>{const k=(spec,specN)=>({dead:false,hp:100,grenade:1,spec,specN});
    localStorage.setItem('warehouseYard.save.v3',JSON.stringify({v:3,stage:'gate',cleared:[0,1,2,3],when:Date.now(),alert:0,sci:2,squad:{A1:k('smoke',1),A2:k('medkit',1),B1:k('rpg',2),B2:k('medkit',1)}}));continueGame();});
  await page.waitForTimeout(800);await E(()=>{players.filter(alive).forEach((p,i)=>{p.x=800+(i%4)*28;p.y=-535;p.path=[];});monGateTap(850,-520);});await page.waitForTimeout(1600);
  await page.addScriptTag({path:path.join(REPO,'js/creatures.js')});await page.addScriptTag({path:path.join(__dirname,'studio-page.js')});
  const w=shots.w||1280,h=shots.h||720;await page.setViewportSize({width:w,height:h});await E(([w,h,pr])=>{studioSetup();studioSize(w,h,pr);},[w,h,shots.pr||1]);
  if(shots.setup)await E(shots.setup);
  for(const s of shots.list){await E(s.pose||(()=>0));
    if(s.game)await E(g=>{camT={x:g.x,z:g.z};zoom=g.zoom;yaw=g.yaw||0;tilt=g.tilt||0;if(typeof clampCam==='function')clampCam();for(let i=0;i<4;i++)render(.016,simT);},s.game);
    else if(s.set)await E(o=>studioShotIn(ST.set,o),s.cam);else await E(o=>studioShot(o),s.cam);
    await page.screenshot({path:`${O}/${s.name}.png`,clip:{x:0,y:0,width:w,height:h}});console.log('shot',s.name);}
  console.log('errors',JSON.stringify(errors));await b.close();srv.close();})();

// Renders the bridge drafts (docs/drafts/bridge-*.jpg) with the game's own renderer, lights and post-processing: the road east from the
// 'road' checkpoint, the water let down (WATER, below), the south side as a dockyard, then each bridge type from three cameras.
// Setup once: npm i three@0.128.0 playwright (or THREE=path/to/three.min.js). Run: node bridges.js [outdir] (default docs/drafts)
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const REPO=path.resolve(__dirname,'../..'),THREE_SRC=fs.readFileSync(process.env.THREE||require.resolve('three/build/three.min.js'));
const O=path.resolve(process.argv[2]||path.join(REPO,'docs/drafts'));fs.mkdirSync(O,{recursive:true});
const WATER=-34;   // (3.4 m below the deck: the game's is 1 m)
const KINDS=[['A','concrete'],['B','truss'],['C','stone'],['D','lift']];
const CAMS=[['1',{x:1300,z:-292,zoom:1.7,yaw:-.62,tilt:.5}],['2',{x:1330,z:-280,zoom:4.4,yaw:-.3,tilt:1}],['3',{x:1470,z:-262,zoom:2.6,yaw:0,tilt:0}]];   // along it from the gate; low over the dock basin, its side; the game's camera
const serve=port=>new Promise(r=>{const srv=http.createServer((q,res)=>{const f=path.join(REPO,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(port,()=>r(srv));});
(async()=>{const port=+process.env.PORT||9712,srv=await serve(port),b=await chromium.launch();
  const page=await b.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
  await page.goto(`http://localhost:${port}/warehouse-yard.html`);await page.waitForTimeout(2500);const E=(f,a)=>page.evaluate(f,a);
  await E(w=>{POST.tier=2;WATER_Y=w;startCheckpoint('road');},WATER);await page.waitForTimeout(1500);
  await page.addScriptTag({path:path.join(__dirname,'bridges-page.js')});
  await E(()=>{window.requestAnimationFrame=()=>0;$('#banner').classList.remove('show');$('#app').classList.add('cine');base={cine:true};dockDraft();});   // (no HUD over the pictures)
  for(const[L,kind]of KINDS){await E(k=>bridgeDraft(k),kind);
    for(const[n,c]of CAMS){await E(c=>{camPan=null;camT={x:c.x,z:c.z};zoom=c.zoom;yaw=c.yaw;tilt=c.tilt;clampCam();updateCamera();syncUnits(simT);render(.016,simT);},c);
      await page.waitForTimeout(400);await E(()=>render(.016,simT));await page.waitForTimeout(250);
      await page.screenshot({path:path.join(O,`bridge-${L}-${kind}-${n}.jpg`),type:'jpeg',quality:84});console.log('shot',L,kind,n);}}
  console.log('errors',JSON.stringify(errors.slice(0,5)));await b.close();srv.close();})().catch(e=>{console.log('CRASH',e.message);process.exit(1);});

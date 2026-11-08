// Renders the run drafts with the game's own renderer, lights and post-processing (run-page.js has the options): from the 'road'
// checkpoint, a soldier running east along the bridge, close up from the side (one stride, frames at even steps of it), and the
// squad running two by two at the game's own camera for the first walk across. Frames into <outdir>/run-frames/<opt>-<shot>-NN.jpg;
// compose.py makes the GIFs and the sheet. Setup once: npm i three@0.128.0 playwright (or THREE=path/to/three.min.js).
// Run: node run.js [outdir] (default docs/drafts)
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const REPO=path.resolve(process.env.REPO||path.join(__dirname,'../..')),THREE_SRC=fs.readFileSync(process.env.THREE||require.resolve('three/build/three.min.js'));
const O=path.resolve(process.argv[2]||path.join(REPO,'docs/drafts')),FR=path.join(O,'run-frames');fs.mkdirSync(FR,{recursive:true});
const serve=port=>new Promise(r=>{const srv=http.createServer((q,res)=>{const f=path.join(REPO,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(port,()=>r(srv));});
const OPTS=(process.env.OPTS||'now,A,B').split(','),N=+process.env.N||16;
(async()=>{const port=+process.env.PORT||9716,srv=await serve(port),b=await chromium.launch(),errors=[];
  const page=await b.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
  await page.goto(`http://localhost:${port}/warehouse-yard.html`);await page.waitForTimeout(2500);const E=(f,a)=>page.evaluate(f,a);
  await page.addScriptTag({path:path.join(__dirname,'run-page.js')});
  await E(()=>{POST.tier=2;startCheckpoint('road');});
  for(let k=0;k<80;k++){await page.waitForTimeout(100);if(await E(()=>!!(typeof road!=='undefined'&&road&&road.open&&EAST.grp&&state==='play')))break;}
  await page.waitForTimeout(600);
  await E(()=>{window.requestAnimationFrame=()=>0;$('#fade').classList.remove('on');$('#fade').hidden=true;fading=false;$('#banner').classList.remove('show');$('#app').classList.add('cine');base={cine:true};
    window.RUN_CAM=null;const up0=window.updateCamera;window.updateCamera=function(){const c=window.RUN_CAM;if(!c)return up0();   // (the close-up: the camera on him from the side, a little above)
      const p=c.pitch*Math.PI/180,az=c.az||0,hd=c.d*Math.cos(p);camera.clearViewOffset();camera.position.set(c.x+Math.sin(az)*hd,c.h+c.d*Math.sin(p),c.z+Math.cos(az)*hd);camera.lookAt(c.x,c.h,c.z);camera.updateMatrixWorld();};
    select([]);});
  const snap=async f=>{await E(()=>render(.016,simT));await page.waitForTimeout(160);await E(()=>render(.016,simT));await page.waitForTimeout(90);await page.screenshot({path:f,type:'jpeg',quality:88});};
  // the close-up: A1 alone (the rest well back), running east; a frame at each sixteenth of his stride; from the side (the way the
  // game sees them on the walk across) and from three-quarters in front
  for(const view of[{k:'close',az:0,pitch:12},{k:'front',az:.85,pitch:14}])for(const opt of OPTS){
    await E(o=>{RUN.opt=o;const P=players;P.forEach((p,i)=>{p.path=[];p.x=1080+i*6;p.y=-300+i*8;p.ang=0;});const a=P[0];a.x=1296;a.y=-284;a.ang=0;a.gaitForce="run";a.path=[{x:1640,y:-284}];
      for(let k=0;k<70;k++){update(1/60);syncUnits(simT);}},opt);   // (a second and more to get up to speed and settle)
    const got=await E(N=>({start:Math.ceil(players[0].m.fig.phase*N)%N}),N);
    for(let i=0;i<N;i++){   // (step finely and stop at each sixteenth of the stride: the loop closes on itself)
      await E(([i,N,s,view])=>{const a=players[0],F=a.m.fig,want=((s+i)%N)/N;let g=0;
        while(g++<400){const before=F.phase;update(1/240);syncUnits(simT);const now=F.phase,crossed=before<=now?(before<want&&now>=want):(want>before||want<=now);if(crossed)break;}
        window.RUN_CAM={x:a.x+1,z:a.y,h:9.5,d:58,pitch:view.pitch,az:view.az};},[i,N,got.start,view]);
      await snap(path.join(FR,`${opt}-${view.k}-${String(i).padStart(2,'0')}.jpg`));}
    console.log(view.k,opt,JSON.stringify(await E(()=>({x:Math.round(players[0].x),spd:Math.round(players[0].m.fig.spd),gait:gaitOf(players[0])}))));
  }
  // the game's camera for the first walk across (road.js's ROAD_LOOK: zoom 3.6, its lowest angle, the picture moved down), the
  // four two by two: 1.5 s at 20 frames a second
  for(const opt of OPTS){
    await E(o=>{RUN.opt=o;window.RUN_CAM=null;players.forEach((p,i)=>{p.x=1290-Math.floor(i/2)*24;p.y=-275+(i%2?16:-16);p.ang=0;p.gaitForce='run';p.path=[{x:1640-Math.floor(i/2)*24,y:p.y}];});
      for(let k=0;k<70;k++){update(1/60);syncUnits(simT);}},opt);
    for(let i=0;i<30;i++){
      await E(()=>{for(let k=0;k<3;k++){update(1/60);syncUnits(simT);}const m=players.reduce((s,p)=>s+p.x,0)/players.length;
        camPan=null;camT={x:m+30,z:ROAD_LOOK.z};zoom=ROAD_LOOK.zoom;yaw=0;tilt=basePitch()-14*Math.PI/180;camShift=ROAD_LOOK.shift;});
      await snap(path.join(FR,`${opt}-game-${String(i).padStart(2,'0')}.jpg`));}
    console.log('game',opt);
  }
  console.log('errors',JSON.stringify(errors.slice(0,5)));await b.close();srv.close();})().catch(e=>{console.log('CRASH',e.message);process.exit(1);});

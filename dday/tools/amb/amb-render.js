// Offline renders of D-Day's sound (the whole mix, and ddamb.js's bed alone) in the page: AC swapped for an OfflineAudioContext with
// four channels (0-1 the mix after the master compressor, 2-3 the bed's bus), the game stepped one audio frame (32 ms) at a time from
// OfflineAudioContext.suspend. node amb-render.js PO OUTDIR [SEGS] [SEED]   (DDROOT=<dday folder>). Writes OUTDIR/<seg>.f32 (4ch, 44.1k)
const {chromium}=require('playwright');const SP='/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad';
const {serve,open}=require(SP+'/harness.js');const fs=require('fs');
const LV=process.env.LV?JSON.parse(process.env.LV):null,SOLO=process.env.SOLO||'';
const PO=+process.argv[2]||60,OUT=process.argv[3]||'.',SEGS=(process.argv[4]||'ride,beach,top,village,counter').split(','),SEED=+process.argv[5]||4242,SR=44100;
const SETUP={
  ride:{secs:22,fn:`()=>{startDDay();}`},
  beach:{secs:24,fn:`()=>{startDDay();let n=0;while(!dd.land.done&&n++<800)RUN(.25);RUN(6);}`},
  top:{secs:24,fn:`()=>{startDDay();let n=0;while(!dd.land.done&&n++<800)RUN(.25);RUN(2);dd.front=Math.min(dd.front,-460);PUT('A',560,-500);PUT('B',640,-480);ddGoSquad('A');RUN(3);}`},
  village:{secs:26,fn:`()=>{startVillage({skip:true});RUN(3);const V=dd.vg;V.ph='village';V.vT=V.t-25.6;PUT('A',700,-420);PUT('B',780,-410);ddGoSquad('A');RUN(.5);}`},
  counter:{secs:24,fn:`()=>{ddRoster=ddRoster||ddmRead();ddRoster.stage=1;ddmSave();startCounter();for(let i=0;i<20&&!(dd&&dd.dc);i++)RUN(.25);for(let i=0;i<120&&dd.dc&&!/^w/.test(dd.dc.ph);i++)RUN(.5);RUN(3);}`},
  events:{secs:18,fn:`()=>{startDDay();let n=0;while(!dd.land.done&&n++<800)RUN(.25);RUN(6);}`,after:`(k,FR)=>{if(k===3){ddA.ev.air=ddA.bt+.5;ddA.ev.nav=ddA.bt+7;ddA.ev.mg=ddA.ev.rf=ddA.ev.art=1e9;}}`},
  woods:{secs:22,fn:`()=>{startVillage({skip:true});RUN(2);}`},
  seq:{secs:16,fn:`()=>{startVillage();RUN(1);}`},
  pause:{secs:10,fn:`()=>{startDDay();let n=0;while(!dd.land.done&&n++<800)RUN(.25);RUN(4);}`,after:`(k,FR)=>{if(Math.abs(k*FR-4)<FR/2)paused=true;if(Math.abs(k*FR-7)<FR/2)paused=false;}`},
  shore:{secs:30,fn:`()=>{startDDay();let n=0;while(!dd.land.done&&n++<800)RUN(.25);RUN(2);}`,after:`(k,FR)=>{camT.x=700;camT.z=Math.max(330,690-k*FR*12);}`},
  mute:{secs:14,fn:`()=>{startDDay();let n=0;while(!dd.land.done&&n++<800)RUN(.25);RUN(4);}`,after:`(k,FR)=>{if(Math.abs(k*FR-3)<FR/2)setSound(false);if(Math.abs(k*FR-9)<FR/2)setSound(true);}`},
  menu:{secs:8,fn:`()=>{startDDay();RUN(2);}`,after:`(k,FR)=>{if(Math.abs(k*FR-3)<FR/2){dd.won=true;ddFinish();}}`},
};
(async()=>{fs.mkdirSync(OUT,{recursive:true});const port=9700+PO,srv=await serve(process.env.DDROOT||SP+'/wt/amb/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:390,height:760});
await page.evaluate((seed)=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(seed);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.STEP=dt=>{const ts=state==='play'?timeScale():0;if(state==='play'&&ts>0)update(dt*ts);panTick(dt);if(state==='play'){updateCamera();if(DD)ddFrame(dt,simT);}CLK+=dt;};
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);updateCamera();if(DD)ddFrame(1/30,simT);CLK+=1/30;}};
  window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'&&!t.npc?undefined:d0(t,d,s);   // (the squads kept alive)
  window.SQ=t=>players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);
  window.PUT=(t,x,y)=>{const L=SQ(t);L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};
},SEED);
for(const name of SEGS){const S=SETUP[name];const t0=Date.now();
  const res=await page.evaluate(async([secs,fn,after,SR,LV,SOLO])=>{
    if(LV)Object.assign(DDA.lv,LV);if(SOLO){const G={wind:['wind'],surf:['surf'],boat:['diesel','chorus','slap','sea'],battle:['mg','rifle','art','naval','shell','roar','gun'],birds:['birds'],air:['air'],eng:['tank','track','truck'],fire:['fire']};window.LV0=window.LV0||{...DDA.lv};for(const k in DDA.lv)DDA.lv[k]=G[SOLO].includes(k)?LV0[k]:0;}
    const off=new OfflineAudioContext(4,Math.ceil(SR*secs),SR);
    AC=null;ddA=null;loops={};rainG=[];samples={};window.AudioContext=function(){return off;};window.webkitAudioContext=window.AudioContext;
    audioInit();await new Promise(r=>setTimeout(r,1500));
    ddAmbBuild();for(let i=0;i<3000&&ddA.bi<DDA_BUILD.length;i++)ddaBuildStep();for(let i=0;i<80&&!(ddA.wash&&ddA.farRec&&ddA.water&&ddA.birds&&DSFX.buf.usfar&&DSFX.buf.karfar);i++)await new Promise(r=>setTimeout(r,100));for(let i=0;i<600&&!ddA.roar;i++)ddaBuildStep();
    const sp=off.createChannelSplitter(2),mg=off.createChannelMerger(4);ddA.bus.connect(sp);sp.connect(mg,0,2);sp.connect(mg,1,3);mg.connect(off.destination);
    (new Function('return ('+fn+')'))()();const af=after?(new Function('return ('+after+')'))():null;
    const FR=1536/SR,log=[];let k=0;
    const cb=()=>{STEP(FR);k++;if(af)af(k,FR);try{audioFrame();}catch(e){log.push('audioFrame: '+e.message);}
      if(k%31===0)log.push({t:+(k*FR).toFixed(1),st:state,mode:ddA&&ddA.dd?(dd.seq?'seq':dd.vil?'vil':dd.counter?'ctr':dd.land.done?'beach':'ride'):'-',I:ddA?+ddA.I.toFixed(2):0,n:ddA?ddA.n:0,cz:Math.round(camT.z),tanks:(dd&&dd.tanks||[]).filter(K=>K.hp>0).map(K=>Math.round(hyp(K.x-camT.x,K.y-camT.z))),trucks:(dd&&dd.vg&&dd.vg.trucks||[]).map(K=>K.ph+':'+Math.round(hyp(K.x-camT.x,K.y-camT.z))),gust:ddA?+ddA.gust.toFixed(2):0,roar:ddA&&ddA.roar?(ddA.roarRec?"rec":"syn"):0,calm:ddA&&ddA.calm!=null?+ddA.calm.toFixed(2):null,water:!!(ddA&&ddA.water)});
      const nt=(k+1)*FR;if(nt<secs-FR)off.suspend(nt).then(cb);off.resume();};
    off.suspend(FR).then(cb);const buf=await off.startRendering();
    const n=buf.length,o=new Float32Array(n*4);for(let c=0;c<4;c++){const d=buf.getChannelData(c);for(let i=0;i<n;i++)o[i*4+c]=d[i];}
    const u8=new Uint8Array(o.buffer);let s='';for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));
    return{b64:btoa(s),log};
  },[S.secs,S.fn,S.after||null,SR,LV,SOLO]);
  const nm=name+(SOLO?'-'+SOLO:'');fs.writeFileSync(`${OUT}/${nm}.f32`,Buffer.from(res.b64,'base64'));fs.writeFileSync(`${OUT}/${nm}.log`,res.log.map(x=>JSON.stringify(x)).join('\n'));
  console.log(name,'rendered',((Date.now()-t0)/1000).toFixed(0)+'s',res.log.filter(x=>typeof x==='string').slice(0,3));}
console.log('errors',errors.length,errors.slice(0,6));await b.close();srv.close();})();

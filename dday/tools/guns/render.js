// Offline render of D-Day's sound (Version 188, the guns unit): the page's own audio graph built on an OfflineAudioContext,
// the game stepped in virtual time at each suspend, setTimeout replaced by a queue on the same clock.
// node render.js PO SCENE SECS OUT.wav   (SCENE: unit | ride | beach | top | counter | village)   DDROOT: the dday folder to serve
const {chromium}=require('playwright');const {serve,open}=require('/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const SOLO=process.env.SOLO||'',NOBED=!!process.env.NOBED,PO=+process.argv[2]||0,SC=process.argv[3]||'unit',SECS=+process.argv[4]||20,OUT=process.argv[5]||'out.wav';
(async()=>{const port=9700+PO,srv=await serve(process.env.DDROOT,port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:390,height:760});
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');localStorage.setItem('warehouseYard.sound','on');
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4242);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.STEP=dt=>{const ts=timeScale();if(ts>0)update(dt*ts);panTick(dt);if(typeof ddFrame==='function'&&MAPID==='dd')ddFrame(dt,simT);CLK+=dt;};
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++)STEP(1/30);};
  window.SAFE=1;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'&&!t.npc?undefined:d0(t,d,s);
  window.SQ=t=>players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);
  window.PUT=(t,x,y)=>{const L=SQ(t);L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};});
// the scene up to where the recording starts
if(['ride','beach','top','unit','show'].includes(SC)){await page.click('#ddBtn');await page.waitForTimeout(400);}
if(SC==='unit'||SC==='show')await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.25);RUN(.6);});
if(SC==='beach')await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.25);RUN(.6);PUT('A',700,560);PUT('B',820,580);selectTeam('A');dd.active='A';RUN(4);});
if(SC==='top')await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.25);RUN(.6);dd.front=Math.min(dd.front,-460);PUT('A',560,-500);PUT('B',640,-480);ddGoSquad('A');RUN(3);});
if(SC==='counter'){await page.click('#ddBtn');await page.waitForTimeout(400);await ev(()=>{ddRoster.stage=1;ddmSave();startCounter();});await page.waitForTimeout(500);await ev(()=>{RUN(4);});await ev(()=>{const C=dd.dc;if(C&&C.ph!=='fight'){for(let i=0;i<160&&dd.dc.ph!=='fight';i++)RUN(.5);}RUN(8);});}
if(SC==='village'){await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(500);await ev(()=>RUN(10));}
// the offline context, the samples loaded into it
await ev(SECS=>{const OC=window.OfflineAudioContext;window.AudioContext=function(){return new OC(2,Math.ceil(44100*SECS),44100);};window.webkitAudioContext=undefined;
  if(AC&&AC.close)AC.close();AC=null;samples={};loops={};rainG=[];voices=0;DSFX.buf={};DSFX.live.length=0;sndOn=true;audioInit();},SECS);
if(process.env.NOBED==='wind')await ev(()=>{amb.wg.disconnect();});   // (the wind alone off: engines and everything else as they are)
else if(NOBED)await ev(()=>{amb.wg.disconnect();amb.hum.disconnect();amb.dr.disconnect();for(const[g]of rainG)g.disconnect();window.setLoop=()=>{};if(typeof ddAmbFrame==='function')window.ddAmbFrame=()=>{};});   // (the sound bed off: only what the guns unit makes, and the people)
await page.waitForFunction(()=>DSFX.buf.xgun&&DSFX.buf.xmid&&DSFX.buf.xfrag&&Object.keys(DSFX.buf).length>=15&&samples.boom&&samples.boom.length>=2&&samples.hit_ground,null,{timeout:30000,polling:200});
const res=await ev(async({SC,SECS,SOLO})=>{
  window.CNT={};const wrap=n=>{const f=window[n];window[n]=function(...a){const k=n+(n==='playSample'?':'+a[0]:n==='noiseHit'||n==='toneHit'?':'+((new Error().stack.split('\n')[2]||'').trim().split(' ')[1]):n==='setLoop'?':'+a[0]+(a[1]>0?'+':'0'):n==='ddsImpact'?':'+(a[2]||'?'):n==='ddsShot'?':'+ddsGun(a[0])+(a[0].id?'':'(fake)'):'');CNT[k]=(CNT[k]||0)+1;return f.apply(this,a);};};
  for(const n of['ddsShot','ddsBoom','ddsImpact','sfxRicochet','ddsCrack','ddsWhistle','ddsCannon','ddsTube','ddsLoose','playSample','noiseHit','toneHit','setLoop','sfxFlesh','sfxGrunt','sfxScream','sfxBodyFall','ddsBurst'])wrap(n);
  window.PPL=[];if(window.ddsSample){const os=ddsSample;window.ddsSample=function(kind,list,x,y,vol,rate){const C=DSFX.cat['p_'+kind],n0=C?C.length:0,l0=C?C.last:0;const r=os.apply(this,arguments);const C2=DSFX.cat['p_'+kind];if(r!=null)PPL.push([kind,Math.round(ddsPlace(x,y).d),C2&&C2.last!==l0?1:0,+(VT||0).toFixed(1)]);return r;};}
  const oo=ddsOut;window.ddsOut=function(...a){const r=oo.apply(this,a);CNT[r?'out:ok':'out:drop']=(CNT[r?'out:ok':'out:drop']||0)+1;return r;};
  if(SOLO){const keep=SOLO.split(','),cat=k=>k.startsWith('ddsShot')?(/mg/.test(k)?'mg':/kar|mp40|ksnip/.test(k)?'E':'P'):/ddsBoom|ddsCannon|ddsWhistle|ddsTube|rumble/.test(k)?'boom':/ddsImpact|sfxRicochet|ddsCrack|ddsRamp/.test(k)?'hit':'old';
    for(const n of['ddsShot','ddsBoom','ddsCannon','ddsWhistle','ddsTube','ddsImpact','ddsCrack','sfxFlesh','sfxGrunt','sfxScream','sfxBodyFall','rumble','sfxPain','sfxFear','sfxRicochet','ddsRamp']){const f=window[n];window[n]=function(...a){const k=n+(n==='ddsShot'?':'+ddsGun(a[0]):'');if(!keep.includes(cat(k)))return n==='ddsShot'?true:undefined;return f.apply(this,a);};}}
  // virtual timers on the audio clock
  const Q=[];let VT=0;window.setTimeout=(f,ms)=>{Q.push({at:VT+(ms||0)/1000,f});return Q.length;};
  const due=()=>{for(let i=0;i<Q.length;i++)if(Q[i].at<=VT){const q=Q.splice(i,1)[0];i--;try{q.f();}catch(e){}}};
  const dt=1/30,ctx=AC,log=[];
  const at=(t,f)=>log.push({t,f});
  if(SC==='unit'){   // every sound alone, the camera parked on the beach
    const C={x:700,z:560};camT.x=C.x;camT.z=C.z;for(const[g]of rainG)g.gain.value=0;if(amb){amb.wg.gain.value=0;amb.hum.gain.value=0;amb.dr.gain.value=0;}
    const man=(o)=>Object.assign({id:'T'+Math.random(),x:C.x,y:C.z,side:'P',weapon:'rifle',team:'A'},o);
    const near={x:C.x+40,y:C.z-60},far={x:C.x+80,y:C.z-450};
    let t=.3;const step=(d,f)=>{at(t,f);t+=d;};
    for(const[w,o]of[['m1',{}],['bar',{weapon:'hmg'}],['spring',{weapon:'sniper'}],['kar',{side:'E',id:'G1'}],['mp40',{side:'E',id:'G4'}],['ksnip',{side:'E',weapon:'sniper',id:'G2'}],['mg',{side:'E',gunner:true,id:'G3'}]]){
      step(1.4,()=>{simT+=1;ddsShot(man({...near,...o,id:o.id||'P'+w}));});step(1.8,()=>{simT+=1;ddsShot(man({...far,...o,id:(o.id||'P'+w)+'f'}));});}
    const u8=man({...near,id:'P8'});for(let k=0;k<3;k++)step(.9,()=>{simT+=1;ddsShot(u8);});   // the Garand's ping on the eighth
    ['frag','mortar','art','tank','big','rocket'].forEach((k,j)=>step(3,()=>{const x=near.x+j*.01;if(k==='rocket')DSFX.rk.push({x,y:near.y,ddsGone:1});else if(k!=='big')DSFX.trk.push({x1:x,y1:near.y,ddsK:k});ddsBoom(x,near.y,k==='big'?1.4:1);}));
    step(3.5,()=>ddsBoom(far.x,far.y,1));step(3,()=>ddsBoom(C.x+50,760,1));step(3,()=>ddsCannon(near.x,near.y));
    step(3,()=>{const n={x0:C.x,y0:-300,x1:C.x+30,y1:C.z-40,t:0,dur:1.4,ddsK:'art',R:54};ddsWhistle(n);setTimeout(()=>{DSFX.trk.push(n);ddsBoom(n.x1,n.y1,1);},1400);});
    step(3,()=>{const n={x0:C.x,y0:-300,x1:C.x-60,y1:C.z+20,t:0,dur:1.0,ddsK:'mortar',R:50};ddsTube(C.x+300,C.z-700);ddsWhistle(n);setTimeout(()=>{DSFX.trk.push(n);ddsBoom(n.x1,n.y1,1);},1000);});
    for(let k=0;k<6;k++)step(.18,()=>ddsCrack({t:{x:C.x+10,y:C.z+10},at:simT}));
    t+=1;for(const m of['sand','sand','stone','stone','wood','metal'])step(.5,()=>ddsImpact(C.x+20,C.z+30,m));
  }
  if(SC==='show'){   // a short staged exchange for the demo reel: both sides' guns, the bunker's gun, shells, a grenade, a tank, the sea
    const C={x:700,z:560};camT.x=C.x;camT.z=C.z;for(const[g]of rainG)g.gain.value=0;if(amb){amb.wg.gain.value=0;amb.hum.gain.value=0;amb.dr.gain.value=0;}
    const man=(o)=>Object.assign({x:C.x,y:C.z,side:'P',weapon:'rifle',team:'A'},o);
    const us=[man({id:'P1',x:C.x-30,y:C.z+10}),man({id:'P2',x:C.x+25,y:C.z+15}),man({id:'P3',x:C.x+5,y:C.z+30,weapon:'hmg'}),man({id:'P4',x:C.x-10,y:C.z+20,weapon:'sniper'})];
    const them=[man({id:'G1',side:'E',x:C.x-120,y:C.z-380}),man({id:'G4',side:'E',x:C.x+90,y:C.z-300}),man({id:'G3',side:'E',gunner:true,x:C.x+150,y:C.z-420}),man({id:'G0',side:'E',x:C.x-40,y:C.z-260})];
    const sh=(t,u)=>at(t,()=>{simT+=.6;ddsShot(u);});
    for(let k=0;k<3;k++)sh(.3+k*1.05,us[0]);sh(.8,them[0]);sh(1.6,them[1]);sh(2.2,us[1]);sh(2.9,us[2]);sh(3.4,them[0]);
    for(let k=0;k<4;k++)sh(4.2+k*.75,them[2]);sh(5.0,us[3]);sh(5.9,them[3]);sh(6.4,us[2]);sh(7.1,us[0]);sh(7.6,them[1]);
    for(let k=0;k<5;k++)at(4.6+k*.21,()=>ddsCrack({t:{x:C.x+10,y:C.z+10},at:simT}));
    for(const[k,m]of[[0,'sand'],[1,'sand'],[2,'metal'],[3,'sand']])at(5.2+k*.33,()=>ddsImpact(C.x+20+k*10,C.z+30,m));
    const shell=(t,dx,dz,dur,K)=>at(t,()=>{const n={x0:C.x,y0:-300,x1:C.x+dx,y1:C.z+dz,t:0,dur,ddsK:K,R:54};if(K==='mortar')ddsTube(C.x+260,C.z-700);ddsWhistle(n);setTimeout(()=>{DSFX.trk.push(n);ddsBoom(n.x1,n.y1,1);},dur*1000);});
    shell(8.2,60,-120,1.6,'art');for(let k=0;k<3;k++)sh(10.3+k*.6,them[2]);sh(10.6,us[0]);sh(11.4,us[1]);
    at(12.2,()=>{DSFX.trk.push({x1:C.x-70,y1:C.z-150,ddsK:'frag'});ddsBoom(C.x-70,C.z-150,1);});sh(12.9,them[3]);sh(13.5,us[2]);
    const tk={x:C.x+260,y:C.z-560};at(14.6,()=>{dd.tanks=dd.tanks||[];dd.tanks.push(tk);ddsCannon(tk.x,tk.y);});
    at(15.4,()=>{DSFX.trk.push({x1:C.x+40,y1:C.z-100,ddsK:'tank'});ddsBoom(C.x+40,C.z-100,1);});sh(16.1,us[3]);sh(16.6,them[0]);for(let k=0;k<3;k++)sh(17+k*.5,them[2]);
    shell(18.2,-80,-60,1.0,'mortar');sh(19.6,us[0]);sh(20.2,us[1]);
    at(20.6,()=>ddsBoom(C.x+120,760,1));at(21.8,()=>ddsBoom(C.x-200,C.z-900,1.3));sh(22.4,us[2]);sh(23,them[1]);
  }
  // run: the game steps (or the scripted events) at every suspend
  let k=0;const N=Math.floor(SECS/dt)-2;
  const tick=()=>{VT=k*dt;
    if(SC==='unit'||SC==='show'){for(const e of log)if(!e.done&&e.t<=VT){e.done=1;e.f();}}
    else{STEP(dt);audioFrame();}
    due();};
  const go=()=>{if(k>=N)return;ctx.suspend((k+1)*dt).then(()=>{k++;try{tick();}catch(e){log.push({err:String(e)});}go();ctx.resume();});};
  go();const buf=await ctx.startRendering();
  const L=buf.getChannelData(0),R=buf.getChannelData(1),n=L.length,i16=new Int16Array(n*2);let pk=0;
  for(let i=0;i<n;i++){pk=Math.max(pk,Math.abs(L[i]),Math.abs(R[i]));i16[2*i]=Math.max(-32767,Math.min(32767,L[i]*32767));i16[2*i+1]=Math.max(-32767,Math.min(32767,R[i]*32767));}
  const u8=new Uint8Array(i16.buffer);let s='';for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));
  return {cnt:CNT,ppl:PPL,b64:btoa(s),pk,errs:log.filter(e=>e.err).map(e=>e.err).slice(0,5),n};
},{SC,SECS,SOLO});
const pcm=Buffer.from(res.b64,'base64'),h=Buffer.alloc(44);h.write('RIFF',0);h.writeUInt32LE(36+pcm.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);h.writeUInt32LE(44100,24);h.writeUInt32LE(44100*4,28);h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);
fs.writeFileSync(OUT,Buffer.concat([h,pcm]));
console.log(JSON.stringify(res.cnt));if(process.env.PPLOG)fs.writeFileSync(process.env.PPLOG,JSON.stringify(res.ppl));console.log('wrote',OUT,'peak',res.pk.toFixed(3),'tickerrs',res.errs,'pageerrors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

// Version 252. Chapter 2's opening rendered offline (the page's own audio on an OfflineAudioContext, the game stepped in virtual time), from BEFORE seconds
// before the shell's sound to AFTER seconds past it, with a log of what was on screen when. node opening-sound-render.js PORT ROOT OUT.wav [BEFORE AFTER]
// env MODE: all | nobed (the sound bed off) | noguns (dcSeqWar's far guns off)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const PORT=+process.argv[2]||9971,ROOT=process.argv[3],OUT=process.argv[4]||'open.wav',BEFORE=+process.argv[5]||9,AFTER=+process.argv[6]||7,MODE=process.env.MODE||'all';
(async()=>{const srv=await serve(ROOT,PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=0`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.setItem('warehouseYard.sound','on');
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4242);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.STEP=dt=>{const ts=timeScale();if(ts>0)update(dt*ts);panTick(dt);ddCam(dt);if(typeof ddFrame==='function'&&MAPID==='dd')ddFrame(dt,simT);CLK+=dt;};
  startCounter();});
await page.waitForTimeout(600);
const T=await ev(B=>{let n=0;while(dd.seq&&dd.seq.t<DCS.T.inc-B&&n++<40000)STEP(1/30);return{t:+dd.seq.t.toFixed(2),inc:DCS.T.inc,hush:DCS.T.hush||0,shell:DCS.T.shell,run:DCS.T.run};},BEFORE);console.log('start',JSON.stringify(T));
const SECS=BEFORE+AFTER;
await ev(SECS=>{const OC=window.OfflineAudioContext;window.AudioContext=function(){return new OC(2,Math.ceil(44100*SECS),44100);};window.webkitAudioContext=undefined;
  if(AC&&AC.close)AC.close();AC=null;samples={};loops={};rainG=[];voices=0;if(typeof DSFX!=='undefined'){DSFX.buf={};DSFX.live.length=0;}if(typeof ddA!=='undefined')ddA=null;sndOn=true;audioInit();},SECS);
await page.waitForFunction(()=>DSFX.buf.xgun&&DSFX.buf.xmid&&Object.keys(DSFX.buf).length>=15&&samples.boom&&samples.boom.length>=2,null,{timeout:30000,polling:200});
if(MODE==='nobed')await ev(()=>{window.ddAmbFrame=()=>{};if(amb){amb.wg.disconnect();amb.hum.disconnect();amb.dr.disconnect();}for(const[g]of rainG)g.disconnect();});
if(MODE==='noguns')await ev(()=>{const w0=dcSeqWar;window.dcSeqWar=dt=>{const S=dd.seq;if(S.t<DCS.T.shell)return;return w0(dt);};});
const res=await ev(async()=>{const Q=[];let VT=0;window.setTimeout=(f,ms)=>{Q.push({at:VT+(ms||0)/1000,f});return Q.length;};
  const due=()=>{for(let i=0;i<Q.length;i++)if(Q[i].at<=VT){const q=Q.splice(i,1)[0];i--;try{q.f();}catch(e){}}};
  const CNT={};for(const n of['ddsShot','ddsBoom','ddsFarBoom','sfxBoom','sfxShotDD','ddsOut']){const f=window[n];if(typeof f!=='function')continue;window[n]=function(...a){const t=dd.seq?dd.seq.t:-1,k=n+'@'+(t<0?'after':Math.floor(t));CNT[k]=(CNT[k]||0)+1;return f.apply(this,a);};}
  const dt=1/30,ctx=AC,marks=[],errs=[];let k=0;const N=Math.floor(ctx.length/44100/dt)-2;
  const tick=()=>{VT=k*dt;STEP(dt);audioFrame();due();if(k%15===0)marks.push([+VT.toFixed(2),dd.seq?dd.seq.ph:'fight',dd.seq?+dd.seq.t.toFixed(2):null,dd.seq&&typeof dcSeqLine==='function'&&dcSeqLine(dd.seq)?dcSeqLine(dd.seq).text.slice(0,24):'']);};
  const go=()=>{if(k>=N)return;ctx.suspend((k+1)*dt).then(()=>{k++;try{tick();}catch(e){errs.push(String(e));}go();ctx.resume();});};
  go();const buf=await ctx.startRendering();
  const L=buf.getChannelData(0),R=buf.getChannelData(1),n=L.length,i16=new Int16Array(n*2);let pk=0;
  for(let i=0;i<n;i++){pk=Math.max(pk,Math.abs(L[i]),Math.abs(R[i]));i16[2*i]=Math.max(-32767,Math.min(32767,L[i]*32767));i16[2*i+1]=Math.max(-32767,Math.min(32767,R[i]*32767));}
  const u8=new Uint8Array(i16.buffer);let s='';for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));
  return{b64:btoa(s),pk,marks,cnt:CNT,errs:errs.slice(0,5)};});
const pcm=Buffer.from(res.b64,'base64'),h=Buffer.alloc(44);h.write('RIFF',0);h.writeUInt32LE(36+pcm.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);h.writeUInt32LE(44100,24);h.writeUInt32LE(44100*4,28);h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);
fs.writeFileSync(OUT,Buffer.concat([h,pcm]));fs.writeFileSync(OUT+'.json',JSON.stringify({T,marks:res.marks,cnt:res.cnt}));
console.log('wrote',OUT,'peak',res.pk.toFixed(3),'tickerrs',res.errs,'pageerrors',errors.length,errors.slice(0,3));console.log(JSON.stringify(res.cnt));await b.close();srv.close();process.exit(0);})();

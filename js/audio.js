"use strict";
/* Sound. Recorded CC0 samples (sounds/, see sounds/CREDITS.md) for gunfire (squad rifles, enemy rifles, machine guns),
   explosions and the RPG launch; the rest is synthesised with Web Audio: engines built from individual combustion
   pulses (jeep, gun trucks, the dinghy's outboard, the tank's diesel and track clatter), rain, rolling thunder with the
   lightning, the gate crash, and a low rumble under explosions. Everything goes through an outdoor echo (a generated
   impulse response); far-off sounds are quieter, duller and wetter, and panned to where they are on screen. Slow-mo and
   pause muffle the mix. No UI beeps or jingles (Bryan: too arcade). If the samples can't load (opened from file://),
   gunfire and explosions fall back to synthesis. The browser only allows audio after a tap, so it starts on the first
   pointer or key press. #sndBtn mutes it (remembered in localStorage). Hooks: sfxShot from resolveShot, sfxCrash from
   smashGate, sfxClang from the tank, sfxThunder from the lightning, audioFrame every frame (engines, muffling, and new
   explosions / rockets found in booms / rockets). */
const SND_KEY='warehouseYard.sound',MAX_VOICES=40;
const SAMPLE_FILES={shot:['shot-1','shot-2','shot-3','shot-4'],enemy:['enemy-1','enemy-2','enemy-3'],mg:['mg-1','mg-2','mg-3'],boom:['boom-1','boom-2'],launch:['launch']};
let AC=null,sndMaster=null,sndMuffle=null,sndVerb=null,noiseBuf=null,sndOn=true,voices=0,loops={},samples={};
try{sndOn=localStorage.getItem(SND_KEY)!=='off';}catch(e){}

function audioInit(){
  if(AC){if(AC.state==='suspended')AC.resume();return;}
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
  try{AC=new Ctx();}catch(e){return;}
  const comp=AC.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=12;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.25;comp.connect(AC.destination);
  sndMaster=AC.createGain();sndMaster.gain.value=sndOn?.9:0;sndMaster.connect(comp);
  sndMuffle=AC.createBiquadFilter();sndMuffle.type='lowpass';sndMuffle.frequency.value=18000;sndMuffle.connect(sndMaster);
  noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);{const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  // outdoor echo: a few early slaps off the warehouse and containers, then a diffuse tail
  sndVerb=AC.createConvolver();sndVerb.buffer=makeImpulse(2.2);const vg=AC.createGain();vg.gain.value=.55;sndVerb.connect(vg);vg.connect(sndMuffle);
  // rain: a soft hiss plus a lower patter
  for(const[type,f,q,gain]of[['highpass',900,0,.035],['lowpass',700,0,.03]]){
    const s=loopNoise(),flt=AC.createBiquadFilter(),g=AC.createGain();flt.type=type;flt.frequency.value=f;g.gain.value=gain;
    s.connect(flt);flt.connect(g);g.connect(sndMuffle);s.start(0,Math.random()*2);
  }
  // recorded samples, if they can be fetched (not from file://)
  for(const[k,names]of Object.entries(SAMPLE_FILES)){
    samples[k]=[];
    for(const n of names)fetch(`sounds/${n}.wav`).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no))).then(buf=>samples[k].push(buf)).catch(()=>{});
  }
}
function makeImpulse(sec){
  const sr=AC.sampleRate,n=Math.floor(sr*sec),buf=AC.createBuffer(2,n,sr);
  for(let c=0;c<2;c++){
    const d=buf.getChannelData(c);
    for(let i=0;i<n;i++){const t=i/sr;d[i]=(Math.random()*2-1)*Math.pow(1-t/sec,3.2)*.5*Math.min(1,t/.012);}
    for(const[ms,a]of[[23+c*7,.55],[61-c*9,.4],[97+c*13,.3],[142,.2]]){const at=Math.floor(sr*ms/1000);for(let k=0;k<400;k++)d[at+k]+=(Math.random()*2-1)*a*Math.exp(-k/90);}   // early reflections
  }
  // darken the tail like air and wet walls would
  for(let c=0;c<2;c++){const d=buf.getChannelData(c);let y=0;for(let i=0;i<n;i++){const t=i/n,k=.55-.4*t;y+=k*(d[i]-y);d[i]=y;}}
  return buf;
}
function setSound(on){
  sndOn=on;try{localStorage.setItem(SND_KEY,on?'on':'off');}catch(e){}
  if(sndMaster)sndMaster.gain.setTargetAtTime(on?.9:0,AC.currentTime,.05);
  const b=$('#sndBtn');if(b){b.classList.toggle('off',!on);b.setAttribute('aria-label',on?'Sound on. Press to mute.':'Sound muted. Press to turn on.');b.setAttribute('aria-pressed',String(!on));}
}
function loopNoise(){const s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=true;return s;}
// how loud, how far and where: by distance from the view centre and left/right on screen. x null = not placed
function place(x,y){
  if(x==null)return{g:1,p:0,far:0};
  const d=hyp(x-camT.x,y-camT.z),ref=520/zoom,[sx]=toS(x,y),far=clamp(d/(ref*2.4),0,1);
  return{g:clamp(1.15-far,.06,1),p:clamp((sx/cw-.5)*1.3,-.9,.9),far};
}
// a voice: input gain -> distance low-pass -> pan -> mix, with a send to the echo that grows with distance
function voice(x,y,vol,dur){
  if(!AC||!sndOn||voices>=MAX_VOICES)return null;
  const pl=place(x,y),g=AC.createGain(),lp=AC.createBiquadFilter();
  g.gain.value=vol*pl.g;lp.type='lowpass';lp.frequency.value=2200+15000*Math.pow(1-pl.far,2);g.connect(lp);
  let out=lp;if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pl.p;lp.connect(p);out=p;}
  out.connect(sndMuffle);
  const send=AC.createGain();send.gain.value=.18+pl.far*.7;out.connect(send);send.connect(sndVerb);
  voices++;setTimeout(()=>{voices--;g.disconnect();},(dur+.2)*1000);
  return g;
}
function playSample(kind,x,y,vol,rate=1){
  const list=samples[kind];if(!list||!list.length)return false;
  const buf=list[Math.floor(Math.random()*list.length)],out=voice(x,y,vol,buf.duration/rate);if(!out)return true;
  const s=AC.createBufferSource();s.buffer=buf;s.playbackRate.value=rate;s.connect(out);s.start();return true;
}
function noiseHit(out,t0,dur,type,freq,q,peak,attack=.002,sweepTo=null){
  const s=AC.createBufferSource();s.buffer=noiseBuf;
  const f=AC.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(freq,t0);if(q)f.Q.value=q;
  if(sweepTo)f.frequency.exponentialRampToValueAtTime(sweepTo,t0+dur);
  const g=AC.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(peak,t0+attack);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  s.connect(f);f.connect(g);g.connect(out);s.start(t0,Math.random()*1.5);s.stop(t0+dur+.05);
}
function toneHit(out,t0,dur,type,f0,f1,peak,attack=.004){
  const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t0);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t0+dur);
  const g=AC.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(peak,t0+attack);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g);g.connect(out);o.start(t0);o.stop(t0+dur+.05);
}

/* ---------- one-shots ---------- */
function sfxShot(u){
  const kind=u.gunner?'mg':u.side==='E'?'enemy':'shot',r=.95+Math.random()*.1;
  if(playSample(kind,u.x,u.y,kind==='mg'?.75:.6,r))return;
  const out=voice(u.x,u.y,.45,.3);if(!out)return;const t=AC.currentTime;   // fallback: a sharp crack and a body
  noiseHit(out,t,.05,'highpass',2500,0,1);noiseHit(out,t,.18,'lowpass',2600*r,0,.8,.002,300);toneHit(out,t,.09,'sine',110,40,.5);
}
// low rumble and falling debris under every explosion, so they carry weight
function rumble(x,y,size){
  const out=voice(x,y,.8*size,3.2);if(!out)return;const t=AC.currentTime;
  noiseHit(out,t,2.4+size*.6,'lowpass',260,0,.9,.03,40);
  if(size>.9)for(let k=0;k<10;k++)noiseHit(out,t+.25+Math.random()*1.2,.05,'bandpass',1800+Math.random()*2500,2,.08+Math.random()*.1);
}
function sfxBoom(x,y,size=1){
  rumble(x,y,size);
  if(playSample('boom',x,y,Math.min(1.3,.9*size),size>1.2?.82:.95+Math.random()*.1))return;
  const out=voice(x,y,Math.min(1.2,.8*size),1.8);if(!out)return;const t=AC.currentTime;
  noiseHit(out,t,.08,'highpass',2000,0,.7);noiseHit(out,t,1.2,'lowpass',1400,0,1,.005,60);toneHit(out,t,.6,'sine',70,28,.9,.008);
}
function sfxLaunch(x,y){if(playSample('launch',x,y,.75))return;const out=voice(x,y,.5,1);if(!out)return;const t=AC.currentTime;noiseHit(out,t,.08,'lowpass',1500,0,.8);noiseHit(out,t,.9,'bandpass',700,1.2,.6,.05,250);}
function sfxCannon(x,y){if(!playSample('boom',x,y,1.3,.7)){const out=voice(x,y,1,1.6);if(out){const t=AC.currentTime;noiseHit(out,t,1.2,'lowpass',900,0,.9,.004,60);}}rumble(x,y,1.3);}
function sfxCrash(x,y){   // chain-link gate and its steel frame going down
  const out=voice(x,y,.7,1.4);if(!out)return;const t=AC.currentTime;
  noiseHit(out,t,.25,'lowpass',1200,0,1,.002,200);noiseHit(out,t,.9,'bandpass',2600,4,.35,.005);noiseHit(out,t+.18,.6,'bandpass',1700,5,.25,.01);
  for(let k=0;k<6;k++)noiseHit(out,t+.05+Math.random()*.5,.04,'highpass',3000,0,.15);
}
function sfxClang(x,y){const out=voice(x,y,.6,1);if(!out)return;const t=AC.currentTime;noiseHit(out,t,.05,'highpass',2500,0,.6);noiseHit(out,t,.7,'bandpass',420,12,.6,.002);noiseHit(out,t,.5,'bandpass',1130,14,.3,.002);}
function sfxThunder(){   // a crack, then a long roll that comes and goes
  const out=voice(null,null,.7,6);if(!out)return;const t=AC.currentTime+.3+Math.random()*1.5;
  noiseHit(out,t,.6,'lowpass',1400,0,.35,.01,200);
  for(let k=0;k<4;k++)noiseHit(out,t+.2+k*(.5+Math.random()*.5),2+Math.random()*1.5,'lowpass',260+Math.random()*120,0,.5+Math.random()*.4,.25,45);
}

/* ---------- engines: loops built from combustion pulses ---------- */
// One loop of N engine cycles: each firing is a short decaying burst (noise plus a body tone), with a little jitter
// and an uneven cylinder pattern so it chugs instead of buzzing. Pitch follows playbackRate (revs).
function engineBuffer(fireHz,bodyHz,cycles,rough,clank=0){
  const sr=AC.sampleRate,per=1/fireHz,n=Math.round(sr*per*cycles),buf=AC.createBuffer(1,n,sr),d=buf.getChannelData(0);
  const pattern=[1,.82,.95,.74];
  for(let k=0;k<cycles;k++){
    const start=Math.floor((k*per+(Math.random()-.5)*per*.06)*sr),amp=pattern[k%4]*(1-rough/2+Math.random()*rough),tau=per*.3;
    for(let i=0;i<per*sr*1.6;i++){
      const t=i/sr,e=Math.exp(-t/tau),v=amp*e*((Math.random()*2-1)*.55+Math.sin(TAU*bodyHz*t)*.75+Math.sin(TAU*bodyHz*2.03*t)*.2);
      d[(start+i+n)%n]+=v;
    }
  }
  if(clank)for(let k=0;k<cycles*clank;k++){   // tank tracks: metallic links slapping the road wheels
    const start=Math.floor(Math.random()*n),a=.25+Math.random()*.35,f=900+Math.random()*700;
    for(let i=0;i<sr*.05;i++){const t=i/sr;d[(start+i)%n]+=a*Math.exp(-t/.012)*(Math.sin(TAU*f*t)*.7+(Math.random()*2-1)*.5);}
  }
  let mx=0;for(let i=0;i<n;i++)mx=Math.max(mx,Math.abs(d[i]));for(let i=0;i<n;i++)d[i]/=mx||1;
  return buf;
}
const ENGINES={
  jeep:{fire:30,body:95,cycles:24,rough:.35,cut:950,vol:1},
  truck:{fire:24,body:72,cycles:24,rough:.4,cut:800,vol:1.1},
  boat:{fire:55,body:170,cycles:40,rough:.25,cut:1800,vol:.8,wash:true},
  tank:{fire:17,body:52,cycles:16,rough:.45,cut:650,vol:1.4,clank:1.5},
};
function engineLoop(id){
  if(loops[id])return loops[id];
  const E=ENGINES[id],src=AC.createBufferSource();src.buffer=engineBuffer(E.fire,E.body,E.cycles,E.rough,E.clank);src.loop=true;
  const hp=AC.createBiquadFilter(),lp=AC.createBiquadFilter(),g=AC.createGain();hp.type='highpass';hp.frequency.value=28;lp.type='lowpass';lp.frequency.value=E.cut;g.gain.value=0;
  src.connect(hp);hp.connect(lp);lp.connect(g);
  if(E.wash){const w=loopNoise(),wl=AC.createBiquadFilter(),wg=AC.createGain();wl.type='lowpass';wl.frequency.value=600;wg.gain.value=.35;w.connect(wl);wl.connect(wg);wg.connect(g);w.start();}   // water churned by the prop
  let pan=null,out=g;if(AC.createStereoPanner){pan=AC.createStereoPanner();g.connect(pan);out=pan;}
  out.connect(sndMuffle);const send=AC.createGain();send.gain.value=.15;out.connect(send);send.connect(sndVerb);
  src.start();return loops[id]={src,g,pan,lp,E};
}
function setLoop(id,level,x,y,rev=1){
  if(!level&&!loops[id])return;
  const L=engineLoop(id),pl=place(x,y),t=AC.currentTime;
  L.g.gain.setTargetAtTime(level*L.E.vol*pl.g,t,.25);if(L.pan)L.pan.pan.setTargetAtTime(pl.p,t,.1);
  L.src.playbackRate.setTargetAtTime(rev,t,.6);L.lp.frequency.setTargetAtTime(L.E.cut*(.7+rev*.4)*(1-pl.far*.5),t,.4);
}

/* ---------- every frame ---------- */
function audioFrame(){
  if(!AC||!sndOn)return;
  const t=AC.currentTime,live=state==='play'&&!paused;
  sndMuffle.frequency.setTargetAtTime(state==='play'&&timeScale()<1?900:18000,t,.12);   // slow-mo and pause sound muffled
  // explosions and launches, picked up as they appear (grenades, rockets, tank shells, fuel tanks, vehicles)
  let n=0;for(const b of booms)if(!b.snd&&b.t>=0){b.snd=1;if(n++<2)sfxBoom(b.x,b.y,b.size||1);}
  for(const r of rockets)if(!r.snd){r.snd=1;if(r.spec&&r.spec===TANK)sfxCannon(r.x,r.y);else sfxLaunch(r.x,r.y);}
  // engines: idle when stopped, revving when moving
  const jv=jeepOf(),wj=wave.jeep;
  if(jv&&jv.state==='ok'&&crewOf(jv).some(u=>u.seat==='driver'))setLoop('jeep',live?(jv.moving?.32:.16):0,jv.x,jv.y,jv.moving?1.9:1);
  else if(wj&&wave.phase==='drive')setLoop('jeep',live?.32:0,wj.x,wj.y,1.9);
  else setLoop('jeep',0,null,null);
  setLoop('boat',live&&landing?.26:0,DOCK.moor.x,DOCK.moor.y+100,landing&&landing.t>LAND_T*.7?1:1.5);
  const tm=trucks.find(k=>!k.dead&&(k.moving||!k.gunner.dead));setLoop('truck',live&&tm?(tm.moving?.34:.16):0,tm&&tm.x,tm&&tm.y,tm&&tm.moving?1.8:1);
  setLoop('tank',live&&tank&&!tank.dead?(tank.moving?.4:.18):0,tank&&tank.x,tank&&tank.y,tank&&tank.moving?1.5:1);
}
function bindAudio(){
  const wake=()=>audioInit();
  window.addEventListener('pointerdown',wake,true);window.addEventListener('keydown',wake,true);
  $('#sndBtn').addEventListener('click',()=>{audioInit();setSound(!sndOn);});
  setSound(sndOn);
}

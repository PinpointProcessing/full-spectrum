"use strict";
/* Sound. Everything is synthesised with Web Audio, so there are no files to load: gunshots (rifles, enemy rifles, machine
   guns), explosions, rocket launches, the tank's cannon, the gate crash, thunder with the lightning, engine loops (jeep,
   dinghy outboard, trucks, tank), rain, and short stings for the big messages, the countdown, being spotted, picking up
   the RPG and restocking. Sounds are panned and quietened by where they happen on screen; slow-mo and pause muffle the
   mix. The browser only allows audio after a tap, so it starts on the first pointer or key press. #sndBtn mutes it
   (remembered in localStorage). Hooks: sfxShot from resolveShot, sfxCrash from smashGate, sfxSting from bigText and
   others, audioFrame every frame (engines, muffling, and new explosions / rockets found in booms / rockets). */
const SND_KEY='warehouseYard.sound',MAX_VOICES=30;
let AC=null,sndMaster=null,sndMuffle=null,noiseBuf=null,sndOn=true,voices=0,loops={},spottedSnd=false;
try{sndOn=localStorage.getItem(SND_KEY)!=='off';}catch(e){}

function audioInit(){
  if(AC){if(AC.state==='suspended')AC.resume();return;}
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
  try{AC=new Ctx();}catch(e){return;}
  const comp=AC.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=6;comp.connect(AC.destination);
  sndMaster=AC.createGain();sndMaster.gain.value=sndOn?.85:0;sndMaster.connect(comp);
  sndMuffle=AC.createBiquadFilter();sndMuffle.type='lowpass';sndMuffle.frequency.value=18000;sndMuffle.connect(sndMaster);
  noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  // rain: looping noise, band-limited to a soft hiss
  const rn=loopNoise(),hp=AC.createBiquadFilter(),lp=AC.createBiquadFilter(),g=AC.createGain();
  hp.type='highpass';hp.frequency.value=600;lp.type='lowpass';lp.frequency.value=3800;g.gain.value=.05;
  rn.connect(hp);hp.connect(lp);lp.connect(g);g.connect(sndMuffle);rn.start();
}
function setSound(on){
  sndOn=on;try{localStorage.setItem(SND_KEY,on?'on':'off');}catch(e){}
  if(sndMaster)sndMaster.gain.setTargetAtTime(on?.85:0,AC.currentTime,.05);
  const b=$('#sndBtn');if(b){b.classList.toggle('off',!on);b.setAttribute('aria-label',on?'Sound on. Press to mute.':'Sound muted. Press to turn on.');b.setAttribute('aria-pressed',String(!on));}
}
function loopNoise(){const s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=true;return s;}
// how loud and where: by distance from the view centre and left/right on screen. x null = not placed (UI sounds)
function place(x,y){
  if(x==null)return{g:1,p:0};
  const d=hyp(x-camT.x,y-camT.z),ref=520/zoom,[sx]=toS(x,y);
  return{g:clamp(1.15-d/(ref*2.4),.06,1),p:clamp((sx/cw-.5)*1.3,-.9,.9)};
}
// a voice: gain -> pan -> muffle. Returns the gain node to feed, or null if muted / too busy / not started.
function voice(x,y,vol,dur){
  if(!AC||!sndOn||voices>=MAX_VOICES)return null;
  const pl=place(x,y),g=AC.createGain();g.gain.value=vol*pl.g;
  if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pl.p;g.connect(p);p.connect(sndMuffle);}else g.connect(sndMuffle);
  voices++;setTimeout(()=>{voices--;g.disconnect();},(dur+.1)*1000);
  return g;
}
function noiseHit(out,t0,dur,type,freq,q,peak,attack=.002,sweepTo=null,rate=1){
  const s=AC.createBufferSource();s.buffer=noiseBuf;s.playbackRate.value=rate;
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
  const kind=u.gunner?'mg':u.side==='E'?'enemy':'rifle',out=voice(u.x,u.y,kind==='mg'?.5:.42,.25);if(!out)return;
  const t=AC.currentTime,r=.9+Math.random()*.2;
  noiseHit(out,t,kind==='mg'?.09:.13,'bandpass',(kind==='enemy'?1500:kind==='mg'?1150:1900)*r,.9,1);
  toneHit(out,t,.07,'sine',kind==='mg'?120:150,45,.6);
}
function sfxBoom(x,y,size=1){
  const out=voice(x,y,Math.min(1.2,.75*size),1.8);if(!out)return;const t=AC.currentTime;
  noiseHit(out,t,.9+size*.5,'lowpass',1600*size,0,1,.006,70);
  toneHit(out,t,.7,'sine',75,26,.9,.01);
  noiseHit(out,t,.08,'highpass',2500,0,.5);   // the crack at the front
}
function sfxWhoosh(x,y){const out=voice(x,y,.45,.8);if(!out)return;const t=AC.currentTime;noiseHit(out,t,.06,'highpass',1800,0,.6);noiseHit(out,t,.7,'bandpass',500,2,.8,.08,2400);}
function sfxCannon(x,y){const out=voice(x,y,1,1.6);if(!out)return;const t=AC.currentTime;noiseHit(out,t,.12,'highpass',1200,0,1);noiseHit(out,t,1.2,'lowpass',900,0,.9,.004,60);toneHit(out,t,.5,'sine',60,30,1,.004);}
function sfxCrash(x,y){const out=voice(x,y,.6,.9);if(!out)return;const t=AC.currentTime;noiseHit(out,t,.5,'bandpass',900,3,1);toneHit(out,t,.4,'square',190,120,.12);toneHit(out,t,.6,'triangle',330,300,.2);toneHit(out,t+.05,.5,'triangle',517,505,.12);}
function sfxClang(x,y){const out=voice(x,y,.5,.8);if(!out)return;const t=AC.currentTime;toneHit(out,t,.7,'triangle',410,400,.4);toneHit(out,t,.5,'triangle',673,660,.25);noiseHit(out,t,.1,'highpass',3000,0,.4);}
function sfxThunder(){const out=voice(null,null,.6,4);if(!out)return;const t=AC.currentTime+.4+Math.random()*1.4;noiseHit(out,t,3.2,'lowpass',320,0,1,.35,60);noiseHit(out,t+.1,1.2,'lowpass',900,0,.35,.05,120);}
// short UI stings: the big messages, the countdown, being spotted, the RPG pickup, restocking
function sfxSting(kind){
  const out=voice(null,null,.5,1.4);if(!out)return;const t=AC.currentTime;
  const seq=(notes,step,type,vol,dur)=>notes.forEach((f,i)=>toneHit(out,t+i*step,dur,type,f,null,vol,.01));
  if(kind==='clear')seq([587,880],.14,'sine',.35,.5);
  else if(kind==='inbound'){toneHit(out,t,.35,'sawtooth',233,220,.18,.02);toneHit(out,t+.38,.45,'sawtooth',208,196,.18,.02);}
  else if(kind==='complete')seq([523,659,784,1047],.11,'triangle',.3,.7);
  else if(kind==='unlock')seq([659,784,988,1319],.08,'sine',.28,.45);
  else if(kind==='spotted'){toneHit(out,t,.35,'sawtooth',330,150,.22,.005);noiseHit(out,t,.15,'bandpass',800,1,.3);}
  else if(kind==='tick')toneHit(out,t,.07,'square',880,null,.08,.003);
  else if(kind==='pickup')seq([784,988,1175,1568],.06,'triangle',.25,.35);
  else if(kind==='restock')seq([659,988],.09,'sine',.22,.25);
}

/* ---------- every frame ---------- */
// a looping engine: sawtooth through a low-pass, its level and pitch eased towards what the frame asks for
function engineLoop(id,base,cut){
  if(loops[id])return loops[id];
  const o=AC.createOscillator(),o2=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();
  o.type='sawtooth';o2.type='square';o.frequency.value=base;o2.frequency.value=base*1.01;f.type='lowpass';f.frequency.value=cut;g.gain.value=0;
  const g2=AC.createGain();g2.gain.value=.4;o2.connect(g2);g2.connect(f);
  o.connect(f);f.connect(g);
  let pan=null;if(AC.createStereoPanner){pan=AC.createStereoPanner();g.connect(pan);pan.connect(sndMuffle);}else g.connect(sndMuffle);
  o.start();o2.start();return loops[id]={o,o2,g,pan,base};
}
function setLoop(id,base,cut,level,x,y,pitch=1){
  if(!level&&!loops[id])return;
  const L=engineLoop(id,base,cut),pl=place(x,y),t=AC.currentTime;
  L.g.gain.setTargetAtTime(level*pl.g,t,.15);if(L.pan)L.pan.pan.setTargetAtTime(pl.p,t,.1);
  L.o.frequency.setTargetAtTime(L.base*pitch,t,.2);L.o2.frequency.setTargetAtTime(L.base*pitch*1.01,t,.2);
}
function audioFrame(){
  if(!AC||!sndOn)return;
  const t=AC.currentTime,live=state==='play'&&!paused;
  sndMuffle.frequency.setTargetAtTime(state==='play'&&timeScale()<1?900:18000,t,.12);   // slow-mo and pause sound muffled
  // explosions and launches, picked up as they appear (grenades, rockets, tank shells, fuel tanks, vehicles)
  let n=0;for(const b of booms)if(!b.snd&&b.t>=0){b.snd=1;if(n++<2)sfxBoom(b.x,b.y,b.size||1);}
  for(const r of rockets)if(!r.snd){r.snd=1;if(r.spec&&r.spec===TANK)sfxCannon(r.x,r.y);else sfxWhoosh(r.x,r.y);}
  // engines
  const jv=jeepOf(),wj=wave.jeep;
  if(jv&&jv.state==='ok'&&crewOf(jv).some(u=>u.seat==='driver'))setLoop('jeep',46,520,live?(jv.moving?.13:.05):0,jv.x,jv.y,jv.moving?1.5:1);
  else if(wj&&wave.phase==='drive')setLoop('jeep',46,520,live?.13:0,wj.x,wj.y,1.5);
  else setLoop('jeep',46,520,0,null,null);
  setLoop('boat',88,900,live&&landing?.08:0,DOCK.moor.x,DOCK.moor.y+100,1);
  const tm=trucks.find(k=>k.moving&&!k.dead);setLoop('truck',52,600,live&&tm?.12:0,tm&&tm.x,tm&&tm.y,1.4);
  setLoop('tank',30,380,live&&tank&&!tank.dead?(tank.moving?.2:.07):0,tank&&tank.x,tank&&tank.y,tank&&tank.moving?1.3:1);
  // spotted sting, once each time the squad gets spotted
  const sp=state==='play'&&contact;if(sp&&!spottedSnd&&wavePhase('fight1','depot'))sfxSting('spotted');spottedSnd=sp;
}
function bindAudio(){
  const wake=()=>audioInit();
  window.addEventListener('pointerdown',wake,true);window.addEventListener('keydown',wake,true);
  $('#sndBtn').addEventListener('click',()=>{audioInit();setSound(!sndOn);});
  setSound(sndOn);
}

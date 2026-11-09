"use strict";
/* Sound. Recorded CC0 samples (sounds/, see sounds/CREDITS.md) for gunfire (squad rifles, enemy rifles, machine guns),
   explosions and the RPG launch; the rest is synthesised with Web Audio: engines built from individual combustion
   pulses (the dinghy's outboard; a jeep, trucks and a tank's diesel are kept for later), rain, rolling thunder with the
   lightning, the gate crash, and a low rumble under explosions. Everything goes through an outdoor echo (a generated
   impulse response); far-off sounds are quieter, duller and wetter, and panned to where they are on screen. Slow-mo and
   pause muffle the mix. No UI beeps or jingles (Bryan: too arcade). If the samples can't load (opened from file://),
   gunfire and explosions fall back to synthesis. The browser only allows audio after a tap, so it starts on the first
   pointer or key press. #sndBtn mutes it (remembered in localStorage). Hooks: sfxShot from resolveShot, sfxCrash from
   smashGate, sfxClang from the tank, sfxThunder from the lightning, audioFrame every frame (engines, muffling, and new
   explosions / rockets found in booms / rockets). */
const SND_KEY='warehouseYard.sound',MAX_VOICES=40;
const SAMPLE_FILES={shot:['shot-1','shot-2','shot-3','shot-4'],shotgun:['shotgun-1','shotgun-2'],enemy:['enemy-1','enemy-2','enemy-3'],mg:['mg-1','mg-2','mg-3'],boom:['boom-1','boom-2'],launch:['launch']};
let AC=null,sndMaster=null,sndMuffle=null,sndVerb=null,sndVerbIn=null,noiseBuf=null,sndOn=true,voices=0,loops={},samples={},rainG=[],amb=null;
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
  sndVerbIn=AC.createConvolver();sndVerbIn.buffer=makeImpulse(.55);const vgi=AC.createGain();vgi.gain.value=.7;sndVerbIn.connect(vgi);vgi.connect(sndMuffle);   // indoors: a short, hard room, so shots crack
  amb=makeAmbience();
  if(typeof preloadVoices==='function')preloadVoices();   // everyone's recorded lines (voice.js)
  // rain: a soft hiss plus a lower patter
  for(const[type,f,q,gain]of[['highpass',900,0,.035],['lowpass',700,0,.03]]){
    const s=loopNoise(),flt=AC.createBiquadFilter(),g=AC.createGain();flt.type=type;flt.frequency.value=f;g.gain.value=gain;rainG.push([g,gain]);
    s.connect(flt);flt.connect(g);g.connect(sndMuffle);s.start(0,Math.random()*2);
  }
  // the recorded effects (sounds/sfx: one mp3 per kind, cut from CC0 packs, see sounds/CREDITS.md and tools/sfx): each kind's file is
  // sliced into its clips once decoded, and they join the samples below
  fetch('sounds/sfx/manifest.json').then(r=>r.ok?r.json():Promise.reject()).then(m=>{
    for(const[k,spans]of Object.entries(m))fetch(`sounds/sfx/${k}.mp3`).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no)))
      .then(buf=>{samples[k]=spans.map(([t,d])=>sliceBuf(buf,t,d));}).catch(()=>{});
  }).catch(()=>{});
  // recorded samples, if they can be fetched (not from file://)
  for(const[k,names]of Object.entries(SAMPLE_FILES)){
    samples[k]=[];
    for(const n of names)fetch(`sounds/${n}.wav`).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no))).then(buf=>samples[k].push(buf)).catch(()=>{});
  }
}
// the sound bed (docs/feel-plan.md: silence between shots felt empty): wind gusting outdoors; inside a building's hum and a
// fluorescent buzz; under it all a low drone that swells as the enemy closes in on spotting you, and stays up in a fight
function makeAmbience(){
  const bus=AC.createGain();bus.gain.value=1;bus.connect(sndMuffle);
  const wind=loopNoise(),wf=AC.createBiquadFilter(),wg=AC.createGain();wf.type='bandpass';wf.frequency.value=380;wf.Q.value=.6;wg.gain.value=0;wind.connect(wf);wf.connect(wg);wg.connect(bus);wind.start(0,Math.random()*2);
  const hum=AC.createGain();hum.gain.value=0;hum.connect(bus);
  for(const[f,a]of[[50,.05],[100,.03],[150,.012]]){const o=AC.createOscillator();o.frequency.value=f;const g=AC.createGain();g.gain.value=a;o.connect(g);g.connect(hum);o.start();}
  const hn=loopNoise(),hf=AC.createBiquadFilter();hf.type='lowpass';hf.frequency.value=220;const hg=AC.createGain();hg.gain.value=.05;hn.connect(hf);hf.connect(hg);hg.connect(hum);hn.start();
  const bz=AC.createOscillator();bz.type='sawtooth';bz.frequency.value=120;const bf=AC.createBiquadFilter();bf.type='bandpass';bf.frequency.value=2400;bf.Q.value=4;const bg=AC.createGain();bg.gain.value=.012;bz.connect(bf);bf.connect(bg);bg.connect(hum);bz.start();
  const dr=AC.createGain();dr.gain.value=0;const df=AC.createBiquadFilter();df.type='lowpass';df.frequency.value=160;df.Q.value=3;df.connect(dr);dr.connect(bus);
  for(const f of[55,55.7,82.4]){const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;const g=AC.createGain();g.gain.value=f>80?.35:.5;o.connect(g);g.connect(df);o.start();}
  return{wg,hum,dr,df,gust:0};
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
  const send=AC.createGain();send.gain.value=.18+pl.far*.7;out.connect(send);send.connect(MAPID==='in'&&sndVerbIn?sndVerbIn:sndVerb);
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
function sfxPA(x,y){   // the base's loudspeakers coming back (waves.js's outage): three loud flat beeps, then the test tone
  const out=voice(x,y,.9,3.6);if(!out)return;const t=AC.currentTime;
  for(let k=0;k<3;k++)toneHit(out,t+k*.32,.22,'square',880,0,.35,.006);
  toneHit(out,t+1.1,2.2,'sawtooth',620,0,.22,.05);toneHit(out,t+1.1,2.2,'square',930,0,.12,.05);
}
function sfxShot(u,quiet){
  if(quiet){const out=voice(u.x,u.y,.3,.3);if(!out)return;const t=AC.currentTime;   // silenced: a muffled cough and the action cycling
    noiseHit(out,t,.07,'bandpass',800,1.1,.8,.002);noiseHit(out,t,.14,'lowpass',520,0,.45,.003,140);noiseHit(out,t+.035,.03,'highpass',3500,0,.18,.001);return;}
  const w=u.weapon,kind=u.gunner||w==='hmg'?'mg':w==='sniper'?'enemy':u.side==='E'?'enemy':w==='shotgun'?'shotgun':'shot',r=(w==='sniper'?.78:.95)+Math.random()*.1;   // (a sniper rifle: the big single shot, deeper)
  if(playSample(kind,u.x,u.y,kind==='mg'?.75:kind==='shotgun'||w==='sniper'?.85:.6,r))return;
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
function sliceBuf(buf,t,d){const sr=buf.sampleRate,a=Math.floor(t*sr),n=Math.max(1,Math.min(buf.length-a,Math.floor(d*sr))),o=AC.createBuffer(1,n,sr);o.getChannelData(0).set(buf.getChannelData(0).subarray(a,a+n));return o;}
const varied=(lo=.94,hi=1.06)=>lo+Math.random()*(hi-lo);   // a little pitch and speed difference each time, so repeats don't sound canned
function sfxBark(x,y){   // a big dog barking (recorded); synthesised if the recording isn't loaded
  if(playSample('dog',x,y,.85,varied(.92,1.04)))return;
  const out=voice(x,y,.55,1);if(!out)return;const t=AC.currentTime;
  for(const dt of[0,.22]){toneHit(out,t+dt,.12,'sawtooth',420,260,.35,.004);noiseHit(out,t+dt,.1,'bandpass',900,2.5,.4,.003);}
}
function sfxRadio(x,y){   // a radio keyed up: a squelch and garbled static
  const out=voice(x,y,.4,1.6);if(!out)return;const t=AC.currentTime;
  noiseHit(out,t,.06,'highpass',3000,0,.5,.002);noiseHit(out,t+.05,1.2,'bandpass',1800,3,.18,.02);toneHit(out,t+.02,.05,'square',1200,0,.12,.002);
}
function sfxSiren(x,y){   // the call went out: an alarm wailing across the base (recorded; synthesised if it isn't loaded)
  if(playSample('siren',null,null,.5))return;
  const out=voice(null,null,.28,3.2);if(!out)return;const t=AC.currentTime;
  const o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(520,t);for(let k=0;k<3;k++){o.frequency.linearRampToValueAtTime(860,t+k*1+.5);o.frequency.linearRampToValueAtTime(520,t+k*1+1);}
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=1600;const g=AC.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.5,t+.1);g.gain.setValueAtTime(.5,t+2.8);g.gain.exponentialRampToValueAtTime(0.0001,t+3.1);
  o.connect(f);f.connect(g);g.connect(out);o.start(t);o.stop(t+3.2);
}
function sfxPing(k){   // the contact sensor (layers.js): a soft, muffled tock, a little louder and higher as the nearest mover closes in
  const out=voice(null,null,.05+.1*k,.5);if(!out)return;const t=AC.currentTime;
  toneHit(out,t,.2,'sine',480+240*k,400+200*k,.5,.008);noiseHit(out,t,.035,'bandpass',1300,4,.1,.002);
}
function sfxSmoke(x,y){   // a smoke grenade popping: a soft thump, then a long hiss that tails off
  const out=voice(x,y,.5,3);if(!out)return;const t=AC.currentTime;
  noiseHit(out,t,.12,'lowpass',700,0,.7,.003,150);noiseHit(out,t+.05,2.6,'bandpass',2600,1.4,.35,.08,1400);noiseHit(out,t+.05,2.2,'highpass',4500,0,.12,.1);
}
function sfxCrash(x,y){   // chain-link gate and its steel frame going down
  const out=voice(x,y,.7,1.4);if(!out)return;const t=AC.currentTime;
  noiseHit(out,t,.25,'lowpass',1200,0,1,.002,200);noiseHit(out,t,.9,'bandpass',2600,4,.35,.005);noiseHit(out,t+.18,.6,'bandpass',1700,5,.25,.01);
  for(let k=0;k<6;k++)noiseHit(out,t+.05+Math.random()*.5,.04,'highpass',3000,0,.15);
}
function sfxClang(x,y){const out=voice(x,y,.6,1);if(!out)return;const t=AC.currentTime;noiseHit(out,t,.05,'highpass',2500,0,.6);noiseHit(out,t,.7,'bandpass',420,12,.6,.002);noiseHit(out,t,.5,'bandpass',1130,14,.3,.002);}
function sfxThunder(){   // a crack, then a long roll that comes and goes (recorded; synthesised if it isn't loaded)
  if(samples.thunder&&samples.thunder.length){setTimeout(()=>playSample('thunder',null,null,.75,varied(.9,1.02)),300+Math.random()*1500);return;}
  const out=voice(null,null,.7,6);if(!out)return;const t=AC.currentTime+.3+Math.random()*1.5;
  noiseHit(out,t,.6,'lowpass',1400,0,.35,.01,200);
  for(let k=0;k<4;k++)noiseHit(out,t+.2+k*(.5+Math.random()*.5),2+Math.random()*1.5,'lowpass',260+Math.random()*120,0,.5+Math.random()*.4,.25,45);
}

/* ---------- the report (progress.js's showAAR) ---------- */
// Bryan, after v100: "a level up should make a sound. Maybe the exp bar moving up can make a noise too." The game's only interface
// sounds, kept low-key (he had the beeps and jingles taken out as too arcade): soft ticks climbing as a bar fills, timed to its
// ease-out, and a short warm swell on a level up, a third note for a promotion. Unplaced, nearly dry.
function uiOut(vol,life){
  if(!AC||!sndOn)return null;const g=AC.createGain();g.gain.value=vol;g.connect(sndMuffle);
  const send=AC.createGain();send.gain.value=.12;g.connect(send);send.connect(sndVerb);
  setTimeout(()=>{g.disconnect();send.disconnect();},(life+.5)*1000);return g;
}
function sfxXpFill(frac,dur=.8){   // frac: how much of the bar fills (0..1); dur: its CSS transition
  if(!(frac>0))return;const out=uiOut(.2,dur);if(!out)return;const t0=AC.currentTime,n=Math.max(3,Math.round(3+frac*13));
  for(let i=1;i<=n;i++){const p=i/n,t=t0+dur*(1-Math.sqrt(1-p));   // (the bar's ease-out: about 1-(1-t)^2)
    noiseHit(out,t,.025,'bandpass',2600+p*1800,5,.22,.001);toneHit(out,t,.06,'sine',480+p*420,0,.1,.003);}
}
function sfxLevelUp(promoted){
  const out=uiOut(.32,1.6);if(!out)return;const t=AC.currentTime,notes=promoted?[392,523.25,659.25]:[392,587.33];   // G and D a fifth up; promoted, G C E
  notes.forEach((f,i)=>{const s=t+i*.12;
    for(const det of[-5,5]){const o=AC.createOscillator(),flt=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;
      flt.type='lowpass';flt.frequency.setValueAtTime(500,s);flt.frequency.exponentialRampToValueAtTime(2000,s+.12);flt.frequency.exponentialRampToValueAtTime(700,s+1);
      g.gain.setValueAtTime(.0001,s);g.gain.exponentialRampToValueAtTime(.13,s+.06);g.gain.exponentialRampToValueAtTime(.0001,s+1.15);
      o.connect(flt);flt.connect(g);g.connect(out);o.start(s);o.stop(s+1.25);}
  });
  toneHit(out,t,.35,'sine',110,70,.35,.006);noiseHit(out,t,.3,'highpass',6000,0,.04,.002);   // a soft thump under it, a breath of air on top
}

/* ---------- recorded effects (sounds/sfx) ---------- */
// what a bullet that hits something sounds like, by what it hit
const MAT_METAL=/container|truck|tank|booth|armor|rack|liftwall|liftdoor|steeldoor|cabinet|bars|terminal|copier|pylon|gatehouse/,MAT_WOOD=/crate|pallet|desk|counter|sofa|plank|wood|lab/;
function matAt(x,y){let o=null,bd=14;for(const q of objs){if(q.kind==='void')continue;const dx=Math.max(q.x-x,0,x-(q.x+q.w)),dy=Math.max(q.y-y,0,y-(q.y+q.h)),d=hyp(dx,dy);if(d<bd){bd=d;o=q;}}
  return !o?'ground':MAT_METAL.test(o.kind)?'metal':MAT_WOOD.test(o.kind)?'wood':'ground';}
function sfxImpact(x,y,mat){playSample('hit_'+(mat||matAt(x,y)),x,y,.55,varied());}
function sfxFlesh(x,y){playSample('flesh',x,y,.45,varied(.85,1));}
function sfxGrunt(u,big){if(u&&!u.dog)playSample(big?'grunt_down':'grunt',u.x,u.y,big?.8:.6,varied(u.side==='E'?.86:.96,u.side==='E'?.96:1.06));}
// pain and fear (Bryan: they should be screaming, not a voice saying "ow, my leg"): recorded yells (HaelDB, CC0), never a voice line.
// A hit: a short cry, a scream once he's badly hurt; going down or dying: a scream; giving up: "No!" or a scream
function sfxPain(u,bad){if(u&&!u.dog)playSample(bad?'scream':'yelp',u.x,u.y,bad?.95:.8,varied(u.side==='E'?.9:.97,u.side==='E'?1:1.06));}
function sfxScream(u,vol=.95){if(u&&!u.dog)playSample('scream',u.x,u.y,vol,varied(u.side==='E'?.9:.97,u.side==='E'?1:1.06));}
function sfxFear(u){if(u&&!u.dog)playSample('fear',u.x,u.y,.85,varied(.95,1.05));}
function sfxBodyFall(x,y){playSample('bodyfall',x,y,.7,varied(.9,1.02));}
function sfxPin(x,y){playSample('pin',x,y,.5,varied());}
function sfxReload(x,y){playSample('reload',x,y,.6,varied());}
function sfxCloth(x,y){playSample('cloth',x,y,.5,varied());}
function sfxZip(x,y){playSample('zip',x,y,.55,varied(1.4,1.6));}
function sfxComputer(x,y){playSample('computer',x,y,.45,varied());}
function sfxScan(x,y){playSample('scan',x,y,.55);}
function sfxGrind(x,y){playSample('steel',x,y,.8,.8);setTimeout(()=>playSample('steel',x,y,.6,.7),900);setTimeout(()=>playSample('slam',x,y,.85),2300);}   // the steel door grinding down into the floor
function sfxLift(x,y,what){playSample(what==='ding'?'lift_ding':'lift_door',x,y,.6);}
function sfxCell(x,y){playSample('cell',x,y,.75,varied());}
function sfxSparks(x,y){playSample('smash',x,y,.8,varied());setTimeout(()=>playSample('glass',x,y,.7,varied()),120);}   // a lab bench wrecked
// footsteps: anyone moving near the middle of the view, a step every stride (sneaking: soft and slow), the squad's gear rattling
// when they run; carpet and concrete inside, wet ground and gravel outside
// Footsteps (Bryan: the squad's walking and running was "way too loud and distracting": they're silent now). Only a hostile
// walking close to one of the squad is heard, faintly: about two steps a second strolling, three hurrying. (A comment had
// swallowed the stride count, so every moving man near the view played a step every frame.)
const STEP_NEAR=150;
function footsteps(dt){
  if(!AC||!samples.foot_out||!samples.foot_out.length)return;let n=0;
  for(const u of units){
    if(u.side!=='E'||u.dead||u.downed||u.dog||u.veh||offFloor(u))continue;
    const px=u.fx??u.x,py=u.fy??u.y;u.fx=u.x;u.fy=u.y;if(!u.path.length){u.stepAcc=0;continue;}
    const d=hyp(u.x-px,u.y-py);if(d>20||d<.01)continue;
    const stride=u.alerted?18:12;
    u.stepAcc=(u.stepAcc||0)+d;if(u.stepAcc<stride)continue;u.stepAcc=0;
    if(!players.some(p=>alive(p)&&!p.offMap&&hyp(p.x-u.x,p.y-u.y)<STEP_NEAR)||++n>2)continue;   // (an unseen man close by: a hint he's there)
    playSample(MAPID==='in'||MAPID==='tun'||l4In()?'foot_in':'foot_out',u.x,u.y,u.alerted?.14:.08,varied(.9,1.1));
  }
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
  heli:{fire:11,body:38,cycles:22,rough:.12,cut:1100,vol:1.7,whine:1850},   // Level 1's helicopter: the blades' thump, and the turbine's whine over it
};
function engineLoop(id){
  if(loops[id])return loops[id];
  const E=ENGINES[id],src=AC.createBufferSource();src.buffer=engineBuffer(E.fire,E.body,E.cycles,E.rough,E.clank);src.loop=true;
  const hp=AC.createBiquadFilter(),lp=AC.createBiquadFilter(),g=AC.createGain();hp.type='highpass';hp.frequency.value=28;lp.type='lowpass';lp.frequency.value=E.cut;g.gain.value=0;
  src.connect(hp);hp.connect(lp);lp.connect(g);
  if(E.whine){const o=AC.createOscillator(),og=AC.createGain();o.type='sawtooth';o.frequency.value=E.whine;og.gain.value=.025;o.connect(og);og.connect(g);o.start();}
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
  if(live)footsteps();
  if(typeof chatTick==='function')chatTick();   // the squad's conversations (chatter.js)
  sndMuffle.frequency.setTargetAtTime(state==='play'&&timeScale()<1?900:18000,t,.12);   // slow-mo and pause sound muffled
  for(const[g,base]of rainG)g.gain.setTargetAtTime(base*(MAPID==='in'||hqIndoors()?.25:MAPID==='tun'||l4In()?.15:1),t,.4);   // indoors the rain is just a hiss on the roof
  if(amb){
    const inside=MAPID==='in'||MAPID==='tun'||hqIndoors()||l4In();amb.gust+=(Math.random()-.5)*.08;amb.gust=clamp(amb.gust,-.6,.6);
    amb.wg.gain.setTargetAtTime(inside?0:.05+.04*Math.max(0,amb.gust),t,.8);amb.hum.gain.setTargetAtTime(inside?1:0,t,.8);
    const hunted=enemies.some(e=>!e.dead&&e.alerted),k=state==='play'?Math.max(contact?1:detection(),hunted?.6:0):0;   // the drone follows the danger
    amb.dr.gain.setTargetAtTime(.0001+k*k*.085,t,.6);amb.df.frequency.setTargetAtTime(140+k*520,t,.8);
  }
  // explosions and launches, picked up as they appear (grenades, rockets, tank shells, fuel tanks, vehicles)
  let n=0;for(const b of booms)if(!b.snd&&b.t>=0){b.snd=1;if(n++<2)sfxBoom(b.x,b.y,b.size||1);}
  for(const r of rockets)if(!r.snd){r.snd=1;sfxLaunch(r.x,r.y);}
  // engines: idle when stopped, revving when moving
  const jv=jeepOf(),wj=wave.jeep;
  if(jv&&jv.state==='ok'&&crewOf(jv).some(u=>u.seat==='driver'))setLoop('jeep',live?(jv.moving?.32:.16):0,jv.x,jv.y,jv.moving?1.9:1);
  else if(wj&&wave.phase==='drive')setLoop('jeep',live?.32:0,wj.x,wj.y,1.9);
  else setLoop('jeep',0,null,null);
  {const H=MAPID==='l1'&&typeof heli!=='undefined'&&heli&&heli.pos;setLoop('heli',H&&state==='play'?.5:0,H?H.x:null,H?H.y:null,1);}   // Level 1's helicopter (level1.js)
  if(state==='equip')setLoop('boat',.12,camT.x,camT.z,.8);   // between missions: the outboard ticking over at sea
  else if(MAPID==='l1'&&typeof l1!=='undefined'&&l1.away!=null&&L1.boat)setLoop('boat',.22,L1.boat.position.x,L1.boat.position.z,1.4);   // Level 1's boat going out
  else if(MAPID==='l2'&&typeof l2!=='undefined'&&L2&&(l2.land||l2.away!=null))setLoop('boat',live?.24:0,(l2.land?L2.landBoat:L2.boat).position.x,(l2.land?L2.landBoat:L2.boat).position.z,l2.land?1:1.4);   // Level 2's boat in and out
  else setLoop('boat',live&&landing?.26:0,DOCK.moor.x,DOCK.moor.y+100,landing&&landing.t>LAND_T*.7?1:1.5);
  {const tk=MAPID==='out'&&enemies.find(e=>e.veh&&!e.dead);setLoop('truck',live&&tk?(tk.path.length?.3:.1):0,tk?tk.x:null,tk?tk.y:null,tk&&tk.path.length?1.5:.8);}   // the gun truck: driving, or idling where it's parked
}
function bindAudio(){
  const wake=()=>audioInit();
  window.addEventListener('pointerdown',wake,true);window.addEventListener('keydown',wake,true);
  $('#sndBtn').addEventListener('click',()=>{audioInit();setSound(!sndOn);});
  setSound(sndOn);
}

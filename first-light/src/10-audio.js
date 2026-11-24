/* Audio: everything is synthesized with Web Audio, no sound files. Starts on the first click (browsers require that). */
const AU={ctx:null,out:null,sfx:null,tv:null,amb:{},muted:false,noise:null};
let earX=0,earY=0;
function auInit(){auInit0();if(AU.ctx)sndLoad();}
function auInit0(){
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return;}
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const c=AU.ctx=new AC();
    const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=7;comp.connect(c.destination);
    AU.out=c.createGain();AU.out.gain.value=.9;AU.out.connect(comp);
    AU.sfx=c.createGain();AU.sfx.gain.value=.8;AU.sfx.connect(AU.out);
    // the street has air in it: everything in the world also goes through a short outdoor echo
    {const n=Math.floor(c.sampleRate*1.3),ir=c.createBuffer(2,n,c.sampleRate);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);let lp=0;for(let i=0;i<n;i++){const k=i/n;lp+=((Math.random()*2-1)-lp)*(.5-.42*k);d[i]=lp*Math.pow(1-k,2.6)*(i<c.sampleRate*.012?i/(c.sampleRate*.012):1);}}
     const cv=c.createConvolver(),wet=c.createGain();cv.buffer=ir;wet.gain.value=.3;AU.sfx.connect(cv);cv.connect(wet);wet.connect(AU.out);}
    // the TV is a small speaker: no bass, no sparkle, a little grit
    {const hp=c.createBiquadFilter(),lp=c.createBiquadFilter(),ws=c.createWaveShaper(),k=new Float32Array(257);for(let i=0;i<257;i++){const x=i/128-1;k[i]=Math.tanh(x*2.2)/Math.tanh(2.2);}
     hp.type='highpass';hp.frequency.value=320;lp.type='lowpass';lp.frequency.value=3100;ws.curve=k;AU.tv=c.createGain();AU.tv.gain.value=0;AU.tv.connect(hp);hp.connect(ws);ws.connect(lp);lp.connect(AU.out);}
    const len=c.sampleRate*2,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    AU.noise=b;startAmbience();
  }catch(e){AU.ctx=null;}
}
function auMute(m){AU.muted=m;if(AU.ctx)AU.out.gain.setTargetAtTime(m?0:.9,AU.ctx.currentTime,.03);if(m)try{speechSynthesis.cancel();}catch(e){}}
function auNoise(){const s=AU.ctx.createBufferSource();s.buffer=AU.noise;s.loop=true;s.loopStart=Math.random();s.loopEnd=2;return s;}
function tone(type,f0,f1,dur,vol,dest,t,atk){
  const c=AU.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;
  o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+(atk||.004));g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.03);
}
function burst(f0,f1,q,dur,vol,dest,t,ft){
  const c=AU.ctx,s=auNoise(),f=c.createBiquadFilter(),g=c.createGain();f.type=ft||'bandpass';f.Q.value=q;
  f.frequency.setValueAtTime(f0,t);if(f1!==f0)f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+dur+.03);
}
/* a rough voice: sawtooth through two formant filters */
function voiceF(f0,f1,dur,vol,dest,t,formants,vib){
  const c=AU.ctx,o=c.createOscillator(),g=c.createGain();o.type='sawtooth';
  o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f1,t+dur);
  if(vib){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=vib;lg.gain.value=f0*.07;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+dur);}
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.03,dur*.3));g.gain.setValueAtTime(vol,t+dur*.7);g.gain.linearRampToValueAtTime(0,t+dur);
  for(const fq of formants){const b=c.createBiquadFilter();b.type='bandpass';b.frequency.value=fq;b.Q.value=6;o.connect(b);b.connect(g);}
  g.connect(dest);o.start(t);o.stop(t+dur+.02);
}
/* Sounds are built from layers the way a foley track is: a low body, a noisy middle, a sharp edge. Bare beeps are kept for
   machines only (the TV alert, the car alarm). */
const thud=(t,v,d,f,dur)=>{tone('sine',f*1.9,f*.5,dur,v,d,t,.003);burst(f*5,f*1.5,.7,dur*.6,v*.5,d,t,'lowpass');};
const wet=(t,v,d,n)=>{for(let i=0;i<n;i++){const tt=t+Math.random()*.12;burst(rand(500,1400),rand(200,500),4,rand(.03,.07),v*.5,d,tt,'bandpass');}};
function growl(t,v,d,f,dur,open){      // a throat: two rough voices a little apart, breath, and a slow wobble
  voiceF(f,f*rand(.78,.95),dur,.34*v,d,t,[open?620:420,open?1250:980,2400],rand(5,8));voiceF(f*1.012,f*.84,dur,.24*v,d,t+.015,[open?700:480,1100],rand(22,30));
  burst(open?1500:800,open?700:350,1.1,dur*.9,.16*v,d,t+.03,'bandpass');
}
const SFX={
  gurgleM:(t,v,d)=>gurgle(t,v,d,118),gurgleF:(t,v,d)=>gurgle(t,v,d,205),
  swing(t,v,d){burst(300,1900,1.4,.16,.34*v,d,t,'bandpass');burst(2600,900,.8,.1,.12*v,d,t+.04,'bandpass');},
  hit(t,v,d){thud(t,.95*v,d,82,.14);burst(2600,700,.8,.045,.45*v,d,t,'bandpass');wet(t+.01,.5*v,d,2);},
  crack(t,v,d){thud(t,1.05*v,d,74,.2);burst(4200,1200,1,.035,.6*v,d,t,'bandpass');burst(1500,500,2,.07,.5*v,d,t+.012,'bandpass');wet(t+.02,.7*v,d,4);},
  pop(t,v,d){thud(t,1*v,d,110,.16);burst(3200,800,1.5,.05,.55*v,d,t,'bandpass');wet(t+.02,.9*v,d,7);burst(700,160,.7,.3,.3*v,d,t+.05,'lowpass');},
  punch(t,v,d){thud(t,.75*v,d,95,.09);burst(1700,500,.9,.04,.3*v,d,t,'bandpass');},
  gun(t,v,d){burst(7000,1800,.5,.03,1.3*v,d,t,'highpass');burst(2600,300,.5,.14,1.1*v,d,t+.004,'lowpass');thud(t,1.1*v,d,90,.16);burst(900,200,.5,.5,.2*v,d,t+.06,'lowpass');},
  shotgun(t,v,d){burst(6000,1200,.5,.04,1.4*v,d,t,'highpass');burst(1900,180,.45,.3,1.35*v,d,t+.004,'lowpass');thud(t,1.4*v,d,62,.28);burst(600,140,.5,.9,.3*v,d,t+.08,'lowpass');
    tone('square',900,500,.03,.12*v,d,t+.42);burst(2400,1200,3,.05,.2*v,d,t+.42);tone('square',700,420,.03,.12*v,d,t+.55);},      // and the pump
  dry(t,v,d){burst(3000,1800,4,.02,.3*v,d,t,'bandpass');tone('square',1400,900,.015,.08*v,d,t);},
  groan(t,v,d){if(zVoice('groan',t,v,d)){return;}const f=rand(62,98);growl(t,v,d,f,rand(.8,1.5),false);},
  snarl(t,v,d){if(zVoice('snarl',t,v,d)){return;}const f=rand(105,150);growl(t,1.1*v,d,f,.32,true);burst(2200,1200,1.2,.22,.14*v,d,t,'bandpass');},
  roar(t,v,d){if(zVoice('roar',t,v,d)){thud(t,.5*v,d,50,.5);return;}growl(t,1.5*v,d,54,1.3,true);thud(t,.5*v,d,50,.5);},
  scream(t,v,d){const f=rand(430,600);voiceF(f,f*1.5,.2,.3*v,d,t,[1000,2300,3200],0);voiceF(f*1.5,f*1.25,.5,.36*v,d,t+.18,[1150,2500,3300],rand(8,13));burst(2800,1600,1,.6,.08*v,d,t,'bandpass');},
  hurt(t,v,d){voiceF(175,112,.2,.5*v,d,t,[650,1150,2500]);burst(1400,600,1,.12,.12*v,d,t,'bandpass');thud(t,.5*v,d,80,.09);},
  bite(t,v,d){wet(t,1*v,d,6);thud(t,.6*v,d,70,.1);burst(900,260,1.4,.14,.4*v,d,t+.03,'bandpass');},
  step(t,v,d){burst(rand(240,420),120,.9,.05,.16*v,d,t,'lowpass');burst(rand(1800,3000),900,1.5,.025,.05*v,d,t+.012,'bandpass');},
  glass(t,v,d){burst(5200,2400,.6,.06,.7*v,d,t,'highpass');for(let i=0;i<14;i++){const tt=t+.02+Math.pow(Math.random(),1.6)*.55;burst(rand(3500,9500),rand(3000,8000),9,rand(.03,.09),.3*v,d,tt,'bandpass');}thud(t,.4*v,d,120,.08);},
  pickup(t,v,d){burst(1600,700,1.2,.07,.22*v,d,t,'bandpass');thud(t+.05,.25*v,d,150,.06);},
  heal(t,v,d){burst(2400,900,1,.22,.16*v,d,t,'bandpass');burst(900,500,1.5,.3,.12*v,d,t+.18,'bandpass');},
  boom(t,v,d){burst(1400,40,.3,1.8,1.8*v,d,t,'lowpass');thud(t,1.8*v,d,48,1.1);burst(5200,500,.5,.22,.9*v,d,t,'lowpass');for(let i=0;i<6;i++)burst(rand(600,2400),rand(200,600),2,.2,.2*v,d,t+.3+Math.random()*.9,'bandpass');},
  bang(t,v,d){thud(t,.95*v,d,70,.16);burst(900,220,.8,.07,.45*v,d,t,'lowpass');burst(2600,1400,2,.03,.14*v,d,t,'bandpass');},
  crash(t,v,d){thud(t,1.1*v,d,60,.4);burst(2200,120,.4,.75,1.1*v,d,t,'lowpass');for(let i=0;i<9;i++)burst(rand(1200,7000),rand(800,5000),5,rand(.05,.14),.28*v,d,t+.04+Math.random()*.45,'bandpass');},
  skid(t,v,d){voiceF(1150,820,.9,.16*v,d,t,[1500,2600,3400],34);burst(2600,1700,2,.9,.16*v,d,t,'bandpass');},
  dash(t,v,d){burst(500,2000,1,.17,.26*v,d,t,'bandpass');},
  click(t,v,d){burst(2600,1500,5,.018,.2*v,d,t,'bandpass');},
  crank(t,v,d){burst(1700,800,3,.04,.3*v,d,t,'bandpass');tone('triangle',210,150,.05,.2*v,d,t);burst(4200,2600,6,.02,.12*v,d,t+.03,'bandpass');},
  clang(t,v,d){for(const[f,g,l]of[[412,.4,1.1],[623,.3,.8],[987,.2,.6],[1431,.12,.4]])tone('sine',f,f*.99,l,g*v,d,t,.002);burst(3400,700,.7,.1,.6*v,d,t,'bandpass');thud(t,.5*v,d,90,.12);},
  beep(t,v,d){for(let i=0;i<3;i++){tone('sine',853,853,.22,.16*v,d,t+i*.3,.01);tone('sine',960,960,.22,.16*v,d,t+i*.3,.01);}},      // the two-tone emergency alert
  alarm(t,v,d){for(let i=0;i<4;i++){tone('triangle',1050,1050,.15,.16*v,d,t+i*.36,.008);tone('triangle',790,790,.15,.16*v,d,t+i*.36+.18,.008);}},
  sting(t,v,d){[294,370,440,587].forEach((f,i)=>{for(const m of[1,2,3])tone('triangle',f*m,f*m,.7-i*.08,.07*v/m,d,t+i*.13,.03);});thud(t,.3*v,d,70,.3);},
  spark(t,v,d){burst(7000,3000,3,.05,.3*v,d,t);burst(4000,2000,6,.03,.2*v,d,t+.04);},
  splash(t,v,d){burst(1500,500,.7,.28,.3*v,d,t,'bandpass');wet(t,.4*v,d,3);},
  static(t,v,d){burst(4000,4000,.2,1.2,.16*v,d,t,'highpass');},
  join(t,v,d){burst(1200,600,1,.12,.12*v,d,t,'bandpass');},
};
function atten(x,y,range){if(x===undefined||x===null)return 1;const d=hyp(x-earX,y-earY);return Math.pow(clamp(1-d/(range||460),0,1),1.6);}
/* Recorded zombie voices (see sounds/CREDITS.md). Decoded once the audio context exists; until then, and wherever decoding fails,
   the made-in-code voices below stand in. Each play picks a clip and shifts its pitch a little so twenty zombies are not one zombie. */
const ZCLIPS={groan:[1,2,8,9,12,15,19,20,23],snarl:[3,4,5,6,7,10,11,13,14,22,24],roar:[16,17,18,21]},ZBUF={};
function sndLoad(){
  if(!AU.ctx||sndLoad.done||typeof SND_B64==='undefined')return;sndLoad.done=true;
  for(const k in SND_B64){try{const bin=atob(SND_B64[k]),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
    const done=b=>{ZBUF[k]=b;},p=AU.ctx.decodeAudioData(u8.buffer,done,()=>{});if(p&&p.catch)p.catch(()=>{});}catch(e){}}
}
function zVoice(kind,t,v,d){
  const ok=ZCLIPS[kind].filter(i=>ZBUF['z'+i]);if(!ok.length)return false;
  const s=AU.ctx.createBufferSource(),g=AU.ctx.createGain();s.buffer=ZBUF['z'+pick(ok)];
  s.playbackRate.value=kind==='roar'?rand(.72,.86):kind==='groan'?rand(.8,1.02):rand(.9,1.1);
  g.gain.value=v*(kind==='roar'?1.5:kind==='groan'?.9:1.05);s.connect(g);g.connect(d);s.start(t);return true;
}
function sfx(name,x,y,vol,range){
  if(!AU.ctx||AU.muted)return;
  const a=atten(x,y,range)*(vol===undefined?1:vol);if(a<.012)return;
  let dest=AU.sfx;
  if(x!==undefined&&x!==null&&AU.ctx.createStereoPanner){const p=AU.ctx.createStereoPanner();p.pan.value=clamp((x-earX)/260,-1,1)*.75;p.connect(AU.sfx);dest=p;}
  sndLoad();
  try{SFX[name](AU.ctx.currentTime+.002,a,dest);}catch(e){}
}
/* TV speech stand-in: a run of nonsense syllables at a speaker's pitch. Goes through the TV channel so it gets quieter as you walk away. */
const VOWELS=[[730,1090],[270,2290],[570,840],[440,1020],[300,870],[660,1720],[530,1840]];
function babble(dur,pitch,vol){
  if(!AU.ctx||AU.muted)return;
  let t=AU.ctx.currentTime+.02;const end=t+dur;
  while(t<end){const d=rand(.12,.24),f=pitch*rand(.95,1.06);voiceF(f,f*rand(.96,1.03),d,vol,AU.tv,t,pick(VOWELS),0);t+=d+(Math.random()<.2?rand(.18,.4):rand(.02,.06));}
}
function tvSfx(name,vol){if(!AU.ctx||AU.muted)return;try{SFX[name](AU.ctx.currentTime+.002,vol===undefined?1:vol,AU.tv);}catch(e){}}
/* The broadcast is read in the device's own speech voices, flat and even like a newsreader: the best-sounding male and
   female English voices it has, at normal speed and pitch. If the device has no speech at all, a quiet murmur stands in. */
let ttsOK=null,newsV=null;
function newsVoices(){
  const vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));if(!vs.length)return null;
  const score=v=>(/natural|neural|enhanced|premium|siri/i.test(v.name)?4:0)+(/google|microsoft|samantha|daniel|alex|karen|moira/i.test(v.name)?2:0)+(/^en[-_](US|GB)/i.test(v.lang)?1:0);
  const fem=/female|woman|samantha|karen|moira|zira|aria|jenny|susan|victoria|serena|tessa|fiona|allison|ava|sonia|libby|emma|olivia|michelle/i,mal=/\bmale|\bman\b|daniel|alex|david|guy|mark|george|ryan|fred|tom|aaron|arthur|oliver|brian|eric|christopher|roger|james/i;
  const by=vs.slice().sort((a,b)=>score(b)-score(a)),m=by.find(v=>mal.test(v.name)&&!fem.test(v.name))||by[0],f=by.find(v=>fem.test(v.name))||by.find(v=>v!==m)||by[0];
  return{m,f,same:m===f};
}
function say(text,high,dur,voice){
  const miss=()=>{babble(dur,high?200:120,.07);};
  if(AU.muted)return;
  // a recorded reading of this exact line, if the page carries one (sounds/make_voices.py): the anchors come out of the TV's speaker, everyone else is in the room with you
  { const k=typeof VLINE!=='undefined'&&VLINE[text],b=k&&ZBUF[k];
    if(b&&AU.ctx){shutUp();const src=AU.ctx.createBufferSource(),g=AU.ctx.createGain();src.buffer=b;g.gain.value=say.full?1.15:1.5;src.connect(g);g.connect(say.full?AU.out:AU.tv);src.start();say.src=src;src.onended=()=>{if(say.src===src)say.src=null;};return b.duration;} }
  if(AI.tts&&!say.noAI){      // a Claude voice when the app offers one; any refusal drops back to the device's speech for good
    try{AI.tts.speak(text,{voice:voice||(high?'airy':'rounded'),rate:1}).catch(e=>{const c=e&&e.code;if(c&&c!=='replaced'&&c!=='cancelled'&&c!=='stopped'&&c!=='viewer_stopped'){say.noAI=true;}});return;}catch(e){say.noAI=true;}
  }
  try{
    if(ttsOK===false||!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance)return miss();
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);newsV=newsV||newsVoices();
    if(newsV)u.voice=high?newsV.f:newsV.m;
    u.pitch=newsV&&!newsV.same?1:high?1.15:.85;u.rate=1;u.volume=say.full?.9:clamp((AU.tvVol===undefined?.9:AU.tvVol)*.85,.05,1);      // only shift the pitch when one voice has to play both anchors
    let started=false;u.onstart=()=>{started=true;ttsOK=true;};u.onerror=()=>{if(!started){ttsOK=false;}};
    speechSynthesis.speak(u);
    setTimeout(()=>{if(!started){ttsOK=false;try{speechSynthesis.cancel();}catch(e){}miss();}},650);
  }catch(e){ttsOK=false;miss();}
}
/* someone screaming while their throat fills: a cry that climbs, cracks and sags, fluttering faster and wetter as it goes,
   with bubbling underneath and a choke at the end. f0 is the speaking pitch (about 120 for him, 210 for her). */
function gurgle(t,vol,dest,f0){
  const c=AU.ctx,dur=2.1,wet=c.createGain(),l=c.createOscillator(),lg=c.createGain();
  wet.gain.value=.6;wet.connect(dest);
  l.type='sawtooth';l.frequency.setValueAtTime(9,t);l.frequency.linearRampToValueAtTime(27,t+dur*.6);l.frequency.linearRampToValueAtTime(7,t+dur);
  lg.gain.setValueAtTime(.04,t);lg.gain.linearRampToValueAtTime(.55,t+.6);l.connect(lg);lg.connect(wet.gain);l.start(t);l.stop(t+dur+.1);
  voiceF(f0*2.3,f0*3.3,.36,.55*vol,wet,t,[950,1500,2700],6);
  voiceF(f0*3.3,f0*2.5,.6,.6*vol,wet,t+.34,[900,1400,2600],9);
  voiceF(f0*2.5,f0*1.5,.55,.5*vol,wet,t+.9,[700,1150],14);
  voiceF(f0*1.5,f0*.8,.7,.4*vol,wet,t+1.4,[520,900],18);
  burst(1800,900,1.2,.9,.12*vol,dest,t,'bandpass');                                             // breath in the scream
  for(let i=0;i<22;i++){const tt=t+.4+Math.random()*1.6,k=(tt-t)/dur;                             // bubbles: more of them, and lower, toward the end
    burst(rand(260,620)*(1.2-k*.5),rand(120,240),6,rand(.05,.09),.4*vol*(.5+k),dest,tt,'bandpass');
    tone('sine',rand(90,170),rand(45,80),rand(.06,.11),.22*vol*(.5+k),dest,tt+.01);}
  burst(520,110,2,.45,.45*vol,dest,t+dur-.25,'lowpass');                                           // the choke
}
function shutUp(){try{if(say.src){say.src.stop();say.src=null;}}catch(e){}try{if(AI.tts)AI.tts.stop();}catch(e){}try{if('speechSynthesis' in window)speechSynthesis.cancel();}catch(e){}}

/* looping beds: far sirens, wind, fire, helicopter, water, and a low drone that swells with danger */
function startAmbience(){
  const c=AU.ctx,A=AU.amb;
  const loop=(ftype,freq,q,dest)=>{const s=auNoise(),f=c.createBiquadFilter(),g=c.createGain();f.type=ftype;f.frequency.value=freq;f.Q.value=q;g.gain.value=0;s.connect(f);f.connect(g);g.connect(dest||AU.out);s.start();return g;};
  A.wind=loop('lowpass',220,.3);
  A.fire=loop('bandpass',1500,.4);
  A.water=loop('highpass',2200,.3);
  // helicopter: low noise chopped by a fast tremolo
  {const g=loop('lowpass',380,.6),trem=c.createGain(),l=c.createOscillator(),lg=c.createGain();
   g.disconnect();g.connect(trem);trem.gain.value=.5;l.type='square';l.frequency.value=14;lg.gain.value=.5;l.connect(lg);lg.connect(trem.gain);l.start();trem.connect(AU.out);A.heli=g;}
  // distant siren: a slow wail
  {const o=c.createOscillator(),l=c.createOscillator(),lg=c.createGain(),f=c.createBiquadFilter(),g=c.createGain();
   o.type='triangle';o.frequency.value=820;l.frequency.value=.22;lg.gain.value=260;l.connect(lg);lg.connect(o.frequency);
   f.type='lowpass';f.frequency.value=1300;g.gain.value=0;o.connect(f);f.connect(g);g.connect(AU.out);o.start();l.start();A.siren=g;}
  // drone
  {const g=c.createGain(),f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=240;g.gain.value=0;
   for(const fq of [55,55.6,82.6]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=fq;o.connect(f);o.start();}
   f.connect(g);g.connect(AU.out);A.drone=g;A.droneF=f;}
}
function ambSet(name,v){const g=AU.amb[name];if(g&&AU.ctx)g.gain.setTargetAtTime(v,AU.ctx.currentTime,.25);}

/* Audio: everything is synthesized with Web Audio, no sound files. Starts on the first click (browsers require that). */
const AU={ctx:null,out:null,sfx:null,tv:null,amb:{},muted:false,noise:null};
let earX=0,earY=0;
function auInit(){
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return;}
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const c=AU.ctx=new AC();
    const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=7;comp.connect(c.destination);
    AU.out=c.createGain();AU.out.gain.value=.9;AU.out.connect(comp);
    AU.sfx=c.createGain();AU.sfx.gain.value=.8;AU.sfx.connect(AU.out);
    AU.tv=c.createGain();AU.tv.gain.value=0;AU.tv.connect(AU.out);
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
const SFX={
  swing(t,v,d){burst(500,2800,.9,.13,.45*v,d,t);},
  hit(t,v,d){tone('sine',150,45,.11,.9*v,d,t);burst(1800,500,.7,.06,.5*v,d,t,'lowpass');},
  crack(t,v,d){tone('square',880,180,.05,.2*v,d,t);tone('sine',190,45,.17,1*v,d,t);burst(3200,700,.5,.09,.6*v,d,t,'lowpass');},
  pop(t,v,d){tone('sine',430,60,.15,.9*v,d,t);burst(2400,2400,2,.05,.4*v,d,t);burst(900,200,.6,.2,.3*v,d,t+.03,'lowpass');},
  punch(t,v,d){tone('sine',120,50,.08,.7*v,d,t);burst(1200,400,.7,.05,.35*v,d,t,'lowpass');},
  gun(t,v,d){burst(5200,500,.4,.16,1.2*v,d,t,'lowpass');tone('sine',170,40,.13,1.1*v,d,t);burst(900,300,.5,.4,.22*v,d,t+.05,'lowpass');},
  shotgun(t,v,d){burst(4200,280,.4,.28,1.4*v,d,t,'lowpass');tone('sine',120,30,.22,1.3*v,d,t);burst(700,180,.5,.7,.3*v,d,t+.06,'lowpass');},
  dry(t,v,d){tone('square',1500,1200,.025,.15*v,d,t);},
  groan(t,v,d){const f=rand(68,105);voiceF(f,f*rand(.8,1.15),rand(.6,1.1),.4*v,d,t,[rand(450,700),rand(900,1300)],rand(4,7));},
  snarl(t,v,d){const f=rand(110,160);voiceF(f,f*1.5,.26,.5*v,d,t,[800,1700]);burst(1400,900,1,.2,.12*v,d,t);},
  roar(t,v,d){voiceF(62,48,1.1,.8*v,d,t,[380,820],9);burst(500,200,.7,.9,.3*v,d,t,'lowpass');},
  scream(t,v,d){const f=rand(470,640);voiceF(f,f*1.6,.55,.38*v,d,t,[1100,2600],11);},
  hurt(t,v,d){voiceF(185,120,.17,.55*v,d,t,[700,1200]);tone('sine',110,55,.1,.6*v,d,t);},
  bite(t,v,d){burst(900,300,1.2,.12,.6*v,d,t,'lowpass');tone('sine',95,50,.1,.7*v,d,t);},
  step(t,v,d){burst(rand(500,900),200,.8,.045,.1*v,d,t,'lowpass');},
  glass(t,v,d){for(let i=0;i<8;i++){const tt=t+i*.03+Math.random()*.03;burst(rand(4000,9000),rand(4000,9000),6,.1,.35*v,d,tt);tone('sine',rand(2500,6000),rand(2000,5000),.12,.07*v,d,tt);}burst(6000,1500,.5,.38,.5*v,d,t,'highpass');},
  pickup(t,v,d){tone('triangle',660,660,.07,.28*v,d,t);tone('triangle',990,990,.13,.28*v,d,t+.07);},
  heal(t,v,d){tone('sine',520,780,.25,.25*v,d,t);tone('sine',780,1040,.3,.2*v,d,t+.12);},
  boom(t,v,d){burst(1600,45,.3,1.5,1.7*v,d,t,'lowpass');tone('sine',72,22,1,1.7*v,d,t);burst(4500,400,.5,.25,.9*v,d,t,'lowpass');},
  bang(t,v,d){tone('sine',95,48,.13,.9*v,d,t);burst(600,150,.6,.08,.5*v,d,t,'lowpass');},
  crash(t,v,d){burst(2500,120,.4,.7,1.2*v,d,t,'lowpass');tone('sine',90,30,.4,1.1*v,d,t);for(let i=0;i<5;i++)burst(rand(3000,8000),rand(3000,8000),5,.12,.3*v,d,t+.05+i*.05);},
  skid(t,v,d){voiceF(900,700,.9,.25*v,d,t,[1400,2300],30);},
  dash(t,v,d){burst(800,2200,.8,.16,.3*v,d,t);},
  click(t,v,d){tone('square',1200,900,.03,.1*v,d,t);},
  crank(t,v,d){tone('square',240,170,.035,.2*v,d,t);burst(2400,1200,2,.03,.2*v,d,t);},
  clang(t,v,d){tone('triangle',520,505,.7,.5*v,d,t);tone('triangle',783,770,.5,.3*v,d,t);burst(3000,600,.6,.14,.7*v,d,t,'lowpass');},
  beep(t,v,d){for(let i=0;i<3;i++){tone('square',700,700,.2,.1*v,d,t+i*.3,.01);tone('square',1050,1050,.2,.07*v,d,t+i*.3,.01);}},
  alarm(t,v,d){for(let i=0;i<4;i++){tone('square',880,880,.16,.12*v,d,t+i*.36,.01);tone('square',660,660,.16,.12*v,d,t+i*.36+.18,.01);}},
  sting(t,v,d){[392,494,587,784].forEach((f,i)=>{tone('sawtooth',f,f,.5-i*.05,.07*v,d,t+i*.09,.02);tone('triangle',f*2,f*2,.4,.05*v,d,t+i*.09,.02);});},
  spark(t,v,d){burst(7000,3000,3,.05,.3*v,d,t);},
  splash(t,v,d){burst(1800,600,.6,.25,.3*v,d,t);},
  static(t,v,d){burst(4000,4000,.2,1.2,.16*v,d,t,'highpass');},
  join(t,v,d){[523,659,784].forEach((f,i)=>tone('triangle',f,f,.22,.2*v,d,t+i*.09,.01));},
};
function atten(x,y,range){if(x===undefined||x===null)return 1;const d=hyp(x-earX,y-earY);return Math.pow(clamp(1-d/(range||460),0,1),1.6);}
function sfx(name,x,y,vol,range){
  if(!AU.ctx||AU.muted)return;
  const a=atten(x,y,range)*(vol===undefined?1:vol);if(a<.012)return;
  let dest=AU.sfx;
  if(x!==undefined&&x!==null&&AU.ctx.createStereoPanner){const p=AU.ctx.createStereoPanner();p.pan.value=clamp((x-earX)/260,-1,1)*.75;p.connect(AU.sfx);dest=p;}
  try{SFX[name](AU.ctx.currentTime+.002,a,dest);}catch(e){}
}
/* TV speech stand-in: a run of nonsense syllables at a speaker's pitch. Goes through the TV channel so it gets quieter as you walk away. */
const VOWELS=[[730,1090],[270,2290],[570,840],[440,1020],[300,870],[660,1720],[530,1840]];
function babble(dur,pitch,vol){
  if(!AU.ctx||AU.muted)return;
  let t=AU.ctx.currentTime+.02;const end=t+dur;
  while(t<end){const d=rand(.07,.15),f=pitch*rand(.88,1.14);voiceF(f,f*rand(.92,1.07),d,vol,AU.tv,t,pick(VOWELS));t+=d+(Math.random()<.14?rand(.12,.24):rand(.01,.04));}
}
function tvSfx(name,vol){if(!AU.ctx||AU.muted)return;try{SFX[name](AU.ctx.currentTime+.002,vol===undefined?1:vol,AU.tv);}catch(e){}}
/* Real speech when the browser offers it. Falls back to babble if the voice never starts. */
let ttsOK=null;
function say(text,high,dur){
  const miss=()=>{babble(dur,high?215:118,.22);};
  if(AU.muted)return;
  try{
    if(ttsOK===false||!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance)return miss();
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text),vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));
    if(vs.length)u.voice=vs[high?Math.min(1,vs.length-1):0];
    u.pitch=high?1.25:.8;u.rate=1.12;u.volume=clamp(AU.tvVol===undefined?.9:AU.tvVol,.05,1);
    let started=false;u.onstart=()=>{started=true;ttsOK=true;};u.onerror=()=>{if(!started){ttsOK=false;}};
    speechSynthesis.speak(u);
    setTimeout(()=>{if(!started){ttsOK=false;try{speechSynthesis.cancel();}catch(e){}miss();}},650);
  }catch(e){ttsOK=false;miss();}
}
function shutUp(){try{if('speechSynthesis' in window)speechSynthesis.cancel();}catch(e){}}

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

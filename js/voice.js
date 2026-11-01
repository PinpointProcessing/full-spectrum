"use strict";
/* Squad voices over the radio. Each soldier has his own voice and a set of short lines (VOICE_LINES; the full line
   sheet with direction is docs/voice-lines.md). Recorded lines go in sounds/voice/<ID>/<key>_<n>.mp3 and are listed in
   sounds/voice/manifest.json; they play through a radio filter (band-limited, a little grit) with a squelch click and
   static before and after. Until a soldier's recordings exist, the browser's built-in speech stands in (robotic, and it
   can't be filtered, but the squelch still plays). One voice at a time; a line that would talk over another is dropped
   unless it's urgent; each soldier waits a few seconds before repeating the same kind of line. Hooks: say(u,key) from
   the game code, and callout() in combat.js, which speaks the matching line for a soldier's callouts. */
const VOICE={A1:{pitch:.92,rate:1.02,pick:0},A2:{pitch:.72,rate:.94,pick:1},B1:{pitch:1.18,rate:1.12,pick:2},B2:{pitch:.84,rate:.98,pick:3}};
const VOICE_LINES={
  ack_move:  ['Moving.','On it.','Copy, moving.'],
  ack_attack:['Engaging!','Target, firing!','On him!'],
  contact:   ['Contact!','Contact front!','We\'re spotted!'],
  man_down:  ['Man down!','He\'s down, he\'s down!','Medic! Man down!'],
  hit_down:  ['I\'m hit!','I\'m down!','Argh, I\'m hit!'],
  revive:    ['I\'ve got you.','Hang on, coming to you.','Moving to him.'],
  revived:   ['I\'m good, I\'m back in.','Back in it.','Thanks. Let\'s go.'],
  frag:      ['Frag out!','Grenade out!','Frag!'],
  kill:      ['Tango down.','Got him.','Hostile down.'],
  suppress:  ['Suppressing!','Keep their heads down!','Laying it on!'],
  pinned:    ['I\'m pinned!','Can\'t move, I\'m pinned!','Taking heavy fire!'],
  charge:    ['Charge set! Get clear!','Fire in the hole!','Charge is live, move!'],
  rpg:       ['RPG!','Rocket! Move!','RPG, get down!'],
  objective: ['Objective secure.','Area clear.','That\'s done. Moving on.'],
  heal:      ['Patching up.','Bandaging.','Fixing myself up.'],
  restock:   ['Restocked.','Topped up.','Grabbing ammo.'],
};
const URGENT=new Set(['man_down','hit_down','rpg','contact','charge']);
const CALLOUT_VOICE={'Frag out!':'frag','On my way':'revive','Back in it':'revived','Suppressing!':'suppress','Healing':'heal','Restocked':'restock','Charge set! Get clear!':'charge','Open fire!':'ack_attack','Focus fire':'ack_attack'};
let voiceBusyTill=0,voiceLast={},voiceFiles=null,voiceBufs={},sysVoices=[];
function bindVoice(){
  fetch('sounds/voice/manifest.json').then(r=>r.ok?r.json():null).then(m=>{voiceFiles=m||{};}).catch(()=>{voiceFiles={};});
  const load=()=>{try{sysVoices=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));}catch(e){}};
  if(window.speechSynthesis){load();speechSynthesis.onvoiceschanged=load;}
}
// speak line `key` as soldier u (urgent lines cut in; others wait their turn or are dropped)
function say(u,key){
  if(!u||u.side!=='P'||!sndOn||!VOICE_LINES[key]||state!=='play')return;
  const now=performance.now()/1000,k=u.id+key;
  if(voiceLast[k]&&now-voiceLast[k]<6)return;
  if(now<voiceBusyTill&&!URGENT.has(key))return;
  voiceLast[k]=now;
  const n=1+Math.floor(Math.random()*VOICE_LINES[key].length),file=`${key}_${n}`,text=VOICE_LINES[key][n-1];
  const have=voiceFiles&&voiceFiles[u.id]&&voiceFiles[u.id].includes(file);
  voiceBusyTill=now+1.8;
  squelch(0);
  if(have)playVoiceFile(u.id,file);else speakSystem(u.id,text);
}
function speakSystem(id,text){
  if(!window.speechSynthesis)return;
  try{
    speechSynthesis.cancel();
    const v=VOICE[id]||VOICE.A1,ut=new SpeechSynthesisUtterance(text);
    ut.pitch=v.pitch;ut.rate=v.rate;ut.volume=.9;if(sysVoices.length)ut.voice=sysVoices[v.pick%sysVoices.length];
    ut.onend=()=>squelch(0);speechSynthesis.speak(ut);
  }catch(e){}
}
function playVoiceFile(id,file){
  if(!AC)return;
  const go=buf=>{
    const s=AC.createBufferSource();s.buffer=buf;
    const hp=AC.createBiquadFilter(),lp=AC.createBiquadFilter(),sh=AC.createWaveShaper(),g=AC.createGain();
    hp.type='highpass';hp.frequency.value=380;lp.type='lowpass';lp.frequency.value=3200;
    const c=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;c[i]=Math.tanh(x*2.2);}sh.curve=c;g.gain.value=.85;
    s.connect(hp);hp.connect(lp);lp.connect(sh);sh.connect(g);g.connect(sndMaster);s.start(AC.currentTime+.06);
    setTimeout(()=>squelch(0),(buf.duration+.1)*1000);voiceBusyTill=performance.now()/1000+buf.duration+.3;
  };
  const key=id+'/'+file;
  if(voiceBufs[key])return go(voiceBufs[key]);
  fetch(`sounds/voice/${id}/${file}.mp3`).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no))).then(buf=>{voiceBufs[key]=buf;go(buf);}).catch(()=>{});
}
// the radio: a click and a short burst of static when someone keys up or lets go
function squelch(delay){
  if(!AC||!sndOn)return;
  const t=AC.currentTime+delay,g=AC.createGain();g.connect(sndMaster);
  noiseHit(g,t,.12,'bandpass',2400,1.5,.12,.003);toneHit(g,t,.03,'square',1400,null,.04,.002);
}

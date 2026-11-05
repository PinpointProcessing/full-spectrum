"use strict";
/* Voices. Every soldier, freed prisoner, scientist and hostile speaks his lines with his own voice, recorded as one mp3 per
   speaker (sounds/voice/<speaker>.mp3, all his lines in a row) and listed in sounds/voice/manifest.json with where each
   line starts and how long it is. The lines were made with Zonos v0.1, an open neural text-to-speech model (Apache-2.0;
   scripts in tools/voices/, credits in sounds/CREDITS.md), from the line lists in the code: VOICE_LINES here, BARKS (hunt.js), the
   scientists' and prisoners' lines (office.js). The squad speaks over the radio (band-limited, a little grit, a squelch
   click and static either side); the freed prisoners have no radios and the hostiles and scientists aren't on ours, so
   they're heard where they stand (quieter and duller further off, panned). If the files can't load (opened from
   file://), the browser's built-in speech stands in for the squad (robotic, can't be filtered). One radio voice at a
   time; a line that would talk over another is dropped unless it's urgent; each soldier waits a few seconds before
   repeating the same kind of line. Hooks: say(u,key) from the game code, and callout() in combat.js, which speaks the
   matching line for a soldier's callouts; voiceClip(speaker,clip,opts) for everyone else. */
const VOICE={A1:{pitch:.92,rate:1.02,pick:0},A2:{pitch:.72,rate:.94,pick:1},B1:{pitch:1.18,rate:1.12,pick:2},B2:{pitch:.84,rate:.98,pick:3}};
const VOICE_LINES={
  ack_move:  ['Moving.','On it.','Copy, moving.','Moving up.','On my way.'],
  ack_attack:['Engaging!','Target, firing!','On him!','Taking the shot!','Firing!'],
  contact:   ['Contact!','Contact front!','We\'re spotted!','They\'ve seen us!'],
  man_down:  ['Man down!','He\'s down, he\'s down!','Medic! Man down!'],
  hit_down:  ['I\'m hit!','I\'m down!','Argh, I\'m hit!'],
  revive:    ['I\'ve got you.','Hang on, coming to you.','Moving to him.'],
  revived:   ['I\'m good, I\'m back in.','Back in it.','Thanks. Let\'s go.'],
  frag:      ['Frag out!','Grenade out!','Frag!'],
  kill:      ['Tango down.','Got him.','Hostile down.','Target down.','He\'s done.'],
  suppress:  ['Suppressing!','Keep their heads down!','Laying it on!'],
  pinned:    ['I\'m pinned!','Can\'t move, I\'m pinned!','Taking heavy fire!','Need covering fire!'],
  charge:    ['Charge set! Get clear!','Fire in the hole!','Charge is live, move!'],
  rpg:       ['RPG!','Rocket! Move!','RPG, get down!'],
  objective: ['Objective secure.','Area clear.','That\'s done. Moving on.'],
  heal:      ['Patching up.','Bandaging.','Fixing myself up.'],
  restock:   ['Restocked.','Topped up.','Grabbing ammo.'],
  silent:    ['Taking the shot.','Quiet shot.','Lining it up.'],
  takedown:  ['Moving in.','Going quiet.','I\'ve got him.'],
  watch:     ['Watching.','Eyes on.','Covering that way.'],
  breach:    ['Breach! Breach!','Going in!','Clear the room!'],
  zip:       ['Hands where I can see them!','On your knees!','Don\'t move!'],
  card:      ['Got the access card.','The card\'s ours.','I\'ve got the card.'],
  lab:       ['Equipment\'s wrecked.','One less lab.','Smashed it.'],
};
const URGENT=new Set(['man_down','hit_down','rpg','contact','charge']);
const CALLOUT_VOICE={'Frag out!':'frag','On my way':'revive','Suppressing!':'suppress','Healing':'heal','Restocked':'restock','Charge set! Get clear!':'charge','Open fire!':'ack_attack','Focus fire':'ack_attack',
  'Taking aim':'silent','Moving in':'takedown','Watching':'watch','Breach! Breach!':'breach','Hands where I can see them!':'zip','Got the access card':'card','Smashed it':'lab'};
let voiceBusyTill=0,voiceLast={},VSPR=null,vBytes={},vLoad={},vCache=new Map(),sysVoices=[];
function bindVoice(){
  fetch('sounds/voice/manifest.json').then(r=>r.ok?r.json():null).then(m=>{VSPR=m&&m.v===3&&m.speakers?m:null;preloadVoices();}).catch(()=>{VSPR=null;});
  const load=()=>{try{sysVoices=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));}catch(e){}};
  if(window.speechSynthesis){load();speechSynthesis.onvoiceschanged=load;}
}
// a speaker's file (each of his lines a small mp3 of its own, one after another), fetched once and kept as it is: about 1 MB
function spriteBuf(sp){
  if(vBytes[sp])return vBytes[sp];
  const S=VSPR&&VSPR.speakers[sp];if(!S||!AC||vLoad[sp])return null;
  vLoad[sp]=fetch('sounds/voice/'+S.file).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>{vBytes[sp]=b;}).catch(()=>{});
  return null;
}
// One line, decoded the first time it's said (a few milliseconds) and kept among the last few dozen. Decoding everyone's lines
// up front took about 200 MB once inside the office building: too much for a phone, which reloads the page when it runs out.
const V_CACHE=40;
function clipBuf(sp,clip){
  const key=sp+'/'+clip,hit=vCache.get(key);if(hit){vCache.delete(key);vCache.set(key,hit);return hit;}   // (an AudioBuffer, or a Promise of one)
  const[o,n]=VSPR.speakers[sp].clips[clip],p=new Promise((ok,no)=>AC.decodeAudioData(vBytes[sp].slice(o,o+n),ok,no))
    .then(buf=>{let i=0;const ch=buf.getChannelData(0),m=Math.min(ch.length,buf.sampleRate*.3|0);while(i<m&&Math.abs(ch[i])<.003)i++;buf.lead=Math.max(0,i/buf.sampleRate-.01);   // (the encoder's silence at the start)
      if(vCache.get(key)===p)vCache.set(key,buf);return buf;})
    .catch(()=>{vCache.delete(key);return null;});
  vCache.set(key,p);while(vCache.size>V_CACHE)vCache.delete(vCache.keys().next().value);
  return p;
}
// who's fetched when: the squad and the hostiles once sound has started (audio.js); the prisoners and scientists on the way into
// the office building (interior.js) or when a save brings them back (office.js)
const VOICE_OUT=['A1','A2','B1','B2','E1','E2','E3'],VOICE_IN=['A3','A4','B3','B4','S1','S2','S3','S4'];
function preloadVoices(list=VOICE_OUT){if(VSPR&&AC)for(const sp of list)if(VSPR.speakers[sp])spriteBuf(sp);}
// one line: over the radio (o.radio) or out loud where he stands (o.x,o.y; o.muffle: behind a door). Returns its length in s
// (0 if it isn't there or the file isn't loaded yet); it starts as soon as it's decoded. Louder while there's shooting (Bryan).
function voiceClip(sp,clip,o={}){
  if(!AC||!sndOn||!VSPR)return 0;const S=VSPR.speakers[sp],c=S&&S.clips[clip];if(!c||!spriteBuf(sp))return 0;
  const rate=o.rate||(.97+Math.random()*.06),d=c[2]/rate,loud=contact&&!o.muffle?1.3:1;   // (a touch of difference each time)
  const play=buf=>{
    if(!buf||!sndOn)return;const s=AC.createBufferSource();s.buffer=buf;s.playbackRate.value=rate;
    if(o.radio){
      const hp=AC.createBiquadFilter(),lp=AC.createBiquadFilter(),sh=AC.createWaveShaper(),g=AC.createGain();
      hp.type='highpass';hp.frequency.value=380;lp.type='lowpass';lp.frequency.value=3200;
      const cv=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;cv[i]=Math.tanh(x*2.2);}sh.curve=cv;g.gain.value=.85*(o.gain??1)*loud;
      s.connect(hp);hp.connect(lp);lp.connect(sh);sh.connect(g);g.connect(sndMaster);
    }else{
      const out=voice(o.x,o.y,Math.min(1.4,(o.vol??.9)*loud),buf.duration/rate+.4);if(!out)return;
      if(o.muffle){const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=650;s.connect(lp);lp.connect(out);}else s.connect(out);
    }
    s.start(AC.currentTime+.01,buf.lead||0);
  };
  const b=clipBuf(sp,clip);if(b instanceof AudioBuffer)play(b);else b.then(play);
  return d;
}
// which of a line's versions next: each soldier goes through them all, shuffled, before any comes round again
const vOrder={};
function nextVariant(id,key,n){const k=id+key;let q=vOrder[k];if(!q||!q.length){q=vOrder[k]=[...Array(n).keys()].map(i=>i+1).sort(()=>Math.random()-.5);}return q.shift();}
// speak line `key` as soldier u (urgent lines cut in; others wait their turn or are dropped)
function say(u,key){
  if(!u||u.side!=='P'||!sndOn||!VOICE_LINES[key]||state!=='play')return;
  const now=performance.now()/1000,k=u.id+key;
  if(voiceLast[k]&&now-voiceLast[k]<6)return;
  if(now<voiceBusyTill&&!URGENT.has(key))return;
  voiceLast[k]=now;
  const n=nextVariant(u.id,key,VOICE_LINES[key].length),text=VOICE_LINES[key][n-1],radio=!u.joined;   // the freed prisoners have no radios: they say it out loud
  const d=voiceClip(u.id,`${key}_${n}`,{radio,x:u.x,y:u.y});
  if(d){voiceBusyTill=now+d+.3;if(radio){squelch(0);setTimeout(()=>squelch(0),(d+.1)*1000);}return;}
  voiceBusyTill=now+1.8;if(radio){squelch(0);speakSystem(u.id,text);}   // not loaded (or opened from a file): the browser's voice stands in
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
// the radio: a click and a short burst of static when someone keys up or lets go
function squelch(delay){
  if(!AC||!sndOn)return;
  const t=AC.currentTime+delay,g=AC.createGain();g.connect(sndMaster);
  noiseHit(g,t,.12,'bandpass',2400,1.5,.12,.003);toneHit(g,t,.03,'square',1400,null,.04,.002);
  if(samples.static&&samples.static.length){const s=AC.createBufferSource(),b=samples.static[(Math.random()*samples.static.length)|0],f=AC.createBiquadFilter(),v=AC.createGain();   // and a breath of recorded static
    s.buffer=b;f.type='bandpass';f.frequency.value=1800;f.Q.value=.8;v.gain.value=.09;s.connect(f);f.connect(v);v.connect(sndMaster);s.start(t,0,.18+Math.random()*.1);}
}

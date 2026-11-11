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
  cant:      ['I\'m pinned! I can\'t do that!'],   // (Bryan, after v104: pinned, told to do something he'd have to leave his spot for; combat.js's refusePinned)
  far:       ['Too far. Move me closer.'],   // (Bryan, after v104: what he's told to do is outside the circle round him; combat.js's tooFar)
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
const URGENT=new Set(['man_down','rpg','contact','charge','cant','far']);   // ('cant', 'far': the answer to an order, said at once)
// Bryan: "everyone is talking all the time". After anyone speaks, nothing that isn't urgent for TALK_GAP s; a man doesn't
// repeat the same kind of line within SAY_AGAIN s; most orders and actions go unspoken (CALLOUT_VOICE)
const TALK_GAP=6,SAY_AGAIN=25;
const CALLOUT_VOICE={'Frag out!':'frag','Suppressing!':'suppress','Charge set! Get clear!':'charge','Breach! Breach!':'breach','Hands where I can see them!':'zip','Got the access card':'card'};
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
// the pauses inside a line (Bryan, after v70: "They dont handle the commas well"; the model left 0.2-0.6 s of dead air at a
// comma): any quiet stretch inside the speech longer than gap s is cut down to it, with short fades either side of the cut.
// Banter keeps a little more; the count before a volley keeps its beat.
const VOICE_GAP=.14,BANTER_GAP=.2;
function tightenBuf(buf,gap){
  const sr=buf.sampleRate,a=buf.getChannelData(0),hop=Math.round(sr*.01),n=Math.floor(a.length/hop);if(n<3)return buf;
  const fr=new Float32Array(n);let mx=0;
  for(let i=0;i<n;i++){let s=0;for(let j=i*hop,e=j+hop;j<e;j++)s+=a[j]*a[j];fr[i]=Math.sqrt(s/hop);if(fr[i]>mx)mx=fr[i];}
  const thr=Math.max(mx*.06,1e-4),g=Math.round(gap*sr);let first=-1,last=-1;
  for(let i=0;i<n;i++)if(fr[i]>thr){if(first<0)first=i;last=i;}
  if(first<0||last<=first)return buf;
  const cuts=[];let s=-1;
  for(let i=first;i<=last;i++){if(fr[i]<=thr){if(s<0)s=i;}else{if(s>=0&&(i-s)*hop>g)cuts.push([s*hop+(g>>1),i*hop-(g>>1)]);s=-1;}}
  if(!cuts.length)return buf;
  const segs=[];let pos=0;for(const[x,y]of cuts){segs.push([pos,x]);pos=y;}segs.push([pos,a.length]);
  const out=AC.createBuffer(1,segs.reduce((t,[x,y])=>t+y-x,0),sr),o=out.getChannelData(0),f=Math.round(sr*.012);let w=0;
  segs.forEach(([x,y],k)=>{o.set(a.subarray(x,y),w);const L=y-x;
    if(k>0)for(let j=0;j<f&&j<L;j++)o[w+j]*=j/f;
    if(k<segs.length-1)for(let j=0;j<f&&j<L;j++)o[w+L-1-j]*=j/f;
    w+=L;});
  return out;
}
function clipBuf(sp,clip){
  const key=sp+'/'+clip,hit=vCache.get(key);if(hit){vCache.delete(key);vCache.set(key,hit);return hit;}   // (an AudioBuffer, or a Promise of one)
  const c=VSPR.speakers[sp].clips[clip],[o,n]=c,p=new Promise((ok,no)=>AC.decodeAudioData(vBytes[sp].slice(o,o+n),ok,no))
    .then(buf=>{
      if(!/volley/.test(clip))buf=tightenBuf(buf,/^ban_/.test(clip)?BANTER_GAP:VOICE_GAP);
      let i=0;const ch=buf.getChannelData(0),m=Math.min(ch.length,buf.sampleRate*.3|0);while(i<m&&Math.abs(ch[i])<.003)i++;buf.lead=Math.max(0,i/buf.sampleRate-.01);   // (the encoder's silence at the start)
      c[2]=+(buf.duration-buf.lead).toFixed(3);   // (how long it now lasts, for the next time it's asked)
      if(vCache.get(key)===p)vCache.set(key,buf);return buf;})
    .catch(()=>{vCache.delete(key);return null;});
  vCache.set(key,p);while(vCache.size>V_CACHE)vCache.delete(vCache.keys().next().value);
  return p;
}
// who's fetched when: the squad and the hostiles once sound has started (audio.js); the prisoners and scientists on the way into
// the office building (interior.js) or when a save brings them back (office.js)
const VOICE_OUT=['A1','A2','B1','B2','E1','E2','E3','PL'],VOICE_IN=['A3','A4','B3','B4','S1','S2','S3','S4'];
function preloadVoices(list=VOICE_OUT){if(VSPR&&AC)for(const sp of list)if(VSPR.speakers[sp])spriteBuf(sp);}
/* ---------- the radio (Bryan, after v70: "make it radio sounding... the throat scratchiness of a human") ----------
   A handset: the voice squashed flat the way a radio's level control does it, a throat that wavers a little 30-90 times a
   second (a rough voice, not a smooth machine one), driven into clipping (the grit of a man talking hard into the mic), cut
   to a narrow band with a small speaker's honk in the middle, and a bed of hiss under it while the key is down. */
const RADIO={lo:440,hi:2800,honk:1600,honkDb:6,drive:3.2,grit:.14,hiss:.022,level:.8};
const radioBufs=new WeakMap();   // (per audio context: the noise for the waver and the hiss)
function radioNoise(ctx){
  let b=radioBufs.get(ctx);if(b)return b;
  const sr=ctx.sampleRate,n=sr*4|0,k1=1-Math.exp(-2*Math.PI*90/sr),k2=1-Math.exp(-2*Math.PI*30/sr),m=sr*.05|0;
  const grit=ctx.createBuffer(1,n,sr),g=grit.getChannelData(0),hiss=ctx.createBuffer(1,n,sr),h=hiss.getChannelData(0);
  let a=0,c=0,s=0;for(let i=0;i<n;i++){a+=k1*((Math.random()*2-1)-a);c+=k2*(a-c);g[i]=a-c;s+=g[i]*g[i];h[i]=Math.random()*2-1;}   // (30-90 Hz: a low-pass at 90 less one at 30)
  const r=Math.sqrt(s/n)||1;for(let i=0;i<n;i++)g[i]/=r;
  for(let i=0;i<m;i++){const t=i/m;g[n-m+i]=g[n-m+i]*(1-t)+g[i]*t;}   // (its end eased into its start: it loops without a click)
  b={grit,hiss};radioBufs.set(ctx,b);return b;
}
const clipCurves={};
function clipCurve(k){   // a hard, slightly lopsided clip (lopsided like an overdriven mic: rougher)
  if(clipCurves[k])return clipCurves[k];
  const n=1024,cv=new Float32Array(n),o=.12,t0=Math.tanh(k*o);let mx=0;
  for(let i=0;i<n;i++){const x=i/(n-1)*2-1;cv[i]=Math.tanh(k*(x+o))-t0;mx=Math.max(mx,Math.abs(cv[i]));}
  for(let i=0;i<n;i++)cv[i]/=mx;return clipCurves[k]=cv;
}
// one line over the radio, from src into dest; dur: how long it plays (for the hiss); o overrides RADIO's settings
function radioChain(ctx,src,dest,dur,o={}){
  const R=Object.assign({},RADIO,o),t=ctx.currentTime,N=radioNoise(ctx);
  const node=(type,f,q,g)=>{const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;if(q!=null)b.Q.value=q;if(g!=null)b.gain.value=g;return b;};
  const pre=node('highpass',180,.7),comp=ctx.createDynamicsCompressor();
  comp.threshold.value=-34;comp.knee.value=6;comp.ratio.value=12;comp.attack.value=.002;comp.release.value=.14;
  const wav=ctx.createGain();wav.gain.value=1;
  if(R.grit>0){const w=ctx.createBufferSource(),d=ctx.createGain();w.buffer=N.grit;w.loop=true;d.gain.value=R.grit;w.connect(d);d.connect(wav.gain);w.start(t,Math.random()*3);w.stop(t+dur+.5);}
  const band1=[node('highpass',400,.7),node('lowpass',3200,.7),node('peaking',R.honk,1.1,R.honkDb)];   // (the band and the honk before the clip: after it they'd ring)
  const drive=ctx.createGain();drive.gain.value=R.drive;
  const clip=ctx.createWaveShaper();clip.curve=clipCurve(2.5);clip.oversample='2x';
  const band2=[node('highpass',R.lo,.7),node('lowpass',R.hi,.7)];
  const lim=ctx.createDynamicsCompressor();lim.threshold.value=-10;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.06;   // (the receiver's limiter: no peak gets out of hand)
  const out=ctx.createGain();out.gain.value=R.level;
  [pre,comp,wav,...band1,drive,clip,...band2,lim,out].reduce((a,b)=>(a.connect(b),b),src);out.connect(dest);
  if(R.hiss>0){   // the hiss while the key's down (the squelch's bursts either side: squelch())
    const h=ctx.createBufferSource(),bp=node('bandpass',2100,.5),hg=ctx.createGain();h.buffer=N.hiss;h.loop=true;
    hg.gain.setValueAtTime(0,t);hg.gain.linearRampToValueAtTime(R.hiss,t+.03);hg.gain.setValueAtTime(R.hiss,t+dur);hg.gain.linearRampToValueAtTime(0,t+dur+.08);
    h.connect(bp);bp.connect(hg);hg.connect(dest);h.start(t,Math.random()*3);h.stop(t+dur+.1);
  }
  return out;
}
// one line: over the radio (o.radio) or out loud where he stands (o.x,o.y; o.muffle: behind a door). Returns its length in s
// (0 if it isn't there or the file isn't loaded yet); it starts as soon as it's decoded. Louder while there's shooting (Bryan).
function voiceClip(sp,clip,o={}){
  if(!AC||!sndOn||!VSPR)return 0;const S=VSPR.speakers[sp],c=S&&S.clips[clip];if(!c||!spriteBuf(sp))return 0;
  const rate=o.rate||(.97+Math.random()*.06),d=c[2]/rate,loud=contact&&!o.muffle?1.3:1;   // (a touch of difference each time)
  const play=buf=>{
    if(!buf||!sndOn)return;const s=AC.createBufferSource();s.buffer=buf;s.playbackRate.value=rate;if(o.onSrc)o.onSrc(s);   // (o.onSrc: whoever wants to stop it early, story.js)
    if(o.radio)radioChain(AC,s,sndMaster,buf.duration/rate,{level:RADIO.level*(o.gain??1)*loud});
    else{
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
  if(!u||u.side!=='P'||!sndOn||!VOICE_LINES[key]||state!=='play'||MAPID==='dd')return;   // (D-Day: the Warehouse squad's radio lines don't belong there; its own voices are to come)
  const now=performance.now()/1000,k=u.id+key;
  if(voiceLast[k]&&now-voiceLast[k]<(key==='cant'||key==='far'?4:SAY_AGAIN))return;
  if(key==='far'&&VSPR&&!(VSPR.speakers[u.id]&&VSPR.speakers[u.id].clips.far_1))return;   // (not in his file: the bubble says it)
  if(!URGENT.has(key)&&now<voiceBusyTill+TALK_GAP)return;
  voiceLast[k]=now;
  const n=nextVariant(u.id,key,VOICE_LINES[key].length),text=VOICE_LINES[key][n-1],radio=!u.joined||!!u.kitted;   // the freed prisoners have no radios (until they're kitted out at the HQ: base.js): they say it out loud
  const old=key==='cant'&&VSPR&&!(VSPR.speakers[u.id]&&VSPR.speakers[u.id].clips.cant_1);   // (a voice file without the line yet: his "Can't move, I'm pinned!")
  const d=voiceClip(u.id,old?'pinned_2':`${key}_${n}`,{radio,x:u.x,y:u.y});
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

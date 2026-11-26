"use strict";
/* D-Day's weapon sounds, Version 188 (Bryan: "the audio is too modern sounding. It needs to fit the aesthetic of D-Day"; "The turrets
   should have a THUD THUD THUD sounding like a heavy machine gunner would"). Real recordings of the period's guns, cut from The Free
   Firearm Sound Library (CC0) into sounds/guns/ (one mp3 a kind, its takes one after another, manifest.json says where each is):
   the M1 Garand and the Springfield from an M1917 Enfield's and a Tikka's .30-06 (with the Garand's clip pinging out every eighth
   round), the BAR from the same cartridge at its own rate, the Germans' Kar98k from a Mosin-Nagant and an Arisaka, the odd MP40 from
   a Carl Gustav M45, and the bunkers' machine guns a heavy thud (a .30-06 report taken down and filled out) about six beats a second.
   Each gun has a near and a far take; distance (from the middle of the view, or the man you're playing in first person) makes a
   shot quieter, duller, wetter with echo, and later (sound's speed). Blasts by what made them: a grenade's crack, a mortar's crump,
   a shell's deep boom, a tank's gun, a shell into the sea (a thump and a splash), CC0 explosion recordings (sounds/CREDITS.md)
   layered with a crack, a sub-bass knock and falling sand. Incoming shells whistle down for the last second and a half, louder the
   nearer they land; rounds that just miss the squad you're playing crack past; bullets into sand puff, into concrete chip. The
   blasts' recordings are EQ'd so they carry on a phone's small speaker (a shell had sounded no louder than a rifle there); every
   shot and blast also slaps back off the bluffs, the base or the village walls a moment later (ddsEcho); a landing craft's ramp
   clanks down into the shallows (ddsRamp); and men's cries and screams go by the same distance as the guns, a few at once
   (ddsSample), so a crowded beach isn't one long scream.
   ddSfxFrame from audio.js's audioFrame every frame on this map; sfxShotDD, sfxBoom, sfxCannon, sfxImpact, sfxClang, sfxFlesh and
   playSample hand over to ddsShot, ddsBoom, ddsCannon, ddsImpact, ddsRamp, ddsFleshOK and ddsSample here. Everything checks AC and
   sndOn: with sound off nothing is made. */
const DSFX={whT:0,cat:{},buf:{},live:[],trk:[],rk:[],wh:[],fired:[],blasts:[],frame:0,crackT:0,crackN:0,fakeT:0,hitT:0,crack:null};
const DDS_MAX=24,DDS_BUSY=12,DDS_FAR=30;   // voices of ours at once; past BUSY only the louder get in; past FAR m a gun's far take
// each gun: its near and far takes, how loud at the muzzle, its pitch range (a little different every round), and how many bursts
// of it further off than about 25 m may sound at once (a beach with forty rifles going is a wall of noise otherwise; the near
// ones always sound)
// (carry, Version 188 pass 3: how far it carries, ddsPlace's distance scale: the bunkers' guns are the beach's threat and were
// lost under everything 80 m off; a bolt rifle's crack carries further than a submachine gun's)
const DDS_GUN={
  m1:{near:'us',far:'usfar',vol:.5,r:[.98,1.07],cap:4,carry:1.2},
  spring:{near:'us',far:'usfar',vol:.75,r:[.9,.95],cap:2,carry:1.5},
  bar:{near:'bar',far:'usfar',vol:.48,r:[.96,1.04],cap:3,carry:1.4},
  kar:{near:'kar',far:'karfar',vol:.6,r:[.95,1.05],cap:4,carry:1.6},
  ksnip:{near:'kar',far:'karfar',vol:.72,r:[.88,.93],cap:2,carry:1.6},
  mp40:{near:'smg',far:'smgfar',vol:.48,r:[.96,1.05],cap:2,carry:1},
  trench:{near:'trench',far:'usfar',vol:.65,r:[.96,1.03],cap:2,carry:1.1},
  mg:{near:'thud',far:'thud',vol:.9,r:[.97,1.03],cap:4,carry:1.9}};
const ddsR=(a,b)=>a+Math.random()*(b-a);

/* ---------- loading (from audioInit) ---------- */
function ddsLoad(){
  fetch('sounds/guns/manifest.json').then(r=>r.ok?r.json():Promise.reject()).then(m=>{
    for(const[k,spans]of Object.entries(m))fetch(`sounds/guns/${k}.mp3`).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no)))
      .then(buf=>{DSFX.buf[k]=spans.map(([t,d])=>ddsSlice(buf,t,d));ddsAlias();}).catch(()=>{});
  }).catch(()=>{});
  DSFX.crack=[0,1,2].map(ddsCrackBuf);
}
// one take out of a kind's file, from just before its sound starts (an mp3 decoder may shift it a few ms either way)
function ddsSlice(buf,t,d){
  const sr=buf.sampleRate,c=buf.getChannelData(0),a0=Math.max(0,Math.floor((t-.05)*sr)),a1=Math.min(c.length,Math.floor((t+d+.04)*sr));
  let pk=0;for(let i=a0;i<a1;i++)pk=Math.max(pk,Math.abs(c[i]));
  let s=a0;while(s<a1&&Math.abs(c[s])<pk*.04)s++;s=Math.max(a0,s-Math.floor(.002*sr));
  const n=Math.max(1,a1-s),o=AC.createBuffer(1,n,sr);o.getChannelData(0).set(c.subarray(s,s+n));return o;
}
// the other game's code paths ask for these kinds: give them the period guns too
function ddsAlias(){if(DSFX.buf.us)samples.shot=DSFX.buf.us;if(DSFX.buf.kar)samples.enemy=DSFX.buf.kar;if(DSFX.buf.bar)samples.mg=DSFX.buf.bar;}
// a supersonic round going past: its N-wave snap, the ground's echo of it a moment later, and a short tearing hiss
function ddsCrackBuf(v){
  const sr=AC.sampleRate,n=Math.floor(sr*.06),b=AC.createBuffer(1,n,sr),d=b.getChannelData(0),w=Math.max(8,Math.floor(sr*(.00045+v*.00012)));
  const nw=(at,a)=>{for(let i=0;i<w&&at+i<n;i++)d[at+i]+=a*(1-2*i/w);};nw(0,1);nw(Math.floor(sr*(.0016+v*.0007)),-.45);
  let y=0;for(let i=Math.floor(sr*.001);i<n;i++){const t=i/sr,x=(Math.random()*2-1)*Math.exp(-t/(.009+v*.003))*.32;y+=.35*(x-y);d[i]+=x-y;}   // (the hiss: high-passed noise)
  return b;
}

/* ---------- where a sound is: distance, pan, echo ---------- */
// the listener: the man you're playing in first person, else the middle of the view, a few metres up (the squad is right there)
const DDS_P={d:0,g:1,lp:19000,send:.1,pan:0,dl:0};
function ddsPlace(x,y,carry=1){
  const F=typeof dd!=='undefined'&&dd&&dd.fp&&dd.fp.u,lx=F?F.x:camT.x,ly=F?F.y:camT.z,dx=(x-lx)/10,dy=(y-ly)/10,h=F?1.7:7,P=DDS_P;
  P.d=Math.sqrt(dx*dx+dy*dy+h*h);P.g=1/(1+Math.pow(P.d/(18*carry),1.7));P.lp=clamp(19000*Math.exp(-P.d/50),1300,19000);P.send=.1+.32*clamp(P.d/100,0,1);
  P.dl=P.d>12?Math.min(.3,P.d/343):0;   // (sound's speed: a flash 60 m off is heard a sixth of a second later)
  P.pan=0;if(typeof camera!=='undefined'&&camera){const e=camera.matrixWorld.elements,cx=x-camera.position.x,cz=y-camera.position.z,l=Math.sqrt(cx*cx+cz*cz)||1;P.pan=clamp((cx*e[0]+cz*e[2])/l*1.1,-.8,.8);}
  return P;
}
// a voice of ours: gain -> distance low-pass -> pan -> the mix, with a send to the echo that grows with distance, and (echo, Version
// 188 pass 2) one to the slap back off the bluffs or the walls (ddsEcho). Counted by when it ends (AC time), so a crowded fight
// drops the faintest new sounds rather than the nearest
function ddsOut(x,y,vol,dur,force,echo,carry,lpMin){   // (lpMin, Version 253: a floor under the distance's low-pass: Chapter 2's opening's distant war, ddsBurst)
  if(!AC||!sndOn)return null;
  const now=AC.currentTime,L=DSFX.live;for(let i=L.length-1;i>=0;i--)if(L[i]<now)L.splice(i,1);
  const P=ddsPlace(x,y,carry),g0=vol*P.g;
  if(g0<.004||!force&&(L.length>=DDS_MAX||L.length>=DDS_BUSY&&g0<.12))return null;
  const g=AC.createGain(),lp=AC.createBiquadFilter();g.gain.value=g0;lp.type='lowpass';lp.frequency.value=Math.max(P.lp,lpMin||0);lp.Q.value=.4;g.connect(lp);
  let out=lp,p=null;if(AC.createStereoPanner){p=AC.createStereoPanner();p.pan.value=P.pan;lp.connect(p);out=p;}
  out.connect(sndMuffle);const s=AC.createGain();s.gain.value=P.send;out.connect(s);s.connect(sndVerb);
  let e=null;if(echo){e=AC.createGain();e.gain.value=echo*(.55+.45*clamp(P.d/60,0,1));out.connect(e);e.connect(ddsEcho());}
  const t0=now+P.dl;L.push(t0+dur);setTimeout(()=>{for(const n of[g,lp,p,s,e])if(n)n.disconnect();},(P.dl+dur+.4)*1000);
  return{g,t0,d:P.d,k:P.g};
}
// the slap back (Version 188 pass 2): a shot or a blast comes back off the bluffs behind the beach, the base's buildings or the
// village's walls a moment later, duller, from the other side: two taps, the first a third of a second on, the second later and
// fainter, low-passed and with nothing under 160 Hz (so it doesn't boom). Shared by every voice, made once per audio context;
// how far off the walls are goes with the chapter (DDS_ECHO)
const DDS_ECHO={beach:[.42,.79],counter:[.27,.52],village:[.19,.36]};
function ddsEcho(){
  const E=DSFX.echo;if(E&&E.ctx===AC)return E.in;
  const i=AC.createGain(),hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=160;i.connect(hp);
  const taps=[[1700,.4,-.4],[1100,.22,.45]].map(([f,a,pn])=>{const d=AC.createDelay(1.5),lo=AC.createBiquadFilter(),g=AC.createGain();lo.type='lowpass';lo.frequency.value=f;g.gain.value=a;hp.connect(d);d.connect(lo);lo.connect(g);
    let o=g;if(AC.createStereoPanner){const P=AC.createStereoPanner();P.pan.value=pn;g.connect(P);o=P;}o.connect(sndMuffle);const sv=AC.createGain();sv.gain.value=.3;o.connect(sv);sv.connect(sndVerb);return d;});
  DSFX.echo={ctx:AC,in:i,taps,mode:null};ddsEchoMode();return i;
}
function ddsEchoMode(){const E=DSFX.echo,m=typeof DD_MODE!=='undefined'&&DDS_ECHO[DD_MODE]?DD_MODE:'beach';if(!E||E.ctx!==AC||E.mode===m)return;E.mode=m;E.taps.forEach((d,k)=>{d.delayTime.value=DDS_ECHO[m][k]*ddsR(.95,1.05);});}
// a recorded take into a voice at a time, at a speed, at a level (hp: high-passed there, to take out a sub-bass a phone can't play
// and the mix's compressor would only duck everything else for)
function ddsSrc(o,buf,at,rate,vol,hp){
  if(!buf)return;const s=AC.createBufferSource();s.buffer=buf;s.playbackRate.value=rate;let n=s;
  if(hp){const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=hp;f.Q.value=.6;n.connect(f);n=f;}
  if(vol!==1){const g=AC.createGain();g.gain.value=vol;n.connect(g);n=g;}n.connect(o.g);s.start(Math.max(at,AC.currentTime));
}
const ddsPick=k=>{const L=DSFX.buf[k];return L&&L.length?L[(Math.random()*L.length)|0]:null;};

/* ---------- guns ---------- */
// which gun a man has, by side and weapon (Version 188: one in five of their riflemen sounds like an MP40)
function ddsGun(u){
  if(u.gunner||u.onGun)return'mg';const w=u.weapon;
  if(u.side==='E'){if(w==='sniper')return'ksnip';if(w==='shotgun')return'trench';const h=u.id?u.id.charCodeAt(u.id.length-1)+u.id.length:0;return h%5===0?'mp40':'kar';}
  return w==='hmg'?'bar':w==='sniper'?'spring':w==='shotgun'?'trench':'m1';
}
// the queue in combat.js plays one call a round, about 0.07 s apart: the first of a burst plays the whole burst at the gun's own
// rate (a bolt rifle once; the M1 three aimed shots; the BAR five rounds; the mounted guns three or four thuds) and the rest are
// let go. In first person every round is played as it's fired
function ddsShot(u){
  if(!AC||!sndOn)return true;
  DSFX.fired.push(u);
  const gun=ddsGun(u),G=DDS_GUN[gun],ts=Math.max(.25,timeScale()||1);
  if(!u.id)return ddsFake(u,gun);   // (the ride in and the battle next door: shots from nobody in particular, ddplay.js)
  const fp=typeof dd!=='undefined'&&dd&&dd.fp&&dd.fp.u===u;
  if(fp){if(gun==='mg'){const now=AC.currentTime;if(now-(u.thudT||0)<.16)return true;u.thudT=now;}ddsBurst(u,gun,G,[0],ts);return true;}
  if(simT<(u.ddsEnd||0))return true;u.ddsEnd=simT+.5;
  ddsBurst(u,gun,G,ddsPattern(u,gun),ts);return true;
}
// the offsets (game seconds) of the rounds heard in one burst
function ddsPattern(u,gun){
  const near=ddsPlace(u.x,u.y).d<60;
  switch(gun){
    case'mg':{const n=Math.random()<.4?4:3,L=[];for(let i=0;i<n;i++)L.push(i*.165+ddsR(-.008,.008)*(i>0));return L;}
    case'bar':{const fast=u.supK>=1.5,n=fast?9:5,s=fast?.06:.122,L=[];for(let i=0;i<n;i++)L.push(i*s+(i?ddsR(-.006,.006):0));return L;}
    case'm1':return!near||u.npc&&Math.random()<.7?[0]:u.npc||u.team!==dd.active?[0,ddsR(.3,.42)]:[0,ddsR(.26,.34),ddsR(.56,.68)];   // (the squad you're playing three aimed shots, the other two, the other troops mostly one)
    case'kar':return near&&Math.random()<.22?[0,ddsR(.95,1.2)]:[0];
    default:return[0];
  }
}
function ddsBurst(u,gun,G,offs,ts){
  const last=offs[offs.length-1]/ts,P=ddsPlace(u.x,u.y),now=AC.currentTime,C=DSFX.cat[gun]||(DSFX.cat[gun]=[]);for(let i=C.length-1;i>=0;i--)if(C[i]<now)C.splice(i,1);
  if(P.d>25&&C.length>=G.cap)return;
  // (u.ddsX, Versions 252 and 253: Chapter 2's opening's distant war, ddcseq.js's DCS.far: k, heard as far as a gun k times nearer; v, louder; and
  // made for a phone's speaker: near, the close recordings, which have the crack (the far ones are rumble below 800 Hz); lp, a floor under the
  // distance's low-pass; hp, the lows taken off, which a phone can't play and which only made it boom)
  const X=u.ddsX,o=ddsOut(u.x,u.y,G.vol*(u.npc?.6:1)*(X&&X.v||1),last+1.7,false,gun==='mg'?.35:.8,G.carry*(X&&X.k||1),X&&X.lp);if(!o)return;C.push(o.t0+last+.6);   // (the other troops under your own squads: there are dozens of them)
  const far=o.d>DDS_FAR&&!(X&&X.near),kind=far?G.far:G.near,hp=X&&X.hp;
  for(let i=0;i<offs.length;i++){
    const at=o.t0+offs[i]/ts,r=ddsR(G.r[0],G.r[1]);
    if(gun==='bar'&&!far&&i<offs.length-1)ddsSrc(o,ddsPick('bar'),at,r*(u.supK>=1.5?1.06:1),ddsR(.85,1),hp);   // (a round inside the burst: its report cut short; the last one rings out)
    else if(gun==='bar'&&!far)ddsSrc(o,ddsPick('us'),at,r,1,hp);
    else ddsSrc(o,ddsPick(kind),at,r,i?ddsR(.82,1):1,hp);
    if(gun==='m1')ddsPing(u,at,o);
  }
  if(gun==='spring'&&o.d<30)ddsBolt(o,o.t0+offs[0]/ts+.55/ts);
}
// the M1's en-bloc clip flying out after the eighth round: a bright ring of thin steel (only heard close by)
function ddsPing(u,at,o){
  u.ddsN=(u.ddsN||0)+1;if(u.ddsN<8)return;u.ddsN=0;if(o.d>26)return;
  const t=at+.07,f=ddsR(2450,2900),k=.5/Math.max(.35,o.k);
  noiseHit(o.g,t,.006,'highpass',4500,0,.18*k,.0005);
  for(const[m,a,dc]of[[1,.2,.32],[1.47,.1,.2],[2.09,.06,.11]])toneHit(o.g,t,dc,'sine',f*m,f*m*.985,a*k,.0015);
}
// a bolt worked after the Springfield's shot: two dry clacks
function ddsBolt(o,t){for(const[dt,f]of[[0,1900],[.24,1300]]){noiseHit(o.g,t+dt,.025,'bandpass',f,3,.12,.001);noiseHit(o.g,t+dt,.04,'bandpass',f*.45,2,.08,.002);}}
// shots from nobody in particular (the ride in's guns on the bunkers, the battle next door): a machine gun's short run, or a rifle
function ddsFake(u,gun){
  const now=AC.currentTime;if(now<DSFX.fakeT)return true;DSFX.fakeT=now+(gun==='mg'?.28:.12);
  if(gun==='mg'){const n=2+(Math.random()<.5),L=[];for(let i=0;i<n;i++)L.push(i*.165);ddsBurst(u,gun,{...DDS_GUN.mg,r:[.93,1.08]},L,1);}
  else ddsBurst(u,Math.random()<.5?'kar':'m1',Math.random()<.5?DDS_GUN.kar:DDS_GUN.m1,[0],1);
  return true;
}
// a round fired without a call to sfxShot (combat.js's suppressShot plays nothing unless silenced): heard from the flash it leaves
function ddsLoose(u){
  if(!u||u.dead||DSFX.fired.includes(u))return;const gun=ddsGun(u),G=DDS_GUN[gun];
  if(gun==='mg'){if(simT<(u.ddsEnd||0))return;u.ddsEnd=simT+.45;ddsBurst(u,gun,G,[0,.165,.33],Math.max(.25,timeScale()||1));return;}
  ddsBurst(u,gun,G,gun==='bar'?[0,.12]:[0],Math.max(.25,timeScale()||1));
}

/* ---------- blasts ---------- */
// what a blast at (x,y) was: the shell or grenade that landed there (seen in nades on its way), a rocket that just struck, else by size
function ddsKind(x,y,size){
  if(typeof DD_MODE!=='undefined'&&DD_MODE==='beach'&&y>706)return'sea';
  for(const n of DSFX.trk)if(n.x1===x&&n.y1===y)return n.ddsK;
  for(const r of DSFX.rk)if(r.ddsGone&&Math.abs(r.x-x)<40&&Math.abs(r.y-y)<40)return'rocket';
  return size>=1.3?'big':'frag';
}
function ddsNadeKind(n){
  if(n.smoke)return'smoke';const b=n.by;
  if(n.shell)return'art';
  if(b&&b.side==='E'){if(typeof dd!=='undefined'&&dd&&(dd.tanks||[]).includes(b))return'tank';if(b.tag==='heavy'||b.tag==='art'||b.tag==='cannon')return'art';if(n.R===42)return'lob';if(n.R)return'mortar';return'frag';}
  return n.gl?'rgl':'frag';
}
function ddsBoom(x,y,size){
  if(!AC||!sndOn)return;
  const now=AC.currentTime,kind=ddsKind(x,y,size);
  // a blast right after another in the same spot (a bunker going up in several bursts) is a smaller one inside it; the very same
  // spot again at once (a blast both pushed to booms and played) is the same blast: once is enough
  let sec=false;for(let i=DSFX.blasts.length-1;i>=0;i--){const b=DSFX.blasts[i];if(now-b.t>.6){DSFX.blasts.splice(i,1);continue;}if(b.x===x&&b.y===y&&now-b.t<.1)return;if(Math.abs(b.x-x)<60&&Math.abs(b.y-y)<60)sec=true;}
  if(hyp(x-(dd&&dd.fp&&dd.fp.u?dd.fp.u.x:camT.x),y-(dd&&dd.fp&&dd.fp.u?dd.fp.u.y:camT.z))>800){const F=DSFX.cat.farx||(DSFX.cat.farx=[]);for(let i=F.length-1;i>=0;i--)if(F[i]<now)F.splice(i,1);if(F.length>=2)return;F.push(now+2.2);}   // (Version 188 pass 3: two far blasts rolling at once at most; a shelled beach was a wall of them)
  DSFX.blasts.push({x,y,t:now});
  const o=ddsOut(x,y,1,4.5,true,.7,kind==='art'||kind==='big'||kind==='sea'?1.6:1.3);if(!o)return;const t=o.t0,far=o.d>80;   // (a blast carries further than a shot)
  const v=sec?.45:1,boom=samples.boom&&samples.boom.length?samples.boom[(Math.random()*samples.boom.length)|0]:null;
  if(kind==='sea'){   // a shell into the sea: a deep thump under the water, the column of it going up, the spray falling back
    ddsSrc(o,ddsPick('xsea'),t,ddsR(.86,1.02)*(size<.8?1.1:1),v*1.4);ddsSrc(o,ddsPick('xfar'),t,ddsR(.75,.85),v*.7);
    toneHit(o.g,t,.45,'sine',80,42,.25*v,.006);ddsGrains(o,t+.35,1.4,9,3200,.05*v);return;}
  if(far){ddsSrc(o,ddsPick('xfar'),t,ddsR(.88,1.08)*(kind==='frag'||kind==='lob'||kind==='rgl'?1.12:1),v*(kind==='art'||kind==='big'?1.25:1));return;}   // (far off: a dull boom rolling in; Version 188 pass 1: the far takes carry on a phone now)
  const crack=(rt,a)=>ddsSrc(o,ddsPick('us'),t,rt*ddsR(.95,1.05),a*v),xm=ddsPick('xmid');
  // Version 188 pass 1: each kind its own recording (sounds/guns: xbig, xmid, xfrag, made to carry on a phone's speaker) under a
  // crack (a rifle report an octave down) and a short sub-bass knock for headphones, then earth falling back
  switch(kind){
    case'art':case'big':   // a shell or a bunker going up: the big boom, earth and sand coming down for a while
      ddsSrc(o,ddsPick('xbig'),t,kind==='big'?ddsR(.84,.92):ddsR(.88,.98),v);if(kind==='big'&&xm)ddsSrc(o,xm,t,ddsR(.9,1),v*.5);crack(.42,.45);   // (a building going up: a harder bang inside the boom)
      toneHit(o.g,t,.6,'sine',80,40,.25*v,.006);ddsGrains(o,t+.25,1.8,14,2400,.07*v);break;
    case'tank':   // a tank's shell: a sharp crack and a heavy bang
      ddsSrc(o,xm,t,ddsR(.95,1.05),v*.95);crack(.47,.6);toneHit(o.g,t,.4,'sine',95,45,.25*v,.004);ddsGrains(o,t+.2,1,8,2600,.05*v);break;
    case'mortar':   // a mortar bomb: a hard crump, lighter than a shell
      ddsSrc(o,xm,t,ddsR(1.08,1.2),v*.85);crack(.5,.5);toneHit(o.g,t,.35,'sine',100,46,.22*v,.004);ddsGrains(o,t+.2,1.1,10,2800,.055*v);break;
    case'rocket':   // a bazooka rocket: a sharp crack and a short bang
      ddsSrc(o,xm,t,ddsR(1.15,1.28),v*.8);crack(.52,.55);ddsGrains(o,t+.15,.8,7,3000,.045*v);break;
    default:{   // a grenade or a rifle grenade: a sharp crack, a short bang, sand pattering down
      const fr=ddsPick('xfrag')||boom;if(fr)ddsSrc(o,fr,t,ddsR(.96,1.08)*(kind==='rgl'?.94:1),v*1.1,fr===boom?90:0);
      crack(.56,.5);toneHit(o.g,t,.25,'sine',110,50,.2*v,.003);ddsGrains(o,t+.15,.8,7,3000,.045*v);}
  }
}
// Version 190: the bursts that are only there to look at (ddfx.js's ddFxFar out on the flanks and the sea, ddFxBluff on the bluff ahead): a far
// boom rolling in for each, late by the distance (ddsOut), never more than two far booms at once (shared with ddsBoom's far ones)
function ddsFarBoom(x,y,sea){
  if(!AC||!sndOn)return;const now=AC.currentTime,F=DSFX.cat.farx||(DSFX.cat.farx=[]);for(let i=F.length-1;i>=0;i--)if(F[i]<now)F.splice(i,1);if(F.length>=2)return;F.push(now+2.2);
  const o=ddsOut(x,y,.85,4.5,true,.7,1.6);if(!o)return;ddsSrc(o,ddsPick(sea?'xsea':'xfar'),o.t0,ddsR(.8,.98),sea?.8:1);
}
// sand, earth or spray falling back: little filtered ticks scattered over a while
function ddsGrains(o,t,len,n,f,a){for(let k=0;k<n;k++){const at=t+Math.pow(Math.random(),1.6)*len;noiseHit(o.g,at,.03+Math.random()*.05,'bandpass',f*(.5+Math.random()),1.5,a*(.4+Math.random()*.8),.002);}}
// a gun firing: a tank's (where a tank is), else a field gun or the coast guns: the cannon recording with a crack in front
function ddsCannon(x,y){
  if(!AC||!sndOn)return;const tk=typeof dd!=='undefined'&&dd&&(dd.tanks||[]).some(K=>K.x===x&&K.y===y);
  const o=ddsOut(x,y,1,3.6,true,.7,1.6);if(!o)return;
  ddsSrc(o,ddsPick('xgun'),o.t0,tk?ddsR(1,1.08):ddsR(.82,.9),tk?.95:1);ddsSrc(o,ddsPick('us'),o.t0,tk?.46:.4,tk?.55:.4);toneHit(o.g,o.t0,.45,'sine',tk?85:70,40,.2,.005);
}
// a mortar bomb leaving its tube: a hollow thoonk where it was fired from
function ddsTube(x,y){const o=ddsOut(x,y,.6,.6,false);if(!o)return;toneHit(o.g,o.t0,.14,'sine',190,80,.5,.003);noiseHit(o.g,o.t0,.1,'bandpass',520,1.4,.4,.002);noiseHit(o.g,o.t0,.02,'highpass',2500,0,.15,.001);}

/* ---------- incoming ---------- */
// a shell's whistle down (Version 188 pass 2): a falling tone with the spin's warble in it and a faint overtone, the air tearing
// round it (a rushing noise that brightens and swells as it comes), all of it rising to the landing and cut off there; the
// mortars' shorter, lower and breathier. Only the ones landing near you (none past 50 m), louder the nearer; one at a time
function ddsWhistle(n){
  const ts=Math.max(.25,timeScale()||1),rem=(n.dur-n.t)/ts,mort=n.ddsK==='mortar',L=Math.min(rem,mort?1:1.55);if(L<.35)return;
  const P=ddsPlace(n.x1,n.y1),v=(mort?.16:.24)*clamp(1-(P.d-12)/40,0,1);if(v<.02)return;   // (only the ones coming down near you: 50 m off, none)
  const now=AC.currentTime;for(let i=DSFX.wh.length-1;i>=0;i--)if(DSFX.wh[i].end<now)DSFX.wh.splice(i,1);if(DSFX.wh.length||now<DSFX.whT)return;DSFX.whT=now+L+.9;   // (one at a time and a breath between: a shelled beach was a constant whistling)
  const g=AC.createGain(),t0=now,t1=now+L;g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(v*.3,t0+L*.5);g.gain.exponentialRampToValueAtTime(v,t1-.05);g.gain.linearRampToValueAtTime(.0001,t1);
  let out=g;if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=P.pan*.7;g.connect(p);out=p;}out.connect(sndMuffle);const s=AC.createGain();s.gain.value=.25;out.connect(s);s.connect(sndVerb);
  const f0=mort?ddsR(900,1000):ddsR(1250,1500),f1=mort?ddsR(520,600):ddsR(360,460),nodes=[];
  const osc=(type,mul,amp)=>{const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(f0*mul,t0);o.frequency.exponentialRampToValueAtTime(f1*mul,t1);const og=AC.createGain();og.gain.value=amp;o.connect(og);og.connect(g);nodes.push(o);return o;};
  const o1=osc('sine',1,mort?.3:.5),o2=osc('sine',2.01,mort?.03:.06);
  const lfo=AC.createOscillator(),ld=AC.createGain();lfo.frequency.value=ddsR(6,9);ld.gain.value=f0*.012;lfo.connect(ld);ld.connect(o1.frequency);nodes.push(lfo);
  // the air: a band round the tone, and a broad rush under it that opens up as it nears
  const ns=loopNoise(),bf=AC.createBiquadFilter(),ng=AC.createGain();bf.type='bandpass';bf.Q.value=3;bf.frequency.setValueAtTime(f0*1.3,t0);bf.frequency.exponentialRampToValueAtTime(f1*1.6,t1);ng.gain.value=mort?.9:.5;ns.connect(bf);bf.connect(ng);ng.connect(g);
  const rf=AC.createBiquadFilter(),rg=AC.createGain();rf.type='lowpass';rf.Q.value=.7;rf.frequency.setValueAtTime(500,t0);rf.frequency.exponentialRampToValueAtTime(mort?1800:2600,t1);rg.gain.setValueAtTime(.05,t0);rg.gain.exponentialRampToValueAtTime(mort?.55:.4,t1);ns.connect(rf);rf.connect(rg);rg.connect(g);
  for(const x of nodes)x.start(t0),x.stop(t1+.05);ns.start(t0,Math.random()*1.5);ns.stop(t1+.05);
  const w={n,g,end:t1};DSFX.wh.push(w);setTimeout(()=>{g.disconnect();s.disconnect();},(L+.4)*1000);
}
// a round that just missed one of the squad you're playing, near you: its crack going past
function ddsCrack(s){
  const t=s.t,P=ddsPlace(t.x,t.y);if(P.d>32||Math.random()>.6)return;
  const now=AC.currentTime;if(now-DSFX.crackT>1){DSFX.crackT=now;DSFX.crackN=0;}if(++DSFX.crackN>7)return;   // (seven a second at most)
  const at=Math.max(0,s.at-simT)/Math.max(.25,timeScale()||1),o=ddsOut(t.x+(Math.random()-.5)*30,t.y+(Math.random()-.5)*30,.7*ddsR(.6,1),.25,true);if(!o||!DSFX.crack)return;
  ddsSrc(o,DSFX.crack[(Math.random()*3)|0],now+at,ddsR(.85,1.2),1);
}

/* ---------- rounds striking things ---------- */
const DDS_METAL=/ddtruck|ddtankw|ddgun|ddhog|ddwreck|vgcar|dddrum|ddfuel|ddmast/,DDS_STONE=/ddpb|ddconc|ddbld|dcbld|dcside|vgwall|vghouse|vgruin|vgwell|ddbould|drop/,DDS_WOOD=/ddcrate|ddbarr|vgcart|vglog|vghut|ddtent|vgbale/;
function ddsMat(x,y){let o=null,bd=14;for(const q of objs){if(q.kind==='void'||q.kind==='water')continue;const dx=Math.max(q.x-x,0,x-(q.x+q.w)),dy=Math.max(q.y-y,0,y-(q.y+q.h)),d=dx+dy;if(d<bd){bd=d;o=q;}}
  if(!o)return'sand';const k=o.kind;return DDS_METAL.test(k)||MAT_METAL.test(k)?'metal':DDS_STONE.test(k)?'stone':DDS_WOOD.test(k)?'wood':'sand';}
function ddsImpact(x,y,mat){
  if(!AC||!sndOn)return;const m=mat==='ground'?'sand':mat||ddsMat(x,y);   // (combat.js's 'ground': a near miss smacking the sand round one of ours)
  if(m==='metal'){sfxRicochet(x,y);if(typeof ddSpark==='function')ddSpark(x,gndH(x,y)+7+Math.random()*6,y,.9);return;}   // (Bryan liked the ricochet: kept)
  const now=AC.currentTime;if(now<DSFX.hitT||ddsPlace(x,y).d>28)return;DSFX.hitT=now+.11;   // (a few a second, and only near you: far off they're lost anyway)
  const o=ddsOut(x,y,.5,.4,false);if(!o)return;const t=o.t0;
  if(m==='stone'){noiseHit(o.g,t,.012,'highpass',3200,0,.32,.0005);noiseHit(o.g,t,.08,'bandpass',ddsR(900,1400),1.8,.42,.002);noiseHit(o.g,t,.05,'lowpass',520,0,.3,.002);ddsGrains(o,t+.03,.25,3,2600,.06);}   // a chip off the concrete (its crack, the knock of the block, Version 188 pass 1: less hiss) and its grit
  else if(m==='wood'){if(samples.hit_wood&&samples.hit_wood.length)ddsSrc(o,samples.hit_wood[(Math.random()*samples.hit_wood.length)|0],t,varied(),.4);}
  else{const s=samples.hit_ground;if(s&&s.length)ddsSrc(o,s[(Math.random()*s.length)|0],t,ddsR(.55,.7),.35);   // into sand or earth: a soft puff and a little hiss of grit
    noiseHit(o.g,t,.07,'lowpass',ddsR(650,950),0,.55,.002);noiseHit(o.g,t,.04,'bandpass',ddsR(2400,3200),1.2,.1,.002);}
}

/* ---------- the landing craft's ramp, a man hit ---------- */
// a landing craft's ramp going down (Version 188 pass 2; ddplay.js calls sfxClang as it starts to fall, 0.7 s to the water): the
// latch let go, the hinges and chains as it drops, then the steel plate slamming into the shallows (a recorded metal slam a good
// deal lower, a deep knock under it) and the water thrown up
function ddsRamp(x,y){
  if(!AC||!sndOn)return;const o=ddsOut(x,y,.9,2.8,true,.5);if(!o)return;const t=o.t0,S=samples,pk=k=>S[k]&&S[k].length?S[k][(Math.random()*S[k].length)|0]:null;
  noiseHit(o.g,t,.025,'highpass',2600,0,.3,.0008);noiseHit(o.g,t,.12,'bandpass',ddsR(700,900),3,.25,.001);
  for(let k=0;k<8;k++)noiseHit(o.g,t+.05+k*.07+Math.random()*.025,.035,'bandpass',ddsR(1700,3200),3,.05+Math.random()*.05,.001);   // (chains running out)
  const s=t+.7,sl=pk('slam'),sm=pk('smash');
  if(sl)ddsSrc(o,sl,s,ddsR(.55,.62),1.1);else noiseHit(o.g,s,.3,'bandpass',ddsR(380,460),3,.6,.002);
  if(sm)ddsSrc(o,sm,s+.03,ddsR(.62,.7),.35);
  noiseHit(o.g,s,.45,'lowpass',300,0,.8,.003,90);toneHit(o.g,s,.5,'sine',70,38,.35,.004);
  ddsSrc(o,ddsPick('xsea'),s+.02,ddsR(1.3,1.45),.45);ddsGrains(o,s+.25,1,8,3400,.04);
}
// a round striking a man (combat.js's resolveShot, ddfp.js's hits): in a beach fight forty men are hit a minute, so (Version 188
// pass 2) only the ones near you are heard, at most about six a second; in first person, those within 60 m (your own hits)
const DDS_FLESH={t:0};
function ddsFleshOK(x,y){
  if(!AC)return false;const now=AC.currentTime,fp=typeof dd!=='undefined'&&dd&&dd.fp&&dd.fp.u;
  if(now<DDS_FLESH.t||ddsPlace(x,y).d>(fp?60:30))return false;DDS_FLESH.t=now+.16;return true;
}

// people (Version 188 pass 3): on D-Day a recorded cry, scream, grunt or body falling (audio.js's playSample, for sfxPain, sfxScream,
// sfxGrunt and the rest) goes through the same distance as the guns (ddsPlace: the other game's screen-wide falloff had a man
// screaming 60 m off as loud as one beside you), none past 45 m, and only so many at once and so often (DDS_PPL: how many, the
// least gap in seconds between starts): a beach where forty men are hit a minute was a constant chorus of screams as loud as all its
// gunfire. One right by you (within about 8 m) is always heard
const DDS_PPL={scream:[1,5,.6],fear:[1,5,.6],yelp:[2,.8,.75],grunt:[2,.4,.85],grunt_down:[1,.8,.85],bodyfall:[2,.2,.85],flesh:[3,.12,.85]};   // (at once, gap, level)
function ddsSample(kind,list,x,y,vol,rate){
  const R=DDS_PPL[kind];if(!R)return null;   // (not a person: audio.js plays it its own way)
  if(!AC||!sndOn)return true;const now=AC.currentTime,C=DSFX.cat['p_'+kind]||(DSFX.cat['p_'+kind]=[]);for(let i=C.length-1;i>=0;i--)if(C[i]<now)C.splice(i,1);
  const P=ddsPlace(x,y),near=P.g>.6;if(P.d>45||!near&&(C.length>=R[0]||now<(C.last||0)+R[1]))return true;
  const buf=list[(Math.random()*list.length)|0],dur=buf.duration/rate,o=ddsOut(x,y,vol*R[2],dur+.2,near);if(!o)return true;
  C.push(o.t0+dur*.8);C.last=now;ddsSrc(o,buf,o.t0,rate,1);return true;
}

/* ---------- every frame ---------- */
function ddSfxFrame(t,live){
  const F=++DSFX.frame;if(F%60===0)ddsEchoMode();
  if(live){
    // shells and grenades on their way: what each is (for its blast), the mortars' tubes, the incoming whistle
    for(let i=0;i<nades.length;i++){const n=nades[i];n.ddsF=F;
      if(!n.ddsK){n.ddsK=ddsNadeKind(n);DSFX.trk.push(n);if(n.ddsK==='mortar'&&n.by&&!(dd.tanks||[]).includes(n.by))ddsTube(n.x0,n.y0);}
      if(!n.ddsW&&(n.ddsK==='art'&&!n.shell||n.ddsK==='mortar')){const rem=(n.dur-n.t)/Math.max(.25,timeScale()||1);if(rem<=(n.ddsK==='mortar'?1:1.55)){n.ddsW=1;ddsWhistle(n);}}}
    for(let i=0;i<rockets.length;i++){const r=rockets[i];r.ddsF=F;if(!r.ddsT){r.ddsT=1;DSFX.rk.push(r);}}
    // enemy rounds at the squad you're playing that will miss: their crack going past
    for(let i=0;i<shots.length;i++){const s=shots[i];if(s.dds)continue;s.dds=1;if(!s.hit&&!s.quiet&&s.u&&s.u.side==='E'&&s.t&&s.t.side==='P'&&!s.t.npc&&s.t.team===dd.active)ddsCrack(s);}
    // a muzzle flash with no shot heard for it (suppressing fire)
    for(let i=0;i<flashes.length;i++){const f=flashes[i];if(f.dds)continue;f.dds=1;if(f.u&&f.u.supT&&f.u.id)ddsLoose(f.u);}
  }
  // forget what's landed (a second on, so its blast can still find it), and cut a whistle whose shell has landed early
  for(let i=DSFX.trk.length-1;i>=0;i--){const n=DSFX.trk[i];if(n.ddsF===F)continue;if(!n.ddsGone)n.ddsGone=t;else if(t-n.ddsGone>1)DSFX.trk.splice(i,1);}
  for(let i=DSFX.rk.length-1;i>=0;i--){const r=DSFX.rk[i];if(r.ddsF===F)continue;if(!r.ddsGone)r.ddsGone=t;else if(t-r.ddsGone>1)DSFX.rk.splice(i,1);}
  for(let i=DSFX.wh.length-1;i>=0;i--){const w=DSFX.wh[i];if(w.end<t){DSFX.wh.splice(i,1);continue;}if(w.n.ddsGone||!live){w.g.gain.cancelScheduledValues(t);w.g.gain.setTargetAtTime(.0001,t,.02);DSFX.wh.splice(i,1);}}
  DSFX.fired.length=0;
}

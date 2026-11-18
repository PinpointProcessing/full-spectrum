"use strict";
/* D-Day's sound bed, Version 188 (Bryan: "I don't like the hum in the background, and the audio is too modern sounding. It needs to
   fit the aesthetic of D-Day"): everything under the fighting that isn't a gun of the battle on the screen, and no drone or hum in it.
   ddAmbFrame from audio.js's audioFrame, every frame on this map; ddAmbStop from there once D-Day is left.
   - The sea: waves breaking along the waterline (y 706, DDA.shore) in two lanes, left and right of the view, each a swell, a crash
     and a fizzing wash (ddaSurf), with a recorded wash on every crash (sounds/amb/surf.mp3, CC0); loud at the water's edge, darker and
     fainter up the beach, a far murmur on the top. On the ride in, open water round the boat and the hull slapping down on the swell.
   - The wind in layers that gust (ddaWind): a low buffeting, a body that rises and brightens with a gust, a thin whistle at the
     strongest, and leaves in the woods and hedgerows.
   - The battle beyond the screen (ddaBattle): the other beaches either side and the fighting inland, how much of it by chapter and
     phase (ddAmbScene): far-off machine guns (an MG42's rip, a Browning's slower knock), rifles, artillery, and on D-Day the
     battleships' broadsides from the horizon, their shells going over and landing inland. Built once into small buffers (ddaBuild,
     a few a frame) and sent through a long dark echo of open country (ddaFarIR).
   - Aircraft now and then: a flight of two or three fighters going over, with the drop in pitch as they pass (ddaPlane).
   - Engines (ddaEngine: firing pulses, a body, the exhaust, a knock or a whine): the landing craft's two-stroke diesel with its blower's
     whine on the ride in and the other boats' either side (ddaBoats); the tanks' engines with their tracks' clatter and squeal, by
     distance and whether they're moving (ddaTanks, dd.tanks); the village's trucks (dd.vg.trucks); fires crackling near (tankFires).
   - Version 188 pass 3: the battle as a constant sound under the separate posts (ddaRoar: a crackle of rifles and machine guns from
     every side, built from the guns' far recordings into two loops, ddaRoarGen); the waves' lanes made of a recording of real water
     (sounds/amb/water.mp3, CC0) instead of noise, so the wash bubbles and fizzes like water; birdsong in the woods, the field and the
     quiet spells (sounds/amb/birds.mp3, CC0), gone quiet while guns are going (ddaBirds).
   Placed from the camera (audio.js's place(), and the camera's right-hand side for the far-off things: ddaPan); slow-mo and pause muffle
   it with the rest and hold the battle's clock; it fades out on the report and the barracks (state 'ddmeta'), at the end, and when
   D-Day is left. Its own random numbers (ddaR), so the game's Math.random sequence is the same with sound as without. */
const DDA={sr:24000,shore:706,maxEv:24,loop:{water:18,birds:24.5},   // (the loops' lengths in sounds/amb/: ddaLoopCut)
  wash:[[.08,3.95],[4.18,2.45],[6.78,2.2],[9.13,3.46],[12.74,1.7],[14.59,3.2],[17.94,2.3],[20.39,1.97]],   // (where each recorded wash is in surf.mp3)
  lv:{wind:.19,surf:.42,sea:.13,diesel:.19,chorus:.05,slap:.2,mg:.24,rifle:.18,art:.3,naval:.4,shell:.22,air:.42,tank:.5,track:.42,truck:.42,fire:.3,roar:.32,birds:.1,gun:.55}};
let ddA=null;
const ddaR=(()=>{let s=0x2545f491;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};})(),ddaN=()=>ddaR()*2-1;

/* ---------- small sums for building the buffers ---------- */
// (each filter's state is nudged by a speck, DDA_EPS, far below anything heard: a filter ringing down after a sound otherwise sticks at
// the smallest number a computer can hold short of zero, and sums on such numbers run ten times slower: Version 188 pass 5 found the
// battle's crackle took 110 ms to build because of it, a dropped frame or two on the ride in)
const DDA_EPS=1e-20;
function ddaLP(d,f,sr){const a=1-Math.exp(-TAU*f/sr);let y=0;for(let i=0;i<d.length;i++){y+=a*(d[i]-y)+DDA_EPS;d[i]=y;}return d;}
function ddaHP(d,f,sr){const a=1-Math.exp(-TAU*f/sr);let y=0;for(let i=0;i<d.length;i++){y+=a*(d[i]-y)+DDA_EPS;d[i]-=y;}return d;}
function ddaBP(d,f,q,sr){const w=TAU*f/sr,al=Math.sin(w)/(2*q),c=Math.cos(w),a0=1+al,b0=al/a0,b2=-al/a0,a1=-2*c/a0,a2=(1-al)/a0;let x1=0,x2=0,y1=0,y2=0;
  for(let i=0;i<d.length;i++){const x=d[i],y=b0*x+b2*x2-a1*y1-a2*y2+DDA_EPS;x2=x1;x1=x;y2=y1;y1=y;d[i]=y;}return d;}
function ddaWrap(d,fn){const e=new Float32Array(d.length*2);e.set(d);e.set(d,d.length);fn(e);return e.slice(d.length);}   // (a filter run round a loop's seam)
function ddaNorm(d,pk){let m=0;for(let i=0;i<d.length;i++)m=Math.max(m,Math.abs(d[i]));const k=pk/(m||1);for(let i=0;i<d.length;i++)d[i]*=k;return d;}
function ddaMk(d,sr){const b=AC.createBuffer(1,d.length,sr||DDA.sr);b.getChannelData(0).set(d);return b;}
function ddaWhite(n){const d=new Float32Array(n);for(let i=0;i<n;i++)d[i]=ddaN();return d;}
// a loop out of its mp3: sounds/amb/'s loops carry 0.2 s of their own end before them and of their start after them, so whatever the
// decoder adds or trims at the ends, 0.2 s .. 0.2 s + its length goes round without a seam (Version 188 pass 3)
const ddaLoopCut=(buf,len)=>sliceBuf(buf,.2,Math.min(len,buf.duration-.25));
// one recorded take added into a loop d (wrapping round its end) at sample i0, at speed r, level a, at most mx seconds of it, faded out
function ddaAddBuf(d,i0,src,r,a,mx){
  const s=src.getChannelData(0),k=src.sampleRate/DDA.sr*r,n=d.length,m=Math.min(Math.floor((s.length-2)/k),Math.floor(DDA.sr*mx)),fo=Math.floor(DDA.sr*.08);
  for(let i=0;i<m;i++){const p=i*k,j=p|0,v=s[j]+(s[j+1]-s[j])*(p-j);d[(i0+i)%n]+=a*v*(i>m-fo?(m-i)/fo:1);}
}

/* ---------- the buffers ---------- */
// an engine's loop: its firing pulses (fire a second, pat the cylinders' unevenness), each a knock of noise and a ringing body, the
// exhaust's breath riding on them, and a whine (a blower, a gearbox) on top. Pitch follows playbackRate (revs)
// (this and ddaBoom are generators since Version 188 pass 5: ddaBuildStep runs them a few milliseconds a frame, so building the bed
// as a chapter starts doesn't stutter the picture; each was 30-50 ms in one go)
function* ddaEngine(o){
  const sr=DDA.sr,n=Math.round(sr*o.len),d=new Float32Array(n),N=Math.round(o.fire*o.len),per=1/o.fire,L=Math.floor(sr*per*2.4),sh=new Float32Array(L),ne=new Float32Array(L);
  for(let i=0;i<L;i++){const t=i/sr;let v=0;for(const[f,tau,g]of o.body)v+=Math.sin(TAU*f*t)*Math.exp(-t/tau)*g;sh[i]=v;ne[i]=Math.exp(-i/(sr*o.nT))*o.nz;}
  for(let k=0;k<N;k++){const st=Math.floor((k*per+(ddaR()-.5)*per*o.jit)*sr),a=o.pat[k%o.pat.length]*(1-o.rough/2+ddaR()*o.rough);
    for(let i=0;i<L;i++){d[(st+i+n)%n]+=a*(sh[i]+ddaN()*ne[i]);}if(k%90===89)yield;}
  const ex=ddaWrap(ddaWhite(n),x=>{ddaLP(x,o.exCut,sr);ddaLP(x,o.exCut,sr);});yield;
  // the whine (a blower, a gearbox) is air and teeth, not a pure note: a little of a wavering tone in a narrow band of noise (Version 188
  // pass 4: a clean sine line read as a whistle over everything)
  const wn=o.whine?ddaNorm(ddaWrap(ddaWhite(n),x=>{ddaBP(x,o.whine,9,sr);ddaBP(x,o.whine,9,sr);}),1.6):null;yield;
  for(let i=0;i<n;i++){const t=i/sr;d[i]+=ex[i]*o.ex*(1.2+Math.cos(TAU*o.fire*t))+(wn?(Math.sin(TAU*o.whine*t+Math.sin(TAU*2/o.len*t)*1.5)*.35+wn[i]*.65)*o.wg:0);}yield;
  return ddaMk(ddaNorm(ddaWrap(d,x=>{ddaHP(x,32,sr);ddaLP(x,o.cut,sr);}),.9));
}
// each engine built twice, ticking over and working hard, with the same body, so its ring stays where it is as the revs change
// (a single loop played slower would sink the whole engine into rumble a phone can't play); ddaEng crossfades the two. Loops of 2.5-3 s
// (Version 188 pass 4; they were 1-1.5 s, and the pattern of their uneven firing came round often enough to be heard as a wobble)
const DDA_ENG={
  diesel:{len:3,fire:180,pat:[1,.86,.95,.8,.92,.84],jit:.05,rough:.25,nT:.0016,nz:.75,body:[[92,.014,1],[286,.006,.5],[610,.003,.22]],exCut:520,ex:.9,whine:1350,wg:.035,cut:5200},   // the landing craft's Gray Marine 6-71: a two-stroke six, its Roots blower whining
  tank:{len:2.5,fire:220,pat:[1,.9,.97,.86,.95,.9,.98,.87,.93,.92,.96,.88],jit:.03,rough:.16,nT:.0011,nz:.3,body:[[118,.016,1],[356,.006,.4],[760,.003,.14]],exCut:330,ex:1.1,whine:820,wg:.03,cut:4200},   // a Panzer IV's Maybach V12 (petrol)
  truck:{len:2.5,fire:120,pat:[1,.88,.95,.83,.97,.9],jit:.04,rough:.22,nT:.0012,nz:.35,body:[[78,.02,1],[240,.008,.45],[520,.004,.18]],exCut:420,ex:.8,whine:650,wg:.02,cut:4600}};   // an Opel Blitz's straight six
const ddaIdle=(o,fire,whine)=>ddaEngine({...o,fire,whine,wg:o.wg*.6,rough:o.rough*1.4,jit:o.jit*1.5});   // (ticking over: slower, lumpier, the whine lower)
// a tank's tracks at its road speed: both sides' links clacking on the sprockets, the road wheels' rumble, and now and then a squeal
function ddaTracks(){
  const sr=DDA.sr,len=2,n=sr*len,d=new Float32Array(n);
  for(const side of[0,1]){const r=16.5+side*.9,K=Math.round(r*len);for(let k=0;k<K;k++){const st=Math.floor((k/r+(ddaR()-.5)*.012)*sr),a=.5+ddaR()*.5,f=1300+ddaR()*1300;
    for(let i=0;i<sr*.035;i++){const t=i/sr;d[(st+i)%n]+=a*(Math.sin(TAU*f*t)*.6+ddaN()*.55)*Math.exp(-t/.005)+a*.55*Math.sin(TAU*380*t)*Math.exp(-t/.011);}}}
  const ru=ddaWrap(ddaWhite(n),x=>{ddaLP(x,140,sr);ddaLP(x,140,sr);});for(let i=0;i<n;i++)d[i]+=ru[i]*9*(.6+.4*Math.abs(Math.sin(TAU*3*i/sr)));
  for(let q=0;q<2;q++){const st=Math.floor(ddaR()*n),dur=.35+ddaR()*.3,f=1750+ddaR()*450;for(let i=0;i<sr*dur;i++){const t=i/sr;d[(st+i)%n]+=.22*Math.sin(Math.PI*t/dur)*Math.sin(TAU*f*t+Math.sin(TAU*7*t)*3);}}
  return ddaMk(ddaNorm(ddaWrap(d,x=>ddaLP(x,6000,sr)),.9));
}
// a fighter's engine: the propeller's buzz and its harmonics, the cylinders' crackle on it, and the air it tears through
function ddaAir(){
  const sr=DDA.sr,n=sr,d=new Float32Array(n),f0=86,ff=387;
  for(let h=1;h<=16;h++){const a=(h%2?1:.7)/Math.pow(h,.85),ph=ddaR()*TAU,w=TAU*f0*h/sr;for(let i=0;i<n;i++)d[i]+=a*Math.sin(w*i+ph);}
  for(let k=0;k<ff;k++){const st=Math.floor((k/ff+(ddaR()-.5)*.0006)*sr),a=.6+ddaR()*.6;for(let i=0;i<sr*.004;i++)d[(st+i)%n]+=a*ddaN()*Math.exp(-i/(sr*.0009));}
  const z=ddaWrap(ddaWhite(n),x=>ddaLP(x,2500,sr));for(let i=0;i<n;i++)d[i]+=z[i]*.9;
  return ddaMk(ddaNorm(d,.9));
}
// leaves in the wind: thousands of tiny brushes and ticks (not a plain hiss), louder and brighter in a gust (ddaWind)
function ddaLeaves(){
  const sr=DDA.sr,len=4,n=sr*len,d=new Float32Array(n);
  for(let k=0;k<len*260;k++){const st=Math.floor(ddaR()*n),a=Math.exp(ddaN()*1.2)*.25,L=Math.floor(sr*(.004+ddaR()*.03)),at=Math.floor(sr*.002);for(let i=0;i<L;i++)d[(st+i)%n]+=a*ddaN()*Math.min(1,i/at)*Math.exp(-i/(L*.35));}
  return ddaMk(ddaNorm(ddaWrap(d,x=>{ddaHP(x,1400,sr);ddaHP(x,1400,sr);ddaLP(x,7000,sr);}),.9));
}
// a fire: the low roar of it, crackles, and the odd snap of wood or a round cooking off
function ddaFire(){
  const sr=DDA.sr,len=3,n=sr*len,d=new Float32Array(n),sn=new Float32Array(n);
  const ro=ddaWrap(ddaWhite(n),x=>{ddaLP(x,260,sr);ddaLP(x,260,sr);});for(let i=0;i<n;i++)d[i]=ro[i]*2.4*(.75+.25*Math.sin(TAU*i/sr*2/len));
  for(let k=0;k<len*30;k++){const st=Math.floor(ddaR()*n),a=Math.pow(ddaR(),2)*.9;for(let i=0;i<sr*.006;i++)d[(st+i)%n]+=a*ddaN()*Math.exp(-i/(sr*.0011));}
  for(let k=0;k<len*2.5;k++){const st=Math.floor(ddaR()*n),a=.5+ddaR()*.5;for(let i=0;i<sr*.03;i++)sn[(st+i)%n]+=a*ddaN()*Math.exp(-i/(sr*.005));}
  const s2=ddaWrap(sn,x=>ddaBP(x,900,1,sr));for(let i=0;i<n;i++)d[i]+=s2[i]*1.4;
  return ddaMk(ddaNorm(ddaWrap(d,x=>ddaHP(x,40,sr)),.9));
}
// the landing craft's hull coming down on the swell: a hollow thud, the splash and the spray
function ddaSlap(){
  const sr=DDA.sr,n=Math.floor(sr*.9),d=new Float32Array(n),sp=new Float32Array(n),hi=new Float32Array(n);
  for(let i=0;i<n;i++){const t=i/sr;d[i]=Math.sin(TAU*(72-26*Math.min(1,t/.15))*t)*Math.exp(-t/.07)*.9+ddaN()*Math.exp(-t/.05)*.3;
    const t2=t-.012;if(t2>0)sp[i]=ddaN()*Math.exp(-t2/.16)*Math.min(1,t2/.01);const t3=t-.035;if(t3>0)hi[i]=ddaN()*Math.exp(-t3/.32)*Math.min(1,t3/.03);}
  ddaLP(d,520,sr);ddaBP(sp,650+ddaR()*500,.7,sr);ddaHP(hi,2500,sr);ddaHP(hi,2500,sr);for(let i=0;i<n;i++)d[i]+=sp[i]*1.6+hi[i]*.7;
  return ddaMk(ddaNorm(d,.9));
}
// one far-off shot added into d at sample i0: the pop (what's left of the crack after a kilometre of air) and the thump under it
function ddaShot(d,i0,sr,a,tone){
  const n=Math.min(d.length-i0,Math.floor(sr*.16)),w=TAU*105*tone/sr;
  for(let i=0;i<n;i++){const t=i/sr;d[i0+i]+=a*(ddaN()*Math.exp(-t/.008)*Math.min(1,t/.0006)+Math.sin(w*i)*Math.exp(-t/.03)*.45+ddaN()*Math.exp(-t/.045)*.18);}
}
// a burst from a far-off machine gun: rounds a second, how many, its tone; an MG42 rips at about 21 a second, a Browning knocks at 9
function ddaBurst(rate,nr,tone){
  const sr=DDA.sr,n=Math.floor(sr*(nr/rate+.3)),d=new Float32Array(n);
  for(let k=0;k<nr;k++)ddaShot(d,Math.max(0,Math.floor((k/rate+(ddaR()-.5)*.05/rate)*sr)),sr,(.75+ddaR()*.25)*(k?1:1.1),tone);
  ddaHP(d,70,sr);ddaLP(d,2200,sr);ddaLP(d,2600,sr);return ddaMk(ddaNorm(d,.9));
}
function ddaRifle(tone){const sr=DDA.sr,d=new Float32Array(Math.floor(sr*.4));ddaShot(d,0,sr,1,tone);ddaShot(d,Math.floor(sr*.004),sr,.25,tone*1.7);ddaHP(d,80,sr);ddaLP(d,2400,sr);ddaLP(d,3000,sr);return ddaMk(ddaNorm(d,.9));}
// far-off guns from the game's own recordings (audio.js's samples, so they're the same guns as the fight on the screen, a kilometre
// off): a burst mixed from its single shots, then what the air leaves of them (the crack gone: two low-passes). Built once they've loaded
const ddaSm=ks=>{for(const k of ks)if(samples[k]&&samples[k].length)return samples[k];return null;};
function ddaRecBurst(list,rate,nr,cut){
  const sr=list[0].sampleRate,n=Math.floor(sr*(nr/rate+.7)),d=new Float32Array(n);
  for(let k=0;k<nr;k++){const s=list[Math.floor(ddaR()*list.length)].getChannelData(0),i0=Math.max(0,Math.floor((k/rate+(ddaR()-.5)*.05/rate)*sr)),a=(.7+ddaR()*.3)*(k?1:1.1);for(let i=0;i<s.length&&i0+i<n;i++)d[i0+i]+=a*s[i];}
  ddaLP(d,cut,sr);ddaLP(d,cut*1.25,sr);ddaHP(d,60,sr);return ddaMk(ddaNorm(d,.9),sr);
}
function ddaRecBuild(){
  const A=ddA,mg=ddaSm(['mg42','mg']),rf=ddaSm(['k98','kar98','enemy']),m1=ddaSm(['m1','garand','shot']);if(A.rec||!mg||!rf||!m1)return;A.rec=true;
  try{A.b.rmg1=ddaRecBurst(mg,21.5,8,1500);A.b.rmg2=ddaRecBurst(mg,22,15,1300);A.b.rmg3=ddaRecBurst(mg,20.5,22,1400);A.b.rbr=ddaRecBurst(m1,9,9,1200);A.rrf=[...rf,...m1];}catch(e){}
}
// a far-off big gun or shell: the thump, a crump a phone's speaker can still give, then the roll of its echoes coming back off the land,
// each part set to its own peak before they're mixed. o.hits: when each gun of a salvo goes (s); f0 the thump's pitch; tb/ts how long
// its low body and its thump last; cut its body's top, mid the crump's pitch, tr how long the roll lasts, rl how loud
function* ddaBoom(o){
  const sr=DDA.sr,n=Math.floor(sr*o.len),d=new Float32Array(n),lo=new Float32Array(n),bo=new Float32Array(n),su=new Float32Array(n),a4=sr*.004;
  const klo=Math.exp(-1/(sr*o.tb)),kbo=Math.exp(-1/(sr*.06)),ksu=Math.exp(-1/(sr*o.ts));   // (decays step by step, not an exp a sample)
  for(const at of o.hits){const i0=Math.floor(at*sr),g=at?(.6+ddaR()*.35):1,m=Math.min(n-i0,Math.floor(sr*1.6));let elo=g,ebo=g,esu=g;
    for(let i=0;i<m;i++){const t=i/sr,e=i<a4?i/a4:1;lo[i0+i]+=ddaN()*e*elo;bo[i0+i]+=ddaN()*e*ebo;su[i0+i]+=Math.sin(TAU*o.f0*(1-.18*Math.min(1,t/.4))*t)*e*esu;elo*=klo;ebo*=kbo;esu*=ksu;}
    yield;}
  ddaLP(lo,o.cut,sr);ddaLP(lo,o.cut,sr);ddaBP(bo,o.mid,.9,sr);ddaNorm(lo,.7);ddaNorm(bo,.55);yield;
  const ro=ddaWhite(n);ddaLP(ro,o.cut*1.6,sr);ddaLP(ro,o.cut*1.6,sr);const am=ddaWhite(n);ddaLP(am,3,sr);ddaLP(am,3,sr);ddaNorm(am,1);yield;
  const t0=o.hits[0]+.08,i1=Math.ceil(t0*sr),ktr=Math.exp(-1/(sr*o.tr));let er=Math.exp(-(i1/sr-t0)/o.tr);
  for(let i=0;i<n;i++){if(i<i1){ro[i]=0;continue;}const t=i/sr-t0;ro[i]*=Math.min(1,t/.3)*er*(.45+.55*Math.abs(am[i]));er*=ktr;}
  let rm=0;for(let i=0;i<n;i++)rm=Math.max(rm,Math.abs(ro[i]));
  const kec=Math.exp(-1/(sr*.15));for(let k=0;k<3;k++){const i0=Math.floor((t0+.35+ddaR()*1.8)*sr),a=rm*(.5+ddaR()*.5);let ee=a;for(let i=0;i<sr*.5&&i0+i<n;i++){const t=i/sr;ro[i0+i]+=ddaN()*ee*Math.min(1,t/.02);ee*=kec;}}   // (echoes back off the hills)
  ddaLP(ro,o.cut*2.2,sr);ddaNorm(ro,o.rl);yield;
  for(let i=0;i<n;i++)d[i]=Math.tanh((su[i]*.8+lo[i]+bo[i]+ro[i])*1.15);yield;
  return ddaMk(ddaNorm(ddaHP(ddaHP(d,32,sr),32,sr),.9));
}
// a heavy shell going over: a low rushing roar that flutters as it tumbles, rising, then falling away
function ddaShell(){
  const sr=DDA.sr,len=3.4,n=Math.floor(sr*len),d=new Float32Array(n),hi=ddaWhite(n);let y1=0,y2=0;
  ddaBP(hi,1500,1.2,sr);
  for(let i=0;i<n;i++){const t=i/sr,u=t/len,env=u<.55?Math.pow(u/.55,2):Math.pow((1-u)/.45,1.5),a=1-Math.exp(-TAU*(900-560*u)/sr);
    y1+=a*(ddaN()-y1);y2+=a*(y1-y2);d[i]=(y2*5+hi[i]*.25*env)*env*(1+.3*Math.sin(TAU*(12-5*u)*t));}
  return ddaMk(ddaNorm(d,.9));
}
// the echo of open country: a moment's quiet, a few slaps back off the bluffs and hedgerows, then a long dark roll (about 3 s)
function ddaFarIR(){
  const sr=AC.sampleRate,n=Math.floor(sr*3),b=AC.createBuffer(2,n,sr);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);
    for(let i=0;i<n;i++){const t=i/sr;d[i]=ddaN()*Math.exp(-t/.55)*Math.min(1,t/.09)*.35;}
    for(let k=0;k<6;k++){const at=Math.floor(sr*(.08+ddaR()*1.1)),a=.25+ddaR()*.3;for(let j=0;j<sr*.06&&at+j<n;j++)d[at+j]+=ddaN()*a*Math.exp(-j/(sr*.012));}
    let y=0;for(let i=0;i<n;i++){const k=.35-.3*(i/n);y+=k*(d[i]-y);d[i]=y;}}
  return b;
}
// the battle round about as one sound (Version 188 pass 3): on D-Day the shooting never stopped, so under the separate far-off posts
// (ddaPosts) there's a constant crackle from every side: exchanges of rifle fire, a machine gun's rip, a burst from a submachine gun,
// the nearer of them sharp, the far a dull patter, and the odd low roll of guns far off. One loop of len seconds: three distances, each
// mixed then darkened on its own, from the guns' far recordings (ddsfx.js's DSFX.buf) once they're in, the synthesised pops until then.
// Built a little at a time (a generator: ddaRoarStep runs it for a few milliseconds a frame, so building it never drops a frame)
function* ddaRoarGen(len){
  const sr=DDA.sr,n=Math.floor(sr*len),T=[new Float32Array(n),new Float32Array(n),new Float32Array(n)],B=typeof DSFX!=='undefined'?DSFX.buf:{},A=ddA;
  const syn=[A.b.rf1,A.b.rf2,A.b.rf3].filter(Boolean),rif=(B.usfar||B.karfar)?[...(B.usfar||[]),...(B.karfar||[])]:syn,kar=B.karfar||rif,smg=B.smgfar||null;
  const pick=L=>L[Math.floor(ddaR()*L.length)],at=t=>Math.floor(t*sr);
  for(let t=ddaR()*.3;t<len;t+=-Math.log(1-ddaR()*.98)/1.8){   // (about 1.8 exchanges a second)
    const tier=ddaR()<.2?0:ddaR()<.5?1:2,d=T[tier],g=[1,.6,.36][tier]*(.55+ddaR()*.6),k=ddaR();
    if(k<.58){let u=t;for(let j=0,m=2+Math.floor(ddaR()*6);j<m;j++){ddaAddBuf(d,at(u),pick(rif),.84+ddaR()*.26,g*(.55+ddaR()*.5),.7);u+=.09+ddaR()*.55;}}   // rifles
    else if(k<.82){const src=pick(kar),rate=19+ddaR()*3.5;for(let j=0,m=5+Math.floor(ddaR()*13);j<m;j++)ddaAddBuf(d,at(t+j/rate+(ddaR()-.5)*.008),src,.9+ddaR()*.04,g*(.62+ddaR()*.3)*(j?1:1.15),.45);}   // an MG42's rip
    else if(k<.92&&smg)ddaAddBuf(d,at(t),pick(smg),.9+ddaR()*.15,g*.8,1.2);   // a submachine gun
    else{const src=pick(rif),rate=8+ddaR()*1.5;for(let j=0,m=4+Math.floor(ddaR()*8);j<m;j++)ddaAddBuf(d,at(t+j/rate),src,.8+ddaR()*.04,g*(.7+ddaR()*.25),.5);}   // a Browning's slower knock
    yield;}
  const cut=[2600,1500,760];for(let i=0;i<3;i++){const d=T[i],f=ddaWrap(d,x=>{ddaLP(x,cut[i],sr);ddaLP(x,cut[i]*1.2,sr);ddaHP(x,90,sr);});d.set(f);yield;}
  const o=new Float32Array(n);for(let i=0;i<n;i++)o[i]=T[0][i]+T[1][i]+T[2][i];let rm=0;for(let i=0;i<n;i++)rm+=o[i]*o[i];rm=Math.sqrt(rm/n)||1;yield;
  const ro=ddaWhite(n);ddaLP(ro,170,sr);yield;ddaLP(ro,170,sr);let pr=0;for(let i=0;i<n;i++)pr+=ro[i]*ro[i];pr=Math.sqrt(pr/n)||1;yield;   // the far guns' roll, under it
  for(let q=0;q<3;q++){const c=Math.floor(ddaR()*n),w=Math.floor(sr*(1+ddaR()*1.5)),a=rm/pr*(.5+ddaR()*.5);for(let j=-w;j<=w;j++){const i=(c+j+n)%n;o[i]+=ro[i]*a*.5*(1+Math.cos(Math.PI*j/w));}yield;}
  for(let k=0;k<4;k++){for(let i=Math.floor(n*k/4),e=Math.floor(n*(k+1)/4);i<e;i++)o[i]=Math.tanh(o[i]/rm*.28)/.28*.12;yield;}   // (levelled by its loudness, the odd peak rounded off)
  return ddaMk(o);
}
// what's built, a few a frame (the first frames of a chapter shouldn't stall), in the order it's wanted
const DDA_BUILD=[['noise',()=>ddaMk(ddaWhite(Math.floor(DDA.sr*6.7)))],['diesel',()=>ddaEngine(DDA_ENG.diesel)],['dieselI',()=>ddaIdle(DDA_ENG.diesel,104,800)],['slap',ddaSlap],['slap2',ddaSlap],
  ['mg1',()=>ddaBurst(21.5,7,1)],['mg2',()=>ddaBurst(22,12,1.05)],['mg3',()=>ddaBurst(20.5,19,.95)],['br1',()=>ddaBurst(9,6,.9)],['br2',()=>ddaBurst(8.6,11,.85)],
  ['rf1',()=>ddaRifle(1)],['rf2',()=>ddaRifle(1.15)],['rf3',()=>ddaRifle(1.3)],
  ['art1',()=>ddaBoom({len:4,hits:[0],f0:50,ts:.25,tb:.14,cut:220,mid:380,tr:.9,rl:.3})],['art2',()=>ddaBoom({len:4.5,hits:[0],f0:44,ts:.3,tb:.17,cut:200,mid:330,tr:1.1,rl:.32})],
  ['art3',()=>ddaBoom({len:5,hits:[0,.7],f0:56,ts:.22,tb:.12,cut:240,mid:420,tr:1,rl:.3})],
  ['nav1',()=>ddaBoom({len:6.5,hits:[0,.27,.62],f0:38,ts:.45,tb:.25,cut:170,mid:280,tr:1.6,rl:.38})],['nav2',()=>ddaBoom({len:6.5,hits:[0,.18,.41,.7],f0:34,ts:.5,tb:.28,cut:160,mid:260,tr:1.8,rl:.4})],
  ['shell',ddaShell],['air',ddaAir],['tank',()=>ddaEngine(DDA_ENG.tank)],['tankI',()=>ddaIdle(DDA_ENG.tank,96,410)],['tracks',ddaTracks],['truck',()=>ddaEngine(DDA_ENG.truck)],['truckI',()=>ddaIdle(DDA_ENG.truck,60,330)],
  ['fire',ddaFire],['leaves',ddaLeaves]];

/* ---------- the graph ---------- */
function ddAmbBuild(){
  const A=ddA={on:false,b:{},bi:0,n:0,bt:0,uT:0,dd:null,gust:0,gv:0,gT:0,I:.5,ev:{},v:{},wind:null,surf:null,sea:null,lastT:0,bob:0,slapT:0,offT:0};
  A.bus=AC.createGain();A.bus.gain.value=0;A.bus.connect(sndMuffle);
  A.far=AC.createGain();const dry=AC.createGain();dry.gain.value=.6;A.far.connect(dry);dry.connect(A.bus);   // far-off things: a little dry, mostly echo
  A.cv=AC.createConvolver();A.cv.buffer=ddaFarIR();const wet=AC.createGain();wet.gain.value=.8;A.far.connect(A.cv);A.cv.connect(wet);wet.connect(A.bus);
  A.near=AC.createGain();A.near.connect(A.bus);const ns=AC.createGain();ns.gain.value=.25;A.near.connect(ns);ns.connect(A.cv);   // nearer things (aircraft overhead): mostly dry
  const L=(f,cb)=>fetch(f).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no))).then(cb).catch(()=>{});   // (recorded, CC0: sounds/CREDITS.md)
  L('sounds/amb/surf.mp3',buf=>{A.wash=DDA.wash.map(([t,d])=>sliceBuf(buf,t,d));});L('sounds/amb/far.mp3',buf=>{A.farRec=buf;});
  L('sounds/amb/water.mp3',buf=>{A.water=ddaLoopCut(buf,DDA.loop.water);});L('sounds/amb/birds.mp3',buf=>{A.birds=ddaLoopCut(buf,DDA.loop.birds);});
}
function ddaBuildStep(){const A=ddA,t0=performance.now();   // (a few milliseconds a frame: the small ones several at once, a generator a step at a time)
  while(A.bi<DDA_BUILD.length&&performance.now()-t0<4){const id=DDA_BUILD[A.bi][0];
    try{if(!A.bg){const r=DDA_BUILD[A.bi][1]();if(r&&typeof r.next==='function')A.bg=r;else{A.b[id]=r;A.bi++;continue;}}
      const s=A.bg.next();if(s.done){A.b[id]=s.value;A.bg=null;A.bi++;}}catch(e){A.bg=null;A.bi++;}}
  if(A.bi>=DDA_BUILD.length){A.rt=(A.rt||0)+1;if(!A.rec&&A.rt%30===0)ddaRecBuild();ddaRoarStep();}}
// the roar's two loops (one each side, of different lengths), one a frame, once the guns' far recordings are in; after about 5 s
// without them, synthesised, and built again from the recordings if they turn up later
function ddaRoarStep(){
  const A=ddA,rec=typeof DSFX!=='undefined'&&!!DSFX.buf.usfar&&!!DSFX.buf.karfar;if(A.roar&&A.roarRec===rec||A.roarFail===rec)return;if(!rec&&A.rt<300)return;
  if(!A.roarNew||A.roarNew.rec!==rec)A.roarNew={rec,b:[],g:null};const N=A.roarNew,t0=performance.now();
  try{while(performance.now()-t0<5){if(!N.g)N.g=ddaRoarGen(N.b.length?13.7:11.3);const r=N.g.next();if(!r.done)continue;
    N.b.push(r.value);N.g=null;if(N.b.length===2){A.roar=N.b;A.roarRec=rec;A.roarNew=null;return;}}}
  catch(e){A.roarFail=rec;A.roarNew=null;}
}
function ddaPan(dx,dz){const e=camera.matrixWorld.elements,rx=e[0],rz=e[2],l=Math.hypot(rx,rz)||1,dl=Math.hypot(dx,dz)||1;return clamp((dx*rx+dz*rz)/(l*dl),-1,1);}   // (left or right of the view, from a world direction)
const ddaMkF=(type,f,q)=>{const b=AC.createBiquadFilter();b.type=type;b.frequency.value=f;if(q!=null)b.Q.value=q;return b;};
function ddaChain(...n){for(let i=0;i<n.length-1;i++)n[i].connect(n[i+1]);return n[n.length-1];}
function ddaPanner(v){if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=v;return p;}return AC.createGain();}
function ddaLoopSrc(buf,off,rate=1){const s=AC.createBufferSource();s.buffer=buf;s.loop=true;s.playbackRate.value=rate;s.start(AC.currentTime,off%buf.duration);return s;}
function ddaKill(L){for(const s of L||[])try{s.stop();s.disconnect();}catch(e){}return null;}
// a looping voice (an engine, the tracks, a fire): made when first wanted, its source stopped once it has been silent a while
function ddaVoice(id,dest){const A=ddA;if(A.v[id])return A.v[id];const lp=ddaMkF('lowpass',4000,.5),g=AC.createGain();g.gain.value=0;const p=ddaPanner(0);ddaChain(lp,g,p,dest||A.bus);return A.v[id]={lp,g,p,s:null,buf:null,off:0};}
function ddaVoiceSet(id,buf,lvl,pan,cut,rate,t){
  const v=ddaVoice(id);if(!v.s&&lvl<=.001)return;   // (silent and stopped: nothing to do)
  if(lvl>.001&&buf){v.off=0;if(!v.s||v.buf!==buf){if(v.s)try{v.s.stop(t+.3);}catch(e){}v.s=ddaLoopSrc(buf,ddaR()*buf.duration,rate);v.s.connect(v.lp);v.buf=buf;}}
  else if(v.s){if(!v.off)v.off=t;else if(t-v.off>2.5){try{v.s.stop();}catch(e){}v.s.disconnect();v.s=null;v.buf=null;}}
  v.g.gain.setTargetAtTime(lvl,t,.2);if(v.p.pan)v.p.pan.setTargetAtTime(clamp(pan,-1,1),t,.15);v.lp.frequency.setTargetAtTime(cut,t,.2);if(v.s)v.s.playbackRate.setTargetAtTime(rate,t,.5);
}
// an engine: its ticking-over and its working loops crossfaded by load x (0 idling .. 1 working hard), each nudged in pitch with it
function ddaEng(id,B,k,lvl,x,pan,cut,rj,t){x=clamp(x,0,1);rj*=1+.011*Math.sin(t*.83+id.length*1.7)+.006*Math.sin(t*2.13+id.charCodeAt(id.length-1));   // (the revs never quite steady)
ddaVoiceSet(id+'i',B[k+'I'],lvl*Math.cos(x*1.571),pan,cut,(1+x*.3)*rj,t);ddaVoiceSet(id+'r',B[k],lvl*Math.sin(x*1.571),pan,cut,(.8+x*.2)*rj,t);}
// a one-shot: a buffer through its own level, a darkening low-pass and a pan, into the far bus (or another)
function ddaPlay(buf,at,vol,pan,cut,rate=1,dest){
  const A=ddA;if(!buf||A.n>=DDA.maxEv)return null;
  const s=AC.createBufferSource(),f=ddaMkF('lowpass',cut,.5),g=AC.createGain(),p=ddaPanner(clamp(pan,-1,1));s.buffer=buf;s.playbackRate.value=rate;g.gain.value=vol;
  ddaChain(s,f,g,p,dest||A.far);A.n++;s.onended=()=>{A.n--;s.disconnect();f.disconnect();g.disconnect();p.disconnect();};s.start(Math.max(at,AC.currentTime));return{s,f,g,p};
}

/* ---------- where we are, and how hard the fighting is round about ---------- */
// I: the battle beyond the screen, 0 quiet .. 1 the beaches on D-Day; wind, surf, leaves; naval: the ships' guns heard (1 on D-Day,
// rare inland); air: aircraft now and then
function ddAmbScene(){
  const S={mode:'beach',I:.8,wind:.9,surf:0,leaves:0,naval:0,air:1,birds:0};
  if(dd.seq){Object.assign(S,{mode:'seq',I:.1,wind:.5,leaves:.3,naval:.15,air:.6,birds:1});}
  else if(dd.vil){const V=dd.vg||{};Object.assign(S,{mode:'village',I:dd.won?.22:V.ph==='woods'?.38:V.ph==='field'?.52:V.r2?.85:.7,wind:.55,leaves:V.ph==='woods'?1:.45,naval:.25,birds:dd.won?.7:V.ph==='woods'?1:V.ph==='field'?.6:.2});}
  else if(dd.counter){const ph=dd.dc?dd.dc.ph:'intro';Object.assign(S,{mode:'counter',I:dd.won?.22:/^w/.test(ph)?.8:ph==='lull'?.38:.28,wind:.7,leaves:.35,naval:.3,birds:dd.won?.5:/^w/.test(ph)?0:.35});}
  else{const z=camT.z,ride=!dd.land.done;Object.assign(S,{mode:ride?'ride':'beach',I:dd.won?.3:ride?1:z>300?.95:z>-300?.8:.65,wind:z>-300?.9:1,surf:1,naval:1});}
  return S;
}

/* ---------- every frame ---------- */
function ddAmbFrame(t,live){
  if(!AC)return;if(!ddA)ddAmbBuild();const A=ddA;ddaBuildStep();
  const play=state==='play',dt=clamp(t-(A.lastT||t),0,.1);A.lastT=t;
  if(!play){ddAmbStop(t);return;}
  const S=ddAmbScene(),ts=live?timeScale():0;
  if(A.dd!==dd){const ride=S.mode==='ride';A.dd=dd;A.bt=0;A.I=S.I;A.ev={mg:1+ddaR()*2,rf:.5+ddaR()*2,art:2+ddaR()*3,nav:ride?2.2:4+ddaR()*5,air:ride?7.5+ddaR()*2:25+ddaR()*30};}   // (a new chapter: the battle's clock from the start; on the ride in, a broadside straight away and fighters low overhead halfway in)
  if(!A.on){A.on=true;A.bus.gain.cancelScheduledValues(t);}A.offT=0;
  A.I+=(S.I-A.I)*Math.min(1,dt*.4);A.bt+=dt*ts;
  const udt=t-A.uT;if(udt>=.066){A.uT=t;   // (the levels and filters about 15 times a second: no need to automate them every frame)
    A.bus.gain.setTargetAtTime(paused?.6:1,t,.8);ddaWind(t,Math.min(udt,.2),S);ddaSurf(t,S);ddaRoar(t,S,live);ddaBirds(t,Math.min(udt,.2),S);ddaBoatVoices(t,live);ddaTanks(t,live);ddaTrucks(t,live);ddaFires(t);}
  ddaHull(t,live);if(live)ddaBattle(A.bt,t,S);
}
// off: everything fades, and a moment later the loops are stopped (the report and the barracks, the end, D-Day left)
function ddAmbStop(t){
  const A=ddA;if(!A||!A.on)return;t=t||AC.currentTime;
  if(!A.offT){A.offT=t;A.bus.gain.setTargetAtTime(0,t,.35);return;}
  if(t-A.offT<2.2)return;
  for(const id in A.v){const v=A.v[id];ddaKill([v.s]);v.s=null;v.buf=null;v.g.gain.cancelScheduledValues(t);v.g.gain.value=0;}
  for(const k of['wind','surf','sea'])if(A[k])A[k].src=ddaKill(A[k].src);
  A.on=false;A.offT=0;A.dd=null;
}

/* ---------- the battle's constant crackle, and birdsong ---------- */
// the roar's loops (ddaRoarGen) into the far bus and its echo: louder, nearer and brighter as the fighting round about swells (A.I)
// and with its flurries and lulls (A.fl); half as loud while paused (the posts' clock is held then)
function ddaRoar(t,S,live){
  const A=ddA;if(!A.roar)return;
  if(!A.v.roarL){const g=AC.createGain(),sd=AC.createGain();g.connect(A.bus);sd.gain.value=.45;g.connect(sd);sd.connect(A.cv);ddaVoice('roarL',g);ddaVoice('roarR',g);}   // (more of it dry than the posts: its shots stay distinct, the echo still behind them)
  const I=clamp(A.I,0,1),fl=clamp(A.fl||1,.35,1.6)/1.6,lv=DDA.lv.roar*Math.pow(I,1.4)*(.4+.6*fl)*(live?1:.5),c=650+2100*I;
  ddaVoiceSet('roarL',A.roar[0],lv,-.7,c,1+.03*Math.sin(t*.11),t);ddaVoiceSet('roarR',A.roar[1],lv*(.85+.15*Math.sin(t*.05)),.7,c,1+.03*Math.sin(t*.083+2),t);   // (each a little faster and slower in turn: a loop that never quite comes round the same)
}
// birds in the hedgerows and the woods (the village's approach, the march out, the quiet after): they go quiet the moment guns go off
// anywhere (a muzzle flash) and come back slowly, over half a minute of quiet
function ddaBirds(t,dt,S){
  const A=ddA;if(!A.birds)return;const busy=typeof flashes!=='undefined'&&flashes.length>0;A.calm=clamp((A.calm==null?1:A.calm)+(busy?-dt*1.5:dt*.035),0,1);
  ddaVoiceSet('birds',A.birds,DDA.lv.birds*S.birds*A.calm*A.calm,Math.sin(t*.07)*.35,9000,1,t);
}

/* ---------- the wind ---------- */
function ddaWind(t,dt,S){
  const A=ddA,nb=A.b.noise;if(!nb)return;
  if(!A.wind){const W=A.wind={src:null},g=()=>{const q=AC.createGain();q.gain.value=0;return q;};
    W.lo=ddaMkF('lowpass',150,.6);W.b1=ddaMkF('bandpass',420,.8);W.b2=ddaMkF('bandpass',500,.8);W.wh=ddaMkF('bandpass',2300,10);
    W.glo=g();W.gb1=g();W.gb2=g();W.gwh=g();
    ddaChain(W.lo,W.glo,ddaPanner(-.2),A.bus);ddaChain(W.b1,W.gb1,ddaPanner(-.6),A.bus);ddaChain(W.b2,W.gb2,ddaPanner(.6),A.bus);ddaChain(W.wh,W.gwh,ddaPanner(.25),A.bus);}
  if(!A.wind.src){const W=A.wind,s1=ddaLoopSrc(nb,0),s2=ddaLoopSrc(nb,3.3);s1.connect(W.lo);s1.connect(W.b1);s2.connect(W.b2);s2.connect(W.wh);W.src=[s1,s2];}
  // the gusts: a slow wander, and every so often a gust that builds over a couple of seconds and dies away
  if(t>=A.gT){A.gT=t+5+ddaR()*12;A.gv=.55+ddaR()*.45;}
  A.gv=Math.max(0,A.gv-dt*.12);const tgt=.25+A.gv*.75+Math.sin(t*.37)*.08+Math.sin(t*.13+1)*.1;A.gust+=(tgt-A.gust)*Math.min(1,dt*.7);
  const W=A.wind,k=S.wind*DDA.lv.wind,gu=clamp(A.gust,0,1.2);
  W.glo.gain.setTargetAtTime(k*(.9+.6*gu),t,.3);W.gb1.gain.setTargetAtTime(k*(.25+.9*gu*gu),t,.3);W.gb2.gain.setTargetAtTime(k*(.22+.8*gu*gu),t,.4);
  W.b1.frequency.setTargetAtTime(300+520*gu,t,.4);W.b2.frequency.setTargetAtTime(360+600*gu,t,.5);
  W.gwh.gain.setTargetAtTime(k*.25*Math.max(0,gu-.6)*2.5,t,.5);ddaVoiceSet('leaves',A.b.leaves,k*S.leaves*(.35+1.2*gu*gu),Math.sin(t*.21)*.4,2800+4500*Math.min(1,gu),.9+.2*Math.min(1,gu),t);   // (the trees and hedgerows)
}

/* ---------- the sea ---------- */
// two lanes of waves along the shore, left and right of the view, each on its own cycle: the swell building, the crash, the wash
// fizzing up the sand and running back; plus a recorded wash on each crash. Faint and dark up the beach, gone inland
function ddaSurf(t,S){
  const A=ddA,nb=A.b.noise;if(!nb)return;
  const d=Math.max(0,Math.abs(camT.z-DDA.shore)-20),near=S.surf?1/(1+Math.pow(d/170,1.4)):0;
  if(!A.surf){if(!near)return;const U=A.surf={bus:AC.createGain(),lp:ddaMkF('lowpass',8000,.4),rf:ddaMkF('lowpass',230,.5),rg:AC.createGain(),lanes:[],src:null,q:0};U.bus.gain.value=0;U.rg.gain.value=.5;
    ddaChain(U.bus,U.lp,A.bus);ddaChain(U.rf,U.rg,U.bus);
    for(const side of[-1,1]){const lp=ddaMkF('lowpass',700,.6),g=AC.createGain(),hp=ddaMkF('highpass',2600,.5),fz=AC.createGain(),p=ddaPanner(side*.5);g.gain.value=.25;fz.gain.value=0;
      ddaChain(lp,g,p);ddaChain(hp,fz,p);p.connect(U.bus);U.lanes.push({side,lp,hp,g,fz,p,next:0});}}
  const U=A.surf;U.bus.gain.setTargetAtTime(near*DDA.lv.surf,t,.6);U.lp.frequency.setTargetAtTime(300+9000/(1+d/110),t,.6);
  if(!near){if(U.src&&t-U.q>3)U.src=ddaKill(U.src);return;}   // (inland a while: its sources stopped)
  U.q=t;const src=A.water||nb;if(U.src&&U.srcBuf!==src)U.src=ddaKill(U.src);   // (the lanes are real water once its recording is in: Version 188 pass 3)
  if(!U.src){U.srcBuf=src;U.fzK=A.water?2.4:1;const ro=ddaLoopSrc(nb,1.7);ro.connect(U.rf);U.src=[ro];for(const L of U.lanes){const s=ddaLoopSrc(src,L.side<0?.4:src.duration*.53);s.connect(L.lp);s.connect(L.hp);U.src.push(s);L.next=t+.3+(L.side>0?3.5:0)+ddaR()*2;}}
  for(const L of U.lanes){
    if(L.p.pan)L.p.pan.setTargetAtTime(ddaPan(L.side*240,DDA.shore-camT.z)*.8,t,.3);
    if(t<L.next-.1)continue;const T=Math.max(t,L.next),P=6.5+ddaR()*5,big=ddaR()<.3?1.25:1,cr=T+1.8+ddaR()*.6;L.next=T+P;
    L.g.gain.setTargetAtTime(.45*big,T,.8);L.g.gain.setTargetAtTime(1*big,cr,.07);L.g.gain.setTargetAtTime(.28,cr+.35,1.1);
    L.lp.frequency.setTargetAtTime(1100,T,1);L.lp.frequency.setTargetAtTime(2700*big,cr,.06);L.lp.frequency.setTargetAtTime(650,cr+.5,1);
    L.fz.gain.setTargetAtTime(0,T,.4);L.fz.gain.setTargetAtTime(.32*big*U.fzK,cr+.05,.08);L.fz.gain.setTargetAtTime(0,cr+.45,1.5);
    if(A.wash){const w=A.wash[Math.floor(ddaR()*A.wash.length)];ddaPlay(w,cr-.12,.6*big*near*DDA.lv.surf,L.p.pan?L.p.pan.value:L.side*.4,300+9000/(1+d/110),.88+ddaR()*.18,A.bus);}
  }
}

/* ---------- the ride in: the landing craft's diesel, the other boats', the hull on the swell, open water ---------- */
function ddaBoatVoices(t,live){
  const A=ddA,L=DDA.lv,b=dd.boats&&dd.boats.find(q=>q.own),ride=!!b&&!dd.land.done;
  if(b&&b.st!=='gone'&&b.st!=='sunk'){   // our boat: we're in it on the ride, then it backs off the beach
    const idle=b.st==='ramp'||b.st==='out'||b.st==='wait',x=b.st==='in'?1:b.st==='back'?.85:idle?0:.6,pl=place(b.x,b.y+25);
    ddaEng('dsl',A.b,'diesel',live?(ride?L.diesel*(idle?.8:1):L.diesel*pl.g*.9):0,x,ride?0:pl.p,ride?3200:3200*(1-pl.far*.7),1+(b.st==='in'?Math.sin(simT*1.7+b.x)*.025:0),t);}   // (the revs dip and rise as she rides the swell)
  else ddaEng('dsl',A.b,'diesel',0,0,0,3000,1,t);
  const others=ride?dd.boats.filter(q=>!q.own&&q.st==='in').length:0;   // the rest of the wave either side
  for(const[id,pn,r]of[['ch1',-.75,.93],['ch2',.75,1.07]])ddaVoiceSet(id,A.b.diesel,live&&others?L.chorus*Math.min(1,others/3):0,pn,1400,r*(.97+Math.sin(t*.7+pn)*.03),t);
  // open water round the boat, louder as the bow digs in
  const nb=A.b.noise;
  if(nb&&ride&&!A.sea){const lp=ddaMkF('lowpass',650,.5),hp=ddaMkF('highpass',3000,.5),g=AC.createGain(),gh=AC.createGain();g.gain.value=0;gh.gain.value=0;ddaChain(lp,g,A.bus);ddaChain(hp,gh,A.bus);A.sea={lp,hp,g,gh,src:null,q:0};}
  if(A.sea){const Q=A.sea,bob=ride&&b?Math.sin(simT*1.7+b.x):0,sb=A.water||nb,hk=A.water?2.4:1;if(Q.src&&Q.buf!==sb)Q.src=ddaKill(Q.src);   // (real water once it's in)
    if(ride){Q.q=t;if(!Q.src){const s=ddaLoopSrc(sb,5.2);s.connect(Q.lp);s.connect(Q.hp);Q.src=[s];Q.buf=sb;}}else if(Q.src&&t-Q.q>3)Q.src=ddaKill(Q.src);
    Q.g.gain.setTargetAtTime(ride?L.sea*(.7+.3*bob):0,t,.3);Q.gh.gain.setTargetAtTime(ride?L.sea*.25*hk*(.5+.5*bob):0,t,.3);}
}
function ddaHull(t,live){
  const A=ddA,L=DDA.lv,b=dd.boats&&dd.boats.find(q=>q.own),ride=!!b&&!dd.land.done;
  // the hull slapping down: as the bow drops through each swell (ddBoatPose's bob), and the chop in between
  if(ride&&live&&b.st==='in'&&A.b.slap){const bob=Math.sin(simT*1.7+b.x);
    if(A.bob>0&&bob<=0)ddaPlay(A.b.slap,t+.02,L.slap*(.8+ddaR()*.3),(ddaR()-.5)*.4,2400,.9+ddaR()*.2,A.bus);
    else if(t>A.slapT){A.slapT=t+.5+ddaR()*1.4;ddaPlay(A.b.slap2,t+.02,L.slap*(.25+ddaR()*.3),(ddaR()-.5)*.9,1800,1.1+ddaR()*.3,A.bus);}
    A.bob=bob;}
}

/* ---------- tanks and trucks ---------- */
function ddaTanks(t,live){
  const A=ddA,L=DDA.lv,up=(dd.tanks||[]).filter(K=>K.hp>0).sort((a,b)=>hyp(a.x-camT.x,a.y-camT.z)-hyp(b.x-camT.x,b.y-camT.z));
  for(let i=0;i<3;i++){const K=up[i],e='tk'+i,r='tr'+i;
    if(!K||!live){ddaEng(e,A.b,'tank',0,0,0,3000,1,t);ddaVoiceSet(r,null,0,0,3000,1,t);continue;}
    const sp=K.ddaX!=null?hyp(K.x-K.ddaX,K.y-K.ddaY)/Math.max(.001,t-K.ddaT):0;K.ddaX=K.x;K.ddaY=K.y;K.ddaT=t;
    const mv=K.ddaV=(K.ddaV||0)+(clamp(sp/20,0,1.4)-(K.ddaV||0))*.15,pl=place(K.x,K.y),cut=4200*(1-pl.far*.75),g=pl.g*clamp(1.4-hyp(K.x-camT.x,K.y-camT.z)/700,0,1);   // (heard to about 100 m)
    ddaEng(e,A.b,'tank',L.tank*g*(.7+.3*Math.min(1,mv)),mv,pl.p,cut,1,t);
    ddaVoiceSet(r,A.b.tracks,L.track*g*Math.min(1,mv),pl.p,cut*1.2,.6+.4*Math.min(1.4,mv),t);}
}
function ddaTrucks(t,live){
  const A=ddA,T=dd.vg&&dd.vg.trucks||[],on=T.filter(K=>K.hp>0&&K.ph!=='parked').sort((a,b)=>hyp(a.x-camT.x,a.y-camT.z)-hyp(b.x-camT.x,b.y-camT.z));
  for(let i=0;i<2;i++){const K=on[i],id='tc'+i;if(!K||!live){ddaEng(id,A.b,'truck',0,0,0,3000,1,t);continue;}
    const pl=place(K.x,K.y),go=K.ph==='drive',g=pl.g*clamp(1.4-hyp(K.x-camT.x,K.y-camT.z)/600,0,1);ddaEng(id,A.b,'truck',DDA.lv.truck*g*(go?1:.7),go?.9:0,pl.p,4400*(1-pl.far*.75),1,t);}
}
// the nearest fire crackling (a burning wreck, a boat gone up, a tank knocked out)
function ddaFires(t){
  let f=null,bd=300;for(const q of tankFires||[]){const d=hyp(q.x-camT.x,q.y-camT.z);if(d<bd){bd=d;f=q;}}
  const pl=f?place(f.x,f.y):null;ddaVoiceSet('fire',ddA.b.fire,f?DDA.lv.fire*pl.g*(1-bd/300):0,f?pl.p:0,f?5000*(1-pl.far*.6):3000,1,t);
}

/* ---------- the battle beyond the screen ---------- */
// where a far-off sound comes from, by chapter: a world direction and how far (0 nearer .. 1 the far distance)
function ddaWhere(S,k){
  const r=ddaR(),far=.25+ddaR()*.75;
  if(k==='nav')return{dx:(ddaR()-.5)*1.6,dz:1,far:.8+ddaR()*.2};   // the ships, out to sea (south)
  if(S.mode==='ride'||S.mode==='beach'){if(r<.38)return{dx:-1,dz:(ddaR()-.6)*.8,far};if(r<.76)return{dx:1,dz:(ddaR()-.6)*.8,far};return{dx:(ddaR()-.5)*1.4,dz:-1,far:Math.max(.5,far)};}   // the beaches either side, and inland
  if(S.mode==='counter')return r<.6?{dx:(ddaR()-.5)*1.6,dz:-1,far}:{dx:r<.8?-1:1,dz:(ddaR()-.5),far};   // up the road north, and either side
  const a=ddaR()*TAU;return{dx:Math.cos(a),dz:Math.sin(a)-.4,far};   // the village: all round, more of it ahead
}
// The fighting round about is a handful of far-off posts (ddaPosts), each a machine gun (an MG42's rip, a Browning's knock) or a
// squad's rifles (an M1's quick shots, a bolt rifle's slow ones), each firing from the same place in its own rhythm, going quiet
// for a while now and then and sometimes moving on; and all of it swelling and easing together (A.fl, a slow wander), so it comes in
// flurries and lulls. Artillery, the ships' guns and aircraft on top.
function ddaPosts(S){const P=[],n=S.mode==='seq'?3:7;for(let i=0;i<n;i++)P.push(ddaPost(S,i));return P;}
function ddaPost(S,i){const w=ddaWhere(S,'mg');return{...w,kind:i%3===2?'rifle':ddaR()<.65?'mg42':'br',next:ddaR()*5,move:30+ddaR()*60};}
function ddaShoot(P,t,I){
  const A=ddA,B=A.b,L=DDA.lv,p=ddaPan(P.dx,P.dz)*.9,v=(1.15-P.far*.75)*(.7+.3*I);
  if(P.kind==='rifle'){const m=1+Math.floor(ddaR()*3);
    for(let j=0;j<m;j++){const pj=clamp(p+(ddaR()-.5)*.25,-1,1),semi=ddaR()<.6,rec=A.rrf&&ddaR()<.65,k=rec?A.rrf[Math.floor(ddaR()*A.rrf.length)]:B['rf'+(1+Math.floor(ddaR()*3))];let at=t+.03+ddaR()*.8;
      for(let q=0,nq=semi?2+Math.floor(ddaR()*4):1+Math.floor(ddaR()*2);q<nq;q++){ddaPlay(k,at,L.rifle*v*(.6+ddaR()*.4)*(rec?.8:1),pj,rec?1700-P.far*900:2800-P.far*1700,(rec?.85:.95)+ddaR()*.12);at+=semi?.3+ddaR()*.5:1.3+ddaR()*1.2;}}
    return 2+ddaR()*5;}
  const mg42=P.kind==='mg42',rec=A.rec&&ddaR()<.6,k=mg42?(rec?'rmg':'mg')+(1+Math.floor(ddaR()*3)):rec?'rbr':ddaR()<.5?'br1':'br2',c=2600-P.far*1600,r=.95+ddaR()*.1;
  ddaPlay(B[k],t+.03,L.mg*v,p,c,r);if(ddaR()<.4)ddaPlay(B[mg42?(rec?'rmg1':'mg1'):(rec?'rbr':'br1')],t+.7+ddaR()*.8,L.mg*v*.9,p,c,r);
  return mg42?1.8+ddaR()*4.5:2.5+ddaR()*4;
}
function ddaBattle(bt,t,S){
  const A=ddA,E=A.ev,B=A.b,L=DDA.lv;if(!B.rf3)return;
  if(!A.posts||A.postsFor!==A.dd){A.posts=ddaPosts(S);A.postsFor=A.dd;A.fl=1;A.flT=0;}
  if(bt>=A.flT){A.flT=bt+8+ddaR()*14;A.flTo=.35+ddaR()*1.3;}A.fl+=((A.flTo||1)-A.fl)*.01;   // (flurries and lulls)
  const I=Math.max(.05,A.I*A.fl);
  for(const P of A.posts){
    if(bt>=P.move){Object.assign(P,ddaPost(S,A.posts.indexOf(P)),{next:bt+2+ddaR()*6,move:bt+30+ddaR()*60});continue;}   // (it moves on, or another takes up)
    if(bt<P.next)continue;P.next=bt+ddaShoot(P,t,I)/Math.max(.05,I*.55)*(ddaR()<.12?4:1);}   // (now and then a longer quiet)
  if(bt>=E.art){E.art=bt+(4.5+ddaR()*9)/(.3+.7*I);const w=ddaWhere(S,'art'),p=ddaPan(w.dx,w.dz)*.85,X=ddaRec('xfar'),r=ddaR(),rec=A.farRec&&r<.25,xf=X&&r>.55;   // (a shell landing far off: the synthesised boom, or one of two recordings of far blasts, Version 188 pass 5)
    ddaPlay(xf?X[Math.floor(ddaR()*X.length)]:rec?A.farRec:B[['art1','art2','art3'][Math.floor(ddaR()*3)]],t+.03,L.art*(1.1-w.far*.6)*(rec?.8:xf?.75:1),p,(1100-w.far*600)*(xf?1.3:1),xf?.78+ddaR()*.2:rec?.75+ddaR()*.2:.9+ddaR()*.2);
    if(ddaR()<.35*I){const at=t+.4+ddaR()*1.2;ddaPlay(B['art'+(1+Math.floor(ddaR()*3))],at,L.art*(1-w.far*.6)*.8,clamp(p+(ddaR()-.5)*.3,-1,1),1000-w.far*500,.85+ddaR()*.25);}}   // (often a second from the same battery)
  if(S.naval&&bt>=E.nav){E.nav=bt+(S.mode==='ride'?6+ddaR()*5:(14+ddaR()*20)/((.4+.6*I)*S.naval));ddaNaval(t,S);}   // (the ships' guns going all the way in)
  if(S.air&&bt>=E.air){E.air=bt+(60+ddaR()*80)/S.air;ddaPlane(t);}
}
// a battleship's broadside from the horizon; on D-Day its shells go over a few seconds later and land inland. Since Version 188 pass 5
// the guns themselves are a recording of a ship's gun (ddsfx.js's 'xgun', CC0) slowed into a bigger one, two to four of them a salvo,
// over the synthesised boom's weight (which on its own was all bass: a phone's speaker gave nothing of it)
const ddaRec=k=>typeof DSFX!=='undefined'&&DSFX.buf[k]&&DSFX.buf[k].length?DSFX.buf[k]:null;
function ddaNaval(t,S){
  const A=ddA,B=A.b,L=DDA.lv,w=ddaWhere(S,'nav'),p=ddaPan(w.dx,w.dz)*.7,k=S.mode==='ride'||S.mode==='beach'?1:.55,c=S.mode==='ride'?900:650,G=ddaRec('xgun');
  ddaPlay(B[ddaR()<.5?'nav1':'nav2'],t+.03,L.naval*k,p,c,.95+ddaR()*.1);
  if(G)for(let j=0,m=2+Math.floor(ddaR()*3),at=t+.03;j<m;j++,at+=.14+ddaR()*.24)ddaPlay(G[Math.floor(ddaR()*G.length)],at,L.gun*k*(j?.55+ddaR()*.35:1),clamp(p+(ddaR()-.5)*.25,-1,1),c*1.5,.6+ddaR()*.14);
  if((S.mode==='ride'||S.mode==='beach')&&ddaR()<.75){const at=t+2.6+ddaR()*1.5,o=ddaPlay(B.shell,at,L.shell,p,2000,.9+ddaR()*.2,A.near);
    if(o&&o.p.pan)o.p.pan.setValueCurveAtTime(new Float32Array([p,p*.5,(ddaR()-.5)*.6]),at,3.2);
    const w2={dx:(ddaR()-.5)*1.2,dz:-1};ddaPlay(B.art2,at+3.6+ddaR()*1.5,L.art*.75,ddaPan(w2.dx,w2.dz)*.6,700,.8+ddaR()*.15);}
}
// a flight of fighters going over: across the view, louder and brighter as they pass, the pitch dropping as they go
function ddaPlane(t){
  const A=ddA,b=A.b.air;if(!b||A.n>DDA.maxEv-3)return;
  const n=2+(ddaR()<.4?1:0),dir=ddaR()<.5?-1:1,T=7.5,N=48;
  for(let k=0;k<n;k++){const t0=t+.05+k*(.35+ddaR()*.5),det=1+(ddaR()-.5)*.05,v=ddaPlay(b,t0,1,0,1000,det,A.near);if(!v)break;
    const rc=new Float32Array(N),gc=new Float32Array(N),fc=new Float32Array(N),pc=new Float32Array(N);
    for(let i=0;i<N;i++){const x=(i/(N-1)-.5)*8,d=Math.hypot(1,x);rc[i]=det*(1-.16*x/d);gc[i]=DDA.lv.air*Math.pow(1/d,1.3)*Math.min(1,(N-1-i)/4,i/4);fc[i]=700+5200/(d*d);pc[i]=dir*clamp(x/d,-1,1)*.85;}
    v.s.loop=true;v.s.playbackRate.setValueCurveAtTime(rc,t0,T);v.g.gain.setValueCurveAtTime(gc,t0,T);v.f.frequency.setValueCurveAtTime(fc,t0,T);
    if(v.p.pan)v.p.pan.setValueCurveAtTime(pc,t0,T);v.s.stop(t0+T+.05);}
}

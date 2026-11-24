/* The TV: a little animated news broadcast drawn on a canvas. The same canvas is the screen of the 3D TV set and the big picture when you watch it. */
const tv={mode:'morning',t:0,line:-1,watch:false,done:false,splats:[],sub:null,chat:0,beep:0,drawT:0,fired:{}};
const TVG=tvCan.getContext('2d'),TW=tvCan.width,TH=tvCan.height;
const ANCH=[{name:'Hal Brenner',suit:'#27344d',tie:'#b3261e',skin:'#d9a57e',hair:'#6b6b6b',x:.33},{name:'Denise Carroway',suit:'#7a2440',tie:null,skin:'#b9815c',hair:'#231712',x:.67}];
const CAST=[
  {t:0.6,who:0,d:3.4,text:'We interrupt this program for an emergency broadcast.'},
  {t:4.4,who:1,d:5.4,text:'Health officials confirm a highly contagious virus is spreading across the tri-county area.'},
  {t:10.2,who:0,d:4.8,text:'The infected lose their minds. They turn violent and attack anyone within reach.'},
  {t:15.4,who:1,d:4.6,text:'Do not approach them. Do not try to help them. That includes people you know.'},
  {t:20.4,who:0,d:3.8,text:'If you have been bitten, you must... Huh? What was that?'},
  {t:24.6,who:1,d:3.6,text:'Hal? HAL! THE STUDIO DOOR!'},
];
const MORNING=[
  {t:0.5,who:1,d:3.7,text:'So take a jacket this morning, but you can leave the umbrella at home.'},
  {t:4.4,who:0,d:4.2,text:'Thanks, Denise. Still to come this hour, the county fair'},
];
const CAST_IN=28.3,CAST_STATIC=32.9,CAST_CARD=34.9,CAST_END=36.9;
function tvReset(){tv.mode='morning';tv.t=0;tv.line=-1;tv.watch=false;tv.done=false;tv.splats=[];tv.sub=null;tv.chat=1.2;tv.beep=0;tv.fired={};shutUp();}
function tvStartCast(){if(tv.mode==='cast'||tv.done)return;tv.mode='cast';tv.t=0;tv.line=-1;tv.fired={};tv.splats=[];}
function tvOnce(key,at,fn){if(tv.t>=at&&!tv.fired[key]){tv.fired[key]=1;fn();}}
function tvTick(dt,audible){
  tv.t+=dt;tv.sub=null;
  if(tv.mode==='morning'){      // the morning show, mid-sentence when the alert cuts across it
    for(let i=0;i<MORNING.length;i++){const M=MORNING[i];if(tv.t>=M.t&&!tv.fired['m'+i]){tv.fired['m'+i]=1;tv.who=M.who;tv.talkUntil=M.t+Math.min(M.d,3.6);if(audible)speak(M.who===1?'denise':'hal',M.text,M.d);}}
    if(tv.t>6.1){shutUp();tv.mode='alert';tv.t=0;tv.fired={};}
  }else if(tv.mode==='alert'){   // one alert tone, the news ident, and the broadcast starts by itself (Bryan): no waiting on the player, no repeated beeping
    tvOnce('cut',0,()=>audible&&tvSfx('static',.5));
    tvOnce('tone',.25,()=>audible&&tvSfx('beep',.55));
    tvOnce('ident',1.2,()=>{if(audible){tvClip('s_sting',1.2)||tvSfx('sting',1);}});
    if(tv.t>4.7)tvStartCast();
  }else if(tv.mode==='cast'){
    for(let i=0;i<CAST.length;i++){const L=CAST[i];
      if(tv.t>=L.t&&tv.line<i){tv.line=i;if(audible)speak(L.who===1?'denise':'hal',L.text,L.d);}
      if(tv.t>=L.t&&tv.t<L.t+L.d+.5)tv.sub={who:ANCH[L.who].name,text:L.text,talk:tv.t<L.t+L.d?L.who:-1};}
    tvOnce('thud',22.3,()=>audible&&tvSfx('bang',1));
    tvOnce('thud2',24.3,()=>audible&&tvSfx('bang',1.2));
    // the attack: recorded screams, zombie voices and wet hits (Bryan found the made-in-code ones fake). Each falls back to the old sound if its clip is missing.
    const A=(key,at,fn)=>tvOnce(key,CAST_IN+at,()=>{if(audible)fn();});
    tvOnce('crash',CAST_IN-.3,()=>{if(audible){tvSfx('crash',.8);tvClip('z17',1.5,.8)||tvSfx('snarl',1);}});
    A('zr1',.25,()=>tvClip('z10',1.3,.95));
    A('scream',.5,()=>{tvClip('s_m1',1.5)||tvSfx('gurgleM',1);});                       // Hal goes first
    A('zr2',.9,()=>tvClip('z4',1.2,.9));
    tvOnce('s1',CAST_IN+1.3,()=>{if(audible){tvClip('s_wet1',1.3)||tvSfx('bite',1);}tv.splats.push({x:.12,y:.24,r:.06});});
    A('screamF',1.5,()=>{tvClip('s_f1',1.35)||tvSfx('gurgleF',1);});                    // Denise sees it and does not stop
    A('zr3',1.9,()=>tvClip('z16',1.4,.85));
    tvOnce('s2',CAST_IN+2.3,()=>{if(audible){tvClip('s_wet4',1.3)||tvSfx('bite',1);tvClip('s_m2',1.3);}tv.splats.push({x:.5,y:.16,r:.085});});
    A('zr4',2.7,()=>tvClip('z7',1.2));
    tvOnce('s3',CAST_IN+3.1,()=>{if(audible){tvClip('s_m3',1.4)||tvSfx('gurgleM',.7);tvClip('z18',1.4,.8)||tvSfx('roar',.7);}tv.splats.push({x:.9,y:.3,r:.07});});
    A('screamF2',3.3,()=>tvClip('s_f2',1.2));
    A('wet3',3.9,()=>tvClip('s_wet8',1.3));
    A('zr5',4.1,()=>tvClip('z21',1.2,.85));
    tvOnce('s4',CAST_IN+3.7,()=>{tv.splats.push({x:.4,y:.6,r:.14});});
    tvOnce('fall',CAST_IN+3.7,()=>audible&&tvSfx('crash',1));
    tvOnce('static',CAST_STATIC,()=>audible&&tvSfx('static',1));
    tvOnce('static2',CAST_STATIC+1,()=>audible&&tvSfx('static',1));
    if(tv.t>=CAST_IN+.6&&tv.t<CAST_STATIC)tv.sub={who:'',text:tv.t<CAST_IN+3.7?'[screaming]':'[the camera falls over]',talk:-1};
    tvOnce('card',CAST_CARD,()=>audible&&tvSfx('beep',.5));
    if(tv.t>=CAST_END){tv.mode='dead';tv.t=0;tv.done=true;tv.fired={};}
  }else{
    tv.beep-=dt;if(tv.beep<=0){tv.beep=rand(5,9);if(audible)tvSfx('static',.25);}      // off the air: a little hiss now and then, no tone
  }
  tv.drawT-=dt;
  if(tv.drawT<=0||tv.watch){tv.drawT=1/14;tvDraw();tvTex.needsUpdate=true;}
}
function tvAnchor(g,a,t,o){
  const x=a.x*TW+(o.dx||0),y=TH*.56+(o.dy||0),s=TH/216;
  g.save();g.translate(x,y);g.rotate(o.rot||0);g.scale(s,s);
  // shoulders and jacket
  g.fillStyle=a.suit;g.beginPath();g.moveTo(-34,62);g.quadraticCurveTo(-36,14,-14,8);g.lineTo(14,8);g.quadraticCurveTo(36,14,34,62);g.closePath();g.fill();
  g.fillStyle='#e9e6de';g.beginPath();g.moveTo(-8,8);g.lineTo(0,30);g.lineTo(8,8);g.closePath();g.fill();
  if(a.tie){g.fillStyle=a.tie;g.beginPath();g.moveTo(-3,12);g.lineTo(3,12);g.lineTo(4,38);g.lineTo(0,44);g.lineTo(-4,38);g.closePath();g.fill();}
  else{g.strokeStyle='#e2c66a';g.lineWidth=1.6;g.beginPath();g.arc(0,12,9,.3,PI-.3);g.stroke();}
  // neck and head
  g.fillStyle=a.skin;g.fillRect(-6,-2,12,12);
  const hx=(o.look||0)*3,nod=o.talk?Math.sin(t*9)*1.2:0;
  g.save();g.translate(hx,nod-18);g.rotate(o.tilt||0);
  g.beginPath();g.ellipse(0,0,15,18,0,0,TAU);g.fill();
  g.fillStyle=a.hair;
  if(a.tie){g.beginPath();g.ellipse(0,-7,15.5,12,0,PI,TAU);g.fill();g.fillRect(-15.5,-8,4,8);g.fillRect(11.5,-8,4,8);}
  else{g.beginPath();g.ellipse(0,-5,17,15,0,PI*.95,TAU*1.02);g.fill();g.fillRect(-17,-6,6,26);g.fillRect(11,-6,6,26);}
  // face
  const ey=o.scared?4.2:2.4;
  g.fillStyle='#fff';g.beginPath();g.ellipse(-5.5+hx*.5,-1,3.2,ey,0,0,TAU);g.ellipse(5.5+hx*.5,-1,3.2,ey,0,0,TAU);g.fill();
  g.fillStyle='#1a1410';g.beginPath();g.arc(-5.5+hx*1.2,-1,1.5,0,TAU);g.arc(5.5+hx*1.2,-1,1.5,0,TAU);g.fill();
  g.strokeStyle='#3a2a20';g.lineWidth=1.4;g.beginPath();const bw=o.scared?-3:1;g.moveTo(-9,-6+bw*-.6);g.lineTo(-2,-6-bw*.6);g.moveTo(2,-6-bw*.6);g.lineTo(9,-6+bw*-.6);g.stroke();
  const mo=o.scared?5:o.talk?Math.abs(Math.sin(t*13))*3.4+.6:.5;
  g.fillStyle='#5a1a16';g.beginPath();g.ellipse(hx*.4,8.5,o.scared?4:4.6,mo,0,0,TAU);g.fill();
  if(o.blood){g.fillStyle='#8a0f0a';g.beginPath();g.arc(6,-6,4,0,TAU);g.arc(9,3,3,0,TAU);g.fill();g.fillRect(5,-6,2,18);}
  g.restore();g.restore();
}
function tvZed(g,x,y,flip,t,grab){
  const s=TH/216*1.22;g.save();g.translate(x,y);g.scale(flip?-s:s,s);
  g.fillStyle='#4a5246';g.beginPath();g.moveTo(-30,70);g.quadraticCurveTo(-34,10,-12,6);g.lineTo(14,8);g.quadraticCurveTo(34,16,30,70);g.closePath();g.fill();
  g.fillStyle='#6a0d0a';g.beginPath();g.ellipse(4,30,12,16,.3,0,TAU);g.fill();
  // reaching arms
  g.strokeStyle='#8b957c';g.lineWidth=9;g.lineCap='round';const w=Math.sin(t*11)*5;
  g.beginPath();g.moveTo(18,20);g.lineTo(46+grab*8,6+w);g.moveTo(14,34);g.lineTo(44+grab*8,26-w);g.stroke();
  g.fillStyle='#8b957c';g.save();g.translate(4,-14);g.rotate(.28+Math.sin(t*7)*.08);
  g.beginPath();g.ellipse(0,0,15,18,0,0,TAU);g.fill();
  g.fillStyle='#2c2a22';g.beginPath();g.ellipse(-2,-9,15,9,0,PI,TAU);g.fill();
  g.fillStyle='#e9e4c0';g.beginPath();g.arc(4,-2,3.4,0,TAU);g.arc(12,-1,3,0,TAU);g.fill();
  g.fillStyle='#200';g.beginPath();g.arc(5,-2,1.1,0,TAU);g.arc(12.5,-1,1,0,TAU);g.fill();
  g.fillStyle='#3a0605';g.beginPath();g.ellipse(8,9,6,5+Math.abs(Math.sin(t*12))*3,0,0,TAU);g.fill();
  g.fillStyle='#8a0f0a';g.fillRect(4,12,2.5,10);g.fillRect(10,13,2,7);
  g.restore();g.restore();
}
function tvChyron(g,tag,head,tagCol,t,ticker){
  const y=TH*.76;
  g.fillStyle=tagCol;g.fillRect(TW*.04,y-TH*.07,TW*.34,TH*.075);
  g.fillStyle='#fff';g.font=`700 ${TH*.055}px "Oswald","Arial Narrow",sans-serif`;g.textBaseline='middle';g.textAlign='left';g.fillText(tag,TW*.055,y-TH*.03);
  g.fillStyle='rgba(245,245,245,.96)';g.fillRect(TW*.04,y,TW*.92,TH*.1);
  g.fillStyle='#111';g.font=`600 ${TH*.062}px "Oswald","Arial Narrow",sans-serif`;g.fillText(head,TW*.055,y+TH*.053,TW*.89);
  g.fillStyle='#10182c';g.fillRect(0,TH*.89,TW,TH*.11);
  g.fillStyle='#dfe6f2';g.font=`500 ${TH*.052}px "Barlow",sans-serif`;
  const wd=g.measureText(ticker).width+60,off=(t*46)%wd;g.fillText(ticker,TW-off,TH*.947);g.fillText(ticker,TW-off+wd,TH*.947);
  g.fillStyle='#c22a22';g.fillRect(TW*.86,TH*.045,TW*.1,TH*.07);g.fillStyle='#fff';g.font=`700 ${TH*.048}px "Oswald",sans-serif`;g.textAlign='center';g.fillText('LIVE',TW*.91,TH*.083);
  g.textAlign='left';g.fillStyle='rgba(255,255,255,.85)';g.font=`600 ${TH*.05}px "Oswald",sans-serif`;g.fillText('6',TW*.05,TH*.085);g.font=`500 ${TH*.04}px "Oswald",sans-serif`;g.fillText('NEWS  6:0'+(7+Math.floor(t/30)%3),TW*.075,TH*.087);
}
function tvStudio(g,warm,t){
  const gr=g.createLinearGradient(0,0,0,TH);
  if(warm){gr.addColorStop(0,'#e89a3a');gr.addColorStop(.6,'#c8552a');gr.addColorStop(1,'#5a2418');}else{gr.addColorStop(0,'#0f1e44');gr.addColorStop(.6,'#152a5c');gr.addColorStop(1,'#080e22');}
  g.fillStyle=gr;g.fillRect(0,0,TW,TH);
  g.fillStyle=warm?'rgba(255,230,150,.35)':'rgba(120,170,255,.16)';
  for(let i=0;i<7;i++)g.fillRect(i*TW/6-10+Math.sin(t*.3+i)*4,0,TW*.03,TH*.7);
  if(warm){g.fillStyle='rgba(255,240,180,.9)';g.beginPath();g.arc(TW*.5,TH*.3,TH*.2,0,TAU);g.fill();g.fillStyle='#7a2c16';g.font=`700 ${TH*.075}px "Oswald",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('GOOD MORNING TRI-COUNTY',TW*.5,TH*.3,TW*.9);}
  else{g.strokeStyle='rgba(140,180,255,.25)';g.lineWidth=1;for(let i=0;i<9;i++){g.beginPath();g.ellipse(TW*.5,TH*.3,TH*.34,TH*.34*Math.abs(Math.cos(i*.4+t*.1)),0,0,TAU);g.stroke();}
    g.beginPath();g.arc(TW*.5,TH*.3,TH*.34,0,TAU);g.stroke();}
}
function tvDesk(g){
  g.fillStyle='#141a2a';g.beginPath();g.moveTo(TW*.06,TH);g.lineTo(TW*.14,TH*.72);g.lineTo(TW*.86,TH*.72);g.lineTo(TW*.94,TH);g.closePath();g.fill();
  g.fillStyle='#5aa0ff';g.fillRect(TW*.14,TH*.72,TW*.72,TH*.012);
}
function tvDraw(){
  const g=TVG,t=tv.t;g.setTransform(1,0,0,1,0,0);g.textBaseline='middle';
  if(tv.mode==='morning'){
    tvStudio(g,true,t);const tk=tv.t<(tv.talkUntil||0);
    tvAnchor(g,ANCH[0],t,{talk:tk&&tv.who===0,look:tv.who===1?.6:0});tvAnchor(g,ANCH[1],t,{talk:tk&&tv.who===1,look:tv.who===0?-.6:0});
    tvDesk(g);tvChyron(g,'WEEKEND WEATHER','Sunny, high of 74. A perfect day to get outside.','#e08a1c',t,'TRAFFIC: delays on Route 9 northbound  ·  County fair opens Saturday  ·  Hospitals report an unusual flu surge  ·  ');
  }else if(tv.mode==='alert'||tv.mode==='dead'||(tv.mode==='cast'&&t>=CAST_CARD)){
    const on=Math.floor(t*2)%2;
    g.fillStyle=on?'#8f1410':'#6a0f0c';g.fillRect(0,0,TW,TH);
    g.fillStyle='rgba(0,0,0,.28)';for(let x=-TH;x<TW;x+=44){g.beginPath();g.moveTo(x,TH);g.lineTo(x+22,TH);g.lineTo(x+22+TH,0);g.lineTo(x+TH,0);g.fill();}
    g.fillStyle='#fff';g.textAlign='center';g.font=`700 ${TH*.17}px "Oswald","Arial Narrow",sans-serif`;g.fillText('EMERGENCY',TW/2,TH*.33);g.fillText('BROADCAST',TW/2,TH*.52);
    g.fillStyle='#ffd24a';g.font=`600 ${TH*.07}px "Oswald",sans-serif`;g.fillText(tv.mode==='alert'?'STAND BY FOR AN OFFICIAL MESSAGE':'SEEK SHELTER  ·  AVOID THE INFECTED',TW/2,TH*.72,TW*.94);
    g.fillStyle='rgba(255,255,255,.8)';g.font=`500 ${TH*.05}px "Barlow",sans-serif`;g.fillText(tv.mode==='alert'?'Tri-County Emergency Management':'This station is off the air.',TW/2,TH*.86);
  }else{
    // the broadcast
    const inT=t-CAST_IN,camFall=clamp((t-(CAST_IN+3.6))/.5,0,1),shake=inT>0&&t<CAST_STATIC?(Math.random()-.5)*5*Math.min(1,inT):0;
    g.save();
    g.translate(TW/2,TH/2);g.rotate(camFall*.55+(inT>.4?Math.sin(t*20)*.012:0));g.translate(-TW/2+shake,-TH/2+camFall*TH*.34+shake);
    g.fillStyle='#000';g.fillRect(-60,-60,TW+120,TH+160);
    tvStudio(g,false,t);
    const heard=t>22.2,talk=tv.sub?tv.sub.talk:-1;
    const halGone=clamp((inT-1.5)/1,0,1),denGone=clamp((inT-2.7)/.8,0,1),denUp=clamp((inT-.3)/.4,0,1)*(1-denGone);
    tvAnchor(g,ANCH[0],t,{talk:talk===0,look:heard?-1:talk===1?.6:0,scared:inT>.2,dy:halGone*TH*.34,rot:-halGone*.6,tilt:-halGone*.5,blood:inT>1.4,dx:-halGone*10});
    if(inT>-.2)tvZed(g,TW*(-.14+clamp((inT+.2)/.8,0,1)*.33),TH*.5+halGone*TH*.16,false,t,clamp(inT,0,1));
    tvAnchor(g,ANCH[1],t,{talk:talk===1,look:heard?-1:talk===0?-.6:0,scared:inT>-.4||t>23.6,dy:-denUp*TH*.07+denGone*TH*.36,rot:denGone*.5,blood:inT>2.6,dx:denUp*6-denGone*8});
    if(inT>1.6)tvZed(g,TW*(1.14-clamp((inT-1.6)/.8,0,1)*.33),TH*.47+denGone*TH*.14,true,t,clamp(inT-2.2,0,1));
    tvDesk(g);
    g.restore();
    if(camFall<.2)tvChyron(g,'BREAKING NEWS','OUTBREAK: STATE OF EMERGENCY DECLARED','#c22a22',t,'STAY INDOORS  ·  LOCK DOORS AND WINDOWS  ·  DO NOT APPROACH THE INFECTED  ·  HOSPITALS ARE CLOSED TO NEW PATIENTS  ·  ');
    // blood on the lens
    for(const s of tv.splats){g.fillStyle='rgba(120,8,6,.84)';g.beginPath();g.arc(s.x*TW,s.y*TH,s.r*TH,0,TAU);g.fill();
      for(let i=0;i<7;i++){const a=i*2.4+s.x*9,d=s.r*TH*(1.1+((i*37)%10)/14);g.beginPath();g.arc(s.x*TW+Math.cos(a)*d,s.y*TH+Math.sin(a)*d,s.r*TH*.22,0,TAU);g.fill();}
      g.fillRect(s.x*TW-2,s.y*TH,4,s.r*TH*2.4);}
    if(t>=CAST_STATIC){ // snow
      const id=g.getImageData(0,0,TW,TH),d=id.data;for(let i=0;i<d.length;i+=4){const v=Math.random()*255|0;d[i]=d[i+1]=d[i+2]=v;}g.putImageData(id,0,0);
      g.fillStyle='rgba(0,0,0,.45)';g.fillRect(0,(t*90)%TH,TW,TH*.12);
    }else if(inT>2.6&&Math.random()<.5){g.fillStyle='rgba(255,255,255,.14)';g.fillRect(0,Math.random()*TH,TW,3+Math.random()*10);}
  }
}
function tvSubHTML(){return tv.sub?(tv.sub.who?`<b>${tv.sub.who}</b>`:'')+tv.sub.text:'';}

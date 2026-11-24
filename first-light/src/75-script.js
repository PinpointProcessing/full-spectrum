/* The level's script: setup, timed and triggered events, spawns, and how it ends. */
let crashCar=null,heli=null,heliSpot=null,flowT=0,spawnT=0,husk=null;
const crashO={kind:'car',x:-200,y:1120,w:46,h:22,col:0xd8c23a,style:'sedan'};
function buildActors(){
  crashCar=vehicle(crashO);crashCar.visible=false;
  crashCar.add(new T.Mesh(merge([bx(8,3,10,-2,15.5,0,0xd2332a),bx(8.2,1.2,10.2,-2,15.5,0,0xffffff)]),vmat()));   // pizza sign
  heli=new T.Group();
  heli.add(new T.Mesh(merge([bx(34,12,12,0,0,0,0x1c2026),bx(14,9,10,18,-1,0,0x10141a),bx(30,3,3,-30,2,0,0x1c2026),bx(3,10,1,-44,5,0,0x1c2026),bx(20,1,1,0,-9,-6,0x333),bx(20,1,1,0,-9,6,0x333)]),vmat({roughness:.5})));
  const rotor=new T.Mesh(new T.BoxGeometry(70,.5,3),new T.MeshBasicMaterial({color:0x0a0a0a,transparent:true,opacity:.55}));rotor.position.y=8;heli.add(rotor);heli.rotor=rotor;
  heli.visible=false;scene.add(heli);
  heliSpot=new T.SpotLight(0xdfe8ff,0,700,.2,.55,1);scene.add(heliSpot,heliSpot.target);
  heli.glow=glowAt(0,0,0,0xdfe8ff,40);heli.glow.visible=false;
}
function clearAll(){
  for(const u of ents)if(u.fig&&!u.gone)removeFig(u.fig);
  for(const d of debris)scene.remove(d.o);
  for(const it of items){scene.remove(it.m);scene.remove(it.g);}
  for(const f of corpseFigs)removeFig(f);corpseFigs=[];
  ents=[];zeds=[];allies=[];survs=[];civs=[];items=[];corpses=[];debris=[];humans=[];floats.length=0;
}
function reset(fromDoor){
  clearAll();
  // put the world back
  addObj(fwin);addObj(fdoor);addObj(grate);addObj(bombCar);if(husk){removeObj(husk);husk=null;}removeObj(crashO);
  setupPortals();safeReset();roomsReset();searchReset();doorPivot.rotation.y=0;grateGrp.position.y=0;valveWheel.rotation.z=0;
  bombCar.grp.visible=true;bombCar.grp.position.set(bombCar.x+bombCar.w/2,0,bombCar.y+bombCar.h/2);bombCar.grp.rotation.set(0,0,.04);if(bombCar.fx){bombCar.fx.on=true;bombCar.fx.rate=24;bombCar.fx.x=bombCar.x+31;bombCar.fx.y=bombCar.y+11;if(bombCar.fx.e){bombCar.fx.e.on=true;bombCar.fx.e.x=bombCar.fx.x;bombCar.fx.e.y=bombCar.fx.y;if(bombCar.fx.e.sprite)bombCar.fx.e.sprite.position.set(bombCar.fx.x,19,bombCar.fx.y);}}
  crashCar.visible=false;heli.visible=false;heliSpot.intensity=0;heli.glow.visible=false;pipeLamp.on=false;
  if(bedBlanket)bedBlanket.position.set(0,0,0);
  $('#fade').classList.remove('on');stage.classList.remove('bars');scene.fog.density=.00135;
  EV={ambA:false,bus:-1,busN:0,ambC:false,up:false,armed:false,breakT:-1,breakIn:false,z0:null,doorOpen:false,doorK:0,out:false,crash:0,crashT:0,alarmT:0,geyser:false,heliT:-1,burners:false,fuse:-1,boomed:false,flungT:-1,earl:false,channel:false,crank:0,open:false,waveT:0,rowB:false,rowC:false,goal:'',sparkT:1,tvSeen:false};
  stats={kills:0,shots:0};simT=0;hitStop=0;slowT=0;shakeAmt=0;spawnT=10;flowT=0;paused=false;
  L=mkYou(296,1362);L.lying=true;L.lyingH=7.6;
  tvReset();
  // things to find
  mkItem('bat',263,1331);mkItem('pistol',267,1371);mkItem('aid',446,1372);
  mkItem('ammo',240,848);mkItem('aid',618,846);mkItem('ammo',320,914);mkItem('shotgun',352,578);mkItem('aid',410,506);mkItem('shells',300,296);mkItem('ammo',396,618);
  // household weapons lying about: each is snapped to the nearest open floor
  for(const[k,x,y]of[['knife',300,1352],['pan',430,1345],['ciron',252,872],['hammer',604,866],['iron',334,934]]){const s=openSpot(x,y,items);if(s)mkItem(k,s.x,s.y);}
  // the dead
  for(const[x,y]of[[352,1076],[398,968],[340,838],[398,514],[374,366],[300,1146],[452,1128],[244,856],[360,232],[346,150],[330,640],[112,1128]])mkCorpse(x,y,Math.random()*TAU);
  // people to rescue
  const walt=mkSurv('walt',239,1000,0,{z:18.4,safe:true,safeR:27,anim:'wave',exit:{x:270,y:1004},shakeObj:{grp:waltVan.grp,shakeT:0}});
  const jules=mkSurv('jules',233,807,0,{z:19.6,safe:true,safeR:30,anim:'wave',exit:{x:270,y:812}});
  const mari=mkSurv('marisol',493,833,PI,{hidden:true,exit:{x:493,y:808},shakeObj:{grp:nurseCar.grp,shakeT:0}});mari.fig.g.visible=false;
  const dunn=mkSurv('dunn',376,568,-PI/2,{hold:true,quiet:true,anim:'cower',hp:75});
  // the infected. Most stand around until something catches their attention.
  const Z=(t,x,y,e)=>mkZed(t,x,y,e);
  const around=(s,pts,type)=>{for(const[x,y]of pts){const z=Z(type||'shambler',x,y,{anim:'bang'});if(z&&s){z.state='chase';z.tgt=s;z.ang=Math.atan2(s.y-y,s.x-x);}}};
  Z('shambler',200,1130);Z('shambler',470,1142);Z('shambler',566,1122);
  around(walt,[[264,988],[262,1014],[240,1040],[238,960]]);
  Z('shambler',330,1040);Z('shambler',396,990);Z('shambler',372,1010);Z('shambler',318,960);Z('shambler',404,930);Z('shambler',364,1070,{anim:'feed',ang:PI});Z('runner',408,1056);
  for(const[x,y]of[[330,832],[352,846],[348,826]])Z('shambler',x,y,{anim:'feed',ang:Math.atan2(838-y,340-x)});
  around(jules,[[262,806],[232,836]],'runner');around(jules,[[204,812]]);
  for(const[x,y]of[[488,812],[526,834],[494,856]]){const z=Z('shambler',x,y,{anim:'bang'});if(z)z.ang=Math.atan2(833-y,493-x);}
  Z('shambler',472,736,{anim:'tramp',look:3});
  Z('shambler',350,760);Z('shambler',382,690);Z('runner',330,612);Z('shambler',404,664);Z('shambler',300,790);Z('shambler',366,800);Z('shambler',350,640);Z('shambler',410,780);Z('runner',380,600);
  Z('shambler',350,470);Z('shambler',330,500);Z('shambler',416,512);Z('runner',352,440);
  Z('shambler',402,522,{anim:'feed',look:7,ang:PI/2});Z('shambler',388,516,{anim:'feed',look:7,ang:0});
  Z('shambler',320,400);Z('shambler',402,398);Z('shambler',362,560);Z('shambler',330,470);
  Z('brute',360,358,{anim:'feed',boss:true,ang:0});
  Z('shambler',200,300);Z('shambler',520,296);Z('runner',424,304);
  Z('shambler',300,200);Z('shambler',440,170);Z('shambler',250,150);
  if(fromDoor){
    tv.mode='dead';tv.done=true;EV.tvSeen=true;EV.up=true;EV.armed=true;EV.breakIn=true;EV.z0={dead:true};
    breakPortal(portalOf(fwin),true);breakPortal(portalOf(fdoor),true);EV.doorK=1;doorPivot.rotation.y=1.9;
    L.lying=false;L.lyingH=0;L.x=361;L.y=1236;giveMelee('bat');L.has.pistol=true;L.ammo.pistol=8;L.aid=1;
    for(const it of items.slice(0,3)){it.taken=true;scene.remove(it.m);scene.remove(it.g);}
    if(bedBlanket)bedBlanket.position.set(0,-1.4,6);
  }
  rebuildHumans();buildFlow(L.x,L.y);hudAllies();setGoal();
}
function setGoal(){
  let g,s='';
  if(!EV.up){g='Wake up';s='The TV is still on';}
  else if(!EV.armed&&!EV.breakIn){g='Find something to fight with';s='There’s a bat by the bedroom window';}
  else if(EV.breakIn&&EV.z0&&!EV.z0.dead){g='Something is in the house';s=L.melee==='fists'?'Grab the bat':'Put it down';}
  else if(!EV.out){g='Get out the front door';}
  else if(REST){g=REST.t<22?'Catch your breath':'Something is at the door';s=REST.t<22?'It is quiet, for now':'It will not hold';}
  else if(SF.in){g='Catch your breath';s=SF.chatDone?'Step to the door when you are ready':'Ruth has the door';}
  else if(!EV.channel){g='Follow the flares north';
    const near=survs.filter(x=>!x.recruited&&!x.dead&&!x.hidden&&hyp(x.x-L.x,x.y-L.y)<170).sort((a,b)=>hyp(a.x-L.x,a.y-L.y)-hyp(b.x-L.x,b.y-L.y))[0];
    if(EV.joinT>simT)s=`${EV.joinWho} is with you now`;
    else if(near)s=`${near.name} needs help: clear the zombies around them`;
    else if(!SF.done&&hyp(SAFE.dx-L.x,SAFE.dy-L.y)<190)s='A light in the boarded-up garage';
    else if(allies.length<4&&survs.some(x=>!x.recruited&&!x.dead))s='People are calling for help';}
  else if(!EV.open){g='Open the grate';s='Stand at the red wheel and hold your ground';}
  else{g='Get inside the pipe';}
  const key=g+'|'+s;if(key!==EV.goal){EV.goal=key;$('#goal').innerHTML=g+(s?`<small>${s}</small>`:'');}
}
function spawnBehind(n,type){
  for(let i=0;i<n;i++){
    const x=clamp(L.x+rand(-150,150),40,W-40),y=clamp(L.y+rand(150,230),20,1180);
    const z=mkZed(type||(Math.random()<.4&&L.y<1050?'runner':'shambler'),x,y);
    if(z){z.state='chase';z.tgt=L;z.track=simT+30;}
  }
}
function explodeCar(){
  const x=bombCar.x+bombCar.w/2,y=bombCar.y+bombCar.h/2;
  EV.boomed=true;fxBoom(x,y);sfx('boom');shake(9);hitStop=.12;makeNoise(x,y,620);
  removeObj(bombCar);EV.flungT=0;
  if(bombCar.fx){bombCar.fx.on=false;if(bombCar.fx.e)bombCar.fx.e.on=false;}
  for(const z of zeds){if(z.dead)continue;const d=hyp(z.x-x,z.y-y);if(d<105)hitZ(z,420*(1-d/130),null,Math.atan2(z.y-y,z.x-x),320,d<60);}
  for(const h of humans){if(h.dead||h.safe)continue;const d=hyp(h.x-x,h.y-y);if(d<80){const a=Math.atan2(h.y-y,h.x-x);if(h===L)L.inv=0;hurt(h,60*(1-d/90),null);h.kx+=Math.cos(a)*260;h.ky+=Math.sin(a)*260;}}
  bigText('BOOM',1200);
  caption('The wreck blew itself out of the road. The street is open.',null,3800);
}
function script(dt){
  const inBed=L.x<358&&L.y>1310&&inHouse(L.x,L.y);
  /* 1. the break-in */
  if(!EV.breakIn&&EV.breakT<0&&(tv.done||(EV.up&&L.upT<=0&&!inBed)||simT>80)){EV.breakT=tv.done?1.4:.6;sfx('bang',330,1215,1);setTimeout(()=>sfx('bang',330,1215,1),260);}
  if(EV.breakT>=0&&!EV.breakIn){
    EV.breakT-=dt;
    if(EV.breakT<=0){
      EV.breakIn=true;breakPortal(portalOf(fwin));EV.knockT=5;
      setTimeout(()=>{if(state==='play')bloodText('Find shelter',4600);},1300);
      for(let i=0;i<26;i++)emit(pDrop,310+rand(-18,18),1224,rand(10,20),rand(-30,30),rand(10,70),rand(0,40),rand(1.2,2.4),rand(.5,1),.8,.9,1,.9,260,0,0,1);
      for(let i=0;i<6;i++)decal(310+rand(-16,16),1234+rand(0,14),rand(2,4),.5,0xbfd8e6);
      const z=mkZed('runner',310,1208,{look:0});
      if(z){z.hp=z.maxhp=62;z.state='chase';z.tgt=L;z.track=simT+90;z.stag=.5;EV.z0=z;}
      if(L.lying)getUp();
      caption('Glass shatters at the front of the house.',null,3400);shake(2);
    }
  }
  /* 2. the front door */
  if(!EV.doorOpen&&EV.breakIn&&L.y<1262&&hyp(L.x-361,L.y-1232)<26&&(!EV.z0||EV.z0.dead||simT>EV.z0.track-78)){
    breakPortal(portalOf(fdoor),true);sfx('bang',361,1223,.8);      // you open it yourself
    if(!EV.knock||EV.knock.dead){const z=mkZed('shambler',361,1205,{look:2});if(z){z.state='chase';z.tgt=L;z.ang=PI/2;z.atkCD=.6;}}
  }
  // something comes to the front door and pounds on it until it gives
  if(EV.knockT>0&&!EV.doorOpen){EV.knockT-=dt;if(EV.knockT<=0){const z=mkZed('shambler',361,1200,{look:2});if(z){z.state='chase';z.tgt=L;z.track=simT+150;z.doorOnly=true;z.ang=PI/2;EV.knock=z;caption('Something is pounding on the front door.',null,3200);}}}
  if(!EV.doorOpen){const pd=portalOf(fdoor);if(pd&&pd.rattle>0){pd.rattle-=dt;doorPivot.rotation.y=Math.sin(simT*70)*.05*pd.rattle/.25;}else doorPivot.rotation.y=0;}
  if(EV.doorOpen&&EV.doorK<1){EV.doorK=Math.min(1,EV.doorK+dt*3);doorPivot.rotation.y=ease(EV.doorK)*1.9;}
  safeTick(dt);roomsTick(dt);
  /* 3. outside */
  if(!EV.out&&L.y<1216&&!inHouse(L.x,L.y)){
    EV.out=true;bigText('Sycamore Court',2600);EV.heliT=0;spawnT=14;
    caption('The whole street. It’s the whole street.','You',3600);
    const r1=mkZed('runner',-10,1136),r2=mkZed('runner',-30,1124);
    const c1=mkCiv(124,1150,[{x:300,y:1146},{x:660,y:1152}],63),c2=mkCiv(146,1110,[{x:340,y:1112},{x:650,y:1106}],60);
    if(r1){r1.state='chase';r1.tgt=c1;r1.track=simT+20;}if(r2){r2.state='chase';r2.tgt=c2;r2.track=simT+20;}
    rebuildHumans();
  }
  if(EV.out&&!EV.crash&&L.y<1182){EV.crash=1;EV.crashT=0;sfx('skid',200,1130,1,900);}
  if(EV.crash===1){
    EV.crashT+=dt;const k=EV.crashT/2.1;crashCar.visible=true;
    const P=[[-90,1131],[380,1127],[522,1105],[585,1119]],seg=Math.min(2,Math.floor(k*3)),f=clamp(k*3-seg,0,1);
    const x=lerp(P[seg][0],P[seg+1][0],f),y=lerp(P[seg][1],P[seg+1][1],f),a=Math.atan2(P[seg+1][1]-P[seg][1],P[seg+1][0]-P[seg][0]);
    crashCar.position.set(x,0,y);crashCar.rotation.y=-a;
    for(const z of zeds)if(!z.dead&&hyp(z.x-x,z.y-y)<16){hitZ(z,300,null,a+rand(-.5,.5),340,true);sfx('crack',x,y,1);}
    if(hyp(L.x-x,L.y-y)<13){L.inv=0;hurt(L,25,{x:x-Math.cos(a)*10,y});L.kx+=Math.cos(a)*200;}
    if(!EV.geyser&&x>516){EV.geyser=true;sfx('crash',538,1092,.8,900);fxSpark(538,1092,6,14);}
    if(k>=1){
      EV.crash=2;EV.alarmT=16;crashO.x=562;crashO.y=1108;addObj(crashO);
      sfx('crash',585,1119,1.2,1000);shake(3);fxSpark(606,1120,10,26);fxDust(600,1120,8);
      crashCar.rotation.z=.05;
    }
  }
  if(EV.alarmT>0){
    const b=Math.floor(EV.alarmT/1.5);EV.alarmT-=dt;
    if(Math.floor(EV.alarmT/1.5)!==b){sfx('alarm',585,1119,1,800);makeNoise(585,1119,430);}
  }
  if(EV.geyser){
    for(let i=0;i<3;i++)emit(pDrop,538+rand(-1,1),1092+rand(-1,1),8,rand(-16,16),rand(-16,16),rand(120,190),rand(1.6,3),rand(.8,1.4),.7,.82,.95,.6,260,.3,0,2);
    if(Math.random()<.3)emit(pSmoke,538,1092,40,rand(-10,10),rand(-10,10),10,10,1,.8,.85,.9,.25,0,1,10);
  }
  /* 4. helicopter passes */
  if(EV.heliT>=0){
    EV.heliT+=dt;const k=EV.heliT/11;
    if(k>=1){EV.heliT=-1;heli.visible=false;heliSpot.intensity=0;heli.glow.visible=false;ambSet('heli',0);}
    else{
      const x=lerp(-420,1100,k),y=lerp(1380,560,k);heli.visible=true;heli.position.set(x,190,y);heli.rotation.y=-Math.atan2(560-1380,1100+420);heli.rotor.rotation.y+=dt*40;
      heliSpot.position.set(x,186,y);heliSpot.target.position.set(lerp(x,L.x,.55),0,lerp(y+60,L.y,.55));heliSpot.intensity=2.6;
      heli.glow.visible=true;heli.glow.position.set(x,182,y);
      ambSet('heli',clamp(1-hyp(x-L.x,y-L.y)/900,0,1)*.5);
    }
  }
  /* 5. things further up the street */
  if(!EV.burners&&L.y<1076){
    EV.burners=true;
    for(const[x,y]of[[486,960],[490,1000]]){const z=mkZed('shambler',x,y);if(z){z.burning=true;z.speed=26;z.state='chase';z.tgt=L;z.track=simT+20;}}
    caption('They’re coming out of the fire.','You',2800);
  }
  if(EV.fuse<0&&!EV.boomed&&hyp(L.x-411,L.y-871)<150){EV.fuse=6.5;if(bombCar.fx)bombCar.fx.rate=60;caption('That wreck is about to go up. Stay back.',null,3600);}
  if(EV.fuse>=0&&!EV.boomed){
    EV.fuse-=dt;if(Math.random()<dt*10)fxSpark(411+rand(-14,14),871+rand(-6,6),10,3);
    if(EV.fuse<=0)explodeCar();
  }
  if(EV.flungT>=0&&EV.flungT<1){
    EV.flungT=Math.min(1,EV.flungT+dt/.9);const k=EV.flungT,g=bombCar.grp;
    g.position.set(lerp(411,405,k),Math.sin(k*PI)*46+k*9,lerp(871,802,k));g.rotation.z=k*PI;g.rotation.y=k*2.2;
    if(k>=1){husk={kind:'car',x:388,y:792,w:34,h:20,full:false,tall:false};addObj(husk);sfx('crash',405,802,1);shake(3);fxDust(405,802,8);fxSpark(405,802,6,16);
      if(bombCar.fx){bombCar.fx.x=405;bombCar.fx.y=802;bombCar.fx.rate=14;bombCar.fx.on=true;if(bombCar.fx.e){bombCar.fx.e.x=405;bombCar.fx.e.y=802;bombCar.fx.e.on=true;if(bombCar.fx.e.sprite)bombCar.fx.e.sprite.position.set(405,19,802);}}}
  }
  EV.sparkT-=dt;if(EV.sparkT<=0){EV.sparkT=rand(.5,2.4);if(hyp(L.x-432,L.y-846)<380){fxSpark(434,846,rand(4,40),10,[.6,.8,1]);sfx('spark',434,846,.7);}}
  if(!EV.ambA&&L.y<1000){
    EV.ambA=true;   // they come out from between the houses on both sides
    for(const[x,y,t]of[[216,912,'shambler'],[200,900,'shambler'],[236,924,'runner'],[470,908,'shambler'],[486,900,'shambler'],[462,896,'runner']]){const z=mkZed(t,x,y);if(z){z.state='chase';z.tgt=L;z.track=simT+25;}}
    sfx('roar',360,900,.6);
  }
  if(EV.bus<0&&EV.busN===0&&hyp(L.x-346,L.y-700)<120){EV.bus=.1;caption('The school bus wasn’t empty.',null,3200);sfx('bang',340,700,1);}
  if(EV.bus>=0&&EV.busN<6){EV.bus-=dt;if(EV.bus<=0){EV.bus=.45;EV.busN++;const z=mkZed(EV.busN%3===0?'runner':'shambler',345,668+EV.busN*11);if(z){z.state='chase';z.tgt=L;z.track=simT+30;z.stag=.35;z.ang=0;sfx('snarl',z.x,z.y,.8);}}}
  if(!EV.ambC&&L.y<600){
    EV.ambC=true;for(const[x,y]of[[412,420],[420,404],[396,396]]){const z=mkZed('runner',x,y);if(z){z.state='chase';z.tgt=L;z.track=simT+25;}}
  }
  if(!EV.rowB&&L.y<820){
    EV.rowB=true;EV.heliT=EV.heliT<0?0:EV.heliT;
    const c=mkCiv(206,750,[{x:292,y:752},{x:360,y:700},{x:366,y:420}],62);const z=mkZed('runner',196,748);if(z){z.state='chase';z.tgt=c;z.track=simT+20;}rebuildHumans();
  }
  if(!EV.rowC&&L.y<640){
    EV.rowC=true;
    const c=mkCiv(380,360,[{x:372,y:520},{x:356,y:700},{x:350,y:1000}],60);for(const[x,y]of[[372,330],[396,338]]){const z=mkZed('runner',x,y);if(z){z.state='chase';z.tgt=c;z.track=simT+14;}}rebuildHumans();
  }
  const dn=survs.find(s=>s.key==='dunn');
  if(dn&&dn.quiet&&!dn.dead&&hyp(L.x-dn.x,L.y-dn.y)<290){dn.quiet=false;dn.anim=null;rebuildHumans();floatText(dn,'Stay back! Get off the street!',COL.ally);}
  /* 6. the drain */
  if(!EV.channel&&L.y<266){EV.channel=true;caption('The storm drain. If that grate opens, it can be shut again behind us.','You',4600);sfx('roar',360,300,.6);}
  if(EV.channel&&!EV.open){
    if(L.anim==='crank'){
      if(EV.crank===0)caption('It’s rusted solid. Keep turning.',null,3000);
      const before=Math.floor(EV.crank*18);EV.crank=Math.min(1,EV.crank+dt/9);
      valveWheel.rotation.z-=dt*4;grateGrp.position.y=EV.crank*EV.crank*44;
      if(Math.floor(EV.crank*18)!==before){sfx('crank',VALVE.x,VALVE.y,1);if(before%3===0)makeNoise(VALVE.x,VALVE.y,320);}
      if(EV.crank>=1){
        EV.open=true;removeObj(grate);grateGrp.position.y=46;sfx('clang',360,120,1);bigText('It’s open. Go!',2000);shake(2);
        pipeLamp.on=true;pipeLamp.i=1.2;
      }
    }
    if(EV.crank>0){
      EV.waveT-=dt;
      if(EV.waveT<=0&&zeds.filter(z=>!z.dead&&!z.far).length<15){EV.waveT=2.6;
        for(const[x,y]of[[352,296],[388,300]]){const z=mkZed(Math.random()<.35?'runner':'shambler',x+rand(-10,10),y+rand(-6,6));if(z){z.state='chase';z.tgt=L;z.track=simT+60;}}}
    }
  }
  if(EV.open&&L.y<PIPE.yIn&&L.x>PIPE.x0&&L.x<PIPE.x1)escape();
  /* background pressure: a few always arrive behind you, out of view */
  if(EV.out&&!EV.channel){
    spawnT-=dt;
    if(spawnT<=0){spawnT=rand(5,8);if(zeds.filter(z=>!z.dead&&!z.far&&z.state==='chase').length<8&&zeds.length<110)spawnBehind(Math.random()<.5?2:1);}
  }
  setGoal();
}
function ambTick(){
  if(!AU.ctx)return;
  let nf=1e9;for(const f of world.fires)if(f.on&&f.rate>0){const d=hyp(f.x-L.x,f.y-L.y);if(d<nf)nf=d;}
  const out=insideNow?.22:1;
  ambSet('fire',clamp(1-nf/330,0,1)*.16);
  ambSet('wind',.05*out);ambSet('siren',.022*out+(EV.out?0:.004));
  ambSet('water',Math.max(EV.geyser?clamp(1-hyp(538-L.x,1092-L.y)/300,0,1)*.07:0,clamp(1-Math.abs(L.y-190)/160,0,1)*.035));
  const chasers=zeds.filter(z=>!z.dead&&!z.far&&z.state==='chase'&&z.tgt&&z.tgt.kind!=='civ'&&!z.tgt.safe).length;
  ambSet('drone',state==='play'?clamp(.02+chasers*.016,0,.13):.02);
  // TV: loud in the bedroom, muffled from the other rooms, gone outside
  const d=hyp(L.x-TVPOS.x,L.y-TVPOS.y),v=tv.watch?1:inHouse(L.x,L.y)?clamp(1-d/230,0,.9)*.75+.06:clamp(1-d/200,0,1)*.1;
  AU.tvVol=v;AU.tv.gain.setTargetAtTime(v,AU.ctx.currentTime,.1);
}
function update(dt){
  simT+=dt;earX=L.x;earY=L.y;
  flowT-=dt;if(flowT<=0){flowT=.3;buildFlow(L.x,L.y);}
  youUpdate(dt);
  for(let i=0;i<zeds.length;i++)zUpdate(zeds[i],dt);
  for(let i=0;i<allies.length;i++)allyUpdate(allies[i],dt,i);
  for(const s of survs)if(!s.recruited&&!s.dead&&!s.quiet)survIdle(s,dt);
  for(let i=0;i<civs.length;i++)civUpdate(civs[i],dt);
  separate();
  if(state==='play')script(dt);
  // loose heads
  for(const d of debris){
    if(d.rest)continue;d.t+=dt;d.vz-=300*dt;const o=d.o;
    o.position.x+=d.vx*dt;o.position.z+=d.vy*dt;o.position.y+=d.vz*dt;o.rotation.x+=d.sx*dt;o.rotation.z+=d.sz*dt;
    if(o.position.y<2){o.position.y=2;if(Math.abs(d.vz)<40){d.rest=true;decal(o.position.x,o.position.z,8,.9);}else{d.vz*=-.4;d.vx*=.5;d.vy*=.5;d.sx*=.5;d.sz*=.5;sfx('punch',o.position.x,o.position.z,.5);}}
  }
  for(const it of items)if(!it.taken){it.m.rotation.y+=dt*1.6;it.m.position.y=9+Math.sin(simT*2.4+it.x)*1.4;}
  for(const f of floats)f.t+=dt;
  for(let i=floats.length-1;i>=0;i--)if(floats[i].t>(floats[i].text.length>18?2.6:1.5))floats.splice(i,1);
  if(civs.some(c=>c.gone)||zeds.some(z=>z.gone)){civs=civs.filter(c=>!c.gone);zeds=zeds.filter(z=>!z.gone);ents=ents.filter(e=>!e.gone);corpses=corpses.filter(c=>!c.gone);rebuildHumans();}
}
function gameOver(){
  if(state!=='play')return;
  state='dying';slowT=2;sfx('scream');shake(6);
  const left=allies.filter(a=>!a.dead).length;
  $('#deadText').textContent=left?`Without you, ${left===1?allies.find(a=>!a.dead).name+' doesn’t last the hour':'the others scatter'}. Nobody reaches the drain.`:'The street takes one more.';
  setTimeout(()=>{if(state==='dying'){state='dead';$('#dead').hidden=false;$('#hud').hidden=true;}},2100);
}
/* ---- Ruth's garage: knock, get let in, the door is barred behind you, a short talk and a breather, then out again ---- */
const SF={in:false,done:false,open:false,t:0,i:0,lines:null,chatDone:false,ruth:null,away:0};
const RUTH_LINES=['Sit. Breathe. Nothing gets through that door, I nailed it myself.','They follow noise. Glass, gunshots, that car alarm. Quiet feet live longer.','The county signs say storm drain. There is a red wheel by the grate, it takes a minute to turn. Do not let them crowd you while you turn it.','My knees will not make that walk. Go on. Bar the door behind you.'];
function safeDoorSet(open){SF.open=open;if(open)removeObj(safeDoor);else addObj(safeDoor);safeDoorGrp.visible=!open;sfx('bang',SAFE.dx,SAFE.dy,.6);}
function safeReset(){
  SF.in=false;SF.done=false;SF.t=0;SF.i=0;SF.lines=null;SF.chatDone=false;SF.called=false;addObj(safeDoor);SF.open=false;safeDoorGrp.visible=true;
  SF.ruth=Object.assign(base('prop',236,548,0,makeFig(BYID.ruth)),{name:'Ruth'});ents.push(SF.ruth);
  mkItem('aid',262,526);
}
function safeTick(dt){
  const dd=hyp(SAFE.dx-L.x,SAFE.dy-L.y),inside=inSafe(L.x,L.y),r=SF.ruth;
  if(r){const a=Math.atan2(L.y-r.y,L.x-r.x);r.ang=turn(r.ang,a,dt*4);}
  if(!SF.done&&!SF.in){
    if(!SF.called&&dd<150){SF.called=true;floatText({x:SAFE.dx,y:SAFE.dy,z:0},'In here! Quick!',COL.ally);}
    if(!SF.open&&dd<24&&!inside)safeDoorSet(true);
    if(SF.open&&inside&&L.x<SAFE.x1-8){      // you are in: bring your people in, bar the door
      const spots=[[262,556],[266,528],[246,528],[252,558]];allies.forEach((a,i)=>{if(a.dead)return;a.x=spots[i%4][0];a.y=spots[i%4][1];a.safe=true;a.vault=null;a.foe=null;});
      safeDoorSet(false);SF.in=true;SF.t=0;SF.i=0;SF.next=1;L.safe=true;SF.lines=RUTH_LINES.slice();
      for(const z of zeds)if(inSafe(z.x,z.y)&&!z.dead)z.x=SAFE.dx+30;
    }
    if(SF.open&&!inside&&dd>60)safeDoorSet(false);
  }
  if(SF.in){
    SF.t+=dt;
    for(const h of[L,...allies])if(!h.dead)h.hp=Math.min(h.maxhp,h.hp+9*dt);
    if(!SF.chatDone&&SF.t>(SF.next||1)){if(SF.i<SF.lines.length){const t=SF.lines[SF.i++],d=Math.max(3.8,speak('ruth',t,4)+.7);caption(t,'Ruth',d*1000-200);SF.next=SF.t+d;}else SF.chatDone=true;}      // each line waits for the one before it to finish
    // out again: walk into the door from the inside once she has said her piece (or you have been here a few seconds)
    if(SF.t>4&&L.x>SAFE.x1-10&&Math.abs(L.y-SAFE.dy)<12&&input.mx>.3){
      safeDoorSet(true);SF.in=false;SF.done=true;L.safe=false;for(const a of allies)a.safe=false;shutUp();
    }
  }
  if(SF.done&&SF.open&&!inside&&dd>46){safeDoorSet(false);caption('The bar drops back across the door behind you.',null,2600);}
}
/* ---- houses: the red ring marks the door. Something is usually inside, and so is something worth having. Once the house is
   clear and you are in it, the door shuts: you heal, and whatever followed you has to beat the door down first. ---- */
function roomDoor(R,open){R.open=open;if(open)removeObj(R.door);else addObj(R.door);R.grp.visible=!open;sfx('bang',R.out.x,R.out.y,.6);}
function roomsReset(){
  REST=null;
  for(const R of ROOMS){
    addObj(R.door);R.open=false;R.grp.visible=true;R.hp=240;R.t=0;R.broken=false;R.told=false;R.roof.visible=true;
    const spot=()=>{for(let i=0;i<40;i++){const x=rand(R.x0+14,R.x1-14),y=rand(R.y0+14,R.y1-14);if(isFree(x,y,8))return{x,y};}return{x:(R.x0+R.x1)/2,y:(R.y0+R.y1)/2+24};};
    for(let i=0;i<2;i++){const p=spot(),z=mkZed('shambler',p.x,p.y,{});if(z)z.sight=110;}
  }
}
function roomsTick(dt){
  for(const m of MARKS)m.rotation.z+=dt*2.4;
  for(const R of ROOMS){
    const inside=inRoom(R,L.x,L.y),dOut=hyp(R.out.x-L.x,R.out.y-L.y),dIn=hyp(R.inn.x-L.x,R.inn.y-L.y);
    R.roof.visible=!inside;
    if(R.broken)continue;
    const zin=zeds.some(z=>!z.dead&&inRoom(R,z.x,z.y));
    if(!R.open){
      const ox=R.out.x-R.inn.x,oy=R.out.y-R.inn.y,push=(ox*input.mx+oy*input.my)/(hyp(ox,oy)||1);
      if(!inside&&dOut<20)roomDoor(R,true);
      else if(inside&&dIn<16&&push>.3){roomDoor(R,true);if(REST===R)REST=null;}
    }else if(inside&&!zin&&dIn>26){      // clear, and you are well inside: shut it and rest
      allies.forEach((a,i)=>{if(a.dead||inRoom(R,a.x,a.y))return;a.x=clamp(L.x+(i%2?14:-14),R.x0+10,R.x1-10);a.y=clamp(L.y+(i<2?14:-14),R.y0+10,R.y1-10);a.vault=null;});
      roomDoor(R,false);REST=R;if(!R.told){R.told=true;caption('The house is quiet. You shut the door and get your breath back.',null,4200);}
    }else if(!inside&&dOut>80)roomDoor(R,false);
    if(REST===R){
      if(!inside){REST=null;continue;}
      R.t+=dt;
      for(const h of[L,...allies])if(!h.dead&&inRoom(R,h.x,h.y))h.hp=Math.min(h.maxhp,h.hp+5*dt);
      // a house is only safe for half a minute (Bryan): from 22 s something pounds on the door, at 30 s it comes through
      if(R.t>22){R.knock=(R.knock||0)-dt;if(R.knock<=0){R.knock=rand(.55,.9);sfx('bang',R.out.x,R.out.y,1);if(Math.random()<.4)sfx('snarl',R.out.x,R.out.y,.8);}}
      if(R.t>=30){R.broken=true;REST=null;roomDoor(R,true);sfx('crash',R.out.x,R.out.y,1);shake(2);caption('The door comes off its hinges.',null,2800);
        if(!zeds.some(z=>!z.dead&&!z.far&&hyp(z.x-R.out.x,z.y-R.out.y)<40)){const z=mkZed(Math.random()<.35?'runner':'shambler',R.out.x,R.out.y,{});if(z){z.state='chase';z.tgt=L;z.track=simT+20;}}
        makeNoise(R.out.x,R.out.y,220);}
    }
  }
  if(!REST)for(const z of zeds)if(z.anim==='bang'&&!z.port&&!z.script&&!z.dead)z.anim=null;
}
function escape(){
  if(state!=='play')return;
  state='escape';sfx('clang');$('#fade').classList.add('on');$('#hud').hidden=true;$('#bubble').hidden=true;
  setTimeout(shelter,1100);
}
function shelter(){
  // the grate is shut behind you. Everyone who made it stands in the pipe; whatever followed claws at the bars.
  const saved=allies.filter(a=>!a.dead);
  addObj(grate);grateGrp.position.y=0;pipeLamp.on=true;pipeLamp.i=1.1;pipeLamp.x=360;pipeLamp.y=40;pipeLamp.h=9;
  L.x=360;L.y=66;L.ang=-PI/2;L.spd=0;L.atk=null;L.anim=null;L.vx=L.vy=0;setWeapon(L.fig,L.melee==='fists'?null:L.melee);
  const spots=[[346,48,-.3],[375,52,PI+.3],[350,32,.5],[371,34,PI-.5]];
  saved.forEach((a,i)=>{const s=spots[i%4];a.x=s[0];a.y=s[1];a.ang=s[2];a.spd=0;a.atk=null;a.foe=null;a.anim=null;});
  let n=0;
  for(const z of zeds){
    if(z.dead)continue;
    if(n<6){z.x=338+n*8.6;z.y=128+((n*7)%5);z.ang=-PI/2;z.anim='bang';z.state='idle';z.tgt=null;z.as=null;z.far=false;z.script=()=>false;z.stag=0;z.kx=z.ky=0;z.spd=0;n++;}
    else{z.far=true;z.fig.g.visible=false;z.script=()=>false;}
  }
  scene.fog.density=.0005;
  state='shelter';stage.classList.add('bars');$('#fade').classList.remove('on');
  setTimeout(()=>{if(state==='shelter')showEnd();},1500);
}

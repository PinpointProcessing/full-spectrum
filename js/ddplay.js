"use strict";
/* D-Day test, the play (the map and its look: dday.js; the plan and Bryan's rules: docs/dday-test.md).
   - Two squads of four, Alpha and Bravo, each a medic, a gunner, a sharpshooter and a demolition man (anti-tank). One squad
     is played at a time (picking a man of the other, or its tab, changes over and the camera goes to it: ddSelected); the
     other runs itself (ddSquadAI): it holds and fights, creeps forward only once nobody's left in front of it, and uses
     grenades, rockets and smoke now and then, more the longer it's left alone.
   - A man who dies (bled out, a headshot, a shell dead on) is replaced by a fresh one off the next boat, while the 20
     replacements last (DD_POOL): the type his squad is missing, else a random one, with a name and a trait of his own.
   - Other troops (side 'P', team 'N', npc) land in waves and fight, but only follow where the squads have opened the way.
   - The defenders hold the pillbox, the nests, the draw and the base; the barracks sends a man down every few seconds until
     it's destroyed, which wins the map. Mortars, the heavy gun and the cannon shell the beach while they're crewed.
   - Out past the map's edge the screen darkens; ten seconds out and the man is lost.
   Hooks: combat.js (ddPick, ddDamage, ddTick), mission.js (ddBlast, ddObjUI, drawDDay), input.js (ddSelected, ddBusy),
   hud.js (ddHint, ddFinish), state.js (leaveDDayNow). */
const DD_CAM={zoom:8.5,pitch:.29,shift:.09,look:30,boat:7};   // the camera: close behind the squad being played, low enough for the horizon (Bryan: "like a third person for the full squad, think Full Spectrum Warrior"; "semi-fixed to the team")
const DD_POOL=20,DD_FIG=1.3,DD_US='#7f7d4e',DD_GER='#56646e';   // (DD_FIG: the men drawn bigger here, so they read from further up)
const DD_ROLES={
  medic:{ab:'MEDIC',n:'Medic',cls:'medic',weapon:'rifle',spec:'medkit',specN:3},
  gunner:{ab:'GUNNER',n:'Gunner',cls:'support',weapon:'hmg',spec:'smoke',specN:2},
  sharp:{ab:'SHARPSHOOTER',n:'Sharpshooter',cls:'recon',weapon:'sniper',spec:'smoke',specN:2},
  demo:{ab:'DEMOLITION',n:'Demolition man',cls:null,weapon:'rifle',spec:'rpg',specN:4},
  eng:{ab:'ENGINEER',n:'Engineer',cls:'defender',weapon:'rifle',spec:'build',specN:3}};   // (Version 131, Bryan: "a new unit that builds makeshift defenses under fire": build.js's kit, a barricade where you tap)
// who's in each squad to start, and so which types a replacement fills first: Bravo has the engineer in its sharpshooter's place for
// now, so he can be tried (a question for Bryan: a fifth man, or in someone's place)
const DD_CORE={A:['medic','gunner','sharp','demo','eng'],B:['medic','gunner','sharp','demo','eng']};   // (five a squad since Version 133: Bryan, "Let's make a fifth slot for engineer")
const DD_ORDER=['medic','gunner','sharp','demo'];
const DD_TRAITS=[{n:'Steady',nerveK:.75},{n:'Sharp-eyed',aimK:.06},{n:'Quick',spdK:1.1},{n:'Tough',dmgIn:.88},{n:'Green',aimK:-.04,nerveK:1.2},{n:'Hothead',bold:1.6},{n:'Careful',bold:.6},{n:'Old hand',aimK:.03,nerveK:.85}];
const DD_NAMES=['Kelly','Murphy','Novak','Rossi','Schmidt','Carter','Dalton','Greer','Hobbs','Jensen','Kowal','Larkin','Mercer','Nolan','Ortiz','Pruitt','Quinn','Riley','Sawyer','Tanner','Voss','Walsh','Yates','Zielinski','Baker','Cobb','Dunn','Ellis','Finch','Gallo','Hart','Irwin','Joyce','Keane','Lowe','Mack','Nash','Owens','Pike','Reed','Stone','Tully','Vance','Webb','Abbott','Boone','Cross','Drake'];
const DD_LABELS={rifle:'M1 Garand',hmg:'BAR',sniper:'Springfield'};
// the squads' way up (dx, y): where the squad that runs itself goes next, once nobody's left in front of it
const DD_ROUTE=[[440,640],[450,520],[430,380],[505,336],[545,240],[570,120],[520,0],[420,-110],[320,-230],[230,-340],[300,-470],[520,-540],[720,-600]];
// where the other troops hold until the squads have opened the next stretch
const DD_LINES=[344,236,-20,-290,-470];
let dd=null;
// by day: no night rim light or self-light on anyone (figure.js's material)
function ddDayFig(u){if(!u.m||!u.m.g)return;u.m.g.scale.set(DD_FIG*1.06,DD_FIG*.9,DD_FIG*1.06);u.m.g.traverse(o=>{const U=o.material&&o.material.userData&&o.material.userData.U;if(U){U.uRim.value.multiplyScalar(.15);U.uFill.value=.14;U.uGlow.value=u.side==='P'?.5:0;}});}
const ddAlly=u=>u.side==='P'&&!u.dead&&!u.downed&&!u.away;
const ddSq=t=>players.filter(p=>p.team===t&&!p.dead);
function ddPickRole(team){const have=ddSq(team).map(p=>p.ddRole),miss=DD_CORE[team].filter(r=>!have.includes(r)),all=Object.keys(DD_ROLES);return miss.length?miss[0]:all[(Math.random()*all.length)|0];}
function ddName(){const used=new Set(units.map(u=>u.name));for(let k=0;k<40;k++){const n=DD_NAMES[(Math.random()*DD_NAMES.length)|0];if(!used.has(n))return n;}return DD_NAMES[(Math.random()*DD_NAMES.length)|0];}
function ddNewMan(team,id,role,x,y){
  const R=DD_ROLES[role],tr=DD_TRAITS[(Math.random()*DD_TRAITS.length)|0],u=mk('P',team,id,ddName(),x,y,-Math.PI/2);
  Object.assign(u,{dmgIn:1.15,role:R.ab,ddRole:role,ddCls:R.cls,weapon:R.weapon,weapon2:null,spec:R.spec,specN:R.specN,grenade:1,freed:true,trait:tr.n,bold:1,level:1},tr);delete u.n;
  u.skillN=typeof skillFull==='function'?skillFull(u):0;u.skillT=0;
  u.cloth=DD_US;makeSoldier(u);ddDayFig(u);return u;
}
function ddNpc(x,y){
  const u=mk('P','N','N'+(++dd.nid),'GI',x,y,-Math.PI/2);
  Object.assign(u,{npc:true,freed:true,weapon:'rifle',grenade:0,spec:null,specN:0,aimK:-.1,lane:clamp(x+(Math.random()-.5)*120,DDX+40,DDX+DDW-40),hopT:simT+Math.random()*2,nerveK:1.15,eng:Math.random()<.17});
  u.cloth=DD_US;makeSoldier(u);ddDayFig(u);u.m.ring.material.opacity=.35;dd.npcs.push(u);dd.npcN++;return u;
}
function ddFoe(tag,dx,y,ex){
  const u=hostile('G'+(++dd.eid),dx+DDX,y,Object.assign({name:'Defender',ang:Math.PI/2,alerted:true,aware:1,jumpy:false,helm:true,cloth:DD_GER,nade:0,aimPen:-.03,dmgIn:.72,tag},ex||{}));
  u.sawT=simT;ddDayFig(u);return u;
}
function ddGunner(tag,s,name){const u=ddFoe(tag,s.x,s.y-6,{name:name||'Machine gunner',gunner:true,post:true,ang:s.ang});u.onGun={x:s.x+DDX,y:s.y,ang:s.ang,arc:s.arc};return u;}
function spawnDDay(){
  const S=DD_SPOT,Z=(x0,y0,x1,y1)=>({x0:x0+DDX,x1:x1+DDX,y0,y1});
  ddGunner('pill',S.pill);ddFoe('pill',724,268,{post:true});ddFoe('pill',612,262,{post:true,nade:1});ddGunner('left',S.leftMG);ddFoe('left',316,262,{post:true});ddFoe('left',246,282,{post:true});ddFoe('wall',505,280,{post:true,nade:1});ddFoe('wall',150,290,{post:true});ddFoe('left',400,268,{post:true,nade:1});
  for(const n of S.nests)ddGunner('nest',n);ddFoe('nest',790,262,{post:true});ddFoe('draw',800,-52,{zone:Z(752,-95,1000,40)});
  ddFoe('draw',484,178,{post:true});ddFoe('draw',520,178,{post:true});ddFoe('draw',600,60,{zone:Z(480,0,660,130)});ddFoe('draw',470,-20,{zone:Z(400,-60,640,60),nade:1});ddFoe('draw',556,178,{post:true,nade:1});
  ddGunner('hill',S.hillMG);ddFoe('hill',856,136,{post:true});ddFoe('art',780,100,{post:true,name:'Gun crew'});ddFoe('art',832,100,{post:true,name:'Gun crew'});
  ddGunner('draw',S.drawMG);ddFoe('draw',420,-150,{zone:Z(380,-200,640,-60)});ddFoe('draw',542,-164,{zone:Z(380,-200,640,-60),nade:1});
  ddFoe('draw',252,-282,{zone:Z(150,-320,420,-220)});ddFoe('draw',318,-258,{zone:Z(150,-320,420,-220)});
  ddFoe('heavy',56,-412,{post:true,name:'Gun crew'});ddFoe('heavy',126,-412,{post:true,name:'Gun crew'});
  ddFoe('top',S.sniper.x,S.sniper.y,{post:true,name:'Sniper',weapon:'sniper'});
  ddFoe('cannon',264,-592,{post:true,name:'Gun crew'});
  ddGunner('top',S.topMG);
  for(const m of S.mortars)ddFoe('mortar',m.x,m.y,{post:true,name:'Mortar crew',mortarT:simT+6+Math.random()*8});
  for(const[x,y]of[[470,-506],[580,-546],[660,-486],[780,-526],[380,-520],[880,-560]])ddFoe('base',x,y,{zone:Z(200,-700,1000,-440),nade:1});
  enemies=units.filter(u=>u.side==='E');
}
/* ---------- in and out ---------- */
function enterDDay(){
  buildDDay();stashOut(players);
  for(const u of units)if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap({objs:DD.objs,hq:DD.hq,slow:[{x:0,y:700,w:1400,h:78,k:.62}],lamps:DD.lamps,scene:DD.scene,lights:DD.lights,x1:DDB.x1});
  tankFires=[];rockets=[];charges=[];units=[];players=[];enemies=[];civs=[];
  MAPID='dd';LEVEL=5;groundH=ddH;
  dd={t0:simT,pool:DD_POOL,lost:0,queue:[],npcs:[],npcN:0,nid:0,eid:0,active:'A',idle:{A:0,B:0},hop:{A:0,B:0},wp:{A:0,B:0},front:800,won:false,over:false,
    land:{t:0,done:false},boats:[],waveT:0,spawnT:simT+30,aiT:0,npcT:0,shellT:{heavy:simT+19,cannon:simT+26,art:simT+22},oob:0,ambT:0,killed:0,npcLost:0,blown:{},labels0:{}};
  for(const k in DD_LABELS){dd.labels0[k]=WEAPON[k].label;WEAPON[k].label=DD_LABELS[k];}
  dd.rpg0=SPECIALS.rpg.label;SPECIALS.rpg.label='Bazooka';dd.rpgR=PRPG.range;PRPG.range=900;
  const B=DD_SPOT.boat;
  ['A','B'].forEach(t=>DD_CORE[t].forEach((r,i)=>ddNewMan(t,t+(i+1),r,B.x+DDX,B.y+60)));
  players=units.filter(u=>u.side==='P'&&!u.npc);
  spawnDDay();
  contact=true;clearTeams();teamSeen.A=true;teamSeen.B=true;teamSeen.N=true;
  mission.t0=simT;sel=[];cardGroup=[];
  VB={x0:DDX,z0:-720,x1:DDX+DDW,z1:1700};   // (z1 out at sea for the ride in; ddAshore brings it back)
  FIT.w=DDW+40;FIT.h=1560;fitDist();
  MAXZ=11;camShift=0;zoom=DD_CAM.zoom;yaw=0;tilt=ddTilt(DD_CAM.zoom);camT={x:B.x+DDX,z:640};clampCam();updateCamera();
  document.body.classList.add('dd');ddSky(0);DD.dayShown=0;
  // the boats: the squads' own, and the first wave of the others either side
  // (since Version 132 a longer ride under fire, seven boats abreast, one of them lost on the way: Bryan, "There should be multiple boats landing")
  ddBoat(B.x,players,true,{y0:1620,T:17,pw:1.4});ddBoat(548,ddCrew(6),false,{y0:1430,T:15,pw:1.4,doom:9.4});ddBoat(436,ddCrew(7),false,{y0:1500,T:16,pw:1.4});
  ddBoat(300,ddCrew(7),false,{y0:1420,T:15.2,pw:1.4});ddBoat(690,ddCrew(7),false,{y0:1460,T:15.6,pw:1.4});ddBoat(160,ddCrew(6),false,{y0:1560,T:17.5,pw:1.4});ddBoat(850,ddCrew(6),false,{y0:1520,T:16.8,pw:1.4});
  for(const o of objs)if(o.kind==='ddwreck')tankFires.push({x:o.x+o.w/2,y:o.y+o.h/2,r:10,t0:simT,puffs:[],emit:0});
  updateObjUI();setStatus();buildCards();hud();
}
function leaveDDayNow(){
  if(MAPID!=='dd')return;const out=STASH.out;
  for(const k in dd.labels0)WEAPON[k].label=dd.labels0[k];SPECIALS.rpg.label=dd.rpg0;PRPG.range=dd.rpgR;
  for(const u of units)if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  document.body.classList.remove('dd');{const q=$('#sq');if(q)q.hidden=true;}{const o=$('#oob');if(o)o.hidden=true;const c=$('#ddChip');if(c)c.hidden=true;}
  groundH=null;MAXZ=6;camShift=0;zoom=Math.min(zoom,6);useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';LEVEL=3;
  units=[...out.units];players=[];enemies=units.filter(u=>u.side==='E');civs=[];
  VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();dd=null;disposeDD();
}
function startDDay(){
  reset();
  $('#intro').hidden=true;$('#end').hidden=true;$('#aar').hidden=true;
  enterDDay();state='play';endAt=0;
  banner('Thirty seconds to the beach!',3000);hud();
}
function bindDDay(){const b=$('#ddBtn');if(b)b.addEventListener('click',startDDay);ddBarBind();}
const ddBusy=()=>!!dd&&!dd.land.done;
/* ---------- the camera ----------
   Since Version 132 it stays where the player puts it (Bryan: "Maybe the camera shouldnt move unless dragged by the user. But
   i do want the camera to switch to the selected squad still"): it goes to a squad when that squad is picked (ddSelected) and
   to the squad being played as they come off the boat, and otherwise never moves by itself. On the ride in it's inside the
   boat, just behind the last man's head, looking over the others at the beach (Bryan: "it should be behind the last units
   head inside"); as they land it swings up and out to the usual view. */
function ddTilt(z){const z0=zoom;zoom=z;const t=Math.max(0,basePitch()-DD_CAM.pitch);zoom=z0;return t;}
function ddCam(rdt){
  if(!dd||state!=='play')return;rdt=rdt>0?Math.min(rdt,.1):0;
  const C=dd.cam||(dd.cam={k:1,p:null,q:null});
  if(!dd.land.done){const b=dd.boats.find(q=>q.own);if(!b)return;
    // (a drag turns the view from this fixed spot: Bryan, "The camera can move around from this fixed spot so the player can look around")
    const K=dd.land.look||(dd.land.look={y:0,p:0}),ax=b.x,az=b.y-40;
    if(K.set){K.y=clamp(K.y+(camT.x-K.ax)*.007,-1.15,1.15);K.p=clamp(K.p-(camT.z-K.az)*.007,-.3,.4);}
    camT.x=ax;camT.z=az;K.ax=ax;K.az=az;K.set=1;   // (also where the sound is heard from)
    const nar=camera.aspect<1?1:0,by=b.m.position.y,t=simT,hit=dd.land.jolt||0,py=-.13+K.p+Math.sin(t*1.1)*.006,yw=K.y+Math.sin(t*.5)*.015;
    if(camShiftOn){camera.clearViewOffset();camShiftOn=false;}
    camera.position.set(b.x+Math.sin(t*1.3)*.5+(Math.random()-.5)*hit,by+47+nar*4+Math.sin(t*1.7+1)*.7+(Math.random()-.5)*hit,b.y+68+nar*8);
    camera.lookAt(camera.position.x+Math.sin(yw)*Math.cos(py)*300,camera.position.y+Math.sin(py)*300,camera.position.z-Math.cos(yw)*Math.cos(py)*300);camera.rotateZ(Math.sin(t*1.3)*.02);camera.updateMatrixWorld();
    dd.land.jolt=Math.max(0,hit-rdt*3);C.k=0;C.p=camera.position.clone();C.q=camera.quaternion.clone();return;}
  if(C.k<1&&C.p){C.k=Math.min(1,C.k+rdt/1.7);const e=C.k*C.k*(3-2*C.k),to=camera.quaternion.clone();   // off the boat: up and out to the usual view
    camera.position.lerpVectors(C.p,camera.position,e);camera.quaternion.copy(C.q).slerp(to,e);camera.updateMatrixWorld();camShift=DD_CAM.shift*e;}
}
/* ---------- the boats ---------- */
function ddCrew(n){const L=[];for(let i=0;i<n;i++)L.push(ddNpc(DDX+500,900));return L;}
function ddBoat(dx,men,own,o){
  o=o||{};const y0=o.y0||1120;
  const m=ddBoatMesh(DD.scene),b={m,x:dx+DDX,y0,y:y0,y1:806,t:0,T:o.T||(own?7.5:6+Math.random()*3),pw:o.pw||2.2,men,own:!!own,st:'in',out:0,doom:o.doom||0};
  men.forEach((u,i)=>{u.inBoat=true;u.afloat=true;u.boat=b;u.seat2=[(i%2?7:-7)+(Math.random()-.5)*3,-30+Math.floor(i/2)*13];u.path=[];});
  dd.boats.push(b);ddBoatPose(b);return b;
}
function ddBoatPose(b){
  b.m.position.set(b.x,1.2+Math.sin(simT*1.7+b.x)*.5,b.y);b.m.rotation.z=Math.sin(simT*1.3+b.x)*.03;b.m.rotation.x=Math.sin(simT*1.1+b.x*.3)*.02;
  for(const u of b.men)if(u.inBoat){u.x=b.x+u.seat2[0];u.y=b.y+u.seat2[1];u.elev=4.4+b.m.position.y;u.ang=-Math.PI/2;u.path=[];u.cool=Math.max(u.cool,.8);}
}
// a boat hit on the way in: gone, with everyone in it (one of the first wave, beside the squads' own: Bryan, "Maybe someone dies or a boat gets blown up")
function ddBoatHit(b){
  b.st='sunk';b.t=0;booms.push({x:b.x,y:b.y-10,t:0,size:1.6},{x:b.x+8,y:b.y+22,t:-.18,size:1.1});shake(.9);ddSplash(b.x,b.y,2.6);ddSplash(b.x-14,b.y+20,1.6);ddGib(b.x,b.y,10,0x5d6b58,1.4);dd.land.jolt=1.2;
  for(const u of b.men){u.dead=true;u.inBoat=false;dd.npcLost++;if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);const i=units.indexOf(u);if(i>=0)units.splice(i,1);}
  dd.npcs=dd.npcs.filter(u=>units.includes(u));b.men=[];
  b.m.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.color.setHex(0x1f2120);}});
  b.fire={x:b.x,y:b.y,r:12,t0:simT,puffs:[],emit:0};tankFires.push(b.fire);
  if(typeof sfxScream==='function')sfxScream({x:b.x,y:b.y,id:'N0',side:'P'},.9);
  banner('The boat beside you is gone. Heads down!',2800);
}
// where each of the squads' men runs to as he comes off the ramp: cover on the sand, picked for the squad together
function ddLandPlan(b){
  const ex=b.x,ey=b.y-58;
  for(const t of['A','B']){const m=b.men.filter(u=>u.team===t&&!u.dead&&!u.npc);if(!m.length)continue;
    const sv=m.map(u=>[u.x,u.y]);for(const u of m){u.x=ex+(Math.random()-.5)*8;u.y=ey;u.inBoat=false;}
    let as=[];try{as=makeAssign(m,DDX+(t==='A'?432:566),626);}catch(e){}
    for(const a of as)a.u.landDest=a.path&&a.path.length?a.path[a.path.length-1]:null;
    m.forEach((u,i)=>{u.x=sv[i][0];u.y=sv[i][1];u.inBoat=true;});}
}
function ddBoatsTick(dt){
  for(const b of dd.boats){
    b.t+=dt;
    if(b.st==='in'){const k=Math.min(1,b.t/b.T),e=1-Math.pow(1-k,b.pw);b.y=b.y0+(b.y1-b.y0)*e;ddBoatPose(b);
      if(b.doom&&b.t>=b.doom){ddBoatHit(b);continue;}
      if(k>=1){b.st='ramp';b.t=0;if(typeof sfxClang==='function')sfxClang(b.x,b.y-50);if(b.own){banner('Ramp\'s down! Go! Go! Get to cover!',3200);dd.land.jolt=.6;}}}
    else if(b.st==='ramp'){ddBoatPose(b);b.m.userData.ramp.rotation.x=-Math.min(1,b.t/.7)*1.75;if(b.t>.8){b.st='out';b.t=0;b.out=0;if(b.own)ddLandPlan(b);}}
    else if(b.st==='out'){ddBoatPose(b);const gap=b.own?.2:.24;
      while(b.out<b.men.length&&b.t>b.out*gap){const u=b.men[b.out++];if(u.dead)continue;
        Object.assign(u,{inBoat:false,afloat:false,boat:null,elev:0,x:b.x+(b.out%2?5:-5),y:b.y-58,lastOrder:simT});
        // straight up the sand to cover, shooting as he goes: nobody stands at the water's edge (Bryan: "They all pile out of the boat and wait, they should all be running to cover and engaging")
        let p=null;
        if(u.npc){u.hopT=0;u.path=[];ddNpcThink(u,ddLine());p=u.path.length?u.path:null;}
        else if(u.landDest&&!u.joining)p=findPath(u.x,u.y,u.landDest.x,u.landDest.y);
        if(!p||!p.length){const tx=clamp(u.x+(b.out-b.men.length/2)*16,DDX+30,DDX+DDW-30),ty=690-Math.random()*40;p=findPath(u.x,u.y,tx,ty,FOOT)||[{x:tx,y:ty}];if(u.npc)u.hopT=simT+.8+Math.random();}
        u.path=p;u.gaitForce=null;}
      if(b.out>=b.men.length){b.st='wait';b.t=0;if(b.own){dd.land.done=true;ddAshore();}}}
    else if(b.st==='wait'){if(b.t>5){b.st='back';b.t=0;}}
    else if(b.st==='back'){b.y+=dt*34;b.m.position.z=b.y;b.m.userData.ramp.rotation.x=-Math.max(0,1-b.t/1.2)*1.75;if(b.y>1160){if(b.m.parent)b.m.parent.remove(b.m);b.st='gone';}}
    else if(b.st==='sunk'){b.m.position.y-=dt*1.5;b.m.rotation.z+=dt*.06;b.m.rotation.x-=dt*.035;if(b.t>10){if(b.m.parent)b.m.parent.remove(b.m);const i=tankFires.indexOf(b.fire);if(i>=0)tankFires.splice(i,1);b.st='gone';}}
  }
  dd.boats=dd.boats.filter(b=>b.st!=='gone');
}
// the ride in (Bryan: "It should feel like they are under heavy fire approaching the beach"): machine gun fire from the bunkers into
// the water round the boats and onto their hulls, shells in the sea, the noise of it. None of it hurts the squads' own boat
function ddRideFx(dt){
  const L=dd.land,b=dd.boats.find(q=>q.own);if(!b)return;L.t+=dt;const S=DD_SPOT,far=b.st==='in'?1-Math.min(1,b.t/b.T):0;
  if(!L.said&&L.t>6.5){L.said=1;banner('Keep your heads down!',2200);}
  if((L.fxT=(L.fxT||0)-dt)<=0){L.fxT=.05+Math.random()*(.1+far*.22);
    const src=[S.leftMG,S.pill,S.nests[0],S.hillMG][(Math.random()*4)|0],bs=dd.boats.filter(q=>q.st!=='sunk'),tb=Math.random()<.45?b:bs[(Math.random()*bs.length)|0];
    const hit=Math.random()<.22,tx=tb.x+(Math.random()-.5)*(hit?24:170),ty=hit?tb.y-52-Math.random()*8:tb.y-Math.random()*260+70;
    tracers.push({x1:src.x+DDX,y1:src.y,x2:tx,y2:ty,t:0,col:'255,231,163'});
    if(hit){sparks.push({x:tx,y:ty,t:0});if(tb===b){L.jolt=Math.max(L.jolt||0,.25);if(typeof playSample==='function')playSample('hit_metal',tx,ty,.9,.8+Math.random()*.5);}}
    else if(ty>706)ddSplash(tx,ty,.35+Math.random()*.25);
    if(Math.random()<.5&&typeof sfxShot==='function')sfxShot({x:b.x+(src.x+DDX-b.x)*.3,y:b.y-170-far*120,side:'E',gunner:true,weapon:'rifle',thudT:0});
    if(Math.random()<.16&&typeof playSample==='function')playSample('hit_ground',b.x+(Math.random()-.5)*60,b.y-20,.7,.8+Math.random()*.5);
  }
  if((L.shT=(L.shT==null?1.2:L.shT)-dt)<=0){L.shT=.9+Math.random()*1.5;
    const bs=dd.boats.filter(q=>q.st==='in'),tb=bs.length?bs[(Math.random()*bs.length)|0]:b,x=tb.x+(Math.random()<.5?-1:1)*(30+Math.random()*90),y=Math.max(730,tb.y-30-Math.random()*220);
    ddSplash(x,y,1.5+Math.random());if(typeof sfxBoom==='function')sfxBoom(x,y,.75);const d=hyp(x-b.x,y-b.y);if(d<170){shake(.4*(1-d/200));L.jolt=Math.max(L.jolt||0,.7*(1-d/200));}}
}
function ddBoatsFrame(){}   // (the boats move on game time: ddBoatsTick)
function ddAshore(){
  select(players.filter(p=>p.team==='A'&&alive(p)));dd.active='A';
  dd.graceT=simT+8;for(const p of players){p.dmgIn0=p.dmgIn;p.dmgIn=(p.dmgIn||1)*.55;}   // (the run up the sand from the ramp: hurt, not wiped out, before the player has had a say)
  const m=players.filter(p=>p.team==='A'&&p.landDest),cx=m.length?m.reduce((a,u)=>a+u.landDest.x,0)/m.length:camT.x,cy=m.length?m.reduce((a,u)=>a+u.landDest.y,0)/m.length:640;
  VB.z1=820;if(typeof glide!=='undefined'&&glide)glide.vx=glide.vz=0;zoom=DD_CAM.zoom;yaw=0;tilt=ddTilt(DD_CAM.zoom);camT={x:cx,z:cy-DD_CAM.look+40};clampCam();updateCamera();hud();   // (ddCam swings the view out of the boat to here)
}
/* ---------- who shoots whom (combat.js's pickTarget) ---------- */
function ddPick(u){
  if(u.inBoat)return null;
  const foes=u.side==='P'?enemies:dd.allies;
  let best=null,bs=-1;const R=u.side==='E'?wRange(u)*(u.gunner?1.45:1.12):wRange(u);
  for(const f of foes){
    if(u.side==='P'?beaten(f):(!ddAlly(f)||(f.inBoat&&!(f.npc&&f.boat&&f.boat.st!=='in'))))continue;
    if(hyp(f.x-u.x,f.y-u.y)>R)continue;
    if(u.onGun){let da=Math.atan2(f.y-u.onGun.y,f.x-u.onGun.x)-u.onGun.ang;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)>u.onGun.arc)continue;}
    const L=fireLine(u,f);if(!L)continue;
    let c=hitChance(u,f,L)+Math.random()*.12;if(u.focus===f)c+=1;if(u.side==='E'&&f.npc)c-=.03;
    if(c>bs){bs=c;best={t:f,L};}
  }
  return best;
}
/* ---------- hits (combat.js's damage): the other troops; a man killed outright; the gore ---------- */
function ddGore(t,big){
  for(let k=0;k<(big?5:2);k++)paintDecal({k:'body',x:t.x+(Math.random()-.5)*(big?44:14),y:t.y+(Math.random()-.5)*(big?44:14),a:0,r:Math.random()});
  if(big){t.gone=true;ddGib(t.x,t.y,8,t.side==='E'?0x5b6359:0x5d6b58,1.2);}else ddGib(t.x,t.y,3,null,.5);
}
function ddDamage(t,dmg,src){
  if(t.side==='E'){if(dmg>=55&&dmg*(t.dmgIn||1)>=t.hp&&!t.veh)ddGore(t,true);else if(dmg*(t.dmgIn||1)>=t.hp&&Math.random()<.3)ddGore(t,false);return false;}
  if(t.npc){
    t.hp-=dmg*1.15;t.hitFlash=.25;
    if(t.hp<=0){t.hp=0;t.dead=true;t.path=[];t.deadT=simT;dd.npcLost++;
      if(typeof sfxBodyFall==='function'){sfxBodyFall(t.x,t.y);const r=Math.random();if(r<.4)sfxScream(t,.8);else if(r<.7)sfxGrunt(t,true);}
      if(dmg>=55)ddGore(t,true);else{paintDecal({k:'body',x:t.x,y:t.y,a:t.ang,r:Math.random()});if(Math.random()<.25)ddGore(t,false);}}
    else if(Math.random()<.3&&typeof sfxPain==='function')sfxPain(t,t.hp<40);
    return true;
  }
  if(t.inBoat)return true;   // (the ride in costs the squads nobody: Bryan)
  const dead_on=dmg>=70,head=!dead_on&&!dd.wireHit&&simT>(dd.graceT||0)&&dmg>3&&dmg<45&&Math.random()<.04;
  if(dead_on||head){ddKill(t,head?'Shot through the head':'Blown apart',dead_on);return true;}
  return false;
}
function ddKill(t,how,big){
  if(t.dead)return;if(t.carry)putDown(t);
  Object.assign(t,{hp:0,dead:true,downed:false,critical:false,path:[],supT:null});
  if(typeof sfxScream==='function'){sfxScream(t);sfxBodyFall(t.x,t.y);}
  ddGore(t,big);hitCue(.85);callout(t,'KIA',C.bad);banner(`${t.name} is dead. ${how}.`,2600);
  sel=sel.filter(x=>x!==t);preview=null;
}
/* ---------- blasts (mission.js's tankBlast): the gates, the wire, the guns, the barracks ---------- */
function ddBlast(x,y,by){
  if(!dd||(by&&by.side==='E'))return;
  for(const o of objs.slice()){
    if(o.hp==null||o.gone)continue;const d=rectDist(x,y,o);if(d>46)continue;
    o.hp-=110*(1-d/52);
    if(o.hp<=0)ddWreck(o,by);else if(o.tag==='barracks')banner(`The barracks is burning. Hit it again (${Math.max(1,Math.round(o.hp/380*100))}% left).`,2200);
  }
}
function ddWreck(o,by){
  o.gone=true;dd.blown[o.tag]=true;const cx=o.x+o.w/2,cy=o.y+o.h/2;
  for(let k=0;k<(o.tag==='barracks'?6:2);k++)booms.push({x:cx+(Math.random()-.5)*o.w,y:cy+(Math.random()-.5)*o.h,t:-k*.12,size:o.tag==='barracks'?1.4:1});
  paintDecal({k:'scorch',x:cx,y:cy,r:Math.random()});shake(o.tag==='barracks'?1:.5);if(typeof sfxBoom==='function')sfxBoom(cx,cy,o.tag==='barracks'?1.4:1);
  if(o.tag==='barracks'||o.kind==='ddgun'){for(const m of o.meshes||[]){if(m.material&&m.material.color){m.material=m.material.clone();m.material.color.setHex(0x1b1a18);}m.rotation.z+=(Math.random()-.5)*.25;}if(o.barrel)o.barrel.rotation.x=Math.PI/2+.5;
    tankFires.push({x:cx,y:cy,r:o.w/3,t0:simT,puffs:[],emit:0});}
  else{for(const m of o.meshes||[])m.visible=false;removeObstacle(o,[]);dEpoch++;}   // a gate or the wire: gone, the way's open
  if(o.tag==='barracks'){dd.won=true;bigText('Barracks destroyed','complete');banner('The barracks is gone. The base is yours.',4000);endAt=performance.now()+4200;}
  else banner({wire:'The wire is blown open there.',heavy:'The heavy gun is knocked out.',cannon:'The cannon is knocked out.',art:'The artillery on the hill is knocked out.'}[o.tag]||'',2600);
  updateObjUI();
}
/* ---------- picking a squad (input.js's select): one is played, the other runs itself ---------- */
function ddSelected(){
  if(!dd||!sel.length)return;
  const t=sel[0].team;if(sel.some(u=>u.team!==t)){sel=sel.filter(u=>u.team===t);cardGroup=players.filter(p=>p.team===t);}
  if(t===dd.active)return;
  dd.active=t;dd.idle[t]=0;
  const m=players.filter(p=>p.team===t&&alive(p));if(!m.length)return;
  const cx=m.reduce((a,u)=>a+u.x,0)/m.length,cy=m.reduce((a,u)=>a+u.y,0)/m.length;
  if(dd.land.done)camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:cx-Math.sin(yaw)*DD_CAM.look,z:cy-Math.cos(yaw)*DD_CAM.look,zoom},t:0,dur:.7};   // (the one time the camera moves by itself: to the squad just picked)
  banner(`${teamName(t)} is yours. ${teamName(t==='A'?'B':'A')} looks after itself.`,2200);
  for(const u of m){u.gaitForce=null;}
}
/* ---------- the squad that runs itself ---------- */
function ddSquadAI(t){
  const m=players.filter(p=>p.team===t&&alive(p)&&!p.inBoat);if(!m.length)return;
  const idle=dd.idle[t],cx=m.reduce((a,u)=>a+u.x,0)/m.length,cy=m.reduce((a,u)=>a+u.y,0)/m.length;
  // their own wounded first (always)
  for(const d of players.filter(p=>p.team===t&&p.downed&&!p.dead&&!p.carriedBy)){
    const free=m.filter(u=>!u.path.length&&!u.medGo&&!pinnedNow(u)).sort((a,b)=>hyp(a.x-d.x,a.y-d.y)-hyp(b.x-d.x,b.y-d.y));if(!free.length)break;
    if(d.critical){const k=free.find(hasKit);if(k&&!m.some(u=>u.medGo&&u.medGo.t===d)){orderMedkit(k,d);}continue;}
    if(helperOf(d))continue;const h=free[0];if(hyp(h.x-d.x,h.y-d.y)>22){const p=goBeside(h,d);if(p&&p.length){h.path=p;h.gaitForce=null;}}
  }
  const foes=enemies.filter(e=>!beaten(e)),near=foes.filter(e=>hyp(e.x-cx,e.y-cy)<470&&e.y<cy+60&&e.tag!=='mortar');
  // now and then, more the longer they're left alone: a rocket at a gun, a grenade, smoke when they're pinned
  if(Math.random()<.02+.14*Math.min(1,idle/70)){
    const bold=u=>Math.random()<(u.bold||1)*.7;
    const dm=m.find(u=>u.spec==='rpg'&&u.specN>0&&!u.path.length&&!pinnedNow(u)&&bold(u));
    const gun=dm&&foes.filter(e=>e.gunner||e.tag==='heavy'||e.tag==='cannon'||e.tag==='art'||e.tag==='mortar').sort((a,b)=>hyp(a.x-dm.x,a.y-dm.y)-hyp(b.x-dm.x,b.y-dm.y))[0];
    if(dm&&gun&&hyp(gun.x-dm.x,gun.y-dm.y)<PRPG.range+60&&hyp(gun.x-dm.x,gun.y-dm.y)>PRPG.min+10){orderThrow(dm,gun.x,gun.y,'rpg');}
    else{const g=m.find(u=>(u.grenade||0)>0&&!u.path.length&&!pinnedNow(u)&&bold(u)),tg=g&&foes.filter(e=>hyp(e.x-g.x,e.y-g.y)<nadeRange(g)+40&&!players.some(p=>alive(p)&&hyp(p.x-e.x,p.y-e.y)<70)).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];
      if(g&&tg)orderThrow(g,tg.x,tg.y,'nade');
      else{const s=m.find(u=>u.spec==='smoke'&&u.specN>0&&!u.path.length),mg=foes.filter(e=>e.gunner).sort((a,b)=>hyp(a.x-cx,a.y-cy)-hyp(b.x-cx,b.y-cy))[0];
        if(s&&mg&&m.reduce((a,u)=>a+u.sup,0)/m.length>.45){const d=hyp(mg.x-cx,mg.y-cy)||1;orderThrow(s,cx+(mg.x-cx)/d*90,cy+(mg.y-cy)/d*90,'smoke');}}}
  }
  // forward, slowly, only once nobody's left in front of them (and not far past the squad being played, unless long ignored)
  if(near.length||simT<dd.hop[t]||m.some(u=>u.path.length))return;
  const lead=players.filter(p=>p.team!==t&&alive(p)),leadY=lead.length?Math.min(...lead.map(p=>p.y)):cy;
  let i=dd.wp[t];while(i<DD_ROUTE.length-1&&DD_ROUTE[i][1]>cy-30)i++;
  const W=DD_ROUTE[i];if(!W||W[1]>cy-20)return;
  if(lead.length&&W[1]<leadY-170)return;
  const as=makeAssign(m,W[0]+DDX+(t==='B'?44:-10),W[1]);if(!as.length)return;
  for(const a of as)Object.assign(a.u,{path:a.path,gaitForce:null,exposeT:0});
  dd.wp[t]=i;dd.hop[t]=simT+16+Math.random()*8;
}
/* ---------- the other troops ---------- */
function ddLine(){   // how far up they may go: behind the squads, and no further than what's been opened
  let k=0;const dead=tag=>!enemies.some(e=>e.tag===tag&&!beaten(e));
  if(dd.front<330&&(dead('pill')||dd.blown.wire||dd.front<250))k=1;
  if(k===1&&dead('nest')&&dd.front<140)k=2;
  if(k===2&&dd.front<-150)k=3;
  if(k===3&&dd.front<-380&&dead('heavy'))k=4;
  return Math.max(DD_LINES[k],dd.front+50);
}
function ddNpcThink(u,line){
  if(u.dead||u.inBoat||u.path.length||simT<u.hopT)return;
  if(u.y<=line+24){u.hopT=simT+3;return;}
  if(u.eng&&!u.dug&&u.y>360&&u.y<690&&u.sup>.3&&(dd.npcForts||0)<7){   // an engineer among them, under fire on the sand: a barricade, and the others use it
    if(!u.bT){u.bT=simT+2.4;u.hopT=simT+2.6;callout(u,'Digging in',C.warn);return;}
    if(simT>=u.bT){u.dug=true;const p=fortPlan('barricade',u.x,u.y-14);if(!fortBlocked(p.r)){makeFort('barricade',p.r,p.n);dd.npcForts=(dd.npcForts||0)+1;}u.hopT=simT+6+Math.random()*6;return;}
    return;}
  if(u.sup>.8){u.hopT=simT+1.5;return;}
  let best=null,bs=-1e9;const th=enemies.filter(e=>!beaten(e)&&hyp(e.x-u.x,e.y-u.y)<520).map(e=>({x:e.x,y:e.y}));
  for(const c of coverPts){
    if(c.y<line||c.y>u.y-24||c.y<u.y-190||Math.abs(c.x-u.lane)>150)continue;
    if(dd.allies.some(o=>o!==u&&hyp(destOf(o).x-c.x,destOf(o).y-c.y)<14))continue;
    const s=th.length?protStats(c,th).prot/th.length:0,sc=s*3-(u.y-c.y>150?.5:0)-Math.abs(c.x-u.lane)/160+Math.random()*.6;
    if(sc>bs){bs=sc;best=c;}
  }
  const tgt=best||{x:clamp(u.lane+(Math.random()-.5)*60,DDX+30,DDX+DDW-30),y:Math.max(line+10,u.y-90-Math.random()*60)};
  const p=findPath(u.x,u.y,tgt.x,tgt.y);
  if(p&&p.length){u.path=p;u.hopT=simT+2.5+Math.random()*5;}else u.hopT=simT+2;
}
function ddWaves(){
  const live=dd.npcs.filter(u=>!u.dead).length;
  if(simT>dd.spawnT&&live<24&&!dd.won){dd.spawnT=simT+9+Math.random()*6;
    const lanes=[90,200,300,400,600,700,800,910].filter(x=>!dd.boats.some(b=>Math.abs(b.x-DDX-x)<70));for(let k=0;k<2&&lanes.length;k++){const i=(Math.random()*lanes.length)|0,x=lanes.splice(i,1)[0];ddBoat(x+(Math.random()-.5)*40,ddCrew(6+((Math.random()*3)|0)));}}
  // replacements due: each lands in a boat of his own with a few others, and makes for his squad
  for(const q of dd.queue.slice()){if(simT<q.at)continue;dd.queue.splice(dd.queue.indexOf(q),1);
    const u=ddNewMan(q.team,q.id,ddPickRole(q.team),DDX+500,900);u.joining=true;players.push(u);players.sort((a,b)=>a.id<b.id?-1:1);
    const mates=players.filter(p=>p.team===q.team&&p!==u&&!p.dead),lx=clamp((mates.length?mates.reduce((a,p)=>a+p.x,0)/mates.length:DDX+500)-DDX,90,910);
    ddBoat(lx+(Math.random()-.5)*60,[u,...ddCrew(3)]);buildCards();
    banner(`${u.name} (${DD_ROLES[u.ddRole].n}, ${u.trait.toLowerCase()}) is coming in for ${teamName(q.team)}.`,3200);}
}
function ddJoin(u){   // a replacement on his way up to his squad
  if(u.inBoat||!alive(u))return;
  const mates=players.filter(p=>p.team===u.team&&p!==u&&alive(p)&&!p.joining);
  if(!mates.length||mates.some(p=>hyp(p.x-u.x,p.y-u.y)<80)||simT-u.lastOrder<.5&&!u.path.length&&u.y<690&&u.ordered){u.joining=false;callout(u,'With you',C.good);return;}
  if(simT<(u.joinT||0))return;u.joinT=simT+2;
  const tg=mates.sort((a,b)=>hyp(a.x-u.x,a.y-u.y)-hyp(b.x-u.x,b.y-u.y))[0],s=openSpot(tg.x,tg.y+24,players.filter(p=>p!==u&&!p.dead).map(destOf))||tg,p=findPath(u.x,u.y,s.x,s.y);
  if(p)u.path=p;
}
/* ---------- the shelling: mortars, the heavy gun, the cannon (while they're crewed) ---------- */
function ddShell(by,x,y,R,D,dur){nades.push({x0:by.x,y0:by.y,x1:x,y1:y,t:0,dur,by,enemy:true,R,D});}
function ddShelling(){
  const al=dd.allies.filter(u=>!u.inBoat);if(!al.length)return;
  const pickAt=f=>{const c=al.filter(f);const u=(c.length?c:al)[(Math.random()*(c.length?c.length:al.length))|0];return{x:u.x+(Math.random()-.5)*90,y:u.y+(Math.random()-.5)*90};};
  for(const e of enemies){if(e.tag!=='mortar'||beaten(e)||simT<e.mortarT)continue;e.mortarT=simT+11+Math.random()*8;const p=pickAt(u=>u.y<360);ddShell(e,p.x,p.y,50,78,2.6);e.throwT=simT;}
  for(const tag of['heavy','cannon','art']){
    if(simT<dd.shellT[tag]||dd.blown[tag])continue;const crew=enemies.find(e=>e.tag===tag&&!beaten(e));if(!crew){dd.shellT[tag]=simT+5;continue;}
    dd.shellT[tag]=simT+(tag==='heavy'?10:tag==='art'?13:11)+Math.random()*5;
    const sea=tag==='heavy'&&Math.random()<.45,p=sea?{x:DDX+80+Math.random()*840,y:700+Math.random()*150}:pickAt(u=>tag==='cannon'?u.y<300:u.y>300);
    ddShell(crew,p.x,p.y,tag==='heavy'?64:54,tag==='heavy'?100:tag==='art'?80:84,2.8);
    const g=objs.find(o=>o.tag===tag);if(g){flashes.push({x:g.x+g.w/2,y:g.y+g.h+40,t:0});if(typeof sfxCannon==='function')sfxCannon(g.x,g.y);}
  }
}
function ddBarracks(){
  if(dd.blown.barracks||simT<(dd.barrT||0))return;dd.barrT=simT+11+Math.random()*5;
  if(enemies.filter(e=>e.tag==='reinf'&&!beaten(e)).length>=6)return;
  const d=DD_SPOT.door,e=ddFoe('reinf',d.x+(Math.random()-.5)*30,d.y,{nade:Math.random()<.3?1:0});enemies.push(e);
  // down towards the fight: a spot a little up the way from the foremost of ours
  const i=DD_ROUTE.findIndex(w=>w[1]<dd.front-150),W=DD_ROUTE[Math.max(0,i<0?DD_ROUTE.length-2:i)],tx=W[0]+DDX+(Math.random()-.5)*80,ty=W[1]+(Math.random()-.5)*40;
  const s=openSpot(tx,ty,enemies.filter(o=>o!==e&&!o.dead).map(destOf)),p=s&&findPath(e.x,e.y,s.x,s.y,FOOT);
  if(p){e.path=p;e.zone={x0:s.x-140,x1:s.x+140,y0:s.y-120,y1:s.y+120};}else e.zone={x0:DDX+200,x1:DDX+1000,y0:-700,y1:-440};
}
/* ---------- every tick (combat.js's update) ---------- */
function ddTick(dt){
  if(MAPID!=='dd'||!dd)return;
  contact=true;teamSeen.A=true;teamSeen.B=true;teamSeen.N=true;
  dd.allies=units.filter(ddAlly);
  ddBoatsTick(dt);stationTick(dt);
  if(!dd.land.done)ddRideFx(dt);
  else if(dd.graceT&&simT>dd.graceT){dd.graceT=0;for(const p of players)if(p.dmgIn0!=null){p.dmgIn=p.dmgIn0;p.dmgIn0=null;}}   // (the other boats' men fight on from the moment their ramps drop: nothing waits for the squads)
  // the dead: out of the squad (the body stays), a replacement on the way while they last
  for(const p of players.slice()){
    if(p.critical&&p.crit>45)p.crit=45;   // (no long wait on the beach)
    if(!p.dead)continue;
    players.splice(players.indexOf(p),1);dd.lost++;p.npc=true;p.corpse=true;p.deadT=simT;const id=p.id;p.id='X'+dd.lost;
    sel=sel.filter(x=>x!==p);cardGroup=cardGroup.filter(x=>x!==p);
    if(dd.pool>0){dd.pool--;dd.queue.push({team:p.team,id,at:simT+5+Math.random()*3});}
    buildCards();updateObjUI();
  }
  for(const p of players)if(p.joining)ddJoin(p);
  // how far they've got (the day goes by with it), and the edge of the map
  const up=players.filter(alive);
  if(up.length){dd.front=Math.min(dd.front,...up.filter(p=>!p.joining&&!p.inBoat).map(p=>p.y),dd.front);DD.day=clamp((330-dd.front)/850,0,1);}
  let worst=0;
  for(const p of up){const out=!p.inBoat&&(p.x<DDX-6||p.x>DDX+DDW+6);p.oob=out?(p.oob||0)+dt:0;worst=Math.max(worst,p.oob);
    if(p.oob>=10){booms.push({x:p.x,y:p.y,t:0});if(typeof sfxBoom==='function')sfxBoom(p.x,p.y,1);ddKill(p,'He strayed out of the battle',true);}}
  dd.oob=worst;
  for(const o of dd.wires||(dd.wires=objs.filter(q=>q.kind==='ddwire'))){if(o.gone)continue;
    for(const u of dd.allies)if(!u.inBoat&&u.y>o.y-3&&u.y<o.y+o.h+3&&u.x>o.x-2&&u.x<o.x+o.w+2&&simT>(u.wireT||0)){u.wireT=simT+3;dd.wireHit=true;damage(u,13+Math.random()*6,null);dd.wireHit=false;if(!u.npc&&!u.dead)callout(u,'Cut on the wire',C.bad);}}
  // the squad that isn't being played, the other troops, the boats, the shells, the barracks
  dd.idle[dd.active]=0;const other=dd.active==='A'?'B':'A';
  if((dd.aiT-=dt)<=0){dd.aiT=1;dd.idle[other]+=1;ddSquadAI(other);if(!players.some(p=>p.team===dd.active&&alive(p)))ddSquadAI(dd.active);}
  if((dd.npcT-=dt)<=0){dd.npcT=.5;const line=ddLine();for(const u of dd.npcs)ddNpcThink(u,line);ddWaves();ddShelling();ddBarracks();ddTidy();updateObjUI();}
  // the battle next door: tracers and shell bursts off to both sides, splashes out at sea
  if((dd.ambT-=dt)<=0){dd.ambT=.12+Math.random()*.2;const side=Math.random()<.5?-1:1,x=side<0?-80-Math.random()*700:DDB.x1+80+Math.random()*700,y=-300+Math.random()*900;
    tracers.push({x1:x,y1:y,x2:x+(Math.random()-.5)*200,y2:y+(Math.random()<.5?260:-260)*(.5+Math.random()),t:0,col:Math.random()<.5?'255,231,163':'255,140,100'});
    if(Math.random()<.05){const bx=Math.random()<.5?x:DDX+Math.random()*DDW,by=Math.random()<.5?780+Math.random()*260:y;booms.push({x:bx,y:by,t:0,size:.8+Math.random()*.6});if(typeof sfxBoom==='function')sfxBoom(bx,by,.7);}
    if(Math.random()<.1&&typeof sfxShot==='function')sfxShot({x,y,side:'E',gunner:Math.random()<.5,weapon:'rifle'});}
  // lost: nobody left standing, nobody coming
  if(!endAt&&!dd.won&&!players.some(alive)&&!dd.queue.length&&(dd.pool<=0||!players.length)&&players.every(p=>p.dead||p.revive===0)){dd.over=true;endAt=performance.now()+1800;}
}
function ddTidy(){   // the dead don't pile up for ever: the oldest bodies go
  const dead=units.filter(u=>u.dead&&(u.npc||u.side==='E')&&!u.veh);if(dead.length<=22)return;
  dead.sort((a,b)=>(a.deadT||0)-(b.deadT||0));
  for(const u of dead.slice(0,dead.length-22)){if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);units.splice(units.indexOf(u),1);}
  enemies=enemies.filter(e=>units.includes(e));dd.npcs=dd.npcs.filter(u=>units.includes(u));
}
/* ---------- the squad's bar (Bryan, after Version 128: "The units items are so hard to see... a squad shares an equipment
   menu... The names and unit stats on the top, and at the bottom, their collective tools... The players with that skill/tool
   will only be able to use that skill or tool") ----------
   Along the top the men of the squad being played (role, name, health, what he's doing; a tap picks just him, again the squad).
   Underneath, what they carry between them, added up: grenades, smoke, Bazooka rockets, medic kits, and Revive while there's
   a medic. A tap on a tool hands it to a man who has one (not pinned, not busy, if there's a choice) and aims it the way his
   own card's button does; once it's thrown, fired or called off the squad is selected again. */
const DD_TOOLS=[
  {k:'nade',label:'Grenade',col:'#e8ecef',svg:()=>NADE_SVG,n:u=>u.grenade||0,btn:'nade',mode:'grenade'},
  {k:'smoke',label:'Smoke',col:'#cfd6dc',svg:()=>SPECIALS.smoke.svg,n:u=>u.spec==='smoke'?u.specN||0:0,btn:'spec',mode:'smoke'},
  {k:'rpg',label:'Bazooka',col:'#ffb36b',svg:()=>SPECIALS.rpg.svg,n:u=>u.spec==='rpg'?u.specN||0:0,btn:'spec',mode:'rpg'},
  {k:'build',label:'Barricade',col:'#d9b46a',svg:()=>SPECIALS.build.svg,n:u=>u.spec==='build'?u.specN||0:0,btn:'spec',mode:'build'},
  {k:'wire',label:'Blow wire',col:'#ffcf4a',svg:()=>'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 12h14v1.6H1zM3 4.5l2 3-2 3M8 4.5l2 3-2 3M13 4.5l-2 3 2 3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 1.2 8 3l1-1.8.6 2.2L11.6 3 10.4 4.8 8 5.6 5.6 4.8 4.4 3l2 .4z"/></svg>'},
  {k:'medkit',label:'Medic kit',col:'#ff8a7e',svg:()=>SPECIALS.medkit.svg,n:u=>u.spec==='medkit'?u.specN||0:0,btn:'spec',mode:'medkit'},
  {k:'revive',label:'Revive',col:'#5fe08e',svg:()=>'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14.2 2.2 8.6a3.4 3.4 0 0 1 4.8-4.8l1 1 1-1a3.4 3.4 0 0 1 4.8 4.8z"/><path d="M4 8.4h2.2l1-2 1.6 4 1-2H12" fill="none" stroke="#0b0f13" stroke-width="1.2"/></svg>'}];
const ddSquad=()=>players.filter(p=>p.team===dd.active&&!p.dead);
function ddToolUse(k){
  if(!dd||state!=='play'||ddBusy())return;const m=ddSquad().filter(alive);
  if(k==='revive'){
    const med=m.find(u=>u.ddRole==='medic'),down=players.filter(p=>p.team===dd.active&&p.downed&&!p.dead&&!p.carriedBy);
    if(!med){banner('No medic on his feet in this squad.',1800);return;}
    if(!down.length){banner('Nobody in the squad is down.',1600);return;}
    if(pinnedNow(med)){refusePinned(med);return;}
    const d=down.sort((a,b)=>hyp(a.x-med.x,a.y-med.y)-hyp(b.x-med.x,b.y-med.y))[0];
    if(d.critical){if(hasKit(med))orderMedkit(med,d);else banner(`${d.name} is critical and ${med.name} has no medic kit left.`,2200);}
    else{const p=goBeside(med,d);if(p){med.path=p;med.lastOrder=simT;med.gaitForce=null;callout(med,'Going to him',C.good);}}
    return;
  }
  if(k==='wire'){ddBlowWire(null);return;}
  const T=DD_TOOLS.find(t=>t.k===k),was=dd.toolU&&dd.toolK===k&&mode===T.mode;
  if(was){mode=null;ddToolDone();hud();return;}   // the same tool again: put it away
  const c=m.filter(u=>T.n(u)>0&&u.card);if(!c.length){banner(`No ${T.label.toLowerCase()} left in this squad.`,1600);return;}
  const u=c.sort((a,b)=>(pinnedNow(a)-pinnedNow(b))||((!!a.throwGo)-(!!b.throwGo))||(T.n(b)-T.n(a)))[0];
  mode=null;u.card[T.btn].click();dd.toolU=u;dd.toolK=k;dd.toolAt=performance.now();
}
// the wire: the nearest stretch in front of the squad (or the one tapped) is blown open by whoever has a grenade, or by a rocket
function ddWireNear(x,y,max){let b=null,bd=max;for(const o of dd.wires||[])if(!o.gone){const d=rectDist(x,y,o);if(d<bd){bd=d;b=o;}}return b;}
function ddBlowWire(o){
  const m=ddSquad().filter(alive);if(!m.length)return false;const cx=m.reduce((a,u)=>a+u.x,0)/m.length,cy=m.reduce((a,u)=>a+u.y,0)/m.length;
  o=o||ddWireNear(cx,cy,420);if(!o){banner('No wire near enough.',1600);return false;}
  const tx=o.x+o.w/2,ty=o.y+o.h/2,by=(a,b)=>hyp(a.x-tx,a.y-ty)-hyp(b.x-tx,b.y-ty);
  const g=m.filter(u=>(u.grenade||0)>0&&!pinnedNow(u)).sort(by)[0],r=m.filter(u=>u.spec==='rpg'&&u.specN>0&&!pinnedNow(u)&&hyp(u.x-tx,u.y-ty)>PRPG.min+6).sort(by)[0];
  const u=g&&hyp(g.x-tx,g.y-ty)<nadeRange(g)+NADE_WALK?g:r||g;
  if(!u){banner('Nobody free with a grenade or a rocket. They can climb it: it cuts.',2600);return false;}
  orderThrow(u,tx,ty,u===g?'nade':'rpg');u.lastOrder=simT;banner(`${u.name} blows the wire${u===g?' with a grenade':' with the Bazooka'}.`,2000);return true;
}
function ddTap(wx,wy){if(!dd||!sel.length||ddBusy())return false;const o=ddWireNear(wx,wy,9);if(!o)return false;ddBlowWire(o);hud();return true;}
function ddToolDone(){if(!dd||!dd.toolU)return;dd.toolU=null;const m=ddSquad().filter(alive);if(m.length)select(m);}
function ddBar(){
  const box=$('#sq');if(!box)return;const show=!!dd&&state==='play'&&dd.land.done&&!!sel.length;if(box.hidden===show)box.hidden=!show;if(!show)return;
  if(dd.toolU&&!mode&&performance.now()-dd.toolAt>250)ddToolDone();
  const sq=ddSquad();
  const men=sq.map(u=>{const st=statusText(u),hp=Math.max(0,Math.round(u.hp)),hc=u.downed?'#ff5a48':hp>=70?'#5fe08e':hp>=35?'#ffcf4a':'#ff9a4a',on=sel.length===1&&sel[0]===u,user=dd.toolU===u&&!!mode;
    return`<button type="button" class="sq-man${on?' on':''}${user?' user':''}${u.downed?' down':''}" data-id="${u.id}" style="--tc:${teamCol(u)};--hp:${u.downed?100:hp}%;--hc:${hc}"><b>${u.role}</b><span>${u.name}<em>${st[0]}</em></span><i><u></u></i></button>`;}).join('');
  const up=sq.filter(alive),medic=up.some(u=>u.ddRole==='medic'),downN=sq.filter(u=>u.downed).length;
  const wy=up.length?up.reduce((a,u)=>a+u.y,0)/up.length:0,wireOn=up.length&&wy>330&&wy<720&&!!ddWireNear(up.reduce((a,u)=>a+u.x,0)/up.length,wy,420);
  const tools=DD_TOOLS.map(T=>{if(T.k==='wire'){if(!wireOn)return'';const n=up.reduce((a,u)=>a+(u.grenade||0)+(u.spec==='rpg'?u.specN||0:0),0);return`<button type="button" class="sq-tool" data-k="wire" style="--c:${T.col}" ${n?'':'disabled'}>${T.svg()}<b>${n}</b><span>Blow wire</span><small>nearest man with one</small></button>`;}
    if(T.k==='revive'){if(!medic&&!downN)return'';return`<button type="button" class="sq-tool" data-k="revive" style="--c:${T.col}" ${medic&&downN?'':'disabled'}>${T.svg()}<b>${downN||'·'}</b><span>Revive</span><small>${medic?'the medic goes':'no medic up'}</small></button>`;}
    const own=up.filter(u=>T.n(u)>0),who=own.length===1?own[0].name:own.length?`${own.length} men carry one`:'none left';const n=up.reduce((a,u)=>a+T.n(u),0),has=sq.some(u=>T.k==='nade'||u.spec===T.k);if(!has)return'';const on=dd.toolU&&dd.toolK===T.k&&mode===T.mode;
    return`<button type="button" class="sq-tool${on?' on':''}" data-k="${T.k}" style="--c:${T.col}" ${n?'':'disabled'} aria-label="${T.label}, ${n} left">${T.svg()}<b>${n}</b><span>${T.label}</span><small>${on?'tap the map':who}</small></button>`;}).join('');
  // what's in hand, said plainly above the bar: whose it is, what a tap does, how to put it away (Bryan: "Throwing and using items isn't clear")
  {const a=box.querySelector('.sq-aim'),T=dd.toolU&&mode?DD_TOOLS.find(t=>t.k===dd.toolK&&t.mode===mode):null;
    if(a){if(a.hidden===!!T)a.hidden=!T;if(T){const verb={nade:'Tap where to throw it',smoke:'Tap where the smoke should land',rpg:'Tap the target to fire at',build:'Tap where to put the barricade',medkit:'Tap the man to treat'}[T.k],h=`${T.label} · ${dd.toolU.name}<small>${verb} · tap here to cancel</small>`;if(a.dataset.h!==h){a.dataset.h=h;a.innerHTML=h;a.style.setProperty('--c',T.col);}}}}
  const A=box.querySelector('.sq-men'),B=box.querySelector('.sq-tools');{const gc=`repeat(${Math.max(4,sq.length)},minmax(0,1fr))`;if(A.style.gridTemplateColumns!==gc)A.style.gridTemplateColumns=gc;}if(A.dataset.h!==men){A.dataset.h=men;A.innerHTML=men;}if(B.dataset.h!==tools){B.dataset.h=tools;B.innerHTML=tools;}
}
function ddBarBind(){
  const box=$('#sq');if(!box||box.dataset.bound)return;box.dataset.bound=1;
  box.addEventListener('click',ev=>{const t=ev.target.closest('.sq-tool'),mn=ev.target.closest('.sq-man');
    if(ev.target.closest('.sq-aim')){mode=null;ddToolDone();hud();}
    else if(t&&!t.disabled)ddToolUse(t.dataset.k);
    else if(mn){const u=players.find(p=>p.id===mn.dataset.id);if(u&&u.card){dd.toolU=null;u.card.el.click();}}
    ddBar();});
}
/* ---------- the HUD ---------- */
function ddObjUI(el){
  if(!dd){el.hidden=true;return;}
  const dead=tag=>!enemies.some(e=>e.tag===tag&&!beaten(e)),b=objs.find(o=>o.tag==='barracks');
  const L=[['The left bunker',dead('left')],['The pillbox',dead('pill')],['The upper bunker',dead('nest')],['The hill: bunker and artillery',dead('hill')&&(!!dd.blown.art||dead('art'))],['The heavy gun',!!dd.blown.heavy||dead('heavy')],['The cannon and the back line',(!!dd.blown.cannon||dead('cannon'))&&dead('top')],['The mortars',dead('mortar')],['Destroy the barracks',!!dd.blown.barracks]];
  el.querySelector('b').textContent='D-Day · Baker Red';
  el.querySelector('span').textContent=!dd.land.done?'Thirty seconds to the beach':dd.blown.barracks?'The base is yours':dd.front>330?'Get off the beach: reach the wall':dd.front>-300?'Up the draw: the only way to the top':`Destroy the barracks${b&&b.hp<380?` (${Math.max(1,Math.round(b.hp/380*100))}%)`:''}`;
  const h=L.map(([t,d])=>`<li${d?' class="done"':''}>${t}</li>`).join('');const ol=el.querySelector('ol');if(ol.dataset.h!==h){ol.dataset.h=h;ol.innerHTML=h;}
  el.hidden=state!=='play';
  const c=$('#ddChip');if(c){c.hidden=state!=='play';const t=`${dd.pool}/${DD_POOL}`;if(c.dataset.t!==t){c.dataset.t=t;c.innerHTML=`<svg viewBox="0 0 30 16" aria-hidden="true"><g fill="currentColor"><circle cx="6" cy="5" r="2.6"/><path d="M1.5 15v-2.6a4.5 4.5 0 0 1 9 0V15z"/><circle cx="24" cy="5" r="2.6"/><path d="M19.5 15v-2.6a4.5 4.5 0 0 1 9 0V15z"/><circle cx="15" cy="4.2" r="3.1"/><path d="M9.6 15v-2.4a5.4 5.4 0 0 1 10.8 0V15z" stroke="#0b0f13" stroke-width=".8"/></g></svg><b>${t}</b>`;c.setAttribute('aria-label',`Replacements left: ${dd.pool} of ${DD_POOL}`);c.title='Replacements left';}}
}
function ddHint(){
  if(!dd)return'';
  if(!dd.land.done)return'Coming in under fire. They run for cover by themselves when the ramp drops; then they\'re yours.';
  const other=dd.active==='A'?'Bravo':'Alpha';
  if(dd.front>330)return`The camera stays where you put it; picking a squad takes it there. Shell holes and steel obstacles are cover. Tap the wire (or Blow wire below) and a man with a grenade opens it; climbing it cuts. The Bazooka reaches far but strays at long range. The two bunkers on the path along the cliff cover the beach: smoke blinds it, the Bazooka (the demolition man's card) breaks it. ${other} looks after itself; tap its tab to take it over.`;
  if(dd.front>-300)return'The path along the cliff runs from the first bunker up to the second. The only way to the top is the draw: boulders and sandbags are cover, the two nests on the right cover it.';
  return'The base. The barracks keeps sending men down until it\'s destroyed: grenades and Bazooka rockets, close.';
}
function drawDDay(now){
  if(!dd||!DD)return;ddBar();if(!dd.land.done)return;   // (nothing written over the ride in)
  const lab=(dx,y,h,text,col)=>{toSBack=false;const[sx,sy]=toS(dx+DDX,y,h);if(!toSBack&&sx>-40&&sx<cw+40&&sy>0&&sy<ch)label(text,sx,sy,col,9,700);};
  const dead=tag=>!enemies.some(e=>e.tag===tag&&!beaten(e)),S=DD_SPOT;
  if(!dead('left'))lab(342,262,30,'LEFT BUNKER','#ff8a6a');
  if(!dead('pill'))lab(668,262,30,'PILLBOX','#ff8a6a');
  if(enemies.some(e=>e.tag==='draw'&&e.gunner&&!beaten(e))&&dd.front<330)lab(466,-150,26,'MG NEST','#ff8a6a');
  if(!dead('nest'))lab(906,262,30,'UPPER BUNKER','#ff8a6a');
  if(!dead('hill'))lab(880,130,30,'HILL BUNKER','#ff8a6a');if(!dd.blown.art&&!dead('art'))lab(806,90,30,'ARTILLERY','#ff8a6a');
  if(!dd.blown.heavy&&!dead('heavy'))lab(90,-410,34,'HEAVY GUN','#ff8a6a');
  if(!dd.blown.cannon&&!dead('cannon'))lab(240,-600,30,'CANNON','#ff8a6a');
  if(!dead('mortar'))lab(915,-470,24,'MORTARS','#ff8a6a');
  if(!dd.blown.barracks){const b=objs.find(o=>o.tag==='barracks');lab(820,-690,46,b&&b.hp<380?`BARRACKS · ${Math.max(1,Math.round(b.hp/380*100))}%`:'BARRACKS','#ffcf4a');}
  if(dd.front>300){const m=players.filter(p=>p.team===dd.active&&alive(p)),cx=m.length?m.reduce((a,p)=>a+p.x,0)/m.length-DDX:500;lab(clamp(cx,60,940),340,24,'WIRE · TAP IT TO BLOW IT · CLIMBING CUTS','#ffcf4a');}
  // a man coming up to join: a line to him from his squad's tab colour
  for(const p of players)if(p.joining&&alive(p)&&!p.inBoat){const[sx,sy]=toS(p.x,p.y,26);label('JOINING',sx,sy,teamCol(p),9,700);}
  const o=$('#oob');if(o){const on=dd.oob>0&&state==='play';o.hidden=!on;if(on){o.style.opacity=Math.min(.86,.35+dd.oob*.06).toFixed(2);o.querySelector('b').textContent=`Turn back · ${Math.max(0,Math.ceil(10-dd.oob))}`;}}
}
function ddFinish(){
  const win=!!(dd&&dd.won);state='end';setStatus();$('#status').textContent=win?'Taken':'Lost';
  const t=Math.floor(simT-(dd?dd.t0:0)),mm=Math.floor(t/60),ss=String(t%60).padStart(2,'0'),kills=players.reduce((n,p)=>n+p.stats.kills,0);
  $('#endEyebrow').textContent=win?'Beach taken':'Beach lost';$('#endTitle').textContent=win?'The base is yours':'The squads are gone';
  $('#endText').textContent=win?`The barracks destroyed in ${mm}:${ss}. ${dd.lost} of the squads' men were killed (${DD_POOL-dd.pool} replacements used), and ${dd.npcLost} of the other troops fell on the way up.`
    :`Both squads were lost after ${mm}:${ss}, with no replacements left. ${dd?dd.npcLost:0} of the other troops fell with them. Smoke the machine guns, keep to the holes and the boulders, and let the demolition man open the bunkers.`;
  {const q=$('#sq');if(q)q.hidden=true;}
  $('#againBtn').textContent='Land again';$('#retryBtn').hidden=true;$('#end').hidden=false;
  const o=$('#oob');if(o)o.hidden=true;
}

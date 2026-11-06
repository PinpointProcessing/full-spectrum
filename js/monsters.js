"use strict";
/* The things behind the drawbridge (Bryan, after v71: "the monsters attacking from the HQ. They should pour out and attack the
   units and scientists. It'll be tough but survivable", and "We need to make the monster sounds now. Like roars and screams,
   genuinely scary"). From the feel plan's creatures (docs/feel-plan.md), the heat-hunters: lab-bred pack animals.
   Hounds: pale, long-legged, glowing violet heat pits for eyes. They run you down, crouch and snarl (a violet line on the
   ground shows where they'll go), lunge, knock a man off his feet, pull back, and come again (the feel plan's rules: every
   attack telegraphed on three channels, hit and fade). They go for the scientists too.
   The Brood Mother (the HQ's boss, fortress.js): huge and slow; a slam you can see coming (a violet ring fills), a swipe up
   close, and a roar that sends the hounds out of the side rooms.
   Monsters are hostiles (side E) with mon set, and dog set too, so everything that's only for armed men leaves them alone
   (no shooting, no surrender, no bodies to find, no barks); they never need to notice anyone: they know where you are.
   Sounds: sounds/sfx mon_* and boss_* (tools/sfx/build_monsters.py, CC0 recordings layered and slowed). */
const HOUND={hp:70,run:86,lungeR:92,crouchT:.45,lungeSpd:270,hit:18,bite:10,biteT:1.0,stun:.65,fadeT:1.2,reach:17,again:1.4};
const BOSS={hp:600,perMan:180,dmgIn:.7,walk:21,slamR:64,slamT:1.3,slamDmg:55,slamCd:3.6,swipeR:36,swipeDmg:28,swipeCd:1.9};   // (her health: hp plus perMan for each soldier who comes in; a tough hide, dmgIn)
const MON_GATE={x:850,y:-604},MON_OUT={x0:790,x1:910,y0:-548,y1:-488};   // where they come out (the gate's mouth), and where the squad gathers to go in
let mon={out:null,first:false};
function resetMonsters(){mon={out:null,first:false};}
const isMon=u=>!!u&&!!u.mon;
const monsLeft=()=>enemies.filter(e=>e.mon&&!e.dead&&!e.dormant);
function sfxMon(kind,u,vol=.9,rate){if(typeof playSample==='function'&&u)playSample(kind,u.x,u.y,vol,rate??varyRate());}
const varyRate=()=>.92+Math.random()*.16;

/* ---------- their bodies ---------- */
let MONG=null;   // shared geometry and materials (made once)
function monKit(){
  if(MONG)return MONG;
  const skin=new T.MeshStandardMaterial({color:0x6f6575,roughness:.62,metalness:.05,emissive:0x140a1c,emissiveIntensity:1});   // (a little darker: under the Headquarters' lamps the paler skin burned out to white up close)
  const dark=new T.MeshStandardMaterial({color:0x2a2128,roughness:.7});
  const bone=new T.MeshStandardMaterial({color:0xd9cfc2,roughness:.45});
  const glow=new T.MeshBasicMaterial({color:0xc27bff,toneMapped:false});
  const sac=new T.MeshStandardMaterial({color:0x6a2aa8,emissive:0x8a3dff,emissiveIntensity:1.6,roughness:.3,transparent:true,opacity:.92});
  return MONG={skin,dark,bone,glow,sac,box:new T.BoxGeometry(1,1,1),cone:new T.ConeGeometry(1,1,6),ball:new T.SphereGeometry(1,10,8)};
}
function part(parent,geo,mat,sx,sy,sz,x,y,z,shadow=true){const m=new T.Mesh(geo,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=shadow;parent.add(m);return m;}
function pivot(parent,x,y,z){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function monRing(u,g,s){const ring=new T.Mesh(SG.ring,new T.MeshBasicMaterial({color:new T.Color(teamCol(u)),transparent:true,opacity:.85,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.5;ring.scale.setScalar(s);g.add(ring);return ring;}
// a hound: front is +x. A long lean body hunched at the shoulders, a long skull with a jaw that drops, heat pits that glow,
// spines down the back, long legs with backward knees behind
function makeHound(u){
  const K=monKit(),g=new T.Group(),pose=pivot(g,0,0,0),body=pivot(pose,0,10,0);
  part(body,K.box,K.skin,18,6,6.4,0,0,0);part(body,K.box,K.skin,8,7,7,6,1.2,0);   // body, shoulders
  for(let i=0;i<4;i++){part(body,K.box,K.dark,.8,4.6,7,-3+i*2.6,-.4,0);}   // ribs showing
  for(let i=0;i<5;i++){const s=part(body,K.cone,K.bone,1,2.6+i*.3,1,-6+i*3,4.2,0);s.rotation.z=.5;}   // spines
  const neck=pivot(body,9,2,0);part(neck,K.box,K.skin,5,3.2,3.4,2,0,0);
  const head=pivot(neck,4.5,.8,0);part(head,K.box,K.skin,7.5,3.6,4.2,3,0,0);part(head,K.box,K.dark,2.4,1.4,4.4,6.6,.6,0);
  for(const z of[-1.5,1.5])for(let i=0;i<2;i++)part(head,K.ball,K.glow,.55,.55,.55,4.6+i*1.4,1.6,z,false);   // the heat pits
  const jaw=pivot(head,.5,-1.6,0);part(jaw,K.box,K.skin,7,1.4,3.6,3,-.4,0);
  for(let i=0;i<4;i++)for(const z of[-1.3,1.3])part(jaw,K.box,K.bone,.5,1.3,.4,1.5+i*1.5,.6,z,false);   // teeth
  const legs=[];
  for(const[x,z,back]of[[6,2.6,0],[6,-2.6,0],[-6.5,2.6,1],[-6.5,-2.6,1]]){
    const hip=pivot(body,x,-2,z);part(hip,K.box,K.skin,2.2,7,2.2,0,-3.2,0);const knee=pivot(hip,0,-6.4,0);part(knee,K.box,K.dark,1.5,7,1.5,0,-3.2,0);
    legs.push({hip,knee,back});}
  const tail=pivot(body,-9,1,0);part(tail,K.box,K.skin,7,1.6,1.6,-3.5,0,0);const tail2=pivot(tail,-7,0,0);part(tail2,K.box,K.dark,6,1,1,-3,0,0);
  const ring=monRing(u,g,.95);scene.add(g);u.m={g,pose,body,neck,head,jaw,legs,tail,tail2,ring,spot:null};
}
// the Brood Mother: a hunched mountain of a thing on two thick legs and two long arms, sacs on its back that glow, a head
// mostly jaw
function makeBoss(u){
  const K=monKit(),g=new T.Group(),pose=pivot(g,0,0,0),body=pivot(pose,0,34,0);
  part(body,K.box,K.skin,30,22,28,0,0,0);part(body,K.box,K.skin,18,18,24,14,4,0);part(body,K.box,K.skin,16,12,20,-16,-4,0);
  for(let i=0;i<5;i++)for(const z of[-12,12])part(body,K.box,K.dark,2,14,1.2,-8+i*5,-2,z);   // ribs
  const sacs=[];for(const[x,y,z,r]of[[-4,13,-6,5],[4,14,5,6],[-12,10,4,4.5],[10,12,-5,4]])sacs.push(part(body,K.ball,K.sac,r,r*.8,r,x,y,z));
  for(let i=0;i<7;i++){const s=part(body,K.cone,K.bone,1.8,5+i%3*2,1.8,-18+i*6,12,i%2?4:-4);s.rotation.z=.4;}
  const neck=pivot(body,22,4,0);part(neck,K.box,K.skin,8,10,12,3,0,0);
  const head=pivot(neck,8,-2,0);part(head,K.box,K.skin,16,10,14,6,2,0);
  for(const z of[-4,4])for(let i=0;i<3;i++)part(head,K.ball,K.glow,1.1,1.1,1.1,7+i*2.6,6,z,false);
  const jaw=pivot(head,0,-3,0);part(jaw,K.box,K.skin,16,4,13,7,-2,0);
  for(let i=0;i<6;i++)for(const z of[-5,5])part(jaw,K.cone,K.bone,1,3,1,2+i*2.4,1.4,z,false);
  const arms=[];
  for(const z of[-16,16]){const sh=pivot(body,12,4,z);part(sh,K.box,K.skin,7,24,7,0,-11,0);const el=pivot(sh,0,-22,0);part(el,K.box,K.skin,6,24,6,0,-11,0);
    for(let i=-1;i<=1;i++){const c=part(el,K.cone,K.bone,1.2,6,1.2,2,-24,i*2);c.rotation.z=Math.PI;}arms.push({sh,el});}
  const legs=[];for(const z of[-10,10]){const hip=pivot(body,-12,-8,z);part(hip,K.box,K.skin,11,18,11,0,-8,0);const knee=pivot(hip,0,-16,0);part(knee,K.box,K.dark,8,14,8,0,-6,0);legs.push({hip,knee});}
  const ring=monRing(u,g,2.6);scene.add(g);u.m={g,pose,body,neck,head,jaw,arms,legs,sacs,ring,spot:null};
}
function monPose(u,t){
  const m=u.m;if(!m)return;m.ring.visible=!u.dead&&!u.dormant;m.g.visible=m.g.visible&&!u.dormant;
  if(u.mon==='boss'){bossPose(u,t);return;}
  const st=u.ms||'hunt',mv=(!!u.path.length||st==='lunge'||st==='fade')&&!u.dead,sp=st==='lunge'?3:st==='fade'?1.6:1;
  if(u.dead){m.pose.rotation.x+=(Math.PI/2-m.pose.rotation.x)*.15;m.pose.position.y+=(1.5-m.pose.position.y)*.15;m.jaw.rotation.z=-.5;for(const L of m.legs){L.hip.rotation.z=.6;L.knee.rotation.z=-1;}return;}
  m.pose.rotation.x=0;
  const ph=t*(mv?16*sp:3)+u.x*.01;
  m.body.position.y=(st==='crouch'?6.5:10)+(mv?Math.abs(Math.sin(ph))*1.1:Math.sin(t*2)*.3);
  m.body.rotation.z=st==='crouch'?-.28:st==='lunge'?.12:.06;   // head down and haunches up to spring; stretched out in the air
  m.neck.rotation.z=st==='crouch'?-.25:st==='lunge'?.25:Math.sin(t*1.7+u.y)*.12;
  m.head.rotation.y=st==='hunt'?Math.sin(t*2.3+u.x)*.25:0;
  m.jaw.rotation.z=-(st==='crouch'?.45:st==='lunge'||simT-(u.biteAt||-9)<.25?.9:.08+Math.max(0,Math.sin(t*5))*.06);
  m.legs.forEach((L,i)=>{const s=Math.sin(ph+(i===0||i===3?0:Math.PI));
    if(st==='lunge'){L.hip.rotation.z=L.back?.9:-1;L.knee.rotation.z=L.back?-.2:.5;return;}
    if(st==='crouch'){L.hip.rotation.z=L.back?-.5:.5;L.knee.rotation.z=L.back?1.1:-1;return;}
    L.hip.rotation.z=mv?s*.7:0;L.knee.rotation.z=(L.back?1:-1)*(mv?.3+Math.max(0,s)*.6:.25);});
  m.tail.rotation.y=Math.sin(t*(mv?9:2))*.4;m.tail2.rotation.y=Math.sin(t*(mv?9:2)-1)*.5;m.tail.rotation.z=st==='crouch'?.5:.1;
}
function bossPose(u,t){
  const m=u.m,st=u.ms||'sleep';
  if(u.dead){const k=Math.min(1,(simT-(u.diedT||simT))/2.2);m.pose.rotation.z=-k*.9;m.pose.position.y=-k*14;m.jaw.rotation.z=-.7;for(const s of m.sacs)s.material=monKit().dark;return;}
  const breathe=Math.sin(t*(st==='sleep'?1:2.2));m.body.position.y=34+breathe*(st==='sleep'?.6:1.2);
  monKit().sac.emissiveIntensity=1.3+Math.sin(t*4)*.6;   // (the sacs pulse)
  const mv=!!u.path.length,ph=t*5;
  m.legs.forEach((L,i)=>{const s=Math.sin(ph+(i?Math.PI:0));L.hip.rotation.z=mv?s*.45:0;L.knee.rotation.z=mv?-.2-Math.max(0,s)*.5:-.15;});
  const w=st==='slam'?Math.min(1,(simT-u.mt0)/BOSS.slamT):0,sw=st==='swipe'?Math.min(1,(simT-u.mt0)/.5):0;
  m.arms.forEach((A,i)=>{
    if(st==='slam'){A.sh.rotation.z=w<1?w*2.4:-.2;A.el.rotation.z=w<1?-w*.9:.2;return;}   // both arms up over its head, then down
    if(st==='swipe'&&i===0){A.sh.rotation.z=sw<.6?sw*2:1.2-(sw-.6)*4;A.sh.rotation.x=sw*.8;return;}
    if(st==='roar'){A.sh.rotation.x=(i?1:-1)*.7;A.sh.rotation.z=.6;A.el.rotation.z=-.3;return;}
    A.sh.rotation.x=0;A.sh.rotation.z=mv?Math.sin(ph+(i?0:Math.PI))*.35:Math.sin(t*1.3+i)*.05;A.el.rotation.z=-.15;});
  m.neck.rotation.z=st==='roar'?.6:st==='sleep'?-.35:Math.sin(t*1.1)*.08;
  m.jaw.rotation.z=-(st==='roar'?1:st==='slam'&&w>.7?.6:.12+Math.max(0,breathe)*.08);
  m.body.rotation.z=st==='sleep'?-.15:st==='slam'&&w>=1?-.25:0;
}

/* ---------- the units ---------- */
let monN=0;
function hound(x,y,o={}){
  const u=mk('E','E','H'+(++monN),'Hound',x,y,Math.PI/2);
  Object.assign(u,{mon:'hound',dog:true,hp:HOUND.hp,maxHp:HOUND.hp,alerted:true,aware:1,jumpy:true,seen:false,grp:null,ms:'hunt',growlT:simT+1+Math.random()*3,againT:simT+1.2},o);
  makeHound(u);enemies.push(u);return u;
}
function broodMother(x,y){
  const u=mk('E','E','BM','Brood Mother',x,y,Math.PI/2);
  Object.assign(u,{mon:'boss',dog:true,hp:BOSS.hp,maxHp:BOSS.hp,alerted:false,aware:0,seen:false,grp:null,ms:'sleep',slamCdT:0,swipeCdT:0,stepT:0,big:true});
  makeBoss(u);enemies.push(u);return u;
}
// who a monster goes for: the nearest man on his feet, or a scientist (Bryan: "attack the units and scientists")
function monPrey(u,maxD=900){
  let best=null,bd=maxD;
  for(const p of players){if(!alive(p)||p.offMap)continue;const d=hyp(p.x-u.x,p.y-u.y);if(d<bd){bd=d;best=p;}}
  for(const c of civs){if(!c.sci||c.dead||c.offMap||c.gone)continue;const d=hyp(c.x-u.x,c.y-u.y)+40;if(d<bd){bd=d;best=c;}}   // (a man close by comes first)
  return best;
}
// a monster's blow: a soldier loses health and is knocked off his feet; a scientist can die
function monHit(u,tg,dmg,stun){
  if(tg.side==='C'){tg.hp=(tg.hp??100)-dmg*1.2;callout(tg,'Aaagh!','#ffd7cf');if(typeof sfxScream==='function')sfxScream(tg,.8);
    if(tg.hp<=0&&!tg.dead){tg.dead=true;tg.detained=false;tg.path=[];mon.sciLost=(mon.sciLost||0)+1;banner('A scientist is down.',2200);}return;}
  damage(tg,dmg*(.85+Math.random()*.3),u);if(alive(tg)){tg.stunT=simT+stun;tg.path=[];}
}
function monMove(u,dx,dy,dist){   // a lunge or a step back: straight, stopping at anything solid
  const n=Math.max(1,Math.ceil(dist/4));for(let i=0;i<n;i++){const nx=u.x+dx*dist/n,ny=u.y+dy*dist/n;if(!isFree(nx,ny,6))return false;u.x=nx;u.y=ny;}return true;
}

/* ---------- what they do (every tick, from update) ---------- */
function monTick(dt){
  if(state!=='play')return;
  gateTick(dt);
  for(const u of enemies){
    if(!u.mon||u.dead||u.dormant)continue;
    if(u.mon==='boss'){if(typeof bossThink==='function')bossThink(u,dt);continue;}
    houndThink(u,dt);
  }
}
function monSaw(tg){if(tg&&tg.side==='P'&&tg.team){teamSawT[tg.team]=simT;if(!teamSeen[tg.team]){teamSeen[tg.team]=true;contact=true;setStatus();}}}
function houndThink(u,dt){
  const tg=monPrey(u);if(!tg){u.path=[];return;}
  if(hyp(tg.x-u.x,tg.y-u.y)<420)monSaw(tg);
  const dx=tg.x-u.x,dy=tg.y-u.y,d=hyp(dx,dy)||1;
  if(u.entry&&u.entry.length){u.path=u.entry;u.entry=null;return;}   // out of the gate first
  if(simT>u.growlT&&u.ms==='hunt'){u.growlT=simT+3+Math.random()*4;sfxMon('mon_growl',u,.55);}
  switch(u.ms){
    case 'crouch':   // the warning: down on its haunches, snarling, a violet line where it'll go
      u.path=[];u.ang=Math.atan2(u.tele.y-u.y,u.tele.x-u.x);
      if(simT-u.mt0>=HOUND.crouchT){u.ms='lunge';u.mt0=simT;u.lunged=0;sfxMon('mon_scream',u,.95);}
      return;
    case 'lunge':{
      const ux=Math.cos(u.ang),uy=Math.sin(u.ang),step=HOUND.lungeSpd*dt;
      const ok=monMove(u,ux,uy,Math.min(step,HOUND.lungeR+12-u.lunged));u.lunged+=step;
      const hit=[...players,...civs.filter(c=>c.sci&&!c.dead)].find(p=>(p.side==='C'||alive(p))&&!p.offMap&&hyp(p.x-u.x,p.y-u.y)<HOUND.reach);
      if(hit){monHit(u,hit,HOUND.hit,HOUND.stun);u.biteAt=simT;u.ms='fade';u.mt0=simT;u.fadeA=Math.atan2(u.y-hit.y,u.x-hit.x)+(Math.random()-.5)*.8;return;}
      if(!ok||u.lunged>=HOUND.lungeR+12){u.ms='fade';u.mt0=simT;u.fadeA=u.ang+Math.PI+(Math.random()-.5);}
      return;}
    case 'fade':{   // hit and fade (the feel plan): it pulls back, then comes again
      u.path=[];const ok=monMove(u,Math.cos(u.fadeA),Math.sin(u.fadeA),HOUND.run*.9*dt);u.ang=Math.atan2(dy,dx);
      if(!ok)u.fadeA+=1.2;if(simT-u.mt0>HOUND.fadeT){u.ms='hunt';u.againT=simT+HOUND.again*(.7+Math.random()*.6);}
      return;}
  }
  // hunting: run it down; right up close it bites; in range and in sight, it crouches to spring
  if(d<HOUND.reach+2){u.path=[];u.ang=Math.atan2(dy,dx);if(simT>(u.biteT||0)){u.biteT=simT+HOUND.biteT;u.biteAt=simT;monHit(u,tg,HOUND.bite,.25);sfxMon('mon_snarl',u,.7);}return;}
  if(d<HOUND.lungeR&&d>24&&simT>u.againT&&los(u.x,u.y,tg.x,tg.y)){
    u.ms='crouch';u.mt0=simT;u.path=[];const L=Math.min(HOUND.lungeR+12,d+14);u.tele={x:u.x+dx/d*L,y:u.y+dy/d*L,t0:simT};u.ang=Math.atan2(dy,dx);sfxMon('mon_snarl',u,.9);return;}
  if(simT>(u.repath||0)){u.repath=simT+.4;
    if(d<140&&los(u.x,u.y,tg.x,tg.y))u.path=[{x:tg.x-dx/d*12,y:tg.y-dy/d*12}];
    else{const p=findPath(u.x,u.y,tg.x,tg.y,FOOT);if(p)u.path=p;}}
}
// hurt and killed (from damage in combat.js)
function monHurt(u){if(simT-(u.hurtT||-9)<.35)return;u.hurtT=simT;sfxMon(u.mon==='boss'?'boss_hurt':'mon_hurt',u,u.mon==='boss'?1.1:.8);if(u.mon==='boss'&&typeof bossHurt==='function')bossHurt(u);}
function monDied(u){
  u.diedT=simT;u.path=[];sfxMon(u.mon==='boss'?'boss_die':'mon_die',u,u.mon==='boss'?1.3:.9);
  paintDecal({k:'scorch',x:u.x,y:u.y,r:Math.random()});if(u.mon==='boss'){shake(.9);if(typeof bossDied==='function')bossDied(u);}
}

/* ---------- outside: they pour out over the drawbridge (from lowerBridge in mission.js) ---------- */
const MON_WAVES=[{at:4,n:4,from:'gate'},{at:12,n:5,from:'moat'},{at:22,n:5,from:'both'},{at:32,n:6,from:'both'}];   // (out of the gate, and up over the moat's edge close by)
function monGateStart(){
  if(mon.out)return;mon.out={t0:simT,spawned:0,wave:0,roared:false,done:false,ready:false};updateObjUI();
}
function gateTick(dt){
  const o=mon.out;if(!o||MAPID!=='out')return;
  const t=simT-o.t0;
  if(!o.roared&&t>2.6){o.roared=true;sfxMon('boss_roar',{x:MON_GATE.x,y:MON_GATE.y-60},1.5,.9);setTimeout(()=>{if(mon.out)sfxMon('mon_horde',MON_GATE,1.3,1);},900);shake(.5);
    banner('Something’s coming out of the gate!',2600);if(typeof startContact==='function')startContact('Contact! Out of the gate!',false);}
  while(o.wave<MON_WAVES.length&&t>=MON_WAVES[o.wave].at){
    const W=MON_WAVES[o.wave++];
    const near=moatEdge(W.from==='moat'?W.n:W.from==='both'?Math.floor(W.n/2):0);
    for(let i=0;i<W.n;i++){let h;
      if(i<near.length){const s=near[i];h=hound(s.ix,s.iy,{entry:[{x:s.x,y:s.y}]});}   // up over the edge of the moat
      else{const x=MON_GATE.x+(i-(W.n-1)/2)*14;h=hound(x,MON_GATE.y-i*10,{entry:[{x,y:-572},{x:x+(Math.random()-.5)*40,y:-528}]});}   // out of the gate and over the bridge
      h.wave=o.wave;o.spawned++;}
    if(o.wave===1&&!mon.first){mon.first=true;setTimeout(()=>{if(state==='play')banner('Hounds. They crouch before they lunge: shoot them then, or get out of the violet line.',4200);},1200);}
  }
  if(!o.done&&o.wave>=MON_WAVES.length&&!enemies.some(e=>e.mon==='hound'&&!e.dead)){
    o.done=true;bigText('The gate is clear','clear');banner('Gather at the drawbridge to go in. The Headquarters is inside.',3600);
    if(typeof saveGame==='function')saveGame('gate');updateObjUI();hud();
  }
}
// places on the moat's outer edge a short run from the squad (left and right of them): where a hound climbs out (ix,iy: down
// in the moat, where it starts; x,y: up on the edge)
function moatEdge(n){
  if(!n)return[];const up=players.filter(p=>alive(p)&&!p.offMap);if(!up.length)return[];
  const c=midOf(up),out=[];
  for(let k=0;k<40&&out.length<n;k++){const a=Math.PI/2+(Math.random()-.5)*1.5,x=FORT.cx+Math.cos(a)*(FORT.r1+14),y=FORT.cy+Math.sin(a)*(FORT.r1+14);
    const d=hyp(x-c.x,y-c.y);if(d<110||d>320||!isFree(x,y,8)||out.some(o=>hyp(o.x-x,o.y-y)<40))continue;
    out.push({x,y,ix:FORT.cx+Math.cos(a)*(FORT.r1-16),iy:FORT.cy+Math.sin(a)*(FORT.r1-16)});}
  return out;
}
// the gather area at the drawbridge: everyone up stands in it, then a tap takes them in (fortress.js)
function gateReady(){
  if(!mon.out||!mon.out.done||MAPID!=='out')return null;const z=MON_OUT,up=players.filter(p=>alive(p)&&!p.offMap);
  const n=up.filter(p=>p.x>=z.x0&&p.x<=z.x1&&p.y>=z.y0&&p.y<=z.y1).length;return{n,of:up.length,ok:n>0&&n===up.length&&!players.some(p=>p.downed&&!p.dead&&!p.carriedBy)};
}
function monGateTap(wx,wy){
  const g=gateReady();if(!g)return false;const z=MON_OUT;if(wx<z.x0-20||wx>z.x1+20||wy<z.y0-20||wy>z.y1+20)return false;
  if(!g.ok){if(sel.some(alive))return false;banner(players.some(p=>p.downed&&!p.dead&&!p.carriedBy)?'Nobody goes in while someone’s down: revive him or carry him.':'Everyone who’s up has to be in the green area first.',2400);return true;}
  if(typeof enterHQ==='function')enterHQ();return true;
}

/* ---------- on the overlay: the warnings, and the gather area ---------- */
function drawMonsters(now){
  const pulse=(Math.sin(now*10)+1)/2;
  for(const u of enemies){
    if(!u.mon||u.dead||u.dormant||offFloor(u))continue;
    if(u.ms==='crouch'&&u.tele){   // the lunge's line and where it ends
      toSBack=false;const a=toS(u.x,u.y,.5),b=toS(u.tele.x,u.tele.y,.5);if(toSBack)continue;
      ox.beginPath();ox.moveTo(a[0],a[1]);ox.lineTo(b[0],b[1]);ox.strokeStyle=`rgba(194,123,255,${(.55+pulse*.4).toFixed(2)})`;ox.lineWidth=5;ox.stroke();
      gPath(u.tele.x,u.tele.y,12+pulse*4);ox.fillStyle='rgba(194,123,255,.28)';ox.fill();ox.strokeStyle='rgba(214,160,255,.95)';ox.lineWidth=2;ox.stroke();
    }
    if(u.mon==='boss'&&u.ms==='slam'){const k=Math.min(1,(simT-u.mt0)/BOSS.slamT);   // the slam's ring fills
      gPath(u.slamAt.x,u.slamAt.y,BOSS.slamR);ox.strokeStyle='rgba(214,160,255,.9)';ox.lineWidth=3;ox.setLineDash([8,6]);ox.stroke();ox.setLineDash([]);
      gPath(u.slamAt.x,u.slamAt.y,BOSS.slamR*k);ox.fillStyle=`rgba(194,123,255,${(.18+k*.25).toFixed(2)})`;ox.fill();
      const[lx,ly]=below(u.slamAt.x,u.slamAt.y+BOSS.slamR,6);label('SLAM · GET CLEAR',lx,ly,'#e2b8ff',10,700);}
  }
  const g=gateReady();
  if(g){const z=MON_OUT;toSBack=false;const c=[[z.x0,z.y0],[z.x1,z.y0],[z.x1,z.y1],[z.x0,z.y1]].map(([x,y])=>toS(x,y,.4));
    if(!toSBack){ox.beginPath();ox.moveTo(...c[0]);for(const p of c)ox.lineTo(...p);ox.closePath();ox.fillStyle=`rgba(95,224,142,${(.06+pulse*.05).toFixed(3)})`;ox.fill();
      ox.setLineDash([10,7]);ox.lineDashOffset=-now*14;ox.strokeStyle='rgba(95,224,142,.95)';ox.lineWidth=2.4;ox.stroke();ox.setLineDash([]);
      const[lx,ly]=below((z.x0+z.x1)/2,z.y0,10);label(g.ok?'TAP TO GO IN':`HEADQUARTERS · ${g.n}/${g.of}`,lx,ly-26,C.good,10,700);}}
}

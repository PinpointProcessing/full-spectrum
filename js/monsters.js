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
// (Bryan, after v91: "the monsters are a bit too easy, make it a little challenging. I wouldn't mind if some units got knocked
// down": 70 HP to 80, quicker on their feet (86 to 110), the lunge 18 to 22, a bite 10 to 12; out of the gate closer together and
// more of them for a bigger squad, and most swing wide to come in from the sides: gateTick and houndThink)
const HOUND={hp:80,run:110,lungeR:92,crouchT:.45,lungeSpd:270,hit:22,bite:12,biteT:1.0,stun:.65,fadeT:1.2,reach:17,again:1.4};
const BOSS={hp:600,perMan:230,dmgIn:.7,walk:21,slamR:64,slamT:1.3,slamDmg:65,slamCd:3.6,swipeR:36,swipeDmg:34,swipeCd:1.9};   // (her health: hp plus perMan for each soldier who comes in; a tough hide, dmgIn. After v91, harder: perMan 180, slam 55, swipe 28 before)
const MON_GATE={x:850,y:-604},MON_OUT={x0:765,x1:918,y0:-548,y1:-418};   // where they come out (the gate's mouth), and where the squad gathers to go in (Bryan, after v93: larger; it was 790-910 by -548 to -488, tight for eight men; its east edge stops short of the scanner's panel)
let mon={out:null,first:false};
function resetMonsters(){mon={out:null,first:false};}
const isMon=u=>!!u&&!!u.mon;
const monsLeft=()=>enemies.filter(e=>e.mon&&!e.dead&&!e.dormant);
function sfxMon(kind,u,vol=.9,rate){if(typeof playSample==='function'&&u)playSample(kind,u.x,u.y,vol,rate??varyRate());}
const varyRate=()=>.92+Math.random()*.16;

/* ---------- their bodies (creatures.js: the hunters out of the gate, her young, the Brood Mother) ---------- */
function monRing(u,g,s){const ring=new T.Mesh(SG.ring,new T.MeshBasicMaterial({color:new T.Color(teamCol(u)),transparent:true,opacity:.85,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.5;ring.scale.setScalar(s);g.add(ring);return ring;}
// u.m.g only carries the ring (syncUnits moves it with the monster); the body is a slot in its scene's pool
function makeHound(u){
  const crawl=u.kind==='crawler',centi=u.kind==='young'||crawl,g=new T.Group(),ring=monRing(u,g,crawl?2:centi?1.15:1.05);scene.add(g);
  const pool=crPool(scene,centi?u.kind:'hunter');u.m={g,ring,spot:null,pool,slot:crSlotFor(pool,u)};
  if(centi)crTrailInit(u,crawl?CRAWLER:BROOD);else u.m.rig=crHunterRig();   // (the Crawler: one of her young grown big, Level 4)
}
// she starts coiled round her clutch (the lair at 500,205), her head toward the hall
function makeBoss(u){
  const g=new T.Group(),ring=monRing(u,g,2.6);scene.add(g);const pool=crPool(scene,'mother');u.m={g,ring,spot:null,pool,slot:crSlotFor(pool,u)};
  const pts=[{x:u.x,y:u.y}];for(let y=u.y-2;y>257;y-=2)pts.push({x:u.x,y});for(let a=Math.PI/2;a<Math.PI/2+5;a+=.04)pts.push({x:500+Math.cos(a)*52,y:205+Math.sin(a)*52});
  crTrailInit(u,MOTHER,pts);
}
function monPose(u,t){
  const m=u.m;if(!m)return;m.ring.visible=!u.dead&&!u.dormant;
  const boss=u.mon==='boss',young=u.kind==='young'||u.kind==='crawler',S=u.kind==='crawler'?CRAWLER:BROOD,walk=crGait(u,boss?BOSS.walk:HOUND.run*.8);
  if(boss)crTrailStep(u,MOTHER);else if(young)crTrailStep(u,S);
  if(!m.g.visible||u.dormant||m.slot<0)return;   // (out of sight: its slot is hidden, crPoolsFrame)
  if(boss){motherPose(u,walk);return;}
  const st=u.ms||'hunt',bite=simT-(u.biteAt||-9)<.25;
  if(young){let rear=.08,jaw=bite?1:.25,look=.1,o;
    if(u.dead)o={dead:1,flip:1,jaw:.6,walk:0};
    else{if(st==='crouch'){rear=.9*Math.min(1,(simT-u.mt0)/HOUND.crouchT);jaw=.9;look=.35;}else if(st==='lunge'){rear=.15;jaw=1;look=.2;}
      o={walk:st==='lunge'?1:walk,jaw,look,antUp:.3,flail:.6};}
    crCentiSlot(m.pool,m.slot,crTrailSpine(u,S,u.dead?0:rear,6,u.dead?S.ride*.7:S.ride),(u.wph||0)*.3/(S===BROOD?1:2.1),o);return;}
  const o={walk,jaw:bite?1:.25};
  if(u.dead)o.dead=1;else if(st==='crouch'){o.crouch=1;o.threat=.6;o.jaw=.7;}else if(st==='lunge'){o.lunge=1;o.jaw=1;o.walk=1;}
  crHunterSlot(m.pool,m.slot,m.rig,u.x,u.y,Math.PI/2-u.ang,(u.wph||0)*.13+(o.walk?0:t*.2),o);
}
// the Brood Mother: rears to roar and to slam, strikes with her claws up close, collapses when she dies
function motherPose(u,walk){
  const st=u.ms||'sleep';let rear=.12,jaw=.2,look=.15,antUp=.25,o;
  if(u.dead){const k=Math.min(1,(simT-(u.diedT||simT))/1.5);o={dead:1,jaw:.7,walk:0,look:.6};crCentiSlot(u.m.pool,u.m.slot,crTrailSpine(u,MOTHER,0,9,MOTHER.ride*(1-.45*k)),(u.wph||0)*.13,o);return;}
  if(st==='sleep'){rear=.05;jaw=.1;look=.3;}
  else if(st==='roar'){rear=.95*Math.min(1,(simT-u.mt0)/.5);jaw=1;look=-.2;antUp=.7;}
  else if(st==='slam'){const w=Math.min(1,(simT-u.mt0)/BOSS.slamT);rear=.25+.75*w;jaw=.6+.4*w;look=.5;}
  else if(st==='swipe'){const w=Math.min(1,(simT-u.mt0)/.5);rear=.3-.2*w;jaw=w<.6?1:.1;look=.8;}
  if(u.slamDownT&&simT-u.slamDownT<.5){const k=(simT-u.slamDownT)/.5;rear=Math.min(rear,k<.2?1-k/.2:0);look=.9;}   // (the crash down: fortress.js marks it)
  crCentiSlot(u.m.pool,u.m.slot,crTrailSpine(u,MOTHER,rear,9,MOTHER.ride),(u.wph||0)*.13,{walk,jaw,look,antUp,flail:.5});
}

/* ---------- the units ---------- */
let monN=0;
function hound(x,y,o={}){
  const young=o.kind==='young',u=mk('E','E','H'+(++monN),o.kind==='crawler'?'The Crawler':young?'Brood':'Hunter',x,y,o.ang??Math.PI/2);
  Object.assign(u,{mon:'hound',kind:young?'young':'hunter',dog:true,hp:HOUND.hp,maxHp:HOUND.hp,alerted:true,aware:1,jumpy:true,seen:false,grp:null,ms:'hunt',growlT:simT+1+Math.random()*3,againT:simT+1.2},o);
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
  for(const p of players){if(!alive(p)||p.offMap||p.away||!sameFloor(u.x,u.y,p.x,p.y))continue;const d=hyp(p.x-u.x,p.y-u.y);if(d<bd){bd=d;best=p;}}   // (not on another floor: Level 4's hill)
  for(const c of civs){if(!c.sci||c.dead||c.offMap||c.gone)continue;const d=hyp(c.x-u.x,c.y-u.y)+40;if(d<bd){bd=d;best=c;}}   // (a man close by comes first)
  if(u.brawl)for(const e of enemies){if(e.mon||e.dog||e.dead||e.surr||!sameFloor(u.x,u.y,e.x,e.y))continue;const d=hyp(e.x-u.x,e.y-u.y)+20;if(d<bd){bd=d;best=e;}}   // Level 4: their men too (Bryan: "attack not only the player but the enemy troops too")
  return best;
}
// a monster's blow: a soldier loses health and is knocked off his feet; a scientist can die
function monHit(u,tg,dmg,stun){
  if(tg.side==='C'){tg.hp=(tg.hp??100)-dmg*1.2;callout(tg,'Aaagh!','#ffd7cf');if(typeof sfxScream==='function')sfxScream(tg,.8);
    if(tg.hp<=0&&!tg.dead){tg.dead=true;tg.detained=false;tg.path=[];mon.sciLost=(mon.sciLost||0)+1;banner('A scientist is down.',2200);}return;}
  damage(tg,dmg*(u.hitK||1)*(.85+Math.random()*.3),u);if(alive(tg)){tg.stunT=simT+stun;tg.path=[];}   // (a hatchling bites weaker: fortress.js)
}
function monMove(u,dx,dy,dist){   // a lunge or a step back: straight, stopping at anything solid
  const n=Math.max(1,Math.ceil(dist/4));for(let i=0;i<n;i++){const nx=u.x+dx*dist/n,ny=u.y+dy*dist/n;if(!isFree(nx,ny,6))return false;u.x=nx;u.y=ny;}return true;
}

/* ---------- what they do (every tick, from update) ---------- */
function monTick(dt){
  if(state!=='play')return;
  gateTick(dt);sceneTick();hqfTick();
  for(const u of enemies){
    if(!u.mon||u.dead||u.dormant)continue;
    if(u.mon==='boss'){if(typeof bossThink==='function')bossThink(u,dt);continue;}
    houndThink(u,dt);
  }
}
function monSaw(tg){if(MAPID==='l4')return;if(tg&&tg.side==='P'&&tg.team){   // (Level 4: the brood tells their men nothing; a team stays hidden from them, level4.js)
  teamSawT[tg.team]=simT;if(!teamSeen[tg.team]){teamSeen[tg.team]=true;contact=true;setStatus();}}}
function houndThink(u,dt){
  if(simT<(u.slowT||0)){u.path=[];return;}   // (just woken: uncurling, Level 4's nest)
  if(u.shaft&&typeof l4Shaft==='function'&&l4Shaft(u))return;   // (Level 4: woken by the lift, up the shaft after it)
  const tg=monPrey(u);if(!tg){u.path=[];return;}
  if(hyp(tg.x-u.x,tg.y-u.y)<420)monSaw(tg);
  if(tg.side==='E'&&!tg.alerted&&hyp(tg.x-u.x,tg.y-u.y)<300)alertOne(tg,{x:u.x,y:u.y},false);   // (one of their men it comes for: he's up and fighting it)
  const RE=u.reachX||HOUND.reach,LR=u.lungeX||HOUND.lungeR;   // (the Crawler reaches further)
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
      const ok=monMove(u,ux,uy,Math.min(step,LR+12-u.lunged));u.lunged+=step;
      const hit=[...players,...civs.filter(c=>c.sci&&!c.dead),...(u.brawl?enemies.filter(e=>!e.mon&&!e.dog&&!e.dead):[])].find(p=>(p.side==='C'||alive(p))&&!p.offMap&&hyp(p.x-u.x,p.y-u.y)<RE);
      if(hit){monHit(u,hit,HOUND.hit,HOUND.stun);u.biteAt=simT;u.ms='fade';u.mt0=simT;u.fadeA=Math.atan2(u.y-hit.y,u.x-hit.x)+(Math.random()-.5)*.8;return;}
      if(!ok||u.lunged>=LR+12){u.ms='fade';u.mt0=simT;u.fadeA=u.ang+Math.PI+(Math.random()-.5);}
      return;}
    case 'fade':{   // hit and fade (the feel plan): it pulls back, then comes again
      u.path=[];const ok=monMove(u,Math.cos(u.fadeA),Math.sin(u.fadeA),HOUND.run*.9*dt);u.ang=Math.atan2(dy,dx);
      if(!ok)u.fadeA+=1.2;if(simT-u.mt0>HOUND.fadeT){u.ms='hunt';u.againT=simT+HOUND.again*(.7+Math.random()*.6);}
      return;}
  }
  // hunting: run it down; right up close it bites; in range and in sight, it crouches to spring
  if(d<RE+2){u.path=[];u.ang=Math.atan2(dy,dx);if(simT>(u.biteT||0)){u.biteT=simT+HOUND.biteT;u.biteAt=simT;monHit(u,tg,HOUND.bite,.25);sfxMon('mon_snarl',u,.7);}return;}
  const f=u.flank;
  if(f&&!f.done&&u.y>-548){   // off the deck: swing out to the side first, then in at the squad from there (not straight down its guns)
    if(!f.p){for(const k of[1.5,1.15,.8]){const a=Math.atan2(u.y-tg.y,u.x-tg.x)+f.side*k,R=clamp(d*.8,110,170),p={x:tg.x+Math.cos(a)*R,y:tg.y+Math.sin(a)*R};
      if(p.x>20&&p.x<980&&isFree(p.x,p.y,10)){f.p=p;break;}}if(!f.p)f.done=true;}
    if(f.p&&(d<64||simT>f.until||hyp(f.p.x-u.x,f.p.y-u.y)<28))f.done=true;
    if(!f.done){if(simT>(u.repath||0)){u.repath=simT+.6;const p=findPath(u.x,u.y,f.p.x,f.p.y,FOOT);if(p)u.path=p;else f.done=true;}return;}
  }
  if(d<LR&&d>24&&simT>u.againT&&los(u.x,u.y,tg.x,tg.y)){
    u.ms='crouch';u.mt0=simT;u.path=[];const L=Math.min(LR+12,d+14);u.tele={x:u.x+dx/d*L,y:u.y+dy/d*L,t0:simT};u.ang=Math.atan2(dy,dx);sfxMon('mon_snarl',u,.9);return;}
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

/* ---------- outside: they pour out over the drawbridge (from lowerBridge in mission.js) ----------
   Bryan: "all the hunters should attack at once, the waves were too long of a gap, make them run out of the HQ entrance
   over the bridge continuously": one stream out of the gate's mouth and across the deck, one hunter about every 0.3 s
   from her roar on, no gaps, none from anywhere else. */
const MON_FLOOD={n:20,perMan:4,start:3,every:.2,wide:.67};   // (how many for four men, and per man beyond four: 36 for eight; the first a moment after the roar; seconds apart on average for twenty (all out in about 4 s), much closer for more (36: about 0.08 s, all out in about 3 s); wide: how many swing out to a side)
function monGateStart(){
  if(mon.out)return;const n=MON_FLOOD.n+MON_FLOOD.perMan*Math.max(0,players.filter(p=>!p.dead&&!p.offMap).length-4);   // (eight men: 36)
  mon.out={t0:simT,spawned:0,n,every:MON_FLOOD.every*(MON_FLOOD.n/n)**1.5,next:simT+MON_FLOOD.start,roared:false,done:false,ready:false};updateObjUI();
}
function gateTick(dt){
  const o=mon.out;if(!o||MAPID!=='out')return;
  const t=simT-o.t0;
  if(!o.roared&&t>2.6){o.roared=true;sfxMon('boss_roar',{x:MON_GATE.x,y:MON_GATE.y-60},1.5,.9);setTimeout(()=>{if(mon.out)sfxMon('mon_horde',MON_GATE,1.3,1);},900);shake(.5);
    if(typeof startContact==='function')startContact('',false,null,true);}   // (no words on screen as they come: Bryan)
  const N=o.n??MON_FLOOD.n;
  while(o.spawned<N&&simT>=o.next){   // out of the gate's mouth, down the deck and off its south end
    const x=MON_GATE.x+(Math.random()-.5)*44,y=MON_GATE.y-26-Math.random()*14;
    const side=Math.random()<MON_FLOOD.wide?(o.spawned%2?1:-1):0;   // (two in three swing out to one side or the other once they're off the deck)
    hound(x,y,{entry:[{x:x+(Math.random()-.5)*16,y:-572},{x:x+(Math.random()-.5)*64,y:-524}],flank:side?{side,until:simT+12}:null});o.spawned++;
    o.next+=(o.every??MON_FLOOD.every)*(.5+Math.random());
  }
  if(!o.done&&o.spawned>=N&&!enemies.some(e=>e.mon==='hound'&&!e.dead)){
    o.done=true;bigText('The gate is clear','clear');addZones(REST_ZONES.dc);   // (the stations now, not while they pour out: the medic ring healed 8 HP/s through the fight)
    if(typeof saveGame==='function')saveGame('gate');updateObjUI();hud();gateAftermath();
  }
}
// the checkpoint in front of the Headquarters (save.js's 'hqf'): the squad at the drawbridge with a scientist, before the scan
function hqfTick(){
  if(mon.hqf||obj!==4||MAPID!=='out'||LEVEL!==3)return;const near=u=>hyp(u.x-PANEL.x,u.y-PANEL.y)<170;
  if(players.some(p=>alive(p)&&near(p))&&civs.some(c=>c.sci&&c.detained&&!c.dead&&near(c))){mon.hqf=true;if(typeof saveGame==='function')saveGame('hqf');}
}
// the gather area at the drawbridge: everyone up stands in it, then a tap takes them in (fortress.js)
function gateReady(){
  if(!mon.out||!mon.out.done||MAPID!=='out')return null;const z=MON_OUT,up=players.filter(p=>alive(p)&&!p.offMap);
  const n=up.filter(p=>p.x>=z.x0&&p.x<=z.x1&&p.y>=z.y0&&p.y<=z.y1).length;return{n,of:up.length,ok:n>0&&n===up.length&&!players.some(p=>p.downed&&!p.dead&&!p.carriedBy)};
}
function monGateTap(wx,wy){
  const g=gateReady();if(!g)return false;const z=MON_OUT;if(wx<z.x0-20||wx>z.x1+20||wy<z.y0-20||wy>z.y1+20)return false;
  if(!g.ok){if(sel.some(alive))return false;banner(players.some(p=>p.downed&&!p.dead&&!p.carriedBy)?'Nobody goes in while someone’s down: revive him or carry him.':'Everyone who’s up has to be in the green area first.',2400);return true;}
  if(mon.scene&&mon.scene.q.length){if(mon.scene.kind==='after')mon.goIn=true;return true;}   // (the scene after the swarm is still going: in once it's over)
  goIn();return true;
}

/* ---------- after the attack (Bryan: a soldier screams "what the hell was that", the scientists beg to leave, the leader
   says no, they're going in, team on him; the scientists are told to stay on the bridge till it's cleared and zip-tied to
   its railings). Natural, not word for word: fear from one of the soldiers and the scientists, then the leader, unshaken. ---------- */
// a short scene: its lines one after another, each once the one before has finished (who, sp: whose voice, clip, text,
// col, radio, fn: something that happens as it's said)
function sceneStart(lines,gap=1,kind=''){mon.scene={q:lines.filter(Boolean),next:simT+gap,quiet:0,kind};}
function sceneTick(){
  const S=mon.scene;if(!S||!S.q.length||simT<S.next)return;
  const w0=S.q[0];if(w0.wait){if(!w0.wait()&&simT<(w0.until||(w0.until=simT+(w0.max||5))))return;S.q.shift();S.next=simT;return;}   // (waiting for something to happen: someone to get there)
  const now=performance.now()/1000;if(now<voiceBusyTill)return;
  const l=S.q.shift();if(l.fn)l.fn();if(!S.q.length)S.quiet=simT+4;if(!l.text){S.next=simT;return;}
  const w=l.who;if(!w||w.dead||(w.side==='P'&&!alive(w))){S.next=simT;return;}
  const d=l.clip?voiceClip(l.sp||w.id,l.clip,{radio:!!l.radio,x:w.x,y:w.y,vol:1.2,gain:1.15}):0,len=d||Math.max(1.8,l.text.length/13);
  callouts.push({x:w.x,y:w.y,t:0,dur:len+1.2,text:l.text,col:l.col||'#e6ecf0'});
  voiceBusyTill=now+len+.35;if(l.radio&&d){squelch(0);setTimeout(()=>squelch(0),(d+.1)*1000);}S.next=simT+.2;
}
const sceneOn=()=>!!(mon.scene&&(mon.scene.q.length||simT<mon.scene.quiet))||(typeof talkActive==='function'&&talkActive())||(typeof cineOn==='function'&&cineOn())||(typeof roadBusy==='function'&&roadBusy());   // (and the montage after the Headquarters: base.js)   // (the scientists keep their own lines to themselves meanwhile: office.js)
const sceneUp=p=>!!p&&alive(p)&&!p.offMap&&!p.downed;
const sciWith=()=>civs.filter(c=>c.sci&&c.detained&&!c.dead&&!c.offMap&&!c.gone);
const gateLead=()=>['A1','B1'].map(id=>players.find(p=>p.id===id&&sceneUp(p))).find(Boolean)||null;
// when the gate's clear (Bryan: the scientists are detained after the swarm and left outside before the squads go in): one
// of them screams, the scientists beg, the leader decides, then tells the scientists to stay on the bridge, and they're tied
// to its railings; then the squad gathers to go in
function gateAftermath(){
  const lead=gateLead(),yell=['B2','A2','B1'].map(id=>players.find(p=>p.id===id&&sceneUp(p)&&p!==lead)).find(Boolean),sci=sciWith(),s2=sci[1]||sci[0];
  sceneStart([yell&&{who:yell,clip:'gate_wth_1',text:'What the hell was that?!',col:'#ffb4a6',radio:!yell.joined},
    sci[0]&&{who:sci[0],sp:speakerOf(sci[0]),clip:'sci_leave_1',text:'We can still leave! Please. We can save ourselves!',col:'#ffd7cf'},
    s2&&{who:s2,sp:speakerOf(s2),clip:'sci_bred_1',text:'We bred those things. There’s worse in there!',col:'#ffd7cf'},
    lead&&{who:lead,clip:'gate_lead_1',text:'No. We’re moving in. Team on me. Be careful.',radio:true},
    lead&&sci.length&&{wait:()=>false,max:.7},
    ...tieSteps(lead),
    {fn:()=>{if(state!=='play'||MAPID!=='out')return;const g=gateReady();if(mon.goIn&&g&&g.ok){mon.goIn=false;goIn();return;}
      mon.goIn=false;banner('Gather at the drawbridge to go in. The Headquarters is inside.',3600);}}],1.4,'after');   // (a beat before he turns to them; a tap to go in during the scene is kept for its end)
}
// the scientists left on the drawbridge, tied to its railings till the Headquarters is cleared: the leader tells them, they
// walk out onto the deck, one of the others follows them out, ties them and comes back, and one of them pleads
const RAIL_SPOTS=[[826,-586,0],[874,-586,Math.PI],[826,-612,0],[874,-612,Math.PI]];   // (the deck: x 815-885, y -560 to -634; facing in)
const DECK={x:850,y:-546};   // (the bridge's foot, on the gather area's edge: from there straight out onto the deck)
function toDeck(u,x,y){const p=hyp(u.x-DECK.x,u.y-DECK.y)>12&&findPath(u.x,u.y,DECK.x,DECK.y,FOOT)||[];return[...p,{x:DECK.x,y:DECK.y},{x,y}];}
function tieSteps(lead){
  const sci=sciWith().filter(c=>!c.railed);if(!sci.length)return[];
  const T={};
  const go=()=>{sci.forEach((c,i)=>{const s=RAIL_SPOTS[i%4];c.railed={x:s[0]+(i>3?6:0),y:s[1],ang:s[2]};c.minder=null;c.path=toDeck(c,c.railed.x,c.railed.y);});
    const t=T.u=players.filter(p=>sceneUp(p)&&p!==lead&&!p.carry).sort((a,b)=>hyp(a.x-DECK.x,a.y-DECK.y)-hyp(b.x-DECK.x,b.y-DECK.y))[0];
    if(t){T.back={x:t.x,y:t.y};t.path=toDeck(t,850,-572);t.lastOrder=simT;}};   // (the leader stays with the squad)
  const there=()=>sci.every(c=>c.dead||!c.path.length)&&(!T.u||!alive(T.u)||!T.u.path.length);
  const tied=()=>{sci.forEach((c,i)=>setTimeout(()=>sfxZip(c.x,c.y),i*380));const t=T.u;if(!t||!alive(t))return;t.ang=-Math.PI/2;callout(t,'Zip-tied',C.good);
    if(t.y>-552)return;const z=MON_OUT,b=T.back,home=b.x>=z.x0&&b.x<=z.x1&&b.y>=z.y0&&b.y<=z.y1?b:(openSpot(850,-522,players.filter(p=>p!==t&&!p.dead).map(destOf))||{x:850,y:-522});
    t.path=[{x:DECK.x,y:DECK.y},{x:home.x,y:home.y}];t.lastOrder=simT;};   // (back to the others, unless he's been sent somewhere else meanwhile)
  return[lead?{who:lead,clip:'gate_stay_1',text:'You stay on the bridge till we’ve cleared it.',radio:true,fn:go}:{fn:go},
    {wait:there,max:14},{fn:tied},
    {who:sci[0],sp:speakerOf(sci[0]),clip:'sci_left_1',text:'Don’t leave us out here! Please!',col:'#ffd7cf'}];
}
// into the Headquarters (a tap on the gather area); any scientist not left on the bridge yet is tied up first
function goIn(){
  if(obj>=6){enterBase(true);return;}   // (the Headquarters is the squad's: back into it, base.js)
  if(typeof enterHQ!=='function')return;
  if(sciWith().some(c=>!c.railed)){sceneStart([...tieSteps(gateLead()),{fn:()=>{if(state==='play'&&MAPID==='out')enterHQ();}}],.3,'tie');return;}
  enterHQ();
}
// a Continue from the gate's save: they're back at the railings, tied (the save is made as the gate clears; the scene isn't played again)
function railNow(){sciWith().forEach((c,i)=>{const s=RAIL_SPOTS[i%4];c.railed={x:s[0]+(i>3?6:0),y:s[1],ang:s[2]};Object.assign(c,{x:c.railed.x,y:c.railed.y,ang:s[2],path:[],minder:null});});}

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
  if(g&&!(mon.scene&&mon.scene.kind==='tie'&&mon.scene.q.length)){   // (not while the scientists are being tied up: they're going in)
    const z=MON_OUT;toSBack=false;const c=[[z.x0,z.y0],[z.x1,z.y0],[z.x1,z.y1],[z.x0,z.y1]].map(([x,y])=>toS(x,y,.4));
    if(!toSBack){ox.beginPath();ox.moveTo(...c[0]);for(const p of c)ox.lineTo(...p);ox.closePath();ox.fillStyle=`rgba(95,224,142,${(.06+pulse*.05).toFixed(3)})`;ox.fill();
      ox.setLineDash([10,7]);ox.lineDashOffset=-now*14;ox.strokeStyle='rgba(95,224,142,.95)';ox.lineWidth=2.4;ox.stroke();ox.setLineDash([]);
      const[lx,ly]=below((z.x0+z.x1)/2,z.y0,10);label(g.ok?(mon.goIn?'GOING IN':'TAP TO GO IN'):`HEADQUARTERS · ${g.n}/${g.of}`,lx,ly-26,C.good,10,700);}}
}

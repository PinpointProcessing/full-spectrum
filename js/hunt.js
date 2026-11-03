"use strict";
/* Enemies that hunt and call it in (docs/feel-plan.md, step 2; Bryan: "the enemies don't chase and don't set alarms").
   - Noise is local everywhere: gunfire alerts the hostiles who'd hear it (in sight within OUT_HEAR_OPEN, through
     containers and walls within OUT_HEAR_WALL; inside the office building interior.js's numbers), a man who spots the squad
     shouts to those within SHOUT_R, and a radio man can call it in for everyone.
   - Every alerted hostile remembers where he last saw or heard the squad (e.lkp). Out of sight for LOST_T s he hunts: the
     nearest PUSHERS push there cover to cover, the rest search hiding places round it (nobody checks the same spot twice);
     after HUNT_T s with nothing they give up and take new posts where they lost you, unaware again but jumpy. Posts and
     machine gunners hold their spot; nobody strays more than LEASH from where he started.
   - Contact ends when no alerted hostile has seen the squad for a while (CONTACT_END s outdoors, IN_QUIET inside) and
     nothing has been fired for 3 s: weapons tight again, takedowns and ambushes possible.
   - Flanking: a soldier who stays in cover from a man for FLANK_T s gets one man (one at a time) working round to a spot
     that sees past it.
   - Radio men (a set with an antenna on the back) start a CALL_T s call once alerted; pinning him pauses it, killing him
     stops it. A call that goes out alerts the whole area and, outdoors, brings REINF_N men REINF_WARN s later (at most
     REINF_MAX waves per objective) who hunt from where the squad was last seen.
   - Enemies talk: within earshot their lines show by them, one at a time.
   - Guard dogs (Bryan: they count as human-only) walk beside their handler, smell and hear all round, bark when they find
     you (which carries), run you down and bite, knocking a soldier off his feet for a moment. */
const OUT_HEAR_OPEN=350,OUT_HEAR_WALL=150,SHOUT_R=250,IN_SHOUT=180;
const LOST_T=2.5,HUNT_T=35,CONTACT_END=10,LEASH=320,FLANK_T=4,PUSHERS=2;
const CALL_T=5,REINF_N=3,REINF_WARN=10,REINF_MAX=2;
const DOG={walk:30,run:72,bite:14,biteT:1.6,stun:.5,smell:170,hp:45};
let huntTickT=0,barkAllT=0,reinf=null,reinfLeft={},reinfN=0,searched=[];
function resetHunt(){huntTickT=0;barkAllT=0;reinf=null;reinfLeft={};reinfN=0;searched=[];}

/* ---------- who hears what ---------- */
function alertOne(e,lk,ambush){
  if(e.surr)return;   // he gave up (layers.js)
  e.alerted=true;e.alertAt=simT;e.aware=1;e.jumpy=true;e.hunt=null;e.huntT0=0;e.wary=false;e.sawT=simT;   // (what he heard counts as a sighting for now: he hunts LOST_T s later)
  if(lk)e.lkp={x:lk.x,y:lk.y,t:simT};
  if(ambush)e.cool=Math.max(e.cool,1.4+Math.random()*.6);
}
function startContact(msg,amb){
  if(contact)return;contact=true;
  say(players.find(alive),amb?'ack_attack':'contact');
  if(amb)ambushT=simT+AMBUSH_T;
  banner(amb?'Ambush! They never saw it coming.':msg||'Contact. They know you are here.',2200);setStatus();
}
// outdoors: who hears a sound at (x,y) (and where a shot lands, x2,y2); lk is where they'll think the squad is
function alertOut(x,y,msg,ambush,x2,y2,lk,open=OUT_HEAR_OPEN,wall=OUT_HEAR_WALL){
  const pts=x2==null?[[x,y]]:[[x,y],[x2,y2]];let any=false;
  for(const e of enemies){
    if(e.dead||e.alerted||e.surr)continue;
    if(!pts.some(([px,py])=>{const d=hyp(e.x-px,e.y-py);return d<=wall||(d<=open&&gridSight(px,py,e.x,e.y));}))continue;
    alertOne(e,lk||{x,y},ambush);any=true;
  }
  if(any)startContact(msg,ambush);
  return any;
}
// a man who spots the squad shouts: those near him know too
function shout(e,src){
  alertOne(e,src,false);bark(e,'spot',true);
  if(MAPID==='in')alertNear(e.x,e.y,null,false,null,null,src,IN_SHOUT,IN_SHOUT*.5);
  else alertOut(e.x,e.y,null,false,null,null,src,SHOUT_R,SHOUT_R*.5);
  startContact('Contact. You have been spotted.',false);
}
// an alerted man who can see a soldier: where he is now
function seenBy(e){let best=null,bd=1e9;for(const p of players){if(!alive(p)||p.offMap)continue;const d=hyp(p.x-e.x,p.y-e.y);if(d<=380&&d<bd&&fireLine(e,p)){bd=d;best=p;}}return best;}

/* ---------- the hunt ---------- */
// alerted, but nobody in sight for LOST_T s: push to where they were, or search round it; give up after HUNT_T s
function huntThink(e){
  if(!e.home)e.home={x:e.x,y:e.y};
  const L=e.lkp;
  if(!e.huntT0){
    e.huntT0=simT;
    const pushing=enemies.filter(o=>o!==e&&!o.dead&&o.hunt==='push'&&o.lkp&&hyp(o.lkp.x-L.x,o.lkp.y-L.y)<120).length;
    e.hunt=pushing<PUSHERS?'push':'search';bark(e,(e.sawT??-99)>0?'lost':'search');
  }
  if(simT-e.huntT0>HUNT_T){giveUp(e);return;}
  if(simT<e.moveCool)return;
  const ok=c=>hyp(c.x-e.home.x,c.y-e.home.y)<=LEASH&&(MAPID!=='in'||floorOf(c.x,c.y)===e.floor);
  if(e.hunt==='push'){
    const d0=hyp(e.x-L.x,e.y-L.y);
    if(d0<45){e.hunt='search';return;}
    let best=null,bs=-1e9;   // cover to cover towards where they were
    for(const c of coverPts){
      const d=hyp(c.x-e.x,c.y-e.y);if(d>140||d<20||!ok(c))continue;
      const dl=hyp(c.x-L.x,c.y-L.y);if(dl>d0-10)continue;
      const sc=-dl/40-d/120;if(sc>bs){bs=sc;best=c;}
    }
    const tgt=best||(ok(L)?L:null),p=tgt&&findPath(e.x,e.y,tgt.x,tgt.y,FOOT);
    if(p){e.path=p;e.moveCool=simT+1.5+Math.random();}else{e.hunt='search';e.moveCool=simT+1;}
    return;
  }
  // search: the hiding places round the last known position that nobody has checked
  let best=null,bs=-1e9;
  for(const c of coverPts){
    const dl=hyp(c.x-L.x,c.y-L.y);if(dl>150||!ok(c))continue;
    if(searched.some(s=>hyp(s.x-c.x,s.y-c.y)<40))continue;
    if(enemies.some(o=>o!==e&&!o.dead&&o.path.length&&hyp(destOf(o).x-c.x,destOf(o).y-c.y)<40))continue;
    const d=hyp(c.x-e.x,c.y-e.y),hidden=gridSight(e.x,e.y,c.x,c.y)?0:1,sc=hidden*1.2-dl/100-d/150+Math.random()*.3;
    if(sc>bs){bs=sc;best=c;}
  }
  const p=best&&findPath(e.x,e.y,best.x,best.y,FOOT);
  if(p){e.path=p;searched.push({x:best.x,y:best.y,t:simT});e.moveCool=simT+2+Math.random()*2;if(Math.random()<.3)bark(e,'search');}
  else e.moveCool=simT+2;
}
function giveUp(e){
  Object.assign(e,{alerted:false,aware:.5,wary:true,jumpy:true,hunt:null,huntT0:0,lkp:null,susp:null,zone:{x0:e.x-90,x1:e.x+90,y0:e.y-90,y1:e.y+90}});
  bark(e,'giveup');setStatus();
}
// a soldier who has stayed in cover from e for FLANK_T s: one man works round to a spot that sees past it
function flankThink(e,vis,hurt){
  if(e.dog||hurt||!vis.length)return false;
  let tg=vis[0];for(const p of vis)if(hyp(p.x-e.x,p.y-e.y)<hyp(tg.x-e.x,tg.y-e.y))tg=p;
  e.covT=coverAt(tg.x,tg.y,e.x,e.y)>0?(e.covT||0)+.4:0;
  if(e.covT<FLANK_T||simT<e.moveCool||enemies.some(o=>o.flanking&&!o.dead&&o.path.length))return false;
  if(!e.home)e.home={x:e.x,y:e.y};
  const th=players.filter(alive).map(p=>({x:p.x,y:p.y}));let best=null,bs=-1e9;
  for(const c of coverPts){
    const dp=hyp(c.x-tg.x,c.y-tg.y),de=hyp(c.x-e.x,c.y-e.y);if(dp<70||dp>200||de>220||de<20)continue;
    if(hyp(c.x-e.home.x,c.y-e.home.y)>LEASH||(MAPID==='in'&&floorOf(c.x,c.y)!==e.floor))continue;
    if(coverAt(tg.x,tg.y,c.x,c.y)>0||!los(c.x,c.y,tg.x,tg.y))continue;   // from there his cover doesn't help him
    const sc=protStats(c,th).prot/th.length-de/150;if(sc>bs){bs=sc;best=c;}
  }
  const p=best&&findPath(e.x,e.y,best.x,best.y,FOOT);
  if(!p){e.covT=0;e.moveCool=simT+3;return false;}
  e.path=p;e.flanking=true;e.covT=0;e.moveCool=simT+8;bark(e,'flank');return true;
}

/* ---------- radio men and reinforcements ---------- */
function addRadioKit(u){
  u.radio=true;const m=new T.MeshStandardMaterial({color:0x1d2216,roughness:.8});
  const box=new T.Mesh(new T.BoxGeometry(3.5,5,4.5),m);box.position.set(-4.6,11,0);u.m.pose.add(box);
  const ant=new T.Mesh(new T.CylinderGeometry(.2,.2,13,4),new T.MeshStandardMaterial({color:0x101010,roughness:.6}));ant.position.set(-5.2,18.5,-1.3);ant.rotation.z=.08;u.m.pose.add(ant);
}
function radioTick(dt){
  for(const e of enemies){
    if(!e.radio)continue;
    if(e.dead){if(e.call){e.call=null;banner('Radio call cut off.',2000);}continue;}
    if(!e.call&&!e.called&&e.alerted&&!e.grabbed){e.call={t:0};bark(e,'radio',true);if(typeof sfxRadio==='function')sfxRadio(e.x,e.y);}
    if(e.call){if(e.sup<=PINNED&&!e.grabbed)e.call.t+=dt;if(e.call.t>=CALL_T){e.call=null;e.called=true;callIn(e);}}
  }
}
function callIn(e){
  const lk=e.lkp||{x:e.x,y:e.y};
  for(const o of enemies)if(!o.dead&&!o.alerted&&(MAPID!=='in'||o.floor===e.floor))alertOne(o,lk,false);
  startContact(null,false);
  if(typeof sfxSiren==='function')sfxSiren(e.x,e.y);
  const left=reinfLeft[obj]??REINF_MAX;
  if(MAPID==='out'&&left>0&&!reinf){reinfLeft[obj]=left-1;reinf={at:simT+REINF_WARN,lk:{x:lk.x,y:lk.y},from:{x:e.x,y:e.y},obj};banner('They called it in. Reinforcements are coming.',3000);}
  else banner('They called it in. Everyone knows you are here.',2600);
  raiseAlert(5,'radio',false);   // a whole stage of the base's alert (layers.js); its own banner above says enough
}
const reinfPending=n=>!!reinf&&reinf.obj===n;
function reinfTick(){
  if(!reinf)return;
  if(reinf.obj!==obj||MAPID!=='out'||state!=='play'){reinf=null;return;}   // the area changed meanwhile
  if(simT<reinf.at)return;
  const f=reinf.from,spots=[];
  const cands=coverPts.filter(c=>{const d=hyp(c.x-f.x,c.y-f.y);return d>60&&d<360&&!postSeen(c.x,c.y)&&!players.some(p=>alive(p)&&hyp(p.x-c.x,p.y-c.y)<200);})
    .sort((a,b)=>hyp(a.x-f.x,a.y-f.y)-hyp(b.x-f.x,b.y-f.y));
  for(const c of cands){if(spots.length>=REINF_N)break;if(!spots.some(s=>hyp(s.x-c.x,s.y-c.y)<20))spots.push(c);}
  if(!spots.length){reinf.at=simT+2;return;}   // nowhere out of sight yet: a little later
  let first=null;
  for(const s of spots){
    const u=hostile('R'+(++reinfN),s.x,s.y,{ang:Math.atan2(reinf.lk.y-s.y,reinf.lk.x-s.x)});
    alertOne(u,reinf.lk,false);Object.assign(u,{home:{x:s.x,y:s.y},hunt:'push',huntT0:simT,sawT:-99,zone:{x0:s.x-150,x1:s.x+150,y0:s.y-150,y1:s.y+150}});
    if(groups[obj])groups[obj].push(u);first=first||u;
  }
  enemies=units.filter(u=>u.side==='E');
  banner('Enemy reinforcements!',2200);bark(first,'backup',true);
  reinf=null;
}

/* ---------- barks ---------- */
const BARKS={spot:['There!','Contact!','Over there!'],lost:['Lost him!','Where did they go?','Where are they?'],search:['Spread out!','Check the corners!','Keep looking!'],
  flank:['Flanking!','Moving round!','Going wide!'],pinned:["I'm pinned!",'Covering fire!'],down:['Man down!','We lost one!'],radio:['Calling it in!','Command, we have contact!'],
  backup:["Backup's here!",'Reinforcements in!'],reload:['Reloading!','Changing belts!'],giveup:['Nothing here.','They are gone.','Back to your posts.'],dog:['Release the dog!','Go get them!'],
  body:['Man down here!','Body! Over here!','We have a body!'],what:['What was that?','Hey... what is that?','Something over there.'],grenade:['Grenade out!','Frag out!','Fire in the hole!']};   // (the last three: layers.js)
function bark(e,k,force){
  if(!e||e.dead||e.dog)return;if(!force&&(simT<(e.barkT||0)||simT<barkAllT))return;
  if(!players.some(p=>alive(p)&&!p.offMap&&hyp(p.x-e.x,p.y-e.y)<340))return;   // out of earshot
  if(MAPID==='in'&&offFloor(e))return;
  const L=BARKS[k];if(!L)return;e.barkT=simT+4;barkAllT=simT+1.4;
  callout(e,L[Math.floor(Math.random()*L.length)],'#ff9a80');
}

/* ---------- guard dogs ---------- */
function dog(id,x,y,extra){
  const u=mk('E','E',id,'Dog',x,y,extra.ang??0);Object.assign(u,{dog:true,hp:DOG.hp,jumpy:true},extra);makeDog(u);return u;
}
function makeDog(u){
  const g=new T.Group(),pose=new T.Group();g.add(pose);
  const fur=new T.MeshStandardMaterial({color:0x3a2a1c,roughness:.95}),dark=new T.MeshStandardMaterial({color:0x1a120c,roughness:.9});
  const box=(w,h,d,m,x,y,z)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=true;pose.add(b);return b;};
  box(13,4.6,4.6,fur,0,6.6,0);box(4.4,4,3.8,fur,7.6,8.6,0);box(3,2,2.4,dark,10.6,7.8,0);box(1,2,1,dark,7,11.2,1.2);box(1,2,1,dark,7,11.2,-1.2);   // body (front is +x), head, snout, ears
  const legs=[];for(const[x,z]of[[4.6,1.6],[4.6,-1.6],[-4.6,1.6],[-4.6,-1.6]])legs.push(box(1.4,5,1.4,dark,x,2.5,z));
  const tail=box(5,1,1,fur,-8.4,8.4,0);tail.rotation.z=.5;
  const ring=new T.Mesh(SG.ring,new T.MeshBasicMaterial({color:new T.Color(teamCol(u)),transparent:true,opacity:.85,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.5;ring.scale.setScalar(.8);g.add(ring);
  scene.add(g);u.m={g,pose,ring,spot:null,legs,tail};
}
function dogPose(u,t){   // a trot when moving, a wag, on its side when dead
  const m=u.m,mv=!!u.path.length&&!u.dead;
  m.pose.rotation.x+=((u.dead?Math.PI/2:0)-m.pose.rotation.x)*.2;m.pose.position.y=u.dead?2:mv?Math.abs(Math.sin(t*14+u.x))*.6:0;
  m.legs.forEach((l,i)=>{l.rotation.z=mv?Math.sin(t*(u.alerted?16:9)+(i===0||i===3?0:Math.PI))*.55:0;});
  m.tail.rotation.y=Math.sin(t*(u.alerted?4:9))*.5;m.ring.visible=!u.dead;
}
// a dog smells and hears all round (through walls close by): a soldier near him is found, sneaking or not, just slower
function dogSense(d,dt){
  let gain=0,src=null,best=0;
  for(const p of players){
    if(!alive(p)||p.offMap)continue;const dd=hyp(p.x-d.x,p.y-d.y);if(dd>DOG.smell)continue;
    const seen=fireLine(d,p);if(!seen&&dd>90)continue;
    let g=1.4*(1-dd/DOG.smell)*(p.path.length?(p.gait==='sneak'?.5:1):.3)*(seen?1.4:1);
    gain+=g;if(g>best){best=g;src=p;}
  }
  if(gain>0){d.aware=Math.min(1,d.aware+gain*dt);d.susp={x:src.x,y:src.y};}else d.aware=Math.max(0,d.aware-AWARE_FADE*dt);
  if(d.aware>=1){if(typeof sfxBark==='function')sfxBark(d.x,d.y);shout(d,src);}
}
function dogTick(dt){
  for(const d of enemies){
    if(!d.dog||d.dead)continue;
    const h=d.handler&&!d.handler.dead?d.handler:null;
    if(!d.alerted){
      if(d.handler&&!h&&hyp(d.x-d.handler.x,d.y-d.handler.y)<80){alertOne(d,{x:d.x,y:d.y},false);continue;}   // his handler dropped beside him
      if(h&&h.alerted){alertOne(d,h.lkp,false);bark(h,'dog',true);continue;}   // let loose
      if(h&&!d.path.length&&hyp(d.x-h.x,d.y-h.y)>26){const p=findPath(d.x,d.y,h.x+Math.cos(h.ang+2)*12,h.y+Math.sin(h.ang+2)*12,FOOT);if(p)d.path=p;}
      if(h&&!d.path.length)d.ang=turn(d.ang,h.ang,dt*3);
      continue;
    }
    // loose: runs the nearest soldier down by scent, barks (it carries), bites at close range
    let tg=null,bd=600;for(const p of players){if(!alive(p)||p.offMap||(MAPID==='in'&&floorOf(p.x,p.y)!==d.floor))continue;const dd=hyp(p.x-d.x,p.y-d.y);if(dd<bd){bd=dd;tg=p;}}
    if(!tg)continue;
    if(simT>(d.barkTk||0)){d.barkTk=simT+2.5;if(typeof sfxBark==='function')sfxBark(d.x,d.y);if(MAPID==='in')alertNear(d.x,d.y,null,false,null,null,{x:tg.x,y:tg.y},200,100);else alertOut(d.x,d.y,null,false,null,null,{x:tg.x,y:tg.y},220,120);}
    if(bd<20){
      d.path=[];d.ang=Math.atan2(tg.y-d.y,tg.x-d.x);
      if(simT>(d.biteT||0)){d.biteT=simT+DOG.biteT;damage(tg,DOG.bite*(.8+Math.random()*.4),d);if(alive(tg)){tg.stunT=simT+DOG.stun;tg.path=[];}callout(tg,'Dog!',C.bad);}
    }else if(bd<45&&los(d.x,d.y,tg.x,tg.y)){d.path=[{x:tg.x-(tg.x-d.x)/bd*10,y:tg.y-(tg.y-d.y)/bd*10}];}   // the last few metres: straight at him
    else if(simT>(d.repath||0)){d.repath=simT+.5;const p=findPath(d.x,d.y,tg.x,tg.y,FOOT);if(p)d.path=p;}
  }
}

/* ---------- a radio call or reinforcements on the way: the top-centre countdown (every frame) ---------- */
// it takes the detection ring's place meanwhile (alertMeter), so nothing piles up at the top
let threatShown='';
function threatOn(){return state==='play'&&(!!reinf||enemies.some(e=>e.call&&!e.dead));}
function threatHud(){
  if(!threatOn()){threatShown='';return;}   // (waveHud hides the countdown when it isn't its own)
  const cd=$('#countdown'),caller=enemies.find(e=>e.call&&!e.dead);
  const txt=caller?'Radio call':'Reinforcements',left=caller?Math.max(0,CALL_T-caller.call.t):Math.max(0,reinf.at-simT);
  cd.hidden=false;if(threatShown!==txt){threatShown=txt;cd.querySelector('small').textContent=txt;}
  cd.querySelector('b').textContent=left.toFixed(1);cd.setAttribute('aria-label',`${txt} in ${Math.ceil(left)}`);
}
/* ---------- every tick (from update) ---------- */
function huntTick(dt){
  radioTick(dt);reinfTick();dogTick(dt);
  if((huntTickT-=dt)>0)return;huntTickT=.5;
  if(searched.length)searched=searched.filter(s=>simT-s.t<40);
  for(const e of enemies)if(e.flanking&&!e.path.length)e.flanking=false;
  // contact ends once no alerted hostile on the squad's ground has seen them for a while, and nothing's been fired
  if(contact&&state==='play'){
    const inside=MAPID==='in',quiet=inside?IN_QUIET:CONTACT_END;
    const floors=inside?new Set(players.filter(p=>alive(p)&&!p.offMap).map(p=>floorOf(p.x,p.y))):null;
    const seen=enemies.some(e=>!e.dead&&e.alerted&&(!floors||floors.has(e.floor))&&simT-(e.sawT??-99)<quiet);
    if(!seen&&simT-lastNoiseT>3&&!reinf){
      contact=false;setStatus();
      if(enemies.some(e=>!e.dead&&e.alerted))banner('They lost you. They are searching.',2400);   // (nobody left looking: no message, the location's own messages take over)
    }
  }
}

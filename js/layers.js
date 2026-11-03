"use strict";
/* The later layers (docs/feel-plan.md, step 5; Bryan: "I like all these ideas"):
   - The base alert level only goes up within the mission: four stages of ALERT_TICKS ticks each, raised by a radio call
     that went out (a whole stage), a body found (2), each 15 s in a fight (1) and each explosion (1); it eases a tick per
     20 s of quiet but never below the stage reached. Stage 1: their eyes reach 15 % further. Stage 2: helmets and vests,
     20 % less damage. Stage 3: lockdown, a hunter team comes for you if any are left. A meter under the detection ring
     shows it; the after-action report rewards a quiet run.
   - Bodies: a hostile who sees a body of his own area (one he didn't already know about: he hasn't been alerted since)
     walks over and raises the alarm ("Man down here!"): those near him search round it, unaware of where the squad is
     (no contact), and the base's alert goes up. The radio net checks in now and then; a dead man nobody knew about is
     missed, and the two nearest men go and look.
   - Surrender: a hostile who's badly hurt, pinned and has no one near to back him up may give up ("Don't shoot!"): he
     drops his rifle and kneels, and counts as down. A soldier tapping him zip-ties him.
   - Enemy grenades: an alerted rifleman throws one (each carries one) at a soldier who's sat in the same spot within 17 m
     for 8 s: "Grenade!" and a red circle where it'll land; soldiers inside who haven't just been given an order get out.
   - The contact sensor (our own take on a motion tracker): every SENSOR.every s it checks round the squad; a hostile
     moving out of sight within SENSOR.range leaves a fading blip, a ring sweeps out and it pings softly, faster and higher
     as the nearest closes in. Nothing moving: no ring, no sound. */
const ALERT_TICKS=5,ALERT_NAMES=['Calm','Alert I','Alert II','Lockdown'];
const SURRENDER={hp:40,alone:150,chance:.5,every:5},ZIP_T=2,ENADE={camp:8,range:170,warn:1.8,r:60};
const SENSOR={every:1.6,range:450,blip:1.6};
let alertT=0,alertMax=0,alertQuietT=0,alertFightT=0,bodies=[],checkT=0,sensorT=0,blips=[],sweepT=-9,zipGo=null,lastPing=-9;
function resetLayers(){alertT=0;alertMax=0;alertQuietT=0;alertFightT=0;bodies=[];checkT=40;sensorT=0;blips=[];sweepT=-9;zipGo=null;lastPing=-9;}
const alertStage=()=>Math.min(3,Math.floor(alertT/ALERT_TICKS));
const eyeR=()=>alertStage()>=1?345:300;   // how far an unaware hostile's eyes reach: 15 % further once the base is on alert (sense in combat.js, the cones)

/* ---------- the base alert level ---------- */
// msg: what to say if the stage doesn't change (false: say nothing at all, the caller has its own message)
function raiseAlert(n,why,msg){
  const s0=alertStage();alertT=Math.min(ALERT_TICKS*3+ALERT_TICKS-1,alertT+n);alertMax=Math.max(alertMax,alertStage());alertQuietT=0;
  const s=alertStage(),up=s>s0;
  const ga=nearArea();
  if(up&&s===3&&MAPID==='out'&&!reinf&&(reinfLeft[ga]??REINF_MAX)>0){   // lockdown: a hunter team, from beyond where they last had the squad
    reinfLeft[ga]=(reinfLeft[ga]??REINF_MAX)-1;const lk=(enemies.find(e=>e.lkp&&!e.dead)||{}).lkp||{x:camT.x,y:camT.z};
    reinf={at:simT+REINF_WARN,lk:{x:lk.x,y:lk.y},from:{x:lk.x,y:lk.y-250},obj:ga};
  }
  if(msg===false)return up;
  if(up)banner(s===1?'The base is on alert: they look harder now.':s===2?'Alert II: helmets and vests on.':'Lockdown: a hunter team is coming for you.',2800);
  else if(msg)banner(msg,2400);
  return up;
}
function alertLayerTick(dt){
  if(contact){alertFightT+=dt;if(alertFightT>=15){alertFightT=0;raiseAlert(1,'fight');}alertQuietT=0;}
  else{alertQuietT+=dt;if(alertQuietT>=20){alertQuietT=0;if(alertT>alertStage()*ALERT_TICKS)alertT--;}}
}
// under the detection ring: the base's stage and three segments filling towards Alert I, Alert II and lockdown
let lvlEl=null,lvlShown='';
function alertHud(){
  const el=lvlEl||(lvlEl=$('#alertLvl'));if(!el)return;
  const show=state==='play'&&alertT>0&&!threatOn();if(el.hidden===show)el.hidden=!show;if(!show)return;
  const s=alertStage(),k=(alertT-s*ALERT_TICKS)/ALERT_TICKS,key=s+':'+k;if(key===lvlShown)return;lvlShown=key;
  el.className='s'+s;el.querySelector('b').textContent='Base · '+ALERT_NAMES[s];el.setAttribute('aria-label','Base alert: '+ALERT_NAMES[s]);
  el.querySelectorAll('i').forEach((seg,i)=>seg.style.setProperty('--k',i<s?'1':i===s?k.toFixed(2):'0'));
}

/* ---------- bodies and check-ins ---------- */
function addBody(e){if(!e.dog&&!e.veh)bodies.push({x:e.x,y:e.y,t:simT,found:false,id:e.id,area:MAPID==='in'?'in':obj,map:MAPID,floor:e.floor});}
// a body he didn't already know about: one of his own area, from after the last time he was alerted (a man who heard the
// fight knows; and a fresh garrison doesn't care about the last area's dead)
const newsTo=(e,b)=>!b.found&&b.map===MAPID&&b.area===(MAPID==='in'?'in':obj)&&(MAPID!=='in'||b.floor===e.floor)&&(e.alertAt??-99)<b.t-.5;
// he found it: he and those who hear him search round it (they don't know where the squad is: no contact); the base's alert goes up
function bodyAlarm(e,b){
  b.found=true;e.bodyGo=null;const lk={x:b.x,y:b.y},R=MAPID==='in'?IN_SHOUT:SHOUT_R;
  for(const o of enemies){
    if(o.dead||o.surr||o.alerted||(MAPID==='in'&&o.floor!==e.floor))continue;
    const d=hyp(o.x-e.x,o.y-e.y);if(o===e||d<=R*.5||(d<=R&&gridSight(e.x,e.y,o.x,o.y))){alertOne(o,lk,false);o.sawT=-99;}   // (-99: nobody's seen the squad, they search straight away)
  }
  bark(e,'body',true);setStatus();raiseAlert(2,'body','They found a body. They are searching.');chatBodyFound();
}
// an unaware hostile who sees a body walks over to it (one on a post or a gun raises the alarm from where he is)
function seeBodies(e){
  if(e.dead||e.alerted||e.dog||e.surr||e.grabbed)return;
  if(e.bodyGo){
    const b=e.bodyGo;if(b.found){e.bodyGo=null;return;}
    if(hyp(e.x-b.x,e.y-b.y)<40)bodyAlarm(e,b);
    else if(!e.path.length){const p=findPath(e.x,e.y,b.x,b.y,FOOT);if(p)e.path=p;else e.bodyGo=null;}
    return;
  }
  // it takes him a moment to take it in (about 1 s close up, 2-3 s far off): he turns to look, and the detection ring fills
  let best=null,bk=0;
  for(const b of bodies){
    if(!newsTo(e,b))continue;
    const d=hyp(b.x-e.x,b.y-e.y);if(d>250)continue;
    let da=Math.atan2(b.y-e.y,b.x-e.x)-e.ang;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)>1.08||!los(e.x,e.y,b.x,b.y))continue;
    const k=1.4*(1-d/280);if(k>bk){bk=k;best=b;}
  }
  if(!best){e.bodyK=Math.max(0,(e.bodyK||0)-.05);return;}
  e.bodyK=(e.bodyK||0)+bk*.1;e.susp={x:best.x,y:best.y};e.aware=Math.max(e.aware,Math.min(.6,e.bodyK*.6));   // (called every 0.1 s)
  if(e.bodyK<1)return;
  e.bodyK=0;
  if(e.post||e.gunner||e.elev){bodyAlarm(e,best);return;}   // he can't leave his post: he raises it from there
  e.bodyGo=best;e.path=[];e.wary=true;callout(e,'?',C.warn);bark(e,'what');
}
// now and then the radio net calls one of the current objective's men; a dead one is missed, and two men go and look
function checkInTick(dt){
  if(MAPID!=='out'||state!=='play')return;
  if((checkT-=dt)>0)return;checkT=45+Math.random()*20;
  const g=enemies.filter(e=>!e.dog&&!e.veh&&e.grp!=null&&!finished[e.grp]);if(g.length<3)return;   // (every area still held)
  const live=g.filter(e=>!e.dead&&!e.surr),bodyOf=e=>bodies.find(b=>b.id===e.id&&b.map==='out');
  const silent=g.filter(e=>{if(!e.dead||e.checked)return false;const b=bodyOf(e);return!!b&&!b.found&&!live.some(o=>(o.alertAt??-99)>=b.t-.5);});   // nobody knew he'd gone
  if(!silent.length)return;
  const v=silent[0],b=bodyOf(v);v.checked=true;
  const go=live.filter(e=>!e.alerted&&!e.post&&!e.gunner&&!e.bodyGo).sort((a,c)=>hyp(a.x-b.x,a.y-b.y)-hyp(c.x-b.x,c.y-b.y)).slice(0,2);
  if(!go.length)return;
  banner('Enemy radio check-in: no answer. They are sending men to look.',3000);
  for(const e of go){e.bodyGo=b;e.path=[];e.aware=Math.max(e.aware,.55);e.wary=true;}
}

/* ---------- surrender and zip ties ---------- */
function moraleBreak(e){
  if(e.surr||e.dog||e.gunner||e.post||e.rpg||e.hp>=SURRENDER.hp||e.sup<=PINNED||simT<(e.surrNext||0))return false;
  if(enemies.some(o=>o!==e&&!o.dead&&!o.surr&&!o.dog&&(MAPID!=='in'||o.floor===e.floor)&&hyp(o.x-e.x,o.y-e.y)<SURRENDER.alone))return false;
  e.surrNext=simT+SURRENDER.every;if(Math.random()>SURRENDER.chance)return false;   // one roll every few seconds while it holds
  Object.assign(e,{surr:true,path:[],alerted:false,aware:0,wary:false,call:null,hunt:null,huntT0:0,lkp:null,flanking:false,bodyGo:null});
  {const i=(Math.random()*3)|0;callout(e,BARKS.surrender[i],'#ffcf4a');if(typeof voiceClip==='function')voiceClip('E'+(1+(hashId(e.id)%3)),`bark_surrender_${i+1}`,{x:e.x,y:e.y});}setStatus();
  if(!(e.grp!=null&&groups[e.grp]&&groupDone(e.grp)))banner('A hostile surrenders. Tap him to zip-tie him.',2400);   // (the last man: the checkpoint's message comes instead, and the hint line says it)
  return true;
}
function orderZip(list,e){
  const u=list.filter(p=>alive(p)&&!p.carry).sort((a,b)=>hyp(a.x-e.x,a.y-e.y)-hyp(b.x-e.x,b.y-e.y))[0];if(!u)return false;
  const s=openSpot(e.x,e.y,players.filter(o=>o!==u&&!o.dead).map(destOf))||{x:e.x,y:e.y},p=hyp(u.x-e.x,u.y-e.y)<20?[]:findPath(u.x,u.y,s.x,s.y);
  if(!p){banner('No way to reach him.');return false;}
  u.path=p;u.lastOrder=simT;u.watch=null;zipGo={u,e,prog:0};callout(u,'Hands where I can see them!',C.good);return true;
}
function zipTick(dt){
  const z=zipGo;if(!z)return;const{u,e}=z;
  if(!alive(u)||e.dead||e.tied||e.detained||(u.path.length&&hyp(destOf(u).x-e.x,destOf(u).y-e.y)>30)){zipGo=null;return;}
  if(u.path.length)return;if(hyp(u.x-e.x,u.y-e.y)>28){zipGo=null;return;}
  z.prog+=dt;if(z.prog>=ZIP_T){zipGo=null;if(typeof sfxZip==='function')sfxZip(e.x,e.y);u.stats.ties=(u.stats.ties||0)+1;callout(u,e.sci?'Detained':'Zip-tied',C.good);if(e.sci)sciTied(e,u);else e.tied=true;}   // (a scientist follows him from now on: office.js)
}

/* ---------- enemy grenades ---------- */
function enemyNade(e){
  if(e.dog||e.gunner||e.rpg||e.surr||!e.alerted||(e.nade??1)<1||simT<(e.nadeT||0))return false;
  const tg=players.filter(p=>alive(p)&&!p.offMap&&!p.path.length&&simT-(p.stillT??simT)>=ENADE.camp&&hyp(p.x-e.x,p.y-e.y)<=ENADE.range&&los(e.x,e.y,p.x,p.y))[0];
  if(!tg)return false;
  e.nade=0;e.nadeT=simT+20;const tx=tg.x+(Math.random()-.5)*20,ty=tg.y+(Math.random()-.5)*20;
  nades.push({x0:e.x,y0:e.y,x1:tx,y1:ty,t:0,dur:ENADE.warn,by:e,enemy:true});bark(e,'grenade',true);callout(tg,'Grenade!',C.bad);chatFrag(tg);
  return true;
}
// soldiers inside an incoming grenade's circle who haven't just been given an order get out
function dodgeTick(){
  for(const n of nades){
    if(!n.enemy||n.dodged)continue;n.dodged=true;
    for(const p of players){
      if(!alive(p)||p.offMap||hyp(p.x-n.x1,p.y-n.y1)>ENADE.r+8||simT-p.lastOrder<1)continue;
      const a=Math.atan2(p.y-n.y1,p.x-n.x1);let s=null;
      for(const da of[0,.7,-.7,1.4,-1.4]){const x=n.x1+Math.cos(a+da)*(ENADE.r+22),y=n.y1+Math.sin(a+da)*(ENADE.r+22);if(isFree(x,y,8)){s={x,y};break;}}
      const path=s&&findPath(p.x,p.y,s.x,s.y);if(path){p.path=path;p.gaitForce=null;callout(p,'Move!',C.warn);}
    }
  }
}

/* ---------- the contact sensor ---------- */
function sensorTick(dt){
  for(const p of players)if(alive(p)){if(p.path.length)p.stillT=simT;else if(p.stillT==null)p.stillT=simT;}
  blips=blips.filter(b=>simT-b.t<SENSOR.blip);
  if((sensorT-=dt)>0)return;
  const ups=players.filter(p=>alive(p)&&!p.offMap&&!offFloor(p));if(!ups.length||state!=='play'||landing){sensorT=.5;return;}
  const cx=ups.reduce((a,p)=>a+p.x,0)/ups.length,cy=ups.reduce((a,p)=>a+p.y,0)/ups.length;
  let near=1e9;for(const e of enemies){if(e.dead||e.surr||e.vis||!e.path.length||offFloor(e))continue;const d=hyp(e.x-cx,e.y-cy);if(d>SENSOR.range)continue;near=Math.min(near,d);blips.push({x:e.x,y:e.y,t:simT});}
  sensorT=near<200?.6:near<330?1:SENSOR.every;if(near>=1e9)return;   // nothing moving: quiet
  sweepT=simT;sensorC={x:cx,y:cy};
  if(typeof sfxPing==='function')sfxPing(clamp(1-near/SENSOR.range,0,1));
}
let sensorC={x:0,y:0};

/* ---------- every tick, and drawing ---------- */
function layersTick(dt){alertLayerTick(dt);checkInTick(dt);zipTick(dt);dodgeTick();sensorTick(dt);}
function drawLayers(now){
  // the sensor's sweep and blips
  const k=(simT-sweepT)/.9;if(k>=0&&k<1){gPath(sensorC.x,sensorC.y,SENSOR.range*k);ox.strokeStyle=`rgba(120,230,170,${(.35*(1-k)).toFixed(3)})`;ox.lineWidth=1.5;ox.stroke();}
  for(const b of blips){toSBack=false;const[sx,sy]=toS(b.x,b.y,4);if(toSBack)continue;const a=1-(simT-b.t)/SENSOR.blip;ox.fillStyle=`rgba(255,90,70,${(.8*a).toFixed(3)})`;ox.beginPath();ox.arc(sx,sy,3.5+zoom,0,TAU);ox.fill();}
  // an incoming enemy grenade: where it'll land
  for(const n of nades){if(!n.enemy)continue;const p=(Math.sin(now*14)+1)/2;gPath(n.x1,n.y1,ENADE.r);ox.fillStyle=`rgba(255,40,30,${(.12+p*.12).toFixed(3)})`;ox.fill();ox.strokeStyle='rgba(255,70,50,.9)';ox.lineWidth=2;ox.setLineDash([6,4]);ox.stroke();ox.setLineDash([]);const[lx,ly]=toS(n.x1,n.y1);label('GRENADE',lx,ly,'#ff5040',11,700);}
  // the ones who gave up
  for(const e of enemies){if(!e.surr||e.dead||offFloor(e)||!e.vis)continue;const[sx,sy]=toS(e.x,e.y,22);label(e.tied?'TIED':zipGo&&zipGo.e===e?'ZIP-TYING':'SURRENDERED',sx,sy,'#ffcf4a',9,700);}
  if(zipGo&&!zipGo.u.path.length){const u=zipGo.u;gPath(u.x,u.y,14,-Math.PI/2,-Math.PI/2+zipGo.prog/ZIP_T*TAU);ox.strokeStyle=C.good;ox.lineWidth=2.4;ox.stroke();}
}

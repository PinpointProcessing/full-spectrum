"use strict";
/* Pointer, pinch and wheel input on the overlay canvas, and what a tap on the map does. */
let ptr=null;
function unitAtScreen(sx,sy,activeOnly){
  let best=null,bd=26;
  for(const u of players){if(u.dead||u.seat==='driver'||u.offMap||u.carriedBy)continue;if(activeOnly&&u.downed)continue;const[x,y]=toS(u.x+u.lx,u.y+u.ly,8+(u.onTower||u.climb?u.elev||0:0));const d=hyp(x-sx,y-sy);if(d<bd){bd=d;best=u;}}
  return best;
}
const noOrders=()=>!!landing||(typeof heliBusy==='function'&&heliBusy())||(typeof endingBusy==='function'&&endingBusy())||(MAPID==='l1'&&l1&&l1.away!=null)||(MAPID==='l2'&&(!!l2.land||l2.away!=null));   // in the dinghy coming in, the helicopter, or the boat going out
function enemyAtScreen(sx,sy){
  let best=null,bd=26;
  for(const e of enemies){if(e.dead||!e.vis)continue;const[x,y]=toS(e.x+e.lx,e.y+e.ly,8+(e.elev||0));const d=hyp(x-sx,y-sy);if(d<bd){bd=d;best=e;}}
  return best;
}
function localXY(ev){const r=ov.getBoundingClientRect();return[ev.clientX-r.left,ev.clientY-r.top];}
const touches=new Map();let pinch=null;
function pinchInfo(){const p=[...touches.values()];return{d:Math.max(1,hyp(p[0].x-p[1].x,p[0].y-p[1].y)),a:Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x),mx:(p[0].x+p[1].x)/2,my:(p[0].y+p[1].y)/2};}
const ORBIT_SPIN=0.008;   // radians of spin per pixel of sideways two-finger drag
const TWIST_START=0.2;   // radians of twist before rotation kicks in, so a plain pinch doesn't turn the map
function wrapA(a){return Math.atan2(Math.sin(a),Math.cos(a));}
function turnCam(d){yaw=wrapA(yaw+d);clampCam();updateCamera();}
function tiltCam(t){tilt=clamp(t,0,basePitch()-PITCH_MIN);clampCam();updateCamera();}
let inertia={vx:0,vy:0};
// is screen point (x,y) inside the polygon pts (the lasso loop, closed automatically)?
function inLoop(x,y,pts){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[a,b]=pts[i],[p,q]=pts[j];if((b>y)!==(q>y)&&x<(p-a)*(y-b)/(q-b)+a)c=!c;}return c;}
function endPtr(ev,cancel){
  touches.delete(ev.pointerId);
  if(pinch){if(touches.size===0)pinch=null;return;}
  if(!ptr||ev.pointerId!==ptr.id)return;
  clearTimeout(ptr.timer);
  if(!cancel){
    if(ptr.kind==='lasso'){
      const loop=ptr.loop;
      const got=loop.length>2?players.filter(u=>{if(!alive(u))return false;const[x,y]=toS(u.x+u.lx,u.y+u.ly,8);return inLoop(x,y,loop);}):[];
      if(got.length){select(got);preview=null;mode=null;}
      else if(loop.length>2)banner('No soldiers inside the loop.',1400);
    }else if(ptr.kind==='pan'){
      // the glide: the drag's speed over its last ~0.1 s (not between two touch events, which can come 1 ms apart and
      // made the speed look huge: the camera flew off), capped, and only if the finger was still moving when it lifted
      const h=ptr.hist||[],now=performance.now();
      if(h.length>1&&now-ptr.lt<80){const a=h[0],b=h[h.length-1],dt=(b.t-a.t)/1000;if(dt>=.03){const mx=1400/zoom;inertia.vx=clamp((b.x-a.x)/dt,-mx,mx);inertia.vy=clamp((b.z-a.z)/dt,-mx,mx);}}
    }else if(!ptr.lp&&state==='play')tap(ptr.sx,ptr.sy);
  }
  ptr=null;hud();
}
function bindInput(){
  ov.addEventListener('pointerdown',ev=>{
    camPan=null;   // touching the map stops any camera move in progress
    // a new touch with no other finger down (the browser's own count: isPrimary) starts clean. If a lift was ever lost (a
    // gesture taken over by the page around the game, a system swipe), a phantom finger stayed in the list and every one-
    // finger drag turned into a two-finger twist: the camera spun but wouldn't move (Bryan, Level 2 at the containers)
    if(ev.isPrimary&&touches.size){touches.clear();pinch=null;if(ptr){clearTimeout(ptr.timer);ptr=null;}}
    const[sx,sy]=localXY(ev);
    touches.set(ev.pointerId,{x:sx,y:sy});
    try{ov.setPointerCapture(ev.pointerId);}catch(_){}
    inertia.vx=inertia.vy=0;
    if(touches.size===2){
      if(ptr){clearTimeout(ptr.timer);ptr=null;}
      const i=pinchInfo(),[wx,wy]=toW(i.mx,i.my);
      pinch={d0:i.d,z0:zoom,wx,wy,anchor:!!nearGround(i.mx,i.my),a0:i.a,yaw0:yaw,rot:false,mx0:i.mx,my0:i.my,t0:tilt,mode:null,s:[...touches.values()].map(q=>({...q}))};return;
    }
    if(touches.size>2||pinch)return;
    if(ptr)return;
    ptr={id:ev.pointerId,sx,sy,cx:sx,cy:sy,lx:sx,ly:sy,lt:performance.now(),t0:performance.now(),vx:0,vy:0,kind:null,lp:false,
      unit:state==='play'?unitAtScreen(sx,sy,true):null};
    ptr.supPt=state==='play'&&!ptr.unit&&!mode&&!noOrders()&&sel.some(alive)?suppressAt(sx,sy):null;   // (for the filling ring: drawHold)
    ptr.timer=setTimeout(()=>{
      if(!ptr||ptr.kind||state!=='play')return;
      const u=unitAtScreen(ptr.sx,ptr.sy,true);
      ptr.lp=true;
      try{navigator.vibrate&&navigator.vibrate(12);}catch(_){}
      const sp=!u&&!mode&&!noOrders()&&suppressAt(ptr.sx,ptr.sy);   // holding on an enemy, or where one was seen: suppress
      if(u){if(tutAllows('hold',u)){select([u]);preview=null;mode=null;callout(u,u.name,teamCol(u));}}
      else if(sp){if(!sel.some(alive))banner('Select soldiers, then hold your finger on an enemy to suppress him.',2400);else if(tutAllows('suppress',sp))orderSuppress(sel,sp);}
      else if(tutAllows('lasso')){ptr.kind='lasso';ptr.loop=[[ptr.cx,ptr.cy]];}
      hud();
    },380);
  });
  ov.addEventListener('pointermove',ev=>{
    const[x,y]=localXY(ev);
    if(touches.has(ev.pointerId))touches.set(ev.pointerId,{x,y});
    if(pinch&&touches.size===2){
      const i=pinchInfo(),da=wrapA(i.a-pinch.a0);
      // two fingers dragged together orbit the camera (up/down tilts, left/right spins round the view centre);
      // spreading or twisting them is pinch-zoom and twist
      if(!pinch.mode){
        // judged on each finger's own movement: touch events arrive one finger at a time
        const q=[...touches.values()],v=q.map((p,k)=>[p.x-pinch.s[k].x,p.y-pinch.s[k].y]),l=v.map(w=>hyp(w[0],w[1]));
        if(l[0]>8&&l[1]>8){
          const same=(v[0][0]*v[1][0]+v[0][1]*v[1][1])/(l[0]*l[1])>0.7;
          if(same&&Math.abs(da)<TWIST_START){pinch.mode='orbit';pinch.mx0=i.mx;pinch.my0=i.my;pinch.t0=tilt;pinch.yaw0=yaw;}
          else pinch.mode='zoom';
        }else if(Math.max(l[0],l[1])>30)pinch.mode='zoom';   // one finger moving on its own: pinch
        else return;
      }
      if(pinch.mode==='orbit'){yaw=wrapA(pinch.yaw0-(i.mx-pinch.mx0)*ORBIT_SPIN);tiltCam(pinch.t0-(i.my-pinch.my0)*0.004);return;}   // push up = look further out (as in Ashvale)
      zoom=clamp(pinch.z0*i.d/pinch.d0,1,MAXZ);
      if(!pinch.rot&&Math.abs(da)>TWIST_START){pinch.rot=true;pinch.a0=i.a;pinch.yaw0=yaw;}
      if(pinch.rot)yaw=wrapA(pinch.yaw0+wrapA(i.a-pinch.a0));   // the map turns with your fingers
      updateCamera();
      const n=pinch.anchor&&nearGround(i.mx,i.my);if(n){camT.x+=pinch.wx-n[0];camT.z+=pinch.wy-n[1];}clampCam();updateCamera();return;   // no anchor on sky or far horizon
    }
    if(!ptr||ev.pointerId!==ptr.id)return;
    ptr.cx=x;ptr.cy=y;
    if(!ptr.kind&&(!ptr.lp||ptr.unit)&&hyp(x-ptr.sx,y-ptr.sy)>12){
      clearTimeout(ptr.timer);
      ptr.kind='pan';   // (Bryan: no dragging soldiers to move them, "Too many times I accidentally dragged a unit to a different spot": a drag that starts on one moves the map; tap him, then tap where)
      ptr.lx=x;ptr.ly=y;ptr.lt=performance.now();
    }
    if(ptr.kind==='lasso'){const l=ptr.loop[ptr.loop.length-1];if(hyp(x-l[0],y-l[1])>4)ptr.loop.push([x,y]);}
    if(ptr.kind==='pan'){
      const now=performance.now();
      // measured at the middle of the screen (always ground, where the camera looks), so a drag near the horizon or the sky
      // moves the map the same amount as anywhere else; capped per move
      const[ax,az]=toW(cw/2,ch/2),[bx,bz]=toW(cw/2+x-ptr.lx,ch/2+y-ptr.ly),cap=160/zoom;
      const dx=clamp(ax-bx,-cap,cap),dy=clamp(az-bz,-cap,cap);
      camT.x+=dx;camT.z+=dy;clampCam();updateCamera();
      (ptr.hist=ptr.hist||[]).push({t:now,x:camT.x,z:camT.z});while(ptr.hist.length>1&&now-ptr.hist[0].t>120)ptr.hist.shift();
      ptr.lx=x;ptr.ly=y;ptr.lt=now;
    }
  });
  ov.addEventListener('pointerup',ev=>endPtr(ev,false));
  ov.addEventListener('pointercancel',ev=>endPtr(ev,true));
  ov.addEventListener('lostpointercapture',ev=>{if(touches.has(ev.pointerId))endPtr(ev,true);});   // (a finger the canvas lost track of)
  const dropAll=()=>{touches.clear();pinch=null;if(ptr){clearTimeout(ptr.timer);ptr=null;}};   // leaving the page or app: nobody's touching it any more
  addEventListener('blur',dropAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)dropAll();});
  ov.addEventListener('contextmenu',ev=>ev.preventDefault());
  ov.addEventListener('wheel',ev=>{ev.preventDefault();if(ev.shiftKey){tiltCam(tilt+(ev.deltaY||ev.deltaX)*0.0015);return;}const[sx,sy]=localXY(ev);zoomAround(sx,sy,zoom*Math.exp(-ev.deltaY*0.0015));},{passive:false});
  $('#fitBtn').addEventListener('click',()=>{zoom=1;yaw=0;tilt=0;camT={x:(VB.x0+VB.x1)/2,z:(VB.z0+VB.z1)/2};inertia.vx=inertia.vy=0;clampCam();updateCamera();});
}

// changing the selection: soldiers who weren't already selected go back to the automatic sneak/run choice.
// Cards on show: picking one soldier out of the group already showing keeps that group up; anything else shows the selection's teams.
function select(list){
  for(const u of list)if(!sel.includes(u))u.gaitForce=null;
  if(!(list.length===1&&cardGroup.includes(list[0])))cardGroup=players.filter(p=>list.some(u=>u.team===p.team));
  sel=list;
}
/* ---------- the squads apart (Bryan: "if selecting the other squad, it should bring you to them. You cant change squads if
   they are in different locations and your squad is under attack") ---------- */
const UNDER_FIRE_T=4;   // shot at, or hurt, in the last 4 s: under fire (firedOnT, combat.js)
const underFire=list=>list.some(p=>alive(p)&&simT-(p.firedOnT??-99)<UNDER_FIRE_T);
const midOf=list=>({x:list.reduce((a,p)=>a+p.x,0)/list.length,y:list.reduce((a,p)=>a+p.y,0)/list.length});
function inView(p){toSBack=false;const[sx,sy]=toS(p.x,p.y,4);return !toSBack&&sx>=0&&sy>=0&&sx<=cw&&sy<=ch;}
// are these men somewhere other than what's on screen (another floor, or off the edge)?
function elsewhere(list){const live=list.filter(p=>alive(p)&&!p.offMap);return live.length>0&&live.every(p=>offFloor(p)||!inView(p));}
// may the view leave the men on screen (the ones selected, else everyone on this floor) for these? Not while those are being shot
// at, unless these are too (then both need you)
function mayLeave(list){
  const here=(sel.some(alive)?sel:players).filter(p=>alive(p)&&!p.offMap&&!offFloor(p)&&!list.includes(p));
  if(!here.length||!underFire(here)||underFire(list))return true;
  const t=new Set(here.map(p=>p.team));banner(`${t.size>1?'Your squad is':t.has('A')?'Alpha is':'Bravo is'} under fire. You can't leave them in a fight.`,2200);return false;
}
// the camera to them: their floor inside the office building, and over them
function goTo(list){const live=list.filter(p=>alive(p)&&!p.offMap);if(!live.length)return;const m=midOf(live);
  if(MAPID==='in'){const f=floorOf(live[0].x,live[0].y);if(f&&f!==curFloor){setFloor(f,m);return;}}
  camT={x:m.x,z:m.y};clampCam();updateCamera();}
// pick these men; if they're somewhere else the camera goes to them, or nothing happens and the banner says why (false)
function selectAway(list){const far=elsewhere(list);if(far&&!mayLeave(list))return false;select(list);if(far)goTo(list);return true;}
function selectTeam(t){if(selectAway(players.filter(p=>p.team===t&&alive(p)))){preview=null;mode=null;}}
// gait button: flip the selected soldiers to the other gait, or back to automatic if already flipped
function toggleGait(){
  const act=sel.filter(alive);if(!act.length)return;
  if(act.some(u=>u.gaitForce)){for(const u of act)u.gaitForce=null;}
  else{const g=act.some(u=>autoGait(u)==='sneak')?'run':'sneak';for(const u of act)u.gaitForce=g;}
}
let fireOrderAt=-1e9;   // when the last suppress/grenade/smoke order was given (real ms)
// Suppress (Bryan: no button; hold your finger on where to suppress): a hold on a hostile you can see, or near where one you've
// seen is or was last seen, with soldiers selected. What a hold at (sx,sy) would pin down, or null:
function suppressAt(sx,sy){
  const en=enemyAtScreen(sx,sy);if(en&&!en.surr)return{x:en.x,y:en.y,en};
  let best=null,bd=34;
  for(const e of enemies){if(e.dead||e.surr||!e.seen)continue;const p=e.vis?e:e.last;if(!p)continue;toSBack=false;const[x,y]=toS(p.x,p.y,8);if(toSBack)continue;const d=hyp(x-sx,y-sy);if(d<bd){bd=d;best={x:p.x,y:p.y,en:e.vis?e:null};}}
  return best;
}
function orderSuppress(list,pt){
  const sh=list.filter(alive);if(!sh.length)return false;
  for(const u of sh){u.supT={x:pt.x,y:pt.y};u.focus=null;u.noLine=0;u.lastOrder=simT;u.watch=null;}
  callout(sh[0],'Suppressing!',C.warn);chatSuppress(sh[0]);
  mode=null;preview=null;fireOrderAt=performance.now();return true;
}
// while a finger rests on something it would suppress: a ring fills round it until the hold takes (drawn from the overlay)
function drawHold(now){
  if(!ptr||ptr.kind||ptr.lp||!ptr.supPt)return;
  const k=clamp((performance.now()-ptr.t0-60)/320,0,1);if(k<=0)return;
  toSBack=false;const[x,y]=toS(ptr.supPt.x,ptr.supPt.y,8);if(toSBack)return;
  ox.beginPath();ox.arc(x,y,22,-Math.PI/2,-Math.PI/2+k*TAU);ox.strokeStyle=C.warn;ox.lineWidth=3;ox.stroke();
  label('SUPPRESS',x,y-30,C.warn,10,700);
}
function tap(sx,sy){
  if(noOrders())return;   // the squad is still in the dinghy (Level 2) or the helicopter (Level 1)
  if(!tutAllows('tap',sx,sy))return;   // Level 1's tutorial: only what the step or tip asks for (level1.js)
  const[wx,wy]=toW(sx,sy),[bx,by]=toS(wx,wy),onGround=hyp(bx-sx,by-sy)<4,inMap=onGround&&wx>=VB.x0&&wy>=VB.z0&&wx<=VB.x1&&wy<=VB.z1;   // only where the camera may go (the yard until the depot opens)
  sel=sel.filter(alive);
  // aiming modes (Bryan: suppressing or throwing must never move anyone): a tap that misses keeps the mode and says why;
  // one that lands gives the order and briefly guards against the next tap turning into a move (moveGuard below)
  if(mode==='charge'){   // demolition charge: tap a fuel tank (mission.js)
    const u=sel[0];if(!u){mode=null;return;}
    const tg=tapTarget(sx,sy),t=chargeTargetAt(tg.x,tg.y)?{x:tg.x,y:tg.y}:{x:wx,y:wy};
    if(orderCharge(u,t.x,t.y)){mode=null;preview=null;fireOrderAt=performance.now();}return;
  }
  if(mode==='medkit'){   // a medic kit (his special item): tap a downed teammate
    const u=sel[0];let pu=unitAtScreen(sx,sy,false);if(!u){mode=null;return;}
    if(pu&&pu.carry)pu=pu.carry;   // tapping a carrier: the man he carries
    if(!pu||!pu.downed||pu===u){banner('Tap a downed teammate to use the medic kit. Tap the kit on his card again to cancel.');return;}
    if(orderMedkit(u,pu)){mode=null;preview=null;}return;
  }
  if(mode==='silent'){   // the silencer (combat.js): tap a hostile who hasn't noticed him
    const u=sel[0];if(!u||!silenced(u)){mode=null;return;}
    const en=enemyAtScreen(sx,sy);
    if(en&&canSilent(u,en)){orderSilent(u,en);mode=null;preview=null;fireOrderAt=performance.now();return;}
    banner(en&&en.alerted?'He knows you are here: no silent shot.':en?'No clear shot at him from here (20 m, in sight).':'Tap a hostile marked SILENT SHOT. Tap the silencer on his card again to cancel.',2000);return;
  }
  if(mode==='binos'||mode==='noise'||mode==='flash'){   // a class skill: the Recon's binoculars, the Spec Ops' distraction (skills.js)
    const u=sel[0];if(!u){mode=null;return;}if(!inMap){banner('Tap a spot on the map.',1400);return;}
    if(skillTap(u,wx,wy)){preview=null;fireOrderAt=performance.now();}return;
  }
  if(mode==='build'||mode==='buildwall'){   // a Defender's build kit: tap where (build.js)
    const u=sel[0];if(!u){mode=null;return;}if(!inMap){banner('Tap a spot on the map.',1400);return;}
    const dr=MAPID==='in'&&objs.find(q=>q.door&&!q.open&&!q.barred&&rectDist(wx,wy,q)<9);   // a shut door: bar it instead (build.js)
    if(dr){if(orderBar(u,dr)){mode=null;preview=null;fireOrderAt=performance.now();}return;}
    if(orderBuild(u,wx,wy,mode==='build'?'barricade':'wall')){mode=null;preview=null;fireOrderAt=performance.now();}return;
  }
  if(mode==='grenade'||mode==='smoke'||mode==='rpg'){   // Bryan: tap where; if he can't throw or fire from where he is, he moves to where he can
    const u=sel[0];if(!u){mode=null;return;}
    const en=enemyAtScreen(sx,sy),t=en&&en.vis?{x:en.x,y:en.y}:{x:wx,y:wy};if(!en&&!inMap){banner('Tap a spot on the map.',1400);return;}
    if(orderThrow(u,t.x,t.y,mode==='grenade'?'nade':mode)){mode=null;preview=null;fireOrderAt=performance.now();}return;
  }
  // the jeep: with soldiers on foot selected, they board it; otherwise tapping it selects its crew
  if(jeepAtScreen(sx,sy)){
    const jv=jeepOf(),foot=sel.filter(u=>!u.inVeh);
    if(foot.length&&jv.state==='ok'){orderBoard(foot);preview=null;return;}
    const c=crewOf(jv).filter(alive);
    if(c.length){select(c);preview=null;mode=null;return;}
    banner(jv.state==='ok'?'Select soldiers, then tap the jeep to board it.':'The jeep is wrecked.',1800);return;
  }
  if(breachTap(sx,sy)){preview=null;return;}   // the BREACH marker at a room's doorway near the selected soldiers (orders.js)
  const pu=unitAtScreen(sx,sy,false);
  if(pu){
    if(pu.downed){
      const helpers=sel.filter(u=>u!==pu&&!u.inVeh&&alive(u)&&!u.carry);
      if(!helpers.length){banner('Select a soldier, then tap the downed man.');return;}
      helpers.sort((a,b)=>hyp(a.x-pu.x,a.y-pu.y)-hyp(b.x-pu.x,b.y-pu.y));
      if(pu.critical){const medic=helpers.find(hasKit);if(medic)orderMedkit(medic,pu);else orderCarry(helpers[0],pu);return;}   // past the 60 s (Bryan): a medic kit if one of them has it, else carry him out
      const h=helpers[0],spot=openSpot(pu.x,pu.y,players.filter(o=>o!==h&&o!==pu&&!o.dead).map(destOf));
      const path=spot&&findPath(h.x,h.y,spot.x,spot.y);
      if(path){h.path=path;h.lastOrder=simT;h.supT=null;markRet(h);callout(h,'On my way',C.good);}
      else banner('No way to reach him from here.');
      return;
    }
    // Bryan: with several selected, tapping one of them picks just him, like tapping his card (the cards on show stay);
    // tapping him again goes back to the group. Anyone else: his fire team, as before
    if(sel.length>1&&sel.includes(pu)){select([pu]);preview=null;mode=null;return;}
    if(sel.length===1&&sel[0]===pu&&cardGroup.filter(alive).length>1){select(cardGroup.filter(alive));preview=null;mode=null;return;}
    selectTeam(pu.team);return;
  }
  // a hostile under the finger comes before anything on the ground (Bryan couldn't shoot the operator: he sits on the
  // computer's ring, and the tap went to the computer)
  const en=enemyAtScreen(sx,sy);
  if(en&&en.surr){   // he gave up: the nearest selected soldier zip-ties him (layers.js)
    if(en.tied){banner('He is tied up.',1400);return;}
    if(!sel.length){banner('Select a soldier, then tap him to zip-tie him.',2000);return;}
    if(orderZip(sel,en))preview=null;return;
  }
  if(en&&sel.length===1&&canTakedown(sel[0],en)){if(orderTakedown(sel[0],en))preview=null;return;}   // his back is to the one soldier selected: a silent takedown (combat.js)
  if(en&&sel.length===1&&canSilent(sel[0],en)){if(!(sel[0].silent&&sel[0].silent.e===en))orderSilent(sel[0],en);preview=null;return;}   // the one soldier selected has a silencer and the man hasn't seen him: a silent shot (a second tap doesn't restart his aim)
  if(en&&sel.length){   // Bryan: whoever's selected opens fire on him; anyone without a clear shot goes and gets one (combat.js)
    if(volleyPending()&&sel.some(u=>volley.by.includes(u)||volley.movers.includes(u))){   // they're getting set on a man:
      if(volley.targets.includes(en)){if(volley.at==null){volleyNow();callout(en,'Now!',C.good);}preview=null;return;}   // him again: fire now
      if(volleySplit(en)){preview=null;return;}   // another one: they split, one each, on the same count (combat.js)
    }
    const r=orderFire(sel,en);preview=null;if(!r)return;
    if(selCrew().length){const jv=jeepOf();jv.engage=en;jv.engageT=0;}   // the driver lines the turret up
    if(r.crew.length||r.moveQ.length)callout(en,'On my mark',C.good);
    else if(r.fire.length||r.move.length){callout(en,sel.some(caught)?'Focus fire':'Open fire!',C.warn);say(sel[0],'ack_attack');}
    return;
  }
  if(MAPID==='out'&&monGateTap(wx,wy)){preview=null;return;}   // into the Headquarters (monsters.js)
  if(interiorTap(wx,wy)){preview=null;return;}   // going in or out of the office building, or something to use (interior.js)
  if(doorTap(wx,wy)){preview=null;return;}   // a shut door: the nearest selected soldier opens it (orders.js)
  if(fortTap(sx,sy)){preview=null;return;}   // a barricade, with a Defender selected: he packs it up (build.js)
  if(MAPID==='out'&&hyp(wx-PANEL.x,wy-PANEL.y)<16){tapPanel();preview=null;return;}   // the drawbridge's control panel
  {const cv=civAtScreen(sx,sy);if(cv&&civTap(cv)){preview=null;return;}}
  if(MAPID==='out'&&sel.some(alive)&&hyp(wx-PBOX.gun.x,wy-PBOX.gun.y)<18&&!gunMan()){if(orderMan(sel))preview=null;return;}   // the pillbox's gun, nobody on it: the nearest selected soldier takes it (mission.js)
  if(MAPID==='out'&&sel.some(alive)&&(hyp(wx-TOWER.x,wy-TOWER.y)<20||hyp(wx-TOWER.ladder.x,wy-TOWER.ladder.y)<12)&&!sel.some(u=>u.onTower)){orderClimb(sel);preview=null;return;}   // the watchtower: climb it (mission.js)   // a scientist (zip-tie him), a locked-up prisoner (open his cell), the man on the wall (office.js)
  if(!inMap){preview=null;return;}
  if(!sel.length){banner('Select soldiers first.',1600);return;}
  const sinceFire=performance.now()-fireOrderAt;
  if(sinceFire<1200)return;   // a second tap right after a suppress/grenade/charge order (thinking it didn't take) is not a move
  const tg0=tapTarget(sx,sy),tg=zoneAt(wx,wy)&&!zoneAt(tg0.x,tg0.y)?{x:wx,y:wy}:tg0;   // tapping a wall or crate means: stand against the side you tapped; but a medic or ammo ring under your finger wins over a wall in front of it (Level 1's station sits just behind one)
  // tapping a fuel tank: everyone selected who can shoot opens up on it (mission.js)
  if(tg.obj&&tg.obj.kind==='tank'&&!tg.obj.burst){const sh=sel.filter(u=>u.seat!=='driver');for(const u of sh){u.focusTank=tg.obj;u.focus=null;u.supT=null;}if(sh[0])callout(sh[0],'Hit the tank!',C.warn);preview=null;return;}
  // crew selected: it's a drive order, two taps like a squad move (anyone on foot in the selection goes there too)
  if(selCrew().length&&seatOf(jeepOf(),'driver')){   // with nobody at the wheel, taps move whoever's on foot
    const jv=jeepOf();
    if(preview&&preview.veh){const e=preview.path[preview.path.length-1],[px,py]=toS(e.x,e.y);if(hyp(sx-px,sy-py)<40){driveAlong(jv,preview.path);jv.engage=null;commit(preview.as);preview=null;return;}}
    if(jv.state!=='ok'){banner('The jeep is out of action.');return;}
    if(!seatOf(jv,'driver')){banner('Nobody is driving.');return;}
    const p=vehRoute(jv,tg.x,tg.y);
    if(!p){banner('The jeep can’t get there.');preview=null;return;}
    const foot=sel.filter(u=>!u.inVeh);
    preview={x:tg.x,y:tg.y,veh:true,path:p,as:foot.length?makeAssign(foot,tg.x,tg.y):[]};return;
  }
  const movers=sel.filter(u=>!u.inVeh);   // anyone still in the jeep (a gunner covering) stays put
  if(!movers.length){banner('He stays on the gun until it\'s quiet. Select just him and press Dismount to pull him out.',2600);return;}
  if(movers.length===1&&sinceFire>6000){   // shortly after a suppress/grenade order even one soldier needs the two-tap move
    const as=makeAssign(movers,tg.x,tg.y);
    if(!as.length){banner('Can’t get there.');return;}
    commit(as);return;
  }
  if(preview){const[px,py]=toS(preview.x,preview.y);if(hyp(sx-px,sy-py)<40){commit(preview.as);preview=null;return;}}
  const as=makeAssign(movers,tg.x,tg.y);
  if(!as.length){banner('Can’t get there.');preview=null;return;}
  preview={x:tg.x,y:tg.y,as};
}

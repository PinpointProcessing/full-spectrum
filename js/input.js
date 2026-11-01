"use strict";
/* Pointer, pinch and wheel input on the overlay canvas, and what a tap on the map does. */
let ptr=null;
function unitAtScreen(sx,sy,activeOnly){
  let best=null,bd=26;
  for(const u of players){if(u.dead||u.seat==='driver')continue;if(activeOnly&&u.downed)continue;const[x,y]=toS(u.x+u.lx,u.y+u.ly,8);const d=hyp(x-sx,y-sy);if(d<bd){bd=d;best=u;}}
  return best;
}
function enemyAtScreen(sx,sy){
  let best=null,bd=26;
  for(const e of enemies){if(e.dead||!e.vis)continue;const[x,y]=toS(e.x+e.lx,e.y+e.ly,8);const d=hyp(x-sx,y-sy);if(d<bd){bd=d;best=e;}}
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
// drawing a route: drag that starts on a soldier. Trail is in world coordinates.
function addTrail(sx,sy){
  const[wx,wy]=toW(sx,sy),p={x:clamp(wx,10,W-10),y:clamp(wy,TOP+10,H-10)},l=ptr.trail[ptr.trail.length-1];
  if(!l||hyp(p.x-l.x,p.y-l.y)>=6)ptr.trail.push(p);
}
// while drawing near the edge of the view, slide the camera that way so long routes fit
function edgePan(rdt){
  if(!ptr||ptr.kind!=='draw')return;
  const m=48,sp=260/zoom;let vx=0,vy=0;
  if(ptr.cx<m)vx=-1;else if(ptr.cx>cw-m)vx=1;
  if(ptr.cy<m)vy=-1;else if(ptr.cy>ch-m)vy=1;
  if(!vx&&!vy)return;
  const c=Math.cos(yaw),s=Math.sin(yaw);   // screen direction -> world, for a turned camera
  camT.x+=(vx*c+vy*s)*sp*rdt;camT.z+=(vy*c-vx*s)*sp*rdt;clampCam();updateCamera();addTrail(ptr.cx,ptr.cy);
}
function finishDraw(){
  const u=ptr.unit,t=ptr.trail;
  if(!alive(u)||state!=='play')return;
  const e=t[t.length-1];
  if(!e||hyp(e.x-u.x,e.y-u.y)<12)return;            // dragged back onto him: cancel
  const r=routeFromTrail(u,t);
  if(!r){banner('Can’t get there.');return;}
  commit([r]);u.peek=null;
}
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
    }else if(ptr.kind==='draw'){
      finishDraw();
    }else if(ptr.kind==='pan'){
      if(performance.now()-ptr.lt<80){inertia.vx=ptr.vx*1000;inertia.vy=ptr.vy*1000;}
    }else if(!ptr.lp&&state==='play')tap(ptr.sx,ptr.sy);
  }
  ptr=null;hud();
}
function bindInput(){
  ov.addEventListener('pointerdown',ev=>{
    camPan=null;   // touching the map stops any camera move in progress
    const[sx,sy]=localXY(ev);
    touches.set(ev.pointerId,{x:sx,y:sy});
    try{ov.setPointerCapture(ev.pointerId);}catch(_){}
    inertia.vx=inertia.vy=0;
    if(touches.size===2){
      if(ptr){clearTimeout(ptr.timer);ptr=null;}
      const i=pinchInfo(),[wx,wy]=toW(i.mx,i.my);
      pinch={d0:i.d,z0:zoom,wx,wy,a0:i.a,yaw0:yaw,rot:false,mx0:i.mx,my0:i.my,t0:tilt,mode:null,s:[...touches.values()].map(q=>({...q}))};return;
    }
    if(touches.size>2||pinch)return;
    if(ptr)return;
    ptr={id:ev.pointerId,sx,sy,cx:sx,cy:sy,lx:sx,ly:sy,lt:performance.now(),vx:0,vy:0,kind:null,lp:false,
      unit:state==='play'?unitAtScreen(sx,sy,true):null,trail:[]};
    ptr.timer=setTimeout(()=>{
      if(!ptr||ptr.kind||state!=='play')return;
      const u=unitAtScreen(ptr.sx,ptr.sy,true);
      ptr.lp=true;
      try{navigator.vibrate&&navigator.vibrate(12);}catch(_){}
      if(u){select([u]);preview=null;mode=null;callout(u,u.name,teamCol(u));}
      else{ptr.kind='lasso';ptr.loop=[[ptr.cx,ptr.cy]];}
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
      const[nx,nz]=toW(i.mx,i.my);camT.x+=pinch.wx-nx;camT.z+=pinch.wy-nz;clampCam();updateCamera();return;
    }
    if(!ptr||ev.pointerId!==ptr.id)return;
    ptr.cx=x;ptr.cy=y;
    if(!ptr.kind&&(!ptr.lp||ptr.unit)&&hyp(x-ptr.sx,y-ptr.sy)>12){
      clearTimeout(ptr.timer);
      ptr.kind=ptr.unit&&alive(ptr.unit)&&!landing?'draw':'pan';   // no orders while the dinghy is still coming in
      if(ptr.kind==='draw'){select([ptr.unit]);preview=null;mode=null;hud();}
      ptr.lx=x;ptr.ly=y;ptr.lt=performance.now();
    }
    if(ptr.kind==='draw')addTrail(x,y);
    if(ptr.kind==='lasso'){const l=ptr.loop[ptr.loop.length-1];if(hyp(x-l[0],y-l[1])>4)ptr.loop.push([x,y]);}
    if(ptr.kind==='pan'){
      const now=performance.now(),dt=Math.max(1,now-ptr.lt);
      const[ax,az]=toW(ptr.lx,ptr.ly),[bx,bz]=toW(x,y),dx=ax-bx,dy=az-bz;
      camT.x+=dx;camT.z+=dy;clampCam();updateCamera();
      ptr.vx=ptr.vx*.6+dx/dt*.4;ptr.vy=ptr.vy*.6+dy/dt*.4;
      ptr.lx=x;ptr.ly=y;ptr.lt=now;
    }
  });
  ov.addEventListener('pointerup',ev=>endPtr(ev,false));
  ov.addEventListener('pointercancel',ev=>endPtr(ev,true));
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
function selectTeam(t){select(players.filter(p=>p.team===t&&alive(p)));preview=null;mode=null;}
// gait button: flip the selected soldiers to the other gait, or back to automatic if already flipped
function toggleGait(){
  const act=sel.filter(alive);if(!act.length)return;
  if(act.some(u=>u.gaitForce)){for(const u of act)u.gaitForce=null;}
  else{const g=act.some(u=>autoGait(u)==='sneak')?'run':'sneak';for(const u of act)u.gaitForce=g;}
}
function tap(sx,sy){
  if(landing)return;   // the squad is still in the dinghy
  const[wx,wy]=toW(sx,sy),[bx,by]=toS(wx,wy),onGround=hyp(bx-sx,by-sy)<4,inMap=onGround&&wx>=VB.x0&&wy>=VB.z0&&wx<=VB.x1&&wy<=VB.z1;   // only where the camera may go (the yard until the depot opens)
  sel=sel.filter(alive);
  if(mode==='suppress'){
    if(!inMap){mode=null;return;}
    const en=enemyAtScreen(sx,sy),pt=en?{x:en.x,y:en.y}:{x:wx,y:wy};
    if(!enemies.some(e=>!e.dead&&e.seen&&hyp((e.vis?e.x:e.last.x)-pt.x,(e.vis?e.y:e.last.y)-pt.y)<55)){banner('Tap an enemy you have seen.');return;}
    for(const u of sel){u.supT={x:pt.x,y:pt.y};u.focus=null;u.noLine=0;u.lastOrder=simT;}
    if(sel[0])callout(sel[0],'Suppressing!',C.warn);
    mode=null;return;
  }
  if(mode==='charge'){   // demolition charge: tap a fuel tank or the server core (mission.js)
    const u=sel[0];if(!u){mode=null;return;}
    const tg=tapTarget(sx,sy),t=chargeTargetAt(tg.x,tg.y)?{x:tg.x,y:tg.y}:{x:wx,y:wy};
    if(orderCharge(u,t.x,t.y))mode=null;return;
  }
  if(mode==='grenade'){
    const u=sel[0];if(!u){mode=null;return;}
    if(throwNade(u,wx,wy))mode=null;return;
  }
  // the jeep: with soldiers on foot selected, they board it; otherwise tapping it selects its crew
  if(jeepAtScreen(sx,sy)){
    const jv=jeepOf(),foot=sel.filter(u=>!u.inVeh);
    if(foot.length&&jv.state==='ok'){orderBoard(foot);preview=null;return;}
    const c=crewOf(jv).filter(alive);
    if(c.length){select(c);preview=null;mode=null;return;}
    banner(jv.state==='ok'?'Select soldiers, then tap the jeep to board it.':'The jeep is wrecked.',1800);return;
  }
  const pu=unitAtScreen(sx,sy,false);
  if(pu){
    if(pu.downed){
      const helpers=sel.filter(u=>u!==pu&&!u.inVeh);
      if(!helpers.length){banner('Select a soldier, then tap the downed man.');return;}
      helpers.sort((a,b)=>hyp(a.x-pu.x,a.y-pu.y)-hyp(b.x-pu.x,b.y-pu.y));
      const h=helpers[0],spot=openSpot(pu.x,pu.y,players.filter(o=>o!==h&&o!==pu&&!o.dead).map(destOf));
      const path=spot&&findPath(h.x,h.y,spot.x,spot.y);
      if(path){h.path=path;h.lastOrder=simT;h.supT=null;callout(h,'On my way',C.good);}
      else banner('No way to reach him from here.');
      return;
    }
    selectTeam(pu.team);return;
  }
  if(hyp(wx-PANEL.x,wy-PANEL.y)<16){tapPanel();preview=null;return;}   // the drawbridge's control panel
  const en=enemyAtScreen(sx,sy);
  if(en&&sel.length){
    for(const u of sel){u.focus=en;u.supT=null;u.focusTank=null;}
    if(selCrew().length){const jv=jeepOf();jv.engage=en;jv.engageT=0;}   // the driver lines the turret up
    callout(en,contact?'Focus fire':'Open fire!',C.warn);say(sel[0],'ack_attack');return;
  }
  if(!inMap){preview=null;return;}
  if(!sel.length){banner('Select soldiers first.',1600);return;}
  const tg=tapTarget(sx,sy);   // tapping a wall or crate means: stand against the side you tapped
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
  if(movers.length===1){
    const as=makeAssign(movers,tg.x,tg.y);
    if(!as.length){banner('Can’t get there.');return;}
    commit(as);return;
  }
  if(preview){const[px,py]=toS(preview.x,preview.y);if(hyp(sx-px,sy-py)<40){commit(preview.as);preview=null;return;}}
  const as=makeAssign(movers,tg.x,tg.y);
  if(!as.length){banner('Can’t get there.');preview=null;return;}
  preview={x:tg.x,y:tg.y,as};
}

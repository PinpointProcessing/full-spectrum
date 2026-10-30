"use strict";
/* Pointer, pinch and wheel input on the overlay canvas, and what a tap on the map does. */
let ptr=null;
function unitAtScreen(sx,sy,activeOnly){
  let best=null,bd=26;
  for(const u of players){if(u.dead)continue;if(activeOnly&&u.downed)continue;const[x,y]=toS(u.x+u.lx,u.y+u.ly,8);const d=hyp(x-sx,y-sy);if(d<bd){bd=d;best=u;}}
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
const TWIST_START=0.2;   // radians of twist before rotation kicks in, so a plain pinch doesn't turn the map
function wrapA(a){return Math.atan2(Math.sin(a),Math.cos(a));}
function turnCam(d){yaw=wrapA(yaw+d);clampCam();updateCamera();}
function tiltCam(t){tilt=clamp(t,0,basePitch()-PITCH_MIN);clampCam();updateCamera();}
let boxMode=false,inertia={vx:0,vy:0};
// drawing a route: drag that starts on a soldier. Trail is in world coordinates.
function addTrail(sx,sy){
  const[wx,wy]=toW(sx,sy),p={x:clamp(wx,10,W-10),y:clamp(wy,10,H-10)},l=ptr.trail[ptr.trail.length-1];
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
      const x0=Math.min(ptr.sx,ptr.cx)-8,x1=Math.max(ptr.sx,ptr.cx)+8,y0=Math.min(ptr.sy,ptr.cy)-8,y1=Math.max(ptr.sy,ptr.cy)+8;
      const got=players.filter(u=>{if(!alive(u))return false;const[x,y]=toS(u.x,u.y,8);return x>=x0&&x<=x1&&y>=y0&&y<=y1;});
      if(got.length){select(got);preview=null;mode=null;}
      else if(hyp(ptr.cx-ptr.sx,ptr.cy-ptr.sy)>12)banner('No soldiers in the box.',1400);
      boxMode=false;
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
    const[sx,sy]=localXY(ev);
    touches.set(ev.pointerId,{x:sx,y:sy});
    try{ov.setPointerCapture(ev.pointerId);}catch(_){}
    inertia.vx=inertia.vy=0;
    if(touches.size===2){
      if(ptr){clearTimeout(ptr.timer);ptr=null;}
      const i=pinchInfo(),[wx,wy]=toW(i.mx,i.my);
      pinch={d0:i.d,z0:zoom,wx,wy,a0:i.a,yaw0:yaw,rot:false,my0:i.my,t0:tilt,mode:null};return;
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
      else{ptr.kind='lasso';}
      hud();
    },380);
  });
  ov.addEventListener('pointermove',ev=>{
    const[x,y]=localXY(ev);
    if(touches.has(ev.pointerId))touches.set(ev.pointerId,{x,y});
    if(pinch&&touches.size===2){
      const i=pinchInfo(),da=wrapA(i.a-pinch.a0),dmy=i.my-pinch.my0,dd=i.d-pinch.d0;
      // two fingers moving down/up together tilt the camera; anything else is pinch-zoom and twist
      if(!pinch.mode){
        if(Math.abs(dmy)>14&&Math.abs(dmy)>Math.abs(dd)*1.5&&Math.abs(da)<TWIST_START){pinch.mode='tilt';pinch.my0=i.my;pinch.t0=tilt;}
        else if(Math.abs(dd)>10||Math.abs(da)>TWIST_START)pinch.mode='zoom';
        else return;
      }
      if(pinch.mode==='tilt'){tiltCam(pinch.t0+(i.my-pinch.my0)*0.004);return;}   // pull down = look further out
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
      ptr.kind=(boxMode&&state==='play')?'lasso':ptr.unit&&alive(ptr.unit)?'draw':'pan';
      if(ptr.kind==='draw'){select([ptr.unit]);preview=null;mode=null;hud();}
      ptr.lx=x;ptr.ly=y;ptr.lt=performance.now();
    }
    if(ptr.kind==='draw')addTrail(x,y);
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
  ov.addEventListener('wheel',ev=>{ev.preventDefault();if(ev.shiftKey){tiltCam(tilt-(ev.deltaY||ev.deltaX)*0.0015);return;}const[sx,sy]=localXY(ev);zoomAround(sx,sy,zoom*Math.exp(-ev.deltaY*0.0015));},{passive:false});
  $('#fitBtn').addEventListener('click',()=>{zoom=1;yaw=0;tilt=0;camT={x:W/2,z:H/2};inertia.vx=inertia.vy=0;clampCam();updateCamera();});
}

// changing the selection: soldiers who weren't already selected go back to the automatic sneak/run choice
function select(list){for(const u of list)if(!sel.includes(u))u.gaitForce=null;sel=list;}
function selectTeam(t){select(players.filter(p=>p.team===t&&alive(p)));preview=null;mode=null;}
// gait button: flip the selected soldiers to the other gait, or back to automatic if already flipped
function toggleGait(){
  const act=sel.filter(alive);if(!act.length)return;
  if(act.some(u=>u.gaitForce)){for(const u of act)u.gaitForce=null;}
  else{const g=act.some(u=>autoGait(u)==='sneak')?'run':'sneak';for(const u of act)u.gaitForce=g;}
}
function tap(sx,sy){
  const[wx,wy]=toW(sx,sy),[bx,by]=toS(wx,wy),onGround=hyp(bx-sx,by-sy)<4,inMap=onGround&&wx>=0&&wy>=0&&wx<=W&&wy<=H;
  sel=sel.filter(alive);
  if(mode==='suppress'){
    if(!inMap){mode=null;return;}
    const en=enemyAtScreen(sx,sy),pt=en?{x:en.x,y:en.y}:{x:wx,y:wy};
    if(!enemies.some(e=>!e.dead&&e.seen&&hyp((e.vis?e.x:e.last.x)-pt.x,(e.vis?e.y:e.last.y)-pt.y)<55)){banner('Tap an enemy you have seen.');return;}
    for(const u of sel){u.supT={x:pt.x,y:pt.y};u.focus=null;u.noLine=0;u.lastOrder=simT;}
    if(sel[0])callout(sel[0],'Suppressing!',C.warn);
    mode=null;return;
  }
  if(mode==='grenade'){
    const u=sel[0];if(!u){mode=null;return;}
    if(throwNade(u,wx,wy))mode=null;return;
  }
  const pu=unitAtScreen(sx,sy,false);
  if(pu){
    if(pu.downed){
      const helpers=sel.filter(u=>u!==pu);
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
  const en=enemyAtScreen(sx,sy);
  if(en&&sel.length){for(const u of sel){u.focus=en;u.supT=null;}callout(en,contact?'Focus fire':'Open fire!',C.warn);return;}
  if(!inMap){preview=null;return;}
  if(!sel.length){banner('Select soldiers first.',1600);return;}
  const tg=tapTarget(sx,sy);   // tapping a wall or crate means: stand against the side you tapped
  if(sel.length===1){
    const as=makeAssign(sel,tg.x,tg.y);
    if(!as.length){banner('Can’t get there.');return;}
    commit(as);return;
  }
  if(preview){const[px,py]=toS(preview.x,preview.y);if(hyp(sx-px,sy-py)<40){commit(preview.as);preview=null;return;}}
  const as=makeAssign(sel,tg.x,tg.y);
  if(!as.length){banner('Can’t get there.');preview=null;return;}
  preview={x:tg.x,y:tg.y,as};
}

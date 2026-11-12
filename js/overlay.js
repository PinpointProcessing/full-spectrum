"use strict";
/* 2D canvas drawn over the 3D view: hp bars, hit %, move previews, tracers, callouts, rain. */
let rain=[];
function initRain(){
  const n=reduced?0:Math.round(Math.min(150,cw*ch/2800));
  rain=[];for(let i=0;i<n;i++)rain.push({x:Math.random()*cw,y:Math.random()*ch,l:8+Math.random()*10,v:520+Math.random()*260});
}
function gPath(x,y,r,a0=0,a1=TAU,wedge=false,h=0){   // (h: off the ground, e.g. up the watchtower)
  const n=32,pts=[];toSBack=false;
  if(wedge)pts.push(toS(x,y,h));
  for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;pts.push(toS(x+Math.cos(a)*r,y+Math.sin(a)*r,h));}
  ox.beginPath();if(toSBack)return;   // part of it is behind the camera: draw nothing rather than a shape turned inside out over the screen
  ox.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ox.lineTo(...pts[i]);
  if(wedge)ox.closePath();
}
// an unaware man's view cone cut off by walls: 25 rays, each stopping at the first sight-blocking cell (indoors)
function conePath(e){
  const n=24,pts=[toS(e.x,e.y)];toSBack=false;
  for(let i=0;i<=n;i++){
    const a=e.ang-1.08+2.16*i/n,dx=Math.cos(a),dy=Math.sin(a);let r=12;
    for(const R=eyeR();r<R;r+=6){const x=e.x+dx*r,y=e.y+dy*r,gx=Math.floor(x/CS),gy=Math.floor((y-TOP)/CS);if(gx<0||gy<0||gx>=GW||gy>=GH||sightBlk[gy*GW+gx])break;}
    pts.push(toS(e.x+dx*r,e.y+dy*r));
  }
  ox.beginPath();if(toSBack)return;ox.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ox.lineTo(...pts[i]);ox.closePath();
}
// a vault on a route: a little arc over the window with an arrowhead, so you can see he'll climb through
function vaultMark(a,b,col,alpha){
  const w=b.vault,o=w.o,m=w.vert?{x:w.c,y:a.y+(b.y-a.y)*(w.c-a.x)/((b.x-a.x)||1)}:{x:a.x+(b.x-a.x)*(w.c-a.y)/((b.y-a.y)||1),y:w.c};
  const ux=w.vert?Math.sign(b.x-a.x)||1:0,uy=w.vert?0:Math.sign(b.y-a.y)||1;
  toSBack=false;const[p0,q0]=toS(m.x-ux*12,m.y-uy*12,1),[p1,q1]=toS(m.x+ux*12,m.y+uy*12,1),[pc,qc]=toS(m.x,m.y,30);if(toSBack)return;
  ox.save();ox.globalAlpha=alpha;ox.strokeStyle=col;ox.lineWidth=2;ox.lineCap='round';ox.setLineDash([]);
  ox.beginPath();ox.moveTo(p0,q0);ox.quadraticCurveTo(pc,qc,p1,q1);ox.stroke();
  const ang=Math.atan2(q1-(qc+q1)/2,p1-(pc+p1)/2);   // arrowhead along the curve's end
  ox.beginPath();ox.moveTo(p1,q1);ox.lineTo(p1-Math.cos(ang-.5)*6,q1-Math.sin(ang-.5)*6);ox.moveTo(p1,q1);ox.lineTo(p1-Math.cos(ang+.5)*6,q1-Math.sin(ang+.5)*6);ox.stroke();
  ox.restore();
}
function vaultMarks(u,path,col,alpha){let a={x:u.x,y:u.y};for(const p of path){if(p.vault)vaultMark(a,p,col,alpha);a=p;}}
// screen point under world (x,y), r world units lower on screen whichever way the camera faces
function below(x,y,r){const[a,b]=toS(x,y),[c,d]=toS(x+r,y);return[a,b+hyp(c-a,d-b)];}
function bar(x,y,w,frac,col){ox.fillStyle='rgba(0,0,0,.7)';ox.fillRect(x-1,y-1,w+2,5);ox.fillStyle=col;ox.fillRect(x,y,w*clamp(frac,0,1),3);}
function shield(x,y,col){
  ox.beginPath();ox.moveTo(x,y-5);ox.lineTo(x+4.5,y-3.5);ox.lineTo(x+4,y+1.5);ox.quadraticCurveTo(x+2.5,y+4.5,x,y+5.5);ox.quadraticCurveTo(x-2.5,y+4.5,x-4,y+1.5);ox.lineTo(x-4.5,y-3.5);ox.closePath();
  ox.fillStyle='rgba(0,0,0,.75)';ox.fill();ox.strokeStyle=col;ox.lineWidth=1.5;ox.stroke();
}
function label(text,x,y,col,size=10,weight=600){
  ox.font=`${weight} ${size}px ${HUDFONT}`;ox.textAlign='center';ox.textBaseline='middle';
  ox.lineWidth=3;ox.strokeStyle='rgba(0,0,0,.85)';ox.strokeText(text,x,y);ox.fillStyle=col;ox.fillText(text,x,y);
}
function pill(text,x,y,col){
  ox.font=`700 10px ${HUDFONT}`;const w=ox.measureText(text).width+10;
  ox.fillStyle='rgba(6,9,12,.88)';ox.strokeStyle=col;ox.lineWidth=1;
  ox.beginPath();ox.roundRect?ox.roundRect(x-w/2,y-7,w,14,3):ox.rect(x-w/2,y-7,w,14);ox.fill();ox.stroke();
  ox.fillStyle=col;ox.textAlign='center';ox.textBaseline='middle';ox.fillText(text,x,y+.5);
}
/* speech bubbles (combat.js's bubble(): Bryan, after v104, a soldier who can't do what he's told says why "as a voice bubble
   above them"): a white rounded box over his head with a tail down to him, popping in, gone after BUBBLE_MS real milliseconds;
   kept on screen at its edge (no tail) when he's off it */
const BUBBLE_MS=2600;
function bubblePath(x0,y0,w,h,r,ax,ay){   // the box, and with ay a tail from its bottom edge down to (ax,ay)
  const x1=x0+w,y1=y0+h,tx=clamp(ax,x0+r+7,x1-r-7);
  ox.beginPath();ox.moveTo(x0+r,y0);ox.lineTo(x1-r,y0);ox.quadraticCurveTo(x1,y0,x1,y0+r);ox.lineTo(x1,y1-r);ox.quadraticCurveTo(x1,y1,x1-r,y1);
  if(ay!=null){ox.lineTo(tx+6,y1);ox.lineTo(ax,ay);ox.lineTo(tx-6,y1);}
  ox.lineTo(x0+r,y1);ox.quadraticCurveTo(x0,y1,x0,y1-r);ox.lineTo(x0,y0+r);ox.quadraticCurveTo(x0,y0,x0+r,y0);ox.closePath();
}
function drawBubbles(){
  if(!bubbles.length)return;
  const now=performance.now();bubbles=bubbles.filter(b=>now-b.t0<BUBBLE_MS&&!b.u.dead&&units.includes(b.u));
  for(const b of bubbles){
    const u=b.u;if(offFloor(u)||u.away)continue;
    const age=now-b.t0,pop=Math.min(1,age/140),A=Math.min(1,(BUBBLE_MS-age)/450);
    const ev=u.onTower||u.climb?u.elev||0:0;toSBack=false;const[ax,ay0]=toS(u.x+(u.lx||0),u.y+(u.ly||0),24+ev),back=toSBack,ay=ay0-22;   // (its tail stops above his bar and PINNED)
    ox.font=`700 12px ${HUDFONT}`;const w=ox.measureText(b.text).width+18,h=22,minY=58,maxY=ch-76;
    let x0=ax-w/2,y0=ay-10-h,tail=!back;
    if(back){x0=cw/2-w/2;y0=maxY-h;}
    else{const cx0=clamp(x0,6,cw-w-6),cy0=clamp(y0,minY,maxY-h);if(cx0!==x0||cy0!==y0){tail=false;x0=cx0;y0=cy0;}}
    ox.save();ox.globalAlpha=A;const s=.85+.15*pop,px=x0+w/2,py=y0+h;ox.translate(px,py);ox.scale(s,s);ox.translate(-px,-py);
    bubblePath(x0,y0,w,h,6,ax,tail?ay:null);
    ox.fillStyle='rgba(244,246,247,.96)';ox.fill();ox.lineWidth=2;ox.strokeStyle=b.col;ox.stroke();
    ox.fillStyle='#101418';ox.textAlign='center';ox.textBaseline='middle';ox.fillText(b.text,px,y0+h/2+.5);
    ox.restore();
  }
}
// smoke clouds (map.js SMOKE): soft grey puffs at a few heights, drifting a little downwind and rising as they thin out
function drawSmoke(){
  for(const c of smokes){
    const age=simT-c.t0,r=smokeR(c),fadeIn=Math.min(1,age/.5),fadeOut=Math.min(1,(SMOKE.life-age)/SMOKE.fade),A=.62*fadeIn*fadeOut;if(A<=.01)continue;
    for(let i=0;i<10;i++){
      const a=i*2.39996+c.x*.013,d=r*.55*Math.sqrt((i+.5)/10),px=c.x+Math.cos(a)*d+age*3,py=c.y+Math.sin(a)*d,h=4+(i%3)*6+age*.7,pr=r*(.42+.07*(i%3));
      toSBack=false;const[sx,sy]=toS(px,py,h),[ax,ay]=toS(px+pr,py,h),[bx,by]=toS(px,py+pr,h);if(toSBack)continue;
      const sr=Math.max(hyp(ax-sx,ay-sy),hyp(bx-sx,by-sy));if(sr<2||sx<-sr||sy<-sr||sx>cw+sr||sy>ch+sr)continue;
      const g=ox.createRadialGradient(sx,sy,0,sx,sy,sr);g.addColorStop(0,`rgba(150,158,166,${A.toFixed(3)})`);g.addColorStop(.55,`rgba(124,132,140,${(A*.62).toFixed(3)})`);g.addColorStop(1,'rgba(100,108,116,0)');
      ox.fillStyle=g;ox.beginPath();ox.arc(sx,sy,sr,0,TAU);ox.fill();
    }
  }
}
function drawOverlay(rdt,now){
  ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);
  if(typeof cineOn==='function'&&cineOn())return;   // (the montage after the Headquarters: just the picture, base.js)
  const pulse=(Math.sin(now*4)+1)/2;
  // enemy view cones (unaware, seen)
  for(const e of enemies){
    if(e.dead||e.alerted||e.surr||!e.vis||offFloor(e))continue;
    if(MAPID==='in')conePath(e);else{const{r:R,cone:A}=eyeOf(e);gPath(e.x,e.y,R,e.ang-A,e.ang+A,true);}   // indoors the cone stops at walls; a man with eyes of his own (Level 1's guards, the sniper) shows his own reach
    ox.fillStyle=`rgba(255,80,60,${(.07+e.aware*.2).toFixed(3)})`;ox.fill();
  }
  // suppression zones
  const zones=new Map();for(const p of players)if(alive(p)&&p.supT)zones.set(p.supT.x+','+p.supT.y,p.supT);
  for(const s of zones.values()){
    gPath(s.x,s.y,55);ox.setLineDash([5,5]);ox.lineDashOffset=-now*20;ox.strokeStyle=C.warn;ox.globalAlpha=.55+pulse*.3;ox.lineWidth=1.5;ox.stroke();ox.setLineDash([]);ox.globalAlpha=1;
    const[lx,ly]=below(s.x,s.y,62);label('SUPPRESSING',lx,ly,C.warn,9);
  }
  // move paths
  for(const u of players){
    if(!alive(u)||!u.path.length||(typeof endingBusy==='function'&&endingBusy()))continue;const isSel=sel.includes(u);   // (none in the scene at the Headquarters' end: fortress.js)
    ox.strokeStyle=teamCol(u);ox.globalAlpha=isSel?.7:.3;ox.setLineDash([4,5]);ox.lineWidth=1.4;
    toSBack=false;ox.beginPath();let[a,b]=toS(u.x,u.y,.5);ox.moveTo(a,b);for(const p of u.path){[a,b]=toS(p.x,p.y,.5);ox.lineTo(a,b);}if(!toSBack)ox.stroke();
    ox.setLineDash([]);
    const d=u.path[u.path.length-1];gPath(d.x,d.y,5);ox.stroke();ox.globalAlpha=1;
    vaultMarks(u,u.path,teamCol(u),isSel?.95:.5);
  }
  // preview ghosts
  if(preview){
    for(const a of preview.as){
      const[ux,uy]=toS(a.u.x,a.u.y),col=a.cov?C.good:C.bad;
      ox.strokeStyle=teamCol(a.u);ox.globalAlpha=.5;ox.setLineDash([3,4]);ox.lineWidth=1.2;ox.beginPath();ox.moveTo(ux,uy);
      for(const p of a.path||[{x:a.x,y:a.y}]){const[px,py]=toS(p.x,p.y);ox.lineTo(px,py);}   // the way he'll actually go (round by a window, say)
      ox.stroke();ox.setLineDash([]);ox.globalAlpha=1;
      gPath(a.x,a.y,8);ox.fillStyle=a.cov?'rgba(95,224,142,.3)':'rgba(255,90,72,.3)';ox.fill();ox.strokeStyle=col;ox.lineWidth=2;ox.stroke();
      const[lx,ly]=toS(a.x,a.y,18);label(a.u.id,lx,ly,teamCol(a.u),9,700);
      vaultMarks(a.u,a.path,'#eef2f5',.9);   // he'll go through a window to get there
    }
    if(!preview.veh){   // a drive order draws its own ghost (vehicle.js)
      gPath(preview.x,preview.y,15+pulse*3);ox.strokeStyle='rgba(235,240,245,.9)';ox.lineWidth=1.6;ox.stroke();
      const covN=preview.as.filter(a=>a.cov).length,[px,py]=below(preview.x,preview.y,24);
      label(`TAP AGAIN TO MOVE · ${covN}/${preview.as.length} IN COVER`,px,py+6,'#eef2f5',10,700);
    }
  }
  // a route being drawn (hold a soldier, then drag: input.js): the line, and a ring where it ends, green in cover, red in the open
  if(ptr&&ptr.kind==='draw'&&ptr.trail.length){
    const u=ptr.unit,e=ptr.trail[ptr.trail.length-1],cov=isCovered(e,threats());
    ox.strokeStyle=teamCol(u);ox.globalAlpha=.85;ox.lineWidth=3;ox.lineJoin='round';ox.lineCap='round';
    toSBack=false;ox.beginPath();let[a,b]=toS(u.x,u.y,.5);ox.moveTo(a,b);for(const p of ptr.trail){[a,b]=toS(p.x,p.y,.5);ox.lineTo(a,b);}if(!toSBack)ox.stroke();ox.globalAlpha=1;
    gPath(e.x,e.y,8);ox.fillStyle=cov?'rgba(95,224,142,.3)':'rgba(255,90,72,.3)';ox.fill();ox.strokeStyle=cov?C.good:C.bad;ox.lineWidth=2;ox.stroke();
  }
  // aiming a throw: the dashed ring, from where he stands; for smoke and a rocket the fainter dotted one outside it, as far as
  // it goes once he's moved up inside his circle (combat.js's ACT_R: Bryan, after v104); further than that he says it's too
  // far. A frag walks up to 36 m (Bryan, after v105): no dotted ring
  if((mode==='grenade'||mode==='smoke'||mode==='rpg')&&sel[0]){const R0=mode==='smoke'?SMOKE.range:mode==='rpg'?PRPG.range:nadeRange(sel[0]);gPath(sel[0].x,sel[0].y,R0);ox.setLineDash([6,5]);ox.strokeStyle=mode==='smoke'?'#cfd6dc':mode==='rpg'?'#ffb36b':C.warn;ox.globalAlpha=.75;ox.lineWidth=1.5;ox.stroke();
    if(mode!=='grenade'){gPath(sel[0].x,sel[0].y,R0+ACT_R);ox.setLineDash([2,6]);ox.globalAlpha=.4;ox.lineWidth=1.2;ox.stroke();}ox.setLineDash([]);ox.globalAlpha=1;}

  // tracers, flashes, sparks, blasts
  ox.globalCompositeOperation='lighter';
  for(const t of tracers){
    toSBack=false;const k=1-t.t/.12,[x1,y1]=toS(t.x1,t.y1,12),[x2,y2]=toS(t.x2,t.y2,10),s=Math.max(0,t.t/.12-.35);if(toSBack)continue;
    ox.strokeStyle=`rgba(${t.col},${(t.q?.45:.9)*k})`;ox.lineWidth=t.q?1.2:1.8;ox.beginPath();ox.moveTo(x1+(x2-x1)*s,y1+(y2-y1)*s);ox.lineTo(x2,y2);ox.stroke();   // (silenced: fainter. A comment had swallowed the drawing, so no tracers showed at all)
  }
  // (muzzle flashes: 3D sprites at the muzzle now, which the bloom makes glow: post.js's fxFrame)
  for(const s of sparks){const[sx,sy]=toS(s.x,s.y,6),k=1-s.t/.22;ox.fillStyle=`rgba(255,200,120,${k})`;for(let i=0;i<4;i++){const a=i*1.7+s.x,d=2+s.t*40;ox.fillRect(sx+Math.cos(a)*d,sy+Math.sin(a)*d,1.6,1.6);}}
  for(const b of booms){const k=b.t/.6;gPath(b.x,b.y,10+70*k);ox.strokeStyle=`rgba(255,200,130,${1-k})`;ox.lineWidth=3*(1-k)+1;ox.stroke();}
  ox.globalCompositeOperation='source-over';
  for(const n of nades){
    const k=n.t/n.dur,x=n.x0+(n.x1-n.x0)*k,y=n.y0+(n.y1-n.y0)*k,h=Math.sin(k*Math.PI)*30+8*(1-k);
    const[sx,sy]=toS(x,y),[bx,by]=toS(x,y,h);ox.fillStyle='rgba(0,0,0,.55)';ox.beginPath();ox.arc(sx,sy,2.5,0,TAU);ox.fill();
    ox.fillStyle=n.smoke?'#b9c0c6':'#c9d1a0';ox.beginPath();ox.arc(bx,by,3,0,TAU);ox.fill();
  }
  drawSmoke();drawOrders(now);drawBuilds(now);drawSkills(now);drawLayers(now);drawHold(now);   // (orders.js, layers.js; the hold-to-suppress ring: input.js)

  drawStations(now);drawVehicle(rdt,now);drawMission(rdt,now);   // (the medic stations' and ammo drops' rings: hq.js; the Headquarters' own bar is drawn from drawMission)
  // where the hunters think the squad is (hunt.js): a faint ring where they're searching
  {const done=[];for(const e of enemies){if(e.dead||!e.alerted||!e.hunt||!e.lkp||offFloor(e))continue;const L=e.lkp;if(done.some(d=>hyp(d.x-L.x,d.y-L.y)<80))continue;done.push(L);
    gPath(L.x,L.y,22+Math.sin(now*3)*2);ox.setLineDash([3,5]);ox.strokeStyle='rgba(205,210,215,.55)';ox.lineWidth=1.4;ox.stroke();ox.setLineDash([]);const[lx,ly]=below(L.x,L.y+22,4);label('SEARCHING',lx,ly,'rgba(205,210,215,.75)',8,700);}}
  // enemy info
  const act=sel.filter(alive);
  for(const e of enemies){
    if(e.dead||offFloor(e))continue;
    if(e.surr){if(e.vis&&!e.tied&&act.length&&!zipFor(e)){const[fx,fy]=toS(e.x,e.y);pill('ZIP-TIE',fx,fy+16,C.good);}continue;}   // he gave up: tap him (layers.js draws his label)
    if(e.vis){
      const vx=e.x+e.lx,vy=e.y+e.ly,[hx,hy]=toS(vx,vy,24),[fx,fy]=toS(vx,vy);
      if(e.hitFlash>0){gPath(vx,vy,7+(.25-e.hitFlash)*30);ox.strokeStyle=`rgba(255,60,40,${(e.hitFlash*3).toFixed(2)})`;ox.lineWidth=2;ox.stroke();}   // hit: a red pulse
      {const mh=e.veh?GJEEP.hp:100,k=e.hp/mh;if(k<1)bar(hx-9,hy-6,18,k,k>.6?C.good:k>.3?C.warn:C.bad);}
      if(e.mon){}   // (nothing over a monster but its health: Bryan)
      else if(e.sup>0.65&&e.alerted)label('PINNED',hx,hy-14,C.warn,9,700);
      else if(e.sup>0.08&&e.alerted)bar(hx-9,hy-1,18,e.sup/0.65,C.warn);
      const stalked=players.some(p=>p.tk&&p.tk.e===e);
      if(!e.mon&&(stalked||act.length)){   // (none under a monster either: a swarm of them each with a hit chance was a wall of words)   // his label: TAKEDOWN if his back is to the one soldier selected (and while he's stalked), else the best hit chance. Worked out ~7 times a second, not every frame
        const key=act.map(u=>u.id).join(),nowMs=performance.now();let pc=e._pill;
        if(!pc||pc.key!==key||pc.stalked!==stalked||nowMs-pc.t>150||volley&&nowMs-pc.t>60){
          let text,col;
          if(stalked||(act.length===1&&canTakedown(act[0],e))){text='TAKEDOWN';col=C.good;}
          else if(volley&&volley.targets.includes(e)&&volley.at==null&&act.some(u=>volley.by.includes(u)||volley.movers.includes(u))){text=volley.movers.length?'MOVING UP · TAP TO FIRE':'ON MY MARK · TAP TO FIRE';col=C.good;}   // the volley getting set (combat.js)
          else if(act.length===1&&canSilent(act[0],e)){const pct=Math.round(silentChance(act[0],e)*100);text=`SILENT SHOT ${pct}%`;col=pct>=60?C.good:pct>=35?C.warn:C.bad;}   // a silencer (combat.js)
          else if(act.length>1&&canVolley(act,e)){   // a volley (combat.js): the silencers who'd take him, together
            const crew=act.filter(u=>canSilent(u,e)),pct=Math.round(Math.max(...crew.map(u=>silentChance(u,e)))*100);
            if(volley&&volley.targets.includes(e)){text=volley.at==null?'ON MY MARK · TAP TO FIRE':'ON MY MARK';col=C.good;}
            else{text=`SILENT SHOT ${pct}% · ${crew.length} READY`;col=pct>=60?C.good:pct>=35?C.warn:C.bad;}
          }
          else{
            let best=0,bc=0,lean=false,bu=null;
            for(const u of act){if(hyp(u.x-e.x,u.y-e.y)>wRange(u))continue;const L=fireLine(u,e);if(!L)continue;const c=hitChance(u,e,L);if(c>best){best=c;bc=shotCover(L);lean=L.lean;bu=u;}}
            if(best>0){const pct=Math.round(best*100);text=`${pct}% · ${bc===2?'heavy':bc===1?'cover':'open'}${lean?' · peek':''}${ambushing(bu)?' · ambush':''}`;col=pct>=60?C.good:pct>=35?C.warn:C.bad;}
            else{text='no line';col='#7d8a94';}
          }
          pc=e._pill={t:nowMs,key,stalked,text,col};
        }
        pill(pc.text,fx,fy+16,pc.col);
      }
      if(act.some(u=>u.focus===e)){gPath(vx,vy,11);ox.strokeStyle=C.warn;ox.lineWidth=2;ox.stroke();}
      if(e.reloadT>simT)label('RELOADING',fx,fy+29,C.good,9,700);   // the run's heavy gun: dash now
      if(e.radio){label(e.call?'CALLING IT IN':'RADIO',fx,fy+29,e.call?'#ff5a48':'#ffb0a0',8,700);   // the radio man (hunt.js): kill or pin him before the call goes out
        if(e.call){gPath(vx,vy,15,-Math.PI/2,-Math.PI/2+e.call.t/CALL_T*TAU);ox.strokeStyle='#ff3b2a';ox.lineWidth=2.6;ox.stroke();}}
      if(players.some(p=>p.silent&&p.silent.e===e)){gPath(vx,vy,9+Math.sin(now*9)*1.2);ox.strokeStyle='rgba(169,196,214,.95)';ox.lineWidth=1.6;ox.stroke();}   // lined up for a silent shot
      if(stalked){gPath(vx,vy,11+Math.sin(now*6)*1.5);ox.strokeStyle=C.good;ox.lineWidth=2;ox.setLineDash([4,3]);ox.stroke();ox.setLineDash([]);}   // being stalked for a takedown
    }else if(e.seen&&e.last){
      gPath(e.last.x,e.last.y,7);ox.setLineDash([3,3]);ox.strokeStyle='rgba(255,90,72,.7)';ox.lineWidth=1.4;ox.stroke();ox.setLineDash([]);
      const[sx,sy]=toS(e.last.x,e.last.y,6);label('?',sx,sy,'rgba(255,110,90,.95)',11,700);
    }
  }
  // squad info
  for(const u of players){
    if(u.seat==='driver'||u.offMap||u.inHeli||u.away||offFloor(u))continue;   // behind the wheel: the jeep's own label covers him; left outside the office building: not on this map
    // shoulder to shoulder with an earlier teammate: lift this one's bar so the two don't overlap
    const crowd=players.filter((o,i)=>i<players.indexOf(u)&&!o.dead&&o.seat!=='driver'&&hyp(o.x-u.x,o.y-u.y)<16).length;
    const vx=u.x+u.lx,vy=u.y+u.ly,ev=u.onTower||u.climb?u.elev||0:0,[hx,hy0]=toS(vx,vy,24+ev),hy=hy0-crowd*10,[fx,fy]=toS(vx,vy,ev);   // (up the watchtower: on the platform)
    if(u.gone)continue;   // lost on an earlier visit (loaded save): no body here
    if(u.inBoat&&MAPID==='dd')continue;   // (D-Day's ride in: nothing over the men in the boat)
    if(u.dead){label('KIA',hx,hy,'#8c959b',9);continue;}
    if(MAPID==='dd'&&dd&&u.side==='P'&&!u.npc){   // D-Day: the squad you play stands out (Bryan: "I was getting confused with what squad I was using and where they were"):
      const mine=u.team===dd.active,tc=teamCol(u);   // a filled disc and a thick ring in its colour under each man and a marker over his head; the other squad a thin ring
      gPath(vx,vy,mine?13:9,0,TAU,false,ev);if(!toSBack){if(mine){ox.globalAlpha=.3;ox.fillStyle=tc;ox.fill();ox.globalAlpha=1;}ox.strokeStyle=tc;ox.lineWidth=mine?3:1.2;ox.globalAlpha=mine?1:.55;ox.stroke();ox.globalAlpha=1;}
      if(mine&&!u.downed){const y0=hy-(u.hp<99||u.sup>=.08?19:11);ox.beginPath();ox.moveTo(hx-7,y0-11);ox.lineTo(hx+7,y0-11);ox.lineTo(hx,y0);ox.closePath();ox.fillStyle=tc;ox.fill();ox.strokeStyle='rgba(8,11,14,.85)';ox.lineWidth=1.2;ox.stroke();}}
    if(sel.includes(u)){gPath(vx,vy,9.5,0,TAU,false,ev);ox.strokeStyle='rgba(240,245,250,.95)';ox.setLineDash([4,3]);ox.lineDashOffset=-now*10;ox.lineWidth=1.6;ox.stroke();ox.setLineDash([]);}
    if(MAPID==='dd'&&sel.includes(u)&&!u.downed){   // D-Day: an arrowhead on his ring the way he faces (Bryan: "when you select a squad, it shows you the direction they are facing")
      const A=u.ang,P=(r,d)=>toS(vx+Math.cos(A+d)*r,vy+Math.sin(A+d)*r,ev||0),t=P(19,0),l=P(12.5,.34),r2=P(12.5,-.34);
      ox.beginPath();ox.moveTo(t[0],t[1]);ox.lineTo(l[0],l[1]);ox.lineTo(r2[0],r2[1]);ox.closePath();ox.fillStyle=teamCol(u);ox.fill();ox.strokeStyle='rgba(8,11,14,.8)';ox.lineWidth=1;ox.stroke();}
    {const md=!u.downed&&players.find(o=>o.medGo&&o.medGo.heal&&o.medGo.t===u&&o.medGo.prog>0);if(md){gPath(vx,vy,13,-Math.PI/2,-Math.PI/2+md.medGo.prog/HEAL_T*TAU,false,ev);ox.strokeStyle=md.sup>PINNED?C.warn:C.good;ox.lineWidth=2.4;ox.stroke();}}   // a medic kit on a man who's up (combat.js)
    if(u.downed){
      const k=u.critical?(u.noBleed?1:u.crit/CRIT_T):u.bleed/BLEED_T;gPath(u.x,u.y,13,-Math.PI/2,-Math.PI/2+k*TAU);ox.strokeStyle=u.critical?'#ff3b30':C.bad;ox.lineWidth=u.critical?3:2;ox.stroke();
      const medic=players.find(o=>o.medGo&&o.medGo.t===u&&!o.path.length),prog=u.revive>0?u.revive/(u.reviveNeed||3):medic?medic.medGo.prog/MEDKIT_T:u.boxRev>0?u.boxRev/BOXREV_T:0;
      if(prog>0){gPath(u.x,u.y,16,-Math.PI/2,-Math.PI/2+prog*TAU);ox.strokeStyle=C.good;ox.stroke();}
      const pinnedHelp=u.revive<=0&&players.some(o=>o!==u&&alive(o)&&!o.path.length&&hyp(o.x-u.x,o.y-u.y)<24&&o.sup>PINNED);   // a teammate beside him, but pinned: no reviving (Bryan)
      const txt=u.carriedBy?(u.noBleed?'CARRIED':`CARRIED · ${fmtT(u.crit)}`):medic?(medic.sup>PINNED?'MEDIC PINNED':'MEDIC KIT'):u.boxRev>0?'REVIVING':u.critical?(u.noBleed?'NEEDS A MEDIC KIT':`CRITICAL · ${fmtT(u.crit)}`):u.revive>0?'REVIVING':pinnedHelp?`HELPER PINNED · ${Math.ceil(u.bleed)}s`:`DOWN ${Math.ceil(u.bleed)}s`;
      label(txt,hx,hy-6,prog>0&&!(medic&&medic.sup>PINNED)?C.good:pinnedHelp||(medic&&medic.sup>PINNED)?C.warn:C.bad,9,700);
      continue;
    }
    // calm, unhurt and not selected: just his callsign, faint (the dark world breathes: docs/feel-plan.md); the bars come back
    // when he's selected, hurt, suppressed or in a fight
    if(!caught(u)&&!sel.includes(u)&&u.hp>=99&&u.sup<.08&&!u.carry){ox.globalAlpha=.55;label(u.id,fx,fy+15,teamCol(u),9,700);ox.globalAlpha=1;continue;}
    bar(hx-9,hy-6,18,u.hp/100,u.hp>60?C.good:u.hp>30?C.warn:C.bad);
    shield(hx+16,hy-4,peekOf(u)?C.warn:u.covered?C.good:C.bad);
    label(u.id,fx,fy+15,teamCol(u),9,700);
    if(u.sup>0.65)label('PINNED',hx,hy-15,C.warn,9,700);
    else if(u.sup>0.08)bar(hx-9,hy-1,18,u.sup/0.65,C.warn);
  }
  for(const c of callouts){if(offFloor(c))continue;const[sx,sy]=toS(c.x,c.y,30),k=c.t/(c.dur||1.7);ox.globalAlpha=(c.small?.85:1)*(1-Math.max(0,k-.6)/.4);label(c.text,sx,sy-k*16,c.col,c.small?9:11,c.small?600:700);ox.globalAlpha=1;}
  drawBubbles();
  if(ptr&&ptr.kind==='lasso'&&ptr.loop.length>1){   // lasso loop, closed back to its start
    ox.beginPath();ox.moveTo(...ptr.loop[0]);for(const p of ptr.loop)ox.lineTo(...p);ox.closePath();
    ox.fillStyle='rgba(94,200,255,.1)';ox.fill();ox.strokeStyle='rgba(94,200,255,.85)';ox.lineWidth=1.5;ox.setLineDash([5,4]);ox.stroke();ox.setLineDash([]);
  }
  // rain (outdoors only)
  if(MAPID==='out'||hqRoof()||l4Out()){
  const rts=state==='play'?timeScale():1;
  ox.strokeStyle='rgba(170,195,220,.2)';ox.lineWidth=1;ox.beginPath();
  for(const d of rain){
    d.y+=d.v*rdt*rts;d.x+=d.v*.16*rdt*rts;
    if(d.y>ch+20){d.y=-20;d.x=Math.random()*cw;}if(d.x>cw+10)d.x=-10;
    ox.moveTo(d.x,d.y);ox.lineTo(d.x-d.l*.16,d.y-d.l);
  }
  ox.stroke();
  }
  if(storm>0){ox.fillStyle=`rgba(200,215,235,${storm*.1})`;ox.fillRect(0,0,cw,ch);}
}

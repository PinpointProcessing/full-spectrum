"use strict";
/* 2D canvas drawn over the 3D view: hp bars, hit %, move previews, tracers, callouts, rain. */
let rain=[];
function initRain(){
  const n=reduced?0:Math.round(Math.min(150,cw*ch/2800));
  rain=[];for(let i=0;i<n;i++)rain.push({x:Math.random()*cw,y:Math.random()*ch,l:8+Math.random()*10,v:520+Math.random()*260});
}
function gPath(x,y,r,a0=0,a1=TAU,wedge=false){
  ox.beginPath();const n=32;
  if(wedge){const[p,q]=toS(x,y);ox.moveTo(p,q);}
  for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n,[p,q]=toS(x+Math.cos(a)*r,y+Math.sin(a)*r);if(i===0&&!wedge)ox.moveTo(p,q);else ox.lineTo(p,q);}
  if(wedge)ox.closePath();
}
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
function drawOverlay(rdt,now){
  ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);
  const pulse=(Math.sin(now*4)+1)/2;
  // enemy view cones (unaware, seen)
  for(const e of enemies){
    if(e.dead||e.alerted||!e.vis)continue;
    gPath(e.x,e.y,300,e.ang-1.08,e.ang+1.08,true);ox.fillStyle=`rgba(255,80,60,${(.07+e.aware*.2).toFixed(3)})`;ox.fill();
  }
  // suppression zones
  const zones=new Map();for(const p of players)if(alive(p)&&p.supT)zones.set(p.supT.x+','+p.supT.y,p.supT);
  for(const s of zones.values()){
    gPath(s.x,s.y,55);ox.setLineDash([5,5]);ox.lineDashOffset=-now*20;ox.strokeStyle=C.warn;ox.globalAlpha=.55+pulse*.3;ox.lineWidth=1.5;ox.stroke();ox.setLineDash([]);ox.globalAlpha=1;
    const[lx,ly]=below(s.x,s.y,62);label('SUPPRESSING',lx,ly,C.warn,9);
  }
  // move paths
  for(const u of players){
    if(!alive(u)||!u.path.length)continue;const isSel=sel.includes(u);
    ox.strokeStyle=teamCol(u);ox.globalAlpha=isSel?.7:.3;ox.setLineDash([4,5]);ox.lineWidth=1.4;
    ox.beginPath();let[a,b]=toS(u.x,u.y,.5);ox.moveTo(a,b);for(const p of u.path){[a,b]=toS(p.x,p.y,.5);ox.lineTo(a,b);}ox.stroke();
    ox.setLineDash([]);
    const d=u.path[u.path.length-1];gPath(d.x,d.y,5);ox.stroke();ox.globalAlpha=1;
  }
  // preview ghosts
  if(preview){
    for(const a of preview.as){
      const[ux,uy]=toS(a.u.x,a.u.y),[gx,gy]=toS(a.x,a.y),col=a.cov?C.good:C.bad;
      ox.strokeStyle=teamCol(a.u);ox.globalAlpha=.5;ox.setLineDash([3,4]);ox.lineWidth=1.2;ox.beginPath();ox.moveTo(ux,uy);ox.lineTo(gx,gy);ox.stroke();ox.setLineDash([]);ox.globalAlpha=1;
      gPath(a.x,a.y,8);ox.fillStyle=a.cov?'rgba(95,224,142,.3)':'rgba(255,90,72,.3)';ox.fill();ox.strokeStyle=col;ox.lineWidth=2;ox.stroke();
      const[lx,ly]=toS(a.x,a.y,18);label(a.u.id,lx,ly,teamCol(a.u),9,700);
    }
    gPath(preview.x,preview.y,15+pulse*3);ox.strokeStyle='rgba(235,240,245,.9)';ox.lineWidth=1.6;ox.stroke();
    const covN=preview.as.filter(a=>a.cov).length,[px,py]=below(preview.x,preview.y,24);
    label(`TAP AGAIN TO MOVE · ${covN}/${preview.as.length} IN COVER`,px,py+6,'#eef2f5',10,700);
  }
  // route being drawn
  if(ptr&&ptr.kind==='draw'&&ptr.trail.length){
    const u=ptr.unit,e=ptr.trail[ptr.trail.length-1],cov=isCovered(e,threats());
    ox.strokeStyle=teamCol(u);ox.globalAlpha=.85;ox.lineWidth=3;ox.lineJoin='round';ox.lineCap='round';
    ox.beginPath();let[a,b]=toS(u.x,u.y,.5);ox.moveTo(a,b);for(const p of ptr.trail){[a,b]=toS(p.x,p.y,.5);ox.lineTo(a,b);}ox.stroke();ox.globalAlpha=1;
    gPath(e.x,e.y,8);ox.fillStyle=cov?'rgba(95,224,142,.3)':'rgba(255,90,72,.3)';ox.fill();ox.strokeStyle=cov?C.good:C.bad;ox.lineWidth=2;ox.stroke();
  }
  if(mode==='grenade'&&sel[0]){gPath(sel[0].x,sel[0].y,170);ox.setLineDash([6,5]);ox.strokeStyle=C.warn;ox.globalAlpha=.75;ox.lineWidth=1.5;ox.stroke();ox.setLineDash([]);ox.globalAlpha=1;}

  // tracers, flashes, sparks, blasts
  ox.globalCompositeOperation='lighter';
  for(const t of tracers){
    const k=1-t.t/.12,[x1,y1]=toS(t.x1,t.y1,12),[x2,y2]=toS(t.x2,t.y2,10),s=Math.max(0,t.t/.12-.35);
    ox.strokeStyle=`rgba(${t.col},${.9*k})`;ox.lineWidth=1.8;ox.beginPath();ox.moveTo(x1+(x2-x1)*s,y1+(y2-y1)*s);ox.lineTo(x2,y2);ox.stroke();
  }
  for(const f of flashes){const[sx,sy]=toS(f.x,f.y,12);ox.fillStyle=`rgba(255,220,150,${.95*(1-f.t/.07)})`;ox.beginPath();ox.arc(sx,sy,5,0,TAU);ox.fill();}
  for(const s of sparks){const[sx,sy]=toS(s.x,s.y,6),k=1-s.t/.22;ox.fillStyle=`rgba(255,200,120,${k})`;for(let i=0;i<4;i++){const a=i*1.7+s.x,d=2+s.t*40;ox.fillRect(sx+Math.cos(a)*d,sy+Math.sin(a)*d,1.6,1.6);}}
  for(const b of booms){const k=b.t/.6;gPath(b.x,b.y,10+70*k);ox.strokeStyle=`rgba(255,200,130,${1-k})`;ox.lineWidth=3*(1-k)+1;ox.stroke();}
  ox.globalCompositeOperation='source-over';
  for(const n of nades){
    const k=n.t/n.dur,x=n.x0+(n.x1-n.x0)*k,y=n.y0+(n.y1-n.y0)*k,h=Math.sin(k*Math.PI)*30+8*(1-k);
    const[sx,sy]=toS(x,y),[bx,by]=toS(x,y,h);ox.fillStyle='rgba(0,0,0,.55)';ox.beginPath();ox.arc(sx,sy,2.5,0,TAU);ox.fill();
    ox.fillStyle='#c9d1a0';ox.beginPath();ox.arc(bx,by,3,0,TAU);ox.fill();
  }

  // enemy info
  const act=sel.filter(alive);
  for(const e of enemies){
    if(e.dead)continue;
    if(e.vis){
      const vx=e.x+e.lx,vy=e.y+e.ly,[hx,hy]=toS(vx,vy,24),[fx,fy]=toS(vx,vy);
      if(e.hp<100)bar(hx-9,hy-6,18,e.hp/100,e.hp>60?C.good:e.hp>30?C.warn:C.bad);
      if(e.sup>0.65&&e.alerted)label('PINNED',hx,hy-14,C.warn,9,700);
      else if(e.sup>0.08&&e.alerted)bar(hx-9,hy-1,18,e.sup/0.65,C.warn);
      if(act.length){
        let best=0,bc=0,lean=false;
        for(const u of act){if(hyp(u.x-e.x,u.y-e.y)>380)continue;const L=fireLine(u,e);if(!L)continue;const c=hitChance(u,e,L);if(c>best){best=c;bc=shotCover(L);lean=L.lean;}}
        if(best>0){const pct=Math.round(best*100);pill(`${pct}% · ${bc===2?'heavy':bc===1?'cover':'open'}${lean?' · peek':''}${ambushing()?' · ambush':''}`,fx,fy+16,pct>=60?C.good:pct>=35?C.warn:C.bad);}
        else pill('no line',fx,fy+16,'#7d8a94');
      }
      if(act.some(u=>u.focus===e)){gPath(vx,vy,11);ox.strokeStyle=C.warn;ox.lineWidth=2;ox.stroke();}
    }else if(e.seen&&e.last){
      gPath(e.last.x,e.last.y,7);ox.setLineDash([3,3]);ox.strokeStyle='rgba(255,90,72,.7)';ox.lineWidth=1.4;ox.stroke();ox.setLineDash([]);
      const[sx,sy]=toS(e.last.x,e.last.y,6);label('?',sx,sy,'rgba(255,110,90,.95)',11,700);
    }
  }
  // squad info
  for(const u of players){
    // shoulder to shoulder with an earlier teammate: lift this one's bar so the two don't overlap
    const crowd=players.some((o,i)=>i<players.indexOf(u)&&!o.dead&&hyp(o.x-u.x,o.y-u.y)<16);
    const vx=u.x+u.lx,vy=u.y+u.ly,[hx,hy0]=toS(vx,vy,24),hy=hy0-(crowd?10:0),[fx,fy]=toS(vx,vy);
    if(u.dead){label('KIA',hx,hy,'#8c959b',9);continue;}
    if(sel.includes(u)){gPath(vx,vy,9.5);ox.strokeStyle='rgba(240,245,250,.95)';ox.setLineDash([4,3]);ox.lineDashOffset=-now*10;ox.lineWidth=1.6;ox.stroke();ox.setLineDash([]);}
    if(u.downed){
      const k=u.bleed/45;gPath(u.x,u.y,13,-Math.PI/2,-Math.PI/2+k*TAU);ox.strokeStyle=C.bad;ox.lineWidth=2;ox.stroke();
      if(u.revive>0){gPath(u.x,u.y,16,-Math.PI/2,-Math.PI/2+u.revive/3*TAU);ox.strokeStyle=C.good;ox.stroke();}
      label(u.revive>0?'REVIVING':`DOWN ${Math.ceil(u.bleed)}s`,hx,hy-6,u.revive>0?C.good:C.bad,9,700);
      continue;
    }
    bar(hx-9,hy-6,18,u.hp/100,u.hp>60?C.good:u.hp>30?C.warn:C.bad);
    shield(hx+16,hy-4,peekOf(u)?C.warn:u.covered?C.good:C.bad);
    label(u.id,fx,fy+15,teamCol(u),9,700);
    if(u.sup>0.65)label('PINNED',hx,hy-15,C.warn,9,700);
    else if(u.sup>0.08)bar(hx-9,hy-1,18,u.sup/0.65,C.warn);
  }
  for(const c of callouts){const[sx,sy]=toS(c.x,c.y,30),k=c.t/1.7;ox.globalAlpha=1-Math.max(0,k-.6)/.4;label(c.text,sx,sy-k*16,c.col,11,700);ox.globalAlpha=1;}
  if(ptr&&ptr.kind==='lasso'&&ptr.loop.length>1){   // lasso loop, closed back to its start
    ox.beginPath();ox.moveTo(...ptr.loop[0]);for(const p of ptr.loop)ox.lineTo(...p);ox.closePath();
    ox.fillStyle='rgba(94,200,255,.1)';ox.fill();ox.strokeStyle='rgba(94,200,255,.85)';ox.lineWidth=1.5;ox.setLineDash([5,4]);ox.stroke();ox.setLineDash([]);
  }
  // rain
  const rts=state==='play'?timeScale():1;
  ox.strokeStyle='rgba(170,195,220,.2)';ox.lineWidth=1;ox.beginPath();
  for(const d of rain){
    d.y+=d.v*rdt*rts;d.x+=d.v*.16*rdt*rts;
    if(d.y>ch+20){d.y=-20;d.x=Math.random()*cw;}if(d.x>cw+10)d.x=-10;
    ox.moveTo(d.x,d.y);ox.lineTo(d.x-d.l*.16,d.y-d.l);
  }
  ox.stroke();
  if(storm>0){ox.fillStyle=`rgba(200,215,235,${storm*.1})`;ox.fillRect(0,0,cw,ch);}
}

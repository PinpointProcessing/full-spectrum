// Drafts for Bryan (after Version 167: "It's still a bit chaotic and confusing. Switching the teams is a little difficult and chaotic.
// Throwing grenades and shooting is a little confusing"; "Let's see 1 & 2"): the proposed controls drawn over the real game on a phone.
//   Draft 1: one squad you lead, the other backs you up (follows or holds), one swap button.
//   Draft 2: tap the target, then pick what to do (a ring of actions on him); drag a grenade from the bar to throw it at a spot.
// node dday-controls-draft.js [OUT] -> OUT/d1a.png ... d2d.png (compose.py in the same folder makes the sheets)
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const OUT=process.argv[2]||'.',W=390,H=760;
(async()=>{const port=9962,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=2`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(21);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};
  window.SETTLE=()=>{zoom=6.6;for(let i=0;i<50;i++){panTick(1/30);ddFrame(1/30,simT);}};   // (a little wider than the game's own framing, so both squads and the gun fit)
  damage=()=>undefined;   // (nobody hurt while the pictures are set up: the gunner they're aimed at has to stay alive)
  window.CENTER=(x,y,z)=>{dd.track=null;camPan=null;zoom=z;camT.x=x;camT.z=y-100;for(let i=0;i<30;i++)ddFrame(1/30,simT);};   // (the picture framed by hand: the game's own camera is behind one squad)
  // the draft's own drawing: DOM pieces over the stage, and canvas marks after the overlay is drawn
  const st=document.createElement('style');st.textContent=`
    body.dd .panel,#bigText,#banner{display:none!important}
    .drx{position:absolute;z-index:6;pointer-events:none;font-family:var(--font-hud);color:#f1f4f6}
    .dr-swap{right:10px;display:flex;flex-direction:column;align-items:stretch;gap:6px;width:118px}
    .dr-seg{display:flex;border-radius:9px;overflow:hidden;border:1.5px solid var(--c);background:rgba(8,11,14,.86)}
    .dr-seg span{flex:1;text-align:center;font-size:11px;font-weight:800;letter-spacing:.06em;padding:6px 0;color:#c9d1d7}
    .dr-seg span.on{background:var(--c);color:#0b0f13}
    .dr-btn{display:flex;align-items:center;justify-content:center;gap:8px;height:52px;border-radius:12px;border:2px solid var(--c);background:rgba(8,11,14,.9);box-shadow:0 2px 10px rgba(0,0,0,.4)}
    .dr-btn b{font-size:17px;font-weight:800;letter-spacing:.06em;color:var(--c)}
    .dr-btn svg{width:22px;height:22px;stroke:var(--c);fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
    .dr-btn small{display:block;font-size:10px;font-weight:700;color:#aab4bc;letter-spacing:.04em}
    .dr-act{width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(8,11,14,.92);border:2px solid var(--c);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.45)}
    .dr-act svg{width:26px;height:26px;fill:var(--c);stroke:none}
    .dr-act.sup svg{fill:none;stroke:var(--c);stroke-width:1.8}
    .dr-act.off{opacity:.42;filter:grayscale(1)}
    .dr-cap{transform:translate(-50%,0);white-space:nowrap;font-size:11px;font-weight:800;padding:2px 7px;border-radius:7px;background:rgba(8,11,14,.86);color:var(--c);text-align:center;line-height:1.15}
    .dr-cap i{display:block;font-style:normal;font-weight:600;color:#c3cbd1;font-size:10px}
    .dr-chip{left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;letter-spacing:.08em;padding:4px 10px;border-radius:999px;background:rgba(8,11,14,.84);border:1px solid #9fb0bc;color:#cfd8de}
    .dr-finger{width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.55) 0,rgba(255,255,255,.25) 55%,rgba(255,255,255,0) 72%);border:2px solid rgba(255,255,255,.9);box-shadow:0 0 0 2px rgba(0,0,0,.35)}
    .dr-press{outline:3px solid #fff!important;outline-offset:1px;transform:translateY(-3px)}`;
  document.head.appendChild(st);
  window.DR={
    clear(){document.querySelectorAll('.drx').forEach(e=>e.remove());document.querySelectorAll('.dr-press').forEach(e=>e.classList.remove('dr-press'));},
    el(cls,html,css){const d=document.createElement('div');d.className='drx '+cls;d.innerHTML=html;for(const[k,v]of Object.entries(css||{}))k.startsWith('--')?d.style.setProperty(k,v):d.style[k]=v;$('#stage').appendChild(d);return d;},
    stageRect(){return $('#stage').getBoundingClientRect();},
    sqTop(){const r=$('#sq').getBoundingClientRect();return r.top-DR.stageRect().top;},
    // the support squad's control: FOLLOW | HOLD over the swap button, bottom right over the squad's bar
    swap(team,hold){const col=team==='A'?C.alpha:C.bravo,name=team==='A'?'ALPHA':'BRAVO',bot=ch-DR.sqTop()+8;
      DR.el('dr-swap',`<div class="dr-seg" style="--c:${col}"><span class="${hold?'':'on'}">FOLLOW</span><span class="${hold?'on':''}">HOLD</span></div>
        <div class="dr-btn" style="--c:${col}"><svg viewBox="0 0 24 24"><path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/></svg><div><b>${name}</b><small>TAP TO LEAD</small></div></div>`,{bottom:bot+'px'});},
    // a ring of action buttons over a point on the screen
    ring(sx,sy,items,r){r=r||100;const n=items.length,st=n>2?1.15:1.0,a0=-Math.PI/2-(n-1)*.5*st;
      items.forEach((it,i)=>{const a=a0+i*st,x=sx+Math.cos(a)*r,y=sy+Math.sin(a)*r;
        DR.el('dr-act'+(it.off?' off':'')+(it.sup?' sup':''),it.svg,{left:x+'px',top:y+'px','--c':it.col});
        DR.el('dr-cap',`${it.label}<i>${it.sub}</i>`,{left:x+'px',top:(y+31)+'px','--c':it.off?'#9aa3a9':it.col});});},
    chip(text,top){DR.el('dr-chip',text,{top:top+'px'});},
    finger(sx,sy){DR.el('dr-finger','',{left:sx+'px',top:sy+'px'});},
    squad(t){return players.filter(p=>p.team===t&&alive(p));},
    mid(L){return{x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length};},
    // a label over a squad, and a dotted tether from the support squad to the one you lead
    support(t,word){const L=DR.squad(t),c=DR.mid(L),o=DR.mid(DR.squad(t==='A'?'B':'A')),col=t==='A'?C.alpha:C.bravo;
      toSBack=false;const a=toS(c.x,c.y,1),b2=toS(o.x,o.y,1);if(!toSBack){ox.save();ox.setLineDash([3,6]);ox.strokeStyle=col;ox.globalAlpha=.55;ox.lineWidth=2;ox.beginPath();ox.moveTo(a[0],a[1]);ox.lineTo(b2[0],b2[1]);ox.stroke();ox.restore();}
      const[px,py]=toS(c.x,c.y,34);pill(`${t==='A'?'ALPHA':'BRAVO'} · ${word}`,clamp(px,64,cw-64),py,col);},   // (kept on the screen)
    // each man of the squad you lead: a line to the man he's firing at, or a "no line" mark over him
    lines(t,e){const L=DR.squad(t),[ex,ey]=toS(e.x,e.y,14),out=[];
      for(const u of L){const ok=hyp(u.x-e.x,u.y-e.y)<=wRange(u)&&!!fireLine(u,e);out.push([u.name,ok]);const[ux,uy]=toS(u.x,u.y,14);
        if(ok){ox.save();ox.strokeStyle=teamCol(u);ox.globalAlpha=.75;ox.lineWidth=1.6;ox.beginPath();ox.moveTo(ux,uy);ox.lineTo(ex,ey);ox.stroke();ox.restore();}
        else{const[hx,hy]=toS(u.x,u.y,30);DR.eye(hx-22,hy-28);}}return out;},
    eye(x,y){ox.save();ox.beginPath();ox.arc(x,y,10,0,TAU);ox.fillStyle='rgba(8,11,14,.9)';ox.fill();ox.strokeStyle='#ff9a7a';ox.lineWidth=1.5;ox.stroke();
      ox.beginPath();ox.ellipse(x,y,6,3.6,0,0,TAU);ox.strokeStyle='#ffd2c4';ox.stroke();ox.beginPath();ox.moveTo(x-6,y+5);ox.lineTo(x+6,y-5);ox.strokeStyle='#ff5a48';ox.lineWidth=2;ox.stroke();ox.restore();},
    pinned(e){const[x,y]=toS(e.x,e.y,34);ox.save();ox.fillStyle='rgba(8,11,14,.9)';ox.strokeStyle='#ffcf4a';ox.lineWidth=1.6;ox.beginPath();ox.roundRect?ox.roundRect(x-30,y-11,60,20,6):ox.rect(x-30,y-11,60,20);ox.fill();ox.stroke();
      ox.fillStyle='#ffcf4a';ox.font=`800 11px ${HUDFONT}`;ox.textAlign='center';ox.textBaseline='middle';ox.fillText('▼ PINNED',x,y);ox.restore();},
    supLines(t,e){const[ex,ey]=toS(e.x,e.y,14);for(const u of DR.squad(t)){const[ux,uy]=toS(u.x,u.y,14);ox.save();ox.setLineDash([5,5]);ox.strokeStyle='#ffcf4a';ox.globalAlpha=.8;ox.lineWidth=1.6;ox.beginPath();ox.moveTo(ux,uy);ox.lineTo(ex,ey);ox.stroke();ox.restore();}
      gPath(e.x,e.y,30);ox.save();ox.setLineDash([6,5]);ox.strokeStyle='#ffcf4a';ox.lineWidth=2;ox.stroke();ox.restore();},
    // a throw being aimed: the arc from the thrower, the landing circle, the label at the finger
    throwArc(u,tx,ty,ok){const R=58,[ax,ay]=toS(u.x,u.y,18),[bx,by]=toS(tx,ty,0),[mx,my]=toS((u.x+tx)/2,(u.y+ty)/2,hyp(tx-u.x,ty-u.y)*.32+20),col=ok?'255,170,70':'255,80,64';
      gPath(u.x,u.y,nadeRange(u));ox.save();ox.setLineDash([6,6]);ox.strokeStyle=`rgba(${col},.55)`;ox.lineWidth=1.5;ox.stroke();ox.restore();
      ox.save();ox.setLineDash([2,7]);ox.lineCap='round';ox.strokeStyle=`rgba(${ok?'255,236,200':'255,150,140'},.95)`;ox.lineWidth=3;ox.beginPath();ox.moveTo(ax,ay);ox.quadraticCurveTo(2*mx-(ax+bx)/2,2*my-(ay+by)/2,bx,by);ox.stroke();ox.restore();
      gPath(tx,ty,R);ox.fillStyle=`rgba(${col},.28)`;ox.fill();ox.strokeStyle=`rgba(${col},.95)`;ox.lineWidth=2.2;ox.stroke();
      if(!ok){ox.save();ox.strokeStyle='#ff5a48';ox.lineWidth=3;ox.beginPath();ox.moveTo(bx-9,by-9);ox.lineTo(bx+9,by+9);ox.moveTo(bx+9,by-9);ox.lineTo(bx-9,by+9);ox.stroke();ox.restore();}
      return[bx,by];},
  };
});
// place a squad in cover round a point (the game's own placing), at once
const place=(t,x,y)=>ev(([t,x,y])=>{const m=players.filter(p=>p.team===t&&alive(p));const as=makeAssign(m,x,y);for(const a of as){a.u.x=a.x;a.u.y=a.y;a.u.path=[];}
  for(const u of m){u.ang=-Math.PI/2;u.sup=0;}return as.map(a=>[a.u.name,Math.round(a.x),Math.round(a.y)]);},[t,x,y]);
const shot=async(name,draw)=>{await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(800);
  const info=await ev(d=>{DR.clear();bubbles=[];render(.001,simT);drawOverlay(.001,simT);return(0,eval)('('+d+')')();},draw.toString());
  await page.screenshot({path:`${OUT}/${name}.png`});console.log(name,JSON.stringify(info));};

/* ---------------- the village's field: Draft 1 and most of Draft 2 ---------------- */
await ev(()=>startVillage({skip:true}));await page.waitForTimeout(600);
await ev(()=>{const V=dd.vg;V.ph='field';
  for(const e of enemies){if(/^w/.test(e.tag)){e.dead=true;e.hp=0;e.m&&(e.m.visible=false);}else{e.alerted=true;e.seen=true;}}   // (the woods' men out of the picture; the field's alert and known)
  RUN(.4);});
const MG=await ev(()=>{const g=enemies.find(e=>e.tag==='fh'&&e.gunner);return{x:Math.round(g.x),y:Math.round(g.y)};});
console.log('MG',JSON.stringify(MG));
// 1a: Alpha at the bale and the wall's west end, a line to the gun 12 m off; Bravo following 15 m back and to the left
console.log('A',JSON.stringify(await place('A',775,50)));console.log('B',JSON.stringify(await place('B',740,150)));
await ev(()=>{select(players.filter(p=>p.team==='A'&&alive(p)));dd.active='A';ddGoSquad('A');SETTLE();RUN(.2);CENTER(765,95,6.6);});
await shot('d1a',()=>{DR.support('B','FOLLOWING');DR.swap('B',false);return{};});
// 1b: one tap on the swap button: Bravo is yours, Alpha backs you up; the camera only slides the few metres between them
await ev(()=>{select(players.filter(p=>p.team==='B'&&alive(p)));SETTLE();RUN(.1);CENTER(752,125,6.6);});
await shot('d1b',()=>{DR.support('A','FOLLOWING');DR.swap('A',false);DR.chip('⇄ BRAVO IS YOURS NOW',140);return{};});
// 1c: Bravo told to HOLD at the wall pins the machine gun; you lead Alpha round its side (a move's ghosts, FLANK where its gun can't swing)
console.log('A',JSON.stringify(await place('A',655,100)));console.log('B',JSON.stringify(await place('B',775,50)));
const flank=await ev(()=>{const g=enemies.find(e=>e.tag==='fh'&&e.gunner);g.sup=1;for(const u of players.filter(p=>p.team==='B'))u.supT={x:g.x,y:g.y};
  select(players.filter(p=>p.team==='A'&&alive(p)));dd.active='A';ddGoSquad('A');SETTLE();RUN(.1);CENTER(672,40,4.2);
  const tx=585,ty=-30;const[sx,sy]=toS(tx,ty);preview=null;tap(sx,sy);return{preview:!!preview,n:preview?preview.as.length:0,ghosts:preview?preview.as.map(a=>[Math.round(a.x),Math.round(a.y),ddCanSwing(g,a.x,a.y)]):[]};});   // (outside the gun's swing: 60 degrees either side of south)
console.log('flank',JSON.stringify(flank));
await shot('d1c',()=>{const g=enemies.find(e=>e.tag==='fh'&&e.gunner);DR.supLines('B',g);DR.pinned(g);DR.support('B','HOLDING');DR.swap('B',true);
  if(preview){const F=preview.as.filter(a=>!ddCanSwing(g,a.x,a.y));if(F.length){const c=DR.mid(F),[x,y]=toS(c.x,c.y,34);pill('FLANK · ITS GUN CAN\'T TURN ON YOU',x+30,y,'#5fe08e');}}return{};});
await ev(()=>{preview=null;for(const u of players)u.supT=null;});

/* ---------------- Draft 2 ---------------- */
// 2a: a tap on the machine gunner: the squad opens fire on him, and his ring of actions comes up (the game at quarter speed meanwhile)
console.log('B',JSON.stringify(await place('B',740,150)));console.log('A',JSON.stringify(await place('A',775,50)));
const ring=await ev(()=>{const g=enemies.find(e=>e.tag==='fh'&&e.gunner);g.sup=0;const A=players.filter(p=>p.team==='A'&&alive(p));select(A);dd.active='A';
  for(const u of A)u.focus=g;ddGoSquad('A');SETTLE();RUN(.1);CENTER(737,15,5.7);
  const nade=A.filter(u=>(u.grenade||0)>0&&!u.gl).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0],rgl=A.find(u=>u.gl&&(u.grenade||0)>0),bz=A.find(u=>u.spec==='rpg'&&u.specN>0);
  return{nade:nade&&[nade.name,Math.round(hyp(nade.x-g.x,nade.y-g.y)),nadeRange(nade)],rgl:rgl&&rgl.name,bz:bz&&bz.name};});
console.log('ring',JSON.stringify(ring));
await shot('d2a',()=>{const g=enemies.find(e=>e.tag==='fh'&&e.gunner),A=DR.squad('A');const out=DR.lines('A',g);
  const nade=A.filter(u=>(u.grenade||0)>0&&!u.gl).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0],bz=A.find(u=>u.spec==='rpg'&&u.specN>0),d=u=>Math.round(hyp(u.x-g.x,u.y-g.y)/10);
  const[sx,sy]=toS(g.x,g.y,14);
  DR.ring(sx,sy,[{svg:'<svg viewBox="0 0 24 24"><path d="M3 12h4M17 12h4M12 3v4M12 17v4"/><circle cx="12" cy="12" r="6"/><path d="M8.5 15.5l7-7"/></svg>',sup:1,label:'SUPPRESS',sub:'all 4 · pins him',col:'#ffcf4a'},
    {svg:NADE_SVG,label:'GRENADE',sub:nade?`${nade.name} · ${d(nade)} m`:'none left',col:'#e8ecef',off:!nade||hyp(nade.x-g.x,nade.y-g.y)>nadeRange(nade)},
    {svg:SPECIALS.rpg.svg,label:'BAZOOKA',sub:bz?`${bz.name} · ${d(bz)} m`:'none left',col:'#ffb36b',off:!bz}],88);
  DR.chip('¼ SPEED WHILE YOU PICK',140);return out;});
await ev(()=>{for(const u of players)u.focus=null;});
// 2c: press Grenade on the bar and drag onto the map: the arc from whoever will throw, where it lands, let go to throw
const drag=await ev(()=>{const g=enemies.find(e=>e.tag==='fh'&&e.gunner),A=players.filter(p=>p.team==='A'&&alive(p));const u=A.filter(q=>(q.grenade||0)>0&&!q.gl).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];
  u.hotT=simT+30;window.DR_T=u;return{u:u.name,range:nadeRange(u),d:Math.round(hyp(u.x-g.x,u.y-g.y))};});
console.log('drag',JSON.stringify(drag));
await shot('d2c',()=>{const g=enemies.find(e=>e.tag==='fh'&&e.gunner),u=DR_T,tx=g.x+12,ty=g.y-14;const ok=hyp(tx-u.x,ty-u.y)<=nadeRange(u);
  const[bx,by]=DR.throwArc(u,tx,ty,ok);const btn=document.querySelector('#sq .sq-tool[data-k="nade"]');if(btn){btn.classList.add('dr-press');const r=btn.getBoundingClientRect(),s=DR.stageRect(),x0=r.left+r.width/2-s.left,y0=r.top+r.height/2-s.top;
    ox.save();ox.setLineDash([1,7]);ox.lineCap='round';ox.strokeStyle='rgba(255,255,255,.7)';ox.lineWidth=3;ox.beginPath();ox.moveTo(x0,y0);ox.quadraticCurveTo(x0+40,(y0+by)/2,bx,by+26);ox.stroke();ox.restore();}
  DR.finger(bx,by+26);const[lx,ly]=[bx,by-74];pill(`${u.name} throws · ${Math.round(hyp(tx-u.x,ty-u.y)/10)} m`,lx,ly,'#ffb347');pill('LET GO TO THROW · BACK TO CANCEL',lx,ly+18,'#dfe5ea');return{ok};});
// 2d: dragged too far: red, says so, letting go there throws nothing
await ev(()=>CENTER(748,-45,5.2));
await shot('d2d',()=>{const u=DR_T,tx=u.x-70,ty=u.y-235;const ok=hyp(tx-u.x,ty-u.y)<=nadeRange(u);
  const[bx,by]=DR.throwArc(u,tx,ty,ok);const btn=document.querySelector('#sq .sq-tool[data-k="nade"]');if(btn){btn.classList.add('dr-press');const r=btn.getBoundingClientRect(),s=DR.stageRect(),x0=r.left+r.width/2-s.left,y0=r.top+r.height/2-s.top;
    ox.save();ox.setLineDash([1,7]);ox.lineCap='round';ox.strokeStyle='rgba(255,255,255,.7)';ox.lineWidth=3;ox.beginPath();ox.moveTo(x0,y0);ox.quadraticCurveTo(x0+40,(y0+by)/2,bx,by+26);ox.stroke();ox.restore();}
  DR.finger(bx,by+26);pill(`TOO FAR · ${Math.round(hyp(tx-u.x,ty-u.y)/10)} m (${Math.round(nadeRange(u)/10)} m max)`,bx,by-58,'#ff6a55');pill('LET GO HERE AND NOTHING IS THROWN',bx,by-40,'#dfe5ea');return{ok};});
await ev(()=>{if(window.DR_T)DR_T.hotT=0;});

/* ---------------- the beach: 2b, a tap on the wire ---------------- */
await ev(()=>{leaveDDayNow&&0;startDDay();});await page.waitForTimeout(600);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);for(const e of enemies)e.sup=1;});
const wire=await ev(()=>{const m=players.filter(p=>p.team===dd.active&&alive(p));const cx=m.reduce((a,u)=>a+u.x,0)/m.length;
  const o=(dd.wires||[]).filter(q=>q.y===340&&!q.gone).sort((a,b)=>Math.abs(a.x+a.w/2-cx)-Math.abs(b.x+b.w/2-cx))[0];window.DR_W=o;
  const as=makeAssign(m,o.x+o.w/2,o.y+120);for(const a of as){a.u.x=a.x;a.u.y=a.y;a.u.path=[];}select(m);ddGoSquad(dd.active);SETTLE();RUN(.1);SETTLE();
  const nade=m.filter(u=>(u.grenade||0)>0&&!u.gl).sort((a,b)=>hyp(a.x-o.x,a.y-o.y)-hyp(b.x-o.x,b.y-o.y))[0],bz=m.find(u=>u.spec==='rpg'&&u.specN>0),rg=m.find(u=>u.gl&&(u.grenade||0)>0);
  CENTER(o.x+o.w/2,o.y+90,6.0);dd.front=290;   // (the wire's own label kept out of the way of the ring)
  return{wire:[o.x,o.y,o.w],nade:nade&&nade.name,bz:bz&&bz.name,rg:rg&&rg.name};});
console.log('wire',JSON.stringify(wire));
await shot('d2b',()=>{const o=DR_W,m=DR.squad(dd.active),cx=o.x+o.w/2,cy=o.y+4,d=u=>Math.round(hyp(u.x-cx,u.y-cy)/10);
  // the stretch tapped, outlined
  toSBack=false;const P=[toS(o.x,o.y,2),toS(o.x+o.w,o.y,2),toS(o.x+o.w,o.y+o.h,2),toS(o.x,o.y+o.h,2)];if(!toSBack){ox.save();ox.beginPath();ox.moveTo(...P[0]);for(const q of P)ox.lineTo(...q);ox.closePath();ox.strokeStyle='#ffcf4a';ox.lineWidth=3;ox.stroke();ox.restore();}
  const nade=m.filter(u=>(u.grenade||0)>0&&!u.gl).sort((a,b)=>hyp(a.x-cx,a.y-cy)-hyp(b.x-cx,b.y-cy))[0],rg=m.find(u=>u.gl&&(u.grenade||0)>0),bz=m.find(u=>u.spec==='rpg'&&u.specN>0);
  const[sx,sy]=toS(cx,cy,6);const items=[];
  if(nade)items.push({svg:NADE_SVG,label:'GRENADE',sub:`${nade.name} · ${d(nade)} m`,col:'#e8ecef'});
  if(rg)items.push({svg:M203_SVG,label:'RIFLE GRENADE',sub:`${rg.name} · ${d(rg)} m`,col:'#d7e59a'});
  if(bz)items.push({svg:SPECIALS.rpg.svg,label:'BAZOOKA',sub:`${bz.name} · ${d(bz)} m`,col:'#ffb36b'});
  DR.ring(sx,sy,items,100);DR.chip('¼ SPEED WHILE YOU PICK',140);return{items:items.length};});
console.log('errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();

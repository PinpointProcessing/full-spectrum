"use strict";
/* Class skills (step 3 of docs/classes.md: each class's own gear, from Bryan's descriptions of them): a third button on the
   card of a soldier whose class has one.
   - Medic, field station (Bryan: "an emergency medical station made in the field, to use under heavy fire"): he sets a
     medic station down where he stands (SKILL.station.t s): its green ring heals anyone inside, and a downed man carried
     into it gets back up, like a checkpoint's. Once a mission.
   - Support, ammo bag ("resupplies other units"): an ammo drop set down where he stands: grenades and special items refill
     inside its ring. Once a mission.
   - Recon, binoculars ("scopes out areas"): tap a spot he can see, out to 60 m: every hostile within 20 m of it that he has
     a line to is marked for the whole squad for SKILL.binos.mark s (drawn wherever he is, counted as seen). Every 30 s.
   - Spec Ops, distraction ("a distraction throw", the stealth roadmap): tap a spot within 20 m that he can throw to: a
     clatter there, and unaware hostiles within 12 m who hear it go over to look, then back to where they were. Twice a
     mission. (A man who walks over may well see someone on the way.)
   - Cyber Ops, hacking ("hacks equipment"): no button: inside the office building anything that needs the access card,
     he gets into without it (SKILL.hack s at it; tap it with him selected).
   - Assault, flashbang (Bryan, on the doors: "later incorporate C4s or flashbangs"): tap a spot within 20 m he can throw to:
     SKILL.flash.fuse s later it goes off, and every hostile within 9 m who has a line to it is stunned for SKILL.flash.stun
     s: he can't shoot and he's pinned. Loud (it's heard like a blast, but as an ambush: slow to react). Ours close by are
     shaken too. Throw one through a door, then breach. Twice a mission.
   - Captain: later (call-ins from HQ). The Defender's build kit is his special item (build.js).
   Counts start full at every mission start (reset). */
const SKILL={station:{cls:'medic',label:'Field station',n:1,t:2},ammo:{cls:'support',label:'Ammo bag',n:1,t:2},
  binos:{cls:'recon',label:'Binoculars',cd:30,range:600,r:200,mark:12},noise:{cls:'specops',label:'Distraction',n:2,range:200,r:120,look:4},flash:{cls:'assault',label:'Flashbang',n:2,range:200,r:90,stun:3.5,fuse:1.1},hack:{cls:'cyber',t:4}};
const SKILL_SVG={
  station:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1.5h4v4.5h4.5v4H10v4.5H6V10H1.5V6H6z"/></svg>',
  ammo:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h12v8.5H2z"/><path d="M4 3.2h2.2V6H4zM7 2h2v4H7zM9.8 3.2H12V6H9.8z"/></svg>',
  binos:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 7.5 4 3h3l.4 4.5H8.6L9 3h3l2.5 4.5v3.5a2.8 2.8 0 0 1-5.6 0V9.8H7.1v1.2a2.8 2.8 0 0 1-5.6 0z"/></svg>',
  flash:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1l1.3 4.2L13.5 3l-2.2 4.2L15.5 8l-4.2 1.3 2.2 4.2-4.2-2.2L8 15.5l-1.3-4.2-4.2 2.2 2.2-4.2L.5 8l4.2-.8L2.5 3l4.2 2.2z"/></svg>',
  noise:'<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="11" r="3"/><path d="M9.5 3.5a5 5 0 0 1 3 4.5M8.6 6a2.4 2.4 0 0 1 1.4 2.1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'};
const skillOf=u=>{const c=classOf(u);if(!c)return null;for(const k in SKILL)if(SKILL[k].cls===c&&SKILL_SVG[k])return k;return null;};   // (the one with a button)
const skillFull=u=>{const k=skillOf(u);return k&&SKILL[k].n||0;};
const skillReady=u=>{const k=skillOf(u);if(!k)return false;return SKILL[k].cd?simT>=(u.skillT||0):(u.skillN||0)>0;};
let fieldKit=[],noises=[];   // stations and ammo drops set down; distraction throws in the air

// the card's skill button
function useSkill(u){
  const k=skillOf(u);if(!k||!alive(u))return;
  if(!skillReady(u)){banner(SKILL[k].cd?`The binoculars again in ${Math.ceil((u.skillT||0)-simT)} s.`:`${u.name} has used his ${SKILL[k].label.toLowerCase()} this mission.`,1800);mode=null;return;}
  if(k==='station'||k==='ammo'){mode=null;orderDeploy(u,k);return;}
  mode=mode===k?null:k;   // binoculars, distraction: then tap where
}
// the Medic's station, the Support's ammo bag: set down where he stands
function orderDeploy(u,k){
  if(u.carry||u.inVeh){banner('Not while carrying a man.',1600);return;}
  const near=HQ_ZONES.find(z=>z.k===(k==='station'?'med':'sup')&&hyp(z.x-u.x,z.y-u.y)<ZONE_R*1.5);if(near){banner(k==='station'?'There’s a medic station right here.':'There’s an ammo drop right here.',1800);return;}
  Object.assign(u,{path:[],lastOrder:simT,supT:null,focus:null,deploy:{k,t0:simT,p:0}});callout(u,k==='station'?'Setting up a field station':'Dropping the ammo bag',C.good);
}
// binoculars and the distraction: the tap (input.js, in their modes)
function skillTap(u,wx,wy){
  const k=mode;if(!u||skillOf(u)!==k){mode=null;return true;}
  const d=hyp(wx-u.x,wy-u.y);
  if(k==='binos'){
    if(d>SKILL.binos.range){banner('Too far. Inside the circle.',1500);return false;}
    if(!sightFrom(u.x,u.y,wx,wy)){banner('He can’t see there from here.',1600);return false;}
    let n=0;for(const e of enemies){if(beaten(e)||hyp(e.x-wx,e.y-wy)>SKILL.binos.r||!sightFrom(u.x,u.y,e.x,e.y))continue;e.seen=true;e.last={x:e.x,y:e.y};e.markT=simT+SKILL.binos.mark;e.revealT=Math.max(e.revealT||0,simT+SKILL.binos.mark);n++;}
    u.skillT=simT+SKILL.binos.cd;u.ang=Math.atan2(wy-u.y,wx-u.x);u.aimT=simT;mode=null;
    callout(u,n?`${n} marked`:'Nobody there',n?C.good:C.warn);binoLook={x:wx,y:wy,t:simT};hud();return true;
  }
  if(k==='flash'){
    if(d>SKILL.flash.range){banner('Too far. Throw inside the circle.',1500);return false;}
    if(!(los(u.x,u.y,wx,wy,true)||lobOK(u.x,u.y,wx,wy))){banner('No clear throw from here.',1600);return false;}
    u.skillN=(u.skillN||0)-1;u.ang=Math.atan2(wy-u.y,wx-u.x);u.aimT=simT;u.throwT=simT;u.lastOrder=simT;mode=null;
    noises.push({x0:u.x,y0:u.y,x:wx,y:wy,t:0,dur:SKILL.flash.fuse,by:u,flash:true});callout(u,'Flashbang out!',C.warn);if(typeof sfxPin==='function')sfxPin(u.x,u.y);hud();return true;
  }
  if(k==='noise'){
    if(d>SKILL.noise.range){banner('Too far. Throw inside the circle.',1500);return false;}
    if(!(los(u.x,u.y,wx,wy,true)||lobOK(u.x,u.y,wx,wy))){banner('No clear throw from here.',1600);return false;}
    u.skillN=(u.skillN||0)-1;u.ang=Math.atan2(wy-u.y,wx-u.x);u.aimT=simT;u.throwT=simT;mode=null;
    noises.push({x0:u.x,y0:u.y,x:wx,y:wy,t:0,dur:.8,by:u});callout(u,'Over there…',C.good);hud();return true;
  }
  return false;
}
let binoLook=null;
// every tick (update)
function skillTick(dt){
  for(const u of players){const g=u.deploy;if(!g)continue;   // setting a station or an ammo drop down
    if(!alive(u)||u.lastOrder>g.t0+.01||u.path.length||u.carry){u.deploy=null;continue;}
    g.p+=dt;if(g.p<SKILL[g.k].t)continue;
    const z={k:g.k==='station'?'med':'sup',x:u.x,y:u.y,field:true};const grp=MAPID==='in'&&IN&&IN.groups?IN.groups[floorOf(u.x,u.y)]:null;
    addZones([z],grp);const made=HQ_ZONES[HQ_ZONES.length-1];if(MAPID==='in'&&IN&&IN.hq&&!IN.hq.includes(made))IN.hq.push(made);
    fieldKit.push(made);u.skillN=(u.skillN||0)-1;u.stats.items++;u.deploy=null;
    callout(u,g.k==='station'?'Field station up':'Ammo here',C.good);if(typeof playSample==='function')playSample('cloth',u.x,u.y,.8);hud();
  }
  for(const n of noises.slice()){n.t+=dt;if(n.t<n.dur)continue;noises.splice(noises.indexOf(n),1);if(n.flash)flashLands(n);else noiseLands(n);}
  for(const e of enemies){const L=e.look;if(!L)continue;   // a guard gone to look at a noise
    if(e.dead||e.alerted||e.surr){e.look=null;continue;}
    if(e.path.length)continue;
    if(L.phase==='go'){L.phase='look';L.t=simT;}
    else if(L.phase==='look'){e.ang+=Math.sin(simT*1.3)*dt*1.2;if(simT-L.t>SKILL.noise.look){L.phase='back';const p=findPath(e.x,e.y,L.home.x,L.home.y,FOOT);e.path=p||[];}}
    else{e.ang=L.home.ang;e.look=null;}
  }
}
function noiseLands(n){
  if(typeof playSample==='function')playSample('hit_metal',n.x,n.y,.9,1.2);
  for(const e of enemies){
    if(beaten(e)||e.alerted||e.dog||e.gunner||e.post||e.look)continue;const d=hyp(e.x-n.x,e.y-n.y);if(d>SKILL.noise.r)continue;
    if(MAPID==='in'&&floorOf(e.x,e.y)!==floorOf(n.x,n.y))continue;
    if(d>60&&!los(e.x,e.y,n.x,n.y))continue;   // through a wall only close by
    const p=findPath(e.x,e.y,n.x,n.y,FOOT);if(!p)continue;
    while(p.length&&hyp(p[p.length-1].x-n.x,p[p.length-1].y-n.y)<14)p.pop();   // he stops short of it and looks
    p.push({x:n.x+(e.x-n.x)/Math.max(1,d)*14,y:n.y+(e.y-n.y)/Math.max(1,d)*14});
    e.look={phase:'go',home:{x:e.x,y:e.y,ang:e.ang},x:n.x,y:n.y};e.path=p;e.aware=Math.max(e.aware||0,AWARE_LOOK);e.susp={x:n.x,y:n.y};e.wary=true;
    if(e.vis)callout(e,'?',C.warn);
  }
}
// the Assault's flashbang going off: everyone who sees it is stunned; loud
let flashes2=[];
function flashLands(n){
  const F=SKILL.flash;flashes2.push({x:n.x,y:n.y,t:simT});shake(clamp(.5-hyp(n.x-camT.x,n.y-camT.z)/900,0,.4));
  if(typeof sfxBoom==='function')sfxBoom(n.x,n.y,.35);
  let k=0;
  for(const e of enemies){if(e.dead||e.surr||e.dog||e.dormant)continue;const d=hyp(e.x-n.x,e.y-n.y);if(d>F.r||!los(n.x,n.y,e.x,e.y))continue;
    e.dazeT=simT+F.stun;e.sup=Math.min(1.2,e.sup+.6);e.aimT=-9;if(e.look)e.look=null;k++;}   // (he can't fire while dazed: updateUnit)
  for(const p of players){if(!alive(p))continue;const d=hyp(p.x-n.x,p.y-n.y);if(d<60&&los(n.x,n.y,p.x,p.y))p.sup=Math.min(1.2,p.sup+.5);}   // too close: ours are shaken too
  alertAll(null,true,n.x,n.y,null,null,{x:n.x,y:n.y},undefined,undefined,true,n.by);if(n.by)squadNoise(n.by,n.x,n.y);   // loud, but they're caught off guard
  if(k)callouts.push({x:n.x,y:n.y,t:0,dur:1.8,text:k>1?`${k} stunned`:'Stunned',col:'#ffffff',small:true});
}
// Cyber Ops: something that needs the access card, a Cyber selected: he goes and gets into it without one (orderUse)
function orderHack(a){
  const cy=sel.filter(u=>alive(u)&&isCls(u,'cyber')&&!u.carry).sort((p,q)=>hyp(p.x-a.x,p.y-a.y)-hyp(q.x-a.x,q.y-a.y))[0];if(!cy)return false;
  const sx=a.x+(a.standX||0),sy=a.y+(a.standY??14),s=openSpot(sx,sy,players.filter(p=>p!==cy&&!p.dead).map(destOf))||{x:sx,y:sy},p=findPath(cy.x,cy.y,s.x,s.y);
  if(!p){banner('No way there from here.',1600);return true;}
  cy.path=p;cy.lastOrder=simT;useGos=useGos.filter(g=>g.u!==cy);zipGos=zipGos.filter(z=>z.u!==cy);useGos.push({u:cy,a,prog:0,hack:true,secs:SKILL.hack.t});callout(cy,'I can get past that',C.good);
  return true;
}
// a reset: the stations set down go (the checkpoints' are cleared with the mission: mission.js), throws in the air too
function clearSkills(){
  for(const z of fieldKit){if(z.mesh&&z.mesh.parent)z.mesh.parent.remove(z.mesh);let i=HQ_ZONES.indexOf(z);if(i>=0)HQ_ZONES.splice(i,1);if(IN&&IN.hq){i=IN.hq.indexOf(z);if(i>=0)IN.hq.splice(i,1);}}
  fieldKit=[];noises=[];binoLook=null;flashes2=[];
}
function drawSkills(now){
  const u=sel[0];
  if(u&&(mode==='binos'||mode==='noise'||mode==='flash')){gPath(u.x,u.y,SKILL[mode].range);ox.setLineDash([6,5]);ox.strokeStyle=mode==='binos'?'#9fd8ff':mode==='flash'?'#ffffff':'#cfd6dc';ox.globalAlpha=.75;ox.lineWidth=1.5;ox.stroke();ox.setLineDash([]);ox.globalAlpha=1;}
  if(binoLook&&simT-binoLook.t<1.2){const k=(simT-binoLook.t)/1.2;gPath(binoLook.x,binoLook.y,SKILL.binos.r*(.6+k*.4));ox.strokeStyle=`rgba(159,216,255,${.8*(1-k)})`;ox.lineWidth=2;ox.stroke();}
  for(const e of enemies)if(e.markT>simT&&!beaten(e)&&!offFloor(e)){const[x,y]=toS(e.x,e.y,22);if(toSBack)continue;ox.fillStyle='#9fd8ff';ox.beginPath();ox.moveTo(x,y+5);ox.lineTo(x-5,y-3);ox.lineTo(x+5,y-3);ox.closePath();ox.fill();}   // marked: a blue pin over him
  for(const n of noises){const k=Math.min(1,n.t/Math.min(n.dur,.8)),x=n.x0+(n.x-n.x0)*k,y=n.y0+(n.y-n.y0)*k,[sx,sy]=toS(x,y,6+Math.sin(k*Math.PI)*20);if(toSBack)continue;ox.fillStyle=n.flash?'#e8eef2':'#cfd6dc';ox.beginPath();ox.arc(sx,sy,2.5,0,TAU);ox.fill();
    if(n.flash&&k>=1){gPath(n.x,n.y,SKILL.flash.r);ox.strokeStyle=`rgba(255,255,255,${.35+.3*Math.sin(simT*18)})`;ox.lineWidth=1.5;ox.setLineDash([4,4]);ox.stroke();ox.setLineDash([]);}}   // where it'll go off
  for(const f of flashes2){const a=simT-f.t;if(a>.5)continue;gPath(f.x,f.y,SKILL.flash.r*(.4+a*1.6));ox.fillStyle=`rgba(255,255,255,${.55*(1-a/.5)})`;ox.fill();}
  flashes2=flashes2.filter(f=>simT-f.t<.6);
  for(const e of enemies)if(e.dazeT>simT&&!beaten(e)&&e.vis){const[x,y]=toS(e.x,e.y,24);if(!toSBack)label('STUNNED',x,y-6,'#ffffff',9,700);}
  for(const p of players){const g=p.deploy;if(!g||!alive(p)||offFloor(p))continue;gPath(p.x,p.y,14,-Math.PI/2,-Math.PI/2+Math.min(1,g.p/SKILL[g.k].t)*TAU);ox.strokeStyle=g.k==='station'?'#7fe08a':'#ffa348';ox.lineWidth=2.4;ox.stroke();}
}

"use strict";
/* The office building's story (objective 4; Bryan's design in docs/office-building.md, and his later version: the
   drawbridge has a bio scanner that only opens for the scientists, so they're the goal; the prisoners are all alive and
   join the squad). interior.js is the map; this is what happens in it.
   - Ground floor: the shared room's three guards carry the access card (it drops where the door guard falls once all three
     are down). At the computer it opens the steel door: a swipe, the door grinds open, and the three men on the landing
     behind it come out (caught unready if the shared room went down quietly). The card also works the stairs and the lift.
     Voices behind the steel door give the basement away.
   - Floors: tap the stairs (UP / DOWN) or the lift with soldiers selected and they go, each on his own, so the teams can
     split (Bryan). The lift rides with everyone in the car; up top its doors stay shut until someone inside taps OPEN, so
     men can be put against the walls beside them first (the gun across the room faces the doors).
   - Basement: four prisoners, all alive (Bryan): three in cells (OPEN with the card) and Sgt Marsh strapped to the wall
     (CUT DOWN, then a medic kit or carry him to a medical box: no clock on him). Freed, they join the fire teams, two each:
     grey prison clothes, no armour (they take more damage), no gear, and no rifle until they see a body with one and go and
     take it, by themselves.
   - Upstairs: the science lobby's four scientists cower and beg, cryptic about what's behind the gate. ZIP-TIE one
     (layers.js's zip ties) and he's detained: he follows the soldier who tied him, floors and all, and nobody shoots at
     scientists. Leave by the front doors with at least one.
   - Outside, the drawbridge's panel is a bio scanner: bring a detained scientist and send a soldier to it; his hand on the
     glass lowers the drawbridge. (The monsters come with the next build, Bryan.) */
// Bryan, after v70: stubborn at first ("I'm not talking. You all are terrorists"), panicking only near the HQ, and talking less.
// Found and cowering: defiant. Zip-tied: a word or two. Led along: grumbling. Near the fortress's gate (they know what's behind
// it; the player doesn't yet): panic. Made to put a hand on the scanner: begging (SCI_SCAN).
const SCI_DEFY=['I’m not talking.','You people are terrorists.','I have nothing to say to you.','Get away from me.','You’ll get nothing from me.','Do what you want. I’m not helping you.'];
const SCI_TIED=['Terrorists. All of you.','Get your hands off me!'];
const SCI_GRUMBLE=['Where are you taking me?','You have no right to do this.','I told you. I’m not talking.','Animals.','You won’t get away with this.','Keep your hands off me.'];
const SCI_PANIC=['No. No! Not there!','Don’t open it! Please don’t open it!','You don’t know what’s down there!','Turn back! I’m begging you!','They sealed it for a reason!','Oh God. Oh God no...'];
const SCI_HQ_NEAR=480;   // how close to the drawbridge's panel before they start to panic
const SCI_SCAN=['No. No, no, no. Please!','Don’t make me do this!','You’re killing all of us...','God forgive me.'];
const PRISON_CRY=['Help! Down here!','Is someone there?','Please! We’re down here!','Get us out!'];
const SCI_LAB=['No! Years of work!','You’ve no idea what you’ve done.','Good. Burn it. All of it.'],SCI_END=['...God help us.'];
// the freed men's own lines (each is voiced: voice.js, sounds/voice): freed, a rifle picked up, Marsh back on his feet, and
// goodbye at the end of the mission (Bryan: they stay with the squad until the mission's over)
const FREED_LINES={Brennan:'Thank God. Give me a rifle and I’m with you.',Abara:'About time. I’m with you.',Lindqvist:'Get me out of here. I’ll carry my weight.'};
const LOOT_LINES=['Got a rifle.','Armed.','That’ll do.'],MARSH_UP='Easy... easy. I’m still in this.';
const FAREWELL={Marsh:'We owe you our lives. We’ll see you back at HQ.',Abara:'Thanks for coming for us. First round’s on me.',Brennan:'Never thought I’d see the sky again. Thank you.',
  Lindqvist:'Whatever they kept down there with us... it’s out here now. Watch yourselves.'};
const LIFT_RIDE=2.2,DOOR_OPEN=2.4,LOOT_R=240;
let office=null,civs=[],sciOut=0,scanGo=null;   // this visit's state; civilians (prisoners still locked up, the man on the wall, scientists); scientists brought out
function resetOffice(){
  office={card:false,cardAt:null,door:0,doorT:0,liftUp:false,ride:null,liftDoor:false,stairDoor:false,cryT:0,heard:false,found:false,freed:0,tied:0,cutT:0,labs:[false,false,false,false],labN:0,sparks:[]};
  if(typeof ACTS!=='undefined')for(const a of ACTS)a.hacked=false;   // (a Cyber Ops's way in doesn't carry over to a fresh visit: skills.js)
}
resetOffice();
const detained=()=>civs.filter(c=>c.sci&&c.detained);
const wallMan=()=>civs.find(c=>c.strapped);
// who speaks a line, and the line itself: a callout over him and his recorded voice (voice.js); i: which of the lines
const speakerOf=c=>c.sci?'S'+(((c.sciN||0)%4)+1):c.joins||c.id;
function line(c,group,list,i,dur=3,col='#e9eef2',opt={}){
  const k=i??((Math.random()*list.length)|0);callouts.push({x:c.x,y:c.y,t:0,dur,text:list[k],col});
  if(typeof voiceClip==='function')voiceClip(speakerOf(c),`${group}_${k+1}`,Object.assign({x:c.x,y:c.y},opt));return k;
}

/* ---------- people who aren't soldiers: their look ---------- */
// prisoners in grey prison clothes (no helmet, no vest), scientists in white coats; a rifle shows once a freed man has one
function makePerson(u){return makeFigure(u);}   // (figure.js: grey jumpsuits, white coats; a rifle once a freed man has one)
// one of them in the building: a 'C' unit (not a player, not a hostile; nobody targets him)
function civ(kind,p,f){
  const u=mk('C','C','C'+(units.length+1),p.name||(kind==='sci'?'Scientist':'Prisoner'),p.x,p.y,p.ang??0);
  Object.assign(u,{kind:kind==='sci'?'sci':'prisoner',sci:kind==='sci',sciN:units.filter(q=>q.side==='C'&&q.sci).length,floor:f.id,weapon:null,grenade:0,spec:null,specN:0,hp:100,cower:false,pleadT:simT+3+Math.random()*4,
    cell:p.cell||null,joins:p.joins||null,strapped:kind==='strapped'});
  makePerson(u);return u;
}
function spawnCivs(){
  for(const f of IN.L.floors)if(IN_OPEN.includes(f.id))for(const p of f.posts||[]){
    if(p.role==='prisoner')civ('prisoner',p,f);else if(p.role==='strapped')civ('strapped',p,f);else if(p.role==='scientist')civ('sci',p,f);
  }
}

/* ---------- the things to use (interior.js's ACTS) ---------- */
function officeActs(){
  const L=IN.L,gf=IN.floors.GF,b1=IN.floors.B1,f1=IN.floors['1F'];
  const it=(f,kind,pred)=>(f.interact||[]).find(q=>q.kind===kind&&(!pred||pred(q)));
  const comp=it(gf,'computer');
  if(comp)ACTS.push({id:'computer',map:'in',floor:'GF',x:comp.x,y:comp.y,r:14,standY:24,secs:2,label:'COMPUTER',avail:()=>office.door===0,
    need:()=>office.card?null:CARD_NEED,act:u=>openSteel(u)});
  ACTS.push({id:'card',map:'in',floor:'GF',x:0,y:0,r:14,label:'ACCESS CARD',pickup:true,avail:()=>!!office.cardAt&&!office.card,act:u=>takeCard(u)});
  // stairs and the lift: everyone selected goes, each on his own (Bryan: the teams can split between floors)
  for(const tr of L.transitions){
    const f=IN.floors[tr.from],kind=tr.kind==='elevator'?'lift-car':/stairs-up/.test(tr.fromZone)?'stairs-up':'stairs-down',z=zoneOf(f,kind);if(!z)continue;
    const up=(tr.from==='GF'&&tr.to==='1F')||(tr.from==='B1'&&tr.to==='GF');   // (just for the word on it)
    if(tr.kind==='elevator'){
      const call=tr.from==='GF'?it(gf,'lift-call'):it(f1,'lift-call');
      ACTS.push({id:'lift-'+tr.from,map:'in',floor:tr.from,x:call?call.x:(z.x0+z.x1)/2,y:call?call.y:(z.y0+z.y1)/2,r:14,label:tr.from==='GF'?'LIFT UP':'LIFT DOWN',multi:true,
        avail:()=>!office.ride&&(tr.from==='GF'?!office.liftUp:office.liftUp),need:()=>office.card?null:CARD_NEED,go:list=>goLift(list,tr,z)});
    }else{
      ACTS.push({id:'stairs-'+tr.from+tr.to,map:'in',floor:tr.from,x:(z.x0+z.x1)/2,y:(z.y0+z.y1)/2,r:16,label:up?'UP':'DOWN',multi:true,avail:()=>tr.to!=='B1'||office.door===2,
        go:list=>goStairs(list,tr,z)});   // (open without the card: the door at the top has the card reader, Bryan)
    }
  }
  // the stair door up top (Bryan: go up the stairs and find a card door at the top): a reader on the stairwell side
  const sd=IN.objs.find(q=>q.kind==='carddoor');
  if(sd)ACTS.push({id:'stairdoor',map:'in',floor:'1F',x:sd.x+sd.w+14,y:sd.y+sd.h/2,r:14,standX:6,standY:0,secs:.8,get label(){return office.card?'OPEN':'LOCKED';},
    avail:()=>!office.stairDoor,need:()=>office.card?null:CARD_NEED,act:u=>openStairDoor(u)});
  const door=it(f1,'lift-call');   // up top: the car doors stay shut after the ride until someone inside taps OPEN
  if(door)ACTS.push({id:'liftdoor',map:'in',floor:'1F',x:86,y:-220,r:14,standX:-14,standY:0,secs:.6,label:'OPEN',avail:()=>office.liftUp&&!office.liftDoor&&!office.ride,act:()=>openLiftDoor()});
  for(const q of b1.interact||[]){
    if(q.kind==='cells'){const c=q.cell;ACTS.push({id:'cell-'+c,map:'in',floor:'B1',x:q.x,y:q.y,r:14,standY:0,secs:2,label:'OPEN CELL',avail:()=>civs.some(v=>v.cell===c&&!v.freed),
      need:()=>office.card?null:CARD_NEED,act:u=>openCell(u,c)});}
    if(q.kind==='strapped')ACTS.push({id:'cutdown',map:'in',floor:'B1',x:q.x,y:q.y,r:14,standY:16,secs:3,label:'CUT DOWN',avail:()=>!!wallMan(),act:u=>cutDown(u)});
  }
  // the lab equipment upstairs (a bonus from Bryan's first design): DESTROY wrecks a bench
  (f1.interact||[]).filter(q=>q.kind==='equipment').forEach((q,i)=>ACTS.push({id:'lab-'+i,map:'in',floor:'1F',x:q.x,y:q.y,r:14,standY:0,secs:3,label:'DESTROY',q,near:()=>labObj(q),avail:()=>!office.labs[i],act:u=>wreckLab(u,i,q)}));   // (near: a tap anywhere on the bench counts, Bryan)
  for(const a of ACTS)if(a.map==='in'&&a.need){const n0=a.need;a.need=()=>a.hacked?null:n0();}   // a Cyber Ops got into it without the card (skills.js)
}
// orderUse (interior.js) hands these over: send everyone selected on this floor into the stairs zone
function goStairs(list,tr,z){
  const go=list.filter(u=>floorOf(u.x,u.y)===tr.from);if(!go.length){banner('Select soldiers on this floor first.',1600);return;}
  const spots=slotsIn(farPart(z),go.length,players.filter(p=>!go.includes(p)&&!p.dead).map(destOf));   // (up or down the whole flight: interior.js)
  go.forEach((u,i)=>{const s=spots[i]||{x:(z.x0+z.x1)/2,y:(z.y0+z.y1)/2},p=findPath(u.x,u.y,s.x,s.y);if(!p)return;
    Object.assign(u,{path:p,lastOrder:simT,stairs:{tr,z,t0:simT},lift:null,watch:null,supT:null,focus:null,silent:null});});
  callout(go[0],tr.to==='1F'?'Going up':'Going down',C.good);
}
function goLift(list,tr,z){
  const go=list.filter(u=>floorOf(u.x,u.y)===tr.from);if(!go.length){banner('Select soldiers on this floor first.',1600);return;}
  const spots=slotsIn(z,go.length,[]);
  go.forEach((u,i)=>{const s=spots[i]||{x:(z.x0+z.x1)/2,y:(z.y0+z.y1)/2},p=findPath(u.x,u.y,s.x,s.y);if(!p)return;
    Object.assign(u,{path:p,lastOrder:simT,lift:{tr,z,t0:simT},stairs:null,watch:null,supT:null,focus:null,silent:null});});
  callout(go[0],'Into the lift',C.good);
}
// one man (and whoever he's carrying, and the scientists he's minding) to the other floor
function transit(u,to,arrive,taken=[]){
  const near=s=>openSpot(arrive.x+(s?(Math.random()-.5)*30:0),arrive.y+(s?(Math.random()-.5)*20:0),[...taken,...players.filter(p=>p!==u&&!p.dead).map(destOf)]);
  const s=near(0)||arrive;Object.assign(u,{x:s.x,y:s.y,path:[],stairs:null,lift:null,peek:null,lx:0,ly:0});taken.push(s);
  if(u.carry){u.carry.x=s.x+4;u.carry.y=s.y+4;}
  for(const c of detained())if(c.minder===u){const q=near(1)||s;Object.assign(c,{x:q.x,y:q.y,path:[],floor:to});taken.push(q);}
  return s;
}
function afterTransit(to,who){   // the camera follows when nobody selected is left on the floor on screen
  const s=sel.filter(alive);
  if(who.some(u=>sel.includes(u))&&!s.some(u=>floorOf(u.x,u.y)===curFloor)){const on=s.filter(u=>floorOf(u.x,u.y)===to);setFloor(to,on.length?{x:on.reduce((a,u)=>a+u.x,0)/on.length,y:on.reduce((a,u)=>a+u.y,0)/on.length}:null);}
  floorChip();hud();
}
function liftTick(){
  if(office.ride){
    if(simT-office.ride.t<LIFT_RIDE)return;
    const R=office.ride;office.ride=null;const to=R.tr.to,dz=zoneOf(IN.floors[to],'lift-car'),fz=R.z,taken=[];
    for(const u of R.units){if(!alive(u)&&!u.carriedBy)continue;const s={x:dz.x0+(u.x-fz.x0)*(dz.x1-dz.x0)/(fz.x1-fz.x0),y:dz.y0+(u.y-fz.y0)*(dz.y1-dz.y0)/(fz.y1-fz.y0)};transit(u,to,s,taken);}
    if(typeof sfxLift==='function')sfxLift(dz.x0+30,(dz.y0+dz.y1)/2,'ding');
    office.liftUp=to==='1F';if(to==='1F'&&!office.liftDoor)banner('The doors stay shut until you tap OPEN. Put men against the walls beside them first.',3200);
    afterTransit(to,R.units);return;
  }
  // everyone sent into the lift who's still up and on the way: once they're all in the car and still, it goes
  for(const u of players)if(u.lift&&(!alive(u)||u.lastOrder>u.lift.t0+.01))u.lift=null;   // down, or given another order: not riding
  const riders=players.filter(u=>u.lift);if(!riders.length)return;
  const tr=riders[0].lift.tr,z=riders[0].lift.z,set=riders.filter(u=>u.lift.tr===tr);
  if(set.some(u=>u.path.length||!inZone(u,{x0:z.x0-6,x1:z.x1+6,y0:z.y0-6,y1:z.y1+6})))return;
  const carried=set.map(u=>u.carry).filter(Boolean);
  office.ride={t:simT,tr,z,units:[...set,...carried]};for(const u of set)u.lift=null;
  callout(set[0],tr.to==='1F'?'Going up':'Going down',C.good);if(typeof sfxLift==='function')sfxLift(set[0].x,set[0].y,'door');
}
function stairsTick(){
  const moved=[];
  for(const u of players){
    if(!u.stairs)continue;if(!alive(u)||u.lastOrder>u.stairs.t0+.01){u.stairs=null;continue;}const{tr,z}=u.stairs;
    if(u.path.length)continue;
    if(!inZone(u,{x0:z.x0-8,x1:z.x1+8,y0:z.y0-8,y1:z.y1+8})){u.stairs=null;continue;}   // stopped short (another order)
    transit(u,tr.to,tr.arrive);moved.push(u);
  }
  if(moved.length)afterTransit(floorOf(moved[0].x,moved[0].y),moved);
}
function openStairDoor(u){
  const o=IN.objs.find(q=>q.kind==='carddoor');office.stairDoor=true;if(typeof sfxComputer==='function')sfxComputer(u.x,u.y);if(typeof sfxLift==='function')sfxLift(u.x,u.y,'door');
  if(IN.readerLed)IN.readerLed.color.setHex(0x37e08a);callout(u,'Door open',C.good);if(o)removeObj(o);
}
function openLiftDoor(){
  const o=IN.objs.find(q=>q.kind==='liftdoor');office.liftDoor=true;if(typeof sfxLift==='function')sfxLift(86,-220,'door');
  if(o){removeObj(o);}
}
// a door or gate out of the way: off the map's objects (nav, sight and cover rebuilt) and out of view
function removeObj(o){
  o.gone=true;const i=objs.indexOf(o);if(i>=0)objs.splice(i,1);const j=IN.objs.indexOf(o);if(j>=0)IN.objs.splice(j,1);
  if(o.mesh)o.mesh.visible=false;rebuildNav();
}
function restoreObjs(){   // a fresh visit: the doors and gates back where they were
  for(const o of IN.allObjs)if(o.gone){o.gone=false;if(!IN.objs.includes(o))IN.objs.push(o);if(o.mesh){o.mesh.visible=true;o.mesh.position.y=0;}}
  for(const o of IN.allObjs)if(o.door){o.open=o.open0;o.full=!o.open0;o.broken=false;o.anim=null;doorPose(o,o.open?1:0);o.barred=false;if(o.barMesh){if(o.barMesh.parent)o.barMesh.parent.remove(o.barMesh);o.barMesh=null;}}   // the rooms' doors shut again (orders.js)
}

/* ---------- the shared room, the card and the steel door ---------- */
const CARD_NEED='Find an access card.';   // (Bryan: just that, not where it is)
function takeCard(u){office.card=true;callout(u,'Got the access card',C.good);banner('Access card: the steel door, the lift and the stair door upstairs.',3000);hud();}
function openSteel(u){
  if(office.door)return;office.door=1;office.doorT=simT;callout(u,'Door’s opening',C.warn);if(typeof sfxComputer==='function')sfxComputer(u.x,u.y);
  if(typeof sfxGrind==='function')sfxGrind(370,145);
  const loud=contact||enemies.some(e=>!e.dead&&e.floor==='GF'&&e.area!=='ambush'&&e.alerted);   // the landing heard the fight: they're waiting
  for(const e of enemies)if(!e.dead&&e.area==='ambush'){if(loud)alertOne(e,{x:u.x,y:u.y},false);bark(e,loud?'spot':'what',true);}
  banner(loud?'They heard you coming: the men behind the door are ready.':'The door grinds open...',2400);
}
function doorTick(){
  if(office.door!==1)return;const o=IN.objs.find(q=>q.kind==='steeldoor');
  const k=Math.min(1,(simT-office.doorT)/DOOR_OPEN);if(o&&o.mesh)o.mesh.position.y=-15*k*k;   // it sinks into the floor
  if(k<1)return;office.door=2;if(o)removeObj(o);
}
// the access card: once the shared room's three are down, it lies where the door guard fell (or the last of them)
function cardTick(){
  if(office.card||office.cardAt)return;
  const g=enemies.filter(e=>e.area==='shared');if(!g.length||!g.every(beaten))return;
  const c=g.find(e=>/door guard/i.test(e.note||''))||g[g.length-1];office.cardAt={x:c.x,y:c.y};
  const a=ACTS.find(q=>q.id==='card');if(a){a.x=c.x+6;a.y=c.y+6;}
}
// voices behind the steel door (Bryan: pull the player in): a soldier close to it hears them
function cryTick(){
  if(office.door===2||office.found)return;
  const o=IN.objs.find(q=>q.kind==='steeldoor');if(!o)return;const cx=o.x+o.w/2,cy=o.y+o.h+8;
  const near=players.find(p=>alive(p)&&!p.offMap&&hyp(p.x-cx,p.y-cy)<150);if(!near||simT<office.cryT)return;
  office.cryT=simT+9+Math.random()*5;const who=civs.find(c=>c.cell&&!c.freed)||civs.find(c=>!c.sci);   // one of them, muffled behind the door
  if(who)line({x:cx,y:cy-10,joins:who.joins},'cry',PRISON_CRY,null,2.6,'#d9c7a0',{muffle:true});
  if(!office.heard){office.heard=true;banner('Voices behind the steel door. Someone’s being held down there.',3200);updateObjUI();}
}

/* ---------- the basement ---------- */
function openCell(u,c){
  const p=civs.find(v=>v.cell===c&&!v.freed);if(!p)return;
  const g=IN.objs.find(o=>o.gate===c);if(g)removeObj(g);if(typeof sfxCell==='function')sfxCell(p.x,p.y);chatFree(u);
  joinPrisoner(p);if(FREED_LINES[p.name])line(p,'freed',[FREED_LINES[p.name]],0,3,C.good);
}
function cutDown(u){
  const m=wallMan();if(!m)return;Object.assign(m,{strapped:false,x:m.x,y:m.y+10,ang:Math.PI/2});chatFree(u);
  joinPrisoner(m,{downed:true});callout(u,'Got him. He needs a medic kit, or carrying to a medical box.',C.warn);
}
// a freed man becomes a soldier of his fire team (Bryan: two join Alpha, two Bravo): no armour, no gear, no rifle yet
function joinPrisoner(c,o={}){
  if(c.freed)return;c.freed=true;office.freed++;office.found=true;
  const team=/^A/.test(c.joins)?'A':'B';
  Object.assign(c,{side:'P',team,id:c.joins,weapon:null,grenade:0,spec:null,specN:0,charges:0,unarmored:true,joined:true,cower:false,strapped:false,
    level:levelOf(xpOf(c.joins)),gait:'run',gaitForce:null,lastOrder:simT,path:[],alerted:false});
  c.stats={kills:0,streak:0,best:0,lastKill:-99,revives:0,items:0,downs:0,ties:0};
  if(c.m)c.m.ring.material.color.set(teamCol(c)),c.m.ring.material.opacity=.85;
  if(o.downed)Object.assign(c,{hp:25,downed:true,critical:true,crit:CRIT_T,noBleed:true,bleed:0,revive:0,boxRev:0});   // the man off the wall: no clock on him (Bryan)
  civs=civs.filter(q=>q!==c);if(!players.includes(c))players.push(c);
  buildCards();hud();floorChip();updateObjUI();
  banner(`${c.name} joins ${team==='A'?'Alpha':'Bravo'}.${office.freed===1?' He\u2019ll take a rifle off the first body he sees.':''}`,office.freed===1?3200:2000);
}
// an unarmed freed man who sees a body with a rifle goes and takes it, unless he's just been given an order
function lootTick(){
  for(const u of players){
    if(!u.joined||u.weapon||!alive(u)||u.carry||u.offMap)continue;
    if(u.loot){
      const b=u.loot;
      if(b.gun===false||(u.lastOrder>u.lootT+.01)){b.claim=null;u.loot=null;continue;}
      if(u.path.length)continue;
      if(hyp(u.x-b.x,u.y-b.y)>18){b.claim=null;u.loot=null;continue;}
      if(!u.lootAt)u.lootAt=simT;if(simT-u.lootAt<.8)continue;   // a moment to take it off him
      b.gun=false;b.claim=null;u.loot=null;u.lootAt=0;u.weapon='rifle';u.cool=1;line(u,'loot',LOOT_LINES,null,2,C.good);buildCards();hud();continue;
    }
    if(simT-u.lastOrder<3)continue;
    const f=MAPID==='in'?floorOf(u.x,u.y):null;let best=null,bd=LOOT_R;
    for(const b of bodies){
      if(b.gun===false||(b.claim&&b.claim!==u)||b.map!==MAPID||(f&&b.floor!==f))continue;
      const d=hyp(b.x-u.x,b.y-u.y);if(d<bd&&los(u.x,u.y,b.x,b.y)){bd=d;best=b;}
    }
    if(!best)continue;
    const s=openSpot(best.x,best.y,players.filter(p=>p!==u&&!p.dead).map(destOf))||best,p=hyp(u.x-best.x,u.y-best.y)<16?[]:findPath(u.x,u.y,s.x,s.y);
    if(!p)continue;
    u.path=p;u.loot=best;u.lootT=simT;u.lootAt=0;best.claim=u;callout(u,'Grabbing a rifle',C.warn);
  }
}

/* ---------- the scientists ---------- */
// every tick, for each person who isn't a soldier (from updateUnit): walking, cowering, following, begging
function civTick(u,dt){
  u.hitFlash=Math.max(0,(u.hitFlash||0)-dt);
  if(u.path.length){
    const p=u.path[0],dx=p.x-u.x,dy=p.y-u.y,d=hyp(dx,dy),sp=(u.detained?48:30)*dt;
    if(doorWait(u,p,dt)){}else if(d<=sp){u.x=p.x;u.y=p.y;u.path.shift();}else{u.x+=dx/d*sp;u.y+=dy/d*sp;}   // (a shut door in his way: he opens it too, orders.js)
    if(d>.5)u.ang=turn(u.ang,Math.atan2(dy,dx),dt*8);
  }
  if(!u.sci)return;
  const f=MAPID==='in'?u.floor:null,near=players.filter(p=>alive(p)&&!p.offMap&&(!f||floorOf(p.x,p.y)===f));
  if(!u.cower&&!u.detained&&(near.some(p=>hyp(p.x-u.x,p.y-u.y)<240&&los(p.x,p.y,u.x,u.y))||(contact&&near.some(p=>hyp(p.x-u.x,p.y-u.y)<400))))u.cower=true;   // Bryan: they cower where they are
  if(u.detained&&!u.scanning){
    let m=u.minder;if(!m||!alive(m)||m.offMap||(MAPID==='in'&&floorOf(m.x,m.y)!==floorOf(u.x,u.y))){m=near.slice().sort((a,b)=>hyp(a.x-u.x,a.y-u.y)-hyp(b.x-u.x,b.y-u.y))[0]||null;if(m)u.minder=m;}
    if(m&&simT>(u.followT||0)){u.followT=simT+.5;const d=hyp(m.x-u.x,m.y-u.y),end=u.path.length?u.path[u.path.length-1]:null;
      if(d>34&&(!end||hyp(end.x-m.x,end.y-m.y)>30)){const s=openSpot(m.x-Math.cos(m.ang)*18,m.y-Math.sin(m.ang)*18,players.filter(p=>!p.dead).map(destOf)),p=s&&findPath(u.x,u.y,s.x,s.y,FOOT);if(p)u.path=p;}}
  }
  // they talk, not much: defiant while they cower, grumbling on the way, and panicking near the fortress's gate (Bryan)
  if(near.some(p=>hyp(p.x-u.x,p.y-u.y)<260)&&simT>u.pleadT&&(u.cower||u.detained)){
    const panic=u.detained&&MAPID==='out'&&typeof PANEL!=='undefined'&&hyp(u.x-PANEL.x,u.y-PANEL.y)<SCI_HQ_NEAR;
    const g=u.scanning?'scan':panic?'panic':u.detained?'grumble':'defy',L={scan:SCI_SCAN,panic:SCI_PANIC,grumble:SCI_GRUMBLE,defy:SCI_DEFY}[g];
    u.pleadT=simT+(u.scanning?5:panic?7:u.detained?40:30)+Math.random()*(panic?5:15);
    if(!civs.some(c=>c!==u&&simT-(c.saidT||-9)<(panic?3:6))){u.saidT=simT;line(u,g,L,undefined,panic||u.scanning?3.4:3,panic||u.scanning?'#ffd7cf':'#e9eef2');}
  }
}
function civAtScreen(sx,sy){
  let best=null,bd=26;
  for(const c of civs){if(!c.vis&&!c.detained&&!c.cell&&!c.strapped)continue;if(offFloor(c))continue;const[x,y]=toS(c.x,c.y,8);const d=hyp(x-sx,y-sy);if(d<bd){bd=d;best=c;}}   // (the locked-up men can be tapped before anyone has had a look at them: Bryan tapped one and got "Can't get there")
  return best;
}
// a tap on one of them: a scientist gets zip-tied, a locked-up prisoner's cell gets opened, the man on the wall cut down
function civTap(c){
  if(c.sci){
    if(c.detained){banner('Detained: he follows the soldier who tied him.',1800);return true;}
    if(!sel.some(alive)){banner('Select a soldier, then tap the scientist to zip-tie him.',2000);return true;}
    if(orderZip(sel,c)&&zipFor(c))chatSci(zipFor(c).u);return true;
  }
  const a=ACTS.find(q=>q.id===(c.strapped?'cutdown':'cell-'+c.cell));
  if(a&&a.avail()){if(!sel.some(alive)){banner('Select a soldier first.',1600);return true;}orderUse(a);return true;}
  return false;
}
function sciTied(c,u){   // from zipTick (layers.js)
  c.detained=true;c.minder=u;c.cower=false;office.tied++;c.saidT=simT;c.pleadT=simT+25+Math.random()*15;line(c,'tied',SCI_TIED);
  if(office.tied===1)banner('Detained. He follows the soldier who tied him. Bring him out the front doors.',3200);updateObjUI();hud();
}

/* ---------- the bio scanner at the drawbridge (mission.js sends the soldier) ---------- */
function startScan(u){
  const s=detained().filter(c=>hyp(c.x-PANEL.x,c.y-PANEL.y)<140).sort((a,b)=>hyp(a.x-PANEL.x,a.y-PANEL.y)-hyp(b.x-PANEL.x,b.y-PANEL.y))[0];
  if(!s){banner('The bio scanner only opens for one of the scientists. Bring one here: they follow the soldier who tied them.',3800);callout(u,'Needs a scientist',C.warn);return false;}
  const spot={x:PANEL.x-14,y:PANEL.y+8},p=findPath(s.x,s.y,spot.x,spot.y,FOOT);
  s.scanning=true;s.path=p||[];s.pleadT=simT;scanGo={u,s,spot,t:0};chatScan(u);return true;
}
function scanTick(dt){
  const g=scanGo;if(!g)return;const s=g.s;
  if(!alive(g.u)){s.scanning=false;scanGo=null;return;}
  if(s.path.length)return;
  if(hyp(s.x-g.spot.x,s.y-g.spot.y)>16){s.path=findPath(s.x,s.y,g.spot.x,g.spot.y,FOOT)||[];if(!s.path.length){s.scanning=false;scanGo=null;}return;}
  s.ang=Math.atan2(PANEL.y-s.y,PANEL.x-s.x);if(!g.t&&typeof sfxScan==='function')sfxScan(PANEL.x,PANEL.y);g.t+=dt;
  if(g.t>=3){s.scanning=false;scanGo=null;lowerBridge(g.u);line(s,'end',SCI_END,0);}
}

/* ---------- the lab equipment (a bonus) ---------- */
// wrecked: the bench goes dark and lopsided, its glowing vials gone, sparks for a few seconds and a scorch mark; it's loud
// (anyone near hears it), and a scientist close by has something to say about it
function labObj(q){   // the bench a DESTROY ring belongs to
  if(!IN||!IN.objs)return null;if(q._o&&IN.objs.includes(q._o))return q._o;
  return q._o=IN.objs.filter(b=>b.kind==='lab').sort((a,b)=>hyp(a.x+a.w/2-q.x,a.y+a.h/2-q.y)-hyp(b.x+b.w/2-q.x,b.y+b.h/2-q.y))[0]||null;
}
// a frag or a rocket that goes off by a bench wrecks it as well (Bryan: tap it, or blow it up); the thrower gets the credit
function labBlast(x,y,by){
  if(MAPID!=='in'||!IN)return;
  for(const a of ACTS)if(/^lab-/.test(a.id)&&a.avail()){const o=labObj(a.q);if(o&&rectDist(x,y,o)<40)wreckLab(by&&by.side==='P'?by:null,+a.id.slice(4),a.q,true);}
}
function wreckLab(u,i,q,blast){
  if(office.labs[i])return;office.labs[i]=true;office.labN++;if(u&&u.stats)u.stats.labs=(u.stats.labs||0)+1;
  const o=labObj(q);
  const cx=o?o.x+o.w/2:q.x,cy=o?o.y+o.h/2:q.y;
  if(o){o.wreck=true;const g=o.grp;if(g)g.traverse(m=>{if(!m.isMesh)return;if(m.geometry.type==='CylinderGeometry'){m.visible=false;return;}m.material=m.material.clone();m.material.color.setHex(0x37322e);m.rotation.z=.07;});}
  office.sparks.push({x:cx,y:cy,t0:simT});paintDecal({k:'scorch',x:cx,y:cy+10,r:Math.random()});
  if(typeof sfxSparks==='function')sfxSparks(cx,cy);
  if(!blast){callout(u,'Smashed it',C.good);alertAll('Contact.',true,cx,cy,null,null,{x:u.x,y:u.y},180,80,true);}   // smashing it up is loud (a blast is louder, and already heard)
  const s=civs.filter(c=>c.sci&&floorOf(c.x,c.y)==='1F'&&hyp(c.x-cx,c.y-cy)<560).sort((a,b)=>hyp(a.x-cx,a.y-cy)-hyp(b.x-cx,b.y-cy))[0];
  if(s&&simT-(s.saidT||-9)>1.5){s.saidT=simT;line(s,'lab',SCI_LAB);}
  if(office.labN===4)banner('All the lab equipment is wrecked.',2400);hud();
}
function sparkTick(){   // the wrecked benches spit sparks for a few seconds
  office.sparks=office.sparks.filter(s=>simT-s.t0<3.5);
  for(const s of office.sparks)if(Math.random()<.35)sparks.push({x:s.x+(Math.random()-.5)*30,y:s.y+(Math.random()-.5)*10,t:0});
}
// the freed men's goodbye at the end of the mission (Bryan: they stay with the squad until it's over), then done()
function farewell(done){
  const men=players.filter(p=>p.joined&&!p.dead&&FAREWELL[p.name]);
  if(!men.length){done();return;}
  banner('The freed men will meet you back at HQ.',3000);
  men.forEach((m,i)=>setTimeout(()=>{if(state==='play'&&!m.dead)line(m,'bye',[FAREWELL[m.name]],0,3.2,C.good);},900+i*2700));
  setTimeout(done,1500+men.length*2700);
}
// Marsh on his feet again (from reviveUp): his line, once
function onRevive(t){if(t.joined&&t.name==='Marsh'&&!t.saidUp){t.saidUp=true;line(t,'up',[MARSH_UP],0,3,C.good);}}

/* ---------- the hint line inside, with nobody selected (hud.js) ---------- */
function officeHint(){
  const n=detained().length,left=office.heard&&office.freed<4?' The prisoners in the basement can still be freed.':'';
  const lab=players.some(p=>alive(p)&&floorOf(p.x,p.y)==='1F')&&office.labN<4?` Bonus: wreck the lab equipment (${office.labN}/4).`:'';
  if(n)return `Bring the scientists out: everyone who's up to the front doors. Detained scientists follow the soldier who tied them.${left}${lab}`;
  if(!office.card)return 'The scientists are on the top floor. Find an access card: the lift and the door at the top of the stairs need one.';
  return `Up to the top floor by the stairs (east side) or the lift (west side). The stairs come out behind the gun that watches the lift.${office.door===2?left:' The computer in the shared room opens the steel door.'}${lab}`;
}

/* ---------- Continue from a save made after the building (save.js) ---------- */
// a freed man who joined before the save: back with his fire team
function rejoin(id,d,at){
  const s=openSpot(at.x,at.y,players.filter(p=>!p.dead).map(destOf))||at,u=mk('P',/^A/.test(id)?'A':'B',id,d.name||id,s.x,s.y,Math.PI/2);
  Object.assign(u,{kind:'prisoner',weapon:d.weapon||null,grenade:0,spec:null,specN:0,charges:0,unarmored:true,joined:true,freed:true,level:levelOf(xpOf(id)),hp:d.hp});
  makePerson(u);players.push(u);if(typeof preloadVoices==='function')preloadVoices([id]);return u;
}
// the scientists the squad brought out: detained, following
function sciBack(n,at){
  for(let i=0;i<n;i++){const s=openSpot(at.x,at.y+20,units.map(destOf))||at,u=mk('C','C','S'+(i+1),'Scientist',s.x,s.y,Math.PI/2);
    Object.assign(u,{kind:'sci',sci:true,sciN:i,detained:true,weapon:null,grenade:0,spec:null,specN:0,pleadT:simT+6+i*3});makePerson(u);civs.push(u);}
  sciOut=n;if(typeof preloadVoices==='function')preloadVoices(['S1','S2','S3','S4']);
}

/* ---------- every tick inside (from interiorTick), drawing, resets ---------- */
function officeTick(dt){   // inside (from interiorTick)
  if(MAPID!=='in')return;
  cardTick();doorTick();cryTick();stairsTick();liftTick();sparkTick();
}
let lootT=0;
function officeEvery(dt){   // both maps (from update): freed men looking for a rifle, the bio scan
  if((lootT-=dt)<=0){lootT=.3;lootTick();}
  scanTick(dt);
}
function drawOffice(now){
  const pulse=(Math.sin(now*4)+1)/2,act=sel.some(alive);
  for(const c of civs){
    if((!c.vis&&!c.detained)||offFloor(c))continue;const[x,y]=toS(c.x,c.y,22);
    if(c.sci){if(c.detained)label('DETAINED',x,y,'#e9eef2',8,700);else{label('SCIENTIST',x,y,'#e9eef2',9,700);if(act&&!zipFor(c)){const[fx,fy]=toS(c.x,c.y);pill('ZIP-TIE',fx,fy+16,C.good);}}}
    else if(c.strapped)label('PRISONER · ALIVE',x,y,'#d9c7a0',9,700);
    else label('PRISONER',x,y,'#d9c7a0',9,700);
  }
  if(office.ride){const z=office.ride.z,k=(simT-office.ride.t)/LIFT_RIDE,[lx,ly]=toS((z.x0+z.x1)/2,(z.y0+z.y1)/2,30);label(office.ride.tr.to==='1F'?'GOING UP':'GOING DOWN',lx,ly,'#ffcf4a',10,700);bar(lx-20,ly+8,40,k,'#ffcf4a');}
  for(const u of players)if(u.lift&&alive(u)&&!offFloor(u)){const[x,y]=toS(u.x,u.y,26);label('LIFT',x,y,'#ffcf4a',8,700);}
  if(office.door===1){const o=IN.objs.find(q=>q.kind==='steeldoor');if(o&&!offFloor({x:o.x,y:o.y})){gPath(o.x+o.w/2,o.y+o.h/2,40+pulse*8);ox.strokeStyle=`rgba(255,60,40,${(.5+pulse*.4).toFixed(2)})`;ox.lineWidth=2;ox.stroke();}}
  if(scanGo&&scanGo.t>0){const s=scanGo.s;gPath(s.x,s.y,15,-Math.PI/2,-Math.PI/2+scanGo.t/3*TAU);ox.strokeStyle='#7ff0ff';ox.lineWidth=2.4;ox.stroke();}
}

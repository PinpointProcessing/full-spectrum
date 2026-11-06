"use strict";
/* Mutable battle state, unit creation, reset, and the game speed (pause / slow-mo). */
let units=[],players=[],enemies=[],sel=[],preview=null,mode=null,contact=false,paused=false,state='intro',ambushT=-9,cardGroup=[];   // cardGroup: soldiers whose cards are on show
let simT=0,shots=[],tracers=[],flashes=[],sparks=[],nades=[],booms=[],callouts=[],decals=[],visTick=0,aiTick=0,endAt=0,downCount=0,storm=0,stormT=12;
const alive=u=>!u.dead&&!u.downed;
// every soldier carries a grenade and one special item (Bryan): a silencer, an RPG, a medic kit or smoke; ammo drops refill them
// (no swapping)
const DEFAULT_SPEC={A1:'silencer',A2:'silencer',B1:'rpg',B2:'medkit'};   // (Bryan: Alpha both silenced, Bravo an RPG and the medic kit)

function mk(side,team,id,name,x,y,ang){
  const u={side,team,id,name,x,y,ang,hp:100,sup:0,cool:.4+Math.random()*1.2,path:[],downed:false,dead:false,bleed:BLEED_T,revive:0,
    rounds:0,reloadT:0,grenade:1,spec:'smoke',specN:1,charges:1,carry:null,carriedBy:null,critical:false,crit:0,medGo:null,carryGo:null,boxRev:0,plant:null,supT:null,focus:null,lastOrder:-99,exposeT:0,seen:false,vis:false,last:null,alerted:false,moveCool:0,hitFlash:0,aimT:-9,target:null,covered:false,fell:false,noLine:0,flankCD:0,wasDown:false,peek:null,lx:0,ly:0,gait:'run',gaitForce:null,inVeh:null,seat:null,boarding:null,aware:0,susp:null,wary:false,
    level:1,stats:{kills:0,streak:0,best:0,lastKill:-99,revives:0,items:0,downs:0,ties:0}};
  units.push(u);return u;
}
function reset(){
  leaveLevel1Now();leaveLevel2Now();leaveHQNow();   // (Level 1: level1.js; Level 2: level2.js; the Headquarters: fortress.js)
  leaveInteriorNow();   // a new game or Continue from inside the office building: back to the outdoor map first
  resetRoad();   // the road east closed again (road.js)
  clearBuilds();clearSkills();   // the Defender's barricades and walls go (build.js), and the field stations set down (skills.js)
  for(const u of units){if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);if(u.slight&&u.slight.parent)u.slight.parent.remove(u.slight);}
  units=[];
  mk('P','A','A1','Reyes',70,775,-0.8);mk('P','A','A2','Kowalski',102,772,-0.8);
  mk('P','B','B1','Hayes',78,808,-0.8);mk('P','B','B2','Okafor',114,812,-0.8);
  mk('E','E','E1','Hostile',273,459,Math.PI/2);mk('E','E','E2','Hostile',347,459,Math.PI/2);
  mk('E','E','E3','Hostile',222,494,Math.PI/2);mk('E','E','E4','Hostile',398,494,Math.PI/2);
  players=units.filter(u=>u.side==='P');enemies=units.filter(u=>u.side==='E');for(const e of enemies)e.grp=0;   // (the warehouse's four: area 0)
  for(const p of players){p.weapon=SHOTGUNNERS.includes(p.id)?'shotgun':DEFAULT_WEAPON[p.id]||'rifle';p.weapon2=null;p.spec=DEFAULT_SPEC[p.id]||'smoke';p.specN=specFull(p);}
  for(const p of players){p.level=levelOf(xpOf(p.id));classGear(p);p.skillN=skillFull(p);p.skillT=0;}   // (a Medic's kits, a Support's rockets, an Assault's frags: classes.js)
  for(const u of units)makeSoldier(u);
  addRadioKit(enemies[1]);   // E2 carries the warehouse's radio (hunt.js)
  drawGround();
  sel=[];cardGroup=[];preview=null;mode=null;contact=false;paused=false;simT=0;downCount=0;ambushT=-9;
  shots=[];tracers=[];flashes=[];sparks=[];nades=[];booms=[];callouts=[];decals=[];smokes=[];endAt=0;
  landing=null;if(dinghy)dinghy.position.set(DOCK.moor.x,.2,DOCK.moor.y);
  civs=[];volley=null;resetOffice();resetChatter();resetMonsters();   // (office.js, chatter.js, monsters.js)
  resetWaves();resetHunt();resetOrders();resetLayers();setStatus();buildCards();
}
function timeScale(){return paused?0:(preview||mode||tutSlow())?0.25:1;}   // (tutSlow: a tip of Level 1's tutorial waiting, level1.js)

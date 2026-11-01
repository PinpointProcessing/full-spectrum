"use strict";
/* Mutable battle state, unit creation, reset, and the game speed (pause / slow-mo). */
let units=[],players=[],enemies=[],sel=[],preview=null,mode=null,contact=false,paused=false,state='intro',ambushT=-9,cardGroup=[];   // cardGroup: soldiers whose cards are on show
let simT=0,shots=[],tracers=[],flashes=[],sparks=[],nades=[],booms=[],callouts=[],decals=[],visTick=0,aiTick=0,endAt=0,downCount=0,storm=0,stormT=12;
const alive=u=>!u.dead&&!u.downed;

function mk(side,team,id,name,x,y,ang){
  const u={side,team,id,name,x,y,ang,hp:100,sup:0,cool:.4+Math.random()*1.2,path:[],downed:false,dead:false,bleed:45,revive:0,
    grenade:1,charges:1,plant:null,supT:null,focus:null,lastOrder:-99,exposeT:0,seen:false,vis:false,last:null,alerted:false,moveCool:0,hitFlash:0,aimT:-9,target:null,covered:false,fell:false,noLine:0,flankCD:0,wasDown:false,peek:null,lx:0,ly:0,gait:'run',gaitForce:null,inVeh:null,seat:null,boarding:null,aware:0,susp:null,wary:false,
    level:1,stats:{kills:0,streak:0,best:0,lastKill:-99,revives:0,items:0,downs:0}};
  units.push(u);return u;
}
function reset(){
  for(const u of units)if(u.m)scene.remove(u.m.g);
  units=[];
  mk('P','A','A1','Reyes',70,775,-0.8);mk('P','A','A2','Kowalski',102,772,-0.8);
  mk('P','B','B1','Hayes',78,808,-0.8);mk('P','B','B2','Okafor',114,812,-0.8);
  mk('E','E','E1','Hostile',273,459,Math.PI/2);mk('E','E','E2','Hostile',347,459,Math.PI/2);
  mk('E','E','E3','Hostile',222,494,Math.PI/2);mk('E','E','E4','Hostile',398,494,Math.PI/2);
  players=units.filter(u=>u.side==='P');enemies=units.filter(u=>u.side==='E');
  for(const p of players)p.weapon=SHOTGUNNERS.includes(p.id)?'shotgun':'rifle';
  for(const p of players)p.level=levelOf(xpOf(p.id));
  for(const u of units)makeSoldier(u);
  drawGround();
  sel=[];cardGroup=[];preview=null;mode=null;contact=false;paused=false;simT=0;downCount=0;ambushT=-9;
  shots=[];tracers=[];flashes=[];sparks=[];nades=[];booms=[];callouts=[];decals=[];endAt=0;
  landing=null;if(dinghy)dinghy.position.set(DOCK.moor.x,.2,DOCK.moor.y);
  resetWaves();setStatus();buildCards();
}
function timeScale(){return paused?0:(preview||mode||(ptr&&ptr.kind==='draw'))?0.25:1;}

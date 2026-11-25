/* ddmeta.js: D-Day, after the battle (Version 157). Bryan, after Version 156: "Now the after battle. In Battlefield, it shows the entire
   team in the after battle report... Can we show the two teams the player ended with... Then stats grow above them", then "the player will
   see the troops... at the new base. The player will be able to select buildings. Barracks, armory, and vehicle depot." Drafts 1-5 in
   docs/drafts (dday-after-battle-draft*.png); his answers in docs/dday-test.md.

   A win no longer ends on the old end card: ddFinish (ddplay.js) calls ddmStart, `state` becomes 'ddmeta' and main.js's frame loop runs
   ddMetaFrame instead of the game. Three phases, `ddm.ph`:
     'report'   the eight he ended with in two diagonal lines at the barracks they took, the game's own scene and camera; cards count up
                kills, revives and XP, one unit MVP (the dead can be), the fallen listed
     'base'     the base from above; BARRACKS, ARMORY and VEHICLE DEPOT each over its own building (DB in ddbase.js)
     'barracks' a room of its own (ddmRoom: a wooden hut, Alpha's bunks along the left wall and Bravo's along the right, each man at ease by
                his bunk, his gun laid on it), a scene and camera of its own like equip.js's boat
   The roster (ddRoster, localStorage DDM_KEY): two squads of four slots, a reserve of up to DDM_RES, the armory's saved kit, medals, and the
   recruits on offer. A man (`rm`) has a name, role, level, xp, four stats 0-99 (hp, aim, spd, brv), maybe a trait, and his kit by slot
   (w weapon, g grenade, t tool: ids into DDM_ITEMS). ddmAttach(u,rm) turns that into the unit's numbers at the start of a battle
   (ddNewMan in ddplay.js), and enterDDay lands the roster's men. */
const DDM_KEY='warehouseYard.ddmeta.v1',DDM_RES=8;
let ddm=null,ddRoster=null;
const DDM_ICON={
  medic:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="currentColor"/></svg>',
  gunner:'<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><path d="M4 21V9l2.5-5L9 9v12z"/><path d="M10.5 21V9L13 4l2.5 5v12z"/><path d="M17 21V9l2.5-5L22 9v12z"/></g></svg>',
  sharp:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v7M12 15v7M2 12h7M15 12h7" stroke="currentColor" stroke-width="2"/></svg>',
  rifle:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 13h13l2-3h5v3h-3l-1 2h-5l-1 4H9l1-4H2z" fill="currentColor"/></svg>',
  demo:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3a6 6 0 0 0-5.6 8.2L3 16.6 7.4 21l5.4-5.4A6 6 0 0 0 21 10l-4 3-3-3 3-4a6 6 0 0 0-3-3z" fill="currentColor"/></svg>',   // (after Version 224, Bryan: the bazooka man is the Engineer, a wrench his icon)
  eng:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3a6 6 0 0 0-5.6 8.2L3 16.6 7.4 21l5.4-5.4A6 6 0 0 0 21 10l-4 3-3-3 3-4a6 6 0 0 0-3-3z" fill="currentColor"/></svg>'};
const DDM_ROLE={medic:'Medic',gunner:'Gunner',rifle:'Rifleman',sharp:'Sharpshooter',demo:'Engineer',eng:'Engineer'};
const DDM_TRAITS={
  steel:{n:'Nerves of Steel',d:'Never pinned down.'},
  double:{n:'Double Life',d:'Takes half the damage: two health bars in one.'},
  marathon:{n:'Marathon Runner',d:'Bonus speed.'},
  eyes:{n:'20/20',d:'Bonus aim.'}};
// kit: s the slot, role who may carry it (none: anyone), std standard issue (never runs out, never stored), star one of a kind (lost with its owner)
const DDM_ITEMS={
  garand:{s:'w',n:'M1 Garand',role:['medic','rifle','demo','eng'],std:1,weapon:'rifle',d:'Standard rifle.'},
  bar:{s:'w',n:'BAR',role:['gunner'],std:1,weapon:'hmg',d:'Suppresses hard, slow on the move.'},
  spring:{s:'w',n:'Springfield',role:['sharp'],std:1,weapon:'sniper',d:'Scoped rifle: one round, long reach.'},
  minigun:{s:'w',n:'Minigun',role:['gunner'],star:1,weapon:'hmg',d:'Pins half as hard again.',mod:{supK:1.5}},
  fifty:{s:'w',n:'.50 cal rifle',role:['sharp'],star:1,weapon:'sniper',d:'Steadier at any range.',mod:{aimK:.08}},
  tuned:{s:'w',n:'Garand, tuned',role:['medic','rifle','demo','eng'],weapon:'rifle',d:'A little more accurate.',mod:{aimK:.04}},
  longbar:{s:'w',n:'BAR, long barrel',role:['gunner'],weapon:'hmg',d:'A little more accurate.',mod:{aimK:.04}},
  frag:{s:'g',n:'Frag ×1',std:1,grenade:1,d:'One grenade.'},
  frag2:{s:'g',n:'Frag ×2',grenade:2,d:'A bandolier: two grenades.'},
  rgren:{s:'g',n:'Rifle grenades ×3',role:['rifle'],std:1,grenade:3,gl:1,d:'Fired from the rifle: further and flatter than a throw, a bigger blast.'},
  smoke:{s:'t',n:'Smoke ×2',std:1,spec:'smoke',specN:2,d:'Smoke for anyone.'},
  medkit:{s:'t',n:'Medic kit ×3',role:['medic'],std:1,spec:'medkit',specN:3,d:'Gets a man up, or patches one who is hurt.'},
  bazooka:{s:'t',n:'Bazooka ×4',role:['demo'],std:1,spec:'rpg',specN:4,d:'Bunkers, guns and tanks.'},
  dart:{s:'t',n:'Dart gun',role:['medic'],star:1,spec:'medkit',specN:5,d:'Five heals a battle (darts at range come later).'},
  guided:{s:'t',n:'Guided rockets ×6',role:['demo'],star:1,spec:'rpg',specN:6,d:'Six rockets a battle (guidance comes later).'},
  build:{s:'t',n:'Barricade kit',role:['eng'],std:1,spec:'build',specN:3,d:'Builds cover under fire.'}};
const DDM_SLOT={w:'Weapon',g:'Grenade',t:'Tool'};
const ddmStd=(role,slot)=>slot==='w'?(role==='gunner'?'bar':role==='sharp'?'spring':'garand'):slot==='g'?(role==='rifle'?'rgren':'frag'):(role==='medic'?'medkit':role==='demo'?'bazooka':role==='eng'?'build':'smoke');
const ddmCan=(rm,id)=>{const I=DDM_ITEMS[id];return!!I&&(!I.role||I.role.includes(rm.role));};
const ddmNeed=n=>250+50*(n-1);   // (XP for the next level: a strong first battle is two levels, not five)
function ddmRosterNew(){return{v:1,medals:0,minLevel:1,battles:0,squads:{A:[null,null,null,null],B:[null,null,null,null]},reserve:[],armory:[],recruits:[],uid:1};}
function ddmRead(){try{const r=JSON.parse(localStorage.getItem(DDM_KEY));if(r&&r.v===1&&r.squads)return r;}catch(e){}return ddmRosterNew();}
function ddmSave(){try{localStorage.setItem(DDM_KEY,JSON.stringify(ddRoster));}catch(e){}}
const ddmAll=()=>[...ddRoster.squads.A,...ddRoster.squads.B,...ddRoster.reserve].filter(Boolean);
function ddmName(){const used=new Set([...ddmAll(),...ddRoster.recruits].map(m=>m.name));for(let k=0;k<60;k++){const n=DD_NAMES[(Math.random()*DD_NAMES.length)|0];if(!used.has(n))return n;}return DD_NAMES[(Math.random()*DD_NAMES.length)|0];}
// a new man: stats 38-70 to start with a lean to his job, two points on each a level above the first; one in four of the recruits on offer
// has something special (a trait for a medal, or a one-of-a-kind piece of kit for two)
function ddmNewMan(role,level,star,name){
  const r=()=>38+Math.round(Math.random()*32),up=(level-1)*2,st={hp:r()+up,aim:r()+up,spd:r()+up,brv:r()+up};
  if(role==='gunner')st.hp+=6;if(role==='sharp')st.aim+=10;if(role==='rifle'){st.aim+=4;st.spd+=4;}if(role==='medic')st.brv+=6;if(role==='demo')st.spd+=5;
  for(const k in st)st[k]=clamp(st[k],20,99);
  const m={uid:ddRoster.uid++,name:name||ddmName(),role,level,xp:0,kills:0,stars:0,st,trait:null,gear:{w:ddmStd(role,'w'),g:ddmStd(role,'g'),t:ddmStd(role,'t')},cost:0};
  if(star){const sp=role==='gunner'?['w','minigun']:role==='sharp'?['w','fifty']:role==='medic'?['t','dart']:role==='demo'?['t','guided']:null;
    if(sp&&Math.random()<.5){m.gear[sp[0]]=sp[1];m.cost=2;}else{const ks=Object.keys(DDM_TRAITS);m.trait=ks[(Math.random()*ks.length)|0];m.cost=1;}}
  return m;
}
const ddmSharpOpen=()=>{if(!ddRoster)ddRoster=ddmRead();return ddRoster.battles>0;};   // (the Sharpshooter: unlocked by the first battle won)
function ddmRecruits(){const R=ddRoster,roles=['medic','gunner','rifle','demo','sharp','rifle','gunner','sharp'];R.recruits=[];for(let i=0;i<8;i++)R.recruits.push(ddmNewMan(roles[i],R.minLevel,i>=4&&Math.random()<.6||i===7));}
// the unit's numbers from the man: called by ddNewMan before his figure is made (a replacement with no man yet gets one made for him)
function ddmAttach(u,rm){
  if(!ddRoster)ddRoster=ddmRead();
  if(!rm)rm=ddmNewMan(u.ddRole,ddRoster.minLevel,false,u.name);
  u.rm=rm;u.name=rm.name;u.level=rm.level;const s=rm.st;
  u.aimK=(s.aim-50)/400;u.spdK=.88+s.spd/400;u.nerveK=clamp(1.35-s.brv/140,.55,1.4);u.dmgIn=1.15*clamp(1.25-s.hp/200,.7,1.1);u.bold=1;u.supK=1;
  u.trait=rm.trait?DDM_TRAITS[rm.trait].n:'level '+rm.level;
  if(rm.trait==='steel')u.nerveK=.001;if(rm.trait==='double')u.dmgIn*=.5;if(rm.trait==='marathon')u.spdK+=.15;if(rm.trait==='eyes')u.aimK+=.08;
  for(const k of['w','g','t']){if(!ddmCan(rm,rm.gear[k]))rm.gear[k]=ddmStd(rm.role,k);const I=DDM_ITEMS[rm.gear[k]];
    if(I.weapon)u.weapon=I.weapon;if(I.grenade){u.grenade=I.grenade;u.gl=!!I.gl;}if(I.spec){u.spec=I.spec;u.specN=I.specN;}
    if(I.mod)for(const q in I.mod)u[q]=q==='supK'?I.mod[q]:(u[q]||0)+I.mod[q];}
  for(const k of rm.perks||[])if(DDM_FX[k]&&ddmPerkOpts(rm).includes(k))DDM_FX[k](u);
  for(const q of ddmUnl(rm))if(rm.level>=q[0])DDM_FX[q[1]](u);
}
const ddmSlotMan=(t,i)=>{if(!ddRoster)ddRoster=ddmRead();const m=ddRoster.squads[t][i]||null;return m&&m.hurt?false:m;};   // (false: he's wounded and sits this one out, Version 165)
// Version 165, wounds (Bryan: "Another round of mid-battle customizing and healing happens before they set out"; his answers: a man still down
// when the battle ends is wounded and sits out the next chapter unless he's treated, one treatment a round is free and then a medal each, you
// choose who stands in, after every chapter): rm.hurt; ddmStart marks and clears it, the field hospital (base view) and the barracks treat it
const ddmFit=()=>[...ddRoster.squads.A,...ddRoster.squads.B].filter(m=>m&&!m.hurt);
const ddmReserveFit=()=>ddRoster.reserve.filter(m=>!m.hurt);
function ddmTakeReserve(){const R=ddRoster,k=R.reserve.findIndex(m=>!m.hurt);return k<0?null:R.reserve.splice(k,1)[0];}   // (a replacement in battle: a wounded man in the reserve stays put)
const ddmHurt=()=>[...['A','B'].flatMap(t=>ddRoster.squads[t].map((m,i)=>m&&m.hurt?{m,where:(t==='A'?'Alpha':'Bravo')}:null)),...ddRoster.reserve.map(m=>m.hurt?{m,where:'Reserve'}:null)].filter(Boolean);
function ddmTreat(m){const R=ddRoster;if(!m||!m.hurt)return false;if((R.treat||0)>0)R.treat--;else if(R.medals>0)R.medals--;else{banner('No medals left to pay for treatment.',2400);return false;}
  m.hurt=0;banner(`${m.name} is patched up: fit for the next chapter.`,2400);return true;}
const ddmTreatCost=()=>(ddRoster.treat||0)>0?'FREE':'★ 1';
// Version 178 (Bryan: "let's make all levels accessible like we did for the horror game version"): a chapter started from the start card before
// it's been reached gets the roster moved on to it, as if the chapters before were won: the empty squad slots filled with new men at the level
// a player would have by then (2 for the counterattack, 3 for the village), the stage, battles, medals and the recruits' level with them, so
// the report, the barracks and the next chapter follow as usual. A roster already that far is left as it is. chap: 2 or 3; true if it moved on
function ddmReady(chap){
  if(!ddRoster)ddRoster=ddmRead();const R=ddRoster,need=chap-1;
  if((R.stage||0)>=need)return false;
  R.stage=need;R.battles=Math.max(R.battles||0,need);R.medals=Math.max(R.medals||0,need);R.minLevel=Math.max(R.minLevel||1,chap);
  for(const t of['A','B'])DD_CORE[t].forEach((r,i)=>{if(!R.squads[t][i])R.squads[t][i]=ddmNewMan(r,chap,false);});
  ddmRecruits();ddmSave();return true;
}

/* ---------- the end of a battle won: who's left, what they did ---------- */
// where the line-up stands and what the base view looks at, on the beach's map or the counterattack's (ddcounter.js)
function ddmSpots(){
  if(dd&&dd.vil)return{line:[700,-468],cam:[770,-520],zoom:[1.75,3],bk:VG.meta.bk,ar:VG.meta.ar,vd:VG.meta.vd,hs:VG.meta.hs,sq:[672,-536],off:{bk:[0,-10],ar:[0,-14],vd:[0,-12],hs:[0,-12]}};   // (the village, Chapter 3: its town hall the barracks, ddvillage.js)
  if(dd&&dd.counter)return{line:[885,655],cam:[700,720],zoom:[1.75,3],bk:[DCA.barracks[0].x+85,DCA.barracks[0].y+50],ar:[DCA.armory.x+55,DCA.armory.y+28],vd:[DCA.depot.x+75,DCA.depot.y+28],hs:[DCA.cp.x+60,DCA.cp.y+50],sq:[DCA.square.x-30,DCA.square.y-20],off:{bk:[0,-10],ar:[-10,24],vd:[30,24],hs:[0,-14]}};
  return{line:[DDX+520,-556],cam:[1545,-592],zoom:[2.6,3.6],bk:[(DB.bA.x+DB.bB.x+DB.bB.w)/2,DB.bA.y+DB.bA.h/2],ar:[DB.ammo.x+DB.ammo.w/2,DB.ammo.y+DB.ammo.h/2],vd:[DB.pool.x+DB.pool.w/2,DB.pool.y+DB.pool.h/2],hs:[DB.cp.x+DB.cp.w/2,DB.cp.y+DB.cp.h/2],sq:[1500,-592],off:{bk:[0,-6],ar:[34,-14],vd:[-34,20],hs:[0,-12]}};
}
function ddmStart(){
  if(!ddRoster)ddRoster=ddmRead();const R=ddRoster;
  const score=u=>u.stats.kills*40+(u.stats.revives||0)*50;
  const alive8=players.filter(p=>!p.dead&&p.rm),fallen=units.filter(u=>u.rm&&u.dead&&u.side==='P'&&!alive8.includes(u));
  const inBattle=new Set(units.filter(u=>u.rm&&u.side==='P').map(u=>u.rm)),sat=[];   // (the wounded who sat this one out: fit again, and back in their own slots)
  for(const t of['A','B'])R.squads[t].forEach((m,i)=>{if(m&&m.hurt&&!inBattle.has(m))sat.push({m,t,i});});
  for(const m of[...R.squads.A,...R.squads.B,...R.reserve])if(m&&m.hurt&&!inBattle.has(m))m.hurt=0;
    const rows=alive8.map(u=>{const rm=u.rm,lv0=rm.level,xp0=rm.xp,gain=u.stats.kills*40+(u.stats.revives||0)*50+60;
    rm.kills+=u.stats.kills;
    const hurt=false;rm.hurt=0;   // (Version 226, Bryan: "The wounded are healed post battle")
    if(u.downed){u.downed=false;u.critical=false;u.hp=35;}
    return ddmGain({u,rm,team:u.team,kills:u.stats.kills,rev:u.stats.revives||0,gain:0,lv0,xp0,lv1:rm.level,mvp:false,sc:score(u),hurt,downs:u.stats.downs||0,items:u.stats.items||0,best:u.stats.best||0},gain);});
  ddmCite(rows);
  const noms=rows.filter(r=>r.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,3);if(!noms.length&&rows.length)noms.push(rows[0]);
  const dead=fallen.map(u=>({name:u.name,role:u.ddRole,kills:u.stats.kills,rev:u.stats.revives||0,mvp:false,rm:u.rm,team:u.team,slot:clamp((+String(u.id).slice(1)||1)-1,0,3)}));
  // whoever he ended with is the roster (Bryan); the dead are gone, and their kit with them
  for(const t of['A','B']){R.squads[t]=[null,null,null,null];for(const u of alive8.filter(p=>p.team===t)){const i=clamp((+String(u.id).slice(1)||1)-1,0,3);R.squads[t][R.squads[t][i]?R.squads[t].indexOf(null):i]=u.rm;}}
  for(const s of sat){const Q=R.squads[s.t],j=Q[s.i]?Q.indexOf(null):s.i;if(j>=0)Q[j]=s.m;else{const o=R.squads[s.t==='A'?'B':'A'],k=o.indexOf(null);if(k>=0)o[k]=s.m;else R.reserve.push(s.m);}}
  R.treat=1;   // (one free treatment this round)
  const chap=dd.vil?3:dd.counter?2:1;   // (1 D-Day, 2 the counterattack, 3 the village)
  R.medals++;R.battles++;R.minLevel=Math.max(R.minLevel,chap+1);R.stage=Math.max(R.stage||0,chap);ddmRecruits();ddmSave();
  const t=Math.floor(simT-dd.t0);
  ddm={ph:'report',step:-1,stepT:0,tiles:[['TIME',`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`],['ENEMY DOWN',dd.counter?DCA.waves.reduce((n,w)=>n+w.inf,0):chap===3?dd.vg.spawned-enemies.filter(e=>!e.dead).length:enemies.filter(e=>e.dead).length+(dd.tidyE||0)],['OURS LOST',dd.lost]],more:[...(chap===1?[['CHECKPOINTS',`${['left','outpost','crest','base'].filter(k=>(dd.held||{})[k]).length+(dd.won?1:0)}/5`]]:[]),['TANKS OUT',(dd.tanks||[]).filter(K=>K.hp<=0&&!K.left).length],['WOUNDED',rows.filter(r=>r.hurt).length],['REVIVES',rows.reduce((n,r)=>n+(r.rev||0),0)],['GRENADES',rows.reduce((n,r)=>n+(r.items||0),0)]],nextCh:chap,t:0,rows,dead,mvp:null,noms,scr:null,vis:{},chap:['CHAPTER 1 · D-DAY','CHAPTER 2 · THE COUNTERATTACK','CHAPTER 3 · THE VILLAGE'][chap-1],sp:ddmSpots(),sum:`${chap===3?'The village taken in':dd.counter?'The base held for':'Their base taken in'} ${Math.floor(t/60)}:${String(t%60).padStart(2,'0')} · ${dd.counter?DCA.waves.reduce((n,w)=>n+w.inf,0):chap===3?dd.vg.spawned-enemies.filter(e=>!e.dead).length:enemies.filter(e=>e.dead).length+(dd.tidyE||0)} enemy down${chap===3?' · '+enemies.filter(e=>e.surr&&!e.dead).length+' taken prisoner':''}${dd.counter||chap===3?' · '+dd.tanks.filter(K=>K.hp<=0&&!K.left).length+' tank'+(dd.tanks.filter(K=>K.hp<=0&&!K.left).length===1?'':'s')+' knocked out':''} · ${dd.lost} of ours lost`,pick:null,slot:null,ui:null,room:null,cam:{k:1}};
  state='ddmeta';sel=[];cardGroup=[];mode=null;camPan=null;dd.track=null;paused=false;
  if(chap===3)for(const K of dd.tanks||[])if(K.g)K.g.visible=false;   // (the village: the wrecked tank out of the line-up's way)
  document.body.classList.add('ddm');{const q=$('#sq');if(q)q.hidden=true;}{const o=$('#oob');if(o)o.hidden=true;}
  // the line-up: each squad in a diagonal line across from the other, in front of the barracks on the hill
  const[cx,cy]=ddm.sp.line;ddmLineUp();
  for(const u of units)if(!rows.some(r=>r.u===u)){u.path=[];if(u.side==='P'&&!u.dead&&Math.hypot(u.x-cx,u.y-(cy-10))<70){u.x+=u.x<cx?-70:70;}}
  if(ddmV2){ddmV2=false;ddmV2Init();}   // (Version 240's draft: the whole report on one page, below)
  else if(noms.length===1)ddmAward(0);   // (nobody to choose between)
  ddmUI();
}
function ddmLineUp(){const rows=ddm.rows,[cx,cy]=ddm.sp.line,T={A:0,B:0};
  for(const r of rows){const u=r.u,s=u.team==='A'?-1:1,i=T[u.team]++;r.y0=null;u.atEase=false;
    Object.assign(u,{x:cx+s*(8+i*10.5),y:cy-30+i*14,ang:Math.PI/2+s*.5,path:[],sup:0,focus:null,target:null,cool:99,aimT:-9,watch:null,supT:0,covered:false,inBoat:false,afloat:false,joining:false,lx:0,ly:0,elev:0});}
}
// Version 194: XP through one door (a level is +2 on every stat and a perk to choose, rm.pk); the company's medal is the player's to give
// (ddm.noms, the three who did most; ddmAward: a star and +100 XP); a perk is +6 on one stat, one of two on offer (rm.pkO)
function ddmGain(r,xp){const rm=r.rm;r.gain+=xp;rm.xp+=xp;while(rm.xp>=ddmNeed(rm.level)){rm.xp-=ddmNeed(rm.level);rm.level++;rm.pk=(rm.pk||0)+1;for(const k in rm.st)rm.st[k]=Math.min(99,rm.st[k]+2);}r.lv1=rm.level;return r;}
function ddmAward(i){const r=ddm.noms[i];if(!r||ddm.mvp)return;r.mvp=true;r.rm.stars++;ddmGain(r,100);ddm.mvp=r.u;ddm.rows.splice(ddm.rows.indexOf(r),1);ddm.rows.unshift(r);ddmCite(ddm.rows);ddmSave();}
// Version 196 (Bryan: "perks tied to the man's jobs and unlockable upgrades with higher levels"): a perk is one of his job's two (DDM_JOB,
// taken as often as he likes, kept in rm.perks); at levels 3 and 5 his job's upgrade unlocks by itself (DDM_UNLOCK, from rm.level). Both are
// applied to the unit in ddmAttach (DDM_FX). The +6 stat perks of Versions 194-195 already taken stay in his stats.
const DDM_FX={kit:u=>{if(u.spec)u.specN=(u.specN||0)+1;},kit2:u=>{if(u.spec)u.specN=(u.specN||0)+2;},calm:u=>{u.nerveK*=.85;},calm2:u=>{u.nerveK*=.5;},sup:u=>{u.supK*=1.15;},sup2:u=>{u.supK*=1.3;},
  armor:u=>{u.dmgIn*=.92;},armor2:u=>{u.dmgIn*=.8;},aim:u=>{u.aimK+=.03;},aim2:u=>{u.aimK+=.07;},gren:u=>{u.grenade=(u.grenade||0)+1;},gren2:u=>{u.grenade=(u.grenade||0)+2;},fast:u=>{u.spdK+=.05;},fast2:u=>{u.spdK+=.12;}};
const DDM_JOB={medic:[['kit','FIELD SURGEON','+1 medic kit'],['calm','CALM HANDS','Harder to pin']],gunner:[['sup','HEAVY FIRE','Pins 15% harder'],['armor','THICK SKIN','Takes 8% less']],
  rifle:[['aim','MARKSMAN','Better aim'],['gren','GRENADIER','+1 grenade']],sharp:[['aim','STEADY BREATH','Better aim'],['fast','LIGHT FEET','Faster']],
  demo:[['kit','ROCKETEER','+1 rocket'],['fast','LIGHT FEET','Faster']],eng:[['kit','BUILDER','+1 build kit'],['armor','THICK SKIN','Takes 8% less']]};
const DDM_UNLOCK={medic:[[3,'kit2','COMBAT MEDIC','+2 medic kits'],[5,'calm2','UNSHAKEABLE','Half as easy to pin']],gunner:[[3,'sup2','SUPPRESSOR','Pins 30% harder'],[5,'armor2','BULWARK','Takes 20% less']],
  rifle:[[3,'gren2','BANDOLIER','+2 grenades'],[5,'aim2','CRACK SHOT','Much better aim']],sharp:[[3,'aim2','HUNTER','Much better aim'],[5,'calm2','ICE COLD','Half as easy to pin']],
  demo:[[3,'kit2','TANK HUNTER','+2 rockets'],[5,'fast2','SPRINTER','Much faster']],eng:[[3,'kit2','SAPPER','+2 build kits'],[5,'armor2','BULWARK','Takes 20% less']]};
const ddmJob=rm=>DDM_JOB[rm.role]||DDM_JOB.rifle,ddmUnl=rm=>DDM_UNLOCK[rm.role]||DDM_UNLOCK.rifle;
const ddmPerkOpts=rm=>ddmJob(rm).map(q=>q[0]);
function ddmPerkPick(rm,k){if(!rm||!(rm.pk>0)||!ddmPerkOpts(rm).includes(k))return false;rm.pk--;rm.pkO=null;(rm.perks=rm.perks||[]).push(k);return true;}
const ddmPerkN=(rm,k)=>(rm.perks||[]).filter(q=>q===k).length;
const ddmPerksDue=()=>[...ddRoster.squads.A,...ddRoster.squads.B].reduce((n,m)=>n+(m&&m.pk||0),0);
function ddmEnd(){   // (from leaveDDayNow and reset: everything of this put away)
  if(ddm&&ddm.room)ddmRoomDispose();ddm=null;document.body.classList.remove('ddm');const e=$('#ddm');if(e)e.remove();if(state==='ddmeta')state='end';
}
function ddmNext(){ddmSave();ddmEnd();startDDay();}

/* ---------- the frame (main.js, while state is 'ddmeta') ---------- */
function ddMetaFrame(rdt,now){
  if(!ddm)return;ddm.t+=rdt;simT+=rdt;
  if(ddm.ph==='barracks'){ddmRoomFrame(rdt);ddmPlace();return;}
  const SP=ddm.sp;
  const mv=ddm.ph==='report'&&ddm.man!=null&&ddm.step>=ddm.rows.length?ddm.rows[ddm.man]:null;   // (Version 223: a man's page: he's on the left of it)
  if(mv){ddmPortraitFrame(mv,rdt);return;}else ddmPortraitEnd();
  if(ddm.ph==='report'){ddmRollTick(rdt);ddmV2Tick(rdt);const r=mv||ddm.rows[ddm.step],C=ddm.cam,one=!!r,zt=mv?(cw<ch?15:13):one?(cw<ch?10.5:9.5):(cw<ch?7.6:6.4),tx=one?r.u.x+(mv?C.ox||0:0):SP.line[0],tz=(one?r.u.y+(mv?C.oz||0:cw<ch?16:6):SP.line[1]-34)+DD_CAM.look;if(!mv)C.ox=C.oz=0;
    if(C.x==null){C.x=tx;C.z=tz;C.zm=zt;}const e=Math.min(1,rdt*4.5);C.x+=(tx-C.x)*e;C.z+=(tz-C.z)*e;C.zm+=(zt-C.zm)*e;zoom=C.zm;yaw=0;tilt=ddTilt(C.zm,mv?.25:undefined);camT.x=C.x;camT.z=C.z;}
  else{const z=cw<ch?SP.zoom[0]:SP.zoom[1],at=ddm.at&&SP[ddm.at],tx=at?at[0]:SP.cam[0],tz=(at?at[1]-(cw<ch?30:8):SP.cam[1])+DD_CAM.look,zt=at?z*1.7:z,C=ddm.bc||(ddm.bc={x:tx,z:tz,zm:zt}),e=Math.min(1,rdt*3.2);
    C.x+=(tx-C.x)*e;C.z+=(tz-C.z)*e;C.zm+=(zt-C.zm)*e;zoom=C.zm;yaw=0;tilt=-.5;camT.x=C.x;camT.z=C.z;}   // (Version 196: walking the base)
  camShift=0;updateCamera();
  if(mv){   // (where he is on the screen now, and how far over the view has to go to put him a fifth of the way across)
    const u=mv.u,C=ddm.cam,V=ddm.v3||(ddm.v3=new T.Vector3()),h=(typeof ddH==='function'?ddH(u.x,u.y):0)+9;V.set(u.x,h,u.y).project(camera);const ax=V.x,ay=V.y,bx=V.set(u.x+10,h,u.y).project(camera).x,cy=V.set(u.x,h,u.y+10).project(camera).y,ppu=Math.max(.4,(bx-ax)*cw/20),ppv=Math.max(.2,(ay-cy)*ch/20);
    C.ox=clamp((C.ox||0)+((ax+1)*cw/2-cw*(cw<ch?.21:.19))/ppu,-400,400);C.oz=clamp((C.oz||0)+((1-ay)*ch/2-ch*(cw<ch?.5:.52))/ppv,-400,400);}
  render(rdt,now);ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);ddmPlace();
}

// a white flag with a red cross by the field hospital in the base view (Version 165)
function ddmHospFlag(){
  if(ddm.flag||!DD||!DD.scene||!ddm.sp.hs)return;const[x,y]=ddm.sp.hs,g0=typeof ddH==='function'?ddH(x,y):0,g=new T.Group();g.position.set(x+18,g0,y+18);
  const tex=canvasTex(64,48,(q,w,h)=>{q.fillStyle='#f2f0ea';q.fillRect(0,0,w,h);q.fillStyle='#c8231e';q.fillRect(w*.42,h*.14,w*.16,h*.72);q.fillRect(w*.26,h*.38,w*.48,h*.24);});
  const pole=new T.Mesh(new T.CylinderGeometry(.6,.6,46,6),new T.MeshStandardMaterial({color:0x6a6e70,metalness:.5,roughness:.5}));pole.position.y=23;g.add(pole);
  const fl=new T.Mesh(new T.PlaneGeometry(18,13),new T.MeshStandardMaterial({map:tex,side:T.DoubleSide,roughness:.9}));fl.position.set(9.4,39,0);g.add(fl);
  DD.scene.add(g);ddm.flag=g;
}
/* ---------- the panels (DOM over the picture) ---------- */
const ddmEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function ddmUI(){
  let el=$('#ddm');if(!el){el=document.createElement('div');el.id='ddm';stage.appendChild(el);el.addEventListener('click',ddmClick);ddmSwipe(el);}
  const R=ddRoster,ph=ddm.ph;let h='';
  if(ph==='report'){h=ddmReportHTML();
  }else if(ph==='base'){
    const w=ddmHurt().length,last=(R.stage||0)>=3,nx=ddmTodo(),st=(k,done)=>nx.k===k?' on':done?' done':'';let n=0;
    h=`<div class="ddm-bar top row"><div><div class="ddm-t">YOUR BASE</div>${ddmStepsHTML(2)}</div><div class="r"><div class="ddm-t gold">★ ${R.medals} MEDAL${R.medals===1?'':'S'}</div><div class="ddm-dim">Reserve ${R.reserve.length}/${DDM_RES} · Armory ${R.armory.length}</div></div></div>
      <svg id="ddmPath"><polyline fill="none" stroke="#ffd76a" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/></svg>
      <button type="button" class="ddm-tag stop${w?' hurt':''}${st('hospital',!w)}" data-b="hs" data-a="hospital"><u>${!w?'✓':++n}</u><span>FIELD HOSPITAL<small>${w?w+' wounded · treat '+(ddmTreatCost()==='FREE'?'free':'★ 1'):'nobody wounded'}</small></span></button>
      <button type="button" class="ddm-tag stop${st('barracks',ddm.vis.bk)}" data-b="bk" data-a="barracks"><u>${ddm.vis.bk?'✓':++n}</u><span>BARRACKS<small>kit · ${R.recruits.length} recruits · reserve</small></span></button>
      ${last?'':`<button type="button" class="ddm-tag stop brief${st('go',false)}" data-b="sq" data-a="go"><u>${++n}</u><span>BRIEFING<small>${ddmEsc((DDM_NEXT[R.stage||1]||DDM_NEXT[1])[0])}</small></span></button>`}
      <button type="button" class="ddm-tag min" data-b="ar" data-a="armory">ARMORY<small>saved equipment</small></button>
      ${ddm.hosp?`<div class="ddm-sheet mid"><div class="ddm-t">FIELD HOSPITAL</div><div class="ddm-dim" style="margin:4px 0 6px">Untreated, he sits out the next mission. ${(R.treat||0)>0?'One free, then ★ 1 each.':'★ 1 each.'}</div>${ddmHurt().length?ddmHurt().map(h=>`<div class="ddm-it"><span><b>${ddmEsc(h.m.name)}</b> · ${DDM_ROLE[h.m.role]} · Level ${h.m.level}</span><em>${h.where}</em><button type="button" class="ddm-btn sm" data-a="treat" data-u="${h.m.uid}"${(R.treat||0)<1&&R.medals<1?' disabled':''}>TREAT · ${ddmTreatCost()}</button></div>`).join(''):'<div class="ddm-dim" style="margin:8px 0">Nobody is wounded.</div>'}<button type="button" class="ddm-btn grey" data-a="hospx" style="margin-top:8px">CLOSE</button></div>`:''}
      ${ddm.armory?`<div class="ddm-sheet mid"><div class="ddm-t">ARMORY · SAVED EQUIPMENT</div>${R.armory.length?R.armory.map(id=>`<div class="ddm-it${DDM_ITEMS[id].star?' gold':''}"><span><b>${DDM_ITEMS[id].star?'★ ':''}${DDM_ITEMS[id].n}</b> · ${DDM_ITEMS[id].d}</span><em>${DDM_ITEMS[id].role?DDM_ITEMS[id].role.map(r=>DDM_ROLE[r]).join(', '):'anyone'}</em></div>`).join(''):'<div class="ddm-dim" style="margin:8px 0">Nothing saved yet. In the barracks, press a piece of a man\'s kit and choose "Put it in the armory" to keep it here for later.</div>'}<button type="button" class="ddm-btn grey" data-a="armoryx">CLOSE</button></div>`:''}
      ${ddm.brief?ddmBriefHTML():''}
      <div class="ddm-bar bot">${(R.stage||0)<3?`${ddmNextHTML(nx)}<div class="ddm-row"><button type="button" class="ddm-btn grey" data-a="menu">MENU</button><button type="button" class="ddm-btn grey" data-a="barracks">BARRACKS</button><button type="button" class="ddm-btn go" data-a="go">NEXT MISSION ▸</button></div>`
        :`<div class="ddm-row"><button type="button" class="ddm-btn grey" data-a="menu">MENU</button><button type="button" class="ddm-btn grey" data-a="next">D-DAY AGAIN</button><button type="button" class="ddm-btn grey" data-a="again2">HOLD THE BASE AGAIN</button><button type="button" class="ddm-btn" data-a="again3">THE VILLAGE AGAIN</button></div><div class="ddm-dim">The village is yours. The next chapter is still to come.</div>`}</div>`;
  }else h=ddmBarracksHTML();
  el.className='ph-'+ph;el.innerHTML=h;
  ddmPlace();
}
// what follows the picture: the buildings' names over their buildings, the chosen man's name over his head, the kit bar under his feet
function ddmPlace(){
  const el=$('#ddm');if(!el||!ddm)return;
  if(ddm.ph==='base'){const at=ddm.sp,off=at.off;
    const T=[...el.querySelectorAll('.ddm-tag')].map(b=>{const p=at[b.dataset.b],q=toS(p[0],p[1]),o=off[b.dataset.b]||[0,-34];const w=b.offsetWidth||150,h=b.offsetHeight||40;return{b,x:clamp(q[0]+o[0],w/2+8,cw-w/2-8),y:clamp(q[1]+o[1],90,ch-110),w,h};});
    // (Version 164: tags that would sit on each other are pushed apart, the lower one further down: in landscape on a short screen the
    // counterattack's barracks and armory tags overlapped and the armory's took the taps)
    T.sort((a,b)=>a.y-b.y);for(let i=1;i<T.length;i++)for(let j=0;j<i;j++){const A=T[j],B=T[i];if(Math.abs(A.x-B.x)<(A.w+B.w)/2+4&&Math.abs(A.y-B.y)<(A.h+B.h)/2+4){const y2=A.y+(A.h+B.h)/2+6;if(y2<=ch-110)B.y=y2;else B.x=clamp(A.x+((B.x>=A.x||A.x<cw/2)?1:-1)*((A.w+B.w)/2+8),B.w/2+8,cw-B.w/2-8);}}
    for(const t of T){t.b.style.left=t.x+'px';t.b.style.top=Math.min(t.y,ch-60)+'px';}
    const pl=el.querySelector('#ddmPath polyline');if(pl)pl.setAttribute('points',['hs','bk','sq'].map(k=>T.find(t=>t.b.dataset.b===k)).filter(Boolean).map(t=>`${Math.round(t.x-t.w/2+19)},${Math.round(Math.min(t.y,ch-60))}`).join(' '));}
  if(ddm.ph==='barracks'&&ddm.room)ddmRoomPlace(el);
}
function ddmClick(ev){
  if(!ddm)return;let b=ev.target.closest('[data-a]');
  if(!b){   // a tap on a man in the room is a tap on his square
    if(ddm.ph!=='barracks'||!ddm.room||ddm.sub||ev.target.closest('.ddm-bar,.ddm-stats,.ddm-kit,.ddm-swap,.ddm-pick'))return;
    const r=ddm.room,bx=stage.getBoundingClientRect(),mx=ev.clientX-bx.left,my=ev.clientY-bx.top;let best=null,bd=70;
    for(const u of r.men){r.v.set(u.x,16,u.y).project(r.cam);const d=Math.hypot((r.v.x+1)*cw/2-mx,(1-r.v.y)*ch/2-my);if(d<bd){bd=d;best=u;}}
    if(!best||(ddm.slot&&best.slotK===ddm.slot[0]+ddm.slot[1]))return;b=$(`#ddm .ddm-sq[data-t="${best.slotK[0]}"][data-i="${best.slotK[1]}"]`);if(!b)return;}
  const a=b.dataset.a,R=ddRoster;
  if(ddm.swT&&performance.now()-ddm.swT<350)return;   // (the click that ends a swipe)
  if(a==='rolltap'&&ddm.step>=0&&ddm.an&&ddm.an.done)return;   // (a tap on a finished card does nothing: NEXT MAN, a swipe or a dot moves on)
  if(a==='rolltap'||a==='rollskip'){ddmRollTap(a==='rollskip');return;}
  if(a==='rollnext'){ddmRollTap(false);return;}
  if(a==='rollprev'){if(ddm.step>0)ddmRollGo(ddm.step-1);return;}
  if(a==='card'){ddmRollGo(+b.dataset.i);return;}
  if(a==='revive'){ddmRevive(+b.dataset.i);return;}
  if(a==='perk2'){const r=ddm.rows[+b.dataset.i];if(r&&r.v&&r.v.wait&&ddmPerkPick(r.rm,b.dataset.k)){r.pkd.push(b.dataset.k);r.v.wait=false;ddm.v2Snd=0;ddmSave();ddmUI();}return;}   // (Version 240's draft: his bar goes on)
  if(a==='manv'&&ddm.v2&&!ddm.v2Done)return;
  if(a==='manv'){ddmManGo(+b.dataset.i);return;}if(a==='manx'){ddmManGo(null);return;}if(a==='mann'){if(ddm.man!=null)ddmManGo(ddm.man+(+b.dataset.d));return;}   // (Version 223: a man's page off the report, and back)
  if(a==='nom'){ddm.nom=+b.dataset.i;ddmUI();return;}
  if(a==='award'){ddmAward(ddm.nom||0);ddm.scr=null;if(typeof sfxLevelUp==='function')sfxLevelUp(true);ddmRollGo(0);return;}
  if(a==='perk'){const r=ddm.rows[ddm.man!=null?ddm.man:ddm.step];if(r&&ddmPerkPick(r.rm,b.dataset.k)){r.pkd=(r.pkd||[]).concat(b.dataset.k);if(typeof sfxLevelUp==='function')sfxLevelUp(false);ddmSave();ddmUI();}return;}
  if(a==='report'){ddm.ph='report';ddm.man=null;for(const q of ddm.rows)q.u.away=false;ddm.scr=null;ddm.cam={k:1};ddm.brief=ddm.hosp=ddm.armory=false;ddmLineUp();for(const r of ddm.rows)figRefresh(r.u);ddmRollGo(ddm.rows.length);return;}
  if(a==='go'){ddm.brief=true;ddm.armory=false;ddm.hosp=false;ddm.at='sq';ddmUI();return;}
  if(a==='gox'){ddm.brief=false;ddm.at=null;ddmUI();return;}
  if(a==='start'){ddmSave();if(!ddmFit().length){banner('Nobody fit in the squads: treat the wounded, or bring men in from the reserve or the recruits.',3600);return;}ddmEnd();if(R.stage===2)startVillage();else startCounter();return;}
  if(a==='base'){ddm.ph='base';ddm.man=null;for(const q of ddm.rows)q.u.away=false;ddm.armory=false;ddm.hosp=false;ddm.brief=false;ddm.at=null;ddm.bc={x:ddm.sp.sq[0],z:ddm.sp.sq[1]+DD_CAM.look,zm:(cw<ch?ddm.sp.zoom[0]:ddm.sp.zoom[1])*1.7};ddmHospFlag();const A=ddm.rows.map(r=>r.u);A.forEach((u,i)=>{u.x=ddm.sp.sq[0]+(i%4)*14;u.y=ddm.sp.sq[1]+((i/4)|0)*16;u.ang=Math.PI/2;u.atEase=true;figRefresh(u);});}
  else if(a==='armory'){ddm.armory=true;ddm.hosp=false;ddm.at='ar';}else if(a==='armoryx'){ddm.armory=false;ddm.at=null;}
  else if(a==='hospital'){ddm.hosp=true;ddm.armory=false;ddm.at='hs';}else if(a==='hospx'){ddm.hosp=false;ddm.at=null;}
  else if(a==='treat'){const m=ddmAll().find(q=>String(q.uid)===b.dataset.u);if(ddmTreat(m)&&ddm.room)ddmRoomMen();}
  else if(a==='depot'){banner('The vehicle depot comes later.',2200);return;}
  else if(a==='menu'){ddmSave();reset();$('#end').hidden=true;$('#intro').hidden=false;state='intro';if(typeof ddCtrBtnShow==='function')ddCtrBtnShow();return;}
  else if(a==='again2'){ddmSave();ddmEnd();startCounter();return;}
  else if(a==='again3'){ddmSave();ddmEnd();startVillage({skip:true});return;}
  else if(a==='next'){if(ddmFit().length<1){banner('Nobody in the squads. Recruit someone at the barracks first.',3000);return;}ddmNext();return;}
  else if(a==='barracks'){ddm.vis.bk=1;ddm.ph='barracks';ddm.slot=null;ddm.sub=null;ddm.swap=null;ddm.cand=null;if(!ddm.room)ddmRoomBuild();ddmRoomMen();ddm.cam={k:1};}
  else if(a==='out'){   // (Version 192: leaving the barracks is only ever back to the base; the next mission starts from its briefing there, Bryan: "I entered the next level too quickly")
    ddm.ph='base';ddm.armory=false;ddm.at=null;ddm.bc={x:ddm.sp.bk[0],z:ddm.sp.bk[1]+DD_CAM.look,zm:(cw<ch?ddm.sp.zoom[0]:ddm.sp.zoom[1])*1.7};}
  else ddmBarracksClick(a,b);
  ddmSave();ddmUI();
}

/* ---------- the barracks: its panels ---------- */
const ddmSel=()=>ddm.slot?ddRoster.squads[ddm.slot[0]][ddm.slot[1]]:null;
const ddmStats=(m,cls)=>`<div class="ddm-stats ${cls||''}"><div class="ddm-dim">${DDM_ROLE[m.role]} · Level ${m.level}${m.stars?' · '+'★'.repeat(Math.min(3,m.stars)):''}${m.kills?' · '+m.kills+' kills':''}</div>${[['Health','hp'],['Aim','aim'],['Speed','spd'],['Bravery','brv']].map(([n,k])=>`<div class="ddm-st"><span>${n}</span><div><em style="width:${m.st[k]}%"></em></div><b>${m.st[k]}</b></div>`).join('')}<div class="ddm-xp"><em style="--w:${Math.round(m.xp/ddmNeed(m.level)*100)}%"></em></div>${m.trait?`<div class="ddm-perk gold"><b>★ ${DDM_TRAITS[m.trait].n}</b><br>${DDM_TRAITS[m.trait].d}</div>`:''}${ddmUnl(m).map(q=>`<div class="ddm-unl sm${m.level>=q[0]?' new':''}"><b>${m.level>=q[0]?'★':'LV '+q[0]} ${q[2]}</b><span>${ddmFxTxt(m,q[1],q[3])}</span></div>`).join('')}${ddmJob(m).filter(q=>ddmPerkN(m,q[0])).map(q=>`<div class="ddm-unl sm new"><b>${q[1]}${ddmPerkN(m,q[0])>1?' ×'+ddmPerkN(m,q[0]):''}</b><span>${ddmFxTxt(m,q[0],q[2])}</span></div>`).join('')}${['w','t'].map(k=>DDM_ITEMS[m.gear[k]]).filter(I=>I.star).map(I=>`<div class="ddm-perk gold"><b>★ ${I.n}</b><br>${I.d} Lost if he dies.</div>`).join('')}${m.hurt?`<div class="ddm-perk hurt"><b>✚ Wounded</b><br>He sits out the next chapter unless he's treated.<br><button type="button" class="ddm-btn sm" data-a="treat" data-u="${m.uid}"${(ddRoster.treat||0)<1&&ddRoster.medals<1?' disabled':''}>TREAT · ${ddmTreatCost()}</button></div>`:''}</div>`;
const ddmStar=m=>!!(m.trait||DDM_ITEMS[m.gear.w].star||DDM_ITEMS[m.gear.t].star);
const ddmMen8=()=>['A','B'].flatMap(t=>ddRoster.squads[t].map((q,i)=>q?[t,i]:null).filter(Boolean));
// a picture for a piece of kit: a long gun, a grenade, or a tool
function ddmKitIcon(k,I){const c=I&&I.star?'#ffd76a':'#cfd8e0';
  if(k==='w')return`<svg viewBox="0 0 90 30"><path d="M2 14h60v4H40l-6 8h-8l3-8H10l-8 6z M62 13h26v3H62z" fill="${c}"/></svg>`;
  if(k==='g')return`<svg viewBox="0 0 40 36"><ellipse cx="20" cy="22" rx="10" ry="12" fill="${c}"/><rect x="16" y="4" width="8" height="8" fill="${c}"/><path d="M24 6h8v10" stroke="${c}" stroke-width="2" fill="none"/></svg>`;
  return`<svg viewBox="0 0 40 36"><rect x="6" y="8" width="28" height="24" rx="3" fill="${c}"/>${I&&/medic/i.test(I.n)?'<path d="M17 13h6v5h5v6h-5v5h-6v-5h-5v-6h5z" fill="#c0392b"/>':'<path d="M6 15h28M14 8v-3h12v3" stroke="#39424b" stroke-width="2.5" fill="none"/>'}</svg>`;}
function ddmBarracksHTML(){
  const R=ddRoster,S=ddm.slot,m=ddmSel(),right=S&&S[0]==='B';
  const sq=t=>`<div><div class="ddm-gl" style="color:${t==='A'?'#58c4f6':'#f0b429'}">${t==='A'?'ALPHA':'BRAVO'}</div><div class="ddm-sqg" style="--tc:${t==='A'?'#58c4f6':'#f0b429'}">${R.squads[t].map((q,i)=>`<button type="button" class="ddm-sq${S&&S[0]===t&&S[1]===i?' on':''}${q?'':' open'}${q&&ddmStar(q)?' star':''}${q&&q.hurt?' hurt':''}${q&&q.fav?' fav':''}" data-a="slot" data-t="${t}" data-i="${i}" aria-label="${q?DDM_ROLE[q.role]:'Open slot'}">${q?DDM_ICON[q.role]:'+'}</button>`).join('')}</div></div>`;
  let h=`<div class="ddm-bar top"><div class="ddm-hd"><div class="ddm-t">BARRACKS</div><div class="ddm-t gold">★ ${R.medals}</div></div><div class="ddm-sqs">${sq('A')}${sq('B')}</div></div>`;
  if(ddm.sub==='pick'){   // recruits and the reserve, for the slot chosen
    const c=ddm.cand,tab=ddm.tab||'rec',L=tab==='rec'?R.recruits:R.reserve;
    h+=`<div class="ddm-pick ${right?'l':'r'}"><div class="ddm-tabs"><button type="button" data-a="tab" data-v="rec" class="${tab==='rec'?'on':''}">RECRUITS · LV ${R.minLevel}</button><button type="button" data-a="tab" data-v="res" class="${tab==='res'?'on':''}">RESERVE ${R.reserve.length}/${DDM_RES}</button></div>
      <div class="ddm-pool ${tab}">${L.length?L.map((q,i)=>`<button type="button" data-a="cand" data-i="${i}" class="${c===q?'on':''}${ddmStar(q)?' star':''}${q.hurt?' hurt':''}">${DDM_ICON[q.role]}<small>${tab==='res'?'Lv '+q.level:q.cost?'★'+q.cost:'free'}</small></button>`).join(''):'<div class="ddm-dim">Nobody in the reserve.</div>'}</div></div>`;
    if(c)h+=ddmStats(c,right?'r':'l').replace('<div class="ddm-dim">',`<div class="ddm-t">${ddmEsc(c.name)}</div><div class="ddm-dim">`);   // (his name in the panel: it would sit over his head, under the panel)
    const cost=c&&tab==='rec'?c.cost:0,full=m&&tab==='rec'&&R.reserve.length>=DDM_RES;
    h+=`<div class="ddm-bar bot">${c?`<div class="ddm-dim">${tab==='rec'?(cost?`Costs ★ ${cost}. You have ★ ${R.medals}.`:'Free.'):'From the reserve, with his level and kit.'}${m?(full?` ${ddmEsc(m.name)} is dismissed: the reserve is full.`:` ${ddmEsc(m.name)} goes to the reserve.`):''}</div>`:'<div class="ddm-dim">Pick one to look at him.</div>'}
      <div class="ddm-row"><button type="button" class="ddm-btn grey" data-a="back">‹ BACK</button><button type="button" class="ddm-btn" data-a="take"${!c||cost>R.medals||(tab==='res'&&c.hurt)?' disabled':''}>${tab==='rec'?'RECRUIT':'TO THE SQUAD'}</button></div></div>`;
  }else if(m){
    // (Version 216, Bryan: "a thumb swipe feature to switch through each unit... Make sure the equipment options are bigger, maybe have a +1 for equipment that have extra items available"; "a favorite star to the top right")
    const L8=ddmMen8(),at=L8.findIndex(q=>q[0]===S[0]&&q[1]===S[1]),sw=ddm.swap;
    h+=`<div class="ddm-name" data-follow="head"><b>${m.fav?'<u class="ddm-fv">★</u>':''}${ddmEsc(m.name)}</b>${DDM_ROLE[m.role].toUpperCase()}</div>`+ddmStats(m,right?'l':'r low');
    h+=`<button type="button" class="ddm-fav${m.fav?' on':''}" data-a="fav" aria-label="Favourite">${m.fav?'★':'☆'}<small>${m.fav?'FAVOURITE':'FAVOURITE?'}</small></button>`;
    if(L8.length>1&&!sw)h+=`<button type="button" class="ddm-arr l" data-a="man" data-d="-1" aria-label="The man before">‹</button><button type="button" class="ddm-arr r" data-a="man" data-d="1" aria-label="The next man">›</button>`;
    h+=`<div class="ddm-bar bot man">`;
    if(sw){const Lk=ddmSwapList(m,sw),I=DDM_ITEMS[m.gear[sw]],n=Lk.filter(o=>!o.store).length;
      h+=`<div class="ddm-gl gold">${DDM_SLOT[sw].toUpperCase()} · ${n?n+' MORE HE CAN CARRY':'NOTHING ELSE YET'}</div><div class="ddm-opts"><div class="ddm-opt cur"><i>${ddmKitIcon(sw,I)}</i><div><b>${I.star?'★ ':''}${I.n}</b><small>on him now</small></div><em>✓ CARRIED</em></div>
        ${Lk.map((o,i)=>`<button type="button" class="ddm-opt${o.star?' gold':''}" data-a="swap" data-i="${i}"><i>${o.store?'':ddmKitIcon(sw,DDM_ITEMS[o.id])}</i><div><b>${o.star?'★ ':''}${o.n}</b><small>${o.from}</small></div><em>${o.verb.toUpperCase()}</em></button>`).join('')}</div>
        <button type="button" class="ddm-btn grey" data-a="kit" data-k="${sw}">‹ BACK</button>`;
    }else{
      h+=`<div class="ddm-dots">${L8.map((q,k)=>`<i class="${k===at?'on':''}${ddRoster.squads[q[0]][q[1]].fav?' fv':''}" style="--tc:${q[0]==='A'?'#58c4f6':'#f0b429'}"></i>`).join('')}<span>${L8.length>1?'◂ SWIPE FOR THE NEXT MAN ▸':''}</span></div>
        <div class="ddm-gl gold">HIS EQUIPMENT · TAP ONE TO CHANGE IT</div>
        <div class="ddm-kit">${['w','g','t'].map(k=>{const I=DDM_ITEMS[m.gear[k]],n=ddmSwapList(m,k).filter(o=>!o.store).length;return`<button type="button" data-a="kit" data-k="${k}" class="${I.star?'star':''}"><i>${DDM_SLOT[k].toUpperCase()}</i>${ddmKitIcon(k,I)}<b>${I.star?'★ ':''}${I.n}</b>${n?`<u>+${n}</u>`:''}</button>`;}).join('')}</div>
        <div class="ddm-row"><button type="button" class="ddm-btn grey two" data-a="wide">‹ SQUADS<small>all eight</small></button><button type="button" class="ddm-btn grey two" data-a="reserve"${R.reserve.length>=DDM_RES?' disabled':''}>RESERVE<small>rest him</small></button><button type="button" class="ddm-btn grey two" data-a="replace">REPLACE<small>a recruit for his bunk</small></button></div>`;}
    h+=`</div>`;
  }else h+=`<div class="ddm-bar bot"><div class="ddm-dim">Alpha's bunks on the left, Bravo's on the right. Tap a man or his square; a + is an empty bunk.</div><button type="button" class="ddm-btn${(R.stage||0)===1||(R.stage||0)===2?'':' grey'}" data-a="out">‹ BACK TO THE BASE</button></div>`;
  return h;
}
// what he could carry in that slot instead: standard issue, a special piece a squad mate or a reserve man of his kind holds (a swap), or
// what was put by in the armory; and putting his own special piece by
function ddmSwapList(m,k){
  const R=ddRoster,L=[],cur=m.gear[k];
  for(const id of new Set([ddmStd(m.role,k),...(k==='t'?['smoke']:k==='g'?['frag']:[])]))if(id!==cur)L.push({id,n:DDM_ITEMS[id].n,from:'standard issue',verb:'take',std:1});
  const where=q=>R.reserve.includes(q)?'reserve':'squad mate';
  for(const q of ddmAll())if(q!==m&&!DDM_ITEMS[q.gear[k]].std&&ddmCan(m,q.gear[k]))L.push({id:q.gear[k],n:DDM_ITEMS[q.gear[k]].n,from:`${where(q)}, ${q.name}`,verb:'swap',man:q,star:DDM_ITEMS[q.gear[k]].star});
  R.armory.forEach((id,i)=>{if(DDM_ITEMS[id].s===k&&ddmCan(m,id))L.push({id,n:DDM_ITEMS[id].n,from:'armory',verb:'take',arm:i,star:DDM_ITEMS[id].star});});
  if(!DDM_ITEMS[cur].std)L.push({n:`Put his ${DDM_ITEMS[cur].n} in the armory`,from:'saved for later',verb:'store',store:1});
  return L;
}
function ddmSwapDo(m,k,o){
  const R=ddRoster,cur=m.gear[k],keep=id=>{if(!DDM_ITEMS[id].std)R.armory.push(id);};
  if(o.store){R.armory.push(cur);m.gear[k]=ddmStd(m.role,k);}
  else if(o.man){m.gear[k]=o.id;if(ddmCan(o.man,cur))o.man.gear[k]=cur;else{o.man.gear[k]=ddmStd(o.man.role,k);keep(cur);}}
  else if(o.arm!=null){R.armory.splice(o.arm,1);keep(cur);m.gear[k]=o.id;}
  else{keep(cur);m.gear[k]=o.id;}
}
function ddmBarracksClick(a,b){
  const R=ddRoster,S=ddm.slot,m=ddmSel();
  if(a==='slot'){const t=b.dataset.t,i=+b.dataset.i;ddm.slot=[t,i];ddm.swap=null;ddm.cand=null;ddm.sub=R.squads[t][i]?null:'pick';ddm.tab='rec';ddm.cam.k=0;ddmRoomMen();}
  else if(a==='man'&&S){const L=ddmMen8(),k=L.findIndex(q=>q[0]===S[0]&&q[1]===S[1]),q=L[(k+(+b.dataset.d)+L.length)%L.length];if(q){ddm.slot=q;ddm.swap=null;ddm.cam.k=0;ddmRoomMen();}}
  else if(a==='fav'&&m){m.fav=!m.fav;ddmSave();}
  else if(a==='wide'){ddm.slot=null;ddm.sub=null;ddm.swap=null;ddm.cam.k=0;ddmRoomMen();}
  else if(a==='back'){ddm.sub=null;ddm.cand=null;if(!m)ddm.slot=null;ddm.cam.k=0;ddmRoomMen();}
  else if(a==='kit')ddm.swap=ddm.swap===b.dataset.k?null:b.dataset.k;
  else if(a==='swap'&&m){const o=ddmSwapList(m,ddm.swap)[+b.dataset.i];if(o){ddmSwapDo(m,ddm.swap,o);ddm.swap=null;ddmRoomMen();}}
  else if(a==='reserve'&&m&&R.reserve.length<DDM_RES){R.reserve.push(m);R.squads[S[0]][S[1]]=null;ddm.sub='pick';ddm.tab='rec';ddm.cand=null;ddmRoomMen();}
  else if(a==='replace'){ddm.sub='pick';ddm.tab='rec';ddm.cand=null;ddm.swap=null;}
  else if(a==='tab'){ddm.tab=b.dataset.v;ddm.cand=null;ddmRoomMen();}
  else if(a==='cand'){ddm.cand=(ddm.tab==='res'?R.reserve:R.recruits)[+b.dataset.i]||null;ddmRoomMen();}
  else if(a==='take'&&ddm.cand&&S){const c=ddm.cand,rec=ddm.tab!=='res';if(rec&&c.cost>R.medals)return;
    if(rec){R.medals-=c.cost;c.cost=0;const i=R.recruits.indexOf(c);R.recruits[i]=ddmNewMan(c.role,R.minLevel,Math.random()<.25);}else R.reserve.splice(R.reserve.indexOf(c),1);
    if(m){if(R.reserve.length<DDM_RES)R.reserve.push(m);else for(const k of['w','g','t'])if(!DDM_ITEMS[m.gear[k]].std)R.armory.push(m.gear[k]);}   // (a dismissed man's special kit is kept)
    R.squads[S[0]][S[1]]=c;ddm.cand=null;ddm.sub=null;ddmRoomMen();}
}

/* ---------- the barracks: the room ---------- */
const DDM_BY=[-58,-26,6,38],DDM_HW=54;
function ddmTex(w,h,fn,rx,ry){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx||1,ry||1);t.encoding=T.sRGBEncoding;return t;}
function ddmPlanks(base,dark){return(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<8;i++){const p=i*w/8;g.fillStyle=`rgba(0,0,0,${.04+((i*37)%10)/90})`;g.fillRect(p,0,w/8,h);g.fillStyle=dark;g.fillRect(p,0,2,h);
  for(let k=0;k<5;k++){g.fillStyle='rgba(0,0,0,.08)';g.fillRect(p+4+((i*13+k*7)%20),(i*53+k*41)%h,1,30+((i+k)*17)%60);}}};}
function ddmGun(kind){   // the gun on the bunk: a rifle, the BAR on its bipod, the scoped rifle (and a fatter barrel cluster for the minigun)
  const g=new T.Group(),p=(a,b,c,w,t,d,col,o)=>{const m=new T.Mesh(new T.BoxGeometry(w,t,d),new T.MeshStandardMaterial(Object.assign({color:col,roughness:.6},o||{})));m.position.set(a,b,c);m.castShadow=true;g.add(m);};
  const steel={metalness:.55,roughness:.45};
  p(0,.5,0,7,.9,.9,0x222428,steel);p(6.2,.6,0,kind==='spring'||kind==='fifty'?8:6,.45,.45,0x1c1d20,steel);p(-5.6,.3,0,5,1.5,.8,0x6b4526);p(-8,.1,0,1.2,2,.9,0x5a3a20);p(-1.6,-.3,0,.7,1.4,.6,0x5a3a20);p(4.2,.5,0,3.4,1,.9,0x6b4526);
  if(kind==='bar'||kind==='longbar'||kind==='minigun'){p(.8,-.5,0,.9,2.2,.6,0x18191b);p(8,.1,.9,.25,.25,2.4,0x1c1d20);p(8,.1,-.9,.25,.25,2.4,0x1c1d20);}
  if(kind==='minigun'){for(const[y,z]of[[.95,.3],[.95,-.3],[.3,.5],[.3,-.5]])p(6.5,y,z,7,.35,.35,0x2a2c30,steel);p(2.2,.7,0,1.6,1.7,1.7,0x2a2c30,steel);}
  if(kind==='spring'||kind==='fifty'){p(.5,1.5,0,5,.7,.7,0x18191b,steel);p(-1.6,1.1,0,.3,.6,.3,0x18191b);p(2.2,1.1,0,.3,.6,.3,0x18191b);}
  if(kind==='fifty')p(11,.6,0,1.6,.9,.9,0x18191b,steel);
  return g;
}
function ddmRoomBuild(){
  const sc=new T.Scene();sc.background=new T.Color(0x0b0906);const grp=new T.Group();sc.add(grp);
  const M=(c,o)=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:0},o||{}));
  const box=(x,h,y,w,t,d,c,o)=>{const m=new T.Mesh(new T.BoxGeometry(w,t,d),c&&c.isMaterial?c:M(c,o));m.position.set(x,h+t/2,y);m.castShadow=m.receiveShadow=true;grp.add(m);return m;};
  const cyl=(x,h,y,r,t,c,o)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,t,14),M(c,o));m.position.set(x,h+t/2,y);m.castShadow=true;grp.add(m);return m;};
  const HW=DDM_HW,wall=ddmTex(256,256,ddmPlanks('#7a5a3c','#3d2a1a'),6,1),wall2=ddmTex(256,256,ddmPlanks('#7a5a3c','#3d2a1a'),3,1),floor=ddmTex(256,256,ddmPlanks('#5a4530','#2a2018'),5,10);
  box(0,-1.6,20,HW*2+8,1.6,300,M(0xffffff,{map:floor,roughness:.7}));
  box(0,0,-90,HW*2,64,3,M(0xffffff,{map:wall2}));box(-HW-1.5,0,20,3,64,300,M(0xffffff,{map:wall}));box(HW+1.5,0,20,3,64,300,M(0xffffff,{map:wall}));
  box(0,64,20,HW*2+8,2,310,0x3a2a1c);for(let y=-80;y<=150;y+=46)box(0,58,y,HW*2,6,3,0x4a3523);
  box(0,0,-88,18,34,.8,0x3d2f22);box(6,15,-87.4,1.2,1.2,.6,0xb8a04a,{metalness:.6});
  box(-30,30,-88.2,22,13,.3,0x7a2b24);box(-30,35.5,-88,22,2,.35,0xe8e2d0);box(-30,30.5,-88,22,2,.35,0xe8e2d0);                       // a flag
  box(32,26,-88.2,18,14,.4,0x9c8a62);for(let i=0;i<5;i++)box(26+i*3,28+(i%2)*4,-87.9,2.4,3.2,.1,0xe9e4d2);                            // the notice board
  cyl(0,0,-70,4.2,9,0x1c1c1e,{roughness:.5,metalness:.5});cyl(0,9,-70,3.2,3,0x242426,{metalness:.5});cyl(0,12,-70,1.1,52,0x242426,{metalness:.5});   // the stove
  box(0,3,-65.7,3,2.4,.3,M(0xff8a3c,{emissive:0xff6a1c,emissiveIntensity:1.6})).castShadow=false;
  const fr=0x30342c,mat=0xb5ad92,bl=0x4f5d3c,guns={};
  for(const s of[-1,1])DDM_BY.forEach((by,i)=>{const bx=s*47;
    box(s*(HW-.2),34,by,.5,11,12,M(0x8fb2c8,{emissive:0x6f93ad,emissiveIntensity:.5})).castShadow=false;                               // a window over each bunk
    for(const dx of[-5.5,5.5])for(const dy of[-11,11])box(bx+dx,0,by+dy,1.1,24,1.1,fr,{metalness:.4});
    for(const h of[5,16]){box(bx,h,by,11,1,23,fr);box(bx,h+1,by,10.2,2.2,21.6,mat);box(bx,h+3.2,by-8,8,1.6,5,0xe6e0cc);box(bx,h+3.2,by+2,10.4,.6,13,bl);box(bx,h+3.3,by+9.4,9,.9,2,0x5f6e49);}
    const tx=bx-s*1,ty=by+17;box(tx,0,ty,11,5,7,0x46532f);box(tx,5,ty,11.5,.7,7.5,0x38432a);box(tx-s*5.9,1.5,ty,.3,1.6,2,0xb8a04a,{metalness:.6});   // his trunk
    const hm=new T.Mesh(new T.SphereGeometry(2.4,14,10,0,Math.PI*2,0,Math.PI/2),M(0x4a5a3a));hm.position.set(bx-s*5.5,24,by-11);hm.castShadow=true;grp.add(hm);
    const gh=new T.Group();gh.position.set(bx-s*1.5,9.8,by-1);gh.rotation.set(.12,Math.PI/2+(s<0?0:Math.PI),0);grp.add(gh);guns[(s<0?'A':'B')+i]=gh;});
  // hanging lamps down the aisle: warm pools, and one key light with a shadow on whoever is being looked at
  const lights=[];for(const y of[-45,15,75]){cyl(0,48,y,.25,10,0x1c1c1c);const sd=new T.Mesh(new T.ConeGeometry(5,3.4,16,1,true),M(0x24352a,{side:T.DoubleSide,metalness:.3}));sd.position.set(0,47,y);grp.add(sd);
    const bb=new T.Mesh(new T.SphereGeometry(1.2,10,8),M(0xfff0c0,{emissive:0xffd890,emissiveIntensity:2.5}));bb.position.set(0,45.6,y);grp.add(bb);
    const L=new T.SpotLight(0xffc98a,1.7,170,1.05,.6,1.2);L.position.set(0,45,y);L.target.position.set(0,0,y);grp.add(L,L.target);lights.push(L);}
  grp.add(new T.HemisphereLight(0x8fa3b8,0x3a2c1e,.42));const st=new T.PointLight(0xff7a30,.8,70);st.position.set(0,5,-62);grp.add(st);
  const key=new T.SpotLight(0xfff1d6,1.5,190,.6,.5,1);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.002;key.shadow.camera.near=6;key.shadow.camera.far=190;grp.add(key,key.target);
  ddm.room={scene:sc,grp,guns,key,cam:new T.PerspectiveCamera(50,1,1,900),men:[],pos:new T.Vector3(0,34,128),look:new T.Vector3(0,9,-10),fov:64,v:new T.Vector3()};
}
function ddmRoomDispose(){const r=ddm.room;if(!r)return;for(const u of r.men)if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);r.scene.traverse(o=>{if(o.geometry&&o.geometry.dispose&&!o.isSkinnedMesh)o.geometry.dispose();const m=o.material;if(m&&!o.isSkinnedMesh){if(m.map)m.map.dispose();m.dispose();}});ddm.room=null;}
// who stands at which bunk: the squads' men, and the man being looked at for an empty or a replaced slot (a recruit, or one from the reserve)
function ddmRoomMen(){
  const r=ddm.room;if(!r)return;const R=ddRoster,S=ddm.slot,want={};
  for(const t of['A','B'])R.squads[t].forEach((m,i)=>{if(m)want[t+i]=m;});
  if(S&&ddm.sub==='pick'&&ddm.cand)want[S[0]+S[1]]=ddm.cand;else if(S&&ddm.sub==='pick'&&!ddmSel())delete want[S[0]+S[1]];
  for(const u of r.men.slice())if(want[u.slotK]!==u.rm||!!u.downed!==!!(want[u.slotK]&&want[u.slotK].hurt)){if(u.m.g.parent)u.m.g.parent.remove(u.m.g);r.men.splice(r.men.indexOf(u),1);}
  for(const k in want)if(!r.men.some(u=>u.slotK===k)){const t=k[0],i=+k[1],s=t==='A'?-1:1,m=want[k],tw=[.2,-.1,.3,-.22][i];
    const u={side:'P',team:t,id:t+(i+1),name:m.name,x:s*31,y:DDM_BY[i]+9,ang:(s<0?.45:Math.PI-.45)+tw*s,path:[],hp:100,level:m.level,weapon:DDM_ITEMS[m.gear.w].weapon,spec:null,specN:0,lx:0,ly:0,atEase:true,cloth:DD_US,ddRole:m.role,slotK:k,rm:m,stats:{}};
    if(m.hurt)Object.assign(u,{atEase:false,downed:true,x:s*47,y:DDM_BY[i]+1,ang:Math.PI/2,hp:35});   // (wounded: laid up in his top bunk, Version 165)
    makeSoldier(u);moveMesh(u,r.grp);ddDayFig(u);u.m.g.position.set(u.x,m.hurt?19.6:0,u.y);u.m.g.rotation.y=-u.ang;u.m.g.traverse(o=>{o.frustumCulled=false;});
    if(u.m.spot)u.m.spot.intensity=0;if(u.m.beam)u.m.beam.visible=false;if(u.m.ring)u.m.ring.visible=false;r.men.push(u);}
  for(const k in r.guns){const h=r.guns[k],m=want[k],id=m?m.gear.w:'';if(h.userData.id!==id){while(h.children.length)h.remove(h.children[0]);if(m)h.add(ddmGun(id));h.userData.id=id;}}
}
function ddmRoomFrame(rdt){
  const r=ddm.room;if(!r)return;const S=ddm.slot,tall=cw<ch*1.05,c=r.cam;
  // the view: down the aisle, or square on to the chosen man's bunk (he stands to one side of it, his gun in full view on it)
  let P,L,fov;if(S){const s=S[0]==='A'?-1:1,by=DDM_BY[S[1]]+2;P=[-s*(tall?46:48),tall?23:21,by];L=[s*46,tall?12:9,by];fov=tall?48:36;}else{P=[0,tall?34:30,tall?128:150];L=[0,9,-10];fov=tall?64:36;}
  const C=ddm.cam;C.k=Math.min(1,C.k+rdt/.7);const e=1-Math.pow(1-Math.min(1,rdt*7),1);
  if(C.k>=1&&!C.set){r.pos.set(...P);r.look.set(...L);r.fov=fov;C.set=1;}else{C.set=0;const q=Math.min(1,rdt*6);r.pos.lerp(r.v.set(...P),q);r.look.lerp(r.v.set(...L),q);r.fov+=(fov-r.fov)*q;if(C.k>=1)C.set=1;}
  c.aspect=cw/ch;c.fov=r.fov;c.position.copy(r.pos);c.lookAt(r.look);c.updateProjectionMatrix();c.updateMatrixWorld();
  const tu=S&&r.men.find(u=>u.slotK===S[0]+S[1]);
  if(tu){const s=S[0]==='A'?-1:1;r.key.position.set(tu.x-s*34,50,tu.y+26);r.key.target.position.set(tu.x+s*4,8,tu.y-4);r.key.intensity=1.9;}else{r.key.position.set(0,56,110);r.key.target.position.set(0,0,0);r.key.intensity=1.1;}
  for(const u of r.men){u.m.g.visible=!S||u.slotK[0]===S[0];figRefresh(u);figAnimate(u,u.m);}   // (square on to one wall, the men across the aisle would stand in the way)
  postRender(r.scene,c);ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);
}
function ddmRoomPlace(el){
  const r=ddm.room,S=ddm.slot;if(!S)return;const u=r.men.find(q=>q.slotK===S[0]+S[1]),c=r.cam;const tall=cw<ch*1.05;
  const P=(x,h,z)=>{r.v.set(x,h,z).project(c);return[(r.v.x+1)*cw/2,(1-r.v.y)*ch/2];};
  const x=u?u.x:(S[0]==='A'?-31:31),z=u?u.y:DDM_BY[S[1]]+9,hd=P(x,31,z),ft=P(x,0,z);
  for(const n of el.querySelectorAll('[data-follow]')){const f=n.dataset.follow;
    if(f==='head'){n.style.left=clamp(hd[0],60,cw-60)+'px';n.style.top=clamp(hd[1],110,ch-200)+'px';}
    else if(f==='feet')n.style.top=clamp(ft[1]+10,ch*.45,ch-(tall?150:106))+'px';
    else if(tall)n.style.top=clamp(ft[1]+62,ch*.45+52,ch-98)+'px';}   // (a wide screen: the choices beside him, css)
}

/* ---------- Version 192: the report as a roll call, and a way through what follows ----------
   Bryan, after Version 191: "the post battle menu looked pretty bad. No sounds with the exp bar rising. I did not feel any special things for the individual
   players. I entered the next level too quickly. The post battle menu had no direction, was confusing, and ugly."
   The report now goes: VICTORY and the battle's numbers; then each man in turn, the camera on him, his own commendation from what he did (ddmCite), his
   kills, revives and times down, his XP bar filling from where it was with its ticks (audio.js's sfxXpFill), a level up with its chime (sfxLevelUp) and
   what it gave him, the MVP's medal, a wound; a tap goes on (a tap while it fills finishes it first), SKIP goes to the summary; then the summary with
   everyone, the fallen, and one button on to the base. The base says where you are (ddmStepsHTML) and what the next mission is (ddmNextHTML); it starts
   only from NEXT MISSION and its briefing's START (ddmBriefHTML); leaving the barracks is back to the base. */
const DDM_NEXT={1:['Chapter 2 · Hold the base','They counterattack from inland with infantry and tanks. Man the machine guns and the field guns, and hold through three waves.'],
  2:['Chapter 3 · Take the village','Out of the base and inland: through the woods and across the field to the village, then hold it against what they send.']};
// each man's commendation, from his battle: the first that fits; the "most" ones go to one man each
function ddmCite(rows){
  const top=k=>{let b=null;for(const r of rows)if(r[k]>0&&(!b||r[k]>b[k]))b=r;return b;},mk=top('kills'),mr=top('rev'),mi=top('items'),ms=top('best');
  for(const r of rows){const k=r.kills,pl=(n,w)=>n+' '+(n===1?w:w==='man'?'men':w+'s');
    r.cite=r.mvp?['MOST VALUABLE',k?`${pl(k,'kill')}${r.rev?' and '+pl(r.rev,'man')+' brought back':''}: the company's best today`:'The one the others followed']
      :r===mr&&r.rev>0?['LIFESAVER',`Brought ${pl(r.rev,'man')} back under fire`]
      :r===mk&&k>=2?['DEADEYE',`${pl(k,'kill')}, the most in the squads`]
      :r===ms&&r.best>=3?['ON A ROLL',`${r.best} kills one after another`]
      :r===mi&&r.items>=2?['GRENADIER',`${pl(r.items,'grenade')} and tools put to work`]
      :r.hurt?['WOUNDED IN ACTION','Still down when it ended, and still with us']
      :r.downs>0?['HARD TO KILL',`Went down ${r.downs===1?'once':r.downs+' times'} and got back up`]
      :k>0?['HELD THE LINE',`${pl(k,'kill')}, and never went down`]
      :r.rm.role==='medic'?['STEADY HANDS','Kept the squad on its feet']
      :['DID HIS PART','Came through it with the rest'];}
}
const ddmStepsHTML=n=>`<div class="ddm-steps">${['REPORT','NEXT MISSION'].map((t,i)=>`<span class="${i+1<n?'ok':i+1===n?'on':''}">${i+1<n?'✓':i+1} ${t}</span>`).join('<i>›</i>')}</div>`;
// the one thing to do next at the base: perks left to choose, the wounded, a look at the barracks, then the briefing
function ddmTodo(){
  const R=ddRoster,w=ddmHurt().length,p=ddmPerksDue(),N=DDM_NEXT[R.stage||1]||DDM_NEXT[1];
  if(p)return{k:'report',t:`${p} perk${p>1?'s':''} still to choose`,d:'Tap a marked man.'};
  if(w&&((R.treat||0)>0||R.medals>0))return{k:'hospital',t:'The field hospital',d:`${w} wounded · treat ${ddmTreatCost()==='FREE'?'one free':'★ 1 each'}`};
  if(!ddm.vis.bk)return{k:'barracks',t:'The barracks',d:`Kit · ${R.recruits.length} recruits · optional`};
  if((R.stage||0)>=3)return{k:'',t:'All done here',d:'The next chapter is still to come.'};
  return{k:'go',t:N[0],d:`${ddmFit().length} of 8 ready`};
}
function ddmNextHTML(nx){
  return`<div class="ddm-next ${nx.k}"><div><div class="ddm-gl gold">NEXT</div><b>${nx.t}</b><span>${nx.d}</span></div>${nx.k?`<button type="button" class="ddm-btn sm" data-a="${nx.k}">GO ▸</button>`:''}</div>`;
}
function ddmBriefHTML(){
  const R=ddRoster,N=DDM_NEXT[R.stage||1]||DDM_NEXT[1],sq=t=>R.squads[t].map(m=>m?`<span class="${m.hurt?'hurt':''}">${ddmEsc(m.name)}${m.hurt?' ✚':''}</span>`:'<span class="none">empty</span>').join('');
  const w=[...R.squads.A,...R.squads.B].filter(m=>m&&m.hurt);
  return`<div class="ddm-sheet mid ddm-brief"><div class="ddm-gl gold">NEXT MISSION</div><div class="ddm-t">${N[0]}</div><div class="ddm-dim" style="margin:5px 0 8px">${N[1]}</div>
    <div class="ddm-gl" style="color:#58c4f6">ALPHA</div><div class="ddm-who">${sq('A')}</div><div class="ddm-gl" style="color:#f0b429">BRAVO</div><div class="ddm-who">${sq('B')}</div>
    ${w.length?`<div class="ddm-wd">✚ ${w.map(m=>ddmEsc(m.name)).join(' and ')} ${w.length>1?'are':'is'} wounded and will sit this one out. Treat ${w.length>1?'them':'him'} at the field hospital first, or go ${w.length>1?'men':'a man'} short.</div>`:''}
    <div class="ddm-row"><button type="button" class="ddm-btn grey" data-a="gox">NOT YET</button><button type="button" class="ddm-btn go" data-a="start">START MISSION ▸</button></div></div>`;
}
// Version 240 (a draft, opened only by the start card's "new report" shortcut: ddmV2): the whole report on one page. Bryan: "After the stat menu
// - it is WAY too confusing. We should just show post battle stats info with a continue button. Maybe have the exp bar go up for everyone on this
// page that wasn't rewarded a perk. We should also require the player to pick a perk to continue the exp bar for each player that was rewarded a
// perk instead of adding a next button (the less buttons the better)". No VICTORY card to tap, no medal screen (it goes to the one who did most),
// no card a man: every bar fills where it is (r.v: the level and XP shown, and what's still to come); at a level his row opens with his job's
// two perks and his bar waits there until one is picked; CONTINUE once every bar is in. A row tapped is still that man's page, once it's done
let ddmV2=false;
const ddmFxTxt=(m,k,t)=>/^gren/.test(k)&&(DDM_ITEMS[m.gear.g]||{}).gl?t.replace('grenade','rifle grenade'):t;   // (the Rifleman's are rifle grenades: Bryan asked which)
function ddmV2Init(){
  ddm.v2=true;if(ddm.noms.length&&!ddm.mvp)ddmAward(0);ddm.scr=null;ddm.step=ddm.rows.length;ddm.v2T=0;ddm.v2Done=false;
  ddm.rows.forEach((r,k)=>{r.v={lv:r.lv0,xp:r.xp0,left:r.gain,wait:false,at:.9+k*.14};r.pkd=r.pkd||[];});
}
function ddmV2Tick(rdt){
  if(!ddm||!ddm.v2||ddm.ph!=='report'||ddm.v2Done)return;ddm.v2T+=rdt;let moving=false,dirty=false;
  if(!ddm.fan){ddm.fan=1;if(typeof sfxLevelUp==='function')sfxLevelUp(true);}
  ddm.rows.forEach((r,k)=>{const v=r.v;if(!v||v.wait||ddm.v2T<v.at)return;
    if(v.left<=0){if(r.rm.pk>0){v.wait=true;dirty=true;}return;}   // (a perk still owed from before: asked for once his bar is in)
    const need=ddmNeed(v.lv),add=Math.min(v.left,need-v.xp,Math.max(150,need*.85)*rdt);v.xp+=add;v.left-=add;moving=true;
    if(v.xp>=need-.01){v.xp=0;v.lv++;v.wait=true;dirty=true;if(typeof sfxLevelUp==='function')sfxLevelUp(false);}
    const g=id=>document.getElementById(id+k),b=g('ddmX'),n=g('ddmN'),l=g('ddmL');if(b)b.style.width=Math.round(v.xp/ddmNeed(v.lv)*100)+'%';if(n)n.textContent='+'+Math.round(r.gain-v.left);if(l)l.textContent=v.lv;});
  if(moving&&!ddm.v2Snd){ddm.v2Snd=1;if(typeof sfxXpFill==='function')sfxXpFill(1,1.2);}
  if(ddm.v2T>1&&ddm.rows.every(r=>r.v&&r.v.left<=0&&!r.v.wait&&!(r.rm.pk>0))){ddm.v2Done=true;dirty=true;}
  if(dirty){ddmSave();ddmUI();const p=document.querySelector('#ddm .ddm-r2.pick');if(p&&p.scrollIntoView)p.scrollIntoView({block:'nearest'});}
}
function ddmReport2HTML(){
  const R=ddRoster,rows=ddm.rows,done=ddm.v2Done,due=rows.filter(r=>r.v&&r.v.wait).length,mv=rows.find(r=>r.mvp),cur=rows.findIndex(r=>r.v&&r.v.wait),owed=rows.reduce((n,r)=>n+(r.rm.pk||0),0);   // (cur: the one whose perks are open; the others owed one wait their turn, so there are never more than two buttons to choose between)
  if(ddm.man!=null&&rows[ddm.man])return ddmManHTML();
  const row=(r,k)=>{const m=r.rm,v=r.v,un=ddmUnl(m).filter(q=>q[0]<=v.lv&&q[0]>r.lv0),pk=(r.pkd||[]).map(x=>(ddmJob(m).find(q=>q[0]===x)||[0,x])[1]);
    const open=v.wait&&k===cur;
    return`<div class="ddm-r2${open?' pick':''}" style="--tc:${teamCol(r.u)}"><button type="button" class="ddm-sr${r.mvp?' mvp':''}" data-a="manv" data-i="${k}"><i>${DDM_ICON[m.role]||''}</i><div class="nm"><b>${ddmEsc(m.name)}${r.mvp?'<q class="g">MEDAL</q>':''}</b><span>${r.team==='A'?'ALPHA':'BRAVO'} · ${DDM_ROLE[m.role].toUpperCase()}</span></div><em class="${v.lv>r.lv0?'up':''}" id="ddmL${k}">${v.lv}</em><em>${r.kills}</em><em>${r.rev}</em><em>${r.downs}</em><em>${r.items}</em><div class="x"><span id="ddmN${k}">+${Math.round(r.gain-v.left)}</span><div class="ddm-xpb"><em id="ddmX${k}" style="width:${Math.round(v.xp/ddmNeed(v.lv)*100)}%"></em></div></div></button>
      ${open?`<div class="ddm-pk2"><b>▲ LEVEL ${v.lv} · PICK A PERK</b><div class="ddm-row">${ddmJob(m).map(q=>`<button type="button" class="ddm-pkb" data-a="perk2" data-i="${k}" data-k="${q[0]}"><b>${q[1]}${ddmPerkN(m,q[0])?' ×'+(ddmPerkN(m,q[0])+1):''}</b><span>${ddmFxTxt(m,q[0],q[2])}</span></button>`).join('')}</div></div>`:''}
      ${pk.length||un.length||(v.wait&&!open)?`<div class="ddm-tg">${pk.map(t=>`<span>✓ ${t}</span>`).join('')}${un.map(q=>`<span class="u">★ ${q[2]}</span>`).join('')}${v.wait&&!open?'<span class="w">▲ PERK NEXT</span>':''}</div>`:''}</div>`;};
  return`<div class="ddm-full v2"><div class="ddm-hd"><div><div class="ddm-vt sm">VICTORY</div><div class="ddm-dim">${ddm.chap}</div></div></div>
    <div class="ddm-tiles all">${[...ddm.tiles,...(ddm.more||[])].slice(0,4).map(([k,v])=>`<div><b>${v}</b><span>${k}</span></div>`).join('')}</div>
    ${mv?`<div class="ddm-mvl"><b>★ COMPANY'S MEDAL</b> · ${ddmEsc(mv.rm.name)}<span>+100 XP</span></div>`:''}
    <div class="ddm-srh"><span></span><span class="l"></span><span>LV</span><span>KILL</span><span>REV</span><span>DOWN</span><span>GREN</span><span class="r">XP</span></div>
    <div class="ddm-sum">${rows.map(row).join('')}${ddm.dead.length?`<div class="ddm-dead"><b>FALLEN · ★ ${R.medals} medal${R.medals===1?'':'s'}</b>${ddm.dead.map((d,j)=>`<div class="ddm-fl${d.back?' back':''}"><i>${DDM_ICON[d.rm?d.rm.role:d.role]||''}</i><span>${ddmEsc(d.name)}</span>${d.back?'<em>BACK WITH THE SQUAD</em>':d.rm?`<button type="button" class="ddm-btn sm" data-a="revive" data-i="${j}"${R.medals>0?'':' disabled'}>BRING BACK ★ 1</button>`:''}</div>`).join('')}</div>`:''}</div>
    <div class="ddm-fbot"><button type="button" class="ddm-btn" data-a="${DDM_NEXT[R.stage]?'go':'menu'}"${done?'':' disabled'}>${due?`PICK ${owed>1?owed+' PERKS':'A PERK'} ▲`:DDM_NEXT[R.stage]?'CONTINUE ▸':'BACK TO THE MENU ▸'}</button></div>${ddm.brief?ddmBriefHTML():''}</div>`;
}
function ddmReportHTML(){
  if(ddm.v2)return ddmReport2HTML();
  const n=ddm.rows.length,i=ddm.step,tiles=`<div class="ddm-tiles">${ddm.tiles.map(([k,v])=>`<div><b>${v}</b><span>${k}</span></div>`).join('')}</div>`;
  if(ddm.scr==='medal'){const k=ddm.nom||0,c=ddm.noms[k];
    return`<div class="ddm-aw"><div class="ddm-sheet"><div class="ddm-t gold">★ THE COMPANY'S MEDAL</div><div class="ddm-dim" style="margin:3px 0 9px">A star and +100 XP</div>
      ${ddm.noms.map((r,j)=>`<button type="button" class="ddm-nom${j===k?' on':''}" style="--tc:${teamCol(r.u)}" data-a="nom" data-i="${j}"><i>${DDM_ICON[r.rm.role]||''}</i><span><b>${ddmEsc(r.rm.name)} <small>${r.team==='A'?'Alpha':'Bravo'} · ${DDM_ROLE[r.rm.role]}</small></b><em>${ddmEsc(ddmNomWhy(r))}</em></span><u>${j===k?'★':'☆'}</u></button>`).join('')}
      <button type="button" class="ddm-btn" data-a="award">GIVE IT TO ${ddmEsc(c.rm.name).toUpperCase()} ▸</button></div></div>`;}
  if(ddm.man!=null&&i>=n&&ddm.rows[ddm.man])return ddmManHTML();
  if(i<0)return`<div class="ddm-vic" data-a="rolltap"><div class="ddm-vt">VICTORY</div><div class="ddm-vc">${ddm.chap}</div>${tiles}<div class="ddm-tap on">TAP TO CONTINUE ▸</div></div>`;
  if(i<n){const r=ddm.rows[i],m=r.rm,up=r.lv1>r.lv0,sn=!!r.seen,pk=m.pk>0?ddmPerkOpts(m):null;
    return`<div class="ddm-roll" data-a="rolltap"><div class="ddm-rtop"><div><div class="ddm-t gold">YOUR SQUAD</div><div class="ddm-dim">${i+1} of ${n}</div></div><button type="button" class="ddm-skip" data-a="rollskip">SEE ALL ▸▸</button></div>
      <div class="ddm-rc${r.mvp?' mvp':''}" style="--tc:${teamCol(r.u)}">${r.hurt?'<div class="ddm-stamp">WOUNDED</div>':''}
        <div class="ddm-rh"><i>${DDM_ICON[m.role]||''}</i><div class="nm"><b>${ddmEsc(m.name)}</b><span>${r.team==='A'?'ALPHA':'BRAVO'} · ${DDM_ROLE[m.role].toUpperCase()}</span></div><div class="ddm-lvl">LEVEL<u id="ddmLv">${sn?r.lv1:r.lv0}</u></div></div>
        <div class="ddm-cite"><b>${r.mvp?'★ ':''}${r.cite[0]}</b><span>${ddmEsc(r.cite[1])}</span></div>
        <div class="ddm-chips"><span>KILLS<b>${r.kills}</b></span><span>REVIVES<b>${r.rev}</b></span><span>TIMES DOWN<b>${r.downs}</b></span><span>GRENADES<b>${r.items}</b></span></div>
        <div class="ddm-xpr"><div class="ddm-xpb"><em id="ddmXp" style="width:${Math.round((sn?m.xp/ddmNeed(r.lv1):r.xp0/ddmNeed(r.lv0))*100)}%"></em></div><span id="ddmXpN">+${sn?r.gain:0} XP</span></div>
        <div class="ddm-up" id="ddmUp"${sn&&up?'':' hidden'}>▲ LEVEL UP${r.lv1-r.lv0>1?' ×'+(r.lv1-r.lv0):''} · +${2*(r.lv1-r.lv0)} Health · Aim · Speed · Nerve</div>
        ${pk?`<div class="ddm-pk" id="ddmPk"${sn?'':' hidden'}><div class="ddm-gl gold">CHOOSE A PERK${m.pk>1?' · '+m.pk+' TO CHOOSE':''}</div><div class="ddm-row">${ddmJob(m).map(q=>`<button type="button" class="ddm-pkb" data-a="perk" data-k="${q[0]}"><b>${q[1]}${ddmPerkN(m,q[0])?' ×'+(ddmPerkN(m,q[0])+1):''}</b><span>${ddmFxTxt(m,q[0],q[2])}</span></button>`).join('')}</div></div>`:''}
        ${(r.pkd||[]).length?`<div class="ddm-pkd">✓ ${r.pkd.map(k=>(ddmJob(m).find(q=>q[0]===k)||[0,k])[1]).join(' · ')}</div>`:''}
        ${ddmUnl(m).map(q=>q[0]<=r.lv1&&q[0]>r.lv0?`<div class="ddm-unl new" id="ddmUn"${sn?'':' hidden'}><b>★ UNLOCKED · ${q[2]}</b><span>${ddmFxTxt(m,q[1],q[3])}</span></div>`:'').join('')}${(q=>q?`<div class="ddm-unl"><b>LEVEL ${q[0]} · ${q[2]}</b><span>${ddmFxTxt(m,q[1],q[3])}</span></div>`:'')(ddmUnl(m).find(q=>q[0]>r.lv1))}
        ${r.mvp?'<div class="ddm-medal">★ The company\'s medal, from you</div>':''}
        <div class="ddm-dots">${ddm.rows.map((q,k)=>`<i class="${k===i?'on':q.seen?'ok':''}" data-a="card" data-i="${k}"></i>`).join('')}</div>
        <div class="ddm-row ddm-nav"><button type="button" class="ddm-btn grey" data-a="rollprev"${i?'':' disabled'}>◂</button><button type="button" class="ddm-btn" data-a="rollnext">${i<n-1?'NEXT MAN ▸':'DONE ▸'}</button></div>
      </div></div>`;}
  // (Version 216, Bryan: "the after battle menu should cover the entire screen and show as much information as it can": one dark sheet, every number, a row a man)
  const fv=m=>m.fav?'<u class="ddm-fv">★</u>':'';
  const row=(r,k)=>`<button type="button" class="ddm-sr${r.mvp?' mvp':''}" style="--tc:${teamCol(r.u)}" data-a="manv" data-i="${k}"><i>${DDM_ICON[r.rm.role]||''}</i><div class="nm"><b>${fv(r.rm)}${ddmEsc(r.rm.name)}${r.mvp?'<q class="g">MVP</q>':''}${r.hurt?'<q class="r">WOUNDED</q>':''}${r.rm.pk>0?'<q>PERK</q>':''}</b><span>${r.team==='A'?'ALPHA':'BRAVO'} · ${DDM_ROLE[r.rm.role].toUpperCase()} · ${r.cite[0]}</span></div><em class="${r.lv1>r.lv0?'up':''}">${r.lv1>r.lv0?'▲':''}${r.lv1}</em><em>${r.kills}</em><em>${r.rev}</em><em>${r.downs}</em><em>${r.items}</em><div class="x"><span>+${r.gain}</span><div class="ddm-xpb"><em style="width:${Math.round(r.rm.xp/ddmNeed(r.lv1)*100)}%"></em></div></div></button>`;
  const mv=ddm.rows.find(r=>r.mvp);
  return`<div class="ddm-full"><div class="ddm-hd"><div><div class="ddm-vt sm">VICTORY</div><div class="ddm-dim">${ddm.chap}</div></div>${ddmStepsHTML(1)}</div>
    <div class="ddm-tiles all">${[...ddm.tiles,...(ddm.more||[])].map(([k,v])=>`<div><b>${v}</b><span>${k}</span></div>`).join('')}</div>
    ${mv?`<div class="ddm-mvl"><b>★ COMPANY'S MEDAL</b> · ${ddmEsc(mv.rm.name)}<span>+100 XP</span></div>`:''}
    <div class="ddm-srh"><span></span><span class="l">TAP A MAN TO SEE HIM</span><span>LV</span><span>KILL</span><span>REV</span><span>DOWN</span><span>GREN</span><span class="r">XP</span></div>
    <div class="ddm-sum">${ddm.rows.map(row).join('')}${ddm.dead.length?`<div class="ddm-dead"><b>FALLEN · ★ ${ddRoster.medals} medal${ddRoster.medals===1?'':'s'}</b>${ddm.dead.map((d,j)=>`<div class="ddm-fl${d.back?' back':''}"><i>${DDM_ICON[d.rm?d.rm.role:d.role]||''}</i><span>${ddmEsc(d.name)}</span>${d.back?'<em>BACK WITH THE SQUAD</em>':d.rm?`<button type="button" class="ddm-btn sm" data-a="revive" data-i="${j}"${ddRoster.medals>0?'':' disabled'}>BRING BACK ★ 1</button>`:''}</div>`).join('')}</div>`:''}</div>
    <div class="ddm-fbot">${DDM_NEXT[ddRoster.stage]?'<button type="button" class="ddm-btn" data-a="go">NEXT MISSION ▸</button>':'<button type="button" class="ddm-btn" data-a="menu">BACK TO THE MENU ▸</button>'}</div>${ddm.brief?ddmBriefHTML():''}</div>`;
}
// Version 223 (Bryan, with a picture of the full report: "if I click a unit after the stats are read, I can back right out back to the full stat menu...
// I select the unit and I want to see the unit to the left and all the stats on the right. I can then back out and go back to this page"): a row of
// the report tapped is that man's page (ddm.man, his row's number): he steps out of the line and stands on the left of the screen (ddMetaFrame moves
// the picture over), everything about him down the right: this battle, his record, what he's good at, what he's earned and carries, a perk if one
// is owed. BACK, or the arrows and a swipe for the man before and after; nothing here changes what the report already gave him.
function ddmManHTML(){
  const n=ddm.rows.length,i=ddm.man,r=ddm.rows[i],m=r.rm,up=r.lv1>r.lv0,T=(k,v,c)=>`<span class="${c||''}">${k}<b>${v}</b></span>`;
  const kit=['w','g','t'].map(k=>{const I=DDM_ITEMS[m.gear[k]];return`<div class="${I.star?'star':''}"><i>${ddmKitIcon(k,I)}</i><b>${I.star?'★ ':''}${I.n}</b></div>`;}).join('');
  return`<div class="ddm-mv" style="--tc:${teamCol(r.u)}">
    <div class="ddm-mvt"><button type="button" class="ddm-mvb" data-a="manx">‹ BACK</button><span>${i+1} of ${n}</span></div>
    <div class="ddm-mvw"><div class="ddm-mvn"><b>${m.fav?'<u class="ddm-fv">★</u>':''}${ddmEsc(m.name)}</b><span>${r.team==='A'?'ALPHA':'BRAVO'} · ${DDM_ROLE[m.role].toUpperCase()}</span>${r.mvp?'<q class="g">★ MVP</q>':''}${r.hurt?'<q class="r">WOUNDED</q>':''}</div></div>
    <div class="ddm-mvr">
      <div class="ddm-cite"><b>${r.mvp?'★ ':''}${r.cite[0]}</b><span>${ddmEsc(r.cite[1])}</span></div>
      <div class="ddm-gl gold">THIS BATTLE</div>
      <div class="ddm-chips g3">${T('KILLS',r.kills)}${T('REVIVES',r.rev)}${T('TIMES DOWN',r.downs)}${T('XP EARNED','+'+r.gain,'gold')}</div>
      <div class="ddm-gl gold">LEVEL ${r.lv1}${m.stars?' · '+'★'.repeat(Math.min(3,m.stars)):''}</div>
      <div class="ddm-xpr"><div class="ddm-xpb"><em style="width:${Math.round(m.xp/ddmNeed(r.lv1)*100)}%"></em></div><span>${m.xp} / ${ddmNeed(r.lv1)} XP</span></div>
      ${up?`<div class="ddm-up">▲ LEVEL UP${r.lv1-r.lv0>1?' ×'+(r.lv1-r.lv0):''} · +${2*(r.lv1-r.lv0)} Health · Aim · Speed · Nerve</div>`:''}
      ${m.pk>0?`<div class="ddm-pk"><div class="ddm-gl gold">CHOOSE A PERK${m.pk>1?' · '+m.pk+' TO CHOOSE':''}</div><div class="ddm-row">${ddmJob(m).map(q=>`<button type="button" class="ddm-pkb" data-a="perk" data-k="${q[0]}"><b>${q[1]}${ddmPerkN(m,q[0])?' ×'+(ddmPerkN(m,q[0])+1):''}</b><span>${ddmFxTxt(m,q[0],q[2])}</span></button>`).join('')}</div></div>`:''}
      <div class="ddm-gl gold">WHAT HE'S GOOD AT</div>
      ${[['Health','hp'],['Aim','aim'],['Speed','spd'],['Bravery','brv']].map(([t,k])=>`<div class="ddm-st"><span>${t}</span><div><em style="width:${m.st[k]}%"></em></div><b>${m.st[k]}</b></div>`).join('')}
      ${m.trait?`<div class="ddm-perk gold"><b>★ ${DDM_TRAITS[m.trait].n}</b><br>${DDM_TRAITS[m.trait].d}</div>`:''}
      ${ddmJob(m).filter(q=>ddmPerkN(m,q[0])).map(q=>`<div class="ddm-unl sm new"><b>${q[1]}${ddmPerkN(m,q[0])>1?' ×'+ddmPerkN(m,q[0]):''}</b><span>${ddmFxTxt(m,q[0],q[2])}</span></div>`).join('')}
      ${ddmUnl(m).filter(q=>m.level>=q[0]).map(q=>`<div class="ddm-unl sm new"><b>★ ${q[2]}</b><span>${ddmFxTxt(m,q[1],q[3])}</span></div>`).join('')}
      <div class="ddm-gl gold">HE CARRIES</div>
      <div class="ddm-mvk">${kit}</div>
    </div>
    <div class="ddm-mvf"><button type="button" class="ddm-btn grey" data-a="mann" data-d="-1" aria-label="The man before"${n>1?'':' disabled'}>◂</button><button type="button" class="ddm-btn" data-a="manx">‹ BACK TO THE REPORT</button><button type="button" class="ddm-btn grey" data-a="mann" data-d="1" aria-label="The next man"${n>1?'':' disabled'}>▸</button></div>
  </div>`;
}
// who's on the page: he steps out of the line toward the camera, the rest stand as they were (null: back to the report)
function ddmManGo(i){
  const n=ddm.rows.length;ddm.man=i==null||!n?null:((i%n)+n)%n;
  ddm.rows.forEach((r,k)=>{const u=r.u;if(r.y0==null){r.y0=u.y;r.a0=u.ang;}u.y=r.y0+(k===ddm.man?20:0);u.ang=k===ddm.man?Math.PI/2:r.a0;u.away=ddm.man!=null&&k!==ddm.man;});   // (away: scene.js draws only him)
  ddmUI();
}
function ddmPortraitFrame(r,rdt){
  let P=ddm.por;if(!P){const sc=new T.Scene();sc.background=new T.Color(0x0c1117);const g=new T.Group();sc.add(g);
    const fl=new T.Mesh(new T.CircleGeometry(26,40),new T.MeshStandardMaterial({color:0x1a222c,roughness:.9}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;g.add(fl);
    g.add(new T.HemisphereLight(0xb8c6d6,0x1a1f26,.75));const key=new T.SpotLight(0xfff0d8,1.7,160,.7,.6,1);key.position.set(18,44,34);key.target.position.set(0,10,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.002;g.add(key,key.target);
    const rim=new T.DirectionalLight(0x7fb4ff,.7);rim.position.set(-20,18,-26);g.add(rim);P=ddm.por={sc,g,cam:new T.PerspectiveCamera(26,1,1,600),u:null,H:22};}
  const u=r.u;if(P.u!==u){if(P.u)moveMesh(P.u,scene);P.u=u;moveMesh(u,P.g);u.m.g.traverse(o=>{o.frustumCulled=false;});if(u.m.ring)u.m.ring.visible=false;
    u.m.g.position.set(0,0,0);u.m.g.rotation.y=-(Math.PI/2-.35);u.m.g.updateMatrixWorld(true);try{const b=new T.Box3().setFromObject(u.m.g);if(b.max.y>8)P.H=b.max.y;}catch(e){}}
  u.m.g.visible=true;u.m.g.position.set(0,0,0);u.m.g.rotation.y=-(Math.PI/2-.35);figRefresh(u);figAnimate(u,u.m);
  const c=P.cam,tall=cw<ch,H=P.H*1.5,d=H/2/Math.tan(c.fov*Math.PI/360);c.aspect=cw/ch;c.position.set(0,P.H*.5,d);c.lookAt(0,P.H*.5,0);c.setViewOffset(cw,ch,cw*(tall?.3:.28),0,cw,ch);c.updateProjectionMatrix();c.updateMatrixWorld();
  postRender(P.sc,c);ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);
}
function ddmPortraitEnd(){const P=ddm&&ddm.por;if(P&&P.u){moveMesh(P.u,scene);if(P.u.m.ring)P.u.m.ring.visible=true;P.u=null;}}
// After Version 224 (Bryan: "Medals are spent after the battle to revive players that were lost"): on the report, a medal brings a fallen man back:
// into his own slot if it's still empty, else any empty squad slot, else the reserve; at full health, his kit as it was.
function ddmRevive(j){const R=ddRoster,d=ddm&&ddm.dead[j];if(!d||d.back||!d.rm||R.medals<1)return false;
  const Q=R.squads[d.team]||R.squads.A,o=R.squads[d.team==='A'?'B':'A'];let k=Q[d.slot]?Q.indexOf(null):d.slot;
  if(k>=0)Q[k]=d.rm;else if((k=o.indexOf(null))>=0)o[k]=d.rm;else R.reserve.push(d.rm);
  d.rm.hurt=0;R.medals--;d.back=true;ddmSave();sfxLevelUp(false);ddmUI();return true;}
function ddmNomWhy(r){const pl=(n,w)=>n+' '+w+(n===1?'':'s'),a=[];if(r.kills)a.push(pl(r.kills,'kill'));if(r.rev)a.push(r.rev+(r.rev===1?' man':' men')+' brought back');if(r.best>=3)a.push(r.best+' in a row');a.push(r.downs?'down '+(r.downs===1?'once':r.downs+' times'):'never went down');return a.join(' · ');}
// the report's clock: the title, the medal, then each man's card: his bar filling a level at a time, once (r.seen)
function ddmRollGo(i){
  if(i>=0&&!ddm.mvp&&ddm.noms.length>1){if(i>=ddm.rows.length){ddmAward(0);}else{ddm.scr='medal';ddm.nom=ddm.nom||0;ddmUI();return;}}   // (skipped: it goes to the one who did most)
  const o=ddm.rows[ddm.step];if(o&&ddm.step!==i){o.seen=true;}
  ddm.scr=null;ddm.step=i;ddm.stepT=0;const c=ddm.rows[i];ddm.an=c&&c.seen?{done:true}:null;
  ddm.rows.forEach((r,k)=>{const u=r.u;if(r.y0==null){r.y0=u.y;r.a0=u.ang;}u.y=r.y0+(k===i?20:0);u.ang=k===i?Math.PI/2:r.a0;});   // (the man whose turn it is steps out of the line toward the camera)
  ddmUI();if(i<0&&typeof sfxLevelUp==='function')sfxLevelUp(true);if(c&&c.hurt&&!c.seen&&typeof sfxStamp==='function')setTimeout(sfxStamp,330);}
function ddmRollTick(rdt){
  if(!ddm||ddm.ph!=='report'||ddm.scr)return;ddm.stepT+=rdt;const i=ddm.step,r=ddm.rows[i];
  if(i<0){if(!ddm.fan){ddm.fan=1;if(typeof sfxLevelUp==='function')sfxLevelUp(true);}if(!ddm.rows.length&&ddm.stepT>1)ddmRollGo(0);return;}
  if(!r)return;
  const A=ddm.an||(ddm.an={seg:-1,t:0,lv:r.lv0,done:false,segs:(()=>{const L=[];let f=r.xp0/ddmNeed(r.lv0);for(let l=r.lv0;l<r.lv1;l++){L.push([f,1,l]);f=0;}L.push([f,r.rm.xp/ddmNeed(r.lv1),r.lv1]);return L;})()});
  if(A.done||ddm.stepT<.55)return;
  const bar=document.getElementById('ddmXp'),xn=document.getElementById('ddmXpN'),lv=document.getElementById('ddmLv'),D=.75;
  if(A.seg<0){A.seg=0;A.t=0;const S=A.segs[0];if(typeof sfxXpFill==='function')sfxXpFill(S[1]-S[0],D);}
  A.t+=rdt;const S=A.segs[A.seg],k=clamp(A.t/D,0,1),e=1-(1-k)*(1-k);
  if(bar)bar.style.width=Math.round((S[0]+(S[1]-S[0])*e)*100)+'%';
  if(xn)xn.textContent='+'+Math.round(r.gain*clamp((A.seg+e)/A.segs.length,0,1))+' XP';
  if(k>=1){if(A.seg<A.segs.length-1){A.seg++;A.t=0;A.lv=A.segs[A.seg][2];if(lv){lv.textContent=A.lv;lv.classList.remove('pop');void lv.offsetWidth;lv.classList.add('pop');}
      const up=document.getElementById('ddmUp');if(up)up.hidden=false;if(bar){bar.style.width='0%';bar.parentNode.classList.remove('flash');void bar.offsetWidth;bar.parentNode.classList.add('flash');}
      if(typeof sfxLevelUp==='function')sfxLevelUp(false);const N=A.segs[A.seg];if(typeof sfxXpFill==='function')setTimeout(()=>sfxXpFill(N[1]-N[0],D),260);A.t=-.3;}
    else ddmRollEnd();}
}
function ddmRollEnd(){   // his numbers as they end up, and his perk to choose
  const r=ddm.rows[ddm.step],A=ddm.an;if(!r||!A)return;A.done=true;r.seen=true;const g=id=>document.getElementById(id);
  if(g('ddmXp'))g('ddmXp').style.width=Math.round(r.rm.xp/ddmNeed(r.lv1)*100)+'%';if(g('ddmXpN'))g('ddmXpN').textContent='+'+r.gain+' XP';if(g('ddmLv'))g('ddmLv').textContent=r.lv1;
  if(g('ddmUp')&&r.lv1>r.lv0)g('ddmUp').hidden=false;if(g('ddmPk'))g('ddmPk').hidden=false;if(g('ddmUn')){g('ddmUn').hidden=false;if(!r.unS){r.unS=1;if(typeof sfxLevelUp==='function')setTimeout(()=>sfxLevelUp(true),350);}}
}
function ddmRollTap(skip){
  if(!ddm||ddm.ph!=='report'||ddm.scr)return;const n=ddm.rows.length;
  if(skip){ddmRollGo(n);return;}
  if(ddm.step<0){if(ddm.stepT>.5)ddmRollGo(n?0:n);return;}
  if(ddm.step>=n)return;
  if(!ddm.an||!ddm.an.done){if(!ddm.an)ddmRollTick(.6);ddmRollEnd();return;}
  ddmRollGo(ddm.step+1);
}
// a swipe across a man's card: the next man, or the one before
function ddmSwipe(el){let x0=null,y0=0;
  el.addEventListener('pointerdown',e=>{x0=e.clientX;y0=e.clientY;});
  el.addEventListener('pointerup',e=>{
    if(x0!=null&&ddm&&ddm.ph==='barracks'&&ddm.slot&&!ddm.sub&&!ddm.swap&&ddmSel()){const dx=e.clientX-x0,dy=e.clientY-y0;x0=null;if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.3)return;ddm.swT=performance.now();ddmBarracksClick('man',{dataset:{d:dx<0?1:-1}});ddmUI();return;}
    if(x0!=null&&ddm&&ddm.ph==='report'&&ddm.man!=null&&!ddm.scr){const dx=e.clientX-x0,dy=e.clientY-y0;x0=null;if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.3)return;ddm.swT=performance.now();ddmManGo(ddm.man+(dx<0?1:-1));return;}
    if(x0==null||!ddm||ddm.ph!=='report'||ddm.scr)return;const dx=e.clientX-x0,dy=e.clientY-y0,n=ddm.rows.length,i=ddm.step;x0=null;
    if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.3||i<0||i>=n)return;ddm.swT=performance.now();if(ddm.an&&!ddm.an.done)ddmRollEnd();ddmRollGo(dx<0?i+1:Math.max(0,i-1));});
}

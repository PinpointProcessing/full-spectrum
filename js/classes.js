"use strict";
/* Soldier classes (Bryan's design, docs/classes.md: "Every private can use a basic assault rifle. When they reach level 3 their
   class type should be chosen... Each unit unlocks different Class Attribute Slots for skills and equipment"). Step 1 of the
   plan: the choice at level 3 on the between-missions screen, each class's weapons and one passive bonus. Each class's skill
   is in skills.js, the Defender's building in build.js; the slots and the rest of the new gear (heal darts, the drone,
   the Captain's call-ins) come later.
   Until Bryan answers the four questions in the doc: the player picks; a class is kept (retraining at HQ later); two soldiers
   may share a class but there's one Captain; the Medic brings the downed and critical back, not the dead.
   A class adds to the armory, it doesn't take away: everyone can still take the M240, the RPG, smoke or a kit. */
const CLASS_KEY='warehouseYard.classes.v1',CLASS_LEVEL=3;
const CLASSES={
  specops:{name:'Spec Ops',ab:'SPEC OPS',line:'Stealth skills and equipment bonuses.',weapons:['m4s'],passive:'Ghost: a third harder to spot while sneaking, and his takedowns are quicker.',skill:'Distraction (twice a mission): a clatter where you tap that draws unaware guards over to look.'},
  medic:  {name:'Medic',ab:'MEDIC',line:'Heals the wounded, gets more out of a medic kit.',weapons:['m4s'],passive:'Field medic: revives a man in 2 s and brings him up at 60; a medic kit in his hands has 3 uses and brings a man up at 80.',skill:'Field station (once a mission): sets a medic station down where he stands.'},
  support:{name:'Support',ab:'SUPPORT',line:'Heavy machine gun, rockets, keeps the squad supplied.',weapons:['m4s','hmg'],passive:'Suppressor: his fire pins half as hard again; an RPG in his hands has 3 rockets.',skill:'Ammo bag (once a mission): sets an ammo drop down where he stands.'},
  assault:{name:'Assault',ab:'ASSAULT',line:'Heavy firepower, strong and quick attacks.',weapons:['m4s','shotgun'],passive:'Breacher: carries 2 frags, and loses half as much aim firing on the move.',skill:'Flashbang (twice a mission): anyone within 9 m who sees it is stunned for 3.5 s and can\'t shoot.'},
  recon:  {name:'Recon',ab:'RECON',line:'Sniper expert, scouts ahead, gets where others can\'t.',weapons:['m4s','sniper'],passive:'Eyes: sees 10 m further (and further still with the sniper rifle).',skill:'Binoculars (every 30 s): marks every hostile within 20 m of a spot he can see, for the whole squad.'},
  cyber:  {name:'Cyber Ops',ab:'CYBER',line:'Drones, hacking, tech.',weapons:['m4s'],passive:'Tracker: the contact sensor reaches 70 m and sweeps faster.',skill:'Hacking: gets into anything that needs the access card without it.'},
  defender:{name:'Defender',ab:'DEFENDER',line:'Builds mobile fortifications and walls, and holds the ground he takes.',weapons:['m4s'],gear:['build'],passive:'Bulwark: heavy armour takes a quarter off every hit. His build kit (3 uses): a barricade he can pack up and move on, or a wall that blocks sight and shots.'},
  captain:{name:'Captain',ab:'CAPTAIN',line:'A great leader who raises the whole team.',weapons:['m4s'],passive:'Leader: men within 20 m of him aim better and pin a quarter slower. One per squad.',skill:'Rally (every 60 s): everyone within 20 m of him shakes off being pinned and aims better for 8 s.'},
};
let classes=readClasses();
function readClasses(){try{const c=JSON.parse(localStorage.getItem(CLASS_KEY)||'{}');for(const k in c)if(!CLASSES[c[k]])delete c[k];return c;}catch(e){return{};}}
function saveClasses(){try{localStorage.setItem(CLASS_KEY,JSON.stringify(classes));}catch(e){}}
const classOf=u=>u&&u.side==='P'&&!u.joined?classes[u.id]||null:null;   // (the freed prisoners have no class)
const isCls=(u,k)=>classOf(u)===k;
// Bryan, after v100: "allow level ups but no new equipment until the Radio Tower is built": soldiers keep levelling up, but
// nobody picks a class until radio control is up at the HQ (after Level 4: coming next); the report and the boat screen say
// so (classLocked). A class picked before stays. classesOpen() is the one switch for when it's built.
const classesOpen=()=>false;
const canPromote=p=>classesOpen()&&!!p&&!p.joined&&!classes[p.id]&&(p.level||1)>=CLASS_LEVEL;
const classLocked=p=>!classesOpen()&&!!p&&!classes[p.id]&&(p.level||1)>=CLASS_LEVEL;   // at the level for one, waiting on the radio tower
const classTaken=(k,but)=>k==='captain'&&Object.entries(classes).some(([id,c])=>c==='captain'&&id!==but);
function setClass(id,k){if(!CLASSES[k]||classTaken(k,id))return false;classes[id]=k;saveClasses();
  if(k==='defender'&&typeof loadout!=='undefined'&&loadout[id]&&ARMORY.spec.build>Object.values(loadout).filter(l=>l.spec==='build').length){loadout[id].spec='build';saveLoadout();}   // a new Defender takes his build kit (equip.js)
  return true;}
function resetClasses(){classes={};saveClasses();}

/* ---------- what each class changes in the field (read by combat.js, layers.js, cards.js) ---------- */
const CLS={defArmor:.75,sneakSpot:.65,tkGrab:.4,reviveT:2,reviveHp:60,kitHp:80,kits:3,supMul:1.5,rockets:3,frags:2,moveAim:.075,seeMore:100,sniperMore:100,sensorR:700,leadR:200,leadAim:.05,leadNerve:.75};
function nearCaptain(u){const c=players.find(p=>isCls(p,'captain')&&alive(p)&&p!==u);return !!c&&u.side==='P'&&hyp(c.x-u.x,c.y-u.y)<=CLS.leadR;}
// a soldier's gear when a mission starts: a Medic's kits, a Support's rockets, an Assault's second frag
function classGear(p){
  if(isCls(p,'medic')&&p.spec==='medkit')p.specN=CLS.kits;
  if(isCls(p,'support')&&p.spec==='rpg')p.specN=CLS.rockets;
  if(isCls(p,'assault'))p.grenade=Math.max(p.grenade||0,CLS.frags);
}

/* ---------- the choice, on the between-missions screen (equip.js) ---------- */
function classPicker(id,done){
  const p=players.find(q=>q.id===id);if(!p)return;
  let box=$('#clsPick');if(!box){box=document.createElement('div');box.id='clsPick';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');$('#equip').appendChild(box);}
  box.innerHTML=`<div class="cls-head"><b>Promotion: ${p.name}</b><span>Level ${p.level} · choose a class. It stays with him.</span><button type="button" class="cls-x" aria-label="Not now">Not now</button></div>`+
    `<div class="cls-list">${Object.entries(CLASSES).map(([k,c])=>{const off=classTaken(k,id);return`<button type="button" class="cls-card" data-k="${k}" ${off?'disabled':''}><b>${c.name}</b><span>${c.line}</span><em>${c.passive}</em>${c.skill?`<span class="cls-skill">${c.skill}</span>`:''}${(()=>{const add=[...c.weapons.filter(w=>w!=='m4s'&&w!=='hmg').map(w=>w==='sniper'?'sniper rifle':WEAPON[w]?WEAPON[w].label.toLowerCase():w),...(c.gear||[]).map(g=>SPECIALS[g]?SPECIALS[g].label.toLowerCase():g)];const t=[add.length?`Adds the ${add.join(' and ')} to his loadout.`:'',off?'The squad already has a Captain.':''].filter(Boolean).join(' ');return t?`<small>${t}</small>`:'';})()}</button>`;}).join('')}</div>`;
  box.hidden=false;
  box.onclick=ev=>{if(ev.target.closest('.cls-x')){box.hidden=true;return;}const b=ev.target.closest('.cls-card');if(!b||b.disabled)return;
    if(setClass(id,b.dataset.k)){box.hidden=true;if(done)done();}};
}

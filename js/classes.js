"use strict";
/* Soldier classes (Bryan's design, docs/classes.md: "Every private can use a basic assault rifle. When they reach level 3 their
   class type should be chosen... Each unit unlocks different Class Attribute Slots for skills and equipment"). Step 1 of the
   plan: the choice at level 3 on the between-missions screen, each class's weapons and one passive bonus. The slots and new
   gear (heal darts, the field station, the ammo bag, the drone, hacking, the Captain's call-ins) come later.
   Until Bryan answers the four questions in the doc: the player picks; a class is kept (retraining at HQ later); two soldiers
   may share a class but there's one Captain; the Medic brings the downed and critical back, not the dead.
   A class adds to the armory, it doesn't take away: everyone can still take the M240, the RPG, smoke or a kit. */
const CLASS_KEY='warehouseYard.classes.v1',CLASS_LEVEL=3;
const CLASSES={
  specops:{name:'Spec Ops',ab:'SPEC OPS',line:'Stealth skills and equipment bonuses.',weapons:['m4s'],passive:'Ghost: a third harder to spot while sneaking, and his takedowns are quicker.'},
  medic:  {name:'Medic',ab:'MEDIC',line:'Heals the wounded, gets more out of a medic kit.',weapons:['m4s'],passive:'Field medic: revives a man in 2 s and brings him up at 60; a medic kit in his hands has 3 uses and brings a man up at 80.'},
  support:{name:'Support',ab:'SUPPORT',line:'Heavy machine gun, rockets, keeps the squad supplied.',weapons:['m4s','hmg'],passive:'Suppressor: his fire pins half as hard again; an RPG in his hands has 3 rockets.'},
  assault:{name:'Assault',ab:'ASSAULT',line:'Heavy firepower, strong and quick attacks.',weapons:['m4s','shotgun'],passive:'Breacher: carries 2 frags, and loses half as much aim firing on the move.'},
  recon:  {name:'Recon',ab:'RECON',line:'Sniper expert, scouts ahead, gets where others can\'t.',weapons:['m4s','sniper'],passive:'Eyes: sees 10 m further (and further still with the sniper rifle).'},
  cyber:  {name:'Cyber Ops',ab:'CYBER',line:'Drones, hacking, tech.',weapons:['m4s'],passive:'Tracker: the contact sensor reaches 70 m and sweeps faster.'},
  captain:{name:'Captain',ab:'CAPTAIN',line:'A great leader who raises the whole team.',weapons:['m4s'],passive:'Leader: men within 20 m of him aim better and pin a quarter slower. One per squad.'},
};
let classes=readClasses();
function readClasses(){try{const c=JSON.parse(localStorage.getItem(CLASS_KEY)||'{}');for(const k in c)if(!CLASSES[c[k]])delete c[k];return c;}catch(e){return{};}}
function saveClasses(){try{localStorage.setItem(CLASS_KEY,JSON.stringify(classes));}catch(e){}}
const classOf=u=>u&&u.side==='P'&&!u.joined?classes[u.id]||null:null;   // (the freed prisoners have no class)
const isCls=(u,k)=>classOf(u)===k;
const canPromote=p=>!!p&&!p.joined&&!classes[p.id]&&(p.level||1)>=CLASS_LEVEL;
const classTaken=(k,but)=>k==='captain'&&Object.entries(classes).some(([id,c])=>c==='captain'&&id!==but);
function setClass(id,k){if(!CLASSES[k]||classTaken(k,id))return false;classes[id]=k;saveClasses();return true;}
function resetClasses(){classes={};saveClasses();}

/* ---------- what each class changes in the field (read by combat.js, layers.js, cards.js) ---------- */
const CLS={sneakSpot:.65,tkGrab:.4,reviveT:2,reviveHp:60,kitHp:80,kits:3,supMul:1.5,rockets:3,frags:2,moveAim:.075,seeMore:100,sniperMore:100,sensorR:700,leadR:200,leadAim:.05,leadNerve:.75};
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
    `<div class="cls-list">${Object.entries(CLASSES).map(([k,c])=>{const off=classTaken(k,id);return`<button type="button" class="cls-card" data-k="${k}" ${off?'disabled':''}><b>${c.name}</b><span>${c.line}</span><em>${c.passive}</em>${(()=>{const add=c.weapons.filter(w=>w!=='m4s'&&w!=='hmg').map(w=>w==='sniper'?'sniper rifle':WEAPON[w]?WEAPON[w].label.toLowerCase():w);const t=[add.length?`Adds the ${add.join(' and ')} to his loadout.`:'',off?'The squad already has a Captain.':''].filter(Boolean).join(' ');return t?`<small>${t}</small>`:'';})()}</button>`;}).join('')}</div>`;
  box.hidden=false;
  box.onclick=ev=>{if(ev.target.closest('.cls-x')){box.hidden=true;return;}const b=ev.target.closest('.cls-card');if(!b||b.disabled)return;
    if(setClass(id,b.dataset.k)){box.hidden=true;if(done)done();}};
}

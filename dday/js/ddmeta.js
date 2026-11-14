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
  demo:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14 13 4h7v7L10 21l-3-4z" fill="currentColor"/><circle cx="16" cy="8" r="2" fill="#20262c"/></svg>',
  eng:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3a6 6 0 0 0-5.6 8.2L3 16.6 7.4 21l5.4-5.4A6 6 0 0 0 21 10l-4 3-3-3 3-4a6 6 0 0 0-3-3z" fill="currentColor"/></svg>'};
const DDM_ROLE={medic:'Medic',gunner:'Gunner',rifle:'Rifleman',sharp:'Sharpshooter',demo:'Demo',eng:'Engineer'};
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
}
const ddmSlotMan=(t,i)=>{if(!ddRoster)ddRoster=ddmRead();return ddRoster.squads[t][i]||null;};

/* ---------- the end of a battle won: who's left, what they did ---------- */
// where the line-up stands and what the base view looks at, on the beach's map or the counterattack's (ddcounter.js)
function ddmSpots(){
  if(dd&&dd.counter)return{line:[885,655],cam:[700,720],zoom:[1.75,3],bk:[DCA.barracks[0].x+85,DCA.barracks[0].y+50],ar:[DCA.armory.x+55,DCA.armory.y+28],vd:[DCA.depot.x+75,DCA.depot.y+28],sq:[DCA.square.x-30,DCA.square.y-20],off:{bk:[0,-10],ar:[-10,24],vd:[30,24]}};
  return{line:[DDX+520,-556],cam:[1545,-592],zoom:[2.6,3.6],bk:[(DB.bA.x+DB.bB.x+DB.bB.w)/2,DB.bA.y+DB.bA.h/2],ar:[DB.ammo.x+DB.ammo.w/2,DB.ammo.y+DB.ammo.h/2],vd:[DB.pool.x+DB.pool.w/2,DB.pool.y+DB.pool.h/2],sq:[1500,-592],off:{bk:[0,-6],ar:[34,-14],vd:[-34,20]}};
}
function ddmStart(){
  if(!ddRoster)ddRoster=ddmRead();const R=ddRoster;
  const score=u=>u.stats.kills*40+(u.stats.revives||0)*50;
  const alive8=players.filter(p=>!p.dead&&p.rm),fallen=units.filter(u=>u.rm&&u.dead&&u.side==='P'&&!alive8.includes(u));
  let mvp=null;for(const u of[...alive8,...fallen])if(score(u)>0&&(!mvp||score(u)>score(mvp)))mvp=u;if(!mvp)mvp=alive8[0]||null;
  const rows=alive8.map(u=>{const rm=u.rm,lv0=rm.level,gain=u.stats.kills*40+(u.stats.revives||0)*50+60+(u===mvp?100:0);
    rm.kills+=u.stats.kills;rm.xp+=gain;while(rm.xp>=ddmNeed(rm.level)){rm.xp-=ddmNeed(rm.level);rm.level++;for(const k in rm.st)rm.st[k]=Math.min(99,rm.st[k]+2);}
    if(u===mvp)rm.stars++;if(u.downed){u.downed=false;u.critical=false;u.hp=35;}
    return{u,rm,team:u.team,kills:u.stats.kills,rev:u.stats.revives||0,gain,lv0,lv1:rm.level,mvp:u===mvp};});
  const dead=fallen.map(u=>({name:u.name,role:u.ddRole,kills:u.stats.kills,rev:u.stats.revives||0,mvp:u===mvp}));
  // whoever he ended with is the roster (Bryan); the dead are gone, and their kit with them
  for(const t of['A','B']){R.squads[t]=[null,null,null,null];for(const u of alive8.filter(p=>p.team===t)){const i=clamp((+String(u.id).slice(1)||1)-1,0,3);R.squads[t][R.squads[t][i]?R.squads[t].indexOf(null):i]=u.rm;}}
  R.medals++;R.battles++;R.minLevel=Math.max(R.minLevel,dd.counter?3:2);R.stage=Math.max(R.stage||0,dd.counter?2:1);ddmRecruits();ddmSave();
  const t=Math.floor(simT-dd.t0);
  ddm={ph:'report',t:0,rows,dead,mvp,chap:dd.counter?'CHAPTER 2 · THE COUNTERATTACK':'CHAPTER 1 · D-DAY',sp:ddmSpots(),sum:`${dd.counter?'The base held for':'Their base taken in'} ${Math.floor(t/60)}:${String(t%60).padStart(2,'0')} · ${dd.counter?DCA.waves.reduce((n,w)=>n+w.inf,0):enemies.filter(e=>e.dead).length} enemy down${dd.counter?' · '+dd.tanks.filter(K=>K.hp<=0).length+' tanks knocked out':''} · ${dd.lost} of ours lost`,pick:null,slot:null,ui:null,room:null,cam:{k:1}};
  state='ddmeta';sel=[];cardGroup=[];mode=null;camPan=null;dd.track=null;paused=false;
  document.body.classList.add('ddm');{const q=$('#sq');if(q)q.hidden=true;}{const o=$('#oob');if(o)o.hidden=true;}
  // the line-up: each squad in a diagonal line across from the other, in front of the barracks on the hill
  const[cx,cy]=ddm.sp.line;
  for(const r of rows){const u=r.u,s=u.team==='A'?-1:1,i=rows.filter(q=>q.team===u.team).indexOf(r);
    Object.assign(u,{x:cx+s*(8+i*10.5),y:cy-30+i*14,ang:Math.PI/2+s*.5,path:[],sup:0,focus:null,target:null,cool:99,aimT:-9,watch:null,supT:0,covered:false,inBoat:false,joining:false,lx:0,ly:0,elev:0});}
  for(const u of units)if(!rows.some(r=>r.u===u)){u.path=[];if(u.side==='P'&&!u.dead&&Math.hypot(u.x-cx,u.y-(cy-10))<70){u.x+=u.x<cx?-70:70;}}
  ddmUI();
}
function ddmEnd(){   // (from leaveDDayNow and reset: everything of this put away)
  if(ddm&&ddm.room)ddmRoomDispose();ddm=null;document.body.classList.remove('ddm');const e=$('#ddm');if(e)e.remove();if(state==='ddmeta')state='end';
}
function ddmNext(){ddmSave();ddmEnd();startDDay();}

/* ---------- the frame (main.js, while state is 'ddmeta') ---------- */
function ddMetaFrame(rdt,now){
  if(!ddm)return;ddm.t+=rdt;simT+=rdt;
  if(ddm.ph==='barracks'){ddmRoomFrame(rdt);ddmPlace();return;}
  const SP=ddm.sp;
  if(ddm.ph==='report'){const z=cw<ch?7.6:6.4;zoom=z;yaw=0;tilt=ddTilt(z);camT.x=SP.line[0];camT.z=SP.line[1]-34+DD_CAM.look;}
  else{const z=cw<ch?SP.zoom[0]:SP.zoom[1];zoom=z;yaw=0;tilt=-.5;camT.x=SP.cam[0];camT.z=SP.cam[1]+DD_CAM.look;}
  camShift=0;updateCamera();render(rdt,now);ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);ddmPlace();
}

/* ---------- the panels (DOM over the picture) ---------- */
const ddmEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function ddmUI(){
  let el=$('#ddm');if(!el){el=document.createElement('div');el.id='ddm';stage.appendChild(el);el.addEventListener('click',ddmClick);}
  const R=ddRoster,ph=ddm.ph;let h='';
  if(ph==='report'){
    const card=r=>`<div class="ddm-c${r.mvp?' mvp':''}" style="--tc:${teamCol(r.u)}"><i>${DDM_ICON[r.rm.role]||''}</i><b>${ddmEsc(r.rm.name)}</b><s>K <u data-n="${r.kills}">0</u>${r.rev?` · R <u data-n="${r.rev}">0</u>`:''}</s><s>+<u data-n="${r.gain}">0</u> XP</s><s class="lv">${r.lv1>r.lv0?`LEVEL ${r.lv1} ▲`:`Level ${r.lv1}`}</s><div class="ddm-xp"><em style="--w:${Math.round(r.rm.xp/ddmNeed(r.rm.level)*100)}%"></em></div>${r.mvp?'<span class="ddm-mvp">★ MVP</span>':''}</div>`;
    const sq=t=>{const L=ddm.rows.filter(r=>r.team===t);return`<div class="ddm-sqd">${L.length?`<div class="ddm-gl" style="color:${t==='A'?'#58c4f6':'#f0b429'}">${t==='A'?'ALPHA':'BRAVO'}</div><div class="ddm-g4">${L.map(card).join('')}</div>`:''}</div>`;};
    const dm=ddm.dead.find(d=>d.mvp);
    h=`<div class="ddm-bar top"><div class="ddm-t">${ddm.chap}</div><div class="ddm-dim">${ddmEsc(ddm.sum)}</div></div>
      <div class="ddm-rep">${sq('A')}${sq('B')}</div>
      <div class="ddm-bar bot">${dm?`<div class="ddm-post">★ MVP, posthumous: ${ddmEsc(dm.name)}, ${DDM_ROLE[dm.role]} · the medal is yours to spend</div>`:''}
        ${ddm.dead.length?`<div class="ddm-gl ddm-dim">FALLEN · ${ddm.dead.length}</div><div class="ddm-dead">${ddm.dead.slice(0,7).map(d=>`<span>${ddmEsc(d.name)} · ${DDM_ROLE[d.role]}${d.kills?' · K '+d.kills:''}</span>`).join('')}${ddm.dead.length>7?`<span>+${ddm.dead.length-7}</span>`:''}</div>`:'<div class="ddm-dim">Nobody lost.</div>'}
        <button type="button" class="ddm-btn" data-a="base">TO THE BASE ▸</button></div>`;
  }else if(ph==='base'){
    h=`<div class="ddm-bar top row"><div><div class="ddm-t">YOUR BASE</div><div class="ddm-dim">Tap a building</div></div><div class="r"><div class="ddm-t gold">★ ${R.medals} MEDAL${R.medals===1?'':'S'}</div><div class="ddm-dim">Reserve ${R.reserve.length}/${DDM_RES} · Armory ${R.armory.length}</div></div></div>
      <button type="button" class="ddm-tag" data-b="bk" data-a="barracks">BARRACKS<small>squads · recruits · reserve</small></button>
      <button type="button" class="ddm-tag" data-b="ar" data-a="armory">ARMORY<small>saved equipment</small></button>
      <button type="button" class="ddm-tag off" data-b="vd" data-a="depot">VEHICLE DEPOT<small>later</small></button>
      ${ddm.armory?`<div class="ddm-sheet mid"><div class="ddm-t">ARMORY · SAVED EQUIPMENT</div>${R.armory.length?R.armory.map(id=>`<div class="ddm-it${DDM_ITEMS[id].star?' gold':''}"><span><b>${DDM_ITEMS[id].star?'★ ':''}${DDM_ITEMS[id].n}</b> · ${DDM_ITEMS[id].d}</span><em>${DDM_ITEMS[id].role?DDM_ITEMS[id].role.map(r=>DDM_ROLE[r]).join(', '):'anyone'}</em></div>`).join(''):'<div class="ddm-dim" style="margin:8px 0">Nothing saved yet. In the barracks, press a piece of a man\'s kit and choose "Put it in the armory" to keep it here for later.</div>'}<button type="button" class="ddm-btn grey" data-a="armoryx">CLOSE</button></div>`:''}
      <div class="ddm-bar bot">${(R.stage||0)<2?`<div class="ddm-post">Ready your squads in the barracks. When you come back out, they counterattack.</div><div class="ddm-row"><button type="button" class="ddm-btn grey" data-a="menu">MENU</button><button type="button" class="ddm-btn" data-a="barracks">TO THE BARRACKS ▸</button></div>`
        :`<div class="ddm-row"><button type="button" class="ddm-btn grey" data-a="menu">MENU</button><button type="button" class="ddm-btn grey" data-a="next">D-DAY AGAIN</button><button type="button" class="ddm-btn" data-a="again2">HOLD THE BASE AGAIN</button></div><div class="ddm-dim">The base is held. The next chapter is still to come.</div>`}</div>`;
  }else h=ddmBarracksHTML();
  el.className='ph-'+ph;el.innerHTML=h;
  if(ph==='report'){const t0=performance.now();const tick=()=>{if(!ddm||ddm.ph!=='report')return;const k=clamp((performance.now()-t0-500)/1800,0,1),e=1-Math.pow(1-k,3);
    for(const n of el.querySelectorAll('u[data-n]'))n.textContent=Math.round(+n.dataset.n*e);el.classList.toggle('done',k>=1);if(k<1)setTimeout(tick,40);};tick();}
  ddmPlace();
}
// what follows the picture: the buildings' names over their buildings, the chosen man's name over his head, the kit bar under his feet
function ddmPlace(){
  const el=$('#ddm');if(!el||!ddm)return;
  if(ddm.ph==='base'){const at=ddm.sp,off=at.off;
    for(const b of el.querySelectorAll('.ddm-tag')){const p=at[b.dataset.b],q=toS(p[0],p[1]),o=off[b.dataset.b];b.style.left=clamp(q[0]+o[0],76,cw-76)+'px';b.style.top=clamp(q[1]+o[1],90,ch-110)+'px';}}
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
  if(a==='base'){ddm.ph='base';ddm.armory=false;const A=ddm.rows.map(r=>r.u);A.forEach((u,i)=>{u.x=ddm.sp.sq[0]+(i%4)*14;u.y=ddm.sp.sq[1]+((i/4)|0)*16;u.ang=Math.PI/2;u.atEase=true;figRefresh(u);});}
  else if(a==='armory')ddm.armory=true;else if(a==='armoryx')ddm.armory=false;
  else if(a==='depot'){banner('The vehicle depot comes later.',2200);return;}
  else if(a==='menu'){ddmSave();reset();$('#end').hidden=true;$('#intro').hidden=false;state='intro';if(typeof ddCtrBtnShow==='function')ddCtrBtnShow();return;}
  else if(a==='again2'){ddmSave();ddmEnd();startCounter();return;}
  else if(a==='next'){if(ddmAll().length<1){banner('Nobody in the squads. Recruit someone at the barracks first.',3000);return;}ddmNext();return;}
  else if(a==='barracks'){ddm.ph='barracks';ddm.slot=null;ddm.sub=null;ddm.swap=null;ddm.cand=null;if(!ddm.room)ddmRoomBuild();ddmRoomMen();ddm.cam={k:1};}
  else if(a==='out'){if((R.stage||0)===1&&typeof startCounter==='function'){ddmSave();if(!ddmAll().length){banner('Nobody in the squads. Recruit someone first.',3000);return;}ddmEnd();startCounter();return;}   // (Bryan: "After the player enters the barracks and exit it, it triggers the counter attack")
    ddm.ph='base';ddm.armory=false;}
  else ddmBarracksClick(a,b);
  ddmSave();ddmUI();
}

/* ---------- the barracks: its panels ---------- */
const ddmSel=()=>ddm.slot?ddRoster.squads[ddm.slot[0]][ddm.slot[1]]:null;
const ddmStats=(m,cls)=>`<div class="ddm-stats ${cls||''}"><div class="ddm-dim">${DDM_ROLE[m.role]} · Level ${m.level}${m.stars?' · '+'★'.repeat(Math.min(3,m.stars)):''}${m.kills?' · '+m.kills+' kills':''}</div>${[['Health','hp'],['Aim','aim'],['Speed','spd'],['Bravery','brv']].map(([n,k])=>`<div class="ddm-st"><span>${n}</span><div><em style="width:${m.st[k]}%"></em></div><b>${m.st[k]}</b></div>`).join('')}<div class="ddm-xp"><em style="--w:${Math.round(m.xp/ddmNeed(m.level)*100)}%"></em></div>${m.trait?`<div class="ddm-perk gold"><b>★ ${DDM_TRAITS[m.trait].n}</b><br>${DDM_TRAITS[m.trait].d}</div>`:''}${['w','t'].map(k=>DDM_ITEMS[m.gear[k]]).filter(I=>I.star).map(I=>`<div class="ddm-perk gold"><b>★ ${I.n}</b><br>${I.d} Lost if he dies.</div>`).join('')}</div>`;
const ddmStar=m=>!!(m.trait||DDM_ITEMS[m.gear.w].star||DDM_ITEMS[m.gear.t].star);
function ddmBarracksHTML(){
  const R=ddRoster,S=ddm.slot,m=ddmSel(),right=S&&S[0]==='B';
  const sq=t=>`<div><div class="ddm-gl" style="color:${t==='A'?'#58c4f6':'#f0b429'}">${t==='A'?'ALPHA':'BRAVO'}</div><div class="ddm-sqg" style="--tc:${t==='A'?'#58c4f6':'#f0b429'}">${R.squads[t].map((q,i)=>`<button type="button" class="ddm-sq${S&&S[0]===t&&S[1]===i?' on':''}${q?'':' open'}${q&&ddmStar(q)?' star':''}" data-a="slot" data-t="${t}" data-i="${i}" aria-label="${q?DDM_ROLE[q.role]:'Open slot'}">${q?DDM_ICON[q.role]:'+'}</button>`).join('')}</div></div>`;
  let h=`<div class="ddm-bar top"><div class="ddm-hd"><div class="ddm-t">BARRACKS</div><div class="ddm-t gold">★ ${R.medals}</div></div><div class="ddm-sqs">${sq('A')}${sq('B')}</div></div>`;
  if(ddm.sub==='pick'){   // recruits and the reserve, for the slot chosen
    const c=ddm.cand,tab=ddm.tab||'rec',L=tab==='rec'?R.recruits:R.reserve;
    h+=`<div class="ddm-pick ${right?'l':'r'}"><div class="ddm-tabs"><button type="button" data-a="tab" data-v="rec" class="${tab==='rec'?'on':''}">RECRUITS · LV ${R.minLevel}</button><button type="button" data-a="tab" data-v="res" class="${tab==='res'?'on':''}">RESERVE ${R.reserve.length}/${DDM_RES}</button></div>
      <div class="ddm-pool ${tab}">${L.length?L.map((q,i)=>`<button type="button" data-a="cand" data-i="${i}" class="${c===q?'on':''}${ddmStar(q)?' star':''}">${DDM_ICON[q.role]}<small>${tab==='res'?'Lv '+q.level:q.cost?'★'+q.cost:'free'}</small></button>`).join(''):'<div class="ddm-dim">Nobody in the reserve.</div>'}</div></div>`;
    if(c)h+=ddmStats(c,right?'r':'l').replace('<div class="ddm-dim">',`<div class="ddm-t">${ddmEsc(c.name)}</div><div class="ddm-dim">`);   // (his name in the panel: it would sit over his head, under the panel)
    const cost=c&&tab==='rec'?c.cost:0,full=m&&tab==='rec'&&R.reserve.length>=DDM_RES;
    h+=`<div class="ddm-bar bot">${c?`<div class="ddm-dim">${tab==='rec'?(cost?`Costs ★ ${cost}. You have ★ ${R.medals}.`:'Free.'):'From the reserve, with his level and kit.'}${m?(full?` ${ddmEsc(m.name)} is dismissed: the reserve is full.`:` ${ddmEsc(m.name)} goes to the reserve.`):''}</div>`:'<div class="ddm-dim">Pick one to look at him.</div>'}
      <div class="ddm-row"><button type="button" class="ddm-btn grey" data-a="back">‹ BACK</button><button type="button" class="ddm-btn" data-a="take"${!c||cost>R.medals?' disabled':''}>${tab==='rec'?'RECRUIT':'TO THE SQUAD'}</button></div></div>`;
  }else if(m){
    const order=right?['w','g','t']:['g','t','w'];
    h+=`<div class="ddm-name" data-follow="head"><b>${ddmEsc(m.name)}</b>${DDM_ROLE[m.role].toUpperCase()}</div>`+ddmStats(m,right?'l':'r');
    h+=`<div class="ddm-kit" data-follow="feet">${order.map(k=>{const I=DDM_ITEMS[m.gear[k]];return`<button type="button" data-a="kit" data-k="${k}" class="${ddm.swap===k?'on':''}${I.star?' star':''}"><i>${DDM_SLOT[k].toUpperCase()}${k==='w'?' · on the bunk':''}</i><b>${I.star?'★ ':''}${I.n}</b></button>`;}).join('')}</div>`;
    if(ddm.swap){const L=ddmSwapList(m,ddm.swap);
      h+=`<div class="ddm-swap" data-follow="under">${L.length?L.map((o,i)=>`<button type="button" class="ddm-it${o.star?' gold':''}" data-a="swap" data-i="${i}"><span><b>${o.star?'★ ':''}${o.n}</b> · ${o.from}</span><em>${o.verb}</em></button>`).join(''):`<div class="ddm-dim">Nothing else he can carry in this slot yet.</div>`}</div>`;}
    h+=`<div class="ddm-bar bot"><div class="ddm-row"><button type="button" class="ddm-btn grey" data-a="wide">‹ SQUADS</button><button type="button" class="ddm-btn grey" data-a="reserve"${R.reserve.length>=DDM_RES?' disabled':''}>RESERVE</button><button type="button" class="ddm-btn" data-a="replace">REPLACE</button></div></div>`;
  }else h+=`<div class="ddm-bar bot"><div class="ddm-dim">Alpha's bunks on the left, Bravo's on the right. Tap a man or his square; a + is an empty bunk.</div><button type="button" class="ddm-btn${(R.stage||0)===1?'':' grey'}" data-a="out">${(R.stage||0)===1?'LEAVE THE BARRACKS ▸':'‹ BACK TO THE BASE'}</button></div>`;
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
  for(const u of r.men.slice())if(want[u.slotK]!==u.rm){if(u.m.g.parent)u.m.g.parent.remove(u.m.g);r.men.splice(r.men.indexOf(u),1);}
  for(const k in want)if(!r.men.some(u=>u.slotK===k)){const t=k[0],i=+k[1],s=t==='A'?-1:1,m=want[k],tw=[.2,-.1,.3,-.22][i];
    const u={side:'P',team:t,id:t+(i+1),name:m.name,x:s*31,y:DDM_BY[i]+9,ang:(s<0?.45:Math.PI-.45)+tw*s,path:[],hp:100,level:m.level,weapon:DDM_ITEMS[m.gear.w].weapon,spec:null,specN:0,lx:0,ly:0,atEase:true,cloth:DD_US,ddRole:m.role,slotK:k,rm:m,stats:{}};
    makeSoldier(u);moveMesh(u,r.grp);ddDayFig(u);u.m.g.position.set(u.x,0,u.y);u.m.g.rotation.y=-u.ang;u.m.g.traverse(o=>{o.frustumCulled=false;});
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

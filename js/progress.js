"use strict";
/* Squad progression: XP earned per mission, levels and ranks (a new rank every 10 levels), saved in this browser,
   and the after-action report shown on mission complete. Higher level = small boosts: aim and resistance to
   being pinned (see rankAim / rankNerve, used in combat.js). Skills come later. */
const RANKS=[   // Bryan's ladder, one rank per 10 levels
  ['Private','PVT'],['Private First Class','PFC'],['Corporal','CPL'],['Sergeant','SGT'],['Gunnery Sergeant','GYSGT'],
  ['Master Sergeant','MSGT'],['First Sergeant','1SGT'],['Master Gunnery Sergeant','MGYSGT'],['First Major','1MAJ'],
  ['Master Major','MMAJ'],['Commander','CMDR'],
];
function rankOf(level){const r=RANKS[Math.min(RANKS.length-1,Math.floor(level/10))];return{name:r[0],ab:r[1]};}
// XP to go from level n to n+1 grows by 15 each level, so ranks take longer and longer
function xpToReach(level){const n=level-1;return 100*n+15*n*(n-1)/2;}
function levelOf(xp){let l=1;while(xp>=xpToReach(l+1))l++;return l;}
function rankAim(u){return(u.level-1)*0.002;}            // +0.2 % hit chance per level
function rankNerve(u){return 1-(u.level-1)*0.003;}       // suppression builds 0.3 % slower per level

const PROG_KEY='warehouseYard.squad.v1';
let progress={};
try{progress=JSON.parse(localStorage.getItem(PROG_KEY))||{};}catch(e){progress={};}
function xpOf(id){return progress[id]||0;}
function saveProgress(){try{localStorage.setItem(PROG_KEY,JSON.stringify(progress));}catch(e){}}
function resetProgress(){progress={};saveProgress();resetClasses();for(const p of players)p.level=1;buildCards();hud();}   // (the classes go too: classes.js)

// what a soldier earned this mission, itemised. The fallen earn nothing: they're lost.
function missionXP(u){
  const s=u.stats,parts=[];
  if(u.dead)return parts;
  const add=(n,label)=>{if(n>0)parts.push([n,label]);};
  add(s.kills*40,'kills');add(s.best>=2?(s.best-1)*25:0,'streak');add(s.revives*50,'revives');add(s.items*15,'items');add((s.ties||0)*30,'captures');add((s.labs||0)*20,'sabotage');add(60,'survived');
  add(alertMax===0?40:alertMax===1?20:0,'quiet');   // a quiet run: the base never went on alert, or only to Alert I (layers.js)
  return parts;
}
function statLine(u){
  const s=u.stats,pl=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
  const bits=[pl(s.kills,'kill')];
  if(s.best>=2)bits.push(`best streak ${s.best}`);
  if(s.revives)bits.push(pl(s.revives,'revive'));
  if(s.items)bits.push(pl(s.items,'grenade'));
  if(s.ties)bits.push(pl(s.ties,'capture'));
  if(s.labs)bits.push(pl(s.labs,'lab bench')+' wrecked');
  if(u.joined)bits.unshift(u.crew?'freed prisoner · stays at the HQ':'freed prisoner');   // (the HQ's crew from its taking on: base.js)
  bits.push(u.dead?'KIA':s.downs?`survived · downed ${s.downs}×`:'survived');
  return bits.join(' · ');
}

/* ---------- after-action report ---------- */
function showAAR(){
  const t=Math.floor(simT-mission.t0),mm=Math.floor(t/60),ss=String(t%60).padStart(2,'0');
  const roster=[...players,...(LEVEL===3?aarCrew:[])];aarCrew=[];   // (the freed men who stayed on at the HQ as its crew are still on its report: base.js)
  const kills=roster.reduce((n,p)=>n+p.stats.kills,0),kia=roster.filter(p=>p.dead).length;
  if(LEVEL===1){$('#aarSum').textContent=`Tutorial: the radio tower is down, in ${mm}:${ss}. ${kills} hostile${kills===1?'':'s'} down, ${kia?`${kia} of ours killed in action`:'no one lost'}.`;$('#aarBtn').textContent='On to Level 2';}
  else if(LEVEL===2){$('#aarSum').textContent=`Level 2: the power station is dark, in ${mm}:${ss}. ${kills} hostile${kills===1?'':'s'} down, ${kia?`${kia} of ours killed in action`:'no one lost'}. The Bio Lab's floodlights are out.`;$('#aarBtn').textContent='On to Level 3';}
  else $('#aarBtn').textContent='Continue';
  if(LEVEL===4){const R=l4Run||{},b=R.bonus||0;$('#aarSum').textContent=`Level 4: the old radio tower is powered on and the Queen is dead, in ${mm}:${ss}${R.finds&&R.finds.length?`; found ${R.finds.join(' and ')}`:''}${R.intel?'; the radio log says where the next mission is':''}. ${kills} kill${kills===1?'':'s'}, ${kia?`${kia} of ours killed in action`:'no one lost'}.${R.crawlerDead?' The Crawler is dead.':''} The Headquarters' radio room is on the air.`;}   // (level4.js)
  if(LEVEL===3)$('#aarSum').textContent=`${obj>=6?'The Headquarters taken: the Brood Mother and her brood are dead. All':obj>=5?'Warehouse, bridge, container yard and Bio Lab taken, drawbridge down,':'Warehouse and yard cleared'} in ${mm}:${ss}. ${kills} hostiles down, ${kia?`${kia} of ours killed in action`:'no one lost'}. ${alertMax?`The base reached ${ALERT_NAMES[alertMax]}.`:'The base never went on alert.'}${sciOut?` ${sciOut} of 4 scientists brought out, ${roster.filter(p=>p.joined).length} of 4 prisoners freed, ${office.labN} of 4 lab benches wrecked.`:''}${roster.some(p=>p.crew&&!p.dead)?' The freed men stay at the Headquarters as its crew.':roster.some(p=>p.kitted&&!p.dead)?' The freed men are kitted out and fight with the squad.':''}`;
  const rows=$('#aarRows');rows.innerHTML='';
  roster.forEach((u,i)=>{
    const before=xpOf(u.id),gain=missionXP(u).reduce((n,p)=>n+p[0],0),after=before+gain;
    progress[u.id]=after;
    const l0=levelOf(before),l1=levelOf(after),r0=rankOf(l0),r1=rankOf(l1);
    const pct=(xp,l)=>100*(xp-xpToReach(l))/(xpToReach(l+1)-xpToReach(l));
    const row=document.createElement('div');row.className='aar-row'+(u.dead?' kia':'');row.style.setProperty('--tc',teamCol(u));
    row.innerHTML=`<canvas class="aar-face" width="64" height="64"></canvas><div class="aar-main">`+
      `<div class="aar-head"><b>${u.id}</b><span class="aar-name">${u.name}</span><span class="aar-rank">${r0.ab} · Lv ${l0}</span></div>`+
      `<div class="aar-stats">${statLine(u)}</div>`+
      `<div class="aar-xp"><i style="width:${pct(before,l0)}%"></i></div>`+
      `<div class="aar-gain"><span>${u.dead?'Lost in action. No XP.':`+${gain} XP`}</span><em hidden></em></div></div>`;
    rows.appendChild(row);drawFace(row.querySelector('.aar-face'),u);
    if(u.dead)return;
    // fill the bar after a stagger; levelling up fills it, flashes, and carries on from empty
    const bar=row.querySelector('.aar-xp i'),badge=row.querySelector('em'),rank=row.querySelector('.aar-rank');
    const snd=(f,k)=>{if(typeof f==='function')f(k);};   // (the report's sounds: audio.js)
    setTimeout(()=>{
      if(l1===l0){bar.style.width=pct(after,l1)+'%';snd(window.sfxXpFill,(pct(after,l1)-pct(before,l0))/100);return;}
      bar.style.width='100%';snd(window.sfxXpFill,(100-pct(before,l0))/100);
      setTimeout(()=>{
        bar.style.transition='none';bar.style.width='0%';void bar.offsetWidth;bar.style.transition='';bar.style.width=pct(after,l1)+'%';
        snd(window.sfxLevelUp,r1.ab!==r0.ab);   // (the chime covers the bar's refill: no ticks under it)
        rank.textContent=`${r1.ab} · Lv ${l1}`;
        badge.textContent=r1.ab!==r0.ab?`Promoted: ${r1.name}`:l0<CLASS_LEVEL&&l1>=CLASS_LEVEL&&!classes[u.id]?(!classesOpen()?'Level up · Unlock HQ first':u.joined&&!u.kitted?'Level up':'Level up · choose his class at the HQ'):`Level up`;badge.hidden=false;   // (classes wait on the radio tower: classes.js)
      },850);
    },500+i*700);
  });
  saveProgress();
  for(const p of roster)p.level=levelOf(xpOf(p.id));
  $('#aar').hidden=false;
}

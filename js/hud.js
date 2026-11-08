"use strict";
/* DOM HUD: status chip, banner, squad rows, action buttons, keyboard, end screen. */
let bannerTimer=0;
function banner(text,ms=2400){const b=$('#banner');if(typeof placeBanner==='function')placeBanner();b.textContent=text;b.classList.add('show');clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>b.classList.remove('show'),ms);}
// the hint line's word on where to go, by where the squad is (Bryan: clearing areas is optional; the data center is the goal)
function objHint(){
  if(obj>=7)return roadHint();   // (the road east: road.js)
  if(obj===4)return'Take a scientist to the drawbridge\'s bio scanner (north-east): send a soldier to the panel by the moat.';
  if(obj>=5)return mon.out&&!mon.out.done?'Hold them off at the drawbridge: shoot the hunters when they crouch, step out of the violet line. Keep the scientists close.':'The gate is clear. Heal and restock at the medic station and ammo drop west of the drawbridge, then gather everyone in the green area at the drawbridge to go in.';   // (monsters.js)
  const ups=players.filter(p=>alive(p)&&!p.offMap),north=ups.some(p=>p.y<CANAL.y0);
  if(!north)return'Get into the data center, across the canal to the north-west. Ways over: the bridge (guarded), the sewer pipe to the west, or the broken rail bridge to the east. A sniper tower on the sidewalk at the road\'s west end, by the data center, watches its doors and up the road.';
  if(dcLocked())return'The data center\'s doors stay shut while the alarm is going or they\'re searching for you. Lose them, then tap the arrows at the doors.';
  return'The containers along the canal are the quiet way: weave north through the gaps, wait for the jeep on the road to pass, cross behind it, and keep to the strip west of the doors. The data center\'s front is heavily guarded. Tap the arrows at the front doors and everyone goes in.';
}
function setStatus(){
  const s=$('#status');
  if(state==='end'){s.className='chip';return;}
  const quiet=enemies.some(e=>!e.dead&&e.alerted&&!e.dormant&&!(MAPID==='l4'&&e.mon))?'Hunted':'Undetected';   // (not her brood asleep, or Level 4's monsters: they hunt everyone)   // hunted: they're searching for you (hunt.js)
  const hid=contact?[...new Set(players.filter(p=>alive(p)&&!p.offMap&&!caught(p)).map(p=>teamName(p.team)))]:[],cTxt=hid.length?hid.join(' & ')+' hidden':'Contact';   // (one team caught, the other still covert: hunt.js)
  if(wave.phase==='hq'){s.textContent=contact?cTxt:obj>=6?quiet:obj>=5?'Bridge down':quiet;s.className='chip'+(contact?' contact':'');return;}
  if(wavePhase('clear','count')){s.textContent=wave.phase==='count'?'Incoming':'All clear';s.className='chip'+(wave.phase==='count'?' contact':'');return;}
  s.textContent=contact?cTxt:quiet;s.className='chip'+(contact?' contact':'');
}
function finish(){
  if(typeof tutStop==='function'&&MAPID==='l1')tutStop();
  if(LEVEL===2){$('#endEyebrow').textContent='Mission failed';$('#endTitle').textContent='Squad lost';state='end';setStatus();$('#status').textContent='Lost';$('#endText').textContent='The squad went down. Try again: the hole in the fence on the west side is the quiet way in, and a Breach takes the control building.';$('#againBtn').textContent='Try Level 2 again';$('#retryBtn').hidden=true;$('#end').hidden=false;return;}   // (level2.js)
  const win=players.some(alive)&&(wave.phase==='hq'?obj>=5:enemies.every(beaten));
  state='end';setStatus();$('#status').textContent=win?'Secured':'Lost';
  if(win){bigText('Mission complete!','complete');setTimeout(showAAR,2600);return;}   // then the after-action report, then the HQ
  const t=Math.floor(simT),mm=Math.floor(t/60),ss=String(t%60).padStart(2,'0');
  const kia=players.filter(p=>p.dead).length;
  $('#endEyebrow').textContent=win?'Mission complete':'Mission failed';
  $('#endTitle').textContent=win?'Warehouse secured':'Squad lost';
  if(LEVEL===4&&!win){$('#endTitle').textContent='Squad lost';$('#endText').textContent='The squad went down on the hill. Retry from the last save: the stairs are the quiet way up; the lift wakes the brood and brings their men to the bunker. Split the teams and one can stay hidden.';refreshSaveButtons();$('#end').hidden=false;return;}   // (level4.js)
  if(LEVEL===1&&!win){$('#endText').textContent='The squad went down. Try again: keep to cover, and let the guards come to you.';$('#againBtn').textContent='Try Level 1 again';$('#retryBtn').hidden=true;$('#end').hidden=false;return;}
  $('#endText').textContent=win
    ?`Cleared in ${mm}:${ss}. ${downCount} time${downCount===1?'':'s'} a soldier went down, ${kia} killed in action.`
    :`The squad held out for ${mm}:${ss}. Try pinning one side of the room (hold your finger on an enemy to suppress him) while a fire team works around to the west window or the east door.`;
  refreshSaveButtons();$('#end').hidden=false;
}
/* ---------- HUD ---------- */
// our soldier hit: the screen's edge flashes red and fades (k 0..1)
function hitCue(k){const el=$('#hitFlash');if(!el)return;el.style.transition='none';el.style.opacity=Math.max(+el.style.opacity||0,k).toFixed(2);void el.offsetWidth;el.style.transition='opacity .7s ease-out';el.style.opacity='0';}
function hud(){
  updateCards();
  const act=sel.filter(alive);
  $('#pauseBtn').textContent=paused?'Resume':'Pause';
  {const gb=$('#gaitBtn'),forced=act.some(u=>u.gaitForce),g=act.length?gaitOf(act.find(u=>u.gaitForce)||act[0]):'sneak';
   gb.disabled=!act.length;gb.classList.toggle('on',forced);gb.setAttribute('aria-pressed',forced);
   gb.querySelector('span').textContent=g==='sneak'?'Sneak':'Run';gb.querySelector('small').textContent=forced?'Manual':'Auto';
   gb.setAttribute('aria-label',`${g==='sneak'?'Sneaking':'Running'}, ${forced?'manual':'automatic'}. Press to ${forced?'go back to automatic':g==='sneak'?'run':'sneak'}.`);
   if(act.some(u=>u.carry||u.cargo)){   // carrying a man (or one of Level 4's parts): the same spot becomes Put down
     gb.disabled=false;gb.classList.add('on');gb.removeAttribute('aria-pressed');
     gb.querySelector('span').textContent='Put down';gb.querySelector('small').textContent='Carrying';gb.setAttribute('aria-label','Put the carried soldier down here');}
   if(selCrew().length){   // crew selected: the same spot becomes the Dismount button
     gb.disabled=false;gb.classList.add('on');gb.removeAttribute('aria-pressed');
     gb.querySelector('span').textContent='Dismount';gb.querySelector('small').textContent='Vehicle';gb.setAttribute('aria-label','Dismount the selected soldiers from the jeep');}}
  const ts=timeScale();
  const sp=$('#speed');sp.hidden=!(state==='play'&&ts<1);sp.textContent=paused?'Paused':'Slow-mo';
  let h;
  if(ptr&&ptr.kind==='lasso')h='Draw a loop round the soldiers you want.';
  else if(ptr&&ptr.kind==='draw')h=`Draw ${ptr.unit.name}'s route. Lift your finger to go. The end settles on cover nearby.`;
  else if(mode==='charge')h='Tap a fuel tank. He plants the charge, then runs clear. Tap C4 on his card again to cancel.';
  else if(mode==='grenade'&&sel[0]&&sel[0].gl)h=`Tap where to fire the M203: a bigger blast than a frag. Inside the dashed circle (${M203.range/10} m) he fires from where he is; further off, or round a corner, he walks up to ${NADE_WALK/10} m to where he can first, a safe spot if there is one (pinned, he won't leave his spot). ${sel[0].grenade} round${sel[0].grenade===1?'':'s'} left; ammo drops refill them. Tap the M203 on his card again to cancel.`;   // (Level 4's find: combat.js)
  else if(mode==='grenade')h=`Tap where to throw. Inside the dashed circle he throws from where he is; further off, or round a corner, he walks up to ${NADE_WALK/10} m to where he can first, a safe spot if there is one (pinned, he won't leave his spot). Tap the grenade on his card again to cancel.`;
  else if(mode==='rpg')h=`Tap where to fire the rocket (big blast; not closer than 6 m). Inside the dashed circle with nothing in the way he fires from where he stands; out to the dotted one he moves up to ${ACT_R/10} m first, to where he can; further is too far (pinned, he won't leave his spot). ${sel[0]?sel[0].specN:0} left. Tap the RPG on his card again to cancel.`;
  else if(mode==='binos')h=`Tap a spot he can see, inside the circle (out to the dotted one he moves up to ${ACT_R/10} m first): every hostile within ${SKILL.binos.r/10} m of it that he has a line to is marked for the whole squad for ${SKILL.binos.mark} s. Tap the binoculars again to cancel.`;
  else if(mode==='flash')h=`Tap where to throw the flashbang, inside the circle (out to the dotted one he moves up to ${ACT_R/10} m first): ${SKILL.flash.fuse} s later everyone within ${SKILL.flash.r/10} m who sees it is stunned for ${SKILL.flash.stun} s and can't shoot. Loud. Throw it through a door, then go in.`;
  else if(mode==='noise')h=`Tap where to throw it, inside the circle (out to the dotted one he moves up to ${ACT_R/10} m first): unaware hostiles within ${SKILL.noise.r/10} m who hear it go over to look, then back. Tap the button again to cancel.`;
  else if(mode==='build')h='Tap where to set up a barricade, inside the circle: heavy cover the squad can shoot over, across the line to the threat. He can pack it up and move it on (tap it with him selected). Tap the kit again for a wall. Inside, tap a shut door to bar it: then it only opens by being kicked in.';
  else if(mode==='buildwall')h=`Tap where to build a wall, inside the circle: taller than a man, it blocks sight, shots and blasts (${BUILD.wall.cost} build kits). It stays. Tap the kit again to cancel.`;
  else if(mode==='medkit')h='Tap a hurt teammate, or him, to heal him to 100 (3 s), or a downed one to get him up (5 s); not while pinned. Tap the kit again to cancel.';
  else if(mode==='silent')h=`Tap a hostile marked SILENT SHOT (one who hasn't noticed you, within 20 m): an aimed quiet shot. ${sel[0]?sel[0].specN:0} left on the silencer. Tap it again to cancel.`;
  else if(mode==='smoke')h=`Tap where to throw smoke. Inside the dashed circle he lobs it from where he stands, over low cover; out to the dotted one, or round a corner, he moves up to ${ACT_R/10} m first, to where he can; further is too far (pinned, he won't leave his spot). Nobody sees through it, either way, for about 12 s. Tap the smoke on his card again to cancel.`;
  else if(act.length===1&&act[0].cargo&&!preview)h=`${act[0].name} is carrying ${act[0].cargo.name}: slow, and he can't shoot. Get it to the zip line on the summit's south edge. Put down is bottom right.`;   // (level4.js)
  else if(act.length===1&&act[0].carry&&!preview)h=`${act[0].name} is carrying ${act[0].carry.name}: get him into a medic station's green ring. He moves slowly and can't shoot. Put down is bottom right.`;
  else if(act.length&&!preview&&players.some(p=>p.critical&&!p.dead&&!p.carriedBy&&!p.offMap))h='A soldier is critical: tap him with a medic (the red kit on a card) selected, or anyone to carry him to a medic station.';
  else if(act.length===1&&act[0].onTower&&!preview)h=act[0].weapon==='sniper'?`${act[0].name} is up the tower with the sniper rifle: he sees 70 m the way he faces (all round while he's the one selected). Tap the gun on his card to swap back to his ${WEAPON[act[0].weapon2||'rifle'].label}. Any move order brings him down first.`:`${act[0].name} is up the tower. Any move order brings him down first.`;
  else if(!preview&&enemies.some(e=>e.surr&&!e.tied&&!e.dead&&e.vis&&!offFloor(e)))h=act.length?'A hostile has surrendered: tap him to zip-tie him (2 s beside him).':'A hostile has surrendered: select a soldier, then tap him to zip-tie him.';   // (layers.js)
  else if(selCrew().length&&!preview)h='Tap the ground, then tap again to drive there. Tap a hostile to line the gun up on him. Dismount is bottom right.';
  else if(MAPID==='l1'&&!preview&&!act.length)h=l1Hint();   // (level1.js)
  else if(MAPID==='l2'&&!preview&&!act.length)h=l2Hint();   // (level2.js)
  else if(MAPID==='hq'&&!preview&&!act.length)h=hqHint();   // (fortress.js)
  else if(MAPID==='in'&&!preview&&!act.length)h=officeHint();   // (office.js)
  else if(wave.phase==='hq'&&!preview&&!act.length){const o=objHint();h=o+(o&&HQ_ZONES.length&&!/medic station/.test(o)?' Heal and refill at a checkpoint\'s medic station and ammo drop.':'');}   // (unless it says so already)
  else if(wave.phase==='count'&&!preview)h='A counterattack is coming over the bridge from the north. Get the squad into cover facing it.';
  else if(preview)h='Green is in cover, red is exposed. Tap the marker again to move.';
  else if(!act.length)h='Drag the map to look around. Tap a team tab or a soldier to select. Hold empty ground to lasso.';
  else if(act.length===1&&enemies.some(e=>canTakedown(act[0],e)))h=`A hostile has his back to ${act[0].name}: tap him (TAKEDOWN) to sneak up and take him out silently.`;
  else if(act.length===1&&act[0].onGun&&!preview)h=`${act[0].name} is on the pillbox gun: once you're in contact he fires at anything in its swing. Any move order takes him off it.`;
  else if(volley&&volley.at==null&&act.some(u=>volley.by.includes(u)||volley.movers.includes(u)))h=volley.movers.length?'Moving up for a clear shot: they fire together when everyone\'s set. Tap him again to fire now.':'On him: they fire together on the count. Tap a second hostile and they split, one each.';
  else if(act.length>1&&enemies.some(e=>canVolley(act,e)))h='Silencers: tap a hostile marked SILENT SHOT and they all take him at once, quietly.';
  else if(act.length===1&&enemies.some(e=>canSilent(act[0],e)))h=act[0].weapon==='m4s'?`${act[0].name}'s rifle is silenced: tap a hostile marked SILENT SHOT to drop him quietly. A miss alerts him.`:`${act[0].name}'s silencer: tap a hostile marked SILENT SHOT to drop him quietly (${act[0].specN} left). A miss alerts him.`;
  else if(act.length===1)h=`Drag from ${act[0].name} to draw his route, or tap ground to send him. Grenade is on his card.`;
  else if(breachSpot()){const m=breachSpot();h=shutDoorAt(m&&m.door)?'BREACH at the door: tap it and the team stacks up either side, kicks it in and goes in together, catching them off guard. Or walk in, or tap the door: they open it quietly.':'BREACH at the doorway: tap it and the team stacks up either side, then goes in together with a quick edge.';}
  else h=act.some(caught)?'Tap the ground to preview positions. Tap an enemy to focus fire, hold on one to suppress him.':contact?'They haven\'t seen this team: it sneaks and holds fire. Tap a hostile to open fire (an ambush), or slip round them.':'Tap the ground to preview positions. Tap a hostile to open fire, hold on one to suppress him.';
  $('#hint').textContent=h;
  {const ob=$('#obj');if(ob)ob.hidden=state!=='play';}
}
// detection indicator, updated every frame
let alertShown=-1;
function alertMeter(){
  const el=$('#alert');el.hidden=state!=='play'||wavePhase('clear','count','done')||!enemies.some(e=>!beaten(e))||threatOn();if(el.hidden)return;   // the countdown takes its place (and a radio call or reinforcements: hunt.js)
  const a=detection(),k=Math.round(a*100);
  if(k===alertShown)return;alertShown=k;
  el.classList.toggle('spotted',a>=1);el.classList.toggle('hot',a>=0.7&&a<1);
  // faint and see-through at first; more solid, redder, brighter and glowing as he closes in on finding you
  const c=Math.pow(a,1.4),lerp=(p,q)=>p+(q-p)*c;
  const arc=$('#alertArc');arc.setAttribute('stroke-dashoffset',(94.25*(1-a)).toFixed(2));arc.style.opacity=a>0.005?1:0;
  arc.setAttribute('stroke',`rgba(255,${lerp(225,52)|0},${lerp(215,36)|0},${lerp(.5,1).toFixed(2)})`);
  const ring=el.querySelector('.ring');
  ring.style.fill=`rgba(${lerp(0,110)|0},${lerp(0,8)|0},${lerp(0,4)|0},${lerp(.22,.42).toFixed(2)})`;
  ring.style.stroke=`rgba(255,${lerp(255,90)|0},${lerp(255,80)|0},${lerp(.1,.3).toFixed(2)})`;
  el.querySelector('svg').style.filter=c>0.02?`drop-shadow(0 0 ${(1+7*c).toFixed(1)}px rgba(255,45,30,${(.9*c).toFixed(2)}))`:'none';
  el.setAttribute('aria-label',a>=1?'Spotted':`Detection ${k}%`);
}
function startView(){zoom=2.4;yaw=0;tilt=0;camT={x:190,z:760};clampCam();updateCamera();}
function bindHud(){
  // team tabs toggle: pressing the tab of the group that's already selected deselects it
  const tabSelect=list=>{if(state!=='play'||(typeof endingBusy==='function'&&endingBusy()))return;const on=list.length&&sel.length===list.length&&list.every(u=>sel.includes(u));if(on)select([]);else if(!selectAway(list))return;preview=null;mode=null;hud();};   // (a team somewhere else: the camera goes to them, not while the men on screen are under fire: input.js)
  // (Level 1's tutorial lets through only what its step or tip asks for: tutAllows in level1.js; the camera, Pause and Fit map always work)
  for(const tab of document.querySelectorAll('.tab[data-team]'))tab.addEventListener('click',()=>{if(tutAllows('tab',tab.dataset.team))tabSelect(players.filter(p=>p.team===tab.dataset.team&&alive(p)));});
  $('#allBtn').addEventListener('click',()=>{if(tutAllows('tab','all'))tabSelect(players.filter(alive));});
  const gaitOrDismount=()=>{if(state!=='play'||!tutAllows('btn','gait'))return;const cr=sel.filter(u=>u.carry||u.cargo),c=selCrew();if(cr.length){for(const u of cr){if(u.carry)putDown(u);else dropCargo(u);}}else if(c.length){const out=dismount(c);if(out.length)select(out);}else toggleGait();hud();};   // the ones who got out stay selected, ready to move   // one soldier on his own: out he gets, gunner included
  $('#gaitBtn').addEventListener('click',gaitOrDismount);
  $('#clearBtn').addEventListener('click',()=>{if(!tutAllows('btn','clear'))return;if(mode||preview){mode=null;preview=null;}else select([]);hud();});
  $('#pauseBtn').addEventListener('click',()=>{if(state!=='play')return;paused=!paused;hud();});
  $('#continueBtn').addEventListener('click',()=>{continueGame();});
  $('#retryBtn').addEventListener('click',()=>{continueGame();});
  $('#startBtn').addEventListener('click',()=>showEquip(startLevel3,'Next: Level 3 · The Data Center'));   // the loadout first (equip.js)
  $('#l2Btn').addEventListener('click',()=>showEquip(startLevel2,'Next: Level 2 · Lights Out'));   // (level2.js)
  $('#l1Btn').addEventListener('click',()=>startLevel1());
  // two starts (Bryan, after v116: "can we make a start in HQ after the battle, and starting the old radio tower mission as two
  // separate start points?"): Level 3's end, inside the Headquarters just after the Brood Mother's death (save.js's 'won',
  // fortress.js's hqAftermath: the fetch, the talk, the clean-up), and Level 4 from the finished Headquarters before the
  // squad's first trip out, so the talk by the drawbridge and the first crossing of the bridge come first (save.js's 'base',
  // road.js's roadIntro); in v112 to v116 the Level 4 button did the first
  {const b=$('#afterBtn');if(b)b.addEventListener('click',()=>startCheckpoint('won'));}
  {const b=$('#l4Btn');if(b)b.addEventListener('click',()=>startCheckpoint('base','Level 4 · The Old Radio Tower. Tap the arrows at the south door to head out.'));}
  // the tutorial's bubble: a tap carries on from a notice or hides it (and stops there, so it never moves anyone); its button
  // turns the tutorial or the tips off; the "?" brings it back
  $('#tut').addEventListener('click',e=>{
    if(e.target.closest('.tskip')){const camp=!!tutStep();tutStop();tut.skipped=true;banner(camp?'Tutorial off. The hint line at the bottom still says what to do.':'Tips off.',2600);return;}
    if(MAPID==='l1')tutTap();else $('#tut').hidden=true;   // (outside Level 1 it's the checkpoint's tour: hq.js)
  });
  $('#tutPin').addEventListener('click',()=>{tut.hid=false;tutShow();});
  $('#aarBtn').addEventListener('click',()=>{$('#aar').hidden=true;if(LEVEL===1){showEquip(startLevel2,'Next: Level 2 · Lights Out');return;}if(LEVEL===2){showEquip(startLevel3,'Next: Level 3 · The Data Center');return;}if(LEVEL===4)LEVEL=3;state='play';endAt=0;updateObjUI();hud();});   // (after Level 4's: back on the road east, at the bridge: level4.js)   // after Level 1's report: the squad at sea and the loadout (equip.js), then Level 2   // after Level 1's report: on to Level 2   // the one report comes at the end of the mission
  $('#hqBtn').addEventListener('click',hqGotIt);
  {const ob=$('#obj'),tg=()=>{if(ob.classList.contains('nm')){if(ob.classList.contains('min'))objNMShow();else objNMHide();return;}   // (the next mission: open it, or close it: mission.js)
    ob.classList.toggle('open');ob.setAttribute('aria-expanded',ob.classList.contains('open'));};ob.addEventListener('click',tg);ob.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tg();}});}
  $('#resetXpBtn').addEventListener('click',()=>{resetProgress();banner('Squad XP and ranks reset.',1600);});
  $('#againBtn').addEventListener('click',()=>{if(LEVEL===1){startLevel1(true);return;}if(LEVEL===2){startLevel2(true);return;}startLevel3();});
  addEventListener('keydown',e=>{
    if(state!=='play')return;
    if(e.code==='Space'){e.preventDefault();paused=!paused;hud();}
    else if(e.key==='g'||e.key==='G'){POST.manual=true;postTier((POST.tier+2)%3);banner(['Graphics: plain','Graphics: medium','Graphics: full'][POST.tier],1400);}
    else if(e.key==='Escape'){$('#clearBtn').click();}
    else if(e.key==='r'||e.key==='R')gaitOrDismount();
    else if(e.key==='q'||e.key==='Q')turnCam(-Math.PI/12);else if(e.key==='e'||e.key==='E')turnCam(Math.PI/12);
    else if(e.key==='1'){if(tutAllows('tab','A')){selectTeam('A');hud();}}else if(e.key==='2'){if(tutAllows('tab','B')){selectTeam('B');hud();}}
  });
}

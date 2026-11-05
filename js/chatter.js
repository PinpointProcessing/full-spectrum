"use strict";
/* Squad talk (Bryan: the voices sounded lifeless and repetitive; he wanted them talking to each other, not just announcing).
   - Exchanges: a line and a reply between two men, by name, from what's happening: a group move ("Kowalski, on me." /
     "Right behind you, Reyes."), first contact with where the enemy is ("Contact, two o'clock!" / "Return fire!"), a man
     down ("Hayes is down!" / "Hang on, Hayes, I've got you.") and his thanks when he's back up, a good kill, a takedown
     (whispered), a guard who heard something ("Freeze." ... "Okay, we're clear."), a body found, a radio man, a dog,
     reinforcements, a grenade, the area secured, a check-in once the shooting stops ("Okafor, you good?" / "Took a hit.
     I'm okay."), freeing a prisoner, detaining a scientist, the bio scanner.
   - Banter: short conversations in quiet spells (nobody hunting the squad, nobody hostile near), picked by where they are
     in the mission (after the warehouse, in the maze, with the freed men, with the scientists...), each once.
   - Lines play one after another (chatTick, every frame); the squad's go over the radio, the freed men's out loud; the
     words show over the speaker. Every line is voiced: tools/voices makes the clips from the lists here. */
const SQUAD_NAME={A1:'Reyes',A2:'Kowalski',B1:'Hayes',B2:'Okafor',A3:'Abara',A4:'Brennan',B3:'Lindqvist',B4:'Marsh'};
// lines about or to someone ({N}: his name), voiced for each speaker and the others he'd say them to (tools/voices: the freed men
// have fewer; a line nobody recorded is just skipped)
const NAMED={
  down:  ['{N}\'s down!','{N} is hit!'],
  gotyou:['Hang on, {N}, I\'ve got you.'],
  thanks:['Thanks, {N}. I owe you.'],
  nice:  ['Nice shot, {N}.'],
  onme:  ['{N}, on me.','{N}, with me. Let\'s go.'],
  follow:['Right behind you, {N}.','On you, {N}.'],
  check: ['{N}, you good?'],
};
// lines with no names (voiced for every speaker); QUIET ones are said low (stealth)
const CHAT={
  fine:     ['Good to go.','Still breathing.','All good here.'],
  hurt:     ['Took a hit. I\'m okay.','Scratched up, but I\'m good.','I\'ll live.'],
  bad:      ['I need a medic.','I\'m hurt bad.','Not great. I\'m bleeding.'],
  engage:   ['Return fire!','Light them up!','Get into cover and return fire!'],
  hush:     ['Hold up.','Easy... stay low.','Freeze. He heard something.'],
  clear:    ['Okay... we\'re clear.','He\'s settling down. Move.','Clear. Go.'],
  tkdone:   ['Clean.','He\'s down. Quiet.','Got him.'],
  tknice:   ['Nice and quiet.','Smooth.','Good work.'],
  bodyfound:['Damn, they found the body.','They found him. Stay low.','They\'re onto us. Keep your heads down.'],
  secured:  ['Area secure.','We\'re clear here.','That\'s the area. Regroup.'],
  regroup:  ['Copy. Grab what you need at the boxes.','Heal up, we move in a minute.','Good work. Take a breather.'],
  radio:    ['He\'s on the radio! Drop him!','Radio man! Take him out!','Stop that call!'],
  reinf:    ['Reinforcements inbound!','More of them coming!','They\'re sending more!'],
  dog:      ['Dog! Dog!','They\'ve got a dog!','Watch the dog!'],
  fragwarn: ['Grenade! Move!','Get clear, grenade!','Grenade, grenade!'],
  free:     ['Hold still, we\'re getting you out.','Easy. You\'re coming with us.','On your feet. You\'re free.'],
  sci:      ['Hands. Now. You\'re coming with us.','Stay behind me and you live.','Move. Don\'t try anything.'],
  scan:     ['Hand on the glass. Now.','Do it.','Open it.'],
  covering: ['Covering! Move!','I\'ve got you covered!','Go, go, I\'ve got you!'],
  movingcov:['Moving!','Going!','Moving under cover!'],
  // what they see on the way (Bryan: the voices should teach the map too); TUT: only the first four have these
  bridge:   ['The bridge is covered. Machine gun and a pillbox.','They\'ve got the bridge locked down.','Bridge is a kill zone. We need another way, or we hit them hard.'],
  pipe:     ['There\'s a drain pipe west of the bridge. We can crawl through.','Sewer pipe on the left. Quiet way across.','West side, the pipe. Nobody watches it.'],
  dark:     ['Let\'s go dark. Nobody fires unless I say.','Stay quiet. Silencers first.','Keep it quiet. Takedowns where we can.'],
  sniper:   ['Sniper in the tower! Stay out of his sights.','Watch the tower. Sniper.','Tower! Sniper! Keep your heads down.'],
  sniperdown:['Sniper\'s down. That rifle\'s ours if we want it.','Tower\'s clear. Grab his rifle.','He dropped the rifle. Somebody pick it up.'],
  gotrifle: ['Got the sniper rifle.','Sniper rifle. Now we\'re talking.','I\'ve got his rifle. I\'ll cover you.'],
  tower:    ['Get up in that tower. You\'ll see the whole yard.','From the tower I can cover the whole approach.','The tower. Best view on the map.'],
  vehicle:  ['Vehicle! Turret on top. Stay off the road.','Gun truck coming. Get out of its way.','Armored truck! Don\'t let it see you.'],
  killfield:['That\'s open ground in front of the building. We\'d be cut to pieces.','No cover out there. Go round, or take out the guns first.','Killing field. We don\'t cross that in the open.'],
  maze:     ['The containers on the left. We can slip through quiet.','Stick to the containers. Out of sight.','Left side, through the containers. Stay low.'],
  patrol:   ['Patrol, moving left. Let them pass.','Foot patrol. Wait for them to go by.','Patrol coming through. Hold still.'],
  dclock:   ['Not while they\'re looking for us. Lose them first.','They\'re on alert. We wait until it calms down.','Too hot. Let them settle, then we go in.'],
  dcopen:   ['They\'ve settled down. The door\'s ours.','Quiet now. Let\'s get inside.','We\'re clear to go in.'],
  mgman:    ['I\'m on the gun!','Manning the machine gun.','The pillbox gun is ours.'],
  rpgout:   ['Rocket out!','Backblast clear!','Firing the RPG!'],
  nadego:   ['Moving to throw.','Getting an angle.','Moving up for the frag.'],
  nadeno:   ['Can\'t get a clean throw from here.','No angle. I\'d have to cross open ground.','Too exposed. I can\'t get there.'],
  volley:   ['On my mark. Three, two, one.','Together. Now.','Sync shots. Take them.'],
  volleyok: ['Both down. Clean.','Nobody heard a thing.','Good shooting. Quiet.'],
};
const QUIET=new Set(['hush','clear','tkdone','tknice','dark','maze','patrol','volley','volleyok','pipe','tower','dcopen']);
const TUT=new Set(['bridge','pipe','dark','sniper','sniperdown','gotrifle','tower','vehicle','killfield','maze','patrol','dclock','dcopen','mgman','rpgout','nadego','nadeno','volley','volleyok']);   // (voiced for A1-B2 only)
// contact with a direction: the clock round where he's facing, and one or more of them
const CLOCK={12:'twelve',2:'two',3:'three',4:'four',6:'six',8:'eight',9:'nine',10:'ten'};
const CDIR={one:'Contact, {D} o\'clock!',many:'Contact! Tangos, {D} o\'clock!'};
// banter in quiet spells: who says what; when: which part of the mission ('any' fits anywhere outdoors)
const BANTER=[
 {when:'any',lines:[['A2','Remind me why I re-upped.'],['A1','The food.'],['A2','Right. The food.']]},
 {when:'any',lines:[['B1','Is it ever going to stop raining?'],['B2','Rain\'s a friend tonight. It covers our noise.']]},
 {when:'any',lines:[['B1','Okafor. You ever get used to this?'],['B2','No. You just get better at hiding it.']]},
 {when:'any',lines:[['A1','Check your mags. Nobody runs dry out here.'],['A2','Wasn\'t planning to.']]},
 {when:'any',lines:[['B2','Quiet out here.'],['A2','Too quiet. Keep your eyes open.']]},
 {when:'wh',lines:[['B1','That went better than I thought.'],['A2','Don\'t jinx it, kid.']]},
 {when:'wh',lines:[['A1','Warehouse is ours. Bridge is next.'],['B2','They\'ll have heard by now. Stay sharp.']]},
 {when:'br',lines:[['B1','Did you see that moat? It just keeps going down.'],['A2','Don\'t look at it. Look at the containers.']]},
 {when:'br',lines:[['B2','Those containers are a maze.'],['A1','Then we take it one corner at a time.']]},
 {when:'yard',lines:[['A2','Why does a data center need a machine gun nest?'],['A1','Because it isn\'t a data center.']]},
 {when:'yard',lines:[['B1','What do you think they keep in there?'],['B2','Something worth guarding with an army.']]},
 {when:'dco',lines:[['A1','Inside, it\'s close quarters. Doorways first.'],['B1','Doorways first. Copy.']]},
 {when:'pris',lines:[['A3','Three months in that cell. Feels good to hold a rifle again.'],['B4','Save the speeches, Abara. Eyes on the corners.']]},
 {when:'pris',lines:[['B1','How long were you down there?'],['B3','Long enough to hear what they kept below us.'],['B1','What did they keep?'],['B3','Pray you don\'t find out.']]},
 {when:'pris',lines:[['A4','I didn\'t think anyone was coming.'],['B2','We\'re here now. Stay close.']]},
 {when:'pris',lines:[['B4','Reyes. When this is done, I\'m buying.'],['A1','I\'ll hold you to that, Sergeant.']]},
 {when:'sci',lines:[['B1','What\'s he so scared of?'],['B2','Something worse than us, apparently.']]},
 {when:'sci',lines:[['A2','He keeps saying we\'re all going to die.'],['A1','He\'s not wrong. Just not tonight.']]},
 {when:'scip',lines:[['B3','Listen. Can you hear that? Behind the gate.'],['A2','It\'s the wind.'],['B3','It\'s not.']]},
 {when:'in',lines:[['B1','This place gives me the creeps.'],['A2','Then stop talking about it.']]},
];
let talkQ=[],chatCD={},banterT=0,banterUsed=new Set(),hushBy=null,tutSaid=new Set(),tutT=0;
function resetChatter(){talkQ=[];chatCD={};banterT=0;banterUsed=new Set();hushBy=null;tutSaid=new Set();tutT=0;}
const up=u=>!!u&&alive(u)&&!u.offMap;
const pick=n=>1+((Math.random()*n)|0);
let chatWho='';   // (whose turn it is for nextVariant)
const partnerOf=u=>{const m={A1:'A2',A2:'A1',B1:'B2',B2:'B1',A3:'A4',A4:'A3',B3:'B4',B4:'B3'}[u.id];return players.find(p=>p.id===m&&up(p))||players.filter(p=>p!==u&&up(p)&&p.team===u.team).sort((a,b)=>hyp(a.x-u.x,a.y-u.y)-hyp(b.x-u.x,b.y-u.y))[0]||null;};
const nearestTo=(x,y,but=[])=>players.filter(p=>up(p)&&!but.includes(p)).sort((a,b)=>hyp(a.x-x,a.y-y)-hyp(b.x-x,b.y-y))[0]||null;
const leaderOf=(but=[])=>players.find(p=>p.id==='A1'&&up(p)&&!but.includes(p))||players.find(p=>p.id==='B1'&&up(p)&&!but.includes(p))||players.find(p=>up(p)&&!but.includes(p))||null;
// a line: who says it, its clip, the words, quiet or not
const L=(u,clip,text,quiet)=>u&&{u,clip,text,quiet};
const hasClip=(id,clip)=>!VSPR||!!(VSPR.speakers[id]&&VSPR.speakers[id].clips[clip]);
const named=(u,key,about,n)=>{
  if(!u||!about)return null;const N=NAMED[key].length;let k=n||nextVariant(u.id,key+about.id,N);
  for(let i=0;i<N&&!hasClip(u.id,`${key}_${about.id}_${k}`);i++)k=k%N+1;   // (the freed men have fewer versions: one he has)
  if(!hasClip(u.id,`${key}_${about.id}_${k}`))return null;return L(u,`${key}_${about.id}_${k}`,NAMED[key][k-1].replace('{N}',about.name).replace(/s's\b/,'s is'));   // ("Hayes's down" on screen as "Hayes is down")
};
const canSay=(u,key,about)=>!!u&&!!about&&NAMED[key].some((_,i)=>hasClip(u.id,`${key}_${about.id}_${i+1}`));
const gen=(u,key,n)=>{if(!u)return null;const k=n||nextVariant(u.id,'chat'+key,CHAT[key].length);if(!hasClip(u.id,`chat_${key}_${k}`))return null;return L(u,`chat_${key}_${k}`,CHAT[key][k-1],QUIET.has(key));};
// a line only the first four have (TUT): from whoever of them is up and nearest, or the lead
const tutBy=(x,y)=>players.filter(p=>up(p)&&!p.joined).sort((a,b)=>hyp(a.x-x,a.y-y)-hyp(b.x-x,b.y-y))[0]||null;
// queue an exchange (cd: seconds before this kind can happen again); returns true if it was queued
const URGENT_CHAT=new Set(['contact','down','frag','reinf']);
function chat(kind,cd,...lines){
  if(!sndOn||state!=='play'||!lines[0])return false;
  if(!URGENT_CHAT.has(kind)&&!kind.startsWith('tut_')&&performance.now()/1000<voiceBusyTill+TALK_GAP)return false;   // (Bryan: they talked all the time)
  if(simT<(chatCD[kind]||0)||talkQ.length>3)return false;chatCD[kind]=simT+cd;
  for(const l of lines)if(l){l.at=simT;talkQ.push(l);}return true;
}
// every frame: the next line once the radio's free
function chatTick(){
  if(!talkQ.length||!AC||paused)return;const now=performance.now()/1000;if(now<voiceBusyTill)return;   // (held while paused: the tour after a location)
  const s=talkQ[0];if(up(s.u)&&callouts.some(c=>!c.small&&c.t<1&&hyp(c.x-s.u.x,c.y-s.u.y)<24))return;   // his own callout first, so the words don't pile up
  talkQ.shift();if(!up(s.u)||simT-(s.at??simT)>8)return;   // (a line that waited too long is out of date)
  const radio=!s.u.joined,d=voiceClip(s.u.id,s.clip,{radio,x:s.u.x,y:s.u.y,vol:s.quiet?.55:.95,gain:s.quiet?.55:1});
  callouts.push({x:s.u.x,y:s.u.y,t:0,dur:Math.max(2.2,d+.8),text:s.text,col:s.quiet?'#b8c4cc':'#dfe6ea',small:true});   // (smaller than the action callouts: talk, not orders)
  voiceBusyTill=now+(d||1.4)+.25;if(radio&&d){squelch(0);setTimeout(()=>squelch(0),(d+.1)*1000);}
}

/* ---------- what sets them talking (hooks from the game code) ---------- */
function chatMove(as){   // a group move: the lead calls his partner, who answers (now and then, so it doesn't get old)
  const list=as.map(a=>a.u);if(list.length<2)return false;
  const lead=list.find(u=>/1$/.test(u.id))||list[0],mate=list.find(u=>u!==lead&&u.team===lead.team);if(!mate||Math.random()>.15)return false;
  return chat('move',45,named(lead,'onme',mate),named(mate,'follow',lead));
}
function chatContact(amb){   // first contact: the man who sees them says where; someone answers
  const e=enemies.filter(q=>!q.dead&&q.vis).sort((a,b)=>hyp(a.x-camT.x,a.y-camT.z)-hyp(b.x-camT.x,b.y-camT.z))[0];
  if(!e){say(players.find(alive),amb?'ack_attack':'contact');return;}
  const u=nearestTo(e.x,e.y);if(!u)return;
  let rel=Math.atan2(e.y-u.y,e.x-u.x)-u.ang;rel=Math.atan2(Math.sin(rel),Math.cos(rel));let h=Math.round(rel/(Math.PI/6));h=((h%12)+12)%12;if(h===0)h=12;
  const near=+Object.keys(CLOCK).sort((a,b)=>Math.min(Math.abs(a-h),12-Math.abs(a-h))-Math.min(Math.abs(b-h),12-Math.abs(b-h)))[0];
  const many=enemies.filter(q=>!q.dead&&q.vis&&hyp(q.x-e.x,q.y-e.y)<140).length>1;
  const l1=L(u,`cdir_${near}_${many?'many':'one'}`,CDIR[many?'many':'one'].replace('{D}',CLOCK[near]));
  if(!chat('contact',6,l1,gen(leaderOf([u]),'engage')))say(u,'contact');
}
function chatDown(t){   // a man down: the nearest calls it, the next one goes to him
  const a=nearestTo(t.x,t.y,[t]),b=players.filter(p=>up(p)&&p!==t&&p!==a&&canSay(p,'gotyou',t)).sort((p,q)=>hyp(p.x-t.x,p.y-t.y)-hyp(q.x-t.x,q.y-t.y))[0];
  if(!chat('down',2,named(a,'down',t),named(b,'gotyou',t)))say(a,'man_down');
}
function chatRevived(t,by){if(by&&by!==t&&!t.dead&&chat('thanks',4,named(t,'thanks',by)))return true;say(t,'revived');return false;}
function chatKill(u){if(Math.random()<.1){const m=[partnerOf(u),...players.filter(p=>p!==u&&up(p)&&p.team===u.team)].find(p=>canSay(p,'nice',u));if(m)chat('nice',60,named(m,'nice',u));}}
function chatTakedown(u){const m=partnerOf(u);chat('tk',25,gen(u,'tkdone'),m&&hyp(m.x-u.x,m.y-u.y)<260&&Math.random()<.3?gen(m,'tknice'):null);}
function chatHush(e){   // a guard heard or saw something: the nearest man says freeze; when he settles, they move on
  if(contact)return;const u=nearestTo(e.x,e.y);if(!u||hyp(u.x-e.x,u.y-e.y)>320)return;
  if(chat('hush',45,gen(u,'hush')))hushBy=u;
}
function chatClear(){if(hushBy&&!contact&&enemies.every(e=>e.dead||e.alerted||e.aware<.25)){chat('clear',45,gen(hushBy,'clear'));hushBy=null;}}
function chatBodyFound(){chat('body',40,gen(leaderOf(),'bodyfound'));}
function chatSecured(){const a=leaderOf(),b=leaderOf([a]);chat('secured',10,gen(a,'secured'),b?gen(b,'regroup'):null);}
function chatRadio(e){if(e.vis)chat('radio',30,gen(nearestTo(e.x,e.y),'radio'));}
function chatReinf(){chat('reinf',20,gen(leaderOf(),'reinf'));}
function chatDog(d){const u=nearestTo(d.x,d.y);if(u&&hyp(u.x-d.x,u.y-d.y)<360)chat('dog',40,gen(u,'dog'));}
function chatFrag(t){chat('frag',3,gen(t,'fragwarn'));}
function chatSuppress(u){const m=players.find(p=>p!==u&&up(p)&&p.path.length);chat('cover',40,gen(u,'covering'),m?gen(m,'movingcov'):null);}
function chatFree(u){chat('free',3,gen(u,'free'));}
function chatSci(u){chat('sci',6,gen(u,'sci'));}
function chatScan(u){chat('scan',4,gen(u,'scan'));}
// once the shooting stops: the lead checks on the man who's hurt worst; he answers how he is
function chatStatus(){
  const a=leaderOf();if(!a)return;const hurt=players.filter(p=>up(p)&&p!==a&&p.hp<90).sort((x,y)=>x.hp-y.hp)[0];if(!hurt)return;
  chat('status',120,named(a,'check',hurt),gen(hurt,hurt.hp>=70?'fine':hurt.hp>=35?'hurt':'bad'));
}
// banter: in a quiet spell (nobody hunting, nothing hostile near, nobody talking), now and then, each conversation once
function banterPhase(){
  if(MAPID==='in')return 'in';
  const pris=players.some(p=>p.joined&&up(p));
  if(sciOut)return pris&&Math.random()<.5?'scip':'sci';
  if(pris)return 'pris';
  return finished[3]?'dco':finished[2]?'yard':finished[1]?'br':finished[0]?'wh':'any';   // (by the checkpoints they've cleared: mission.js)
}
function banterTick(dt){
  if(state!=='play'||contact||talkQ.length||paused||MAPID==='l1')return;
  if((banterT+=dt)<150)return;   // (Bryan: they talked all the time)
  if(enemies.some(e=>!e.dead&&!e.surr&&(e.alerted||players.some(p=>up(p)&&hyp(p.x-e.x,p.y-e.y)<380))))return;   // not with anyone near
  const ph=banterPhase(),cand=BANTER.map((b,i)=>({b,i})).filter(({b,i})=>!banterUsed.has(i)&&(b.when===ph||(b.when==='any'&&ph!=='in'))&&b.lines.every(([id])=>up(players.find(p=>p.id===id))));
  if(!cand.length){banterT=40;return;}
  const best=cand.find(c=>c.b.when===ph)||cand[(Math.random()*cand.length)|0];banterUsed.add(best.i);banterT=0;
  best.b.lines.forEach(([id,text],j)=>{const u=players.find(p=>p.id===id);talkQ.push(L(u,`ban_${best.i}_${j}`,text,ph==='in'));});   // (no time stamp: a conversation plays out)
}

/* ---------- what they say about the map (Bryan: "the voices also serve as a tutorial and talk about the location") ----------
   Each once, the first time it comes up, from whichever of the first four is nearest it. */
const TUT_ONLY={vehicle:[1],maze:[2],patrol:[2,3]};   // (Level 2's rework: 'Armored truck', 'containers on the left' and 'moving left' no longer fit)
function tutLine(key,u){if(tutSaid.has(key)||!u)return false;const only=TUT_ONLY[key],l=gen(u,key,only?only[(Math.random()*only.length)|0]:undefined);if(l&&chat('tut_'+key,6,l)){tutSaid.add(key);return true;}return false;}
function tutTick(dt){
  if(state!=='play'||MAPID!=='out'||landing||(tutT-=dt)>0)return;tutT=.5;
  const ups=players.filter(p=>up(p)&&!p.joined);if(!ups.length)return;
  const sees=f=>enemies.find(e=>!e.dead&&e.vis&&f(e));
  if(!tutSaid.has('bridge')&&ups.every(p=>p.y>CANAL.y0)){const e=sees(e=>e.grp===1&&!e.onTower);if(e&&tutLine('bridge',tutBy(e.x,e.y)))setTimeout(()=>tutLine('pipe',tutBy(CULVERT.x0,CANAL.y1)),3800);}   // the bridge is covered; the pipe's the quiet way
  if(!tutSaid.has('sniper')){const e=sees(e=>e.onTower);if(e)tutLine('sniper',tutBy(e.x,e.y));}
  if(!tutSaid.has('tower')&&tutSaid.has('sniperdown')&&pickups.length){const w=tutBy(TOWER.x,TOWER.y);if(w&&hyp(w.x-TOWER.x,w.y-TOWER.y)<300)tutLine('tower',w);}
  if(!tutSaid.has('maze')&&!contact&&ups.some(p=>p.y<CANAL.y0-10))tutLine('maze',tutBy(150,-60));   // across the canal: the containers are the quiet way up
  if(!tutSaid.has('vehicle')){const t=sees(e=>e.veh);if(t)tutLine('vehicle',tutBy(t.x,t.y));}
  if(!tutSaid.has('patrol')&&!contact){const e=sees(e=>e.route&&e.grp===2&&!e.alerted);if(e)tutLine('patrol',tutBy(e.x,e.y));}   // the container yard's patrol
  if(!tutSaid.has('killfield')){const e=sees(e=>e.grp===3&&e.gunner&&!e.veh);if(e)tutLine('killfield',tutBy(e.x,e.y));}
  const nearDoor=ups.some(p=>hyp(p.x-245,p.y+410)<260),locked=dcLocked();   // the doors: when they open again after being shut
  if(locked&&nearDoor)tutSaid.add('dcshut');else if(!locked&&nearDoor&&tutSaid.has('dcshut')){tutSaid.delete('dcshut');tutLine('dcopen',tutBy(245,-410));}
}

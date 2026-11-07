// The shots in docs/drafts (round 3): the Headquarters with her slime rocks (the game's camera and lights), then close-ups
// on a clean set. Round 2's camera positions are in git history.

module.exports={w:1600,h:900,pr:2,
 setup:()=>{
   // in the Headquarters: the mother coiled round her clutch in the lair, three of her young in the hall
   ST.HM=makeCentipede(MOTHER);scene.add(ST.HM.g);
   poseCentipede(ST.HM,crSpine(MOTHER,[[500,34,312],[500,26,298],[502,12,284],[512,9,268],[536,9,254],[560,9,226],[562,9,192],[540,9,166],[502,9,156],[466,9,166],[446,9,194],[448,9,226],[462,9,250],[470,9,262]]),2.2,{walk:.15,jaw:.45,look:.35,antUp:.2,antL:.6,antR:.75});
   const yb=[[[660,9,470],[650,3.5,468],[640,3.5,465],[630,3.5,462],[620,3.5,460],[610,3.5,461],[601,3.5,465],[593,3.5,470],[585,3.5,474],[576,3.5,476],[566,3.5,474]],
             [[505,3.5,640],[503,3.5,630],[499,3.5,621],[494,3.5,613],[488,3.5,606],[482,3.5,598],[478,3.5,589],[477,3.5,580],[479,3.5,571],[484,3.5,563],[490,3.5,556]],
             [[372,10,520],[378,7,516],[385,3.5,512],[393,3.5,509],[401,3.5,509],[409,3.5,512],[416,3.5,517],[423,3.5,521],[431,3.5,523],[439,3.5,522],[446,3.5,519]]];
   ST.HB=yb.map((c,i)=>{const b=makeCentipede(BROOD);scene.add(b.g);poseCentipede(b,crSpine(BROOD,c),1+i*1.7,{walk:i===2?.2:.85,jaw:i===2?.8:.3,look:i===2?.4:0,antUp:.25});return b;});
   // two hunters in the hall: one out of the east room, one squaring up to the squad
   ST.HS=[makeStalker(),makeStalker()];ST.HS.forEach(h=>scene.add(h.root));poseStalker(ST.HS[0],612,470,-Math.PI/2,2.2,{walk:.8,jaw:.3});poseStalker(ST.HS[1],515,605,0,1.1,{crouch:.3,jaw:.9,threat:1});
   // the clean set: the mother rearing, two of her young, two hunters (option B)
   const sc=studioSet(500,400);
   ST.M=makeCentipede(MOTHER);sc.add(ST.M.g);
   poseCentipede(ST.M,crSpine(MOTHER,[[502,54,450],[500,47,437],[498,32,421],[494,16,406],[488,9,388],[472,9,368],[447,9,354],[424,9,330],[428,9,298],[460,9,280],[505,9,284],[542,9,302],[562,9,330],[585,9,352],[615,9,362],[640,9,360]]),1.3,{walk:.25,jaw:.75,look:.6,flail:.6,antUp:.1,antL:.7,antR:.5});
   ST.B1=makeCentipede(BROOD);sc.add(ST.B1.g);ST.B2=makeCentipede(BROOD);sc.add(ST.B2.g);
   poseCentipede(ST.B1,crSpine(BROOD,[[648,12,560],[646,10,556],[643,6,551],[639,3.5,546],[634,3.5,539],[627,3.5,533],[619,3.5,530],[611,3.5,526],[606,3.5,519],[605,3.5,511],[607,3.5,503]]),2.1,{walk:.2,jaw:.85,look:.45,flail:.7,antUp:.15});
   poseCentipede(ST.B2,crSpine(BROOD,[[700,3.5,575],[694,3.5,569],[687,3.5,565],[679,3.5,564],[671,3.5,567],[664,3.5,571],[656,3.5,573],[648,3.5,571],[641,3.5,566],[635,3.5,560]]),4.4,{walk:.9,jaw:.3,look:-.05,antUp:.3});
   ST.S1=makeStalker();sc.add(ST.S1.root);poseStalker(ST.S1,330,560,.5,1.2,{crouch:.35,jaw:.9,look:-.05,threat:1});
   ST.S2=makeStalker();sc.add(ST.S2.root);poseStalker(ST.S2,268,515,1.1,2.5,{walk:.8,jaw:.15});
 },
 list:[
  {name:'hq-3-slime-rocks-game-camera',pose:()=>stPut(scene,[[470,700,500,300],[505,690,500,300],[535,705,500,300],[485,730,500,300]]),game:{x:500,z:470,zoom:2.0}},
  {name:'hq-4-slime-rocks-hall',pose:()=>stPut(scene,[[452,690,500,300],[548,682,500,300],[470,718,500,300],[530,712,500,300]]),cam:{pos:[500,70,740],at:[505,12,520],fov:38}},
  {name:'hq-5-slime-rocks-close',pose:()=>stPut(scene,[[452,640,500,300],[548,632,500,300],[470,668,500,300],[530,662,500,300]]),cam:{pos:[470,40,640],at:[405,8,560],fov:40}},
  {name:'brood-hunter-front',pose:()=>stPut(ST.set,[[392,640,330,560]]),set:1,cam:{pos:[376,26,600],at:[328,12,556],fov:40}},
  {name:'brood-hunter-side',pose:()=>stPut(ST.set,[]),set:1,cam:{pos:[252,42,604],at:[318,10,552],fov:40}},
  {name:'brood-young',pose:()=>stPut(ST.set,[[720,690,648,560]]),set:1,cam:{pos:[688,24,604],at:[646,9,552],fov:40}},
 ]};

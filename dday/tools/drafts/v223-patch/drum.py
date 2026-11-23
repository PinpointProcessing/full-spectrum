from lib import rep, before, after

# ---- ddplay.js: what a drum is, how it goes up, shooting it, its mark
before('js/ddplay.js', "// Version 223 (Bryan: \"Give me power and accuracy to bazookas\")",
"""// Version 223 (Bryan: "can you add more explosive barrels throughout the match"): fuel drums that go up. A 'dddrum' with `explosive` (three red drums
// with a yellow band and two jerrycans, ddDrumMesh; the plain 'dddrum' clusters of ddlook.js stay as scenery) is half cover that one burst sets off:
// tap it with a squad picked and whoever of them has a line and the reach fires at it (ddDrumAt, ddDrumShoot, mission.js's shootTank); any blast
// within 2.5 m sets it off too, a grenade, a rocket, a shell, theirs as well as ours, and so does the drum next to it (mission.js's tankBlast).
// ddDrumBlast: theirs within R take D at the middle, ours within ourR take ourD (stand back from them), a tank beside it what a grenade does, and
// guns, wire and barracks as from any blast (ddBlast). A small flame over each one near the squad you play says what it is (ddDrumDraw).
const DD_DRUM={hp:20,R:90,D:230,ourR:70,ourD:110,tap:28,show:560};
const ddDrumAdd=(o,dx,y)=>o('dddrum',dx,y,16,16,{cover:1,explosive:true,hp:DD_DRUM.hp});
function ddDrumMesh(o){
  const T=THREE,cx=o.x+o.w/2,cy=o.y+o.h/2,g0=typeof ddH==='function'&&groundH?ddH(cx,cy):0;
  const M=ddDrumMesh.m||(ddDrumMesh.m={red:new T.MeshStandardMaterial({map:typeof ddgTex==='function'?ddgTex('drum'):null,color:0xb8402a,roughness:.55,metalness:.2}),band:new T.MeshStandardMaterial({color:0xe9c452,roughness:.7}),can:new T.MeshStandardMaterial({color:0x4f5a3a,roughness:.65,metalness:.25})});
  o.meshes=[];const add=(g,m,x,h,y,ry)=>{const q=new T.Mesh(g,m);q.position.set(x,h,y);q.rotation.y=ry||0;q.castShadow=q.receiveShadow=true;scene.add(q);o.meshes.push(q);return q;};
  for(const[dx,dy,ry]of[[-3.6,-2.4,0],[3.8,-3,1.3],[.2,4.2,2.4]]){add(new T.CylinderGeometry(3.4,3.4,9.8,14),M.red,cx+dx,g0+4.9,cy+dy,ry);add(new T.CylinderGeometry(3.52,3.52,1.5,14),M.band,cx+dx,g0+6.7,cy+dy,ry).castShadow=false;}
  add(new T.BoxGeometry(3.4,4.6,1.5),M.can,cx+7.4,g0+2.3,cy+3.2,.5);add(new T.BoxGeometry(3.4,4.6,1.5),M.can,cx+6.2,g0+2.3,cy+5.8,.2);
}
function ddDrumBuild(){if(!dd||dd.drumB===objs)return;dd.drumB=objs;for(const o of objs)if(o.kind==='dddrum'&&o.explosive&&!o.meshes)ddDrumMesh(o);}
function ddDrumBlast(o,by){
  const cx=o.x+o.w/2,cy=o.y+o.h/2,P=DD_DRUM;
  for(let k=0;k<3;k++)booms.push({x:cx+(Math.random()-.5)*14,y:cy+(Math.random()-.5)*14,t:-k*.09,size:1.25});
  paintDecal({k:'scorch',x:cx,y:cy,r:Math.random()});tankFires.push({x:cx,y:cy,r:9,t0:simT,puffs:[],emit:0});shake(clamp(1.1-hyp(cx-camT.x,cy-camT.z)/700,.15,1));if(typeof sfxBoom==='function')sfxBoom(cx,cy,1.3);
  for(const m of o.meshes||[])m.visible=false;o.gone=true;removeObstacle(o,[]);dEpoch++;
  for(const v of[...enemies,...(dd.allies||players)]){if(v.dead||v.downed)continue;const ours=v.side!=='E',R=ours?P.ourR:P.R,d=hyp(v.x-cx,v.y-cy);if(d>R||!los(cx,cy,v.x,v.y))continue;
    v.sup=Math.min(1.2,(v.sup||0)+1);damage(v,(ours?P.ourD:P.D)*(1-d/(R+(ours?10:5))),by||null);}
  tankBlast(cx,cy,by);   // (the drum beside it, and ddBlast: guns, wire, a tank)
}
const ddDrumAt=(sx,sy)=>{let best=null,bd=DD_DRUM.tap;for(const o of objs){if(!o.explosive||o.burst||o.kind!=='dddrum')continue;toSBack=false;const p=toS(o.x+o.w/2,o.y+o.h/2,7);if(toSBack)continue;const d=hyp(p[0]-sx,p[1]-sy);if(d<bd){bd=d;best=o;}}return best;};
function ddDrumShoot(o){
  const cx=o.x+o.w/2,cy=o.y+o.h/2,m=sel.filter(u=>alive(u)&&!u.onGun&&!u.inBoat),near=m.filter(u=>hyp(cx-u.x,cy-u.y)<=wRange(u)),can=near.filter(u=>sightOf(u,cx,cy));
  if(!can.length){ddNote(near.length?'No clear shot':'Too far');return;}
  for(const u of can){u.focusTank=o;u.focus=null;u.supT=null;u.lastOrder=simT;}callout(can[0],'Hit the drums!',C.warn);
}
// the flame over a drum the squad you play could set off
function ddDrumDraw(now){
  const S=typeof ddSquad==='function'?ddSquad().filter(alive):[];if(!S.length)return;const pu=.5+.5*Math.sin(now/260);
  for(const o of objs){if(!o.explosive||o.burst||o.kind!=='dddrum')continue;const cx=o.x+o.w/2,cy=o.y+o.h/2;if(!S.some(u=>hyp(u.x-cx,u.y-cy)<DD_DRUM.show))continue;
    const w=ddWhere(cx,cy,19);if(!w.on)continue;const x=w.x,y=w.y-pu*2,s=1.05;
    ox.save();ox.translate(x,y);ox.scale(s,s);ox.beginPath();ox.arc(0,0,9.5,0,7);ox.fillStyle='rgba(16,14,12,.78)';ox.fill();ox.lineWidth=1.6;ox.strokeStyle=`rgba(255,${150+pu*40|0},60,.95)`;ox.stroke();
    ox.beginPath();ox.moveTo(0,-6.4);ox.bezierCurveTo(4.6,-2.2,5.4,1.2,3.6,4.2);ox.bezierCurveTo(2.2,6.4,-2.2,6.4,-3.6,4.2);ox.bezierCurveTo(-5.2,1.4,-2.6,-.6,-2.2,-3);ox.bezierCurveTo(-.8,-1.8,-.4,-4,0,-6.4);ox.closePath();ox.fillStyle=`rgb(255,${150+pu*50|0},50)`;ox.fill();
    ox.beginPath();ox.moveTo(0,-.8);ox.bezierCurveTo(2,1.2,2.2,3,1,4.4);ox.bezierCurveTo(.4,5,-1,5,-1.5,4.2);ox.bezierCurveTo(-2.2,3,-.8,1.4,0,-.8);ox.closePath();ox.fillStyle='rgb(255,236,150)';ox.fill();ox.restore();}
}
""")
# a tap on one: before the ring of actions and the ground
rep('js/ddplay.js', "if(dd.toolK)return true;if(typeof ddcTap==='function'){",
    "if(dd.toolK)return true;if(sel.length&&sx!=null){const xb=ddDrumAt(sx,sy);if(xb){ddDrumShoot(xb);return true;}}   /* (Version 223: a fuel drum under the finger: shoot it) */\n  if(typeof ddcTap==='function'){")
# its models, once the map is up
rep('js/overlay.js', "if(typeof ddPostDraw==='function'){ddPostFrame();ddCapDraw(now);ddPostDraw(now);fpNadeDraw(now);}",
    "if(typeof ddPostDraw==='function'){ddPostFrame();ddCapDraw(now);ddPostDraw(now);fpNadeDraw(now);}if(typeof ddDrumDraw==='function')ddDrumDraw(now);")
# ---- mission.js: a D-Day drum goes up its own way
rep('js/mission.js', "  if(o.burst)return;o.burst=true;o.hp=0;shake(",
    "  if(o.burst)return;if(MAPID==='dd'&&o.explosive&&typeof ddDrumBlast==='function'){o.burst=true;o.hp=0;ddDrumBlast(o,by);return;}   // (D-Day's fuel drums: ddplay.js)\n  o.burst=true;o.hp=0;shake(")
# ---- the plain clusters stay scenery; the explosive ones are drawn by ddDrumMesh
rep('js/ddlook.js', "    else if(o.kind==='dddrum'){o.meshes=[];", "    else if(o.kind==='dddrum'&&!o.explosive){o.meshes=[];")
# ---- Chapter 1: the beach, the draw, the checkpoint, the top
rep('js/dday.js', "  for(const[x,y]of[[668,-650],[946,-724],[300,-548],[560,-470]])o('dddrum',x,y,16,16,{cover:1});",
"""  // (Version 223, Bryan: "more explosive barrels throughout the match": the four clusters that stood here go up now, and there are more: by each
  // bunker on the beach, up the draw, in the checkpoint, and about the top: ddplay.js's ddDrumAdd)
  for(const[x,y]of[[668,-650],[946,-724],[300,-548],[560,-470],   // the top, as before
    [392,258],[722,256],[804,262],[800,146],                       // beside the left bunker, the pillbox, the nests, the bunker on the right hill
    [574,196],[512,-176],[304,-272],                               // the draw: the first bags, the nest, the last bags
    [776,-22],                                                     // the checkpoint's yard
    [336,-426],[724,-396],[890,-496],[648,-672],[226,-506]])       // the light gun's nest, between the artillery, the mortar pits, the barracks' end, the tent
    ddDrumAdd(o,x,y);""")
# ---- their base, the village
after('js/ddbase.js', "  o('ddfuel',DB.fuel.x,DB.fuel.y,DB.fuel.w,DB.fuel.h,{hp:50,tag:'fuel',cover:1});",
    "\n  for(const[x,y]of[[1254,-664],[1596,-560],[1507,-730],[1656,-660],[1668,-506]])ddDrumAdd(o,x,y);   // (Version 223: fuel drums that go up: behind the gate's bags, by the lorries, between the barracks, by the command post's bags, by the anti-aircraft gun)")
after('js/ddvillage.js', "o('vgcar',740,-566,36,18,{cover:2,ht:14,look:'truck'});",
    "\n  for(const[x,y]of[[808,-332],[780,-564],[624,-316]])ddDrumAdd(o,x,y);   // (Version 223: fuel drums that go up: by the car at the barricade, by the truck in the square, at the barricade's west end)")
# ---- built once the map is up
rep('js/dday.js', "function ddFrame(rdt,now){", "function ddFrame(rdt,now){\n  if(typeof ddDrumBuild==='function')ddDrumBuild();   // (Version 223: the fuel drums' models, on whichever map)")
# ---- ddBlast wrecks anything with hit points near a blast: a drum is not its to wreck quietly (tankBlast sets it off)
rep('js/ddplay.js', "    if(o.hp==null||o.gone)continue;const d=rectDist(x,y,o);if(d>46)continue;", "    if(o.hp==null||o.gone||o.explosive)continue;const d=rectDist(x,y,o);if(d>46)continue;   // (a fuel drum goes up through mission.js's tankBlast, not here)")

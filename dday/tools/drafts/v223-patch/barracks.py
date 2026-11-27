from lib import rep, before, after, ROOT
import io

# ---- the room keeps each side's furniture apart (hidden while the camera stands on that side), and where the camera is on its walk
rep('js/ddmeta.js', "  for(const s of[-1,1])DDM_BY.forEach((by,i)=>{const bx=s*47;\n",
    "  const side={A:[],B:[]};   // (Version 223: each side's bunks, trunks and helmets: out of the picture while the camera stands among them)\n  for(const s of[-1,1])DDM_BY.forEach((by,i)=>{const bx=s*47,n0=grp.children.length;\n")
rep('js/ddmeta.js', "grp.add(gh);guns[(s<0?'A':'B')+i]=gh;});", "grp.add(gh);guns[(s<0?'A':'B')+i]=gh;side[s<0?'A':'B'].push(...grp.children.slice(n0));});")
rep('js/ddmeta.js', "ddm.room={scene:sc,grp,guns,key,cam:", "ddm.room={scene:sc,grp,guns,key,side,walk:null,cam:")

# ---- the walk
before('js/ddmeta.js', "function ddmRoomFrame(rdt){",
"""// Version 223 (Bryan: "In the barracks, can I move the camera to the left and right and choose a unit by selecting them with my thumb? Would feel
// more natural"): the camera walks one line through the room and a thumb drags it along: down Alpha's bunks looking across the aisle at them, round
// the near end of the aisle (half way round it looks down the aisle at all eight, the view the barracks opens on), and back up Bravo's bunks. s is
// how far along that line it is, in the room's units: Alpha's four bunks at 0, 32, 64, 96, the turn DDM_WALK.turn long, then Bravo's four from the
// near end to the far one. A drag moves it with the finger (the picture follows the thumb, and keeps going the same way round the turn); the man it
// is nearest is the one whose kit and numbers show (the view opens out a little while it moves, DDM_WALK.wide, to take in his neighbours); let go and it settles on him (a flick carries it on a little). A tap on any man in sight walks
// it to him. With nobody chosen it stands at the turn's middle. ddmWalkPose: where the camera is and looks at s.
const DDM_WALK={turn:70,xc:46,gain:1.8,fling:.22,speed:420,wide:[70,44]};   // (gain: the room moves this much faster than the thumb: at the thumb's own speed a bunk was a whole screen's drag)
const ddmStopOf=(t,i)=>t==='A'?i*32:96+DDM_WALK.turn+(3-i)*32,ddmStopWide=()=>96+DDM_WALK.turn/2;
function ddmWalkStops(){const L=[{s:ddmStopWide(),slot:null}];for(const q of ddmMen8())L.push({s:ddmStopOf(q[0],q[1]),slot:q});return L;}
function ddmWalkPose(s,tall){
  const W=DDM_WALK,z0=DDM_BY[0]+2,hP=tall?23:21,hL=tall?12:9,fW=tall?48:36;
  if(s<=96)return{P:[W.xc,hP,z0+s],L:[-46,hL,z0+s],fov:fW};
  if(s>=96+W.turn){const z=z0+96-(s-96-W.turn);return{P:[-W.xc,hP,z],L:[46,hL,z],fov:fW};}
  const th=(s-96)/W.turn*Math.PI,k=Math.sin(th)**2,zp=z0+96,r=W.xc+((tall?128:150)-zp-W.xc)*k;
  return{P:[r*Math.cos(th),hP+((tall?34:30)-hP)*k,zp+r*Math.sin(th)],L:[-46*Math.cos(th),hL+(9-hL)*k,zp-(zp+10)*Math.sin(th)],fov:fW+((tall?64:36)-fW)*k};
}
// the man the camera is nearest (or nobody, at the turn's middle) becomes the one chosen
function ddmWalkPick(s){
  let b=null,bd=1e9;for(const q of ddmWalkStops()){const d=Math.abs(q.s-s);if(d<bd){bd=d;b=q;}}
  const S=ddm.slot,same=b.slot?!!S&&S[0]===b.slot[0]&&S[1]===b.slot[1]:!S;if(same)return;
  ddm.slot=b.slot?[b.slot[0],b.slot[1]]:null;ddm.swap=null;ddm.cand=null;ddm.sub=null;ddmUI();
}
""")
# the frame: the camera from where it is on the walk
rep('js/ddmeta.js', """  let P,L,fov;if(S){const s=S[0]==='A'?-1:1,by=DDM_BY[S[1]]+2;P=[-s*(tall?46:48),tall?23:21,by];L=[s*46,tall?12:9,by];fov=tall?48:36;}else{P=[0,tall?34:30,tall?128:150];L=[0,9,-10];fov=tall?64:36;}
  const C=ddm.cam;C.k=Math.min(1,C.k+rdt/.7);const e=1-Math.pow(1-Math.min(1,rdt*7),1);
  if(C.k>=1&&!C.set){r.pos.set(...P);r.look.set(...L);r.fov=fov;C.set=1;}else{C.set=0;const q=Math.min(1,rdt*6);r.pos.lerp(r.v.set(...P),q);r.look.lerp(r.v.set(...L),q);r.fov+=(fov-r.fov)*q;if(C.k>=1)C.set=1;}
""", """  // (Version 223: it walks there along its line, ddmWalkPose, instead of cutting across the room; while a thumb drags it, it's where the thumb put it)
  const W=r.walk||(r.walk={s:S?ddmStopOf(S[0],S[1]):ddmStopWide(),drag:false});
  if(!W.drag){const to=S?ddmStopOf(S[0],S[1]):ddmStopWide(),d=to-W.s,st=DDM_WALK.speed*Math.min(.1,rdt);W.s=Math.abs(d)<.2?to:W.s+clamp(d*Math.min(1,rdt*5.5),-st,st);}
  W.w=clamp((W.w||0)+(W.drag?1:-1)*Math.min(.1,rdt)*7,0,1);   // (while it's dragged the view opens out, so the men either side of the one in the middle are in it; a phone held upright otherwise sees one bunk)
  {const q=ddmWalkPose(W.s,tall);r.pos.set(...q.P);r.look.set(...q.L);r.fov=q.fov+Math.max(0,DDM_WALK.wide[tall?0:1]-q.fov)*W.w*W.w*(3-2*W.w);}
""")
rep('js/ddmeta.js', "  for(const u of r.men){u.m.g.visible=!S||u.slotK[0]===S[0];figRefresh(u);figAnimate(u,u.m);}   // (square on to one wall, the men across the aisle would stand in the way)",
    "  const hide={A:r.pos.x<-26,B:r.pos.x>26};   // (standing among one side's bunks looking across: that side's men and furniture would be in the way)\n  for(const u of r.men){u.m.g.visible=!hide[u.slotK[0]];figRefresh(u);figAnimate(u,u.m);}\n  for(const k of['A','B'])for(const m of r.side[k])m.visible=!hide[k];")
# a tap on a man: only one in the picture
rep('js/ddmeta.js', "    for(const u of r.men){r.v.set(u.x,16,u.y).project(r.cam);const d=", "    for(const u of r.men){if(!u.m.g.visible)continue;r.v.set(u.x,16,u.y).project(r.cam);if(r.v.z>1)continue;const d=")
# back into the barracks: from the turn's middle
rep('js/ddmeta.js', "if(!ddm.room)ddmRoomBuild();ddmRoomMen();ddm.cam={k:1};}", "if(!ddm.room)ddmRoomBuild();ddm.room.walk=null;ddmRoomMen();ddm.cam={k:1};}")
# the drag, in place of the swipe that jumped to the next man
rep('js/ddmeta.js', "function ddmSwipe(el){let x0=null,y0=0;\n  el.addEventListener('pointerdown',e=>{x0=e.clientX;y0=e.clientY;});\n  el.addEventListener('pointerup',e=>{\n    if(x0!=null&&ddm&&ddm.ph==='barracks'&&ddm.slot&&!ddm.sub&&!ddm.swap&&ddmSel()){const dx=e.clientX-x0,dy=e.clientY-y0;x0=null;if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.3)return;ddm.swT=performance.now();ddmBarracksClick('man',{dataset:{d:dx<0?1:-1}});ddmUI();return;}\n",
"""function ddmSwipe(el){let x0=null,y0=0,wk=null;
  el.addEventListener('pointerdown',e=>{x0=e.clientX;y0=e.clientY;wk=null;
    const r=ddm&&ddm.room;if(r&&r.walk&&ddm.ph==='barracks'&&!ddm.sub&&!ddm.swap&&!e.target.closest('button,.ddm-bar,.ddm-pick,.ddm-opts'))wk={id:e.pointerId,x:e.clientX,s:r.walk.s,on:false,lx:e.clientX,lt:performance.now(),v:0};});
  // (the barracks: a thumb on the room drags the camera along the bunks)
  el.addEventListener('pointermove',e=>{
    if(!wk||e.pointerId!==wk.id||!ddm||!ddm.room||!ddm.room.walk||ddm.ph!=='barracks'){return;}const W=ddm.room.walk,tall=cw<ch*1.05,k=DDM_WALK.gain*154*Math.tan((tall?48:36)*Math.PI/360)/ch,now=performance.now();
    if(!wk.on){if(Math.abs(e.clientX-wk.x)<8||Math.abs(e.clientX-wk.x)<Math.abs(e.clientY-y0))return;wk.on=true;wk.x=e.clientX;wk.s=W.s;wk.lx=e.clientX;wk.lt=now;W.drag=true;el.classList.add('drag');try{el.setPointerCapture(e.pointerId);}catch(_){}return;}
    W.s=clamp(wk.s+(e.clientX-wk.x)*k,-8,ddmStopOf('B',0)+8);
    if(now>wk.lt+8){wk.v=.6*wk.v+.4*(e.clientX-wk.lx)*k/((now-wk.lt)/1000);wk.lx=e.clientX;wk.lt=now;}
    ddmWalkPick(W.s);});
  const walkEnd=e=>{if(!wk||e.pointerId!==wk.id)return;const w=wk;wk=null;if(!w.on||!ddm||!ddm.room||!ddm.room.walk)return;x0=null;ddm.swT=performance.now();const W=ddm.room.walk;W.drag=false;el.classList.remove('drag');
    ddmWalkPick(W.s+clamp(w.v,-260,260)*DDM_WALK.fling);};
  el.addEventListener('pointerup',walkEnd);el.addEventListener('pointercancel',walkEnd);
  el.addEventListener('pointerup',e=>{
""")
rep('js/ddmeta.js', "  el.className='ph-'+ph;el.innerHTML=h;", "  el.className='ph-'+ph+(ddm.room&&ddm.room.walk&&ddm.room.walk.drag?' drag':'');el.innerHTML=h;")
# the words
rep('js/ddmeta.js', "<span>${L8.length>1?'◂ SWIPE FOR THE NEXT MAN ▸':''}</span>", "<span>${L8.length>1?'◂ DRAG TO WALK THE BUNKS · TAP A MAN ▸':''}</span>")
rep('js/ddmeta.js', "Alpha's bunks on the left, Bravo's on the right. Tap a man or his square; a + is an empty bunk.</div>", "Alpha's bunks on the left, Bravo's on the right. Drag left or right to walk along them. Tap a man or his square; a + is an empty bunk.</div>")

css = ROOT + '/css/style.css'
s = io.open(css, encoding='utf-8').read()
s += """
/* Version 223: the barracks' camera dragged along the bunks: sideways drags are the room's, and what stands over the men steps back while it moves */
#ddm.ph-barracks{touch-action:pan-y}
#ddm .ddm-stats,#ddm .ddm-name,#ddm .ddm-fav,#ddm .ddm-arr{transition:opacity .15s}
#ddm.drag .ddm-stats,#ddm.drag .ddm-fav,#ddm.drag .ddm-arr{opacity:.12}#ddm.drag .ddm-name{opacity:.5}
"""
io.open(css, 'w', encoding='utf-8').write(s)

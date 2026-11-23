from lib import rep, before, after, ROOT
import io

# ---- the summary's rows open the man's page, not his roll-call card
rep('js/ddmeta.js', """data-a="card" data-i="${k}"><i>${DDM_ICON[r.rm.role]||''}</i><div class="nm"><b>${fv(r.rm)}""",
    """data-a="manv" data-i="${k}"><i>${DDM_ICON[r.rm.role]||''}</i><div class="nm"><b>${fv(r.rm)}""")
rep('js/ddmeta.js', """<span class="l">TAP A MAN FOR HIS CARD</span>""", """<span class="l">TAP A MAN TO SEE HIM</span>""")

# ---- his page
before('js/ddmeta.js', "function ddmNomWhy(r){",
"""// Version 223 (Bryan, with a picture of the full report: "if I click a unit after the stats are read, I can back right out back to the full stat menu...
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
      <div class="ddm-chips g3">${T('KILLS',r.kills)}${T('REVIVES',r.rev)}${T('TIMES DOWN',r.downs)}${T('GRENADES',r.items)}${T('BEST RUN',r.best||0)}${T('XP EARNED','+'+r.gain,'gold')}</div>
      <div class="ddm-gl gold">HIS RECORD</div>
      <div class="ddm-chips">${T('LEVEL',(up?'▲':'')+r.lv1,up?'gold':'')}${T('KILLS, ALL',m.kills||0)}${T('MEDALS',m.stars?'★'.repeat(Math.min(3,m.stars))+(m.stars>3?'+':''):'0',m.stars?'gold':'')}</div>
      <div class="ddm-xpr"><div class="ddm-xpb"><em style="width:${Math.round(m.xp/ddmNeed(r.lv1)*100)}%"></em></div><span>${m.xp} / ${ddmNeed(r.lv1)} XP</span></div>
      ${up?`<div class="ddm-up">▲ LEVEL UP${r.lv1-r.lv0>1?' ×'+(r.lv1-r.lv0):''} · +${2*(r.lv1-r.lv0)} Health · Aim · Speed · Nerve</div>`:''}
      ${m.pk>0?`<div class="ddm-pk"><div class="ddm-gl gold">CHOOSE A PERK${m.pk>1?' · '+m.pk+' TO CHOOSE':''}</div><div class="ddm-row">${ddmJob(m).map(q=>`<button type="button" class="ddm-pkb" data-a="perk" data-k="${q[0]}"><b>${q[1]}${ddmPerkN(m,q[0])?' ×'+(ddmPerkN(m,q[0])+1):''}</b><span>${q[2]}</span></button>`).join('')}</div></div>`:''}
      <div class="ddm-gl gold">WHAT HE'S GOOD AT</div>
      ${[['Health','hp'],['Aim','aim'],['Speed','spd'],['Bravery','brv']].map(([t,k])=>`<div class="ddm-st"><span>${t}</span><div><em style="width:${m.st[k]}%"></em></div><b>${m.st[k]}</b></div>`).join('')}
      ${m.trait?`<div class="ddm-perk gold"><b>★ ${DDM_TRAITS[m.trait].n}</b><br>${DDM_TRAITS[m.trait].d}</div>`:''}
      ${ddmJob(m).filter(q=>ddmPerkN(m,q[0])).map(q=>`<div class="ddm-unl sm new"><b>${q[1]}${ddmPerkN(m,q[0])>1?' ×'+ddmPerkN(m,q[0]):''}</b><span>${q[2]}</span></div>`).join('')}
      ${ddmUnl(m).map(q=>`<div class="ddm-unl sm${m.level>=q[0]?' new':''}"><b>${m.level>=q[0]?'★':'LV '+q[0]} ${q[2]}</b><span>${q[3]}</span></div>`).join('')}
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
""")
rep('js/ddmeta.js', "  if(i<0)return`<div class=\"ddm-vic\" data-a=\"rolltap\">", "  if(ddm.man!=null&&i>=n&&ddm.rows[ddm.man])return ddmManHTML();\n  if(i<0)return`<div class=\"ddm-vic\" data-a=\"rolltap\">")

# ---- its taps
rep('js/ddmeta.js', "  if(a==='card'){ddmRollGo(+b.dataset.i);return;}",
    "  if(a==='card'){ddmRollGo(+b.dataset.i);return;}\n  if(a==='manv'){ddmManGo(+b.dataset.i);return;}if(a==='manx'){ddmManGo(null);return;}if(a==='mann'){if(ddm.man!=null)ddmManGo(ddm.man+(+b.dataset.d));return;}   // (Version 223: a man's page off the report, and back)")
rep('js/ddmeta.js', "  if(a==='perk'){const r=ddm.rows[ddm.step];", "  if(a==='perk'){const r=ddm.rows[ddm.man!=null?ddm.man:ddm.step];")
rep('js/ddmeta.js', "  if(a==='report'){ddm.ph='report';ddm.scr=null;", "  if(a==='report'){ddm.ph='report';ddm.man=null;for(const q of ddm.rows)q.u.away=false;ddm.scr=null;")
rep('js/ddmeta.js', "  if(a==='base'){ddm.ph='base';ddm.armory=false;", "  if(a==='base'){ddm.ph='base';ddm.man=null;for(const q of ddm.rows)q.u.away=false;ddm.armory=false;")
# a swipe across his page: the next man, or the one before
rep('js/ddmeta.js', "    if(x0==null||!ddm||ddm.ph!=='report'||ddm.scr)return;const dx=e.clientX-x0,dy=e.clientY-y0,n=ddm.rows.length,i=ddm.step;x0=null;",
    "    if(x0!=null&&ddm&&ddm.ph==='report'&&ddm.man!=null&&!ddm.scr){const dx=e.clientX-x0,dy=e.clientY-y0;x0=null;if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.3)return;ddm.swT=performance.now();ddmManGo(ddm.man+(dx<0?1:-1));return;}\n    if(x0==null||!ddm||ddm.ph!=='report'||ddm.scr)return;const dx=e.clientX-x0,dy=e.clientY-y0,n=ddm.rows.length,i=ddm.step;x0=null;")

# ---- the camera on him, the picture moved over so he stands on the left
rep('js/ddmeta.js', "  if(ddm.ph==='report'){ddmRollTick(rdt);const r=ddm.rows[ddm.step],C=ddm.cam,one=!!r,zt=one?(cw<ch?10.5:9.5):(cw<ch?7.6:6.4),tx=one?r.u.x:SP.line[0],tz=(one?r.u.y+(cw<ch?16:6):SP.line[1]-34)+DD_CAM.look;",
    "  const mv=ddm.ph==='report'&&ddm.man!=null&&ddm.step>=ddm.rows.length?ddm.rows[ddm.man]:null;   // (Version 223: a man's page: he's on the left of it)\n  if(ddm.ph==='report'){ddmRollTick(rdt);const r=mv||ddm.rows[ddm.step],C=ddm.cam,one=!!r,zt=mv?(cw<ch?15:13):one?(cw<ch?10.5:9.5):(cw<ch?7.6:6.4),tx=one?r.u.x+(mv?C.ox||0:0):SP.line[0],tz=(one?r.u.y+(mv?C.oz||0:cw<ch?16:6):SP.line[1]-34)+DD_CAM.look;if(!mv)C.ox=C.oz=0;")
rep('js/ddmeta.js', "  camShift=0;updateCamera();render(rdt,now);ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);ddmPlace();",
    "  camShift=0;updateCamera();\n  if(mv){   // (where he is on the screen now, and how far over the view has to go to put him a fifth of the way across)\n    const u=mv.u,C=ddm.cam,V=ddm.v3||(ddm.v3=new T.Vector3()),h=(typeof ddH==='function'?ddH(u.x,u.y):0)+9;V.set(u.x,h,u.y).project(camera);const ax=V.x,ay=V.y,bx=V.set(u.x+10,h,u.y).project(camera).x,cy=V.set(u.x,h,u.y+10).project(camera).y,ppu=Math.max(.4,(bx-ax)*cw/20),ppv=Math.max(.2,(ay-cy)*ch/20);\n    C.ox=clamp((C.ox||0)+((ax+1)*cw/2-cw*(cw<ch?.21:.19))/ppu,-400,400);C.oz=clamp((C.oz||0)+((1-ay)*ch/2-ch*(cw<ch?.5:.52))/ppv,-400,400);}\n  render(rdt,now);ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);ddmPlace();")

# ---- its look
css = ROOT + '/css/style.css'
s = io.open(css, encoding='utf-8').read()
s += """
/* Version 223: a man's page off the report: he stands on the left, everything about him down the right, BACK at the top and the bottom */
.ddm-mv{position:absolute;inset:0;pointer-events:none}.ddm-mv>*{pointer-events:auto}
.ddm-mvt{position:absolute;left:0;right:0;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:max(10px,env(safe-area-inset-top,0px)) 12px 8px;background:linear-gradient(#0a0f15 60%,rgba(10,15,21,0))}
.ddm-mvt span{font-size:11px;font-weight:800;letter-spacing:.1em;color:#9aa6b0}
button.ddm-mvb{background:#39424b!important;border-radius:10px;padding:11px 18px;font-weight:800;font-size:14px;letter-spacing:.04em;min-height:44px}
.ddm-mvw{position:absolute;left:0;top:0;bottom:0;width:42%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 6px calc(78px + env(safe-area-inset-bottom,0px)) 10px;pointer-events:none;background:linear-gradient(rgba(10,15,21,.5),rgba(10,15,21,0) 22%,rgba(10,15,21,0) 70%,rgba(10,15,21,.75))}
.ddm-mvn b{display:block;font-size:22px;font-weight:800;line-height:1.05;overflow:hidden;text-overflow:ellipsis}.ddm-mvn span{display:block;font-size:9.5px;font-weight:800;letter-spacing:.1em;color:var(--tc);margin-top:2px}
.ddm-mvn q{quotes:none;display:inline-block;margin:5px 4px 0 0;border-radius:4px;padding:1px 6px;font-size:9px;font-weight:800;letter-spacing:.06em}.ddm-mvn q.g{background:#ffd76a;color:#221}.ddm-mvn q.r{background:#c0392b}
.ddm-mvr{position:absolute;right:0;top:0;bottom:0;width:58%;background:rgba(10,15,21,.94);border-left:3px solid var(--tc);padding:calc(64px + env(safe-area-inset-top,0px)) 10px calc(78px + env(safe-area-inset-bottom,0px));overflow:auto;-webkit-overflow-scrolling:touch}
.ddm-mvr .ddm-cite{margin:0 0 6px;animation:none}.ddm-mvr .ddm-cite b{display:block;font-size:12px;letter-spacing:.06em;color:#ffd76a}.ddm-mvr .ddm-cite span{font-size:10.5px;color:#cfd6dc}
.ddm-mvr .ddm-gl{margin:9px 0 4px}.ddm-mvr .ddm-chips{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.ddm-mvr .ddm-chips span{font-size:7.5px;padding:5px 2px}.ddm-mvr .ddm-chips b{font-size:17px}
.ddm-mvr .ddm-chips span.gold b{color:#ffd76a}.ddm-mvr .ddm-xpr{margin-top:6px}.ddm-mvr .ddm-xpr span{font-size:9.5px;font-weight:800;color:#9aa6b0;white-space:nowrap}.ddm-mvr .ddm-xpb{height:9px}
.ddm-mvr .ddm-up{margin-top:6px;font-size:10px;font-weight:800;color:#ffd76a;animation:none}.ddm-mvr .ddm-pk .ddm-row{flex-direction:column;gap:5px}
.ddm-mvk{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.ddm-mvk>div{background:#18222b;border-radius:8px;padding:5px 3px;text-align:center;min-width:0}.ddm-mvk>div.star{box-shadow:inset 0 0 0 1px #ffd76a}
.ddm-mvk i{display:block;height:22px}.ddm-mvk svg{height:100%;max-width:90%}.ddm-mvk b{display:block;font-size:9px;line-height:1.15;margin-top:3px;overflow:hidden;text-overflow:ellipsis}
.ddm-mvf{position:absolute;left:0;right:0;bottom:0;z-index:2;display:grid;grid-template-columns:56px 1fr 56px;gap:8px;padding:8px 12px max(10px,env(safe-area-inset-bottom,0px));background:linear-gradient(rgba(10,15,21,0),#0a0f15 40%)}
.ddm-mvf .ddm-btn{margin:0;min-height:48px;font-size:14px}
@media (orientation:landscape) and (max-height:520px){.ddm-mvw{width:38%}.ddm-mvr{width:62%;padding-top:56px;padding-bottom:66px;columns:2;column-gap:14px}.ddm-mvr>*{break-inside:avoid}.ddm-mvf .ddm-btn{min-height:40px}}
"""
io.open(css, 'w', encoding='utf-8').write(s)
rep('js/ddmeta.js', "zoom=C.zm;yaw=0;tilt=ddTilt(C.zm);camT.x=C.x;camT.z=C.z;}", "zoom=C.zm;yaw=0;tilt=ddTilt(C.zm,mv?.25:undefined);camT.x=C.x;camT.z=C.z;}")

from lib import rep, before, ROOT
import io
# Draft after Version 224 (Bryan: "show the unit up close, his full body from top to bottom on the screen. His stats and perks are listed on the right
# side but with the same background. Right now it looks too chaotic"): the man alone in a plain dark set of his own, full height on the left, and
# his numbers on the right straight onto the same backdrop (no panel).
before('js/ddmeta.js', "function ddmNomWhy(r){",
"""function ddmPortraitFrame(r,rdt){
  let P=ddm.por;if(!P){const sc=new T.Scene();sc.background=new T.Color(0x0c1117);const g=new T.Group();sc.add(g);
    const fl=new T.Mesh(new T.CircleGeometry(26,40),new T.MeshStandardMaterial({color:0x1a222c,roughness:.9}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;g.add(fl);
    g.add(new T.HemisphereLight(0xb8c6d6,0x1a1f26,.75));const key=new T.SpotLight(0xfff0d8,1.7,160,.7,.6,1);key.position.set(18,44,34);key.target.position.set(0,10,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.002;g.add(key,key.target);
    const rim=new T.DirectionalLight(0x7fb4ff,.7);rim.position.set(-20,18,-26);g.add(rim);P=ddm.por={sc,g,cam:new T.PerspectiveCamera(26,1,1,600),u:null,H:22};}
  const u=r.u;if(P.u!==u){if(P.u)moveMesh(P.u,scene);P.u=u;moveMesh(u,P.g);u.m.g.traverse(o=>{o.frustumCulled=false;});if(u.m.ring)u.m.ring.visible=false;
    u.m.g.position.set(0,0,0);u.m.g.rotation.y=-(Math.PI/2-.35);u.m.g.updateMatrixWorld(true);try{const b=new T.Box3().setFromObject(u.m.g);if(b.max.y>8)P.H=b.max.y;}catch(e){}}
  u.m.g.visible=true;u.m.g.position.set(0,0,0);u.m.g.rotation.y=-(Math.PI/2-.35);figRefresh(u);figAnimate(u,u.m);
  const c=P.cam,tall=cw<ch,H=P.H*1.16,d=H/2/Math.tan(c.fov*Math.PI/360);c.aspect=cw/ch;c.position.set(0,P.H*.5,d);c.lookAt(0,P.H*.5,0);c.setViewOffset(cw,ch,cw*(tall?.27:.3),0,cw,ch);c.updateProjectionMatrix();c.updateMatrixWorld();
  postRender(P.sc,c);ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);
}
function ddmPortraitEnd(){const P=ddm&&ddm.por;if(P&&P.u){moveMesh(P.u,scene);if(P.u.m.ring)P.u.m.ring.visible=true;P.u=null;}}
""")
rep('js/ddmeta.js', "  if(ddm.ph==='report'){ddmRollTick(rdt);const r=mv||", "  if(mv){ddmPortraitFrame(mv,rdt);return;}else ddmPortraitEnd();\n  if(ddm.ph==='report'){ddmRollTick(rdt);const r=mv||")
rep('js/ddmeta.js', "${T('GRENADES',r.items)}${T('BEST RUN',r.best||0)}", "")
rep('js/ddmeta.js', """      <div class="ddm-gl gold">HIS RECORD</div>
      <div class="ddm-chips">${T('LEVEL',(up?'▲':'')+r.lv1,up?'gold':'')}${T('KILLS, ALL',m.kills||0)}${T('MEDALS',m.stars?'★'.repeat(Math.min(3,m.stars))+(m.stars>3?'+':''):'0',m.stars?'gold':'')}</div>
""", """      <div class="ddm-gl gold">LEVEL ${r.lv1}${m.stars?' · '+'★'.repeat(Math.min(3,m.stars)):''}</div>
""")
rep('js/ddmeta.js', "      ${ddmUnl(m).map(q=>`<div class=\"ddm-unl sm${m.level>=q[0]?' new':''}\"><b>${m.level>=q[0]?'★':'LV '+q[0]} ${q[2]}</b><span>${q[3]}</span></div>`).join('')}\n      <div class=\"ddm-gl gold\">HE CARRIES", "      ${ddmUnl(m).filter(q=>m.level>=q[0]).map(q=>`<div class=\"ddm-unl sm new\"><b>★ ${q[2]}</b><span>${q[3]}</span></div>`).join('')}\n      <div class=\"ddm-gl gold\">HE CARRIES")
rep('js/ddmeta.js', "c.setViewOffset(cw,ch,cw*(tall?.27:.3),0,cw,ch)", "c.setViewOffset(cw,ch,cw*(tall?.3:.28),0,cw,ch)")
css=ROOT+'/css/style.css';s=io.open(css,encoding='utf-8').read()
s+="""
/* draft: the man's page on one plain backdrop: the man full height on the left, his name and numbers in one quiet column on the right */
.ddm-mvt,.ddm-mvf{background:none}
.ddm-mvw{background:none;left:auto;right:0;top:calc(62px + env(safe-area-inset-top,0px));bottom:auto;width:48%;padding:0 12px 0 0;display:block}
.ddm-mvn b{font-size:24px}.ddm-mvn span{font-size:10px}
.ddm-mvr{background:none;border-left:0;width:48%;padding:calc(128px + env(safe-area-inset-top,0px)) 12px calc(78px + env(safe-area-inset-bottom,0px)) 0}
.ddm-mvr .ddm-cite{background:none;border-left:3px solid #ffd76a;padding:2px 0 2px 9px;margin-bottom:12px}
.ddm-mvr .ddm-gl{margin:14px 0 6px;color:#9aa6b0}
.ddm-mvr .ddm-chips span{background:none;border-top:1px solid rgba(255,255,255,.14);border-radius:0;padding:6px 0 0}
.ddm-mvr .ddm-unl,.ddm-mvk>div{background:none;border:0;padding-left:0;text-align:left}.ddm-mvk{grid-template-columns:1fr}.ddm-mvk i{display:none}.ddm-mvk b{font-size:11px;font-weight:600;margin:0}
@media (orientation:landscape) and (max-height:520px){.ddm-mvw{width:56%;top:54px}.ddm-mvr{width:56%;padding-top:104px;columns:2}}
"""
io.open(css,'w',encoding='utf-8').write(s)

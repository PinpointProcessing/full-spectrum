// Drafts after Version 258 (not built), Bryan: "Alpha squad man's the guns and Bravo squad is on foot. When Bravo is selected, it goes to the player
// cards with access to the tools. When Alpha is selected, it goes to the stationary guns. If they are not on a gun, their name will appear above the
// gun and when pressed expands the card to be used. Write out some drafts of this."
// Chapter 2 in a wave, a phone upright (390 by 760, twice the pixels), Alpha's four on the guns but one (the heavy MG's gunner, Zielinski in the pictures: his gun empty, him
// standing behind it), Bravo on foot. The game's own picture and its own bars (the row of guns, Bravo's squad bar with its tools) where they fit,
// with the draft's parts laid over them in the page (nothing in the game's files changes):
//   A  Bryan's words as I first read them: ALPHA | BRAVO tabs along the bottom; ALPHA: the row of guns, the man off his gun named on a tag over
//      his gun on the map, a tap on it opens his card over the screen; BRAVO: Bravo's squad bar, their four and their tools
//   B  the other reading of "above the gun": his name on a tab over his gun's tile in the row (nothing over the map), today's tabs where they are;
//      a tap on it opens his card from the bottom; BRAVO: the squad bar, ALPHA's tab marked while one of its men is off his gun
//   C  no tabs: one bar with both halves, Alpha's guns on the left and Bravo on foot on the right, Bravo's tools always one tap away
// Each in three states: 1 Alpha picked with him off his gun, 2 his card, 3 Bravo (C: a Bravo grenade in hand straight from the bar).
// node v259-alpha-bravo-draft.js OUTDIR [port]   (DDROOT = the dday folder to serve; HARNESS = the scratchpad's harness.js)   then v259-alpha-bravo-sheet.py
const {chromium}=require('playwright');const H=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js'),{serve}=H;const fs=require('fs');
// the harness's page, at a phone's size and twice its pixels (the harness's own open has neither)
async function open(browser,url){const page=await browser.newPage({viewport:{width:390,height:760},deviceScaleFactor:2});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const T=fs.readFileSync(H.S+'/deps/node_modules/three/build/three.min.js');await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:T,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
  await page.goto(url);await page.waitForTimeout(2500);await page.evaluate(()=>{try{DD_CAP_T=.3;}catch(e){}});return{page,errors};}
const OUT=process.argv[2]||'ab',PORT=+process.argv[3]||9759,ONLY=(process.env.ONLY||'').split(',').filter(Boolean);fs.mkdirSync(OUT,{recursive:true});
// the draft's parts, made in the page (window.MK): a style sheet, the tabs, the tag, the cards, the tab on the tile, the split bar, rings on the map
const MOCK=()=>{
  const AC='#5ec8ff',BC='#ffb547',FONT='system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  const st=document.createElement('style');st.id='mk-css';st.textContent=`
#banner,#dcNoRe{display:none!important}
body.mk-a .panel,body.mk-c .panel,body.mk-nopanel .panel{display:none!important}
body.mk-c #dcBar,body.mk-c #sq{display:none!important}
body.dd.dcg.mk-sq #sq{display:flex!important}
body.mk-sq #dcBar{display:none!important}
body.mk-a #sq[data-team]::before{display:none!important}
.mk{position:absolute;z-index:60;font:12px ${FONT};color:#e8ecef;letter-spacing:0;text-transform:none;-webkit-font-smoothing:antialiased;box-sizing:border-box}
.mk *{box-sizing:border-box}:where(.mk) button{font-family:${FONT};font-weight:inherit;font-size:inherit;letter-spacing:0;text-transform:none;min-height:0;padding:0;border-radius:0;color:inherit;cursor:pointer}
.mk-tabs{left:8px;right:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;z-index:62}
.mk-tab{display:grid;grid-template-columns:1fr auto;align-items:center;row-gap:1px;padding:6px 10px;border-radius:10px;border:2px solid var(--tc);background:rgba(10,14,18,.9);color:var(--tc);text-align:left}
.mk-tab b{font-size:14px;letter-spacing:.12em;font-weight:800;line-height:1.1}
.mk-tab small{grid-column:1;font-size:9px;letter-spacing:.07em;font-weight:800;color:#9aa6ae;text-transform:uppercase;white-space:nowrap}
.mk-tab .pips{grid-row:1/3;grid-column:2;display:flex;gap:3px}.mk-tab .pips i{width:7px;height:7px;border-radius:50%;background:#5fe08e}.mk-tab .pips i.off{background:none;box-shadow:0 0 0 1.5px #ffd76a inset}
.mk-tab.on{background:var(--tc);color:#0b0f13}.mk-tab.on small{color:#0b0f13;opacity:.72}.mk-tab.on .pips i{box-shadow:0 0 0 1px #0b0f13}.mk-tab.on .pips i.off{background:#ffd76a}
.mk-tag{z-index:61;transform:translate(-50%,-100%);display:flex;align-items:center;gap:7px;padding:4px 11px 4px 4px;border-radius:10px;background:rgba(10,14,18,.94);border:2px solid ${AC};box-shadow:0 0 0 5px rgba(94,200,255,.25),0 6px 16px rgba(0,0,0,.55);white-space:nowrap}
.mk-tag:after{content:"";position:absolute;left:50%;top:100%;transform:translateX(-50%);border:8px solid transparent;border-top:11px solid ${AC};border-bottom:0}
.mk-tag canvas{width:34px;height:34px;border-radius:7px;display:block}
.mk-tag b{display:block;font-size:14px;font-weight:800;letter-spacing:.04em;color:#fff;line-height:1.1}
.mk-tag small{display:block;font-size:9px;font-weight:800;letter-spacing:.08em;color:${AC};text-transform:uppercase;margin-top:2px}
.mk-tag .hp{display:block;height:4px;border-radius:2px;background:rgba(255,255,255,.14);margin-top:3px;overflow:hidden}.mk-tag .hp u{display:block;height:100%;border-radius:2px}
.mk-dim{left:0;top:0;right:0;bottom:0;background:rgba(4,7,10,.42);z-index:62}
.mk-svg{z-index:63;pointer-events:none;overflow:visible}
.mk-in{background:rgba(13,19,25,.97);border:2px solid ${AC};box-shadow:0 12px 34px rgba(0,0,0,.65)}
.mk-in .hd{position:relative;display:grid;grid-template-columns:auto 1fr;column-gap:11px;align-items:center;padding-right:36px}
.mk-in .hd canvas{width:60px;height:60px;border-radius:10px;border:1.5px solid rgba(94,200,255,.55);display:block;grid-row:1/4}
.mk-in .nm{font-size:19px;font-weight:800;color:#fff;letter-spacing:.02em;line-height:1.1}
.mk-in .rl{font-size:10px;font-weight:800;letter-spacing:.1em;color:${AC};text-transform:uppercase;margin-top:2px}
.mk-in .hpr{display:flex;align-items:center;gap:7px;margin-top:6px}.mk-in .hp{flex:1;height:7px;border-radius:4px;background:rgba(255,255,255,.13);overflow:hidden}.mk-in .hp u{display:block;height:100%;border-radius:4px}.mk-in .hpr b{font-size:12px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums}
.mk-in .stt{margin:10px 0 9px;padding:6px 9px;border-radius:8px;background:rgba(255,215,106,.1);border:1px solid rgba(255,215,106,.38);font-size:11.5px;font-weight:700;color:#ffd76a;letter-spacing:.02em}
.mk-in .tools{display:flex;gap:6px}.mk-in .hd+.tools{margin-top:10px}
.mk-tool{flex:1 1 0;min-width:0;min-height:52px;display:grid;grid-template-columns:auto auto;justify-content:center;align-items:center;column-gap:5px;row-gap:3px;padding:5px 3px;border-radius:10px;border:2px solid var(--c);background:rgba(10,14,18,.9);color:var(--c)}
.mk-tool svg{width:22px;height:22px;fill:currentColor}
.mk-tool b{font-size:18px;line-height:1;color:#fff;font-weight:800;font-variant-numeric:tabular-nums}
.mk-tool span{grid-column:1/3;text-align:center;font-size:9px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mk-tool.fp svg{grid-column:1/3;justify-self:center}
.mk-go{display:block;width:100%;margin-top:9px;padding:11px 8px;border-radius:10px;border:0;background:${AC};color:#0b0f13;font-weight:900;font-size:13px;letter-spacing:.07em;text-transform:uppercase}
.mk-go small{display:block;font-size:9.5px;font-weight:700;letter-spacing:.04em;opacity:.7;margin-top:2px;text-transform:none}
.mk-x{position:absolute;right:0;top:0;width:30px;height:30px;border-radius:9px;border:1.5px solid #3a4b5c;background:#16202b;color:#cfd6dc;font-size:18px;line-height:25px;text-align:center;padding:0}
.mk-note{font-size:10px;color:#8d99a3;text-align:center;margin-top:7px}
.mk-card{z-index:64;width:318px;padding:11px;border-radius:14px}
.mk-in.cmp .hd canvas{width:48px;height:48px}.mk-in.cmp .nm{font-size:17px}.mk-in.cmp .stt{margin:8px 0 7px;padding:5px 8px;font-size:11px}.mk-in.cmp .mk-go{padding:10px 8px}
.mk-card .ptr{position:absolute;width:0;height:0;border:10px solid transparent}
.mk-ttab{z-index:40;transform:translate(-50%,-100%);display:flex;align-items:center;gap:5px;padding:3px 9px 3px 3px;border-radius:8px;background:${AC};color:#0b0f13;font:900 11px/1 ${FONT};letter-spacing:.05em;white-space:nowrap;box-shadow:0 0 0 3px rgba(94,200,255,.3),0 3px 8px rgba(0,0,0,.5);z-index:2;text-align:left}
.mk-ttab canvas{width:22px;height:22px;border-radius:5px;display:block}
.mk-ttab b{display:block;font-size:12px;font-weight:900;letter-spacing:.05em}.mk-ttab small{display:block;font-size:7.5px;font-weight:800;letter-spacing:.06em;opacity:.72;margin-top:2px}
.mk-ttab:after{content:"";position:absolute;left:50%;top:100%;transform:translateX(-50%);border:6px solid transparent;border-top:7px solid ${AC};border-bottom:0}
.mk-sheet{z-index:64;left:0;right:0;bottom:0;padding:8px 12px 14px;border-radius:16px 16px 0 0;border-width:2px 0 0;background:#0d1319}
.mk-sheet .grab{width:42px;height:4px;border-radius:2px;background:#3d4c5a;margin:0 auto 9px}
.mk-sheet .ctx{display:flex;align-items:center;gap:7px;margin:0 0 10px;font-size:10px;font-weight:800;letter-spacing:.09em;color:#9aa6b0;text-transform:uppercase}
.mk-sheet .ctx i{font-style:normal;padding:3px 7px;border-radius:6px;border:1.5px solid #ffd76a;color:#ffd76a}
.mk-sheet .row2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}.mk-sheet .row2 .mk-go{margin-top:0}
.mk-go.alt{background:#16202b;border:2px solid #3a4b5c;color:#cfd6dc}
.mk-badge{z-index:6;transform:translateY(-50%);display:flex;align-items:center;gap:5px;padding:3px 8px 3px 3px;border-radius:7px;background:#ffd76a;color:#0b0f13;font:900 10px/1.1 ${FONT};letter-spacing:.04em;white-space:nowrap;box-shadow:0 0 0 2px rgba(11,15,19,.85),0 3px 8px rgba(0,0,0,.45)}
.mk-badge canvas{width:20px;height:20px;border-radius:4px;display:block}.mk-badge small{display:block;font-size:7.5px;font-weight:800;opacity:.72}
.mk-badge:before{content:'';position:absolute;right:100%;top:50%;transform:translateY(-50%);border:6px solid transparent;border-right:7px solid #ffd76a;border-left:0}
.mk-split{z-index:31;left:0;right:0;bottom:0;padding:16px 7px 10px;background:linear-gradient(rgba(10,15,21,0),#0a0f15 15%);display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:stretch}
.mk-half{display:flex;flex-direction:column;border-radius:11px;padding:6px;border:1.5px solid color-mix(in srgb,var(--tc) 55%,transparent);background:rgba(10,14,18,.8)}
.mk-hh{display:flex;align-items:baseline;justify-content:space-between;margin:0 2px 5px;font-size:11.5px;font-weight:900;letter-spacing:.12em;color:var(--tc);white-space:nowrap}
.mk-hh small{font-size:8px;letter-spacing:.06em;color:#9aa6ae;font-weight:800}
.mk-g4,.mk-m4{display:grid;grid-template-columns:1fr 1fr;gap:4px}.mk-g4{flex:1;grid-template-rows:1fr 1fr}.mk-mt{display:flex;flex-direction:column;justify-content:center}
.mk-mt{position:relative;background:#16202b;border:1.5px solid #3a4b5c;border-radius:8px;padding:4px 2px 5px;text-align:center;min-width:0;min-height:47px}
.mk-mt i{display:block;font-style:normal;font-size:7.5px;font-weight:800;letter-spacing:.04em;color:#9aa6b0;white-space:nowrap;overflow:hidden}
.mk-mt b{display:block;font-size:11px;font-weight:800;margin:2px 0 1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}
.mk-mt span{display:block;font-size:7.5px;font-weight:800;color:#7ed29a;white-space:nowrap;overflow:hidden}
.mk-mt.empty{border-color:#ffd76a}.mk-mt.empty span{color:#ffd76a}
.mk-chip{display:block;width:max-content;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:3px auto 2px;padding:2px 4px;border-radius:6px;background:${AC};color:#0b0f13;font-size:9.5px;font-weight:900;letter-spacing:.01em;box-shadow:0 0 0 3px rgba(94,200,255,.3)}
.mk-chip canvas{width:15px;height:15px;border-radius:3px;display:block}
.mk-mm{background:rgba(22,32,43,.95);border:1.5px solid color-mix(in srgb,var(--tc) 45%,transparent);border-radius:7px;padding:4px 5px 5px;min-width:0}
.mk-mm small{display:block;font-size:7.5px;font-weight:800;letter-spacing:.05em;color:var(--tc);white-space:nowrap;overflow:hidden}
.mk-mm b{display:block;font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}
.mk-mm i{display:block;height:4px;border-radius:2px;background:rgba(255,255,255,.12);margin-top:3px;overflow:hidden}.mk-mm i u{display:block;height:100%}
.mk-t4{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;margin-top:5px}
.mk-tt{display:flex;align-items:center;justify-content:center;gap:3px;min-height:38px;border-radius:8px;border:1.5px solid var(--c);background:rgba(10,14,18,.9);color:var(--c);padding:0 2px}
.mk-tt svg{width:18px;height:18px;fill:currentColor}.mk-tt b{font-size:14px;color:#fff;font-weight:800}
.mk-tt.on{background:var(--c);color:#0b0f13;box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 40%,transparent)}.mk-tt.on b{color:#0b0f13}
.mk-pop{z-index:64;width:318px;padding:11px;border-radius:14px}
.mk-aim{z-index:62;left:50%;transform:translateX(-50%);padding:7px 14px;border-radius:9px;background:var(--c,#ffcf4a);color:#0b0f13;font-size:13px;font-weight:700;letter-spacing:.03em;text-align:center;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,.45)}
.mk-aim small{display:block;font-size:10.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;opacity:.75}
`;document.head.appendChild(st);
  const SW=()=>stage.clientWidth,SH=()=>stage.clientHeight,P=(x,y,z=0)=>{const q=toS(x,y,z);return[q[0],q[1]];};
  const add=html=>{const d=document.createElement('div');d.innerHTML=html.trim();const n=d.firstChild;n.classList.add('mk');stage.appendChild(n);return n;};
  const faces=(root,u)=>{for(const c of root.querySelectorAll('canvas[data-face]'))drawFace(c,u);};
  const face=(css)=>`<canvas data-face width="${css*2}" height="${css*2}"></canvas>`;
  const has=(u,T)=>T.k==='nade'?!u.gl:T.k==='rgl'?!!u.gl:u.spec===T.k;
  const toolsOf=u=>DD_TOOLS.filter(T=>T.k!=='revive'&&has(u,T)).map(T=>({k:T.k,label:T.label,col:T.col,svg:T.svg(),n:T.n(u)}));
  const sqTools=t=>{const m=players.filter(p=>p.team===t&&alive(p));return DD_TOOLS.filter(T=>T.k!=='revive'&&m.some(u=>has(u,T))).map(T=>({k:T.k,label:T.label,col:T.col,svg:T.svg(),n:m.reduce((a,u)=>a+T.n(u),0)}));};
  const hpc=h=>h>=70?'#5fe08e':h>=35?'#ffcf4a':'#ff9a4a',hp=u=>Math.max(0,Math.round(u.hp));
  const gname=g=>g.n+(typeof dcSub==='function'?dcSub(g):''),cap=s=>s.charAt(0)+s.slice(1).toLowerCase();
  const mOff=()=>Math.round(hyp(OFF.u.x-OFF.g.x,OFF.u.y-OFF.g.y)/10);
  // the camera: the world point (wx,wy) at (sx,sy) on the screen, at the game's own pitch for that zoom (Newton steps on camT)
  const frame=(wx,wy,sx,sy,Z)=>{yaw=0;zoom=Z;tilt=ddTilt(Z);camShift=0;
    for(let it=0;it<12;it++){updateCamera();const p=P(wx,wy),ex=sx-p[0],ey=sy-p[1];if(Math.abs(ex)<.5&&Math.abs(ey)<.5)break;const h=8;
      camT.x+=h;updateCamera();const px=P(wx,wy);camT.x-=h;camT.z+=h;updateCamera();const pz=P(wx,wy);camT.z-=h;
      const a=(px[0]-p[0])/h,b=(pz[0]-p[0])/h,c=(px[1]-p[1])/h,d=(pz[1]-p[1])/h,det=a*d-b*c;if(Math.abs(det)<1e-9)break;camT.x+=(d*ex-b*ey)/det;camT.z+=(-c*ex+a*ey)/det;}
    updateCamera();};
  const view=k=>{const Z=+(window.MKZ||7);if(k==='guns'||k==='card'){const g=OFF.g,a=dd.dc.guns.find(q=>q.k==='a1');frame((g.x+a.x)/2,(g.y+a.y)/2,+(window.MKGX||205),k==='card'?+(window.MKGY2||296):+(window.MKGY||362),Z);}   // (his card open: the view a little further up, so he and his gun stay in sight over it)
    else{const m=players.filter(p=>p.team==='B'&&alive(p));frame(m.reduce((s,u)=>s+u.x,0)/m.length,m.reduce((s,u)=>s+u.y,0)/m.length,195,+(window.MKBY||345),Z);}};
  // the team's pips: green, yellow, orange by health; the man off his gun hollow amber
  const pips=t=>players.filter(p=>p.team===t).map(u=>`<i class="${t==='A'&&u===OFF.u?'off':''}" style="${t==='A'&&u===OFF.u?'':'background:'+(alive(u)?hpc(hp(u)):'#5b636a')}"></i>`).join('');
  const manned=()=>dd.dc.guns.filter(g=>!g.off&&g.man&&!g.man.npc&&g.man.team==='A').length;
  // A: the tabs along the bottom, just over whichever bar shows
  const tabs=on=>{const top=on==='A'?document.querySelector('#dcBar .dcb-row').getBoundingClientRect().top-stage.getBoundingClientRect().top:document.querySelector('#sq .sq-men').getBoundingClientRect().top-stage.getBoundingClientRect().top;
    const n=add(`<div class="mk-tabs"><button class="mk-tab${on==='A'?' on':''}" style="--tc:${AC}"><b>ALPHA</b><small>Guns · ${manned()} of 4 manned</small><span class="pips">${pips('A')}</span></button><button class="mk-tab${on==='B'?' on':''}" style="--tc:${BC}"><b>BRAVO</b><small>On foot · tools</small><span class="pips">${pips('B')}</span></button></div>`);
    n.style.top=(top-n.offsetHeight-(on==='A'?4:8))+'px';return n;};
  // the man's card: portrait, name, role, health, why he's here, his tools, back on the gun
  const FP='<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 1v4M8 11v4M1 8h4M11 8h4" stroke="currentColor" stroke-width="1.4"/></svg>';
  const cardIn=(u,g,o={})=>{const T=toolsOf(u);return`<div class="hd">${face(o.cmp?24:30)}<div class="nm">${u.name}</div><div class="rl">${u.role} \u00b7 Alpha</div><div class="hpr"><span class="hp"><u style="width:${hp(u)}%;background:${hpc(hp(u))}"></u></span><b>${hp(u)}</b></div><button class="mk-x" aria-label="Close">\u00d7</button></div>
    ${o.st===false?'':`<div class="stt">Off his gun \u00b7 the ${gname(g)} is empty, ${mOff()} m away</div>`}
    <div class="tools">${T.map(t=>`<button class="mk-tool" style="--c:${t.col}">${t.svg}<b>${t.n}</b><span>${t.label}</span></button>`).join('')}<button class="mk-tool fp" style="--c:#8fd3ff">${FP}<span>1st person</span></button></div>${o.go||''}`;};
  // on the map: a ring round him and the way back to his gun (what the card's big button does)
  const ringPath=(x,y,r,z=1)=>{let d='';for(let i=0;i<=28;i++){const a=i/28*Math.PI*2,p=P(x+Math.cos(a)*r,y+Math.sin(a)*r,z);d+=(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}return d+'Z';};
  const backWay=()=>{const u=OFF.u,g=OFF.g,a=P(u.x,u.y,2),b=P(g.x,g.y,4),ang=Math.atan2(b[1]-a[1],b[0]-a[0]),L=hyp(b[0]-a[0],b[1]-a[1]),e=[b[0]-Math.cos(ang)*Math.min(14,L*.3),b[1]-Math.sin(ang)*Math.min(14,L*.3)];
    const hd=[[e[0]+Math.cos(ang)*0,e[1]+Math.sin(ang)*0],[e[0]-Math.cos(ang-0.5)*11,e[1]-Math.sin(ang-0.5)*11],[e[0]-Math.cos(ang+0.5)*11,e[1]-Math.sin(ang+0.5)*11]];
    return add(`<svg class="mk-svg" width="${SW()}" height="${SH()}" style="left:0;top:0"><path d="${ringPath(u.x,u.y,13)}" fill="rgba(94,200,255,.18)" stroke="${AC}" stroke-width="2.5"/><path d="${ringPath(g.x,g.y,20,3)}" fill="none" stroke="#ffd76a" stroke-width="2" stroke-dasharray="5 4"/>
      <path d="M${a[0]} ${a[1]}L${e[0]} ${e[1]}" stroke="${AC}" stroke-width="3" stroke-dasharray="7 5" fill="none"/><path d="M${hd.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')}Z" fill="${AC}"/></svg>`);};
  const tile=k=>document.querySelector(`#dcBar .dcb-t[data-k="${k}"]`);
  // C: the split bar, made from what the game's own row and squad bar say
  const split=(o={})=>{const C=dd.dc,row=dcRow(),B=players.filter(p=>p.team==='B');
    const mt=row.map(g=>{const t=tile(g.k),tx=s=>t?t.querySelector(s).textContent:'';const off=g===OFF.g;
      return`<button class="mk-mt${off?' empty':''}" data-k="${g.k}"><i>${tx('i')}</i>${off?`<div class="mk-chip">${OFF.u.name.toUpperCase()}</div><span>OFF \u00b7 TAP HIM</span>`:`<b>${tx('b')}</b><span>${tx('span')}</span>`}</button>`;}).join('');
    const mm=B.map(u=>`<div class="mk-mm" style="--tc:${BC}"><small>${u.role}</small><b>${u.name}</b><i><u style="width:${hp(u)}%;background:${hpc(hp(u))}"></u></i></div>`).join('');
    const tt=sqTools('B').map(t=>`<button class="mk-tt${o.on===t.k?' on':''}" style="--c:${t.col}" aria-label="${t.label}">${t.svg}<b>${t.n}</b></button>`).join('');
    const n=add(`<div class="mk-split"><div class="mk-half" style="--tc:${AC}"><div class="mk-hh">ALPHA <small>GUNS · ${manned()}/4</small></div><div class="mk-g4">${mt}</div></div><div class="mk-half" style="--tc:${BC}"><div class="mk-hh">BRAVO <small>ON FOOT</small></div><div class="mk-m4">${mm}</div><div class="mk-t4">${tt}</div></div></div>`);
    faces(n,OFF.u);return n;};
  const S={
    A1(){tabs('A');const g=OFF.g,p=P(g.x,g.y,27),u=OFF.u;const n=add(`<div class="mk-tag">${face(17)}<div><b>${u.name.toUpperCase()}</b><small>Off the ${gname(g).toLowerCase()} \u00b7 tap</small><span class="hp"><u style="width:${hp(u)}%;background:${hpc(hp(u))}"></u></span></div></div>`);
      n.style.left=p[0]+'px';n.style.top=(p[1]-13)+'px';faces(n,u);},
    // his card opened from the tag: under the gun and him, its pointer up to the gun; the map dimmed but for him, his gun and the way back
    A2(){tabs('A');add('<div class="mk-dim"></div>');backWay();const g=OFF.g,u=OFF.u,p=P(g.x,g.y,27),q=P(u.x,u.y,0);
      const n=add(`<div class="mk-card mk-in cmp"><i class="ptr"></i>${cardIn(u,g,{cmp:1,go:`<button class="mk-go">Back on the ${gname(g).toLowerCase()}<small>${mOff()} m \u00b7 or tap the map to move him</small></button>`})}</div>`);faces(n,u);
      const w=n.offsetWidth,left=clamp(p[0]-w/2,8,SW()-8-w),top=Math.max(p[1],q[1])+34;n.style.left=left+'px';n.style.top=top+'px';
      const r=n.querySelector('.ptr');r.style.left=clamp(p[0]-left-10,16,w-36)+'px';r.style.top='-21px';r.style.borderBottomColor=AC;},
    A3(){tabs('B');},
    // the tab over his gun's tile in the row: his face and name; a tap opens his card
    B1(){const t=tile(OFF.g.k),u=OFF.u;if(!t)return;const r=t.getBoundingClientRect(),sr=stage.getBoundingClientRect();
      const n=add(`<div class="mk-ttab">${face(11)}<div><b>${u.name.toUpperCase()}</b><small>OFF HIS GUN \u00b7 TAP</small></div></div>`);n.style.left=(r.left-sr.left+r.width/2)+'px';n.style.top=(r.top-sr.top-9)+'px';faces(n,u);},
    B2(){document.body.classList.add('mk-nopanel');backWay();const g=OFF.g,u=OFF.u;const n=add(`<div class="mk-sheet mk-in"><div class="grab"></div><div class="ctx"><span>${gname(g)}</span><i>EMPTY \u00b7 ${mOff()} M AWAY</i><span style="margin-left:auto;color:${AC}">ALPHA</span></div>${cardIn(u,g,{st:false,go:`<div class="row2"><button class="mk-go">Back on the gun<small>the ${gname(g).toLowerCase()}, ${mOff()} m</small></button><button class="mk-go alt">Close<small>tap the map to move him</small></button></div>`})}</div>`);faces(n,u);},
    // Bravo picked: ALPHA's tab says who's off his gun
    B3(){const t=document.querySelector('.tab[data-team="A"]'),u=OFF.u;if(!t)return;const r=t.getBoundingClientRect(),sr=stage.getBoundingClientRect();
      const n=add(`<div class="mk-badge">${face(10)}<div>${u.name.toUpperCase()}<small>OFF HIS GUN</small></div></div>`);n.style.left=(r.right-sr.left+10)+'px';n.style.top=(r.top-sr.top+r.height/2)+'px';faces(n,u);},
    C1(){split();},
    C2(){const s=split();backWay();const ch=s.querySelector('.mk-chip').getBoundingClientRect(),sr=stage.getBoundingClientRect(),g=OFF.g,u=OFF.u;
      const n=add(`<div class="mk-pop mk-in cmp"><i class="ptr" style="position:absolute;width:0;height:0;border:10px solid transparent;border-top-color:${AC};bottom:-21px"></i>${cardIn(u,g,{cmp:1,go:`<button class="mk-go">Back on the ${gname(g).toLowerCase()}<small>${mOff()} m \u00b7 or tap the map to move him</small></button>`})}</div>`);faces(n,u);
      const w=n.offsetWidth,h=n.offsetHeight,left=clamp(ch.left-sr.left+ch.width/2-w/2,8,SW()-8-w),top=s.getBoundingClientRect().top-sr.top+12-h;n.style.left=left+'px';n.style.top=top+'px';n.querySelector('.ptr').style.left=(ch.left-sr.left+ch.width/2-left-10)+'px';},
    C3(){const s=split({on:dd.toolK});const T=DD_TOOLS.find(t=>t.k===dd.toolK);if(!T)return;const left=players.filter(p=>p.team==='B'&&alive(p)).reduce((n,u)=>n+T.n(u),0);
      const n=add(`<div class="mk-aim" style="--c:${T.col}">${T.label} \u00b7 ${dd.toolU?dd.toolU.name:''} \u00b7 ${left} left<small>Tap where to throw it \u00b7 tap here to cancel</small></div>`);n.style.top=(s.getBoundingClientRect().top-stage.getBoundingClientRect().top+8-n.offsetHeight)+'px';}};
  window.MK={
    clear(){for(const n of document.querySelectorAll('.mk'))n.remove();document.body.classList.remove('mk-a','mk-b','mk-c','mk-sq','mk-nopanel');const t=document.querySelector('.tab[data-team="A"]');if(t){t.style.position='';t.style.overflow='';}},
    pre(id){MK.clear();if(dd.toolK)ddToolEnd();const v=id[0],k=id[1],bravo=k==='3';document.body.classList.add('mk-'+v.toLowerCase());
      if(!window.MK_LABEL){window.MK_LABEL=label;label=function(t,...a){if(window.MK_HIDE&&typeof t==='string'&&t.indexOf(MK_HIDE)===0)return;return MK_LABEL(t,...a);};}
      window.MK_HIDE=v==='A'&&!bravo?OFF.g.n+' \u00b7':null;
      if(bravo){selectTeam('B');dd.active='B';if(v!=='C')document.body.classList.add('mk-sq');else ddToolUse('nade');view('bravo');}
      else{selectTeam('A');dd.active='A';view(k==='2'?'card':'guns');}
      DRAW();},
    post(id){S[id]();},
    info(){const g=OFF.g,u=OFF.u;return{gun:P(g.x,g.y,20).map(Math.round),man:P(u.x,u.y,10).map(Math.round),others:dd.dc.guns.filter(q=>!q.off).map(q=>[q.k,P(q.x,q.y,20).map(Math.round)]),bravo:players.filter(p=>p.team==='B'&&alive(p)).map(p=>[p.name,P(p.x,p.y,10).map(Math.round)]),tool:dd.toolK,toolU:dd.toolU&&dd.toolU.name,off:u.name,tools:toolsOf(u).map(t=>t.k+t.n)};}};
};
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(259);localStorage.removeItem('warehouseYard.ddmeta.v1');
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%3==0){panTick(.1);ddFrame(.1,simT);}}};
  window.DRAW=()=>{updateCamera();render(1/30,simT);drawOverlay(1/30,simT);hud();};});
await ev(()=>{Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(259);document.querySelector('#ddCtrBtn').click();});await page.waitForTimeout(900);   // (seeded and clicked in one go, so the roster's names come out the same every run)
// the wave under way; nobody of ours hurt; Alpha's four on the four guns, then the one on the heavy MG off it and standing behind it
const S=await ev(()=>{const C=dd.dc,d0=damage;window.damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);let i=0;while(C.ph!=='w1'&&i++<900)RUN(.1);RUN(9);
  const A=players.filter(p=>p.team==='A'&&alive(p)),K=['a1','h1','n1','n2'];
  for(let k=0;k<4&&k<A.length;k++){const g=C.guns.find(q=>q.k===K[k]);if(g.man&&g.man!==A[k])dcLeave(g);for(const q of C.guns)if(q.man===A[k]&&q!==g)dcLeave(q);dcSit(g,A[k]);}
  RUN(.2);const g=C.guns.find(q=>q.k==='h1'),u=g.man;dcLeave(g);
  {let best=null;for(let r=0;r<40&&!best;r+=3)for(let a=0;a<6.3&&!best;a+=.4){const x=g.x+18+Math.cos(a)*r,y=g.y+46+Math.sin(a)*r;if(isFree(x,y,5))best=[x,y];}if(best){u.x=best[0];u.y=best[1];}}
  u.path=[];u.ang=-Math.PI/2;window.OFF={u,g};C.picked=true;
  {const B=players.filter(p=>p.team==='B'&&alive(p)),T0=[+(window.MKBX||735),+(window.MKBY0||372)];for(const q of C.guns)if(q.going&&q.going.team==='B')q.going=null;
    const c=coverPts.filter(c=>c.y<425&&isFree(c.x,c.y,5)&&C.guns.every(q=>hyp(c.x-q.x,c.y-q.y)>48)&&hyp(c.x-u.x,c.y-u.y)>40).sort((a,b)=>hyp(a.x-T0[0],a.y-T0[1])-hyp(b.x-T0[0],b.y-T0[1])),pick=[];
    for(const p of c){if(pick.every(q=>hyp(q.x-p.x,q.y-p.y)>22))pick.push(p);if(pick.length>=B.length)break;}
    B.forEach((m,i)=>{if(m.dcGun&&m.dcGun.man!==m)m.dcGun=null;const p=pick[i];if(p&&!m.dcGun){m.x=p.x;m.y=p.y;}m.path=[];m.ang=-Math.PI/2;});}
  return{off:u.name,role:u.role,gun:g.k,A:A.map(p=>p.name),B:players.filter(p=>p.team==='B').map(p=>p.name+'@'+Math.round(p.x)+','+Math.round(p.y))};});
console.log(JSON.stringify(S));
await ev(MOCK);
for(const id of['A1','A2','A3','B1','B2','B3','C1','C2','C3']){if(ONLY.length&&!ONLY.includes(id))continue;
  await ev(id=>MK.pre(id),id);await page.waitForTimeout(450);await ev(id=>{DRAW();MK.post(id);},id);await page.waitForTimeout(250);
  await page.screenshot({path:`${OUT}/${id}.png`});console.log(id,JSON.stringify(await ev(()=>MK.info())));}
console.log('errors',errors.slice(0,3));await b.close();srv.close();})();

const {chromium}=require('playwright');const {serve,open,REPO}=require('./harness.js');
(async()=>{const port=9953,srv=await serve(REPO,port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/warehouse-yard.html?gfx=0`);
await page.setViewportSize({width:1420,height:980});await page.click('#ddBtn');await page.waitForTimeout(1200);
console.log(await page.evaluate(()=>{window.requestAnimationFrame=()=>0;
  const W=1420,Hh=980,c=document.createElement('canvas');c.id='draft';c.width=W*2;c.height=Hh*2;c.style.cssText='position:fixed;left:0;top:0;width:'+W+'px;height:'+Hh+'px;z-index:99999;background:#14181c';document.body.appendChild(c);
  const g=c.getContext('2d');g.scale(2,2);g.fillStyle='#14181c';g.fillRect(0,0,W,Hh);
  // the proposal: the hilltop carried south to the cliff's edge over the path (a terrace cut through the rim), the bunker on its lip
  const TER={x0:800,x1:964,y0:170,y1:208},GUNS=[{x:842,y:196,ang:Math.PI/2+.75,n:'west gun: down the path'},{x:882,y:200,ang:Math.PI/2,n:'middle gun: the beach'},{x:922,y:196,ang:Math.PI/2-.55,n:'east gun: the beach, right'}],R=420,ARC=.62;
  const Hn=(dx,y)=>ddH(dx+DDX,y),Hp=(dx,y)=>dx>=TER.x0&&dx<=TER.x1&&y>=TER.y0&&y<TER.y1?96:(dx>=TER.x0-8&&dx<=TER.x1+8&&y>=TER.y1&&y<TER.y1+10?Math.min(Hn(dx,y),80):Hn(dx,y));
  const see=(H,ax,ay,bx,by)=>{const d=Math.hypot(bx-ax,by-ay);if(d<30)return true;const ha=H(ax,ay)+15,hb=H(bx,by)+15,n=Math.ceil(d/10);for(let i=1;i<n;i++){const t=i/n;if(t*d<14||(1-t)*d<14)continue;if(H(ax+(bx-ax)*t,ay+(by-ay)*t)>ha+(hb-ha)*t+3)return false;}return true;};
  // ---- left panel: plan
  const X0=500,Y0=20,S=1.22,ox=30,oy=70,px=dx=>ox+(dx-X0)*S,py=y=>oy+(y-Y0)*S;
  g.fillStyle='#e8ecef';g.font='700 19px system-ui';g.fillText('Hill bunker · draft',30,34);g.font='13px system-ui';g.fillStyle='#9aa7b1';g.fillText('Plan, north at the top. Green = ground the moved bunker’s three guns can hit (worked out from the real terrain).',30,54);
  const cov={beach:[0,0],path:[0,0]};g.save();g.beginPath();g.rect(ox,oy,(1000-X0)*S,(770-Y0)*S);g.clip();
  for(let dx=X0;dx<1000;dx+=8)for(let y=Y0;y<770;y+=8){const h=Hp(dx+4,y+4);let col;
    if(y>=316)col=y>700?`rgb(${60},${98+((770-y)*.2)|0},${120})`:`rgb(${196-((y-316)*.03)|0},${178},${132})`;
    else{const k=Math.max(0,Math.min(1,(h-20)/150));col=`rgb(${(92+k*70)|0},${(96+k*62)|0},${(84+k*52)|0})`;}
    g.fillStyle=col;g.fillRect(px(dx),py(y),8*S+.6,8*S+.6);
    let hit=false;for(const G of GUNS){const a=Math.atan2(y+4-G.y,dx+4-G.x),d=Math.hypot(dx+4-G.x,y+4-G.y);let da=Math.abs(a-G.ang);if(da>Math.PI)da=2*Math.PI-da;if(d<=R&&da<=ARC&&see(Hp,G.x,G.y,dx+4,y+4)){hit=true;break;}}
    const onPath=dx>=598&&y>=212&&y<300,onBeach=y>=340&&y<700;
    if(onBeach&&Math.hypot(dx-882,y-200)<=R){cov.beach[1]++;if(hit)cov.beach[0]++;}if(onPath){cov.path[1]++;if(hit)cov.path[0]++;}
    if(hit&&y>=205){g.fillStyle='rgba(60,220,110,.34)';g.fillRect(px(dx),py(y),8*S+.6,8*S+.6);}}
  // the path's outline, the wire
  g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1.2;g.setLineDash([5,4]);g.strokeRect(px(598),py(212),(1000-598)*S,(300-212)*S);g.setLineDash([]);
  g.strokeStyle='#3b3f44';g.lineWidth=2;g.beginPath();g.moveTo(px(X0),py(344));g.lineTo(px(1000),py(344));g.stroke();
  const lab=(t,x,y,col,al)=>{g.font='700 12px system-ui';g.textAlign=al||'left';const w=g.measureText(t).width+10;g.fillStyle='rgba(12,16,20,.82)';g.fillRect((al==='center'?x-w/2:al==='right'?x-w:x)-0,y-13,w,18);g.fillStyle=col;g.fillText(t,(al==='center'?x:al==='right'?x-5:x+5),y);g.textAlign='left';};
  // the bunkers that stay
  g.fillStyle='#6d7278';for(const[x,y,w,h]of[[626,250,84,48],[820,250,170,48]])g.fillRect(px(x),py(y),w*S,h*S);
  lab('PILLBOX',px(668),py(244),'#d9dee2','center');lab('UPPER BUNKER',px(905),py(318),'#d9dee2','center');lab('THE PATH',px(760),py(232),'#ffffff','center');lab('WIRE',px(520),py(338),'#aab3ba');lab('BEACH',px(560),py(520),'#3a2f1c');lab('THE WAY UP',px(540),py(120),'#e8ecef','center');
  // now: where it stands
  g.strokeStyle='#ff6a5a';g.lineWidth=2;g.setLineDash([6,4]);g.strokeRect(px(830),py(112),100*S,48*S);g.setLineDash([]);lab('NOW: set back on the hilltop',px(880),py(104),'#ff8a7a','center');lab('rock rim in front: it only hit the beach through the rock',px(820),py(86),'#ff8a7a','center');
  // proposed: the terrace and the bunker
  g.fillStyle='rgba(255,196,84,.25)';g.fillRect(px(TER.x0),py(TER.y0),(TER.x1-TER.x0)*S,(TER.y1-TER.y0)*S);g.strokeStyle='#ffc454';g.lineWidth=1.5;g.strokeRect(px(TER.x0),py(TER.y0),(TER.x1-TER.x0)*S,(TER.y1-TER.y0)*S);
  g.fillStyle='#ffc454';g.fillRect(px(826),py(184),112*S,22*S);g.fillStyle='#14181c';for(const G of GUNS){g.beginPath();g.arc(px(G.x),py(G.y),3.4,0,7);g.fill();}
  for(const G of GUNS){g.strokeStyle='rgba(255,196,84,.9)';g.lineWidth=1.3;for(const s of[-1,1]){g.beginPath();g.moveTo(px(G.x),py(G.y));g.lineTo(px(G.x+Math.cos(G.ang+s*ARC)*R),py(G.y+Math.sin(G.ang+s*ARC)*R));g.stroke();}g.beginPath();g.arc(px(G.x),py(G.y),R*S,G.ang-ARC,G.ang+ARC);g.stroke();}
  lab('PROPOSED: on the lip, right over the path',px(812),py(186),'#ffc454','right');lab('(rim cut away into a terrace)',px(812),py(203),'#ffc454','right');g.restore();
  // ---- right panel: a cut north-south through the middle gun
  const cx0=700,cw=690,cy0=140,chh=330,CX=882,ys=[90,620],hs=[-6,140],sx=y=>cx0+(y-ys[0])/(ys[1]-ys[0])*cw,sy=h=>cy0+chh-(h-hs[0])/(hs[1]-hs[0])*chh;
  g.fillStyle='#e8ecef';g.font='700 15px system-ui';g.fillText('Cut through the hill, looking west (north on the left)',cx0,cy0-64);
  g.fillStyle='#1b2026';g.fillRect(cx0-8,cy0-50,cw+16,chh+76);
  const prof=(H,fill,stroke,dash)=>{g.beginPath();g.moveTo(sx(ys[0]),sy(hs[0]));for(let y=ys[0];y<=ys[1];y+=2)g.lineTo(sx(y),sy(H(CX,y)));g.lineTo(sx(ys[1]),sy(hs[0]));g.closePath();if(fill){g.fillStyle=fill;g.fill();}g.strokeStyle=stroke;g.lineWidth=2;g.setLineDash(dash||[]);g.beginPath();for(let y=ys[0];y<=ys[1];y+=2){const X=sx(y),Y=sy(H(CX,y));y===ys[0]?g.moveTo(X,Y):g.lineTo(X,Y);}g.stroke();g.setLineDash([]);};
  prof(Hn,'rgba(255,106,90,.28)','#ff6a5a',[5,4]);prof(Hp,'#6f7466','#c9cfb8');
  // the bunkers and sight lines
  g.fillStyle='rgba(255,106,90,.9)';g.fillRect(sx(112),sy(96+26),sx(160)-sx(112),sy(96)-sy(96+26));g.fillStyle='#ffc454';g.fillRect(sx(184),sy(96+26),sx(206)-sx(184),sy(96)-sy(96+26));
  g.fillStyle='#6d7278';g.fillRect(sx(250),sy(Hn(CX,270)+24),sx(298)-sx(250),sy(Hn(CX,270))-sy(Hn(CX,270)+24));
  const line=(y0,h0,y1,h1,col)=>{g.strokeStyle=col;g.lineWidth=1.4;g.beginPath();g.moveTo(sx(y0),sy(h0));g.lineTo(sx(y1),sy(h1));g.stroke();};
  for(const y of[312,380,470,580])line(204,96+15,y,Hp(CX,y)+15,'rgba(60,220,110,.95)');
  line(160,96+15,470,Hn(CX,470)+15,'rgba(255,106,90,.95)');
  lab('now',sx(136),sy(96+34),'#ff8a7a','center');lab('proposed',sx(196),sy(96+34),'#ffc454','center');lab('upper bunker, on the path',sx(300),sy(Hn(CX,270)+6),'#d9dee2','left');lab('beach',sx(520),sy(34),'#e8d9a8','center');lab('rock rim, cut away',sx(176),sy(76),'#ff8a7a','right');
  g.font='12px system-ui';g.fillStyle='#9aa7b1';g.fillText('red line: today’s shot at the beach, straight through the rim.   green: clear shots from the lip.',cx0,cy0+chh+44);
  // ---- notes
  const pc=k=>Math.round(100*cov[k][0]/cov[k][1]);
  const N=['What changes','• The hilltop is carried about 4 m south to the cliff’s edge, and the bunker sits on that lip, 4 m above the upper','   bunker and the path, 8 m above the sand.','• Three guns as now. West gun looks down the length of the path; the other two cover the beach.','• From there it can hit '+pc('path')+'% of the path and '+pc('beach')+'% of the beach inside its 42 m reach.','   Today, with bullets stopped by the ground, it can hit none of either.','• Blind spots that stay: right under the cliff below it, and the far left of the beach (out of reach).','• You still take it the same way: up the way up, then east along the hilltop to its open back.','','Questions','1. Reach: 42 m like the other machine guns, or longer since it sits high (it would then cover more beach)?','2. Should the upper bunker below it stay, or does this one replace it?','3. Keep the grenadier up there lobbing rifle grenades onto the path?'];
  g.font='700 15px system-ui';let yy=cy0+chh+84;for(const t of N){g.fillStyle=t==='What changes'||t==='Questions'?'#e8ecef':'#c3ccd3';g.font=(t==='What changes'||t==='Questions'?'700 15px':'13px')+' system-ui';g.fillText(t,cx0,yy);yy+=t===''?10:21;}
  return 'path '+pc('path')+'% beach '+pc('beach')+'%';}));
await page.locator('#draft').screenshot({path:'dday-hill-bunker-draft.png'});
console.log(errors);await b.close();srv.close();})();

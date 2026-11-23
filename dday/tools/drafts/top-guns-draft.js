// Draft after Version 220 (Bryan: "the machine guns on the top hill do not appear accessible until you approach them. Maybe when the player reaches the top
// hill the camera can pan over to it? Or just make it have circles once the player is in the area? Let's draft and brainstorm"). The moment the top of the
// hill is taken, as the game shows it, and two ideas drawn over the page (nothing in the game is changed):
//   A  a gold arrow at the screen's edge toward the free guns with the distance, and over them a tall marker, MACHINE GUNS · TAP TO MAN
//   B  the camera glances across to the bunker for a moment (after it has shown where the tank comes from), then back
// node top-guns-draft.js [port out]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const PORT=+process.argv[2]||9787,OUT=process.argv[3]||'topguns';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4003);localStorage.removeItem('warehouseYard.ddmeta.v1');});
await page.click('#ddBtn');await page.waitForTimeout(600);
const snap=async n=>{await page.waitForTimeout(450);await ev(()=>SHOW());await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${n}.png`});};
const info=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%3==0){panTick(.1);ddFrame(.1,simT);}}};RUN(20);
  for(const e of enemies){e.stunT=1e9;if(e.y>-470||e.tag==='crest'||e.tag==='heavy'){e.hp=0;e.dead=true;}}for(const u of dd.npcs){u.hp=0;u.dead=true;if(u.m)u.m.g.visible=false;}ddWaves=()=>{};
  for(const k of['beach','left','nest','hill','outpost','draw'])dd.held[k]=true;
  const put=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
  put('B',330,-360);put('A',290,-400);selectTeam('A');dd.active='A';dd.track={team:'A'};ddGoSquad('A');RUN(9);   // the top taken, the camera's own turn done
  window.EXTRA=null;window.SHOW=()=>{bigText('');ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();if(EXTRA)EXTRA();};
  const G=dd.post.guns.filter(g=>g.z==='heavy'),u=players.find(p=>p.team==='A'&&alive(p));
  window.MARK=()=>{const free=G.filter(g=>ddPostHeld(g)&&!g.man);if(!free.length)return;const mx=free.reduce((a,g)=>a+g.gx,0)/free.length,my=free.reduce((a,g)=>a+g.gy,0)/free.length,d=Math.round(Math.min(...players.filter(p=>p.team==='A'&&alive(p)).map(p=>hyp(p.x-mx,p.y-my)))/10);
    const w=ddWhere(mx,my,30),now=performance.now()/1000,pu=.5+.5*Math.sin(now*4);
    if(w.on){ox.save();const top=w.y-70;ox.strokeStyle='rgba(255,206,96,.9)';ox.lineWidth=3;ox.setLineDash([6,5]);ox.beginPath();ox.moveTo(w.x,w.y-6);ox.lineTo(w.x,top+18);ox.stroke();ox.setLineDash([]);
        ox.font='800 13px system-ui,Arial';ox.textAlign='left';ox.textBaseline='alphabetic';const t='MACHINE GUNS · TAP TO MAN',tw=ox.measureText(t).width+18,x0=clamp(w.x-tw/2,8,cw-tw-8);ox.fillStyle='rgba(10,14,18,.9)';ox.strokeStyle='rgb(255,206,96)';ox.lineWidth=2;ox.beginPath();ox.rect(x0,top-10,tw,26);ox.fill();ox.stroke();ox.fillStyle='rgb(255,206,96)';ox.fillText(t,x0+9,top+8);ox.restore();}
    else{const B=ddBox(),cx=(B.l+B.r)/2,cy=(B.top+B.bot)/2,k=Math.min(((B.r-B.l)/2-8)/Math.max(1e-6,Math.abs(w.dx)),((B.bot-B.top)/2-8)/Math.max(1e-6,Math.abs(w.dy)));
      let x=cx+w.dx*k,y=cy+w.dy*k;ox.save();ox.font='800 13px system-ui,Arial';ox.textAlign='left';ox.textBaseline='alphabetic';const t=`MACHINE GUNS · ${d} m`,tw=ox.measureText(t).width+44;
      x=clamp(x,tw/2+(y>B.bot-190?96:10),cw-tw/2-10);y=clamp(y,B.top+22,B.bot-24)-pu*3;   // (clear of the team tabs at the bottom left)
      ox.fillStyle='rgba(10,14,18,.92)';ox.strokeStyle='rgb(255,206,96)';ox.lineWidth=2;ox.beginPath();ox.rect(x-tw/2,y-15,tw,30);ox.fill();ox.stroke();
      ox.translate(x-tw/2+17,y);ox.rotate(Math.atan2(w.dy,w.dx));ox.beginPath();ox.moveTo(10,0);ox.lineTo(-6,7);ox.lineTo(-2,0);ox.lineTo(-6,-7);ox.closePath();ox.fillStyle='rgb(255,206,96)';ox.fill();ox.setTransform(devicePixelRatio||1,0,0,devicePixelRatio||1,0,0);
      ox.fillStyle='rgb(255,206,96)';ox.fillText(t,x-tw/2+34,y+5);ox.restore();}};
  return{held:!!dd.held.crest,guns:G.map(g=>[Math.round(g.gx-DDX),Math.round(g.gy),ddPostHeld(g)]),yaw:+yaw.toFixed(2),cam:[Math.round(camT.x-DDX),Math.round(camT.z)],on:G.map(g=>{toSBack=false;const q=toS(g.gx,g.gy,8);return!toSBack&&q[0]>0&&q[0]<cw&&q[1]>60&&q[1]<ch-140;})};});
console.log(JSON.stringify(info));
await snap('now');
await ev(()=>{EXTRA=MARK;});await snap('a-arrow');
// B: the camera glances over to the bunker (drawn with A's marker so the guns read)
await ev(()=>{const G=dd.post.guns.filter(g=>g.z==='heavy'),u=players.find(p=>p.team==='A'&&alive(p)),mx=(G[0].gx+G[1].gx)/2,my=(G[0].gy+G[1].gy)/2;dd.track=null;camPan=null;camT.x=(u.x+mx)/2;camT.z=(u.y+my)/2;yaw=Math.atan2(-(mx-u.x),-(my-u.y));if(typeof updateCamera==='function')updateCamera();EXTRA=MARK;});
await snap('b-glance');
// and from further off, coming up the draw: is anything on the screen at all?
await ev(()=>{const put=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[]}));put('A',420,-330);put('B',450,-300);dd.track={team:'A'};ddGoSquad('A');RUN(6);EXTRA=null;});
await snap('far-now');await ev(()=>{EXTRA=MARK;});await snap('far-a');
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();

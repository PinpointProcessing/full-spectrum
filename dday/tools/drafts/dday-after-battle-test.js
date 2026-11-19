const {chromium}=require('playwright');const {serve,open,REPO}=require('./harness.js');
const W=+process.argv[2]||390,H=+process.argv[3]||760;
(async()=>{const port=9962+(W>H?1:0),srv=await serve(REPO,port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/warehouse-yard.html?gfx=2`);
await page.setViewportSize({width:W,height:H});await page.evaluate(()=>localStorage.removeItem('warehouseYard.ddmeta.v1'));
await page.click('#ddBtn');await page.waitForTimeout(1200);
const ev=(f,a)=>page.evaluate(f,a);
const fr=async(n,name)=>{await ev(n=>{for(let i=0;i<n;i++)ddMetaFrame(.05,performance.now()/1000);},n);await page.waitForTimeout(450);await ev(()=>ddMetaFrame(.02,performance.now()/1000));if(name)await page.screenshot({path:`m_${name}_${W}.png`});};
const log=[];
log.push(await ev(()=>{window.requestAnimationFrame=()=>0;for(let i=0;i<900&&!dd.land.done;i++)update(1/30);for(let i=0;i<40;i++){for(const e of enemies)e.cool=9;update(1/30);}
  const r=['rm on every man '+players.every(p=>p.rm&&p.rm.st),'stats '+JSON.stringify(players[0].rm.st)+' aimK '+players[0].aimK.toFixed(3)+' nerveK '+players[0].nerveK.toFixed(2)];
  players[1].stats.kills=14;players[0].stats.kills=2;players[0].stats.revives=6;players[5].stats.kills=9;players[2].stats.kills=5;
  const d=players[3];d.stats.kills=3;ddKill(d,'shot');for(let i=0;i<60;i++){for(const e of enemies)e.cool=9;update(1/30);}
  r.push('players '+players.length+' fallen in units '+units.filter(u=>u.rm&&u.dead).length);
  dd.won=true;ddFinish();r.push('state '+state+' ph '+(ddm&&ddm.ph)+' rows '+ddm.rows.length+' dead '+ddm.dead.length+' mvp '+(ddm.mvp&&ddm.mvp.name)+' medals '+ddRoster.medals);
  r.push('roster A '+ddRoster.squads.A.map(m=>m?m.role[0]+m.level:'-')+' B '+ddRoster.squads.B.map(m=>m?m.role[0]+m.level:'-')+' recruits '+ddRoster.recruits.length+' starred '+ddRoster.recruits.filter(m=>m.cost).length);return r.join('\n');}));
await page.waitForTimeout(2600);await fr(6,'1report');
await page.evaluate(()=>ddmRollTap(true));await page.waitForTimeout(150);await page.click('#ddm [data-a="base"]');await fr(6,'2base');
await page.click('#ddm [data-a="armory"]');await fr(2,'2armory');await page.click('#ddm [data-a="armoryx"]');
await page.click('#ddm [data-a="barracks"]');await fr(30,'3room');
await page.click('#ddm .ddm-sq[data-t="A"][data-i="1"]');await fr(30,'4unit');
await page.click('#ddm .ddm-kit [data-k="w"]');await fr(2,'5swap');
log.push(await ev(()=>'swap options '+ddmSwapList(ddmSel(),'w').map(o=>o.n+'/'+o.from).join(' | ')));
await page.click('#ddm .ddm-kit [data-k="t"]');await fr(2);const sw=await page.$('#ddm .ddm-swap [data-a="swap"]');if(sw){await sw.click();await fr(2);}
log.push(await ev(()=>'after tool swap: '+DDM_ITEMS[ddmSel().gear.t].n));
await page.click('#ddm [data-a="replace"]');await fr(4);
log.push(await ev(()=>{const i=ddRoster.recruits.findIndex(m=>m.cost===1);window.CI=i>=0?i:0;return 'pick recruit '+CI+' cost '+ddRoster.recruits[CI].cost+' role '+ddRoster.recruits[CI].role;}));
await page.click(`#ddm .ddm-pool [data-i="${await ev(()=>CI)}"]`);await fr(30,'6recruit');
await page.click('#ddm [data-a="take"]');await fr(20,'7taken');
log.push(await ev(()=>'after recruit: A '+ddRoster.squads.A.map(m=>m?m.name+'/'+m.role[0]:'-')+' reserve '+ddRoster.reserve.map(m=>m.name)+' medals '+ddRoster.medals+' recruits '+ddRoster.recruits.length));
// B side, an open slot (the dead man's), reserve man back in
await page.click('#ddm .ddm-sq[data-t="A"][data-i="3"]');await fr(20,'8open');
await page.click('#ddm [data-a="tab"][data-v="res"]');await fr(2);await page.click('#ddm .ddm-pool [data-i="0"]');await fr(20);await page.click('#ddm [data-a="take"]');await fr(10);
log.push(await ev(()=>'reserve man into the open slot: A '+ddRoster.squads.A.map(m=>m?m.name:'-')+' reserve '+ddRoster.reserve.length));
await page.click('#ddm .ddm-sq[data-t="B"][data-i="2"]');await fr(30,'9bravo');
await page.click('#ddm [data-a="reserve"]');await fr(6);log.push(await ev(()=>'Reserve button: B '+ddRoster.squads.B.map(m=>m?m.name:'-')+' reserve '+ddRoster.reserve.length+' sub '+ddm.sub));
await page.click('#ddm [data-a="back"]');await fr(6);
// tap a man in the room
const pt=await ev(()=>{const r=ddm.room,u=r.men.find(q=>q.slotK==='B0');r.v.set(u.x,16,u.y).project(r.cam);const bx=stage.getBoundingClientRect();return[bx.left+(r.v.x+1)*cw/2,bx.top+(1-r.v.y)*ch/2];});
await page.mouse.click(pt[0],pt[1]);await fr(4);log.push(await ev(()=>'tap on a man: slot '+JSON.stringify(ddm.slot)));
await page.click('#ddm [data-a="wide"]');await fr(4);await page.click('#ddm [data-a="out"]');await fr(4);
// next mission with the roster
const saved=await ev(()=>JSON.parse(localStorage.getItem('warehouseYard.ddmeta.v1')));
await page.click('#ddm [data-a="next"]');await page.waitForTimeout(1500);
log.push(await ev(s=>{const r=['next: state '+state+' ddm '+!!ddm+' #ddm '+!!document.querySelector('#ddm')+' players '+players.length];
  const A=s.squads.A.map(m=>m&&m.name),got=players.filter(p=>p.team==='A').map(p=>p.name);r.push('Alpha lands as the roster '+JSON.stringify(A)+' -> '+JSON.stringify(got));
  const m=players.find(p=>p.rm&&p.rm.trait);if(m)r.push('trait man '+m.name+' '+m.rm.trait+' nerveK '+m.nerveK+' dmgIn '+m.dmgIn.toFixed(2)+' spdK '+m.spdK.toFixed(2));
  r.push('levels '+players.map(p=>p.level).join(','));return r.join('\n');},saved));
console.log(log.join('\n'));console.log('errors',JSON.stringify(errors).slice(0,600));await b.close();srv.close();})();

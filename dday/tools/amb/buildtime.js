// Time each of ddamb.js's builds (ms) in the page: node buildtime.js PO
const {chromium}=require('playwright');const SP='/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad';
const {serve,open}=require(SP+'/harness.js');
(async()=>{const port=9700+(+process.argv[2]||63),srv=await serve(process.env.DDROOT||SP+'/wt/amb/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);
const r=await page.evaluate(async()=>{window.requestAnimationFrame=()=>0;const off=new OfflineAudioContext(2,44100,44100);window.AudioContext=function(){return off;};AC=null;audioInit();
  for(let i=0;i<80&&!(DSFX.buf.usfar&&DSFX.buf.karfar);i++)await new Promise(r=>setTimeout(r,100));
  ddA=null;ddAmbBuild();const o={};for(const[id,fn]of DDA_BUILD){let t0=performance.now();let r=fn(),mx=0,tot=0;if(r&&r.next){let s;do{s=r.next();const d=performance.now()-t0;mx=Math.max(mx,d);tot+=d;t0=performance.now();}while(!s.done);r=s.value;}else{mx=tot=performance.now()-t0;}ddA.b[id]=r;o[id]=Math.round(tot)+'/'+Math.round(mx);}ddA.bi=DDA_BUILD.length;
  for(const L of[11.3,13.7]){const g=ddaRoarGen(L);let mx=0,tot=0,n=0,r;do{const t0=performance.now();r=g.next();const d=performance.now()-t0;mx=Math.max(mx,d);tot+=d;n++;(o['steps'+L]=o['steps'+L]||[]).push(Math.round(d));}while(!r.done);o['roar'+L]=`total ${Math.round(tot)} steps ${n} max ${mx.toFixed(1)}`;}
  const t1=performance.now();ddaRecBuild();o.recBuild=Math.round(performance.now()-t1);return o;});
console.log(JSON.stringify(r),'errors',errors.length);await b.close();srv.close();})();

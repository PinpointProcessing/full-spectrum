/* Procedural textures: everything is painted on small canvases at load. No image files. */
function noiseFill(g,w,h,r,n,light,dark,sz){for(let i=0;i<n;i++){g.fillStyle=r()<.5?light:dark;g.fillRect(r()*w,r()*h,(sz||1)+r()*1.5,(sz||1)+r()*1.5);}}
const TX={};
TX.asphalt=canvasTex(128,128,(g,w,h)=>{const r=rng(11);g.fillStyle='#34363a';g.fillRect(0,0,w,h);noiseFill(g,w,h,r,2600,'rgba(255,255,255,.07)','rgba(0,0,0,.28)');
  g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=1;for(let i=0;i<5;i++){g.beginPath();let x=r()*w,y=r()*h;g.moveTo(x,y);for(let k=0;k<5;k++){x+=r()*30-15;y+=r()*30-15;g.lineTo(x,y);}g.stroke();}
  for(let i=0;i<4;i++){const x=r()*w,y=r()*h,rad=8+r()*18,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(0,0,0,.3)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2);}});
TX.grass=canvasTex(128,128,(g,w,h)=>{const r=rng(5);g.fillStyle='#2f4124';g.fillRect(0,0,w,h);
  for(let i=0;i<1700;i++){const x=r()*w,y=r()*h;g.strokeStyle=r()<.5?'rgba(120,160,80,.35)':'rgba(8,18,6,.45)';g.beginPath();g.moveTo(x,y);g.lineTo(x+r()*2-1,y-2-r()*3);g.stroke();}
  for(let i=0;i<5;i++){const x=r()*w,y=r()*h,rad=10+r()*22,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(90,110,40,.25)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2);}});
TX.concrete=canvasTex(128,128,(g,w,h)=>{const r=rng(3);g.fillStyle='#74756f';g.fillRect(0,0,w,h);noiseFill(g,w,h,r,1800,'rgba(255,255,255,.08)','rgba(0,0,0,.16)');
  g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1.5;g.strokeRect(.5,.5,w-1,h-1);
  for(let i=0;i<3;i++){const x=r()*w,y=r()*h,rad=10+r()*20,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(40,35,25,.25)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2);}});
TX.siding=canvasTex(64,64,(g,w,h)=>{g.fillStyle='#e2e2e2';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=8){g.fillStyle='rgba(0,0,0,.2)';g.fillRect(0,y+6,w,2);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(0,y,w,1);}});
TX.shingle=canvasTex(64,64,(g,w,h)=>{const r=rng(9);g.fillStyle='#c9c9c9';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=8)for(let x=(y/8%2)*6;x<w;x+=12){g.fillStyle=`rgba(0,0,0,${.08+r()*.2})`;g.fillRect(x,y,11,7);g.fillStyle='rgba(0,0,0,.4)';g.fillRect(x,y+7,12,1);}});
TX.wood=canvasTex(64,64,(g,w,h)=>{const r=rng(4);g.fillStyle='#8a6846';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=8){g.fillStyle=`rgba(0,0,0,${.05+r()*.18})`;g.fillRect(0,y,w,8);g.fillStyle='rgba(20,10,4,.6)';g.fillRect(0,y,w,1);const x=r()*w;g.fillRect(x,y,1,8);}});
TX.plank=canvasTex(64,64,(g,w,h)=>{const r=rng(14);g.fillStyle='#c8b092';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=8){g.fillStyle=`rgba(0,0,0,${.06+r()*.2})`;g.fillRect(x,0,8,h);g.fillStyle='rgba(20,10,4,.65)';g.fillRect(x,0,1.2,h);}});
TX.tile=canvasTex(64,64,(g,w,h)=>{g.fillStyle='#b9b9b2';g.fillRect(0,0,w,h);g.fillStyle='#8f8f8a';g.fillRect(0,0,32,32);g.fillRect(32,32,32,32);g.strokeStyle='rgba(0,0,0,.25)';g.strokeRect(.5,.5,31,31);g.strokeRect(32.5,32.5,31,31);});
TX.carpet=canvasTex(64,64,(g,w,h)=>{const r=rng(8);g.fillStyle='#5b5560';g.fillRect(0,0,w,h);noiseFill(g,w,h,r,1500,'rgba(255,255,255,.07)','rgba(0,0,0,.2)');});
TX.leaf=canvasTex(64,64,(g,w,h)=>{const r=rng(8);g.fillStyle='#3d5a32';g.fillRect(0,0,w,h);for(let i=0;i<240;i++){g.fillStyle=r()<.5?'rgba(110,150,80,.5)':'rgba(10,25,8,.5)';g.beginPath();g.arc(r()*w,r()*h,1+r()*2.5,0,7);g.fill();}});
TX.water=canvasTex(64,64,(g,w,h)=>{const r=rng(2);g.fillStyle='#20323a';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.strokeStyle=`rgba(190,220,235,${.1+r()*.25})`;g.beginPath();const x=r()*w,y=r()*h;g.moveTo(x,y);g.lineTo(x+8+r()*14,y+r()*2-1);g.stroke();}});
/* sprites */
TX.glow=canvasTex(64,64,(g,w,h)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);},1);
TX.puff=canvasTex(64,64,(g,w,h)=>{const r=rng(6);for(let i=0;i<14;i++){const x=32+(r()-.5)*26,y=32+(r()-.5)*26,rad=10+r()*12,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(255,255,255,.32)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);}},1);
TX.splat=canvasTex(128,128,(g,w,h)=>{const r=rng(31);g.fillStyle='rgba(255,255,255,1)';
  g.beginPath();g.ellipse(64,64,26,20,.4,0,7);g.fill();
  for(let i=0;i<26;i++){const a=r()*TAU,d=14+r()*42;g.beginPath();g.arc(64+Math.cos(a)*d,64+Math.sin(a)*d,1.5+r()*7*(1-d/60),0,7);g.fill();}
  for(let i=0;i<6;i++){const a=r()*TAU;g.lineWidth=2+r()*4;g.strokeStyle='#fff';g.beginPath();g.moveTo(64,64);g.lineTo(64+Math.cos(a)*(30+r()*26),64+Math.sin(a)*(30+r()*26));g.stroke();}},1);
TX.link=canvasTex(32,32,(g,w,h)=>{g.strokeStyle='#d0d5da';g.lineWidth=1.4;g.beginPath();g.moveTo(0,0);g.lineTo(w,h);g.moveTo(w,0);g.lineTo(0,h);g.stroke();});
TX.haz=canvasTex(64,16,(g,w,h)=>{g.fillStyle='#e6e6df';g.fillRect(0,0,w,h);g.fillStyle='#d9472e';for(let x=-16;x<w+16;x+=16){g.beginPath();g.moveTo(x,h);g.lineTo(x+8,h);g.lineTo(x+16,0);g.lineTo(x+8,0);g.fill();}});
/* dawn sky: dark overhead, burning orange low in the north where you're heading */
TX.sky=canvasTex(512,256,(g,w,h)=>{
  const gr=g.createLinearGradient(0,0,0,h);
  gr.addColorStop(0,'#070b1a');gr.addColorStop(.3,'#141a33');gr.addColorStop(.42,'#3a2f4c');gr.addColorStop(.49,'#8a4a4a');gr.addColorStop(.52,'#45343f');gr.addColorStop(1,'#45343f');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
  // the glow sits around u=.25 (north)
  const sun=g.createRadialGradient(w*.25,h*.5,0,w*.25,h*.5,w*.3);sun.addColorStop(0,'rgba(255,170,90,.95)');sun.addColorStop(.25,'rgba(240,110,60,.55)');sun.addColorStop(1,'rgba(240,110,60,0)');
  g.fillStyle=sun;g.fillRect(0,0,w,h*.52);
  const r=rng(77);for(let i=0;i<170;i++){g.fillStyle=`rgba(255,255,255,${r()*.7})`;g.fillRect(r()*w,r()*h*.36,1,1);}
  // smoke plumes rising all round the horizon
  for(let i=0;i<9;i++){const x=r()*w,top=h*(.16+r()*.2);for(let k=0;k<26;k++){const t=k/26,y=h*.51-(h*.51-top)*t,rad=5+t*26,gx=x+t*t*34;const sg=g.createRadialGradient(gx,y,0,gx,y,rad);sg.addColorStop(0,`rgba(18,14,18,${.34*(1-t*.6)})`);sg.addColorStop(1,'rgba(18,14,18,0)');g.fillStyle=sg;g.fillRect(gx-rad,y-rad,rad*2,rad*2);}
    const fg=g.createRadialGradient(x,h*.51,0,x,h*.51,16);fg.addColorStop(0,'rgba(255,120,40,.7)');fg.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=fg;g.fillRect(x-16,h*.51-16,32,18);}
},1);

"use strict";
/* Shared constants, DOM handles and small helpers. Loaded first; every other file uses these globals. */
const W=1300,H=900;   // the whole map: the yard (x 0–600) plus the shipping depot to the east, opened later (YARD_W)
const YARD_W=600;
const C={alpha:'#5ec8ff',bravo:'#ffb547',enemy:'#ff5a48',good:'#5fe08e',warn:'#ffcf4a',bad:'#ff5a48'};
const HUDFONT='"Chakra Petch","Rajdhani",ui-sans-serif,system-ui,sans-serif';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=s=>document.querySelector(s);
const stage=$('#stage'), cv=$('#cv'), ov=$('#ov'), ox=ov.getContext('2d');
let dpr=1,cw=1,ch=1;
const hyp=Math.hypot, clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const TAU=Math.PI*2;
function teamCol(u){return u.side==='E'?C.enemy:u.team==='A'?C.alpha:C.bravo;}

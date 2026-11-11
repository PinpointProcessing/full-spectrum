"use strict";
/* Shared constants, DOM handles and small helpers. Loaded first; every other file uses these globals. */
const W=1000,H=900,TOP=-760;   // the map runs x 0–W, y TOP–H; north is -y. The warehouse yard is the south-west (x 0–600, y 220–900),
const YARD_W=600;              // the canal crosses at y 150–214, the depot, data center and fortress gate are north of it. YARD_W sizes the camera fit.
// the nav grid runs wider than the map, x 0–NAV_W, for the road east that opens once the Headquarters is the squad's (road.js)
// and the Headquarters' second floor (hqfloors.js); EAST_X is the east edge of the map in play: W, or further on the big map
// once that road is open, or in the finished Headquarters (useMap sets it)
const NAV_W=1800;let EAST_X=W;
const C={alpha:'#5ec8ff',bravo:'#ffb547',enemy:'#ff5a48',good:'#5fe08e',warn:'#ffcf4a',bad:'#ff5a48'};
const HUDFONT='"Chakra Petch","Rajdhani",ui-sans-serif,system-ui,sans-serif';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=s=>document.querySelector(s);
const stage=$('#stage'), cv=$('#cv'), ov=$('#ov'), ox=ov.getContext('2d');
let dpr=1,cw=1,ch=1;
const hyp=Math.hypot, clamp=(v,a,b)=>v<a?a:v>b?b:v;
const hashId=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h);};   // a stable number from an id (whose voice a hostile has)
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const TAU=Math.PI*2;
function teamCol(u){return u.side==='E'?C.enemy:u.team==='A'?C.alpha:u.team==='N'?'#aeb7bd':C.bravo;}   // (N: D-Day's other troops, dday.js)

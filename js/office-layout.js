"use strict";
/* The office building's floor plans (data only; built by interior.js). PLACEHOLDER ground floor for testing the map switch,
   to be replaced by the layout from the floor-plan contest (docs/office-building.md). Coordinates are in the shared map
   frame (x 0..1000, y -760..900); floors sit side by side. Kinds: see interior.js and map.js (FULL, objHeight). */
const OFFICE_LAYOUT={floors:[
  {id:'GF',name:'Ground floor',bounds:{x0:280,y0:160,x1:720,y1:880},
   objects:[
     {kind:'owall',x:280,y:160,w:440,h:10},{kind:'owall',x:280,y:160,w:10,h:720},{kind:'owall',x:710,y:160,w:10,h:720},
     {kind:'owall',x:280,y:870,w:190,h:10},{kind:'owall',x:530,y:870,w:190,h:10},
     {kind:'iwall',x:290,y:690,w:90,h:10},{kind:'iwall',x:420,y:690,w:160,h:10},{kind:'iwall',x:620,y:690,w:90,h:10},
     {kind:'iwall',x:290,y:320,w:90,h:10},{kind:'iwall',x:420,y:320,w:160,h:10},{kind:'iwall',x:620,y:320,w:90,h:10},
     {kind:'iwall',x:370,y:330,w:10,h:60},{kind:'iwall',x:370,y:430,w:10,h:130},{kind:'iwall',x:370,y:600,w:10,h:90},
     {kind:'iwall',x:420,y:330,w:10,h:60},{kind:'iwall',x:420,y:430,w:10,h:130},{kind:'iwall',x:420,y:600,w:10,h:90},
     {kind:'iwall',x:570,y:330,w:10,h:60},{kind:'iwall',x:570,y:430,w:10,h:130},{kind:'iwall',x:570,y:600,w:10,h:90},
     {kind:'iwall',x:620,y:330,w:10,h:60},{kind:'iwall',x:620,y:430,w:10,h:130},{kind:'iwall',x:620,y:600,w:10,h:90},
     {kind:'iwall',x:290,y:505,w:80,h:10},{kind:'iwall',x:430,y:505,w:140,h:10},{kind:'iwall',x:630,y:505,w:80,h:10},
     {kind:'iwall',x:495,y:330,w:10,h:360},
     {kind:'steeldoor',x:480,y:160,w:40,h:10},
     {kind:'counter',x:440,y:712,w:120,h:14},{kind:'sofa',x:310,y:820,w:50,h:16},{kind:'sofa',x:640,y:820,w:50,h:16},{kind:'planter',x:300,y:715,w:14,h:14},{kind:'planter',x:686,y:715,w:14,h:14},
     {kind:'desk',x:300,y:360,w:40,h:16},{kind:'desk',x:300,y:450,w:40,h:16},{kind:'cabinet',x:300,y:600,w:12,h:40},{kind:'desk',x:445,y:560,w:30,h:16},
     {kind:'copier',x:530,y:360,w:20,h:16},{kind:'desk',x:650,y:540,w:40,h:16},{kind:'cabinet',x:690,y:350,w:12,h:40},
     {kind:'desk',x:350,y:230,w:60,h:16},{kind:'desk',x:590,y:230,w:60,h:16},{kind:'terminal',x:660,y:180,w:30,h:14},{kind:'cabinet',x:300,y:180,w:40,h:12},
   ],
   rooms:[
     {name:'Lobby',x0:290,y0:700,x1:710,y1:870,doorway:'south front doors',contents:'front desk'},
     {name:'Hall W',x0:380,y0:330,x1:420,y1:690,doorway:'',contents:''},{name:'Hall E',x0:580,y0:330,x1:620,y1:690,doorway:'',contents:''},
     {name:'Office W1',x0:290,y0:330,x1:370,y1:505,doorway:'east',contents:'desks'},{name:'Office W2',x0:290,y0:515,x1:370,y1:690,doorway:'east',contents:'cabinet'},
     {name:'Office C1',x0:430,y0:330,x1:495,y1:505,doorway:'west',contents:''},{name:'Office C2',x0:430,y0:515,x1:495,y1:690,doorway:'west',contents:'desk'},
     {name:'Office C3',x0:505,y0:330,x1:570,y1:505,doorway:'east',contents:'copier'},{name:'Office C4',x0:505,y0:515,x1:570,y1:690,doorway:'east',contents:''},
     {name:'Office E1',x0:630,y0:330,x1:710,y1:505,doorway:'west',contents:'cabinet'},{name:'Office E2',x0:630,y0:515,x1:710,y1:690,doorway:'west',contents:'desk'},
     {name:'Shared room',x0:290,y0:170,x1:710,y1:320,doorway:'south, both hallways',contents:'desks, computer, steel door'},
   ],
   posts:[
     {role:'rifleman',x:320,y:400,ang:Math.PI/2,group:'room-W1'},{role:'rifleman',x:670,y:600,ang:Math.PI,group:'room-E2'},{role:'rifleman',x:540,y:430,ang:-Math.PI/2,group:'room-C3'},
     {role:'rifleman',x:380,y:262,ang:Math.PI/2,group:'shared'},{role:'rifleman',x:500,y:250,ang:Math.PI/2,group:'shared'},{role:'rifleman',x:620,y:262,ang:Math.PI/2,group:'shared'},
   ],
   interact:[{kind:'key',x:500,y:200,note:'placeholder: the key sits in the shared room until the upper floor exists'}],
   zones:[{kind:'entry-spawn',x0:440,y0:790,x1:560,y1:866},{kind:'exit',x0:450,y0:818,x1:550,y1:868},{kind:'rest-med',x0:300,y0:730,x1:400,y1:810},{kind:'rest-sup',x0:600,y0:730,x1:700,y1:810}]},
],transitions:[]};

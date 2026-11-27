const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:760},deviceScaleFactor:2});
for(const n of['A1','B1','C1']){await p.goto('file://'+__dirname+'/'+n+'.html');await p.screenshot({path:__dirname+'/'+n+'.png'});}await b.close();})();

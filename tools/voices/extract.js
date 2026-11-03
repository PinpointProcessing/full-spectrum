// pull the voiced line lists out of the game's code (the code is the source of truth) -> lines.json
const fs=require('fs'),vm=require('vm'),path=require('path'),R=path.join(__dirname,'..','..','js')+path.sep;
function grab(file,name){
  const s=fs.readFileSync(R+file,'utf8'),i=s.indexOf(name+'=');if(i<0)throw new Error(name+' not in '+file);
  let j=i+name.length+1,depth=0,inStr=null;
  const q=s[j];if(q==="'"||q==='"'){let k=j+1;while(s[k]!==q){if(s[k]==='\\')k++;k++;}return vm.runInNewContext(s.slice(j,k+1));}   // a plain string
  for(;j<s.length;j++){const c=s[j];
    if(inStr){if(c==='\\'){j++;continue;}if(c===inStr)inStr=null;continue;}
    if(c==='"'||c==="'"||c==='`'){inStr=c;continue;}
    if(c==='['||c==='{'||c==='(')depth++;else if(c===']'||c==='}'||c===')'){depth--;if(depth===0){j++;break;}}
  }
  return vm.runInNewContext('('+s.slice(i+name.length+1,j)+')');
}
const out={
  squad:grab('voice.js','VOICE_LINES'),
  barks:grab('hunt.js','BARKS'),
  sci:{plead:grab('office.js','SCI_PLEAD'),escort:grab('office.js','SCI_ESCORT'),scan:grab('office.js','SCI_SCAN'),lab:grab('office.js','SCI_LAB'),end:grab('office.js','SCI_END')},
  chatter:{names:grab('chatter.js','SQUAD_NAME'),named:grab('chatter.js','NAMED'),chat:grab('chatter.js','CHAT'),quiet:Array.from(grab('chatter.js','QUIET')),clock:grab('chatter.js','CLOCK'),cdir:grab('chatter.js','CDIR'),banter:grab('chatter.js','BANTER')},
  prison:{cry:grab('office.js','PRISON_CRY'),loot:grab('office.js','LOOT_LINES'),freed:grab('office.js','FREED_LINES'),bye:grab('office.js','FAREWELL'),up:grab('office.js','MARSH_UP')},
};
fs.writeFileSync(__dirname+'/lines.json',JSON.stringify(out,null,1));
const n=Object.values(out.squad).flat().length;console.log('squad lines',n,'barks',Object.values(out.barks).flat().length,'sci',Object.values(out.sci).flat().length,'prison',JSON.stringify(out.prison).length);

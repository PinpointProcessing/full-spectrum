"""Pack the Zonos takes (gen_zonos.py's cache) into the game's voice files: per speaker one mp3 holding each line as its own
small mp3, and its entry in manifest.json (v3), like gen.py. The best take of each line by check_zonos.py's score (the first
if unscored). Run with the Kokoro venv (lameenc, soundfile):  python pack_zonos.py CACHE ../../sounds/voice [A1,A2,...]"""
import json,os,subprocess,sys,numpy as np
from voicelib import lines_for,SHOUT,QUIETG,style_of,tidy,mp3_of,SR,PAD
CACHE,OUT=sys.argv[1],sys.argv[2];man=json.load(open(OUT+'/manifest.json'))
ONLY=sys.argv[3].split(',') if len(sys.argv)>3 else sorted(os.listdir(CACHE))
SQUAD=('A1','A2','B1','B2','A3','A4','B3','B4')
def load(f):   # 44.1 kHz from Zonos to the game's 24 kHz, as floats
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw,dtype=np.float32)
for sp in ONLY:
    d=f'{CACHE}/{sp}';meta=json.load(open(f'{d}/meta.json'));sc=json.load(open(f'{d}/scores.json')) if os.path.exists(f'{d}/scores.json') else {}
    lines=lines_for(sp)
    if any(not meta.get(k,{}).get('takes') for k,_,_ in lines):print(sp,'not finished, skipped');continue
    kbps=24 if sp in ('A1','A2','B1','B2') else 32 if sp in SQUAD else 40
    blob=bytearray();clips={};secs=0
    for key,text,g in lines:
        tk=meta[key]['takes'];f=max(tk,key=lambda t:sc.get(t,{}).get('score',.5)-tk.index(t)*.001)
        a=tidy(load(f'{d}/{f}'),g in SHOUT and style_of(sp,g)!='pain',g in QUIETG)
        dur=len(a)/SR+2*len(PAD)/SR;b=mp3_of(a,kbps);clips[key]=[len(blob),len(b),round(dur,3)];blob+=b;secs+=dur
    open(f'{OUT}/{sp}.mp3','wb').write(bytes(blob))
    man['speakers'][sp]={'file':f'{sp}.mp3','voice':f'Zonos v0.1, voice from refs/{sp}.flac','clips':clips}
    man['model']='Zonos v0.1 transformer (Zyphra, Apache-2.0); each voice copied from a reference clip in tools/voices/refs/'
    json.dump(man,open(OUT+'/manifest.json','w'),separators=(',',':'))
    print(sp,len(clips),'lines',round(secs,1),'s',round(len(blob)/1024),'KB',flush=True)

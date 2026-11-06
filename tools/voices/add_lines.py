"""Put lines made on their own (outside lines.json's sheet) on the end of their speakers' voice files, each with its manifest
entry pointing past the old end, like Reyes's boatgo_1 and the pilot's lines. Run with the Kokoro venv (lameenc, ffmpeg on
the path):  python add_lines.py ../../sounds/voice SPEC.json
SPEC is a list of [speaker, clip key, wav file, how]: how is 'shout' (pushed harder, as pack_zonos.py does the shouted
groups), 'plain', or 'scream' (scream.py's output, driven already). A key that's already there is left alone; a full repack
of a speaker with pack_zonos.py drops these lines, so add them again after one."""
import json,subprocess,sys,numpy as np
from voicelib import tidy,mp3_of,SR,PAD
OUT,SPEC=sys.argv[1],json.load(open(sys.argv[2]));man=json.load(open(OUT+'/manifest.json'))
SQUAD=('A1','A2','B1','B2','A3','A4','B3','B4')
def load(f):   # to the game's 24 kHz, as floats
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw,dtype=np.float32)
for sp,key,f,how in SPEC:
    S=man['speakers'][sp];clips=S['clips']
    if key in clips:print(sp,key,'already there, left alone');continue
    kbps=24 if sp in ('A1','A2','B1','B2') else 32 if sp in SQUAD else 40
    a=tidy(load(f),how=='shout');b=mp3_of(a,kbps);dur=len(a)/SR+2*len(PAD)/SR
    fn=f'{OUT}/{S["file"]}';blob=open(fn,'rb').read();clips[key]=[len(blob),len(b),round(dur,3)]
    open(fn,'wb').write(blob+b);print(sp,key,round(dur,2),'s',len(b),'bytes at',len(blob))
json.dump(man,open(OUT+'/manifest.json','w'),separators=(',',':'))

"""Make the game's voices with Kokoro-82M (Apache-2.0): one file per speaker holding each of his lines as its own small mp3,
one after another, plus manifest.json (v3) with each line's byte offset, byte length and seconds. The game decodes a line only
when it's said (decoding a whole speaker at once took ~20 MB each). Lines come from lines.json (extract.js pulls them out of
the game's code)."""
import json, sys, time, numpy as np, lameenc
from kokoro_onnx import Kokoro
OUT=sys.argv[1] if len(sys.argv)>1 else 'out'
import os; os.makedirs(OUT,exist_ok=True)
from voicelib import *
k=Kokoro('kokoro-v1.0.onnx','voices-v1.0.bin')
def V(*mix):   # a voice, or a blend of voices [(name,weight),...]
    if len(mix)==1 and isinstance(mix[0],str): return mix[0]
    return sum(k.get_voice_style(n)*w for n,w in mix)
# who sounds like whom (lang: en-us or en-gb)
CAST={
 'A1':(V('am_michael'),'en-us'),'A2':(V('am_fenrir'),'en-us'),'B1':(V('am_puck'),'en-us'),'B2':(V('bm_george'),'en-gb'),
 'A3':(V('bm_lewis'),'en-gb'),'A4':(V('bm_fable'),'en-gb'),'B3':(V('am_liam'),'en-us'),'B4':(V('am_onyx'),'en-us'),
 'S1':(V('af_nicole'),'en-us'),'S2':(V('bf_emma'),'en-gb'),'S3':(V('af_sarah'),'en-us'),'S4':(V('am_eric'),'en-us'),
 'E1':(V('am_echo'),'en-us'),'E2':(V('bm_daniel'),'en-gb'),'E3':(V(('am_echo',.5),('bm_daniel',.5)),'en-gb'),
}
VOICE_NAME={'E3':'am_echo+bm_daniel'}
only=set(sys.argv[2].split(',')) if len(sys.argv)>2 else None
man={'v':3,'model':'Kokoro-82M (Apache-2.0), via kokoro-onnx','speakers':{}}
if os.path.exists(OUT+'/manifest.json'):
    m0=json.load(open(OUT+'/manifest.json'))
    if m0.get('v')==3: man=m0
import random;rnd=random.Random(7)
t00=time.time()
for sp,(voice,lang) in CAST.items():
    if only and sp not in only: continue
    kbps=24 if sp in ('A1','A2','B1','B2') else 32 if sp in SQUAD else 40   # (the radio voices are band-limited anyway)
    blob=bytearray();clips={};secs=0
    for key,text,g in lines_for(sp):
        a,sr=k.create(text,voice=voice,speed=speed_of(g)*(.96+.08*rnd.random()),lang=lang);assert sr==SR   # (a little speed difference line to line)
        a=tidy(a,g in SHOUT,g in QUIETG);d=len(a)/SR+2*len(PAD)/SR
        b=mp3_of(a,kbps);clips[key]=[len(blob),len(b),round(d,3)];blob+=b;secs+=d
    open(f'{OUT}/{sp}.mp3','wb').write(bytes(blob))
    man['speakers'][sp]={'file':f'{sp}.mp3','voice':VOICE_NAME.get(sp,voice if isinstance(voice,str) else 'blend'),'clips':clips}
    print(sp,len(clips),'lines',round(secs,1),'s',round(len(blob)/1024),'KB',round(time.time()-t00),'s so far',flush=True)
    json.dump(man,open(OUT+'/manifest.json','w'),separators=(',',':'))   # (after each speaker: a stopped run keeps what it made)
print('done',round(time.time()-t00),'s')

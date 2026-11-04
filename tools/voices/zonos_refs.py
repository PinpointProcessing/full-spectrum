"""Reference clips for gen_zonos.py: about 10 s of firm, clear speech per speaker in a Kokoro voice (run with the Kokoro venv:
./venv/bin/python zonos_refs.py). Zonos copies each speaker's voice from his clip. Reyes (A1) keeps the two clips Bryan liked
(refs/A1.flac calm, refs/A1_hot.flac shouted, made earlier and committed), so he's skipped here. A factor below 1 pitches the
clip down (Bryan: Kowalski sounded too feminine). Breathy Kokoro voices (af_nicole, am_echo on its own) are out: Bryan found the
scientist and the hostile too whispery."""
import subprocess,numpy as np,soundfile as sf
from kokoro_onnx import Kokoro
k=Kokoro('kokoro-v1.0.onnx','voices-v1.0.bin')
SOLDIER="Listen up. We go in fast, we go in quiet, and nobody gets left behind. You see a muzzle flash, you call it out. You get hit, you yell. I am not losing anybody tonight, you hear me? Good. Let's move."
FREED="Three weeks in that cell. They fed us when they remembered. I don't care what it takes, I'm not going back down there. Give me a rifle and point me at them, and I'll do the rest."
GUARD="Hey! Get back on the line! I told you twice already, nobody leaves the yard after dark. You want to explain that to the captain? No? Then pick up your rifle and watch that fence."
SCI="You don't understand what's down there. I told them to stop. I told them the readings were wrong, and they wouldn't listen to me. Please, you have to get us out of here before they come back."
def B(a,b,w=.5):return k.get_voice_style(a)*w+k.get_voice_style(b)*(1-w)
# speaker: (voice, Kokoro language, text, pitch factor)
REF={'A2':('am_fenrir','en-us',SOLDIER,.84),'B1':('am_puck','en-us',SOLDIER,1),'B2':('bm_george','en-gb',SOLDIER,1),
     'A3':('bm_lewis','en-gb',FREED,1),'A4':('bm_fable','en-gb',FREED,1),'B3':('am_liam','en-us',FREED,1),'B4':('am_onyx','en-us',FREED,1),
     'S1':('af_bella','en-us',SCI,1),'S2':('bf_emma','en-gb',SCI,1),'S3':('af_sarah','en-us',SCI,1),'S4':('am_eric','en-us',SCI,1),
     'E1':(B('am_onyx','am_echo'),'en-us',GUARD,1),'E2':('bm_daniel','en-gb',GUARD,1),'E3':(B('am_onyx','bm_daniel'),'en-gb',GUARD,1)}
for sp,(v,lang,text,f) in REF.items():
    a,sr=k.create(text,voice=v,speed=1.06,lang=lang);raw=f'refs/{sp}_raw.wav';sf.write(raw,np.asarray(a,dtype=np.float32),sr)
    af=[] if f==1 else ['-af',f'asetrate={sr}*{f},aresample={sr},atempo={1/f}']
    subprocess.run(['ffmpeg','-v','error','-y','-i',raw,*af,f'refs/{sp}.flac'],check=True);subprocess.run(['rm',raw]);print(sp,round(len(a)/sr,1),'s')

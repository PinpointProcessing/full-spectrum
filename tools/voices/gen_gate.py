"""The lines for the scene after the gate (Bryan: a soldier screams "what the hell was that", the scientists beg to leave,
the leader says no, they're moving in; the scientists are tied to the bridge's railings: monsters.js). Made with Zonos like
the rest (gen_zonos.py), several takes each, into a cache check_zonos.py can score; Zonos shouts the scream rather than
screaming it, so scream.py turns the chosen takes into screams, and add_lines.py puts them all on the end of the speakers'
voice files (README.md, "Lines made on their own"). Run as gen_zonos.py is run (its venv and environment):
  python gen_gate.py CACHE"""
import json,os,sys,time,zlib,torch,torchaudio
os.chdir(os.path.dirname(os.path.abspath(__file__)));sys.path.insert(0,'.')
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict
CACHE=sys.argv[1]
#            happiness sadness disgust fear surprise anger other neutral, pitch range, speaking rate
STYLE={'scream':([.00,.10,.00,.55,.40,.50,.00,.00],210,19.),   # (a scream, not just loud: fear and shock, the pitch all over the place)
       'firm':  ([.00,.00,.00,.00,.05,.15,.15,.65], 40,14.),   # (the leader: steady, no fear in it)
       'panic': ([.00,.25,.00,.45,.20,.30,.00,.00],110,17.)}   # (the scientists: frantic)
LINES=[('A2','gate_wth_1',"What the hell was that?!",'scream',4),('B1','gate_wth_1',"What the hell was that?!",'scream',4),('B2','gate_wth_1',"What the hell was that?!",'scream',4),
       ('A1','gate_lead_1',"No. We're moving in. Team on me. Be careful.",'firm',2),('B1','gate_lead_1',"No. We're moving in. Team on me. Be careful.",'firm',2),
       ('A1','gate_stay_1',"You stay on the bridge till we've cleared it.",'firm',2),('B1','gate_stay_1',"You stay on the bridge till we've cleared it.",'firm',2)]
for s in ('S1','S2','S3','S4'):
    LINES+=[(s,'sci_leave_1',"We can still leave! Please. We can save ourselves!",'panic',2),(s,'sci_bred_1',"We bred those things. There's worse in there!",'panic',2),
            (s,'sci_left_1',"Don't leave us out here! Please!",'panic',2)]
SAY={'Reyes':'Rayess'}
torch.set_num_threads(int(os.environ.get('ZONOS_THREADS','4')));T0=time.time()
m=Zonos.from_pretrained('Zyphra/Zonos-v0.1-transformer',device='cpu');EMB={}
def emb(name):
    if name not in EMB:w,sr=torchaudio.load(f'refs/{name}.flac');EMB[name]=m.make_speaker_embedding(w,sr)
    return EMB[name]
for sp,key,text,st,takes in LINES:
    d=f'{CACHE}/{sp}';os.makedirs(d,exist_ok=True);mf=f'{d}/meta.json';meta=json.load(open(mf)) if os.path.exists(mf) else {}
    mt=meta.setdefault(key,{'text':text,'style':st,'takes':[]})
    emo,pr,rate=STYLE[st];ref='A1_hot' if sp=='A1' and st=='scream' else sp
    c=m.prepare_conditioning(make_cond_dict(text=text,speaker=emb(ref),language='en-us',emotion=emo,pitch_std=pr,speaking_rate=rate))
    while len(mt['takes'])<takes:
        n=len(mt['takes'])
        for tries in range(4):
            torch.manual_seed(1000*n+zlib.crc32((sp+key).encode())%1000+7919*tries)
            codes=m.generate(c,max_new_tokens=int(86*min(20,2+len(text)/9)),cfg_scale=2.5,disable_torch_compile=True,progress_bar=False)
            a=m.autoencoder.decode(codes).cpu()[0]
            if a.shape[-1]>.25*m.autoencoder.sampling_rate:break
        fn=f'{key}.wav' if n==0 else f'{key}_t{n}.wav';torchaudio.save(f'{d}/{fn}',a,m.autoencoder.sampling_rate);mt['takes'].append(fn)
        json.dump(meta,open(mf,'w'),indent=0)
        print(sp,key,st,round(a.shape[-1]/m.autoencoder.sampling_rate,2),'s',round(time.time()-T0),'s so far',flush=True)
print('done')

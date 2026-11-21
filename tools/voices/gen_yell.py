"""After v91 (Bryan: the reshaped scream "sounds weird"): more takes of the scream after the gate, "What the hell was that?!",
for Kowalski, Hayes and Okafor (A2, B1, B2), natural this time: two yelling styles with fear and surprise up, three takes
each, into a cache check_zonos.py can score; the chosen ones went in with add_lines.py's replace (README.md). Run as
gen_zonos.py is run (its venv and environment):  python gen_yell.py CACHE"""
import json,os,sys,time,zlib,torch,torchaudio
os.chdir(os.path.dirname(os.path.abspath(__file__)));sys.path.insert(0,'.')
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict
CACHE=sys.argv[1]
#            happiness sadness disgust fear surprise anger other neutral, pitch range, speaking rate
STYLE={'yell':([.00,.05,.10,.70,.70,.40,.10,.00],250,13.),   # (shocked and afraid, drawn out: a natural yell, nothing reshaped afterwards)
       'yell2':([.00,.10,.05,.80,.55,.35,.05,.00],230,15.)}
LINES=[]
for sp in ('A2','B1','B2'):LINES+=[(sp,'gate_wth_1',"What the hell was that?!",'yell',3),(sp,'gate_wth_1b',"What the hell was that?!",'yell2',3)]
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

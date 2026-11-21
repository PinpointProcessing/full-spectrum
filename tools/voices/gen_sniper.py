"""The squad's warning about Level 3's sniper nest (Bryan, after v101: "The players should say Sniper Nest NorthWest of us
against the data center or something like that. Really make sure the players knows the sniper tower is there"): chat_snipernest_1
for A1, A2, B1 and B2 (whoever's leading when they come ashore; chatter.js's CHAT.snipernest), said steady over the radio like
the leader on the road ('firm', gen_road.py). Made with Zonos like the rest, several takes each into a cache check_zonos.py can
score; add_lines.py puts the best on the end of the speakers' voice files. Run as gen_zonos.py is run (its venv and environment):
  python gen_sniper.py CACHE [takes] [speakers, e.g. A1,B1]"""
import json,os,re,sys,time,zlib,torch,torchaudio
os.chdir(os.path.dirname(os.path.abspath(__file__)));sys.path.insert(0,'.')
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict
CACHE=sys.argv[1];NT=int(sys.argv[2]) if len(sys.argv)>2 else 2;ONLY=sys.argv[3].split(',') if len(sys.argv)>3 else None
#            happiness sadness disgust fear surprise anger other neutral, pitch range, speaking rate
STYLE={'firm':([.00,.00,.00,.00,.05,.15,.15,.65],40,14.)}   # (steady, decided: the leader on the road)
NEST="Sniper nest. Up north, against the data center. Stay out of his sights."   # (Bryan: "Sniper Nest NorthWest of us against the data center or something like that": from where they come ashore it's due north)
LINES=[(sp,'chat_snipernest_1',NEST,'firm') for sp in ('A1','A2','B1','B2')]
if ONLY:LINES=[l for l in LINES if l[0] in ONLY]
SAY={'Reyes':'Rayess'}
spoken=lambda t:re.sub(r',\s*',' ',t)   # (Bryan, after v71: no pause at a comma)
torch.set_num_threads(int(os.environ.get('ZONOS_THREADS','4')));T0=time.time()
m=Zonos.from_pretrained('Zyphra/Zonos-v0.1-transformer',device='cpu');SR=m.autoencoder.sampling_rate
for sp,key,text,st in LINES:
    d=f'{CACHE}/{sp}';os.makedirs(d,exist_ok=True);mf=f'{d}/meta.json';meta=json.load(open(mf)) if os.path.exists(mf) else {}
    mt=meta.setdefault(key,{'text':text,'style':st,'takes':[]})
    w,sr=torchaudio.load(f'refs/{sp}.flac');emo,pr,rate=STYLE[st];say=spoken(text)
    c=m.prepare_conditioning(make_cond_dict(text=say,speaker=m.make_speaker_embedding(w,sr),language='en-us',emotion=emo,pitch_std=pr,speaking_rate=rate))
    while len(mt['takes'])<NT:
        n=len(mt['takes'])
        for tries in range(4):
            torch.manual_seed(1000*n+zlib.crc32((sp+key).encode())%1000+7919*tries)
            a=m.autoencoder.decode(m.generate(c,max_new_tokens=int(86*min(20,2+len(say)/9)),cfg_scale=2.5,disable_torch_compile=True,progress_bar=False)).cpu()[0]
            if a.shape[-1]>.25*SR:break
        fn=f'{key}.wav' if n==0 else f'{key}_t{n}.wav';torchaudio.save(f'{d}/{fn}',a,SR);mt['takes'].append(fn)
        json.dump(meta,open(mf,'w'),indent=0)
        print(sp,key,st,round(a.shape[-1]/SR,2),'s',round(time.time()-T0),'s so far',flush=True)
print('done')

"""Listen to the Zonos takes with a speech recogniser (faster-whisper base.en) and score each against its script (0..1), so
pack_zonos.py can keep the best take of each line and gen_zonos.py --redo can make more of the bad ones. Flags a line when its
best take scores under 0.75, or is shorter than a word or far longer than the words need (the model babbling on). The score
compares letters, not words: the recogniser's own spellings of names and run-together words ("Charges Live Move" for "Charge is
live, move!", "undercover", "Linkvist") would otherwise flag a quarter of good takes. Scores are worked out again from what was
heard every run (cheap); only new takes go through the recogniser.
  python check_zonos.py CACHE [A1,A2,...] [--budget seconds]   (stops cleanly; run again to carry on)"""
import json,os,re,sys,time,difflib
from faster_whisper import WhisperModel,decode_audio
args=[a for a in sys.argv[1:] if not a.startswith('--')];CACHE=args[0];ONLY=args[1].split(',') if len(args)>1 else sorted(os.listdir(CACHE))
BUDGET=float(sys.argv[sys.argv.index('--budget')+1]) if '--budget' in sys.argv else 1e9;T0=time.time()
m=WhisperModel('base.en',device='cpu',compute_type='int8',cpu_threads=4)
HEARD={'haze':'hayes','hays':'hayes','raise':'reyes','race':'reyes','rays':'reyes'}   # how it spells the names
def letters(t):return ''.join(HEARD.get(w,w) for w in re.sub(r"[^a-z' ]"," ",t.lower().replace('’',"'")).split()).replace("'","")
def score(text,heard,secs):
    if secs<.25 or secs>1.2+len(text.split())*.75:return 0.0
    return round(difflib.SequenceMatcher(None,letters(text),letters(heard)).ratio(),2)
for sp in ONLY:
    d=f'{CACHE}/{sp}';mf=f'{d}/meta.json'
    if not os.path.exists(mf):continue
    meta=json.load(open(mf));sc_f=f'{d}/scores.json';sc=json.load(open(sc_f)) if os.path.exists(sc_f) else {};flagged=[]
    for key,mt in meta.items():
        for f in mt['takes']:
            if f in sc:continue
            if time.time()-T0>BUDGET:json.dump(sc,open(sc_f,'w'),indent=0);print('budget reached');sys.exit(0)
            a=decode_audio(f'{d}/{f}');dur=len(a)/16000
            segs,_=m.transcribe(a,beam_size=1,language='en');h=' '.join(x.text for x in segs).strip()
            sc[f]={'heard':h,'secs':round(dur,2)}
            if len(sc)%25==0:json.dump(sc,open(sc_f,'w'),indent=0)   # (a restart loses little)
        for f in mt['takes']:sc[f]['score']=score(mt['text'],sc[f]['heard'],sc[f]['secs'])
        if mt['takes'] and max(sc[f]['score'] for f in mt['takes'])<.75:flagged.append(key)
    json.dump(sc,open(sc_f,'w'),indent=0);json.dump(flagged,open(f'{d}/flagged.json','w'))
    n=len(meta);print(sp,n,'lines',len(flagged),'flagged',flush=True)

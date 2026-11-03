"""Make the game's voices with Kokoro-82M (Apache-2.0): one file per speaker holding each of his lines as its own small mp3,
one after another, plus manifest.json (v3) with each line's byte offset, byte length and seconds. The game decodes a line only
when it's said (decoding a whole speaker at once took ~20 MB each). Lines come from lines.json (extract.js pulls them out of
the game's code)."""
import json, sys, time, numpy as np, lameenc
from kokoro_onnx import Kokoro
OUT=sys.argv[1] if len(sys.argv)>1 else 'out'
import os; os.makedirs(OUT,exist_ok=True)
L=json.load(open('lines.json'))
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
SQUAD=['A1','A2','B1','B2','A3','A4','B3','B4']
QUIETG={'c_'+q for q in L['chatter']['quiet']}|{'banter_in'}   # said low (stealth)
TUT=set(L['chatter'].get('tut',[]))   # lines about the map: the first four only
SHOUT={'n_down','n_gotyou','c_engage','c_radio','c_reinf','c_dog','c_fragwarn','c_covering','c_movingcov','cdir','contact','man_down','hit_down','pinned','rpg','frag','charge','suppress','ack_attack','breach','zip','cry','plead','scan',
       'bark_spot','bark_grenade','bark_pinned','bark_down','bark_surrender','bark_backup','bark_flank','bark_body','bark_dog','bark_hit','bark_panic',
       'c_vehicle','c_rpgout','c_mgman','c_sniper','c_nadeno'}
SPEED={'c_hush':.9,'c_clear':.92,'c_tkdone':.92,'c_tknice':.94,'banter':1.0,'silent':.95,'takedown':.95,'end':.88,'bye':.95,'up':.88,'escort':1.0,'objective':1.0,'kill':1.0}
def speed_of(group): return SPEED.get(group,1.15 if group in SHOUT else 1.04)
# each speaker's lines: (clip key, text, group)
def lines_for(sp):
    out=[]
    if sp[0] in 'AB':
        for key,arr in L['squad'].items():
            for i,t in enumerate(arr): out.append((f'{key}_{i+1}',t,key))
    if sp in SQUAD and 'chatter' in L:
        C=L['chatter'];team=[x for x in SQUAD if x[0]==sp[0] and x!=sp];freed=sp in ('A3','A4','B3','B4')
        for key,arr in C['named'].items():
            for addr,name in C['names'].items():
                if addr==sp: continue
                if key in ('onme','follow') and addr not in team: continue   # partners and team mates only
                if freed and key not in ('down','thanks','onme','follow'): continue   # the freed men say fewer of them
                for i,t in enumerate(arr):
                    if freed and key=='down' and i>0: continue
                    out.append((f'{key}_{addr}_{i+1}',t.replace('{N}',name),'n_'+key))
        for key,arr in C['chat'].items():
            if key in TUT and sp not in ('A1','A2','B1','B2'): continue
            for i,t in enumerate(arr): out.append((f'chat_{key}_{i+1}',t,'c_'+key))
        for h,word in C['clock'].items():
            for n,tpl in C['cdir'].items(): out.append((f'cdir_{h}_{n}',tpl.replace('{D}',word),'cdir'))
        for bi,b in enumerate(C['banter']):
            for j,(who,t) in enumerate(b['lines']):
                if who==sp: out.append((f'ban_{bi}_{j}',t,'banter_in' if b['when']=='in' else 'banter'))
    if sp in ('A3','A4','B3','B4'):
        name={'A3':'Abara','A4':'Brennan','B3':'Lindqvist','B4':'Marsh'}[sp]
        for i,t in enumerate(L['prison']['cry']): out.append((f'cry_{i+1}',t,'cry'))
        for i,t in enumerate(L['prison']['loot']): out.append((f'loot_{i+1}',t,'loot'))
        if name in L['prison']['freed']: out.append(('freed_1',L['prison']['freed'][name],'freed'))
        if name in L['prison']['bye']: out.append(('bye_1',L['prison']['bye'][name],'bye'))
        if name=='Marsh': out.append(('up_1',L['prison']['up'],'up'))
    if sp[0]=='S':
        for g,arr in L['sci'].items():
            for i,t in enumerate(arr): out.append((f'{g}_{i+1}',t,g))
    if sp[0]=='E':
        for g,arr in L['barks'].items():
            for i,t in enumerate(arr): out.append((f'bark_{g}_{i+1}',t,'bark_'+g))
    return out
SR=24000
def tidy(a,shout,quiet=False):
    a=np.asarray(a,dtype=np.float32);pk=float(np.abs(a).max()) or 1.0
    idx=np.where(np.abs(a)>pk*.02)[0]
    if len(idx): a=a[max(0,idx[0]-int(.03*SR)):min(len(a),idx[-1]+int(.08*SR))]
    a=a/(np.abs(a).max() or 1)
    if shout: a=np.tanh(2.0*a)/np.tanh(2.0)   # pushed a little harder: more urgent, more presence
    return (a*(.6 if quiet else .89)).astype(np.float32)
only=set(sys.argv[2].split(',')) if len(sys.argv)>2 else None
man={'v':3,'model':'Kokoro-82M (Apache-2.0), via kokoro-onnx','speakers':{}}
if os.path.exists(OUT+'/manifest.json'):
    m0=json.load(open(OUT+'/manifest.json'))
    if m0.get('v')==3: man=m0
PAD=np.zeros(int(.04*SR),dtype=np.float32)
import random;rnd=random.Random(7)
t00=time.time()
def mp3_of(a,kbps):   # one line as its own mp3 (a decoder handles it on its own)
    pcm16=(np.clip(np.concatenate([PAD,a,PAD]),-1,1)*32767).astype(np.int16)
    enc=lameenc.Encoder();enc.set_bit_rate(kbps);enc.set_in_sample_rate(SR);enc.set_channels(1);enc.set_quality(2)
    return enc.encode(pcm16.tobytes())+enc.flush()
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

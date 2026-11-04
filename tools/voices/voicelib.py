"""What both voice generators share: who says which lines (from lines.json), how a line is tidied, and one line as its own
small mp3. gen.py (Kokoro) and gen_zonos.py/pack_zonos.py (Zonos) use it."""
import json,numpy as np
L=json.load(open('lines.json'))
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
PAD=np.zeros(int(.04*SR),dtype=np.float32)
def mp3_of(a,kbps):   # one line as its own mp3 (a decoder handles it on its own)
    import lameenc   # (only the packing needs it)
    pcm16=(np.clip(np.concatenate([PAD,a,PAD]),-1,1)*32767).astype(np.int16)
    enc=lameenc.Encoder();enc.set_bit_rate(kbps);enc.set_in_sample_rate(SR);enc.set_channels(1);enc.set_quality(2)
    return enc.encode(pcm16.tobytes())+enc.flush()

# how a line is said, for Zonos (gen_zonos.py's STYLE); the shouted ones also get pushed harder by tidy()
def style_of(sp,g):
    if g in ('bark_hit','hit_down'):return 'pain'
    if g in ('cry','bark_panic','bark_surrender') or (sp[0]=='S' and g in ('plead','scan')):return 'fear'
    if g in ('n_gotyou','pinned','revive','escort') or (sp[0]=='S' and g=='lab'):return 'urgent'
    if g in SHOUT:return 'shout'
    if g in QUIETG or g in ('silent','takedown'):return 'quiet'
    if g in ('banter','banter_in'):return 'dry'
    return 'calm'

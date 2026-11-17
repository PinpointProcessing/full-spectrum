# The follow drafts' films and numbers for the page (docs/drafts/hill-follow/):
# python3 dday-follow-compose.py FILMS_DIR SIMS_DIR PAGE_DIR
#   FILMS_DIR/<variant>/00001.jpg ... (dday-follow-draft.js film) -> PAGE_DIR/follow-<variant>.mp4 and a poster .jpg
#   SIMS_DIR/<variant>-<seed>.log (dday-follow-draft.js sim) -> the table, written into the page between <!--TABLE--> markers
#   (the page keeps a copy of the table it was given: run it again with new logs and the table is replaced)
import sys, os, json, glob, subprocess, re
FILMS, SIMS, PAGE = sys.argv[1], sys.argv[2], sys.argv[3]
VARS = [('today', 'Today · follow'), ('shadow', '1 · Close behind'), ('line', '2 · Side by side'), ('leap', '3 · Leapfrog'), ('flank', '4 · Pincer')]
enc = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart']
for v, _ in VARS:
    d = os.path.join(FILMS, v)
    if not os.path.isdir(d) or not os.path.exists(os.path.join(d, 'info.json')):
        print('no film for', v); continue
    info = json.load(open(os.path.join(d, 'info.json')))
    out = os.path.join(PAGE, f'follow-{v}.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', f"{info['fps']:g}", '-i', os.path.join(d, '%05d.jpg'),
                    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'] + enc + [out], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '22', '-i', out, '-frames:v', '1', '-q:v', '4', os.path.join(PAGE, f'follow-{v}.jpg')], check=True)
    print(f'follow-{v}.mp4', os.path.getsize(out) // 1024, 'KB', json.dumps({k: info[k] for k in info if k not in ('fps', 'frames')}))
rows = {}
for f in glob.glob(os.path.join(SIMS, '*.log')):
    for l in open(f):
        if l.startswith('{"variant"'):
            d = json.loads(l); rows.setdefault(d['variant'], []).append(d)
def avg(L, k):
    vals = [d[k] for d in L if d.get(k) is not None]
    return sum(vals) / len(vals) if vals else None
cols = [('gap', 'Apart (m)', 1), ('farPct', 'Over 20 m apart', 0), ('aheadPct', 'Bravo in front', 0), ('killsB', 'Bravo’s kills', 1),
        ('dmgA', 'Damage taken · Alpha', 0), ('dmgB', 'Damage taken · Bravo', 0), ('downsA', 'Men downed · Alpha', 1), ('downsB', 'Men downed · Bravo', 1), ('progress', 'Furthest up the beach (m)', 0)]
h = ['<table>', '<thead><tr><th scope="col">Bravo’s way</th>' + ''.join(f'<th scope="col">{n}</th>' for _, n, _ in cols) + '<th scope="col">Fights</th></tr></thead>', '<tbody>']
summary = {}
for v, name in VARS:
    L = rows.get(v, [])
    if not L:
        continue
    cells = []
    for k, _, dp in cols:
        a = avg(L, k); summary.setdefault(v, {})[k] = a
        if a is None: cells.append('–'); continue
        s = f'{a:.{dp}f}'
        if k in ('farPct', 'aheadPct'): s += '%'
        cells.append(s)
    h.append(f'<tr><td>{name}</td>' + ''.join(f'<td>{c}</td>' for c in cells) + f'<td>{len(L)}</td></tr>')
h += ['</tbody>', '</table>']
table = '\n'.join(h)
p = os.path.join(PAGE, 'index.html'); s = open(p).read()
s = re.sub(r'<div class="tablewrap">.*?</div>', '<div class="tablewrap"><!--TABLE-->' + table + '<!--/TABLE--></div>', s, count=1, flags=re.S)
open(p, 'w').write(s)
print(json.dumps(summary, indent=1))

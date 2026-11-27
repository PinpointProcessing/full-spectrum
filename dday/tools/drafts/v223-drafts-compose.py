# Drafts after Version 222 (Bryan: the report's man page, the barracks' camera, more explosive barrels, the Bazooka): the sheets and the film from
# the pictures the draft scripts took on a scratch copy (v223-patch/ applied to the last commit). python3 v223-drafts-compose.py SHOTS FILM OUT
import sys, json, subprocess
from PIL import Image, ImageDraw, ImageFont
SH, FILM, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
F = lambda s, b=True: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
BG, INK, DIM, GOLD = (16, 20, 26), (236, 240, 244), (154, 166, 176), (255, 215, 106)
def im(n): return Image.open('%s/%s.png' % (SH, n)).convert('RGB')
def fit(i, w=None, h=None):
    if w: return i.resize((w, round(i.height * w / i.width)), Image.LANCZOS)
    return i.resize((round(i.width * h / i.height), h), Image.LANCZOS)
def sheet(title, sub, cols, name, foot=None, gap=22, pad=26):
    hs = max(c[0].height for c in cols); w = sum(c[0].width for c in cols) + gap * (len(cols) - 1) + pad * 2
    S = Image.new('RGB', (w, hs + 150 + (44 if foot else 0)), BG); d = ImageDraw.Draw(S)
    d.text((pad, 18), title, font=F(30), fill=GOLD); d.text((pad, 58), sub, font=F(17, False), fill=DIM)
    x = pad
    for i, (pic, cap) in enumerate(cols):
        d.text((x, 94), cap, font=F(16), fill=INK); S.paste(pic, (x, 124)); x += pic.width + gap
    if foot: d.text((pad, hs + 138), foot, font=F(16, False), fill=DIM)
    S.save('%s/%s' % (OUT, name), quality=88); print(name, S.size)

# 1 the report: a row tapped is the man's page
P = 330
arrow = lambda i, xy, t: ImageDraw.Draw(i).text(xy, t, font=F(15), fill=GOLD)
a, b, c = fit(im('r-p-1-report'), P), fit(im('r-p-2-man'), P), fit(im('r-p-3-perk'), P)
sheet('1 · The report: tap a man, see him, back out', 'Draft, not in the game yet. He stands on the left, everything about him on the right. BACK at the top and the bottom returns to the full report.',
      [(a, 'The full report · tap any row'), (b, 'His page'), (c, 'A perk owed: picked here'), (fit(im('r-l-2-man'), h=a.height * 390 // 760 if False else 300), 'Phone on its side')],
      'v223-report-man.jpg', 'Arrows or a swipe: the man before and after. Nothing else about the report changes.')

# 2 the barracks: the camera dragged along the bunks
fr = lambda k: fit(Image.open('%s/f-p-%03d.png' % (FILM, k)).convert('RGB'), 290)
sheet('2 · The barracks: drag the room with your thumb', 'Draft, not in the game yet. One line through the room: along Alpha\'s bunks, round the end of the aisle, back along Bravo\'s. The man in the middle is the one chosen.',
      [(fit(im('b-p-0-aisle'), 290), '1 Opens on the aisle'), (fit(im('b-p-1-dragging'), 290), '2 Dragging left'), (fit(im('b-p-2-settled'), 290), '3 Let go: settles on him'),
       (fr(26), '4 On round the aisle\'s end'), (fit(im('b-p-3-bravo'), 290), '5 Along Bravo\'s bunks')],
      'v223-barracks-walk.jpg', 'The squares at the top still jump straight to a man (the camera walks there). A kit list open: the room stays still. Film: v223-barracks-walk.mp4')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '9', '-i', '%s/f-p-%%03d.png' % FILM, '-vf', 'minterpolate=fps=27:mi_mode=blend,scale=390:760', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '%s/v223-barracks-walk.mp4' % OUT], check=True)

# 3 and 4 the fuel drums and the Bazooka
D = json.load(open(SH + '/drums.json')); K = .56; X0, Y0, X1, Y1 = -20, -780, 1620, 800
M = Image.new('RGB', (round((X1 - X0) * K), round((Y1 - Y0) * K)), (150, 160, 118)); d = ImageDraw.Draw(M)
T = lambda x, y: ((x - X0) * K, (y - Y0) * K)
d.rectangle([T(X0, 340), T(1010, 706)], fill=(214, 198, 150)); d.rectangle([T(X0, 706), T(1010, Y1)], fill=(110, 160, 170)); d.rectangle([T(1010, -456), T(X1, Y1)], fill=(96, 104, 84))
COL = {'ddpb': (120, 120, 116), 'sandbag': (176, 156, 112), 'ddwire': (70, 62, 50), 'ddcrate': (120, 92, 58), 'ddbarr': (112, 74, 58), 'ddbld': (112, 100, 84), 'ddgun': (60, 66, 60), 'ddbould': (132, 128, 118),
       'ddtruck': (84, 96, 66), 'ddtent': (150, 142, 100), 'ddhog': (88, 70, 56), 'ddbank': (120, 104, 72), 'ddfuel': (184, 84, 40), 'ddconc': (128, 126, 120)}
for o in D['objs']:
    if o['e'] or o['k'] in ('ddrim',): continue
    x = o['x'] if o['x'] < 1100 or o['k'] != 'x' else o['x']
    d.rectangle([T(o['x'], o['y']), T(o['x'] + o['w'], o['y'] + o['h'])], fill=COL.get(o['k'], (104, 110, 96)))
for t, x, y in (('THE BEACH', 60, 600), ('THE WIRE', 20, 352), ('THE DRAW', 560, 40), ('CHECKPOINT', 840, -40), ('THE TOP', 430, -330), ('THEIR BASE', 1150, -440), ('FUEL DUMP', 1330, -776)):
    d.text(T(x, y), t, font=F(15), fill=(30, 34, 30))
n = 0
for o in D['objs']:
    if not o['e']: continue
    n += 1; cx, cy = T(o['x'] + 8, o['y'] + 8); d.ellipse([cx - 11, cy - 11, cx + 11, cy + 11], fill=(214, 60, 36), outline=(255, 226, 150), width=2); d.text((cx - (4 if n < 10 else 8), cy - 8), str(n), font=F(13), fill=(255, 255, 255))
side = [fit(im('k1-close'), 300), fit(im('k2-blast'), 300)]
tx = Image.new('RGB', (470, M.height), BG); t = ImageDraw.Draw(tx); y = 0
def line(s, f=F(15, False), col=INK, dy=24):
    global y; t.text((0, y), s, font=f, fill=col); y += dy
line('FUEL DRUMS', F(19), GOLD, 30)
for s in ('%d on Chapter 1\'s map (4 were scenery before),' % n, '3 more in the village. None in Chapter 2: it\'s your base.', '', 'Tap one with a squad picked: they shoot it.', 'Any blast within 2.5 m sets it off, theirs too.',
          'One drum sets off the next.', '', 'Theirs: killed within 3.7 m, hurt out to 9 m.', 'Ours: hurt within 7 m. Don\'t hide behind them.', 'A small flame marks each one near your squad.'): line(s)
y += 22; line('BAZOOKA', F(19), GOLD, 30)
rows = [('', 'now', 'draft'), ('Kills a defender within', 'never', '3.6 m'), ('Hurts out to', '5.5 m', '7.5 m'), ('Dead on out to', '24 m', '45 m'), ('Off target at 60 m', 'up to 6.1 m', 'up to 1.2 m'), ('Off target at 90 m', 'up to 11.2 m', 'up to 3.6 m'),
        ('Rockets to kill a tank', '3', '2'), ('Rockets to kill a gun', '2', '1'), ('Rockets for a barracks', '4', '2')]
for a_, b_, c_ in rows:
    t.text((0, y), a_, font=F(15, False), fill=INK); t.text((236, y), b_, font=F(15, not a_), fill=DIM); t.text((360, y), c_, font=F(15), fill=GOLD if a_ else DIM); y += 25
y += 6
for s in ('Today a rocket landing on a man does 86 of his', '100: that\'s why it felt weak. Rockets carried: 4,', 'reach 90 m, both as now.'): line(s, col=DIM, dy=22)
sheet('3 · More fuel drums that go up     4 · The Bazooka', 'Draft, not in the game yet. Red dots: where the drums would stand.', [(M, 'Chapter 1 · beach to their base'), (side[0], 'By the pillbox'), (side[1], 'Shot'), (tx, '')], 'v223-drums-bazooka.jpg')

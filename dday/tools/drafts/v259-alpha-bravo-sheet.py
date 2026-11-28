# The sheet for the Version 259 drafts of Bryan's "Alpha mans the guns, Bravo on foot" (not built): three ways side by side (A, B, C),
# each in its three states (1 Alpha picked with a man off his gun, 2 his card, 3 Bravo), every picture labelled.
#   python3 v259-alpha-bravo-sheet.py SHOTS_DIR OUT.jpg   (SHOTS_DIR: v259-alpha-bravo-draft.js's OUTDIR: A1.png .. C3.png)
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT = sys.argv[1:3]
FB, FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
title, head, sub, capb, cap = (ImageFont.truetype(FB, 30), ImageFont.truetype(FB, 22), ImageFont.truetype(FR, 18),
                              ImageFont.truetype(FB, 18), ImageFont.truetype(FR, 16))
bg, ink, dim, pick = (16, 21, 27), (236, 240, 243), (150, 162, 172), (255, 215, 106)
CW, pad, gap = 440, 28, 28
COLS = [('A', 'Name over the gun on the map', 'Bryan’s words, one way: ALPHA | BRAVO tabs along the bottom'),
        ('B', 'Name over the gun’s tile (my pick)', 'Bryan’s words, the other way: today’s tabs, the card from the bottom'),
        ('C', 'One bar, no tabs', 'both squads on the screen at once')]
ROWS = ['1 · Alpha picked, Zielinski off his gun', '2 · A tap on his name: his card', '3 · Bravo']
CAPS = {
  'A1': 'ALPHA shows the row of guns. His name on a tag over his empty gun on the map (in place of the game’s HEAVY MG · TAP TO MAN).',
  'B1': 'Today’s tabs at the left. His name on a tab over the heavy MG’s tile in the row; nothing new over the map.',
  'C1': 'Alpha’s guns on the left, Bravo on the right, always. His name on the heavy MG’s tile.',
  'A2': 'His card from the tag: health, his own tools, 1st person, BACK ON THE HEAVY MG (the dashed arrow on the map).',
  'B2': 'The same card comes up from the bottom, over the row.',
  'C2': 'The same card opens over the bar, pointing at his gun’s tile.',
  'A3': 'BRAVO: their four and their tools (the squad bar as on the beach). No tag.',
  'B3': 'BRAVO: the same bar. ALPHA’s tab says who’s off his gun.',
  'C3': 'No tab needed: a Bravo grenade taken straight from the bar, its reach in orange.'}

def wrap(d, text, font, w):
    out, line = [], ''
    for word in text.split(' '):
        t = (line + ' ' + word).strip()
        if d.textlength(t, font=font) <= w: line = t
        else: out.append(line); line = word
    return out + [line] if line else out

def fit(p):
    im = Image.open(p).convert('RGB')
    return im.resize((CW, round(im.height * CW / im.width)), Image.LANCZOS)

shots = {k: fit(f'{D}/{k}.png') for k in CAPS}
ch = shots['A1'].height
probe = ImageDraw.Draw(Image.new('RGB', (10, 10)))
capH = max(len(wrap(probe, CAPS[k], cap, CW)) for k in CAPS) * 20 + 30
W = pad * 2 + CW * 3 + gap * 2
hdr = [(wrap(probe, f'{k} · {t}', head, CW), wrap(probe, s, cap, CW)) for k, t, s in COLS]
hdrH = max(len(a) * 27 + 4 + len(b) * 19 for a, b in hdr)
top = 94 + hdrH + 26
H = top + len(ROWS) * (capH + ch + gap) + pad
sheet = Image.new('RGB', (W, H), bg)
d = ImageDraw.Draw(sheet)
d.text((pad, 18), 'Version 259 drafts · Alpha on the guns, Bravo on foot', font=title, fill=ink)
d.text((pad, 58), 'Chapter 2 in a wave, a phone upright. The game’s own picture and bars (Version 258); the new parts laid over them. Not built.', font=sub, fill=dim)
for c, ((k, t, s), (hl, sl)) in enumerate(zip(COLS, hdr)):
    x = pad + c * (CW + gap)
    for i, l in enumerate(hl): d.text((x, 94 + i * 27), l, font=head, fill=pick if k == 'B' else ink)
    for i, l in enumerate(sl): d.text((x, 94 + len(hl) * 27 + 4 + i * 19), l, font=cap, fill=dim)
    d.line((x, top - 12, x + CW, top - 12), fill=(58, 75, 92), width=2)
for r, rt in enumerate(ROWS):
    y = top + r * (capH + ch + gap)
    for c, (k, _, _) in enumerate(COLS):
        x, key = pad + c * (CW + gap), f'{k}{r + 1}'
        d.text((x, y), rt if not (key == 'C3') else '3 · Bravo, with no tab', font=capb, fill=ink)
        for i, l in enumerate(wrap(d, CAPS[key], cap, CW)): d.text((x, y + 24 + i * 20), l, font=cap, fill=dim)
        sheet.paste(shots[key], (x, y + capH))
        d.rectangle((x - 1, y + capH - 1, x + CW, y + capH + ch), outline=(58, 75, 92))
sheet.save(OUT, quality=86)
print(OUT, sheet.size)

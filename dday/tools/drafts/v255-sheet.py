# Version 255's picture sheet: the gun screen before and after (a phone upright and on its side), and the helicopter (over the field, from
# behind the heavy gun, shot down).   python3 v255-sheet.py BEFORE_DIR AFTER_DIR HELI_DIR WRECK_PNG OUT.jpg
# BEFORE_DIR/AFTER_DIR: fp-n2-390.png and fp-a1-844.png from the scratchpad's fpshot.js; HELI_DIR: field.png and fp.png from helishot.js
import sys
from PIL import Image, ImageDraw, ImageFont
B, A, H, W, OUT = sys.argv[1:6]
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
big, small = ImageFont.truetype(F, 30), ImageFont.truetype(F, 20)
bg, ink, dim = (16, 21, 27), (236, 240, 243), (150, 162, 172)

def fit(p, w):
    im = Image.open(p).convert('RGB')
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)

pu = [fit(f'{d}/fp-n2-390.png', 330) for d in (B, A)]          # upright: 330 x 643
pl = [fit(f'{d}/fp-a1-844.png', 690) for d in (B, A)]          # on its side: 690 x 319
hs = [fit(f'{H}/field.png', 440), fit(f'{H}/fp.png', 440), fit(W, 440)]
pad, top = 28, 70
w = pad * 4 + 330 * 2 + 690
row1 = max(pu[0].height, pl[0].height * 2 + 46)
h = top + row1 + 34 + 60 + max(i.height for i in hs) + 40 + pad
sheet = Image.new('RGB', (w, h), bg)
d = ImageDraw.Draw(sheet)
d.text((pad, 18), 'Version 255 · the gun screen, before and after', font=big, fill=ink)
x = pad
for i, (im, t) in enumerate(zip(pu, ('Version 254', 'Version 255'))):
    d.text((x, top - 6), t, font=small, fill=dim if i == 0 else ink)
    sheet.paste(im, (x, top + 22)); x += im.width + pad
y = top + 22
for i, (im, t) in enumerate(zip(pl, ('Version 254 · on its side', 'Version 255 · on its side'))):
    d.text((x, y - 28), t, font=small, fill=dim if i == 0 else ink)
    sheet.paste(im, (x, y)); y += im.height + 46
y0 = top + 22 + row1 + 34
d.text((pad, y0), 'The helicopter: over the field, from behind the heavy gun, shot down', font=big, fill=ink)
x = pad
for im in hs:
    sheet.paste(im, (x, y0 + 46)); x += im.width + (w - 3 * 440 - 2 * pad) // 2
sheet.save(OUT, quality=86)
print(OUT, sheet.size)

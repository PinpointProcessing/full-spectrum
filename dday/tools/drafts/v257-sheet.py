# Version 257's picture sheet: PREV and NEXT moved to the bottom left, across from AIM and FIRE; Version 256 and 257 on a phone with a home bar
# (the six guns' row, as in Bryan's screenshot) and on its side.
#   python3 v257-sheet.py BEFORE_DIR AFTER_DIR OUT.jpg   (the dirs: counter-v257-test.js's OUTDIR run on each version)
import sys
from PIL import Image, ImageDraw, ImageFont
B, A, OUT = sys.argv[1:4]
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
big, small = ImageFont.truetype(F, 30), ImageFont.truetype(F, 20)
bg, ink, dim = (16, 21, 27), (236, 240, 243), (150, 162, 172)

def fit(p, w):
    im = Image.open(p).convert('RGB')
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)

pu = [fit(f'{d}/gun6-390x740-34.png', 330) for d in (B, A)]
pl = [fit(f'{d}/gun-844x390-21.png', 690) for d in (B, A)]
pad, top = 28, 70
w = pad * 4 + 330 * 2 + 690
h = top + 22 + max(pu[0].height, pl[0].height * 2 + 46) + pad
sheet = Image.new('RGB', (w, h), bg)
d = ImageDraw.Draw(sheet)
d.text((pad, 18), 'Version 257 · PREV and NEXT at the bottom left, across from AIM and FIRE', font=big, fill=ink)
x = pad
for i, (im, t) in enumerate(zip(pu, ('Version 256', 'Version 257'))):
    d.text((x, top - 6), t, font=small, fill=dim if i == 0 else ink)
    sheet.paste(im, (x, top + 22)); x += im.width + pad
y = top + 22
for i, (im, t) in enumerate(zip(pl, ('Version 256 · on its side', 'Version 257 · on its side'))):
    d.text((x, y - 28), t, font=small, fill=dim if i == 0 else ink)
    sheet.paste(im, (x, y)); y += im.height + 46
sheet.save(OUT, quality=86)
print(OUT, sheet.size)

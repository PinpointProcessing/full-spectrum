# Before/after sheets: each item a pair of pictures side by side (how it is now, the draft), a caption over the pair.
# python3 pairs.py OUT.jpg BEFORE_DIR AFTER_DIR pairs_per_row tile_width "file:Caption" "file2:Caption2" ...   (file without .png; "before|after:Caption" when the names differ)
import sys, os
from PIL import Image, ImageDraw, ImageFont
out, bdir, adir, cols, tw = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
items = [a.split(':', 1) for a in sys.argv[6:]]
def font(sz, bold=True):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        try: return ImageFont.truetype(p, sz)
        except Exception: pass
    return ImageFont.load_default()
F, f2 = font(max(13, tw // 26)), font(max(11, tw // 34))
pairs = []
for name, cap in items:
    nb, na = (name.split('|') + [name])[:2]
    pb, pa = os.path.join(bdir, nb + '.png'), os.path.join(adir, na + '.png')
    if not (os.path.exists(pb) and os.path.exists(pa)):
        print('missing', name, os.path.exists(pb), os.path.exists(pa)); continue
    pairs.append((Image.open(pb).convert('RGB'), Image.open(pa).convert('RGB'), cap))
if not pairs: sys.exit('nothing to draw')
th = int(tw * pairs[0][0].height / pairs[0][0].width)
gap, pad, head = 4, 14, max(26, tw // 13)
pw = tw * 2 + gap
rows = (len(pairs) + cols - 1) // cols
W, H = cols * pw + (cols + 1) * pad, rows * (th + head + pad) + pad
S = Image.new('RGB', (W, H), (17, 19, 21)); d = ImageDraw.Draw(S)
def tag(x, y, t, col):
    w = d.textlength(t, font=f2) + 12
    d.rectangle([x, y, x + w, y + f2.size + 8], fill=(12, 14, 16)); d.text((x + 6, y + 3), t, fill=col, font=f2)
for i, (b, a, cap) in enumerate(pairs):
    x, y = pad + (i % cols) * (pw + pad), pad + (i // cols) * (th + head + pad)
    d.text((x + 2, y + (head - F.size) // 2 - 1), cap, fill=(236, 232, 218), font=F)
    S.paste(b.resize((tw, th), Image.LANCZOS), (x, y + head)); S.paste(a.resize((tw, th), Image.LANCZOS), (x + tw + gap, y + head))
    tag(x + 6, y + head + 6, 'NOW', (190, 190, 180)); tag(x + tw + gap + 6, y + head + 6, 'NEW', (255, 206, 96))
S.save(out, quality=88); print(out, S.size, len(pairs), 'pairs')

# Drafts, round 2, after Bryan's notes on v224-*: the camp spread out and the barracks as a small hut crossed the short way; the ground with the flag
# and a second heavy machine gun; the gun tiles as he asked for them. python3 v225-drafts-compose.py CRW2 OUT   (CRW2: counter-rework-draft2.js's pictures)
import sys
from PIL import Image, ImageDraw, ImageFont
CRW, OUT = sys.argv[1:3]
F = lambda s, b=True: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
BG, INK, DIM, GOLD, BLUE = (16, 20, 26), (236, 240, 244), (154, 166, 176), (255, 215, 106), (88, 196, 246)
op = lambda p: Image.open(p).convert('RGB')
def crop(i, y0, h=480, w=390): return i.crop((0, y0, w, y0 + h))
def wrap(d, s, f, w):
    L, cur = [], ''
    for word in s.split():
        t = (cur + ' ' + word).strip()
        if d.textlength(t, font=f) <= w: cur = t
        else: L.append(cur); cur = word
    return L + [cur]


# ---- 1 the camp, the shells, the hut
shots = [('The camp, from above', 'Twos, threes and men alone, across the whole yard.', 'c1-camp-wide', 170), ('At the fire', 'One cooking, one warming his hands, one standing.', 'c2-camp-fire', 150), ('At the wall', 'Two talking. Sitting on it needs a new pose.', 'c3-camp-wall', 130),
         ('Shells', 'The bunch of other troops to one side is hit.', 'c4-shells', 110), ('The hut, in at the back', 'A small hut crossed the short way. The others are already at its windows.', 'h1-in-the-back', 205),
         ('Across it', 'Six metres, bunks either side. The door goes.', 'h2-across', 205), ('Out the front', 'One of the others is hit at his window as they go.', 'h3-out-the-door', 180)]
PW, PH, G, P = 300, 308, 16, 26
S = Image.new('RGB', (P * 2 + len(shots) * PW + (len(shots) - 1) * G, PH + 250), BG); d = ImageDraw.Draw(S)
d.text((P, 18), 'The camp and the run through the barracks, round 2', font=F(28), fill=GOLD)
d.text((P, 56), 'Draft, not in the game. Staged with today\'s poses; sitting, cooking and smoking would be made for it. The hut is a new set, seen cut open from behind.', font=F(15, False), fill=DIM)
x = P
for t, c, n, y0 in shots:
    d.text((x, 92), t, font=F(16), fill=INK); S.paste(crop(op(CRW + '/' + n + '.png'), y0, 400).resize((PW, PH), Image.LANCZOS), (x, 120)); y = 120 + PH + 8
    for ln in wrap(d, c, F(13, False), PW): d.text((x, y), ln, font=F(13, False), fill=DIM); y += 18
    x += PW + G
d.text((P, PH + 208), 'Then the cut to outside: their men out of the trees, tanks on the road, as in the first sheet.', font=F(15, False), fill=DIM)
S.save(OUT + '/v225-camp-barracks.jpg', quality=88); print('camp', S.size)

# ---- 2 the ground
W, H = 1180, 1000; M = Image.new('RGB', (W, H), (118, 146, 92)); d = ImageDraw.Draw(M)
def box(x0, y0, x1, y1, c, o=None, w=2): d.rectangle([x0, y0, x1, y1], fill=c, outline=o, width=w)
def lab(x, y, s, c=(28, 32, 28), f=None, anchor='mm'): d.text((x, y), s, font=f or F(14), fill=c, anchor=anchor)
def arrow(pts, c, w=5, head=14):
    d.line(pts, fill=c, width=w, joint='curve'); (x0, y0), (x1, y1) = pts[-2], pts[-1]; import math
    a = math.atan2(y1 - y0, x1 - x0); d.polygon([(x1, y1), (x1 - head * math.cos(a - .45), y1 - head * math.sin(a - .45)), (x1 - head * math.cos(a + .45), y1 - head * math.sin(a + .45))], fill=c)
# the woods, the road, the fields
box(0, 0, W, 120, (52, 86, 50)); [d.ellipse([x - 24, y - 24, x + 24, y + 24], fill=(40, 72, 42)) for x in range(20, W, 46) for y in (30, 78)]
d.polygon([(640, 0), (700, 0), (690, 560), (630, 560)], fill=(176, 158, 118)); lab(665, 440, 'ROAD', (70, 60, 40))
for x0, x1 in ((40, 600), (720, 1140)): d.line([(x0, 300), (x1, 300)], fill=(58, 92, 50), width=14)
lab(140, 282, 'hedgerow', (30, 54, 30), F(12, False))
# their attack
for x in (220, 420, 860, 1020): arrow([(x, 96), (x, 190)], (196, 60, 48))
arrow([(665, 60), (665, 200)], (196, 60, 48), 8, 18); lab(760, 78, 'TANKS', (255, 220, 214)); lab(300, 60, 'THEIR MEN OUT OF THE WOODS', (255, 220, 214))
# the other troops' forward points
for x, y in ((230, 370), (430, 400), (880, 390), (1040, 360)):
    d.arc([x - 34, y - 20, x + 34, y + 22], 190, 350, fill=(92, 78, 52), width=9); d.ellipse([x - 7, y - 3, x + 7, y + 11], fill=(120, 150, 200))
lab(560, 352, 'THE OTHER TROOPS RUN OUT TO FORWARD POSTS', (22, 30, 60), F(13))
for x0, x1, y1 in ((330, 240, 392), (470, 440, 420), (840, 876, 410), (900, 1030, 380)): arrow([(x0, 650), ((x0 + x1) // 2, 520), (x1, y1)], (120, 150, 200), 3, 10)
# the lower terrace: two nests down the steps
box(250, 520, 930, 640, (134, 158, 104)); d.line([(250, 640), (930, 640)], fill=(92, 80, 60), width=10); lab(590, 536, 'LOWER TERRACE', (40, 56, 34), F(12, False))
for k in range(5): d.line([(548, 640 + k * 9), (632, 640 + k * 9)], fill=(190, 184, 170), width=5)
lab(590, 700, 'STEPS', (60, 56, 48), F(12))
def gun(x, y, name, sub, c):
    d.arc([x - 44, y - 30, x + 44, y + 34], 185, 355, fill=(150, 130, 92), width=12); d.ellipse([x - 34, y - 18, x + 34, y + 22], outline=c, width=4)
    d.line([(x, y + 4), (x, y - 26)], fill=(30, 30, 30), width=6); lab(x, y + 44, name, (20, 24, 20), F(15)); lab(x, y + 62, sub, (40, 46, 40), F(12, False))
gun(420, 562, 'MG NEST', 'lower left', GOLD); gun(760, 562, 'MG NEST', 'lower right', GOLD)
# the upper line in front of the barracks
gun(170, 730, 'FIELD GUN', 'kills tanks', GOLD); gun(380, 740, 'HEAVY MG', 'hurts a tank', GOLD); gun(960, 735, 'HEAVY MG', 'hurts a tank', GOLD)
d.line([(790, 760), (790, 690)], fill=(230, 230, 224), width=4); d.polygon([(792, 690), (832, 700), (792, 712)], fill=(60, 110, 200)); lab(790, 776, 'FLAG', (20, 24, 20), F(13))
for x in (520, 690, 870): d.ellipse([x - 9, 736, x + 9, 754], fill=BLUE)
lab(605, 772, 'riflemen', (16, 40, 70), F(12, False))
# the barracks and the camp behind it
box(120, 820, 1060, 880, (124, 84, 62), (60, 40, 30), 3); lab(360, 850, 'THE BARRACKS', (240, 226, 206), F(17))
box(566, 812, 614, 824, (230, 214, 170)); box(566, 876, 614, 888, (230, 214, 170))
arrow([(590, 960), (590, 900), (590, 800), (590, 770)], BLUE, 6, 16); lab(730, 950, 'YOUR SQUADS, FROM THE FIRE', (200, 232, 250), F(13))
d.ellipse([440, 930, 470, 960], fill=(255, 140, 50)); lab(455, 978, 'camp', (236, 226, 200), F(12, False))
d.ellipse([940, 920, 1040, 980], outline=(196, 60, 48), width=4); lab(990, 950, 'shelled', (255, 210, 200), F(12, False))
txt = ['THE GROUND', '', 'Read from your message, drawn north-up.', '', 'Upper line, in front of the barracks:', '· the field gun, far left', '· the heavy MG, left of centre', '· a second heavy MG on the right', '· the base\'s flag left of it', '',
       'Down the steps, the lower terrace:', '· two MG nests', '', 'Five guns, eight men: five on the guns,', 'three riflemen between them.', '', 'Out in the fields the other troops dig in', 'at forward posts and fall back on you.', '',
       'Their men come out of the woods; the', 'tanks come down the road.', '', 'STILL TO SETTLE', '1 Lower nests overrun first, and you pull', '   those men back up the steps?', '2 Lost when they take the flag?', '3 The wounded and the fallen, with no', '   barracks screen: patched up in camp,', '   replaced at the next start?']
T = Image.new('RGB', (430, H), BG); t = ImageDraw.Draw(T); y = 0
for s in txt:
    hd = s.isupper() and len(s) < 14; t.text((0, y), s, font=F(19 if hd else 15, hd), fill=GOLD if hd else INK); y += 30 if hd else 24
S = Image.new('RGB', (W + 430 + 26 * 3, H + 110), BG); d2 = ImageDraw.Draw(S); d2.text((26, 18), 'The ground, round 2: the flag, and a heavy MG on the right', font=F(28), fill=GOLD)
d2.text((26, 56), 'Draft, not in the game. A sketch of the layout, not the map\'s real shapes.', font=F(15, False), fill=DIM); S.paste(M, (26, 92)); S.paste(T, (26 * 2 + W, 96))
S.save(OUT + '/v225-ground.jpg', quality=88); print('ground', S.size)


# ---- 3 the guns, as asked
cols = [('At the start', op(CRW + '/g1-arrow.png'), ['A white arrow, flashing downward, and "Man a Gun". It goes once you have picked your first gun.', 'An empty gun, tapped: a squad mate goes to it.']),
        ('In the fight', op(CRW + '/g2-target-npc-destroyed.png'), ['Tap an enemy from above: every gun that can bear turns on him. When he is dead they pick their own again.', 'A gun can be knocked out: it blows up and its man goes down, for a medic to get up.', 'NPC in red: one of the other troops is on it, only when no squad mate is left for it.']),
        ('Behind a gun', op(CRW + '/g3-behind.png'), ['BACK: you leave the view, he stays on the gun and fights on.', 'LEAVE GUN: he gets off it.', 'The tiles along the top jump to another gun.'])]
PW = 340; PHh = round(760 * PW / 390); TW = 400
S = Image.new('RGB', (26 * 2 + 3 * PW + 2 * 22 + 30 + TW, PHh + 280), BG); d = ImageDraw.Draw(S)
d.text((26, 18), 'The guns, round 2', font=F(28), fill=GOLD); d.text((26, 56), 'Draft, not in the game. Today\'s map and today\'s view behind a gun, with the controls drawn over them.', font=F(15, False), fill=DIM)
x = 26
for t, im, notes in cols:
    d.text((x, 92), t, font=F(17), fill=INK); S.paste(im.resize((PW, PHh), Image.LANCZOS), (x, 122)); y = 122 + PHh + 10
    for n in notes:
        for ln in wrap(d, n, F(13, False), PW): d.text((x, y), ln, font=F(13, False), fill=DIM); y += 18
        y += 6
    x += PW + 22
x += 8; y = 122
for s, hd in [('THE RULES, AS I READ YOU', 1), ('1 The squad takes the guns itself at the start.', 0), ('2 An empty gun tapped: the nearest free squad mate mans it. Only with none left does one of the other troops take it, tagged NPC in red.', 0),
              ('3 A gun has more health than a man. Knocked out, it blows up and puts its man down; a medic can get him up. The gun stays out.', 0), ('4 Behind a gun: BACK leaves the view, LEAVE GUN takes him off it.', 0),
              ('5 From above, a thumb on an enemy turns every gun on him. Once he is dead they fight by themselves again, unless you are on one.', 0), ('', 0), ('FOR LATER', 1), ('First person on foot (cycling the men from a gun) needs fixing. Noted; not part of this.', 0),
              ('', 0), ('ONE THING TO CONFIRM', 1), ('Should a knocked-out gun stay out for the rest of the battle, or can it be repaired between waves?', 0)]:
    if not s: y += 10; continue
    f = F(18) if hd else F(14, False)
    for ln in wrap(d, s, f, TW): d.text((x, y), ln, font=f, fill=GOLD if hd else INK); y += 28 if hd else 21
    y += 4
S.save(OUT + '/v225-guns.jpg', quality=88); print('guns', S.size)

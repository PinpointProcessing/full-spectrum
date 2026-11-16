# The draft sheets after Version 174 from dday-camera-draft.js's and dday-cover-draft.js's pictures:
# python3 dday-brainstorm-compose.py CAM_DIR COV_DIR OUT_DIR -> OUT_DIR/dday-camera-draft.jpg, dday-cover-draft.jpg
import sys
from PIL import Image,ImageDraw,ImageFont
CAM,COV,OUT=sys.argv[1],sys.argv[2],sys.argv[3]
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';R='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
ft,fs,fc,fr=ImageFont.truetype(B,30),ImageFont.truetype(R,18),ImageFont.truetype(B,19),ImageFont.truetype(B,21)
W,H,G=488,950,26   # each phone picture (rendered at 780 x 1520) shown at 1.25x
BG,INK,DIM,GOLD=(18,22,26),(236,240,243),(160,172,182),(255,207,74)
def wrap(d,text,font,w):
    out,line=[],''
    for word in text.split():
        t=(line+' '+word).strip()
        if d.textlength(t,font=font)<=w:line=t
        else:out.append(line);line=word
    if line:out.append(line)
    return out
tmp=ImageDraw.Draw(Image.new('RGB',(10,10)))
def caps(cols):
    L=[[h]+wrap(tmp,b,fs,W-6) for h,b in cols]
    return L,max(len(c) for c in L)*24+20
def pic(path):return Image.open(path).convert('RGB').resize((W,H),Image.LANCZOS)
def header(d,title,sub,width):
    d.text((G,22),title,font=ft,fill=INK);y=66
    for line in wrap(d,sub,fs,width-2*G):d.text((G,y),line,font=fs,fill=DIM);y+=24
    return y+14
def captions(d,L,y,n):
    for i,c in enumerate(L):
        x=G+i*(W+G);d.text((x,y),c[0],font=fc,fill=GOLD);yy=y+26
        for line in c[1:]:d.text((x,yy),line,font=fs,fill=(214,221,226));yy+=24

# --- the camera: three moments, four ways
cols=[('A · Today','Behind the man furthest ahead, always facing north (yours turns only when you twist it). A drag of the map stops it following. Where the route turns, the way ahead runs off the side of the screen: on top the machine gun and the barracks are off to the right.'),
      ('B · A set view for each section','Framed by hand for each stretch of the map, with the stretch and its guns in view; it glides to the next one when the squad gets there. You see the most, your men are small, and every big map needs its views set by hand.'),
      ('C · Turns with the route','Today\'s camera, a little higher (22° instead of 17°), turned to face along the route so the way ahead is always up the screen. It turns by itself as the route turns; drag, pinch and twist still work. My pick.'),
      ('D · Over the leader\'s shoulder','Low behind one man of the squad, looking where it is going (Full Spectrum Warrior). Close and dramatic, but the men nearest the camera hide what is ahead and you see little to the sides. There is no leader on D-Day yet: here it is the man at the back.')]
rows=['1 · On the sand: the way ahead is north, so A and C nearly agree','2 · The way up: the route turns north-west up the draw','3 · On top: the route turns east to the barracks']
L,capH=caps(cols)
width=G+4*(W+G)
d0=ImageDraw.Draw(Image.new('RGB',(10,10)))
sub='The beach map on a phone held upright, Alpha (blue rings) played, Bravo following. Each row is one moment; each column one camera. Real game pictures; the camera set by hand for B, C and D.'
hdr=66+len(wrap(d0,sub,fs,width-2*G))*24+14
rowH=36+H+G
img=Image.new('RGB',(width,hdr+capH+3*rowH),BG);d=ImageDraw.Draw(img)
y=header(d,'Camera drafts · three moments, four cameras',sub,width)
captions(d,L,y,4);y+=capH
for r in range(3):
    d.text((G,y+4),rows[r],font=fr,fill=INK);y+=36
    for c,k in enumerate('ABCD'):
        x=G+c*(W+G);img.paste(pic(f'{CAM}/cam-{r+1}-{k}.png'),(x,y));d.rectangle([x-1,y-1,x+W,y+H],outline=(70,80,90))
    y+=H+G
img.save(f'{OUT}/dday-camera-draft.jpg',quality=86,optimize=True);print('dday-camera-draft.jpg',img.size)

# --- cover for four: today, and the draft
rowsC=[('Today',[('cov-today-beach','How many fit behind each piece','The number over each piece is how many men fit behind it, on the side away from the bunkers: red 1, amber 2, yellow 3, green 4 or more. A white ring: at least one of its spots is out of every gun\'s line. Hedgehogs and rocks take one man each.'),
                ('cov-today-hog','Four sent to a hedgehog','The game\'s own preview of the move: 0 of 4 in cover. One man fits behind a hedgehog, but the guns along the bluff fire from a wide arc and reach round it.'),
                ('cov-today-hole','Four sent to the big shell hole','4 of 4 in cover. On the sand only the two biggest shell holes do this today; from the water\'s edge the nearest place that takes four is 20-35 m away.')]),
       ('Draft',[('cov-draft-beach','Six more shell holes for four','Staggered left and right of the way up, 12-20 m apart. From the middle of the sand the nearest place for four is 3-9 m away (5-16 m today), from the water\'s edge 15-28 m (20-35 m today).'),
                ('cov-draft-hog','Four sent to a hedgehog','Still none. The hedgehogs stay what they are: cover for one man on a dash, not a place for the squad.'),
                ('cov-draft-hole','Four sent to a new shell hole','4 of 4 in cover, with one rule change: a man down in a shell hole is covered from every side, not only by its far rim. Without it this hole kept only two of the four out of every line.')])]
width=G+3*(W+G)
sub='The beach under fire, after 20 s ashore (the guns the squad knows about are the ones it has seen firing). Real game pictures and the game\'s own move preview: green ghosts in cover, red in the open.'
hdr=66+len(wrap(d0,sub,fs,width-2*G))*24+14
blocks=[]
for name,cells in rowsC:
    L,capH=caps([(h,b) for f,h,b in cells]);blocks.append((name,cells,L,capH))
img=Image.new('RGB',(width,hdr+sum(36+H+14+capH+G for *_,capH in blocks)),BG);d=ImageDraw.Draw(img)
y=header(d,'Cover for four · the beach today, and with shell holes for four',sub,width)
for name,cells,L,capH in blocks:
    d.text((G,y+4),name,font=fr,fill=INK);y+=36
    for c,(f,h,b) in enumerate(cells):
        x=G+c*(W+G);img.paste(pic(f'{COV}/{f}.png'),(x,y));d.rectangle([x-1,y-1,x+W,y+H],outline=(70,80,90))
    y+=H+14;captions(d,L,y,3);y+=capH+G
img.save(f'{OUT}/dday-cover-draft.jpg',quality=86,optimize=True);print('dday-cover-draft.jpg',img.size)

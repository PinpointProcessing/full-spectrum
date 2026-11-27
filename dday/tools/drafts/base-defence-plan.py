# Plan drawing for Chapter 2 on the D-Day base (north up). python3 base-defence-plan.py OUT.jpg
from PIL import Image,ImageDraw,ImageFont
import math,random,sys
random.seed(4)
W,H=1900,1150;im=Image.new('RGB',(W,H),(112,150,84));d=ImageDraw.Draw(im,'RGBA')
F=lambda s,b=False:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',s)
X=lambda x:(x-1250)*.95;Y=lambda y:(y+900)*.95+60
def R(x,y,w,h,f,o=None):d.rectangle([X(x),Y(y),X(x+w),Y(y+h)],fill=f,outline=o,width=2)
def T(x,y,s,sz=14,c=(255,255,255),b=True,bg=(10,14,20,200)):
    f=F(sz,b);l,t,r,bt=d.textbbox((0,0),s,font=f);px,py=X(x),Y(y);d.rectangle([px-4,py-3,px+r+4,py+bt+4],fill=bg);d.text((px,py),s,font=f,fill=c)
def line(P,c,w):d.line([(X(a),Y(b)) for a,b in P],fill=c,width=w,joint='curve')
def arrow(P,c,w=7):
    line(P,c,w);(a,b),(e,f)=P[-2],P[-1];an=math.atan2(Y(f)-Y(b),X(e)-X(a))
    d.polygon([(X(e),Y(f)),(X(e)-24*math.cos(an-.45),Y(f)-24*math.sin(an-.45)),(X(e)-24*math.cos(an+.45),Y(f)-24*math.sin(an+.45))],fill=c)
def burst(x,y,r):
    P=[(X(x)+math.cos(k*math.tau/14)*r*(1 if k%2 else .55),Y(y)+math.sin(k*math.tau/14)*r*(1 if k%2 else .55)) for k in range(14)];d.polygon(P,fill=(255,140,40,235),outline=(120,30,10))
def gun(x,y,col,ang,arc,reach):
    a0=math.radians(ang-arc);a1=math.radians(ang+arc);P=[(X(x),Y(y))]+[(X(x)+math.cos(a0+(a1-a0)*k/14)*reach,Y(y)+math.sin(a0+(a1-a0)*k/14)*reach) for k in range(15)]
    d.polygon(P,fill=col+(50,),outline=col+(150,));d.ellipse([X(x)-11,Y(y)-11,X(x)+11,Y(y)+11],fill=col,outline=(0,0,0),width=2)
# sea, beach, cliff
d.polygon([(X(1250),Y(120)),(X(3250),Y(-40)),(X(3250),Y(300)),(X(1250),Y(300))],fill=(70,128,150))
d.polygon([(X(1250),Y(-60)),(X(1900),Y(-150)),(X(2500),Y(-130)),(X(3250),Y(-260)),(X(3250),Y(-40)),(X(1250),Y(120))],fill=(218,200,150))
d.polygon([(X(1250),Y(-250)),(X(1840),Y(-330)),(X(2450),Y(-300)),(X(3250),Y(-430)),(X(3250),Y(-260)),(X(2500),Y(-130)),(X(1900),Y(-150)),(X(1250),Y(-60))],fill=(134,118,92))
for i in range(60):
    x=1270+i*33;y0=-250-(x-1250)*.09+random.uniform(-6,6);d.line([X(x),Y(y0+25),X(x+8),Y(y0+150)],fill=(96,84,66,150),width=2)
for i in range(430):
    x=random.uniform(2500,3250);y=random.uniform(-900,-690+(x-2500)*.06);r=random.uniform(10,17);d.ellipse([X(x)-r,Y(y)-r,X(x)+r,Y(y)+r],fill=(46,96,50) if i%3 else (58,112,58))
R(1300,-752,490,290,(214,202,170),(90,90,80))
road=(196,176,128)
line([(1250,-600),(1700,-600)],road,42);line([(1784,-600),(1950,-596),(2150,-606),(2330,-600),(2440,-598)],road,42)
line([(2440,-598),(2560,-640),(2700,-700),(2860,-770),(3050,-815),(3250,-835)],road,38)   # left: through the checkpoint, into the woods
line([(2440,-598),(2600,-540),(2780,-440),(2890,-300),(2960,-170),(3050,-90)],road,34)   # right: down the cliffs
R(1380,-746,120,44,(176,74,52));R(1530,-746,120,44,(176,74,52));R(1700,-644,84,88,(128,134,128),(40,40,40))
R(1420,-506,150,40,(128,134,128));R(1600,-506,56,40,(128,134,128));R(1730,-744,50,40,(196,120,60));R(1470,-660,150,110,(228,220,196),(250,250,240))
T(1385,-742,'BARRACKS A',12);T(1535,-742,'BARRACKS B',12)
for i in range(8):
    x=1500+(i%4)*26;y=-630+(i//4)*34;d.ellipse([X(x)-7,Y(y)-7,X(x)+7,Y(y)+7],fill=(88,196,246) if i<4 else (240,180,41),outline=(0,0,0))
T(1330,-545,'1 · Both squads at rest in the square',14)
for i in range(6):d.ellipse([X(1632+(i%3)*14)-6,Y(-690+(i//3)*14)-6,X(1632+(i%3)*14)+6,Y(-690+(i//3)*14)+6],fill=(120,140,90),outline=(0,0,0))
burst(1648,-684,34);T(1420,-842,'2 · Shells hit the group in front of Barracks B',14);d.line([X(1560),Y(-822),X(1640),Y(-716)],fill=(255,255,255),width=2)
burst(1826,-664,26);T(1700,-800,'3 · A shell lands beyond the command post',14);d.line([X(1800),Y(-780),X(1824),Y(-690)],fill=(255,255,255),width=2)
# the run through the command post
arrow([(1620,-600),(1700,-600),(1790,-600),(1850,-590)],(255,255,255),5);T(1330,-470,'4 · They run THROUGH the command post and out its east side',14)
d.line([X(1560),Y(-452),X(1730),Y(-590)],fill=(255,255,255),width=2)
d.ellipse([X(1742)-40,Y(-600)-40,X(1742)+40,Y(-600)+40],outline=(88,196,246),width=5);T(1690,-560,'A · COMMAND POST (hold it)',13,(150,220,255))
# guns
gun(1850,-490,(255,215,106),40,80,180);gun(1935,-515,(255,150,70),20,75,165);gun(1850,-700,(120,220,255),-6,48,150);gun(1905,-660,(120,220,255),-2,48,150)
T(1700,-430,'FIELD GUN · faces the beach, turns to the road',13,(255,225,130));T(1960,-470,'HEAVY MG · in front of it, same',13,(255,180,110));T(1930,-742,'2 MG NESTS · cover the command post',13,(150,225,255))
# the other troops already fighting, first tanks coming
for i in range(9):
    x=2000+(i%5)*38;y=-650+(i//5)*90+(i%2)*14;d.ellipse([X(x)-6,Y(y)-6,X(x)+6,Y(y)+6],fill=(120,140,90),outline=(0,0,0))
for i in range(10):
    x=2180+(i%5)*40;y=-660+(i//5)*100+(i%3)*10;d.ellipse([X(x)-6,Y(y)-6,X(x)+6,Y(y)+6],fill=(110,116,128),outline=(120,20,20))
for x in (2300,2370):d.rectangle([X(x)-16,Y(-600)-10,X(x)+16,Y(-600)+10],fill=(150,140,96),outline=(60,20,20),width=2)
T(1990,-560,'5 · Already fighting out here when you come out; first tanks on the road',14)
# the checkpoint between the branches
R(2575,-640,95,62,(120,124,118),(30,30,30));d.rectangle([X(2540),Y(-715),X(2700),Y(-560)],outline=(70,56,40),width=4)
d.line([X(2530),Y(-650),X(2600),Y(-690)],fill=(230,230,230),width=5)   # the barrier across the woods road
d.ellipse([X(2622)-52,Y(-628)-52,X(2622)+52,Y(-628)+52],outline=(230,60,50),width=5)
T(2720,-640,'B · THEIR CHECKPOINT (take it: their men stop',13,(255,170,160));T(2720,-618,'coming from here; then they fight to get it back)',13,(255,170,160))
T(2330,-560+70,'THE FORK',12)
arrow([(3220,-840),(3050,-822),(2860,-778),(2700,-708),(2570,-650),(2450,-612),(2420,-610)],(230,50,40))
T(2800,-880,'REINFORCEMENTS: infantry and tanks out of the woods',14,(255,170,160))
T(2900,-330,'the road down the cliffs to the beach',12,b=False)
for x,y,a in [(2050,60,.3),(2350,30,-.2),(2700,-20,.5),(2950,-60,-.4),(2200,150,.1),(2850,90,-.1)]:
    px,py=X(x),Y(y);P=[(px+math.cos(a+t)*r,py+math.sin(a+t)*r) for t,r in [(-.5,30),(.5,30),(2.6,30),(-2.6,30)]];d.polygon(P,fill=(70,72,70),outline=(20,20,20))
    for k in range(5):d.ellipse([px-8+k*5,py-34-k*9,px+10+k*6,py-14-k*9],fill=(40,40,40,120))
for i in range(70):
    x=random.uniform(1950,3150);y=random.uniform(-250,-40)-(x-1950)*.1;d.line([X(x),Y(y),X(x)+7,Y(y)+3],fill=(60,70,50),width=3)
T(2250,180,'THE LOST LANDING: wrecked craft in the surf, bodies on the sand and up the cliff',14)
T(1300,-205,'CLIFF',13,(240,230,210));T(1300,10,'BEACH',13,(60,50,40),True,(255,255,255,160))
arrow([(1330,-330),(1480,-330)],(255,255,255));T(1300,-372,'the battle looks EAST (the beach on your right)',14)
d.rectangle([0,0,W,56],fill=(12,16,24));d.text((16,12),"Chapter 2 on the D-Day base: plan, round 2 (draft, north up)",font=F(24,True),fill=(255,215,106))
d.text((W-340,18),"N ↑   100 m ≈ this bar",font=F(14),fill=(200,206,212));d.line([W-120,44,W-25,44],fill=(255,255,255),width=4)
im.save(sys.argv[1],quality=90)

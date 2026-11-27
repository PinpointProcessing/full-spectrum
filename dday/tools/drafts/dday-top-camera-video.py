# The hilltop camera films and sheet from dday-top-camera-video.js's frames:
# python3 dday-top-camera-video.py FRAMES_DIR OUT_DIR
# -> OUT_DIR/top-A.mp4 .. top-D.mp4, top-grid.mp4 (A B over C D), a poster for each, and top-sheet.jpg: the four cameras (across) at three
#    moments (down): on the top before the tank, the tank driving in, the tank close
import sys, os, json, subprocess
from PIL import Image, ImageDraw, ImageFont
SRC, OUT = sys.argv[1], sys.argv[2]
info = json.load(open(os.path.join(SRC, 'info.json')))
FPS, N, T = info['fps'], info['frames'], info.get('tankAt') or 0
os.makedirs(OUT, exist_ok=True)
enc = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart']
for cam in 'ABCD':
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', f'{FPS:g}', '-i', os.path.join(SRC, cam, '%05d.jpg'),
                    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'] + enc + [os.path.join(OUT, f'top-{cam}.mp4')], check=True)
    print(f'top-{cam}.mp4', os.path.getsize(os.path.join(OUT, f'top-{cam}.mp4')) // 1024, 'KB')
ins = sum([['-i', os.path.join(OUT, f'top-{c}.mp4')] for c in 'ABCD'], [])
fc = ';'.join(f'[{i}]scale=390:760,pad=394:764:2:2:color=0x0b0f13[v{i}]' for i in range(4)) + ';[v0][v1]hstack[t];[v2][v3]hstack[b];[t][b]vstack'
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', fc] + enc + [os.path.join(OUT, 'top-grid.mp4')], check=True)
print('top-grid.mp4', os.path.getsize(os.path.join(OUT, 'top-grid.mp4')) // 1024, 'KB')
# the moments (frame numbers, 1-based): just before the tank, 4 s after it comes, 13 s after
moments = [max(1, T - 1), min(N, T + int(4 * FPS)), min(N, T + int(13 * FPS))]
names = ['ON THE TOP, BEFORE THE TANK', 'THE TANK DRIVES IN', 'THE TANK CLOSE']
poster = moments[1]
for name in ['top-A', 'top-B', 'top-C', 'top-D', 'top-grid']:
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{(poster - 1) / FPS:.2f}', '-i', os.path.join(OUT, name + '.mp4'), '-frames:v', '1', '-q:v', '4', os.path.join(OUT, name + '.jpg')], check=True)
im0 = Image.open(os.path.join(SRC, 'A', '00001.jpg'))
sc = 0.62
cw, ch = int(im0.width / (im0.width / 390) * sc), int(im0.height / (im0.width / 390) * sc)
pad, head = 10, 34
sheet = Image.new('RGB', (4 * cw + 5 * pad, 3 * (ch + head) + 3 * pad + 8), (11, 15, 19))
dr = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except OSError:
    font = ImageFont.load_default()
for r, (f, nm) in enumerate(zip(moments, names)):
    y = pad + r * (ch + head + pad)
    dr.text((pad, y + 8), f'{r + 1} · {nm}', fill=(255, 207, 74), font=font)
    for c, cam in enumerate('ABCD'):
        im = Image.open(os.path.join(SRC, cam, f'{f:05d}.jpg')).resize((cw, ch), Image.LANCZOS)
        sheet.paste(im, (pad + c * (cw + pad), y + head))
sheet.save(os.path.join(OUT, 'top-sheet.jpg'), quality=86)
print('top-sheet.jpg', sheet.size, 'moments', moments)

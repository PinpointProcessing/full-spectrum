#!/usr/bin/env python3
"""Puts the draft frames together: labelled panels one above the other, as looping GIFs (ffmpeg's palette) and a still sheet.
   python3 compose.py run   <frames dir> <out dir>   (run.js's frames: <opt>-close|front|game-NN.jpg)
   python3 compose.py queen <frames dir> <out dir>   (queen.js's frames: <opt>-<shot>-NNN.jpg)
   python3 compose.py page <run close frames> <run game frames> <tunnel game frames> <tunnel close frames> <out dir>   (one video per option)"""
import sys, os, glob, subprocess, tempfile, shutil
from PIL import Image, ImageDraw, ImageFont

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(px):
    try: return ImageFont.truetype(FONT, px)
    except OSError: return ImageFont.load_default()

def label(im, text, px=None):
    d = ImageDraw.Draw(im); f = font(px or max(13, im.width // 26))
    x0, y0, x1, y1 = d.textbbox((0, 0), text, font=f); pad = 6
    d.rectangle((8, 8, 8 + x1 - x0 + 2 * pad, 8 + y1 - y0 + 2 * pad), fill=(10, 12, 14))
    d.text((8 + pad - x0, 8 + pad - y0), text, font=f, fill=(235, 238, 240))
    return im

def frames(fdir, opt, shot):
    return sorted(glob.glob(os.path.join(fdir, f'{opt}-{shot}-*.jpg')))

def stack(fdir, opts, shot, crop, size, names):
    """one image per frame index: each option's frame cropped, scaled and labelled, one above the other"""
    sets = [frames(fdir, o, shot) for o in opts]; n = min(len(s) for s in sets); out = []
    for i in range(n):
        panel = Image.new('RGB', (size[0], size[1] * len(opts)), (8, 9, 10))
        for k, s in enumerate(sets):
            im = Image.open(s[i]).convert('RGB').crop(crop).resize(size, Image.LANCZOS)
            panel.paste(label(im, names[k]), (0, size[1] * k))
        out.append(panel)
    return out

def gif(imgs, path, ms):
    tmp = tempfile.mkdtemp()
    try:
        for i, im in enumerate(imgs): im.save(os.path.join(tmp, f'{i:04d}.png'))
        fps = 1000.0 / ms; src = os.path.join(tmp, '%04d.png'); pal = os.path.join(tmp, 'pal.png')
        dn = 'hqdn3d=6:6:0:0'   # (the film grain and the rain's speckle make a GIF huge: smoothed out first)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', f'{fps:.3f}', '-i', src, '-vf', dn + ',palettegen=max_colors=128:stats_mode=full', pal], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', f'{fps:.3f}', '-i', src, '-i', pal, '-lavfi', f'[0:v]{dn}[x];[x][1:v]paletteuse=dither=none', '-loop', '0', path], check=True)
        mp4 = path[:-4] + '.mp4'   # and a small video of the same (H.264; the size even for it); a short loop (one stride) played over for about 6 s
        reps = max(1, round(6.0 / (len(imgs) / fps))) if len(imgs) / fps < 4 else 1
        for k in range(len(imgs), len(imgs) * reps): os.symlink(os.path.join(tmp, f'{k % len(imgs):04d}.png'), os.path.join(tmp, f'{k:04d}.png'))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', f'{fps:.3f}', '-i', src, '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', mp4], check=True)
    finally: shutil.rmtree(tmp)
    print(path, os.path.getsize(path) // 1024, 'KB', '(mp4', os.path.getsize(path[:-4] + '.mp4') // 1024, 'KB)')

def sheet(fdir, opts, shot, crop, size, names, every, path, cols=None):
    rows = []
    for k, o in enumerate(opts):
        fs = frames(fdir, o, shot)[::every][:cols] if cols else frames(fdir, o, shot)[::every]
        row = Image.new('RGB', (size[0] * len(fs), size[1]), (8, 9, 10))
        for i, f in enumerate(fs): row.paste(Image.open(f).convert('RGB').crop(crop).resize(size, Image.LANCZOS), (size[0] * i, 0))
        rows.append(label(row, names[k], 22))
    W = max(r.width for r in rows); s = Image.new('RGB', (W, size[1] * len(rows)), (8, 9, 10))
    for k, r in enumerate(rows): s.paste(r, (0, size[1] * k))
    s.save(path, quality=86); print(path, s.size)

def grid(fdir, opts, shot, crop, names, times, fps, path, cols=3, tile=(400, 187)):
    """a still per moment (seconds), cols across and as many rows as it takes, each option a block with its name, one above the other"""
    rows = (len(times) + cols - 1) // cols; bh = rows * tile[1]; out = Image.new('RGB', (cols * tile[0], bh * len(opts) + 6 * (len(opts) - 1)), (8, 9, 10))
    for k, o in enumerate(opts):
        fs = frames(fdir, o, shot)
        for i, t in enumerate(times):
            f = fs[min(len(fs) - 1, round(t * fps))]; im = Image.open(f).convert('RGB').crop(crop).resize(tile, Image.LANCZOS)
            d = ImageDraw.Draw(im); fnt = font(14); txt = f'{t:g} s'; x0, y0, x1, y1 = d.textbbox((0, 0), txt, font=fnt)
            d.rectangle((tile[0] - (x1 - x0) - 18, tile[1] - (y1 - y0) - 16, tile[0] - 6, tile[1] - 6), fill=(10, 12, 14)); d.text((tile[0] - (x1 - x0) - 12 - x0, tile[1] - (y1 - y0) - 11 - y0), txt, font=fnt, fill=(200, 205, 210))
            if i == 0: label(im, names[k], 17)
            out.paste(im, ((i % cols) * tile[0], k * (bh + 6) + (i // cols) * tile[1]))
    out.save(path, quality=86); print(path, out.size)

def run(fdir, odir):
    opts = ['now', 'A', 'B']; names = ['Now', 'A · combat run', 'B · sprint']
    # one stride, 16 frames: at half speed (a stride is about half a second)
    gif(stack(fdir, opts, 'front', (440, 90, 840, 610), (300, 390), names), os.path.join(odir, 'run-front.gif'), 60)
    gif(stack(fdir, opts, 'close', (400, 90, 880, 650), (300, 350), names), os.path.join(odir, 'run-side.gif'), 60)
    # the game's own camera on the walk across, real speed
    gif(stack(fdir, opts, 'game', (330, 360, 790, 619), (560, 315), names), os.path.join(odir, 'run-game.gif'), 50)
    sheet(fdir, opts, 'front', (440, 90, 840, 610), (200, 260), names, 2, os.path.join(odir, 'run-sheet.jpg'))

def queen(fdir, odir):
    opts = [o for o in ['now', 'A', 'B'] if frames(fdir, o, 'game')]
    names = {'now': 'Now', 'A': 'A · the Queen first', 'B': 'B · the babies first'}
    for shot, crop, size in [('game', (24, 58, 1256, 633), (640, 300)), ('close', (24, 58, 1256, 633), (640, 300))]:
        have = [o for o in opts if frames(fdir, o, shot)]
        if not have: continue
        for o in have:
            imgs = [label(Image.open(f).convert('RGB').crop(crop).resize(size, Image.LANCZOS), names[o]) for f in frames(fdir, o, shot)]
            gif(imgs, os.path.join(odir, f'queen-{o}-{shot}.gif'), 125)
        grid(fdir, have, shot, crop, [names[o] for o in have], [1.5, 3, 4.5, 6, 7.5, 9], 8, os.path.join(odir, f'queen-{shot}-sheet.jpg'))

def clip(fs, path, fps, crop, size=None, loops=1, crf=23):
    """one option's frames as a small H.264 video (cropped, scaled, played over `loops` times)"""
    tmp = tempfile.mkdtemp()
    try:
        n = 0
        for _ in range(loops):
            for f in fs:
                im = Image.open(f).convert('RGB').crop(crop)
                if size: im = im.resize(size, Image.LANCZOS)
                im.save(os.path.join(tmp, f'{n:05d}.png')); n += 1
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', f'{fps:.3f}', '-i', os.path.join(tmp, '%05d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264',
                        '-pix_fmt', 'yuv420p', '-crf', str(crf), '-movflags', '+faststart', path], check=True)
    finally: shutil.rmtree(tmp)
    print(path, os.path.getsize(path) // 1024, 'KB')

def page(rclose, rgame, tgame, tclose, odir):
    """the videos for the drafts page, one per option and view: the run close up (one stride, half speed, looped), the run at the
       game's camera (real speed), the tunnel from the bridge and from closer"""
    for o in ['now', 'A', 'B']:
        clip(frames(rclose, o, 'front'), os.path.join(odir, f'run-close-{o}.mp4'), 1000 / 60, (440, 90, 840, 610), loops=8)
        clip(frames(rgame, o, 'game'), os.path.join(odir, f'run-game-{o}.mp4'), 30, (300, 330, 860, 645))
        clip(frames(tgame, o, 'game'), os.path.join(odir, f'tunnel-{o}.mp4'), 15, (24, 58, 1256, 633), (960, 448))
        if o != 'now' and frames(tclose, o, 'close'): clip(frames(tclose, o, 'close'), os.path.join(odir, f'tunnel-close-{o}.mp4'), 8, (24, 58, 1256, 633), (960, 448))

if __name__ == '__main__':
    if sys.argv[1] == 'page': page(*sys.argv[2:7]); sys.exit()
    what, fdir, odir = sys.argv[1], sys.argv[2], sys.argv[3]; os.makedirs(odir, exist_ok=True)
    {'run': run, 'queen': queen}[what](fdir, odir)

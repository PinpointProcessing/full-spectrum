# The camera films from dday-camera-video.js's frames, the stretches one after another:
# python3 dday-camera-video.py OUT_DIR FPS DIR1 [DIR2 ...]
# -> OUT_DIR/cam-A.mp4 .. cam-D.mp4 (each camera through every stretch, the first frame of each stretch held half a second),
#    cam-grid.mp4 (A B over C D, each at 390 x 760), and a poster picture for each (cam-A.jpg ..., cam-grid.jpg)
import sys, os, subprocess, tempfile, shutil
OUT, FPS, DIRS = sys.argv[1], float(sys.argv[2]), sys.argv[3:]
HOLD = int(FPS * .5)
os.makedirs(OUT, exist_ok=True)
tmp = tempfile.mkdtemp()
enc = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart']
try:
    for cam in 'ABCD':
        d = os.path.join(tmp, cam); os.makedirs(d); n = 0
        for D in DIRS:
            for i, f in enumerate(sorted(os.listdir(os.path.join(D, cam)))):
                for _ in range(HOLD if i == 0 else 1):
                    n += 1; os.symlink(os.path.abspath(os.path.join(D, cam, f)), os.path.join(d, f'{n:05d}.jpg'))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', f'{FPS:g}', '-i', os.path.join(d, '%05d.jpg'),
                        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'] + enc + [os.path.join(OUT, f'cam-{cam}.mp4')], check=True)
        print(f'cam-{cam}.mp4', n, 'frames', os.path.getsize(os.path.join(OUT, f'cam-{cam}.mp4')) // 1024, 'KB')
    ins = sum([['-i', os.path.join(OUT, f'cam-{c}.mp4')] for c in 'ABCD'], [])
    fc = ';'.join(f'[{i}]scale=390:760,pad=394:764:2:2:color=0x0b0f13[v{i}]' for i in range(4)) + ';[v0][v1]hstack[t];[v2][v3]hstack[b];[t][b]vstack'
    subprocess.run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', fc] + enc + [os.path.join(OUT, 'cam-grid.mp4')], check=True)
    print('cam-grid.mp4', os.path.getsize(os.path.join(OUT, 'cam-grid.mp4')) // 1024, 'KB')
    # posters: a moment on the way up, where the cameras differ most
    for name in ['cam-A', 'cam-B', 'cam-C', 'cam-D', 'cam-grid']:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '14', '-i', os.path.join(OUT, name + '.mp4'), '-frames:v', '1', '-q:v', '4', os.path.join(OUT, name + '.jpg')], check=True)
finally:
    shutil.rmtree(tmp)

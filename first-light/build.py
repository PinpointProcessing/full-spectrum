#!/usr/bin/env python3
"""Concatenate src/*.js into shell.html -> ../first-light.html (single self-contained page)."""
import glob, os
here = os.path.dirname(os.path.abspath(__file__))
shell = open(os.path.join(here, 'shell.html')).read()
src = '\n'.join('/* ===== %s ===== */\n%s' % (os.path.basename(p), open(p).read()) for p in sorted(glob.glob(os.path.join(here, 'src', '*.js'))))
# recorded sounds ride along inside the page as base64 (an artifact cannot load files from anywhere else)
import base64
snd = {os.path.basename(p)[:-4]: base64.b64encode(open(p, 'rb').read()).decode() for p in sorted(glob.glob(os.path.join(here, 'sounds', '*.mp3')))}
import json
vl = os.path.join(here, 'sounds', 'voices.json')
src = 'const VLINE=' + (json.dumps(json.load(open(vl, encoding='utf-8')), ensure_ascii=False) if os.path.exists(vl) else '{}') + ';\n' + src
src = 'const SND_B64={' + ','.join('%s:"%s"' % kv for kv in snd.items()) + '};\n' + src
assert '/*@@SRC@@*/' in shell
open(os.path.join(here, '..', 'first-light.html'), 'w').write(shell.replace('/*@@SRC@@*/', src))
print('built first-light.html', len(src) // 1024, 'KB of script')

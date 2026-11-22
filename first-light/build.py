#!/usr/bin/env python3
"""Concatenate src/*.js into shell.html -> ../first-light.html (single self-contained page)."""
import glob, os
here = os.path.dirname(os.path.abspath(__file__))
shell = open(os.path.join(here, 'shell.html')).read()
src = '\n'.join('/* ===== %s ===== */\n%s' % (os.path.basename(p), open(p).read()) for p in sorted(glob.glob(os.path.join(here, 'src', '*.js'))))
assert '/*@@SRC@@*/' in shell
open(os.path.join(here, '..', 'first-light.html'), 'w').write(shell.replace('/*@@SRC@@*/', src))
print('built first-light.html', len(src) // 1024, 'KB of script')

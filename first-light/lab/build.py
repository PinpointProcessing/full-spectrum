#!/usr/bin/env python3
"""Build ../../character-lab.html from the game's core module plus the lab modules."""
import os
here = os.path.dirname(os.path.abspath(__file__))
files = [os.path.join(here, '..', 'src', '00-core.js'), os.path.join(here, '..', 'src', '50-figures.js'), os.path.join(here, '20-lab.js')]
src = '\n'.join('/* ===== %s ===== */\n%s' % (os.path.basename(p), open(p).read()) for p in files)
shell = open(os.path.join(here, 'shell.html')).read()
open(os.path.join(here, '..', '..', 'character-lab.html'), 'w').write(shell.replace('/*@@SRC@@*/', src))
print('built character-lab.html', len(src) // 1024, 'KB of script')

import sys, io
ROOT = sys.argv[1]

def rep(f, old, new, n=1):
    p = ROOT + '/' + f
    s = io.open(p, encoding='utf-8').read()
    c = s.count(old)
    if c != n:
        raise SystemExit('%s: expected %d of %r, found %d' % (f, n, old[:70], c))
    io.open(p, 'w', encoding='utf-8').write(s.replace(old, new))

def after(f, anchor, add):
    rep(f, anchor, anchor + add)

def before(f, anchor, add):
    rep(f, anchor, add + anchor)

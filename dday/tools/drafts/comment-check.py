# lines changed in the working tree (or since a commit): is there code after a trailing "// (" comment's closing paren?  python3 cmtcheck.py [base] files...
import subprocess,sys
args=sys.argv[1:];base=[]
if args and not args[0].endswith(('.js','.css')):base=[args[0]];args=args[1:]
bad=0
for f in args:
    d=subprocess.run(['git','diff','-U0']+base+['--',f],capture_output=True,text=True).stdout
    for l in d.split('\n'):
        if not l.startswith('+') or l.startswith('+++'):continue
        l=l[1:];i=l.find('// (')
        while i>=0:
            c=l[i+3:];depth=0;end=-1
            for k,ch in enumerate(c):
                if ch=='(':depth+=1
                elif ch==')':
                    depth-=1
                    if depth==0:end=k;break
            rest=c[end+1:].strip() if end>=0 else ''
            if rest and not rest.startswith('//') and any(q in rest for q in ';={}'):
                bad+=1;print(f,'CODE AFTER A COMMENT:',rest[:140])
            i=-1
print('lines with code after a comment:',bad)

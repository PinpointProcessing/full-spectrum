#!/bin/bash
# rebuild the scratch copy from the last commit and apply every patch written so far
SP=/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad
mkdir -p $SP/d223new && cd /home/user/full-spectrum && git archive HEAD dday | tar -x -C $SP/d223new && cd $SP/p223 || exit 1
for p in "$@"; do python3 $p.py $SP/d223new/dday || exit 1; done
for f in $SP/d223new/dday/js/*.js; do node --check $f || exit 1; done
mv $SP/d223 $SP/d223old.$$ && mv $SP/d223new $SP/d223 && echo rebuilt

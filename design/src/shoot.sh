#!/bin/bash
# usage: shoot.sh name w h suffix [url-fragment] [full]
#   full = shoot tall and trim trailing background (full-page shot)
cd "$(dirname "$0")/.."
n=$1; w=$2; h=$3; sfx=$4
google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=$w,$h --virtual-time-budget=6000 --screenshot=shots/$n-$sfx.png "file://$PWD/mocks/$n.html${5}" 2>/dev/null
[ "$6" = "full" ] && python3 src/crop.py shots/$n-$sfx.png
true

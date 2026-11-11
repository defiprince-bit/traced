#!/bin/bash
# Regenerates every Traced shot via the CDP driver (real time). Run from design/.
cd "$(dirname "$0")/.."
U="file://$PWD/mocks"
L(){ node src/shoot.mjs shots/landing-$1.png "$U/landing.html" $2 $3 "$4" ${5:-2000} $6; }
A(){ node src/shoot.mjs shots/app-$1.png "$U/app.html#$2" $3 $4 "" ${5:-1800} $6; }
# landing desktop frames
L desktop-01-hero 1440 900 "" 2200
L desktop-02-story-a 1440 900 "__go('story',.12)"
L desktop-02-story-b 1440 900 "__go('story',.9)"
L desktop-03-features 1440 900 "__go('features',0)" 2400
L desktop-04-badges-a 1440 900 "__go('badges',.02)"
L desktop-04-badges-b 1440 900 "__go('badges',.62)"
L desktop-05-inside-lineage 1440 900 "__go('inside',0);__block(0)"
L desktop-05-inside-copy 1440 900 "__go('inside',0);__block(1)"
L desktop-05-inside-replay 1440 900 "__go('inside',0);__block(2)"
L desktop-06-traceback 1440 900 "__go('trace-back',0)" 2400
L desktop-06-traceback-hover 1440 900 "__go('trace-back',0);__tb()" 2600
L desktop-07-honesty 1440 900 "__go('honesty',0)"
L desktop-08-cta 1440 900 "__go('cta',0)"
# landing mobile frames
L mobile-01-hero 390 844 "" 2200
L mobile-02-story 390 844 "__go('story',.85)"
L mobile-03-features 390 844 "__go('features',0)" 2400
L mobile-04-badges 390 844 "__go('badges',0)"
L mobile-05-inside 390 844 "__go('inside',0)"
L mobile-06-traceback 390 844 "__go('trace-back',0);__tb()" 2600
L mobile-08-cta 390 844 "__go('cta',0)"
# full page (static: no pinning, every section open)
node src/shoot.mjs shots/landing-desktop-full.png "$U/landing.html#static" 1440 900 "" 2500 full
node src/shoot.mjs shots/landing-mobile-full.png "$U/landing.html#static" 390 844 "" 2500 full
# app views
for v in lineage-12 lookup-5 copy-34 findings-empty replay-34 state-loading state-notfound state-error; do A $v-desktop "$v" 1440 900; done
for v in lineage-12 lookup-5 copy-34 findings-empty replay-34; do A $v-mobile "$v" 390 844; A $v-mobile-full "$v" 390 844 1800 full; done

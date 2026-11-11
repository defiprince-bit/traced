import json,cairosvg,sys
p=json.load(open('paths.json'))
for n,d in p.items():
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1024" height="1024"><rect width="512" height="512" fill="#fff"/><path fill-rule="evenodd" d="{d}"/></svg>'
    cairosvg.svg2png(bytestring=svg.encode(),write_to=f'prev-{n}.png')

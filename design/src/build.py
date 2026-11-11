import pathlib, re, urllib.parse
d=pathlib.Path(__file__).parent
root=d.parent
logo=root/'logo'
fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">'
fav=(logo/'favicon.svg').read_text().strip()
fav_link=f'<link rel="icon" href="data:image/svg+xml,{urllib.parse.quote(fav, safe="")}" type="image/svg+xml">'
head=fav_link+fonts+'<style>\n'+(d/'tokens.css').read_text()+'\n'+(d/'base.css').read_text()+'\n</style>'
js=(d/'cubes.js').read_text()
md=re.search(r'\sd="([^"]+)"', (logo/'mark-green.svg').read_text()).group(1)
MARK=f'<svg class="mark" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="{md}"/></svg>'
for f in sorted(d.glob('*.src.html')):
    n=f.name.replace('.src.html','')
    s=f.read_text().replace('<!--HEAD-->',head).replace('/*CUBESJS*/',js).replace('<!--MARK-->',MARK)
    (root/'mocks'/f'{n}.html').write_text(s)
print('built')

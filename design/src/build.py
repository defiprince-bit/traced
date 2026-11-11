import pathlib
d=pathlib.Path(__file__).parent
fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">'
head=fonts+'<style>\n'+(d/'tokens.css').read_text()+'\n'+(d/'base.css').read_text()+'\n</style>'
js=(d/'cubes.js').read_text()
for f in sorted(d.glob('*.src.html')):
    n=f.name.replace('.src.html','')
    s=f.read_text().replace('<!--HEAD-->',head).replace('/*CUBESJS*/',js)
    (d.parent/'mocks'/f'{n}.html').write_text(s)
print('built')

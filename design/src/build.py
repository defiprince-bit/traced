import pathlib
d=pathlib.Path(__file__).parent
fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&display=swap" rel="stylesheet">'
head=fonts+'<style>\n'+(d/'tokens.css').read_text()+'\n'+(d/'base.css').read_text()+'\n</style>'
mark=(d/'mark.svg').read_text().strip()
tjs=(d/'trace.js').read_text()
for f in sorted(d.glob('*.src.html')):
    n=f.name.replace('.src.html','')
    s=f.read_text().replace('<!--HEAD-->',head).replace('{{MARK}}',mark).replace('/*TRACEJS*/',tjs)
    (d.parent/'mocks'/f'{n}.html').write_text(s)
print('built')

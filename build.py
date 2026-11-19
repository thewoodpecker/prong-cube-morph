import base64
font=base64.b64encode(open('inter-sb.woff','rb').read()).decode()
geo=open('geo.json').read(); js=open('src.js').read(); tpl=open('tpl.html').read()
open('index.html','w').write(tpl.replace('__FONT__',font).replace('__GEO__',geo).replace('__JS__',js))

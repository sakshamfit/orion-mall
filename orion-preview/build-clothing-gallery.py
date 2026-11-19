"""Extract explicitly labelled clothing store photos from imported content."""
import re,html,json
from pathlib import Path
root=Path(__file__).resolve().parent
s=(root/'clothing.html').read_text().split('<!-- wordpress-export:start -->',1)[1]
ms=list(re.finditer(r'<h3>\s*((?:ground|first|second|third|\d+(?:st|nd|rd|th)?)\s*floor)\s*</h3>',s,re.I))
# Image labels in the export occasionally identify a different brand; do not guess.
known={0:('Van Heusen','van husen'),1:('United Colors of Benetton','united colors'),2:('Max','max'),4:('Louis Philippe','louis philippe'),5:('ColorPlus','color plus'),6:('Being Human','being human'),7:('Allen Solly','allen solly'),8:('Mufti','mufti'),9:('Pepe Jeans','pepe jeans'),10:('Spykar','spykar'),11:('Peter England','peter england'),12:('Aurelia','aurela'),13:('Peachmode','peach mode'),14:('Ruff','ruft'),18:('Sabhyata','sabhyata'),19:('W','w'),20:('Soch','soch'),21:('Van Heusen Women','van heusen woman'),22:('Van Heusen Innerwear','van heusen innerwear'),23:('Odette','odette')}
assert len(ms)==24, 'Review listing order after import'
items=[]
for i,(name,match) in known.items():
 m=ms[i];end=ms[i+1].start() if i+1<len(ms) else s.find('</div></section>',m.end()); chunk=s[m.end():end]; photos=[]
 for fig in re.findall(r'<figure>.*?</figure>',chunk,re.S):
  src=re.search(r'src="([^"]+)"',fig); alt=re.search(r'alt="([^"]*)"',fig)
  if src and alt and html.unescape(alt.group(1)).strip().lower()==match: photos.append(html.unescape(src.group(1)))
 if photos:
  f=m.group(1).lower().replace('  ',' '); floor='Ground Floor' if f.startswith('ground') else 'First Floor' if f.startswith(('1st','first')) else 'Second Floor'
  items.append({'name':name,'floor':floor,'images':list(dict.fromkeys(photos))})
(root/'data'/'clothing-photos.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
print(len(items),'brands,',sum(len(x['images']) for x in items),'labelled photos')

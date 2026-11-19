"""Extract floor listings from the imported WordPress category pages.
Names are curated because export image alt text and descriptions can be inconsistent.
Run after importing WordPress content; inspect source data before publishing.
"""
import re, html, json
from pathlib import Path
root=Path(__file__).resolve().parent
names={
'clothing':['Van Heusen','United Colors of Benetton','Max',"Levi’s",'Louis Philippe','ColorPlus','Being Human','Allen Solly','Mufti','Pepe Jeans','Spykar','Peter England','Aurelia','Peachmode','Ruff','Cotton Culture','Easybuy','Rangriti','Sabhyata','W','Soch','Van Heusen Women','Van Heusen Innerwear','Odette'],
'accessories':['Samsung','iDelta','VIP','Miniso','Titan','Lavie','Market99','Luggage store (name unconfirmed)','Miarcus'],
'apparel':['Sugar Cosmetics','Revlon','Bella Vita','Caprese','Jawed Habib'],
'footwear':['Crocs','Skechers','Reebok'],
'chocolates':['Turquoise Turkish Ice Cream','AU Naturals','Baskin-Robbins'],
'fast-food':["Domino’s",'Bikaner’s Kitchen','Ni Hao','Burger King','Chaat Ka Chaska','Subway','Crimson Cafe','Wow Food Zone'],
'restaurant':['KFC','Boombox'],
'fun-zone':['Fun Unlimited','Game Zone'],
}
# The export contains unrelated or misleading logo URLs for these entries.
no_logo={('clothing',6),('clothing',15),('clothing',16),('clothing',22),('clothing',23),('accessories',7),('fun-zone',1)}
rows=[]
for page, titles in names.items():
 s=(root/(page+'.html')).read_text();s=s[s.index('<!-- wordpress-export:start -->'):]
 matches=list(re.finditer(r'<h3>\s*((?:ground|first|second|third|fourth|fifth|\d+(?:st|nd|rd|th)?)\s*floor)\s*</h3>',s,re.I))
 if len(matches)!=len(titles): raise ValueError(f'{page}: expected {len(titles)} listings, found {len(matches)}; review names')
 for i,m in enumerate(matches):
  end=matches[i+1].start() if i+1<len(matches) else s.find('</div></section>',m.end()); section=s[m.end():end]
  floor=m.group(1).lower().replace('  ',' ')
  for k,v in [('1st','First'),('2nd','Second'),('3rd','Third'),('4th','Fourth'),('5th','Fifth'),('ground','Ground'),('first','First'),('second','Second'),('third','Third'),('fourth','Fourth'),('fifth','Fifth')]:
   if floor.startswith(k): floor=v+' Floor';break
  direct=re.sub(r'<figure>.*?</figure>','',section,flags=re.S)
  logo=re.search(r'<img\b[^>]*src="([^"]+)',direct)
  src=html.unescape(logo.group(1)) if logo and (page,i) not in no_logo else ''
  quick=re.search(r'<h2>\s*(?:Quick Shop:\s*)?(.*?)</h2>',section,re.S|re.I)
  detail=re.sub(r'\s+',' ',re.sub(r'<[^>]*>',' ',html.unescape(quick.group(1)))).strip() if quick else ''
  # Two source listings disagree between their floor heading and address.
  if (page,i) in {('chocolates',0),('restaurant',0)}:
   detail = (detail or 'See the directory for more details.') + ' The original listing gives conflicting floor information: the heading says Ground Floor, but the address says Third Floor. Please confirm with mall management.'
   floor = 'Third Floor'
  if (page,i)==('clothing',23): detail = 'Fashion and accessories. The original listing contains conflicting category details.'
  rows.append(dict(name=titles[i], floor=floor, image=src, detail=detail or 'See the directory for more details.', href='/'+page+'.html'))
(root/'data'/'brands.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(f'Extracted {len(rows)} listings across {len(set(r["floor"] for r in rows))} floors')

#!/usr/bin/env python3
"""Place WordPress-export media when its page/section association is explicit."""
import html,json,sys,xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse
root=Path(__file__).resolve().parent
ns={'w':'http://wordpress.org/export/1.2/'}
items=ET.parse(sys.argv[1]).findall('./channel/item')
def meta(item):return {m.findtext('w:meta_key',namespaces=ns):m.findtext('w:meta_value',namespaces=ns) for m in item.findall('w:postmeta',ns)}
def url(v):
 p=urlparse(v)
 return 'https://orionmallgorakhpur.com'+p.path if p.hostname in ('orionmallgorakhpur.com','www.orionmallgorakhpur.com') else v
attachments={x.findtext('w:post_id',namespaces=ns): x for x in items if x.findtext('w:post_type',namespaces=ns)=='attachment'}
# These are explicit Elementor category headings and their associated backgrounds.
categories={
'shop.html':[('Clothing','qtq80-7bsDUb.jpeg'),('Footwear','footwear-1.jpeg'),('Cosmetic / Unisex Salon','apparels.jpeg'),('Gadgets / Accessories / Gifts & More','miniso-orion-mall.png')],
'dine.html':[('Cafe','istockphoto-1130595856-612x612-1.jpeg'),('Chocolates / Ice Cream / Juice','newwww.webp'),('Food Court','fast-food.jpeg'),('Restaurants','restaurants.jpeg')],
'entertain.html':[('Fun Zone','Fun-Zone-orion-mall.webp'),('Movie Showing','Inox-orion.jpeg')],
}
for name,entries in categories.items():
 p=root/name;s=p.read_text()
 for title,file in entries:
  marker='<h2>'+html.escape(title)+'</h2>'
  picture='<img class="category-image" src="https://orionmallgorakhpur.com/wp-content/uploads/2023/06/'+html.escape(file,quote=True)+'" alt="" loading="lazy">'
  if marker in s and picture not in s:s=s.replace(marker,picture+marker,1)
 p.write_text(s)
# Event featured media is assigned through each post's _thumbnail_id, not inferred.
count=0
for x in items:
 if x.findtext('w:post_type',namespaces=ns)!='tribe_events' or x.findtext('w:status',namespaces=ns)!='publish':continue
 ident=x.findtext('w:post_id',namespaces=ns); a=attachments.get(meta(x).get('_thumbnail_id'))
 if a is None:continue
 src=a.findtext('w:attachment_url',namespaces=ns) or ''
 if not src:continue
 p=root/('event-'+ident+'.html')
 if not p.exists():continue
 s=p.read_text();start=s.find('<!-- featured-media:start -->');end=s.find('<!-- featured-media:end -->')
 if start>=0 and end>=0:s=s[:start]+s[end+len('<!-- featured-media:end -->'):]
 title=x.findtext('title') or 'Event at Orion Mall'
 pic='<\!-- featured-media:start -->' # actual comment marker below
 pic='<!-- featured-media:start --><figure class="export-featured wrap"><img loading="lazy" src="'+html.escape(url(src),quote=True)+'" alt="'+html.escape(title,quote=True)+'"></figure><!-- featured-media:end -->'
 s=s.replace('<!-- wordpress-export:start -->',pic+'<!-- wordpress-export:start -->',1);p.write_text(s);count+=1
print('Placed original category images:',sum(len(x) for x in categories.values()),'; event featured images:',count)

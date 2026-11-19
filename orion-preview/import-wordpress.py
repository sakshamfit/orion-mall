#!/usr/bin/env python3
"""Generate a safe, read-only preview of published WordPress export content.
Usage: python3 orion-preview/import-wordpress.py /path/to/export.xml
This does not import plugin state or recreate Elementor templates.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import html, sys, xml.etree.ElementTree as ET

root=Path(__file__).resolve().parent
ns={'wp':'http://wordpress.org/export/1.2/','content':'http://purl.org/rss/1.0/modules/content/'}
items=ET.parse(sys.argv[1]).findall('./channel/item')
existing={'4387':'index.html','43':'about.html','414':'contact.html','4741':'dine.html','4800':'shop.html','4857':'entertain.html','4902':'movie.html','4904':'cafe.html','5096':'restaurant.html','5149':'fast-food.html','5163':'clothing.html','5212':'footwear.html','5224':'apparel.html','5233':'accessories.html','5392':'services.html','5911':'fun-zone.html','6190':'chocolates.html','6035':'offers.html','5571':'first-floors.html','5284':'events.html','38':'store.html','39':'cart.html','40':'checkout.html','41':'my-account.html','5285':'event-locations.html','5286':'event-categories.html','5287':'event-tags.html','5288':'event-bookings.html'}
selected=[]
for item in items:
 typ=item.findtext('wp:post_type',namespaces=ns); status=item.findtext('wp:status',namespaces=ns); ident=item.findtext('wp:post_id',namespaces=ns)
 if status=='publish' and typ in ('page','post','tribe_events'):
  filename=existing.get(ident,('event-' if typ=='tribe_events' else 'post-')+ident+'.html')
  selected.append((item,typ,ident,filename))
paths={urlparse(item.findtext('link') or '').path: '/'+filename for item,_,_,filename in selected}
paths.update({'/clothing/':'/clothing.html','/footwear/':'/footwear.html','/apparel/':'/apparel.html','/accessories/':'/accessories.html','/cafe/':'/cafe.html','/restaurant/':'/restaurant.html','/fast-food/':'/fast-food.html','/chocolates-ice-cream-juice/':'/chocolates.html'})
allowed={'p','br','h1','h2','h3','h4','h5','h6','strong','b','i','em','u','sup','sub','a','img','figure','figcaption','ul','ol','li','blockquote','div','span','table','thead','tbody','tr','th','td','hr'}
void={'br','img','hr'}
class Clean(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.out=[];self.skip=0
 def handle_starttag(self,tag,attrs):
  tag=tag.lower()
  if tag in ('script','style','iframe','object','embed','form'): self.skip+=1;return
  if self.skip or tag not in allowed:return
  d=dict(attrs); keep=[]
  for k in ('href','src','alt','title'):
   v=d.get(k)
   if v is None: continue
   if k in ('href','src'):
    v=v.strip(); u=urlparse(v)
    if u.scheme and u.scheme.lower() not in ('http','https','mailto','tel'):continue
    if u.hostname and u.hostname.lower() in ('orionmallgorakhpur.com','www.orionmallgorakhpur.com'):
     if u.path.startswith('/wp-content/'):v='https://orionmallgorakhpur.com'+u.path
     elif u.path in paths:v=paths[u.path]+(('#'+u.fragment) if u.fragment else '')
   keep.append(f' {k}="{html.escape(v,quote=True)}"')
  if tag=='img':
   if not any(x.startswith(' src=') for x in keep):return
   if not any(x.startswith(' alt=') for x in keep):keep.append(' alt=""')
   keep.append(' loading="lazy"')
  if tag=='a' and d.get('target')=='_blank':keep.append(' target="_blank" rel="noopener noreferrer"')
  self.out.append('<'+tag+''.join(keep)+'>')
 def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs)
 def handle_endtag(self,tag):
  tag=tag.lower()
  if tag in ('script','style','iframe','object','embed','form'):
   self.skip=max(0,self.skip-1);return
  if not self.skip and tag in allowed and tag not in void:self.out.append('</'+tag+'>')
 def handle_data(self,data):
  if not self.skip:self.out.append(html.escape(data))

def cleaned(raw):
 p=Clean();p.feed(raw);return ''.join(p.out)

def basic(title):
 return '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'''+html.escape(title)+''' — Orion Mall</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="style.css?v=4"><link rel="stylesheet" href="footer.css?v=2"></head><body id="top"><a class="skip" href="#main">Skip to content</a><div class="announcement">YOUR EVERYDAY ESCAPE IN GORAKHPUR <span>✳</span> SHOP · DINE · UNWIND</div><header class="header"><a class="logo" href="/"><img class="mall-logo-image" src="https://orionmallgorakhpur.com/wp-content/uploads/2023/06/Orion-Logo.png" alt="Orion Mall Gorakhpur"></a><button class="menu-toggle" aria-expanded="false" aria-controls="nav" aria-label="Open navigation"><span></span><span></span></button><nav id="nav" aria-label="Main navigation"><a href="/shop.html">Shop</a><a href="/dine.html">Dine</a><a href="/entertain.html">Entertainment</a><a href="/movie.html">Movies</a><a href="/about.html">About</a></nav></header><main id="main"><section class="sub-content wrap"><div class="eyebrow"><span></span> ORION MALL</div><h1 class="export-title">'''+html.escape(title)+'''</h1></section></main><div id="orion-footer-root"></div><script src="footer.js?v=2" defer></script><script src="script.js?v=2"></script></body></html>'''

for item,typ,ident,filename in selected:
 title=item.findtext('title') or 'Orion Mall'; raw=item.findtext('content:encoded',default='',namespaces=ns)
 file=root/filename
 text=file.read_text() if file.exists() else basic(title)
 # Previous import can be replaced safely when the script is rerun.
 start=text.find('<!-- wordpress-export:start -->');end=text.find('<!-- wordpress-export:end -->')
 if start>=0 and end>=0:text=text[:start]+text[end+len('<!-- wordpress-export:end -->'):]
 content=cleaned(raw)
 if not content.strip():content='<p>This page depends on WordPress, Elementor or a plugin. Its interactive content is not available in this static preview.</p>'
 block='<!-- wordpress-export:start --><section class="export-content wrap" aria-label="Content from WordPress export"><div class="eyebrow"><span></span> FROM THE ORIGINAL SITE</div><h2>More from Orion</h2><div class="export-copy">'+content+'</div></section><!-- wordpress-export:end -->'
 text=text.replace('</main>',block+'</main>',1).replace('style.css?v=2','style.css?v=4').replace('style.css?v=3','style.css?v=4')
 file.write_text(text)
# An index for all exported event posts, including events not represented by the plugin shortcode.
events=[(item,filename) for item,typ,_,filename in selected if typ=='tribe_events']
f=root/'events.html'; text=f.read_text(); listing='<section class="export-content wrap"><div class="eyebrow"><span></span> FROM THE WORDPRESS EXPORT</div><h2>Events at Orion</h2><div class="sub-grid">'+''.join('<a class="sub-card" href="/'+html.escape(filename)+'"><h2>'+html.escape(item.findtext('title') or 'Event')+'</h2><b>↗</b></a>' for item,filename in events)+'</div></section>'
text=text.replace('</main>',listing+'</main>',1);f.write_text(text)
print(f'Prepared {len(selected)} published page/post/event previews ({len(events)} events).')

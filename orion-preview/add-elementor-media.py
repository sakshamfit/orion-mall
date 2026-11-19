#!/usr/bin/env python3
"""Expose images recorded in each page's Elementor data that are absent from exported rendered content."""
import sys,json,html,re,xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse
root=Path(__file__).resolve().parent
n={'w':'http://wordpress.org/export/1.2/'}
pages={'4387':'index','43':'about','414':'contact','4741':'dine','4800':'shop','4857':'entertain','4902':'movie','4904':'cafe','5096':'restaurant','5149':'fast-food','5163':'clothing','5212':'footwear','5224':'apparel','5233':'accessories','5392':'services','5911':'fun-zone','6190':'chocolates','6035':'offers','5571':'first-floors'}
added=0
for item in ET.parse(sys.argv[1]).findall('./channel/item'):
 ident=item.findtext('w:post_id',namespaces=n)
 if ident not in pages:continue
 metadata={x.findtext('w:meta_key',namespaces=n):x.findtext('w:meta_value',namespaces=n) for x in item.findall('w:postmeta',n)}
 try: data=json.loads(metadata.get('_elementor_data') or '[]')
 except (ValueError,TypeError):continue
 file=root/(pages[ident]+'.html')
 if not file.exists():continue
 text=file.read_text();start=text.find('<!-- elementor-media:start -->');end=text.find('<!-- elementor-media:end -->')
 if start>=0 and end>=0:text=text[:start]+text[end+len('<!-- elementor-media:end -->'):]
 found={}
 def visit(obj):
  if isinstance(obj,dict):
   v=obj.get('url')
   if isinstance(v,str):
    u=urlparse(v)
    if u.hostname in ('orionmallgorakhpur.com','www.orionmallgorakhpur.com') and u.path.startswith('/wp-content/uploads/') and re.search(r'\.(?:png|jpe?g|webp|gif|avif|svg)$',u.path,re.I):
     v='https://orionmallgorakhpur.com'+u.path
     found.setdefault(v,obj.get('alt') or '')
   for child in obj.values():visit(child)
  elif isinstance(obj,list):
   for child in obj:visit(child)
 visit(data)
 missing=[(u,a) for u,a in found.items() if u not in text]
 if missing:
  pics=''.join('<figure><img src="'+html.escape(u,quote=True)+'" alt="'+html.escape(a,quote=True)+'" loading="lazy"></figure>' for u,a in missing)
  section='<!-- elementor-media:start --><section class="more-media wrap"><div class="eyebrow"><span></span> MORE FROM ORION</div><h2>From this page</h2><div class="more-media-grid">'+pics+'</div></section><!-- elementor-media:end -->'
  text=text.replace('</main>',section+'</main>',1);added+=len(missing)
 file.write_text(text)
print('Added',added,'page-associated images from Elementor metadata.')

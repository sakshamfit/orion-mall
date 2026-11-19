import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import brands from "./data/brands.json";
import { ProductShelf } from "../components/ui/skincare-product-shelf";
type Brand = typeof brands[number];
const floors = ["Ground Floor", "First Floor", "Second Floor", "Third Floor", "Fourth Floor", "Fifth Floor"];

function FloorRow({ floor, items }: { floor: string; items: Brand[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [selected, setSelected] = useState<Brand | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const el = scroller.current;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    if (!el || hovered || keyboardFocus || selected) return;
    let id = 0, last = 0;
    const tick = (time: number) => {
      if (last) { const max = el.scrollWidth - el.clientWidth; if (max > 0) { el.scrollLeft += Math.min(time - last, 50) * .025; if (el.scrollLeft >= max - 1) el.scrollLeft = 0; } }
      last = time; id = requestAnimationFrame(tick);
    };
    const onChange = () => { cancelAnimationFrame(id); last = 0; if (!mq.matches) id = requestAnimationFrame(tick); };
    mq.addEventListener("change", onChange); onChange();
    return () => { cancelAnimationFrame(id); mq.removeEventListener("change", onChange); };
  }, [hovered, keyboardFocus, selected]);
  useEffect(() => { if (selected && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [selected]);
  return <div className="floor-row" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={e => { if (e.target.matches(":focus-visible")) setKeyboardFocus(true); }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKeyboardFocus(false); }}><div className="floor-row-heading"><div><span>EXPLORE THE DIRECTORY</span><h3>{floor}</h3></div><div className="floor-actions"><button onClick={() => { if (scroller.current) scroller.current.scrollBy({ left: -260, behavior: "smooth" }); }} aria-label={`Scroll ${floor} brands left`}>←</button><button onClick={() => { if (scroller.current) scroller.current.scrollBy({ left: 260, behavior: "smooth" }); }} aria-label={`Scroll ${floor} brands right`}>→</button></div></div>
    <ProductShelf scroller={scroller} label={`${floor} brands, scroll horizontally`}>
      {items.map((brand, i) => <button className="floor-brand" key={`${brand.name}-${i}`} onClick={e => { opener.current = e.currentTarget; setSelected(brand); }}>
        <span className="floor-brand-image">{brand.image ? <img src={brand.image} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} /> : null}<span>{brand.name}</span></span><span className="floor-brand-name">{brand.name} <b aria-hidden="true">↗</b></span>
      </button>)}
    </ProductShelf>
    <dialog ref={dialog} className="brand-dialog" aria-labelledby={`dialog-${floor.replace(/\s/g,'-')}`} onClose={() => { setSelected(null); opener.current?.focus(); }}>
      {selected && <><button className="brand-dialog-close" aria-label="Close brand details" onClick={() => dialog.current?.close()}>×</button>{selected.image && <img src={selected.image} alt="" />}<p className="brand-dialog-kicker">ORION MALL · DIRECTORY</p><h3 id={`dialog-${floor.replace(/\s/g,'-')}`}>{selected.name}</h3><p className="brand-dialog-floor">{selected.floor}</p><p>{selected.detail}</p><a href={selected.href}>View the full directory ↗</a></>}
    </dialog>
  </div>;
}
function BrandDirectory() {
  return <div className="floor-directory"><p className="floor-directory-intro">Find your favourites floor by floor. Select a brand for details, or scroll across each row.</p>{floors.map(floor => { const items = brands.filter(b => b.floor === floor); return items.length ? <FloorRow key={floor} floor={floor} items={items}/> : null; })}<p className="floor-note">Directory information is from the original site and may change. Please check with mall management for current locations.</p></div>;
}
const root = document.getElementById("brand-wheel-root");
if (root) createRoot(root).render(<BrandDirectory />);

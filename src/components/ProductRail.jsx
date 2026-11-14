import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

/** A horizontal row of product cards with scroll buttons. */
export default function ProductRail({ title, intro, link, linkLabel = 'See all', items, status }) {
  const track = useRef(null);
  const scroll = (dir) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (status === 'ready' && items.length === 0) return null;

  return (
    <section className="rail">
      <header className="rail__head">
        <div>
          <h2 className="h2">{title}</h2>
          {intro && <p className="muted">{intro}</p>}
        </div>
        <div className="rail__actions">
          {link && <Link className="btn btn--ghost btn--sm" to={link}>{linkLabel}</Link>}
          <button className="icon-btn icon-btn--line" onClick={() => scroll(-1)} aria-label="Scroll back"><ChevronLeft size={18} /></button>
          <button className="icon-btn icon-btn--line" onClick={() => scroll(1)} aria-label="Scroll forward"><ChevronRight size={18} /></button>
        </div>
      </header>
      <div className="rail__track" ref={track}>
        {status !== 'ready'
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="pcard pcard--skeleton shimmer" aria-hidden />)
          : items.map((p) => (
              <div className="rail__item" key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </section>
  );
}

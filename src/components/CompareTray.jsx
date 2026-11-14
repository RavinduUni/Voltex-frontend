import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GitCompare, X } from 'lucide-react';
import { useLists } from '../context/ListsContext';
import { COMPARE_LIMIT } from '../config';
import ProductImage from './ProductImage';
import { gsap, useGSAP, reducedMotion } from '../lib/motion';

/** Slides up from the bottom while products are selected for comparison. */
export default function CompareTray() {
  const { compare, removeFromCompare, clearCompare } = useLists();
  const { pathname } = useLocation();
  const ref = useRef(null);
  const visible = compare.length > 0 && pathname !== '/compare';

  useGSAP(
    () => {
      if (!visible || reducedMotion()) return;
      gsap.from(ref.current, { yPercent: 120, duration: 0.5, ease: 'power3.out' });
    },
    { dependencies: [visible] }
  );

  if (!visible) return null;
  const slots = Array.from({ length: COMPARE_LIMIT }, (_, i) => compare[i]);

  return (
    <aside className="tray" ref={ref} aria-label="Compare tray">
      <div className="tray__slots">
        {slots.map((p, i) =>
          p ? (
            <div className="tray__slot" key={p.id}>
              <ProductImage product={p} width={56} />
              <span className="tray__name">{p.name}</span>
              <button className="icon-btn icon-btn--sm" onClick={() => removeFromCompare(p.id)} aria-label={`Remove ${p.name} from compare`}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="tray__slot tray__slot--empty" key={`empty-${i}`}>Add a product</div>
          )
        )}
      </div>
      <div className="tray__actions">
        <button className="btn btn--ghost btn--sm" onClick={clearCompare}>Clear</button>
        <Link to="/compare" className={`btn btn--primary ${compare.length < 2 ? 'is-soft' : ''}`}>
          <GitCompare size={16} /> Compare {compare.length}
        </Link>
      </div>
    </aside>
  );
}

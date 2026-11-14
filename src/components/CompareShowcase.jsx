import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { GitCompare } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { clip, parseSpecs, specLabel } from '../utils/specs';
import { gsap, useGSAP, reducedMotion } from '../lib/motion';
import ProductImage from './ProductImage';
import Price from './Price';

/** Builds aligned rows: one per spec label, with each product's value. */
export function compareRows(products) {
  const order = [];
  const byProduct = products.map((p) => {
    const map = new Map();
    for (const s of parseSpecs(p.description).specs) {
      const label = specLabel(s);
      if (!order.includes(label)) order.push(label);
      map.set(label, map.has(label) ? `${map.get(label)}; ${s.value}` : s.value);
    }
    return map;
  });
  return order.map((label) => ({ label, values: byProduct.map((m) => m.get(label) || null) }));
}

/** Labels a product's specs share with another's (ignoring the generic "Feature"). */
function overlap(a, b) {
  const la = new Set(parseSpecs(a.description).specs.map(specLabel).filter((l) => l !== 'Feature'));
  return parseSpecs(b.description).specs.map(specLabel).filter((l) => l !== 'Feature' && la.has(l)).length;
}

/** The two same-category products whose specs line up best, so the preview is meaningful. */
function bestPair(items) {
  let best = null;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (!items[i].category || items[i].category !== items[j].category) continue;
      const score = overlap(items[i], items[j]);
      if (!best || score > best.score) best = { score, pair: [items[i], items[j]] };
    }
  }
  return best && best.score >= 2 ? best.pair : [];
}

/** Home page preview: two comparable products, read row by row as you scroll. */
export default function CompareShowcase() {
  const { items, status } = useProducts({ sort: 'featured', size: 40 });
  const root = useRef(null);
  const pair = status === 'ready' ? bestPair(items) : [];
  const category = pair[0]?.category;
  const rows = compareRows(pair).filter((r) => r.values.every(Boolean)).concat(compareRows(pair).filter((r) => !r.values.every(Boolean))).slice(0, 6);

  useGSAP(
    () => {
      if (pair.length < 2 || reducedMotion()) return;
      const rowsEls = gsap.utils.toArray('.cs__row', root.current);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '.cs__table', start: 'top 75%', end: 'bottom 45%', scrub: 0.6 },
      });
      tl.fromTo('.cs__scanner', { top: 0 }, { top: '100%', ease: 'none', duration: rowsEls.length }, 0);
      rowsEls.forEach((row, i) => {
        tl.fromTo(row, { opacity: 0.25 }, { opacity: 1, duration: 0.4 }, i * 0.9);
      });
    },
    { scope: root, dependencies: [pair.map((p) => p.id).join()] }
  );

  if (!category || status !== 'ready' || pair.length < 2 || rows.length < 2) return null;

  return (
    <section className="cs" ref={root} aria-labelledby="cs-title">
      <div className="cs__copy">
        <h2 className="h2" id="cs-title">Compare before you buy</h2>
        <p>
          Pick up to three products and see their specs line up row by row: processor next to processor, display next
          to display. Here are two {category.toLowerCase()} to start.
        </p>
        <Link to="/compare" className="btn btn--primary"><GitCompare size={16} /> Open compare</Link>
      </div>
      <div className="cs__table">
        <span className="cs__scanner" aria-hidden />
        <div className="cs__head">
          <span />
          {pair.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`} className="cs__prod">
              <ProductImage product={p} width={96} />
              <strong>{p.name}</strong>
              <Price value={p.price} size="sm" />
            </Link>
          ))}
        </div>
        {rows.map((r) => (
          <div className="cs__row" key={r.label}>
            <span className="cs__label">{r.label}</span>
            {r.values.map((v, i) => (
              <span key={i} className={v ? 'cs__val' : 'cs__val is-empty'}>{v ? clip(v, 56) : 'Not listed'}</span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

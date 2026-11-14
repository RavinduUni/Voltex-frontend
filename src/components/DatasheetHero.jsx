import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { clip, parseSpecs, specLabel } from '../utils/specs';
import { gsap, SplitText, useGSAP, reducedMotion } from '../lib/motion';
import ProductImage from './ProductImage';
import Price from './Price';

const CYCLE_MS = 6500;
const SCRAMBLE_CHARS = '0123456789<>/#=+';

/**
 * The hero's datasheet: one featured product at a time, its specs read out line by
 * line. Cycles automatically (paused on hover/focus and for reduced motion).
 */
export default function DatasheetHero() {
  const { items, status } = useProducts({ sort: 'featured', size: 24 });
  // Lead with the products that have the richest spec sheets (most identifiable specs).
  const richness = (p) => parseSpecs(p.description).specs.filter((s) => specLabel(s) !== 'Feature').length;
  const picks = items
    .filter((p) => p.stockQuantity > 0 && richness(p) >= 3)
    .sort((a, b) => richness(b) - richness(a))
    .slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const root = useRef(null);

  const current = picks[index % Math.max(picks.length, 1)];
  const specs = current ? parseSpecs(current.description).specs.slice(0, 5) : [];

  // Advance automatically unless paused or the visitor prefers less motion.
  useEffect(() => {
    if (picks.length < 2 || paused || reducedMotion()) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % picks.length), CYCLE_MS);
    return () => clearTimeout(t);
  }, [index, paused, picks.length]);

  useGSAP(
    () => {
      if (!current || reducedMotion()) return;
      const tl = gsap.timeline();
      tl.fromTo('.ds__scan', { yPercent: -100, opacity: 1 }, { yPercent: 2200, duration: 1.1, ease: 'power1.inOut' }, 0)
        .to('.ds__scan', { opacity: 0, duration: 0.2 }, 0.95)
        .fromTo('.ds__media img, .ds__media .plinth__fallback', { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9 }, 0.05);

      const split = new SplitText('.ds__name', { type: 'chars,words' });
      tl.from(split.chars, { yPercent: 110, opacity: 0, stagger: 0.012, duration: 0.5 }, 0.1);

      gsap.utils.toArray('.ds__val', root.current).forEach((el, i) => {
        tl.fromTo(
          el,
          { opacity: 0.35 },
          { opacity: 1, duration: 0.7, scrambleText: { text: el.dataset.text, chars: SCRAMBLE_CHARS, speed: 0.7 } },
          0.35 + i * 0.12
        );
      });
      tl.from('.ds__row', { borderColor: 'transparent', stagger: 0.12, duration: 0.4 }, 0.35);
      tl.from('.ds__foot', { y: 12, opacity: 0, duration: 0.5 }, 0.6);
      tl.fromTo('.ds__progress span', { scaleX: 0 }, { scaleX: 1, duration: CYCLE_MS / 1000, ease: 'none' }, 0);
    },
    { scope: root, dependencies: [current?.id], revertOnUpdate: true }
  );

  if (status === 'loading') return <div className="ds ds--loading shimmer" aria-hidden />;
  if (!current) return null;

  return (
    <div
      className="ds"
      ref={root}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured products"
    >
      <div className="ds__bar">
        <span className="ds__model">{current.category}</span>
        <span className="ds__count" aria-live="polite">
          {index % picks.length + 1} of {picks.length}
        </span>
      </div>

      <div className="ds__body">
        <Link to={`/product/${current.id}`} className="ds__media" tabIndex={-1} aria-hidden>
          <ProductImage product={current} width={420} eager />
          <span className="ds__scan" aria-hidden />
        </Link>

        <div className="ds__sheet">
          <h2 className="ds__name">
            <Link to={`/product/${current.id}`}>{current.name}</Link>
          </h2>
          <dl className="ds__specs">
            {specs.map((s, i) => (
              <div className="ds__row" key={`${current.id}-${i}`}>
                <dt>{specLabel(s)}</dt>
                <dd className="ds__val" data-text={clip(s.value)}>{clip(s.value)}</dd>
              </div>
            ))}
          </dl>
          <div className="ds__foot">
            <Price value={current.price} size="lg" />
            <Link to={`/product/${current.id}`} className="btn btn--primary">View details</Link>
          </div>
        </div>
      </div>

      <div className="ds__nav">
        <div className="ds__progress" aria-hidden><span /></div>
        <div className="ds__dots" role="group" aria-label="Choose featured product">
          {picks.map((p, i) => (
            <button
              key={p.id}
              className={i === index % picks.length ? 'is-on' : ''}
              aria-label={`Show ${p.name}`}
              aria-current={i === index % picks.length}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

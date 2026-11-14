import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useProducts } from '../hooks/useProducts';
import { categoryIcon, shopLink } from '../utils/categories';
import { gsap, SplitText, useGSAP, reducedMotion } from '../lib/motion';
import { FAQ } from '../content';
import DatasheetHero from '../components/DatasheetHero';
import CategoryIndex from '../components/CategoryIndex';
import ProductRail from '../components/ProductRail';
import CompareShowcase from '../components/CompareShowcase';
import { openPalette } from '../components/Navbar';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function Spotlight({ category }) {
  const { items, status } = useProducts({ category, size: 10 });
  return (
    <ProductRail
      title={category}
      link={shopLink({ category })}
      linkLabel={`All ${category.toLowerCase()}`}
      items={items}
      status={status}
    />
  );
}

const STEPS = [
  { title: 'Add to cart', text: 'Pick a product, choose how many, and add it. Your cart is saved to your account.' },
  { title: 'Check your address', text: 'Checkout shows the delivery address on your profile. Change it there if you need to.' },
  { title: 'Get your receipt', text: 'Place the order and a receipt with your order number appears straight away.' },
];

export default function HomePage() {
  const { user } = useAuth();
  const { categories } = useCatalog();
  const newest = useProducts({ sort: 'newest', size: 10 });
  const heroRef = useRef(null);

  // The page-load moment: the headline rises in line by line.
  useGSAP(
    () => {
      if (reducedMotion()) return;
      const split = new SplitText('.hero__title', { type: 'lines', mask: 'lines' });
      gsap
        .timeline()
        .from(split.lines, { yPercent: 105, duration: 0.8, stagger: 0.08, ease: 'power4.out' })
        .from('.hero__lede, .hero__cta, .hero__quick', { y: 14, opacity: 0, stagger: 0.08, duration: 0.5 }, 0.35);
    },
    { scope: heroRef }
  );

  const faqs = FAQ.flatMap((g) => g.items).slice(0, 3);

  return (
    <div className="home">
      <section className="hero" ref={heroRef}>
        <div className="hero__copy">
          <p className="hero__hello">Hello, {user?.firstName || 'there'}</p>
          <h1 className="hero__title">Tech, chosen by the spec sheet.</h1>
          <p className="hero__lede">
            Laptops, phones, audio and more. Every product shows its key specs up front, and you can compare up to
            three side by side.
          </p>
          <div className="hero__cta">
            <Link to="/shop" className="btn btn--primary btn--lg">Browse the shop</Link>
            <button className="btn btn--ghost btn--lg" onClick={openPalette}>
              <Search size={17} /> Search <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
            </button>
          </div>
          {categories.length > 0 && (
            <ul className="hero__quick" aria-label="Popular categories">
              {categories.slice(0, 5).map((c) => {
                const Icon = categoryIcon(c.name);
                return (
                  <li key={c.name}>
                    <Link to={shopLink({ category: c.name })}><Icon size={16} /> {c.name}</Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <DatasheetHero />
      </section>

      <CategoryIndex />

      <ProductRail
        title="New arrivals"
        intro="The latest additions to the shop."
        link="/shop?sort=newest"
        items={newest.items}
        status={newest.status}
      />

      <CompareShowcase />

      {categories.slice(0, 2).map((c) => (
        <Spotlight key={c.name} category={c.name} />
      ))}

      <section className="steps" aria-labelledby="steps-title">
        <h2 className="h2" id="steps-title">How ordering works</h2>
        <ol className="steps__list">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="steps__n" aria-hidden>{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="helpteaser" aria-labelledby="help-title">
        <div>
          <h2 className="h2" id="help-title">Questions before you order?</h2>
          <p className="muted">Answers to what people ask most. The full list is on the help page.</p>
          <Link to="/help" className="btn btn--ghost">Read the FAQ</Link>
        </div>
        <div className="faq faq--compact">
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

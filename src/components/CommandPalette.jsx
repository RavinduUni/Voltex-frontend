import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, FileText, Loader2, Search } from 'lucide-react';
import { productApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { categoryIcon, shopLink } from '../utils/categories';
import ProductImage from './ProductImage';
import Price from './Price';
import { gsap, reducedMotion } from '../lib/motion';

const PAGES = [
  { label: 'Shop all products', to: '/shop' },
  { label: 'New arrivals', to: '/shop?sort=newest' },
  { label: 'Compare products', to: '/compare' },
  { label: 'Wishlist', to: '/wishlist' },
  { label: 'Cart', to: '/cart' },
  { label: 'Your orders', to: '/orders' },
  { label: 'Profile and address', to: '/profile' },
  { label: 'Help and FAQ', to: '/help' },
];

/**
 * Search everything from the keyboard. Opens with Ctrl+K / ⌘K or "/", or from the
 * search button (which dispatches the "voltix:palette" event).
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState({ items: [], status: 'idle' });
  const [active, setActive] = useState(0);
  const { isAdmin } = useAuth();
  const { categories } = useCatalog();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      const typing = /input|textarea|select/i.test(document.activeElement?.tagName || '');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('voltix:palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('voltix:palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => inputRef.current?.focus());
    if (!reducedMotion() && panelRef.current) {
      gsap.fromTo(panelRef.current, { y: -12, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.25 });
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Live product search, debounced.
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) return setProducts({ items: [], status: 'idle' });
    setProducts((p) => ({ ...p, status: 'loading' }));
    const t = setTimeout(() => {
      productApi
        .catalog({ q, size: 6 })
        .then((page) => setProducts({ items: page.content || [], status: 'ready' }))
        .catch(() => setProducts({ items: [], status: 'error' }));
    }, 220);
    return () => clearTimeout(t);
  }, [query, open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = [...PAGES, ...(isAdmin ? [{ label: 'Manage store', to: '/admin' }] : [])]
      .filter((p) => !q || p.label.toLowerCase().includes(q))
      .map((p) => ({ type: 'page', key: `page-${p.to}`, ...p }));
    const cats = categories
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .slice(0, q ? 4 : 6)
      .map((c) => ({ type: 'category', key: `cat-${c.name}`, label: c.name, count: c.count, to: shopLink({ category: c.name }) }));
    const prods = products.items.map((p) => ({ type: 'product', key: `p-${p.id}`, label: p.name, product: p, to: `/product/${p.id}` }));
    const all = [...prods, ...cats, ...(q ? pages : pages.slice(0, 5))];
    if (q.length >= 2) all.push({ type: 'search', key: 'search', label: `Search the shop for “${query.trim()}”`, to: shopLink({ q: query.trim() }) });
    return all;
  }, [query, products.items, categories, isAdmin]);

  useEffect(() => setActive(0), [results.length]);

  const go = useCallback(
    (item) => {
      setOpen(false);
      navigate(item.to);
    },
    [navigate]
  );

  const onKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  useEffect(() => {
    document.getElementById(`cmd-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const groups = [
    ['product', 'Products'],
    ['category', 'Categories'],
    ['page', 'Pages'],
    ['search', null],
  ];

  return (
    <div className="cmd" role="dialog" aria-modal="true" aria-label="Search">
      <div className="cmd__scrim" onClick={() => setOpen(false)} />
      <div className="cmd__panel" ref={panelRef} onKeyDown={onKeyDown}>
        <div className="cmd__input">
          <Search size={18} aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories and pages"
            aria-label="Search"
            aria-controls="cmd-list"
            aria-activedescendant={results[active] ? `cmd-${active}` : undefined}
            role="combobox"
            aria-expanded="true"
          />
          {products.status === 'loading' ? <Loader2 size={16} className="spin" /> : <kbd>Esc</kbd>}
        </div>
        <ul className="cmd__list" id="cmd-list" role="listbox">
          {results.length === 0 && <li className="cmd__empty">No matches. Try a product name or a spec like “RTX”.</li>}
          {groups.map(([type, title]) => {
            const items = results.map((r, i) => ({ r, i })).filter(({ r }) => r.type === type);
            if (!items.length) return null;
            return (
              <li key={type} role="presentation">
                {title && <div className="cmd__group">{title}</div>}
                <ul role="presentation">
                  {items.map(({ r, i }) => {
                    const Icon = r.type === 'category' ? categoryIcon(r.label) : r.type === 'search' ? Search : FileText;
                    return (
                      <li
                        key={r.key}
                        id={`cmd-${i}`}
                        role="option"
                        aria-selected={i === active}
                        className={`cmd__item ${i === active ? 'is-active' : ''}`}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(r)}
                      >
                        {r.type === 'product' ? (
                          <ProductImage product={r.product} width={44} />
                        ) : (
                          <span className="cmd__icon"><Icon size={16} /></span>
                        )}
                        <span className="cmd__label">{r.label}</span>
                        {r.type === 'product' && <Price value={r.product.price} size="sm" />}
                        {r.type === 'category' && <span className="muted">{r.count}</span>}
                        {i === active && <CornerDownLeft size={14} className="cmd__enter" aria-hidden />}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, Loader2, PackageOpen, RotateCw, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useCatalogPages } from '../hooks/useCatalogPages';
import { categoryIcon } from '../utils/categories';
import ProductCard from '../components/ProductCard';
import Sheet from '../components/Sheet';
import { EmptyState } from '../components/States';

/** Keys match the backend's sort values (GET /products/catalog?sort=...). */
export const SORTS = {
  featured: 'Featured',
  newest: 'Newest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  name: 'Name A–Z',
};
const PAGE_SIZE = 24;
const VIEW_KEY = 'voltix.view';

function Filters({ category, sort, onCategory, onSort }) {
  const { categories } = useCatalog();
  const total = categories.reduce((n, c) => n + c.count, 0);
  return (
    <div className="filters">
      <fieldset>
        <legend>Category</legend>
        <button className={`filter ${!category ? 'is-on' : ''}`} onClick={() => onCategory('')} aria-pressed={!category}>
          <span>All products</span>
          <span className="filter__n">{total}</span>
        </button>
        {categories.map((c) => {
          const Icon = categoryIcon(c.name);
          return (
            <button
              key={c.name}
              className={`filter ${category === c.name ? 'is-on' : ''}`}
              onClick={() => onCategory(category === c.name ? '' : c.name)}
              aria-pressed={category === c.name}
            >
              <Icon size={16} strokeWidth={1.7} />
              <span>{c.name}</span>
              <span className="filter__n">{c.count}</span>
            </button>
          );
        })}
      </fieldset>
      <fieldset>
        <legend>Sort by</legend>
        {Object.entries(SORTS).map(([k, label]) => (
          <label key={k} className="radio">
            <input type="radio" name="sort" checked={sort === k} onChange={() => onSort(k)} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q')?.trim() || '';
  const category = params.get('category') || '';
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'featured';
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const list = useCatalogPages({ category, q, sort, size: PAGE_SIZE });
  const sentinel = useRef(null);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    value && value !== 'featured' ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const changeView = (v) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  };

  // Load the next page when the bottom of the list comes into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || list.last || list.status !== 'ready') return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && list.loadMore(), { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [list.last, list.status, list.loadMore, list.items.length]);

  const title = q ? `Results for “${q}”` : category || (sort === 'newest' ? 'New arrivals' : 'All products');
  const ready = list.status === 'ready' || list.status === 'more';

  return (
    <div className="page shop">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>/</span>
        {category || q ? <Link to="/shop">Shop</Link> : <span aria-current="page">Shop</span>}
        {(category || q) && (
          <>
            <span aria-hidden>/</span>
            <span aria-current="page">{q ? 'Search' : category}</span>
          </>
        )}
      </nav>

      <header className="shop__head">
        <div>
          <h1 className="h1">{title}</h1>
          <p className="muted" aria-live="polite">
            {ready ? `${list.total} ${list.total === 1 ? 'product' : 'products'}` : 'Loading products'}
          </p>
        </div>
        <div className="shop__tools">
          <button className="btn btn--ghost btn--sm shop__filterbtn" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={15} /> Filters
          </button>
          <label className="select">
            <span className="sr-only">Sort by</span>
            <select value={sort} onChange={(e) => setParam('sort', e.target.value)}>
              {Object.entries(SORTS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>
          <div className="seg seg--icons" role="group" aria-label="Layout">
            <button aria-pressed={view === 'grid'} onClick={() => changeView('grid')} aria-label="Grid view"><LayoutGrid size={16} /></button>
            <button aria-pressed={view === 'row'} onClick={() => changeView('row')} aria-label="List view"><List size={16} /></button>
          </div>
        </div>
      </header>

      {(category || q) && (
        <div className="activefilters">
          {category && (
            <button className="chip is-on" onClick={() => setParam('category', '')} aria-label={`Remove filter ${category}`}>
              {category} <X size={14} aria-hidden />
            </button>
          )}
          {q && (
            <button className="chip is-on" onClick={() => setParam('q', '')} aria-label="Clear search">
              “{q}” <X size={14} aria-hidden />
            </button>
          )}
        </div>
      )}

      <div className="shop__layout">
        <aside className="shop__side" aria-label="Filters">
          <Filters category={category} sort={sort} onCategory={(c) => setParam('category', c)} onSort={(s) => setParam('sort', s)} />
        </aside>

        <div className="shop__results">
          {list.status === 'loading' && (
            <div className={`grid grid--${view}`} aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="pcard pcard--skeleton shimmer" />)}
            </div>
          )}

          {list.status === 'error' && (
            <EmptyState icon={RotateCw} title="Products didn’t load" action={<button className="btn btn--primary" onClick={list.reload}>Try again</button>}>
              {list.error}
            </EmptyState>
          )}

          {ready && list.items.length === 0 && (
            q ? (
              <EmptyState icon={SearchX} title={`Nothing matches “${q}”${category ? ` in ${category}` : ''}`}
                action={<Link className="btn btn--ghost" to="/shop">Clear search</Link>}>
                Try a model name, a brand, or a spec like “RTX 4060” or “OLED”.
              </EmptyState>
            ) : (
              <EmptyState icon={PackageOpen} title={category ? `No ${category.toLowerCase()} right now` : 'No products yet'}>
                {category ? 'Pick another category to keep browsing.' : 'Products added by the store will appear here.'}
              </EmptyState>
            )
          )}

          {ready && list.items.length > 0 && (
            <>
              <div className={`grid grid--${view}`}>
                {list.items.map((p, i) => (
                  <ProductCard key={p.id} product={p} layout={view} eager={i < 4} />
                ))}
              </div>
              <div className="more" ref={sentinel}>
                <p className="muted">Showing {list.items.length} of {list.total}</p>
                {list.error && <p className="field__msg">{list.error}</p>}
                {!list.last && (
                  <button className="btn btn--ghost" onClick={list.loadMore} disabled={list.status === 'more'}>
                    {list.status === 'more' && <Loader2 size={16} className="spin" />}
                    {list.status === 'more' ? 'Loading' : 'Show more'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" side="left" width={340} labelledBy="filters-title">
        <Filters
          category={category}
          sort={sort}
          onCategory={(c) => { setParam('category', c); setFiltersOpen(false); }}
          onSort={(s) => { setParam('sort', s); setFiltersOpen(false); }}
        />
      </Sheet>
    </div>
  );
}

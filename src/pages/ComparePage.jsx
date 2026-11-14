import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitCompare, ShoppingBag, X } from 'lucide-react';
import { useLists } from '../context/ListsContext';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { productApi } from '../api/endpoints';
import { COMPARE_LIMIT } from '../config';
import { compareRows } from '../components/CompareShowcase';
import ProductImage from '../components/ProductImage';
import Price from '../components/Price';
import { stockNote } from '../components/ProductCard';
import { EmptyState } from '../components/States';

/** Loads the latest details for each selected product (prices and stock may have changed). */
function useFresh(list) {
  const { version } = useCatalog();
  const ids = list.map((p) => p.id).join(',');
  const [fresh, setFresh] = useState({});
  useEffect(() => {
    let alive = true;
    Promise.allSettled(list.map((p) => productApi.get(p.id))).then((results) => {
      if (!alive) return;
      const next = {};
      results.forEach((r, i) => {
        next[list[i].id] = r.status === 'fulfilled' ? r.value : { ...list[i], missing: r.reason?.response?.status === 404 };
      });
      setFresh(next);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, version]);
  return list.map((p) => fresh[p.id] || p);
}

export default function ComparePage() {
  const { compare, removeFromCompare, clearCompare } = useLists();
  const { add, lineFor, pending } = useCart();
  const products = useFresh(compare);
  const rows = compareRows(products.filter((p) => !p.missing));

  if (compare.length === 0) {
    return (
      <div className="page">
        <h1 className="h1">Compare</h1>
        <EmptyState icon={GitCompare} title="Nothing to compare yet" action={<Link to="/shop" className="btn btn--primary">Browse the shop</Link>}>
          Select Compare on up to {COMPARE_LIMIT} products and they will line up here, spec by spec.
        </EmptyState>
      </div>
    );
  }

  const cols = { '--cols': products.length };

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1 className="h1">Compare</h1>
          <p className="muted">
            {products.length < 2
              ? `Add ${COMPARE_LIMIT - products.length} more to see them side by side.`
              : 'Specs are lined up by type. “Not listed” means the seller didn’t include it.'}
          </p>
        </div>
        <div className="page__actions">
          {products.length < COMPARE_LIMIT && <Link to="/shop" className="btn btn--ghost btn--sm">Add products</Link>}
          <button className="btn btn--ghost btn--sm" onClick={clearCompare}>Clear all</button>
        </div>
      </header>

      <div className="cmp-wrap">
        <div className="cmp" style={cols} role="table" aria-label="Product comparison">
          <div className="cmp__row cmp__row--head" role="row">
            <span className="cmp__label" role="rowheader" />
            {products.map((p) => (
              <div className="cmp__cell cmp__prod" role="cell" key={p.id}>
                <button className="icon-btn icon-btn--sm cmp__remove" onClick={() => removeFromCompare(p.id)} aria-label={`Remove ${p.name}`}>
                  <X size={14} />
                </button>
                <Link to={`/product/${p.id}`}>
                  <ProductImage product={p} width={220} />
                  <strong>{p.name}</strong>
                </Link>
                {p.missing && <span className="badge badge--out">No longer sold</span>}
              </div>
            ))}
          </div>

          <div className="cmp__row" role="row">
            <span className="cmp__label" role="rowheader">Price</span>
            {products.map((p) => <span className="cmp__cell" role="cell" key={p.id}><Price value={p.price} /></span>)}
          </div>
          <div className="cmp__row" role="row">
            <span className="cmp__label" role="rowheader">Category</span>
            {products.map((p) => <span className="cmp__cell" role="cell" key={p.id}>{p.category || '—'}</span>)}
          </div>
          <div className="cmp__row" role="row">
            <span className="cmp__label" role="rowheader">Availability</span>
            {products.map((p) => {
              const n = stockNote(p.stockQuantity);
              return (
                <span className="cmp__cell" role="cell" key={p.id}>
                  <span className={`badge badge--${n ? n.tone : 'ok'}`}>{n ? n.text : 'In stock'}</span>
                </span>
              );
            })}
          </div>

          {rows.map((r) => (
            <div className="cmp__row" role="row" key={r.label}>
              <span className="cmp__label" role="rowheader">{r.label}</span>
              {r.values.map((v, i) => (
                <span key={i} className={`cmp__cell ${v ? '' : 'is-empty'}`} role="cell">{v || 'Not listed'}</span>
              ))}
            </div>
          ))}

          <div className="cmp__row cmp__row--foot" role="row">
            <span className="cmp__label" role="rowheader" />
            {products.map((p) => {
              const soldOut = (p.stockQuantity ?? 0) <= 0 || p.missing;
              const inCart = lineFor(p.id)?.quantity || 0;
              return (
                <span className="cmp__cell" role="cell" key={p.id}>
                  <button className="btn btn--primary btn--sm" disabled={soldOut || pending[p.id]} onClick={() => add(p, 1)}>
                    <ShoppingBag size={15} /> {soldOut ? 'Sold out' : inCart ? `Add another (${inCart})` : 'Add to cart'}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

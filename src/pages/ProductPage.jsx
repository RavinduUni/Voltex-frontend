import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GitCompare, Heart, Loader2, PackageX, RotateCw, ShoppingBag } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useLists } from '../context/ListsContext';
import { productApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { useProducts } from '../hooks/useProducts';
import { parseSpecs, shortSpec, specLabel } from '../utils/specs';
import { shopLink } from '../utils/categories';
import { flyToCart } from '../lib/motion';
import { DELIVERY_NOTES } from '../content';
import ProductImage from '../components/ProductImage';
import Price from '../components/Price';
import QuantityStepper from '../components/QuantityStepper';
import ProductRail from '../components/ProductRail';
import { stockNote } from '../components/ProductCard';
import { EmptyState, Spinner } from '../components/States';

/** Hover to zoom: the image scales toward the pointer. */
function ZoomImage({ product, mediaRef }) {
  const [zoom, setZoom] = useState(false);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <div
      className={`zoom ${zoom ? 'is-zoomed' : ''}`}
      ref={mediaRef}
      onMouseEnter={() => setZoom(true)}
      onMouseLeave={() => setZoom(false)}
      onMouseMove={onMove}
    >
      <ProductImage product={product} width={760} eager className="plinth--xl" />
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { version } = useCatalog();
  const { add, lineFor, pending, openDrawer } = useCart();
  const { inWishlist, inCompare, toggleWishlist, toggleCompare } = useLists();
  const [qty, setQty] = useState(1);
  const [state, setState] = useState({ status: 'loading', product: null, error: '' });
  const mediaRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, status: String(s.product?.id) === String(id) ? 'ready' : 'loading' }));
    productApi
      .get(id)
      .then((product) => alive && setState({ status: 'ready', product, error: '' }))
      .catch((e) => {
        if (!alive) return;
        const missing = e.response?.status === 404 || e.response?.status === 400;
        setState({ status: missing ? 'missing' : 'error', product: null, error: errorMessage(e) });
      });
    return () => {
      alive = false;
    };
  }, [id, version]);

  useEffect(() => setQty(1), [id]);

  const product = state.product;
  const related = useProducts({ category: product?.category, size: 9, enabled: Boolean(product?.category) });

  if (state.status === 'loading') return <div className="page-center"><Spinner label="Loading product" /></div>;

  if (state.status === 'error') {
    return (
      <div className="page">
        <EmptyState icon={RotateCw} title="This product didn’t load" action={<Link className="btn btn--primary" to="/shop">Back to the shop</Link>}>
          {state.error}
        </EmptyState>
      </div>
    );
  }

  if (state.status === 'missing' || !product) {
    return (
      <div className="page">
        <EmptyState icon={PackageX} title="We couldn’t find that product" action={<Link className="btn btn--primary" to="/shop">Back to the shop</Link>}>
          It may have been removed, or the link is incomplete.
        </EmptyState>
      </div>
    );
  }

  const { intro, specs } = parseSpecs(product.description);
  const unavailable = product.active === false;
  const stock = product.stockQuantity ?? 0;
  const inCart = lineFor(product.id)?.quantity || 0;
  const room = Math.max(0, stock - inCart);
  const note = stockNote(stock);
  const busy = Boolean(pending[product.id]);
  const saved = inWishlist(product.id);
  const comparing = inCompare(product.id);
  const relatedItems = related.items.filter((p) => p.id !== product.id).slice(0, 8);

  const onAdd = async () => {
    const ok = await add(product, qty);
    if (ok) {
      flyToCart(mediaRef.current);
      setQty(1);
    }
  };

  return (
    <div className="page pdp-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>/</span>
        <Link to="/shop">Shop</Link>
        {product.category && (
          <>
            <span aria-hidden>/</span>
            <Link to={shopLink({ category: product.category })}>{product.category}</Link>
          </>
        )}
      </nav>

      <div className="pdp">
        <div className="pdp__media">
          <ZoomImage product={product} mediaRef={mediaRef} />
        </div>

        <div className="pdp__info">
          <h1 className="pdp__name">{product.name}</h1>
          {intro && <p className="pdp__intro">{intro}</p>}

          {specs.length > 0 && (
            <ul className="chips-spec chips-spec--lg" aria-label="Key specs">
              {specs.slice(0, 4).map((s, i) => (
                <li key={i}>{shortSpec(s.value, 30)}</li>
              ))}
            </ul>
          )}

          <div className="pdp__buybox">
            <Price value={product.price} size="xl" />
            <div className="pdp__stock">
              {unavailable ? (
                <span className="badge badge--out">No longer sold</span>
              ) : note ? (
                <span className={`badge badge--${note.tone}`}>{note.text}</span>
              ) : (
                <span className="badge badge--ok">In stock</span>
              )}
              {inCart > 0 && (
                <button className="linkish" onClick={openDrawer}>{inCart} in your cart</button>
              )}
            </div>

            {!unavailable && stock > 0 && (
              room > 0 ? (
                <div className="pdp__buy">
                  <QuantityStepper value={qty} min={1} max={room} onChange={setQty} />
                  <button className="btn btn--primary btn--lg pdp__add" onClick={onAdd} disabled={busy}>
                    {busy ? <Loader2 size={18} className="spin" /> : <ShoppingBag size={18} />}
                    Add to cart
                  </button>
                </div>
              ) : (
                <p className="muted">You have all {stock} available in your cart.</p>
              )
            )}

            <div className="pdp__secondary">
              <button className={`btn btn--ghost ${saved ? 'is-on' : ''}`} onClick={() => toggleWishlist(product)} aria-pressed={saved}>
                <Heart size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save to wishlist'}
              </button>
              <button className={`btn btn--ghost ${comparing ? 'is-on' : ''}`} onClick={() => toggleCompare(product)} aria-pressed={comparing}>
                <GitCompare size={16} /> {comparing ? 'In compare' : 'Compare'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pdp__details">
        <section aria-labelledby="specs-title">
          <h2 className="h2" id="specs-title">Specifications</h2>
          {specs.length > 0 ? (
            <dl className="spectable">
              {specs.map((s, i) => (
                <div key={i}>
                  <dt>{specLabel(s)}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted">The seller hasn’t listed specifications for this product yet.</p>
          )}
        </section>
        <aside className="pdp__notes" id="delivery" aria-label="Delivery and returns">
          {DELIVERY_NOTES.map((n) => (
            <div key={n.title}>
              <h3>{n.title}</h3>
              <p>{n.text}</p>
            </div>
          ))}
        </aside>
      </div>

      {relatedItems.length > 0 && (
        <ProductRail
          title={`More in ${product.category}`}
          link={shopLink({ category: product.category })}
          items={relatedItems}
          status={related.status}
        />
      )}
    </div>
  );
}

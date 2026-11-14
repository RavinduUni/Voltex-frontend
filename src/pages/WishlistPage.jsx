import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, X } from 'lucide-react';
import { useLists } from '../context/ListsContext';
import { useCatalog } from '../context/CatalogContext';
import { productApi } from '../api/endpoints';
import ProductCard from '../components/ProductCard';
import ProductImage from '../components/ProductImage';
import { EmptyState } from '../components/States';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useLists();
  const { version } = useCatalog();
  const ids = wishlist.map((p) => p.id).join(',');
  const [fresh, setFresh] = useState({});

  useEffect(() => {
    let alive = true;
    Promise.allSettled(wishlist.map((p) => productApi.get(p.id))).then((results) => {
      if (!alive) return;
      const next = {};
      results.forEach((r, i) => {
        next[wishlist[i].id] = r.status === 'fulfilled' ? r.value : { ...wishlist[i], missing: r.reason?.response?.status === 404 };
      });
      setFresh(next);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, version]);

  const items = wishlist.map((p) => fresh[p.id] || p);
  const available = items.filter((p) => !p.missing);
  const gone = items.filter((p) => p.missing);

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1 className="h1">Wishlist</h1>
          <p className="muted">Saved in this browser. {wishlist.length > 0 && `${wishlist.length} ${wishlist.length === 1 ? 'product' : 'products'}.`}</p>
        </div>
      </header>

      {wishlist.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" action={<Link to="/shop" className="btn btn--primary">Browse the shop</Link>}>
          Select the heart on any product to save it here for later.
        </EmptyState>
      ) : (
        <>
          <div className="grid grid--grid">
            {available.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {gone.length > 0 && (
            <section className="gone">
              <h2 className="h3">No longer sold</h2>
              <ul>
                {gone.map((p) => (
                  <li key={p.id}>
                    <ProductImage product={p} width={56} />
                    <span>{p.name}</span>
                    <button className="btn btn--ghost btn--sm" onClick={() => removeFromWishlist(p.id)}><X size={14} /> Remove</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductImage from '../components/ProductImage';
import Price from '../components/Price';
import QuantityStepper from '../components/QuantityStepper';
import { EmptyState, Spinner } from '../components/States';
import { formatPrice } from '../utils/format';
import { specChips } from '../utils/specs';

export default function CartPage() {
  const { items, count, subtotal, setQuantity, remove, pending, loading } = useCart();
  const navigate = useNavigate();

  if (loading) return <div className="page-center"><Spinner label="Loading cart" /></div>;

  if (items.length === 0) {
    return (
      <div className="page">
        <h1 className="h1">Cart</h1>
        <EmptyState icon={ShoppingBag} title="Your cart is empty" action={<Link to="/shop" className="btn btn--primary">Browse the shop</Link>}>
          Products you add will wait here until you check out.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1 className="h1">Cart</h1>
          <p className="muted">{count} {count === 1 ? 'item' : 'items'}</p>
        </div>
        <Link to="/shop" className="btn btn--ghost btn--sm">Keep shopping</Link>
      </header>

      <div className="cartpage">
        <ul className="cartpage__lines">
          {items.map((line) => {
            const p = line.product;
            const busy = Boolean(pending[p.id]);
            return (
              <li key={line.id} className={`cline ${busy ? 'is-busy' : ''}`}>
                <Link to={`/product/${p.id}`} className="cline__img"><ProductImage product={p} width={140} /></Link>
                <div className="cline__info">
                  <Link to={`/product/${p.id}`} className="cline__name">{p.name}</Link>
                  <ul className="chips-spec">
                    {specChips(p.description, 3).map((c) => <li key={c}>{c}</li>)}
                  </ul>
                  <span className="muted">{formatPrice(p.price)} each</span>
                </div>
                <div className="cline__controls">
                  <QuantityStepper size="sm" value={line.quantity} max={p.stockQuantity ?? 99} busy={busy} onChange={(q) => setQuantity(p, q)} />
                  <button className="icon-btn" onClick={() => remove(p)} disabled={busy} aria-label={`Remove ${p.name}`}><Trash2 size={16} /></button>
                </div>
                <Price value={line.price} className="cline__total" />
              </li>
            );
          })}
        </ul>

        <aside className="summary" aria-label="Order summary">
          <h2 className="h3">Summary</h2>
          <dl>
            <div><dt>Items</dt><dd>{count}</dd></div>
            <div className="summary__total"><dt>Subtotal</dt><dd><Price value={subtotal} size="lg" /></dd></div>
          </dl>
          <p className="muted">Delivery details are confirmed at checkout.</p>
          <button className="btn btn--primary btn--lg btn--block" onClick={() => navigate('/checkout')}>Go to checkout</button>
        </aside>
      </div>
    </div>
  );
}

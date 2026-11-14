import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import Sheet from './Sheet';
import ProductImage from './ProductImage';
import QuantityStepper from './QuantityStepper';
import { EmptyState, Spinner } from './States';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function CartDrawer() {
  const { items, count, subtotal, drawerOpen, closeDrawer, setQuantity, remove, pending, loading } = useCart();
  const navigate = useNavigate();

  const footer = items.length > 0 && (
    <div className="drawer-total">
      <div className="drawer-total__row">
        <span>Subtotal</span>
        <strong>{formatPrice(subtotal)}</strong>
      </div>
      <button
        className="btn btn--primary btn--block btn--lg"
        onClick={() => {
          closeDrawer();
          navigate('/checkout');
        }}
      >
        Go to checkout
      </button>
    </div>
  );

  return (
    <Sheet
      open={drawerOpen}
      onClose={closeDrawer}
      title={count ? `Your cart (${count})` : 'Your cart'}
      footer={footer}
      labelledBy="cart-title"
    >
      {loading ? (
        <Spinner label="Loading cart" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          action={
            <button className="btn btn--ghost" onClick={closeDrawer}>
              Keep browsing
            </button>
          }
        >
          Add something from the shelf and it will show up here.
        </EmptyState>
      ) : (
        <ul className="cart-lines">
          {items.map((line) => {
            const p = line.product;
            const busy = Boolean(pending[p.id]);
            return (
              <li key={line.id} className={`cart-line ${busy ? 'is-busy' : ''}`}>
                <Link to={`/product/${p.id}`} onClick={closeDrawer} className="cart-line__img">
                  <ProductImage product={p} width={96} />
                </Link>
                <div className="cart-line__info">
                  <Link to={`/product/${p.id}`} onClick={closeDrawer} className="cart-line__name">
                    {p.name}
                  </Link>
                  <span className="cart-line__unit">{formatPrice(p.price)} each</span>
                  <div className="cart-line__controls">
                    <QuantityStepper
                      size="sm"
                      value={line.quantity}
                      max={p.stockQuantity ?? 99}
                      busy={busy}
                      onChange={(q) => setQuantity(p, q)}
                    />
                    <button
                      className="icon-btn icon-btn--sm"
                      aria-label={`Remove ${p.name}`}
                      disabled={busy}
                      onClick={() => remove(p)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <strong className="cart-line__total">{formatPrice(line.price)}</strong>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}

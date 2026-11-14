import { Link } from 'react-router-dom';
import { ReceiptText, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderHistory } from '../utils/storage';
import { EmptyState } from '../components/States';
import { formatDate, formatPrice } from '../utils/format';
import { STATUS_LABEL } from './OrderPage';
import ProductImage from '../components/ProductImage';

export default function OrdersPage() {
  const { user } = useAuth();
  const orders = orderHistory.list(user.id);

  return (
    <div className="page page--narrow">
      <h1 className="page__title">Your orders</h1>
      <p className="muted page__lede">Orders you’ve placed from this browser, newest first.</p>

      {orders.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No orders yet" action={<Link to="/" className="btn btn--primary">Start shopping</Link>}>
          When you place an order, its receipt will be kept here.
        </EmptyState>
      ) : (
        <ul className="orders">
          {orders.map((o) => {
            const units = (o.items || []).reduce((n, i) => n + i.quantity, 0);
            return (
              <li key={o.id}>
                <Link to={`/orders/${o.id}`} className="order-row">
                  <div className="order-row__thumbs" aria-hidden>
                    {(o.items || []).slice(0, 3).map((i) => (
                      <ProductImage key={i.id} product={i.product} width={64} />
                    ))}
                  </div>
                  <div className="order-row__main">
                    <strong>Order #{o.id}</strong>
                    <span className="muted">
                      {formatDate(o.placedAt)}, {units} {units === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <span className={`status status--${(o.status || '').toLowerCase()}`}>{STATUS_LABEL[o.status] || o.status}</span>
                  <strong className="order-row__total">{formatPrice(o.totalAmount)}</strong>
                  <ChevronRight size={18} className="muted" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

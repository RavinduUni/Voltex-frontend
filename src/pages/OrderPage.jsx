import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, FileQuestion } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderHistory } from '../utils/storage';
import Receipt, { receiptDate } from '../components/Receipt';
import { EmptyState } from '../components/States';
import { formatAddress, fullName } from '../utils/format';

export const STATUS_LABEL = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
};

export default function OrderPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { state } = useLocation();
  const order = orderHistory.find(user.id, id);
  const justPlaced = Boolean(state?.justPlaced);

  if (!order) {
    return (
      <div className="page">
        <EmptyState icon={FileQuestion} title={`Order #${id} isn’t on this device`} action={<Link to="/orders" className="btn btn--primary">See your orders</Link>}>
          Receipts are saved in the browser where the order was placed.
        </EmptyState>
      </div>
    );
  }

  const lines = (order.items || []).map((i) => ({
    name: i.product?.name ?? 'Item',
    quantity: i.quantity,
    price: Number(i.price),
  }));

  return (
    <div className="page confirm">
      <div className="confirm__head">
        {justPlaced && <CheckCircle2 size={36} className="confirm__icon" />}
        <h1>{justPlaced ? 'Order confirmed' : `Order #${order.id}`}</h1>
        <p className="muted">
          {justPlaced
            ? `Thanks, ${user.firstName}. Your receipt is below; we’ll deliver to the address on file.`
            : `Placed ${receiptDate(order.placedAt)}`}
        </p>
      </div>

      <div className={`printer ${justPlaced ? 'printer--printing' : ''}`}>
        <div className="printer__slot" aria-hidden />
        <Receipt
          lines={lines}
          total={order.totalAmount}
          title={`Order #${order.id}`}
          meta={[
            ['Date', receiptDate(order.placedAt)],
            ['Status', STATUS_LABEL[order.status] || order.status],
            ['Deliver to', fullName(user)],
            ['', formatAddress(user.address) || 'No address on file'],
          ]}
          footer="Thank you for shopping with us."
        />
      </div>

      <div className="confirm__actions">
        <Link to="/" className="btn btn--primary btn--lg">Continue shopping</Link>
        <Link to="/orders" className="btn btn--ghost btn--lg">All orders</Link>
      </div>
    </div>
  );
}

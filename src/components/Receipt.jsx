import { STORE_NAME } from '../config';
import { formatPrice, formatDate } from '../utils/format';

/**
 * Printed-receipt presentation for cart summaries and confirmed orders.
 * `lines` are { name, quantity, price } where price is the line total.
 */
export default function Receipt({ lines, total, meta = [], title, footer, className = '', children }) {
  const units = lines.reduce((n, l) => n + l.quantity, 0);
  return (
    <div className={`receipt ${className}`}>
      <div className="receipt__paper">
        <div className="receipt__head">
          <strong className="receipt__store">{STORE_NAME}</strong>
          {title && <span>{title}</span>}
        </div>
        {meta.length > 0 && (
          <dl className="receipt__meta">
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <ol className="receipt__lines">
          {lines.map((l, i) => (
            <li key={i}>
              <span className="receipt__name">{l.name}</span>
              <span className="receipt__qty">
                {l.quantity} × {formatPrice(l.price / l.quantity)}
              </span>
              <span className="receipt__amt">{formatPrice(l.price)}</span>
            </li>
          ))}
        </ol>
        <div className="receipt__rule" />
        <div className="receipt__row">
          <span>Items</span>
          <span>{units}</span>
        </div>
        <div className="receipt__row receipt__row--total">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        {children}
        {footer && <p className="receipt__foot">{footer}</p>}
      </div>
    </div>
  );
}

export const linesFromItems = (items) =>
  items.map((i) => ({
    name: i.product?.name ?? 'Item',
    quantity: i.quantity,
    price: Number(i.price),
  }));

export const receiptDate = (iso) => formatDate(iso || new Date().toISOString());

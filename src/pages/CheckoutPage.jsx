import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Pencil, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../api/client';
import Receipt, { linesFromItems } from '../components/Receipt';
import ProductImage from '../components/ProductImage';
import AddressFields, { addressFrom, validateAddress } from '../components/AddressFields';
import { EmptyState, Spinner } from '../components/States';
import { formatAddress, formatPrice, fullName, hasAddress } from '../utils/format';

function DeliveryCard() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(!hasAddress(user?.address));
  const [addr, setAddr] = useState(addressFrom(user?.address));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const errs = validateAddress(addr);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await updateProfile({ address: addr });
      setEditing(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error('The address wasn’t saved', { body: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel__head">
        <h2><MapPin size={18} /> Deliver to</h2>
        {!editing && (
          <button className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>
            <Pencil size={14} /> Change
          </button>
        )}
      </div>
      {editing ? (
        <form onSubmit={save} noValidate>
          <AddressFields value={addr} onChange={setAddr} errors={errors} prefix="co" />
          <div className="panel__actions">
            {hasAddress(user?.address) && (
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
            )}
            <button className="btn btn--dark" disabled={busy}>
              {busy && <Loader2 size={16} className="spin" />} Save address
            </button>
          </div>
        </form>
      ) : (
        <address className="addr">
          <strong>{fullName(user)}</strong>
          <span>{formatAddress(user.address)}</span>
          <span className="muted">{[user.phone, user.email].filter(Boolean).join(', ')}</span>
        </address>
      )}
    </section>
  );
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, count, checkout, loading, pending, refresh } = useCart();
  const catalog = useCatalog();
  const toast = useToast();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  if (loading) return <div className="page-center"><Spinner label="Loading cart" /></div>;

  if (items.length === 0) {
    return (
      <div className="page">
        <EmptyState icon={ShoppingBag} title="Nothing to check out yet" action={<Link to="/" className="btn btn--primary">Back to the shelf</Link>}>
          Your cart is empty. Add a few things and come back here.
        </EmptyState>
      </div>
    );
  }

  const ready = hasAddress(user?.address);
  const anyPending = Object.keys(pending).length > 0;

  const place = async () => {
    setPlacing(true);
    try {
      const order = await checkout();
      catalog.reload(); // stock levels changed
      navigate(`/orders/${order.id}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      toast.error('The order wasn’t placed', { body: errorMessage(err) });
      refresh();
      catalog.reload();
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="page">
      <Link to="/" className="back"><ArrowLeft size={16} /> Keep shopping</Link>
      <h1 className="page__title">Checkout</h1>

      <div className="checkout">
        <div className="checkout__main">
          <DeliveryCard />

          <section className="panel">
            <div className="panel__head">
              <h2>Items ({count})</h2>
            </div>
            <ul className="co-items">
              {items.map((i) => (
                <li key={i.id}>
                  <ProductImage product={i.product} width={72} />
                  <div>
                    <strong>{i.product.name}</strong>
                    <span className="muted">Qty {i.quantity}</span>
                  </div>
                  <span>{formatPrice(i.price)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="checkout__side">
          <Receipt lines={linesFromItems(items)} total={subtotal} title="Order summary">
            <button className="btn btn--primary btn--block btn--lg receipt__cta" disabled={!ready || placing || anyPending} onClick={place}>
              {placing && <Loader2 size={18} className="spin" />}
              {placing ? 'Placing order' : `Place order, ${formatPrice(subtotal)}`}
            </button>
            {!ready && <p className="receipt__note">Add a delivery address to place your order.</p>}
          </Receipt>
        </aside>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../api/client';
import AddressFields, { addressFrom, validateAddress } from '../components/AddressFields';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
  });
  const [addr, setAddr] = useState(addressFrom(user.address));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addressTouched = Object.values({ ...addr, country: '' }).some((v) => v.trim());

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Enter your first name.';
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone.trim())) errs.phone = 'Use digits only, like 0771234567.';
    const addrErrs = addressTouched ? validateAddress(addr) : {};
    setErrors({ ...errs, address: addrErrs });
    if (Object.keys(errs).length || Object.keys(addrErrs).length) return;

    setBusy(true);
    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || null,
        ...(addressTouched ? { address: addr } : {}),
      });
      toast.success('Changes saved');
    } catch (err) {
      toast.error('Your changes weren’t saved', { body: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page--narrow">
      <h1 className="page__title">Profile and address</h1>
      <form onSubmit={save} noValidate className="stack">
        <section className="panel">
          <h2 className="panel__title">Your details</h2>
          <div className="field-row">
            <div className={`field ${errors.firstName ? 'has-error' : ''}`}>
              <label htmlFor="pf-first">First name</label>
              <input id="pf-first" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
              {errors.firstName && <span className="field__msg">{errors.firstName}</span>}
            </div>
            <div className="field">
              <label htmlFor="pf-last">Last name</label>
              <input id="pf-last" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="pf-email">Email</label>
              <input id="pf-email" value={user.email} readOnly aria-describedby="pf-email-hint" />
              <span className="field__hint" id="pf-email-hint">This is how you sign in, so it can’t be changed here.</span>
            </div>
            <div className={`field ${errors.phone ? 'has-error' : ''}`}>
              <label htmlFor="pf-phone">Phone</label>
              <input id="pf-phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
              {errors.phone && <span className="field__msg">{errors.phone}</span>}
            </div>
          </div>
        </section>

        <section className="panel">
          <h2 className="panel__title">Delivery address</h2>
          <AddressFields value={addr} onChange={setAddr} errors={errors.address} prefix="pf" />
        </section>

        <div className="form-actions">
          <button className="btn btn--primary btn--lg" disabled={busy}>
            {busy && <Loader2 size={16} className="spin" />} Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

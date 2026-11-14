export const EMPTY_ADDRESS = { street: '', city: '', state: '', zipcode: '', country: 'Sri Lanka' };

export function addressFrom(a) {
  return {
    street: a?.street || '',
    city: a?.city || '',
    state: a?.state || '',
    zipcode: a?.zipcode || '',
    country: a?.country || 'Sri Lanka',
  };
}

export function validateAddress(a) {
  const e = {};
  if (!a.street.trim()) e.street = 'Enter a street address.';
  if (!a.city.trim()) e.city = 'Enter a city.';
  if (!a.country.trim()) e.country = 'Enter a country.';
  return e;
}

/** Controlled address inputs. `prefix` keeps ids unique when used twice on a page. */
export default function AddressFields({ value, onChange, errors = {}, prefix = 'addr' }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const f = (k, label, auto, extra = {}) => (
    <div className={`field ${errors[k] ? 'has-error' : ''}`} {...extra}>
      <label htmlFor={`${prefix}-${k}`}>{label}</label>
      <input id={`${prefix}-${k}`} autoComplete={auto} value={value[k]} onChange={set(k)} />
      {errors[k] && <span className="field__msg" role="alert">{errors[k]}</span>}
    </div>
  );
  return (
    <div className="address-grid">
      {f('street', 'Street address', 'street-address', { className: `field field--wide ${errors.street ? 'has-error' : ''}` })}
      {f('city', 'City', 'address-level2')}
      {f('state', 'Province / state', 'address-level1')}
      {f('zipcode', 'Postal code', 'postal-code')}
      {f('country', 'Country', 'country-name')}
    </div>
  );
}

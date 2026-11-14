import { CURRENCY, LOCALE } from '../config';

const money = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPrice = (value) => money.format(Number(value) || 0);

/** Splits a price into currency symbol, whole part and cents for the price tag. */
export function priceParts(value) {
  const parts = money.formatToParts(Number(value) || 0);
  const symbol = parts.find((p) => p.type === 'currency')?.value ?? '';
  const whole = parts
    .filter((p) => p.type === 'integer' || p.type === 'group')
    .map((p) => p.value)
    .join('');
  const cents = parts.find((p) => p.type === 'fraction')?.value ?? '00';
  return { symbol, whole, cents };
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });

/** Deterministic pick from a list based on a string (used for category tints). */
export function pickBy(str = '', list) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

export const initials = (text = '') =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Reads the `exp` claim from a JWT without verifying it (the server does that). */
export function tokenExpiry(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ');

export const formatAddress = (a) =>
  a ? [a.street, a.city, a.state, a.zipcode, a.country].filter(Boolean).join(', ') : '';

export const hasAddress = (a) => Boolean(a && a.street && a.city);

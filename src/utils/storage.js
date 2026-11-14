const SESSION_KEY = 'kade.session';
const ORDERS_KEY = 'kade.orders';

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked; the app still works for this visit */
  }
};

export const session = {
  get: () => read(SESSION_KEY, {}),
  set: (value) => write(SESSION_KEY, value),
  clear: () => localStorage.removeItem(SESSION_KEY),
};

/**
 * The backend has no "list my orders" endpoint, so each Order returned by
 * POST /order/ is kept on this device, per user id.
 */
export const orderHistory = {
  list: (userId) => read(ORDERS_KEY, {})[userId] || [],
  add: (userId, order) => {
    const all = read(ORDERS_KEY, {});
    const mine = all[userId] || [];
    const entry = { ...order, user: undefined, placedAt: new Date().toISOString() };
    all[userId] = [entry, ...mine.filter((o) => o.id !== order.id)];
    write(ORDERS_KEY, all);
    return entry;
  },
  find: (userId, orderId) =>
    (read(ORDERS_KEY, {})[userId] || []).find((o) => String(o.id) === String(orderId)),
};

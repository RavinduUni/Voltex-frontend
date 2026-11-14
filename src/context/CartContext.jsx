import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cartApi, orderApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { orderHistory } from '../utils/storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

/** Turns the backend's cart messages into clearer sentences. */
function friendly(message, product) {
  switch (message) {
    case 'Stock Limit exceed':
      return product?.stockQuantity != null
        ? `Only ${product.stockQuantity} of ${product.name} in stock.`
        : 'Not enough stock for that quantity.';
    case 'Product not found':
      return 'That product is no longer available.';
    case 'User not found':
      return 'Your account could not be found. Sign in again.';
    case 'Item not found in cart':
      return 'That item was already removed from your cart.';
    default:
      return message;
  }
}

export function CartProvider({ children }) {
  const { user, status: authStatus } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState({}); // productId -> true while a request runs
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Decreasing a quantity removes and re-adds the line on the server, which changes its
  // position in the list. Remember first-seen order so lines don't jump around.
  const orderRef = useRef(new Map());

  const refresh = useCallback(async () => {
    try {
      const data = await cartApi.items();
      const list = Array.isArray(data) ? data : [];
      const seen = orderRef.current;
      list.forEach((i) => {
        const pid = i.product?.id;
        if (pid != null && !seen.has(pid)) seen.set(pid, seen.size);
      });
      list.sort((a, b) => (seen.get(a.product?.id) ?? 0) - (seen.get(b.product?.id) ?? 0));
      setItems(list);
    } catch (e) {
      toast.error('Your cart could not be loaded', { body: errorMessage(e) });
    }
  }, [toast]);

  useEffect(() => {
    if (authStatus === 'authed') {
      setLoading(true);
      refresh().finally(() => setLoading(false));
    } else {
      orderRef.current = new Map();
      setItems([]);
      setDrawerOpen(false);
    }
  }, [authStatus, user?.id, refresh]);

  const lineFor = useCallback(
    (productId) => items.find((i) => String(i.product?.id) === String(productId)),
    [items]
  );

  const withPending = async (productId, fn) => {
    setPending((p) => ({ ...p, [productId]: true }));
    try {
      return await fn();
    } finally {
      setPending((p) => {
        const next = { ...p };
        delete next[productId];
        return next;
      });
    }
  };

  /** Adds `qty` units. Returns true on success. */
  const add = useCallback(
    async (product, qty = 1, { quiet = false } = {}) => {
      const inCart = lineFor(product.id)?.quantity || 0;
      const stock = product.stockQuantity ?? Infinity;
      // The backend checks stock against the added amount only, so guard the total here.
      if (inCart + qty > stock) {
        toast.error(
          stock <= 0 ? `${product.name} is sold out.` : `Only ${stock} of ${product.name} in stock.`,
          { body: inCart ? `You already have ${inCart} in your cart.` : undefined }
        );
        return false;
      }
      return withPending(product.id, async () => {
        try {
          await cartApi.add(product.id, qty);
          await refresh();
          if (!quiet) {
            toast.success('Added to cart', {
              body: qty > 1 ? `${qty} × ${product.name}` : product.name,
              action: { label: 'View cart', onClick: () => setDrawerOpen(true) },
            });
          }
          return true;
        } catch (e) {
          toast.error(friendly(errorMessage(e), product));
          return false;
        }
      });
    },
    [lineFor, refresh, toast]
  );

  const remove = useCallback(
    async (product, { quiet = false } = {}) =>
      withPending(product.id, async () => {
        try {
          await cartApi.remove(product.id);
          await refresh();
          if (!quiet) toast.info('Removed from cart', { body: product.name });
          return true;
        } catch (e) {
          toast.error(friendly(errorMessage(e), product));
          await refresh();
          return false;
        }
      }),
    [refresh, toast]
  );

  /**
   * The backend has no "set quantity" endpoint. Increases use POST /cart/ with the
   * difference; decreases remove the line and add it back with the new quantity.
   */
  const setQuantity = useCallback(
    async (product, nextQty) => {
      const current = lineFor(product.id)?.quantity || 0;
      if (nextQty === current) return true;
      if (nextQty <= 0) return remove(product);
      if (nextQty > current) return add(product, nextQty - current, { quiet: true });

      return withPending(product.id, async () => {
        try {
          await cartApi.remove(product.id);
          try {
            await cartApi.add(product.id, nextQty);
          } catch (e) {
            await cartApi.add(product.id, current).catch(() => {});
            throw e;
          }
          await refresh();
          return true;
        } catch (e) {
          toast.error(friendly(errorMessage(e), product));
          await refresh();
          return false;
        }
      });
    },
    [lineFor, add, remove, refresh, toast]
  );

  /** POST /order/ — converts the whole cart into a confirmed order. */
  const checkout = useCallback(async () => {
    const order = await orderApi.place();
    const saved = orderHistory.add(user.id, order);
    orderRef.current = new Map();
    setItems([]);
    refresh();
    return saved;
  }, [user?.id, refresh]);

  const totals = useMemo(() => {
    const count = items.reduce((n, i) => n + (i.quantity || 0), 0);
    const subtotal = items.reduce((n, i) => n + Number(i.price || 0), 0);
    return { count, subtotal };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      loading,
      pending,
      ...totals,
      lineFor,
      add,
      remove,
      setQuantity,
      checkout,
      refresh,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [items, loading, pending, totals, lineFor, add, remove, setQuantity, checkout, refresh, drawerOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

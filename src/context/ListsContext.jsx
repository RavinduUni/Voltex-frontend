import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { COMPARE_LIMIT } from '../config';

/**
 * Wishlist and compare selections. The backend has no endpoints for these, so they
 * are kept in this browser, per signed-in user. Each entry stores a small product
 * snapshot so lists render instantly; pages refresh the details from the API.
 */
const ListsContext = createContext(null);
const KEY = 'voltix.lists';

const snapshot = (p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  category: p.category,
  imageUrl: p.imageUrl,
  stockQuantity: p.stockQuantity,
  description: p.description,
});

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function ListsProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const userKey = user?.id ? String(user.id) : null;
  const [lists, setLists] = useState({ wishlist: [], compare: [] });

  useEffect(() => {
    if (!userKey) return setLists({ wishlist: [], compare: [] });
    const mine = readAll()[userKey] || {};
    setLists({ wishlist: mine.wishlist || [], compare: mine.compare || [] });
  }, [userKey]);

  const save = useCallback(
    (next) => {
      setLists(next);
      if (!userKey) return;
      try {
        const all = readAll();
        all[userKey] = next;
        localStorage.setItem(KEY, JSON.stringify(all));
      } catch {
        /* storage blocked: lists still work for this visit */
      }
    },
    [userKey]
  );

  const inWishlist = useCallback((id) => lists.wishlist.some((p) => p.id === id), [lists.wishlist]);
  const inCompare = useCallback((id) => lists.compare.some((p) => p.id === id), [lists.compare]);

  const toggleWishlist = useCallback(
    (product) => {
      const has = lists.wishlist.some((p) => p.id === product.id);
      save({
        ...lists,
        wishlist: has ? lists.wishlist.filter((p) => p.id !== product.id) : [snapshot(product), ...lists.wishlist],
      });
      toast.info(has ? 'Removed from wishlist' : 'Saved to wishlist', { body: product.name, duration: 2500 });
    },
    [lists, save, toast]
  );

  const toggleCompare = useCallback(
    (product) => {
      const has = lists.compare.some((p) => p.id === product.id);
      if (!has && lists.compare.length >= COMPARE_LIMIT) {
        toast.error(`You can compare up to ${COMPARE_LIMIT} products`, { body: 'Remove one from the compare tray first.' });
        return false;
      }
      save({
        ...lists,
        compare: has ? lists.compare.filter((p) => p.id !== product.id) : [...lists.compare, snapshot(product)],
      });
      return true;
    },
    [lists, save, toast]
  );

  const removeFromWishlist = useCallback(
    (id) => save({ ...lists, wishlist: lists.wishlist.filter((p) => p.id !== id) }),
    [lists, save]
  );
  const removeFromCompare = useCallback(
    (id) => save({ ...lists, compare: lists.compare.filter((p) => p.id !== id) }),
    [lists, save]
  );
  const clearCompare = useCallback(() => save({ ...lists, compare: [] }), [lists, save]);

  const value = useMemo(
    () => ({
      wishlist: lists.wishlist,
      compare: lists.compare,
      inWishlist,
      inCompare,
      toggleWishlist,
      toggleCompare,
      removeFromWishlist,
      removeFromCompare,
      clearCompare,
    }),
    [lists, inWishlist, inCompare, toggleWishlist, toggleCompare, removeFromWishlist, removeFromCompare, clearCompare]
  );

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}

export const useLists = () => useContext(ListsContext);

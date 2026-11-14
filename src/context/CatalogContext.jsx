import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { productApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { useAuth } from './AuthContext';

/**
 * Shared catalog state. Products themselves are loaded page by page where they're
 * shown (useCatalogPages); this holds the category list and a `version` number.
 * Calling reload() bumps the version so every open listing refetches.
 */
const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const { status: authStatus } = useAuth();
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  const loadCategories = useCallback(async () => {
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    try {
      const data = await productApi.categories();
      setCategories(Array.isArray(data) ? data : []);
      setStatus('ready');
      setError('');
    } catch (e) {
      setError(errorMessage(e, 'Categories could not be loaded.'));
      setStatus('error');
    }
  }, []);

  // Product endpoints require a token, so load once the user is signed in.
  useEffect(() => {
    if (authStatus === 'authed') loadCategories();
    if (authStatus === 'guest') {
      setCategories([]);
      setStatus('idle');
    }
  }, [authStatus, loadCategories]);

  const reload = useCallback(() => {
    setVersion((v) => v + 1);
    loadCategories();
  }, [loadCategories]);

  const value = useMemo(
    () => ({ categories, status, error, version, reload }),
    [categories, status, error, version, reload]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);

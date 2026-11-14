import { useEffect, useState } from 'react';
import { productApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { useCatalog } from '../context/CatalogContext';

/** One page of products for rails and showcases (GET /products/catalog). */
export function useProducts({ category, q, sort = 'featured', size = 10, enabled = true } = {}) {
  const { version } = useCatalog();
  const [state, setState] = useState({ items: [], total: 0, status: 'loading', error: '' });

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setState((s) => ({ ...s, status: 'loading' }));
    productApi
      .catalog({ category, q, sort, size })
      .then((page) => alive && setState({ items: page.content || [], total: page.totalElements, status: 'ready', error: '' }))
      .catch((e) => alive && setState({ items: [], total: 0, status: 'error', error: errorMessage(e) }));
    return () => {
      alive = false;
    };
  }, [category, q, sort, size, enabled, version]);

  return state;
}

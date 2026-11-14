import { useCallback, useEffect, useRef, useState } from 'react';
import { productApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { useCatalog } from '../context/CatalogContext';

const INITIAL = { items: [], page: -1, total: 0, last: true, status: 'loading', error: '' };

/**
 * Loads the shop listing one page at a time from GET /products/catalog.
 * Changing a filter starts again from page 0; loadMore() appends the next page.
 * Responses that arrive after the filters changed are ignored.
 */
export function useCatalogPages({ category, q, sort, size = 24, enabled = true }) {
  const { version } = useCatalog();
  const [state, setState] = useState(INITIAL);
  const stateRef = useRef(state);
  stateRef.current = state;
  const requestId = useRef(0);

  const load = useCallback(
    async (page) => {
      const id = ++requestId.current;
      setState((s) => ({ ...s, status: page === 0 ? 'loading' : 'more', error: '' }));
      try {
        const data = await productApi.catalog({ page, size, category, q, sort });
        if (id !== requestId.current) return;
        setState((s) => {
          const incoming = data.content || [];
          let items = incoming;
          if (page > 0) {
            // A product added between page loads could shift the list; skip repeats.
            const seen = new Set(s.items.map((p) => p.id));
            items = [...s.items, ...incoming.filter((p) => !seen.has(p.id))];
          }
          return { items, page: data.page, total: data.totalElements, last: data.last, status: 'ready', error: '' };
        });
      } catch (e) {
        if (id !== requestId.current) return;
        setState((s) => ({ ...s, status: page === 0 ? 'error' : 'ready', error: errorMessage(e) }));
      }
    },
    [category, q, sort, size]
  );

  useEffect(() => {
    if (enabled) load(0);
  }, [load, version, enabled]);

  const loadMore = useCallback(() => {
    const s = stateRef.current;
    if (!s.last && s.status === 'ready') load(s.page + 1);
  }, [load]);

  const reload = useCallback(() => load(0), [load]);

  return { ...state, loadMore, reload };
}

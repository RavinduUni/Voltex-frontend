import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, RotateCw, Search, Users, ShoppingCart, Package } from 'lucide-react';
import { productApi, userApi, cartApi } from '../../api/endpoints';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useCatalog } from '../../context/CatalogContext';
import Sheet from '../../components/Sheet';
import ProductImage from '../../components/ProductImage';
import { EmptyState, Spinner } from '../../components/States';
import ProductForm from './ProductForm';
import { formatAddress, formatPrice, fullName } from '../../utils/format';

function useLoader(fn) {
  const [state, setState] = useState({ status: 'loading', data: [], error: '' });
  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: s.data.length ? 'refreshing' : 'loading' }));
    try {
      const data = await fn();
      setState({ status: 'ready', data: Array.isArray(data) ? data : [], error: '' });
    } catch (e) {
      setState((s) => ({ ...s, status: 'error', error: errorMessage(e) }));
    }
  }, [fn]);
  useEffect(() => {
    load();
  }, [load]);
  return [state, load];
}

function ProductsTab() {
  const toast = useToast();
  const catalog = useCatalog();
  const [state, reload] = useLoader(productApi.all);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState(null);
  const [filter, setFilter] = useState('');
  const [view, setView] = useState('all'); // all | active | hidden

  const categories = useMemo(
    () => [...new Set(state.data.map((p) => p.category).filter(Boolean))].sort(),
    [state.data]
  );

  const rows = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return state.data
      .filter((p) => (view === 'all' ? true : view === 'active' ? p.active !== false : p.active === false))
      .filter((p) => !f || p.name?.toLowerCase().includes(f) || p.category?.toLowerCase().includes(f))
      .sort((a, b) => b.id - a.id);
  }, [state.data, filter, view]);

  const afterChange = async () => {
    await reload();
    catalog.reload();
  };

  /** Saves the product first, then uploads the chosen image (it needs the product id). */
  const save = async (payload, file) => {
    setBusy(true);
    let id = editing === 'new' ? null : editing.id;
    try {
      if (id == null) {
        const created = await productApi.create(payload);
        id = created.id;
      } else {
        await productApi.update(id, payload);
      }
    } catch (e) {
      toast.error('The product wasn’t saved', { body: errorMessage(e) });
      setBusy(false);
      return;
    }

    let imageFailed = false;
    if (file) {
      try {
        await productApi.uploadImage(id, file);
      } catch (e) {
        imageFailed = true;
        toast.error('Saved, but the image didn’t upload', { body: errorMessage(e) });
      }
    }
    if (!imageFailed) {
      toast.success(editing === 'new' ? 'Product added' : 'Product updated', { body: payload.name });
    }
    setEditing(null);
    setBusy(false);
    await afterChange();
  };

  const toggle = async (p) => {
    setRowBusy(p.id);
    try {
      if (p.active === false) {
        await productApi.update(p.id, { active: true });
        toast.success('Product visible in shop', { body: p.name });
      } else {
        await productApi.remove(p.id); // soft delete
        toast.info('Product hidden from shop', { body: p.name });
      }
      await afterChange();
    } catch (e) {
      toast.error('That change didn’t go through', { body: errorMessage(e) });
    } finally {
      setRowBusy(null);
    }
  };

  const counts = {
    all: state.data.length,
    active: state.data.filter((p) => p.active !== false).length,
    hidden: state.data.filter((p) => p.active === false).length,
  };

  return (
    <>
      <div className="admin-bar">
        <div className="seg seg--sm" role="tablist" aria-label="Product visibility">
          {[['all', 'All'], ['active', 'In shop'], ['hidden', 'Hidden']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}>
              {l} <span className="chip__n">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="search search--inline">
          <Search size={16} className="search__icon" aria-hidden />
          <input type="search" placeholder="Filter by name or category" aria-label="Filter products" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <button className="btn btn--primary" onClick={() => setEditing('new')}>
          <Plus size={16} /> Add product
        </button>
      </div>

      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && (
        <EmptyState icon={RotateCw} title="Products didn’t load" action={<button className="btn btn--primary" onClick={reload}>Try again</button>}>
          {state.error}
        </EmptyState>
      )}
      {(state.status === 'ready' || state.status === 'refreshing') && (
        rows.length === 0 ? (
          <EmptyState icon={Package} title={state.data.length ? 'No products match' : 'No products yet'} action={!state.data.length && <button className="btn btn--primary" onClick={() => setEditing('new')}><Plus size={16} /> Add the first product</button>}>
            {state.data.length ? 'Try another filter.' : 'Products you add here appear on the shelf right away.'}
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col" className="num">Price</th>
                  <th scope="col" className="num">Stock</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className={p.active === false ? 'is-hidden' : ''}>
                    <td>
                      <div className="t-product">
                        <ProductImage product={p} width={64} />
                        <div>
                          <strong>{p.name}</strong>
                          <span className="muted">ID {p.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>{p.category || <span className="muted">None</span>}</td>
                    <td className="num">{formatPrice(p.price)}</td>
                    <td className="num">
                      <span className={p.stockQuantity <= 0 ? 'text-danger' : p.stockQuantity <= 5 ? 'text-warn' : ''}>{p.stockQuantity}</span>
                    </td>
                    <td>
                      <span className={`status ${p.active === false ? 'status--hidden' : 'status--confirmed'}`}>
                        {p.active === false ? 'Hidden' : 'In shop'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-btn"
                          aria-label={p.active === false ? `Show ${p.name} in shop` : `Hide ${p.name} from shop`}
                          title={p.active === false ? 'Show in shop' : 'Hide from shop'}
                          disabled={rowBusy === p.id}
                          onClick={() => toggle(p)}
                        >
                          {p.active === false ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <Sheet open={Boolean(editing)} onClose={() => !busy && setEditing(null)} title={editing === 'new' ? 'Add product' : 'Edit product'} width={480} labelledBy="product-sheet-title">
        {editing && (
          <ProductForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            categories={categories}
            busy={busy}
            submitLabel={editing === 'new' ? 'Add product' : 'Save changes'}
            onSubmit={save}
          />
        )}
      </Sheet>
    </>
  );
}

function CustomersTab() {
  const [state, reload] = useLoader(userApi.list);
  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error')
    return <EmptyState icon={RotateCw} title="Customers didn’t load" action={<button className="btn btn--primary" onClick={reload}>Try again</button>}>{state.error}</EmptyState>;
  if (!state.data.length) return <EmptyState icon={Users} title="No customers yet" />;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Address</th>
            <th scope="col">Role</th>
          </tr>
        </thead>
        <tbody>
          {state.data.map((u) => (
            <tr key={u.id}>
              <td><strong>{fullName(u) || '—'}</strong></td>
              <td>{u.email}</td>
              <td>{u.phone || <span className="muted">None</span>}</td>
              <td className="t-wrap">{formatAddress(u.address) || <span className="muted">None</span>}</td>
              <td><span className={`status ${u.role === 'ADMIN' ? 'status--shipped' : 'status--neutral'}`}>{u.role === 'ADMIN' ? 'Admin' : 'Customer'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CartsTab() {
  const [state, reload] = useLoader(cartApi.all);
  const groups = useMemo(() => {
    const m = new Map();
    state.data.forEach((line) => {
      const key = line.user?.id ?? 'unknown';
      if (!m.has(key)) m.set(key, { user: line.user, lines: [], total: 0 });
      const g = m.get(key);
      g.lines.push(line);
      g.total += Number(line.price || 0);
    });
    return [...m.values()].sort((a, b) => b.total - a.total);
  }, [state.data]);

  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error')
    return <EmptyState icon={RotateCw} title="Carts didn’t load" action={<button className="btn btn--primary" onClick={reload}>Try again</button>}>{state.error}</EmptyState>;
  if (!groups.length)
    return <EmptyState icon={ShoppingCart} title="No open carts">Items customers add but haven’t ordered yet show up here.</EmptyState>;

  return (
    <div className="carts">
      {groups.map((g) => (
        <section key={g.user?.id ?? 'x'} className="panel">
          <div className="panel__head">
            <h3>{fullName(g.user) || g.user?.email || 'Unknown customer'}</h3>
            <strong>{formatPrice(g.total)}</strong>
          </div>
          <ul className="co-items">
            {g.lines.map((l) => (
              <li key={l.id}>
                <ProductImage product={l.product} width={64} />
                <div>
                  <strong>{l.product?.name}</strong>
                  <span className="muted">Qty {l.quantity}</span>
                </div>
                <span>{formatPrice(l.price)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SystemLine() {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    api.get('/system/info').then((r) => setInfo(r.data)).catch(() => {});
  }, []);
  if (!info) return null;
  return (
    <p className="muted admin__sys">
      Server running Java {info.javaVersion} on {info.OS} ({info.Architecture})
    </p>
  );
}

const TABS = [
  { id: 'products', label: 'Products', icon: Package, el: ProductsTab },
  { id: 'customers', label: 'Customers', icon: Users, el: CustomersTab },
  { id: 'carts', label: 'Open carts', icon: ShoppingCart, el: CartsTab },
];

export default function AdminPage() {
  const [tab, setTab] = useState('products');
  const Active = TABS.find((t) => t.id === tab).el;
  return (
    <div className="page admin">
      <div className="admin__head">
        <div>
          <h1 className="page__title">Manage store</h1>
          <SystemLine />
        </div>
        <div className="tabs" role="tablist" aria-label="Store sections">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </div>
      <Active />
    </div>
  );
}

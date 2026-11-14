import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, GitCompare, Heart, LogOut, Menu, Package, Search, Settings2, ShoppingBag, User, X, Zap } from 'lucide-react';
import { STORE_NAME } from '../config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { useLists } from '../context/ListsContext';
import { categoryIcon, shopLink } from '../utils/categories';
import Sheet from './Sheet';

export const openPalette = () => window.dispatchEvent(new Event('voltix:palette'));
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function Wordmark() {
  return (
    <span className="wordmark">
      {STORE_NAME}
    </span>
  );
}

/** "Shop" opens a panel listing every category with its count. */
function ShopMenu() {
  const { categories } = useCatalog();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname, search } = useLocation();

  useEffect(() => setOpen(false), [pathname, search]);
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="shopmenu" ref={ref} onMouseLeave={() => setOpen(false)}>
      <button
        className={`navlink ${pathname.startsWith('/shop') && new URLSearchParams(search).get('sort') !== 'newest' ? 'active' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
      >
        Shop <ChevronDown size={14} />
      </button>
      {open && (
        <div className="shopmenu__panel">
          <div className="shopmenu__grid">
            {categories.map((c) => {
              const Icon = categoryIcon(c.name);
              return (
                <Link key={c.name} to={shopLink({ category: c.name })} className="shopmenu__item">
                  <Icon size={20} strokeWidth={1.6} />
                  <span>{c.name}</span>
                  <span className="muted">{c.count}</span>
                </Link>
              );
            })}
          </div>
          <div className="shopmenu__side">
            <Link to="/shop">All products</Link>
            <Link to="/shop?sort=newest">New arrivals</Link>
            <Link to="/shop?sort=price-asc">Lowest prices first</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountMenu() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button className="nav-icon" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} aria-label="Account">
        <span className="avatar" aria-hidden>{(user?.firstName || '?')[0].toUpperCase()}</span>
      </button>
      {open && (
        <div className="menu__list" role="menu" onClick={() => setOpen(false)}>
          <div className="menu__who">
            <strong>{[user?.firstName, user?.lastName].filter(Boolean).join(' ')}</strong>
            <span>{user?.email}</span>
          </div>
          <Link role="menuitem" to="/profile"><User size={16} /> Profile and address</Link>
          <Link role="menuitem" to="/orders"><Package size={16} /> Your orders</Link>
          <Link role="menuitem" to="/wishlist"><Heart size={16} /> Wishlist</Link>
          {isAdmin && <Link role="menuitem" to="/admin"><Settings2 size={16} /> Manage store</Link>}
          <button role="menuitem" onClick={() => logout()}><LogOut size={16} /> Sign out</button>
        </div>
      )}
    </div>
  );
}

function MobileMenu({ open, onClose }) {
  const { categories } = useCatalog();
  const { isAdmin, logout } = useAuth();
  return (
    <Sheet open={open} onClose={onClose} title="Menu" side="left" width={340} labelledBy="mobile-menu-title">
      <nav className="mnav" onClick={(e) => e.target.closest('a,button') && onClose()}>
        <Link to="/">Home</Link>
        <Link to="/shop">All products</Link>
        <Link to="/shop?sort=newest">New arrivals</Link>
        <div className="mnav__group">Categories</div>
        {categories.map((c) => (
          <Link key={c.name} to={shopLink({ category: c.name })}>{c.name} <span className="muted">{c.count}</span></Link>
        ))}
        <div className="mnav__group">Your account</div>
        <Link to="/compare">Compare</Link>
        <Link to="/wishlist">Wishlist</Link>
        <Link to="/orders">Orders</Link>
        <Link to="/profile">Profile and address</Link>
        <Link to="/help">Help and FAQ</Link>
        {isAdmin && <Link to="/admin">Manage store</Link>}
        <button onClick={() => logout()}>Sign out</button>
      </nav>
    </Sheet>
  );
}

export default function Navbar() {
  const { count, openDrawer } = useCart();
  const { compare, wishlist } = useLists();
  const { isAdmin } = useAuth();
  const [mobile, setMobile] = useState(false);
  const { pathname, search } = useLocation();
  // NavLink ignores the query string, so work out the two shop states ourselves.
  const newestActive = pathname === '/shop' && new URLSearchParams(search).get('sort') === 'newest';

  return (
    <header className="nav">
      <div className="nav__inner">
        <button className="nav-icon nav__burger" aria-label="Open menu" onClick={() => setMobile(true)}>
          <Menu size={20} />
        </button>
        <Link to="/" className="nav__brand" aria-label={`${STORE_NAME} home`}>
          <Wordmark />
        </Link>
        <nav className="nav__links" aria-label="Main">
          <ShopMenu />
          <Link className={`navlink ${newestActive ? 'active' : ''}`} to="/shop?sort=newest">New arrivals</Link>
          <NavLink className="navlink" to="/compare">
            Compare {compare.length > 0 && <span className="pip">{compare.length}</span>}
          </NavLink>
          <NavLink className="navlink" to="/help">Help</NavLink>
          {isAdmin && <NavLink className="navlink" to="/admin">Manage</NavLink>}
        </nav>
        <button className="searchbtn" onClick={openPalette}>
          <Search size={16} aria-hidden />
          <span>Search products</span>
          <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <div className="nav__actions">
          <button className="nav-icon nav__search-sm" onClick={openPalette} aria-label="Search"><Search size={19} /></button>
          <Link className="nav-icon" to="/wishlist" aria-label={`Wishlist, ${wishlist.length} items`}>
            <Heart size={19} />
            {wishlist.length > 0 && <span className="pip pip--abs">{wishlist.length}</span>}
          </Link>
          <AccountMenu />
          <button className="cartbtn" onClick={openDrawer} data-cart-target aria-label={`Open cart, ${count} items`}>
            <ShoppingBag size={18} />
            <span className="cartbtn__label">Cart</span>
            <span className="cartbtn__count">{count}</span>
          </button>
        </div>
      </div>
      <MobileMenu open={mobile} onClose={() => setMobile(false)} />
    </header>
  );
}


import { Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { shopLink } from '../utils/categories';
import { SUPPORT } from '../content';
import { STORE_NAME } from '../config';
import { Wordmark } from './Navbar';

export default function Footer() {
  const { categories } = useCatalog();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Wordmark />
          <p>Laptops, phones, audio and more, with the specs laid out so you can compare before you buy.</p>
        </div>
        <nav className="footer__col" aria-label="Shop">
          <h2>Shop</h2>
          {categories.slice(0, 6).map((c) => (
            <Link key={c.name} to={shopLink({ category: c.name })}>{c.name}</Link>
          ))}
          <Link to="/shop?sort=newest">New arrivals</Link>
        </nav>
        <nav className="footer__col" aria-label="Your account">
          <h2>Your account</h2>
          <Link to="/orders">Orders</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/compare">Compare</Link>
          <Link to="/profile">Profile and address</Link>
        </nav>
        <div className="footer__col">
          <h2>Help</h2>
          <Link to="/help">FAQ</Link>
          <Link to="/help#delivery">Delivery and returns</Link>
          <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a>
          <span className="muted">{SUPPORT.hours}</span>
        </div>
      </div>
      <div className="footer__base">
        <span>© {new Date().getFullYear()} {STORE_NAME}</span>
      </div>
    </footer>
  );
}

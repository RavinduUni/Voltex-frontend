import { Link } from 'react-router-dom';
import { openPalette } from '../components/Navbar';

export default function NotFoundPage() {
  return (
    <div className="page notfound">
      <p className="notfound__code" aria-hidden>404</p>
      <h1 className="h1">This page doesn’t exist</h1>
      <p className="muted">The link may be old or mistyped. Search for what you need, or head back to the shop.</p>
      <div className="notfound__actions">
        <Link to="/shop" className="btn btn--primary">Go to the shop</Link>
        <button className="btn btn--ghost" onClick={openPalette}>Search</button>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { categoryIcon, shopLink } from '../utils/categories';

/** All categories as one connected panel of cells, each with its product count. */
export default function CategoryIndex() {
  const { categories, status } = useCatalog();
  if (status !== 'ready' || categories.length === 0) return null;
  return (
    <section className="catindex" aria-labelledby="catindex-title">
      <header className="rail__head">
        <h2 className="h2" id="catindex-title">Shop by category</h2>
        <Link className="btn btn--ghost btn--sm" to="/shop">All products</Link>
      </header>
      <div className="catindex__grid">
        {categories.map((c) => {
          const Icon = categoryIcon(c.name);
          return (
            <Link key={c.name} to={shopLink({ category: c.name })} className="catcell">
              <Icon size={28} strokeWidth={1.5} className="catcell__icon" />
              <span className="catcell__name">{c.name}</span>
              <span className="catcell__count">{c.count} {c.count === 1 ? 'product' : 'products'}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

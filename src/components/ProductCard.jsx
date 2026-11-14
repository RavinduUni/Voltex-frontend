import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, GitCompare, Heart, Loader2, Plus } from 'lucide-react';
import ProductImage from './ProductImage';
import Price from './Price';
import { useCart } from '../context/CartContext';
import { useLists } from '../context/ListsContext';
import { specChips } from '../utils/specs';
import { flyToCart } from '../lib/motion';

export function stockNote(stock) {
  if (stock == null) return null;
  if (stock <= 0) return { tone: 'out', text: 'Sold out' };
  if (stock <= 5) return { tone: 'low', text: `Only ${stock} left` };
  return null;
}

export default function ProductCard({ product, layout = 'grid', eager = false }) {
  const { add, lineFor, pending } = useCart();
  const { inWishlist, inCompare, toggleWishlist, toggleCompare } = useLists();
  const mediaRef = useRef(null);
  const inCart = lineFor(product.id)?.quantity || 0;
  const busy = Boolean(pending[product.id]);
  const note = stockNote(product.stockQuantity);
  const soldOut = note?.tone === 'out';
  const saved = inWishlist(product.id);
  const comparing = inCompare(product.id);
  const chips = specChips(product.description, layout === 'row' ? 4 : 3);

  const onAdd = async () => {
    const ok = await add(product, 1);
    if (ok) flyToCart(mediaRef.current);
  };

  return (
    <article className={`pcard pcard--${layout} ${soldOut ? 'is-soldout' : ''}`}>
      <Link to={`/product/${product.id}`} className="pcard__media" ref={mediaRef} aria-label={product.name}>
        <ProductImage product={product} width={layout === 'row' ? 220 : 340} eager={eager} />
      </Link>
      {note && <span className={`badge badge--${note.tone} pcard__flag`}>{note.text}</span>}
      <div className="pcard__tools">
        <button
          className={`tool ${saved ? 'is-on' : ''}`}
          onClick={() => toggleWishlist(product)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          title={saved ? 'Saved' : 'Save'}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
        <button
          className={`tool ${comparing ? 'is-on' : ''}`}
          onClick={() => toggleCompare(product)}
          aria-pressed={comparing}
          aria-label={comparing ? `Remove ${product.name} from compare` : `Compare ${product.name}`}
          title={comparing ? 'In compare' : 'Compare'}
        >
          <GitCompare size={16} />
        </button>
      </div>
      <div className="pcard__body">
        {product.category && <span className="pcard__cat">{product.category}</span>}
        <h3 className="pcard__name">
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        {chips.length > 0 && (
          <ul className="chips-spec" aria-label="Key specs">
            {chips.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
        <div className="pcard__foot">
          <Price value={product.price} />
          <button
            className={`add ${inCart ? 'is-in' : ''}`}
            onClick={onAdd}
            disabled={busy || soldOut}
            aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
          >
            {busy ? <Loader2 size={16} className="spin" /> : inCart ? <Check size={16} /> : <Plus size={16} />}
            <span>{soldOut ? 'Sold out' : inCart ? `${inCart} in cart` : 'Add'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

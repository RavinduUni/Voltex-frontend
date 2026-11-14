import { useState } from 'react';
import { initials, pickBy } from '../utils/format';
import { imageUrl } from '../utils/images';

export const TINTS = ['#DCE3FF', '#D3EFE2', '#FFEDBF', '#F7DDE8', '#E4DEF8', '#D5EAF2'];
export const tintFor = (category) => pickBy(category || 'kade', TINTS);

/**
 * Product photo on a tinted plinth. Falls back to a lettered block if the URL is
 * missing or broken. `width` is the displayed width in CSS pixels: ImageKit images
 * are requested at that size (and 2x for sharp screens) instead of full size.
 */
export default function ProductImage({ product, className = '', eager = false, width = 400 }) {
  const [failed, setFailed] = useState(false);
  const tint = tintFor(product?.category);
  const src = product?.imageUrl;
  const showImg = src && !failed;

  return (
    <div className={`plinth ${className}`} style={{ '--tint': tint }}>
      {showImg ? (
        <img
          src={imageUrl(src, width)}
          srcSet={`${imageUrl(src, width)} 1x, ${imageUrl(src, width * 2)} 2x`}
          alt={product.name}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="plinth__fallback" aria-label={product?.name} role="img">
          <span>{initials(product?.name) || '?'}</span>
        </div>
      )}
    </div>
  );
}

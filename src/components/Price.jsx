import { formatPrice, priceParts } from '../utils/format';

/** Price in tabular mono figures, with smaller currency and cents. */
export default function Price({ value, size = 'md', className = '' }) {
  const { symbol, whole, cents } = priceParts(value);
  return (
    <span className={`price price--${size} ${className}`}>
      <span className="sr-only">{formatPrice(value)}</span>
      <span aria-hidden className="price__sym">{symbol}</span>
      <span aria-hidden className="price__whole">{whole}</span>
      <span aria-hidden className="price__cents">.{cents}</span>
    </span>
  );
}

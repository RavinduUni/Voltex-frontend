import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import ProductImage from '../../components/ProductImage';

const blank = { name: '', description: '', price: '', stockQuantity: '', category: '', imageUrl: '', active: true };

export function formFrom(p) {
  if (!p) return { ...blank };
  return {
    name: p.name || '',
    description: p.description || '',
    price: p.price ?? '',
    stockQuantity: p.stockQuantity ?? '',
    category: p.category || '',
    imageUrl: p.imageUrl || '',
    active: p.active !== false,
  };
}

export function validateProduct(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Give the product a name.';
  const price = Number(f.price);
  if (f.price === '' || Number.isNaN(price) || price < 0) e.price = 'Enter a price of 0 or more.';
  const stock = Number(f.stockQuantity);
  if (f.stockQuantity === '' || !Number.isInteger(stock) || stock < 0) e.stockQuantity = 'Enter a whole number of 0 or more.';
  if (f.imageUrl && !/^https?:\/\//i.test(f.imageUrl.trim())) e.imageUrl = 'Use a full link starting with http:// or https://.';
  return e;
}

export const toPayload = (f) => ({
  name: f.name.trim(),
  description: f.description.trim() || null,
  price: Number(f.price),
  stockQuantity: Number(f.stockQuantity),
  category: f.category.trim() || null,
  imageUrl: f.imageUrl.trim() || null,
  active: f.active,
});

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function ProductForm({ initial, categories, onSubmit, submitLabel, busy, formId }) {
  const [form, setForm] = useState(formFrom(initial));
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInput = useRef(null);

  // Local preview of the chosen file; revoked when it changes or the form closes.
  useEffect(() => {
    if (!file) return setPreviewUrl('');
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) {
      setErrors((x) => ({ ...x, image: 'Use a JPG, PNG, WebP, GIF or AVIF image.' }));
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setErrors((x) => ({ ...x, image: 'The image is larger than 5 MB.' }));
      return;
    }
    setErrors((x) => ({ ...x, image: undefined }));
    setFile(f);
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = validateProduct(form);
    // Only check the link if the admin typed a new one; a chosen file replaces it anyway.
    if (file || form.imageUrl === (initial?.imageUrl || '')) delete errs.imageUrl;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const payload = toPayload(form);
    if (file) delete payload.imageUrl; // the upload endpoint sets it
    onSubmit(payload, file);
  };

  const field = (k, label, input, hint) => (
    <div className={`field ${errors[k] ? 'has-error' : ''}`}>
      <label htmlFor={`pf-${k}`}>{label}</label>
      {input}
      {errors[k] ? <span className="field__msg" role="alert">{errors[k]}</span> : hint && <span className="field__hint">{hint}</span>}
    </div>
  );

  return (
    <form id={formId} onSubmit={submit} noValidate className="stack product-form">
      <div className="image-picker">
        <div className="product-form__preview">
          <ProductImage
            width={160}
            key={previewUrl || form.imageUrl}
            product={{ ...form, imageUrl: previewUrl || form.imageUrl, name: form.name || 'New product' }}
          />
        </div>
        <div className="image-picker__actions">
          <input ref={fileInput} type="file" accept={IMAGE_TYPES.join(',')} onChange={pickFile} hidden />
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileInput.current?.click()}>
            <ImagePlus size={15} /> {file || form.imageUrl ? 'Replace image' : 'Upload image'}
          </button>
          {file && (
            <span className="image-picker__file">
              {file.name}
              <button type="button" className="icon-btn icon-btn--sm" aria-label="Remove chosen image" onClick={() => setFile(null)}>
                <X size={13} />
              </button>
            </span>
          )}
          <span className={errors.image ? 'field__msg' : 'field__hint'} role={errors.image ? 'alert' : undefined}>
            {errors.image || 'JPG, PNG, WebP, GIF or AVIF, up to 5 MB. Uploaded when you save.'}
          </span>
        </div>
      </div>
      {field('name', 'Name', <input id="pf-name" value={form.name} onChange={set('name')} />)}
      {field('description', 'Description', <textarea id="pf-description" rows={4} value={form.description} onChange={set('description')} />)}
      <div className="field-row">
        {field('price', 'Price', <input id="pf-price" type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={set('price')} />)}
        {field('stockQuantity', 'Stock', <input id="pf-stockQuantity" type="number" min="0" step="1" inputMode="numeric" value={form.stockQuantity} onChange={set('stockQuantity')} />)}
      </div>
      {field(
        'category',
        'Category',
        <>
          <input id="pf-category" list="pf-categories" value={form.category} onChange={set('category')} />
          <datalist id="pf-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </>,
        'Pick an existing one or type a new one.'
      )}
      {!file && field('imageUrl', 'Or paste an image link', <input id="pf-imageUrl" type="url" placeholder="https://" value={form.imageUrl} onChange={set('imageUrl')} />)}
      <label className="toggle">
        <input type="checkbox" checked={form.active} onChange={set('active')} />
        <span className="toggle__track" aria-hidden />
        <span>Show in shop</span>
      </label>
      <button className="btn btn--primary btn--lg btn--block" disabled={busy}>
        {busy && <Loader2 size={16} className="spin" />} {submitLabel}
      </button>
    </form>
  );
}

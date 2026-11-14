// Test double of the secured Spring Boot API: same routes, statuses, JSON errors and role rules.
import http from 'node:http';

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const makeJwt = (email, mins = 30) => `${b64u({ alg: 'HS256' })}.${b64u({ sub: email, iat: Date.now() / 1000 | 0, exp: (Date.now() / 1000 | 0) + mins * 60 })}.sig`;
const readJwt = (t) => { try { return JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString()); } catch { return null; } };

const svg = (bg, fg, shape) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bg}"/>${shape(fg)}</svg>`);
const shapes = {
  laptop: (c) => `<rect x="90" y="110" width="220" height="140" rx="8" fill="${c}"/><rect x="102" y="122" width="196" height="116" rx="3" fill="#0003"/><path d="M60 262h280l-18 26H78z" fill="${c}"/>`,
  phone: (c) => `<rect x="148" y="70" width="104" height="220" rx="22" fill="${c}"/><rect x="158" y="88" width="84" height="176" rx="10" fill="#0003"/><rect x="186" y="78" width="28" height="6" rx="3" fill="#0005"/>`,
  headphones: (c) => `<path d="M110 220a90 90 0 0 1 180 0" stroke="${c}" stroke-width="22" fill="none"/><rect x="88" y="210" width="50" height="90" rx="20" fill="${c}"/><rect x="262" y="210" width="50" height="90" rx="20" fill="${c}"/>`,
  watch: (c) => `<rect x="168" y="60" width="64" height="60" rx="10" fill="${c}"/><rect x="168" y="280" width="64" height="60" rx="10" fill="${c}"/><circle cx="200" cy="200" r="84" fill="${c}"/><circle cx="200" cy="200" r="66" fill="#0003"/>`,
  console: (c) => `<path d="M150 70h40v260h-40c-14 0-24-10-26-24L112 120c-2-28 14-50 38-50z" fill="${c}"/><path d="M250 70h-40v260h40c14 0 24-10 26-24l12-186c2-28-14-50-38-50z" fill="${c}" opacity=".8"/>`,
  monitor: (c) => `<rect x="60" y="80" width="280" height="170" rx="8" fill="${c}"/><rect x="72" y="92" width="256" height="146" rx="3" fill="#0003"/><rect x="188" y="250" width="24" height="44" fill="${c}"/><rect x="140" y="292" width="120" height="14" rx="7" fill="${c}"/>`,
  camera: (c) => `<rect x="100" y="130" width="200" height="150" rx="18" fill="${c}"/><circle cx="200" cy="205" r="50" fill="#0003"/><circle cx="200" cy="205" r="30" fill="${c}"/><rect x="120" y="112" width="50" height="22" rx="6" fill="${c}"/>`,
  speaker: (c) => `<rect x="130" y="80" width="140" height="240" rx="30" fill="${c}"/><circle cx="200" cy="240" r="46" fill="#0003"/><circle cx="200" cy="140" r="20" fill="#0003"/>`,
  keyboard: (c) => `<rect x="50" y="150" width="300" height="110" rx="12" fill="${c}"/>${Array.from({ length: 3 }, (_, r) => Array.from({ length: 10 }, (_, k) => `<rect x="${66 + k * 27}" y="${166 + r * 28}" width="21" height="20" rx="4" fill="#0003"/>`).join('')).join('')}`,
  earbuds: (c) => `<rect x="120" y="150" width="160" height="120" rx="50" fill="${c}"/><rect x="120" y="190" width="160" height="4" fill="#0003"/><circle cx="200" cy="232" r="6" fill="#0004"/>`,
};
let pid = 0;
const P = (name, category, price, stock, shape, bg, fg, description, extra = {}) => ({
  id: ++pid, name, category, price, stockQuantity: stock, description,
  imageUrl: shape ? svg(bg, fg, shapes[shape]) : null, active: true, ...extra,
});
const products = [
  P('ASUS ROG Strix G16 G614JV Gaming Laptop', 'Laptops', 429900, 5, 'laptop', '#E6E9F2', '#2A2F3A',
    '16-inch gaming laptop built for high-refresh play and creative work.\n\n• Intel Core i7-13650HX (14 cores, 20 threads, up to 4.9 GHz)\n• NVIDIA GeForce RTX 4060 8GB GDDR6, up to 140W\n• 16GB DDR5-4800 RAM\n• 1TB PCIe 4.0 NVMe SSD\n• 16" WUXGA (1920×1200) IPS display, 165Hz\n• Wi-Fi 6E, RGB keyboard, Windows 11 Home\n• Weight: about 2.5 kg'),
  P('Apple iPhone 15 (128GB)', 'Smartphones', 249900, 12, 'phone', '#EEE8E1', '#3A3530',
    "Apple's 2023 iPhone with a 48MP camera, Dynamic Island and USB-C.\n\n• 6.1\" Super Retina XDR OLED display\n• A16 Bionic chip\n• 48MP main camera + 12MP ultra wide\n• 12MP TrueDepth front camera\n• USB-C charging and data\n• IP68 water and dust resistance\n• 128GB storage"),
  P('Sony WH-1000XM5 Wireless Noise Cancelling Headphones', 'Audio', 119900, 8, 'headphones', '#E4E6EA', '#1B1F24',
    'Industry-leading noise cancelling headphones for travel, work and music.\n\n• Noise cancelling with 8 microphones and two processors\n• 30mm drivers with LDAC Hi-Res wireless audio\n• Up to 30 hours of battery with noise cancelling on\n• 3-minute charge gives about 3 hours of playback\n• Multipoint: connect to two devices at once\n• Lightweight design, about 250 g'),
  P('Samsung Galaxy Watch6 (44mm, Bluetooth)', 'Wearables', 84900, 4, 'watch', '#E3E8EE', '#22303F',
    'Slim smartwatch with health tracking and a bright AMOLED screen.\n\n• 1.5" Super AMOLED display\n• Heart rate, ECG and body composition with the BioActive sensor\n• Sleep coaching and workout tracking\n• 5ATM + IP68 water resistance, MIL-STD-810H tested\n• Wear OS powered by Samsung\n• Works with Android phones'),
  P('Sony PlayStation 5 Slim (Disc Edition, 1TB)', 'Gaming', 189900, 6, 'console', '#ECEDEF', '#C9CDD3',
    'The slimmer PS5 with a 1TB SSD and a built-in disc drive.\n\n• Ultra-high-speed 1TB SSD for near-instant loading\n• 4K gaming at up to 120fps on supported TVs\n• Ray tracing for realistic lighting and reflections\n• DualSense wireless controller with haptic feedback\n• Plays PS5 and most PS4 games\n• Ultra HD Blu-ray disc drive'),
  P('LG UltraGear 27GP850-B 27" QHD Gaming Monitor', 'Monitors', 129900, 3, 'monitor', '#E5E7EC', '#2B2F36',
    'Fast 27-inch QHD monitor for competitive gaming and sharp everyday use.\n\n• 27" QHD (2560×1440) Nano IPS panel\n• 165Hz refresh rate, overclockable to 180Hz\n• 1ms (GtG) response time\n• VESA DisplayHDR 400\n• NVIDIA G-SYNC Compatible and AMD FreeSync Premium\n• Height, tilt and pivot adjustable stand'),
  P('GoPro HERO12 Black Action Camera', 'Cameras', 139900, 10, 'camera', '#E2E5EA', '#16191E',
    'Rugged action camera for travel, sports and vlogging.\n\n• 5.3K60 and 4K120 video\n• 27MP photos\n• HyperSmooth 6.0 stabilization\n• HDR video and photos\n• Waterproof to 10 m without a case\n• Enduro battery for longer recording'),
  P('JBL Charge 5 Portable Bluetooth Speaker', 'Audio', 49900, 15, 'speaker', '#E8E6EE', '#3B2F63',
    'Rugged portable speaker with deep bass and a built-in power bank.\n\n• Up to 20 hours of playtime\n• IP67 waterproof and dustproof\n• Charges your phone over USB\n• PartyBoost: pair two JBL speakers'),
  P('Keychron K2 Wireless Mechanical Keyboard', 'Accessories', 32900, 0, 'keyboard', '#E9E9E6', '#4A4A44',
    'Compact 75% mechanical keyboard for Mac and Windows.\n\n• Bluetooth 5.1 and USB-C wired\n• Hot-swappable Gateron switches\n• Up to 72 hours with backlight off\n• Mac and Windows keycaps included'),
  P('Samsung Galaxy Buds2 Pro', 'Audio', 54900, 9, 'earbuds', '#EAE7EF', '#2D2A38',
    'Compact earbuds with active noise cancelling and 24-bit Hi-Fi sound.\n\n• Intelligent active noise cancelling\n• 24-bit Hi-Fi audio with Samsung devices\n• IPX7 water resistance\n• Up to 8 hours playback (ANC off)'),
  P('Logitech MX Master 3S Wireless Mouse', 'Accessories', 29900, 20, null, '', '',
    'Quiet, precise mouse for long work sessions.\n\n• 8000 DPI sensor that tracks on glass\n• Quiet clicks\n• MagSpeed electromagnetic scroll wheel\n• Up to 70 days on a full charge'),
  P('Anker 737 Power Bank (24,000mAh)', 'Accessories', 39900, 7, 'phone', '#E6E8EA', '#33373D',
    'High-capacity power bank that can charge a laptop.\n\n• 24,000mAh capacity\n• 140W total output\n• Smart digital display', { imageUrl: 'https://broken.example.invalid/anker.jpg' }),
  P('Old 1080p Webcam', 'Accessories', 6500, 4, 'camera', '#EEE', '#555', 'Discontinued.', { active: false }),
];

// MOCK_EXTRA_PRODUCTS=40 adds generated products, for testing "Show more" paging.
for (let i = 1; i <= Number(process.env.MOCK_EXTRA_PRODUCTS || 0); i++) {
  products.push(P(`USB-C Cable ${i}m`, 'Accessories', 1500 + i * 100, i % 7 === 0 ? 0 : 20, 'phone', '#E6E8EA', '#5A6270', 'Braided USB-C cable for testing.\n\n• 100W charging\n• USB 3.2 data'));
}

const bcrypt = (p) => '$2a$10$' + Buffer.from(p).toString('base64');
let uid = 0;
const users = [
  { id: ++uid, firstName: 'Dasun', lastName: 'Perera', email: 'dasun@example.com', password: bcrypt('secret1'), phone: '0771234567', role: 'CUSTOMER', address: { id: 1, street: '12 Lake Road', city: 'Nuwara Eliya', state: 'Central', country: 'Sri Lanka', zipcode: '22200' }, createdAt: '2026-10-01T10:00:00', updatedAt: '2026-10-01T10:00:00' },
  { id: ++uid, firstName: 'Admin', lastName: 'Kade', email: 'admin@kade.lk', password: bcrypt('admin123'), phone: null, role: 'ADMIN', address: null, createdAt: '2026-10-01T10:00:00', updatedAt: '2026-10-01T10:00:00' },
];
let cid = 0, oid = 0, oiid = 0;
let cart = [];

const send = (res, status, body) => {
  if (typeof body === 'string') { res.writeHead(status, { 'Content-Type': 'text/plain;charset=UTF-8' }); return res.end(body); }
  if (body === undefined) { res.writeHead(status); return res.end(); }
  res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body));
};
const cartDto = (c) => ({ id: c.id, user: users.find((u) => u.id === c.userId), product: products.find((p) => p.id === c.productId), quantity: c.quantity, price: +(c.price.toFixed(2)) });

const err = (res, status, message) => {
  const reason = { 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict' }[status] || 'Error';
  send(res, status, { status, error: reason, message, timestamp: new Date().toISOString() });
};
const pub = (u) => { if (!u) return u; const { password, ...rest } = u; return rest; };

http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (d) => chunks.push(d));
  req.on('end', () => {
    const buf = Buffer.concat(chunks);
    const url = new URL(req.url, 'http://x');
    const path = url.pathname, m = req.method;
    const isMultipart = (req.headers['content-type'] || '').startsWith('multipart/form-data');
    const raw = isMultipart ? '' : buf.toString();
    let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch { return err(res, 400, "The request body is missing or isn't valid JSON."); }
    console.log(m, req.url);

    // ---- public
    if (m === 'POST' && path === '/api/users/login') {
      const u = users.find((x) => x.email === body.email);
      if (!u || u.password !== bcrypt(body.password || '')) return err(res, 401, 'Email or password is incorrect.');
      return send(res, 201, makeJwt(u.email));
    }
    if (m === 'POST' && path === '/api/users/register') {
      const email = (body.email || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(res, 400, 'Enter a valid email address.');
      if (!body.password || body.password.length < 6) return err(res, 400, 'Password must be at least 6 characters.');
      if (!body.firstName || !body.firstName.trim()) return err(res, 400, 'First name is required.');
      if (users.some((x) => x.email === email)) return err(res, 409, 'An account with that email already exists.');
      const u = { ...body, email, id: ++uid, role: 'CUSTOMER', password: bcrypt(body.password), address: body.address || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      users.push(u); return send(res, 201, { student: pub(u), token: makeJwt(u.email) });
    }

    // ---- everything else needs a valid token; the user comes from the token
    const a = req.headers.authorization;
    if (!a || !a.startsWith('Bearer ')) return err(res, 401, 'Sign in to continue.');
    const claims = readJwt(a.slice(7));
    if (!claims || claims.exp * 1000 < Date.now()) return err(res, 401, 'Your session has expired. Sign in again.');
    const me = users.find((u) => u.email === claims.sub);
    if (!me) return err(res, 401, 'Your account could not be found. Sign in again.');
    const isAdmin = me.role === 'ADMIN';
    const adminOnly = () => (isAdmin ? false : (err(res, 403, "You don't have permission to do that."), true));
    let mm;

    if (m === 'GET' && path === '/api/system/info') { if (adminOnly()) return; return send(res, 200, { OS: 'Linux', Version: '6.8', Architecture: 'amd64', javaVersion: '21.0.4', User: 'app' }); }

    // users
    if (m === 'GET' && path === '/api/users/') { if (adminOnly()) return; return send(res, 200, users.map(pub)); }
    if (m === 'GET' && path === '/api/users/me') return send(res, 200, pub(me));
    if ((mm = path.match(/^\/api\/users\/(\d+)$/))) {
      const id = +mm[1];
      if (!isAdmin && id !== me.id) return err(res, 403, 'You can only view or change your own account.');
      const u = users.find((x) => x.id === id);
      if (!u) return err(res, 404, 'User not found.');
      if (m === 'GET') return send(res, 200, pub(u));
      if (m === 'PUT') {
        for (const [k, v] of Object.entries(body)) {
          if (v == null || ['id', 'createdAt', 'updatedAt', 'email', 'password'].includes(k)) continue;
          if (k === 'role' && !isAdmin) continue;
          if (k === 'address') u.address = { ...(u.address || { id: 99 }), ...Object.fromEntries(Object.entries(v).filter(([kk, vv]) => vv != null && kk !== 'id')) };
          else u[k] = v;
        }
        return send(res, 200, 'User updated successfully');
      }
    }

    // products
    if (m === 'GET' && path === '/api/products/') { if (adminOnly()) return; return send(res, 200, products); }
    if (m === 'GET' && path === '/api/products/active') return send(res, 200, products.filter((p) => p.active));
    if (m === 'GET' && path === '/api/products/catalog') {
      const sp = url.searchParams;
      const page = Math.max(0, Math.min(Number(sp.get('page')) || 0, 10000));
      const size = Math.max(1, Math.min(Number(sp.get('size')) || 24, 60));
      const category = (sp.get('category') || '').trim() || null;
      const words = (sp.get('q') || '').toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
      const sort = ['featured', 'price-asc', 'price-desc', 'name', 'newest'].includes(sp.get('sort')) ? sp.get('sort') : 'featured';
      let list = products.filter((p) => p.active && (!category || p.category === category));
      if (words.length) {
        list = list.filter((p) => { const text = `${p.name} ${p.category} ${p.description}`.toLowerCase(); return words.every((w) => text.includes(w)); });
      }
      const cmp = {
        'price-asc': (a, b) => a.price - b.price || b.id - a.id,
        'price-desc': (a, b) => b.price - a.price || b.id - a.id,
        name: (a, b) => a.name.localeCompare(b.name) || a.id - b.id,
        newest: (a, b) => b.id - a.id,
        featured: (a, b) => (b.stockQuantity > 0) - (a.stockQuantity > 0) || b.id - a.id,
      }[sort];
      list = [...list].sort(cmp);
      const total = list.length;
      return send(res, 200, { content: list.slice(page * size, page * size + size), page, size, totalElements: total,
        totalPages: Math.ceil(total / size), last: (page + 1) * size >= total });
    }
    if (m === 'GET' && path === '/api/products/categories') {
      const counts = {};
      products.filter((p) => p.active && p.category).forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
      return send(res, 200, Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count })));
    }
    if (m === 'GET' && (mm = path.match(/^\/api\/products\/(\d+)$/))) {
      const p = products.find((x) => x.id === +mm[1] && (isAdmin || x.active));
      return p ? send(res, 200, p) : err(res, 404, 'Product not found.');
    }
    if (m === 'GET' && path === '/api/products/search') { const k = (url.searchParams.get('keyword') || '').toLowerCase(); return send(res, 200, products.filter((p) => p.active && p.stockQuantity > 0 && p.name.toLowerCase().includes(k))); }
    if (m === 'POST' && path === '/api/products/') { if (adminOnly()) return; const p = { active: true, ...body, id: ++pid }; products.push(p); return send(res, 201, p); }
    // Stand-in for POST /api/products/{id}/image: keeps the file as a data URL instead of calling ImageKit.
    if (m === 'POST' && (mm = path.match(/^\/api\/products\/(\d+)\/image$/))) {
      if (adminOnly()) return;
      const p = products.find((x) => x.id === +mm[1]);
      if (!p) return err(res, 404, 'Product not found.');
      const bm = (req.headers['content-type'] || '').match(/boundary=(?:"([^"]+)"|([^;]+))/);
      if (!isMultipart || !bm) return err(res, 400, "The upload couldn't be read. Send the image as multipart/form-data.");
      const boundary = Buffer.from('--' + (bm[1] || bm[2]));
      let part = null;
      for (let i = buf.indexOf(boundary); i !== -1; ) {
        const next = buf.indexOf(boundary, i + boundary.length);
        if (next === -1) break;
        const seg = buf.subarray(i + boundary.length + 2, next - 2);
        const headEnd = seg.indexOf('\r\n\r\n');
        const head = seg.subarray(0, headEnd).toString();
        if (/name="file"/.test(head)) part = { head, data: seg.subarray(headEnd + 4) };
        i = next;
      }
      if (!part || !part.data.length) return err(res, 400, 'Choose an image to upload.');
      if (part.data.length > 5 * 1024 * 1024) return err(res, 413, 'The image is too large. The limit is 5 MB.');
      const type = (part.head.match(/Content-Type:\s*([^\r\n]+)/i) || [])[1] || '';
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(type)) return err(res, 400, 'Use a JPG, PNG, WebP, GIF or AVIF image.');
      p.imageUrl = `data:${type};base64,${part.data.toString('base64')}`;
      return send(res, 200, p);
    }
    if ((mm = path.match(/^\/api\/products\/(\d+)$/)) && (m === 'PUT' || m === 'DELETE')) {
      if (adminOnly()) return;
      const p = products.find((x) => x.id === +mm[1]);
      if (!p) return send(res, 404, 'Product not found');
      if (m === 'PUT') { for (const [k, v] of Object.entries(body)) if (v != null && k !== 'id') p[k] = v; return send(res, 200, 'Product updated successfully'); }
      p.active = false; return send(res, 200, 'Product deleted successfully');
    }

    // cart
    if (m === 'POST' && path === '/api/cart/') {
      const qty = body.quantity;
      if (!body.product?.id) return err(res, 400, 'Choose a product to add.');
      if (!Number.isInteger(qty) || qty < 1) return err(res, 400, 'Quantity must be at least 1.');
      const p = products.find((x) => x.id === body.product.id && x.active);
      if (!p) return err(res, 404, 'That product is no longer available.');
      const ex = cart.find((c) => c.userId === me.id && c.productId === p.id);
      const have = ex ? ex.quantity : 0;
      if (have + qty > p.stockQuantity) return err(res, 409, p.stockQuantity <= 0 ? `${p.name} is sold out.` : `Only ${p.stockQuantity} of ${p.name} in stock.`);
      if (ex) { ex.quantity += qty; ex.price = p.price * ex.quantity; }
      else cart.push({ id: ++cid, userId: me.id, productId: p.id, quantity: qty, price: p.price * qty });
      return send(res, 200, 'Item added successfully');
    }
    if (m === 'GET' && path === '/api/cart/') { if (adminOnly()) return; return send(res, 200, cart.map(cartDto).map((c) => ({ ...c, user: pub(c.user) }))); }
    if (m === 'GET' && path === '/api/cart/items') return send(res, 200, cart.filter((c) => c.userId === me.id).map(cartDto).map((c) => ({ ...c, user: pub(c.user) })));
    if (m === 'DELETE' && (mm = path.match(/^\/api\/cart\/(\d+)$/))) {
      if (!products.some((p) => p.id === +mm[1])) return err(res, 404, 'Product not found.');
      const before = cart.length; cart = cart.filter((c) => !(c.userId === me.id && c.productId === +mm[1]));
      if (before === cart.length) return err(res, 404, "That item isn't in your cart.");
      return send(res, 200, 'Item removed successfully');
    }

    // order: all-or-nothing stock reservation at the current price
    if (m === 'POST' && path === '/api/order/') {
      const mine = cart.filter((c) => c.userId === me.id);
      if (!mine.length) return err(res, 400, 'Your cart is empty.');
      for (const c of mine) {
        const p = products.find((x) => x.id === c.productId);
        if (!p.active) return err(res, 409, `${p.name} is no longer available. Remove it from your cart to continue.`);
        if (p.stockQuantity < c.quantity) return err(res, 409, `Not enough stock for ${p.name}. Update your cart and try again.`);
      }
      const items = mine.map((c) => { const p = products.find((x) => x.id === c.productId); p.stockQuantity -= c.quantity; return { id: ++oiid, product: { ...p }, quantity: c.quantity, price: p.price * c.quantity }; });
      const o = { id: ++oid, user: pub(me), totalAmount: +items.reduce((n, i) => n + i.price, 0).toFixed(2), status: 'CONFIRMED', items };
      cart = cart.filter((c) => c.userId !== me.id); return send(res, 201, o);
    }

    err(res, 404, 'Not Found');
  });
}).listen(5000, () => console.log('mock API on http://localhost:5000'));

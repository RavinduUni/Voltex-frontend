import api from './client';

/*
 * Every endpoint exposed by the Spring Boot controllers.
 * Spring Boot 3+/4 matches trailing slashes strictly, so routes mapped with
 * @GetMapping("/") / @PostMapping("/") must be called WITH the slash, e.g. /products/.
 */

// ---------- Users  (/api/users) ----------
export const authApi = {
  /** POST /users/register → { student: User, token: string } */
  register: (payload) => api.post('/users/register', payload).then((r) => r.data),
  /** POST /users/login → JWT string (subject = email, valid 30 minutes) */
  login: (email, password) => api.post('/users/login', { email, password }).then((r) => r.data),
};

export const userApi = {
  /** GET /users/me → the signed-in user */
  me: () => api.get('/users/me').then((r) => r.data),
  /** GET /users/ → User[] (admin only) */
  list: () => api.get('/users/').then((r) => r.data),
  /** GET /users/{id} → User (yourself, or anyone for an admin) */
  get: (id) => api.get(`/users/${id}`).then((r) => r.data),
  /**
   * PUT /users/{id} → "User updated successfully"
   * Null fields are ignored. The backend ignores email and password here, and
   * role unless the caller is an admin.
   */
  update: (id, patch) => api.put(`/users/${id}`, patch).then((r) => r.data),
};

// ---------- Products  (/api/products) ----------
export const productApi = {
  /** GET /products/ → all products, including hidden ones (admin only) */
  all: () => api.get('/products/').then((r) => r.data),
  /**
   * GET /products/catalog → one page: { content, page, size, totalElements, totalPages, last }
   * params: page, size (max 60), category, q, sort (featured | price-asc | price-desc | name | newest)
   */
  catalog: ({ page = 0, size = 24, category, q, sort } = {}) =>
    api
      .get('/products/catalog', { params: { page, size, category: category || undefined, q: q || undefined, sort } })
      .then((r) => r.data),
  /** GET /products/categories → [{ name, count }] for active products */
  categories: () => api.get('/products/categories').then((r) => r.data),
  /** GET /products/{id} → one product (hidden ones for admins only) */
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  /** GET /products/active → every active product (older, unpaged; kept for compatibility) */
  active: () => api.get('/products/active').then((r) => r.data),
  /** GET /products/search?keyword= → active, in-stock products whose name matches */
  search: (keyword) => api.get('/products/search', { params: { keyword } }).then((r) => r.data),
  /** POST /products/ → created Product (201, admin only) */
  create: (product) => api.post('/products/', product).then((r) => r.data),
  /** PUT /products/{id} → "Product updated successfully" (null fields ignored) */
  update: (id, patch) => api.put(`/products/${id}`, patch).then((r) => r.data),
  /**
   * POST /products/{id}/image (multipart, field "file") → updated Product with the
   * ImageKit URL in imageUrl (admin only). axios sets the multipart boundary itself.
   */
  uploadImage: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/products/${id}/image`, form, { timeout: 90000 }).then((r) => r.data);
  },
  /** DELETE /products/{id} → soft delete, sets active = false */
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};

// ---------- Cart  (/api/cart) — the user comes from the token ----------
/** Success answers are plain-text messages; failures are 4xx JSON errors with a `message`. */
const expectMessage = (expected) => (r) => {
  const msg = typeof r.data === 'string' ? r.data : '';
  if (msg !== expected) {
    const err = new Error(msg || 'Unexpected response from the server');
    err.backendMessage = msg;
    throw err;
  }
  return msg;
};

export const cartApi = {
  /** GET /cart/items → CartItem[] for the current user */
  items: () => api.get('/cart/items').then((r) => r.data),
  /** POST /cart/ → adds `quantity` (increments when the product is already in the cart) */
  add: (productId, quantity = 1) =>
    api
      .post('/cart/', { product: { id: productId }, quantity })
      .then(expectMessage('Item added successfully')),
  /** DELETE /cart/{productId} → removes the whole line */
  remove: (productId) => api.delete(`/cart/${productId}`).then(expectMessage('Item removed successfully')),
  /** GET /cart/ → every user's cart lines (admin only) */
  all: () => api.get('/cart/').then((r) => r.data),
};

// ---------- Orders  (/api/order) ----------
export const orderApi = {
  /** POST /order/ → Order (201). 400 when the cart is empty, 409 when stock ran out. Clears the cart. */
  place: () => api.post('/order/').then((r) => r.data),
};

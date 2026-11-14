# Voltix (black edition) — React frontend for the Spring Boot e-commerce API

Same pages and features as the light edition, with a black colour scheme.
All colours live as variables at the top of `src/styles/global.css`.

React 18 + Vite + React Router + axios + GSAP. Uses the existing backend API unchanged.

## Pages

Home, Shop (filters, sort, grid/list, infinite scroll), Product, Compare, Wishlist,
Cart, Checkout, Order receipt, Orders, Profile, Help/FAQ, Admin, 404.
Press Ctrl+K (⌘K on Mac) or "/" anywhere to search.

## Things to edit before going live

- `src/content.js`: support email, phone, hours, delivery/returns text and FAQ answers
  (the returns policy there is a placeholder).
- `src/config.js`: store name, compare limit.
- Product descriptions: write specs as bullet lines (`• 16GB DDR5 RAM`, or
  `• Weight: 2.5 kg`). The UI turns them into spec chips, the spec table and the
  compare rows (see `src/utils/specs.js`).

## Notes

- Wishlist and compare selections are stored in the browser (the API has no endpoints
  for them), per signed-in user.
- All animations respect the system "reduce motion" setting.

## Run it

```bash
npm install
cp .env.example .env      # optional, defaults work for localhost
npm run dev               # http://localhost:5173
```

Start the Spring Boot app first (it listens on port **5000**). Vite proxies every
`/api/*` request to it.

No database handy? `npm run mock` starts a stand-in API on port 5000 with sample
products and the same access rules as the secured backend. Accounts: `dasun@example.com` / `secret1` (customer) and
`admin@kade.lk` / `admin123` (admin).

## Calling the API

**Development:** the Vite proxy in `vite.config.js` forwards `/api/*` to the backend.

**Production, two options:**
- Keep the proxy approach: serve the frontend and forward `/api/*` from the same domain.
  `vercel.json` does this on Vercel; replace `YOUR-BACKEND-HOST`.
  With Nginx: `location /api/ { proxy_pass http://127.0.0.1:5000; }`.
- Or call the backend directly: add your site to the backend's `CORS_ALLOWED_ORIGINS`
  and set `VITE_API_BASE_URL=https://your-api-host/api` when building.

## How the frontend uses each endpoint

| Endpoint | Used for |
|---|---|
| `POST /api/users/register` | Create account (returns `{ student, token }`) |
| `POST /api/users/login` | Sign in (returns a JWT string) |
| `GET /api/users/me` | Load the signed-in user after login and on reload |
| `GET /api/users/` | Admin customer list |
| `PUT /api/users/{id}` | Profile and delivery address (never sends email or password) |
| `GET /api/products/active` | The shop |
| `GET /api/products/search?keyword=` | Search box (in-stock items only) |
| `GET /api/products/` | Admin product list (includes hidden products) |
| `POST /api/products/`, `PUT /api/products/{id}` | Admin add / edit / show again |
| `DELETE /api/products/{id}` | Admin hide (soft delete) |
| `POST /api/cart/` | Add to cart, increase quantity |
| `DELETE /api/cart/{productId}` | Remove line; with re-add, decrease quantity |
| `GET /api/cart/items` | Current user's cart |
| `GET /api/cart/` | Admin "Open carts" |
| `POST /api/order/` | Place order |
| `GET /api/system/info` | Server line on the admin page |

All calls are in `src/api/endpoints.js`. The `Authorization` header is added in
`src/api/client.js`; the backend works out the user from the token.

## Behaviour worth knowing

- Sessions end when the JWT expires (30 minutes); the app signs out and says so.
  A 401 signs you out; a 403 (not allowed) only shows an error.
- There is no "list my orders" endpoint, so order receipts are stored in the browser
  (`localStorage`) and the Orders page shows orders placed on that device.
- The admin area appears for users whose `role` is `ADMIN`, and the backend enforces
  the same rule. See the backend's `SECURITY_CHANGES.md` for how to make an admin.

## Customising

- Store name, currency, API base: `src/config.js` and `.env`
- Colours, type and spacing tokens: top of `src/styles/global.css`

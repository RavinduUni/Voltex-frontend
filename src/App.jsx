import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';
import { CartProvider } from './context/CartContext';
import { ListsProvider } from './context/ListsContext';
import Layout from './components/Layout';
import { GuestOnly, RequireAdmin, RequireAuth } from './components/Guards';
import { Spinner } from './components/States';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';

// Loaded on demand: each becomes its own small file in the build.
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

const Loading = () => <div className="page-center"><Spinner /></div>;

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CatalogProvider>
            <CartProvider>
              <ListsProvider>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <Route path="/signin" element={<GuestOnly><AuthPage /></GuestOnly>} />
                    <Route element={<RequireAuth><Layout /></RequireAuth>}>
                      <Route index element={<HomePage />} />
                      <Route path="shop" element={<ShopPage />} />
                      <Route path="product/:id" element={<ProductPage />} />
                      <Route path="compare" element={<Suspense fallback={<Loading />}><ComparePage /></Suspense>} />
                      <Route path="wishlist" element={<Suspense fallback={<Loading />}><WishlistPage /></Suspense>} />
                      <Route path="cart" element={<Suspense fallback={<Loading />}><CartPage /></Suspense>} />
                      <Route path="checkout" element={<Suspense fallback={<Loading />}><CheckoutPage /></Suspense>} />
                      <Route path="orders" element={<Suspense fallback={<Loading />}><OrdersPage /></Suspense>} />
                      <Route path="orders/:id" element={<Suspense fallback={<Loading />}><OrderPage /></Suspense>} />
                      <Route path="profile" element={<Suspense fallback={<Loading />}><ProfilePage /></Suspense>} />
                      <Route path="help" element={<Suspense fallback={<Loading />}><HelpPage /></Suspense>} />
                      <Route path="admin" element={<RequireAdmin><Suspense fallback={<Loading />}><AdminPage /></Suspense></RequireAdmin>} />
                      <Route path="*" element={<Suspense fallback={<Loading />}><NotFoundPage /></Suspense>} />
                    </Route>
                  </Routes>
                </Suspense>
              </ListsProvider>
            </CartProvider>
          </CatalogProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

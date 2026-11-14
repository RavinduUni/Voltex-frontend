import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './States';

export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'checking') return <div className="page-center"><Spinner /></div>;
  if (status !== 'authed') return <Navigate to="/signin" replace state={{ from: location }} />;
  return children;
}

export function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export function GuestOnly({ children }) {
  const { status } = useAuth();
  if (status === 'checking') return <div className="page-center"><Spinner /></div>;
  if (status === 'authed') return <Navigate to="/" replace />;
  return children;
}

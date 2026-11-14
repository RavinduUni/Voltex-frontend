import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi, userApi } from '../api/endpoints';
import { onUnauthorized } from '../api/client';
import { session } from '../utils/storage';
import { tokenExpiry } from '../utils/format';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

// Older backends included the password hash in user responses; keep it out of app state.
const clean = (u) => {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
};

const looksLikeJwt = (t) => typeof t === 'string' && t.split('.').length === 3;

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking'); // checking | authed | guest
  const expiryTimer = useRef(null);

  const logout = useCallback(
    (reason) => {
      clearTimeout(expiryTimer.current);
      session.clear();
      setUser(null);
      setStatus('guest');
      if (reason === 'expired') {
        toast.info('Your session ended', { body: 'Sign in again to keep shopping.' });
      }
    },
    [toast]
  );

  const scheduleExpiry = useCallback(
    (token) => {
      clearTimeout(expiryTimer.current);
      const exp = tokenExpiry(token);
      if (!exp) return;
      const ms = exp - Date.now();
      if (ms <= 0) return logout('expired');
      // setTimeout is capped near 24.8 days; tokens here live 30 minutes.
      expiryTimer.current = setTimeout(() => logout('expired'), Math.min(ms, 2 ** 31 - 1));
    },
    [logout]
  );

  // Restore a saved session on first load.
  useEffect(() => {
    const { token } = session.get();
    const exp = token && tokenExpiry(token);
    if (!token || (exp && exp < Date.now())) {
      session.clear();
      setStatus('guest');
      return;
    }
    userApi
      .me()
      .then((u) => {
        setUser(clean(u));
        setStatus('authed');
        scheduleExpiry(token);
      })
      .catch(() => {
        session.clear();
        setStatus('guest');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => onUnauthorized(() => logout('expired')), [logout]);
  useEffect(() => () => clearTimeout(expiryTimer.current), []);

  const login = useCallback(
    async (email, password) => {
      const token = await authApi.login(email.trim(), password);
      if (!looksLikeJwt(token)) throw new Error('Email or password is incorrect.');
      session.set({ token });

      // Login returns only a token; fetch the profile that belongs to it.
      let me;
      try {
        me = await userApi.me();
      } catch {
        session.clear();
        throw new Error('Signed in, but your account details could not be loaded.');
      }
      session.set({ token, userId: me.id });
      setUser(clean(me));
      setStatus('authed');
      scheduleExpiry(token);
      return clean(me);
    },
    [scheduleExpiry]
  );

  const register = useCallback(
    async (payload) => {
      const res = await authApi.register(payload);
      const token = res?.token;
      const me = res?.student;
      if (!looksLikeJwt(token) || !me?.id) throw new Error('The account could not be created.');
      session.set({ token, userId: me.id });
      setUser(clean(me));
      setStatus('authed');
      scheduleExpiry(token);
      return clean(me);
    },
    [scheduleExpiry]
  );

  const refreshUser = useCallback(async () => {
    if (!user?.id) return null;
    const fresh = clean(await userApi.get(user.id));
    setUser(fresh);
    return fresh;
  }, [user?.id]);

  /** Partial update. Email and password are never sent (see userApi.update). */
  const updateProfile = useCallback(
    async (patch) => {
      const { email, password, id, role, createdAt, updatedAt, ...safe } = patch;
      await userApi.update(user.id, safe);
      return refreshUser();
    },
    [user?.id, refreshUser]
  );

  const value = useMemo(
    () => ({
      user,
      status,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
    }),
    [user, status, login, register, logout, refreshUser, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

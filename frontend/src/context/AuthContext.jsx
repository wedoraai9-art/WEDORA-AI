import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiMe, clearToken, getToken } from '@/lib/auth';

const AuthCtx = createContext({ user: null, vendor: null, loading: true, refresh: async () => {}, logout: () => {} });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setVendor(null); setLoading(false); return; }
    try {
      const data = await apiMe();
      setUser({ id: data.id, email: data.email, name: data.name, role: data.role });
      setVendor(data.vendor || null);
    } catch {
      clearToken();
      setUser(null); setVendor(null);
    }
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null); setVendor(null);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <AuthCtx.Provider value={{ user, vendor, loading, refresh, logout }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);

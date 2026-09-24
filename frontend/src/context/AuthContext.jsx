import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiMe, apiVendorMe, clearToken, getToken } from '@/lib/auth';

const AuthCtx = createContext({
  user: null,
  vendor: null,
  loading: true,
  refresh: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setUser(null);
      setVendor(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiMe();

      // /api/auth/me returns { user: {...} }.
      // Support both the current response shape and the older direct-user shape.
      const authUser = data?.user || data;

      if (!authUser?.id || !authUser?.role) {
        throw new Error('Invalid authentication response');
      }

      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        role: authUser.role,
      });

      // Vendor users get their vendor profile separately.
      // This keeps authentication independent from the vendor dashboard API.
      if (authUser.role === 'vendor' || authUser.role === 'admin') {
        try {
          const vendorData = await apiVendorMe();
          setVendor(vendorData?.vendor || null);
        } catch {
          setVendor(null);
        }
      } else {
        setVendor(authUser.vendor || null);
      }
    } catch {
      clearToken();
      setUser(null);
      setVendor(null);
    }

    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setVendor(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthCtx.Provider value={{ user, vendor, loading, refresh, logout }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);

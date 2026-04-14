import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState({ logoUrl: null, themeColor: '#059669' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('aprovaflow-token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(async res => {
          setUser(res.data.user);
          localStorage.setItem('aprovaflow-tenant', res.data.tenantId);
          try {
            const tenantRes = await api.get('/tenantsSettings');
            if (tenantRes.data) setTenant(tenantRes.data);
          } catch(e) {}
        })
        .catch(() => {
          localStorage.removeItem('aprovaflow-token');
          localStorage.removeItem('aprovaflow-tenant');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user, tenantId } = res.data;
    localStorage.setItem('aprovaflow-token', token);
    localStorage.setItem('aprovaflow-tenant', tenantId);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    try {
      const tenantRes = await api.get('/tenantsSettings');
      if (tenantRes.data) setTenant(tenantRes.data);
    } catch(e) {}
    return user;
  };

  const register = async (name, email, password, agencyName) => {
    const res = await api.post('/auth/register', { name, email, password, agencyName });
    const { token, user, tenantId } = res.data;
    localStorage.setItem('aprovaflow-token', token);
    localStorage.setItem('aprovaflow-tenant', tenantId);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    try {
      const tenantRes = await api.get('/tenantsSettings');
      if (tenantRes.data) setTenant(tenantRes.data);
    } catch(e) {}
    return user;
  };

  const logout = () => {
    localStorage.removeItem('aprovaflow-token');
    localStorage.removeItem('aprovaflow-tenant');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setTenant({ logoUrl: null, themeColor: '#059669' });
  };

  const updateTenantSettings = (newSettings) => {
    setTenant(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, register, logout, updateTenantSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

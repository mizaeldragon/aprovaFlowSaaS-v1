import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();
const DEFAULT_BRAND = '#22D3EE';

function hexToRgbTuple(hex) {
  const value = String(hex || '').trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return [r, g, b];
}

function clampChannel(channel) {
  return Math.max(0, Math.min(255, Math.round(channel)));
}

function rgbToHex(r, g, b) {
  const toHex = (n) => clampChannel(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixWithWhite([r, g, b], amount = 0.2) {
  return [
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  ];
}

function applyBrandTheme(color) {
  const rgb = hexToRgbTuple(color) || hexToRgbTuple(DEFAULT_BRAND);
  const root = document.documentElement;
  if (!rgb || !root) return;

  const lightRgb = mixWithWhite(rgb, 0.18);
  const luminance = (0.2126 * clampChannel(rgb[0]) + 0.7152 * clampChannel(rgb[1]) + 0.0722 * clampChannel(rgb[2])) / 255;
  const onBrand = luminance > 0.58 ? '#06111F' : '#F8FAFC';
  root.style.setProperty('--brand-color', rgbToHex(rgb[0], rgb[1], rgb[2]));
  root.style.setProperty('--brand-color-light', rgbToHex(lightRgb[0], lightRgb[1], lightRgb[2]));
  root.style.setProperty('--brand-rgb', `${clampChannel(rgb[0])}, ${clampChannel(rgb[1])}, ${clampChannel(rgb[2])}`);
  root.style.setProperty('--brand-on', onBrand);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState({ logoUrl: null, themeColor: '#059669', customDomain: '', isPro: false });
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

  useEffect(() => {
    applyBrandTheme(tenant?.themeColor || DEFAULT_BRAND);
  }, [tenant?.themeColor]);

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
    setTenant({ logoUrl: null, themeColor: DEFAULT_BRAND, customDomain: '', isPro: false });
    applyBrandTheme(DEFAULT_BRAND);
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

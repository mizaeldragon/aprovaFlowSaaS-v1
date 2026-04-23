import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, tenant, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600 animate-pulse">Carregando Sessão do SaaS...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const billingBlocked = Boolean(
    tenant?.billingRequired && tenant?.canAccessApp === false
  );
  const path = location.pathname || '';
  const canAccessWhileBlocked =
    path.startsWith('/settings') ||
    path.startsWith('/billing/success') ||
    path.startsWith('/billing/cancelled');

  if (billingBlocked && !canAccessWhileBlocked) {
    return <Navigate to="/settings?tab=dados&billing=required" replace />;
  }
  
  return children;
}

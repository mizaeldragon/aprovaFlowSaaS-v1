import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProFeatureRoute({ children }) {
  const { user, tenant, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600 animate-pulse">Carregando Sessao...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!tenant?.isPro && tenant?.plan !== 'PRO') {
    return <Navigate to="/settings?tab=dados" replace />;
  }

  return children;
}

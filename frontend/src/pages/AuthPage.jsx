import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState(location.pathname === '/register' ? 'register' : 'login');
  
  // Mantém a URL no navegador sincronizada com a aba atual de forma suave
  useEffect(() => {
    if (tab === 'login' && location.pathname !== '/login') {
      window.history.replaceState(null, '', '/login');
    } else if (tab === 'register' && location.pathname !== '/register') {
      window.history.replaceState(null, '', '/register');
    }
  }, [tab, location.pathname]);

  const [form, setForm] = useState({ agencyName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.agencyName);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || (tab === 'login' ? 'Erro ao realizar login.' : 'Erro ao cadastrar.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/apv-logo.png" alt="AprovaFlow Logo" className="h-11 w-auto mb-6" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {tab === 'login' ? 'Faça login na sua conta' : 'Crie seu Workspace'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
             {tab === 'login' ? 'Bem-vindo de volta ao AprovaFlow.' : 'Transforme a rotina da sua agência.'}
          </p>
        </div>

        {/* Toggle Elegante */}
        <div className="mb-8 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === 'login'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Fazer Login
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === 'register'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Criar Conta
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div className="animate-fade-in">
              <label className="text-sm font-semibold text-slate-900 mb-1.5 block">Nome da Agência / Equipe</label>
              <input required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" value={form.agencyName} onChange={e => setForm({...form, agencyName: e.target.value})} placeholder="Ex: Studio Alpha" />
            </div>
          )}
          {tab === 'register' && (
            <div className="animate-fade-in mt-4">
              <label className="text-sm font-semibold text-slate-900 mb-1.5 block">Seu Nome Completo</label>
              <input required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Seu nome" />
            </div>
          )}
          
          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-900 mb-1.5 block">
              {tab === 'login' ? 'Email Corporativo' : 'E-mail'}
            </label>
            <input type="email" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="exemplo@agencia.com" />
          </div>
          
          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-900 mb-1.5 block">
              {tab === 'login' ? 'Senha de Acesso' : 'Criar Senha Segura'}
            </label>
            <input type="password" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
          
          <button type="submit" disabled={loading} className="mt-6 w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 border-none text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center">
            {loading ? 'Processando...' : (tab === 'login' ? 'Entrar no Sistema' : 'Começar Gratuitamente')}
          </button>
        </form>
      </div>
    </div>
  );
}

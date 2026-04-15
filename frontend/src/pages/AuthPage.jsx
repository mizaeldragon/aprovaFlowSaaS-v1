import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState(location.pathname === '/register' ? 'register' : 'login');

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.20),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.16),transparent_48%),linear-gradient(180deg,rgba(2,6,23,0.05),rgba(2,6,23,0.75))]"></div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-cyan-400/25 bg-[#04122A]/95 p-8 shadow-[0_20px_60px_rgba(2,12,27,0.75)]">
        <div className="pointer-events-none absolute -bottom-20 left-1/2 h-40 w-[85%] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl"></div>
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/apv-logo.png" alt="AprovaFlow Logo" className="mb-6 h-11 w-auto" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            {tab === 'login' ? 'Faca login na sua conta' : 'Crie seu workspace'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {tab === 'login' ? 'Bem-vindo de volta ao AprovaFlow.' : 'Transforme a rotina da sua agencia.'}
          </p>
        </div>

        <div className="mb-8 flex rounded-xl border border-slate-700 bg-[#111827] p-1">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === 'login' ? 'bg-[#061630] text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.14)]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fazer login
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError('');
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === 'register' ? 'bg-[#061630] text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.14)]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div className="animate-fade-in">
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">Nome da agencia / equipe</label>
              <input
                required
                className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                value={form.agencyName}
                onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                placeholder="Ex: Studio Alpha"
              />
            </div>
          )}

          {tab === 'register' && (
            <div className="animate-fade-in mt-4">
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">Seu nome completo</label>
              <input
                required
                className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Seu nome"
              />
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">
              {tab === 'login' ? 'Email corporativo' : 'E-mail'}
            </label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="exemplo@agencia.com"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">
              {tab === 'login' ? 'Senha de acesso' : 'Criar senha segura'}
            </label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="********"
            />
          </div>

          {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center rounded-xl border border-cyan-300/30 bg-gradient-to-r from-[#22d3ee] via-[#06b6d4] to-[#0ea5e9] px-4 py-3.5 font-semibold text-[#021220] shadow-[0_0_30px_rgba(34,211,238,0.35)] transition-all hover:from-[#67e8f9] hover:via-[#22d3ee] hover:to-[#38bdf8]"
          >
            {loading ? 'Processando...' : tab === 'login' ? 'Entrar no sistema' : 'Comecar gratuitamente'}
          </button>
        </form>
      </div>
    </div>
  );
}

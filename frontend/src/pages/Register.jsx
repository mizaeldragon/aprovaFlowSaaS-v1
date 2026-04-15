import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ agencyName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.agencyName);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro interno ao registrar agencia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.20),transparent_38%),radial-gradient(circle_at_90%_5%,rgba(56,189,248,0.14),transparent_45%)]"></div>
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-cyan-400/25 bg-[#04122A]/95 p-8 shadow-[0_20px_60px_rgba(2,12,27,0.75)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/apv-logo.png" alt="AprovaFlow Logo" className="mb-6 h-11 w-auto" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Crie seu workspace</h2>
          <p className="mt-2 text-sm text-slate-400">Transforme a rotina de aprovacoes da sua agencia.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Nome da agencia / equipe</label>
            <input
              required
              className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              value={form.agencyName}
              onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
              placeholder="Ex: Studio Alpha"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Seu nome completo</label>
            <input
              required
              className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">E-mail corporativo</label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="exemplo@agencia.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Criar senha de acesso</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="********"
            />
          </div>
          {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-xl border border-cyan-300/30 bg-gradient-to-r from-[#22d3ee] via-[#06b6d4] to-[#0ea5e9] px-4 py-3 font-semibold text-[#021220] shadow-[0_0_30px_rgba(34,211,238,0.35)] transition-all hover:from-[#67e8f9] hover:via-[#22d3ee] hover:to-[#38bdf8]"
          >
            {loading ? 'Preparando ambiente...' : 'Criar conta gratis'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-400">
          Ja tem conta?{' '}
          <Link to="/login" className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}

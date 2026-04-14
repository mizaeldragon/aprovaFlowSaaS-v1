import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';

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
      navigate('/dashboard'); // Entra no SaaS direto após o cadastro
    } catch (err) {
      setError(err.response?.data?.error || 'Erro interno ao registrar agência.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/apv-logo.png" alt="AprovaFlow Logo" className="h-11 w-auto mb-6" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Crie seu Workspace</h2>
          <p className="mt-2 text-sm text-slate-500 text-center">Transforme a rotina de aprovações da sua agência em Mágica hoje mesmo.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-900 mb-1.5 block">Nome da Agência / Equipe</label>
            <input required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" value={form.agencyName} onChange={e => setForm({...form, agencyName: e.target.value})} placeholder="Ex: Studio Alpha" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900 mb-1.5 block">Seu Nome Completo</label>
            <input required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Seu nome" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900 mb-1.5 block">E-mail Corporativo</label>
            <input type="email" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="exemplo@agencia.com" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900 mb-1.5 block">Criar Senha de Acesso</label>
            <input type="password" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
          <button type="submit" disabled={loading} className="mt-2 w-full bg-slate-900 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center">
            {loading ? 'Preparando infraestrutura...' : 'Criar Conta Grátis'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-600">
          Já faz parte do futuro? <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline">Fazer Login</Link>
        </p>
      </div>
    </div>
  );
}

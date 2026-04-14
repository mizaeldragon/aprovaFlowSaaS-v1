import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard'); // Vai direto para o painel de aprovações
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/apv-logo.png" alt="AprovaFlow Logo" className="h-11 w-auto mb-6" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Bem-vindo de volta</h2>
          <p className="mt-2 text-sm text-slate-500">Acesse o painel da sua Agência.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-900 mb-1.5 block">Email Institucional</label>
            <input type="email" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="voce@agencia.com" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900 mb-1.5 block">Senha Mestra</label>
            <input type="password" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center">
            {loading ? 'Validando Acesso...' : 'Entrar no Sistema'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-600">
          Ainda não somos parceiros? <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">Montar operação</Link>
        </p>
      </div>
    </div>
  );
}

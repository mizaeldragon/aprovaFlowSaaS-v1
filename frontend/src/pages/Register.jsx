import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateRegisterInput } from '../utils/authValidation';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ agencyName: '', name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validation = useMemo(() => validateRegisterInput(form), [form]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await register(
        validation.normalized.name,
        validation.normalized.email,
        validation.normalized.password,
        validation.normalized.agencyName
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro interno ao registrar agencia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-4 py-12"
      style={{ '--brand-color': '#00E5FF', '--brand-color-light': '#7DEBFF', '--brand-rgb': '0, 229, 255' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,229,255,0.20),transparent_38%),radial-gradient(circle_at_90%_5%,rgba(0,184,255,0.14),transparent_45%)]" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#00E5FF]/28 bg-[#04122A]/95 p-8 shadow-[0_20px_60px_rgba(2,12,27,0.75)]">
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
              className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20"
              value={form.agencyName}
              onChange={(e) => updateField('agencyName', e.target.value)}
              placeholder="Ex: Studio Alpha"
            />
            {fieldErrors.agencyName ? <p className="mt-1 text-xs font-medium text-rose-300">{fieldErrors.agencyName}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Seu nome completo</label>
            <input
              required
              className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Seu nome"
            />
            {fieldErrors.name ? <p className="mt-1 text-xs font-medium text-rose-300">{fieldErrors.name}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">E-mail corporativo</label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="exemplo@agencia.com"
            />
            {fieldErrors.email ? <p className="mt-1 text-xs font-medium text-rose-300">{fieldErrors.email}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Criar senha de acesso</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 pr-12 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00E5FF] transition-colors hover:text-[#7DEBFF]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password ? <p className="mt-1 text-xs font-medium text-rose-300">{fieldErrors.password}</p> : null}
          </div>
          {error ? <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p> : null}
          <button
            type="submit"
            disabled={loading || !validation.isValid}
            className="mt-2 flex w-full items-center justify-center rounded-xl border border-[#00E5FF]/35 bg-gradient-to-r from-[#00E5FF] via-[#00CCFF] to-[#00B8FF] px-4 py-3 font-semibold text-[#021220] shadow-[0_0_30px_rgba(0,229,255,0.35)] transition-all hover:from-[#7DEBFF] hover:via-[#00E5FF] hover:to-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Preparando ambiente...' : 'Criar conta'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-400">
          Ja tem conta?{' '}
          <Link to="/login" className="font-semibold text-[#00E5FF] hover:text-[#7DEBFF] hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}

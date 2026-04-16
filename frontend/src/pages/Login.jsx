import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateLoginInput } from '../utils/authValidation';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validation = useMemo(() => validateLoginInput(form), [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await login(validation.normalized.email, validation.normalized.password);
      navigate('/dashboard');
    } catch (err) {
      const apiError = err.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.';
      const normalizedError = String(apiError).toLowerCase();

      if (normalizedError.includes('e-mail nao cadastrado') || normalizedError.includes('email nao cadastrado')) {
        setFieldErrors((prev) => ({ ...prev, email: 'E-mail nao cadastrado.' }));
        setError('');
        return;
      }
      if (normalizedError.includes('senha incorreta')) {
        setFieldErrors((prev) => ({ ...prev, password: 'Senha incorreta.' }));
        setError('');
        return;
      }

      setError(apiError);
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Bem-vindo de volta</h2>
          <p className="mt-2 text-sm text-slate-400">Acesse o painel da sua agencia.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Email institucional</label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
                setError('');
              }}
              placeholder="voce@agencia.com"
            />
            {fieldErrors.email ? <p className="mt-1 text-xs font-medium text-rose-300">{fieldErrors.email}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 pr-12 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  setError('');
                }}
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
          <div className="-mt-1 text-right">
            <Link to="/forgot-password" className="text-xs font-semibold text-[#00E5FF] hover:text-[#7DEBFF]">
              Esqueceu a senha?
            </Link>
          </div>
          {error ? <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p> : null}
          <button
            type="submit"
            disabled={loading || !validation.isValid}
            className="flex w-full items-center justify-center rounded-xl border border-[#00E5FF]/35 bg-gradient-to-r from-[#00E5FF] via-[#00CCFF] to-[#00B8FF] px-4 py-3 font-semibold text-[#021220] shadow-[0_0_30px_rgba(0,229,255,0.35)] transition-all hover:from-[#7DEBFF] hover:via-[#00E5FF] hover:to-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Validando acesso...' : 'Entrar no sistema'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Ainda nao tem conta?{' '}
          <Link to="/register" className="font-semibold text-[#00E5FF] hover:text-[#7DEBFF] hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

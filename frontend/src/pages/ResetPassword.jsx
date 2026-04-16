import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { validateResetPasswordInput } from '../utils/authValidation';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validation = useMemo(
    () => validateResetPasswordInput({ token, password: form.password, confirmPassword: form.confirmPassword }),
    [token, form.password, form.confirmPassword]
  );

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      if (validation.errors.token) setError(validation.errors.token);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: validation.normalized.token, password: validation.normalized.password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao redefinir senha.');
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Redefinir senha</h2>
          <p className="mt-2 text-sm text-slate-400">Defina sua nova senha para acessar a conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Nova senha</label>
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

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Confirmar senha</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 pr-12 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20"
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Ocultar confirmacao de senha' : 'Mostrar confirmacao de senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00E5FF] transition-colors hover:text-[#7DEBFF]"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.confirmPassword ? <p className="mt-1 text-xs font-medium text-rose-300">{fieldErrors.confirmPassword}</p> : null}
          </div>

          {error ? <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading || !validation.isValid}
            className="flex w-full items-center justify-center rounded-xl border border-[#00E5FF]/35 bg-gradient-to-r from-[#00E5FF] via-[#00CCFF] to-[#00B8FF] px-4 py-3 font-semibold text-[#021220] shadow-[0_0_30px_rgba(0,229,255,0.35)] transition-all hover:from-[#7DEBFF] hover:via-[#00E5FF] hover:to-[#00CCFF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Redefinindo...' : 'Salvar nova senha'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          <Link to="/login" className="font-semibold text-[#00E5FF] hover:text-[#7DEBFF] hover:underline">
            Voltar para login
          </Link>
        </p>
      </div>
    </div>
  );
}

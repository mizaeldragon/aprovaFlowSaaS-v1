import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { validateForgotPasswordInput } from '../utils/authValidation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sent, setSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validation = useMemo(() => validateForgotPasswordInput({ email }), [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: validation.normalized.email });
      setSuccess('Link de redefinicao foi enviado para o e-mail cadastrado.');
      setSent(true);
      setFieldErrors({});
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao solicitar recuperacao de senha.');
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
          <img src="/apv-logo.png" alt="AprovaFluxo Logo" className="mb-6 h-20 w-auto" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Recuperar senha</h2>
          <p className="mt-2 text-sm text-slate-400">Informe seu e-mail para receber o link de redefinicao.</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">E-mail</label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors({});
                  setError('');
                }}
                placeholder="voce@agencia.com"
              />
              {fieldErrors.email ? <p className="mt-1 text-xs font-medium text-rose-300">{fieldErrors.email}</p> : null}
            </div>

            {error ? <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p> : null}
            <button
              type="submit"
              disabled={loading || !validation.isValid}
              className="flex w-full items-center justify-center rounded-xl border border-[#00E5FF]/35 bg-gradient-to-r from-[#00E5FF] via-[#00CCFF] to-[#00B8FF] px-4 py-3 font-semibold text-[#021220] shadow-[0_0_30px_rgba(0,229,255,0.35)] transition-all hover:from-[#7DEBFF] hover:via-[#00E5FF] hover:to-[#00CCFF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperacao'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF]/10 p-3 text-sm text-[#7DEBFF]">{success}</p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setSuccess('');
                setError('');
              }}
              className="w-full rounded-xl border border-[#00E5FF]/30 px-4 py-3 text-sm font-semibold text-[#7DEBFF] hover:text-white"
            >
              Enviar novamente
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-400">
          Lembrou a senha?{' '}
          <Link to="/login" className="font-semibold text-[#00E5FF] hover:text-[#7DEBFF] hover:underline">
            Voltar para login
          </Link>
        </p>
      </div>
    </div>
  );
}

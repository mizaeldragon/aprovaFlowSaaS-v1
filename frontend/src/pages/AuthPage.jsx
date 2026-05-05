import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { validateLoginInput, validateRegisterInput } from '../utils/authValidation';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState(location.pathname === '/register' ? 'register' : 'login');
  const [form, setForm] = useState({ agencyName: '', name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const selectedPlanFromQuery = new URLSearchParams(location.search).get('plan');
  const selectedCheckoutPlan = selectedPlanFromQuery === 'pro' ? 'pro' : 'starter';
  const [showBillingRequiredNotice, setShowBillingRequiredNotice] = useState(
    location.search.includes('billing=required')
  );

  useEffect(() => {
    if (tab === 'login' && location.pathname !== '/login') {
      window.history.replaceState(null, '', '/login');
    } else if (tab === 'register' && location.pathname !== '/register') {
      window.history.replaceState(null, '', '/register');
    }
  }, [tab, location.pathname]);

  const validation = useMemo(() => {
    if (tab === 'login') {
      return validateLoginInput(form);
    }
    return validateRegisterInput(form);
  }, [form, tab]);

  const dismissBillingNotice = () => {
    if (showBillingRequiredNotice) setShowBillingRequiredNotice(false);
  };

  const updateField = (field, value) => {
    dismissBillingNotice();
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setError('');
  };

  const switchTab = (nextTab) => {
    dismissBillingNotice();
    setTab(nextTab);
    setError('');
    setFieldErrors({});
  };

  const openCheckout = async (plan = 'starter') => {
    const billingRes = await api.post('/billing/checkout-session', {
      plan,
      interval: 'monthly',
    });
    const checkoutUrl = billingRes?.data?.url;
    if (!checkoutUrl) {
      throw new Error('Nao foi possivel abrir checkout.');
    }
    window.location.assign(checkoutUrl);
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
      if (tab === 'login') {
        await login(validation.normalized.email, validation.normalized.password);
        const billingStatus = await api.get('/billing/status');
        if (billingStatus?.data?.billingRequired && billingStatus?.data?.canAccessApp === false) {
          await openCheckout('starter');
          return;
        }
        navigate('/dashboard');
      } else {
        await register(
          validation.normalized.name,
          validation.normalized.email,
          validation.normalized.password,
          validation.normalized.agencyName
        );
        try {
          await openCheckout(selectedCheckoutPlan);
          return;
        } catch (billingErr) {
          const checkoutError = billingErr?.response?.data?.error || 'Conta criada, mas nao foi possivel abrir checkout do Starter.';
          setError(checkoutError);
          return;
        }
      }
    } catch (err) {
      const apiError = err.response?.data?.error || (tab === 'login' ? 'Erro ao realizar login.' : 'Erro ao cadastrar.');
      const normalizedError = String(apiError).toLowerCase();

      if (tab === 'login') {
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
      }

      if (tab === 'register' && (normalizedError.includes('email ja cadastrado') || normalizedError.includes('e-mail ja cadastrado'))) {
        setFieldErrors((prev) => ({ ...prev, email: 'E-mail ja cadastrado.' }));
        setTab('login');
        setError('Este e-mail ja tem uma conta pendente ou ativa. Faca login para continuar o pagamento.');
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,229,255,0.20),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(0,184,255,0.16),transparent_48%),linear-gradient(180deg,rgba(2,6,23,0.05),rgba(2,6,23,0.75))]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#00E5FF]/28 bg-[#04122A]/95 p-8 shadow-[0_20px_60px_rgba(2,12,27,0.75)]">
        <div className="pointer-events-none absolute -bottom-20 left-1/2 h-40 w-[85%] -translate-x-1/2 rounded-full bg-[#00E5FF]/18 blur-3xl" />

        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/apv-logo.png" alt="AprovaFluxo Logo" className="mb-6 h-20 w-auto" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            {tab === 'login' ? 'Faca login na sua conta' : 'Crie seu workspace'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {tab === 'login' ? 'Bem-vindo de volta ao AprovaFluxo.' : 'Transforme a rotina da sua agencia.'}
          </p>
        </div>

        <div className="mb-8 flex rounded-xl border border-[#00E5FF]/30 bg-[#111827] p-1">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === 'login'
                ? 'bg-[#061630] text-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,0.24)] border border-[#00E5FF]/35'
                : 'text-slate-400 hover:text-[#7DEBFF]'
            }`}
          >
            Fazer login
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === 'register'
                ? 'bg-[#061630] text-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,0.24)] border border-[#00E5FF]/35'
                : 'text-slate-400 hover:text-[#7DEBFF]'
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
                className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20 transition-all"
                value={form.agencyName}
                onFocus={dismissBillingNotice}
                onChange={(e) => updateField('agencyName', e.target.value)}
                placeholder="Ex: Studio Alpha"
              />
              {fieldErrors.agencyName ? <p className="mt-1 text-xs font-medium text-rose-300">{fieldErrors.agencyName}</p> : null}
            </div>
          )}

          {tab === 'register' && (
            <div className="animate-fade-in mt-4">
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">Seu nome completo</label>
              <input
                required
                className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20 transition-all"
                value={form.name}
                onFocus={dismissBillingNotice}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Seu nome"
              />
              {fieldErrors.name ? <p className="mt-1 text-xs font-medium text-rose-300">{fieldErrors.name}</p> : null}
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">
              {tab === 'login' ? 'Email corporativo' : 'E-mail'}
            </label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20 transition-all"
              value={form.email}
              onFocus={dismissBillingNotice}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="exemplo@agencia.com"
            />
            {fieldErrors.email ? <p className="mt-1 text-xs font-medium text-rose-300">{fieldErrors.email}</p> : null}
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">
              {tab === 'login' ? 'Senha de acesso' : 'Criar senha segura'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full rounded-xl border border-slate-700 bg-[#050B14] px-4 py-3 pr-12 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/20 transition-all"
                value={form.password}
                onFocus={dismissBillingNotice}
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

          {tab === 'login' && (
            <div className="-mt-1 text-right">
              <Link to="/forgot-password" className="text-xs font-semibold text-[#00E5FF] hover:text-[#7DEBFF]">
                Esqueceu a senha?
              </Link>
            </div>
          )}

          {error ? <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p> : null}
          {showBillingRequiredNotice ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              Assinatura obrigatória pendente. Finalize o checkout do Starter para acessar o SaaS.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !validation.isValid}
            className="mt-6 flex w-full items-center justify-center rounded-xl border border-[#00E5FF]/35 bg-gradient-to-r from-[#00E5FF] via-[#00CCFF] to-[#00B8FF] px-4 py-3.5 font-semibold text-[#021220] shadow-[0_0_30px_rgba(0,229,255,0.35)] transition-all hover:from-[#7DEBFF] hover:via-[#00E5FF] hover:to-[#00CCFF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processando...' : tab === 'login' ? 'Entrar no sistema' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}

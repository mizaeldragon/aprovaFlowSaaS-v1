import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import api from '../services/api';

function formatPeriodEnd(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function BillingResult() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [billing, setBilling] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isSuccess = location.pathname.includes('/billing/success');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer = null;

    const loadBillingStatus = async () => {
      try {
        const res = await api.get('/billing/status');
        if (cancelled) return;
        const data = res?.data || null;
        setBilling(data);

        if (!isSuccess) {
          setStatus('cancelled');
          return;
        }

        if (data?.isPro || data?.plan === 'PRO') {
          setStatus('confirmed');
          return;
        }

        attempts += 1;
        if (attempts >= 6) {
          setStatus('pending_webhook');
          return;
        }
        timer = window.setTimeout(loadBillingStatus, 3000);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error?.response?.data?.error || 'Nao foi possivel confirmar o status da assinatura.');
        setStatus('error');
      }
    };

    loadBillingStatus();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [isSuccess]);

  const summary = useMemo(() => {
    if (status === 'confirmed') {
      return {
        title: 'Pagamento confirmado',
        description: 'Plano Pro ativo. Recursos premium liberados para sua conta.',
      };
    }
    if (status === 'pending_webhook') {
      return {
        title: 'Pagamento recebido',
        description: 'Checkout concluido. Ainda aguardando a confirmacao do webhook no backend.',
      };
    }
    if (status === 'cancelled') {
      return {
        title: 'Checkout cancelado',
        description: 'Nenhuma cobranca foi aplicada. Voce pode tentar novamente quando quiser.',
      };
    }
    if (status === 'error') {
      return {
        title: 'Erro ao consultar assinatura',
        description: errorMessage || 'Tente novamente em instantes.',
      };
    }
    return {
      title: 'Validando assinatura',
      description: 'Estamos sincronizando o retorno do Stripe com o AprovaFluxo.',
    };
  }, [status, errorMessage]);

  return (
    <section className="mx-auto flex min-h-[72vh] w-full max-w-3xl items-center justify-center px-4 py-8">
      <div className="w-full rounded-3xl border border-cyan-900/40 bg-[#0c121c]/95 p-8 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">Billing</p>
        <h1 className="mt-3 text-3xl font-black text-white">{summary.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">{summary.description}</p>

        {sessionId ? (
          <p className="mt-4 break-all text-xs text-slate-500">Sessao Stripe: {sessionId}</p>
        ) : null}

        {billing?.stripeSubscriptionStatus ? (
          <div className="mt-6 rounded-2xl border border-slate-700 bg-[#101827] p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Status atual</p>
            <p className="mt-2 text-sm text-white">
              Plano: <span className="font-semibold">{billing.plan || 'STARTER'}</span>
            </p>
            <p className="mt-1 text-sm text-white">
              Assinatura Stripe: <span className="font-semibold">{billing.stripeSubscriptionStatus}</span>
            </p>
            {billing.stripeCurrentPeriodEnd ? (
              <p className="mt-1 text-sm text-white">
                Vigente ate: <span className="font-semibold">{formatPeriodEnd(billing.stripeCurrentPeriodEnd)}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/settings?tab=dados"
            className="rounded-xl px-6 py-3 text-sm font-extrabold"
            style={{
              backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
              color: 'var(--brand-on)',
            }}
          >
            Ir para Configuracoes
          </Link>
          <Link to="/dashboard" className="rounded-xl border border-slate-600 px-6 py-3 text-sm font-bold text-slate-200">
            Voltar ao Painel
          </Link>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadImageToCreativeAssets } from '../services/storageService';
import api from '../services/api';
import { Building2, Globe, Grid2x2, Monitor, Smartphone, UploadCloud } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Ciano', hex: '#81E9FF' },
  { name: 'Azul Céu', hex: '#709BFF' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Laranja', hex: '#F97316' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Vermelho', hex: '#EF4444' },
  { name: 'Ambar', hex: '#F59E0B' },
];

const TABS = [
  { id: 'dados', label: 'Dados' },
  { id: 'marca', label: 'Minha Marca' },
  { id: 'dominio', label: 'Dominio' },
];
const TAB_IDS = TABS.map((tab) => tab.id);

function hexToRgba(hex, opacity = 1) {
  let color;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    color = hex.substring(1).split('');
    if (color.length === 3) color = [color[0], color[0], color[1], color[1], color[2], color[2]];
    color = `0x${color.join('')}`;
    return `rgba(${[(color >> 16) & 255, (color >> 8) & 255, color & 255].join(',')},${opacity})`;
  }
  return `rgba(112, 155, 255, ${opacity})`;
}

export default function Settings() {
  const { user, tenant, updateTenantSettings, updateUserSettings } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const activeTab = queryTab && TAB_IDS.includes(queryTab) ? queryTab : 'dados';

  const [form, setForm] = useState({ themeColor: '#709BFF', logoUrl: '' });
  const [customDomain, setCustomDomain] = useState('portal.yourcompany.com');
  const [plan, setPlan] = useState('STARTER');
  const [isPro, setIsPro] = useState(false);
  const [billingRequired, setBillingRequired] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [previewMode, setPreviewMode] = useState('mobile');

  const [companyForm, setCompanyForm] = useState({ companyName: '', email: '' });

  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [isOpeningBilling, setIsOpeningBilling] = useState(false);
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [domainVerification, setDomainVerification] = useState({
    status: 'unknown',
    message: '',
    expectedTarget: 'lb.aprovaflow.com',
    resolvedTo: [],
    checkedAt: '',
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!queryTab || !TAB_IDS.includes(queryTab)) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'dados');
        return next;
      }, { replace: true });
    }
  }, [queryTab, setSearchParams]);

  useEffect(() => {
    const billingState = searchParams.get('billing');

    if (billingState === 'portal') {
      showMessage('Retorno do portal de cobranca concluido. Confira o status atualizado do plano.');
    }
    if (billingState === 'required') {
      showMessage('Ative sua assinatura para liberar o uso completo do SaaS.', 'error');
    }

    if (!billingState) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('billing');
      if (!next.get('tab')) next.set('tab', 'dados');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  const showMessage = (text, type = 'success') => {
    setMessageType(type);
    setMessage(text);
    window.setTimeout(() => setMessage(''), 3500);
  };

  const getDomainBadge = () => {
    if (domainVerification.status === 'connected') {
      return {
        label: 'DNS CONECTADO',
        className: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-300',
      };
    }
    if (domainVerification.status === 'not_connected') {
      return {
        label: 'DNS NAO CONECTADO',
        className: 'border-rose-400/35 bg-rose-500/15 text-rose-300',
      };
    }
    return {
      label: 'DNS NAO VERIFICADO',
      className: 'border-slate-500/40 bg-slate-500/15 text-slate-300',
    };
  };

  const verifyDomain = async (domainValue, withLoader = true) => {
    if (!domainValue?.trim()) {
      setDomainVerification((prev) => ({
        ...prev,
        status: 'missing',
        message: 'Informe um dominio para verificar.',
      }));
      return;
    }
    if (withLoader) setIsCheckingDomain(true);
    try {
      const res = await api.post('/tenantsSettings/domain/verify', {
        customDomain: domainValue.trim(),
      });
      const data = res?.data || {};
      setDomainVerification({
        status: data.status || 'unknown',
        message: data.message || '',
        expectedTarget: data.expectedTarget || 'lb.aprovaflow.com',
        resolvedTo: Array.isArray(data.resolvedTo) ? data.resolvedTo : [],
        checkedAt: data.checkedAt || '',
      });
    } catch (err) {
      const fallbackMessage = err?.response?.data?.error || 'Erro ao verificar DNS.';
      setDomainVerification((prev) => ({
        ...prev,
        status: 'not_connected',
        message: fallbackMessage,
      }));
    } finally {
      if (withLoader) setIsCheckingDomain(false);
    }
  };

  useEffect(() => {
    api
      .get('/tenantsSettings')
      .then((tenantRes) => {
        const data = tenantRes.data || {};
        setForm({
          themeColor: data.themeColor || '#709BFF',
          logoUrl: data.logoUrl || '',
        });
        const nextPlan = data.plan || (data.isPro ? 'PRO' : 'STARTER');
        setPlan(nextPlan);
        setCustomDomain(data.customDomain || 'portal.yourcompany.com');
        setIsPro(nextPlan === 'PRO');
        setBillingRequired(Boolean(data.billingRequired));
        setHasActiveSubscription(Boolean(data.hasActiveSubscription));
        setDomainVerification((prev) => ({
          ...prev,
          expectedTarget: prev.expectedTarget || 'lb.aprovaflow.com',
        }));

        setCompanyForm({
          companyName: data.name || tenant?.name || '',
          email: user?.email || '',
        });
      })
      .catch(() => showMessage('Erro ao carregar configuracoes.', 'error'))
      .finally(() => setIsLoading(false));
  }, [tenant?.name, user?.email]);

  useEffect(() => {
    if (!isPro) return;
    if (!customDomain?.trim()) return;
    verifyDomain(customDomain, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro, customDomain]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setForm((prev) => ({ ...prev, logoUrl: URL.createObjectURL(file) }));
    }
  };

  const handleRemoveLogo = async () => {
    setIsSavingBrand(true);
    try {
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setForm((prev) => ({ ...prev, logoUrl: '' }));
      await api.patch('/tenantsSettings', { logoUrl: '', themeColor: form.themeColor });
      updateTenantSettings({ logoUrl: '', themeColor: form.themeColor });
      showMessage('Logo removida com sucesso.');
    } catch {
      showMessage('Erro ao remover logo.', 'error');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleSaveBrand = async () => {
    setIsSavingBrand(true);
    try {
      let finalLogoUrl = form.logoUrl;
      if (imageFile) finalLogoUrl = await uploadImageToCreativeAssets(imageFile);

      await api.patch('/tenantsSettings', {
        themeColor: form.themeColor,
        logoUrl: finalLogoUrl,
      });

      updateTenantSettings({ themeColor: form.themeColor, logoUrl: finalLogoUrl });
      showMessage('Identidade visual salva com sucesso.');
    } catch (err) {
      showMessage(err?.response?.data?.error || 'Erro ao salvar identidade visual.', 'error');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleSaveCompany = async () => {
    setIsSavingCompany(true);
    try {
      const nextName = companyForm.companyName.trim();
      const nextEmail = companyForm.email.trim().toLowerCase();
      if (!nextName) {
        showMessage('Nome da empresa obrigatorio.', 'error');
        setIsSavingCompany(false);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(nextEmail)) {
        showMessage('Informe um e-mail valido.', 'error');
        setIsSavingCompany(false);
        return;
      }

      await api.patch('/tenantsSettings', { name: nextName });
      const userRes = await api.patch('/auth/me', { email: nextEmail });

      updateTenantSettings({ name: nextName });
      updateUserSettings({ email: userRes?.data?.user?.email || nextEmail });
      showMessage('Dados da empresa atualizados.');
    } catch (err) {
      showMessage(err?.response?.data?.error || 'Erro ao salvar dados da empresa.', 'error');
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleSaveDomain = async () => {
    setIsSavingDomain(true);
    try {
      if (!isPro) {
        showMessage('Dominio personalizado disponivel apenas no plano Pro.', 'error');
        setIsSavingDomain(false);
        return;
      }

      await api.patch('/tenantsSettings', { customDomain });
      updateTenantSettings({ customDomain });
      showMessage('Dominio salvo com sucesso.');
      await verifyDomain(customDomain, false);
    } catch (err) {
      showMessage(err?.response?.data?.error || 'Erro ao salvar dominio.', 'error');
    } finally {
      setIsSavingDomain(false);
    }
  };

  const redirectToStripeUrl = (url) => {
    if (!url) throw new Error('URL de redirecionamento invalida.');
    window.location.assign(url);
  };

  const startCheckout = async (planTarget = 'pro') => {
    setIsOpeningBilling(true);
    try {
      const res = await api.post('/billing/checkout-session', { interval: 'monthly', plan: planTarget });
      redirectToStripeUrl(res?.data?.url);
    } catch (err) {
      showMessage(err?.response?.data?.error || 'Nao foi possivel iniciar checkout da assinatura.', 'error');
      setIsOpeningBilling(false);
    }
  };

  const handleUpgradeToPro = async () => startCheckout('pro');
  const handleStartStarter = async () => startCheckout('starter');

  const handleManagePlan = async () => {
    setIsOpeningBilling(true);
    try {
      const res = await api.post('/billing/portal-session');
      redirectToStripeUrl(res?.data?.url);
    } catch (err) {
      showMessage(err?.response?.data?.error || 'Nao foi possivel abrir o portal de cobranca.', 'error');
      setIsOpeningBilling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-sm font-semibold text-slate-500 animate-pulse">
        Carregando configuracoes...
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Configuracoes</h1>
        <p className="mt-1 text-sm font-medium text-slate-400">Gerencie dados da empresa, marca, dominio e plano.</p>
      </div>

      <div className="rounded-3xl border border-cyan-950/40 bg-[#0c121c]/95 p-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)]">
        <div className="mb-5 flex flex-wrap gap-2">
                  {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('tab', tab.id);
                    return next;
                  })
                }
                className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                  isActive
                    ? 'text-white'
                    : 'bg-[#111b2f] text-slate-300 hover:bg-[#17253d]'
                }`}
                style={
                  isActive
                    ? {
                        backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                        color: 'var(--brand-on)',
                        boxShadow: '0 0 12px rgba(var(--brand-rgb),0.35)',
                      }
                    : undefined
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'dados' ? (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-gradient-to-r from-[#121a2a] via-[#0f172a] to-[#121a2a] p-5" style={{ borderColor: 'rgba(var(--brand-rgb),0.35)' }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-3xl font-black text-white">Meu Plano: {plan}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {isPro
                      ? 'Sua franquia de projetos reinicia no inicio de cada mes.'
                      : billingRequired && !hasActiveSubscription
                        ? 'Assinatura obrigatoria pendente. Ative o Starter para liberar o uso completo.'
                        : 'Plano Starter ativo com recursos essenciais. Atualize para Pro para liberar tudo.'}
                  </p>
                  {isPro ? (
                    <button
                      type="button"
                      onClick={handleManagePlan}
                      disabled={isOpeningBilling}
                      className="mt-4 rounded-xl px-6 py-3 text-sm font-extrabold transition disabled:opacity-60"
                      style={{
                        backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                        color: 'var(--brand-on)',
                        boxShadow: '0 0 16px rgba(var(--brand-rgb),0.35)',
                      }}
                    >
                      {isOpeningBilling ? 'Abrindo...' : 'Gerenciar Assinatura'}
                    </button>
                  ) : billingRequired && !hasActiveSubscription ? (
                    <button
                      type="button"
                      onClick={handleStartStarter}
                      disabled={isOpeningBilling}
                      className="mt-4 rounded-xl px-6 py-3 text-sm font-extrabold transition disabled:opacity-60"
                      style={{
                        backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                        color: 'var(--brand-on)',
                        boxShadow: '0 0 16px rgba(var(--brand-rgb),0.35)',
                      }}
                    >
                      {isOpeningBilling ? 'Abrindo...' : 'Ativar Plano Starter'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleUpgradeToPro}
                      disabled={isOpeningBilling}
                      className="mt-4 rounded-xl px-6 py-3 text-sm font-extrabold transition disabled:opacity-60"
                      style={{
                        backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                        color: 'var(--brand-on)',
                        boxShadow: '0 0 16px rgba(var(--brand-rgb),0.35)',
                      }}
                    >
                      {isOpeningBilling ? 'Abrindo...' : 'Ativar Plano Pro'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Nome</p>
                <input
                  type="text"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-[#111b2f] px-4 py-3 text-slate-200 outline-none focus:border-cyan-400"
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Email</p>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-[#111b2f] px-4 py-3 text-slate-200 outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveCompany}
              disabled={isSavingCompany}
              className="rounded-xl px-6 py-3 text-sm font-extrabold transition disabled:opacity-60"
              style={{
                backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                color: 'var(--brand-on)',
                boxShadow: '0 0 16px rgba(var(--brand-rgb),0.35)',
              }}
            >
              {isSavingCompany ? 'Salvando...' : 'Salvar alteracoes'}
            </button>
          </div>
        ) : null}

        {activeTab === 'marca' ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-cyan-950/40 bg-[#0c121c]/95 p-5">
                <div className="mb-5 flex items-center gap-2.5 text-slate-200">
                  <Grid2x2 size={16} className="text-cyan-300" />
                  <h2 className="text-lg font-bold">Identidade da Marca</h2>
                </div>

                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Logo da Agencia</p>
                <div className="mt-3 flex gap-4">
                  <input ref={fileInputRef} id="logoFile" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <label
                    htmlFor="logoFile"
                    className="group flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-cyan-900/40 bg-[#0c121c] text-slate-400 transition hover:border-cyan-500/50 hover:text-cyan-300"
                  >
                    {form.logoUrl ? <img src={form.logoUrl} alt="logo" className="h-11 w-11 rounded-lg object-contain" /> : <UploadCloud size={20} />}
                  </label>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">Envie SVG ou PNG em alta resolucao</p>
                    <p className="mt-1 text-xs text-slate-500">Tamanho recomendado: 512x512px. Max. 2MB.</p>
                    <div className="mt-3 flex items-center gap-4">
                      <label htmlFor="logoFile" className="inline-flex cursor-pointer items-center text-xs font-bold uppercase tracking-wide text-cyan-300 transition hover:text-cyan-200">
                        Substituir logo
                      </label>
                      {form.logoUrl ? (
                        <button type="button" disabled={isSavingBrand} onClick={handleRemoveLogo} className="text-xs font-bold uppercase tracking-wide text-rose-300 transition hover:text-rose-200 disabled:opacity-50">
                          Remover logo
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Cor Primaria</p>
                    <div className="flex items-center gap-2 rounded-2xl border border-cyan-900/40 bg-[#0c121c] p-2">
                      <div className="h-8 w-8 rounded-lg border border-cyan-300/40" style={{ backgroundColor: form.themeColor }} />
                      <input type="color" value={form.themeColor} onChange={(e) => setForm((prev) => ({ ...prev, themeColor: e.target.value.toUpperCase() }))} className="h-8 w-10 cursor-pointer rounded border border-cyan-900/40 bg-transparent p-0" />
                      <input type="text" value={form.themeColor} onChange={(e) => setForm((prev) => ({ ...prev, themeColor: e.target.value.toUpperCase() }))} maxLength={7} className="w-full bg-transparent text-sm font-semibold text-slate-200 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Cores Pre-definidas</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => {
                      const isActive = form.themeColor.toLowerCase() === color.hex.toLowerCase();
                      return (
                        <button key={color.hex} type="button" onClick={() => setForm((prev) => ({ ...prev, themeColor: color.hex }))} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${isActive ? 'border-cyan-400 bg-cyan-500/10 text-cyan-200' : 'border-cyan-900/40 bg-[#0c121c] text-slate-300 hover:border-cyan-700/60'}`}>
                          <span className="h-3 w-3 rounded-full border border-black/30" style={{ backgroundColor: color.hex }} />
                          {color.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveBrand}
                disabled={isSavingBrand}
                className="min-w-52 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:brightness-105 disabled:opacity-70"
                style={{
                  backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                  color: 'var(--brand-on)',
                  boxShadow: '0 0 20px rgba(var(--brand-rgb),0.36)',
                }}
              >
                {isSavingBrand ? 'Salvando...' : 'Salvar Perfil da Marca'}
              </button>
            </div>

            <div className="rounded-3xl border border-cyan-950/40 bg-[#0c121c] p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Pre-visualizacao da Marca</h3>
                  <p className="mt-1 text-sm text-slate-500">Visualizacao em tempo real do portal de aprovacao.</p>
                </div>
                <div className="flex rounded-xl border border-cyan-900/40 bg-[#0c121c] p-1">
                  <button type="button" onClick={() => setPreviewMode('mobile')} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${previewMode === 'mobile' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-500'}`}>
                    <Smartphone size={12} /> Celular
                  </button>
                  <button type="button" onClick={() => setPreviewMode('desktop')} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${previewMode === 'desktop' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-500'}`}>
                    <Monitor size={12} /> Desktop
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                {previewMode === 'mobile' ? (
                  <div className="relative w-[290px] rounded-[44px] border-[8px] border-[#152235] bg-[#0c121c] px-4 pb-5 pt-6 shadow-[0_0_36px_rgba(var(--brand-rgb),0.2)]">
                    <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-slate-700/70" />
                    <div className="rounded-[30px] border border-cyan-900/30 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),rgba(12,18,28,0.95))] px-6 py-8 text-center">
                      <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/35 bg-cyan-300/10 shadow-[0_0_30px_rgba(129,233,255,0.25)]">
                        {form.logoUrl ? <img src={form.logoUrl} alt="logo preview" className="h-10 w-10 rounded-md object-contain" /> : <Grid2x2 size={28} className="text-cyan-200" />}
                      </div>
                      <h4 className="text-2xl font-bold text-white">Bem-vindo de volta</h4>
                      <p className="mx-auto mt-2 max-w-[190px] text-xs leading-relaxed text-slate-400">Acesse seu painel premium de aprovacoes do Studio Alpha</p>
                      <div className="mt-7 h-12 rounded-2xl border border-cyan-900/40 bg-[#0c121c] px-4 text-left text-sm italic leading-[48px] text-slate-500">Digite seu e-mail...</div>
                      <button type="button" className="mt-5 w-full rounded-2xl py-3 text-sm font-black uppercase tracking-wide" style={{ backgroundColor: form.themeColor, color: 'var(--brand-on)', boxShadow: `0 0 24px ${hexToRgba(form.themeColor, 0.4)}` }}>Enviar Link Magico</button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-[640px] overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#0c121c] shadow-[0_0_36px_rgba(var(--brand-rgb),0.18)]">
                    <div className="flex items-center gap-2 border-b border-cyan-900/40 bg-[#0c121c] px-4 py-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                      <div className="ml-3 rounded-lg border border-cyan-900/40 bg-[#0c121c] px-3 py-1 text-[11px] font-semibold text-slate-300">{isPro ? customDomain : 'app.aprovaflow.com/review'}</div>
                    </div>
                    <div className="grid gap-4 p-4 md:grid-cols-[220px_1fr]">
                      <aside className="rounded-2xl border border-cyan-900/30 bg-[#0c121c] p-4">
                        <div className="mb-6 flex items-center gap-2">
                          {form.logoUrl ? <img src={form.logoUrl} alt="logo" className="h-8 w-8 rounded object-contain" /> : <div className="flex h-8 w-8 items-center justify-center rounded bg-cyan-500/20"><Grid2x2 size={16} className="text-cyan-200" /></div>}
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Dashboard</p>
                        </div>
                        <div className="space-y-2"><div className="h-8 rounded-lg bg-[#0c121c]" /><div className="h-8 rounded-lg bg-[#0c121c]" /><div className="h-8 rounded-lg bg-[#0c121c]" /></div>
                      </aside>
                      <section className="rounded-2xl border border-cyan-900/30 bg-[#0c121c] p-5">
                        <h4 className="text-lg font-bold text-white">Painel de Aprovacoes</h4>
                        <div className="mt-4 space-y-3">
                          <div className="rounded-xl border border-cyan-900/30 bg-[#0c121c] p-3"><div className="mb-2 h-3 w-1/3 rounded bg-slate-600/40" /><div className="h-2 w-full rounded bg-slate-600/30" /></div>
                          <button type="button" className="w-full rounded-xl py-2.5 text-sm font-black uppercase tracking-wide" style={{ backgroundColor: form.themeColor, color: 'var(--brand-on)' }}>Aprovar e Publicar</button>
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'dominio' ? (
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2.5 text-slate-200">
              <Globe size={16} className="text-cyan-300" />
              <h3 className="text-lg font-bold">Configuracao de Dominio</h3>
            </div>

            {isPro ? (
              <>
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-200">
                  Plano Pro ativo. Dominio personalizado liberado para sua agencia.
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Dominio Personalizado</p>
                <div className="rounded-2xl border border-cyan-900/40 bg-[#0c121c] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-300 outline-none" />
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${getDomainBadge().className}`}>
                      {getDomainBadge().label}
                    </span>
                  </div>
                </div>
                <p className="rounded-xl border border-cyan-900/30 bg-[#0c121c] p-3 text-xs text-slate-400">
                  Adicione um registro CNAME apontando <span className="font-semibold text-cyan-200">{customDomain || 'portal.suaagencia.com'}</span> para{' '}
                  <span className="font-semibold text-cyan-200">{domainVerification.expectedTarget || 'lb.aprovaflow.com'}</span> no seu provedor DNS.
                </p>
                {domainVerification.message ? (
                  <p className="rounded-xl border border-slate-700 bg-[#0c121c] p-3 text-xs text-slate-400">
                    {domainVerification.message}
                    {domainVerification.resolvedTo?.length ? (
                      <>
                        {' '}CNAME atual: <span className="font-semibold text-slate-300">{domainVerification.resolvedTo.join(', ')}</span>.
                      </>
                    ) : null}
                  </p>
                ) : null}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDomain}
                    disabled={isSavingDomain}
                    className="rounded-xl px-6 py-3 text-sm font-extrabold transition disabled:opacity-60"
                    style={{
                      backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                      color: 'var(--brand-on)',
                      boxShadow: '0 0 16px rgba(var(--brand-rgb),0.35)',
                    }}
                  >
                    {isSavingDomain ? 'Salvando...' : 'Salvar dominio'}
                  </button>
                  <button
                    type="button"
                    onClick={() => verifyDomain(customDomain)}
                    disabled={isCheckingDomain}
                    className="rounded-xl border border-cyan-700/40 bg-cyan-500/10 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-500/20 disabled:opacity-60"
                  >
                    {isCheckingDomain ? 'Verificando...' : 'Verificar DNS'}
                  </button>
                  <button type="button" onClick={handleManagePlan} disabled={isOpeningBilling} className="rounded-xl border border-cyan-700/40 bg-cyan-500/10 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-500/20 disabled:opacity-60">Gerenciar assinatura</button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-cyan-900/40 bg-[#0c121c] p-6 text-center">
                <p className="text-sm font-semibold text-slate-200">Dominio personalizado e recurso Pro</p>
                <p className="mt-2 text-xs text-slate-400">Ative o plano Pro para liberar dominio da sua agencia.</p>
                <button
                  type="button"
                  onClick={handleUpgradeToPro}
                  disabled={isOpeningBilling}
                  className="mt-5 rounded-xl px-6 py-3 text-sm font-extrabold transition disabled:opacity-60"
                  style={{
                    backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                    color: 'var(--brand-on)',
                    boxShadow: '0 0 16px rgba(var(--brand-rgb),0.35)',
                  }}
                >
                  {isOpeningBilling ? 'Ativando...' : 'Ativar Plano Pro'}
                </button>
              </div>
            )}
          </div>
        ) : null}

      </div>

      {message ? (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${messageType === 'error' ? 'border-rose-900/60 bg-rose-500/10 text-rose-300' : 'border-cyan-900/50 bg-cyan-500/10 text-cyan-200'}`}>
          {message}
        </div>
      ) : null}
    </section>
  );
}

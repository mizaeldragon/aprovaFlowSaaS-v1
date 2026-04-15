import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadImageToCreativeAssets } from '../services/storageService';
import api from '../services/api';
import { Globe, Grid2x2, Monitor, Smartphone, UploadCloud } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Ciano', hex: '#81E9FF' },
  { name: 'Azul Ceu', hex: '#709BFF' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Laranja', hex: '#F97316' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Vermelho', hex: '#EF4444' },
  { name: 'Ambar', hex: '#F59E0B' },
];

function hexToRgba(hex, opacity = 1) {
  let color;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    color = hex.substring(1).split('');
    if (color.length === 3) {
      color = [color[0], color[0], color[1], color[1], color[2], color[2]];
    }
    color = `0x${color.join('')}`;
    return `rgba(${[(color >> 16) & 255, (color >> 8) & 255, color & 255].join(',')},${opacity})`;
  }
  return `rgba(129, 233, 255, ${opacity})`;
}

export default function Settings() {
  const { updateTenantSettings } = useAuth();
  const [form, setForm] = useState({ themeColor: '#81E9FF', logoUrl: '' });
  const [secondaryColor, setSecondaryColor] = useState('#709BFF');
  const [customDomain, setCustomDomain] = useState('portal.yourcompany.com');
  const [isPro, setIsPro] = useState(false);
  const [previewMode, setPreviewMode] = useState('mobile');
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    api
      .get('/tenantsSettings')
      .then((res) => {
        if (res.data) {
          setForm({
            themeColor: res.data.themeColor || '#81E9FF',
            logoUrl: res.data.logoUrl || '',
          });
          setCustomDomain(res.data.customDomain || 'portal.yourcompany.com');
          setIsPro(Boolean(res.data.isPro));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setForm((prev) => ({ ...prev, logoUrl: URL.createObjectURL(file) }));
    }
  };

  const handleRemoveLogo = async () => {
    setIsSaving(true);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setForm((prev) => ({ ...prev, logoUrl: '' }));
    try {
      await api.patch('/tenantsSettings', {
        themeColor: form.themeColor,
        logoUrl: '',
      });
      updateTenantSettings({ themeColor: form.themeColor, logoUrl: '' });
      setMessage('Logo removida com sucesso.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Erro ao remover logo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setImageFile(null);
    setSecondaryColor('#709BFF');
    setCustomDomain('portal.yourcompany.com');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMessage('Alteracoes locais descartadas.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      let finalLogoUrl = form.logoUrl;
      if (imageFile) {
        finalLogoUrl = await uploadImageToCreativeAssets(imageFile);
      }

      await api.patch('/tenantsSettings', {
        themeColor: form.themeColor,
        logoUrl: finalLogoUrl,
        customDomain: isPro ? customDomain : undefined,
      });

      updateTenantSettings({
        themeColor: form.themeColor,
        logoUrl: finalLogoUrl,
        customDomain: isPro ? customDomain : '',
        isPro,
      });

      setMessage('Perfil da marca salvo com sucesso.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao salvar configuracoes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgradeToPro = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const res = await api.post('/billing/upgrade-pro');
      setIsPro(true);
      updateTenantSettings({ isPro: true, ...(res?.data?.tenant || {}) });
      setMessage('Plano Pro ativado. Dominio personalizado liberado.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Nao foi possivel ativar o plano Pro agora.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-sm font-semibold text-slate-500 animate-pulse">
        Carregando studio...
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Minha Marca</h1>
          <p className="mt-1 text-sm font-medium text-slate-400">
            Personalize a experiencia visual que seu cliente tera ao revisar as obras.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-cyan-950/40 bg-[#0c121c]/95 p-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)]">
            <div className="mb-5 flex items-center gap-2.5 text-slate-200">
              <Grid2x2 size={16} className="text-cyan-300" />
              <h2 className="text-lg font-bold">Identidade da Marca</h2>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Logo da Agencia</p>

            <div className="mt-3 flex gap-4">
              <input
                ref={fileInputRef}
                id="logoFile"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <label
                htmlFor="logoFile"
                className="group flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-cyan-900/40 bg-[#0c121c] text-slate-400 transition hover:border-cyan-500/50 hover:text-cyan-300"
              >
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="logo" className="h-11 w-11 rounded-lg object-contain" />
                ) : (
                  <UploadCloud size={20} />
                )}
              </label>

              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200">Envie SVG ou PNG em alta resolucao</p>
                <p className="mt-1 text-xs text-slate-500">Tamanho recomendado: 512x512px. Max. 2MB.</p>
                <div className="mt-3 flex items-center gap-4">
                  <label
                    htmlFor="logoFile"
                    className="inline-flex cursor-pointer items-center text-xs font-bold uppercase tracking-wide text-cyan-300 transition hover:text-cyan-200"
                  >
                    Substituir logo
                  </label>
                  {form.logoUrl ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleRemoveLogo}
                      className="text-xs font-bold uppercase tracking-wide text-rose-300 transition hover:text-rose-200 disabled:opacity-50"
                    >
                      Remover logo
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Cor Primaria</p>
                <div className="flex items-center gap-2 rounded-2xl border border-cyan-900/40 bg-[#0c121c] p-2">
                  <div className="h-8 w-8 rounded-lg border border-cyan-300/40" style={{ backgroundColor: form.themeColor }} />
                  <input
                    type="color"
                    value={form.themeColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, themeColor: e.target.value.toUpperCase() }))}
                    className="h-8 w-10 cursor-pointer rounded border border-cyan-900/40 bg-transparent p-0"
                    title="Selecionar cor"
                  />
                  <input
                    type="text"
                    value={form.themeColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, themeColor: e.target.value.toUpperCase() }))}
                    maxLength={7}
                    className="w-full bg-transparent text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-600"
                    placeholder="#81E9FF"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Cor Secundaria</p>
                <div className="flex items-center gap-2 rounded-2xl border border-cyan-900/40 bg-[#0c121c] p-2">
                  <div className="h-8 w-8 rounded-lg border border-indigo-300/40" style={{ backgroundColor: secondaryColor }} />
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value.toUpperCase())}
                    className="h-8 w-10 cursor-pointer rounded border border-cyan-900/40 bg-transparent p-0"
                    title="Selecionar cor secundaria"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value.toUpperCase())}
                    maxLength={7}
                    className="w-full bg-transparent text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-600"
                    placeholder="#709BFF"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Cores Pre-definidas</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => {
                  const isActive = form.themeColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, themeColor: color.hex }))}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        isActive
                          ? 'border-cyan-400 bg-cyan-500/10 text-cyan-200'
                          : 'border-cyan-900/40 bg-[#0c121c] text-slate-300 hover:border-cyan-700/60'
                      }`}
                    >
                      <span className="h-3 w-3 rounded-full border border-black/30" style={{ backgroundColor: color.hex }} />
                      {color.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-950/40 bg-[#0c121c]/95 p-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)]">
            <div className="mb-4 flex items-center gap-2.5 text-slate-200">
              <Globe size={16} className="text-cyan-300" />
              <h3 className="text-lg font-bold">Configuracao de Dominio</h3>
            </div>

            {isPro ? (
              <>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Dominio Personalizado</p>
                <div className="rounded-2xl border border-cyan-900/40 bg-[#0c121c] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-300 outline-none"
                    />
                    <span className="rounded-full border border-rose-400/35 bg-rose-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-300">
                      DNS Nao Conectado
                    </span>
                  </div>
                </div>
                <p className="mt-3 rounded-xl border border-cyan-900/30 bg-[#0c121c] p-3 text-xs text-slate-400">
                  Adicione um registro CNAME apontando <span className="font-semibold text-cyan-200">portal.yourcompany.com</span> para{' '}
                  <span className="font-semibold text-cyan-200">lb.aprovaflow.com</span> no seu provedor DNS.
                </p>
              </>
            ) : (
              <div className="min-h-[210px] rounded-2xl border border-cyan-900/40 bg-[#0c121c] flex flex-col items-center justify-center text-center px-5">
                <p className="text-sm font-semibold text-slate-200">Dominio personalizado e recurso Pro</p>
                <p className="mt-2 text-xs text-slate-400 max-w-[280px]">
                  Este conteudo fica oculto no plano Free. Ative o Pro para liberar dominio da sua agencia.
                </p>
                <button
                  type="button"
                  onClick={handleUpgradeToPro}
                  disabled={isSaving}
                  className="mt-5 rounded-xl px-6 py-2 text-xs font-extrabold uppercase tracking-wide disabled:opacity-60"
                  style={{
                    backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                    color: 'var(--brand-on)',
                    boxShadow: '0 0 14px rgba(var(--brand-rgb),0.32)',
                  }}
                >
                  {isSaving ? 'Ativando...' : 'Ativar Plano Pro'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="min-w-52 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:brightness-105 disabled:opacity-70"
              style={{
                backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                color: 'var(--brand-on)',
                boxShadow: '0 0 20px rgba(var(--brand-rgb),0.36)',
              }}
            >
              {isSaving ? 'Salvando...' : 'Salvar Perfil da Marca'}
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-3 text-sm font-black uppercase tracking-wide text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/70"
            >
              Descartar
            </button>
          </div>

          {message ? (
            <div className="rounded-xl border border-cyan-900/50 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200">
              {message}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-cyan-950/40 bg-[#0c121c] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,1)]">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Pre-visualizacao da Marca</h3>
              <p className="mt-1 text-sm text-slate-500">Visualizacao em tempo real do portal de aprovacao.</p>
            </div>
            <div className="flex rounded-xl border border-cyan-900/40 bg-[#0c121c] p-1">
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                  previewMode === 'mobile' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-500'
                }`}
              >
                <Smartphone size={12} /> Celular
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                  previewMode === 'desktop' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-500'
                }`}
              >
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
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="logo preview" className="h-10 w-10 rounded-md object-contain" />
                    ) : (
                      <Grid2x2 size={28} className="text-cyan-200" />
                    )}
                  </div>

                  <h4 className="text-2xl font-bold text-white">Bem-vindo de volta</h4>
                  <p className="mx-auto mt-2 max-w-[190px] text-xs leading-relaxed text-slate-400">
                    Acesse seu painel premium de aprovacoes do Studio Alpha
                  </p>

                  <div className="mt-7 h-12 rounded-2xl border border-cyan-900/40 bg-[#0c121c] px-4 text-left text-sm italic leading-[48px] text-slate-500">
                    Digite seu e-mail...
                  </div>

                  <button
                    type="button"
                    className="mt-5 w-full rounded-2xl py-3 text-sm font-black uppercase tracking-wide"
                    style={{
                      backgroundColor: form.themeColor,
                      color: 'var(--brand-on)',
                      boxShadow: `0 0 24px ${hexToRgba(form.themeColor, 0.4)}`,
                    }}
                  >
                    Enviar Link Magico
                  </button>
                  <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600">Powered by AprovaFlow</p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[640px] overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#0c121c] shadow-[0_0_36px_rgba(var(--brand-rgb),0.18)]">
                <div className="flex items-center gap-2 border-b border-cyan-900/40 bg-[#0c121c] px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  <div className="ml-3 rounded-lg border border-cyan-900/40 bg-[#0c121c] px-3 py-1 text-[11px] font-semibold text-slate-300">
                    {isPro ? customDomain : 'app.aprovaflow.com/review'}
                  </div>
                </div>

                <div className="grid gap-4 p-4 md:grid-cols-[220px_1fr]">
                  <aside className="rounded-2xl border border-cyan-900/30 bg-[#0c121c] p-4">
                    <div className="mb-6 flex items-center gap-2">
                      {form.logoUrl ? (
                        <img src={form.logoUrl} alt="logo" className="h-8 w-8 rounded object-contain" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-cyan-500/20">
                          <Grid2x2 size={16} className="text-cyan-200" />
                        </div>
                      )}
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Dashboard</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 rounded-lg bg-[#0c121c]" />
                      <div className="h-8 rounded-lg bg-[#0c121c]" />
                      <div className="h-8 rounded-lg bg-[#0c121c]" />
                    </div>
                  </aside>

                  <section className="rounded-2xl border border-cyan-900/30 bg-[#0c121c] p-5">
                    <h4 className="text-lg font-bold text-white">Painel de Aprovacoes</h4>
                    <p className="mt-1 text-xs text-slate-400">Visual de marca aplicado no ambiente desktop.</p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-cyan-900/30 bg-[#0c121c] p-3">
                        <div className="mb-2 h-3 w-1/3 rounded bg-slate-600/40" />
                        <div className="h-2 w-full rounded bg-slate-600/30" />
                      </div>
                      <button
                        type="button"
                        className="w-full rounded-xl py-2.5 text-sm font-black uppercase tracking-wide"
                        style={{ backgroundColor: form.themeColor, color: 'var(--brand-on)' }}
                      >
                        Aprovar e Publicar
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}


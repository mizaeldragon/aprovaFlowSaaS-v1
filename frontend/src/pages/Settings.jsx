import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import { uploadImageToCreativeAssets } from '../services/storageService';
import api from '../services/api';
import { CheckCircle2, UploadCloud, PaintBucket, X, Image as ImageIcon, Monitor } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Slater (Padrão)', hex: '#0f172a' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Índigo', hex: '#4f46e5' },
  { name: 'Laranja', hex: '#ea580c' },
  { name: 'Rosa Choque', hex: '#db2777' },
];

function hexToRgba(hex, opacity = 1) {
  let c;
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length === 3){
          c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+opacity+')';
  }
  return `rgba(15, 23, 42, ${opacity})`;
}

export default function Settings() {
  const { updateTenantSettings } = useAuth();
  
  const [form, setForm] = useState({ themeColor: '#0f172a', logoUrl: '' });
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const fileInputRef = useRef(null);

  // Fetch current settings
  useEffect(() => {
    api.get('/tenantsSettings')
      .then(res => {
        if (res.data) {
          setForm({ 
            themeColor: res.data.themeColor || '#0f172a', 
            logoUrl: res.data.logoUrl || '' 
          });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setForm(prev => ({ ...prev, logoUrl: URL.createObjectURL(file) }));
    }
  };

  const handleRemoveLogo = async () => {
    setForm(prev => ({...prev, logoUrl: ''}));
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsSaving(true);
    try {
      await api.patch('/tenantsSettings', {
        themeColor: form.themeColor,
        logoUrl: '' // Força nulo na remoção
      });
      updateTenantSettings({ themeColor: form.themeColor, logoUrl: '' });
      setMessage('✅ Logo removida imediatamente!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('❌ Erro ao remover.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      let finalLogoUrl = form.logoUrl;
      if (imageFile) {
        finalLogoUrl = await uploadImageToCreativeAssets(imageFile);
      }
      
      await api.patch('/tenantsSettings', {
        themeColor: form.themeColor,
        logoUrl: finalLogoUrl
      });
      
      updateTenantSettings({ themeColor: form.themeColor, logoUrl: finalLogoUrl });
      
      setMessage('✅ Configurações salvas com sucesso! O seu modo White-label está ativo.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('❌ Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex h-[50vh] w-full items-center justify-center animate-pulse text-slate-500 font-semibold">Carregando Studio...</div>;

  return (
    <section className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 border-b border-[#1E293B] pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">Minha Marca</h1>
          <p className="text-sm font-medium text-slate-400">Personalize a experiência visual que seu cliente terá ao revisar as obras.</p>
        </div>
        <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 font-extrabold py-3.5 px-8 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all disabled:opacity-70 disabled:scale-100 hover:scale-[1.02]"
        >
            {isSaving ? 'Aplicando Magia...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ESQUERDA: Formulário */}
        <div className="lg:col-span-7 space-y-6">
           <form onSubmit={handleSave}>
              
              {/* CARD 1: LOGO */}
              <div className="bg-[#0B1221] p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-slate-800/60 ring-1 ring-black/20 mb-6 transition-all hover:border-slate-700/80">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                       <ImageIcon size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Logotipo da Agência</h3>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-6">
                    {/* File Picker Zone */}
                    <div className="flex-1">
                       <input
                          ref={fileInputRef}
                          id="logoFile"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                       />
                       
                       {!form.logoUrl ? (
                         <label htmlFor="logoFile" className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-800/60 border-dashed rounded-2xl cursor-pointer bg-[#050B14] hover:bg-[#111827] transition-colors group">
                             <UploadCloud className="text-slate-500 group-hover:text-cyan-400 transition-colors mb-3" size={32} />
                             <p className="text-sm font-bold text-slate-300">Clique para enviar logo</p>
                             <p className="text-xs font-medium text-slate-500 mt-1">PNG transparente recomendado</p>
                         </label>
                       ) : (
                         <div className="relative w-full h-40 border border-slate-800/50 rounded-2xl bg-[#050B14] flex items-center justify-center group overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                             <img src={form.logoUrl} alt="Logo" className="max-h-24 max-w-[80%] object-contain drop-shadow-lg transition-transform group-hover:scale-105" />
                             <div className="absolute inset-0 bg-[#0A0F1C]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <div className="flex gap-2">
                                  <label htmlFor="logoFile" className="bg-white text-slate-900 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-200 shadow-xl transition-transform hover:scale-105">
                                     Trocar
                                  </label>
                                  <button type="button" onClick={handleRemoveLogo} className="bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs font-bold px-4 py-2 rounded-xl hover:bg-rose-500/30 transition-all hover:scale-105">
                                     Remover
                                  </button>
                                </div>
                             </div>
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* CARD 2: CORES */}
              <div className="bg-[#0B1221] p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-slate-800/60 ring-1 ring-black/20 transition-all hover:border-slate-700/80">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                       <PaintBucket size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Cores da Agência</h3>
                 </div>

                 <p className="text-sm font-medium text-slate-400 mb-6">Essa cor será injetada em todos os botões de ação que o seu cliente for apertar.</p>

                 <div className="flex flex-col sm:flex-row gap-8 items-start">
                    {/* HEX INPUT */}
                    <div className="w-full sm:w-auto shrink-0 space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Código Hexadecimal</label>
                       <div className="flex items-center bg-[#050B14] border border-slate-800/60 rounded-xl overflow-hidden focus-within:ring-1 ring-cyan-500">
                          <div className="w-12 h-12 flex-shrink-0" style={{ backgroundColor: form.themeColor }}></div>
                          <input 
                            type="text" 
                            value={form.themeColor} 
                            onChange={(e) => setForm({...form, themeColor: e.target.value})}
                            className="bg-transparent text-slate-300 font-mono font-bold w-full uppercase px-4 py-3 outline-none"
                            placeholder="#0f172a"
                            maxLength={7}
                          />
                       </div>
                    </div>

                    {/* PRESETS */}
                    <div className="w-full">
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sugestões de Cores</label>
                       <div className="flex flex-wrap gap-2">
                          {PRESET_COLORS.map(color => {
                             const isActive = form.themeColor.toLowerCase() === color.hex.toLowerCase();
                             return (
                               <button
                                 key={color.name}
                                 type="button"
                                 onClick={() => setForm({...form, themeColor: color.hex})}
                                 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                   isActive 
                                     ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 scale-[1.03] shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                                     : 'border-slate-800 bg-[#050B14] text-slate-400 hover:bg-[#1E293B] hover:text-slate-300 hover:border-slate-600'
                                 }`}
                               >
                                 <span className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" style={{ backgroundColor: color.hex }}></span>
                                 {color.name}
                               </button>
                             )
                          })}
                       </div>
                    </div>
                 </div>
              </div>

           </form>

           {message && (
              <div className="animate-fade-in p-4 rounded-xl text-sm font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                {message}
              </div>
           )}
        </div>

        {/* DIREITA: LIVE PREVIEW */}
        <div className="lg:col-span-5 relative hidden sm:block">
            <div className="sticky top-28 bg-[#0B1221] rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] border border-slate-700/60 overflow-hidden ring-1 ring-black/5 transform transition-all hover:scale-[1.02] duration-500">
                
                {/* Browser bar */}
                <div className="bg-[#050b14] px-4 py-3 flex gap-3 items-center border-b border-slate-800/60">
                    <div className="flex gap-2 opacity-80">
                       <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                       <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                       <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <div className="mx-auto bg-[#111827] border border-slate-800/60 px-5 py-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-500 rounded-md shadow-inner flex items-center gap-2">
                       aprovaflow.studio/revisao
                    </div>
                </div>

                {/* Preview Body */}
                <div className="p-6 relative pointer-events-none min-h-[440px] bg-[#050B14] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
                    
                    {/* Header Mock */}
                    <div className="flex justify-start mb-10 w-full relative z-10">
                       {form.logoUrl ? (
                          <img src={form.logoUrl} className="h-7 max-w-[140px] object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" alt="Mock Logo" />
                       ) : (
                          <div className="h-6 w-24 bg-slate-800 rounded animate-pulse"></div>
                       )}
                    </div>

                    {/* Content Mock */}
                    <div className="bg-[#0B1221]/90 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-slate-800/80 mb-6 relative z-10">
                        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
                           <div className="w-1/3 h-5 bg-slate-800 rounded"></div>
                        </div>

                        <div className="w-full h-40 border border-slate-800/50 rounded-xl mb-5 flex items-center justify-center bg-[#050B14] shadow-inner relative overflow-hidden">
                            {form.logoUrl ? (
                              <img src={form.logoUrl} className="opacity-10 h-20 object-contain grayscale scale-150 blur-[2px]" alt="" />
                            ) : (
                              <ImageIcon size={40} className="text-slate-800" />
                            )}
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-xl pointer-events-none"></div>
                        </div>
                        
                        <div className="space-y-2.5 flex flex-col items-center">
                           <div className="w-full h-2 bg-[#1e293b] rounded-full"></div>
                           <div className="w-5/6 h-2 bg-[#1e293b] rounded-full"></div>
                        </div>
                    </div>

                    {/* Action Button Mock */}
                    <div className="bg-[#0B1221]/90 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-slate-800/80 relative z-10 flex flex-col items-center">
                        <div className="w-1/3 h-2 bg-slate-700 rounded-full mb-4"></div>
                        <div 
                            className="w-full py-4 rounded-xl flex justify-center items-center gap-2 text-white font-extrabold text-sm transition-all duration-500"
                            style={{ backgroundColor: form.themeColor, boxShadow: `0 0 20px ${hexToRgba(form.themeColor, 0.4)}` }}
                        >
                           <CheckCircle2 size={18} /> GOSTAR E APROVAR
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </section>
  );
}

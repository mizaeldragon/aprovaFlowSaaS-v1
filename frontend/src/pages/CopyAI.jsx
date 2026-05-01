import { useState, useRef } from 'react'
import { improveCopyWithAI } from '../services/postsService'
import { Sparkles, BrainCircuit, Type, Clipboard, Check, RotateCcw, ShieldCheck, Bold, Italic, Underline, Strikethrough } from 'lucide-react'

function CopyAI() {
  const [caption, setCaption] = useState('')
  const [tone, setTone] = useState('persuasive')
  const [result, setResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef(null)

  const tones = [
    { id: 'persuasive', label: 'Persuasivo', desc: 'Focado em conversão e vendas.', icon: Sparkles },
    { id: 'short', label: 'Minimalista', desc: 'Direto ao ponto, ideal para reels.', icon: Type },
    { id: 'professional', label: 'Executivo', desc: 'Tom sóbrio e autoritário (LinkedIn).', icon: ShieldCheck },
  ]

  const applyFormat = (type) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = caption.substring(start, end)
    const before = caption.substring(0, start)
    const after = caption.substring(end)

    let newText = caption
    let newCursorStart = start
    let newCursorEnd = end

    const applyLinePrefix = (prefix) => {
      const lineStart = before.lastIndexOf('\n') + 1
      const rest = caption.substring(lineStart).replace(/^#{1,6}\s*/, '')
      newText = caption.substring(0, lineStart) + prefix + rest
    }

    switch (type) {
      case 'h1':
        applyLinePrefix('# ')
        break
      case 'h2':
        applyLinePrefix('## ')
        break
      case 'h3':
        applyLinePrefix('### ')
        break
      case 'p':
        applyLinePrefix('')
        break
      case 'bold':
        if (selected) {
          newText = before + `**${selected}**` + after
          newCursorStart = start + 2
          newCursorEnd = end + 2
        } else {
          newText = before + `****` + after
          newCursorStart = start + 2
          newCursorEnd = start + 2
        }
        break
      case 'italic':
        if (selected) {
          newText = before + `*${selected}*` + after
          newCursorStart = start + 1
          newCursorEnd = end + 1
        } else {
          newText = before + `**` + after
          newCursorStart = start + 1
          newCursorEnd = start + 1
        }
        break
      case 'underline':
        if (selected) {
          newText = before + `<u>${selected}</u>` + after
          newCursorStart = start + 3
          newCursorEnd = end + 3
        } else {
          newText = before + `<u></u>` + after
          newCursorStart = start + 3
          newCursorEnd = start + 3
        }
        break
      case 'strikethrough':
        if (selected) {
          newText = before + `~~${selected}~~` + after
          newCursorStart = start + 2
          newCursorEnd = end + 2
        } else {
          newText = before + `~~~~` + after
          newCursorStart = start + 2
          newCursorEnd = start + 2
        }
        break
    }

    setCaption(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorStart, newCursorEnd)
    }, 0)
  }

  const handleGenerate = async () => {
    if (!caption.trim()) return
    setIsGenerating(true)
    setResult('')
    try {
      const res = await improveCopyWithAI(caption, tone)
      setResult(res.improvedCopy)
    } catch (err) {
      console.error('Erro na IA:', err)
      setResult('Ops! O cérebro da nossa IA cansou um pouco. Tente novamente em instantes.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ToolbarBtn = ({ onClick, children, title }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="px-2 py-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
    >
      {children}
    </button>
  )

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10 border-b border-[#1E293B] pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3">
             <BrainCircuit className="text-cyan-400" /> Redator IA
          </h1>
          <p className="text-sm font-medium text-slate-400 font-sans">Transforme ideias brutas em legendas magnéticas e gramaticalmente perfeitas.</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 px-4 py-2.5 rounded-2xl border border-white/5">
           <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none">GPT-4 Turbo Ativo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* INPUT AREA */}
        <div className="space-y-6">
           <div className="bg-[#0B1221] border border-slate-800/60 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-30"></div>

              <div className="flex items-center justify-between mb-4 px-1">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Rascunho da Legenda</label>
                 <button onClick={() => setCaption('')} className="text-slate-600 hover:text-white transition-colors"><RotateCcw size={14} /></button>
              </div>

              {/* TYPOGRAPHY TOOLBAR */}
              <div className="flex items-center gap-1 bg-[#050B14] border border-slate-800/60 rounded-2xl px-3 py-2 mb-3 flex-wrap">
                <ToolbarBtn onClick={() => applyFormat('h1')} title="Título H1">
                  <span className="text-xs font-black">H1</span>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => applyFormat('h2')} title="Título H2">
                  <span className="text-xs font-black">H2</span>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => applyFormat('h3')} title="Título H3">
                  <span className="text-xs font-black">H3</span>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => applyFormat('p')} title="Parágrafo normal">
                  <span className="text-xs font-bold">P</span>
                </ToolbarBtn>

                <div className="w-px h-4 bg-slate-700 mx-1" />

                <ToolbarBtn onClick={() => applyFormat('bold')} title="Negrito">
                  <Bold size={13} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => applyFormat('italic')} title="Itálico">
                  <Italic size={13} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => applyFormat('underline')} title="Sublinhado">
                  <Underline size={13} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => applyFormat('strikethrough')} title="Riscado">
                  <Strikethrough size={13} />
                </ToolbarBtn>
              </div>

              <textarea
                ref={textareaRef}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={10}
                className="w-full bg-[#050B14] border border-slate-800/60 rounded-[2rem] px-6 py-6 text-white text-sm outline-none focus:ring-1 ring-cyan-500 transition-all resize-none placeholder:text-slate-800 leading-relaxed font-sans"
                placeholder="Cole aqui sua ideia inicial ou legenda rascunhada..."
              />

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                 {tones.map(t => (
                   <button
                     key={t.id}
                     onClick={() => setTone(t.id)}
                     className={`p-4 rounded-3xl border transition-all text-left ${
                       tone === t.id
                         ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                         : 'bg-[#050B14] border-slate-800 text-slate-500 hover:border-slate-600'
                     }`}
                   >
                     <t.icon size={18} className={tone === t.id ? 'text-cyan-400' : 'text-slate-600'} />
                     <p className="text-xs font-black mt-2 uppercase tracking-tighter">{t.label}</p>
                     <p className="text-[9px] mt-1 opacity-60 leading-tight">{t.desc}</p>
                   </button>
                 ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !caption.trim()}
                className="w-full mt-8 bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-slate-950 font-black py-5 rounded-[2rem] text-sm transition-all shadow-[0_15px_30px_-10px_rgba(34,211,238,0.4)] active:scale-95 disabled:opacity-30 uppercase tracking-widest flex items-center justify-center gap-3 font-sans"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    Processando Neuro-linguística...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Gerar Legenda Mágica
                  </>
                )}
              </button>
           </div>
        </div>

        {/* OUTPUT AREA */}
        <div className="relative">
           {!result && !isGenerating ? (
             <div className="h-[580px] border-2 border-dashed border-slate-800/50 rounded-[3rem] flex flex-col items-center justify-center opacity-30">
                <BrainCircuit size={48} className="text-slate-600 mb-4" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center px-12">
                  Pronto para criar conteúdo de alto impacto? Insira seu rascunho ao lado.
                </p>
             </div>
           ) : (
             <div className="bg-[#0B1221] border border-slate-800/60 rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] sticky top-28 animate-fade-in relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>

                <div className="flex items-center justify-between mb-8 px-1">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Sugestão da IA</span>
                   </div>
                   <button
                     onClick={handleCopy}
                     className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                       copied ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#050B14] text-slate-400 hover:text-white border border-slate-800'
                     }`}
                   >
                     {copied ? <><Check size={14} /> Copiado!</> : <><Clipboard size={14} /> Copiar Texto</>}
                   </button>
                </div>

                <div className="bg-[#050B14] border border-slate-800/60 rounded-[2rem] p-7 text-slate-300 text-sm leading-relaxed min-h-[300px] font-sans whitespace-pre-line group-hover:border-slate-700 transition-colors">
                  {isGenerating ? (
                    <div className="space-y-4 animate-pulse">
                       <div className="h-2.5 bg-slate-800 rounded-full w-full"></div>
                       <div className="h-2.5 bg-slate-800 rounded-full w-5/6"></div>
                       <div className="h-2.5 bg-slate-800 rounded-full w-4/6"></div>
                       <div className="h-2.5 bg-slate-800 rounded-full w-full mt-8"></div>
                       <div className="h-2.5 bg-slate-800 rounded-full w-3/4"></div>
                    </div>
                  ) : result}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-br from-[#050B14] to-transparent border border-slate-800/50 rounded-3xl">
                   <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Dica de Performance</h5>
                   <p className="text-[11px] text-slate-400 leading-normal italic">
                     "Esta sugestão foi otimizada para o algoritmo do Instagram, focando em retenção nos primeiros 2 segundos e um CTA claro no final."
                   </p>
                </div>
             </div>
           )}
        </div>

      </div>
    </div>
  )
}

export default CopyAI

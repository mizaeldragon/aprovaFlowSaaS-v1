import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createPostWithImage, getPostById, improveCopyWithAI, updatePostWithImage } from '../services/postsService'
import { Image as ImageIcon, Layout, Send, ChevronRight } from 'lucide-react'

const initialFormState = {
  title: '',
  clientName: '',
  channel: 'Instagram',
  slaHours: '48',
  caption: '',
  imageFile: null,
}

function CreatePost() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editPostId = searchParams.get('editPostId')
  const isEditMode = Boolean(editPostId)
  const returnTo = searchParams.get('from') === 'projects' ? '/projects' : '/dashboard'

  const [form, setForm] = useState(initialFormState)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [isLoadingPost, setIsLoadingPost] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [error, setError] = useState('')

  const submitButtonLabel = useMemo(() => {
    if (isSubmitting && isEditMode) return 'Salvando ajustes...'
    if (isSubmitting) return 'Finalizando arte...'
    if (isEditMode) return 'Salvar ajustes'
    return 'Criar link magico'
  }, [isSubmitting, isEditMode])

  useEffect(() => {
    let active = true

    const loadPostForEdit = async () => {
      if (!isEditMode) return
      setIsLoadingPost(true)
      setError('')
      try {
        const post = await getPostById(editPostId)
        if (!active) return
        setForm({
          title: post.title || '',
          clientName: post.clientName || '',
          channel: post.channel || 'Instagram',
          slaHours: String(post.slaHours || 48),
          caption: post.caption || '',
          imageFile: null,
        })
        setCurrentImageUrl(post.imageUrl || '')
      } catch {
        if (!active) return
        setError('Nao foi possivel carregar o projeto para edicao.')
      } finally {
        if (active) setIsLoadingPost(false)
      }
    }

    loadPostForEdit()

    return () => {
      active = false
    }
  }, [editPostId, isEditMode])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setForm((prev) => ({ ...prev, imageFile: file }))
  }

  const handleImproveCopy = async (tone) => {
    if (!form.caption.trim()) return
    setIsImproving(true)
    try {
      const res = await improveCopyWithAI(form.caption, tone)
      setForm((prev) => ({ ...prev, caption: res.improvedCopy }))
    } catch {
      setError('Falha ao contatar a inteligencia artificial.')
    } finally {
      setIsImproving(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const missingImage = !isEditMode && !form.imageFile
    const missingImageOnEdit = isEditMode && !form.imageFile && !currentImageUrl

    if (!form.title.trim() || !form.clientName.trim() || !form.channel || !form.caption.trim() || missingImage || missingImageOnEdit) {
      setError('Por favor, preencha todos os campos e selecione uma imagem ou video.')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditMode) {
        await updatePostWithImage({
          postId: editPostId,
          title: form.title.trim(),
          clientName: form.clientName.trim(),
          channel: form.channel,
          slaHours: Number(form.slaHours) || 48,
          caption: form.caption.trim(),
          imageFile: form.imageFile,
          currentImageUrl,
          actorName: 'Agency',
        })
        navigate(returnTo)
        return
      }

      await createPostWithImage({
        title: form.title.trim(),
        clientName: form.clientName.trim(),
        channel: form.channel,
        slaHours: Number(form.slaHours) || 48,
        caption: form.caption.trim(),
        imageFile: form.imageFile,
      })

      setForm(initialFormState)
      navigate('/dashboard')
    } catch (submitError) {
      setError(submitError.message || 'Nao foi possivel salvar o projeto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="max-w-4xl mx-auto pb-12 font-sans animate-fade-in">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3 justify-center sm:justify-start">
          <Layout className="text-cyan-400" /> {isEditMode ? 'Editar Projeto' : 'Novo Projeto de Aprovacao'}
        </h1>
        <p className="text-sm font-medium text-slate-400">
          {isEditMode
            ? 'Ajuste os dados da peca e salve para reenviar para aprovacao.'
            : 'Transforme suas artes em links de aprovacao profissionais em segundos.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-[#0B1221] p-6 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-800/60 transition-all hover:border-slate-700/80 relative overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                  Titulo da obra
                </label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full bg-[#050B14] border border-slate-800/60 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:ring-1 ring-cyan-500 transition-all placeholder:text-slate-800 font-sans shadow-inner"
                  placeholder="Ex: Campanha de Natal"
                  required
                />
              </div>

              <div>
                <label htmlFor="channel" className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                  Canal de destino
                </label>
                <div className="relative">
                  <select
                    id="channel"
                    name="channel"
                    value={form.channel}
                    onChange={handleChange}
                    className="w-full bg-[#050B14] border border-slate-800/60 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:ring-1 ring-cyan-500 transition-all appearance-none cursor-pointer font-sans shadow-inner"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="slaHours" className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                  SLA de aprovacao (horas)
                </label>
                <select
                  id="slaHours"
                  name="slaHours"
                  value={form.slaHours}
                  onChange={handleChange}
                  className="w-full bg-[#050B14] border border-slate-800/60 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:ring-1 ring-cyan-500 transition-all appearance-none cursor-pointer font-sans shadow-inner"
                >
                  <option value="24">24 horas</option>
                  <option value="48">48 horas</option>
                  <option value="72">72 horas</option>
                </select>
              </div>

              <div>
                <label htmlFor="clientName" className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                  Nome do cliente
                </label>
                <input
                  id="clientName"
                  name="clientName"
                  value={form.clientName}
                  onChange={handleChange}
                  className="w-full bg-[#050B14] border border-slate-800/60 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:ring-1 ring-cyan-500 transition-all placeholder:text-slate-600 font-sans shadow-inner"
                  placeholder="Ex: Cliente X"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                  Upload do criativo
                </label>
                <div className="relative group">
                  <input id="imageFile" name="imageFile" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" onChange={handleFileChange} className="hidden" />
                  <label
                    htmlFor="imageFile"
                    className={`flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all duration-500 ${
                      form.imageFile ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-800 bg-[#050B14] hover:bg-[#111827] hover:border-slate-700'
                    }`}
                  >
                    {form.imageFile ? (
                      <div className="flex flex-col items-center px-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-3 text-cyan-400 ring-4 ring-cyan-500/10">
                          <ImageIcon size={28} />
                        </div>
                        <p className="text-xs font-bold text-cyan-400 truncate max-w-[220px]">{form.imageFile.name}</p>
                        <p className="text-[10px] text-cyan-600 mt-2 uppercase tracking-widest font-black">Clique para substituir</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mb-4 text-slate-600 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all group-hover:scale-110 duration-500 shadow-xl">
                          <ImageIcon size={28} />
                        </div>
                        <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Arraste ou clique para enviar</p>
                        <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-[0.2em]">Imagem ate 10MB ou video Pro ate 150MB</p>
                      </>
                    )}
                  </label>
                </div>
                {isEditMode && currentImageUrl ? (
                  <p className="mt-2 px-1 text-[10px] font-semibold tracking-wider text-slate-500">
                    Midia atual sera mantida se voce nao selecionar outra.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-3 px-1">
                <label htmlFor="caption" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Legenda / Copy
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleImproveCopy('persuasive')}
                    disabled={isImproving || !form.caption.trim()}
                    className="text-[9px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 px-3 py-2 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 disabled:opacity-30 transition-all font-sans"
                  >
                    {isImproving ? '...' : 'Persuadir'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImproveCopy('short')}
                    disabled={isImproving || !form.caption.trim()}
                    className="text-[9px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 px-3 py-2 rounded-xl border border-purple-500/20 hover:bg-purple-500/20 disabled:opacity-30 transition-all font-sans"
                  >
                    {isImproving ? '...' : 'Resumir'}
                  </button>
                </div>
              </div>
              <textarea
                id="caption"
                name="caption"
                value={form.caption}
                onChange={handleChange}
                className="flex-1 w-full bg-[#050B14] border border-slate-800/60 rounded-[2.5rem] px-7 py-7 text-white text-sm outline-none focus:ring-1 ring-cyan-500 transition-all resize-none placeholder:text-slate-800 leading-relaxed font-sans shadow-inner min-h-[320px]"
                placeholder="Escreva a legenda aqui..."
                required
              />
            </div>
          </div>

          {error && (
            <div className="mt-8 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center gap-3 animate-in slide-in-from-bottom-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {error}
            </div>
          )}

          <div className="mt-10 flex flex-col sm:flex-row gap-6 items-center justify-between border-t border-slate-800/50 pt-8">
            <div className="flex items-center gap-3 bg-[#050B14] px-5 py-3 rounded-2xl border border-slate-800/30 hidden sm:flex">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servidor de Link Magico Online</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoadingPost}
              className="group w-full sm:w-auto bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 font-black px-14 py-5 rounded-[2rem] text-sm transition-all shadow-[0_15px_30px_-10px_rgba(34,211,238,0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 uppercase tracking-[0.1em] flex items-center justify-center gap-3 font-sans"
            >
              {submitButtonLabel}
              <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

export default CreatePost

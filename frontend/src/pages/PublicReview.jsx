import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import StatusBadge from '../components/ui/StatusBadge'
import { getPostByPublicSlug, submitPostReviewAction, undoPublicReview } from '../services/reviewService'
import { isVideoAsset } from '../services/storageService'
import { CheckCircle2, RotateCcw } from 'lucide-react'

const initialFormState = {
  authorName: '',
  comment: '',
}

// Convert Hex to RGBA for transparent backgrounds
function hexToRgba(hex, opacity = 1) {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + opacity + ')';
  }
  return `rgba(15, 23, 42, ${opacity})`;
}

function PublicReview() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [form, setForm] = useState(initialFormState)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadPost() {
      setLoading(true)
      try {
        const data = await getPostByPublicSlug(slug)
        if (isMounted) setPost(data)
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Não foi possível carregar o post.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPost()
    return () => { isMounted = false }
  }, [slug])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const fireConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) { return Math.random() * (max - min) + min; }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) { return clearInterval(interval); }
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }

  const handleAction = async (action) => {
    if (!post) return
    setIsSubmitting(true)
    setError('')

    try {
      if (action === 'approved') fireConfetti();

      // FIX: usa post.public_slug (publicToken) para identificar o post sem expor o UUID interno
      const result = await submitPostReviewAction({
        postId: post.public_slug,
        authorName: form.authorName,
        comment: form.comment,
        action,
      })

      if (result.status) setPost((prev) => ({ ...prev, status: result.status }))
      setForm((prev) => ({ ...prev, comment: '' }))
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível enviar sua ação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUndo = async () => {
    if (!post) return
    setIsSubmitting(true)
    try {
      // FIX: usa endpoint público com publicToken — sem expor UUID interno
      await undoPublicReview(post.public_slug, form.authorName)
      setPost((prev) => ({ ...prev, status: 'pending' }))
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <p className="text-slate-500 animate-pulse font-medium">Carregando apresentação...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Ops! Link inativo.</h1>
        <p className="text-slate-500 mb-6 max-w-md">O conteúdo que você tentou acessar não foi encontrado ou a avaliação já foi encerrada.</p>
        <Link to="/" className="text-slate-900 border border-slate-300 rounded-xl px-6 py-2.5 hover:bg-slate-100 font-semibold transition-all">Voltar ao site</Link>
      </div>
    )
  }

  // Identidade White-label (Fallback para o verde da plataforma)
  const isApproved = post.status === 'approved'
  const brandColor = post?.tenant?.themeColor || '#059669'
  const agencyLogo = post?.tenant?.logoUrl || ''
  const agencyName = post?.tenant?.name || 'Agência'

  return (
    <div className="min-h-screen bg-[#050B14] bg-dots-pattern">
      {/* Logo Premium White-Label (Canto Esquerdo Absoluto) */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        {agencyLogo ? (
          <img src={agencyLogo} alt="Logo da Agência" className="h-12 sm:h-16 max-w-[200px] sm:max-w-[260px] object-contain drop-shadow-sm transition-all" />
        ) : (
          <div className="rounded-xl border border-slate-700/80 bg-[#0B1221]/90 px-4 py-2.5 text-sm font-bold text-slate-200 shadow-lg backdrop-blur-sm">
            {agencyName}
          </div>
        )}
      </div>

      <main className="mx-auto w-full max-w-3xl px-5 pt-20 sm:pt-24 pb-12">
        
        {/* Aviso de Confidencialidade Simulado */}
        <div className="flex items-center justify-center gap-2 mb-6 text-[10px] font-bold text-slate-500 tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          Pronto para Avaliação
        </div>

        {/* Card do Conteúdo Principal */}
        <article className="rounded-3xl bg-[#0B1221] p-6 sm:p-8 shadow-2xl border border-slate-800/60 relative overflow-hidden">

          {/* Se aprovado, cobrir de forma heróica */}
          {isApproved && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0B1221]/95 backdrop-blur-md animate-fade-in text-center p-8">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-[0_0_40px_rgba(34,211,238,0.3)]"
                style={{ backgroundColor: hexToRgba(brandColor, 0.1), color: brandColor }}
              >
                <CheckCircle2 size={48} strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">Arte Aprovada!</h2>
              <p className="text-slate-400 font-medium mb-10 text-lg">Tudo certo! Nossa equipe já foi notificada para dar andamento.</p>

              <button
                onClick={handleUndo}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 font-semibold transition-colors"
                disabled={isSubmitting || !form.authorName.trim()}
              >
                <RotateCcw size={16} /> Clicou sem querer? Desfazer aprovação.
              </button>
            </div>
          )}

          <div className="mb-8 flex flex-col gap-3 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {post.title}
            </h1>
            <div className="flex justify-center mt-2">
               <StatusBadge status={post.status} />
            </div>
          </div>

          {post.image_url && (
            <div className="relative group rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 mb-8 border border-slate-700/50">
              {isVideoAsset(post.media_type) ? (
                <video
                  src={post.image_url}
                  className="max-h-[680px] w-full bg-black"
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="max-h-[600px] w-full object-cover transform bg-[#050B14]"
                />
              )}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none"></div>
            </div>
          )}

          <div className="rounded-2xl p-5 bg-[#0F172A] border border-[#1E293B]">
            <p className="whitespace-pre-wrap text-[15px] sm:text-base leading-relaxed text-slate-300 font-medium text-center">
              {post.caption}
            </p>
          </div>
        </article>

        {/* Card de Ações e Feedback */}
        {!isApproved && (
          <section className="rounded-3xl bg-[#0B1221] p-6 sm:p-8 mt-6 shadow-2xl border border-slate-800/60 relative bottom-0">
            <h4 className="mb-1 text-xl font-bold text-white tracking-tight">Avalie a Entrega</h4>
            <p className="text-sm text-slate-500 mb-6 font-medium">Deixe seus comentários e decida o rumo desta peça criativa.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="authorName" className="app-label">Seu Nome</label>
                  <input
                    id="authorName"
                    name="authorName"
                    value={form.authorName}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Ex: Joao Silva"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="comment" className="app-label">Comentário / Ajuste</label>
                  <input
                    id="comment"
                    name="comment"
                    value={form.comment}
                    onChange={handleChange}
                    className="app-input"
                    placeholder="Se houver ajuste, descreva aqui..."
                  />
                </div>
              </div>

              {!form.authorName.trim() && (
                <p className="text-xs font-semibold text-amber-400">
                  Informe seu nome para aprovar, comentar ou pedir ajuste.
                </p>
              )}

              {error && (
               <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400 mt-2 animate-fade-in shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                 {error}
               </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-slate-800/50">
                <button
                  type="button"
                  onClick={() => handleAction('approved')}
                  disabled={isSubmitting || !form.authorName.trim()}
                  style={{ backgroundColor: brandColor, boxShadow: `0 0 20px ${hexToRgba(brandColor, 0.4)}` }}
                  className="flex-1 w-full flex items-center justify-center gap-2 rounded-2xl py-4 sm:py-4 px-6 text-lg font-extrabold text-white shadow-xl hover:scale-[1.02] hover:brightness-110 transform transition-all disabled:opacity-60 disabled:scale-100 outline-none"
                >
                  <CheckCircle2 size={24} /> APROVAR ARTE
                </button>

                <div className="flex gap-4 flex-1 w-full">
                  <button
                    type="button"
                    onClick={() => handleAction('changes_requested')}
                    disabled={isSubmitting || !form.authorName.trim()}
                    className="flex-1 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)] py-3 px-4 text-sm font-bold transition-all disabled:opacity-60"
                  >
                    Reprovar Ajuste
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('comment')}
                    disabled={isSubmitting || !form.comment.trim() || !form.authorName.trim()}
                    className="flex-1 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white py-3 px-4 text-sm font-bold transition-all disabled:opacity-60"
                  >
                    Só Comentar
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-bold tracking-widest text-slate-600 uppercase">
               <span>🔒 Secure Link</span>
               <span>🛡️ Encrypted Approval</span>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default PublicReview



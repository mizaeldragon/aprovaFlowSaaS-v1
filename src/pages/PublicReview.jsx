import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'
import { getPostByPublicSlug, submitPostReviewAction } from '../services/reviewService'

const initialFormState = {
  authorName: '',
  comment: '',
}

function PublicReview() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [form, setForm] = useState(initialFormState)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadPost() {
      setLoading(true)
      setError('')

      try {
        const data = await getPostByPublicSlug(slug)
        if (isMounted) {
          setPost(data)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Nao foi possivel carregar o post.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadPost()
    return () => {
      isMounted = false
    }
  }, [slug])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAction = async (action) => {
    if (!post) return

    setIsSubmitting(true)
    setError('')
    setFeedback('')

    try {
      const result = await submitPostReviewAction({
        postId: post.id,
        authorName: form.authorName,
        comment: form.comment,
        action,
      })

      if (result.status) {
        setPost((prev) => ({ ...prev, status: result.status }))
      }

      setForm((prev) => ({ ...prev, comment: '' }))
      setFeedback('Acao registrada com sucesso.')
    } catch (submitError) {
      setError(submitError.message || 'Nao foi possivel enviar sua acao.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section>
        <PageHeader title="Revisao Publica" description="Carregando revisao..." />
      </section>
    )
  }

  if (!post) {
    return (
      <section>
        <PageHeader title="Revisao Publica" description="Conteudo nao encontrado para este slug." />
        {error && <p className="mb-3 text-sm text-rose-700">{error}</p>}
        <Link to="/" className="text-sm font-medium text-slate-900 underline">
          Voltar para criacao
        </Link>
      </section>
    )
  }

  return (
    <section>
      <PageHeader
        title="Revisao Publica"
        description={`Criado em ${new Date(post.created_at).toLocaleDateString('pt-BR')}`}
      />

      <article className="app-card p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{post.title}</h3>
          <StatusBadge status={post.status} />
        </div>

        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            className="mb-5 max-h-[420px] w-full rounded-xl border border-slate-200 object-cover"
          />
        )}

        <p className="mb-2 text-sm font-medium text-slate-600">Canal: {post.channel}</p>
        <p className="whitespace-pre-wrap text-base leading-7 text-slate-700">{post.caption}</p>
      </article>

      <section className="app-card mt-6 p-5 sm:p-7">
        <h4 className="mb-5 text-lg font-semibold text-slate-900">Deixe sua revisao</h4>

        <div className="space-y-4">
          <div>
            <label htmlFor="authorName" className="app-label">
              Nome (opcional)
            </label>
            <input
              id="authorName"
              name="authorName"
              value={form.authorName}
              onChange={handleChange}
              className="app-input"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label htmlFor="comment" className="app-label">
              Comentario
            </label>
            <textarea
              id="comment"
              name="comment"
              value={form.comment}
              onChange={handleChange}
              rows={5}
              className="app-input min-h-36 resize-y"
              placeholder="Escreva seu feedback"
            />
          </div>

          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          {feedback && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {feedback}
            </p>
          )}

          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => handleAction('approved')}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Aprovar
            </button>
            <button
              type="button"
              onClick={() => handleAction('changes_requested')}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Solicitar ajuste
            </button>
            <button
              type="button"
              onClick={() => handleAction('comment')}
              disabled={isSubmitting}
              className="btn-primary w-full sm:w-auto"
            >
              Comentar
            </button>
          </div>
        </div>
      </section>
    </section>
  )
}

export default PublicReview

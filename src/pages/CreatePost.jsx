import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import { createPostWithImage } from '../services/postsService'

const initialFormState = {
  title: '',
  channel: 'Instagram',
  caption: '',
  imageFile: null,
}

function CreatePost() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setForm((prev) => ({ ...prev, imageFile: file }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.title.trim() || !form.channel || !form.caption.trim() || !form.imageFile) {
      return
    }

    setIsSubmitting(true)
    try {
      await createPostWithImage({
        title: form.title.trim(),
        channel: form.channel,
        caption: form.caption.trim(),
        imageFile: form.imageFile,
      })

      setForm(initialFormState)
      navigate('/dashboard')
    } catch (submitError) {
      setError(submitError.message || 'Nao foi possivel criar o post.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <PageHeader
        title="Novo Post"
        description="Preencha os dados da campanha, envie a arte e gere o link publico de aprovacao."
      />

      <form onSubmit={handleSubmit} className="app-card space-y-5 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="app-label">
            Titulo
            </label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="app-input"
              placeholder="Ex: Campanha de Dia das Maes"
              required
            />
          </div>

          <div>
            <label htmlFor="channel" className="app-label">
            Canal
            </label>
            <select
              id="channel"
              name="channel"
              value={form.channel}
              onChange={handleChange}
              className="app-input"
            >
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="caption" className="app-label">
            Caption
          </label>
          <textarea
            id="caption"
            name="caption"
            value={form.caption}
            onChange={handleChange}
            rows={8}
            className="app-input min-h-44 resize-y"
            placeholder="Escreva a legenda do post com contexto e CTA para aprovacao."
            required
          />
        </div>

        <div>
          <label htmlFor="imageFile" className="app-label">
            Imagem
          </label>
          <input
            id="imageFile"
            name="imageFile"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="app-input block file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
            required
          />
        </div>

        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full sm:w-auto"
        >
          {isSubmitting ? 'Salvando...' : 'Gerar link de aprovacao'}
        </button>
      </form>
    </section>
  )
}

export default CreatePost

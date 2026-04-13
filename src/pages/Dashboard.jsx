import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ExternalLink, Link2, Menu, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'
import { deletePostById, listCommentsByPostId, listPosts, updatePostById } from '../services/reviewService'
import { uploadImageToCreativeAssets } from '../services/storageService'

const ACTION_LABELS = {
  approved: 'Aprovado',
  changes_requested: 'Ajustes solicitados',
  comment: 'Comentario',
}
const ALLOWED_CHANNELS = ['Instagram', 'LinkedIn', 'Facebook']
const POSTS_PER_PAGE = 6
const COMMENTS_PER_PAGE = 4

function Dashboard() {
  const [posts, setPosts] = useState([])
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [comments, setComments] = useState([])
  const [postsPage, setPostsPage] = useState(1)
  const [commentsPage, setCommentsPage] = useState(1)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingComments, setLoadingComments] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')
  const [openMenuPostId, setOpenMenuPostId] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingPost, setDeletingPost] = useState(null)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [editImageFile, setEditImageFile] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    channel: 'Instagram',
    caption: '',
    status: 'pending',
    public_slug: '',
    image_url: '',
  })

  const actionsMenuRef = useRef(null)
  const menuButtonRefs = useRef(new Map())

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  )

  const openMenuPost = useMemo(
    () => posts.find((post) => post.id === openMenuPostId) ?? null,
    [posts, openMenuPostId],
  )
  const totalPostsPages = useMemo(() => Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE)), [posts.length])
  const paginatedPosts = useMemo(() => {
    const start = (postsPage - 1) * POSTS_PER_PAGE
    return posts.slice(start, start + POSTS_PER_PAGE)
  }, [posts, postsPage])
  const totalCommentsPages = useMemo(
    () => Math.max(1, Math.ceil(comments.length / COMMENTS_PER_PAGE)),
    [comments.length],
  )
  const paginatedComments = useMemo(() => {
    const start = (commentsPage - 1) * COMMENTS_PER_PAGE
    return comments.slice(start, start + COMMENTS_PER_PAGE)
  }, [comments, commentsPage])

  useEffect(() => {
    let active = true

    async function loadPosts() {
      setLoadingPosts(true)
      setError('')
      try {
        const data = await listPosts()
        if (!active) return
        setPosts(data)
        setPostsPage(1)
        setSelectedPostId((prev) => prev ?? data[0]?.id ?? null)
      } catch (loadError) {
        if (active) setError(loadError.message || 'Nao foi possivel carregar os posts.')
      } finally {
        if (active) setLoadingPosts(false)
      }
    }

    loadPosts()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadComments() {
      if (!selectedPostId) {
        setComments([])
        setCommentsPage(1)
        return
      }

      setLoadingComments(true)
      setError('')
      try {
        const data = await listCommentsByPostId(selectedPostId)
        if (active) {
          setComments(data)
          setCommentsPage(1)
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Nao foi possivel carregar os comentarios.')
      } finally {
        if (active) setLoadingComments(false)
      }
    }

    loadComments()

    return () => {
      active = false
    }
  }, [selectedPostId])

  useEffect(() => {
    if (postsPage > totalPostsPages) {
      setPostsPage(totalPostsPages)
    }
  }, [postsPage, totalPostsPages])

  useEffect(() => {
    if (commentsPage > totalCommentsPages) {
      setCommentsPage(totalCommentsPages)
    }
  }, [commentsPage, totalCommentsPages])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsMenuRef.current?.contains(event.target)) return

      const activeButton = menuButtonRefs.current.get(openMenuPostId)
      if (activeButton?.contains(event.target)) return

      setOpenMenuPostId(null)
    }

    const handleViewportChange = () => {
      if (openMenuPostId) {
        setOpenMenuPostId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [openMenuPostId])

  const setMenuButtonRef = (postId, element) => {
    if (!element) {
      menuButtonRefs.current.delete(postId)
      return
    }
    menuButtonRefs.current.set(postId, element)
  }

  const handleToggleMenu = (event, postId) => {
    event.stopPropagation()

    if (openMenuPostId === postId) {
      setOpenMenuPostId(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 192
    const left = Math.min(Math.max(rect.right - menuWidth, 12), window.innerWidth - menuWidth - 12)

    setMenuPosition({
      top: rect.bottom + 8,
      left,
    })
    setOpenMenuPostId(postId)
  }

  const handleCopyPublicLink = async (slug) => {
    const url = `${window.location.origin}/review/${slug}`

    try {
      await navigator.clipboard.writeText(url)
      setCopyFeedback('Link copiado.')
      window.setTimeout(() => setCopyFeedback(''), 2000)
    } catch {
      setCopyFeedback('Nao foi possivel copiar o link.')
      window.setTimeout(() => setCopyFeedback(''), 2000)
    }
  }

  const openEditModal = (post) => {
    setEditingPost(post)
    setEditImageFile(null)
    setEditForm({
      title: post.title ?? '',
      channel: post.channel ?? 'Instagram',
      caption: post.caption ?? '',
      status: post.status ?? 'pending',
      public_slug: post.public_slug ?? '',
      image_url: post.image_url ?? '',
    })
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    if (isSavingEdit) return
    setIsEditModalOpen(false)
    setEditingPost(null)
  }

  const handleEditFormChange = (event) => {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditImageChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setEditImageFile(file)
  }

  const handleSaveEdit = async () => {
    if (!editingPost) return

    const normalizedChannel = editForm.channel.trim()
    if (!ALLOWED_CHANNELS.includes(normalizedChannel)) {
      setError('Canal invalido. Use: Instagram, LinkedIn ou Facebook.')
      return
    }

    setIsSavingEdit(true)
    try {
      setError('')
      let nextImageUrl = editForm.image_url.trim() || null

      if (editImageFile) {
        nextImageUrl = await uploadImageToCreativeAssets(editImageFile)
      }

      const updatedPost = await updatePostById(editingPost.id, {
        title: editForm.title.trim(),
        channel: normalizedChannel,
        caption: editForm.caption.trim(),
        status: editForm.status.trim(),
        public_slug: editForm.public_slug.trim(),
        image_url: nextImageUrl,
      })

      setPosts((prev) => prev.map((item) => (item.id === editingPost.id ? updatedPost : item)))
      setCopyFeedback('Post atualizado com sucesso.')
      window.setTimeout(() => setCopyFeedback(''), 2000)
      closeEditModal()
    } catch (editError) {
      setError(editError.message || 'Nao foi possivel editar o post.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const openDeleteModal = (post) => {
    setDeletingPost(post)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    if (isDeletingPost) return
    setIsDeleteModalOpen(false)
    setDeletingPost(null)
  }

  const confirmDeletePost = async () => {
    if (!deletingPost) return

    setIsDeletingPost(true)
    try {
      setError('')
      await deletePostById(deletingPost.id)

      setPosts((prev) => {
        const nextPosts = prev.filter((item) => item.id !== deletingPost.id)
        setSelectedPostId((current) => (current === deletingPost.id ? (nextPosts[0]?.id ?? null) : current))
        return nextPosts
      })

      setCopyFeedback('Post excluido com sucesso.')
      window.setTimeout(() => setCopyFeedback(''), 2000)
      closeDeleteModal()
    } catch (deleteError) {
      setError(deleteError.message || 'Nao foi possivel excluir o post.')
    } finally {
      setIsDeletingPost(false)
    }
  }

  const renderPostActions = (post) => (
    <div className="inline-flex">
      <button
        ref={(element) => setMenuButtonRef(post.id, element)}
        type="button"
        onClick={(event) => handleToggleMenu(event, post.id)}
        className="btn-secondary h-10 w-10 px-0"
        aria-label="Abrir menu de acoes"
      >
        <Menu size={18} strokeWidth={2.7} />
      </button>
    </div>
  )

  const renderPagination = ({ page, totalPages, onPrev, onNext, itemLabel }) => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
        <p className="text-slate-600">
          Pagina {page} de {totalPages} ({itemLabel})
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={page === 1}
            className="btn-secondary h-8 px-2.5 text-xs disabled:opacity-50"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={page === totalPages}
            className="btn-secondary h-8 px-2.5 text-xs disabled:opacity-50"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <section>
      <PageHeader
        title="Painel"
        description="Acompanhe todos os posts, compartilhe o link publico e consulte os comentarios de aprovacao."
      />

      {error && (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {copyFeedback && (
        <p className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
          {copyFeedback}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[2.2fr_1fr]">
        <div className="app-card overflow-hidden">
          {loadingPosts ? (
            <p className="px-6 py-8 text-sm text-slate-600">Carregando posts...</p>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {paginatedPosts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => setSelectedPostId(post.id)}
                    className={`rounded-xl border p-3 transition-colors ${
                      selectedPostId === post.id
                        ? 'border-slate-300 bg-slate-50'
                        : 'border-slate-200 bg-white active:bg-slate-50'
                    }`}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-500">
                          N/A
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{post.title}</p>
                        <p className="text-xs text-slate-600">{post.channel}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(post.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <StatusBadge status={post.status} />
                    </div>
                    {renderPostActions(post)}
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50/70 text-slate-600">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Imagem</th>
                      <th className="px-5 py-3.5 font-semibold">Titulo</th>
                      <th className="px-5 py-3.5 font-semibold">Canal</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 font-semibold">Data</th>
                      <th className="w-[120px] px-5 py-3.5 font-semibold">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPosts.map((post) => (
                      <tr
                        key={post.id}
                        className={`text-slate-700 transition-colors ${
                          selectedPostId === post.id ? 'bg-slate-50' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedPostId(post.id)}
                      >
                        <td className="px-5 py-3.5">
                          {post.image_url ? (
                            <img
                              src={post.image_url}
                              alt={post.title}
                              className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-500">
                              N/A
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-900">{post.title}</td>
                        <td className="px-5 py-3.5">{post.channel}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={post.status} />
                        </td>
                        <td className="px-5 py-3.5">{new Date(post.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="w-[120px] px-5 py-3.5">{renderPostActions(post)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination({
                page: postsPage,
                totalPages: totalPostsPages,
                onPrev: () => setPostsPage((prev) => Math.max(1, prev - 1)),
                onNext: () => setPostsPage((prev) => Math.min(totalPostsPages, prev + 1)),
                itemLabel: `${posts.length} posts`,
              })}
            </>
          )}
        </div>

        <aside className="app-card p-5">
          <h3 className="mb-1 text-base font-semibold text-slate-900">Comentarios</h3>
          <p className="mb-4 text-sm leading-6 text-slate-600">
            {selectedPost ? `Post selecionado: ${selectedPost.title}` : 'Selecione um post para ver comentarios.'}
          </p>

          {loadingComments ? (
            <p className="text-sm text-slate-600">Carregando comentarios...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum comentario para este post.</p>
          ) : (
            <ul className="space-y-3">
              {paginatedComments.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{item.author_name || 'Anonimo'}</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {ACTION_LABELS[item.action] ?? item.action}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{item.comment}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {renderPagination({
            page: commentsPage,
            totalPages: totalCommentsPages,
            onPrev: () => setCommentsPage((prev) => Math.max(1, prev - 1)),
            onNext: () => setCommentsPage((prev) => Math.min(totalCommentsPages, prev + 1)),
            itemLabel: `${comments.length} comentarios`,
          })}
        </aside>
      </div>

      {openMenuPost && (
        <div
          ref={actionsMenuRef}
          className="fixed z-[100] w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            type="button"
            onClick={() => {
              handleCopyPublicLink(openMenuPost.public_slug)
              setOpenMenuPostId(null)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            <Link2 size={15} />
            Copiar link
          </button>

          <Link
            to={`/review/${openMenuPost.public_slug}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpenMenuPostId(null)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <ExternalLink size={15} />
            Abrir pagina
          </Link>

          <button
            type="button"
            onClick={() => {
              openEditModal(openMenuPost)
              setOpenMenuPostId(null)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            <Pencil size={15} />
            Editar
          </button>

          <button
            type="button"
            onClick={() => {
              openDeleteModal(openMenuPost)
              setOpenMenuPostId(null)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
          >
            <Trash2 size={15} />
            Excluir
          </button>
        </div>
      )}

      {isEditModalOpen && editingPost && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="app-card w-full max-w-2xl p-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-slate-900">Editar post</h3>
              <p className="mt-1 text-sm text-slate-600">Atualize as informações do post selecionado.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="edit-title" className="app-label">Título</label>
                <input
                  id="edit-title"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditFormChange}
                  className="app-input"
                />
              </div>

              <div>
                <label htmlFor="edit-channel" className="app-label">Canal</label>
                <select
                  id="edit-channel"
                  name="channel"
                  value={editForm.channel}
                  onChange={handleEditFormChange}
                  className="app-input"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-status" className="app-label">Status</label>
                <select
                  id="edit-status"
                  name="status"
                  value={editForm.status}
                  onChange={handleEditFormChange}
                  className="app-input"
                >
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="changes_requested">Ajustes solicitados</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="edit-caption" className="app-label">Caption</label>
                <textarea
                  id="edit-caption"
                  name="caption"
                  value={editForm.caption}
                  onChange={handleEditFormChange}
                  rows={4}
                  className="app-input min-h-32 resize-y"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="edit-image" className="app-label">Imagem</label>
                <input
                  id="edit-image"
                  name="image_file"
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="app-input block file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {editImageFile
                    ? `Novo arquivo: ${editImageFile.name}`
                    : 'Nenhum novo arquivo selecionado. A imagem atual será mantida.'}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="edit-public-slug" className="app-label">Slug público</label>
                <input
                  id="edit-public-slug"
                  name="public_slug"
                  value={editForm.public_slug}
                  onChange={handleEditFormChange}
                  className="app-input"
                />
              </div>

              <div>
                <label className="app-label">ID</label>
                <input value={editingPost.id} className="app-input bg-slate-50" disabled />
              </div>

              <div>
                <label className="app-label">Criado em</label>
                <input
                  value={new Date(editingPost.created_at).toLocaleString('pt-BR')}
                  className="app-input bg-slate-50"
                  disabled
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeEditModal} className="btn-secondary" disabled={isSavingEdit}>
                Cancelar
              </button>
              <button type="button" onClick={handleSaveEdit} className="btn-primary !text-white" disabled={isSavingEdit}>
                {isSavingEdit ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deletingPost && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="app-card w-full max-w-md p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900">Confirmar exclusao</h3>
            <p className="mt-2 text-sm text-slate-600">
              Tem certeza que deseja excluir o post <strong>{deletingPost.title}</strong>?
            </p>
            <p className="mt-1 text-xs text-slate-500">Esta acao nao pode ser desfeita.</p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="btn-secondary"
                disabled={isDeletingPost}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeletePost}
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDeletingPost}
              >
                {isDeletingPost ? 'Excluindo...' : 'Excluir post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Dashboard

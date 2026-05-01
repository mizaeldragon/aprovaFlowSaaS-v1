import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { ChevronLeft, ChevronRight, ExternalLink, FileText, Link2, Menu, Pencil, Trash2, Video } from 'lucide-react'
import StatusBadge from '../components/ui/StatusBadge'
import { deletePostById, listPosts } from '../services/reviewService'
import api from '../services/api'
import { isVideoAsset } from '../services/storageService'

const ITEMS_PER_PAGE = 10

function Projects() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [openMenuPostId, setOpenMenuPostId] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [copyFeedback, setCopyFeedback] = useState('')
  const [deleteFeedback, setDeleteFeedback] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [deletingPost, setDeletingPost] = useState(null)
  const actionsMenuRef = useRef(null)
  const menuButtonRefs = useRef(new Map())
  const realtimeRefreshTimerRef = useRef(null)

  const loadPosts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const data = await listPosts()
      setPosts(data)
      setError('')
    } catch {
      setError('Nao foi possivel carregar os projetos.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts(true)
  }, [loadPosts])

  useEffect(() => {
    const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const socketUrl = rawApi.replace(/\/api\/?$/, '')
    const token = api.defaults.headers.common.Authorization?.replace('Bearer ', '') || null
    const socket = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
      auth: { token },
    })

    const requestRealtimeRefresh = () => {
      if (realtimeRefreshTimerRef.current) {
        window.clearTimeout(realtimeRefreshTimerRef.current)
      }
      realtimeRefreshTimerRef.current = window.setTimeout(() => {
        loadPosts(false)
      }, 300)
    }

    socket.on('dashboard:update', requestRealtimeRefresh)
    socket.on('connect', () => {
      loadPosts(false)
    })

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadPosts(false)
      }
    }
    const onWindowFocus = () => loadPosts(false)

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onWindowFocus)

    return () => {
      if (realtimeRefreshTimerRef.current) {
        window.clearTimeout(realtimeRefreshTimerRef.current)
      }
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onWindowFocus)
      socket.disconnect()
    }
  }, [loadPosts])

  const totalPages = Math.max(1, Math.ceil(posts.length / ITEMS_PER_PAGE))
  const pageStart = posts.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1
  const pageEnd = Math.min(page * ITEMS_PER_PAGE, posts.length)

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return posts.slice(start, start + ITEMS_PER_PAGE)
  }, [posts, page])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsMenuRef.current?.contains(event.target)) return
      const activeButton = menuButtonRefs.current.get(openMenuPostId)
      if (activeButton?.contains(event.target)) return
      setOpenMenuPostId(null)
    }
    const handleViewportChange = () => setOpenMenuPostId(null)
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [openMenuPostId])

  const handleToggleMenu = (event, postId) => {
    event.stopPropagation()
    if (openMenuPostId === postId) {
      setOpenMenuPostId(null)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuPosition({ top: rect.bottom + 8, left: Math.max(rect.right - 192, 12) })
    setOpenMenuPostId(postId)
  }

  const handleCopyPublicLink = async (slug) => {
    const url = `${window.location.origin}/review/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopyFeedback('Link magico copiado!')
      setTimeout(() => setCopyFeedback(''), 2200)
    } catch {
      setCopyFeedback('Erro ao copiar link.')
      setTimeout(() => setCopyFeedback(''), 2200)
    }
  }

  const handleOpenDeleteModal = (post) => {
    setDeletingPost(post)
    setIsDeleteModalOpen(true)
  }

  const handleDeletePost = async () => {
    if (!deletingPost?.id) return
    setIsDeletingPost(true)
    try {
      await deletePostById(deletingPost.id)
      setPosts((current) => current.filter((post) => post.id !== deletingPost.id))
      setDeleteFeedback('Projeto excluido com sucesso.')
      setTimeout(() => setDeleteFeedback(''), 2200)
      setError('')
      setIsDeleteModalOpen(false)
      setDeletingPost(null)
    } catch {
      setError('Nao foi possivel excluir o projeto.')
      setTimeout(() => setError(''), 2500)
    } finally {
      setIsDeletingPost(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Projetos</h1>
          <p className="mt-2 text-sm text-slate-400">Lista de projetos recentes da agencia.</p>
        </div>
        <span className="text-xs font-bold text-slate-500">{posts.length} projetos</span>
      </section>

      <section className="bg-[#0a101d] rounded-3xl p-5 xl:p-6 border border-slate-800/60 shadow-2xl overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base xl:text-lg font-bold text-white">Projetos Recentes</h2>
          <span />
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Nome da Obra</th>
              <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Canal</th>
              <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
              <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr><td colSpan="4" className="py-8 text-center text-sm text-slate-500">Carregando projetos...</td></tr>
            ) : error ? (
              <tr><td colSpan="4" className="py-8 text-center text-sm text-rose-400">{error}</td></tr>
            ) : paginatedPosts.length === 0 ? (
              <tr><td colSpan="4" className="py-8 text-center text-sm text-slate-500">Nenhum projeto encontrado.</td></tr>
            ) : (
              paginatedPosts.map((post) => (
                <tr key={post.id} className="hover:bg-[#111827]/40 transition-colors">
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      {post.image_url && isVideoAsset(post.media_type) ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500/10 ring-1 ring-cyan-500/30">
                          <Video size={14} className="text-cyan-300" />
                        </div>
                      ) : post.image_url ? (
                        <img src={post.image_url} className="h-8 w-8 rounded-md object-cover ring-1 ring-white/10" alt="" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#111827] ring-1 ring-slate-800">
                          <FileText size={14} className="text-slate-500" />
                        </div>
                      )}
                      <div>
                        <p className="line-clamp-1 text-[13px] font-bold text-white">{post.title}</p>
                        <p className="text-[9px] tracking-wider text-slate-500">ID: #{post.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-[11px] font-medium text-slate-400">{post.channel}</td>
                  <td className="px-2 py-3">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-2 py-3 text-right relative">
                    <button
                      ref={(el) => { if (el) menuButtonRefs.current.set(post.id, el) }}
                      onClick={(event) => handleToggleMenu(event, post.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                    >
                      <Menu size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {posts.length > 0 ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-400">
              Mostrando {pageStart} - {pageEnd} de {posts.length}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-300">Pagina {page} de {totalPages}</span>
              <div className="flex overflow-hidden rounded-full border border-slate-600 bg-slate-800/70">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="px-3 py-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Pagina anterior"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="border-l border-slate-600 px-3 py-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Proxima pagina"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {openMenuPostId && (() => {
        const selected = posts.find((item) => item.id === openMenuPostId)
        if (!selected) return null
        return (
          <div
            ref={actionsMenuRef}
            className="fixed z-[120] w-48 rounded-2xl border border-slate-700 bg-[#111827] p-1.5 shadow-2xl"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <button
              type="button"
              onClick={() => {
                handleCopyPublicLink(selected.public_slug)
                setOpenMenuPostId(null)
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-300 transition-colors hover:bg-[#1E293B] hover:text-white"
            >
              <Link2 size={16} /> Copiar Link
            </button>
            <a
              href={`/review/${selected.public_slug}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpenMenuPostId(null)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-[#1E293B] hover:text-white"
            >
              <ExternalLink size={16} /> Abrir Link Magico
            </a>
            <Link
              to={`/create?editPostId=${selected.id}&from=projects`}
              onClick={() => setOpenMenuPostId(null)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-[#1E293B] hover:text-white"
            >
              <Pencil size={16} /> Editar projeto
            </Link>
            <Link
              to={`/kanban?postId=${selected.id}`}
              onClick={() => setOpenMenuPostId(null)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-[#1E293B] hover:text-white"
            >
              <ExternalLink size={16} /> Abrir no Fluxo
            </Link>
            <button
              type="button"
              onClick={() => {
                handleOpenDeleteModal(selected)
                setOpenMenuPostId(null)
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 size={16} /> Excluir projeto
            </button>
          </div>
        )
      })()}

      {isDeleteModalOpen && deletingPost ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#050B14]/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0B1221] p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Excluir projeto?</h3>
            <p className="mt-2 text-sm text-slate-400">
              Esta acao remove permanentemente o projeto{' '}
              <strong className="text-white">{`"${deletingPost.title}"`}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isDeletingPost) return
                  setIsDeleteModalOpen(false)
                  setDeletingPost(null)
                }}
                className="px-4 py-2 text-sm font-bold text-slate-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingPost}
                onClick={handleDeletePost}
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-2.5 text-sm font-bold text-rose-300 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-60"
              >
                {isDeletingPost ? 'Excluindo...' : 'Confirmar exclusao'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {copyFeedback ? (
        <div className="fixed right-8 top-8 z-[130] rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-900 shadow-[0_5px_20px_rgba(34,211,238,0.4)]">
          {copyFeedback}
        </div>
      ) : null}
      {deleteFeedback ? (
        <div className="fixed right-8 top-24 z-[130] rounded-xl bg-rose-500 px-6 py-3 font-bold text-white shadow-[0_5px_20px_rgba(244,63,94,0.4)]">
          {deleteFeedback}
        </div>
      ) : null}
    </div>
  )
}

export default Projects

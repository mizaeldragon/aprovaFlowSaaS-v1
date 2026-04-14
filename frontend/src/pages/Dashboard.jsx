import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Menu, Pencil, Trash2, 
  Clock, CheckCircle, RotateCw, Activity, 
  FileText, Link2, ExternalLink, Plus, Sparkles, AlertCircle
} from 'lucide-react'
import StatusBadge from '../components/ui/StatusBadge'
import { deletePostById, listPosts, updatePostById, createPost } from '../services/reviewService'
import { uploadImageToCreativeAssets } from '../services/storageService'

const ALLOWED_CHANNELS = ['Instagram', 'LinkedIn', 'Facebook']

function Dashboard() {
  const [posts, setPosts] = useState([])
  const [selectedPostId, setSelectedPostId] = useState(null)
  
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')
  
  // Menus and Modals
  const [openMenuPostId, setOpenMenuPostId] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingPost, setDeletingPost] = useState(null)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  
  const [editImageFile, setEditImageFile] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '', channel: 'Instagram', caption: '', status: 'pending', public_slug: '', image_url: '',
  })

  const actionsMenuRef = useRef(null)
  const menuButtonRefs = useRef(new Map())

  // --- Data Fetching ---
  useEffect(() => {
    let active = true
    async function loadPosts() {
      setLoadingPosts(true)
      try {
        const data = await listPosts()
        if (active) {
          setPosts(data)
          setSelectedPostId(data[0]?.id ?? null)
        }
      } catch (err) {
        if (active) setError('Não foi possível carregar os projetos.')
      } finally {
        if (active) setLoadingPosts(false)
      }
    }
    loadPosts()
    return () => { active = false }
  }, [])

  // --- Analytics Derivations ---
  const pendingCount = posts.filter(p => p.status === 'pending').length
  const approvedCount = posts.filter(p => p.status === 'approved').length
  const adjustmentsCount = posts.filter(p => p.status === 'changes_requested').length

  // --- Handlers ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsMenuRef.current?.contains(e.target)) return
      const activeButton = menuButtonRefs.current.get(openMenuPostId)
      if (activeButton?.contains(e.target)) return
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

  const handleToggleMenu = (e, postId) => {
    e.stopPropagation()
    if (openMenuPostId === postId) {
      setOpenMenuPostId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPosition({ top: rect.bottom + 8, left: Math.max(rect.right - 192, 12) })
    setOpenMenuPostId(postId)
  }

  const handleCopyPublicLink = async (slug) => {
    const url = `${window.location.origin}/review/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopyFeedback('Link Mágico copiado!')
      setTimeout(() => setCopyFeedback(''), 3000)
    } catch {
      setCopyFeedback('Erro ao copiar link.')
      setTimeout(() => setCopyFeedback(''), 3000)
    }
  }

  // Edit Handlers
  const openEditModal = (post) => {
    setEditingPost(post)
    setEditImageFile(null)
    setEditForm({
      title: post.title || '', channel: post.channel || 'Instagram', caption: post.caption || '',
      status: post.status || 'pending', public_slug: post.public_slug || '', image_url: post.image_url || '',
    })
    setIsEditModalOpen(true)
  }

  const handleEditSave = async () => {
    setIsSavingEdit(true)
    try {
      let nextImageUrl = editForm.image_url
      if (editImageFile) nextImageUrl = await uploadImageToCreativeAssets(editImageFile)
      const updatedPost = await updatePostById(editingPost.id, { ...editForm, image_url: nextImageUrl })
      setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p))
      setIsEditModalOpen(false)
    } catch (e) {
      setError('Falha ao atualizar o projeto.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Create Handlers (Simulated or Real if createPost exists)
  const openCreateModal = () => {
    setEditImageFile(null)
    setEditForm({ title: '', channel: 'Instagram', caption: '', status: 'pending', public_slug: '', image_url: '' })
    setIsCreateModalOpen(true)
  }

  const handleCreateSave = async () => {
    setIsCreatingPost(true)
    try {
      let imageUrl = null
      if (editImageFile) imageUrl = await uploadImageToCreativeAssets(editImageFile)
      
      const slug = editForm.public_slug || Math.random().toString(36).substring(7)
      
      const newPostData = {
        title: editForm.title || 'Novo Projeto',
        channel: editForm.channel,
        caption: editForm.caption,
        status: editForm.status,
        public_slug: slug,
        image_url: imageUrl
      }
      
      if (typeof createPost === 'function') {
        const created = await createPost(newPostData)
        setPosts([created, ...posts])
      } else {
        // Fallback fake insertion if route is missing
        setPosts([{ id: Date.now(), ...newPostData, created_at: new Date().toISOString() }, ...posts])
      }
      setIsCreateModalOpen(false)
    } catch (e) {
      setError('Falha ao criar projeto.')
    } finally {
      setIsCreatingPost(false)
    }
  }

  // Delete Handlers
  const confirmDelete = async () => {
    setIsDeletingPost(true)
    try {
      await deletePostById(deletingPost.id)
      setPosts(prev => prev.filter(p => p.id !== deletingPost.id))
      setIsDeleteModalOpen(false)
    } catch {
      setError('Erro ao excluir projeto.')
    } finally {
      setIsDeletingPost(false)
    }
  }

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[#050B14] p-4 xl:px-8 xl:py-6 font-sans text-slate-300 relative overflow-hidden">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 shrink-0">
        <div>
          <h1 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight mb-1">Visão Geral do Estúdio</h1>
          <p className="text-sm text-slate-400 font-medium">Acompanhamento preciso dos seus fluxos de aprovação.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          Sincronizado
        </div>
      </header>

      {/* TOP STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5 shrink-0">
        <div className="bg-[#0B1221] rounded-2xl p-4 xl:p-5 shadow-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors shrink-0">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center ring-1 ring-cyan-500/20">
              <Clock size={16} />
            </div>
            <span className="bg-[#1E293B] text-slate-300 text-[10px] font-bold px-2 py-1 rounded bg-opacity-80">+12%</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] xl:text-xs font-bold uppercase tracking-widest mb-0.5">Aprovações Pendentes</p>
            <p className="text-2xl xl:text-3xl font-extrabold text-white">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-[#0B1221] rounded-2xl p-4 xl:p-5 shadow-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors shrink-0">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center ring-1 ring-indigo-500/20">
              <CheckCircle size={16} />
            </div>
            <span className="bg-[#1E293B] text-slate-300 text-[10px] font-bold px-2 py-1 rounded bg-opacity-80">+4</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] xl:text-xs font-bold uppercase tracking-widest mb-0.5">Aprovados Hoje</p>
            <p className="text-2xl xl:text-3xl font-extrabold text-white">{approvedCount}</p>
          </div>
        </div>

        <div className="bg-[#0B1221] rounded-2xl p-4 xl:p-5 shadow-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors shrink-0">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center ring-1 ring-rose-500/20">
              <AlertCircle size={16} />
            </div>
            <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-1 rounded bg-opacity-80">-2</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] xl:text-xs font-bold uppercase tracking-widest mb-0.5">Ajustes Solicitados</p>
            <p className="text-2xl xl:text-3xl font-extrabold text-white">{adjustmentsCount}</p>
          </div>
        </div>

        <div className="bg-[#0B1221] rounded-2xl p-4 xl:p-5 shadow-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors shrink-0">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center ring-1 ring-amber-500/20">
              <Activity size={16} />
            </div>
            <span className="bg-[#1E293B] text-slate-300 text-[10px] font-bold px-2 py-1 rounded bg-opacity-80">Rápido</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] xl:text-xs font-bold uppercase tracking-widest mb-0.5">Tempo Médio</p>
            <p className="text-2xl xl:text-3xl font-extrabold text-white">4.2h</p>
          </div>
        </div>
      </section>

      {/* MIDDLE SECTION (Charts) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5 shrink-0 h-[220px] xl:h-[260px]">
        
        {/* Productivity Chart */}
        <div className="lg:col-span-2 bg-[#0a101d] rounded-3xl p-5 xl:p-6 border border-slate-800/60 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start z-10 relative shrink-0">
             <div>
                <h3 className="text-lg xl:text-xl font-bold text-white mb-0.5">Produtividade Semanal</h3>
                <p className="text-xs font-medium text-slate-400">Velocidade de projetos ativos nos últimos 7 dias</p>
             </div>
             <div className="flex gap-4 text-xs font-bold">
               <button className="text-cyan-400 pb-1 border-b-2 border-cyan-400">Semana</button>
               <button className="text-slate-500 hover:text-slate-300 pb-1 border-b-2 border-transparent transition-colors">Mês</button>
             </div>
          </div>

          <div className="absolute inset-0 top-16 w-full h-full flex items-end">
             {/* Mocked D3 Style SVG Curve */}
             <svg viewBox="0 0 800 300" className="w-full h-full preserve-3d" preserveAspectRatio="none">
               <defs>
                 <linearGradient id="gradientCurve" x1="0" x2="0" y1="0" y2="1">
                   <stop offset="0%" stopColor="rgba(34,211,238,0.4)" />
                   <stop offset="100%" stopColor="rgba(34,211,238,0.0)" />
                 </linearGradient>
                 <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                 </filter>
               </defs>
               <path d="M0,200 C100,160 200,240 300,100 C400,-40 500,280 600,220 C700,160 760,40 800,20 L800,300 L0,300 Z" fill="url(#gradientCurve)" />
               <path d="M0,200 C100,160 200,240 300,100 C400,-40 500,280 600,220 C700,160 760,40 800,20" fill="none" stroke="#22d3ee" strokeWidth="4" filter="url(#glow)" />
               
               <circle cx="200" cy="215" r="5" fill="#0B1221" stroke="#22d3ee" strokeWidth="3" />
               <circle cx="330" cy="50" r="5" fill="#0B1221" stroke="#22d3ee" strokeWidth="3" />
               <circle cx="490" cy="205" r="5" fill="#0B1221" stroke="#22d3ee" strokeWidth="3" />
             </svg>
          </div>

          {/* X Axis Mock */}
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest z-10 relative">
             <span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SAB</span><span>DOM</span>
          </div>
        </div>

        {/* Status Orbit */}
        <div className="bg-[#0B1221] rounded-3xl p-5 xl:p-6 border border-slate-800/60 shadow-2xl flex flex-col items-center justify-between">
           <div className="w-full text-left">
              <h3 className="text-sm xl:text-base font-bold text-slate-300">Órbita de Status</h3>
           </div>
           
           <div className="relative w-20 h-20 xl:w-24 xl:h-24 flex items-center justify-center my-auto transition-ransform">
              {/* Animated Rings */}
              <div className="absolute inset-0 rounded-full border border-slate-700/50 animate-[spin_8s_linear_infinite]"></div>
              <div className="absolute inset-1.5 xl:inset-2 rounded-full border border-cyan-500/20 animate-[spin_6s_linear_infinite_reverse]"></div>
              <div className="absolute inset-3 xl:inset-4 rounded-full border border-slate-600/30 animate-[spin_10s_linear_infinite]"></div>
              {/* Core */}
              <div className="w-10 h-10 xl:w-12 xl:h-12 bg-[#111827] rounded-full shadow-[0_0_20px_rgba(34,211,238,0.2)] flex items-center justify-center ring-1 ring-cyan-500/50 relative z-10">
                 <RotateCw className="text-cyan-400" size={20} />
              </div>
           </div>

           <div className="text-center w-full">
              <p className="text-[11px] xl:text-xs font-extrabold text-white mb-0.5">Fluxo Principal #{posts[0]?.id || '---'}</p>
              <p className="text-[10px] text-slate-400 mb-3 xl:mb-4 italic line-clamp-1">Aguardando iteração no projeto</p>
              <button className="w-full bg-[#111827] hover:bg-[#1E293B] text-slate-300 font-bold py-2 xl:py-2.5 rounded-xl text-xs transition-colors border border-slate-800">
                 Ver Detalhes
              </button>
           </div>
        </div>
      </section>

      {/* RECENT PROJECTS TABLE */}
      <section className="bg-[#0a101d] rounded-3xl p-5 xl:p-6 border border-slate-800/60 shadow-2xl flex flex-col flex-1 overflow-hidden min-h-0">
         <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-base xl:text-lg font-bold text-white">Projetos Recentes</h2>
            <button className="text-cyan-400 text-xs font-bold hover:text-cyan-300 transition-colors">Visualizar Todos os Projetos</button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <table className="w-full text-left">
               <thead className="sticky top-0 bg-[#0a101d] z-10">
                  <tr className="border-b border-slate-800">
                     <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Nome da Obra</th>
                     <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Canal</th>
                     <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                     <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/50">
                  {loadingPosts ? (
                    <tr><td colSpan="4" className="py-6 text-center text-sm text-slate-500">Aguarde, carregando informações...</td></tr>
                  ) : posts.length === 0 ? (
                    <tr><td colSpan="4" className="py-6 text-center text-sm text-slate-500">Nenhum projeto encontrado.</td></tr>
                  ) : (
                    posts.map(post => (
                    <tr key={post.id} className="hover:bg-[#111827]/50 transition-colors group">
                       <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                             {post.image_url ? (
                               <img src={post.image_url} className="w-8 h-8 rounded-md object-cover ring-1 ring-white/10" alt="" />
                             ) : (
                               <div className="w-8 h-8 rounded-md bg-[#111827] flex items-center justify-center ring-1 ring-slate-800">
                                  <FileText size={14} className="text-slate-500" />
                               </div>
                             )}
                             <div>
                                <p className="text-[13px] font-bold text-white line-clamp-1">{post.title}</p>
                                <p className="text-[9px] text-slate-500 tracking-wider">ID: #{post.id}</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-3 px-2 text-[11px] font-medium text-slate-400">{post.channel}</td>
                       <td className="py-3 px-2">
                          <StatusBadge status={post.status} />
                       </td>
                       <td className="py-3 px-2 text-right relative">
                          <button 
                             ref={e => { if(e) menuButtonRefs.current.set(post.id, e) }}
                             onClick={(e) => handleToggleMenu(e, post.id)}
                             className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                             <Menu size={16} />
                          </button>
                       </td>
                    </tr>
                  )))}
               </tbody>
            </table>
         </div>
      </section>

      {/* ACTION DROPDOWN */}
      {openMenuPostId && (() => {
        const p = posts.find(x => x.id === openMenuPostId)
        if (!p) return null
        return (
          <div ref={actionsMenuRef} className="fixed z-[100] w-48 rounded-2xl border border-slate-700 bg-[#111827] p-1.5 shadow-2xl" style={{ top: menuPosition.top, left: menuPosition.left }}>
            <button onClick={() => { handleCopyPublicLink(p.public_slug); setOpenMenuPostId(null) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-300 hover:bg-[#1E293B] hover:text-white transition-colors">
              <Link2 size={16} /> Copiar Link
            </button>
            <Link to={`/review/${p.public_slug}`} target="_blank" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-300 hover:bg-[#1E293B] hover:text-white transition-colors" onClick={() => setOpenMenuPostId(null)}>
              <ExternalLink size={16} /> Abrir Link Mágico
            </Link>
            <button onClick={() => { openEditModal(p); setOpenMenuPostId(null) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-300 hover:bg-[#1E293B] hover:text-white transition-colors">
              <Pencil size={16} /> Editar Obra
            </button>
            <button onClick={() => { setDeletingPost(p); setIsDeleteModalOpen(true); setOpenMenuPostId(null) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors">
              <Trash2 size={16} /> Destruir Projeto
            </button>
          </div>
        )
      })()}

      {/* MODAL UNIVERSAL (CREATE/EDIT) */}
      {(isEditModalOpen || isCreateModalOpen) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#050B14]/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl p-6 sm:p-8 bg-[#0B1221] border border-slate-800 shadow-2xl rounded-3xl">
            <div className="mb-6 border-b border-slate-800/60 pb-4">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isEditModalOpen ? 'Editar Projeto Criativo' : 'Nova Obra'}
              </h3>
              <p className="mt-1 text-sm text-slate-400 font-medium">Configure os parâmetros do projeto criativo atual.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="sm:col-span-2">
                <label className="text-slate-400 font-bold tracking-widest text-[10px] block mb-2">TÍTULO DA OBRA</label>
                <input name="title" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500" placeholder="Ex: Campanha Black Friday..." />
              </div>
              
              <div>
                <label className="text-slate-400 font-bold tracking-widest text-[10px] block mb-2">CANAL PRINCIPAL</label>
                <select name="channel" value={editForm.channel} onChange={e => setEditForm({...editForm, channel: e.target.value})} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500">
                  <option value="Instagram">Instagram</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold tracking-widest text-[10px] block mb-2">STATUS INICIAL</label>
                <select name="status" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500">
                  <option value="pending">Aguardando Avaliação</option>
                  <option value="approved">Aprovado pelo Cliente</option>
                  <option value="changes_requested">Ajustes Solicitados</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                 <label className="text-slate-400 font-bold tracking-widest text-[10px] block mb-2">ARTE (IMAGEM/VÍDEO)</label>
                 <input type="file" accept="image/*" onChange={e => setEditImageFile(e.target.files?.[0])} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white file:mr-4 file:bg-slate-800 file:border-none file:text-white file:px-4 file:py-1 file:rounded-md file:text-xs file:font-bold hover:file:bg-slate-700" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 font-bold tracking-widest text-[10px] block mb-2">COPY (LEGENDA PERSUASIVA)</label>
                <textarea name="caption" rows={4} value={editForm.caption} onChange={e => setEditForm({...editForm, caption: e.target.value})} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500" placeholder="Escreva a legenda descritiva aqui..." />
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-end items-center border-t border-slate-800 pt-5">
               <button onClick={() => { setIsEditModalOpen(false); setIsCreateModalOpen(false) }} className="text-slate-400 font-bold px-5 py-3 hover:text-white transition-colors">Cancelar</button>
               <button onClick={isEditModalOpen ? handleEditSave : handleCreateSave} disabled={isSavingEdit || isCreatingPost} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-extrabold px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.2)] disabled:opacity-50">
                  {isSavingEdit || isCreatingPost ? 'Processando...' : (isEditModalOpen ? 'Salvar Edição' : 'Concluir')}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {isDeleteModalOpen && deletingPost && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-[#050B14]/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md p-6 sm:p-8 bg-[#0B1221] border border-slate-800 shadow-2xl rounded-3xl">
            <h3 className="text-xl font-bold text-white tracking-tight mb-2">Destruir Projeto?</h3>
            <p className="text-sm text-slate-400 font-medium mb-6">Esta ação removerá completamente o projeto <strong className="text-white">"{deletingPost.title}"</strong> da existência. Não é possível desfazer.</p>
            <div className="flex gap-3 justify-end items-center">
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 font-bold px-4 py-2 hover:text-white">Cancelar</button>
              <button onClick={confirmDelete} disabled={isDeletingPost} className="bg-rose-500/10 text-rose-500 border border-rose-500/50 hover:bg-rose-500 hover:text-white font-bold px-6 py-3 rounded-xl transition-colors">
                {isDeletingPost ? 'Destruindo...' : 'Confirmar Destruição'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK TOAST */}
      {copyFeedback && (
        <div className="fixed top-8 right-8 z-[200] bg-cyan-500 text-slate-900 font-bold px-6 py-3 rounded-xl shadow-[0_5px_20px_rgba(34,211,238,0.4)] animate-bounce">
          {copyFeedback}
        </div>
      )}
      {error && (
        <div className="fixed top-8 right-8 z-[200] bg-rose-500 text-white font-bold px-6 py-3 rounded-xl shadow-[0_5px_20px_rgba(244,63,94,0.4)] animate-bounce">
          {error}
        </div>
      )}

    </div>
  )
}

export default Dashboard

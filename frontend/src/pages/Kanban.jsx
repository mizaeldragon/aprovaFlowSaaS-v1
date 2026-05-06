import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { Kanban as KanbanIcon, Clock, CheckCircle2, AlertCircle, MoreHorizontal, Video } from 'lucide-react'
import { isVideoAsset } from '../services/storageService'

function Kanban() {
  const [searchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const clientFilter = String(searchParams.get('client') || '').trim().toLowerCase()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get('/posts')
        setPosts(res.data)
      } catch {
        setError('Erro ao carregar projetos. Recarregue a página.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const columns = [
    { id: 'PENDING', title: 'Aguardando', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'rgba(251,191,36,0.28)' },
    { id: 'ADJUSTMENT', title: 'Em Ajuste', icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'rgba(244,63,94,0.28)' },
    { id: 'APPROVED', title: 'Aprovados', icon: CheckCircle2, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'rgba(var(--brand-rgb),0.35)' },
  ]

  const visiblePosts = useMemo(() => {
    if (!clientFilter) return posts
    return posts.filter((post) => String(post.clientName || '').toLowerCase().includes(clientFilter))
  }, [posts, clientFilter])

  const getFilteredPosts = (status) => visiblePosts.filter(post => post.status === status)

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center animate-pulse text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando Fluxo...</div>
  }

  if (error) {
    return <div className="flex h-[60vh] items-center justify-center text-rose-400 text-sm font-semibold">{error}</div>
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex justify-between items-end mb-8 border-b border-slate-800/70 pb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1 flex items-center gap-3">
            <KanbanIcon className="text-cyan-400" /> Fluxo de Producao
          </h1>
          <p className="text-sm font-medium text-slate-400">Visualize a velocidade e o progresso das suas entregas em tempo real.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-[#0c121c] px-4 py-2 rounded-xl border border-slate-700/70">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{visiblePosts.length} Obras Ativas</span>
          </div>
          {clientFilter ? (
            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
              Cliente: {searchParams.get('client')}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map(col => (
          <div key={col.id} className="min-w-[320px] w-full flex flex-col bg-[#0c121c] rounded-[2rem] border border-slate-800/60 p-4">
            <div className={`flex items-center justify-between px-3 py-4 mb-4 rounded-2xl ${col.bg}`} style={{ border: `1px solid ${col.border}` }}>
              <div className="flex items-center gap-3">
                <col.icon size={20} className={col.color} />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">{col.title}</h3>
              </div>
              <span className="bg-black/20 text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/5">
                {getFilteredPosts(col.id).length}
              </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {getFilteredPosts(col.id).map(post => (
                <div key={post.id} className="group bg-[#0c121c] border border-slate-800/80 p-4 rounded-2xl hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(var(--brand-rgb),0.18)] transition-all cursor-grab active:cursor-grabbing">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter bg-black/30 px-2 py-0.5 rounded border border-white/5">
                      {post.channel}
                    </span>
                    <button className="text-slate-600 hover:text-white transition-colors"><MoreHorizontal size={14} /></button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-200 mb-4 line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors">
                    {post.title}
                  </h4>

                  {post.imageUrl && (
                    <div className="w-full h-24 rounded-xl overflow-hidden mb-4 border border-slate-800 relative">
                      {isVideoAsset(post.mediaType) ? (
                        <div className="flex h-full w-full items-center justify-center bg-cyan-500/10 text-cyan-300">
                          <Video size={24} />
                        </div>
                      ) : (
                        <img src={post.imageUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" alt="" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-[#0c121c] flex items-center justify-center text-[10px] font-bold text-cyan-400 ring-1 ring-cyan-500/20">
                        {post.clientName?.charAt(0) || 'C'}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                      {new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}

              {getFilteredPosts(col.id).length === 0 && (
                <div className="h-32 border-2 border-dashed border-slate-800/30 rounded-3xl flex items-center justify-center">
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Vazio</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Kanban

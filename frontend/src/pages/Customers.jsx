import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Users, Building2, ArrowUpRight, Search, Filter, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

const SEGMENTS = [
  { id: 'all', label: 'Todos' },
  { id: 'with-pending', label: 'Com pendencias' },
  { id: 'healthy', label: 'Saudavel (>= 70%)' },
  { id: 'at-risk', label: 'Em risco (< 70%)' },
]
const CLIENTS_PER_PAGE = 6

function Customers() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [segment, setSegment] = useState('all')
  const [isSegmentOpen, setIsSegmentOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [clientsPage, setClientsPage] = useState(1)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get('/posts')
        const posts = Array.isArray(res.data) ? res.data : []
        const clientMap = {}

        posts.forEach((post) => {
          const name = String(post.clientName || 'Cliente indefinido').trim()
          if (!clientMap[name]) {
            clientMap[name] = {
              name,
              totalProjects: 0,
              approved: 0,
              lastActivity: post.createdAt,
              lastReviewer: null,
              lastReviewAt: null,
            }
          }
          clientMap[name].totalProjects += 1
          if (post.status === 'APPROVED') clientMap[name].approved += 1

          if (new Date(post.createdAt) > new Date(clientMap[name].lastActivity)) {
            clientMap[name].lastActivity = post.createdAt
          }

          const comments = Array.isArray(post.comments) ? post.comments : []
          if (comments.length > 0) {
            const latestComment = comments.reduce((latest, current) => {
              if (!latest) return current
              return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
            }, null)

            if (
              latestComment &&
              (!clientMap[name].lastReviewAt || new Date(latestComment.createdAt) > new Date(clientMap[name].lastReviewAt))
            ) {
              clientMap[name].lastReviewer = latestComment.author
              clientMap[name].lastReviewAt = latestComment.createdAt
            }
          }
        })

        setClients(Object.values(clientMap))
      } catch (err) {
        console.error('Erro ao processar clientes:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchClients()
  }, [])

  const filteredClients = useMemo(() => {
    let data = [...clients]

    const normalizedSearch = searchQuery.trim().toLowerCase()
    if (normalizedSearch) {
      data = data.filter((client) => client.name.toLowerCase().includes(normalizedSearch))
    }

    data = data.filter((client) => {
      const approvalRate = client.totalProjects > 0 ? Math.round((client.approved / client.totalProjects) * 100) : 0
      const pending = client.totalProjects - client.approved
      if (segment === 'with-pending') return pending > 0
      if (segment === 'healthy') return approvalRate >= 70
      if (segment === 'at-risk') return approvalRate < 70
      return true
    })

    return data
  }, [clients, searchQuery, segment])

  const activeSegmentLabel = SEGMENTS.find((item) => item.id === segment)?.label || 'Todos'
  const clientsTotalPages = Math.max(1, Math.ceil(filteredClients.length / CLIENTS_PER_PAGE))
  const clientsPageStart = filteredClients.length === 0 ? 0 : (clientsPage - 1) * CLIENTS_PER_PAGE + 1
  const clientsPageEnd = Math.min(clientsPage * CLIENTS_PER_PAGE, filteredClients.length)
  const paginatedClients = useMemo(() => {
    const start = (clientsPage - 1) * CLIENTS_PER_PAGE
    return filteredClients.slice(start, start + CLIENTS_PER_PAGE)
  }, [filteredClients, clientsPage])

  useEffect(() => {
    setClientsPage((current) => Math.min(current, clientsTotalPages))
  }, [clientsTotalPages])

  useEffect(() => {
    setClientsPage(1)
  }, [segment, searchQuery])

  const openClientHub = (clientName) => {
    const encoded = encodeURIComponent(clientName)
    navigate(`/kanban?client=${encoded}`)
  }

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center animate-pulse text-slate-500 font-bold uppercase tracking-widest text-xs">Mapeando ecossistema...</div>
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10 border-b border-[#1E293B] pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3">
            <Users className="text-cyan-400" /> Gestao de Clientes
          </h1>
          <p className="text-sm font-medium text-slate-400">Gerencie sua carteira de clientes e acompanhe a saude de cada conta.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center w-full max-w-[250px] bg-[#0B1221] border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-cyan-500/50 transition-all">
            <Search size={14} className="text-slate-500 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar cliente..."
              className="bg-transparent border-none outline-none text-xs text-slate-200 w-full placeholder-slate-600"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsSegmentOpen((prev) => !prev)}
              className="bg-[#0B1221] border border-slate-800 hover:border-cyan-500/50 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 group"
            >
              <Filter size={16} className="text-slate-500 group-hover:text-cyan-400" />
              {activeSegmentLabel}
              <ChevronDown size={14} className={`transition-transform ${isSegmentOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSegmentOpen ? (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-800 bg-[#0c121c] p-1.5 z-20 shadow-[0_20px_60px_-30px_rgba(0,0,0,1)]">
                {SEGMENTS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSegment(item.id)
                      setIsSegmentOpen(false)
                    }}
                    className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      segment === item.id ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedClients.map((client, idx) => {
          const approvalRate = client.totalProjects > 0 ? Math.round((client.approved / client.totalProjects) * 100) : 0
          const pending = client.totalProjects - client.approved
          return (
            <div key={`${client.name}-${idx}`} className="group bg-[#0B1221] border border-slate-800/60 rounded-[2.5rem] p-7 transition-all hover:border-slate-700 hover:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-cyan-500/10 transition-colors" />

              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-slate-700 shadow-xl group-hover:scale-110 group-hover:border-cyan-500/30 transition-all duration-500">
                  <Building2 className="text-cyan-400" size={24} />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Taxa de aprovacao</span>
                  <span className="text-lg font-black text-white italic">{approvalRate}%</span>
                </div>
              </div>

              <h3 className="text-xl font-black text-white mb-2 tracking-tight group-hover:text-cyan-400 transition-colors">{client.name}</h3>
              <p className="text-xs font-medium text-slate-500 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Ativo em: {new Date(client.lastActivity).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-xs font-medium text-slate-500 mb-6">
                Ultima aprovacao/comentario: <span className="font-bold text-slate-300">{client.lastReviewer || 'Ainda sem identificacao'}</span>
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#050B14] p-4 rounded-2xl border border-slate-800/50">
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Obras totais</p>
                  <p className="text-lg font-black text-white">{client.totalProjects}</p>
                </div>
                <div className="bg-[#050B14] p-4 rounded-2xl border border-slate-800/50">
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Pendentes</p>
                  <p className="text-lg font-black text-amber-500">{pending}</p>
                </div>
              </div>

              <button
                onClick={() => openClientHub(client.name)}
                className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.05)]"
              >
                Acessar hub do cliente <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          )
        })}

        {filteredClients.length === 0 && (
          <div className="col-span-full h-80 border-2 border-dashed border-slate-800/50 rounded-[3rem] flex flex-col items-center justify-center opacity-50">
            <Search size={48} className="text-slate-700 mb-4" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nenhum cliente encontrado</p>
            <p className="text-xs text-slate-600 mt-2">Ajuste a busca/filtro ou crie novos posts para mapear clientes.</p>
          </div>
        )}
      </div>

      {filteredClients.length > 0 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-400">
            Mostrando {clientsPageStart} - {clientsPageEnd} de {filteredClients.length}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300">Pagina {clientsPage} de {clientsTotalPages}</span>
            <div className="flex overflow-hidden rounded-full border border-slate-600 bg-slate-800/70">
              <button
                type="button"
                onClick={() => setClientsPage((page) => page - 1)}
                disabled={clientsPage <= 1}
                className="px-3 py-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Pagina anterior"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setClientsPage((page) => page + 1)}
                disabled={clientsPage >= clientsTotalPages}
                className="border-l border-slate-600 px-3 py-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Proxima pagina"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Customers

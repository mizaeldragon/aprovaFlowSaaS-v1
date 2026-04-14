import { useState, useEffect } from 'react'
import api from '../services/api'
import { Users, Building2, ExternalLink, ArrowUpRight, Search, Filter } from 'lucide-react'

function Customers() {
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get('/posts')
        // Agregar clientes únicos baseados no clientName
        const posts = res.data
        const clientMap = {}
        
        posts.forEach(post => {
          const name = post.clientName || 'Cliente Indefinido'
          if (!clientMap[name]) {
            clientMap[name] = {
              name: name,
              totalProjects: 0,
              approved: 0,
              lastActivity: post.createdAt,
              channel: post.channel
            }
          }
          clientMap[name].totalProjects++
          if (post.status === 'APPROVED') clientMap[name].approved++
          if (new Date(post.createdAt) > new Date(clientMap[name].lastActivity)) {
            clientMap[name].lastActivity = post.createdAt
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

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center animate-pulse text-slate-500 font-bold uppercase tracking-widest text-xs">Mapeando Ecossistema...</div>
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10 border-b border-[#1E293B] pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3">
             <Users className="text-cyan-400" /> Gestão de Clientes
          </h1>
          <p className="text-sm font-medium text-slate-400">Gerencie sua carteira de clientes e acompanhe a saúde de cada conta.</p>
        </div>
        <button className="bg-[#0B1221] border border-slate-800 hover:border-cyan-500/50 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 group">
           <Filter size={16} className="text-slate-500 group-hover:text-cyan-400" /> Filtrar Segmentação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client, idx) => (
          <div key={idx} className="group bg-[#0B1221] border border-slate-800/60 rounded-[2.5rem] p-7 transition-all hover:border-slate-700 hover:shadow-2xl relative overflow-hidden">
             
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-cyan-500/10 transition-colors"></div>
             
             <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-slate-700 shadow-xl group-hover:scale-110 group-hover:border-cyan-500/30 transition-all duration-500">
                   <Building2 className="text-cyan-400" size={24} />
                </div>
                <div className="flex flex-col text-right">
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Taxa de Aprovação</span>
                   <span className="text-lg font-black text-white italic">
                     {client.totalProjects > 0 ? Math.round((client.approved / client.totalProjects) * 100) : 0}%
                   </span>
                </div>
             </div>

             <h3 className="text-xl font-black text-white mb-2 tracking-tight group-hover:text-cyan-400 transition-colors">{client.name}</h3>
             <p className="text-xs font-medium text-slate-500 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 
                Ativo em: {new Date(client.lastActivity).toLocaleDateString('pt-BR')}
             </p>

             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#050B14] p-4 rounded-2xl border border-slate-800/50">
                   <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Obras Totais</p>
                   <p className="text-lg font-black text-white">{client.totalProjects}</p>
                </div>
                <div className="bg-[#050B14] p-4 rounded-2xl border border-slate-800/50">
                   <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Pendentes</p>
                   <p className="text-lg font-black text-amber-500">{client.totalProjects - client.approved}</p>
                </div>
             </div>

             <button className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.05)]">
                Acessar Hub do Cliente <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
             </button>

          </div>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full h-80 border-2 border-dashed border-slate-800/50 rounded-[3rem] flex flex-col items-center justify-center opacity-50">
             <Search size={48} className="text-slate-700 mb-4" />
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nenhum cliente mapeado ainda</p>
             <p className="text-xs text-slate-600 mt-2">Crie o primeiro post para iniciar a organização.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Customers

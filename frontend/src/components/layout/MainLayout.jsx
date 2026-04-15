import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LogOut,
  LayoutDashboard,
  Kanban,
  Users,
  Palette,
  Sparkles,
  HelpCircle,
  Search,
  Bell,
  History,
} from 'lucide-react'

const navLinks = [
  { to: '/dashboard', label: 'Painel de Controle', icon: LayoutDashboard },
  { to: '/kanban', label: 'Fluxo de Producao', icon: Kanban },
  { to: '/customers', label: 'Gestao de Clientes', icon: Users },
  { to: '/settings', label: 'Minha Marca', icon: Palette },
  { to: '/copy-ai', label: 'Redator IA', icon: Sparkles },
]

function MainLayout({ children }) {
  const { user, tenant, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitial = (name) => {
    if (!name) return 'A'
    return name.charAt(0).toUpperCase()
  }

  if (!user) return <>{children}</>

  return (
    <div className="flex h-screen bg-[#0c121c] text-slate-300 font-sans overflow-hidden selection:bg-cyan-500/30">
      <aside className="w-64 bg-[#0c121c] border-r border-slate-800 flex flex-col justify-between shrink-0 h-full overflow-y-auto hidden md:flex">
        <div>
          <div className="h-24 flex items-center px-8 border-b border-[#1E293B]/50">
            <img src="/apv-logo.png" alt="AprovaFlow" className="h-11 w-auto object-contain" />
          </div>

          <nav className="mt-8 px-4 space-y-1.5 flex flex-col">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.to) || (link.to === '/dashboard' && location.pathname === '/')
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={() =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 relative overflow-hidden group ${
                      isActive
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                    }`
                  }
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md shadow-[0_0_10px_rgba(var(--brand-rgb),0.95)]" style={{ backgroundColor: 'var(--brand-color)' }}></div>
                  )}
                  <link.icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400 transition-colors'} />
                  {link.label}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="px-4 pb-6 space-y-6">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-800/50 to-transparent border border-slate-700/60">
            <p className="text-xs text-slate-400 font-medium text-center mb-3">
              {tenant?.isPro ? 'Plano Pro ativo.' : 'Limite da conta atingido.'}
            </p>
            <button
              onClick={() => navigate('/settings')}
              className="w-full py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all"
              style={{
                backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                color: 'var(--brand-on)',
                boxShadow: '0 0 16px rgba(var(--brand-rgb),0.35)',
              }}
            >
              {tenant?.isPro ? 'Gerenciar plano' : 'Migrar para o Pro'}
            </button>
          </div>

          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors">
              <HelpCircle size={16} />
              Suporte
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-24 flex items-center justify-between px-8 border-b border-slate-800/60 shrink-0 bg-[#0c121c]/90 backdrop-blur-sm z-10 w-full relative">
          <div className="flex items-center w-full max-w-md bg-[#0c121c] border border-slate-700/80 rounded-full px-4 py-2.5 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
            <Search size={16} className="text-slate-500 mr-2" />
            <input
              type="text"
              placeholder="Buscar projetos ou clientes..."
              className="bg-transparent border-none outline-none text-sm text-slate-300 w-full placeholder-slate-600"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-slate-400 border-r border-[#1E293B] pr-6 hidden sm:flex">
              <button className="hover:text-cyan-400 transition-colors"><Bell size={18} /></button>
              <button className="hover:text-cyan-400 transition-colors"><History size={18} /></button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/create')}
                className="hidden sm:flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl transition-all"
                style={{
                  backgroundImage: 'linear-gradient(to right, var(--brand-color-light), var(--brand-color))',
                  color: 'var(--brand-on)',
                  boxShadow: '0 0 16px rgba(var(--brand-rgb),0.32)',
                }}
              >
                Novo Projeto
              </button>

              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right hidden sm:flex">
                  <span className="text-white font-bold text-sm leading-tight">{user.name}</span>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Diretor Criativo</span>
                </div>

                <div className="h-10 w-10 relative rounded-full ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#0c121c] overflow-hidden bg-slate-800 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                  {tenant?.logoUrl ? (
                    <img src={tenant.logoUrl} alt="Avatar Logo" className="w-full h-full object-cover bg-white" />
                  ) : (
                    <span className="text-cyan-400 font-bold">{getInitial(user.name)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#0c121c] to-transparent pointer-events-none opacity-60"></div>
          <div className="relative z-10 px-4 sm:px-8 py-8 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout

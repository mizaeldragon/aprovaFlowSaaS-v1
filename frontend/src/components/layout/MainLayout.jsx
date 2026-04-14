import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  Settings, 
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
  Plus
} from 'lucide-react'

const navLinks = [
  { to: '/dashboard', label: 'Painel de Controle', icon: LayoutDashboard },
  { to: '/kanban', label: 'Fluxo de Produção', icon: Kanban },
  { to: '/customers', label: 'Gestão de Clientes', icon: Users },
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

  // Se for a tela de login/register que por acaso usar o layout (não deve), ou caso de escape
  if (!user) return <>{children}</>

  return (
    <div className="flex h-screen bg-[#0A0F1C] text-slate-300 font-sans overflow-hidden selection:bg-cyan-500/30">
      
      {/* Sidebar Premium */}
      <aside className="w-64 bg-[#0B1221] border-r border-[#1E293B] flex flex-col justify-between shrink-0 h-full overflow-y-auto hidden md:flex">
        
        <div>
          {/* Logo Area */}
          <div className="h-24 flex items-center px-8 border-b border-[#1E293B]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-cyan-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <img src="/favicon-apv.png" alt="Icon" className="w-6 h-6 brightness-0 invert" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-lg tracking-tight leading-tight">AprovaFlow</span>
                <span className="text-cyan-400 text-[10px] uppercase font-bold tracking-widest">Premium Studio</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 px-4 space-y-1.5 flex flex-col">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.to) || (link.to === '/dashboard' && location.pathname === '/');
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={() =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 relative overflow-hidden group ${
                      isActive 
                        ? 'text-cyan-400 bg-cyan-500/10' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-[#1E293B]/50'
                    }`
                  }
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-r-md shadow-[0_0_10px_rgba(34,211,238,1)]"></div>
                  )}
                  <link.icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400 transition-colors'} />
                  {link.label}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Bottom Sidebar */}
        <div className="px-4 pb-6 space-y-6">
          
          {/* Upgrade Banner Mockup */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#1E293B]/40 to-transparent border border-[#1E293B]">
             <p className="text-xs text-slate-400 font-medium text-center mb-3">Limite da conta atingido.</p>
             <button className="w-full py-2 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-xl text-[11px] font-extrabold uppercase tracking-wider text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all">
               Migrar para o Pro
             </button>
          </div>

          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-[#1E293B]/50 transition-colors">
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-24 flex items-center justify-between px-8 border-b border-[#1E293B]/50 shrink-0 bg-[#0A0F1C]/80 backdrop-blur-sm z-10 w-full relative">
           
           {/* Global Search Bar */}
           <div className="flex items-center w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-full px-4 py-2.5 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
              <Search size={16} className="text-slate-500 mr-2" />
              <input 
                type="text" 
                placeholder="Buscar projetos ou clientes..." 
                className="bg-transparent border-none outline-none text-sm text-slate-300 w-full placeholder-slate-600"
              />
           </div>

           {/* User Actions */}
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-slate-400 border-r border-[#1E293B] pr-6 hidden sm:flex">
                <button className="hover:text-cyan-400 transition-colors"><Bell size={18} /></button>
                <button className="hover:text-cyan-400 transition-colors"><History size={18} /></button>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate('/create')}
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                >
                  Novo Projeto
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-right hidden sm:flex">
                     <span className="text-white font-bold text-sm leading-tight">{user.name}</span>
                     <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Diretor Criativo</span>
                  </div>
                  
                  {/* Avatar */}
                  <div className="h-10 w-10 relative rounded-full ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#0A0F1C] overflow-hidden bg-slate-800 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
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

        {/* Page Content Scrollable */}
        <main className="flex-1 overflow-y-auto w-full relative">
           <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#111827] to-transparent pointer-events-none opacity-50"></div>
           <div className="relative z-10 px-4 sm:px-8 py-8 w-full">
             {children}
           </div>
        </main>
      </div>

    </div>
  )
}

export default MainLayout

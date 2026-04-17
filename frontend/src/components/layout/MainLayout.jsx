import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  LogOut,
  LayoutDashboard,
  Kanban,
  FileText,
  Users,
  Palette,
  Sparkles,
  HelpCircle,
  Bell,
  History,
  X,
  Settings,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react'

const navLinks = [
  { to: '/dashboard', label: 'Painel de Controle', icon: LayoutDashboard },
  { to: '/kanban', label: 'Fluxo de Producao', icon: Kanban },
  { to: '/projects', label: 'Projetos', icon: FileText },
  { to: '/customers', label: 'Gestao de Clientes', icon: Users },
  { to: '/settings', label: 'Minha Marca', icon: Palette },
  { to: '/copy-ai', label: 'Redator IA', icon: Sparkles },
]

function MainLayout({ children }) {
  const { user, tenant, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isAlertsOpen, setIsAlertsOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [slaAlerts, setSlaAlerts] = useState([])
  const [recentEvents, setRecentEvents] = useState([])
  const [loadingHeaderData, setLoadingHeaderData] = useState(false)
  const alertsContainerRef = useRef(null)
  const profileMenuRef = useRef(null)
  const refreshTimerRef = useRef(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLightTheme, setIsLightTheme] = useState(() => localStorage.getItem('aprovaflow-theme') === 'light')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleThemeToggle = () => {
    setIsLightTheme((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('apf-light-theme')
      } else {
        document.documentElement.classList.remove('apf-light-theme')
      }
      localStorage.setItem('aprovaflow-theme', next ? 'light' : 'dark')
      return next
    })
  }

  const handlePlanClick = async () => {
    if (!tenant?.isPro) {
      navigate('/settings')
      return
    }

    try {
      const res = await api.post('/billing/portal-session')
      const portalUrl = res?.data?.url
      if (portalUrl) {
        window.location.assign(portalUrl)
        return
      }
      navigate('/settings')
    } catch {
      navigate('/settings')
    }
  }

  const getInitial = (name) => {
    if (!name) return 'A'
    return name.charAt(0).toUpperCase()
  }

  const fetchHeaderSignals = async ({ withLoader = false } = {}) => {
    if (withLoader) setLoadingHeaderData(true)
    try {
      const [alertsRes, eventsRes] = await Promise.all([
        api.get('/sla/alerts'),
        api.get('/approval-events/recent?limit=15'),
      ])
      setSlaAlerts(alertsRes?.data?.alerts || [])
      setRecentEvents(eventsRes?.data?.events || [])
    } catch {
      setSlaAlerts([])
      setRecentEvents([])
    } finally {
      if (withLoader) setLoadingHeaderData(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchHeaderSignals({ withLoader: true })
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const socketUrl = rawApi.replace(/\/api\/?$/, '')
    const token = localStorage.getItem('aprovaflow-token')
    const tenantId = localStorage.getItem('aprovaflow-tenant')
    const socket = io(socketUrl, {
      transports: ['websocket'],
      auth: { token },
      query: { tenantId },
    })

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = window.setTimeout(() => {
        fetchHeaderSignals()
      }, 350)
    }

    socket.on('dashboard:update', scheduleRefresh)
    socket.on('connect', () => fetchHeaderSignals())

    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current)
      socket.disconnect()
    }
  }, [user])

  useEffect(() => {
    if (!isAlertsOpen) return undefined
    const onOutsideClick = (event) => {
      if (alertsContainerRef.current?.contains(event.target)) return
      setIsAlertsOpen(false)
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [isAlertsOpen])

  useEffect(() => {
    if (isLightTheme) {
      document.documentElement.classList.add('apf-light-theme')
    } else {
      document.documentElement.classList.remove('apf-light-theme')
    }
  }, [isLightTheme])

  useEffect(() => {
    if (!isProfileOpen) return undefined
    const onOutsideClick = (event) => {
      if (profileMenuRef.current?.contains(event.target)) return
      setIsProfileOpen(false)
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [isProfileOpen])

  const recentEventsLabel = useMemo(
    () =>
      recentEvents.map((event) => ({
        ...event,
        actionLabel:
          event.action === 'APPROVED'
            ? 'Aprovado'
            : event.action === 'ADJUSTMENT'
              ? 'Ajuste solicitado'
              : event.action === 'PUBLISHED'
                ? 'Publicado'
                : event.action === 'CREATED'
                  ? 'Criado'
                  : event.action === 'COMMENT'
                    ? 'Comentou'
                    : event.action,
      })),
    [recentEvents]
  )

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
              onClick={handlePlanClick}
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
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-24 flex items-center justify-between px-8 border-b border-slate-800/60 shrink-0 bg-[#0c121c]/90 backdrop-blur-sm z-50 w-full relative">
          <div className="w-full max-w-md" />

          <div className="flex items-center gap-6">
            <div ref={alertsContainerRef} className="relative flex items-center gap-4 text-slate-400 border-r border-[#1E293B] pr-6 hidden sm:flex">
              <button
                onClick={() => {
                  setIsHistoryOpen(false)
                  setIsAlertsOpen((prev) => !prev)
                }}
                className="relative hover:text-cyan-400 transition-colors"
                title="Alertas SLA"
              >
                <Bell size={18} />
                {slaAlerts.length > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {slaAlerts.length > 9 ? '9+' : slaAlerts.length}
                  </span>
                ) : null}
              </button>
              <button
                onClick={() => {
                  setIsAlertsOpen(false)
                  setIsHistoryOpen(true)
                }}
                className="relative hover:text-cyan-400 transition-colors"
                title="Historico de acoes"
              >
                <History size={18} />
                {recentEvents.length > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 min-w-4 h-4 px-1 rounded-full bg-cyan-600 text-[10px] font-bold text-white flex items-center justify-center">
                    {recentEvents.length > 9 ? '9+' : recentEvents.length}
                  </span>
                ) : null}
              </button>

              {isAlertsOpen ? (
                <div className="absolute right-0 top-9 z-40 w-[360px] rounded-2xl border border-cyan-900/40 bg-[#0c121c] p-4 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.95)]">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-white">Alertas SLA</h3>
                    <span className="text-xs text-slate-500">{loadingHeaderData ? 'Sincronizando...' : `${slaAlerts.length} alertas`}</span>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {slaAlerts.length === 0 ? (
                      <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
                        Sem atrasos no momento.
                      </p>
                    ) : (
                      slaAlerts.map((alert) => (
                        <div key={alert.id} className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3">
                          <p className="text-xs font-bold text-white">{alert.title || 'Post sem titulo'}</p>
                          <p className="mt-1 text-[11px] text-rose-200">
                            Cliente: {alert.clientName || 'Nao informado'}
                          </p>
                          <p className="mt-1 text-[11px] text-rose-300">
                            Atrasado desde {new Date(alert.dueAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
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

                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-full hover:scale-105 transition-transform"
                  >
                    <div className="h-10 w-10 relative rounded-full ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#0c121c] overflow-hidden bg-slate-800 flex items-center justify-center cursor-pointer">
                      {tenant?.logoUrl ? (
                        <img src={tenant.logoUrl} alt="Avatar Logo" className="w-full h-full object-cover bg-white" />
                      ) : (
                        <span className="text-cyan-400 font-bold">{getInitial(user.name)}</span>
                      )}
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen ? (
                    <div className="absolute right-0 top-14 z-[90] w-72 rounded-2xl border border-cyan-900/40 bg-[#0c121c] p-3 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.95)]">
                      <div className="mb-2 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                        <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-cyan-300 font-bold">
                          {getInitial(user.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-white">{user.name}</p>
                          <p className="text-xs text-slate-400">Role: {user?.role || 'OWNER'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false)
                          navigate('/settings')
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800/70"
                      >
                        <Settings size={16} />
                        Configuracoes
                      </button>

                      <button
                        type="button"
                        onClick={handleThemeToggle}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800/70"
                      >
                        {isLightTheme ? <Moon size={16} /> : <Sun size={16} />}
                        {isLightTheme ? 'Tema Escuro' : 'Tema Claro'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false)
                          handleLogout()
                        }}
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-orange-400 transition-colors hover:bg-orange-500/10"
                      >
                        <LogOut size={16} />
                        Sair
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="z-0 flex-1 overflow-y-auto w-full relative">
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#0c121c] to-transparent pointer-events-none opacity-60"></div>
          <div className="relative z-10 px-4 sm:px-8 py-8 w-full">
            {children}
          </div>
        </main>
      </div>

      {isHistoryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-3xl rounded-3xl border border-cyan-900/40 bg-[#0c121c] p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-white">Historico de acoes</h3>
                <p className="text-xs text-slate-500">Ultimos eventos de aprovacao da agencia.</p>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:text-cyan-300 hover:border-cyan-700/50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {recentEventsLabel.length === 0 ? (
                <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
                  Nenhuma acao registrada ainda.
                </p>
              ) : (
                recentEventsLabel.map((event) => (
                  <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">{event.actionLabel}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {event.actorName || 'Sistema'} - {new Date(event.createdAt).toLocaleString('pt-BR')}
                        </p>
                        <p className="mt-1 text-xs text-cyan-300">
                          {event.postTitle || 'Post'} {event.clientName ? `(${event.clientName})` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Versao</p>
                        <p className="text-xs text-slate-300">V{event.postVersion || 1}</p>
                      </div>
                    </div>
                    {event.versionHash ? (
                      <p className="mt-2 break-all text-[11px] text-slate-500">Hash: {event.versionHash}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MainLayout


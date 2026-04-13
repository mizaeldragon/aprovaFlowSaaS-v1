import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Criar Post' },
  { to: '/dashboard', label: 'Painel' },
]

function MainLayout({ children }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h1>
              <img
                src="/apv-logo.png"
                alt="AprovaFlow"
                className="h-8 w-auto max-w-[180px] object-contain sm:h-9 sm:max-w-[220px]"
              />
            </h1>
            <p className="text-xs text-slate-500">Fluxo de aprovacao para equipes de marketing</p>
          </div>
          <nav className="flex w-full gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 sm:w-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [
                    'inline-flex w-1/2 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:w-auto',
                    isActive
                      ? 'bg-gradient-to-r from-cyan-700 to-emerald-700 !text-white shadow-sm'
                      : 'text-slate-600 hover:bg-gradient-to-r hover:from-cyan-700 hover:to-emerald-700 hover:text-white',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}

export default MainLayout

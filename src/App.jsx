import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Dashboard from './pages/Dashboard.jsx'
import Expedientes from './pages/Expedientes.jsx'
import ExpedienteDetalle from './pages/ExpedienteDetalle.jsx'
import Importar from './pages/Importar.jsx'

const NAV = [
  { to: '/',            icon: '📊', label: 'Dashboard' },
  { to: '/expedientes', icon: '📋', label: 'Expedientes' },
  { to: '/importar',    icon: '⬆️', label: 'Importar datos' },
]

export default function App() {
  const location = useLocation()

  const pageTitle = () => {
    if (location.pathname === '/') return 'Dashboard'
    if (location.pathname.startsWith('/expedientes/')) return 'Detalle de expediente'
    if (location.pathname === '/expedientes') return 'Expedientes'
    if (location.pathname === '/importar') return 'Importar datos'
    return 'Notaría'
  }

  return (
    <div className="app-layout">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: '0.875rem' } }} />

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">⚖️ Dr. Romero</div>
          <div className="sidebar-logo-sub">Notaría Pública</div>
        </div>
        <nav className="sidebar-nav">
          <span className="sidebar-section">Menú</span>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {icon} {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">v1.0 · Supabase</div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{pageTitle()}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Notaría Dr. David Romero Mora
          </span>
        </header>

        <main className="page-body">
          <Routes>
            <Route path="/"                    element={<Dashboard />} />
            <Route path="/expedientes"         element={<Expedientes />} />
            <Route path="/expedientes/:id"     element={<ExpedienteDetalle />} />
            <Route path="/importar"            element={<Importar />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

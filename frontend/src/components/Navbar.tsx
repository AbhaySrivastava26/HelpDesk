import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

type UserRole = 'none' | 'employee' | 'agent'

interface NavbarProps {
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

const IconSubmit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
)

const IconChat = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const IconDashboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)

const IconTeams = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconAnalytics = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)

const IconShield = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
)

export default function Navbar({ userRole, setUserRole }: NavbarProps) {
  const loc = useLocation()
  const active = (path: string) =>
    loc.pathname === path ? 'nav-link active' : 'nav-link'

  return (
    <nav className="navbar">
      <div className="nav-container">

        {/* Logo */}
        <Link to="/" className="nav-logo">
          <IconLogo />
          HelpIQ
          <span className="nav-logo-sub">Support</span>
        </Link>

        {/* Role picker — shown when no role selected */}
        {userRole === 'none' && (
          <div className="nav-role-picker">
            <span className="nav-role-label">Sign in as</span>
            <button className="nav-role-btn" onClick={() => setUserRole('employee')}>
              <IconUser /> Employee
            </button>
            <button className="nav-role-btn" onClick={() => setUserRole('agent')}>
              <IconShield /> Help Desk
            </button>
          </div>
        )}

        {/* Employee nav */}
        {userRole === 'employee' && (
          <div className="nav-menu">
            <Link to="/"     className={active('/')}><IconSubmit /> Submit</Link>
            <Link to="/chat" className={active('/chat')}><IconChat /> Chat</Link>
          </div>
        )}

        {/* Agent nav */}
        {userRole === 'agent' && (
          <div className="nav-menu">
            <Link to="/agent"     className={active('/agent')}><IconShield /> Portal</Link>
            <Link to="/dashboard" className={active('/dashboard')}><IconDashboard /> Dashboard</Link>
            <Link to="/chat"      className={active('/chat')}><IconChat /> Chat</Link>
            <Link to="/teams"     className={active('/teams')}><IconTeams /> Teams</Link>
            <Link to="/analytics" className={active('/analytics')}><IconAnalytics /> Analytics</Link>
          </div>
        )}

        {/* Badge + switch (when role selected) */}
        {userRole !== 'none' && (
          <div className="nav-right">
            <span className={`nav-badge ${userRole}`}>
              {userRole === 'employee' ? <><IconUser /> Employee</> : <><IconShield /> Agent</>}
            </span>
            <button className="nav-switch" onClick={() => setUserRole('none')}>
              Switch
            </button>
          </div>
        )}

      </div>
    </nav>
  )
}

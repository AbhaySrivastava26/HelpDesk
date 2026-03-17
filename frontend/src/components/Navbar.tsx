// frontend/src/components/Navbar.tsx
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const loc = useLocation()
  const active = (path: string) => loc.pathname === path ? 'nav-link active' : 'nav-link'

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">⚡ HelpIQ</Link>
        <div className="nav-menu">
          <Link to="/"          className={active('/')}>Submit</Link>
          <Link to="/dashboard" className={active('/dashboard')}>Dashboard</Link>
          <Link to="/chat"      className={active('/chat')}>💬 Chat</Link>
          <Link to="/teams"     className={active('/teams')}>👥 Teams</Link>
          <Link to="/agent"     className={active('/agent')}>🛡️ Agent Portal</Link>
          <Link to="/analytics" className={active('/analytics')}>Analytics</Link>
        </div>
      </div>
    </nav>
  )
}
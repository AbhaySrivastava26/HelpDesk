import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">⚡ HelpIQ</Link>
        <div className="nav-menu">
          <Link to="/" className="nav-link">Submit</Link>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/chat" className="nav-link">💬 Chat</Link>
          <Link to="/analytics" className="nav-link">Analytics</Link>
        </div>
      </div>
    </nav>
  )
}
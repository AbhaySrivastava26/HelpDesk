import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import SubmitTicket from './pages/SubmitTicket'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Chat from './pages/Chat'
import Teams from './pages/Teams'
import AgentDashboard from './pages/AgentDashboard'
import DatasetDashboard from './pages/DatasetDashboard'
import './App.css'

export type UserRole = 'none' | 'employee' | 'agent'

function App() {
  const [userRole, setUserRole] = useState<UserRole>('none')

  return (
    <BrowserRouter>
      <Navbar userRole={userRole} setUserRole={setUserRole} />
      <div className="main">
        <Routes>

          {/* Login page — role picker landing */}
          <Route path="/login" element={
            userRole === 'employee' ? <Navigate to="/" replace /> :
            userRole === 'agent'    ? <Navigate to="/agent" replace /> :
            <LoginPage />
          }/>

          {/* Default route — redirect based on role */}
          <Route path="/" element={
            userRole === 'none'     ? <Navigate to="/login" replace /> :
            userRole === 'agent'    ? <Navigate to="/agent" replace /> :
            <SubmitTicket />
          }/>

          {/* Employee routes */}
          <Route path="/submit" element={<SubmitTicket />} />
          <Route path="/chat"   element={<Chat />} />

          {/* Agent routes */}
          <Route path="/agent"     element={<AgentDashboard onLogin={() => setUserRole('agent')} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/teams"     element={<Teams />} />
          <Route path="/data"      element={<DatasetDashboard />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </div>
    </BrowserRouter>
  )
}

// Simple login landing page shown before role selection
function LoginPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 58px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      flexDirection: 'column',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '3rem 2.5rem',
        maxWidth: '440px',
        width: '100%',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--accent-soft)', margin: '0 auto 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 .4rem' }}>
          Welcome to HelpIQ
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', margin: '0 0 2rem', lineHeight: 1.6 }}>
          AI-powered IT support system. Select your role in the navbar above to get started.
        </p>
        <div style={{
          display: 'flex', gap: 8, fontSize: '.8rem',
          color: 'var(--text-faint)', justifyContent: 'center'
        }}>
          <span>👤 Employee — submit &amp; track tickets</span>
          <span>·</span>
          <span>🛡️ Agent — manage &amp; resolve tickets</span>
        </div>
      </div>
    </div>
  )
}

export default App
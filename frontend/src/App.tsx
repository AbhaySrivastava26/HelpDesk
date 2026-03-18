import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import SubmitTicket from './pages/SubmitTicket'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Chat from './pages/Chat'
import Teams from './pages/Teams'
import AgentDashboard from './pages/AgentDashboard'
import './App.css'

export type UserRole = 'none' | 'employee' | 'agent'

function App() {
  const [userRole, setUserRole] = useState<UserRole>('none')

  return (
    <BrowserRouter>
      <Navbar userRole={userRole} setUserRole={setUserRole} />
      <div className="main">
        <Routes>
          <Route path="/"          element={<SubmitTicket />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/chat"      element={<Chat />} />
          <Route path="/teams"     element={<Teams />} />
          <Route path="/agent"     element={<AgentDashboard onLogin={() => setUserRole('agent')} />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App

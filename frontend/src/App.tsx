import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import SubmitTicket from './pages/SubmitTicket'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Chat from './pages/Chat'
import Teams from './pages/Teams'
import AgentDashboard from './pages/AgentDashboard'
import PasswordGate from './components/PasswordGate'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="main">
        <Routes>
          {/* Submit ticket — password protected */}
          <Route path="/" element={
            <PasswordGate pageName="HelpIQ — Submit Ticket" icon="🎫">
              <SubmitTicket />
            </PasswordGate>
          }/>

          {/* Dashboard — password protected */}
          <Route path="/dashboard" element={
            <PasswordGate pageName="Ticket Dashboard" icon="📊">
              <Dashboard />
            </PasswordGate>
          }/>

          {/* Chat — password protected */}
          <Route path="/chat" element={
            <PasswordGate pageName="Live Support Chat" icon="💬">
              <Chat />
            </PasswordGate>
          }/>

          {/* Teams — password protected */}
          <Route path="/teams" element={
            <PasswordGate pageName="Help Desk Teams" icon="👥">
              <Teams />
            </PasswordGate>
          }/>

          {/* Analytics — password protected */}
          <Route path="/analytics" element={
            <PasswordGate pageName="Analytics Dashboard" icon="📈">
              <Analytics />
            </PasswordGate>
          }/>

          {/* Agent Portal — has its own password gate inside the component */}
          <Route path="/agent" element={<AgentDashboard />}/>
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import SubmitTicket from './pages/SubmitTicket'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Analytics from './pages/Analytics'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="main">
        <Routes>
          <Route path="/" element={<SubmitTicket />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
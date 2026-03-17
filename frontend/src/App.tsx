import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import SubmitTicket from './pages/SubmitTicket'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Chat from './pages/Chat'
import Teams from './pages/Teams'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="main">
        <Routes>
          <Route path="/"          element={<SubmitTicket />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/chat"      element={<Chat />} />
          <Route path="/teams"     element={<Teams />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
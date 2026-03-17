import { useState, useEffect, useRef, useCallback } from 'react'
import './Chat.css'

interface Message {
  type: 'message' | 'system' | 'auto_solve'
  sender_id?: string
  sender_role?: string
  text: string
  timestamp: string
}

interface Employee {
  employee_id: string
  employee_name: string
  department: string
  location: string
}

export default function Chat() {
  const [ticketId, setTicketId]     = useState('')
  const [userId, setUserId]         = useState('')
  const [role, setRole]             = useState<'employee' | 'admin'>('employee')
  const [connected, setConnected]   = useState(false)
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [solving, setSolving]       = useState(false)
  const [employees, setEmployees]   = useState<Employee[]>([])
  const [loadingEmp, setLoadingEmp] = useState(false)
  const [showEmpList, setShowEmpList] = useState(false)
  const [empSearch, setEmpSearch]   = useState('')

  const ws      = useRef<WebSocket | null>(null)
  const bottom  = useRef<HTMLDivElement>(null)
  const session = useRef<string>('')

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => () => { ws.current?.close() }, [])

  const FALLBACK_EMPLOYEES: Employee[] = [
    { employee_id: 'EMP-10000', employee_name: 'Rajesh Kumar',     department: 'Operations',       location: 'Delhi' },
    { employee_id: 'EMP-10001', employee_name: 'Priya Singh',      department: 'Marketing',        location: 'Bangalore' },
    { employee_id: 'EMP-10002', employee_name: 'Amit Patel',       department: 'Finance',          location: 'Bangalore' },
    { employee_id: 'EMP-10003', employee_name: 'Neha Sharma',      department: 'HR',               location: 'Hyderabad' },
    { employee_id: 'EMP-10004', employee_name: 'Abhay Srivastava', department: 'Engineering',      location: 'Bangalore' },
    { employee_id: 'EMP-10005', employee_name: 'Deepak Nair',      department: 'Legal',            location: 'Mumbai' },
    { employee_id: 'EMP-10006', employee_name: 'Ananya Gupta',     department: 'Procurement',      location: 'Hyderabad' },
    { employee_id: 'EMP-10007', employee_name: 'Vikram Reddy',     department: 'Marketing',        location: 'Delhi' },
    { employee_id: 'EMP-10008', employee_name: 'Sneha Desai',      department: 'Legal',            location: 'Hyderabad' },
    { employee_id: 'EMP-10009', employee_name: 'Rohan Verma',      department: 'Operations',       location: 'Hyderabad' },
    { employee_id: 'EMP-10010', employee_name: 'Varun Kapoor',     department: 'Operations',       location: 'Bangalore' },
    { employee_id: 'EMP-10011', employee_name: 'Pooja Menon',      department: 'HR',               location: 'Bangalore' },
    { employee_id: 'EMP-10012', employee_name: 'Arjun Rao',        department: 'HR',               location: 'Bangalore' },
    { employee_id: 'EMP-10013', employee_name: 'Sanjana Bhat',     department: 'Legal',            location: 'Pune' },
    { employee_id: 'EMP-10014', employee_name: 'Karthik Iyer',     department: 'Engineering',      location: 'Hyderabad' },
    { employee_id: 'EMP-10015', employee_name: 'Divya Krishnan',   department: 'Procurement',      location: 'Bangalore' },
    { employee_id: 'EMP-10016', employee_name: 'Suresh Pillai',    department: 'Finance',          location: 'Pune' },
    { employee_id: 'EMP-10017', employee_name: 'Meera Nair',       department: 'HR',               location: 'Delhi' },
    { employee_id: 'EMP-10018', employee_name: 'Nikhil Deshmukh',  department: 'Procurement',      location: 'Hyderabad' },
    { employee_id: 'EMP-10019', employee_name: 'Shreya Mishra',    department: 'Procurement',      location: 'Mumbai' },
    { employee_id: 'EMP-10020', employee_name: 'Aryan Sinha',      department: 'Customer Support', location: 'Hyderabad' },
    { employee_id: 'EMP-10021', employee_name: 'Ritika Joshi',     department: 'Marketing',        location: 'Bangalore' },
    { employee_id: 'EMP-10022', employee_name: 'Harsh Pandey',     department: 'HR',               location: 'Delhi' },
    { employee_id: 'EMP-10023', employee_name: 'Kavya Saxena',     department: 'Procurement',      location: 'Bangalore' },
    { employee_id: 'EMP-10024', employee_name: 'Anurag Sharma',    department: 'Engineering',      location: 'Pune' },
  ]

  useEffect(() => {
    setLoadingEmp(true)
    fetch('http://localhost:8000/api/tickets/employees')
      .then(r => r.json())
      .then(d => setEmployees(d.employees || FALLBACK_EMPLOYEES))
      .catch(() => setEmployees(FALLBACK_EMPLOYEES))
      .finally(() => setLoadingEmp(false))
  }, [])

  const filteredEmployees = employees.filter(e =>
    e.employee_id.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.employee_name.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.department.toLowerCase().includes(empSearch.toLowerCase())
  )

  const connect = useCallback(() => {
    if (!ticketId.trim() || !userId.trim()) return
    ws.current?.close()
    const thisSession = `${ticketId}-${userId}-${Date.now()}`
    session.current = thisSession
    setMessages([])
    setConnected(false)

    const socket = new WebSocket(`ws://localhost:8000/api/chat/ws/${ticketId.trim()}`)
    ws.current = socket

    socket.onopen = () => {
      if (session.current !== thisSession) return
      socket.send(JSON.stringify({ user_id: userId.trim(), role }))
      setConnected(true)
    }
    socket.onmessage = (e) => {
      if (session.current !== thisSession) return
      try { setMessages(prev => [...prev, JSON.parse(e.data)]) } catch { /* ignore */ }
    }
    socket.onclose = () => { if (session.current !== thisSession) return; setConnected(false) }
    socket.onerror = (err) => { console.error('WS error', err); if (session.current !== thisSession) return; setConnected(false) }
  }, [ticketId, userId, role])

  const disconnect = () => {
    session.current = ''
    ws.current?.close()
    ws.current = null
    setConnected(false)
    setMessages([])
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !connected || ws.current?.readyState !== WebSocket.OPEN) return
    ws.current.send(JSON.stringify({ type: 'message', text }))
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const autoSolve = async () => {
    if (!connected || solving) return
    setSolving(true)
    const ctx = messages.filter(m => m.type === 'message').slice(-5).map(m => `${m.sender_role}: ${m.text}`).join('\n')
    try {
      const res = await fetch('http://localhost:8000/api/tickets/auto-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, issue_context: ctx || 'No context yet', employee_id: userId })
      })
      const data = await res.json()
      if (ws.current?.readyState === WebSocket.OPEN)
        ws.current.send(JSON.stringify({ type: 'auto_solve', solution: data.solution || 'Unable to generate solution.' }))
    } catch {
      if (ws.current?.readyState === WebSocket.OPEN)
        ws.current.send(JSON.stringify({ type: 'auto_solve', solution: 'Auto-solve unavailable. An agent will assist shortly.' }))
    } finally { setSolving(false) }
  }

  const renderMessage = (msg: Message, idx: number) => {
    const isMe = msg.sender_id === userId
    if (msg.type === 'system') return <div key={idx} className="msg-system"><span>{msg.text}</span></div>
    if (msg.type === 'auto_solve') return (
      <div key={idx} className="msg-ai">
        <div className="msg-ai-header"><span className="ai-badge">AI Auto-Solve</span><span className="msg-time">{msg.timestamp}</span></div>
        <div className="msg-ai-body">{msg.text}</div>
      </div>
    )
    return (
      <div key={idx} className={`msg-row ${isMe ? 'msg-mine' : 'msg-theirs'}`}>
        <div className={`msg-bubble ${isMe ? 'bubble-mine' : 'bubble-theirs'}`}>
          {!isMe && <div className="msg-sender">{msg.sender_id}<span className="msg-role-badge">{msg.sender_role}</span></div>}
          <div className="msg-text">{msg.text}</div>
          <div className="msg-time">{msg.timestamp}</div>
        </div>
      </div>
    )
  }

  const selectedEmp = employees.find(e => e.employee_id === userId)

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-title"><span>💬</span><h1>Live Support Chat</h1></div>

        <div className="chat-connect-bar">
          <input className="connect-input" placeholder="Ticket ID" value={ticketId} onChange={e => setTicketId(e.target.value)} disabled={connected} />

          <select className="connect-select" value={role} onChange={e => { setRole(e.target.value as 'employee' | 'admin'); setUserId('') }} disabled={connected}>
            <option value="employee">Employee</option>
            <option value="admin">Help Desk Admin</option>
          </select>

          {role === 'employee' ? (
            <div className="emp-picker">
              <div className="emp-selected" onClick={() => !connected && setShowEmpList(v => !v)}>
                {userId ? <><span className="emp-id-tag">{userId}</span> {selectedEmp?.employee_name}</> : <span className="emp-placeholder">Select employee...</span>}
                {!connected && <span className="emp-caret">▾</span>}
              </div>
              {showEmpList && !connected && (
                <div className="emp-dropdown">
                  <input className="emp-search" placeholder="Search name, ID or dept..." value={empSearch} onChange={e => setEmpSearch(e.target.value)} autoFocus />
                  <div className="emp-list">
                    {loadingEmp && <div className="emp-loading">Loading...</div>}
                    {filteredEmployees.map(emp => (
                      <div key={emp.employee_id} className={`emp-item ${userId === emp.employee_id ? 'selected' : ''}`}
                        onClick={() => { setUserId(emp.employee_id); setShowEmpList(false); setEmpSearch('') }}>
                        <span className="emp-id-tag">{emp.employee_id}</span>
                        <span className="emp-name">{emp.employee_name}</span>
                        <span className="emp-meta">{emp.department} · {emp.location}</span>
                      </div>
                    ))}
                    {!loadingEmp && filteredEmployees.length === 0 && <div className="emp-loading">No results</div>}
                  </div>
                  <button className="emp-close" onClick={() => setShowEmpList(false)}>Close</button>
                </div>
              )}
            </div>
          ) : (
            <input className="connect-input" placeholder='Admin ID: "admin"' value={userId} onChange={e => setUserId(e.target.value)} disabled={connected} style={{ flex: 2 }} />
          )}

          {!connected
            ? <button className="btn-connect" onClick={connect} disabled={!ticketId.trim() || !userId.trim()}>Connect</button>
            : <button className="btn-disconnect" onClick={disconnect}>✓ Leave</button>
          }
          {connected && <button className={`btn-autosolve${solving ? ' solving' : ''}`} onClick={autoSolve} disabled={solving}>{solving ? 'Solving...' : '🤖 Auto-Solve'}</button>}
        </div>

        {connected && <div className="session-badge">Ticket {ticketId} · {userId} · {role}</div>}

        <div className="chat-messages">
          {!connected && <div className="chat-placeholder"><div className="ph-icon">💬</div><p>Enter a ticket ID and select your employee to start chatting</p></div>}
          {connected && messages.length === 0 && <div className="chat-placeholder"><p>No messages yet. Start chatting!</p></div>}
          {messages.map((msg, i) => renderMessage(msg, i))}
          <div ref={bottom} />
        </div>

        <div className="chat-input-row">
          <textarea className="chat-textarea" placeholder={connected ? 'Type message... (Enter to send)' : 'Connect first to chat'} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={!connected} rows={1} />
          <button className="btn-send" onClick={sendMessage} disabled={!connected || !input.trim()}>Send</button>
        </div>
      </div>
    </div>
  )
}
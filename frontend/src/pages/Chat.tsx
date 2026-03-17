import { useState, useEffect, useRef, useCallback } from 'react'
import './Chat.css'

interface Message {
  type: 'message' | 'system' | 'auto_solve' | 'agent_joined'
  sender_id?: string
  sender_role?: string
  text: string
  timestamp: string
  // agent_joined extras
  agent_id?: string
  agent_name?: string
  team_name?: string
  specialty?: string
  color?: string
  icon?: string
}

interface Employee {
  employee_id: string
  employee_name: string
  department: string
  location: string
}

export default function Chat() {
  const [ticketId, setTicketId]   = useState('')
  const [userId, setUserId]       = useState('')
  const [role, setRole]           = useState<'employee' | 'admin'>('employee')
  const [connected, setConnected] = useState(false)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [solving, setSolving]     = useState(false)
  const [searching, setSearching] = useState(false) // "finding agent" state

  // Assigned agent info (set when agent_joined event fires)
  const [assignedAgent, setAssignedAgent] = useState<{
    agent_id: string; agent_name: string; team_name: string;
    specialty: string; color: string; icon: string
  } | null>(null)

  // Employee picker
  const [employees, setEmployees]     = useState<Employee[]>([])
  const [showEmpList, setShowEmpList] = useState(false)
  const [empSearch, setEmpSearch]     = useState('')

  const ws      = useRef<WebSocket | null>(null)
  const bottom  = useRef<HTMLDivElement>(null)
  const session = useRef<string>('')

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => () => { ws.current?.close() }, [])

  const FALLBACK_EMP: Employee[] = [
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
    fetch('http://localhost:8000/api/tickets/employees')
      .then(r => r.json()).then(d => setEmployees(d.employees || FALLBACK_EMP))
      .catch(() => setEmployees(FALLBACK_EMP))
  }, [])

  const filteredEmp = employees.filter(e =>
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
    setAssignedAgent(null)
    if (role === 'employee') setSearching(true)

    const socket = new WebSocket(`ws://localhost:8000/api/chat/ws/${ticketId.trim()}`)
    ws.current = socket

    socket.onopen = () => {
      if (session.current !== thisSession) return
      socket.send(JSON.stringify({ user_id: userId.trim(), role }))
      setConnected(true)
    }

    socket.onmessage = (e) => {
      if (session.current !== thisSession) return
      try {
        const msg: Message = JSON.parse(e.data)
        // When agent_joined fires, extract agent info and show the card
        if (msg.type === 'agent_joined') {
          setSearching(false)
          setAssignedAgent({
            agent_id:   msg.agent_id || '',
            agent_name: msg.agent_name || '',
            team_name:  msg.team_name || '',
            specialty:  msg.specialty || '',
            color:      msg.color || '#667eea',
            icon:       msg.icon || '🔧',
          })
        }
        setMessages(prev => [...prev, msg])
      } catch {}
    }

    socket.onclose = () => { if (session.current !== thisSession) return; setConnected(false); setSearching(false) }
    socket.onerror = () => { if (session.current !== thisSession) return; setConnected(false); setSearching(false) }
  }, [ticketId, userId, role])

  const disconnect = () => {
    session.current = ''
    ws.current?.close()
    ws.current = null
    setConnected(false)
    setMessages([])
    setAssignedAgent(null)
    setSearching(false)
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
    const ctx = messages.filter(m => m.type === 'message').slice(-5)
      .map(m => `${m.sender_role}: ${m.text}`).join('\n')
    try {
      const res = await fetch('http://localhost:8000/api/tickets/auto-solve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, issue_context: ctx || 'No context', employee_id: userId })
      })
      const data = await res.json()
      if (ws.current?.readyState === WebSocket.OPEN)
        ws.current.send(JSON.stringify({ type: 'auto_solve', solution: data.solution || 'Unable to generate.' }))
    } catch {
      if (ws.current?.readyState === WebSocket.OPEN)
        ws.current.send(JSON.stringify({ type: 'auto_solve', solution: 'Auto-solve unavailable. Agent will assist.' }))
    } finally { setSolving(false) }
  }

  const renderMessage = (msg: Message, idx: number) => {
    const isMe = msg.sender_id === userId

    if (msg.type === 'system') return (
      <div key={idx} className="msg-system"><span>{msg.text}</span></div>
    )

    if (msg.type === 'agent_joined') return (
      <div key={idx} className="msg-agent-joined" style={{ borderColor: msg.color || '#667eea' }}>
        <div className="agent-joined-icon" style={{ background: (msg.color || '#667eea') + '15' }}>
          <span>{msg.icon}</span>
        </div>
        <div className="agent-joined-info">
          <div className="agent-joined-name" style={{ color: msg.color || '#667eea' }}>
            {msg.agent_name}
          </div>
          <div className="agent-joined-meta">{msg.team_name} · {msg.specialty}</div>
          <div className="agent-joined-text">{msg.text}</div>
        </div>
        <span className="msg-time" style={{ alignSelf: 'flex-start' }}>{msg.timestamp}</span>
      </div>
    )

    if (msg.type === 'auto_solve') return (
      <div key={idx} className="msg-ai">
        <div className="msg-ai-header">
          <span className="ai-badge">🤖 AI Auto-Solve</span>
          <span className="msg-time">{msg.timestamp}</span>
        </div>
        <div className="msg-ai-body">{msg.text}</div>
      </div>
    )

    return (
      <div key={idx} className={`msg-row ${isMe ? 'msg-mine' : 'msg-theirs'}`}>
        <div className={`msg-bubble ${isMe ? 'bubble-mine' : 'bubble-theirs'}`}>
          {!isMe && (
            <div className="msg-sender">
              {msg.sender_id}
              <span className="msg-role-badge">{msg.sender_role}</span>
            </div>
          )}
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

        {/* Simple how-to — only when not connected */}
        {!connected && (
          <div className="how-to-banner">
            <div className="how-step">
              <div className="how-num">1</div>
              <div><strong>Get your Ticket ID</strong><br/>Go to Dashboard, copy the ID of your ticket</div>
            </div>
            <div className="how-arrow">→</div>
            <div className="how-step">
              <div className="how-num">2</div>
              <div><strong>Select yourself</strong><br/>Choose Employee role and pick your name</div>
            </div>
            <div className="how-arrow">→</div>
            <div className="how-step">
              <div className="how-num">3</div>
              <div><strong>Click Connect</strong><br/>The right help desk agent is assigned automatically</div>
            </div>
          </div>
        )}

        {/* Connect bar */}
        <div className="chat-connect-bar">
          <input
            className="connect-input"
            placeholder="Ticket ID (from Dashboard)"
            value={ticketId}
            onChange={e => setTicketId(e.target.value)}
            disabled={connected}
          />

          <select
            className="connect-select"
            value={role}
            onChange={e => { setRole(e.target.value as 'employee' | 'admin'); setUserId('') }}
            disabled={connected}
          >
            <option value="employee">Employee</option>
            <option value="admin">Help Desk Admin (manual)</option>
          </select>

          {/* Employee picker */}
          {role === 'employee' && (
            <div className="emp-picker">
              <div className="emp-selected" onClick={() => !connected && setShowEmpList(v => !v)}>
                {userId
                  ? <><span className="emp-id-tag">{userId}</span> {selectedEmp?.employee_name}</>
                  : <span className="emp-placeholder">Select your name...</span>
                }
                {!connected && <span className="emp-caret">▾</span>}
              </div>
              {showEmpList && !connected && (
                <div className="emp-dropdown">
                  <input className="emp-search" placeholder="Search name, ID or dept..." value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)} autoFocus />
                  <div className="emp-list">
                    {filteredEmp.map(emp => (
                      <div key={emp.employee_id}
                        className={`emp-item ${userId === emp.employee_id ? 'selected' : ''}`}
                        onClick={() => { setUserId(emp.employee_id); setShowEmpList(false); setEmpSearch('') }}>
                        <span className="emp-id-tag">{emp.employee_id}</span>
                        <span className="emp-name">{emp.employee_name}</span>
                        <span className="emp-meta">{emp.department} · {emp.location}</span>
                      </div>
                    ))}
                    {filteredEmp.length === 0 && <div className="emp-loading">No results</div>}
                  </div>
                  <button className="emp-close" onClick={() => setShowEmpList(false)}>Close</button>
                </div>
              )}
            </div>
          )}

          {/* Manual admin login (for testing) */}
          {role === 'admin' && (
            <input className="connect-input" placeholder="Agent ID e.g. HD-NET-001"
              value={userId} onChange={e => setUserId(e.target.value)}
              disabled={connected} style={{ flex: 2 }} />
          )}

          {!connected
            ? <button className="btn-connect" onClick={connect} disabled={!ticketId.trim() || !userId.trim()}>
                Connect
              </button>
            : <button className="btn-disconnect" onClick={disconnect}>✓ Leave</button>
          }
          {connected && (
            <button className={`btn-autosolve${solving ? ' solving' : ''}`} onClick={autoSolve} disabled={solving}>
              {solving ? 'Solving...' : '🤖 Auto-Solve'}
            </button>
          )}
        </div>

        {/* Searching for agent spinner */}
        {searching && (
          <div className="searching-banner">
            <div className="searching-spinner" />
            <div>
              <div className="searching-title">Finding the right specialist...</div>
              <div className="searching-sub">Matching your ticket category to an available agent</div>
            </div>
          </div>
        )}

        {/* Assigned agent card — shown after agent_joined */}
        {connected && assignedAgent && !searching && (
          <div className="assigned-agent-card" style={{ borderLeft: `4px solid ${assignedAgent.color}` }}>
            <div className="assigned-avatar" style={{ background: assignedAgent.color + '18', color: assignedAgent.color }}>
              {assignedAgent.agent_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="assigned-info">
              <div className="assigned-name" style={{ color: assignedAgent.color }}>
                {assignedAgent.icon} {assignedAgent.agent_name}
              </div>
              <div className="assigned-team">{assignedAgent.team_name}</div>
              <div className="assigned-specialty">Specialist: {assignedAgent.specialty}</div>
            </div>
            <div className="assigned-status">
              <span className="online-dot" />
              <span>Active</span>
            </div>
          </div>
        )}

        {connected && (
          <div className="session-badge">
            Ticket {ticketId} · {userId}
            {assignedAgent && <span style={{ marginLeft: 8, color: assignedAgent.color }}>
              · {assignedAgent.icon} {assignedAgent.team_name}
            </span>}
          </div>
        )}

        {/* Messages */}
        <div className="chat-messages">
          {!connected && (
            <div className="chat-placeholder">
              <div className="ph-icon">💬</div>
              <p>Enter your Ticket ID, select your name and click Connect</p>
            </div>
          )}
          {connected && messages.length === 0 && (
            <div className="chat-placeholder"><p>Connecting you to a specialist...</p></div>
          )}
          {messages.map((msg, i) => renderMessage(msg, i))}
          <div ref={bottom} />
        </div>

        {/* Input */}
        <div className="chat-input-row">
          <textarea className="chat-textarea"
            placeholder={connected ? 'Describe your issue... (Enter to send)' : 'Connect first to chat'}
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown} disabled={!connected} rows={1} />
          <button className="btn-send" onClick={sendMessage} disabled={!connected || !input.trim()}>Send</button>
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import './Chat.css'

interface Message {
  type: 'message' | 'system' | 'auto_solve' | 'agent_joined' | 'ticket_closed'
  sender_id?: string
  sender_role?: string
  text: string
  timestamp: string
  agent_id?: string; agent_name?: string; team_name?: string
  specialty?: string; color?: string; icon?: string
}

interface Employee {
  employee_id: string
  employee_name: string
  department: string
  location: string
}

const DEMO_PASSWORD = 'abcd'

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

export default function Chat() {
  const [searchParams] = useSearchParams()

  // ── form state ──
  const [ticketId, setTicketId]   = useState('')
  const [userId, setUserId]       = useState('')
  const [role, setRole]           = useState<'employee'|'admin'>('employee')
  const [password, setPassword]   = useState('')
  const [pwError, setPwError]     = useState('')

  // ── connection state ──
  const [connected, setConnected] = useState(false)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [solving, setSolving]     = useState(false)
  const [searching, setSearching] = useState(false)
  const [assignedAgent, setAssignedAgent] = useState<any>(null)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closing, setClosing]               = useState(false)
  const [ticketClosed, setTicketClosed]     = useState(false)

  // ── employee picker ──
  const [employees, setEmployees]     = useState<Employee[]>(FALLBACK_EMP)
  const [showEmpList, setShowEmpList] = useState(false)
  const [empSearch, setEmpSearch]     = useState('')

  const ws         = useRef<WebSocket | null>(null)
  const bottom     = useRef<HTMLDivElement | null>(null)
  const session    = useRef<string>('')
  const connectFn  = useRef<((t?: string, u?: string, r?: 'employee'|'admin') => void) | null>(null)

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => () => { ws.current?.close() }, [])

  // fetch employees — fallback already set
  useEffect(() => {
    fetch('https://helpdesk-ou5u.onrender.com/api/tickets/employees')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.employees?.length) setEmployees(d.employees) })
      .catch(() => {})
  }, [])

  const filteredEmp = employees.filter(e =>
    e.employee_id.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.employee_name.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.department.toLowerCase().includes(empSearch.toLowerCase())
  )

  // ── connect ──
  const connect = useCallback((overTid?: string, overUid?: string, overRole?: 'employee'|'admin') => {
    const tid = overTid  || ticketId
    const uid = overUid  || userId
    const rl  = overRole || role
    if (!tid.trim() || !uid.trim()) return

    ws.current?.close()
    const thisSession = `${tid}-${uid}-${Date.now()}`
    session.current = thisSession
    setMessages([])
    setConnected(false)
    setAssignedAgent(null)
    if (rl === 'employee') setSearching(true)

    const socket = new WebSocket(`wss://helpdesk-ou5u.onrender.com/api/chat/ws/${tid.trim()}`)
    ws.current = socket

    socket.onopen = () => {
      if (session.current !== thisSession) return
      socket.send(JSON.stringify({ user_id: uid.trim(), role: rl }))
      setConnected(true)
    }
    socket.onmessage = (e) => {
      if (session.current !== thisSession) return
      try {
        const msg: Message = JSON.parse(e.data)
        if (msg.type === 'agent_joined') {
          setSearching(false)
          setAssignedAgent({ agent_id: msg.agent_id, agent_name: msg.agent_name, team_name: msg.team_name, specialty: msg.specialty, color: msg.color, icon: msg.icon })
        }
        // If ticket was closed by the agent, employee gets this and sees closed screen
        if (msg.type === 'ticket_closed') {
          setMessages(prev => [...prev, msg])
          setTimeout(() => {
            setTicketClosed(true)
            session.current = ''
            if (ws.current) { ws.current.close(); ws.current = null }
            setConnected(false)
          }, 2500) // 2.5s delay so employee reads the message first
          return
        }
        setMessages(prev => [...prev, msg])
      } catch {}
    }
    socket.onclose = () => { if (session.current !== thisSession) return; setConnected(false); setSearching(false) }
    socket.onerror = () => { if (session.current !== thisSession) return; setConnected(false); setSearching(false) }
  }, [ticketId, userId, role])

  useEffect(() => { connectFn.current = connect }, [connect])

  // ── auto-connect from agent portal URL params ──
  useEffect(() => {
    const ticketParam = searchParams.get('ticket')
    const agentParam  = searchParams.get('agent')
    if (!ticketParam) return
    setTicketId(ticketParam)
    if (agentParam) { setRole('admin'); setUserId(agentParam) }
    // auto-connect skips password (agent portal already authenticated)
    setTimeout(() => {
      connectFn.current?.(ticketParam, agentParam || undefined, agentParam ? 'admin' : 'employee')
    }, 150)
  }, []) // eslint-disable-line

  const handleConnect = () => {
    // validate password before connecting
    if (password !== DEMO_PASSWORD) {
      setPwError('Wrong password. Use: abcd')
      return
    }
    setPwError('')
    connect()
  }

  const disconnect = () => {
    session.current = ''
    ws.current?.close(); ws.current = null
    setConnected(false); setMessages([]); setAssignedAgent(null); setSearching(false)
    setPassword(''); setPwError('')
  }

  const closeTicket = async () => {
    if (!ticketId || closing) return
    setClosing(true)
    try {
      // Step 1: Broadcast ticket_closed to ALL in room FIRST (employee sees it instantly)
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type:      'ticket_closed',
          closed_by: userId
        }))
      }
      // Step 2: Wait so broadcast reaches employee before we delete
      await new Promise(r => setTimeout(r, 1000))
      // Step 3: Delete from DB
      await fetch(`https://helpdesk-ou5u.onrender.com/api/tickets/${ticketId}/close`, {
        method: 'DELETE'
      })
      // Step 4: Agent side shows closed screen too
      setTicketClosed(true)
      session.current = ''
      ws.current?.close(); ws.current = null
      setConnected(false)
    } catch (e) {
      console.error('Close ticket failed', e)
    } finally {
      setClosing(false)
      setShowCloseModal(false)
    }
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
      const res = await fetch('https://helpdesk-ou5u.onrender.com/api/tickets/auto-solve', {
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
    if (msg.type === 'ticket_closed') return (
      <div key={idx} className="msg-ticket-closed">
        <div className="closed-broadcast-icon">🔒</div>
        <div className="closed-broadcast-body">
          <div className="closed-broadcast-title">Ticket Closed</div>
          <div className="closed-broadcast-text">{msg.text}</div>
          <div className="closed-broadcast-time">{msg.timestamp}</div>
        </div>
      </div>
    )
    if (msg.type === 'agent_joined') return (
      <div key={idx} className="msg-agent-joined" style={{ borderColor: msg.color || '#667eea' }}>
        <div className="agent-joined-icon" style={{ background: (msg.color||'#667eea')+'15' }}><span>{msg.icon}</span></div>
        <div className="agent-joined-info">
          <div className="agent-joined-name" style={{ color: msg.color||'#667eea' }}>{msg.agent_name}</div>
          <div className="agent-joined-meta">{msg.team_name} · {msg.specialty}</div>
          <div className="agent-joined-text">{msg.text}</div>
        </div>
        <span className="msg-time" style={{ alignSelf:'flex-start' }}>{msg.timestamp}</span>
      </div>
    )
    if (msg.type === 'auto_solve') return (
      <div key={idx} className="msg-ai">
        <div className="msg-ai-header"><span className="ai-badge">🤖 AI Auto-Solve</span><span className="msg-time">{msg.timestamp}</span></div>
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

  const selectedEmp   = employees.find(e => e.employee_id === userId)
  const isAutoOpened  = !!searchParams.get('ticket') && !!searchParams.get('agent')

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-title"><span>💬</span><h1>Live Support Chat</h1></div>

        {/* Auto-opened banner */}
        {isAutoOpened && connected && (
          <div className="auto-opened-banner">
            ✅ Chat opened directly from your Agent Portal — connected as <strong>{userId}</strong>
          </div>
        )}

        {/* How-to */}
        {!connected && !isAutoOpened && (
          <div className="how-to-banner">
            <div className="how-step"><div className="how-num">1</div><div><strong>Get Ticket ID</strong><br/>From the Dashboard after submitting</div></div>
            <div className="how-arrow">→</div>
            <div className="how-step"><div className="how-num">2</div><div><strong>Select yourself</strong><br/>Pick your employee name</div></div>
            <div className="how-arrow">→</div>
            <div className="how-step"><div className="how-num">3</div><div><strong>Enter password</strong><br/>Type <code style={{background:'#f0f0f0',padding:'1px 5px',borderRadius:4}}>abcd</code> and connect</div></div>
          </div>
        )}

        {/* ── Connect bar ── */}
        <div className="chat-connect-bar">

          {/* Row 1: ticket + role + employee */}
          <div className="connect-row-top">
            <input
              className="connect-input"
              placeholder="Ticket ID (from Dashboard)"
              value={ticketId}
              onChange={e => setTicketId(e.target.value)}
              disabled={connected}
            />

            <select className="connect-select" value={role}
              onChange={e => { setRole(e.target.value as 'employee'|'admin'); setUserId('') }}
              disabled={connected}>
              <option value="employee">Employee</option>
              <option value="admin">Help Desk Admin</option>
            </select>

            {role === 'employee' ? (
              <div className="emp-picker">
                <div className="emp-selected" onClick={() => !connected && setShowEmpList(v => !v)}>
                  {userId
                    ? <><span className="emp-id-tag">{userId}</span><span className="emp-fullname">{selectedEmp?.employee_name}</span></>
                    : <span className="emp-placeholder">Select your name...</span>
                  }
                  {!connected && <span className="emp-caret">▾</span>}
                </div>
                {showEmpList && !connected && (
                  <div className="emp-dropdown">
                    <input className="emp-search" placeholder="Search name, ID or dept..."
                      value={empSearch} onChange={e => setEmpSearch(e.target.value)} autoFocus />
                    <div className="emp-list">
                      {filteredEmp.map(emp => (
                        <div key={emp.employee_id}
                          className={`emp-item ${userId === emp.employee_id ? 'selected' : ''}`}
                          onClick={() => { setUserId(emp.employee_id); setShowEmpList(false); setEmpSearch('') }}>
                          <span className="emp-id-tag">{emp.employee_id}</span>
                          <span className="emp-item-name">{emp.employee_name}</span>
                          <span className="emp-meta">{emp.department} · {emp.location}</span>
                        </div>
                      ))}
                      {filteredEmp.length === 0 && <div className="emp-loading">No results</div>}
                    </div>
                    <button className="emp-close" onClick={() => setShowEmpList(false)}>Close</button>
                  </div>
                )}
              </div>
            ) : (
              <input className="connect-input" placeholder="Agent ID e.g. HD-NET-001"
                value={userId} onChange={e => setUserId(e.target.value)}
                disabled={connected} style={{ flex: 2 }} />
            )}
          </div>

          {/* Row 2: password + connect button */}
          {!connected && (
            <div className="connect-row-bottom">
              <div className="pw-field-wrap">
                <span className="pw-label">🔑 Password</span>
                <input
                  className={`pw-input ${pwError ? 'pw-input-error' : ''}`}
                  type="password"
                  placeholder="Enter demo password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPwError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleConnect()}
                />
                {pwError && <span className="pw-error-msg">{pwError}</span>}
              </div>
              <button
                className="btn-connect"
                onClick={handleConnect}
                disabled={!ticketId.trim() || !userId.trim() || !password.trim()}
              >
                Connect
              </button>
            </div>
          )}

          {/* Connected state buttons */}
          {connected && (
            <div className="connect-row-bottom">
              <button className="btn-disconnect" onClick={disconnect}>Leave Chat</button>
              <button className={`btn-autosolve${solving ? ' solving' : ''}`} onClick={autoSolve} disabled={solving}>
                {solving ? 'Solving...' : '🤖 Auto-Solve'}
              </button>
              <button className="btn-close-ticket" onClick={() => setShowCloseModal(true)}>
                ✅ Close Ticket
              </button>
            </div>
          )}
        </div>

        {/* Searching spinner */}
        {searching && (
          <div className="searching-banner">
            <div className="searching-spinner" />
            <div><div className="searching-title">Finding the right specialist...</div><div className="searching-sub">Matching your ticket category to an available agent</div></div>
          </div>
        )}

        {/* Assigned agent card */}
        {connected && assignedAgent && !searching && (
          <div className="assigned-agent-card" style={{ borderLeft: `4px solid ${assignedAgent.color}` }}>
            <div className="assigned-avatar" style={{ background: assignedAgent.color + '18', color: assignedAgent.color }}>
              {assignedAgent.agent_name?.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="assigned-info">
              <div className="assigned-name" style={{ color: assignedAgent.color }}>{assignedAgent.icon} {assignedAgent.agent_name}</div>
              <div className="assigned-team">{assignedAgent.team_name}</div>
              <div className="assigned-specialty">Specialist: {assignedAgent.specialty}</div>
            </div>
            <div className="assigned-status"><span className="online-dot" /><span>Active</span></div>
          </div>
        )}

        {connected && (
          <div className="session-badge">
            Ticket {ticketId} · {userId}
            {assignedAgent && <span style={{ marginLeft: 8, color: assignedAgent.color }}>· {assignedAgent.icon} {assignedAgent.team_name}</span>}
          </div>
        )}

        {/* ── Ticket closed success screen ── */}
        {ticketClosed && (
          <div className="ticket-closed-screen">
            <div className="closed-icon">{role === 'admin' ? '✅' : '🎉'}</div>
            <h2>{role === 'admin' ? 'Ticket Closed' : 'Your issue has been resolved!'}</h2>
            <p>
              {role === 'admin'
                ? <>Ticket <strong>{ticketId}</strong> has been closed and removed from the dashboard.</>
                : <>The support agent has closed ticket <strong>{ticketId}</strong>. Your issue has been marked as resolved.</>
              }
            </p>
            <p className="closed-sub">
              {role === 'admin'
                ? 'You can now return to your portal to handle the next ticket.'
                : 'If your issue persists, you can submit a new ticket at any time.'
              }
            </p>
            {role === 'admin'
              ? <button className="btn-new-ticket" onClick={() => window.location.href = '/agent'}>← Back to Agent Portal</button>
              : <button className="btn-new-ticket" onClick={() => window.location.href = '/'}>Submit a New Ticket</button>
            }
          </div>
        )}

        {/* Messages */}
        {!ticketClosed && (
          <div className="chat-messages">
            {!connected && (
              <div className="chat-placeholder">
                <div className="ph-icon">💬</div>
                <p>{isAutoOpened ? 'Connecting to your assigned ticket...' : 'Fill in the form above and click Connect'}</p>
              </div>
            )}
            {connected && messages.length === 0 && <div className="chat-placeholder"><p>Connecting you to a specialist...</p></div>}
            {messages.map((msg, i) => renderMessage(msg, i))}
            <div ref={bottom} />
          </div>
        )}

        {/* Input */}
        {!ticketClosed && (
          <div className="chat-input-row">
            <textarea className="chat-textarea"
              placeholder={connected ? 'Describe your issue... (Enter to send)' : 'Connect first to chat'}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown} disabled={!connected} rows={1} />
            <button className="btn-send" onClick={sendMessage} disabled={!connected || !input.trim()}>Send</button>
          </div>
        )}

        {/* ── Close Ticket Confirmation Modal ── */}
        {showCloseModal && (
          <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-icon">🔒</div>
              <h3>Close this ticket?</h3>
              <p>This will permanently close ticket <strong>{ticketId}</strong> and remove it from the dashboard. This cannot be undone.</p>
              <div className="modal-actions">
                <button className="btn-modal-cancel" onClick={() => setShowCloseModal(false)}>
                  Cancel
                </button>
                <button className="btn-modal-confirm" onClick={closeTicket} disabled={closing}>
                  {closing ? 'Closing...' : 'Yes, Close Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

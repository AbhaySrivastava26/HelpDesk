import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './AgentDashboard.css'

interface TicketNotif {
  type: string
  ticket_id?: string
  employee_id?: string
  category?: string
  priority?: string
  team_name?: string
  icon?: string
  color?: string
  text: string
  timestamp: string
  seen?: boolean
}

interface Team {
  category: string
  team_name: string
  color: string
  icon: string
  agents: { agent_id: string; name: string; specialty: string; location: string; status: string }[]
}

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#16a34a'
}

const DEMO_PASSWORD = 'abcd'

function playNotificationSound(priority: string) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const isUrgent = priority === 'Critical' || priority === 'High'
    const beepTimes = isUrgent ? [0, 0.18, 0.36] : [0, 0.18]
    beepTimes.forEach(offset => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.value = isUrgent ? 960 : 720
      const t = ctx.currentTime + offset
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.9, t + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
      osc.start(t)
      osc.stop(t + 0.15)
    })
  } catch {}
}

export default function AgentDashboard({ onLogin }: { onLogin?: () => void }) {
  const navigate = useNavigate()

  // Login form state
  const [teamFilter, setTeamFilter] = useState('')
  const [agentId, setAgentId]       = useState('')
  const [password, setPassword]     = useState('')
  const [pwError, setPwError]       = useState('')
  const [pwShake, setPwShake]       = useState(false)
  const [teams, setTeams]           = useState<Team[]>([])

  // After successful login
  const [loggedIn, setLoggedIn]   = useState(false)
  const [agentInfo, setAgentInfo] = useState<any>(null)

  // Notifications
  const [notifications, setNotifications] = useState<TicketNotif[]>([])
  const [unread, setUnread]               = useState(0)
  const [wsStatus, setWsStatus] = useState<'offline'|'connecting'|'online'>('offline')
  const [toast, setToast]       = useState<TicketNotif | null>(null)
  const toastTimer              = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ws                      = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/teams/all')
      .then(r => r.json()).then(d => setTeams(d.teams || []))
      .catch(() => {})
  }, [])

  const showToast = useCallback((notif: TicketNotif) => {
    setToast(notif)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 6000)
  }, [])

  // WebSocket for notifications — starts after login
  useEffect(() => {
    if (!loggedIn || !agentId) return
    setWsStatus('connecting')
    const socket = new WebSocket(`ws://localhost:8000/api/notifications/ws/${agentId}`)
    ws.current = socket

    socket.onopen = () => {
      setWsStatus('online')
      console.log(`Agent ${agentId} notification WS connected`)
      // Send keepalive ping every 20s to prevent connection dropping
      const ping = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        } else {
          clearInterval(ping)
        }
      }, 20000)
    }
    socket.onmessage = (e) => {
      try {
        const msg: TicketNotif = JSON.parse(e.data)
        if (msg.type === 'ticket_assigned') {
          playNotificationSound(msg.priority || 'Medium')
          showToast(msg)
          if (typeof window.Notification !== 'undefined' && window.Notification.permission === 'granted') {
            new window.Notification('🎫 New Ticket Assigned!', {
              body: `${msg.ticket_id} · ${msg.category} · Priority: ${msg.priority}\nFrom: ${msg.employee_id}`,
              icon: '/favicon.ico', tag: msg.ticket_id
            })
          }
          setUnread(u => u + 1)
          setNotifications(prev => [{ ...msg, seen: false }, ...prev])
        } else if (msg.type !== 'connected') {
          setNotifications(prev => [{ ...msg, seen: false }, ...prev])
        }
      } catch {}
    }
    socket.onclose = () => setWsStatus('offline')
    socket.onerror = () => setWsStatus('offline')

    if (typeof window.Notification !== 'undefined' && window.Notification.permission === 'default') {
      window.Notification.requestPermission()
    }
    return () => { socket.close() }
  }, [loggedIn, agentId, showToast])

  const agentsInTeam = teams.find(t => t.category === teamFilter)?.agents || []

  const handleLogin = () => {
    if (!agentId)  return
    if (password !== DEMO_PASSWORD) {
      setPwError('Wrong password. Use: abcd')
      setPwShake(true)
      setPassword('')
      setTimeout(() => setPwShake(false), 500)
      return
    }

    let found: any = null, foundTeam: any = null
    for (const team of teams) {
      const a = team.agents.find(ag => ag.agent_id === agentId)
      if (a) { found = a; foundTeam = team; break }
    }
    if (!found) return

    setAgentInfo({ ...found, team_name: foundTeam.team_name, color: foundTeam.color, icon: foundTeam.icon, category: foundTeam.category })
    setLoggedIn(true)
    setPwError('')
    onLogin?.()   // tell App.tsx this is now an agent session
  }

  const handleLogout = () => {
    ws.current?.close()
    setLoggedIn(false); setAgentId(''); setAgentInfo(null)
    setPassword(''); setPwError('')
    setNotifications([]); setUnread(0); setWsStatus('offline')
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, seen: true })))
    setUnread(0)
  }

  const openChat = (ticketId: string) => {
    if (ws.current?.readyState === WebSocket.OPEN)
      ws.current.send(JSON.stringify({ type: 'ack', ticket_id: ticketId }))
    setNotifications(prev => prev.map(n => n.ticket_id === ticketId ? { ...n, seen: true } : n))
    setUnread(u => Math.max(0, u - 1))
    setToast(null)
    navigate(`/chat?ticket=${encodeURIComponent(ticketId)}&agent=${encodeURIComponent(agentId)}`)
  }

  // ── LOGIN SCREEN ──
  if (!loggedIn) {
    const selectedAgent = agentsInTeam.find(a => a.agent_id === agentId)
    const selectedTeam  = teams.find(t => t.category === teamFilter)

    return (
      <div className="agent-login-page">
        <div className="agent-login-card">
          <div className="login-header">
            <span style={{ fontSize: '2rem' }}>🛡️</span>
            <h1>Agent Portal</h1>
            <p>Select your team, pick your name, then enter the demo password</p>
          </div>

          <div className="login-form">

            {/* Step 1 — Team */}
            <div className="login-step">
              <div className="login-step-num">1</div>
              <div className="login-step-body">
                <label className="login-label">Select your team</label>
                <select className="login-select" value={teamFilter}
                  onChange={e => { setTeamFilter(e.target.value); setAgentId('') }}>
                  <option value="">-- Choose team --</option>
                  {teams.map(t => <option key={t.category} value={t.category}>{t.icon} {t.team_name}</option>)}
                </select>
              </div>
            </div>

            {/* Step 2 — Agent name (appears after team selected) */}
            {teamFilter && (
              <div className="login-step">
                <div className="login-step-num">2</div>
                <div className="login-step-body">
                  <label className="login-label">Select your name</label>
                  <div className="agent-pick-list">
                    {agentsInTeam.map(a => {
                      const team = selectedTeam!
                      const sc = a.status === 'online' ? '#22c55e' : a.status === 'busy' ? '#f59e0b' : '#9ca3af'
                      return (
                        <div key={a.agent_id}
                          className={`agent-pick-item ${agentId === a.agent_id ? 'selected' : ''} ${a.status === 'offline' ? 'disabled' : ''}`}
                          onClick={() => a.status !== 'offline' && setAgentId(a.agent_id)}
                          style={agentId === a.agent_id ? { borderColor: team.color, background: team.color + '08' } : {}}>
                          <div className="agent-pick-avatar" style={{ background: team.color + '18', color: team.color }}>
                            {a.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="agent-pick-info">
                            <div className="agent-pick-name">{a.name}</div>
                            <div className="agent-pick-meta">{a.specialty} · {a.location}</div>
                          </div>
                          <div className="agent-pick-status">
                            <span className="status-dot-sm" style={{ background: sc }} />
                            <span style={{ fontSize: '0.75rem', color: sc }}>{a.status}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Password (appears after agent selected) */}
            {agentId && (
              <div className="login-step">
                <div className="login-step-num">3</div>
                <div className="login-step-body">
                  <label className="login-label">Enter password to confirm</label>

                  {/* Selected agent summary */}
                  <div className="selected-agent-preview" style={{ borderLeft: `3px solid ${selectedTeam?.color}` }}>
                    <div className="agent-pick-avatar" style={{ width: 32, height: 32, fontSize: '0.72rem', background: (selectedTeam?.color || '#667eea') + '18', color: selectedTeam?.color }}>
                      {selectedAgent?.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{selectedAgent?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>{selectedTeam?.icon} {selectedTeam?.team_name} · {selectedAgent?.specialty}</div>
                    </div>
                  </div>

                  <input
                    className={`login-pw-input ${pwShake ? 'shake' : ''}`}
                    type="password"
                    placeholder="Enter password (abcd)"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPwError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    autoFocus
                  />
                  {pwError && <div className="login-error">{pwError}</div>}
                </div>
              </div>
            )}

            <button
              className="btn-agent-login"
              onClick={handleLogin}
              disabled={!agentId || !password}
              style={{ marginTop: '1.5rem' }}
            >
              Go Online →
            </button>

            <div className="pw-hint-line">Demo password for all agents: <code>abcd</code></div>
          </div>
        </div>
      </div>
    )
  }

  // ── DASHBOARD (logged in) ──
  const ticketNotifs = notifications.filter(n => n.type === 'ticket_assigned')
  const urgentNotifs = ticketNotifs.filter(n => n.priority === 'Critical' || n.priority === 'High')

  return (
    <div className="agent-dash-page">

      {/* Toast */}
      {toast && toast.type === 'ticket_assigned' && (
        <div className={`notif-toast ${toast.priority === 'Critical' || toast.priority === 'High' ? 'toast-urgent' : ''}`}
          style={{ borderLeft: `4px solid ${toast.color || '#667eea'}` }}>
          <div className="toast-icon">{toast.icon || '🎫'}</div>
          <div className="toast-body">
            <div className="toast-title">New ticket assigned!</div>
            <div className="toast-ticket">{toast.ticket_id}</div>
            <div className="toast-meta">
              <span style={{ color: PRIORITY_COLORS[toast.priority || 'Medium'], fontWeight: 600 }}>● {toast.priority}</span>
              <span>{toast.category}</span>
              <span>from {toast.employee_id}</span>
            </div>
          </div>
          <div className="toast-actions">
            <button className="toast-open" style={{ background: toast.color || '#667eea' }}
              onClick={() => toast.ticket_id && openChat(toast.ticket_id)}>
              Open Chat →
            </button>
            <button className="toast-dismiss" onClick={() => setToast(null)}>✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="agent-dash-header">
        <div className="agent-dash-identity">
          <div className="agent-dash-avatar" style={{ background: agentInfo.color + '20', color: agentInfo.color }}>
            {agentInfo.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <div className="agent-dash-name">{agentInfo.name}</div>
            <div className="agent-dash-team" style={{ color: agentInfo.color }}>
              {agentInfo.icon} {agentInfo.team_name} · {agentInfo.specialty}
            </div>
          </div>
        </div>
        <div className="agent-dash-status-row">
          <div className={`ws-status ws-${wsStatus}`}>
            <span className="ws-dot" />
            {wsStatus === 'online' ? 'Online — receiving assignments' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}
          </div>
          {unread > 0 && <button className="btn-mark-read" onClick={markAllRead}>Mark all read ({unread})</button>}
          <button className="btn-agent-logout" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {/* Stats */}
      <div className="agent-stats-row">
        <div className="agent-stat-card">
          <div className="stat-val">{ticketNotifs.length}</div>
          <div className="stat-lbl">Assigned today</div>
        </div>
        <div className="agent-stat-card urgent">
          <div className="stat-val" style={{ color: '#dc2626' }}>{urgentNotifs.length}</div>
          <div className="stat-lbl">Urgent / High</div>
        </div>
        <div className="agent-stat-card">
          <div className="stat-val" style={{ color: '#2563eb' }}>{unread}</div>
          <div className="stat-lbl">Unread</div>
        </div>
        <div className="agent-stat-card">
          <div className="stat-val" style={{ color: '#16a34a' }}>{ticketNotifs.filter(n => n.seen).length}</div>
          <div className="stat-lbl">Acknowledged</div>
        </div>
      </div>

      <div className="agent-content">
        {urgentNotifs.length > 0 && (
          <div className="notif-section">
            <div className="notif-section-title urgent-title">🚨 Urgent / High Priority — Needs immediate attention</div>
            {urgentNotifs.map((n, i) => <NotifCard key={i} n={n} onOpen={openChat} />)}
          </div>
        )}
        <div className="notif-section">
          <div className="notif-section-title">
            📋 All Assigned Tickets
            {ticketNotifs.length === 0 && <span className="notif-empty"> — Waiting for assignments...</span>}
          </div>
          {ticketNotifs.length === 0 ? (
            <div className="notif-waiting">
              <div className="waiting-pulse" />
              <div>
                <div className="waiting-title">You are online and ready</div>
                <div className="waiting-sub">When an employee raises a ticket matching your team, you'll hear a sound alert and see it here instantly</div>
              </div>
            </div>
          ) : (
            ticketNotifs.map((n, i) => <NotifCard key={i} n={n} onOpen={openChat} />)
          )}
        </div>
      </div>
    </div>
  )
}

function NotifCard({ n, onOpen }: { n: TicketNotif; onOpen: (id: string) => void }) {
  const priorityColor = PRIORITY_COLORS[n.priority || 'Medium'] || '#ca8a04'
  const isUrgent = n.priority === 'Critical' || n.priority === 'High'
  return (
    <div className={`notif-card ${!n.seen ? 'unread' : ''} ${isUrgent ? 'urgent-card' : ''}`}>
      <div className="notif-card-left">
        <div className="notif-icon">{n.icon || '🎫'}</div>
        <div className="notif-info">
          <div className="notif-ticket-id">{n.ticket_id}</div>
          <div className="notif-meta">
            <span className="priority-badge" style={{ background: priorityColor + '18', color: priorityColor }}>{n.priority}</span>
            <span className="category-badge">{n.category}</span>
            <span className="notif-emp">from {n.employee_id}</span>
          </div>
          <div className="notif-text">{n.text}</div>
          <div className="notif-time">{n.timestamp}</div>
        </div>
      </div>
      <div className="notif-card-actions">
        {!n.seen && <span className="unread-dot" />}
        <button className="btn-open-ticket" style={{ background: n.color || '#667eea' }}
          onClick={() => n.ticket_id && onOpen(n.ticket_id)}>
          Open Chat →
        </button>
      </div>
    </div>
  )
}
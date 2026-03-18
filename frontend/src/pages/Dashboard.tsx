import { useState, useEffect, useCallback } from 'react'
import './Dashboard.css'

interface Ticket {
  _id: string
  ticket_id: string
  employee_name: string
  employee_id: string
  department: string
  location: string
  issue_description: string
  category: string
  priority: string
  status: string
  assigned_team: string
  assigned_agent_name?: string
  suggested_solution?: string
  created_at: string
}

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#dc2626',
  High:     '#ea580c',
  Medium:   '#ca8a04',
  Low:      '#16a34a',
}

const CATEGORY_ICONS: Record<string, string> = {
  Network:  '🌐',
  Hardware: '🖥️',
  Software: '💻',
  Access:   '🔐',
  Security: '🛡️',
}

export default function Dashboard() {
  const [tickets, setTickets]           = useState<Ticket[]>([])
  const [loading, setLoading]           = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCat, setFilterCat]       = useState('all')
  const [filterPri, setFilterPri]       = useState('all')
  const [search, setSearch]             = useState('')
  const [expanded, setExpanded]         = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    try {
      const res  = await fetch('https://helpdesk-ou5u.onrender.com/api/tickets/all')
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (e) {
      console.error('Failed to fetch tickets', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
    // Auto-refresh every 5 seconds to pick up status changes
    const interval = setInterval(fetchTickets, 5000)
    return () => clearInterval(interval)
  }, [fetchTickets])

  const updateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await fetch(`https://helpdesk-ou5u.onrender.com/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      fetchTickets()
    } catch (e) {
      console.error('Status update failed', e)
    }
  }

  // ── Filtered list ──
  const filtered = tickets.filter(t => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    const matchCat    = filterCat    === 'all' || t.category === filterCat
    const matchPri    = filterPri    === 'all' || t.priority === filterPri
    const matchSearch = !search ||
      t.ticket_id.toLowerCase().includes(search.toLowerCase()) ||
      t.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      t.issue_description.toLowerCase().includes(search.toLowerCase()) ||
      t.department.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchCat && matchPri && matchSearch
  })

  // ── Stats (from full unfiltered list) ──
  const stats = {
    total:       tickets.length,
    open:        tickets.filter(t => t.status === 'Open').length,
    inProgress:  tickets.filter(t => t.status === 'In Progress').length,
    resolved:    tickets.filter(t => t.status === 'Resolved').length,
  }

  const categories  = [...new Set(tickets.map(t => t.category))].filter(Boolean)
  const priorities  = ['Critical', 'High', 'Medium', 'Low']

  if (loading) return (
    <div className="dash-page">
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Loading tickets...</p>
      </div>
    </div>
  )

  return (
    <div className="dash-page">
      <div className="dash-header">
        <h1>Ticket Dashboard</h1>
        <button className="btn-refresh" onClick={fetchTickets}>↻ Refresh</button>
      </div>

      {/* Stats row */}
      <div className="dash-stats">
        <div className="stat-card" onClick={() => setFilterStatus('all')}
          style={{ cursor: 'pointer', borderTop: '3px solid #667eea' }}>
          <div className="stat-num">{stats.total}</div>
          <div className="stat-lbl">Total</div>
        </div>
        <div className="stat-card" onClick={() => setFilterStatus('Open')}
          style={{ cursor: 'pointer', borderTop: '3px solid #ea580c' }}>
          <div className="stat-num" style={{ color: '#ea580c' }}>{stats.open}</div>
          <div className="stat-lbl">Open</div>
        </div>
        <div className="stat-card" onClick={() => setFilterStatus('In Progress')}
          style={{ cursor: 'pointer', borderTop: '3px solid #2563eb' }}>
          <div className="stat-num" style={{ color: '#2563eb' }}>{stats.inProgress}</div>
          <div className="stat-lbl">In Progress</div>
        </div>
        <div className="stat-card" onClick={() => setFilterStatus('Resolved')}
          style={{ cursor: 'pointer', borderTop: '3px solid #16a34a' }}>
          <div className="stat-num" style={{ color: '#16a34a' }}>{stats.resolved}</div>
          <div className="stat-lbl">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="dash-filters">
        <input
          className="dash-search"
          placeholder="🔍  Search by ID, name, issue or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="dash-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select className="dash-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c] || '🎫'} {c}</option>)}
        </select>
        <select className="dash-select" value={filterPri} onChange={e => setFilterPri(e.target.value)}>
          <option value="all">All Priorities</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filterStatus !== 'all' || filterCat !== 'all' || filterPri !== 'all' || search) && (
          <button className="btn-clear-filter" onClick={() => { setFilterStatus('all'); setFilterCat('all'); setFilterPri('all'); setSearch('') }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="dash-count">
        Showing <strong>{filtered.length}</strong> of {tickets.length} tickets
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="dash-empty">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
          <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>No tickets found</div>
          <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
            {tickets.length === 0 ? 'No tickets have been submitted yet.' : 'Try adjusting your filters.'}
          </div>
        </div>
      ) : (
        <div className="ticket-list">
          {filtered.map(ticket => {
            const isExpanded   = expanded === ticket.ticket_id
            const priorityColor = PRIORITY_COLORS[ticket.priority] || '#888'
            const catIcon       = CATEGORY_ICONS[ticket.category]  || '🎫'
            const isResolved    = ticket.status === 'Resolved'
            const isInProgress  = ticket.status === 'In Progress'

            return (
              <div
                key={ticket._id}
                className={`ticket-card ${isResolved ? 'resolved' : ''} ${isExpanded ? 'expanded' : ''}`}
              >
                {/* Card header — always visible */}
                <div className="ticket-card-header" onClick={() => setExpanded(isExpanded ? null : ticket.ticket_id)}>
                  <div className="ticket-left">
                    <span className="ticket-cat-icon">{catIcon}</span>
                    <div className="ticket-id-block">
                      <div className="ticket-id">{ticket.ticket_id}</div>
                      <div className="ticket-employee">{ticket.employee_name} · {ticket.department}</div>
                    </div>
                  </div>

                  <div className="ticket-badges">
                    <span className="priority-pill" style={{ background: priorityColor + '18', color: priorityColor }}>
                      {ticket.priority}
                    </span>
                    <span className={`status-pill status-${ticket.status.replace(' ', '-').toLowerCase()}`}>
                      {ticket.status}
                    </span>
                    <span className="category-pill">{ticket.category}</span>
                  </div>

                  <div className="ticket-right">
                    <span className="ticket-team">{ticket.assigned_team}</span>
                    {ticket.assigned_agent_name && (
                      <span className="ticket-agent">👤 {ticket.assigned_agent_name}</span>
                    )}
                    <span className="ticket-expand">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="ticket-card-body">
                    <div className="ticket-issue-box">
                      <div className="ticket-issue-label">Issue Description</div>
                      <div className="ticket-issue-text">{ticket.issue_description}</div>
                    </div>

                    {ticket.suggested_solution && (
                      <div className="ticket-solution-box">
                        <div className="ticket-issue-label">💡 Suggested Solution</div>
                        <div className="ticket-solution-text">{ticket.suggested_solution}</div>
                      </div>
                    )}

                    <div className="ticket-meta-row">
                      <span>📍 {ticket.location}</span>
                      <span>🕐 {new Date(ticket.created_at).toLocaleString()}</span>
                    </div>

                    <div className="ticket-actions">
                      <div className="ticket-status-update">
                        <label>Update status:</label>
                        <select
                          value={ticket.status}
                          onChange={e => updateStatus(ticket.ticket_id, e.target.value)}
                          className="status-select"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>

                      <a
                        className="btn-open-chat"
                        href={`/chat?ticket=${encodeURIComponent(ticket.ticket_id)}`}
                      >
                        💬 Open Chat
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

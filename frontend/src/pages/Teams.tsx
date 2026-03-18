import { useState, useEffect } from 'react'
import './Teams.css'

interface Agent {
  agent_id: string
  name: string
  location: string
  status: 'online' | 'busy' | 'offline'
  specialty: string
}

interface Team {
  category: string
  team_name: string
  color: string
  icon: string
  agents: Agent[]
  stats: { total: number; online: number; busy: number; offline: number }
}

export default function Teams() {
  const [teams, setTeams]           = useState<Team[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<string | null>(null)
  const [copiedId, setCopiedId]     = useState<string | null>(null)

  useEffect(() => {
    fetch('https://helpdesk-ou5u.onrender.com/api/teams/all')
      .then(r => r.json())
      .then(d => { setTeams(d.teams || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const statusDot = (status: string) => {
    const colors: Record<string, string> = { online: '#22c55e', busy: '#f59e0b', offline: '#9ca3af' }
    return <span className="status-dot" style={{ background: colors[status] || '#ccc' }} />
  }

  if (loading) return <div className="teams-loading">Loading teams...</div>

  return (
    <div className="teams-page">
      <div className="teams-header">
        <h1>Help Desk Teams</h1>
        <p className="teams-subtitle">
          Each ticket category is handled by a dedicated team.
          Click an agent ID to copy it — use it in the Chat page as your admin login.
        </p>
      </div>

      {/* Summary row */}
      <div className="teams-summary">
        {teams.map(t => (
          <div
            key={t.category}
            className={`summary-card ${selected === t.category ? 'active' : ''}`}
            style={{ borderTop: `3px solid ${t.color}` }}
            onClick={() => setSelected(selected === t.category ? null : t.category)}
          >
            <span className="summary-icon">{t.icon}</span>
            <div>
              <div className="summary-category">{t.category}</div>
              <div className="summary-stats">
                <span className="dot-online" /> {t.stats.online} online
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team cards */}
      <div className="teams-grid">
        {teams
          .filter(t => !selected || t.category === selected)
          .map(team => (
          <div key={team.category} className="team-card">
            <div className="team-card-header" style={{ borderLeft: `4px solid ${team.color}` }}>
              <div className="team-title">
                <span className="team-icon">{team.icon}</span>
                <div>
                  <h2>{team.team_name}</h2>
                  <span className="team-category-badge" style={{ background: team.color + '18', color: team.color }}>
                    Handles: {team.category} tickets
                  </span>
                </div>
              </div>
              <div className="team-stats-row">
                <div className="stat-pill online">{team.stats.online} online</div>
                <div className="stat-pill busy">{team.stats.busy} busy</div>
                <div className="stat-pill offline">{team.stats.offline} offline</div>
              </div>
            </div>

            <div className="agents-table">
              <div className="agents-table-head">
                <span>Agent</span>
                <span>Specialty</span>
                <span>Location</span>
                <span>Status</span>
                <span>Login ID</span>
              </div>
              {team.agents.map(agent => (
                <div key={agent.agent_id} className="agent-row">
                  <div className="agent-name">
                    <div className="agent-avatar" style={{ background: team.color + '20', color: team.color }}>
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{agent.name}</span>
                  </div>
                  <span className="agent-specialty">{agent.specialty}</span>
                  <span className="agent-location">📍 {agent.location}</span>
                  <span className="agent-status">
                    {statusDot(agent.status)}
                    <span className={`status-label ${agent.status}`}>{agent.status}</span>
                  </span>
                  <button
                    className="copy-id-btn"
                    onClick={() => copyId(agent.agent_id)}
                    title="Copy to use in Chat"
                  >
                    <code>{agent.agent_id}</code>
                    <span className="copy-icon">{copiedId === agent.agent_id ? '✓' : '⧉'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="teams-howto">
        <h3>How routing works</h3>
        <div className="howto-steps">
          <div className="howto-step">
            <div className="step-num">1</div>
            <div>Employee submits a ticket describing their issue</div>
          </div>
          <div className="howto-arrow">→</div>
          <div className="howto-step">
            <div className="step-num">2</div>
            <div>AI classifies it: Network / Hardware / Software / Access / Security</div>
          </div>
          <div className="howto-arrow">→</div>
          <div className="howto-step">
            <div className="step-num">3</div>
            <div>Ticket is assigned to the matching specialist team</div>
          </div>
          <div className="howto-arrow">→</div>
          <div className="howto-step">
            <div className="step-num">4</div>
            <div>Agent from that team logs into Chat with their ID — they only see their category's tickets</div>
          </div>
        </div>
      </div>
    </div>
  )
}
